const { LEGACY_CAPS } = require("../config/catalog-config");

const PRICE_CONFIG = {
  version: "pricing_v11",
  marketFactor: {
    min: 0.5,
    max: 4.0,
  },
  similarity: {
    topMatches: 3,
    gold: {
      baseBlend: 0.34,
      minMatches: 2,
      clampMin: 0.72,
      clampMax: 1.38,
      maxStatDistance: 0.26,
      seasonMismatchWeight: 0.34,
    },
    other: {
      baseBlend: 0.28,
      minMatches: 2,
      clampMin: 0.78,
      clampMax: 1.24,
      maxStatDistance: 0.24,
    },
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

const RMB_ANCHOR_BY_LEGACY_ID = {
  601: { yuan: 390, label: "rare_yunqijue" },
  602: { yuan: 440, label: "rare_lianhuanmahopao" },
  603: { yuan: 520, label: "rare_qiankunyizhi" },
};

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function roundPrice(value) {
  const num = Math.max(0, Number(value) || 0);
  if (num < 1000) return Math.round(num / 50) * 50;
  return Math.round(num / 100) * 100;
}

function getQuotaPerYuan(rechargeConfig = {}) {
  const direct = Number(rechargeConfig?.quota_per_yuan);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const exchangeQuota = Number(rechargeConfig?.exchange_quota);
  const exchangeYuan = Number(rechargeConfig?.exchange_yuan);
  if (Number.isFinite(exchangeQuota) && exchangeQuota > 0 && Number.isFinite(exchangeYuan) && exchangeYuan > 0) {
    return exchangeQuota / exchangeYuan;
  }

  return 10000 / 12;
}

function getRmbAnchorForLegacy(legacyId, rechargeConfig = {}) {
  const anchor = RMB_ANCHOR_BY_LEGACY_ID[Number(legacyId)];
  if (!anchor) return null;

  const quotaPerYuan = getQuotaPerYuan(rechargeConfig);
  const quotaAnchor = roundPrice(anchor.yuan * quotaPerYuan);
  return {
    legacy_id: Number(legacyId),
    yuan: Number(anchor.yuan),
    quota_per_yuan: Number(quotaPerYuan.toFixed(4)),
    quota_anchor: quotaAnchor,
    label: anchor.label,
  };
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
  if (fireCount >= 1 && calmCount >= 1) return { kind: "dual_mixed", basePrice: 22500 };
  if (fireCount >= 1) return { kind: "single_fire", basePrice: 9000 };
  return { kind: "single_calm", basePrice: 6000 };
}

function getTierSoftDiscount(product, referenceCaps) {
  const tier = getLegacyTier(product?.legacy_id);
  if (!["purple", "orange", "red"].includes(tier)) {
    return {
      applied: false,
      rate: 1,
      reason: "tier_not_discounted",
    };
  }

  const attackValue = Number(product?.attack_value) || 0;
  const hpValue = Number(product?.hp_value) || 0;
  const attackMax = Math.max(Number(referenceCaps?.attack_max) || 0, 1);
  const hpMax = Math.max(Number(referenceCaps?.hp_max) || 0, 1);
  const exactDoubleFull = attackValue >= attackMax && hpValue >= hpMax;

  if (exactDoubleFull) {
    return {
      applied: false,
      rate: 1,
      reason: "double_full_exempt",
    };
  }

  return {
    applied: true,
    rate: 0.7,
    reason: "non_double_full_tier_discount",
  };
}

function getGoldHighTermBonus(wearProfile, termMetrics, referenceCaps) {
  if (!wearProfile || wearProfile.kind === "none") return 0;

  const fireCap = Math.max(Number(referenceCaps.fire_total_max) || 0, 0.1);
  const calmCap = Math.max(Number(referenceCaps.calm_total_max) || 0, 0.1);
  const fireTotal = Number(termMetrics.fire_total) || 0;
  const calmTotal = Number(termMetrics.calm_total) || 0;

  if (wearProfile.kind === "single_fire" && fireTotal >= 2.5) {
    if (fireTotal >= 3.0) return 13800;
    if (fireTotal >= 2.8) return 9800;
    if (fireTotal >= 2.7) return 7800;
    if (fireTotal >= 2.6) return 6200;
    return 5000;
  }

  if (wearProfile.kind === "single_calm" && calmTotal >= 2.5) {
    if (calmTotal >= 3.0) return 11400;
    if (calmTotal >= 2.9) return 8200;
    if (calmTotal >= 2.8) return 6800;
    if (calmTotal >= 2.7) return 5400;
    if (calmTotal >= 2.6) return 2600;
    return 1200;
  }

  if (wearProfile.kind === "dual_mixed") {
    const fireRatio = clamp(fireTotal / fireCap, 0, 1);
    const calmRatio = clamp(calmTotal / calmCap, 0, 1);
    const combined = fireRatio * 0.62 + calmRatio * 0.38;
    const lowerTerm = Math.min(fireTotal, calmTotal);
    const higherTerm = Math.max(fireTotal, calmTotal);
    let bonus = 1200 + combined * 3200;
    if (lowerTerm >= 2.1) bonus += 1200;
    if (lowerTerm >= 2.3) bonus += 1800;
    if (lowerTerm >= 2.4) bonus += 1800;
    if (lowerTerm >= 2.5) bonus += 2400;
    if (higherTerm >= 2.5) bonus += 3000;
    if (calmTotal >= 2.4) bonus += 1200;
    if (fireTotal >= 2.5) bonus += 4500;
    if (fireTotal >= 2.6) bonus += 5000;
    if (fireTotal >= 2.7) bonus += 5000;
    if (fireTotal >= 2.8) bonus += 7000;
    if (fireTotal >= 2.9) bonus += 9000;
    if (lowerTerm >= 2.7) bonus += 3000;
    if (lowerTerm >= 2.9) bonus += 5000;
    if (lowerTerm >= 3.0) bonus += 9000;
    return bonus;
  }

  return 0;
}

function getFireBiasMultiplier(tier, wearProfile, termMetrics) {
  const fireTotal = Number(termMetrics?.fire_total || 0);
  if (fireTotal <= 0) return 1;

  if (wearProfile?.kind === "single_fire") {
    if (tier === "gold") {
      if (fireTotal >= 3.0) return 1.92;
      if (fireTotal >= 2.8) return 1.58;
      if (fireTotal >= 2.7) return 1.44;
      if (fireTotal >= 2.6) return 1.32;
      if (fireTotal >= 2.5) return 1.22;
      return 1.12;
    }
    if (tier === "red") {
      if (fireTotal >= 2.5) return 1.2;
      return 1.1;
    }
    return 1.06;
  }

  if (wearProfile?.kind === "dual_mixed") {
    if (tier === "gold") {
      if (fireTotal >= 3.0) return 1.64;
      if (fireTotal >= 2.9) return 1.52;
      if (fireTotal >= 2.8) return 1.44;
      if (fireTotal >= 2.7) return 1.36;
      if (fireTotal >= 2.6) return 1.3;
      if (fireTotal >= 2.5) return 1.22;
    }
    return 1.12;
  }

  return 1;
}

function getCalmBiasMultiplier(tier, wearProfile, termMetrics) {
  const calmTotal = Number(termMetrics?.calm_total || 0);
  if (calmTotal <= 0) return 1;

  if (wearProfile?.kind === "single_calm") {
    if (tier === "gold") {
      if (calmTotal >= 3.0) return 1.82;
      if (calmTotal >= 2.9) return 1.52;
      if (calmTotal >= 2.8) return 1.38;
      if (calmTotal >= 2.7) return 1.26;
      if (calmTotal >= 2.6) return 1.12;
      return 1.04;
    }
    if (tier === "red") {
      if (calmTotal >= 2.7) return 1.14;
      return 1.06;
    }
    return 1.03;
  }

  if (wearProfile?.kind === "dual_mixed") {
    if (tier === "gold") {
      if (calmTotal >= 3.0) return 1.38;
      if (calmTotal >= 2.9) return 1.28;
      if (calmTotal >= 2.7) return 1.18;
      if (calmTotal >= 2.5) return 1.1;
    }
    return 1.12;
  }

  return 1;
}

function getGoldSeasonPremium(product, atlas, wearProfile, termMetrics) {
  if (!product?.is_current_season) return 0;
  if (!wearProfile || wearProfile.kind === "none") return 0;

  const attackRate = Number(atlas?.attack_rate || 0);
  const hpRate = Number(atlas?.hp_rate || 0);
  const fireTotal = Number(termMetrics?.fire_total || 0);
  const calmTotal = Number(termMetrics?.calm_total || 0);

  let premium = 300;
  if (wearProfile.kind === "single_fire" && fireTotal >= 2.7) premium += 300;
  if (wearProfile.kind === "single_calm" && calmTotal >= 2.7) premium += 500;
  if (wearProfile.kind === "dual_mixed") premium += 1400;
  if (attackRate >= 0.9) premium += 200;
  if (hpRate >= 0.995) premium += 200;
  return premium;
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
  const seasonPremium =
    tier === "gold" ? getGoldSeasonPremium(product, atlas, wearProfile, termMetrics) : 0;
  const fireBiasMultiplier = getFireBiasMultiplier(tier, wearProfile, termMetrics);
  const calmBiasMultiplier = getCalmBiasMultiplier(tier, wearProfile, termMetrics);
  const termBiasMultiplier = Math.max(fireBiasMultiplier, calmBiasMultiplier);
  let wearPrice = 0;

  if (tier === "orange") {
    wearPrice = 0;
  } else if (tier === "red") {
    if (wearProfile.kind === "dual_mixed") {
      const fireWeight = fireRate * 0.58;
      const calmWeight = calmRate * 0.42;
      const dualPremium = 500 + (fireWeight + calmWeight) * 900 + Number(atlas?.score || 0) * 300;
      wearPrice = (Number(atlas?.price) || 0) + dualPremium;
    } else {
      wearPrice = 0;
    }
  } else {
    wearPrice =
      (wearProfile.basePrice + highTermBonus + seasonPremium) *
      (0.7 + qualityScore * 0.35) *
      statsBonus *
      termBiasMultiplier *
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
    season_premium: roundPrice(seasonPremium),
    fire_bias_multiplier: Number(fireBiasMultiplier.toFixed(4)),
    calm_bias_multiplier: Number(calmBiasMultiplier.toFixed(4)),
    term_bias_multiplier: Number(termBiasMultiplier.toFixed(4)),
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

function getTermBucketRank(wear = {}) {
  const termCount = (Number(wear.fire_count) || 0) + (Number(wear.calm_count) || 0);
  if (termCount >= 2) return 2;
  if (termCount >= 1) return 1;
  return 0;
}

function createSimilarityProfile(product, atlas, wear, autoBasePrice) {
  return {
    attack_rate: Number(atlas?.attack_rate || 0),
    hp_rate: Number(atlas?.hp_rate || 0),
    attack_value: Number(product?.attack_value || 0),
    hp_value: Number(product?.hp_value || 0),
    fire_rate: Number(wear?.fire_rate || 0),
    calm_rate: Number(wear?.calm_rate || 0),
    fire_total: Number(wear?.fire_total || 0),
    calm_total: Number(wear?.calm_total || 0),
    term_bucket_rank: getTermBucketRank(wear),
    is_current_season: Boolean(product?.is_current_season),
    auto_base_price: Number(autoBasePrice || 0),
  };
}

function getLogGap(a, b) {
  const left = Math.log1p(Math.max(0, Number(a) || 0));
  const right = Math.log1p(Math.max(0, Number(b) || 0));
  return Math.abs(left - right);
}

function getGoldSimilarityWeight(target, candidate) {
  const config = PRICE_CONFIG.similarity.gold;
  const statDistance =
    Math.abs(Number(target.profile.attack_rate || 0) - Number(candidate.profile.attack_rate || 0)) *
      0.58 +
    Math.abs(Number(target.profile.hp_rate || 0) - Number(candidate.profile.hp_rate || 0)) * 0.42;
  if (statDistance > config.maxStatDistance) return null;

  const termDistance =
    Math.abs(Number(target.profile.fire_rate || 0) - Number(candidate.profile.fire_rate || 0)) * 0.55 +
    Math.abs(Number(target.profile.calm_rate || 0) - Number(candidate.profile.calm_rate || 0)) * 0.45 +
    Math.abs(
      Number(target.profile.term_bucket_rank || 0) - Number(candidate.profile.term_bucket_rank || 0)
    ) *
      0.12;
  const priceGap = getLogGap(target.profile.auto_base_price, candidate.profile.auto_base_price) * 0.18;
  const seasonWeight =
    target.profile.is_current_season === candidate.profile.is_current_season
      ? 1
      : config.seasonMismatchWeight;
  const rawScore = 1.18 - statDistance * 2.5 - termDistance * 0.95 - priceGap;
  if (rawScore <= 0) return null;
  return Math.pow(rawScore, 2) * seasonWeight;
}

function getOtherTierSimilarityWeight(target, candidate) {
  const config = PRICE_CONFIG.similarity.other;
  const statDistance =
    Math.abs(Number(target.profile.attack_rate || 0) - Number(candidate.profile.attack_rate || 0)) *
      0.62 +
    Math.abs(Number(target.profile.hp_rate || 0) - Number(candidate.profile.hp_rate || 0)) * 0.38 +
    getLogGap(target.profile.attack_value, candidate.profile.attack_value) * 0.03 +
    getLogGap(target.profile.hp_value, candidate.profile.hp_value) * 0.02;
  if (statDistance > config.maxStatDistance) return null;

  const priceGap = getLogGap(target.profile.auto_base_price, candidate.profile.auto_base_price) * 0.22;
  const rawScore = 1.12 - statDistance * 2.7 - priceGap;
  if (rawScore <= 0) return null;
  return Math.pow(rawScore, 2);
}

function buildSimilarityReference(target, pricedProducts) {
  if (!target || target.tier === "bundle") {
    return {
      applied: false,
      reason: "tier_not_supported",
      sample_size: 0,
      effective_sample_size: 0,
      reference_price: null,
      blended_base_price: Number(target?.auto_base_price || 0),
      top_matches: [],
    };
  }

  if (target.rmb_anchor) {
    return {
      applied: false,
      reason: "rmb_anchor_base",
      sample_size: 0,
      effective_sample_size: 0,
      reference_price: roundPrice(target.rmb_anchor.quota_anchor),
      blended_base_price: roundPrice(target.rmb_anchor.quota_anchor),
      season_sensitive: false,
      top_matches: [],
    };
  }

  const tierConfig =
    target.tier === "gold" ? PRICE_CONFIG.similarity.gold : PRICE_CONFIG.similarity.other;
  const weightedMatches = [];
  const targetTermBucketRank = Number(target.profile?.term_bucket_rank || 0);

  for (const candidate of pricedProducts) {
    if (Number(candidate.id) === Number(target.id)) continue;
    if (candidate.tier !== target.tier) continue;
    if (
      targetTermBucketRank >= 2 &&
      Number(candidate.profile?.term_bucket_rank || 0) !== targetTermBucketRank
    ) {
      continue;
    }
    if (
      target.tier === "gold" &&
      targetTermBucketRank >= 2 &&
      Number(candidate.legacy_id || 0) !== Number(target.legacy_id || 0)
    ) {
      continue;
    }

    const weight =
      target.tier === "gold"
        ? getGoldSimilarityWeight(target, candidate)
        : getOtherTierSimilarityWeight(target, candidate);
    if (!weight) continue;

    weightedMatches.push({
      id: Number(candidate.id),
      legacy_id: Number(candidate.legacy_id) || 0,
      name: candidate.name || "",
      weight,
      price: Number(candidate.auto_base_price || 0),
      is_current_season: Boolean(candidate.profile?.is_current_season),
      attack_rate: Number(candidate.profile?.attack_rate || 0),
      hp_rate: Number(candidate.profile?.hp_rate || 0),
      term_bucket_rank: Number(candidate.profile?.term_bucket_rank || 0),
    });
  }

  const candidateMatches =
    target.tier === "gold"
      ? (() => {
          const sameSeasonMatches = weightedMatches.filter(
            (item) => Boolean(item.is_current_season) === Boolean(target.profile?.is_current_season)
          );
          return sameSeasonMatches.length >= tierConfig.minMatches ? sameSeasonMatches : weightedMatches;
        })()
      : weightedMatches;

  if (candidateMatches.length < tierConfig.minMatches) {
    return {
      applied: false,
      reason: "not_enough_matches",
      sample_size: candidateMatches.length,
      effective_sample_size: Number(
        candidateMatches.reduce((sum, item) => sum + Number(item.weight || 0), 0).toFixed(4)
      ),
      reference_price: null,
      blended_base_price: Number(target.auto_base_price || 0),
      top_matches: candidateMatches
        .sort((a, b) => b.weight - a.weight)
        .slice(0, PRICE_CONFIG.similarity.topMatches),
    };
  }

  const weightedSum = candidateMatches.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.weight || 0),
    0
  );
  const totalWeight = candidateMatches.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (!totalWeight) {
    return {
      applied: false,
      reason: "zero_weight",
      sample_size: candidateMatches.length,
      effective_sample_size: 0,
      reference_price: null,
      blended_base_price: Number(target.auto_base_price || 0),
      top_matches: [],
    };
  }

  const referencePrice = weightedSum / totalWeight;
  const blendedBasePrice =
    Number(target.auto_base_price || 0) * (1 - tierConfig.baseBlend) +
    referencePrice * tierConfig.baseBlend;
  const minAllowed = Number(target.auto_base_price || 0) * tierConfig.clampMin;
  const maxAllowed = Number(target.auto_base_price || 0) * tierConfig.clampMax;

  return {
    applied: true,
    reason: "similar_cards_blend",
    sample_size: candidateMatches.length,
    effective_sample_size: Number(totalWeight.toFixed(4)),
    reference_price: roundPrice(referencePrice),
    blended_base_price: roundPrice(clamp(blendedBasePrice, minAllowed, maxAllowed)),
    blend_ratio: tierConfig.baseBlend,
    clamp_min: Number(tierConfig.clampMin),
    clamp_max: Number(tierConfig.clampMax),
    season_sensitive: target.tier === "gold",
    top_matches: candidateMatches
      .sort((a, b) => b.weight - a.weight)
      .slice(0, PRICE_CONFIG.similarity.topMatches)
      .map((item) => ({
        product_id: item.id,
        legacy_id: item.legacy_id,
        name: item.name,
        weight: Number(item.weight.toFixed(4)),
        price: roundPrice(item.price),
        is_current_season: item.is_current_season,
        attack_rate: Number(item.attack_rate.toFixed(4)),
        hp_rate: Number(item.hp_rate.toFixed(4)),
        term_bucket_rank: item.term_bucket_rank,
      })),
  };
}

function createIntrinsicSortKey(product, pricingMeta) {
  const wear = pricingMeta.wear || {};
  const atlas = pricingMeta.atlas || {};
  return {
    term_bucket_rank: getTermBucketRank(wear),
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
    const termCount = getTermBucketRank(wear);
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

function repriceProducts(products, orderEvents, now = new Date(), options = {}) {
  const configuredMaxMap = buildConfiguredMaxMap(products);
  const demandMap = buildDemandMap(orderEvents, now);
  const rechargeConfig = options?.rechargeConfig || {};

  const basePricedProducts = products.map((product) => {
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
    const rmbAnchor = getRmbAnchorForLegacy(product.legacy_id, rechargeConfig);
    let dominant =
      Number(wear.price || 0) > Number(atlas.price || 0)
        ? { type: "wear", label: "佩戴价主导" }
        : { type: "atlas", label: "图鉴价主导" };
    const intrinsicAutoBasePrice = Math.max(
      floorPrice,
      Number(atlas.price) || 0,
      Number(wear.price) || 0
    );
    const autoBasePrice = rmbAnchor
      ? Math.max(floorPrice, Number(rmbAnchor.quota_anchor) || 0)
      : intrinsicAutoBasePrice;
    if (rmbAnchor) {
      dominant = { type: "rmb_anchor", label: "RMB anchor" };
    }
    const profile = createSimilarityProfile(product, atlas, wear, autoBasePrice);

    return {
      ...product,
      tier,
      floor_price: floorPrice,
      atlas,
      wear,
      dominant,
      rmb_anchor: rmbAnchor,
      intrinsic_auto_base_price: intrinsicAutoBasePrice,
      auto_base_price: autoBasePrice,
      reference_caps: referenceCaps,
      profile,
    };
  });

  const pricedProducts = basePricedProducts.map((product) => {
    const similarity = buildSimilarityReference(product, basePricedProducts);
    const tierSoftDiscount = getTierSoftDiscount(product, product.reference_caps);
    const discountedAutoBasePrice = roundPrice(
      Number(similarity.blended_base_price || product.auto_base_price || 0) * Number(tierSoftDiscount.rate || 1)
    );
    const adjustedAutoBasePrice = Math.max(
      Number(product.floor_price || 0),
      discountedAutoBasePrice
    );
    const market = getMarketFactor({
      ...(demandMap.get(Number(product.id)) || {}),
      previous_factor: Number(product?.pricing_meta?.market?.factor || 1),
    });
    const autoPrice = Math.max(
      Number(product.floor_price || 0),
      roundPrice(adjustedAutoBasePrice * market.factor)
    );
    const manualPrice =
      product.manual_price_quota === null || product.manual_price_quota === undefined
        ? null
        : Number(product.manual_price_quota);
    const effectiveManualPrice = product.rmb_anchor ? null : manualPrice;

    const pricingMeta = {
      version: PRICE_CONFIG.version,
      source: product.rmb_anchor
        ? "rmb_anchor"
        : Number.isInteger(effectiveManualPrice)
        ? "manual"
        : "auto",
      tier: product.tier,
      floor_price: product.floor_price,
      reference_caps: product.reference_caps,
      reference_source: LEGACY_CAPS[Number(product.legacy_id)] ? "catalog_config" : "observed_fallback",
      atlas: product.atlas,
      wear: product.wear,
      similarity,
      market,
      rmb_anchor: product.rmb_anchor,
      intrinsic_auto_base_price: product.intrinsic_auto_base_price,
      auto_base_price: product.auto_base_price,
      tier_soft_discount: tierSoftDiscount,
      adjusted_auto_base_price: adjustedAutoBasePrice,
      auto_price: autoPrice,
      manual_price: effectiveManualPrice,
      dominant_reason: product.dominant.type,
      dominant_reason_label: product.dominant.label,
    };

    return {
      ...product,
      price_quota: Number.isInteger(effectiveManualPrice) ? effectiveManualPrice : autoPrice,
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
    const autoProducts = group.filter(
      (item) => item.rmb_anchor || !Number.isInteger(item.manual_price_quota)
    );
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
      schedule_id,
      current_schedule_id,
      is_current_season,
      season_display,
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
