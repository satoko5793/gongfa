const {
  clamp,
  roundPrice,
  getLegacyTier,
  getConfiguredQuotaRange,
  getConfiguredDecaySpeed,
  getConfiguredTermValueReferenceRange,
  getConfiguredTermRateByReferenceRange,
  parseTermMetrics,
} = require("../core/reference-caps");
const {
  getConfiguredTermAttackAdjustment,
  getGoldHighTermBonus,
  getFireBiasMultiplier,
  getCalmBiasMultiplier,
  getGoldSeasonPremium,
} = require("./gold-special");

function getWearProfile(termMetrics) {
  const fireCount = termMetrics.fire_count;
  const calmCount = termMetrics.calm_count;
  if (fireCount === 0 && calmCount === 0) return { kind: "none", basePrice: 0 };
  if (fireCount >= 1 && calmCount >= 1) return { kind: "dual_mixed", basePrice: 22500 };
  if (fireCount >= 1) return { kind: "single_fire", basePrice: 9000 };
  return { kind: "single_calm", basePrice: 6000 };
}

function getInterpolatedTermCurve(termValue, points) {
  const value = Number(termValue) || 0;
  if (!Array.isArray(points) || points.length === 0) return 0;
  if (value <= Number(points[0][0])) return Number(points[0][1]) || 0;

  for (let index = 1; index < points.length; index += 1) {
    const [rightX, rightY] = points[index];
    const [leftX, leftY] = points[index - 1];
    if (value <= Number(rightX)) {
      const ratio = (value - Number(leftX)) / Math.max(Number(rightX) - Number(leftX), 0.0001);
      return Number(leftY) + (Number(rightY) - Number(leftY)) * ratio;
    }
  }

  return Number(points[points.length - 1][1]) || 0;
}

function getGoldSingleTermCurveBase(kind, termValue) {
  const fireCurve = [
    [0, 0],
    [2.1, 2800],
    [2.2, 3400],
    [2.3, 4300],
    [2.4, 6000],
    [2.5, 8600],
    [2.6, 11800],
    [2.7, 17000],
    [2.8, 24500],
    [2.9, 33500],
    [3.0, 45000],
  ];
  const calmCurve = [
    [0, 0],
    [2.1, 1800],
    [2.2, 2200],
    [2.3, 2800],
    [2.4, 3800],
    [2.5, 5200],
    [2.6, 7200],
    [2.7, 9800],
    [2.8, 13800],
    [2.9, 18500],
    [3.0, 22000],
  ];

  return getInterpolatedTermCurve(termValue, kind === "single_calm" ? calmCurve : fireCurve);
}

function getWearPrice(product, atlas, referenceCaps, tierRule, pricingControl = null) {
  const termMetrics = parseTermMetrics(product.ext_attrs);
  const wearProfile = getWearProfile(termMetrics);
  const tier = getLegacyTier(product.legacy_id);
  const termDecaySpeed = pricingControl ? getConfiguredDecaySpeed(pricingControl, "term", 1) : 1;
  const termValueReferenceRange = pricingControl
    ? getConfiguredTermValueReferenceRange(pricingControl, referenceCaps)
    : null;
  if (wearProfile.basePrice <= 0) {
    return {
      ...termMetrics,
      kind: wearProfile.kind,
      fire_rate: 0,
      calm_rate: 0,
      quality_score: 0,
      control_score: 0,
      decay_speed: Number(termDecaySpeed.toFixed(2)),
      price: 0,
      reference_range: pricingControl
        ? getConfiguredQuotaRange(pricingControl, "term", 0, 0)
        : null,
      term_value_reference_range: termValueReferenceRange,
    };
  }

  const rawFireRate = termMetrics.fire_total
    ? clamp(
        termMetrics.fire_total /
          Math.max(Number(referenceCaps.fire_total_max) || 0, termMetrics.fire_total, 0.1),
        0,
        1
      )
    : 0;
  const rawCalmRate = termMetrics.calm_total
    ? clamp(
        termMetrics.calm_total /
          Math.max(Number(referenceCaps.calm_total_max) || 0, termMetrics.calm_total, 0.1),
        0,
        1
      )
    : 0;
  const fireRate = termMetrics.fire_total
    ? termValueReferenceRange
      ? getConfiguredTermRateByReferenceRange(termMetrics.fire_total, termValueReferenceRange)
      : rawFireRate
    : 0;
  const calmRate = termMetrics.calm_total
    ? termValueReferenceRange
      ? getConfiguredTermRateByReferenceRange(termMetrics.calm_total, termValueReferenceRange)
      : rawCalmRate
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
  const baseControlScore = clamp(
    clamp(qualityScore / 1.45, 0, 1) * 0.62 +
      Math.max(fireRate, calmRate) * 0.26 +
      clamp((termMetrics.fire_count + termMetrics.calm_count) / 2, 0, 1) * 0.12,
    0,
    1
  );
  const controlScore = clamp(
    baseControlScore +
      (wearProfile.kind === "dual_mixed" ? 0.08 : 0) +
      (Math.max(Number(termMetrics.fire_total || 0), Number(termMetrics.calm_total || 0)) >= 2.5
        ? 0.05
        : 0),
    0,
    1
  );
  let wearPrice = 0;
  let referenceRange = null;

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
  } else if (
    tier === "gold" &&
    (wearProfile.kind === "single_fire" || wearProfile.kind === "single_calm")
  ) {
    const peakTerm =
      wearProfile.kind === "single_calm"
        ? Number(termMetrics.calm_total || 0)
        : Number(termMetrics.fire_total || 0);
    const curveBase = getGoldSingleTermCurveBase(wearProfile.kind, peakTerm);
    const statFactor = 0.9 + Number(atlas?.score || 0) * 0.16;
    const singleTermSeasonPremium = product?.is_current_season ? 300 : 0;
    wearPrice = curveBase * statFactor + singleTermSeasonPremium;
  } else {
    wearPrice =
      (wearProfile.basePrice + highTermBonus + seasonPremium) *
      (0.7 + qualityScore * 0.35) *
      statsBonus *
      termBiasMultiplier *
      Number(tierRule?.wearMultiplier || 1);
  }

  if (pricingControl) {
    referenceRange = getConfiguredQuotaRange(pricingControl, "term", 0, wearPrice);
    wearPrice = mapScoreToConfiguredQuotaLocal(
      controlScore,
      referenceRange,
      (tier === "gold" ? 1.6 : 1.24) * termDecaySpeed
    );
  }

  const attackAdjustment = getConfiguredTermAttackAdjustment(tier, pricingControl, product, referenceCaps, {
    ...wearProfile,
    ...termMetrics,
  });
  wearPrice *= Number(attackAdjustment.multiplier || 1);

  return {
    ...termMetrics,
    kind: wearProfile.kind,
    base_price: wearProfile.basePrice,
    fire_rate: Number(fireRate.toFixed(4)),
    raw_fire_rate: Number(rawFireRate.toFixed(4)),
    calm_rate: Number(calmRate.toFixed(4)),
    raw_calm_rate: Number(rawCalmRate.toFixed(4)),
    quality_score: Number(qualityScore.toFixed(4)),
    high_term_bonus: roundPrice(highTermBonus),
    season_premium: roundPrice(seasonPremium),
    fire_bias_multiplier: Number(fireBiasMultiplier.toFixed(4)),
    calm_bias_multiplier: Number(calmBiasMultiplier.toFixed(4)),
    term_bias_multiplier: Number(termBiasMultiplier.toFixed(4)),
    control_score: Number(controlScore.toFixed(4)),
    decay_speed: Number(termDecaySpeed.toFixed(2)),
    attack_adjustment: attackAdjustment,
    price: roundPrice(wearPrice),
    reference_range: referenceRange,
    term_value_reference_range: termValueReferenceRange,
  };
}

function mapScoreToConfiguredQuotaLocal(score, range, exponent = 1) {
  const normalizedScore = clamp(score, 0, 1);
  const normalizedExponent = Math.max(0.35, Number(exponent) || 1);
  const minQuota = Math.max(0, Number(range?.min_quota) || 0);
  const maxQuota = Math.max(minQuota, Number(range?.max_quota) || 0);
  return roundPrice(minQuota + (maxQuota - minQuota) * Math.pow(normalizedScore, normalizedExponent));
}

module.exports = {
  getWearProfile,
  getInterpolatedTermCurve,
  getGoldSingleTermCurveBase,
  getWearPrice,
};
