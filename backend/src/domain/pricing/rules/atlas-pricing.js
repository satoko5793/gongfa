const {
  clamp,
  roundPrice,
  hasRareRmbAnchor,
  getLegacyTier,
  getConfiguredQuotaRange,
  getConfiguredAtlasDoubleFullQuota,
  getConfiguredDecaySpeed,
  getConfiguredTermAttackReferenceRange,
  getConfiguredAttackRateByReferenceRange,
  getConfiguredGoldNoTermProfile,
  parseTermMetrics,
  getTermBucketRank,
} = require("../core/reference-caps");

function getTierPricingControl(rechargeConfig, tier) {
  if (!rechargeConfig?.pricing_controls?.enabled) return null;
  const tierControl = rechargeConfig?.pricing_controls?.tiers?.[tier];
  if (!tierControl || typeof tierControl !== "object") return null;
  return tierControl;
}

function getAtlasPrice(product, tierRule, referenceCaps, priceConfig, pricingControl = null) {
  const attackValue = Number(product.attack_value) || 0;
  const hpValue = Number(product.hp_value) || 0;
  const attackMax = Math.max(Number(referenceCaps.attack_max) || 0, attackValue, 1);
  const hpMax = Math.max(Number(referenceCaps.hp_max) || 0, hpValue, 1);
  const tier = getLegacyTier(product.legacy_id);
  const attackReferenceRange = pricingControl
    ? getConfiguredTermAttackReferenceRange(pricingControl, referenceCaps)
    : null;
  const rawAttackRate = clamp(attackValue / attackMax, 0, 1);
  const attackRate = attackReferenceRange
    ? getConfiguredAttackRateByReferenceRange(attackValue, attackReferenceRange)
    : rawAttackRate;
  const hpRate = clamp(hpValue / hpMax, 0, 1);
  const exactAttackFull = attackValue >= attackMax;
  const exactHpFull = hpValue >= hpMax;
  const exactDoubleFull = exactAttackFull && exactHpFull;
  const exactCombinedRate = attackRate * hpRate;
  const floorPrice = tierRule.salvageQuota * Number(priceConfig?.floorMultiplier || 2);
  let atlasScore = attackRate * 0.72 + hpRate * 0.28;
  let atlasPrice = 0;
  let referenceRange = null;
  let goldNoTermProfile = null;
  let atlasDoubleFullQuota = null;
  const termBucketRank = getTermBucketRank(parseTermMetrics(product?.ext_attrs));
  const atlasDecaySpeed = pricingControl ? getConfiguredDecaySpeed(pricingControl, "atlas", 1) : 1;
  const tierCurvePowerMap = {
    green: 1.28,
    blue: 1.34,
    purple: 1.14,
    orange: 1.18,
    red: 1.22,
  };

  if (tier === "orange" || tier === "red" || tier === "purple") {
    atlasScore = clamp(Math.pow(clamp(exactCombinedRate, 0, 1), tierCurvePowerMap[tier] || 1), 0, 1);
    if (pricingControl) {
      referenceRange = getConfiguredQuotaRange(
        pricingControl,
        "atlas",
        floorPrice,
        tierRule.fullAtlasAnchor
      );
      atlasDoubleFullQuota = getConfiguredAtlasDoubleFullQuota(
        pricingControl,
        floorPrice,
        referenceRange.max_quota
      );
      atlasPrice = mapScoreToConfiguredQuota(
        atlasScore,
        {
          min_quota: Math.max(floorPrice, referenceRange.min_quota),
          max_quota: Math.max(floorPrice, referenceRange.max_quota),
        },
        tierRule.atlasExponent * 2.2 * atlasDecaySpeed
      );
    } else {
      atlasPrice =
        floorPrice +
        (tierRule.fullAtlasAnchor - floorPrice) *
          Math.pow(atlasScore, tierRule.atlasExponent * 2.2);
    }
  } else {
    const isGoldNoTermWithControls = tier === "gold" && pricingControl && termBucketRank < 1;
    if (isGoldNoTermWithControls) {
      goldNoTermProfile = getConfiguredGoldNoTermProfile(pricingControl, floorPrice);
      const hpBaselineRate = Math.pow(
        clamp(
          hpValue / Math.max(Number(goldNoTermProfile.hp_bonus_start_value || hpMax), 1),
          0,
          1
        ),
        2.2
      );
      atlasScore = clamp(attackRate * 0.88 + hpBaselineRate * 0.12, 0, 1);
    }
    if (attackRate >= 0.995) atlasScore += 0.04;
    if (hpRate >= 0.95 && !isGoldNoTermWithControls) atlasScore += 0.03;
    atlasScore = clamp(Math.pow(clamp(atlasScore, 0, 1), tierCurvePowerMap[tier] || 1), 0, 1);
    if (pricingControl) {
      if (goldNoTermProfile) {
        referenceRange = {
          min_quota: Math.max(floorPrice, Number(goldNoTermProfile.min_quota || floorPrice)),
          max_quota: Math.max(
            Math.max(floorPrice, Number(goldNoTermProfile.min_quota || floorPrice)),
            Number(goldNoTermProfile.full_attack_quota || floorPrice)
          ),
        };
        atlasDoubleFullQuota = Math.max(
          referenceRange.max_quota,
          Number(goldNoTermProfile.double_full_quota || referenceRange.max_quota)
        );
        const baseAtlasPrice = mapScoreToConfiguredQuota(atlasScore, referenceRange, 1.2 * atlasDecaySpeed);
        const hpBonusStartValue = Math.max(
          0,
          Number(goldNoTermProfile.hp_bonus_start_value || hpMax)
        );
        const hpTopProgress =
          hpValue <= hpBonusStartValue
            ? 0
            : clamp((hpValue - hpBonusStartValue) / Math.max(hpMax - hpBonusStartValue, 1), 0, 1);
        const attackTopGate = clamp((attackRate - 0.98) / 0.02, 0, 1);
        const topBonus =
          (Number(goldNoTermProfile.double_full_quota || 0) -
            Number(goldNoTermProfile.full_attack_quota || 0)) *
          hpTopProgress *
          attackTopGate;
        atlasPrice = baseAtlasPrice + topBonus;
      } else {
        referenceRange = getConfiguredQuotaRange(
          pricingControl,
          "atlas",
          floorPrice,
          tierRule.fullAtlasAnchor
        );
        atlasDoubleFullQuota = getConfiguredAtlasDoubleFullQuota(
          pricingControl,
          floorPrice,
          referenceRange.max_quota
        );
        atlasPrice = mapScoreToConfiguredQuota(
          atlasScore,
          {
            min_quota: Math.max(floorPrice, referenceRange.min_quota),
            max_quota: Math.max(floorPrice, referenceRange.max_quota),
          },
          tierRule.atlasExponent * atlasDecaySpeed
        );
      }
    } else {
      atlasPrice =
        floorPrice +
        (tierRule.fullAtlasAnchor - floorPrice) * Math.pow(atlasScore, tierRule.atlasExponent);
    }
  }

  if (tier === "gold" && !pricingControl) {
    const goldBaseRate = clamp(attackRate * 0.82 + hpRate * 0.18, 0, 1);
    atlasPrice =
      floorPrice +
      (8000 - floorPrice) * Math.pow(goldBaseRate, 8.6) +
      (attackRate >= 0.985 ? 1800 * Math.pow(hpRate, 5.4) : 0) +
      (attackRate >= 0.995 ? 3200 * Math.pow(hpRate, 6.2) : 0);
    if (attackRate >= 0.995) atlasPrice = Math.max(atlasPrice, 8000);
    if (attackRate >= 0.995 && hpRate >= 0.88) atlasPrice = Math.max(atlasPrice, 12000);
    if (attackRate >= 0.995 && hpRate >= 0.995) atlasPrice = Math.max(atlasPrice, 50000);
  } else if (
    !pricingControl &&
    exactDoubleFull &&
    Number.isFinite(Number(tierRule.doubleFullAtlasAnchor))
  ) {
    atlasPrice = Math.max(atlasPrice, Number(tierRule.doubleFullAtlasAnchor));
  }

  if (pricingControl && exactDoubleFull) {
    atlasPrice = Math.max(
      atlasPrice,
      Math.max(
        floorPrice,
        Number(
          atlasDoubleFullQuota ||
            goldNoTermProfile?.double_full_quota ||
            referenceRange?.double_full_quota ||
            referenceRange?.max_quota ||
            tierRule.fullAtlasAnchor ||
            0
        )
      )
    );
  }

  return {
    attack_rate: Number(attackRate.toFixed(4)),
    raw_attack_rate: Number(rawAttackRate.toFixed(4)),
    hp_rate: Number(hpRate.toFixed(4)),
    score: Number(atlasScore.toFixed(4)),
    decay_speed: Number(atlasDecaySpeed.toFixed(2)),
    price: roundPrice(atlasPrice),
    reference_range: referenceRange
      ? {
          ...referenceRange,
          double_full_quota: atlasDoubleFullQuota,
        }
      : null,
    attack_reference_range: attackReferenceRange,
    gold_no_term_profile: goldNoTermProfile,
  };
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

function getGlobalPriceAdjustment(product, referenceCaps, priceConfig) {
  if (!product) {
    return { applied: false, rate: 1, reason: "missing_product" };
  }

  if (hasRareRmbAnchor(product.legacy_id) || product.rmb_anchor) {
    return { applied: false, rate: 1, reason: "rare_exempt" };
  }

  const wear = product.wear || {};
  if (getTermBucketRank(wear) >= 2) {
    return { applied: false, rate: 1, reason: "double_term_exempt" };
  }

  const attackValue = Number(product?.attack_value || 0);
  const hpValue = Number(product?.hp_value || 0);
  const attackMax = Math.max(Number(referenceCaps?.attack_max) || 0, 1);
  const hpMax = Math.max(Number(referenceCaps?.hp_max) || 0, 1);
  const exactDoubleFull = attackValue >= attackMax && hpValue >= hpMax;
  if (exactDoubleFull) {
    return { applied: false, rate: 1, reason: "double_full_exempt" };
  }

  const rate = Number(priceConfig?.broadDiscountRate || 1);
  if (rate >= 1) {
    return {
      applied: false,
      rate: 1,
      reason: "broad_discount_disabled",
    };
  }

  return {
    applied: true,
    rate,
    reason: "broad_market_discount",
  };
}

function mapScoreToConfiguredQuota(score, range, exponent = 1) {
  const normalizedScore = clamp(score, 0, 1);
  const normalizedExponent = Math.max(0.35, Number(exponent) || 1);
  const minQuota = Math.max(0, Number(range?.min_quota) || 0);
  const maxQuota = Math.max(minQuota, Number(range?.max_quota) || 0);
  return roundPrice(minQuota + (maxQuota - minQuota) * Math.pow(normalizedScore, normalizedExponent));
}

module.exports = {
  getTierPricingControl,
  getAtlasPrice,
  getTierSoftDiscount,
  getGlobalPriceAdjustment,
};
