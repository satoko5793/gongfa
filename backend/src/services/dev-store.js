const fs = require("fs");
const path = require("path");
const { PRICE_CONFIG, buildOrderEvents, repriceProducts } = require("./pricing");
const { BUNDLE_SKU_SEEDS, RETIRED_BUNDLE_CODES } = require("../config/catalog-config");
const { hashPassword, verifyPassword } = require("./password-auth");
const { buildDefaultRechargeConfig, normalizeRechargeConfig } = require("../config/recharge-config");
const { getSignupSeedQuota } = require("../config/signup-seed-quota");

const dataPath = path.resolve(__dirname, "..", "..", "dev-data.json");
const FIXED_ADMIN_ACCOUNT = {
  game_role_id: "584967604",
  game_role_name: "繁星✨秋",
  game_server: "direct",
  nickname: "繁星✨秋",
  auth_provider: "password",
  password_hash:
    "scrypt$16384$8$1$15d0485f25b5ca60d4119ee868ae9987$c86dead7cef0087690fa74e4d30efc33849f54a50748e0b09dee89bc864a9c14edf7b8fad9b18beaa6ed6154b26181d56b4536aa7920ae36f96ae0f424f198f9",
};

function now() {
  return new Date().toISOString();
}

function defaultData() {
  return {
    users: [],
    productImports: [],
    products: [],
    bundleSkus: [],
    quotaAccounts: [],
    quotaLogs: [],
    orders: [],
    orderItems: [],
    rechargeOrders: [],
    rechargeConfig: buildDefaultRechargeConfig(),
    auditLogs: [],
  };
}

function seedBundleSkus(data) {
  const existingByCode = new Map((data.bundleSkus || []).map((item) => [item.code, item]));
  const referencedBundleIds = new Set(
    (data.orderItems || [])
      .map((item) => Number(item.bundle_sku_id))
      .filter(Boolean)
  );
  const seeded = [];
  let changed = false;

  for (const seed of BUNDLE_SKU_SEEDS) {
    const existing = existingByCode.get(seed.code);
    if (existing) {
      const normalizedPrice =
        seed.code === "atlas_high_attack_full_dex" && Number(existing.price_quota) === 80000
          ? seed.price_quota
          : existing.price_quota;
      if (Number(normalizedPrice) !== Number(existing.price_quota)) {
        changed = true;
      }
      seeded.push({
        ...existing,
        description: existing.description ?? seed.description,
        tags: Array.isArray(existing.tags) ? existing.tags : seed.tags,
        price_quota: normalizedPrice,
        display_rank:
          existing.display_rank === undefined ? seed.display_rank : existing.display_rank,
      });
      continue;
    }

    changed = true;
    seeded.push({
      id: nextId(seeded),
      code: seed.code,
      name: seed.name,
      description: seed.description,
      tags: seed.tags,
      image_url: seed.image_url || null,
      price_quota: seed.price_quota,
      stock: seed.stock,
      status: seed.status || "on_sale",
      display_rank: seed.display_rank || 999,
      created_at: now(),
      updated_at: now(),
    });
  }

  for (const existing of data.bundleSkus || []) {
    if (BUNDLE_SKU_SEEDS.some((seed) => seed.code === existing.code)) continue;
    if (!referencedBundleIds.has(Number(existing.id))) {
      changed = true;
      continue;
    }

    const nextStatus = RETIRED_BUNDLE_CODES.includes(existing.code) ? "off_sale" : existing.status;
    if (nextStatus !== existing.status) {
      changed = true;
    }

    seeded.push({
      ...existing,
      status: nextStatus,
    });
  }

  if ((data.bundleSkus || []).length !== seeded.length) {
    changed = true;
  }

  data.bundleSkus = seeded;
  return changed;
}

function removeLegacySeedJunk(data) {
  const importIdsToRemove = new Set(
    (data.productImports || [])
      .filter(
        (item) =>
          item?.source_file_name === "x.json" &&
          item?.raw_json &&
          typeof item.raw_json === "object" &&
          !Array.isArray(item.raw_json) &&
          Object.keys(item.raw_json).length === 0
      )
      .map((item) => Number(item.id))
      .filter(Boolean)
  );

  if (importIdsToRemove.size === 0) {
    return false;
  }

  const initialProductCount = (data.products || []).length;
  const initialImportCount = (data.productImports || []).length;

  data.products = (data.products || []).filter((item) => !importIdsToRemove.has(Number(item.import_id)));
  data.productImports = (data.productImports || []).filter(
    (item) => !importIdsToRemove.has(Number(item.id))
  );

  return (
    data.products.length !== initialProductCount || data.productImports.length !== initialImportCount
  );
}

function repriceDataProducts(data) {
  const pricedProducts = repriceProducts(
    data.products || [],
    buildOrderEvents(data.orders || [], data.orderItems || [])
  );

  const pricedById = new Map(pricedProducts.map((item) => [Number(item.id), item]));
  data.products = (data.products || []).map((product) => {
    const priced = pricedById.get(Number(product.id));
    if (!priced) return product;
    return {
      ...product,
      price_quota: priced.price_quota,
      pricing_meta: priced.pricing_meta,
    };
  });
}

function ensureFixedAdminUser(data) {
  let changed = false;
  let adminUser =
    (data.users || []).find(
      (item) =>
        String(item.game_role_id || "") === FIXED_ADMIN_ACCOUNT.game_role_id &&
        item.auth_provider === FIXED_ADMIN_ACCOUNT.auth_provider
    ) ||
    (data.users || []).find(
      (item) => String(item.game_role_id || "") === FIXED_ADMIN_ACCOUNT.game_role_id
    ) ||
    null;

  if (!adminUser) {
    adminUser = {
      id: nextId(data.users || []),
      role: "admin",
      status: "active",
      auth_provider: FIXED_ADMIN_ACCOUNT.auth_provider,
      game_role_id: FIXED_ADMIN_ACCOUNT.game_role_id,
      game_server: FIXED_ADMIN_ACCOUNT.game_server,
      game_role_name: FIXED_ADMIN_ACCOUNT.game_role_name,
      bind_token_id: null,
      nickname: FIXED_ADMIN_ACCOUNT.nickname,
      password_hash: FIXED_ADMIN_ACCOUNT.password_hash,
      created_at: now(),
      updated_at: now(),
    };
    data.users.push(adminUser);
    changed = true;
  }

  const duplicatePasswordUsers = (data.users || []).filter(
    (item) =>
      Number(item.id) !== Number(adminUser.id) &&
      item.auth_provider === FIXED_ADMIN_ACCOUNT.auth_provider &&
      String(item.game_role_id || "") === FIXED_ADMIN_ACCOUNT.game_role_id
  );
  if (duplicatePasswordUsers.length) {
    data.users = (data.users || []).filter(
      (item) => !duplicatePasswordUsers.some((duplicate) => Number(duplicate.id) === Number(item.id))
    );
    changed = true;
  }

  const fieldsToSync = {
    role: "admin",
    status: "active",
    auth_provider: FIXED_ADMIN_ACCOUNT.auth_provider,
    game_role_id: FIXED_ADMIN_ACCOUNT.game_role_id,
    game_server: FIXED_ADMIN_ACCOUNT.game_server,
    game_role_name: FIXED_ADMIN_ACCOUNT.game_role_name,
    nickname: FIXED_ADMIN_ACCOUNT.nickname,
    password_hash: FIXED_ADMIN_ACCOUNT.password_hash,
    bind_token_id: null,
  };

  for (const [key, value] of Object.entries(fieldsToSync)) {
    if (adminUser[key] !== value) {
      adminUser[key] = value;
      changed = true;
    }
  }

  for (const user of data.users || []) {
    if (Number(user.id) === Number(adminUser.id)) continue;
    if (user.role === "admin") {
      user.role = "user";
      changed = true;
    }
  }

  ensureQuotaAccount(data, adminUser.id);
  return changed;
}

function normalizeData(data) {
  const next = {
    ...defaultData(),
    ...data,
  };

  let changed = seedBundleSkus(next);
  if (ensureFixedAdminUser(next)) {
    changed = true;
  }
  if (removeLegacySeedJunk(next)) {
    changed = true;
  }
  next.products = (next.products || []).map((product) => {
    const normalized = {
      ...product,
      manual_price_quota:
        product?.manual_price_quota === undefined ? null : product.manual_price_quota,
      pricing_meta:
        product?.pricing_meta && typeof product.pricing_meta === "object"
          ? product.pricing_meta
          : {},
    };
    if (product && product.status === "draft") {
      changed = true;
      normalized.status = "on_sale";
    }
    if (product?.manual_price_quota === undefined || !product?.pricing_meta) {
      changed = true;
    }
    if (normalized.pricing_meta?.version !== PRICE_CONFIG.version) {
      changed = true;
    }
    return normalized;
  });
  next.orderItems = (next.orderItems || []).map((item) => {
    if (item?.item_kind === undefined || item?.bundle_sku_id === undefined) {
      changed = true;
    }
    return {
      ...item,
      item_kind: item?.item_kind || "card",
      product_id: item?.product_id === undefined ? null : item.product_id,
      bundle_sku_id: item?.bundle_sku_id === undefined ? null : item.bundle_sku_id,
    };
  });
  next.users = (next.users || []).map((user) => {
    const normalized = {
      ...user,
      auth_provider: user?.auth_provider || "bind",
      password_hash: user?.password_hash || null,
    };
    if (!user?.auth_provider || user?.password_hash === undefined) {
      changed = true;
    }
    return normalized;
  });
  next.rechargeConfig = normalizeRechargeConfig(next.rechargeConfig || {});

  if (changed) {
    repriceDataProducts(next);
    writeData(next);
  }

  return next;
}

function readData() {
  if (!fs.existsSync(dataPath)) {
    return defaultData();
  }
  try {
    return normalizeData(JSON.parse(fs.readFileSync(dataPath, "utf8")));
  } catch {
    return defaultData();
  }
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeUser(user) {
  if (!user) return null;
  const next = { ...clone(user) };
  delete next.password_hash;
  return next;
}

function getSeasonMemberState(user, config) {
  const normalizedConfig = normalizeRechargeConfig(config || {});
  const record = user?.season_member && typeof user.season_member === "object" ? user.season_member : null;
  const seasonLabel = String(normalizedConfig.season_member_season_label || "").trim();
  const expiresAt = String(normalizedConfig.season_member_expires_at || "").trim();
  const expiresAtMillis = Date.parse(expiresAt);
  const active =
    Boolean(record) &&
    Boolean(seasonLabel) &&
    String(record.season_label || "") === seasonLabel &&
    Number.isFinite(expiresAtMillis) &&
    Date.now() < expiresAtMillis;

  return {
    active,
    season_label: seasonLabel,
    expires_at: expiresAt || null,
    bonus_rate: Number(normalizedConfig.season_member_bonus_rate || 0),
    bonus_percent: Number(normalizedConfig.season_member_bonus_percent || 0),
    activated_at: record?.activated_at || null,
    source_recharge_order_id: record?.source_recharge_order_id || null,
  };
}

function ensureQuotaAccount(data, userId) {
  let account = data.quotaAccounts.find((item) => item.user_id === Number(userId));
  if (!account) {
    account = { user_id: Number(userId), balance: 0, updated_at: now() };
    data.quotaAccounts.push(account);
  }
  return account;
}

function withQuota(user, data) {
  const account = ensureQuotaAccount(data, user.id);
  const memberState = getSeasonMemberState(user, data.rechargeConfig || {});
  return {
    ...sanitizeUser(user),
    quota_balance: account.balance,
    season_member_active: memberState.active,
    season_member_season_label: memberState.season_label,
    season_member_expires_at: memberState.expires_at,
    season_member_bonus_rate: memberState.bonus_rate,
    season_member_bonus_percent: memberState.bonus_percent,
    season_member_activated_at: memberState.activated_at,
  };
}

function normalizeCardProduct(product) {
  return {
    ...clone(product),
    item_kind: "card",
    item_id: Number(product.id),
    schedule_id: product?.schedule_id === undefined ? null : Number(product.schedule_id),
    current_schedule_id:
      product?.current_schedule_id === undefined ? null : Number(product.current_schedule_id),
    is_current_season: Boolean(product?.is_current_season),
    season_tag: product?.season_tag || "legacy",
    season_label: product?.season_label || "-",
    season_display: product?.season_display || "老卡",
    stock_label: `库存 ${Number(product.stock || 0)}`,
  };
}

function normalizeBundleSku(bundle) {
  return {
    ...clone(bundle),
    item_kind: "bundle",
    item_id: Number(bundle.id),
    legacy_id: 0,
    uid: bundle.code,
    main_attrs: bundle.description || "",
    ext_attrs: Array.isArray(bundle.tags) ? bundle.tags.join(" | ") : "",
    attack_value: 0,
    hp_value: 0,
    pricing_meta: {
      source: "bundle",
      dominant_reason_label: "套餐固定价",
    },
    stock_label: bundle.stock === null || bundle.stock === undefined ? "不限量" : `库存 ${bundle.stock}`,
  };
}

function addAuditLog(data, { actorUserId, targetType, targetId, action, detail = null }) {
  data.auditLogs.unshift({
    id: nextId(data.auditLogs),
    actor_user_id: actorUserId || null,
    target_type: targetType,
    target_id: Number(targetId),
    action,
    detail,
    created_at: now(),
  });
}

function bindUser(payload) {
  const data = readData();
  const timestamp = now();
  let user = data.users.find(
    (item) =>
      item.game_role_id === payload.game_role_id && item.game_server === payload.game_server
  );

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
      type: "signup_seed_credit",
      remark: "third_season_signup_seed",
      bonusAmount: 0,
    });
  }
  writeData(data);
  return withQuota(user, data);
}

async function loginPasswordUser(gameRoleId, password) {
  const data = readData();
  const normalizedGameRoleId = String(gameRoleId || "").trim();
  const candidates = (data.users || [])
    .filter(
      (item) =>
        item.auth_provider === "password" && String(item.game_role_id || "") === normalizedGameRoleId
    )
    .sort((left, right) => {
      const leftPriority =
        String(left.game_role_id || "") === FIXED_ADMIN_ACCOUNT.game_role_id && left.role === "admin" ? 1 : 0;
      const rightPriority =
        String(right.game_role_id || "") === FIXED_ADMIN_ACCOUNT.game_role_id && right.role === "admin" ? 1 : 0;
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
      normalizedGameRoleId === FIXED_ADMIN_ACCOUNT.game_role_id &&
      (await verifyPassword(password, FIXED_ADMIN_ACCOUNT.password_hash));
    if (fixedAdminMatched) {
      const fixedAdminUser =
        (data.users || []).find(
          (item) =>
            item.auth_provider === FIXED_ADMIN_ACCOUNT.auth_provider &&
            String(item.game_role_id || "") === FIXED_ADMIN_ACCOUNT.game_role_id &&
            item.role === "admin"
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
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  return user ? withQuota(user, data) : null;
}

function getRechargeConfig() {
  const data = readData();
  return clone(normalizeRechargeConfig(data.rechargeConfig || {}));
}

function updateRechargeConfig(patch, actorUserId = null) {
  const data = readData();
  const currentConfig = normalizeRechargeConfig(data.rechargeConfig || {});
  const nextConfig = normalizeRechargeConfig({
    ...currentConfig,
    ...patch,
  });
  data.rechargeConfig = nextConfig;

  if (actorUserId) {
    addAuditLog(data, {
      actorUserId,
      targetType: "recharge_config",
      targetId: 1,
      action: "recharge_config_update",
      detail: {
        exchange_yuan: nextConfig.exchange_yuan,
        exchange_quota: nextConfig.exchange_quota,
        min_amount_yuan: nextConfig.min_amount_yuan,
        enabled: nextConfig.enabled,
        season_member_enabled: nextConfig.season_member_enabled,
        season_member_season_label: nextConfig.season_member_season_label,
        season_member_expires_at: nextConfig.season_member_expires_at,
        season_member_price_yuan: nextConfig.season_member_price_yuan,
        season_member_quota: nextConfig.season_member_quota,
        season_member_bonus_rate: nextConfig.season_member_bonus_rate,
      },
    });
  }

  writeData(data);
  return clone(nextConfig);
}

function updateSelfProfile(userId, payload) {
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

function listProducts({ keyword = "", sort = "created_desc", publicOnly = false } = {}) {
  const data = readData();
  const cards = data.products.filter((item) => (publicOnly ? item.status === "on_sale" : true));
  const bundles = (data.bundleSkus || []).filter((item) => (publicOnly ? item.status === "on_sale" : true));
  let products = [...cards.map(normalizeCardProduct), ...bundles.map(normalizeBundleSku)];

  const trimmed = String(keyword || "").trim().toLowerCase();
  if (trimmed) {
    products = products.filter((item) =>
      [item.name, item.uid, item.main_attrs, item.ext_attrs, item.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmed))
    );
  }

  const sorters = {
    created_desc: (a, b) => String(b.created_at).localeCompare(String(a.created_at)),
    price_asc: (a, b) => a.price_quota - b.price_quota || b.id - a.id,
    price_desc: (a, b) => b.price_quota - a.price_quota || b.id - a.id,
    attack_desc: (a, b) => b.attack_value - a.attack_value || b.id - a.id,
    hp_desc: (a, b) => b.hp_value - a.hp_value || b.id - a.id,
  };
  products.sort(sorters[sort] || sorters.created_desc);
  return clone(products);
}

function getProductById(productId, { publicOnly = false, itemKind = "card" } = {}) {
  const data = readData();
  if (itemKind === "bundle") {
    const bundle = (data.bundleSkus || []).find(
      (item) => item.id === Number(productId) && (!publicOnly || item.status === "on_sale")
    );
    return bundle ? normalizeBundleSku(bundle) : null;
  }
  const product = data.products.find(
    (item) => item.id === Number(productId) && (!publicOnly || item.status === "on_sale")
  );
  return product ? normalizeCardProduct(product) : null;
}

function getQuota(userId) {
  const data = readData();
  const account = ensureQuotaAccount(data, Number(userId));
  writeData(data);
  return clone(account);
}

function hydrateOrders(data, orders) {
  return orders.map((order) => {
    const user = data.users.find((item) => item.id === order.user_id);
    return {
      ...clone(order),
      game_role_id: user?.game_role_id || null,
      game_server: user?.game_server || null,
      game_role_name: user?.game_role_name || null,
      nickname: user?.nickname || null,
      items: clone(data.orderItems.filter((item) => item.order_id === order.id)),
    };
  });
}

function hydrateRechargeOrders(data, rechargeOrders) {
  return rechargeOrders.map((order) => {
    const user = data.users.find((item) => item.id === order.user_id);
    const reviewer = data.users.find((item) => item.id === order.reviewed_by);
    return {
      ...clone(order),
      order_title: order.order_type === "season_member" ? "????" : "????",
      game_role_id: user?.game_role_id || null,
      game_server: user?.game_server || null,
      game_role_name: user?.game_role_name || null,
      nickname: user?.nickname || null,
      reviewer_role_name: reviewer?.game_role_name || null,
    };
  });
}

function listBundleSkus({ publicOnly = false } = {}) {
  const data = readData();
  const bundles = (data.bundleSkus || [])
    .filter((item) => (!publicOnly || item.status === "on_sale"))
    .sort((a, b) => Number(a.display_rank || 999) - Number(b.display_rank || 999));
  return clone(bundles.map(normalizeBundleSku));
}

function listOrders({ userId = null, orderId = null, status = null, keyword = "", limit = 100 } = {}) {
  const data = readData();
  let orders = data.orders.slice();
  if (orderId !== null) {
    orders = orders.filter((item) => item.id === Number(orderId));
  }
  if (userId !== null) {
    orders = orders.filter((item) => item.user_id === Number(userId));
  }
  if (status !== null && status !== undefined && status !== "" && status !== "all") {
    orders = orders.filter((item) => item.status === status);
  }
  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  if (trimmedKeyword) {
    orders = orders.filter((order) => {
      const user = data.users.find((item) => item.id === order.user_id);
      const items = data.orderItems.filter((item) => item.order_id === order.id);
      return [
        String(order.id),
        user?.game_role_id,
        user?.game_server,
        user?.game_role_name,
        user?.nickname,
        ...items.map((item) => item.product_name),
        ...items.map((item) => String(item.product_id)),
        ...items.map((item) => String(item.bundle_sku_id)),
        ...items.map((item) => item.item_kind),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }
  orders.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return hydrateOrders(data, orders.slice(0, limit));
}

function listRechargeOrders({
  userId = null,
  rechargeOrderId = null,
  status = null,
  keyword = "",
  limit = 100,
} = {}) {
  const data = readData();
  let rechargeOrders = (data.rechargeOrders || []).slice();

  if (rechargeOrderId !== null) {
    rechargeOrders = rechargeOrders.filter((item) => item.id === Number(rechargeOrderId));
  }
  if (userId !== null) {
    rechargeOrders = rechargeOrders.filter((item) => item.user_id === Number(userId));
  }
  if (status !== null && status !== undefined && status !== "" && status !== "all") {
    rechargeOrders = rechargeOrders.filter((item) => item.status === status);
  }

  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  if (trimmedKeyword) {
    rechargeOrders = rechargeOrders.filter((order) => {
      const user = data.users.find((item) => item.id === order.user_id);
      return [
        String(order.id),
        user?.game_role_id,
        user?.game_server,
        user?.game_role_name,
        user?.nickname,
        order.payment_reference,
        order.payer_note,
        order.admin_remark,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }

  rechargeOrders.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return hydrateRechargeOrders(data, rechargeOrders.slice(0, limit));
}

function applyQuotaChange(
  data,
  { userId, changeAmount, type, orderId = null, remark = null, bonusAmount = null }
) {
  const account = ensureQuotaAccount(data, userId);
  const user = data.users.find((item) => item.id === Number(userId));
  let normalizedBonusAmount =
    bonusAmount === null || bonusAmount === undefined ? null : Number(bonusAmount);
  if (normalizedBonusAmount !== null && (!Number.isFinite(normalizedBonusAmount) || normalizedBonusAmount < 0)) {
    normalizedBonusAmount = 0;
  }

  if (normalizedBonusAmount === null) {
    const memberState = getSeasonMemberState(user, data.rechargeConfig || {});
    const eligibleBonusTypes = new Set(["admin_add", "recharge_credit"]);
    if (Number(changeAmount) > 0 && eligibleBonusTypes.has(String(type || "")) && memberState.active) {
      normalizedBonusAmount = Math.floor(Number(changeAmount) * Number(memberState.bonus_rate || 0));
    } else {
      normalizedBonusAmount = 0;
    }
  }

  const nextBalance = Number(account.balance) + Number(changeAmount) + Number(normalizedBonusAmount || 0);
  if (nextBalance < 0) {
    const err = new Error("insufficient_quota");
    err.statusCode = 400;
    throw err;
  }
  account.balance = nextBalance;
  account.updated_at = now();
  data.quotaLogs.push({
    id: nextId(data.quotaLogs),
    user_id: Number(userId),
    change_amount: Number(changeAmount),
    type,
    order_id: orderId ? Number(orderId) : null,
    remark,
    created_at: now(),
  });
  if (Number(normalizedBonusAmount || 0) > 0) {
    data.quotaLogs.push({
      id: nextId(data.quotaLogs),
      user_id: Number(userId),
      change_amount: Number(normalizedBonusAmount),
      type: "member_bonus",
      order_id: orderId ? Number(orderId) : null,
      remark: `season_member_bonus:${type}`,
      created_at: now(),
    });
  }
  return nextBalance;
}

function importCards({ sourceType, sourceFileName, rawJson, importedBy, parsedProducts }) {
  const data = readData();
  const hasPendingOrders = (data.orders || []).some((order) =>
    ["pending", "cancel_requested"].includes(String(order?.status || ""))
  );
  if (hasPendingOrders) {
    const err = new Error("catalog_replace_blocked_by_pending_orders");
    err.statusCode = 409;
    throw err;
  }

  data.products = [];
  data.productImports = [];

  const importId = nextId(data.productImports);
  const importedAt = now();

  const importRow = {
    id: importId,
    source_type: sourceType || "upload",
    source_file_name: sourceFileName || null,
    raw_json: rawJson,
    imported_by: importedBy || null,
    created_at: importedAt,
  };
  data.productImports.push(importRow);

  parsedProducts.forEach((product) => {
    let existing = data.products.find((item) => item.uid === product.uid);
    if (!existing) {
      existing = {
        id: nextId(data.products),
        import_id: importId,
        legacy_id: product.legacy_id,
        uid: product.uid,
        name: product.name,
        image_url: product.image_url || null,
        attack_value: product.attack_value || 0,
        hp_value: product.hp_value || 0,
        main_attrs: product.main_attrs || "",
        ext_attrs: product.ext_attrs || "",
        schedule_id: product.schedule_id || null,
        current_schedule_id: product.current_schedule_id || null,
        is_current_season: Boolean(product.is_current_season),
        season_tag: product.season_tag || "legacy",
        season_label: product.season_label || "-",
        season_display: product.season_display || "老卡",
        price_quota: 0,
        manual_price_quota: null,
        pricing_meta: {},
        stock: Number(product.stock) || 1,
        status: "on_sale",
        created_at: importedAt,
        updated_at: importedAt,
      };
      data.products.push(existing);
    } else {
      existing.import_id = importId;
      existing.legacy_id = product.legacy_id;
      existing.name = product.name;
      existing.image_url = existing.image_url || product.image_url || null;
      existing.attack_value = product.attack_value || 0;
      existing.hp_value = product.hp_value || 0;
      existing.main_attrs = product.main_attrs || "";
      existing.ext_attrs = product.ext_attrs || "";
      existing.schedule_id = product.schedule_id || null;
      existing.current_schedule_id = product.current_schedule_id || null;
      existing.is_current_season = Boolean(product.is_current_season);
      existing.season_tag = product.season_tag || "legacy";
      existing.season_label = product.season_label || "-";
      existing.season_display = product.season_display || "老卡";
      existing.stock = Number(product.stock) || 1;
      existing.status = "on_sale";
      existing.updated_at = importedAt;
    }
  });

  repriceDataProducts(data);

  addAuditLog(data, {
    actorUserId: importedBy,
    targetType: "import",
    targetId: importId,
    action: "cards_import",
    detail: {
      source_type: importRow.source_type,
      source_file_name: importRow.source_file_name,
      parsed_count: parsedProducts.length,
    },
  });

  writeData(data);
  return { import: clone(importRow), parsed_count: parsedProducts.length };
}

function listAdminProducts() {
  const data = readData();
  return clone(
    data.products
      .map((product) => {
        const imported = data.productImports.find((item) => item.id === product.import_id);
        return {
          ...product,
          source_type: imported?.source_type || null,
          source_file_name: imported?.source_file_name || null,
          imported_at: imported?.created_at || null,
        };
      })
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
  );
}

function listAdminBundles() {
  const data = readData();
  return clone(
    (data.bundleSkus || []).sort(
      (a, b) =>
        Number(a.display_rank || 999) - Number(b.display_rank || 999) ||
        String(b.updated_at).localeCompare(String(a.updated_at))
    )
  );
}

function updateProduct(productId, patch, actorUserId) {
  const data = readData();
  const product = data.products.find((item) => item.id === Number(productId));
  if (!product) return null;

  const nextPatch = { ...patch };
  if (Object.prototype.hasOwnProperty.call(nextPatch, "price_quota")) {
    product.manual_price_quota = Number(nextPatch.price_quota);
    delete nextPatch.price_quota;
  }

  Object.assign(product, nextPatch, { updated_at: now() });
  repriceDataProducts(data);
  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: product.id,
    action: "product_update",
    detail: {
      ...nextPatch,
      ...(Object.prototype.hasOwnProperty.call(patch, "price_quota")
        ? { manual_price_quota: Number(patch.price_quota) }
        : {}),
    },
  });
  writeData(data);
  return clone(data.products.find((item) => item.id === Number(productId)));
}

function updateProductStatus(productId, status, actorUserId) {
  return updateProduct(productId, { status }, actorUserId);
}

function updateBundleSku(bundleId, patch, actorUserId) {
  const data = readData();
  const bundle = (data.bundleSkus || []).find((item) => item.id === Number(bundleId));
  if (!bundle) return null;

  Object.assign(bundle, patch, { updated_at: now() });
  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: bundle.id,
    action: "bundle_update",
    detail: patch,
  });
  writeData(data);
  return clone(bundle);
}

function updateBundleSkuStatus(bundleId, status, actorUserId) {
  return updateBundleSku(bundleId, { status }, actorUserId);
}

function bulkUpdateProductStatus(productIds, status, actorUserId) {
  const data = readData();
  const normalizedIds = [...new Set(productIds.map((item) => Number(item)).filter(Boolean))];
  let updatedCount = 0;

  data.products.forEach((product) => {
    if (!normalizedIds.includes(Number(product.id))) return;
    product.status = status;
    product.updated_at = now();
    updatedCount += 1;
  });

  if (updatedCount > 0) {
    addAuditLog(data, {
      actorUserId,
      targetType: "product",
      targetId: normalizedIds[0],
      action: "product_bulk_status_update",
      detail: { product_ids: normalizedIds, status, updated_count: updatedCount },
    });
    writeData(data);
  }

  return { updated_count: updatedCount, status };
}

function bulkUpdateProducts(productIds, patch, actorUserId) {
  const data = readData();
  const normalizedIds = [...new Set(productIds.map((item) => Number(item)).filter(Boolean))];
  let updatedCount = 0;
  const nextPatch = { ...patch };
  const manualPrice =
    Object.prototype.hasOwnProperty.call(nextPatch, "price_quota") &&
    Number.isInteger(Number(nextPatch.price_quota))
      ? Number(nextPatch.price_quota)
      : null;

  if (Object.prototype.hasOwnProperty.call(nextPatch, "price_quota")) {
    delete nextPatch.price_quota;
  }

  data.products.forEach((product) => {
    if (!normalizedIds.includes(Number(product.id))) return;
    if (manualPrice !== null) {
      product.manual_price_quota = manualPrice;
    }
    Object.assign(product, nextPatch, { updated_at: now() });
    updatedCount += 1;
  });

  if (updatedCount > 0) {
    repriceDataProducts(data);
    addAuditLog(data, {
      actorUserId,
      targetType: "product",
      targetId: normalizedIds[0],
      action: "product_bulk_update",
      detail: {
        product_ids: normalizedIds,
        patch: {
          ...nextPatch,
          ...(manualPrice !== null ? { manual_price_quota: manualPrice } : {}),
        },
        updated_count: updatedCount,
      },
    });
    writeData(data);
  }

  return {
    updated_count: updatedCount,
    patch: {
      ...nextPatch,
      ...(manualPrice !== null ? { manual_price_quota: manualPrice } : {}),
    },
  };
}

function listUsers() {
  const data = readData();
  return clone(
    data.users
      .map((user) => withQuota(user, data))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  );
}

function changeUserQuota(userId, changeAmount, remark, actorUserId) {
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) return null;
  const balance = applyQuotaChange(data, {
    userId,
    changeAmount,
    type: changeAmount > 0 ? "admin_add" : "admin_subtract",
    remark: remark || null,
  });
  addAuditLog(data, {
    actorUserId,
    targetType: "user",
    targetId: Number(userId),
    action: "user_quota_change",
    detail: { change_amount: Number(changeAmount), next_balance: balance },
  });
  writeData(data);
  return { user_id: Number(userId), balance };
}

function createRechargeOrder(
  userId,
  { amountYuan, quotaAmount, paymentReference, payerNote, orderType = "normal" }
) {
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) {
    const err = new Error("user_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (user.status !== "active") {
    const err = new Error("user_disabled");
    err.statusCode = 403;
    throw err;
  }
  const config = normalizeRechargeConfig(data.rechargeConfig || {});
  const normalizedOrderType = String(orderType || "normal").trim() || "normal";
  const memberState = getSeasonMemberState(user, config);
  if (normalizedOrderType === "season_member") {
    if (!config.season_member_enabled) {
      const err = new Error("season_member_disabled");
      err.statusCode = 400;
      throw err;
    }
    if (memberState.active) {
      const err = new Error("season_member_already_active");
      err.statusCode = 400;
      throw err;
    }
    const hasPendingSameSeason = (data.rechargeOrders || []).some(
      (item) =>
        Number(item.user_id) === Number(userId) &&
        item.status === "pending_review" &&
        item.order_type === "season_member" &&
        String(item.season_label || "") === String(config.season_member_season_label || "")
    );
    if (hasPendingSameSeason) {
      const err = new Error("season_member_pending_review");
      err.statusCode = 400;
      throw err;
    }
  }

  const baseQuotaAmount = Number(quotaAmount);
  const bonusQuotaAmount =
    normalizedOrderType === "normal" && memberState.active
      ? Math.floor(baseQuotaAmount * Number(config.season_member_bonus_rate || 0))
      : 0;

  const rechargeOrder = {
    id: nextId(data.rechargeOrders || []),
    user_id: Number(userId),
    channel: "alipay_qr",
    order_type: normalizedOrderType,
    amount_yuan: Number(amountYuan),
    base_quota_amount: baseQuotaAmount,
    bonus_quota_amount: bonusQuotaAmount,
    quota_amount: baseQuotaAmount + bonusQuotaAmount,
    season_label:
      normalizedOrderType === "season_member" ? String(config.season_member_season_label || "") : null,
    payment_reference: String(paymentReference || "").trim(),
    payer_note: payerNote ? String(payerNote).trim() : null,
    admin_remark: null,
    status: "pending_review",
    reviewed_by: null,
    reviewed_at: null,
    created_at: now(),
    updated_at: now(),
  };

  data.rechargeOrders.push(rechargeOrder);
  addAuditLog(data, {
    actorUserId: Number(userId),
    targetType: "recharge_order",
    targetId: rechargeOrder.id,
    action: "recharge_order_create",
    detail: {
      amount_yuan: rechargeOrder.amount_yuan,
      quota_amount: rechargeOrder.quota_amount,
      order_type: rechargeOrder.order_type,
      channel: rechargeOrder.channel,
    },
  });
  writeData(data);
  return listRechargeOrders({ rechargeOrderId: rechargeOrder.id, userId: Number(userId), limit: 1 })[0];
}

function reviewRechargeOrder(rechargeOrderId, { status, adminRemark = null }, actorUserId) {
  const data = readData();
  const rechargeOrder = (data.rechargeOrders || []).find(
    (item) => item.id === Number(rechargeOrderId)
  );
  if (!rechargeOrder) return null;
  if (rechargeOrder.status !== "pending_review") {
    const err = new Error("recharge_order_review_not_allowed");
    err.statusCode = 400;
    throw err;
  }

  rechargeOrder.status = status;
  rechargeOrder.admin_remark = adminRemark ? String(adminRemark).trim() : null;
  rechargeOrder.reviewed_by = Number(actorUserId);
  rechargeOrder.reviewed_at = now();
  rechargeOrder.updated_at = now();

  if (status === "approved") {
    const user = data.users.find((item) => item.id === Number(rechargeOrder.user_id));
    const config = normalizeRechargeConfig(data.rechargeConfig || {});
    if (rechargeOrder.order_type === "season_member" && user) {
      user.season_member = {
        season_label: String(rechargeOrder.season_label || config.season_member_season_label || ""),
        activated_at: now(),
        source_recharge_order_id: Number(rechargeOrder.id),
      };
      user.updated_at = now();
      applyQuotaChange(data, {
        userId: rechargeOrder.user_id,
        changeAmount: Number(rechargeOrder.base_quota_amount || rechargeOrder.quota_amount || 0),
        type: "season_member_credit",
        remark: rechargeOrder.admin_remark || `season_member#${rechargeOrder.id}`,
        bonusAmount: 0,
      });
    } else {
      applyQuotaChange(data, {
        userId: rechargeOrder.user_id,
        changeAmount: Number(rechargeOrder.base_quota_amount || rechargeOrder.quota_amount || 0),
        type: "recharge_credit",
        remark: rechargeOrder.admin_remark || `recharge_order#${rechargeOrder.id}`,
        bonusAmount: Number(rechargeOrder.bonus_quota_amount || 0),
      });
    }
  }

  addAuditLog(data, {
    actorUserId: Number(actorUserId),
    targetType: "recharge_order",
    targetId: rechargeOrder.id,
    action: "recharge_order_review",
    detail: {
      status,
      quota_amount: rechargeOrder.quota_amount,
      base_quota_amount: rechargeOrder.base_quota_amount,
      bonus_quota_amount: rechargeOrder.bonus_quota_amount,
      amount_yuan: rechargeOrder.amount_yuan,
      order_type: rechargeOrder.order_type,
      admin_remark: rechargeOrder.admin_remark,
    },
  });

  writeData(data);
  return listRechargeOrders({ rechargeOrderId: rechargeOrder.id, limit: 1 })[0];
}

function updateUserStatus(userId, status, actorUserId) {
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) return null;
  user.status = status;
  user.updated_at = now();
  addAuditLog(data, {
    actorUserId,
    targetType: "user",
    targetId: user.id,
    action: "user_status_update",
    detail: { status },
  });
  writeData(data);
  return withQuota(user, data);
}

function createOrder(userId, itemId, itemKind = "card") {
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) {
    const err = new Error("user_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (user.status !== "active") {
    const err = new Error("user_disabled");
    err.statusCode = 403;
    throw err;
  }

  const isBundle = itemKind === "bundle";
  const item = isBundle
    ? (data.bundleSkus || []).find((bundle) => bundle.id === Number(itemId))
    : data.products.find((product) => product.id === Number(itemId));

  if (!item) {
    const err = new Error(isBundle ? "bundle_not_found" : "product_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (item.status !== "on_sale") {
    const err = new Error(isBundle ? "bundle_not_on_sale" : "product_not_on_sale");
    err.statusCode = 400;
    throw err;
  }
  if (!isBundle && Number(item.stock) <= 0) {
    const err = new Error("product_out_of_stock");
    err.statusCode = 400;
    throw err;
  }
  if (isBundle && item.stock !== null && item.stock !== undefined && Number(item.stock) <= 0) {
    const err = new Error("bundle_out_of_stock");
    err.statusCode = 400;
    throw err;
  }

  applyQuotaChange(data, {
    userId,
    changeAmount: -Number(item.price_quota),
    type: "order_deduct",
    remark: `order create for ${itemKind} ${item.id}`,
  });

  const order = {
    id: nextId(data.orders),
    user_id: Number(userId),
    total_quota: Number(item.price_quota),
    status: "pending",
    remark: null,
    created_at: now(),
    updated_at: now(),
  };
  data.orders.push(order);

  data.orderItems.push({
    id: nextId(data.orderItems),
    order_id: order.id,
    item_kind: itemKind,
    product_id: isBundle ? null : item.id,
    bundle_sku_id: isBundle ? item.id : null,
    product_name: item.name,
    product_snapshot: clone(item),
    price_quota: Number(item.price_quota),
    created_at: now(),
  });

  if (isBundle) {
    if (item.stock !== null && item.stock !== undefined) {
      item.stock = Number(item.stock) - 1;
      if (item.stock <= 0) {
        item.status = "sold";
      }
    }
    item.updated_at = now();
  } else {
    item.stock = Number(item.stock) - 1;
    item.updated_at = now();
    if (item.stock <= 0) {
      item.status = "sold";
    }
  }

  const quotaLog = data.quotaLogs[data.quotaLogs.length - 1];
  if (quotaLog && quotaLog.type === "order_deduct" && !quotaLog.order_id) {
    quotaLog.order_id = order.id;
  }

  addAuditLog(data, {
    actorUserId: userId,
    targetType: "order",
    targetId: order.id,
    action: "order_create",
    detail: { item_kind: itemKind, item_id: item.id, total_quota: item.price_quota },
  });

  repriceDataProducts(data);
  writeData(data);
  return listOrders({ orderId: order.id, userId: Number(userId), limit: 1 })[0];
}

function requestOrderCancellation(orderId, userId, remark = null) {
  const data = readData();
  const order = data.orders.find(
    (item) => item.id === Number(orderId) && item.user_id === Number(userId)
  );
  if (!order) return null;

  if (order.status !== "pending") {
    const err = new Error("order_cancel_request_not_allowed");
    err.statusCode = 400;
    throw err;
  }

  order.status = "cancel_requested";
  order.remark = remark || order.remark || null;
  order.updated_at = now();

  addAuditLog(data, {
    actorUserId: userId,
    targetType: "order",
    targetId: order.id,
    action: "order_cancel_request",
    detail: { remark: remark || null },
  });

  writeData(data);
  return listOrders({ orderId: order.id, userId: Number(userId), limit: 1 })[0];
}

function updateOrderStatus(orderId, status, remark, actorUserId) {
  const data = readData();
  const order = data.orders.find((item) => item.id === Number(orderId));
  if (!order) return null;
  const previousStatus = order.status;
  if (order.status === "cancelled" && status !== "cancelled") {
    const err = new Error("invalid_order_transition");
    err.statusCode = 400;
    throw err;
  }

  if (status === "cancelled" && order.status !== "cancelled") {
    const items = data.orderItems.filter((item) => item.order_id === order.id);
    items.forEach((item) => {
      if (item.item_kind === "bundle") {
        const bundle = (data.bundleSkus || []).find((entry) => entry.id === item.bundle_sku_id);
        if (bundle) {
          if (bundle.stock !== null && bundle.stock !== undefined) {
            bundle.stock = Number(bundle.stock) + 1;
          }
          if (bundle.status === "sold") bundle.status = "on_sale";
          bundle.updated_at = now();
        }
        return;
      }

      const product = data.products.find((p) => p.id === item.product_id);
      if (product) {
        product.stock = Number(product.stock) + 1;
        if (product.status === "sold") product.status = "on_sale";
        product.updated_at = now();
      }
    });
    applyQuotaChange(data, {
      userId: order.user_id,
      changeAmount: Number(order.total_quota),
      type: "order_refund",
      orderId: order.id,
      remark: remark || "admin cancel order",
    });
  }

  order.status = status;
  order.remark = remark || null;
  order.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "order",
    targetId: order.id,
    action: "order_status_update",
    detail: { from: previousStatus, to: status, remark: remark || null },
  });

  repriceDataProducts(data);
  writeData(data);
  return listOrders({ orderId: order.id, limit: 1 })[0];
}

function updateOrderRemark(orderId, remark, actorUserId) {
  const data = readData();
  const order = data.orders.find((item) => item.id === Number(orderId));
  if (!order) return null;

  order.remark = remark || null;
  order.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "order",
    targetId: order.id,
    action: "order_remark_update",
    detail: { remark: order.remark },
  });

  writeData(data);
  return listOrders({ orderId: order.id, limit: 1 })[0];
}

function clearProductManualPrice(productId, actorUserId) {
  const data = readData();
  const product = data.products.find((item) => item.id === Number(productId));
  if (!product) return null;

  product.manual_price_quota = null;
  product.updated_at = now();
  repriceDataProducts(data);

  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: product.id,
    action: "product_manual_price_clear",
    detail: null,
  });

  writeData(data);
  return clone(data.products.find((item) => item.id === Number(productId)));
}

function recalculatePricing(actorUserId = null) {
  const data = readData();
  repriceDataProducts(data);
  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: 0,
    action: "product_pricing_recalculate",
    detail: { product_count: data.products.length },
  });
  writeData(data);
  return clone(data.products);
}

function listAuditLogs({ keyword = "", action = "", limit = 200 } = {}) {
  const data = readData();
  let logs = (data.auditLogs || []).slice();
  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  const trimmedAction = String(action || "").trim().toLowerCase();

  if (trimmedAction && trimmedAction !== "all") {
    logs = logs.filter((log) => String(log.action || "").toLowerCase() === trimmedAction);
  }

  if (trimmedKeyword) {
    logs = logs.filter((log) => {
      const actor = data.users.find((item) => item.id === log.actor_user_id);
      return [
        log.action,
        log.target_type,
        String(log.target_id || ""),
        actor?.game_role_name,
        actor?.nickname,
        JSON.stringify(log.detail || {}),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }

  logs.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  return clone(
    logs.slice(0, limit).map((log) => {
      const actor = data.users.find((item) => item.id === log.actor_user_id);
      return {
        ...log,
        actor_role_name: actor?.game_role_name || null,
        actor_nickname: actor?.nickname || null,
      };
    })
  );
}

function listQuotaLogs({ userId = null, keyword = "", type = "", limit = 200 } = {}) {
  const data = readData();
  let logs = (data.quotaLogs || []).slice();
  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  const trimmedType = String(type || "").trim().toLowerCase();

  if (userId !== null && userId !== undefined && userId !== "") {
    logs = logs.filter((item) => Number(item.user_id) === Number(userId));
  }

  if (trimmedType && trimmedType !== "all") {
    logs = logs.filter((item) => String(item.type || "").toLowerCase() === trimmedType);
  }

  if (trimmedKeyword) {
    logs = logs.filter((log) => {
      const user = data.users.find((item) => Number(item.id) === Number(log.user_id));
      return [
        user?.game_role_id,
        user?.game_role_name,
        user?.game_server,
        log.type,
        String(log.order_id || ""),
        log.remark,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }

  logs.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  return clone(
    logs.slice(0, limit).map((log) => {
      const user = data.users.find((item) => Number(item.id) === Number(log.user_id));
      return {
        ...log,
        game_role_id: user?.game_role_id || null,
        game_role_name: user?.game_role_name || null,
        game_server: user?.game_server || null,
      };
    })
  );
}

module.exports = {
  bindUser,
  registerPasswordUser,
  loginPasswordUser,
  getUserById,
  listProducts,
  getProductById,
  listBundleSkus,
  getQuota,
  listOrders,
  listRechargeOrders,
  getRechargeConfig,
  importCards,
  listAdminProducts,
  listAdminBundles,
  updateProduct,
  updateProductStatus,
  updateBundleSku,
  updateBundleSkuStatus,
  bulkUpdateProductStatus,
  bulkUpdateProducts,
  clearProductManualPrice,
  recalculatePricing,
  listUsers,
  changeUserQuota,
  updateUserStatus,
  updateSelfProfile,
  changeSelfPassword,
  createOrder,
  createRechargeOrder,
  updateRechargeConfig,
  requestOrderCancellation,
  updateOrderStatus,
  updateOrderRemark,
  reviewRechargeOrder,
  listAuditLogs,
  listQuotaLogs,
};
