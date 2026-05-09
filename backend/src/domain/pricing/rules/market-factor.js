const {
  clamp,
  roundPrice,
  getLegacyTier,
  parseTermMetrics,
  getTermLevelBucket,
  getTermBucketRank,
} = require("../core/reference-caps");

function buildTurnoverDescriptor(product, wearOverride = null, options = {}) {
  if (!product) return null;

  const legacyId = Number(product.legacy_id) || 0;
  if (!legacyId) return null;

  const fallbackWearBuilder =
    typeof options.fallbackWearBuilder === "function" ? options.fallbackWearBuilder : null;
  const wear =
    wearOverride ||
    (fallbackWearBuilder
      ? fallbackWearBuilder(product)
      : null);

  if (!wear) return null;

  const tier = getLegacyTier(legacyId);
  const fireBucket = getTermLevelBucket(wear.fire_total);
  const calmBucket = getTermLevelBucket(wear.calm_total);

  return {
    tier,
    legacy_id: legacyId,
    is_current_season: Boolean(product.is_current_season),
    kind: wear.kind || "none",
    term_bucket_rank: getTermBucketRank(wear),
    fire_bucket: fireBucket,
    calm_bucket: calmBucket,
  };
}

function buildTurnoverKey(descriptor, scope = "exact") {
  if (!descriptor) return null;
  const base = [
    descriptor.tier,
    descriptor.is_current_season ? "current" : "legacy",
    descriptor.kind,
    `rank:${descriptor.term_bucket_rank}`,
    `fire:${descriptor.fire_bucket}`,
    `calm:${descriptor.calm_bucket}`,
  ];
  if (scope === "exact") {
    base.splice(1, 0, `legacy:${descriptor.legacy_id}`);
  }
  return base.join("|");
}

function summarizeTurnoverSamples(samples) {
  const sorted = samples
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((left, right) => left - right);

  if (sorted.length === 0) return null;

  const pick = (ratio) => {
    const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)));
    return sorted[index];
  };
  const average = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const fastShare = sorted.filter((value) => value <= 3).length / sorted.length;

  return {
    sample_size: sorted.length,
    median_sale_days: Number(pick(0.5).toFixed(2)),
    p75_sale_days: Number(pick(0.75).toFixed(2)),
    avg_sale_days: Number(average.toFixed(2)),
    fast_sale_share_3d: Number(fastShare.toFixed(4)),
  };
}

function buildTurnoverMaps(orderEvents, options = {}) {
  const exactSamples = new Map();
  const broadSamples = new Map();

  const pushSample = (map, key, value) => {
    if (!key) return;
    const list = map.get(key) || [];
    list.push(value);
    map.set(key, list);
  };

  for (const event of orderEvents) {
    if (event.status !== "confirmed") continue;

    const listedAt = new Date(event.listed_at || event.product_snapshot?.created_at || 0);
    const soldAt = new Date(event.happened_at || event.updated_at || event.created_at || 0);
    if (!Number.isFinite(listedAt.getTime()) || !Number.isFinite(soldAt.getTime())) continue;

    const saleDays = Math.max(0, (soldAt.getTime() - listedAt.getTime()) / 86400000);
    if (!Number.isFinite(saleDays)) continue;

    const snapshot = event.product_snapshot && typeof event.product_snapshot === "object"
      ? event.product_snapshot
      : null;
    const descriptor = buildTurnoverDescriptor(snapshot, null, options);
    if (!descriptor) continue;

    pushSample(exactSamples, buildTurnoverKey(descriptor, "exact"), saleDays);
    pushSample(broadSamples, buildTurnoverKey(descriptor, "broad"), saleDays);
  }

  const finalize = (samplesMap) => {
    const result = new Map();
    for (const [key, samples] of samplesMap.entries()) {
      const summary = summarizeTurnoverSamples(samples);
      if (summary) result.set(key, summary);
    }
    return result;
  };

  return {
    exact: finalize(exactSamples),
    broad: finalize(broadSamples),
  };
}

function getTurnoverTargetFactor(stats, priceConfig) {
  if (!stats) return 1;

  const median = Number(stats.median_sale_days) || 0;
  const p75 = Number(stats.p75_sale_days) || 0;
  const fastShare = Number(stats.fast_sale_share_3d) || 0;

  let factor = 1;
  if (median <= 1 && p75 <= 3) factor = 1.2;
  else if (median <= 3) factor = 1.14;
  else if (median <= 7) factor = 1.08;
  else if (median <= 14) factor = 1.02;
  else if (median <= 21) factor = 0.97;
  else if (median <= 30) factor = 0.92;
  else factor = 0.86;

  if (fastShare >= 0.65) factor += 0.04;
  else if (fastShare <= 0.2) factor -= 0.03;

  return clamp(factor, priceConfig.marketFactor.min, priceConfig.marketFactor.max);
}

function getMarketFactor(product, turnoverMaps, priceConfig, options = {}) {
  const descriptor = buildTurnoverDescriptor(product, product?.wear, options);
  const exactKey = buildTurnoverKey(descriptor, "exact");
  const broadKey = buildTurnoverKey(descriptor, "broad");
  const exactStats = exactKey ? turnoverMaps?.exact?.get(exactKey) || null : null;
  const broadStats = broadKey ? turnoverMaps?.broad?.get(broadKey) || null : null;

  const exactMinSamples = Number(priceConfig.marketFactor.exactMinSamples) || 2;
  const broadMinSamples = Number(priceConfig.marketFactor.broadMinSamples) || 4;

  let stats = null;
  let scope = "none";
  if (exactStats && Number(exactStats.sample_size) >= exactMinSamples) {
    stats = exactStats;
    scope = "exact";
  } else if (broadStats && Number(broadStats.sample_size) >= broadMinSamples) {
    stats = broadStats;
    scope = "broad";
  }

  if (!stats) {
    return {
      factor: 1,
      target_factor: 1,
      reason: "no_turnover_history",
      scope,
      sample_size: 0,
      confidence: 0,
      median_sale_days: null,
      p75_sale_days: null,
      avg_sale_days: null,
      fast_sale_share_3d: null,
    };
  }

  const sampleSize = Number(stats.sample_size) || 0;
  const confidence = clamp(sampleSize / (scope === "exact" ? 4 : 8), 0.35, 1);
  const rawTarget = getTurnoverTargetFactor(stats, priceConfig);
  const factor = 1 + (rawTarget - 1) * confidence;

  return {
    factor: Number(factor.toFixed(4)),
    target_factor: Number(rawTarget.toFixed(4)),
    reason: "turnover_velocity",
    scope,
    sample_size: sampleSize,
    confidence: Number(confidence.toFixed(4)),
    median_sale_days: Number(stats.median_sale_days),
    p75_sale_days: Number(stats.p75_sale_days),
    avg_sale_days: Number(stats.avg_sale_days),
    fast_sale_share_3d: Number(stats.fast_sale_share_3d),
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
        listed_at:
          item?.product_snapshot && typeof item.product_snapshot === "object"
            ? item.product_snapshot.created_at || null
            : null,
        product_snapshot:
          item?.product_snapshot && typeof item.product_snapshot === "object"
            ? item.product_snapshot
            : null,
      };
    })
    .filter(Boolean);
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

function getGoldSimilarityWeight(target, candidate, priceConfig) {
  const config = priceConfig.similarity.gold;
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

function getOtherTierSimilarityWeight(target, candidate, priceConfig) {
  const config = priceConfig.similarity.other;
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

function buildSimilarityReference(target, pricedProducts, priceConfig) {
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
      reason: "fixed_quota_anchor_base",
      sample_size: 0,
      effective_sample_size: 0,
      reference_price: roundPrice(target.rmb_anchor.quota_anchor),
      blended_base_price: roundPrice(target.rmb_anchor.quota_anchor),
      season_sensitive: false,
      top_matches: [],
    };
  }

  const tierConfig =
    target.tier === "gold" ? priceConfig.similarity.gold : priceConfig.similarity.other;
  const weightedMatches = [];
  const targetTermBucketRank = Number(target.profile?.term_bucket_rank || 0);

  for (const candidate of pricedProducts) {
    if (Number(candidate.id) === Number(target.id)) continue;
    if (candidate.tier !== target.tier) continue;
    if (candidate.rmb_anchor && !target.rmb_anchor) continue;
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
        ? getGoldSimilarityWeight(target, candidate, priceConfig)
        : getOtherTierSimilarityWeight(target, candidate, priceConfig);
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
        .slice(0, priceConfig.similarity.topMatches),
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
      .slice(0, priceConfig.similarity.topMatches)
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
  const buckets = new Map();

  for (const product of products) {
    const wear = product.pricing_meta?.wear || {};
    const termCount = getTermBucketRank(wear);
    const seasonKey = product?.is_current_season ? "current" : "legacy";
    const kindKey =
      termCount >= 2
        ? "dual_mixed"
        : termCount >= 1
          ? wear.kind === "single_calm"
            ? "single_calm"
            : "single_fire"
          : "none";
    const fireBucket = getTermLevelBucket(wear.fire_total);
    const calmBucket = getTermLevelBucket(wear.calm_total);
    const bucketKey = [seasonKey, kindKey, `fire:${fireBucket}`, `calm:${calmBucket}`].join("|");
    const list = buckets.get(bucketKey) || [];
    list.push(product);
    buckets.set(bucketKey, list);
  }

  return Array.from(buckets.values());
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

module.exports = {
  buildTurnoverDescriptor,
  buildTurnoverKey,
  summarizeTurnoverSamples,
  buildTurnoverMaps,
  getTurnoverTargetFactor,
  getMarketFactor,
  buildOrderEvents,
  createSimilarityProfile,
  buildSimilarityReference,
  createIntrinsicSortKey,
  compareIntrinsic,
  splitPricingBuckets,
  applyMonotonicCap,
};
