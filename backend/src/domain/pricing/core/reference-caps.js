const { LEGACY_CAPS } = require("../../../config/catalog-config");

const FIXED_QUOTA_ANCHOR_BY_LEGACY_ID = {
  601: { current_quota: 400000, legacy_delta: 100000, label: "rare_yunqijue" },
  602: { current_quota: 440000, legacy_delta: 100000, label: "rare_lianhuanmahopao" },
  603: { current_quota: 480000, legacy_delta: 100000, label: "rare_qiankunyizhi" },
};

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function roundPrice(value) {
  const num = Math.max(0, Number(value) || 0);
  if (num < 1000) return Math.round(num / 50) * 50;
  return Math.round(num / 100) * 100;
}

function parseTimestamp(value) {
  const date = new Date(value || 0);
  return Number.isFinite(date.getTime()) ? date : null;
}

function hasRareRmbAnchor(legacyId) {
  return Boolean(FIXED_QUOTA_ANCHOR_BY_LEGACY_ID[Number(legacyId)]);
}

function getFixedQuotaAnchor(product) {
  const anchor = FIXED_QUOTA_ANCHOR_BY_LEGACY_ID[Number(product?.legacy_id)];
  if (!anchor) return null;

  const isCurrentSeason = Boolean(product?.is_current_season);
  const baseQuota = Number(anchor.current_quota || 0);
  const legacyDelta = Number(anchor.legacy_delta || 0);
  const quotaAnchor = roundPrice(Math.max(0, isCurrentSeason ? baseQuota : baseQuota - legacyDelta));
  return {
    legacy_id: Number(product?.legacy_id || 0),
    anchor_type: "fixed_quota",
    is_current_season: isCurrentSeason,
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

function getConfiguredQuotaRange(tierControl, kind, fallbackMin, fallbackMax) {
  const minKey = kind === "atlas" ? "atlas_min_quota" : "term_min_quota";
  const maxKey = kind === "atlas" ? "atlas_max_quota" : "term_max_quota";
  const normalizedMin = Math.max(0, Number(tierControl?.[minKey]));
  const normalizedMax = Math.max(normalizedMin, Number(tierControl?.[maxKey]));

  return {
    min_quota: Number.isFinite(normalizedMin) ? normalizedMin : Math.max(0, Number(fallbackMin) || 0),
    max_quota: Number.isFinite(normalizedMax)
      ? normalizedMax
      : Math.max(Math.max(0, Number(fallbackMin) || 0), Number(fallbackMax) || 0),
  };
}

function getConfiguredAtlasDoubleFullQuota(tierControl, floorPrice, fallbackMax) {
  const normalizedMax = Math.max(floorPrice, Number(fallbackMax) || floorPrice);
  const configuredValue = Number(tierControl?.atlas_double_full_quota);
  if (!Number.isFinite(configuredValue)) return normalizedMax;
  return Math.max(normalizedMax, configuredValue);
}

function getConfiguredDecaySpeed(tierControl, kind, fallback = 1) {
  const key = kind === "atlas" ? "atlas_decay_speed" : "term_decay_speed";
  const numeric = Number(tierControl?.[key]);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(numeric, 0.2, 5);
}

function getConfiguredTermAttackReferenceRange(tierControl, referenceCaps) {
  const fallbackMax = Math.max(Number(referenceCaps?.attack_max) || 0, 1);
  const minValue = Math.max(0, Number(tierControl?.term_attack_reference_min_value) || 0);
  const maxValue = Math.max(minValue, Number(tierControl?.term_attack_reference_max_value) || fallbackMax);
  return {
    min_attack_value: Math.round(minValue),
    max_attack_value: Math.round(maxValue),
  };
}

function getConfiguredAttackRateByReferenceRange(attackValue, referenceRange) {
  const minAttackValue = Math.max(0, Number(referenceRange?.min_attack_value) || 0);
  const maxAttackValue = Math.max(minAttackValue, Number(referenceRange?.max_attack_value) || 0);
  const attackSpan = Math.max(maxAttackValue - minAttackValue, 0);
  if (attackSpan <= 0) {
    return attackValue >= maxAttackValue ? 1 : 0;
  }
  return clamp((attackValue - minAttackValue) / attackSpan, 0, 1);
}

function getConfiguredTermValueReferenceRange(tierControl, referenceCaps) {
  const fallbackMax = Math.max(
    Number(referenceCaps?.fire_total_max) || 0,
    Number(referenceCaps?.calm_total_max) || 0,
    0
  );
  const minValue = Math.max(0, Number(tierControl?.term_value_reference_min) || 0);
  const maxValue = Math.max(minValue, Number(tierControl?.term_value_reference_max) || fallbackMax);
  return {
    min_term_value: Number(minValue.toFixed(2)),
    max_term_value: Number(maxValue.toFixed(2)),
  };
}

function getConfiguredTermRateByReferenceRange(termValue, referenceRange) {
  const minTermValue = Math.max(0, Number(referenceRange?.min_term_value) || 0);
  const maxTermValue = Math.max(minTermValue, Number(referenceRange?.max_term_value) || 0);
  const termSpan = Math.max(maxTermValue - minTermValue, 0);
  if (termSpan <= 0) {
    return termValue >= maxTermValue ? 1 : 0;
  }
  return clamp((termValue - minTermValue) / termSpan, 0, 1);
}

function getConfiguredGoldNoTermProfile(tierControl, floorPrice) {
  const minQuota = Math.max(floorPrice, Number(tierControl?.no_term_min_quota) || floorPrice);
  const fullAttackQuota = Math.max(minQuota, Number(tierControl?.no_term_full_attack_quota) || minQuota);
  const doubleFullQuota = Math.max(
    fullAttackQuota,
    Number(tierControl?.no_term_double_full_quota) || fullAttackQuota
  );
  const hpBonusStartValue = Math.max(0, Number(tierControl?.no_term_hp_bonus_start_value) || 0);
  return {
    min_quota: Math.round(minQuota),
    full_attack_quota: Math.round(fullAttackQuota),
    double_full_quota: Math.round(doubleFullQuota),
    hp_bonus_start_value: Math.round(hpBonusStartValue),
  };
}

function isExactDoubleFull(product, referenceCaps) {
  const attackValue = Number(product?.attack_value || 0);
  const hpValue = Number(product?.hp_value || 0);
  const attackMax = Math.max(Number(referenceCaps?.attack_max) || 0, 1);
  const hpMax = Math.max(Number(referenceCaps?.hp_max) || 0, 1);
  return attackValue >= attackMax && hpValue >= hpMax;
}

function mapScoreToConfiguredQuota(score, range, exponent = 1) {
  const normalizedScore = clamp(score, 0, 1);
  const normalizedExponent = Math.max(0.35, Number(exponent) || 1);
  const minQuota = Math.max(0, Number(range?.min_quota) || 0);
  const maxQuota = Math.max(minQuota, Number(range?.max_quota) || 0);
  return roundPrice(minQuota + (maxQuota - minQuota) * Math.pow(normalizedScore, normalizedExponent));
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

function getTermLevelBucket(value) {
  const numeric = Number(value) || 0;
  if (numeric <= 0) return "0.0";
  return (Math.round(numeric * 10) / 10).toFixed(1);
}

function getTermBucketRank(wear = {}) {
  const termCount = (Number(wear.fire_count) || 0) + (Number(wear.calm_count) || 0);
  if (termCount >= 2) return 2;
  if (termCount >= 1) return 1;
  return 0;
}

module.exports = {
  FIXED_QUOTA_ANCHOR_BY_LEGACY_ID,
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
  isExactDoubleFull,
  mapScoreToConfiguredQuota,
  parseTermMetrics,
  buildConfiguredMaxMap,
  getTermLevelBucket,
  getTermBucketRank,
};
