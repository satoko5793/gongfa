export function normalizeDrawServiceAmount(value, { minQuota = 200, stepQuota = 200 } = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const roundedAmount = Math.ceil(amount / stepQuota) * stepQuota;
  return Math.max(minQuota, roundedAmount);
}

export function normalizeDrawServiceWan(value, { minDrawWan = 1, stepDrawWan = 1 } = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const roundedAmount = Math.ceil(amount / stepDrawWan) * stepDrawWan;
  return Math.max(minDrawWan, roundedAmount);
}

export function getDrawServiceSelectionQuote(ctx, drawWanValue = null, tierKeyValue = null) {
  const config = ctx.getDrawServiceConfig();
  if (config?.enabled === false) return null;
  const tiers = Array.isArray(config?.tiers) ? config.tiers : [];
  const tierKey = String(tierKeyValue || ctx.getSelectedDrawServiceTierKey() || config?.default_tier_key || "").trim();
  const tier =
    tiers.find((item) => String(item.key || "") === tierKey) ||
    tiers.find((item) => String(item.key || "") === String(config?.default_tier_key || "")) ||
    tiers[0] ||
    null;
  const drawAmountWan = ctx.normalizeDrawServiceWan(
    drawWanValue === null ? ctx.getSelectedDrawServiceWan() : drawWanValue
  );
  if (!tier || !drawAmountWan) return null;
  if (tier.requires_season_member && !ctx.getCurrentProfile()?.season_member_active) {
    return {
      tier,
      tierKey: String(tier.key || ""),
      drawAmountWan,
      blockedReason: "season_member_required",
    };
  }
  if (
    Number(tier.max_draw_wan_per_order || 0) > 0 &&
    Number(drawAmountWan || 0) > Number(tier.max_draw_wan_per_order || 0)
  ) {
    return {
      tier,
      tierKey: String(tier.key || ""),
      drawAmountWan,
      blockedReason: "season_member_draw_benefit_max_exceeded",
      maxDrawWan: Number(tier.max_draw_wan_per_order || 0),
    };
  }
  const cashAmountYuan = Number((drawAmountWan * Number(tier.price_yuan_per_wan || 0)).toFixed(2));
  const quotaPerYuan = Number(ctx.getEffectiveRechargeConfig()?.quota_per_yuan || 1250);
  const amountQuota = Math.max(1, Math.round(cashAmountYuan * quotaPerYuan));
  const rechargeConfig = ctx.getEffectiveRechargeConfig() || {};
  const paymentMethod =
    String(tier.payment_method || "").trim() === "residual_transfer"
      ? "residual_transfer"
      : "quota";
  if (paymentMethod === "residual_transfer" && rechargeConfig.residual_transfer_enabled === false) {
    return {
      tier,
      tierKey: String(tier.key || ""),
      drawAmountWan,
      blockedReason: "residual_transfer_disabled",
    };
  }
  const transferAmount =
    paymentMethod === "residual_transfer"
      ? Math.max(1, Math.ceil(drawAmountWan * Number(tier.transfer_amount_per_wan || 10000)))
      : null;
  return {
    tier,
    tierKey: String(tier.key || ""),
    drawAmountWan,
    cashAmountYuan,
    amountQuota,
    paymentMethod,
    transferAmount,
    transferUnit: rechargeConfig.residual_unit_label || "残卷",
    transferTargetRoleId: rechargeConfig.residual_admin_role_id || "584967604",
    transferTargetRoleName: rechargeConfig.residual_admin_role_name || "admin残卷",
  };
}

export function updateDrawServiceQuoteRuntime(ctx) {
  const amountInput = document.getElementById("draw-service-wan-input");
  const valueNode = document.getElementById("draw-service-quote-value");
  const detailNode = document.getElementById("draw-service-quote-detail");
  if (!amountInput || !valueNode || !detailNode) return;

  const quote = ctx.getDrawServiceSelectionQuote(amountInput.value);
  const balance = Number(ctx.getCurrentQuota()?.balance ?? ctx.getCurrentProfile()?.quota_balance ?? 0);

  if (!quote) {
    valueNode.textContent = "请选择档位并输入抽取数量";
    detailNode.textContent = "抽取数量会按后台配置的最小值和步进自动补齐。";
    return;
  }
  if (quote.blockedReason === "season_member_required") {
    valueNode.textContent = `${quote.tier.label} 需先开通本赛季会员`;
    detailNode.textContent = "开通后即可使用 6.5 元 / 1w 的代抽福利档，每赛季一次。";
    return;
  }
  if (quote.blockedReason === "season_member_draw_benefit_max_exceeded") {
    valueNode.textContent = `${quote.tier.label} 单次最多 ${quote.maxDrawWan}w`;
    detailNode.textContent = `请把抽取数量调整到 ${quote.maxDrawWan}w 或以下；该福利每赛季仅限一次。`;
    return;
  }
  if (quote.blockedReason === "residual_transfer_disabled") {
    valueNode.textContent = `${quote.tier.label} 暂不可提交`;
    detailNode.textContent = "残卷转赠审核暂时关闭，请换用其他档位或联系管理员。";
    return;
  }

  const rawAmount = Number(amountInput.value || 0);
  const autoAdjusted = Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== quote.drawAmountWan;
  if (quote.paymentMethod === "residual_transfer") {
    const transferAmountNode = document.getElementById("draw-service-transfer-amount");
    if (transferAmountNode) {
      transferAmountNode.textContent = `${quote.transferAmount} ${quote.transferUnit}`;
    }
    valueNode.textContent = `${quote.tier.label} × ${quote.drawAmountWan}w，需转 ${quote.transferAmount} ${quote.transferUnit}`;
    detailNode.textContent = `${autoAdjusted ? `输入值会自动补齐到 ${quote.drawAmountWan}w；` : ""}转给 ${quote.transferTargetRoleId}，提交后等待管理员核对转赠记录。`;
    return;
  }
  valueNode.textContent = `${quote.tier.label} × ${quote.drawAmountWan}w，扣 ${quote.amountQuota} 额度`;
  detailNode.textContent =
    `${autoAdjusted ? `输入值会自动补齐到 ${quote.drawAmountWan}w；` : ""}折合 ${quote.cashAmountYuan} 元，当前可用额度 ${balance}。${
      quote.tier.once_per_season ? " 该福利每赛季仅限一次。" : ""
    }`;
}

export function handleDrawServiceBodyInputRuntime(ctx, event) {
  if (event.target?.id !== "draw-service-wan-input") return false;
  const nextValue = Number(event.target.value || 0);
  if (Number.isFinite(nextValue)) {
    ctx.setSelectedDrawServiceWan(nextValue);
  }
  ctx.updateDrawServiceQuote();
  return true;
}

export function handleDrawServiceBodyClickRuntime(ctx, event) {
  const tierButton = event.target.closest("[data-draw-service-tier-key]");
  if (tierButton) {
    ctx.setSelectedDrawServiceTierKey(tierButton.getAttribute("data-draw-service-tier-key") || "");
    ctx.renderDrawServiceZone(ctx.getCurrentProfile(), ctx.getCurrentQuota());
    return true;
  }

  const presetButton = event.target.closest("[data-draw-service-wan]");
  if (presetButton) {
    const amount = Number(presetButton.getAttribute("data-draw-service-wan") || 0);
    ctx.setSelectedDrawServiceWan(amount);
    ctx.renderDrawServiceZone(ctx.getCurrentProfile(), ctx.getCurrentQuota());
    return true;
  }

  return false;
}

export function handleDrawServiceBodySubmitRuntime(ctx, event) {
  if (event.target?.id !== "draw-service-form") return false;
  ctx.submitDrawServiceOrder(event);
  return true;
}
