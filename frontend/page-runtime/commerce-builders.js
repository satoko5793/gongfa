export function getEffectiveRechargeConfig(ctx) {
  return ctx.getCurrentRechargeConfig() || ctx.getPublicRechargeConfig() || null;
}

export function getQuotaCashAmount(ctx, quotaAmount, rechargeConfig = getEffectiveRechargeConfig(ctx)) {
  const quota = Number(quotaAmount || 0);
  const exchangeQuota = Number(rechargeConfig?.exchange_quota || 0);
  const exchangeYuan = Number(rechargeConfig?.exchange_yuan || 0);
  if (!Number.isFinite(quota) || quota <= 0 || exchangeQuota <= 0 || exchangeYuan <= 0) {
    return null;
  }
  return (quota * exchangeYuan) / exchangeQuota;
}

export function getOriginalQuotaPrice(product) {
  const original = Number(product?.original_price_quota || 0);
  const current = Number(product?.price_quota || 0);
  return original > 0 ? original : current;
}

export function isDiscountedProduct(ctx, product) {
  return (
    !ctx.isBundle(product) &&
    Boolean(product?.is_discounted) &&
    Number(product?.original_price_quota || 0) > Number(product?.price_quota || 0)
  );
}

export function getDiscountedProducts(ctx, products) {
  return (products || [])
    .filter((product) => isDiscountedProduct(ctx, product))
    .sort((a, b) => {
      const rateDiff = Number(a?.discount_rate || 100) - Number(b?.discount_rate || 100);
      if (rateDiff !== 0) return rateDiff;
      const saveDiff =
        Number(b?.discount_saved_quota || 0) - Number(a?.discount_saved_quota || 0);
      if (saveDiff !== 0) return saveDiff;
      const tierRanks = { gold: 6, red: 5, orange: 4, purple: 3, blue: 2, green: 1, bundle: 0 };
      const tierDiff =
        (tierRanks[ctx.getTierKey(b)] || 0) - (tierRanks[ctx.getTierKey(a)] || 0);
      if (tierDiff !== 0) return tierDiff;
      return Number(b?.item_id || 0) - Number(a?.item_id || 0);
    });
}

export function getProductCashPriceText(ctx, product, rechargeConfig = getEffectiveRechargeConfig(ctx)) {
  const amount = getQuotaCashAmount(ctx, product?.price_quota, rechargeConfig);
  if (amount === null) return "";
  return ctx.formatCashAmount(amount);
}

export function getDirectPurchaseAmountYuan(
  ctx,
  product,
  rechargeConfig = getEffectiveRechargeConfig(ctx)
) {
  const cashAmount = getQuotaCashAmount(ctx, product?.price_quota, rechargeConfig);
  if (cashAmount === null) return null;
  return Number(cashAmount.toFixed(2));
}

export function getQuotaCashText(ctx, quotaAmount, rechargeConfig = getEffectiveRechargeConfig(ctx)) {
  const cashAmount = getQuotaCashAmount(ctx, quotaAmount, rechargeConfig);
  if (cashAmount === null) return "RMB 待定";
  return ctx.formatCashAmount(cashAmount);
}

export function buildDirectPurchaseContext(
  ctx,
  product,
  rechargeConfig = getEffectiveRechargeConfig(ctx)
) {
  const amountYuan = getDirectPurchaseAmountYuan(ctx, product, rechargeConfig);
  if (!product || amountYuan === null) return null;
  return {
    itemId: Number(product.item_id || 0),
    itemKind: String(product.item_kind || "card"),
    productName: String(product.name || "商品"),
    quotaAmount: Number(product.price_quota || 0),
    amountYuan,
  };
}

export function getRechargePaymentMethods(
  ctx,
  rechargeConfig = getEffectiveRechargeConfig(ctx)
) {
  const methods = [];
  if (String(rechargeConfig?.qr_image_url || "").trim()) {
    methods.push({
      key: "alipay_qr",
      label: "支付宝",
      imageUrl: rechargeConfig.qr_image_url,
      name: rechargeConfig.payee_name || "支付宝收款码",
      hint: rechargeConfig.payee_hint || "扫码转账后再提交审核",
    });
  }
  if (String(rechargeConfig?.wechat_qr_image_url || "").trim()) {
    methods.push({
      key: "wechat_qr",
      label: "微信",
      imageUrl: rechargeConfig.wechat_qr_image_url,
      name: rechargeConfig.wechat_payee_name || "微信收款码",
      hint: rechargeConfig.wechat_payee_hint || "扫码转账后再提交审核",
    });
  }
  return methods;
}

export function getGuestPurchaseMethods(ctx, rechargeConfig = getEffectiveRechargeConfig(ctx)) {
  const methods = [...getRechargePaymentMethods(ctx, rechargeConfig)];
  if (rechargeConfig?.residual_transfer_enabled) {
    methods.push({
      key: "game_residual_transfer",
      label: rechargeConfig?.residual_unit_label || "残卷转赠",
    });
  }
  return methods;
}

export function ensureRechargePaymentChannel(
  ctx,
  rechargeConfig = getEffectiveRechargeConfig(ctx)
) {
  const methods = getRechargePaymentMethods(ctx, rechargeConfig);
  if (!methods.length) {
    ctx.setSelectedRechargePaymentChannel("alipay_qr");
    return null;
  }
  const selectedKey = ctx.getSelectedRechargePaymentChannel();
  if (!methods.some((item) => item.key === selectedKey)) {
    ctx.setSelectedRechargePaymentChannel(methods[0].key);
  }
  const currentKey = ctx.getSelectedRechargePaymentChannel();
  return methods.find((item) => item.key === currentKey) || methods[0];
}

export function ensureGuestTransferPaymentChannel(
  ctx,
  rechargeConfig = getEffectiveRechargeConfig(ctx)
) {
  const methods = getGuestPurchaseMethods(ctx, rechargeConfig);
  if (!methods.length) {
    ctx.setSelectedGuestTransferPaymentChannel("alipay_qr");
    return null;
  }
  const selectedKey = ctx.getSelectedGuestTransferPaymentChannel();
  if (!methods.some((item) => item.key === selectedKey)) {
    ctx.setSelectedGuestTransferPaymentChannel(methods[0].key);
  }
  const currentKey = ctx.getSelectedGuestTransferPaymentChannel();
  return methods.find((item) => item.key === currentKey) || methods[0];
}

export function getDirectResidualAmount(product, rechargeConfig = null) {
  const quotaPerUnit = Math.max(Number(rechargeConfig?.residual_quota_per_unit || 0), 0);
  if (!product || quotaPerUnit <= 0) return null;
  return Math.ceil(Number(product?.price_quota || 0) / quotaPerUnit);
}

export function formatRechargeChannelLabel(channel) {
  if (String(channel || "").trim() === "wechat_qr") return "微信";
  if (String(channel || "").trim() === "game_residual_transfer") return "残卷转赠";
  return "支付宝";
}
