const fs = require("fs");
const path = require("path");
const { PRICE_CONFIG, buildOrderEvents, repriceProducts } = require("./pricing");
const { BUNDLE_SKU_SEEDS, RETIRED_BUNDLE_CODES } = require("../config/catalog-config");
const { hashPassword, verifyPassword } = require("./password-auth");
const { buildDefaultRechargeConfig, normalizeRechargeConfig } = require("../config/recharge-config");
const { getSignupSeedQuota } = require("../config/signup-seed-quota");

const defaultDataPath = path.resolve(__dirname, "..", "..", "dev-data.json");
const configuredDataPath = process.env.DEV_STORE_DATA_PATH
  ? path.resolve(process.cwd(), process.env.DEV_STORE_DATA_PATH)
  : null;
const dataPath =
  configuredDataPath && fs.existsSync(configuredDataPath)
    ? configuredDataPath
    : defaultDataPath;
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
  const pricedProducts = repriceProducts(
    data.products || [],
    buildOrderEvents(data.orders || [], data.orderItems || []),
    new Date(),
    { rechargeConfig: data.rechargeConfig || {} }
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
  if (normalizeLegacyCardNames(next)) {
    changed = true;
  }
  next.products = (next.products || []).map((product) => {
    const normalizedDiscountRate = normalizeDiscountRate(product?.discount_rate);
    const normalized = {
      ...product,
      manual_price_quota:
        product?.manual_price_quota === undefined ? null : product.manual_price_quota,
      discount_rate: normalizedDiscountRate,
      pricing_meta:
        product?.pricing_meta && typeof product.pricing_meta === "object"
          ? product.pricing_meta
          : {},
    };
    if (product && product.status === "draft") {
      changed = true;
      normalized.status = "on_sale";
    }
    if (
      product?.manual_price_quota === undefined ||
      product?.discount_rate === undefined ||
      Number(product?.discount_rate) !== normalizedDiscountRate ||
      !product?.pricing_meta
    ) {
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
      beginner_guide_reward:
        user?.beginner_guide_reward && typeof user.beginner_guide_reward === "object"
          ? user.beginner_guide_reward
          : null,
    };
    if (
      !user?.auth_provider ||
      user?.password_hash === undefined ||
      user?.beginner_guide_reward === undefined
    ) {
      changed = true;
    }
    return normalized;
  });
  next.auctions = (next.auctions || []).map((auction) => {
    const normalizedStatus = normalizeAuctionStatus(auction?.status);
    const normalized = {
      ...auction,
      item_kind: "card",
      title: String(auction?.title || "").trim() || null,
      current_price_quota: Number(
        auction?.current_price_quota || auction?.starting_price_quota || 0
      ),
      current_bid_user_id:
        auction?.current_bid_user_id === undefined || auction?.current_bid_user_id === null
          ? null
          : Number(auction.current_bid_user_id),
      current_bid_at: auction?.current_bid_at || null,
      settled_order_id:
        auction?.settled_order_id === undefined || auction?.settled_order_id === null
          ? null
          : Number(auction.settled_order_id),
      settled_at: auction?.settled_at || null,
      cancelled_at: auction?.cancelled_at || null,
      cancelled_reason: auction?.cancelled_reason || null,
      winning_bid_amount:
        auction?.winning_bid_amount === undefined || auction?.winning_bid_amount === null
          ? null
          : Number(auction.winning_bid_amount),
      winning_bid_user_id:
        auction?.winning_bid_user_id === undefined || auction?.winning_bid_user_id === null
          ? null
          : Number(auction.winning_bid_user_id),
      product_snapshot:
        auction?.product_snapshot && typeof auction.product_snapshot === "object"
          ? auction.product_snapshot
          : null,
      status: normalizedStatus,
    };
    if (
      auction?.status !== normalizedStatus ||
      auction?.item_kind !== "card" ||
      auction?.product_snapshot === undefined
    ) {
      changed = true;
    }
    return normalized;
  });
  next.auctionBids = (next.auctionBids || []).map((bid) => {
    const normalized = {
      ...bid,
      amount_quota: Number(bid?.amount_quota || 0),
      auction_id: Number(bid?.auction_id || 0),
      user_id: Number(bid?.user_id || 0),
    };
    if (
      Number(bid?.amount_quota || 0) !== normalized.amount_quota ||
      Number(bid?.auction_id || 0) !== normalized.auction_id ||
      Number(bid?.user_id || 0) !== normalized.user_id
    ) {
      changed = true;
    }
    return normalized;
  });
  next.rechargeConfig = normalizeRechargeConfig(next.rechargeConfig || {});
  if (refreshAuctionStatuses(next)) {
    changed = true;
  }
  if (backfillBeginnerGuideRewards(next)) {
    changed = true;
  }

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
      String(item.status || "") === "approved"
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
    type: "beginner_guide_reward",
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
    action: "beginner_guide_reward_grant",
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

function normalizeCardProduct(product) {
  const basePriceQuota = Number(product?.price_quota || 0);
  const discountRate = normalizeDiscountRate(product?.discount_rate);
  const effectivePriceQuota = getEffectiveQuotaPrice(basePriceQuota, discountRate);
  return {
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
  repriceDataProducts(data);

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
        residual_instructions: nextConfig.residual_instructions,
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
  const cards = data.products.filter((item) => {
    if (!publicOnly) return true;
    if (item.status !== "on_sale") return false;
    return getAvailableProductStock(data, item) > 0;
  });
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
  if (publicOnly && product && getAvailableProductStock(data, product) <= 0) {
    return null;
  }
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
      game_role_id: user?.game_role_id || order?.guest_game_role_id || null,
      game_server: user?.game_server || order?.guest_game_server || null,
      game_role_name: user?.game_role_name || order?.guest_game_role_name || null,
      nickname: user?.nickname || order?.guest_nickname || null,
      order_source: order?.order_source || "mall",
      buyer_label: order?.buyer_label || null,
      items: clone(data.orderItems.filter((item) => item.order_id === order.id)),
    };
  });
}

function hydrateRechargeOrders(data, rechargeOrders) {
  return rechargeOrders.map((order) => {
    const user = data.users.find((item) => item.id === order.user_id);
    const reviewer = data.users.find((item) => item.id === order.reviewed_by);
    const orderTitle =
      order.order_type === "season_member"
        ? "赛季会员"
        : order.order_type === "residual_transfer"
          ? "残卷转赠"
          : "普通充值";
    return {
      ...clone(order),
      order_title: orderTitle,
      game_role_id: user?.game_role_id || null,
      game_server: user?.game_server || null,
      game_role_name: user?.game_role_name || null,
      nickname: user?.nickname || null,
      reviewer_role_name: reviewer?.game_role_name || null,
    };
  });
}

function hydrateAuction(data, auction, { publicView = false } = {}) {
  const product = (data.products || []).find((item) => Number(item.id) === Number(auction.product_id));
  const snapshotBase =
    auction?.product_snapshot && typeof auction.product_snapshot === "object"
      ? auction.product_snapshot
      : product;
  const item = snapshotBase
    ? normalizeCardProduct({ ...snapshotBase, id: Number(auction.product_id) })
    : null;
  const bids = (data.auctionBids || [])
    .filter((bid) => Number(bid.auction_id) === Number(auction.id))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const leadingUser = (data.users || []).find(
    (user) => Number(user.id) === Number(auction.current_bid_user_id)
  );
  const leadingAccount = leadingUser ? ensureQuotaAccount(data, Number(leadingUser.id)) : null;
  const nextMinBidQuota = auction.current_bid_user_id
    ? Number(auction.current_price_quota || 0) + Number(auction.min_increment_quota || 0)
    : Number(auction.starting_price_quota || 0);
  const winningAmount = Number(auction.current_price_quota || auction.starting_price_quota || 0);
  const base = {
    ...clone(auction),
    item,
    bid_count: bids.length,
    next_min_bid_quota: nextMinBidQuota,
    leading_bidder_label: leadingUser ? getAuctionBuyerLabel(leadingUser) : "无",
    current_bid_user_name: leadingUser?.game_role_name || null,
    current_bid_user_game_role_id: leadingUser?.game_role_id || null,
    current_bid_user_quota_balance: leadingAccount ? Number(leadingAccount.balance || 0) : null,
    winning_amount_quota: winningAmount,
    can_direct_settle: leadingAccount ? Number(leadingAccount.balance || 0) >= winningAmount : false,
  };

  if (publicView) {
    delete base.product_snapshot;
    delete base.created_by;
    delete base.current_bid_user_id;
    delete base.current_bid_user_name;
    delete base.current_bid_user_game_role_id;
    delete base.current_bid_user_quota_balance;
    delete base.can_direct_settle;
    delete base.winning_bid_user_id;
    return base;
  }

  return {
    ...base,
    bids: bids.map((bid) => {
      const bidUser = (data.users || []).find((user) => Number(user.id) === Number(bid.user_id));
      return {
        ...clone(bid),
        game_role_id: bidUser?.game_role_id || null,
        game_role_name: bidUser?.game_role_name || null,
        nickname: bidUser?.nickname || null,
      };
    }),
  };
}

function listAuctions({ status = "all", auctionId = null, publicView = false } = {}) {
  const data = readData();
  let auctions = (data.auctions || []).slice();

  if (auctionId !== null && auctionId !== undefined) {
    auctions = auctions.filter((auction) => Number(auction.id) === Number(auctionId));
  }
  if (status && status !== "all") {
    auctions = auctions.filter(
      (auction) => String(auction.status || "").trim() === String(status).trim()
    );
  }

  const statusOrder = {
    live: 0,
    scheduled: 1,
    ended: 2,
    settled: 3,
    cancelled: 4,
  };
  auctions.sort(
    (a, b) =>
      Number(statusOrder[String(a.status || "").trim()] ?? 9) -
        Number(statusOrder[String(b.status || "").trim()] ?? 9) ||
      String(a.ends_at || "").localeCompare(String(b.ends_at || "")) ||
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
  );

  return clone(auctions.map((auction) => hydrateAuction(data, auction, { publicView })));
}

function listAuctionBidSummariesForUser(userId) {
  const data = readData();
  const bids = (data.auctionBids || []).filter((bid) => Number(bid.user_id) === Number(userId));
  const grouped = new Map();

  bids.forEach((bid) => {
    const auctionId = Number(bid.auction_id);
    const current = grouped.get(auctionId) || {
      auction_id: auctionId,
      latest_bid_amount: 0,
      highest_bid_amount: 0,
      latest_bid_at: null,
    };
    const amount = Number(bid.amount_quota || 0);
    if (amount >= current.highest_bid_amount) {
      current.highest_bid_amount = amount;
    }
    if (!current.latest_bid_at || String(bid.created_at).localeCompare(String(current.latest_bid_at)) > 0) {
      current.latest_bid_at = bid.created_at;
      current.latest_bid_amount = amount;
    }
    grouped.set(auctionId, current);
  });

  return clone(
    [...grouped.values()].map((entry) => {
      const auction = (data.auctions || []).find((item) => Number(item.id) === Number(entry.auction_id));
      return {
        ...entry,
        status: auction?.status || null,
        current_price_quota: Number(auction?.current_price_quota || 0),
        is_leading: Number(auction?.current_bid_user_id || 0) === Number(userId),
      };
    })
  );
}

function listBundleSkus({ publicOnly = false } = {}) {
  const data = readData();
  const bundles = (data.bundleSkus || [])
    .filter((item) => (!publicOnly || item.status === "on_sale"))
    .sort((a, b) => Number(a.display_rank || 999) - Number(b.display_rank || 999));
  return clone(bundles.map(normalizeBundleSku));
}

function listOrders({
  userId = null,
  orderId = null,
  status = null,
  keyword = "",
  limit = 100,
  offset = 0,
} = {}) {
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
        order?.buyer_label,
        order?.order_source,
        order?.remark,
        order?.guest_game_role_id,
        order?.guest_game_role_name,
        order?.guest_nickname,
        order?.payment_reference,
        order?.payment_channel,
        String(order?.payment_amount_yuan || ""),
        user?.game_role_id,
        user?.game_server,
        user?.game_role_name,
        user?.nickname,
        ...items.map((item) => item.product_name),
        ...items.map((item) => String(item.product_id)),
        ...items.map((item) => String(item.bundle_sku_id)),
        ...items.map((item) => item.item_kind),
        JSON.stringify(order?.draw_service || {}),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }
  orders.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const normalizedOffset = Math.max(Number(offset) || 0, 0);
  const end = limit === null ? undefined : normalizedOffset + Math.max(Number(limit) || 0, 0);
  return hydrateOrders(data, orders.slice(normalizedOffset, end));
}

function createExternalOrder(
  itemId,
  itemKind = "card",
  { buyerLabel, remark = null } = {},
  actorUserId
) {
  const data = readData();
  const isBundle = itemKind === "bundle";
  const item = isBundle
    ? (data.bundleSkus || []).find((bundle) => bundle.id === Number(itemId))
    : data.products.find((product) => product.id === Number(itemId));

  if (!item) {
    const err = new Error(isBundle ? "bundle_not_found" : "product_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (!isBundle) {
    ensureProductNotBlockedByAuction(data, item.id, "product_in_auction");
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

  const effectivePriceQuota = getEffectiveQuotaPrice(item.price_quota, item.discount_rate);

  const order = {
    id: nextId(data.orders),
    user_id: null,
    total_quota: effectivePriceQuota,
    status: "confirmed",
    remark: remark || null,
    order_source: "external",
    buyer_label: String(buyerLabel || "").trim(),
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
    price_quota: effectivePriceQuota,
    created_at: now(),
  });

  if (isBundle) {
    if (item.stock !== null && item.stock !== undefined) {
      item.stock = Number(item.stock) - 1;
      if (item.stock <= 0) item.status = "sold";
    }
    item.updated_at = now();
  } else {
    item.stock = Number(item.stock) - 1;
    if (item.stock <= 0) item.status = "sold";
    item.updated_at = now();
  }

  addAuditLog(data, {
    actorUserId,
    targetType: "order",
    targetId: order.id,
    action: "external_order_create",
    detail: {
      item_kind: itemKind,
      item_id: item.id,
      total_quota: effectivePriceQuota,
      buyer_label: order.buyer_label,
      remark: order.remark,
    },
  });

  repriceDataProducts(data);
  writeData(data);
  return listOrders({ orderId: order.id, limit: 1 })[0];
}

function listRechargeOrders({
  userId = null,
  rechargeOrderId = null,
  status = null,
  keyword = "",
  limit = 100,
  offset = 0,
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
  const normalizedOffset = Math.max(Number(offset) || 0, 0);
  const end = limit === null ? undefined : normalizedOffset + Math.max(Number(limit) || 0, 0);
  return hydrateRechargeOrders(data, rechargeOrders.slice(normalizedOffset, end));
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
    action: "cards_import",
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
  const data = readData();
  return clone(
    data.products
      .map((product) => {
        const blockingAuction = getBlockingAuctionForProduct(data, product.id);
        const imported = data.productImports.find((item) => item.id === product.import_id);
        const basePriceQuota = Number(product.price_quota || 0);
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
  if (Object.prototype.hasOwnProperty.call(nextPatch, "discount_rate")) {
    nextPatch.discount_rate = normalizeDiscountRate(nextPatch.discount_rate);
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
  if (normalizedOrderType === "residual_transfer" && !config.residual_transfer_enabled) {
    const err = new Error("residual_transfer_disabled");
    err.statusCode = 400;
    throw err;
  }
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
    (normalizedOrderType === "normal" || normalizedOrderType === "residual_transfer") &&
    memberState.active
      ? Math.floor(baseQuotaAmount * Number(config.season_member_bonus_rate || 0))
      : 0;
  const normalizedPaymentChannel =
    normalizedOrderType === "residual_transfer"
      ? "game_residual_transfer"
      : String(paymentChannel || "").trim() === "wechat_qr"
        ? "wechat_qr"
        : "alipay_qr";

  const rechargeOrder = {
    id: nextId(data.rechargeOrders || []),
    user_id: Number(userId),
    channel: normalizedPaymentChannel,
    order_type: normalizedOrderType,
    amount_yuan: Number(amountYuan),
    transfer_amount:
      normalizedOrderType === "residual_transfer" ? Number(transferAmount || amountYuan || 0) : null,
    transfer_unit:
      normalizedOrderType === "residual_transfer" ? String(transferUnit || config.residual_unit_label || "残卷") : null,
    transfer_target_role_id:
      normalizedOrderType === "residual_transfer"
        ? String(transferTargetRoleId || config.residual_admin_role_id || "584967604")
        : null,
    transfer_target_role_name:
      normalizedOrderType === "residual_transfer"
        ? String(transferTargetRoleName || config.residual_admin_role_name || "admin残卷")
        : null,
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
      transfer_amount: rechargeOrder.transfer_amount,
      transfer_unit: rechargeOrder.transfer_unit,
      quota_amount: rechargeOrder.quota_amount,
      order_type: rechargeOrder.order_type,
      channel: rechargeOrder.channel,
    },
  });
  writeData(data);
  return listRechargeOrders({ rechargeOrderId: rechargeOrder.id, userId: Number(userId), limit: 1 })[0];
}

function createDrawServiceOrder(userId, { amountQuota }) {
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

  const normalizedAmount = normalizeDrawAmountQuota(amountQuota);
  if (!normalizedAmount) {
    const err = new Error("draw_amount_quota_invalid");
    err.statusCode = 400;
    throw err;
  }

  applyQuotaChange(data, {
    userId,
    changeAmount: -normalizedAmount,
    type: "order_deduct",
    remark: `draw_service_order_create:${normalizedAmount}`,
  });

  const drawService = {
    amount_quota: normalizedAmount,
    season_label: getCurrentDrawSeasonLabel(data),
    returned_cards_text: null,
    best_gold_card: null,
    rebate_quota: 0,
    reward_summary: null,
    reward_milestones: 0,
    atlas_bonus_granted: false,
    atlas_bonus_label: null,
    video_notice: DRAW_SERVICE_VIDEO_NOTICE,
    rule_summary: DRAW_SERVICE_RULE_SUMMARY,
    settled_at: null,
  };

  const order = {
    id: nextId(data.orders),
    user_id: Number(userId),
    total_quota: normalizedAmount,
    status: "pending",
    remark: null,
    order_source: "draw_service",
    draw_service: drawService,
    created_at: now(),
    updated_at: now(),
  };
  data.orders.push(order);

  data.orderItems.push({
    id: nextId(data.orderItems),
    order_id: order.id,
    item_kind: "service",
    product_id: null,
    bundle_sku_id: null,
    product_name: `代抽 ${normalizedAmount} 额度`,
    product_snapshot: getDrawServiceSnapshot(drawService),
    price_quota: normalizedAmount,
    created_at: now(),
  });

  const quotaLog = data.quotaLogs[data.quotaLogs.length - 1];
  if (quotaLog && quotaLog.type === "order_deduct" && !quotaLog.order_id) {
    quotaLog.order_id = order.id;
  }

  addAuditLog(data, {
    actorUserId: Number(userId),
    targetType: "order",
    targetId: order.id,
    action: "draw_service_order_create",
    detail: {
      amount_quota: normalizedAmount,
      season_label: drawService.season_label,
    },
  });

  writeData(data);
  return listOrders({ orderId: order.id, userId: Number(userId), limit: 1 })[0];
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
        type:
          rechargeOrder.order_type === "residual_transfer"
            ? "residual_transfer_credit"
            : "recharge_credit",
        remark: rechargeOrder.admin_remark || `recharge_order#${rechargeOrder.id}`,
        bonusAmount: Number(rechargeOrder.bonus_quota_amount || 0),
      });
    }
    maybeGrantBeginnerGuideReward(data, rechargeOrder.user_id, actorUserId, "recharge_approved");
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
      transfer_amount: rechargeOrder.transfer_amount,
      transfer_unit: rechargeOrder.transfer_unit,
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
  if (!isBundle) {
    ensureProductNotBlockedByAuction(data, item.id, "product_in_auction");
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

  const effectivePriceQuota = getEffectiveQuotaPrice(item.price_quota, item.discount_rate);

  applyQuotaChange(data, {
    userId,
    changeAmount: -effectivePriceQuota,
    type: "order_deduct",
    remark: `order create for ${itemKind} ${item.id}`,
  });

  const order = {
    id: nextId(data.orders),
    user_id: Number(userId),
    total_quota: effectivePriceQuota,
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
    price_quota: effectivePriceQuota,
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
    detail: { item_kind: itemKind, item_id: item.id, total_quota: effectivePriceQuota },
  });

  repriceDataProducts(data);
  writeData(data);
  return listOrders({ orderId: order.id, userId: Number(userId), limit: 1 })[0];
}

function createGuestTransferOrder(
  itemId,
  itemKind = "card",
  {
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
  const data = readData();
  const isBundle = itemKind === "bundle";
  const item = isBundle
    ? (data.bundleSkus || []).find((bundle) => bundle.id === Number(itemId))
    : data.products.find((product) => product.id === Number(itemId));

  if (!item) {
    const err = new Error(isBundle ? "bundle_not_found" : "product_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (!isBundle) {
    ensureProductNotBlockedByAuction(data, item.id, "product_in_auction");
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

  const effectivePriceQuota = getEffectiveQuotaPrice(item.price_quota, item.discount_rate);
  const normalizedPaymentChannel =
    String(paymentChannel || "").trim() === "wechat_qr"
      ? "wechat_qr"
      : String(paymentChannel || "").trim() === "game_residual_transfer"
        ? "game_residual_transfer"
        : "alipay_qr";
  const normalizedAmountYuan =
    normalizedPaymentChannel === "game_residual_transfer"
      ? null
      : Number(Number(amountYuan || 0).toFixed(2));
  const config = normalizeRechargeConfig(data?.rechargeConfig || buildDefaultRechargeConfig());
  const expectedAmountYuan = getQuotaCashAmountFromStore(data, effectivePriceQuota);
  const normalizedTransferAmount =
    normalizedPaymentChannel === "game_residual_transfer"
      ? Math.max(Number(transferAmount || 0), 0)
      : null;
  const expectedTransferAmount =
    normalizedPaymentChannel === "game_residual_transfer"
      ? Math.ceil(effectivePriceQuota / Math.max(Number(config.residual_quota_per_unit || 1), 1))
      : null;

  if (normalizedPaymentChannel === "game_residual_transfer") {
    if (!config.residual_transfer_enabled) {
      const err = new Error("residual_transfer_disabled");
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isInteger(normalizedTransferAmount) || normalizedTransferAmount <= 0) {
      const err = new Error("transfer_amount_invalid");
      err.statusCode = 400;
      throw err;
    }
    if (normalizedTransferAmount !== expectedTransferAmount) {
      const err = new Error("transfer_amount_mismatch");
      err.statusCode = 400;
      err.payload = {
        expected_transfer_amount: expectedTransferAmount,
        transfer_unit: config.residual_unit_label || "残卷",
      };
      throw err;
    }
  } else if (
    !Number.isFinite(normalizedAmountYuan) ||
    normalizedAmountYuan <= 0 ||
    Math.abs(normalizedAmountYuan - expectedAmountYuan) > 0.01
  ) {
    const err = new Error("amount_yuan_mismatch");
    err.statusCode = 400;
    err.payload = { expected_amount_yuan: expectedAmountYuan };
    throw err;
  }

  const order = {
    id: nextId(data.orders),
    user_id: null,
    total_quota: effectivePriceQuota,
    status: "pending",
    remark: payerNote ? String(payerNote).trim() : null,
    order_source: "guest_transfer",
    buyer_label: String(gameRoleName || "").trim(),
    guest_game_role_id: String(gameRoleId || "").trim(),
    guest_game_role_name: String(gameRoleName || "").trim(),
    guest_game_server: null,
    guest_nickname: nickname ? String(nickname).trim() : null,
    payment_channel: normalizedPaymentChannel,
    payment_reference: String(paymentReference || "").trim(),
    payment_amount_yuan: normalizedAmountYuan,
    transfer_amount: normalizedTransferAmount,
    transfer_unit:
      normalizedPaymentChannel === "game_residual_transfer"
        ? String(config.residual_unit_label || "残卷")
        : null,
    transfer_target_role_id:
      normalizedPaymentChannel === "game_residual_transfer"
        ? String(config.residual_admin_role_id || "584967604")
        : null,
    transfer_target_role_name:
      normalizedPaymentChannel === "game_residual_transfer"
        ? String(config.residual_admin_role_name || "admin残卷")
        : null,
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
    price_quota: effectivePriceQuota,
    created_at: now(),
  });

  if (isBundle) {
    if (item.stock !== null && item.stock !== undefined) {
      item.stock = Number(item.stock) - 1;
      if (item.stock <= 0) item.status = "sold";
    }
    item.updated_at = now();
  } else {
    item.stock = Number(item.stock) - 1;
    if (item.stock <= 0) item.status = "sold";
    item.updated_at = now();
  }

  addAuditLog(data, {
    actorUserId: null,
    targetType: "order",
    targetId: order.id,
    action: "guest_transfer_order_create",
    detail: {
      item_kind: itemKind,
      item_id: item.id,
      total_quota: effectivePriceQuota,
      game_role_id: order.guest_game_role_id,
      game_role_name: order.guest_game_role_name,
      payment_channel: order.payment_channel,
      payment_amount_yuan: order.payment_amount_yuan,
      transfer_amount: order.transfer_amount,
      transfer_unit: order.transfer_unit,
    },
  });

  repriceDataProducts(data);
  writeData(data);
  return listOrders({ orderId: order.id, limit: 1 })[0];
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

function updateOrderStatus(orderId, status, remark, actorUserId, options = {}) {
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
    if (order.user_id !== null && order.user_id !== undefined) {
      applyQuotaChange(data, {
        userId: order.user_id,
        changeAmount: Number(order.total_quota),
        type: "order_refund",
        orderId: order.id,
        remark: remark || "admin cancel order",
      });
    }
  }

  order.status = status;
  order.remark = remark || null;
  order.updated_at = now();
  if (status === "confirmed" && previousStatus !== "confirmed" && isDrawServiceOrder(order)) {
    const returnedCardsText = String(options.returnedCardsText || "").trim();
    const bestGoldCard = String(options.bestGoldCard || "").trim();
    if (!returnedCardsText) {
      const err = new Error("draw_returned_cards_required");
      err.statusCode = 400;
      throw err;
    }

    const reward = calculateDrawServiceReward(data, order);
    if (reward.grantsAtlasBonus && !bestGoldCard) {
      const err = new Error("draw_best_gold_card_required");
      err.statusCode = 400;
      throw err;
    }

    order.draw_service = {
      ...(order.draw_service || {}),
      season_label: reward.seasonLabel,
      returned_cards_text: returnedCardsText,
      best_gold_card: bestGoldCard || null,
      rebate_quota: reward.rebateQuota,
      reward_summary: reward.rewardSummary,
      reward_milestones: reward.crossedMilestones,
      atlas_bonus_granted: reward.grantsAtlasBonus,
      atlas_bonus_label: reward.atlasBonusLabel,
      season_total_before: reward.previousTotal,
      season_total_after: reward.nextTotal,
      video_notice: DRAW_SERVICE_VIDEO_NOTICE,
      settled_at: now(),
    };

    if (reward.rebateQuota > 0) {
      applyQuotaChange(data, {
        userId: order.user_id,
        changeAmount: reward.rebateQuota,
        type: "draw_service_rebate",
        orderId: order.id,
        remark: reward.rewardSummary,
        bonusAmount: 0,
      });
    }
  }
  if (status === "confirmed" && previousStatus !== "confirmed") {
    maybeGrantBeginnerGuideReward(data, order.user_id, actorUserId, "order_confirmed");
  }

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
  const data = readData();
  const product = data.products.find((item) => Number(item.id) === Number(productId));
  if (!product) {
    const err = new Error("product_not_found");
    err.statusCode = 404;
    throw err;
  }
  const productStatus = String(product.status || "").trim();
  const canAuctionOffSale =
    productStatus === "off_sale" && Number(product.stock) > 0 && !hasConfirmedSaleRecord(data, product.id);
  if (productStatus !== "on_sale" && !canAuctionOffSale) {
    const err = new Error("product_not_on_sale");
    err.statusCode = 400;
    throw err;
  }
  if (Number(product.stock) <= 0) {
    const err = new Error("product_out_of_stock");
    err.statusCode = 400;
    throw err;
  }
  ensureProductNotBlockedByAuction(data, product.id, "product_in_auction");

  const normalizedStartingPrice = Number(startingPriceQuota);
  const normalizedIncrement = Number(minIncrementQuota);
  const startValue = startsAt ? new Date(startsAt) : new Date();
  const endValue = new Date(endsAt);
  if (!Number.isInteger(normalizedStartingPrice) || normalizedStartingPrice <= 0) {
    const err = new Error("auction_starting_price_invalid");
    err.statusCode = 400;
    throw err;
  }
  if (!Number.isInteger(normalizedIncrement) || normalizedIncrement <= 0) {
    const err = new Error("auction_min_increment_invalid");
    err.statusCode = 400;
    throw err;
  }
  if (Number.isNaN(startValue.getTime()) || Number.isNaN(endValue.getTime())) {
    const err = new Error("auction_time_invalid");
    err.statusCode = 400;
    throw err;
  }
  if (endValue.getTime() <= startValue.getTime()) {
    const err = new Error("auction_end_before_start");
    err.statusCode = 400;
    throw err;
  }

  const auction = {
    id: nextId(data.auctions || []),
    item_kind: "card",
    product_id: Number(product.id),
    title: String(title || "").trim() || product.name,
    remark: remark ? String(remark).trim() : null,
    status: startValue.getTime() > Date.now() ? "scheduled" : "live",
    product_snapshot: clone(product),
    starting_price_quota: normalizedStartingPrice,
    min_increment_quota: normalizedIncrement,
    current_price_quota: normalizedStartingPrice,
    current_bid_user_id: null,
    current_bid_at: null,
    starts_at: startValue.toISOString(),
    ends_at: endValue.toISOString(),
    settled_order_id: null,
    settled_at: null,
    cancelled_at: null,
    cancelled_reason: null,
    winning_bid_amount: null,
    winning_bid_user_id: null,
    created_by: Number(actorUserId),
    created_at: now(),
    updated_at: now(),
  };
  data.auctions.push(auction);

  addAuditLog(data, {
    actorUserId,
    targetType: "auction",
    targetId: auction.id,
    action: "auction_create",
    detail: {
      product_id: Number(product.id),
      starting_price_quota: normalizedStartingPrice,
      min_increment_quota: normalizedIncrement,
      starts_at: auction.starts_at,
      ends_at: auction.ends_at,
    },
  });

  writeData(data);
  return listAuctions({ auctionId: auction.id })[0];
}

function placeAuctionBid(auctionId, userId, amountQuota) {
  const data = readData();
  const user = data.users.find((item) => Number(item.id) === Number(userId));
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

  refreshAuctionStatuses(data);
  const auction = (data.auctions || []).find((item) => Number(item.id) === Number(auctionId));
  if (!auction) {
    const err = new Error("auction_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (String(auction.status || "") !== "live") {
    const err = new Error("auction_not_live");
    err.statusCode = 400;
    throw err;
  }

  const normalizedAmount = Number(amountQuota);
  if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
    const err = new Error("auction_bid_amount_invalid");
    err.statusCode = 400;
    throw err;
  }
  const nextMinBidQuota = auction.current_bid_user_id
    ? Number(auction.current_price_quota || 0) + Number(auction.min_increment_quota || 0)
    : Number(auction.starting_price_quota || 0);
  if (normalizedAmount < nextMinBidQuota) {
    const err = new Error("auction_bid_too_low");
    err.statusCode = 400;
    err.payload = { next_min_bid_quota: nextMinBidQuota };
    throw err;
  }

  const bid = {
    id: nextId(data.auctionBids || []),
    auction_id: Number(auction.id),
    user_id: Number(userId),
    amount_quota: normalizedAmount,
    created_at: now(),
  };
  data.auctionBids.push(bid);
  auction.current_price_quota = normalizedAmount;
  auction.current_bid_user_id = Number(userId);
  auction.current_bid_at = bid.created_at;
  auction.updated_at = now();

  addAuditLog(data, {
    actorUserId: Number(userId),
    targetType: "auction",
    targetId: Number(auction.id),
    action: "auction_bid_create",
    detail: {
      amount_quota: normalizedAmount,
      next_min_bid_quota: normalizedAmount + Number(auction.min_increment_quota || 0),
    },
  });

  writeData(data);
  return listAuctions({ auctionId: auction.id, publicView: true })[0];
}

function settleAuction(auctionId, { remark = null, settlementMode = "offline" } = {}, actorUserId) {
  const data = readData();
  refreshAuctionStatuses(data);
  const auction = (data.auctions || []).find((item) => Number(item.id) === Number(auctionId));
  if (!auction) {
    const err = new Error("auction_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (!["ended", "live"].includes(String(auction.status || "").trim())) {
    const err = new Error("auction_settle_not_allowed");
    err.statusCode = 400;
    throw err;
  }
  if (String(auction.status || "").trim() === "live" && new Date(auction.ends_at).getTime() > Date.now()) {
    const err = new Error("auction_not_ended");
    err.statusCode = 400;
    throw err;
  }
  if (!auction.current_bid_user_id) {
    const err = new Error("auction_no_bids");
    err.statusCode = 400;
    throw err;
  }

  const product = data.products.find((item) => Number(item.id) === Number(auction.product_id));
  if (!product) {
    const err = new Error("product_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (Number(product.stock) <= 0) {
    const err = new Error("product_out_of_stock");
    err.statusCode = 400;
    throw err;
  }

  const winningAmount = Number(auction.current_price_quota || auction.starting_price_quota || 0);
  const normalizedSettlementMode =
    String(settlementMode || "").trim() === "direct_quota" ? "direct_quota" : "offline";

  if (normalizedSettlementMode === "direct_quota") {
    applyQuotaChange(data, {
      userId: Number(auction.current_bid_user_id),
      changeAmount: -winningAmount,
      type: "order_deduct",
      remark: `auction_settle:${auction.id}`,
      bonusAmount: 0,
    });
  }

  const order = {
    id: nextId(data.orders),
    user_id: Number(auction.current_bid_user_id),
    total_quota: winningAmount,
    status: "confirmed",
    remark: remark ? String(remark).trim() : null,
    order_source: "auction",
    auction_id: Number(auction.id),
    payment_mode: normalizedSettlementMode,
    created_at: now(),
    updated_at: now(),
  };
  data.orders.push(order);

  data.orderItems.push({
    id: nextId(data.orderItems),
    order_id: order.id,
    item_kind: "card",
    product_id: Number(product.id),
    bundle_sku_id: null,
    product_name: product.name,
    product_snapshot: clone(product),
    price_quota: winningAmount,
    created_at: now(),
  });

  if (normalizedSettlementMode === "direct_quota") {
    const quotaLog = data.quotaLogs[data.quotaLogs.length - 1];
    if (quotaLog && quotaLog.type === "order_deduct" && !quotaLog.order_id) {
      quotaLog.order_id = order.id;
    }
  }

  product.stock = Number(product.stock) - 1;
  product.updated_at = now();
  if (product.stock <= 0) {
    product.status = "sold";
  }

  auction.status = "settled";
  auction.settled_order_id = Number(order.id);
  auction.settled_at = now();
  auction.winning_bid_amount = winningAmount;
  auction.winning_bid_user_id = Number(auction.current_bid_user_id);
  auction.remark = remark ? String(remark).trim() : auction.remark || null;
  auction.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "auction",
    targetId: Number(auction.id),
    action: "auction_settle",
    detail: {
      order_id: Number(order.id),
      product_id: Number(product.id),
      winning_bid_amount: winningAmount,
      winning_bid_user_id: Number(auction.current_bid_user_id),
      settlement_mode: normalizedSettlementMode,
    },
  });

  repriceDataProducts(data);
  writeData(data);
  return listAuctions({ auctionId: auction.id })[0];
}

function cancelAuction(auctionId, { reason = null, remark = null } = {}, actorUserId) {
  const data = readData();
  refreshAuctionStatuses(data);
  const auction = (data.auctions || []).find((item) => Number(item.id) === Number(auctionId));
  if (!auction) {
    const err = new Error("auction_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (["settled", "cancelled"].includes(String(auction.status || "").trim())) {
    const err = new Error("auction_cancel_not_allowed");
    err.statusCode = 400;
    throw err;
  }

  auction.status = "cancelled";
  auction.cancelled_at = now();
  auction.cancelled_reason = reason ? String(reason).trim() : null;
  auction.remark = remark ? String(remark).trim() : auction.remark || null;
  auction.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "auction",
    targetId: Number(auction.id),
    action: "auction_cancel",
    detail: {
      reason: auction.cancelled_reason,
      remark: auction.remark,
      bid_count: Number(
        (data.auctionBids || []).filter((bid) => Number(bid.auction_id) === Number(auction.id)).length
      ),
    },
  });

  writeData(data);
  return listAuctions({ auctionId: auction.id })[0];
}

function listAuditLogs({ keyword = "", action = "", limit = 200, offset = 0 } = {}) {
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
  const normalizedOffset = Math.max(Number(offset) || 0, 0);
  const end = limit === null ? undefined : normalizedOffset + Math.max(Number(limit) || 0, 0);

  return clone(
    logs.slice(normalizedOffset, end).map((log) => {
      const actor = data.users.find((item) => item.id === log.actor_user_id);
      return {
        ...log,
        actor_role_name: actor?.game_role_name || null,
        actor_nickname: actor?.nickname || null,
      };
    })
  );
}

function listQuotaLogs({ userId = null, keyword = "", type = "", limit = 200, offset = 0 } = {}) {
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
  const normalizedOffset = Math.max(Number(offset) || 0, 0);
  const end = limit === null ? undefined : normalizedOffset + Math.max(Number(limit) || 0, 0);

  return clone(
    logs.slice(normalizedOffset, end).map((log) => {
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
  listAuctions,
  listAuctionBidSummariesForUser,
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
  createExternalOrder,
  createAuction,
  placeAuctionBid,
  settleAuction,
  cancelAuction,
  listUsers,
  changeUserQuota,
  updateUserStatus,
  updateSelfProfile,
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
