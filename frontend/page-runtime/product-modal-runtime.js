export function openProductModalRuntime(ctx, itemId, itemKind) {
  const product = ctx.findProduct(itemId, itemKind);
  if (!product) return null;

  ctx.setActiveProduct(product.item_id, product.item_kind || "card");
  ctx.setProductDetailMessage("");

  const termBadges = ctx.parseTermBadges(product.ext_attrs, product);
  const sessionProfile = ctx.loadSession()?.profile || null;
  const rechargeConfig = ctx.getEffectiveRechargeConfig();
  const directPurchaseContext = ctx.buildDirectPurchaseContext(product, rechargeConfig);
  const directResidualAmount = ctx.getDirectResidualAmount(product, rechargeConfig);
  const guestPaymentMethods = ctx.getGuestPurchaseMethods(rechargeConfig);
  const activeGuestPaymentMethod = ctx.ensureGuestTransferPaymentChannel(rechargeConfig);
  const isResidualGuestPurchase =
    String(activeGuestPaymentMethod?.key || "") === "game_residual_transfer";
  const stockLabel =
    product.stock === null || product.stock === undefined ? "不限量" : `${Number(product.stock)} 件`;
  const attackIsFull = ctx.isAttackFull(product);
  const hpIsFull = ctx.isHpFull(product);
  const cashPriceText = ctx.getProductCashPriceText(product);
  const originalPriceQuota = ctx.getOriginalQuotaPrice(product);
  const discounted = ctx.isDiscountedProduct(product);
  const quotaPolicy = ctx.getQuotaPurchasePolicy ? ctx.getQuotaPurchasePolicy(product) : null;
  const currentQuota = ctx.getCurrentQuotaValue();

  ctx.productDetailBody.innerHTML = ctx.renderProductDetailModalContent(
    {
      escapeHtml: ctx.escapeHtml,
      formatCashAmount: ctx.formatCashAmount,
      selectedGuestTransferPaymentChannel: ctx.getSelectedGuestTransferPaymentChannel(),
      isBundle: ctx.isBundle,
      getTierLabel: ctx.getTierLabel,
      getSeasonDisplayText: ctx.getSeasonDisplayText,
      renderFullStatValue: ctx.renderFullStatValue,
      renderTermBadge: ctx.renderTermBadge,
      renderProductVisual: ctx.renderProductVisual,
    },
    {
      product,
      sessionProfile,
      directPurchaseContext,
      directResidualAmount,
      guestPaymentMethods,
      activeGuestPaymentMethod,
      isResidualGuestPurchase,
      stockLabel,
      attackIsFull,
      hpIsFull,
      cashPriceText,
      originalPriceQuota,
      discounted,
      termBadges,
      rechargeConfig,
      quotaPolicy,
      currentQuota,
    }
  );

  ctx.productDetailModal.classList.remove("hidden");
  ctx.productDetailModal.setAttribute("aria-hidden", "false");
  ctx.bindImageFallbacks(ctx.productDetailBody);
  bindProductModalInteractions(ctx, product);
  return product;
}

function bindProductModalInteractions(ctx, product) {
  ctx.productDetailBody
    .querySelector("#modal-close-btn")
    ?.addEventListener("click", () => ctx.closeProductModal());
  ctx.productDetailBody
    .querySelector("#direct-buy-btn")
    ?.addEventListener("click", () =>
      ctx.startDirectPurchase(product.item_id, product.item_kind || "card")
    );
  ctx.productDetailBody
    .querySelector("#confirm-buy-btn")
    ?.addEventListener("click", () => ctx.confirmPurchase());
  ctx.productDetailBody
    .querySelector("#guest-transfer-form")
    ?.addEventListener("submit", (event) => ctx.submitGuestTransferOrder(event));
  ctx.productDetailBody.querySelectorAll("[data-dynamic-bundle-field]").forEach((select) => {
    select.addEventListener("change", () => {
      if (!ctx.applyDynamicBundleSelection) return;
      const selection = {};
      ctx.productDetailBody.querySelectorAll("[data-dynamic-bundle-field]").forEach((field) => {
        selection[field.getAttribute("data-dynamic-bundle-field")] = Number(field.value || 0);
      });
      const updated = ctx.applyDynamicBundleSelection(product, selection);
      if (updated) {
        ctx.openProductModal(product.item_id, product.item_kind || "bundle");
      }
    });
  });

  ctx.productDetailBody.querySelectorAll("[data-guest-payment-channel]").forEach((button) => {
    button.addEventListener("click", () => {
      ctx.setSelectedGuestTransferPaymentChannel(
        button.getAttribute("data-guest-payment-channel") || "alipay_qr"
      );
      ctx.openProductModal(product.item_id, product.item_kind || "card");
      ctx.toggleGuestTransferPanel(true);
    });
  });

  ctx.productDetailBody
    .querySelector('[data-guest-transfer-cancel="1"]')
    ?.addEventListener("click", () => ctx.toggleGuestTransferPanel(false));
}

export function closeProductModalRuntime(ctx) {
  ctx.setActiveProduct(null, "card");
  ctx.productDetailModal.classList.add("hidden");
  ctx.productDetailModal.setAttribute("aria-hidden", "true");
  ctx.productDetailBody.innerHTML = "";
  ctx.setProductDetailMessage("");
}

export function toggleGuestTransferPanelRuntime(ctx, visible) {
  const panel = ctx.productDetailBody.querySelector("#guest-transfer-panel");
  if (!panel) return;
  panel.classList.toggle("hidden", !visible);
  if (visible) {
    window.requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

export function startDirectPurchaseRuntime(ctx, itemId, itemKind = "card") {
  const product = ctx.findProduct(itemId, itemKind);
  if (!product) return null;
  if (!ctx.isActiveProduct(product.item_id, product.item_kind || "card")) {
    ctx.openProductModal(product.item_id, product.item_kind || "card");
  }
  ctx.toggleGuestTransferPanel(true);
  return product;
}

export function handleProductGridClickRuntime(ctx, event) {
  const directBuyButton = event.target.closest(".direct-buy-btn");
  if (directBuyButton) {
    ctx.startDirectPurchase(
      directBuyButton.getAttribute("data-item-id"),
      directBuyButton.getAttribute("data-item-kind")
    );
    return true;
  }

  const button = event.target.closest(".detail-btn, .buy-btn");
  if (!button) return false;
  ctx.openProductModal(button.getAttribute("data-item-id"), button.getAttribute("data-item-kind"));
  return true;
}
