const express = require("express");
const jwt = require("jsonwebtoken");
const { authRequired } = require("../middlewares/auth");
const { useFileStore } = require("../services/runtime");
const devStore = require("../services/dev-store");
const {
  validateHelperBindingInput,
  validateHelperInventoryInput,
  validateHelperSnapshotInput,
  validateHelperSnapshotUpdateInput,
  validateHelperActionLogInput,
} = require("../services/validate");

function readBooleanEnv(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === "") {
    return defaultValue;
  }
  const normalized = String(raw).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function parseCsvEnv(name) {
  return String(process.env[name] || "")
    .split(",")
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function getOptionalAuthUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function getHelperLineupAccess(user) {
  const allowedUserIds = new Set(parseCsvEnv("HELPER_ALLOWED_USER_IDS"));
  const allowedGameRoleIds = new Set(parseCsvEnv("HELPER_ALLOWED_GAME_ROLE_IDS"));
  const whitelistActive = allowedUserIds.size > 0 || allowedGameRoleIds.size > 0;
  if (!whitelistActive) {
    return {
      whitelist_active: false,
      lineup_allowed: true,
      reason: "",
    };
  }

  if (!user) {
    return {
      whitelist_active: true,
      lineup_allowed: false,
      reason: "请先登录已开通阵容中心的账号。",
    };
  }

  const userId = String(user.id || "").trim();
  const gameRoleId = String(user.game_role_id || "").trim();
  const allowed =
    (userId && allowedUserIds.has(userId)) || (gameRoleId && allowedGameRoleIds.has(gameRoleId));

  return {
    whitelist_active: true,
    lineup_allowed: allowed,
    reason: allowed ? "" : "当前账号暂未开放阵容中心。",
  };
}

function getHelperConfig(req) {
  const bridgeEnabled = readBooleanEnv("HELPER_BRIDGE_ENABLED", false);
  const scanBindEnabled = bridgeEnabled && readBooleanEnv("HELPER_SCAN_BIND_ENABLED", false);
  const teamSnapshotEnabled =
    bridgeEnabled && readBooleanEnv("HELPER_TEAM_SNAPSHOT_ENABLED", false);
  const legacyInventoryEnabled =
    bridgeEnabled && readBooleanEnv("HELPER_LEGACY_INVENTORY_ENABLED", true);
  const teamSwitchEnabled =
    bridgeEnabled && readBooleanEnv("HELPER_TEAM_SWITCH_ENABLED", false);
  const teamRestoreEnabled =
    bridgeEnabled && readBooleanEnv("HELPER_TEAM_RESTORE_ENABLED", false);
  const user = getOptionalAuthUser(req);
  const access = getHelperLineupAccess(user);
  const rechargeConfig = useFileStore() ? devStore.getRechargeConfig() : {};
  const lineupBaseSlots = Math.max(Number(rechargeConfig.lineup_base_slots || 3) || 3, 1);
  const snapshotLimit =
    useFileStore() && user?.id ? devStore.getHelperSnapshotLimitForUser(user.id) : lineupBaseSlots;

  return {
    enabled: bridgeEnabled,
    mode: String(process.env.HELPER_BRIDGE_MODE || "off").trim() || "off",
    public_base: String(process.env.HELPER_PUBLIC_BASE || "/xyzw-helper").trim() || "/xyzw-helper",
    api_base: String(process.env.HELPER_API_BASE || "/api").trim() || "/api",
    features: {
      scan_bind: scanBindEnabled,
      legacy_inventory: legacyInventoryEnabled,
      team_snapshot: teamSnapshotEnabled,
      team_switch: teamSwitchEnabled,
      team_restore: teamRestoreEnabled,
    },
    limits: {
      snapshots_per_user: Number(snapshotLimit || lineupBaseSlots),
    },
    plans: {
      base_slots: lineupBaseSlots,
      permanent_slot_quota: Math.max(Number(rechargeConfig.lineup_permanent_slot_quota || 5000) || 5000, 1),
      permanent_slot_max: Math.max(Number(rechargeConfig.lineup_permanent_slot_max || 7) || 7, 0),
      seasonal_slot_quota: Math.max(Number(rechargeConfig.lineup_seasonal_slot_quota || 1000) || 1000, 1),
      member_bonus_slots: Math.max(Number(rechargeConfig.lineup_member_bonus_slots || 3) || 3, 0),
      season_label: String(rechargeConfig.season_member_season_label || "").trim() || "当前赛季",
      season_expires_at: String(rechargeConfig.season_member_expires_at || "").trim() || null,
    },
    access,
  };
}

const helperRouter = express.Router();

helperRouter.get("/config", (req, res) => {
  res.json(getHelperConfig(req));
});

helperRouter.get("/bindings/current", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_bindings_not_supported_in_db_mode" });
    }
    return res.json(devStore.listHelperBindings(req.user.id));
  } catch (error) {
    return next(error);
  }
});

helperRouter.get("/bindings/current/resolve", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_bindings_not_supported_in_db_mode" });
    }
    const binding = devStore.resolveHelperBinding(req.user.id, {
      bind_token_id: req.query?.bind_token_id,
      game_role_id: req.query?.game_role_id,
      game_server: req.query?.game_server,
    });
    if (!binding) {
      return res.status(404).json({ error: "helper_binding_not_found" });
    }
    if (!binding.helper_token) {
      return res.status(409).json({ error: "helper_binding_token_missing" });
    }
    return res.json(binding);
  } catch (error) {
    return next(error);
  }
});

helperRouter.post("/bindings/current", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_bindings_not_supported_in_db_mode" });
    }
    const body = req.body || {};
    const errors = validateHelperBindingInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(devStore.upsertHelperBinding(req.user.id, body));
  } catch (error) {
    return next(error);
  }
});

helperRouter.delete("/bindings/current/:id", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_bindings_not_supported_in_db_mode" });
    }
    const removed = devStore.removeHelperBinding(req.user.id, req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "helper_binding_not_found" });
    }
    return res.json({ ok: true, removed });
  } catch (error) {
    return next(error);
  }
});

helperRouter.get("/snapshots", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_snapshots_not_supported_in_db_mode" });
    }
    return res.json(devStore.listHelperSnapshots(req.user.id));
  } catch (error) {
    return next(error);
  }
});

helperRouter.get("/inventories", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_inventories_not_supported_in_db_mode" });
    }
    return res.json({
      inventories: devStore.listHelperInventories(req.user.id),
      merged_items: devStore.listMergedHelperInventoryItems(req.user.id),
    });
  } catch (error) {
    return next(error);
  }
});

helperRouter.post("/inventories", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_inventories_not_supported_in_db_mode" });
    }
    const body = req.body || {};
    const errors = validateHelperInventoryInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(devStore.upsertHelperInventory(req.user.id, body));
  } catch (error) {
    return next(error);
  }
});

helperRouter.post("/snapshots", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_snapshots_not_supported_in_db_mode" });
    }
    const body = req.body || {};
    const errors = validateHelperSnapshotInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(devStore.createHelperSnapshot(req.user.id, body));
  } catch (error) {
    return next(error);
  }
});

helperRouter.patch("/snapshots/:id", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_snapshots_not_supported_in_db_mode" });
    }
    const body = req.body || {};
    const errors = validateHelperSnapshotUpdateInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    const updated = devStore.updateHelperSnapshot(req.user.id, req.params.id, body);
    if (!updated) {
      return res.status(404).json({ error: "helper_snapshot_not_found" });
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

helperRouter.delete("/snapshots/:id", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_snapshots_not_supported_in_db_mode" });
    }
    const removed = devStore.removeHelperSnapshot(req.user.id, req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "helper_snapshot_not_found" });
    }
    return res.json({ ok: true, removed });
  } catch (error) {
    return next(error);
  }
});

helperRouter.get("/action-logs", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_action_logs_not_supported_in_db_mode" });
    }
    const limit = req.query?.limit;
    return res.json(devStore.listHelperActionLogs(req.user.id, { limit }));
  } catch (error) {
    return next(error);
  }
});

helperRouter.post("/action-logs", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_action_logs_not_supported_in_db_mode" });
    }
    const body = req.body || {};
    const errors = validateHelperActionLogInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(devStore.createHelperActionLog(req.user.id, body));
  } catch (error) {
    return next(error);
  }
});

module.exports = {
  helperRouter,
  getHelperConfig,
};
