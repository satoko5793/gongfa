export function createSubmitGuestTransferOrderContext(ctx) {
  const activeProduct = ctx.findProduct?.(ctx.getActiveItemId(), ctx.getActiveItemKind()) || null;
  return {
    findProduct: ctx.findProduct,
    activeItemId: ctx.getActiveItemId(),
    activeItemKind: ctx.getActiveItemKind(),
    bundleSelection: activeProduct?.selected_bundle_options || null,
    setProductDetailMessage: ctx.setProductDetailMessage,
    getEffectiveRechargeConfig: ctx.getEffectiveRechargeConfig,
    buildDirectPurchaseContext: ctx.buildDirectPurchaseContext,
    selectedGuestTransferPaymentChannel: ctx.getSelectedGuestTransferPaymentChannel(),
    getDirectResidualAmount: ctx.getDirectResidualAmount,
    roleId: document.getElementById("guest-transfer-role-id")?.value,
    roleName: document.getElementById("guest-transfer-role-name")?.value,
    nickname: document.getElementById("guest-transfer-nickname")?.value,
    paymentReference: document.getElementById("guest-transfer-reference")?.value,
    payerNote: document.getElementById("guest-transfer-note")?.value,
    apiFetch: ctx.apiFetch,
    closeProductModal: ctx.closeProductModal,
    formatRechargeChannelLabel: ctx.formatRechargeChannelLabel,
    setNotice: ctx.setNotice,
    loadProducts: ctx.loadProducts,
    pickErrorMessage: ctx.pickErrorMessage,
    formatCashAmount: ctx.formatCashAmount,
  };
}

export function createSubmitRechargeOrderContext(ctx) {
  const amountInput = document.getElementById("recharge-amount-input");
  const referenceInput = document.getElementById("recharge-payment-reference");
  const noteInput = document.getElementById("recharge-note");
  return {
    loadSession: ctx.loadSession,
    setAccountMessage: ctx.setAccountMessage,
    selectedRechargeOrderType: ctx.getSelectedRechargeOrderType(),
    currentRechargeConfig: ctx.getCurrentRechargeConfig(),
    amountValue: amountInput?.value,
    paymentReference: referenceInput?.value,
    payerNote: noteInput?.value,
    currentRechargeOrders: ctx.getCurrentRechargeOrders(),
    findPendingSeasonMemberOrder: ctx.findPendingSeasonMemberOrder,
    isPositiveMoneyAmount: ctx.isPositiveMoneyAmount,
    apiFetch: ctx.apiFetch,
    selectedRechargePaymentChannel: ctx.getSelectedRechargePaymentChannel(),
    handleRechargeSubmitSuccess: ctx.handleRechargeSubmitSuccess,
    loadAccount: ctx.loadAccount,
    pickErrorMessage: ctx.pickErrorMessage,
  };
}

export function createConfirmPurchaseContext(ctx) {
  const remarkInput = document.getElementById("purchase-remark");
  const activeProduct = ctx.findProduct?.(ctx.getActiveItemId(), ctx.getActiveItemKind()) || null;
  return {
    loadSession: ctx.loadSession,
    setProductDetailMessage: ctx.setProductDetailMessage,
    setNotice: ctx.setNotice,
    navigateToLoginEntry: ctx.navigateToLoginEntry,
    findProduct: ctx.findProduct,
    activeItemId: ctx.getActiveItemId(),
    activeItemKind: ctx.getActiveItemKind(),
    bundleSelection: activeProduct?.selected_bundle_options || null,
    getCurrentQuotaValue: ctx.getCurrentQuotaValue,
    getQuotaPurchasePolicy: ctx.getQuotaPurchasePolicy,
    remark: remarkInput?.value,
    confirmPurchase: ({ productName, price, remaining }) =>
      window.confirm(
        [
          `确认购买：${productName}`,
          `消耗额度：${price}`,
          remaining === null ? "购买后余额将重新从服务端读取。" : `购买后剩余：${remaining}`,
        ].join("\n")
      ),
    apiFetch: ctx.apiFetch,
    closeProductModal: ctx.closeProductModal,
    loadProducts: ctx.loadProducts,
    loadAccount: ctx.loadAccount,
    pickErrorMessage: ctx.pickErrorMessage,
  };
}

export function createRequestCancelOrderContext(ctx, orderId) {
  return {
    orderId,
    confirmCancelOrder: () =>
      window.confirm("确认提交取消申请？管理员审核通过后会退回额度并恢复库存。"),
    apiFetch: ctx.apiFetch,
    setNotice: ctx.setNotice,
    loadAccount: ctx.loadAccount,
    pickErrorMessage: ctx.pickErrorMessage,
  };
}
