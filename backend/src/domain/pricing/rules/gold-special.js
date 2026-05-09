const {
  clamp,
  getConfiguredTermAttackReferenceRange,
  getConfiguredAttackRateByReferenceRange,
  getTermBucketRank,
} = require("../core/reference-caps");

function getConfiguredTermAttackAdjustment(tier, tierControl, product, referenceCaps, wear) {
  if (tier !== "gold" || !tierControl || getTermBucketRank(wear) < 1) {
    return {
      bonus_rate: 0,
      max_bonus_rate: 0,
      start_attack_rate: 0.95,
      penalty_rate: 0,
      max_penalty_rate: 0,
      penalty_start_attack_rate: 0.85,
      attack_value: Math.max(0, Number(product?.attack_value || 0)),
      effective_attack_rate: 0,
      reference_range: getConfiguredTermAttackReferenceRange(tierControl || {}, referenceCaps),
      multiplier: 1,
    };
  }

  const maxBonusRate = clamp(Number(tierControl?.term_attack_bonus_rate || 0), 0, 3);
  const startAttackRate = clamp(Number(tierControl?.term_attack_bonus_start_rate || 0.95), 0.5, 1);
  const maxPenaltyRate = clamp(Number(tierControl?.term_attack_penalty_rate || 0), 0, 1);
  const penaltyStartAttackRate = clamp(
    Number(tierControl?.term_attack_penalty_start_rate || 0.85),
    0.5,
    1
  );
  const attackReferenceRange = getConfiguredTermAttackReferenceRange(tierControl, referenceCaps);
  const attackValue = Math.max(0, Number(product?.attack_value || 0));
  const attackRate = getConfiguredAttackRateByReferenceRange(attackValue, attackReferenceRange);

  const bonusProgress =
    maxBonusRate <= 0 || attackRate <= startAttackRate
      ? 0
      : startAttackRate >= 1
        ? 1
        : clamp((attackRate - startAttackRate) / (1 - startAttackRate), 0, 1);
  const penaltyProgress =
    maxPenaltyRate <= 0 || attackRate >= penaltyStartAttackRate
      ? 0
      : clamp((penaltyStartAttackRate - attackRate) / Math.max(penaltyStartAttackRate, 0.0001), 0, 1);
  const bonusRate = maxBonusRate * bonusProgress;
  const penaltyRate = maxPenaltyRate * penaltyProgress;
  return {
    bonus_rate: Number(bonusRate.toFixed(4)),
    max_bonus_rate: Number(maxBonusRate.toFixed(4)),
    start_attack_rate: Number(startAttackRate.toFixed(4)),
    penalty_rate: Number(penaltyRate.toFixed(4)),
    max_penalty_rate: Number(maxPenaltyRate.toFixed(4)),
    penalty_start_attack_rate: Number(penaltyStartAttackRate.toFixed(4)),
    attack_value: Math.round(attackValue),
    effective_attack_rate: Number(attackRate.toFixed(4)),
    reference_range: attackReferenceRange,
    multiplier: Number((1 + bonusRate - penaltyRate).toFixed(4)),
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

function getEliteGoldProtectedBasePrice(product) {
  if (String(product?.tier || "") !== "gold") return 0;
  const atlas = product?.atlas || {};
  const wear = product?.wear || {};
  const attackRate = Number(atlas.attack_rate || 0);
  const hpRate = Number(atlas.hp_rate || 0);
  const termBucketRank = getTermBucketRank(wear);
  const intrinsicPrice = Math.max(
    Number(product?.intrinsic_auto_base_price || 0),
    Number(product?.auto_base_price || 0),
    0
  );

  if (attackRate >= 0.995 && hpRate >= 0.995) {
    return intrinsicPrice;
  }

  if (termBucketRank >= 2 && attackRate >= 0.95 && hpRate >= 0.9) {
    return intrinsicPrice;
  }

  if (termBucketRank >= 1 && attackRate >= 0.99 && hpRate >= 0.92) {
    return intrinsicPrice;
  }

  return 0;
}

module.exports = {
  getConfiguredTermAttackAdjustment,
  getGoldHighTermBonus,
  getFireBiasMultiplier,
  getCalmBiasMultiplier,
  getGoldSeasonPremium,
  getEliteGoldProtectedBasePrice,
};
