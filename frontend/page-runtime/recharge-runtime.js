function rerenderRechargeSection(ctx) {
  const session = ctx.loadSession();
  ctx.renderRechargeSection(
    session?.profile || null,
    ctx.getCurrentRechargeConfig(),
    ctx.getCurrentRechargeOrders()
  );
}

export function updateRechargeQuotePreviewRuntime(ctx, profile, rechargeConfig) {
  const quoteNode = document.getElementById("recharge-quote-value");
  const detailNode = document.getElementById("recharge-quote-detail");
  if (!quoteNode || !detailNode || !rechargeConfig) return false;

  const amountInput = document.getElementById("recharge-amount-input");
  const amountValue =
    ctx.getSelectedRechargeOrderType() === "season_member"
      ? Number(rechargeConfig?.season_member_price_yuan || 0)
      : Number(amountInput?.value || ctx.getSelectedRechargeAmount() || 0);
  const quoteSummary = ctx.getRechargeQuoteSummary(
    profile,
    rechargeConfig,
    amountValue,
    ctx.getSelectedRechargeOrderType()
  );

  quoteNode.textContent = `${quoteSummary.totalQuota} 额度`;
  detailNode.textContent =
    quoteSummary.bonusQuota > 0
      ? `${quoteSummary.baseQuota} 基础额度 + ${quoteSummary.bonusQuota} 会员加成`
      : `${quoteSummary.baseQuota} 基础额度`;
  return true;
}

export function handleRechargePanelClickRuntime(ctx, event) {
  const clearDirectPurchaseButton = event.target.closest("[data-direct-purchase-clear]");
  if (clearDirectPurchaseButton) {
    ctx.clearPendingDirectPurchaseContext();
    rerenderRechargeSection(ctx);
    ctx.setAccountMessage("已切回普通充值。", "success");
    return true;
  }

  const paymentChannelButton = event.target.closest("[data-payment-channel]");
  if (paymentChannelButton) {
    ctx.setSelectedRechargePaymentChannel(
      paymentChannelButton.getAttribute("data-payment-channel") || "alipay_qr"
    );
    rerenderRechargeSection(ctx);
    return true;
  }

  const typeButton = event.target.closest("[data-recharge-order-type]");
  if (typeButton) {
    const nextType = String(typeButton.getAttribute("data-recharge-order-type") || "").trim();
    const normalizedType =
      nextType === "season_member" || nextType === "residual_transfer" ? nextType : "normal";
    ctx.setSelectedRechargeOrderType(normalizedType);
    if (normalizedType !== "normal") {
      ctx.clearPendingDirectPurchaseContext();
    }
    rerenderRechargeSection(ctx);
    return true;
  }

  const amountButton = event.target.closest("[data-recharge-amount]");
  if (!amountButton) return false;
  const nextAmount = Number(amountButton.getAttribute("data-recharge-amount") || 0);
  ctx.setSelectedRechargeAmount(nextAmount);
  const amountInput = ctx.rechargeBody?.querySelector("#recharge-amount-input");
  if (amountInput && ctx.isPositiveMoneyAmount(nextAmount)) {
    amountInput.value = String(nextAmount);
  }
  rerenderRechargeSection(ctx);
  return true;
}

export function handleRechargePanelInputRuntime(ctx, event) {
  if (event.target?.id !== "recharge-amount-input") return false;
  const nextAmount = Number(event.target.value || 0);
  ctx.setSelectedRechargeAmount(nextAmount);
  const session = ctx.loadSession();
  ctx.updateRechargeQuotePreview(session?.profile || null, ctx.getCurrentRechargeConfig());
  ctx.rechargeBody?.querySelectorAll("[data-recharge-amount]").forEach((node) => {
    node.classList.toggle(
      "active",
      Number(node.getAttribute("data-recharge-amount")) === Number(nextAmount)
    );
  });
  return true;
}

export function handleRechargePanelSubmitRuntime(ctx, event) {
  if (event.target?.id !== "recharge-form") return false;
  ctx.submitRechargeOrder(event);
  return true;
}
