const express = require("express");
const jwt = require("jsonwebtoken");
const { authRequired } = require("../middlewares/auth");
const { getCurrentUser: getCurrentFileUser } = require("../modules/auth/file-service");
const {
  HELPER_CAPABILITIES,
  getUserHelperCapabilities,
  hasAnyHelperCapability,
  hasHelperCapability,
} = require("../domain/helper-capabilities");
const { useFileStore } = require("../services/runtime");
const {
  validateHelperBindingInput,
  validateConsignmentCreateInput,
  validateHelperInventoryInput,
  validateHelperInventoryBatchInput,
  validateHelperSnapshotInput,
  validateHelperSnapshotUpdateInput,
  validateHelperActionLogInput,
} = require("../services/validate");
const {
  createHelperActionLog,
  createHelperSnapshot,
  getHelperRechargeConfig,
  getHelperSnapshotLimitForUser,
  listHelperActionLogs,
  listHelperBindings,
  listHelperInventories,
  listHelperInventoryItems,
  listHelperInventorySummary,
  listHelperSnapshots,
  listMergedHelperInventoryItems,
  listConsignmentListingsForUser,
  removeHelperBinding,
  removeHelperSnapshot,
  resolveHelperBinding,
  updateHelperSnapshot,
  upsertHelperBinding,
  upsertHelperInventory,
  upsertHelperInventoriesBatch,
  createConsignmentListing,
  withdrawConsignmentListing,
} = require("../modules/helper/file-service");

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
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (useFileStore()) {
      const currentUser = getCurrentFileUser(payload.id);
      return currentUser?.status === "active" ? currentUser : null;
    }
    return payload;
  } catch {
    return null;
  }
}

function isAdminUser(user) {
  return String(user?.role || "").trim() === "admin";
}

function getHelperLineupAccess(user, hasHelperAccess) {
  const allowedUserIds = new Set(parseCsvEnv("HELPER_ALLOWED_USER_IDS"));
  const allowedGameRoleIds = new Set(parseCsvEnv("HELPER_ALLOWED_GAME_ROLE_IDS"));
  const whitelistActive = allowedUserIds.size > 0 || allowedGameRoleIds.size > 0;
  if (!whitelistActive && hasHelperAccess) {
    return {
      whitelist_active: false,
      lineup_allowed: true,
      reason: "",
    };
  }
  if (!hasHelperAccess) {
    return {
      whitelist_active: whitelistActive,
      lineup_allowed: false,
      reason: user ? "当前账号暂未开放 helper 功能。" : "请先登录已开通 helper 功能的账号。",
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
  const gameFeaturesEnabled =
    bridgeEnabled && readBooleanEnv("HELPER_GAME_FEATURES_ENABLED", false);
  const user = getOptionalAuthUser(req);
  const helperCapabilities = getUserHelperCapabilities(user);
  const helperAccessEnabled = helperCapabilities.length > 0;
  const access = getHelperLineupAccess(user, helperAccessEnabled);
  const accessAllowed = access.lineup_allowed !== false;
  const rechargeConfig = useFileStore() ? getHelperRechargeConfig() : {};
  const lineupBaseSlots = Math.max(Number(rechargeConfig.lineup_base_slots || 3) || 3, 1);
  const snapshotLimit =
    useFileStore() && user?.id ? getHelperSnapshotLimitForUser(user.id) : lineupBaseSlots;

  return {
    enabled: bridgeEnabled,
    mode: String(process.env.HELPER_BRIDGE_MODE || "off").trim() || "off",
    public_base: String(process.env.HELPER_PUBLIC_BASE || "/xyzw-helper").trim() || "/xyzw-helper",
    api_base: String(process.env.HELPER_API_BASE || "/api").trim() || "/api",
    features: {
      scan_auth: scanBindEnabled,
      scan_bind: scanBindEnabled && accessAllowed && helperAccessEnabled,
      legacy_inventory:
        legacyInventoryEnabled &&
        accessAllowed &&
        (hasHelperCapability(user, HELPER_CAPABILITIES.INVENTORY_SYNC_CURRENT) ||
          hasHelperCapability(user, HELPER_CAPABILITIES.INVENTORY_SYNC_ALL)),
      team_snapshot:
        teamSnapshotEnabled && accessAllowed && hasHelperCapability(user, HELPER_CAPABILITIES.SNAPSHOT_CREATE),
      team_switch: teamSwitchEnabled && accessAllowed && isAdminUser(user),
      team_restore: teamRestoreEnabled && accessAllowed && isAdminUser(user),
      action_logs: accessAllowed && hasHelperCapability(user, HELPER_CAPABILITIES.LOGS_READ),
      game_features: gameFeaturesEnabled && accessAllowed && helperAccessEnabled,
    },
    capabilities: helperCapabilities,
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

function requireAnyHelperCapability(req, res) {
  if (hasAnyHelperCapability(req.user)) return true;
  res.status(403).json({ error: "helper_capability_required" });
  return false;
}

function requireHelperCapability(req, res, capability) {
  if (hasHelperCapability(req.user, capability)) return true;
  res.status(403).json({ error: "helper_capability_required", capability });
  return false;
}

function requireHelperInventoryCapability(req, res) {
  if (
    hasHelperCapability(req.user, HELPER_CAPABILITIES.INVENTORY_SYNC_CURRENT) ||
    hasHelperCapability(req.user, HELPER_CAPABILITIES.INVENTORY_SYNC_ALL)
  ) {
    return true;
  }
  res.status(403).json({ error: "helper_capability_required", capability: "inventory.sync" });
  return false;
}

helperRouter.get("/config", (req, res) => {
  res.json(getHelperConfig(req));
});

helperRouter.get("/bindings/current", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_bindings_not_supported_in_db_mode" });
    }
    return res.json(listHelperBindings(req.user.id));
  } catch (error) {
    return next(error);
  }
});

helperRouter.get("/bindings/current/resolve", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_bindings_not_supported_in_db_mode" });
    }
    if (!requireAnyHelperCapability(req, res)) return;
    const binding = resolveHelperBinding(req.user.id, {
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
    return res.json(upsertHelperBinding(req.user.id, body));
  } catch (error) {
    return next(error);
  }
});

helperRouter.delete("/bindings/current/:id", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_bindings_not_supported_in_db_mode" });
    }
    const removed = removeHelperBinding(req.user.id, req.params.id);
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
    if (!requireHelperCapability(req, res, HELPER_CAPABILITIES.SNAPSHOT_CREATE)) return;
    return res.json(listHelperSnapshots(req.user.id));
  } catch (error) {
    return next(error);
  }
});

helperRouter.get("/inventories", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_inventories_not_supported_in_db_mode" });
    }
    if (!requireHelperInventoryCapability(req, res)) return;
    return res.json({
      inventories: listHelperInventories(req.user.id),
      merged_items: listMergedHelperInventoryItems(req.user.id),
    });
  } catch (error) {
    return next(error);
  }
});

helperRouter.get("/inventories/summary", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_inventories_not_supported_in_db_mode" });
    }
    if (!requireHelperInventoryCapability(req, res)) return;
    return res.json(listHelperInventorySummary(req.user.id));
  } catch (error) {
    return next(error);
  }
});

helperRouter.get("/inventories/items", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_inventories_not_supported_in_db_mode" });
    }
    if (!requireHelperInventoryCapability(req, res)) return;
    return res.json(listHelperInventoryItems(req.user.id, req.query || {}));
  } catch (error) {
    return next(error);
  }
});

helperRouter.post("/inventories", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_inventories_not_supported_in_db_mode" });
    }
    if (!requireHelperInventoryCapability(req, res)) return;
    const body = req.body || {};
    const errors = validateHelperInventoryInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(upsertHelperInventory(req.user.id, body));
  } catch (error) {
    return next(error);
  }
});

helperRouter.post("/inventories/batch", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_inventories_not_supported_in_db_mode" });
    }
    if (!requireHelperInventoryCapability(req, res)) return;
    const body = req.body || {};
    const errors = validateHelperInventoryBatchInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(upsertHelperInventoriesBatch(req.user.id, body.inventories));
  } catch (error) {
    return next(error);
  }
});

helperRouter.get("/consignments", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "consignments_not_supported_in_db_mode" });
    }
    if (!requireHelperInventoryCapability(req, res)) return;
    return res.json(listConsignmentListingsForUser(req.user.id));
  } catch (error) {
    return next(error);
  }
});

helperRouter.post("/consignments", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "consignments_not_supported_in_db_mode" });
    }
    if (!requireHelperInventoryCapability(req, res)) return;
    const body = req.body || {};
    const errors = validateConsignmentCreateInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(createConsignmentListing(req.user.id, body));
  } catch (error) {
    return next(error);
  }
});

helperRouter.patch("/consignments/:id/withdraw", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "consignments_not_supported_in_db_mode" });
    }
    if (!requireHelperInventoryCapability(req, res)) return;
    const updated = withdrawConsignmentListing(req.user.id, req.params.id);
    if (!updated) {
      return res.status(404).json({ error: "consignment_not_found" });
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

helperRouter.post("/snapshots", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_snapshots_not_supported_in_db_mode" });
    }
    if (!requireHelperCapability(req, res, HELPER_CAPABILITIES.SNAPSHOT_CREATE)) return;
    const body = req.body || {};
    const errors = validateHelperSnapshotInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(createHelperSnapshot(req.user.id, body));
  } catch (error) {
    return next(error);
  }
});

helperRouter.patch("/snapshots/:id", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_snapshots_not_supported_in_db_mode" });
    }
    if (!requireHelperCapability(req, res, HELPER_CAPABILITIES.SNAPSHOT_CREATE)) return;
    const body = req.body || {};
    const errors = validateHelperSnapshotUpdateInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    const updated = updateHelperSnapshot(req.user.id, req.params.id, body);
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
    if (!requireHelperCapability(req, res, HELPER_CAPABILITIES.SNAPSHOT_CREATE)) return;
    const removed = removeHelperSnapshot(req.user.id, req.params.id);
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
    if (!requireHelperCapability(req, res, HELPER_CAPABILITIES.LOGS_READ)) return;
    const limit = req.query?.limit;
    return res.json(listHelperActionLogs(req.user.id, { limit }));
  } catch (error) {
    return next(error);
  }
});

helperRouter.post("/action-logs", authRequired, async (req, res, next) => {
  try {
    if (!useFileStore()) {
      return res.status(501).json({ error: "helper_action_logs_not_supported_in_db_mode" });
    }
    if (!requireAnyHelperCapability(req, res)) return;
    const body = req.body || {};
    const errors = validateHelperActionLogInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(createHelperActionLog(req.user.id, body));
  } catch (error) {
    return next(error);
  }
});

module.exports = {
  helperRouter,
  getHelperConfig,
};
