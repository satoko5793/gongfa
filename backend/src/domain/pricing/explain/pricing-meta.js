function buildPricingExplain({
  product,
  atlas,
  wear,
  referenceCaps,
  dominant,
  doubleTermBonus,
  legacyDiscount,
  termNoLowerThanAtlasFloor,
  isGoldNoTermDirectPricing,
}) {
  const attackValue = Number(product?.attack_value || 0);
  const hpValue = Number(product?.hp_value || 0);
  const attackMax = Math.max(Number(referenceCaps?.attack_max) || 0, 1);
  const hpMax = Math.max(Number(referenceCaps?.hp_max) || 0, 1);
  const exactDoubleFull = attackValue >= attackMax && hpValue >= hpMax;
  const atlasReference = atlas?.reference_range || null;
  const doubleFullQuota = Number(
    atlasReference?.double_full_quota ||
      atlas?.gold_no_term_profile?.double_full_quota ||
      0
  );
  const atlasPrice = Number(atlas?.price || 0);

  return {
    tier: String(product?.tier || ""),
    exact_double_full: exactDoubleFull,
    atlas_price: atlasPrice,
    wear_price: Number(wear?.price || 0),
    dominant_reason: dominant?.type || "",
    dominant_reason_label: dominant?.label || "",
    atlas_double_full_quota_hit:
      exactDoubleFull && doubleFullQuota > 0 && atlasPrice >= doubleFullQuota,
    atlas_double_full_quota: doubleFullQuota,
    term_floor_applied: Boolean(termNoLowerThanAtlasFloor?.applies),
    double_term_bonus_applied: Boolean(doubleTermBonus?.applies),
    legacy_discount_applied: Boolean(legacyDiscount?.applies),
    gold_special_applied:
      Boolean(atlas?.gold_no_term_profile) ||
      Number(wear?.attack_adjustment?.bonus_rate || 0) > 0 ||
      Number(wear?.attack_adjustment?.penalty_rate || 0) > 0 ||
      Boolean(isGoldNoTermDirectPricing),
  };
}

function buildPricingMeta({
  priceConfigVersion,
  product,
  rechargeConfig,
  source,
  floorPrice,
  referenceCaps,
  referenceSource,
  atlas,
  wear,
  similarity,
  market,
  rmbAnchor,
  atlasSeasonDecay,
  wearSeasonDecay,
  seasonAdjustedAtlasPrice,
  seasonAdjustedWearPrice,
  intrinsicAutoBasePrice,
  autoBasePrice,
  tierSoftDiscount,
  globalPriceAdjustment,
  adjustedAutoBasePrice,
  doubleTermBonus,
  legacyDiscount,
  termNoLowerThanAtlasFloor,
  rawAutoPrice,
  discountedAutoPrice,
  autoPrice,
  manualPrice,
  dominant,
  isGoldNoTermDirectPricing,
  tierControl,
}) {
  const explain = buildPricingExplain({
    product,
    atlas,
    wear,
    referenceCaps,
    dominant,
    doubleTermBonus,
    legacyDiscount,
    termNoLowerThanAtlasFloor,
    isGoldNoTermDirectPricing,
  });

  return {
    version: priceConfigVersion,
    source,
    tier: product.tier,
    floor_price: floorPrice,
    reference_caps: referenceCaps,
    reference_source: referenceSource,
    atlas,
    wear,
    similarity,
    market,
    rmb_anchor: rmbAnchor,
    pricing_controls: rechargeConfig?.pricing_controls?.enabled
      ? {
          tier_control: tierControl,
          atlas_reference: atlas?.reference_range || null,
          term_reference: wear?.reference_range || null,
          gold_no_term_profile: atlas?.gold_no_term_profile || null,
        }
      : null,
    atlas_season_decay: atlasSeasonDecay,
    wear_season_decay: wearSeasonDecay,
    season_adjusted_atlas_price: seasonAdjustedAtlasPrice,
    season_adjusted_wear_price: seasonAdjustedWearPrice,
    intrinsic_auto_base_price: intrinsicAutoBasePrice,
    auto_base_price: autoBasePrice,
    tier_soft_discount: tierSoftDiscount,
    global_price_adjustment: globalPriceAdjustment,
    adjusted_auto_base_price: adjustedAutoBasePrice,
    double_term_bonus: doubleTermBonus,
    legacy_discount: legacyDiscount,
    term_no_lower_than_atlas_floor: termNoLowerThanAtlasFloor,
    raw_auto_price: rawAutoPrice,
    discounted_auto_price: discountedAutoPrice,
    auto_price: autoPrice,
    manual_price: manualPrice,
    dominant_reason: dominant.type,
    dominant_reason_label: dominant.label,
    gold_no_term_direct_pricing: isGoldNoTermDirectPricing,
    explain,
  };
}

module.exports = {
  buildPricingExplain,
  buildPricingMeta,
};
