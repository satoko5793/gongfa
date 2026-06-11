export function findProductInList(products, itemId, itemKind) {
  return (
    (products || []).find(
      (item) =>
        Number(item.item_id) === Number(itemId) && String(item.item_kind) === String(itemKind)
    ) || null
  );
}

export function buildActiveProductState(itemId, itemKind = "card") {
  return {
    activeItemId: itemId === null || itemId === undefined ? null : Number(itemId),
    activeItemKind: itemKind || "card",
  };
}

export function isActiveProductState(activeItemId, activeItemKind, itemId, itemKind = "card") {
  return Number(activeItemId) === Number(itemId) && String(activeItemKind) === String(itemKind);
}

export function createProductModalRuntimeContext(ctx) {
  return {
    productDetailBody: ctx.productDetailBody,
    productDetailModal: ctx.productDetailModal,
    escapeHtml: ctx.escapeHtml,
    formatCashAmount: ctx.formatCashAmount,
    getSelectedGuestTransferPaymentChannel: ctx.getSelectedGuestTransferPaymentChannel,
    setSelectedGuestTransferPaymentChannel: ctx.setSelectedGuestTransferPaymentChannel,
    setActiveProduct: ctx.setActiveProduct,
    isActiveProduct: ctx.isActiveProduct,
    setProductDetailMessage: ctx.setProductDetailMessage,
    loadSession: ctx.loadSession,
    getEffectiveRechargeConfig: ctx.getEffectiveRechargeConfig,
    buildDirectPurchaseContext: ctx.buildDirectPurchaseContext,
    getDirectResidualAmount: ctx.getDirectResidualAmount,
    getGuestPurchaseMethods: ctx.getGuestPurchaseMethods,
    ensureGuestTransferPaymentChannel: ctx.ensureGuestTransferPaymentChannel,
    isAttackFull: ctx.isAttackFull,
    isHpFull: ctx.isHpFull,
    getProductCashPriceText: ctx.getProductCashPriceText,
    getProductResidualPriceText: ctx.getProductResidualPriceText,
    getOriginalQuotaPrice: ctx.getOriginalQuotaPrice,
    isDiscountedProduct: ctx.isDiscountedProduct,
    getQuotaPurchasePolicy: ctx.getQuotaPurchasePolicy,
    getCurrentQuotaValue: ctx.getCurrentQuotaValue,
    parseTermBadges: ctx.parseTermBadges,
    isBundle: ctx.isBundle,
    getTierLabel: ctx.getTierLabel,
    getSeasonDisplayText: ctx.getSeasonDisplayText,
    renderFullStatValue: ctx.renderFullStatValue,
    renderTermBadge: ctx.renderTermBadge,
    renderProductVisual: ctx.renderProductVisual,
    bindImageFallbacks: ctx.bindImageFallbacks,
    renderProductDetailModalContent: ctx.renderProductDetailModalContent,
    applyDynamicBundleSelection: ctx.applyDynamicBundleSelection,
    findProduct: ctx.findProduct,
    openProductModal: ctx.openProductModal,
    closeProductModal: ctx.closeProductModal,
    toggleGuestTransferPanel: ctx.toggleGuestTransferPanel,
    submitGuestTransferOrder: ctx.submitGuestTransferOrder,
    submitConsignmentEscrowOrder: ctx.submitConsignmentEscrowOrder,
    startDirectPurchase: ctx.startDirectPurchase,
    confirmPurchase: ctx.confirmPurchase,
  };
}
