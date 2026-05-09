const { LEGACY_CAPS } = require("../config/catalog-config");
const { getRechargeConfig } = require("../config/recharge-config");
const { applyCardSeasonMeta, getConfiguredCurrentSeasonScheduleId } = require("../config/season-meta");
const {
  clamp,
  roundPrice,
  parseTimestamp,
  hasRareRmbAnchor,
  getFixedQuotaAnchor,
  getLegacyTier,
  getConfiguredQuotaRange,
  getConfiguredAtlasDoubleFullQuota,
  getConfiguredDecaySpeed,
  getConfiguredTermAttackReferenceRange,
  getConfiguredAttackRateByReferenceRange,
  getConfiguredTermValueReferenceRange,
  getConfiguredTermRateByReferenceRange,
  getConfiguredGoldNoTermProfile,
  mapScoreToConfiguredQuota,
  parseTermMetrics,
  buildConfiguredMaxMap,
  getTermLevelBucket,
  getTermBucketRank,
} = require("../domain/pricing/core/reference-caps");
const {
  getLegacyDiscountProfile,
  getDoubleTermBonusProfile,
  buildTermNoLowerThanAtlasFloorProfile,
} = require("../domain/pricing/rules/discounts");
const {
  getConfiguredTermAttackAdjustment,
  getGoldHighTermBonus,
  getFireBiasMultiplier,
  getCalmBiasMultiplier,
  getGoldSeasonPremium,
  getEliteGoldProtectedBasePrice,
} = require("../domain/pricing/rules/gold-special");
const {
  getTierPricingControl,
  getAtlasPrice,
  getTierSoftDiscount,
  getGlobalPriceAdjustment,
} = require("../domain/pricing/rules/atlas-pricing");
const {
  getWearProfile,
  getInterpolatedTermCurve,
  getGoldSingleTermCurveBase,
  getWearPrice,
} = require("../domain/pricing/rules/term-pricing");
const {
  buildTurnoverDescriptor,
  buildTurnoverKey,
  summarizeTurnoverSamples,
  buildTurnoverMaps,
  getMarketFactor,
  buildOrderEvents,
  createSimilarityProfile,
  buildSimilarityReference,
  createIntrinsicSortKey,
  compareIntrinsic,
  splitPricingBuckets,
  applyMonotonicCap,
} = require("../domain/pricing/rules/market-factor");
const { buildPricingMeta } = require("../domain/pricing/explain/pricing-meta");

const PRICE_CONFIG = {
  version: "pricing_v19",
  marketFactor: {
    min: 0.82,
    max: 1.28,
    exactMinSamples: 2,
    broadMinSamples: 4,
  },
  similarity: {
    topMatches: 3,
    gold: {
      baseBlend: 0.22,
      minMatches: 2,
      clampMin: 0.58,
      clampMax: 1.28,
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
  broadDiscountRate: 1,
  seasonDecay: {
    enabled: true,
    assumedSeasonDays: 28,
    currentSeasonStartMultiplier: 1.1,
    atlasEndMultiplier: 0.8,
    profiles: {
      single_fire_high: { endMultiplier: 0.8, label: "本赛季高走火缓降" },
      single_fire_low: { endMultiplier: 0.5, label: "本赛季普通走火快降" },
      single_calm: { endMultiplier: 0.2, label: "本赛季气定快速衰减" },
    },
  },
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
      salvageQuota: 250,
      fullAtlasAnchor: 50000,
      atlasExponent: 4.8,
      monotonicStep: 50,
      wearMultiplier: 1,
    },
  },
};

function isSeasonDecayExempt(product, wear = {}, referenceCaps = {}) {
  if (!product?.is_current_season) return true;
  if (hasRareRmbAnchor(product.legacy_id) || product.rmb_anchor) return true;
  const attackValue = Number(product?.attack_value || 0);
  const hpValue = Number(product?.hp_value || 0);
  const attackMax = Math.max(Number(referenceCaps?.attack_max || product?.reference_caps?.attack_max || 0), 1);
  const hpMax = Math.max(Number(referenceCaps?.hp_max || product?.reference_caps?.hp_max || 0), 1);
  const exactDoubleFull = attackValue >= attackMax && hpValue >= hpMax;
  if (exactDoubleFull) return true;

  const termBucketRank = getTermBucketRank(wear);
  if (termBucketRank >= 2) return true;

  return false;
}

function getWearSeasonDecayProfileKey(product, wear = {}, referenceCaps = {}) {
  if (isSeasonDecayExempt(product, wear, referenceCaps)) return null;

  if (wear.kind === "single_fire") {
    const fireTotal = Number(wear.fire_total || 0);
    return fireTotal >= 2.7 ? "single_fire_high" : "single_fire_low";
  }

  if (wear.kind === "single_calm") {
    return "single_calm";
  }

  return null;
}

function getSeasonTimingWindow(products, rechargeConfig, now = new Date()) {
  const expiresAt = parseTimestamp(rechargeConfig?.season_member_expires_at);
  if (!expiresAt) return null;

  const currentSeasonProducts = (products || []).filter((item) => Boolean(item?.is_current_season));
  if (currentSeasonProducts.length === 0) return null;

  const seasonLengthDays = Math.max(Number(PRICE_CONFIG.seasonDecay?.assumedSeasonDays) || 28, 1);
  const endAt = expiresAt;
  const startAt = new Date(endAt.getTime() - seasonLengthDays * 86400000);
  const nowAt = parseTimestamp(now) || new Date();
  const totalMs = Math.max(endAt.getTime() - startAt.getTime(), 1);
  const elapsedRatio = clamp((nowAt.getTime() - startAt.getTime()) / totalMs, 0, 1);

  return {
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    now_at: nowAt.toISOString(),
    assumed_season_days: seasonLengthDays,
    progress_ratio: Number(elapsedRatio.toFixed(4)),
    days_until_end: Number(((endAt.getTime() - nowAt.getTime()) / 86400000).toFixed(2)),
  };
}

function buildSeasonDecayResult({ applied, rate = 1, reason, profile = null, profileLabel = null, seasonTiming = null }) {
  return {
    applied,
    rate: Number((Number(rate) || 1).toFixed(4)),
    profile,
    profile_label: profileLabel,
    progress_ratio: seasonTiming ? clamp(Number(seasonTiming.progress_ratio || 0), 0, 1) : null,
    start_multiplier: seasonTiming ? Number(PRICE_CONFIG.seasonDecay?.currentSeasonStartMultiplier || 1) : null,
    season_start_at: seasonTiming?.start_at || null,
    season_end_at: seasonTiming?.end_at || null,
    days_until_end: seasonTiming?.days_until_end ?? null,
    assumed_season_days: seasonTiming?.assumed_season_days ?? null,
    reason,
  };
}

function getAtlasSeasonDecayMultiplier(product, wear, referenceCaps, seasonTiming) {
  const config = PRICE_CONFIG.seasonDecay || {};
  if (!config.enabled) {
    return buildSeasonDecayResult({ applied: false, rate: 1, reason: "season_decay_disabled" });
  }

  if (!seasonTiming) {
    return buildSeasonDecayResult({ applied: false, rate: 1, reason: "season_timing_unavailable" });
  }

  if (isSeasonDecayExempt(product, wear, referenceCaps)) {
    return buildSeasonDecayResult({ applied: false, rate: 1, reason: "season_decay_exempt", seasonTiming });
  }

  const startMultiplier = Number(config.currentSeasonStartMultiplier || 1);
  const endMultiplier = Number(config.atlasEndMultiplier || 1);
  const progressRatio = clamp(Number(seasonTiming.progress_ratio || 0), 0, 1);
  const rate = startMultiplier + (endMultiplier - startMultiplier) * progressRatio;

  return {
    ...buildSeasonDecayResult({
      applied: true,
      rate,
      reason: "current_season_atlas_decay",
      profile: "atlas_base",
      profileLabel: "本赛季属性价值缓降",
      seasonTiming,
    }),
    end_multiplier: endMultiplier,
  };
}

function getWearSeasonDecayMultiplier(product, wear, referenceCaps, seasonTiming) {
  const config = PRICE_CONFIG.seasonDecay || {};
  if (!config.enabled) {
    return buildSeasonDecayResult({ applied: false, rate: 1, reason: "season_decay_disabled" });
  }

  if (!seasonTiming) {
    return buildSeasonDecayResult({ applied: false, rate: 1, reason: "season_timing_unavailable" });
  }

  const profileKey = getWearSeasonDecayProfileKey(product, wear, referenceCaps);
  if (!profileKey) {
    return buildSeasonDecayResult({ applied: false, rate: 1, reason: "season_decay_exempt", seasonTiming });
  }

  const profile = config.profiles?.[profileKey];
  if (!profile) {
    return buildSeasonDecayResult({ applied: false, rate: 1, reason: "season_decay_profile_missing", seasonTiming });
  }

  const startMultiplier = Number(config.currentSeasonStartMultiplier || 1);
  const endMultiplier = Number(profile.endMultiplier || 1);
  const progressRatio = clamp(Number(seasonTiming.progress_ratio || 0), 0, 1);
  const rate = startMultiplier + (endMultiplier - startMultiplier) * progressRatio;

  return {
    ...buildSeasonDecayResult({
      applied: true,
      rate,
      reason: "current_season_wear_decay",
      profile: profileKey,
      profileLabel: profile.label,
      seasonTiming,
    }),
    end_multiplier: endMultiplier,
  };
}

function repriceProducts(products, orderEvents, now = new Date(), options = {}) {
  const rechargeConfig = options?.rechargeConfig || {};
  const currentSeasonScheduleId = getConfiguredCurrentSeasonScheduleId(rechargeConfig);
  const normalizedProducts = (products || []).map((product) =>
    applyCardSeasonMeta(product, { currentScheduleId: currentSeasonScheduleId })
  );
  const configuredMaxMap = buildConfiguredMaxMap(normalizedProducts);
  const turnoverMaps = buildTurnoverMaps(orderEvents, {
    fallbackWearBuilder: (product) =>
      getWearPrice(
        product,
        { score: 0, attack_rate: 0, hp_rate: 0, price: 0 },
        {
          attack_max: Math.max(Number(product?.attack_value) || 0, 1),
          hp_max: Math.max(Number(product?.hp_value) || 0, 1),
          fire_total_max: Number(parseTermMetrics(product?.ext_attrs).fire_total) || 0,
          calm_total_max: Number(parseTermMetrics(product?.ext_attrs).calm_total) || 0,
        },
        PRICE_CONFIG.tierRules[getLegacyTier(product?.legacy_id)]
      ),
  });
  const seasonTiming = getSeasonTimingWindow(normalizedProducts, rechargeConfig, now);

  const basePricedProducts = normalizedProducts.map((product) => {
    const tier = getLegacyTier(product.legacy_id);
    const tierRule = PRICE_CONFIG.tierRules[tier];
    const pricingControl = getTierPricingControl(rechargeConfig, tier);
    const floorPrice = tierRule.salvageQuota * PRICE_CONFIG.floorMultiplier;
    const referenceCaps = configuredMaxMap.get(Number(product.legacy_id)) || {
      attack_max: Math.max(Number(product.attack_value) || 0, 1),
      hp_max: Math.max(Number(product.hp_value) || 0, 1),
      fire_total_max: 0,
      calm_total_max: 0,
    };

    const atlas = getAtlasPrice(product, tierRule, referenceCaps, PRICE_CONFIG, pricingControl);
    const wear = getWearPrice(product, atlas, referenceCaps, tierRule, pricingControl);
    const atlasSeasonDecay = getAtlasSeasonDecayMultiplier(product, wear, referenceCaps, seasonTiming);
    const wearSeasonDecay = getWearSeasonDecayMultiplier(product, wear, referenceCaps, seasonTiming);
    const seasonAdjustedAtlasPrice = Math.max(
      floorPrice,
      roundPrice(Number(atlas.price || 0) * Number(atlasSeasonDecay.rate || 1))
    );
    const seasonAdjustedWearPrice = roundPrice(Number(wear.price || 0) * Number(wearSeasonDecay.rate || 1));
    const rmbAnchor = getFixedQuotaAnchor(product);
    let dominant =
      Number(seasonAdjustedWearPrice || 0) > Number(seasonAdjustedAtlasPrice || 0)
        ? { type: "wear", label: "佩戴价主导" }
        : { type: "atlas", label: "图鉴价主导" };
    const intrinsicAutoBasePrice = Math.max(
      floorPrice,
      Number(seasonAdjustedAtlasPrice) || 0,
      Number(seasonAdjustedWearPrice) || 0
    );
    const manualPrice =
      product.manual_price_quota === null || product.manual_price_quota === undefined
        ? null
        : Number(product.manual_price_quota);
    const autoBasePrice = !Number.isInteger(manualPrice) && rmbAnchor
      ? Math.max(floorPrice, Number(rmbAnchor.quota_anchor) || 0)
      : intrinsicAutoBasePrice;
    if (!Number.isInteger(manualPrice) && rmbAnchor) {
      dominant = { type: "fixed_quota_anchor", label: "固定卷锚" };
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
      manual_price_quota: manualPrice,
      atlas_season_decay: atlasSeasonDecay,
      wear_season_decay: wearSeasonDecay,
      season_adjusted_atlas_price: seasonAdjustedAtlasPrice,
      season_adjusted_wear_price: seasonAdjustedWearPrice,
      intrinsic_auto_base_price: intrinsicAutoBasePrice,
      auto_base_price: autoBasePrice,
      reference_caps: referenceCaps,
      profile,
    };
  });

  const pricedProducts = basePricedProducts.map((product) => {
    const isGoldNoTermDirectPricing =
      String(product?.tier || "") === "gold" &&
      getTermBucketRank(product?.wear || {}) < 1 &&
      Boolean(product?.atlas?.gold_no_term_profile);
    const similarity = buildSimilarityReference(product, basePricedProducts, PRICE_CONFIG);
    const tierSoftDiscount = getTierSoftDiscount(product, product.reference_caps);
    const globalPriceAdjustment = getGlobalPriceAdjustment(product, product.reference_caps, PRICE_CONFIG);
    const discountedAutoBasePrice = isGoldNoTermDirectPricing
      ? roundPrice(Number(product.auto_base_price || 0))
      : roundPrice(
          Number(similarity.blended_base_price || product.auto_base_price || 0) *
            Number(tierSoftDiscount.rate || 1)
        );
    const protectedAutoBasePrice = isGoldNoTermDirectPricing
      ? Math.max(Number(product.floor_price || 0), discountedAutoBasePrice)
      : Math.max(
          Number(product.floor_price || 0),
          discountedAutoBasePrice,
          getEliteGoldProtectedBasePrice(product)
        );
    const adjustedAutoBasePrice = isGoldNoTermDirectPricing
      ? Math.max(Number(product.floor_price || 0), roundPrice(protectedAutoBasePrice))
      : Math.max(
          Number(product.floor_price || 0),
          roundPrice(protectedAutoBasePrice * Number(globalPriceAdjustment.rate || 1))
        );
    const market = isGoldNoTermDirectPricing
      ? {
          factor: 1,
          target_factor: 1,
          reason: "gold_no_term_direct",
          scope: "direct",
          sample_size: 0,
          confidence: 1,
        }
      : getMarketFactor(product, turnoverMaps, PRICE_CONFIG);
    const manualPrice =
      product.manual_price_quota === null || product.manual_price_quota === undefined
        ? null
        : Number(product.manual_price_quota);
    const doubleTermBonus = getDoubleTermBonusProfile(rechargeConfig, product.wear, Number.isInteger(manualPrice));
    const rawAutoPrice = roundPrice(
      adjustedAutoBasePrice *
        Number(doubleTermBonus.applies ? doubleTermBonus.multiplier : 1) *
        market.factor
    );
    const legacyDiscount = getLegacyDiscountProfile(
      rechargeConfig,
      product,
      product.reference_caps,
      Number.isInteger(manualPrice)
    );
    const termNoLowerThanAtlasFloor = buildTermNoLowerThanAtlasFloorProfile({
      product,
      tierSoftDiscount,
      globalPriceAdjustment,
      legacyDiscount,
      hasManualPrice: Number.isInteger(manualPrice),
      protectedBasePriceResolver: getEliteGoldProtectedBasePrice,
    });
    const discountedAutoPrice = roundPrice(
      rawAutoPrice * Number(legacyDiscount.applies ? legacyDiscount.multiplier : 1)
    );
    const autoPrice = Math.max(
      Number(product.floor_price || 0),
      discountedAutoPrice,
      Number(termNoLowerThanAtlasFloor.applies ? termNoLowerThanAtlasFloor.floor_price : 0)
    );
    const effectiveManualPrice = manualPrice;

    const pricingMeta = buildPricingMeta({
      priceConfigVersion: PRICE_CONFIG.version,
      product,
      rechargeConfig,
      source: Number.isInteger(effectiveManualPrice)
        ? "manual"
        : product.rmb_anchor
          ? "fixed_quota_anchor"
          : "auto",
      floorPrice: product.floor_price,
      referenceCaps: product.reference_caps,
      referenceSource: LEGACY_CAPS[Number(product.legacy_id)] ? "catalog_config" : "observed_fallback",
      atlas: product.atlas,
      wear: product.wear,
      similarity,
      market,
      rmbAnchor: product.rmb_anchor,
      atlasSeasonDecay: product.atlas_season_decay,
      wearSeasonDecay: product.wear_season_decay,
      seasonAdjustedAtlasPrice: product.season_adjusted_atlas_price,
      seasonAdjustedWearPrice: product.season_adjusted_wear_price,
      intrinsicAutoBasePrice: product.intrinsic_auto_base_price,
      autoBasePrice: product.auto_base_price,
      tierSoftDiscount,
      globalPriceAdjustment,
      adjustedAutoBasePrice,
      doubleTermBonus,
      legacyDiscount,
      termNoLowerThanAtlasFloor,
      rawAutoPrice,
      discountedAutoPrice,
      autoPrice,
      manualPrice: effectiveManualPrice,
      dominant: product.dominant,
      isGoldNoTermDirectPricing,
      tierControl: getTierPricingControl(rechargeConfig, product.tier),
    });

    return {
      ...product,
      price_quota: Number.isInteger(effectiveManualPrice) ? effectiveManualPrice : autoPrice,
      pricing_meta: pricingMeta,
    };
  });

  return pricedProducts;
}

async function recalculateDatabasePricing(db) {
  const rechargeConfig = getRechargeConfig();
  const currentSeasonScheduleId = getConfiguredCurrentSeasonScheduleId(rechargeConfig);
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
      oi.product_snapshot,
      o.user_id,
      o.status,
      COALESCE(o.updated_at, o.created_at) AS happened_at
     FROM order_items oi
     JOIN orders o ON o.id=oi.order_id`
  );

  const pricedProducts = repriceProducts(productsResult.rows, orderEventsResult.rows, new Date(), {
    rechargeConfig,
  });

  for (const product of pricedProducts) {
    await db.query(
      `UPDATE products
       SET
        price_quota=$2,
        pricing_meta=$3,
        current_schedule_id=$4,
        is_current_season=$5,
        season_tag=$6,
        season_label=$7,
        season_display=$8
       WHERE id=$1`,
      [
        product.id,
        product.price_quota,
        product.pricing_meta,
        product.current_schedule_id || currentSeasonScheduleId,
        Boolean(product.is_current_season),
        product.season_tag,
        product.season_label,
        product.season_display,
      ]
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
