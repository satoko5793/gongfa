const {
  clamp,
  hasRareRmbAnchor,
  isExactDoubleFull,
  getTermBucketRank,
  roundPrice,
} = require("../core/reference-caps");

function getLegacyDiscountProfile(rechargeConfig, product, referenceCaps, hasManualPrice) {
  const pricingControls = rechargeConfig?.pricing_controls || {};
  const termBucketRank = getTermBucketRank(product?.wear || {});
  const isDoubleTerm = termBucketRank >= 2;
  const regularRate = clamp(Number(pricingControls.legacy_discount_rate || 100), 1, 100);
  const doubleTermRate = clamp(
    Number(pricingControls.legacy_double_term_discount_rate || 100),
    1,
    100
  );
  const rate = isDoubleTerm ? doubleTermRate : regularRate;
  const isLegacy = !Boolean(product?.is_current_season);
  const isRare = hasRareRmbAnchor(product?.legacy_id) || Boolean(product?.rmb_anchor);
  const exactDoubleFull = isExactDoubleFull(product, referenceCaps);
  const applies =
    !hasManualPrice &&
    isLegacy &&
    rate < 100 &&
    !isRare &&
    !exactDoubleFull;
  return {
    rate_percent: Math.round(rate),
    multiplier: Number((rate / 100).toFixed(4)),
    applies,
    profile: isDoubleTerm ? "legacy_double_term" : "legacy_regular",
    term_bucket_rank: termBucketRank,
    skipped_reason: !isLegacy
      ? "current_season"
      : hasManualPrice
        ? "manual_price"
        : isRare
          ? "rare_exempt"
          : exactDoubleFull
            ? "double_full_exempt"
            : rate >= 100
              ? isDoubleTerm
                ? "double_term_discount_disabled"
                : "discount_disabled"
              : "applied",
  };
}

function getDoubleTermBonusProfile(rechargeConfig, wear, hasManualPrice) {
  const percent = clamp(
    Number(rechargeConfig?.pricing_controls?.double_term_bonus_percent || 0),
    0,
    300
  );
  const applies = !hasManualPrice && getTermBucketRank(wear) >= 2 && percent > 0;
  return {
    percent: Math.round(percent),
    multiplier: Number((1 + percent / 100).toFixed(4)),
    applies,
  };
}

function buildTermNoLowerThanAtlasFloorProfile({
  product,
  tierSoftDiscount,
  globalPriceAdjustment,
  legacyDiscount,
  hasManualPrice,
  protectedBasePriceResolver,
}) {
  const termBucketRank = getTermBucketRank(product?.wear || {});
  if (hasManualPrice) {
    return {
      applies: false,
      reason: "manual_price",
      term_bucket_rank: termBucketRank,
      floor_price: 0,
    };
  }
  if (termBucketRank < 1) {
    return {
      applies: false,
      reason: "no_term_card",
      term_bucket_rank: termBucketRank,
      floor_price: 0,
    };
  }

  const atlasOnlyBasePrice = roundPrice(
    Number(product?.season_adjusted_atlas_price || product?.atlas?.price || 0)
  );
  const protectedBasePrice = Math.max(
    Number(product?.floor_price || 0),
    atlasOnlyBasePrice,
    Number(typeof protectedBasePriceResolver === "function" ? protectedBasePriceResolver(product) : 0)
  );
  const adjustedBasePrice = Math.max(
    Number(product?.floor_price || 0),
    roundPrice(
      protectedBasePrice *
        Number(tierSoftDiscount?.rate || 1) *
        Number(globalPriceAdjustment?.rate || 1)
    )
  );
  const discountedFloorPrice = roundPrice(
    adjustedBasePrice * Number(legacyDiscount?.applies ? legacyDiscount.multiplier : 1)
  );

  return {
    applies: true,
    reason: "term_not_below_atlas_floor",
    term_bucket_rank: termBucketRank,
    atlas_only_base_price: atlasOnlyBasePrice,
    protected_base_price: protectedBasePrice,
    adjusted_base_price: adjustedBasePrice,
    floor_price: Math.max(Number(product?.floor_price || 0), discountedFloorPrice),
  };
}

module.exports = {
  getLegacyDiscountProfile,
  getDoubleTermBonusProfile,
  buildTermNoLowerThanAtlasFloorProfile,
};
