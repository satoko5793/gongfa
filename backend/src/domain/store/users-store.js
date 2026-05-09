const { ADMIN_ROLES } = require("../admin-roles");
const { AUDIT_ACTIONS } = require("../audit-actions");
const { normalizeHelperCapabilities } = require("../helper-capabilities");
const { QUOTA_LOG_TYPES } = require("../quota-log-types");
const { getStoreRuntime } = require("./core/runtime-context");

function getDep(name) {
  const runtime = getStoreRuntime();
  if (typeof runtime[name] !== "function" && runtime[name] === undefined) {
    throw new Error(`store_runtime_dependency_missing:${name}`);
  }
  return runtime[name];
}

function bindUser(payload) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const nextId = getDep("nextId");
  const ensureQuotaAccount = getDep("ensureQuotaAccount");
  const withQuota = getDep("withQuota");

  const data = readData();
  const timestamp = now();
  let user =
    data.users
      .filter(
        (item) =>
          item.auth_provider === "password" &&
          String(item.game_role_id || "") === String(payload.game_role_id || "")
      )
      .sort((left, right) => {
        const leftAdmin = String(left.role || "") === "admin" ? 1 : 0;
        const rightAdmin = String(right.role || "") === "admin" ? 1 : 0;
        if (leftAdmin !== rightAdmin) return rightAdmin - leftAdmin;
        return Number(right.id || 0) - Number(left.id || 0);
      })[0] || null;

  if (!user) {
    user = data.users.find(
      (item) =>
        item.game_role_id === payload.game_role_id && item.game_server === payload.game_server
    );
  }

  if (!user) {
    user = {
      id: nextId(data.users),
      role: "user",
      status: "active",
      auth_provider: "bind",
      game_role_id: payload.game_role_id,
      game_server: payload.game_server,
      game_role_name: payload.game_role_name,
      bind_token_id: payload.bind_token_id || null,
      nickname: payload.nickname || null,
      password_hash: null,
      helper_capabilities: [],
      created_at: timestamp,
      updated_at: timestamp,
    };
    data.users.push(user);
  } else {
    user.game_role_name = payload.game_role_name;
    user.bind_token_id = payload.bind_token_id || null;
    user.nickname = payload.nickname || user.nickname || null;
    user.auth_provider = user.auth_provider || "bind";
    user.updated_at = timestamp;
  }

  ensureQuotaAccount(data, user.id);
  writeData(data);
  return withQuota(user, data);
}

async function registerPasswordUser(payload) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const nextId = getDep("nextId");
  const ensureQuotaAccount = getDep("ensureQuotaAccount");
  const withQuota = getDep("withQuota");
  const hashPassword = getDep("hashPassword");
  const getSignupSeedQuota = getDep("getSignupSeedQuota");
  const applyQuotaChange = getDep("applyQuotaChange");

  const data = readData();
  const timestamp = now();
  const gameRoleId = String(payload.game_role_id || "").trim();
  const gameRoleName = String(payload.game_role_name || "").trim();

  const existing = data.users.find((item) => String(item.game_role_id || "") === gameRoleId);
  if (existing) {
    const err = new Error("game_role_id_taken");
    err.statusCode = 409;
    throw err;
  }

  const user = {
    id: nextId(data.users),
    role: "user",
    status: "active",
    auth_provider: "password",
    game_role_id: gameRoleId,
    game_server: "direct",
    game_role_name: gameRoleName,
    bind_token_id: null,
    nickname: null,
    password_hash: await hashPassword(payload.password),
    helper_capabilities: [],
    created_at: timestamp,
    updated_at: timestamp,
  };

  data.users.push(user);
  ensureQuotaAccount(data, user.id);
  const signupSeedQuota = getSignupSeedQuota(gameRoleId);
  if (signupSeedQuota > 0) {
    applyQuotaChange(data, {
      userId: user.id,
      changeAmount: signupSeedQuota,
      type: QUOTA_LOG_TYPES.SIGNUP_SEED_CREDIT,
      remark: "fourth_season_signup_seed",
      bonusAmount: 0,
    });
  }
  writeData(data);
  return withQuota(user, data);
}

async function loginPasswordUser(gameRoleId, password) {
  const readData = getDep("readData");
  const verifyPassword = getDep("verifyPassword");
  const withQuota = getDep("withQuota");
  const fixedAdminAccount = getDep("fixedAdminAccount");

  const data = readData();
  const normalizedGameRoleId = String(gameRoleId || "").trim();
  const candidates = (data.users || [])
    .filter(
      (item) =>
        item.auth_provider === "password" && String(item.game_role_id || "") === normalizedGameRoleId
    )
    .sort((left, right) => {
      const leftPriority =
        String(left.game_role_id || "") === fixedAdminAccount.game_role_id &&
        left.role === ADMIN_ROLES.ADMIN
          ? 1
          : 0;
      const rightPriority =
        String(right.game_role_id || "") === fixedAdminAccount.game_role_id &&
        right.role === ADMIN_ROLES.ADMIN
          ? 1
          : 0;
      if (leftPriority !== rightPriority) {
        return rightPriority - leftPriority;
      }
      return Number(right.id || 0) - Number(left.id || 0);
    });

  if (!candidates.length) {
    const err = new Error("invalid_credentials");
    err.statusCode = 401;
    throw err;
  }

  let user = null;
  for (const candidate of candidates) {
    const matched = await verifyPassword(password, candidate.password_hash);
    if (matched) {
      user = candidate;
      break;
    }
  }

  if (!user) {
    const fixedAdminMatched =
      normalizedGameRoleId === fixedAdminAccount.game_role_id &&
      (await verifyPassword(password, fixedAdminAccount.password_hash));
    if (fixedAdminMatched) {
      const fixedAdminUser =
        (data.users || []).find(
          (item) =>
            item.auth_provider === fixedAdminAccount.auth_provider &&
            String(item.game_role_id || "") === fixedAdminAccount.game_role_id &&
            item.role === ADMIN_ROLES.ADMIN
        ) || null;
      if (fixedAdminUser) {
        user = fixedAdminUser;
      }
    }
  }

  if (!user) {
    const err = new Error("invalid_credentials");
    err.statusCode = 401;
    throw err;
  }
  if (user.status !== "active") {
    const err = new Error("user_disabled");
    err.statusCode = 403;
    throw err;
  }
  return withQuota(user, data);
}

function getUserById(userId) {
  const readData = getDep("readData");
  const withQuota = getDep("withQuota");
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  return user ? withQuota(user, data) : null;
}

function getQuota(userId) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const clone = getDep("clone");
  const ensureQuotaAccount = getDep("ensureQuotaAccount");

  const data = readData();
  const account = ensureQuotaAccount(data, Number(userId));
  writeData(data);
  return clone(account);
}

function getRechargeConfig() {
  const readData = getDep("readData");
  const clone = getDep("clone");
  const normalizeRechargeConfig = getDep("normalizeRechargeConfig");
  const data = readData({ mutable: false });
  return clone(normalizeRechargeConfig(data.rechargeConfig || {}));
}

function buildUserAdminView(user, data) {
  const sanitizeUser = getDep("sanitizeUser");
  const getSeasonMemberState = getDep("getSeasonMemberState");
  const getLineupSlotState = getDep("getLineupSlotState");
  const beginnerGuideRewardQuota = getDep("beginnerGuideRewardQuota");

  const account = (data.quotaAccounts || []).find((item) => Number(item.user_id) === Number(user.id));
  const memberState = getSeasonMemberState(user, data.rechargeConfig || {});
  const lineupState = getLineupSlotState(user, data.rechargeConfig || {}, data);
  const guideReward = user?.beginner_guide_reward || null;
  return {
    ...sanitizeUser(user),
    quota_balance: Number(account?.balance || 0),
    season_member_active: memberState.active,
    season_member_season_label: memberState.season_label,
    season_member_expires_at: memberState.expires_at,
    season_member_bonus_rate: memberState.bonus_rate,
    season_member_bonus_percent: memberState.bonus_percent,
    season_member_activated_at: memberState.activated_at,
    lineup_slot_base: lineupState.base_slots,
    lineup_slot_permanent: lineupState.permanent_slots,
    lineup_slot_permanent_purchases: lineupState.permanent_purchases,
    lineup_slot_permanent_max: lineupState.permanent_slot_max,
    lineup_slot_seasonal: lineupState.seasonal_slots,
    lineup_slot_member_bonus: lineupState.member_bonus_slots,
    lineup_slot_member_bonus_active: lineupState.member_bonus_active,
    lineup_slot_limit: lineupState.total_slots,
    lineup_slot_saved: lineupState.snapshot_count,
    lineup_slot_available: lineupState.available_slots,
    lineup_slot_season_label: lineupState.seasonal_season_label,
    lineup_slot_season_expires_at: lineupState.season_expires_at,
    lineup_slot_permanent_quota: lineupState.permanent_slot_quota,
    lineup_slot_seasonal_quota: lineupState.seasonal_slot_quota,
    beginner_guide_reward_quota: beginnerGuideRewardQuota,
    beginner_guide_reward_earned: Boolean(guideReward?.granted_at),
    beginner_guide_reward_granted_at: guideReward?.granted_at || null,
    beginner_guide_reward_source_order_id: guideReward?.source_order_id || null,
  };
}

function updateRechargeConfig(patch, actorUserId = null, requestId = null) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const clone = getDep("clone");
  const normalizeRechargeConfig = getDep("normalizeRechargeConfig");
  const repriceDataProducts = getDep("repriceDataProducts");
  const buildRepriceSummary = getDep("buildRepriceSummary");
  const buildRepriceFailureSummary = getDep("buildRepriceFailureSummary");
  const attachRepriceStatus = getDep("attachRepriceStatus");
  const addAuditLog = getDep("addAuditLog");

  const data = readData();
  const currentConfig = normalizeRechargeConfig(data.rechargeConfig || {});
  const nextConfig = normalizeRechargeConfig({
    ...currentConfig,
    ...patch,
  });
  data.rechargeConfig = nextConfig;
  let responseConfig = nextConfig;
  try {
    const pricedProducts = repriceDataProducts(data);
    responseConfig = attachRepriceStatus(nextConfig, buildRepriceSummary(pricedProducts));
    data.rechargeConfig = responseConfig;
  } catch (error) {
    responseConfig = attachRepriceStatus(nextConfig, buildRepriceFailureSummary(error));
    data.rechargeConfig = responseConfig;
    throw error;
  }

  if (actorUserId) {
    addAuditLog(data, {
      actorUserId,
      targetType: "recharge_config",
      targetId: 1,
      action: AUDIT_ACTIONS.RECHARGE_CONFIG_UPDATE,
      detail: {
        exchange_yuan: nextConfig.exchange_yuan,
        exchange_quota: nextConfig.exchange_quota,
        min_amount_yuan: nextConfig.min_amount_yuan,
        enabled: nextConfig.enabled,
        residual_transfer_enabled: nextConfig.residual_transfer_enabled,
        residual_admin_role_id: nextConfig.residual_admin_role_id,
        residual_admin_role_name: nextConfig.residual_admin_role_name,
        residual_admin_game_name: nextConfig.residual_admin_game_name,
        residual_unit_label: nextConfig.residual_unit_label,
        residual_quota_per_unit: nextConfig.residual_quota_per_unit,
        season_member_enabled: nextConfig.season_member_enabled,
        season_member_season_label: nextConfig.season_member_season_label,
        season_member_expires_at: nextConfig.season_member_expires_at,
        season_member_price_yuan: nextConfig.season_member_price_yuan,
        season_member_quota: nextConfig.season_member_quota,
        season_member_bonus_rate: nextConfig.season_member_bonus_rate,
        request_id: requestId,
        lineup_base_slots: nextConfig.lineup_base_slots,
        lineup_permanent_slot_quota: nextConfig.lineup_permanent_slot_quota,
        lineup_permanent_slot_max: nextConfig.lineup_permanent_slot_max,
        lineup_seasonal_slot_quota: nextConfig.lineup_seasonal_slot_quota,
        lineup_member_bonus_slots: nextConfig.lineup_member_bonus_slots,
        residual_instructions: nextConfig.residual_instructions,
        pricing_controls: responseConfig.pricing_controls,
        pricing_reprice_status: responseConfig.pricing_reprice_status,
      },
    });
  }

  writeData(data);
  return clone(responseConfig);
}

function updateSelfProfile(userId, payload) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const withQuota = getDep("withQuota");

  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) return null;

  if (payload.game_role_name !== undefined) {
    user.game_role_name = String(payload.game_role_name).trim();
  }
  if (payload.nickname !== undefined) {
    const nickname = String(payload.nickname || "").trim();
    user.nickname = nickname || null;
  }
  if (payload.game_server !== undefined) {
    user.game_server = String(payload.game_server).trim();
  }

  user.updated_at = now();
  writeData(data);
  return withQuota(user, data);
}

async function changeSelfPassword(userId, currentPassword, nextPassword) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const verifyPassword = getDep("verifyPassword");
  const hashPassword = getDep("hashPassword");
  const withQuota = getDep("withQuota");

  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) {
    const err = new Error("user_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (user.auth_provider !== "password") {
    const err = new Error("password_login_only");
    err.statusCode = 400;
    throw err;
  }

  const matched = await verifyPassword(currentPassword, user.password_hash);
  if (!matched) {
    const err = new Error("invalid_credentials");
    err.statusCode = 401;
    throw err;
  }

  user.password_hash = await hashPassword(nextPassword);
  user.updated_at = now();
  writeData(data);
  return withQuota(user, data);
}

function changeUserQuota(userId, changeAmount, remark, actorUserId) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const applyQuotaChange = getDep("applyQuotaChange");
  const addAuditLog = getDep("addAuditLog");

  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) return null;
  const balance = applyQuotaChange(data, {
    userId,
    changeAmount,
    type: changeAmount > 0 ? QUOTA_LOG_TYPES.ADMIN_ADD : QUOTA_LOG_TYPES.ADMIN_SUBTRACT,
    remark: remark || null,
  });
  addAuditLog(data, {
    actorUserId,
    targetType: "user",
    targetId: Number(userId),
    action: AUDIT_ACTIONS.USER_QUOTA_CHANGE,
    detail: { change_amount: Number(changeAmount), next_balance: balance },
  });
  writeData(data);
  return { user_id: Number(userId), balance };
}

function updateUserStatus(userId, status, actorUserId) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const addAuditLog = getDep("addAuditLog");
  const withQuota = getDep("withQuota");

  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) return null;
  user.status = status;
  user.updated_at = now();
  addAuditLog(data, {
    actorUserId,
    targetType: "user",
    targetId: user.id,
    action: AUDIT_ACTIONS.USER_STATUS_UPDATE,
    detail: { status },
  });
  writeData(data);
  return withQuota(user, data);
}

function updateUserHelperCapabilities(userId, capabilities, actorUserId) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const clone = getDep("clone");
  const now = getDep("now");
  const addAuditLog = getDep("addAuditLog");

  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) return null;

  const normalizedCapabilities = normalizeHelperCapabilities(capabilities);
  user.helper_capabilities = normalizedCapabilities;
  user.updated_at = now();
  addAuditLog(data, {
    actorUserId,
    targetType: "user",
    targetId: user.id,
    action: AUDIT_ACTIONS.USER_HELPER_CAPABILITIES_UPDATE,
    detail: { helper_capabilities: normalizedCapabilities },
  });
  writeData(data);
  return clone(user);
}

module.exports = {
  bindUser,
  registerPasswordUser,
  loginPasswordUser,
  getUserById,
  getQuota,
  getRechargeConfig,
  buildUserAdminView,
  updateRechargeConfig,
  updateSelfProfile,
  changeSelfPassword,
  changeUserQuota,
  updateUserStatus,
  updateUserHelperCapabilities,
};
