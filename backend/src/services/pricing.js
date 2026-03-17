const { LEGACY_CAPS } = require("../config/catalog-config");

const PRICE_CONFIG = {
  version: "pricing_v3",
  marketFactor: {
    min: 0.5,
    max: 4.0,
  },
  floorMultiplier: 2,
  tierRules: {
    green: {
      salvageQuota: 50,
      fullAtlasAnchor: 600,
      atlasExponent: 2.4,
      monotonicStep: 0,
    },
    blue: {
      salvageQuota: 60,
      fullAtlasAnchor: 1000,
      atlasExponent: 3.2,
      monotonicStep: 50,
    },
    purple: {
      salvageQuota: 60,
      fullAtlasAnchor: 600,
      doubleFullAtlasAnchor: 1500,
      atlasExponent: 3.4,
      monotonicStep: 50,
      wearMultiplier: 0.08,
    },
    orange: {
      salvageQuota: 80,
      fullAtlasAnchor: 800,
      doubleFullAtlasAnchor: 2500,
      atlasExponent: 3.6,
      monotonicStep: 50,
      wearMultiplier: 0.13,
    },
    red: {
      salvageQuota: 100,
      fullAtlasAnchor: 3000,
      doubleFullAtlasAnchor: 12000,
      atlasExponent: 4.1,
      monotonicStep: 50,
      wearMultiplier: 0.48,
    },
    gold: {
      salvageQuota: 200,
      fullAtlasAnchor: 50000,
      atlasExponent: 4.8,
      monotonicStep: 50,
      wearMultiplier: 1,
    },
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function roundPrice(value) {
  const num = Math.max(0, Number(value) || 0);
  if (num < 1000) return Math.round(num / 50) * 50;
  return Math.round(num / 100) * 100;
}

function getLegacyTier(legacyId) {
  const id = Number(legacyId) || 0;
  if (id >= 500) return "gold";
  if (id >= 400) return "red";
  if (id >= 300) return "orange";
  if (id >= 200) return "purple";
  if (id >= 100) return "blue";
  return "green";
}

function parseTermMetrics(extAttrs) {
  const text = String(extAttrs || "").trim();
  const fireValues = [...text.matchAll(/走火(?:入魔)?\s*([0-9.]+)/g)].map(
    (match) => Number(match[1]) || 0
  );
  const calmValues = [...text.matchAll(/气定(?:神闲)?\s*([0-9.]+)/g)].map(
    (match) => Number(match[1]) || 0
  );

  return {
    fire_values: fireValues,
    calm_values: calmValues,
    fire_count: fireValues.length,
    calm_count: calmValues.length,
    fire_total: fireValues.reduce((sum, value) => sum + value, 0),
    calm_total: calmValues.reduce((sum, value) => sum + value, 0),
  };
}

function buildConfiguredMaxMap(products) {
  const configuredMaxMap = new Map();

  for (const product of products) {
    const legacyId = Number(product.legacy_id) || 0;
    const configured = LEGACY_CAPS[legacyId];
    if (configured) {
      configuredMaxMap.set(legacyId, {
        attack_max: Number(configured.attack_max) || 1,
        hp_max: Number(configured.hp_max) || 1,
        fire_total_max: Number(configured.fire_total_max) || 0,
        calm_total_max: Number(configured.calm_total_max) || 0,
      });
      continue;
    }

    const fallback = configuredMaxMap.get(legacyId) || {
      attack_max: 1,
      hp_max: 1,
      fire_total_max: 0,
      calm_total_max: 0,
    };
    const termMetrics = parseTermMetrics(product.ext_attrs);
    fallback.attack_max = Math.max(fallback.attack_max, Number(product.attack_value) || 0, 1);
    fallback.hp_max = Math.max(fallback.hp_max, Number(product.hp_value) || 0, 1);
    fallback.fire_total_max = Math.max(fallback.fire_total_max, termMetrics.fire_total);
    fallback.calm_total_max = Math.max(fallback.calm_total_max, termMetrics.calm_total);
    configuredMaxMap.set(legacyId, fallback);
  }

  return configuredMaxMap;
}

function buildDemandMap(orderEvents, now = new Date()) {
  const nowMs = now.getTime();
  const demandMap = new Map();

  for (const event of orderEvents) {
    const productId = Number(event.product_id);
    if (!productId) continue;

    const entry = demandMap.get(productId) || {
      confirmed_7d: 0,
      active_30d_weighted: 0,
      unique_buyers_30d: new Set(),
      last_active_at: null,
    };

    const happenedAt = new Date(event.happened_at || event.updated_at || event.created_at || now);
    const ageDays = Math.max(0, (nowMs - happenedAt.getTime()) / 86400000);
    if (!Number.isFinite(ageDays)) continue;

    if (event.status !== "cancelled" && (!entry.last_active_at || happenedAt > entry.last_active_at)) {
      entry.last_active_at = happenedAt;
    }

    if (event.status === "confirmed" && ageDays <= 7) {
      entry.confirmed_7d += 1;
    }

    if (ageDays <= 30 && event.status !== "cancelled") {
      if (event.status === "confirmed") entry.active_30d_weighted += 1;
      else if (event.status === "pending") entry.active_30d_weighted += 0.35;

      if (event.user_id) {
        entry.unique_buyers_30d.add(String(event.user_id));
      }
    }

    demandMap.set(productId, entry);
  }

  for (const entry of demandMap.values()) {
    entry.unique_buyers_30d = entry.unique_buyers_30d.size;
    entry.days_since_active = entry.last_active_at
      ? Math.max(0, (nowMs - entry.last_active_at.getTime()) / 86400000)
      : null;
  }

  return demandMap;
}

function getAtlasPrice(product, tierRule, referenceCaps) {
  const attackValue = Number(product.attack_value) || 0;
  const hpValue = Number(product.hp_value) || 0;
  const attackMax = Math.max(Number(referenceCaps.attack_max) || 0, attackValue, 1);
  const hpMax = Math.max(Number(referenceCaps.hp_max) || 0, hpValue, 1);

  const attackRate = clamp(attackValue / attackMax, 0, 1);
  const hpRate = clamp(hpValue / hpMax, 0, 1);
  const exactAttackFull = attackValue >= attackMax;
  const exactHpFull = hpValue >= hpMax;
  const exactDoubleFull = exactAttackFull && exactHpFull;
  const exactCombinedRate = attackRate * hpRate;

  const floorPrice = tierRule.salvageQuota * PRICE_CONFIG.floorMultiplier;
  const tier = getLegacyTier(product.legacy_id);
  let atlasScore = attackRate * 0.72 + hpRate * 0.28;
  let atlasPrice = 0;

  if (tier === "orange" || tier === "red" || tier === "purple") {
    atlasScore = clamp(exactCombinedRate, 0, 1);
    atlasPrice =
      floorPrice +
      (tierRule.fullAtlasAnchor - floorPrice) *
        Math.pow(atlasScore, tierRule.atlasExponent * 2.2);
  } else {
    if (attackRate >= 0.995) atlasScore += 0.04;
    if (hpRate >= 0.95) atlasScore += 0.03;
    atlasScore = clamp(atlasScore, 0, 1);
    atlasPrice =
      floorPrice +
      (tierRule.fullAtlasAnchor - floorPrice) * Math.pow(atlasScore, tierRule.atlasExponent);
  }

  if (tier === "gold") {
    atlasPrice =
      floorPrice +
      (8000 - floorPrice) * Math.pow(attackRate, 5.2) +
      (attackRate >= 0.995 ? 4000 * Math.pow(hpRate, 4.2) : 0);
    if (attackRate >= 0.995) atlasPrice = Math.max(atlasPrice, 8000);
    if (attackRate >= 0.995 && hpRate >= 0.88) atlasPrice = Math.max(atlasPrice, 12000);
    if (attackRate >= 0.995 && hpRate >= 0.995) atlasPrice = Math.max(atlasPrice, 50000);
  } else if (
    exactDoubleFull &&
    Number.isFinite(Number(tierRule.doubleFullAtlasAnchor))
  ) {
    atlasPrice = Math.max(atlasPrice, Number(tierRule.doubleFullAtlasAnchor));
  }

  return {
    attack_rate: Number(attackRate.toFixed(4)),
    hp_rate: Number(hpRate.toFixed(4)),
    score: Number(atlasScore.toFixed(4)),
    price: roundPrice(atlasPrice),
  };
}

function getWearProfile(termMetrics) {
  const fireCount = termMetrics.fire_count;
  const calmCount = termMetrics.calm_count;
  if (fireCount === 0 && calmCount === 0) return { kind: "none", basePrice: 0 };
  if (fireCount >= 1 && calmCount >= 1) return { kind: "dual_mixed", basePrice: 12000 };
  if (fireCount >= 1) return { kind: "single_fire", basePrice: 6000 };
  return { kind: "single_calm", basePrice: 6000 };
}

function getGoldHighTermBonus(wearProfile, termMetrics, referenceCaps) {
  if (!wearProfile || wearProfile.kind === "none") return 0;

  const fireCap = Math.max(Number(referenceCaps.fire_total_max) || 0, 0.1);
  const calmCap = Math.max(Number(referenceCaps.calm_total_max) || 0, 0.1);
  const fireTotal = Number(termMetrics.fire_total) || 0;
  const calmTotal = Number(termMetrics.calm_total) || 0;

  if (wearProfile.kind === "single_fire" && fireTotal >= 2.5) {
    if (fireTotal >= 3.0) return 4200;
    if (fireTotal >= 2.8) return 3600;
    if (fireTotal >= 2.7) return 3000;
    if (fireTotal >= 2.6) return 2600;
    return 2200;
  }

  if (wearProfile.kind === "single_calm" && calmTotal >= 2.5) {
    if (calmTotal >= 3.0) return 2600;
    if (calmTotal >= 2.8) return 2200;
    if (calmTotal >= 2.7) return 1800;
    if (calmTotal >= 2.6) return 1500;
    return 1200;
  }

  if (wearProfile.kind === "dual_mixed") {
    const fireRatio = clamp(fireTotal / fireCap, 0, 1);
    const calmRatio = clamp(calmTotal / calmCap, 0, 1);
    const combined = fireRatio * 0.58 + calmRatio * 0.42;
    return 1000 + combined * 1800;
  }

  return 0;
}

function getWearPrice(product, atlas, referenceCaps, tierRule) {
  const termMetrics = parseTermMetrics(product.ext_attrs);
  const wearProfile = getWearProfile(termMetrics);
  const tier = getLegacyTier(product.legacy_id);
  if (wearProfile.basePrice <= 0) {
    return {
      ...termMetrics,
      kind: wearProfile.kind,
      fire_rate: 0,
      calm_rate: 0,
      quality_score: 0,
      price: 0,
    };
  }

  const fireRate = termMetrics.fire_total
    ? clamp(
        termMetrics.fire_total /
          Math.max(Number(referenceCaps.fire_total_max) || 0, termMetrics.fire_total, 0.1),
        0,
        1
      )
    : 0;
  const calmRate = termMetrics.calm_total
    ? clamp(
        termMetrics.calm_total /
          Math.max(Number(referenceCaps.calm_total_max) || 0, termMetrics.calm_total, 0.1),
        0,
        1
      )
    : 0;

  const qualityScore = clamp(
    fireRate * 0.58 +
      calmRate * 0.42 +
      (termMetrics.fire_count >= 2 ? 0.14 : 0) +
      (termMetrics.calm_count >= 2 ? 0.08 : 0) +
      (termMetrics.fire_count >= 1 && termMetrics.calm_count >= 1 ? 0.1 : 0),
    0,
    1.45
  );

  const statsBonus = 0.82 + Number(atlas?.score || 0) * 0.32;
  const highTermBonus =
    tier === "gold" ? getGoldHighTermBonus(wearProfile, termMetrics, referenceCaps) : 0;
  let wearPrice = 0;

  if (tier === "orange") {
    wearPrice = 0;
  } else if (tier === "red") {
    if (wearProfile.kind === "dual_mixed") {
      const fireWeight = fireRate * 0.58;
      const calmWeight = calmRate * 0.42;
      const dualPremium = 150 + (fireWeight + calmWeight) * 450 + Number(atlas?.score || 0) * 150;
      wearPrice = (Number(atlas?.price) || 0) + dualPremium;
    } else {
      wearPrice = 0;
    }
  } else {
    wearPrice =
      (wearProfile.basePrice + highTermBonus) *
      (0.7 + qualityScore * 0.35) *
      statsBonus *
      Number(tierRule?.wearMultiplier || 1);
  }

  return {
    ...termMetrics,
    kind: wearProfile.kind,
    base_price: wearProfile.basePrice,
    fire_rate: Number(fireRate.toFixed(4)),
    calm_rate: Number(calmRate.toFixed(4)),
    quality_score: Number(qualityScore.toFixed(4)),
    high_term_bonus: roundPrice(highTermBonus),
    price: roundPrice(wearPrice),
  };
}

function getMarketFactor(demand) {
  const previousFactor = clamp(Number(demand?.previous_factor) || 1, 0.5, 4.0);
  if (!demand) {
    return {
      factor: 1,
      target_factor: 1,
      previous_factor: previousFactor,
      hot_score: 0,
      cold_penalty: 0,
      reason: "no_trade_history",
      rise_blocked: false,
      rise_cap: null,
    };
  }

  const hotScore =
    (Number(demand.confirmed_7d) || 0) * 0.18 +
    (Number(demand.active_30d_weighted) || 0) * 0.08 +
    (Number(demand.unique_buyers_30d) || 0) * 0.05;

  let coldPenalty = 0;
  const staleDaysRaw = Number(demand.days_since_active);
  const staleDays = Number.isFinite(staleDaysRaw) ? staleDaysRaw : null;
  if (staleDays !== null && staleDays >= 3) coldPenalty += 0.08;
  if (staleDays !== null && staleDays >= 7) coldPenalty += 0.12;
  if (staleDays !== null && staleDays >= 14) coldPenalty += 0.2;
  if (staleDays !== null && staleDays >= 30) coldPenalty += 0.25;
  if (staleDays !== null && staleDays >= 60) coldPenalty += 0.25;

  const targetFactor = clamp(
    1 + hotScore - coldPenalty,
    PRICE_CONFIG.marketFactor.min,
    PRICE_CONFIG.marketFactor.max
  );
  const confirmed7d = Number(demand.confirmed_7d) || 0;
  const riseStep = confirmed7d >= 2 ? Math.min(0.24, 0.08 * (confirmed7d - 1)) : 0;
  const riseCap = riseStep > 0 ? previousFactor + riseStep : previousFactor;
  const factor =
    targetFactor > previousFactor
      ? confirmed7d < 2
        ? previousFactor
        : Math.min(targetFactor, riseCap)
      : targetFactor;

  return {
    factor: Number(factor.toFixed(4)),
    target_factor: Number(targetFactor.toFixed(4)),
    previous_factor: Number(previousFactor.toFixed(4)),
    hot_score: Number(hotScore.toFixed(4)),
    cold_penalty: Number(coldPenalty.toFixed(4)),
    confirmed_7d: confirmed7d,
    active_30d_weighted: Number(Number(demand.active_30d_weighted || 0).toFixed(2)),
    unique_buyers_30d: Number(demand.unique_buyers_30d) || 0,
    days_since_active: staleDays === null ? null : Number(staleDays.toFixed(1)),
    rise_blocked: targetFactor > previousFactor && confirmed7d < 2,
    rise_cap: riseStep > 0 ? Number(riseCap.toFixed(4)) : null,
  };
}

function buildOrderEvents(orders, orderItems) {
  const ordersById = new Map();
  for (const order of orders) {
    ordersById.set(Number(order.id), order);
  }

  return orderItems
    .map((item) => {
      const order = ordersById.get(Number(item.order_id));
      if (!order) return null;
      return {
        product_id: Number(item.product_id),
        user_id: Number(order.user_id),
        status: order.status,
        happened_at: order.updated_at || order.created_at,
      };
    })
    .filter(Boolean);
}

function createIntrinsicSortKey(product, pricingMeta) {
  const wear = pricingMeta.wear || {};
  const termCount = (Number(wear.fire_count) || 0) + (Number(wear.calm_count) || 0);
  const atlas = pricingMeta.atlas || {};
  return {
    term_bucket_rank: termCount >= 2 ? 2 : termCount >= 1 ? 1 : 0,
    strength: Math.max(Number(wear.price) || 0, Number(atlas.price) || 0),
    fire_total: Number(wear.fire_total) || 0,
    calm_total: Number(wear.calm_total) || 0,
    attack_value: Number(product.attack_value) || 0,
    hp_value: Number(product.hp_value) || 0,
  };
}

function compareIntrinsic(a, b) {
  if (b.term_bucket_rank !== a.term_bucket_rank) return b.term_bucket_rank - a.term_bucket_rank;
  if (b.strength !== a.strength) return b.strength - a.strength;
  if (b.fire_total !== a.fire_total) return b.fire_total - a.fire_total;
  if (b.calm_total !== a.calm_total) return b.calm_total - a.calm_total;
  if (b.attack_value !== a.attack_value) return b.attack_value - a.attack_value;
  return b.hp_value - a.hp_value;
}

function splitPricingBuckets(products) {
  const doubleTermProducts = [];
  const singleTermProducts = [];
  const normalProducts = [];

  for (const product of products) {
    const wear = product.pricing_meta?.wear || {};
    const termCount = (Number(wear.fire_count) || 0) + (Number(wear.calm_count) || 0);
    if (termCount >= 2) {
      doubleTermProducts.push(product);
      continue;
    }
    if (termCount >= 1) {
      singleTermProducts.push(product);
      continue;
    }
    normalProducts.push(product);
  }

  return [doubleTermProducts, singleTermProducts, normalProducts];
}

function applyMonotonicCap(products, step) {
  const sortedProducts = products.sort((a, b) =>
    compareIntrinsic(createIntrinsicSortKey(a, a.pricing_meta), createIntrinsicSortKey(b, b.pricing_meta))
  );

  let previousFinalPrice = null;
  for (const product of sortedProducts) {
    const floorPrice = Number(product.pricing_meta?.floor_price) || 0;
    const maxAllowed =
      previousFinalPrice === null ? Number.POSITIVE_INFINITY : Math.max(floorPrice, previousFinalPrice - step);

    if (product.price_quota > maxAllowed) {
      product.price_quota = maxAllowed;
      product.pricing_meta.auto_price = maxAllowed;
    }

    previousFinalPrice = product.price_quota;
  }
}

function repriceProducts(products, orderEvents, now = new Date()) {
  const configuredMaxMap = buildConfiguredMaxMap(products);
  const demandMap = buildDemandMap(orderEvents, now);

  const pricedProducts = products.map((product) => {
    const tier = getLegacyTier(product.legacy_id);
    const tierRule = PRICE_CONFIG.tierRules[tier];
    const floorPrice = tierRule.salvageQuota * PRICE_CONFIG.floorMultiplier;
    const referenceCaps = configuredMaxMap.get(Number(product.legacy_id)) || {
      attack_max: Math.max(Number(product.attack_value) || 0, 1),
      hp_max: Math.max(Number(product.hp_value) || 0, 1),
      fire_total_max: 0,
      calm_total_max: 0,
    };

    const atlas = getAtlasPrice(product, tierRule, referenceCaps);
    const wear = getWearPrice(product, atlas, referenceCaps, tierRule);
    const dominant =
      Number(wear.price || 0) > Number(atlas.price || 0)
        ? { type: "wear", label: "佩戴价主导" }
        : { type: "atlas", label: "图鉴价主导" };
    const autoBasePrice = Math.max(floorPrice, Number(atlas.price) || 0, Number(wear.price) || 0);
    const market = getMarketFactor({
      ...(demandMap.get(Number(product.id)) || {}),
      previous_factor: Number(product?.pricing_meta?.market?.factor || 1),
    });
    const autoPrice = Math.max(floorPrice, roundPrice(autoBasePrice * market.factor));
    const manualPrice =
      product.manual_price_quota === null || product.manual_price_quota === undefined
        ? null
        : Number(product.manual_price_quota);

    const pricingMeta = {
      version: PRICE_CONFIG.version,
      source: Number.isInteger(manualPrice) ? "manual" : "auto",
      tier,
      floor_price: floorPrice,
      reference_caps: referenceCaps,
      reference_source: LEGACY_CAPS[Number(product.legacy_id)] ? "catalog_config" : "observed_fallback",
      atlas,
      wear,
      market,
      auto_base_price: autoBasePrice,
      auto_price: autoPrice,
      manual_price: manualPrice,
      dominant_reason: dominant.type,
      dominant_reason_label: dominant.label,
    };

    return {
      ...product,
      price_quota: Number.isInteger(manualPrice) ? manualPrice : autoPrice,
      pricing_meta: pricingMeta,
    };
  });

  const grouped = new Map();
  for (const product of pricedProducts) {
    const legacyId = Number(product.legacy_id) || 0;
    const list = grouped.get(legacyId) || [];
    list.push(product);
    grouped.set(legacyId, list);
  }

  for (const group of grouped.values()) {
    const tier = getLegacyTier(group[0]?.legacy_id);
    const step = PRICE_CONFIG.tierRules[tier].monotonicStep;
    const autoProducts = group.filter((item) => !Number.isInteger(item.manual_price_quota));
    const [doubleTermProducts, singleTermProducts, normalProducts] = splitPricingBuckets(autoProducts);

    applyMonotonicCap(doubleTermProducts, step);
    applyMonotonicCap(singleTermProducts, step);
    applyMonotonicCap(normalProducts, step);
  }

  return pricedProducts;
}

async function recalculateDatabasePricing(db) {
  const productsResult = await db.query(
    `SELECT
      id,
      legacy_id,
      uid,
      name,
      image_url,
      attack_value,
      hp_value,
      main_attrs,
      ext_attrs,
      price_quota,
      manual_price_quota,
      stock,
      status,
      pricing_meta,
      created_at,
      updated_at
     FROM products
     ORDER BY id ASC`
  );

  if (productsResult.rowCount === 0) {
    return [];
  }

  const orderEventsResult = await db.query(
    `SELECT
      oi.product_id,
      o.user_id,
      o.status,
      COALESCE(o.updated_at, o.created_at) AS happened_at
     FROM order_items oi
     JOIN orders o ON o.id=oi.order_id`
  );

  const pricedProducts = repriceProducts(productsResult.rows, orderEventsResult.rows);

  for (const product of pricedProducts) {
    await db.query(
      `UPDATE products
       SET
        price_quota=$2,
        pricing_meta=$3
       WHERE id=$1`,
      [product.id, product.price_quota, product.pricing_meta]
    );
  }

  return pricedProducts;
}

module.exports = {
  PRICE_CONFIG,
  getLegacyTier,
  parseTermMetrics,
  buildOrderEvents,
  repriceProducts,
  recalculateDatabasePricing,
};
