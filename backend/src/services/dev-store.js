const fs = require("fs");
const path = require("path");
const { PRICE_CONFIG, buildOrderEvents, repriceProducts } = require("./pricing");
const { createFileStore } = require("../domain/store/core/file-store");
const { normalizeStoreData } = require("../domain/store/core/data-normalizer");
const { repriceStoreProducts } = require("../domain/store/core/reprice-hook");
const { configureStoreRuntime } = require("../domain/store/core/runtime-context");
const adminQueryStore = require("../domain/store/admin-query-store");
const helperStore = require("../domain/store/helper-store");
const usersStore = require("../domain/store/users-store");
const auctionsStore = require("../domain/store/auctions-store");
const ordersStore = require("../domain/store/orders-store");
const productsStore = require("../domain/store/products-store");
const sharedStoreViews = require("../domain/store/shared-store-views");
const {
  buildRepriceSummary,
  buildRepriceFailureSummary,
  attachRepriceStatus,
} = require("../domain/pricing/core/reprice-products");
const { BUNDLE_SKU_SEEDS, RETIRED_BUNDLE_CODES } = require("../config/catalog-config");
const { hashPassword, verifyPassword } = require("./password-auth");
const { buildDefaultRechargeConfig, normalizeRechargeConfig } = require("../config/recharge-config");
const {
  buildCardSeasonMeta,
  getConfiguredCurrentSeasonScheduleId,
  parseSeasonScheduleId,
} = require("../config/season-meta");
const { getSignupSeedQuota } = require("../config/signup-seed-quota");
const { buildAdminProductQueryResult } = require("../modules/admin/queries/product-filters");
const { ADMIN_ROLES } = require("../domain/admin-roles");
const { normalizeHelperCapabilities } = require("../domain/helper-capabilities");
const { RECHARGE_ORDER_STATUS } = require("../domain/recharge-order-status");
const { QUOTA_LOG_TYPES } = require("../domain/quota-log-types");
const { AUDIT_ACTIONS } = require("../domain/audit-actions");

const defaultDataPath = path.resolve(__dirname, "..", "..", "dev-data.json");
const configuredDataPath = process.env.DEV_STORE_DATA_PATH
  ? path.resolve(process.cwd(), process.env.DEV_STORE_DATA_PATH)
  : null;
const dataPath =
  configuredDataPath && fs.existsSync(configuredDataPath)
    ? configuredDataPath
    : defaultDataPath;
let storeCore = null;
const FIXED_ADMIN_ACCOUNT = {
  game_role_id: "584967604",
  game_role_name: "繁星✨秋",
  game_server: "direct",
  nickname: "繁星✨秋",
  auth_provider: "password",
  password_hash:
    "scrypt$16384$8$1$15d0485f25b5ca60d4119ee868ae9987$c86dead7cef0087690fa74e4d30efc33849f54a50748e0b09dee89bc864a9c14edf7b8fad9b18beaa6ed6154b26181d56b4536aa7920ae36f96ae0f424f198f9",
};
const BEGINNER_GUIDE_REWARD_QUOTA = 1000;
const BEGINNER_GUIDE_REWARD_REMARK = "beginner_guide_reward";
const DRAW_SERVICE_MIN_QUOTA = 200;
const DRAW_SERVICE_STEP_QUOTA = 200;
const DRAW_SERVICE_MILESTONE_QUOTA = 50000;
const DRAW_SERVICE_FIRST_REBATE_QUOTA = 10000;
const DRAW_SERVICE_REPEAT_REBATE_QUOTA = 5000;
const AUCTION_BLOCKING_STATUSES = new Set(["scheduled", "live", "ended"]);
const DRAW_SERVICE_ATLAS_BONUS_LABEL = "一套带金高攻高血图鉴";
const DRAW_SERVICE_VIDEO_NOTICE =
  "如需代抽视频确认真实性，请在“我的信息”里的“订单帮助”中，通过微信群联系管理员索取。";
const DRAW_SERVICE_RULE_SUMMARY =
  "返还所有双满紫、双满橙、双满红、双满金卡、>=2.5 单词条、双词条、珍。";
const LEGACY_DISPLAY_NAME_BY_ID = {
  1: "随便掌",
  2: "折凳要诀",
  101: "退堂鼓",
  102: "杠上开花手",
  201: "也行刀法",
  202: "摸牌透视眼",
  301: "杠精罡气",
  302: "摸鱼化劲",
  401: "对穿肠文攻术",
  402: "小强不死身",
  403: "跑路草上飞",
  501: "运气诀",
};

const LEGACY_DISPLAY_NAME_OVERRIDES = {
  201: "\u4e5f\u884c\u5200\u6cd5",
  501: "\u8fd0\u6c14\u51b3",
  601: "\u73cd \u8fd0\u6c14\u51b3",
  602: "\u73cd \u8fde\u73af\u9a6c\u540e\u70ae",
  603: "\u73cd \u4e7e\u5764\u4e00\u63b7",
};
const HELPER_SNAPSHOT_BASE_PER_USER = 3;
const HELPER_SNAPSHOT_MAX_PERMANENT_SLOTS = 7;
const HELPER_SNAPSHOT_SEASONAL_SLOT_QUOTA = 1000;
const HELPER_SNAPSHOT_PERMANENT_SLOT_QUOTA = 5000;
const HELPER_SNAPSHOT_MEMBER_BONUS_SLOTS = 3;

function getExpectedLegacyDisplayName(legacyId) {
  return (
    LEGACY_DISPLAY_NAME_OVERRIDES[Number(legacyId)] || LEGACY_DISPLAY_NAME_BY_ID[Number(legacyId)]
  );
}

function getExpectedLegacyImageUrl(legacyId) {
  const displayName = getExpectedLegacyDisplayName(legacyId);
  return displayName ? `./legacy-assets/${encodeURIComponent(displayName)}.png` : null;
}

function now() {
  return new Date().toISOString();
}

function normalizeDiscountRate(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 100;
  const normalized = Math.round(numeric);
  if (normalized <= 0 || normalized > 100) return 100;
  return normalized;
}

function getDiscountLabel(discountRate) {
  const normalized = normalizeDiscountRate(discountRate);
  if (normalized >= 100) return "";
  const fold = normalized / 10;
  return Number.isInteger(fold) ? `${fold}折` : `${fold.toFixed(1)}折`;
}

function getEffectiveQuotaPrice(basePrice, discountRate) {
  const normalizedPrice = Math.max(0, Number(basePrice) || 0);
  const normalizedRate = normalizeDiscountRate(discountRate);
  if (normalizedRate >= 100) return normalizedPrice;
  return Math.max(1, Math.round((normalizedPrice * normalizedRate) / 100));
}

function getQuotaCashAmountFromStore(data, quotaAmount) {
  const config = normalizeRechargeConfig(data?.rechargeConfig || buildDefaultRechargeConfig());
  const exchangeQuota = Math.max(Number(config.exchange_quota || 0), 1);
  const exchangeYuan = Math.max(Number(config.exchange_yuan || 1), 0.01);
  const yuan = (Math.max(Number(quotaAmount) || 0, 0) * exchangeYuan) / exchangeQuota;
  return Number(yuan.toFixed(2));
}

function defaultData() {
  return {
    users: [],
    helperBindings: [],
    helperInventories: [],
    helperSnapshots: [],
    helperActionLogs: [],
    productImports: [],
    products: [],
    bundleSkus: [],
    auctions: [],
    auctionBids: [],
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

function normalizeLegacyCardNames(data) {
  let changed = false;

  data.products = (data.products || []).map((product) => {
    const legacyId = Number(product?.legacy_id || 0);
    const expectedName = getExpectedLegacyDisplayName(legacyId);
    if (!expectedName) return product;

    const next = { ...product };
    if (String(product?.name || "").trim() !== expectedName) {
      next.name = expectedName;
      changed = true;
    }

    const uidParts = String(product?.uid || "").split("|");
    if (uidParts.length >= 2 && uidParts[1] !== expectedName) {
      uidParts[1] = expectedName;
      next.uid = uidParts.join("|");
      changed = true;
    }

    const expectedImageUrl = getExpectedLegacyImageUrl(legacyId);
    if (expectedImageUrl && String(product?.image_url || "").trim() !== expectedImageUrl) {
      next.image_url = expectedImageUrl;
      changed = true;
    }

    return next;
  });

  return changed;
}

function repriceDataProducts(data) {
  return repriceStoreProducts(data, { repriceProducts, buildOrderEvents });
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
      role: ADMIN_ROLES.ADMIN,
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
    role: ADMIN_ROLES.ADMIN,
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

  ensureQuotaAccount(data, adminUser.id);
  return changed;
}

function getStoreCore() {
  if (!storeCore) {
    storeCore = createFileStore({
      dataPath,
      defaultData,
      clone,
      normalizeStoreData: (data) =>
        normalizeStoreData(data, {
          defaultData,
          seedBundleSkus,
          ensureFixedAdminUser,
          removeLegacySeedJunk,
          normalizeLegacyCardNames,
          normalizeDiscountRate,
          normalizeRechargeConfig,
          getConfiguredCurrentSeasonScheduleId,
          buildCardSeasonMeta,
          parseSeasonScheduleId,
          now,
          normalizeAuctionStatus,
          refreshAuctionStatuses,
          backfillBeginnerGuideRewards,
          repriceStoreProducts: repriceDataProducts,
          persistStoreData: writeData,
          priceConfig: PRICE_CONFIG,
          normalizeHelperCapabilities,
        }),
    });
  }
  return storeCore;
}

function loadDataFromDisk() {
  return getStoreCore().loadDataFromDisk();
}

function readData(options = {}) {
  return getStoreCore().readStoreData(options);
}

function writeData(data) {
  return getStoreCore().writeStoreData(data);
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeAuctionStatus(status) {
  return ["scheduled", "live", "ended", "settled", "cancelled"].includes(
    String(status || "").trim()
  )
    ? String(status).trim()
    : "scheduled";
}

function refreshAuctionStatuses(data) {
  let changed = false;
  const currentTime = Date.now();

  data.auctions = (data.auctions || []).map((auction) => {
    const next = { ...auction };
    const currentStatus = normalizeAuctionStatus(next.status);
    const startsAt = next.starts_at ? new Date(next.starts_at).getTime() : currentTime;
    const endsAt = next.ends_at ? new Date(next.ends_at).getTime() : currentTime;
    let resolvedStatus = currentStatus;

    if (!["settled", "cancelled"].includes(currentStatus)) {
      if (startsAt > currentTime) {
        resolvedStatus = "scheduled";
      } else if (endsAt <= currentTime) {
        resolvedStatus = "ended";
      } else {
        resolvedStatus = "live";
      }
    }

    if (resolvedStatus !== currentStatus) {
      next.status = resolvedStatus;
      next.updated_at = now();
      changed = true;
    }

    return next;
  });

  return changed;
}

function getBlockingAuctionForProduct(data, productId, options = {}) {
  const excludeAuctionId =
    options.excludeAuctionId === undefined || options.excludeAuctionId === null
      ? null
      : Number(options.excludeAuctionId);
  return (data.auctions || []).find(
    (auction) =>
      Number(auction.product_id) === Number(productId) &&
      (excludeAuctionId === null || Number(auction.id) !== excludeAuctionId) &&
      AUCTION_BLOCKING_STATUSES.has(String(auction.status || "").trim())
  );
}

function getReservedAuctionCountForProduct(data, productId, options = {}) {
  const excludeAuctionId =
    options.excludeAuctionId === undefined || options.excludeAuctionId === null
      ? null
      : Number(options.excludeAuctionId);
  return (data.auctions || []).filter(
    (auction) =>
      Number(auction.product_id) === Number(productId) &&
      (excludeAuctionId === null || Number(auction.id) !== excludeAuctionId) &&
      AUCTION_BLOCKING_STATUSES.has(String(auction.status || "").trim())
  ).length;
}

function getAvailableProductStock(data, product) {
  const totalStock = Number(product?.stock || 0);
  if (!Number.isFinite(totalStock) || totalStock <= 0) return 0;
  const reservedCount = getReservedAuctionCountForProduct(data, Number(product?.id));
  return Math.max(0, totalStock - reservedCount);
}

function ensureProductNotBlockedByAuction(data, productId, errorCode = "product_in_auction") {
  const blockingAuction = getBlockingAuctionForProduct(data, productId);
  const product = (data.products || []).find((item) => Number(item.id) === Number(productId));
  if (!blockingAuction) return;
  if (product && getAvailableProductStock(data, product) > 0) return;
  const err = new Error(errorCode);
  err.statusCode = 400;
  err.payload = {
    auction_id: Number(blockingAuction.id),
    auction_status: String(blockingAuction.status || "").trim(),
  };
  throw err;
}

function getAuctionBuyerLabel(user) {
  const source =
    String(user?.nickname || "").trim() ||
    String(user?.game_role_name || "").trim() ||
    String(user?.game_role_id || "").trim();
  return source || "匿名用户";
}

function hasConfirmedSaleRecord(data, productId) {
  const normalizedProductId = Number(productId);
  if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0) return false;
  const confirmedOrderIds = new Set(
    (data.orders || [])
      .filter((order) => String(order?.status || "").trim() === "confirmed")
      .map((order) => Number(order.id))
      .filter((id) => Number.isInteger(id) && id > 0)
  );
  return (data.orderItems || []).some(
    (item) =>
      Number(item?.product_id) === normalizedProductId &&
      confirmedOrderIds.has(Number(item?.order_id))
  );
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

function getLineupSeasonLabel(config) {
  const normalizedConfig = normalizeRechargeConfig(config || {});
  return String(normalizedConfig.season_member_season_label || "").trim() || "当前赛季";
}

function getLineupSlotConfig(config) {
  const normalizedConfig = normalizeRechargeConfig(config || {});
  return {
    base_slots: Math.max(
      Number(normalizedConfig.lineup_base_slots || HELPER_SNAPSHOT_BASE_PER_USER) || HELPER_SNAPSHOT_BASE_PER_USER,
      1
    ),
    permanent_slot_quota: Math.max(
      Number(normalizedConfig.lineup_permanent_slot_quota || HELPER_SNAPSHOT_PERMANENT_SLOT_QUOTA) ||
        HELPER_SNAPSHOT_PERMANENT_SLOT_QUOTA,
      1
    ),
    permanent_slot_max: Math.max(
      Number(normalizedConfig.lineup_permanent_slot_max || HELPER_SNAPSHOT_MAX_PERMANENT_SLOTS) ||
        HELPER_SNAPSHOT_MAX_PERMANENT_SLOTS,
      0
    ),
    seasonal_slot_quota: Math.max(
      Number(normalizedConfig.lineup_seasonal_slot_quota || HELPER_SNAPSHOT_SEASONAL_SLOT_QUOTA) ||
        HELPER_SNAPSHOT_SEASONAL_SLOT_QUOTA,
      1
    ),
    member_bonus_slots: Math.max(
      Number(normalizedConfig.lineup_member_bonus_slots || HELPER_SNAPSHOT_MEMBER_BONUS_SLOTS) ||
        HELPER_SNAPSHOT_MEMBER_BONUS_SLOTS,
      0
    ),
    season_label: getLineupSeasonLabel(normalizedConfig),
    season_expires_at: String(normalizedConfig.season_member_expires_at || "").trim() || null,
  };
}

function ensureLineupSlotRecord(user) {
  if (!user.lineup_slots || typeof user.lineup_slots !== "object" || Array.isArray(user.lineup_slots)) {
    user.lineup_slots = {};
  }
  if (!Number.isInteger(Number(user.lineup_slots.permanent_purchases))) {
    user.lineup_slots.permanent_purchases = 0;
  }
  if (
    !user.lineup_slots.seasonal_slot_counts ||
    typeof user.lineup_slots.seasonal_slot_counts !== "object" ||
    Array.isArray(user.lineup_slots.seasonal_slot_counts)
  ) {
    user.lineup_slots.seasonal_slot_counts = {};
  }
  return user.lineup_slots;
}

function getLineupSlotState(user, config, data = null) {
  const slotConfig = getLineupSlotConfig(config);
  const memberState = getSeasonMemberState(user, config);
  const slotRecord =
    user?.lineup_slots && typeof user.lineup_slots === "object" && !Array.isArray(user.lineup_slots)
      ? user.lineup_slots
      : {};
  const permanentPurchases = Math.max(
    Math.floor(Number(slotRecord.permanent_purchases || 0) || 0),
    0
  );
  const permanentSlots = Math.min(permanentPurchases, slotConfig.permanent_slot_max);
  const seasonalSlotCounts =
    slotRecord.seasonal_slot_counts &&
    typeof slotRecord.seasonal_slot_counts === "object" &&
    !Array.isArray(slotRecord.seasonal_slot_counts)
      ? slotRecord.seasonal_slot_counts
      : {};
  const seasonalSlots = Math.max(
    Math.floor(Number(seasonalSlotCounts[slotConfig.season_label] || 0) || 0),
    0
  );
  const memberBonusSlots = memberState.active ? slotConfig.member_bonus_slots : 0;
  const totalSlots = slotConfig.base_slots + permanentSlots + seasonalSlots + memberBonusSlots;
  const snapshotCount = data
    ? (data.helperSnapshots || []).filter((item) => Number(item.user_id) === Number(user?.id)).length
    : 0;

  return {
    base_slots: slotConfig.base_slots,
    permanent_slots: permanentSlots,
    permanent_purchases: permanentPurchases,
    permanent_slot_max: slotConfig.permanent_slot_max,
    seasonal_slots: seasonalSlots,
    seasonal_season_label: slotConfig.season_label,
    season_expires_at: slotConfig.season_expires_at,
    member_bonus_slots: memberBonusSlots,
    member_bonus_active: memberBonusSlots > 0,
    total_slots: totalSlots,
    snapshot_count: snapshotCount,
    available_slots: Math.max(totalSlots - snapshotCount, 0),
    permanent_slot_quota: slotConfig.permanent_slot_quota,
    seasonal_slot_quota: slotConfig.seasonal_slot_quota,
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
  const lineupState = getLineupSlotState(user, data.rechargeConfig || {}, data);
  const guideReward = user?.beginner_guide_reward || null;
  return {
    ...sanitizeUser(user),
    quota_balance: account.balance,
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
    beginner_guide_reward_quota: BEGINNER_GUIDE_REWARD_QUOTA,
    beginner_guide_reward_earned: Boolean(guideReward?.granted_at),
    beginner_guide_reward_granted_at: guideReward?.granted_at || null,
    beginner_guide_reward_source_order_id: guideReward?.source_order_id || null,
  };
}

function getCurrentDrawSeasonLabel(data) {
  const currentSeasonProduct = (data.products || []).find(
    (item) => Boolean(item?.is_current_season) && String(item?.season_label || "").trim()
  );
  if (currentSeasonProduct?.season_label) {
    return String(currentSeasonProduct.season_label).trim();
  }
  const rechargeConfig = normalizeRechargeConfig(data.rechargeConfig || {});
  if (String(rechargeConfig.season_member_season_label || "").trim()) {
    return String(rechargeConfig.season_member_season_label).trim();
  }
  return "当前赛季";
}

function isDrawServiceOrder(order) {
  return String(order?.order_source || "").trim() === "draw_service";
}

function normalizeDrawAmountQuota(value) {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < DRAW_SERVICE_MIN_QUOTA) return null;
  if (amount % DRAW_SERVICE_STEP_QUOTA !== 0) return null;
  return amount;
}

function getDrawServiceSnapshot(drawService) {
  return {
    service_kind: "draw_service",
    amount_quota: Number(drawService?.amount_quota || 0),
    season_label: String(drawService?.season_label || "").trim() || null,
    rule_summary: DRAW_SERVICE_RULE_SUMMARY,
    video_notice: DRAW_SERVICE_VIDEO_NOTICE,
  };
}

function calculateDrawServiceReward(data, order) {
  const drawService = order?.draw_service || {};
  const seasonLabel =
    String(drawService.season_label || "").trim() || getCurrentDrawSeasonLabel(data);
  const confirmedOrders = (data.orders || []).filter(
    (item) =>
      Number(item.user_id) === Number(order.user_id) &&
      Number(item.id) !== Number(order.id) &&
      String(item.status || "") === "confirmed" &&
      isDrawServiceOrder(item) &&
      String(item?.draw_service?.season_label || "").trim() === seasonLabel
  );
  const previousTotal = confirmedOrders.reduce(
    (sum, item) => sum + Number(item?.draw_service?.amount_quota || item?.total_quota || 0),
    0
  );
  const currentAmount = Number(drawService.amount_quota || order.total_quota || 0);
  const nextTotal = previousTotal + currentAmount;
  const previousMilestones = Math.floor(previousTotal / DRAW_SERVICE_MILESTONE_QUOTA);
  const nextMilestones = Math.floor(nextTotal / DRAW_SERVICE_MILESTONE_QUOTA);
  let rebateQuota = 0;
  let grantsAtlasBonus = false;

  for (let milestone = previousMilestones + 1; milestone <= nextMilestones; milestone += 1) {
    if (milestone === 1) {
      rebateQuota += DRAW_SERVICE_FIRST_REBATE_QUOTA;
      grantsAtlasBonus = true;
    } else {
      rebateQuota += DRAW_SERVICE_REPEAT_REBATE_QUOTA;
    }
  }

  const rewardLines = [];
  if (rebateQuota > 0) {
    rewardLines.push(`返还 ${rebateQuota} 额度`);
  }
  if (grantsAtlasBonus) {
    rewardLines.push(DRAW_SERVICE_ATLAS_BONUS_LABEL);
  }

  return {
    seasonLabel,
    previousTotal,
    nextTotal,
    previousMilestones,
    nextMilestones,
    crossedMilestones: Math.max(nextMilestones - previousMilestones, 0),
    rebateQuota,
    grantsAtlasBonus,
    atlasBonusLabel: grantsAtlasBonus ? DRAW_SERVICE_ATLAS_BONUS_LABEL : null,
    rewardSummary: rewardLines.length ? rewardLines.join(" / ") : "本次没有触发赛季返利",
  };
}

function maybeGrantBeginnerGuideReward(data, userId, actorUserId = null, sourceTrigger = "system") {
  const user = (data.users || []).find((item) => Number(item.id) === Number(userId));
  if (!user || user.role !== "user") return false;
  if (user.beginner_guide_reward?.granted_at) return false;

  const approvedRechargeOrder = (data.rechargeOrders || []).find(
    (item) =>
      Number(item.user_id) === Number(userId) &&
      String(item.status || "") === RECHARGE_ORDER_STATUS.APPROVED
  );
  const confirmedOrder = (data.orders || []).find(
    (item) =>
      Number(item.user_id) === Number(userId) &&
      String(item.status || "") === "confirmed"
  );

  if (!approvedRechargeOrder || !confirmedOrder) {
    return false;
  }

  applyQuotaChange(data, {
    userId: Number(userId),
    changeAmount: BEGINNER_GUIDE_REWARD_QUOTA,
    type: QUOTA_LOG_TYPES.BEGINNER_GUIDE_REWARD,
    orderId: Number(confirmedOrder.id),
    remark: BEGINNER_GUIDE_REWARD_REMARK,
    bonusAmount: 0,
  });

  user.beginner_guide_reward = {
    quota_amount: BEGINNER_GUIDE_REWARD_QUOTA,
    granted_at: now(),
    source_trigger: sourceTrigger,
    source_order_id: Number(confirmedOrder.id),
    source_recharge_order_id: Number(approvedRechargeOrder.id),
  };
  user.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "user",
    targetId: Number(userId),
    action: AUDIT_ACTIONS.BEGINNER_GUIDE_REWARD_GRANT,
    detail: {
      quota_amount: BEGINNER_GUIDE_REWARD_QUOTA,
      source_trigger: sourceTrigger,
      source_order_id: Number(confirmedOrder.id),
      source_recharge_order_id: Number(approvedRechargeOrder.id),
    },
  });

  return true;
}

function backfillBeginnerGuideRewards(data) {
  let changed = false;
  for (const user of data.users || []) {
    if (maybeGrantBeginnerGuideReward(data, user.id, null, "backfill")) {
      changed = true;
    }
  }
  return changed;
}

function normalizeCardProduct(product, options = {}) {
  const { includePricingMeta = true } = options;
  const manualPriceQuota =
    product?.manual_price_quota === null || product?.manual_price_quota === undefined
      ? null
      : Number(product.manual_price_quota);
  const basePriceQuota = Number.isInteger(manualPriceQuota)
    ? manualPriceQuota
    : Number(product?.price_quota || 0);
  const discountRate = normalizeDiscountRate(product?.discount_rate);
  const effectivePriceQuota = getEffectiveQuotaPrice(basePriceQuota, discountRate);
  const normalized = {
    ...clone(product),
    item_kind: "card",
    item_id: Number(product.id),
    original_price_quota: basePriceQuota,
    price_quota: effectivePriceQuota,
    discount_rate: discountRate,
    discount_label: getDiscountLabel(discountRate),
    discount_saved_quota: Math.max(0, basePriceQuota - effectivePriceQuota),
    is_discounted: discountRate < 100 && effectivePriceQuota < basePriceQuota,
    schedule_id: product?.schedule_id === undefined ? null : Number(product.schedule_id),
    current_schedule_id:
      product?.current_schedule_id === undefined ? null : Number(product.current_schedule_id),
    is_current_season: Boolean(product?.is_current_season),
    season_tag: product?.season_tag || "legacy",
    season_label: product?.season_label || "-",
    season_display: product?.season_display || "老卡",
    stock_label: `库存 ${Number(product.stock || 0)}`,
  };
  if (!includePricingMeta) {
    delete normalized.pricing_meta;
  }
  return normalized;
}

function normalizeBundleSku(bundle, options = {}) {
  const { includePricingMeta = true } = options;
  const normalized = {
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
  if (!includePricingMeta) {
    delete normalized.pricing_meta;
  }
  return normalized;
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

function addHelperActionLog(
  data,
  { userId = null, bindingId = null, actionType, actionPayload = {}, resultStatus = "ok", resultPayload = {} }
) {
  data.helperActionLogs.unshift({
    id: nextId(data.helperActionLogs || []),
    user_id: userId === null ? null : Number(userId),
    binding_id: bindingId === null ? null : Number(bindingId),
    action_type: String(actionType || "").trim(),
    action_payload: actionPayload && typeof actionPayload === "object" ? actionPayload : {},
    result_status: String(resultStatus || "ok").trim() || "ok",
    result_payload: resultPayload && typeof resultPayload === "object" ? resultPayload : {},
    created_at: now(),
  });
}

function bindUser(payload) {
  return usersStore.bindUser(payload);
}

async function registerPasswordUser(payload) {
  return usersStore.registerPasswordUser(payload);
}

async function loginPasswordUser(gameRoleId, password) {
  return usersStore.loginPasswordUser(gameRoleId, password);
}

function getUserById(userId) {
  return usersStore.getUserById(userId);
}

function getRechargeConfig() {
  return usersStore.getRechargeConfig();
}

function updateRechargeConfig(patch, actorUserId = null, requestId = null) {
  return usersStore.updateRechargeConfig(patch, actorUserId, requestId);
}

function updateSelfProfile(userId, payload) {
  return usersStore.updateSelfProfile(userId, payload);
}

function listHelperBindings(userId) {
  return helperStore.listHelperBindings(userId);
}

function resolveHelperBinding(userId, criteria = {}) {
  return helperStore.resolveHelperBinding(userId, criteria);
}

function listHelperSnapshots(userId) {
  return helperStore.listHelperSnapshots(userId);
}

function listHelperInventories(userId) {
  return helperStore.listHelperInventories(userId);
}

function listMergedHelperInventoryItems(userId) {
  return helperStore.listMergedHelperInventoryItems(userId);
}

function listHelperActionLogs(userId, options = {}) {
  return helperStore.listHelperActionLogs(userId, options);
}

function upsertHelperBinding(userId, payload) {
  return helperStore.upsertHelperBinding(userId, payload);
}

function upsertHelperInventory(userId, payload) {
  return helperStore.upsertHelperInventory(userId, payload);
}

function pruneHelperInventories(userId, keepInventoryIds = [], actorUserId = null) {
  return helperStore.pruneHelperInventories(userId, keepInventoryIds, actorUserId);
}

function removeHelperBinding(userId, bindingId) {
  return helperStore.removeHelperBinding(userId, bindingId);
}

function createHelperSnapshot(userId, payload) {
  return helperStore.createHelperSnapshot(userId, payload);
}

function getHelperSnapshotLimitForUser(userId) {
  return helperStore.getHelperSnapshotLimitForUser(userId);
}

function purchaseLineupSlot(userId, purchaseType) {
  return helperStore.purchaseLineupSlot(userId, purchaseType);
}

function removeHelperSnapshot(userId, snapshotId) {
  return helperStore.removeHelperSnapshot(userId, snapshotId);
}

function updateHelperSnapshot(userId, snapshotId, payload) {
  return helperStore.updateHelperSnapshot(userId, snapshotId, payload);
}

function createHelperActionLog(userId, payload) {
  return helperStore.createHelperActionLog(userId, payload);
}

async function changeSelfPassword(userId, currentPassword, nextPassword) {
  return usersStore.changeSelfPassword(userId, currentPassword, nextPassword);
}

function listProducts({ keyword = "", sort = "created_desc", publicOnly = false } = {}) {
  return productsStore.listProducts({ keyword, sort, publicOnly });
}

function getProductById(productId, { publicOnly = false, itemKind = "card" } = {}) {
  return productsStore.getProductById(productId, { publicOnly, itemKind });
}

function getQuota(userId) {
  return usersStore.getQuota(userId);
}

function hydrateOrders(data, orders) {
  return sharedStoreViews.hydrateOrders(data, orders);
}

function hydrateRechargeOrders(data, rechargeOrders) {
  return sharedStoreViews.hydrateRechargeOrders(data, rechargeOrders);
}

function hydrateSingleOrder(data, order) {
  return sharedStoreViews.hydrateSingleOrder(data, order);
}

function hydrateSingleRechargeOrder(data, rechargeOrder) {
  return sharedStoreViews.hydrateSingleRechargeOrder(data, rechargeOrder);
}

function paginateItems(items, { limit = 20, offset = 0 } = {}) {
  return sharedStoreViews.paginateItems(items, { limit, offset });
}

function filterOrdersForAdmin(data, { userId = null, orderId = null, status = null, keyword = "" } = {}) {
  return sharedStoreViews.filterOrdersForAdmin(data, { userId, orderId, status, keyword });
}

function filterRechargeOrdersForAdmin(
  data,
  { userId = null, rechargeOrderId = null, status = null, keyword = "" } = {}
) {
  return sharedStoreViews.filterRechargeOrdersForAdmin(data, {
    userId,
    rechargeOrderId,
    status,
    keyword,
  });
}

function filterAuditLogsForAdmin(data, { keyword = "", action = "" } = {}) {
  return sharedStoreViews.filterAuditLogsForAdmin(data, { keyword, action });
}

function filterQuotaLogsForAdmin(data, { userId = null, keyword = "", type = "" } = {}) {
  return sharedStoreViews.filterQuotaLogsForAdmin(data, { userId, keyword, type });
}

function buildAdminProductView(data, product) {
  const blockingAuction = getBlockingAuctionForProduct(data, product.id);
  const imported = data.productImports.find((item) => item.id === product.import_id);
  const manualPriceQuota =
    product?.manual_price_quota === null || product?.manual_price_quota === undefined
      ? null
      : Number(product.manual_price_quota);
  const basePriceQuota = Number.isInteger(manualPriceQuota)
    ? manualPriceQuota
    : Number(product.price_quota || 0);
  const discountRate = normalizeDiscountRate(product.discount_rate);
  const effectivePriceQuota = getEffectiveQuotaPrice(basePriceQuota, discountRate);

  return {
    ...product,
    discount_rate: discountRate,
    effective_price_quota: effectivePriceQuota,
    discount_saved_quota: Math.max(0, basePriceQuota - effectivePriceQuota),
    discount_label: getDiscountLabel(discountRate),
    is_discounted: discountRate < 100 && effectivePriceQuota < basePriceQuota,
    auction_id: blockingAuction ? Number(blockingAuction.id) : null,
    auction_status: blockingAuction?.status || null,
    auction_ends_at: blockingAuction?.ends_at || null,
    auction_current_price_quota: blockingAuction
      ? Number(blockingAuction.current_price_quota || blockingAuction.starting_price_quota || 0)
      : null,
    source_type: imported?.source_type || null,
    source_file_name: imported?.source_file_name || null,
    imported_at: imported?.created_at || null,
  };
}

function queryAdminProducts({
  keyword = "",
  status = "all",
  discount = "all",
  category = "all",
  subcategory = "all",
  detail = "all",
  fullness = "all",
  limit = 20,
  offset = 0,
} = {}) {
  return adminQueryStore.queryAdminProducts({
    keyword,
    status,
    discount,
    category,
    subcategory,
    detail,
    fullness,
    limit,
    offset,
  });
}

function queryAdminOrders({ userId = null, orderId = null, status = null, keyword = "", limit = 20, offset = 0 } = {}) {
  return adminQueryStore.queryAdminOrders({ userId, orderId, status, keyword, limit, offset });
}

function queryAdminRechargeOrders({
  userId = null,
  rechargeOrderId = null,
  status = null,
  keyword = "",
  limit = 20,
  offset = 0,
} = {}) {
  return adminQueryStore.queryAdminRechargeOrders({
    userId,
    rechargeOrderId,
    status,
    keyword,
    limit,
    offset,
  });
}

function queryAdminBundles({ limit = 20, offset = 0 } = {}) {
  return adminQueryStore.queryAdminBundles({ limit, offset });
}

function queryAdminUsers({ keyword = "", limit = 20, offset = 0 } = {}) {
  return adminQueryStore.queryAdminUsers({ keyword, limit, offset });
}

function queryAdminAuditLogs({ keyword = "", action = "", limit = 20, offset = 0 } = {}) {
  return adminQueryStore.queryAdminAuditLogs({ keyword, action, limit, offset });
}

function queryAdminQuotaLogs({ userId = null, keyword = "", type = "", limit = 20, offset = 0 } = {}) {
  return adminQueryStore.queryAdminQuotaLogs({ userId, keyword, type, limit, offset });
}

function getAdminOverview() {
  return adminQueryStore.getAdminOverview();
}

function listUsers() {
  return adminQueryStore.listUsers();
}

function listAuditLogs(options = {}) {
  return adminQueryStore.listAuditLogs(options);
}

function listQuotaLogs(options = {}) {
  return adminQueryStore.listQuotaLogs(options);
}

function listAuctions({ status = "all", auctionId = null, publicView = false } = {}) {
  return auctionsStore.listAuctions({ status, auctionId, publicView });
}

function listAuctionBidSummariesForUser(userId) {
  return auctionsStore.listAuctionBidSummariesForUser(userId);
}

function listBundleSkus({ publicOnly = false } = {}) {
  return productsStore.listBundleSkus({ publicOnly });
}

function listOrders({
  userId = null,
  orderId = null,
  status = null,
  keyword = "",
  limit = 100,
  offset = 0,
} = {}) {
  return ordersStore.listOrders({ userId, orderId, status, keyword, limit, offset });
}

function createExternalOrder(
  itemId,
  itemKind = "card",
  { buyerLabel, remark = null } = {},
  actorUserId
) {
  return ordersStore.createExternalOrder(itemId, itemKind, { buyerLabel, remark }, actorUserId);
}

function listRechargeOrders({
  userId = null,
  rechargeOrderId = null,
  status = null,
  keyword = "",
  limit = 100,
  offset = 0,
} = {}) {
  return ordersStore.listRechargeOrders({ userId, rechargeOrderId, status, keyword, limit, offset });
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
    const eligibleBonusTypes = new Set([QUOTA_LOG_TYPES.ADMIN_ADD, QUOTA_LOG_TYPES.RECHARGE_CREDIT]);
    if (Number(changeAmount) > 0 && eligibleBonusTypes.has(String(type || "")) && memberState.active) {
      normalizedBonusAmount = Math.floor(Number(changeAmount) * Number(memberState.bonus_rate || 0));
    } else {
      normalizedBonusAmount = 0;
    }
  }

  const nextBalance = Number(account.balance) + Number(changeAmount) + Number(normalizedBonusAmount || 0);
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
      type: QUOTA_LOG_TYPES.MEMBER_BONUS,
      order_id: orderId ? Number(orderId) : null,
      remark: `season_member_bonus:${type}`,
      created_at: now(),
    });
  }
  return nextBalance;
}

function importCards({ sourceType, sourceFileName, rawJson, importedBy, parsedProducts }) {
  const data = readData();
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

  const blockingStatuses = new Set(["scheduled", "live", "ended"]);
  const pendingOrderStatuses = new Set(["pending", "cancel_requested"]);
  const preservedPendingProductIds = new Set(
    (data.orderItems || [])
      .filter((item) => {
        const order = (data.orders || []).find((candidate) => Number(candidate?.id) === Number(item?.order_id));
        return (
          order &&
          pendingOrderStatuses.has(String(order?.status || "").trim()) &&
          item?.item_kind === "card" &&
          Number(item?.product_id) > 0
        );
      })
      .map((item) => Number(item.product_id))
  );
  const preservedAuctionProducts = (data.products || []).filter((product) =>
    (data.auctions || []).some(
      (auction) =>
        Number(auction?.product_id) === Number(product.id) &&
        blockingStatuses.has(String(auction?.status || "").trim())
    )
  );
  const preservedPendingProducts = (data.products || []).filter((product) =>
    preservedPendingProductIds.has(Number(product.id))
  );
  const preservedProductsMap = new Map();
  [...preservedAuctionProducts, ...preservedPendingProducts].forEach((product) => {
    preservedProductsMap.set(Number(product.id), product);
  });
  const preservedProducts = Array.from(preservedProductsMap.values());
  const preservedImportIds = new Set(
    preservedProducts.map((item) => Number(item.import_id)).filter(Boolean)
  );
  const removedCount = Math.max((data.products || []).length - preservedProducts.length, 0);
  data.products = preservedProducts;
  data.productImports = (data.productImports || []).filter(
    (item) => Number(item.id) === Number(importId) || preservedImportIds.has(Number(item.id))
  );

  const existingByUid = new Map((data.products || []).map((item) => [String(item.uid || ""), item]));
  let insertedCount = 0;
  let updatedCount = 0;
  const preservedAuctionCount = preservedAuctionProducts.length;
  const preservedPendingCount = preservedPendingProducts.length;

  parsedProducts.forEach((product) => {
    const productUid = String(product.uid || "").trim();
    if (!productUid) return;
    let existing = existingByUid.get(productUid);
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
        discount_rate: 100,
        pricing_meta: {},
        stock: Number(product.stock) || 1,
        status: "on_sale",
        created_at: importedAt,
        updated_at: importedAt,
      };
      data.products.push(existing);
      existingByUid.set(productUid, existing);
      insertedCount += 1;
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
      existing.discount_rate = normalizeDiscountRate(existing.discount_rate);
      existing.stock = Number(product.stock) || 1;
      if (existing.status !== "sold") {
        existing.status = "on_sale";
      }
      existing.updated_at = importedAt;
      updatedCount += 1;
    }
  });

  repriceDataProducts(data);

  addAuditLog(data, {
    actorUserId: importedBy,
    targetType: "import",
    targetId: importId,
    action: AUDIT_ACTIONS.CARDS_IMPORT,
    detail: {
      source_type: importRow.source_type,
      source_file_name: importRow.source_file_name,
      parsed_count: parsedProducts.length,
      inserted_count: insertedCount,
      updated_count: updatedCount,
      removed_count: removedCount,
      preserved_auction_count: preservedAuctionCount,
      preserved_pending_count: preservedPendingCount,
    },
  });

  writeData(data);
  return {
    import: clone(importRow),
    parsed_count: parsedProducts.length,
    inserted_count: insertedCount,
    updated_count: updatedCount,
    removed_count: removedCount,
    preserved_auction_count: preservedAuctionCount,
    preserved_pending_count: preservedPendingCount,
  };
}

function listAdminProducts() {
  return queryAdminProducts({ limit: null }).items;
}

function listAdminBundles() {
  return queryAdminBundles({ limit: null }).items;
}

function updateProduct(productId, patch, actorUserId) {
  const data = readData();
  const product = data.products.find((item) => item.id === Number(productId));
  if (!product) return null;

  const nextPatch = { ...patch };
  const manualPrice =
    Object.prototype.hasOwnProperty.call(nextPatch, "manual_price_quota")
      ? nextPatch.manual_price_quota
      : Object.prototype.hasOwnProperty.call(nextPatch, "price_quota")
      ? nextPatch.price_quota
      : undefined;
  if (manualPrice !== undefined) {
    product.manual_price_quota = Number(manualPrice);
  }
  if (Object.prototype.hasOwnProperty.call(nextPatch, "manual_price_quota")) {
    delete nextPatch.manual_price_quota;
  }
  if (Object.prototype.hasOwnProperty.call(nextPatch, "price_quota")) {
    delete nextPatch.price_quota;
  }
  if (Object.prototype.hasOwnProperty.call(nextPatch, "discount_rate")) {
    nextPatch.discount_rate = normalizeDiscountRate(nextPatch.discount_rate);
  }

  Object.assign(product, nextPatch, { updated_at: now() });
  repriceDataProducts(data);
  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: product.id,
    action: AUDIT_ACTIONS.PRODUCT_UPDATE,
    detail: {
      ...nextPatch,
      ...(manualPrice !== undefined ? { manual_price_quota: Number(manualPrice) } : {}),
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
    action: AUDIT_ACTIONS.BUNDLE_UPDATE,
    detail: patch,
  });
  writeData(data);
  return clone(bundle);
}

function updateBundleSkuStatus(bundleId, status, actorUserId) {
  return updateBundleSku(bundleId, { status }, actorUserId);
}

function bulkUpdateProductStatus(productIds, status, actorUserId, requestId = null) {
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
      action: AUDIT_ACTIONS.PRODUCT_BULK_STATUS_UPDATE,
      detail: { product_ids: normalizedIds, status, updated_count: updatedCount, request_id: requestId },
    });
    writeData(data);
  }

  return { updated_count: updatedCount, status };
}

function bulkUpdateProducts(productIds, patch, actorUserId, requestId = null) {
  const data = readData();
  const normalizedIds = [...new Set(productIds.map((item) => Number(item)).filter(Boolean))];
  let updatedCount = 0;
  const nextPatch = { ...patch };
  const manualPrice =
    Object.prototype.hasOwnProperty.call(nextPatch, "manual_price_quota") &&
    Number.isInteger(Number(nextPatch.manual_price_quota))
      ? Number(nextPatch.manual_price_quota)
      : Object.prototype.hasOwnProperty.call(nextPatch, "price_quota") &&
        Number.isInteger(Number(nextPatch.price_quota))
      ? Number(nextPatch.price_quota)
      : null;

  if (Object.prototype.hasOwnProperty.call(nextPatch, "manual_price_quota")) {
    delete nextPatch.manual_price_quota;
  }
  if (Object.prototype.hasOwnProperty.call(nextPatch, "price_quota")) {
    delete nextPatch.price_quota;
  }
  if (Object.prototype.hasOwnProperty.call(nextPatch, "discount_rate")) {
    nextPatch.discount_rate = normalizeDiscountRate(nextPatch.discount_rate);
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
      action: AUDIT_ACTIONS.PRODUCT_BULK_UPDATE,
      detail: {
        product_ids: normalizedIds,
        patch: {
          ...nextPatch,
          ...(manualPrice !== null ? { manual_price_quota: manualPrice } : {}),
        },
        updated_count: updatedCount,
        request_id: requestId,
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
  return queryAdminUsers({ limit: null }).items;
}

function changeUserQuota(userId, changeAmount, remark, actorUserId) {
  return usersStore.changeUserQuota(userId, changeAmount, remark, actorUserId);
}

function createRechargeOrder(
  userId,
  {
    amountYuan,
    quotaAmount,
    transferAmount = null,
    transferUnit = null,
    transferTargetRoleId = null,
    transferTargetRoleName = null,
    paymentChannel = null,
    paymentReference,
    payerNote,
    orderType = "normal",
  }
) {
  return ordersStore.createRechargeOrder(userId, {
    amountYuan,
    quotaAmount,
    transferAmount,
    transferUnit,
    transferTargetRoleId,
    transferTargetRoleName,
    paymentChannel,
    paymentReference,
    payerNote,
    orderType,
  });
}

function createDrawServiceOrder(userId, { amountQuota }) {
  return ordersStore.createDrawServiceOrder(userId, { amountQuota });
}

function reviewRechargeOrder(rechargeOrderId, { status, adminRemark = null }, actorUserId) {
  return ordersStore.reviewRechargeOrder(rechargeOrderId, { status, adminRemark }, actorUserId);
}

function updateUserStatus(userId, status, actorUserId) {
  return usersStore.updateUserStatus(userId, status, actorUserId);
}

function createOrder(userId, itemId, itemKind = "card", { remark = null } = {}) {
  return ordersStore.createOrder(userId, itemId, itemKind, { remark });
}

function createGuestTransferOrder(
  itemId,
  itemKind = "card",
  {
    userId = null,
    gameRoleId,
    gameRoleName,
    nickname = null,
    amountYuan,
    transferAmount = null,
    paymentChannel = "alipay_qr",
    paymentReference,
    payerNote = null,
  } = {}
) {
  return ordersStore.createGuestTransferOrder(itemId, itemKind, {
    userId,
    gameRoleId,
    gameRoleName,
    nickname,
    amountYuan,
    transferAmount,
    paymentChannel,
    paymentReference,
    payerNote,
  });
}

function requestOrderCancellation(orderId, userId, remark = null) {
  return ordersStore.requestOrderCancellation(orderId, userId, remark);
}

function updateOrderStatus(orderId, status, remark, actorUserId, options = {}) {
  return ordersStore.updateOrderStatus(orderId, status, remark, actorUserId, options);
}

function updateOrderRemark(orderId, remark, actorUserId) {
  return ordersStore.updateOrderRemark(orderId, remark, actorUserId);
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
    action: AUDIT_ACTIONS.PRODUCT_MANUAL_PRICE_CLEAR,
    detail: null,
  });

  writeData(data);
  return clone(data.products.find((item) => item.id === Number(productId)));
}

function recalculatePricing(actorUserId = null, requestId = null) {
  const data = readData();
  repriceDataProducts(data);
  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: 0,
    action: AUDIT_ACTIONS.PRODUCT_PRICING_RECALCULATE,
    detail: { product_count: data.products.length, request_id: requestId },
  });
  writeData(data);
  return clone(data.products);
}

function createAuction(
  productId,
  {
    title = null,
    startingPriceQuota,
    minIncrementQuota,
    startsAt = null,
    endsAt,
    remark = null,
  },
  actorUserId
) {
  return auctionsStore.createAuction(
    productId,
    { title, startingPriceQuota, minIncrementQuota, startsAt, endsAt, remark },
    actorUserId
  );
}

function placeAuctionBid(auctionId, userId, amountQuota) {
  return auctionsStore.placeAuctionBid(auctionId, userId, amountQuota);
}

function settleAuction(auctionId, { remark = null, settlementMode = "offline" } = {}, actorUserId) {
  return auctionsStore.settleAuction(auctionId, { remark, settlementMode }, actorUserId);
}

function cancelAuction(auctionId, { reason = null, remark = null } = {}, actorUserId) {
  return auctionsStore.cancelAuction(auctionId, { reason, remark }, actorUserId);
}

function listAuditLogs({ keyword = "", action = "", limit = 200, offset = 0 } = {}) {
  return queryAdminAuditLogs({ keyword, action, limit, offset }).items;
}

function listQuotaLogs({ userId = null, keyword = "", type = "", limit = 200, offset = 0 } = {}) {
  return queryAdminQuotaLogs({ userId, keyword, type, limit, offset }).items;
}

configureStoreRuntime({
  readData,
  writeData,
  clone,
  now,
  nextId,
  paginateItems,
  buildAdminProductView,
  buildAdminProductQueryResult,
  hydrateOrders,
  hydrateRechargeOrders,
  hydrateSingleOrder,
  hydrateSingleRechargeOrder,
  filterOrdersForAdmin,
  filterRechargeOrdersForAdmin,
  filterAuditLogsForAdmin,
  filterQuotaLogsForAdmin,
  normalizeDiscountRate,
  buildCardSeasonMeta,
  getConfiguredCurrentSeasonScheduleId,
  getLineupSlotConfig,
  ensureLineupSlotRecord,
  getLineupSlotState,
  sanitizeUser,
  hashPassword,
  verifyPassword,
  getSignupSeedQuota,
  normalizeRechargeConfig,
  repriceDataProducts,
  buildRepriceSummary,
  buildRepriceFailureSummary,
  attachRepriceStatus,
  buildDefaultRechargeConfig,
  normalizeCardProduct,
  normalizeBundleSku,
  getAvailableProductStock,
  getAuctionBuyerLabel,
  hasConfirmedSaleRecord,
  ensureProductNotBlockedByAuction,
  refreshAuctionStatuses,
  getEffectiveQuotaPrice,
  getQuotaCashAmountFromStore,
  getSeasonMemberState,
  beginnerGuideRewardQuota: BEGINNER_GUIDE_REWARD_QUOTA,
  maybeGrantBeginnerGuideReward,
  getCurrentDrawSeasonLabel,
  isDrawServiceOrder,
  normalizeDrawAmountQuota,
  getDrawServiceSnapshot,
  calculateDrawServiceReward,
  drawServiceVideoNotice: DRAW_SERVICE_VIDEO_NOTICE,
  drawServiceRuleSummary: DRAW_SERVICE_RULE_SUMMARY,
  ensureQuotaAccount,
  applyQuotaChange,
  addAuditLog,
  addHelperActionLog,
  withQuota,
  fixedAdminAccount: FIXED_ADMIN_ACCOUNT,
  actions: {
    listProducts,
    getProductById,
    listAdminBundles,
    updateBundleSku,
    updateBundleSkuStatus,
    bulkUpdateProductStatus,
    bulkUpdateProducts,
    updateProduct,
    clearProductManualPrice,
    updateProductStatus,
    importCards,
    recalculatePricing,
    listRechargeOrders,
    createRechargeOrder,
    reviewRechargeOrder,
    updateOrderStatus,
    updateOrderRemark,
    createGuestTransferOrder,
    createOrder,
    createDrawServiceOrder,
    listAuctionBidSummariesForUser,
    placeAuctionBid,
    requestOrderCancellation,
    listOrders,
    createExternalOrder,
    registerPasswordUser,
    loginPasswordUser,
    bindUser,
    getUserById,
    getQuota,
    changeUserQuota,
    updateUserStatus,
    getRechargeConfig,
    updateRechargeConfig,
    updateSelfProfile,
    changeSelfPassword,
    purchaseLineupSlot,
    listAuctions,
    createAuction,
    settleAuction,
    cancelAuction,
  },
});

module.exports = {
  HELPER_SNAPSHOT_BASE_PER_USER,
  bindUser,
  registerPasswordUser,
  loginPasswordUser,
  getUserById,
  getHelperSnapshotLimitForUser,
  listHelperBindings,
  listHelperInventories,
  listMergedHelperInventoryItems,
  listHelperSnapshots,
  listHelperActionLogs,
  listProducts,
  getProductById,
  listBundleSkus,
  listAuctions,
  listAuctionBidSummariesForUser,
  getQuota,
  listOrders,
  listRechargeOrders,
  getRechargeConfig,
  importCards,
  listAdminProducts,
  listAdminBundles,
  queryAdminProducts,
  queryAdminBundles,
  queryAdminUsers,
  queryAdminOrders,
  queryAdminRechargeOrders,
  queryAdminQuotaLogs,
  queryAdminAuditLogs,
  getAdminOverview,
  updateProduct,
  updateProductStatus,
  updateBundleSku,
  updateBundleSkuStatus,
  bulkUpdateProductStatus,
  bulkUpdateProducts,
  clearProductManualPrice,
  recalculatePricing,
  createExternalOrder,
  createAuction,
  placeAuctionBid,
  settleAuction,
  cancelAuction,
  listUsers,
  changeUserQuota,
  updateUserStatus,
  updateSelfProfile,
  purchaseLineupSlot,
  upsertHelperBinding,
  upsertHelperInventory,
  pruneHelperInventories,
  resolveHelperBinding,
  removeHelperBinding,
  createHelperSnapshot,
  updateHelperSnapshot,
  removeHelperSnapshot,
  createHelperActionLog,
  changeSelfPassword,
  createOrder,
  createGuestTransferOrder,
  createDrawServiceOrder,
  createRechargeOrder,
  updateRechargeConfig,
  requestOrderCancellation,
  updateOrderStatus,
  updateOrderRemark,
  reviewRechargeOrder,
  listAuditLogs,
  listQuotaLogs,
};
