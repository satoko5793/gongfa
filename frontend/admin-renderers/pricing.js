export function renderPricingSummaryView(product, pricingMeta, { escapeHtml, formatQuotaCashPair }) {
  const atlasPrice = Number(pricingMeta?.atlas?.price || 0);
  const wearPrice = Number(pricingMeta?.wear?.price || 0);
  const marketFactor = Number(pricingMeta?.market?.factor || 1).toFixed(2);
  const attackRate = formatRate(pricingMeta?.atlas?.attack_rate);
  const hpRate = formatRate(pricingMeta?.atlas?.hp_rate);
  const fireRate = formatRate(pricingMeta?.wear?.fire_rate);
  const calmRate = formatRate(pricingMeta?.wear?.calm_rate);
  const referenceCaps = pricingMeta?.reference_caps || {};
  const atlasReference = pricingMeta?.atlas?.reference_range;
  const termReference = pricingMeta?.wear?.reference_range;
  const attackAdjustment = pricingMeta?.wear?.attack_adjustment || null;
  const legacyDiscount = pricingMeta?.legacy_discount || null;
  const legacyDiscountLabel =
    legacyDiscount?.profile === "legacy_double_term" ? "双词条老卡" : "老卡";
  const doubleTermBonus = pricingMeta?.double_term_bonus || null;
  const termFloor = pricingMeta?.term_no_lower_than_atlas_floor || null;
  const explain = pricingMeta?.explain || {};
  const manualPrice = pricingMeta?.manual_price;
  const finalPrice = Number(product.price_quota || 0);
  const explainTags = [
    explain?.exact_double_full ? "严格双满" : "非严格双满",
    explain?.atlas_double_full_quota_hit ? "命中双满保底" : "未命中双满保底",
    explain?.term_floor_applied ? "词条不低于无词条已抬价" : "无词条保底未触发",
    explain?.double_term_bonus_applied ? "双词条涨幅已生效" : "双词条涨幅未生效",
    explain?.legacy_discount_applied ? "老卡折扣已生效" : "老卡折扣未生效",
    explain?.gold_special_applied ? "金卡专属规则已命中" : "金卡专属规则未命中",
  ];

  return `
    <div class="pricing-chip-row">
      <span class="pricing-chip">${escapeHtml(pricingMeta?.dominant_reason_label || "reason")}</span>
      <span class="pricing-chip">${escapeHtml(pricingMeta?.source === "manual" ? "manual" : "auto")}</span>
      <span class="pricing-chip">market ${marketFactor}</span>
      <span class="pricing-chip">${escapeHtml(pricingMeta?.reference_source || "reference")}</span>
    </div>
    <div class="pricing-grid">
      <div class="pricing-block">
        <strong>Atlas</strong>
        <span>${atlasPrice}</span>
        <small>ATK ${attackRate} / HP ${hpRate}${atlasReference ? ` / 参考 ${atlasReference.min_quota}-${atlasReference.max_quota}` : ""}${Number(explain?.atlas_double_full_quota || 0) > 0 ? ` / 双满保底 ${Number(explain.atlas_double_full_quota)}` : ""}</small>
      </div>
      <div class="pricing-block">
        <strong>Wear</strong>
        <span>${wearPrice}</span>
        <small>Fire ${fireRate} / Calm ${calmRate}${termReference ? ` / 参考 ${termReference.min_quota}-${termReference.max_quota}` : ""}${pricingMeta?.wear?.term_value_reference_range ? ` / 词条参考 ${Number(pricingMeta.wear.term_value_reference_range.min_term_value || 0).toFixed(1)}-${Number(pricingMeta.wear.term_value_reference_range.max_term_value || 0).toFixed(1)}` : ""}${attackAdjustment?.reference_range ? ` / 攻击参考 ${Number(attackAdjustment.reference_range.min_attack_value || 0)}-${Number(attackAdjustment.reference_range.max_attack_value || 0)}` : ""}${attackAdjustment && Number(attackAdjustment.bonus_rate || 0) > 0 ? ` / 高攻 +${(Number(attackAdjustment.bonus_rate || 0) * 100).toFixed(1)}%` : ""}${attackAdjustment && Number(attackAdjustment.penalty_rate || 0) > 0 ? ` / 低攻 -${(Number(attackAdjustment.penalty_rate || 0) * 100).toFixed(1)}%` : ""}</small>
      </div>
      <div class="pricing-block">
        <strong>Final</strong>
        <span>${finalPrice}</span>
        <small>Floor ${Number(pricingMeta?.floor_price || 0)} / ${escapeHtml(formatQuotaCashPair(finalPrice))}${doubleTermBonus?.applies ? ` / 双词条 +${Number(doubleTermBonus.percent || 0)}%` : ""}${legacyDiscount?.applies ? ` / ${escapeHtml(legacyDiscountLabel)} ${Number(legacyDiscount.rate_percent || 100)}折` : ""}${termFloor?.applies ? ` / 词条保底 ${Number(termFloor.floor_price || 0)}` : ""}</small>
      </div>
      <div class="pricing-block">
        <strong>${pricingMeta?.source === "manual" ? "Manual" : "Caps"}</strong>
        <span>${
          pricingMeta?.source === "manual"
            ? Number(manualPrice || 0)
            : `${Number(referenceCaps.attack_max || 0)} / ${Number(referenceCaps.hp_max || 0)}`
        }</span>
        <small>${
          pricingMeta?.source === "manual"
            ? escapeHtml(formatQuotaCashPair(Number(manualPrice || 0)))
            : `${Number(referenceCaps.fire_total_max || 0)} / ${Number(referenceCaps.calm_total_max || 0)}`
        }</small>
      </div>
    </div>
    <div class="pricing-chip-row">
      ${explainTags.map((label) => `<span class="pricing-chip">${escapeHtml(label)}</span>`).join("")}
    </div>
  `;
}

function formatRate(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return `${(numeric * 100).toFixed(1)}%`;
}
