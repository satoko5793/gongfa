export const QUOTA_ANCHOR_YUAN = 8;
export const QUOTA_ANCHOR_QUOTA = 10000;
export const QUOTA_PER_YUAN = QUOTA_ANCHOR_QUOTA / QUOTA_ANCHOR_YUAN;
export const RESIDUAL_ANCHOR_AMOUNT = 10000;
export const DEFAULT_RESIDUAL_UNIT_PRICE_YUAN = 1 / QUOTA_PER_YUAN;
export const DEFAULT_RESIDUAL_PURCHASE_AMOUNT_PER_QUOTA_ANCHOR = RESIDUAL_ANCHOR_AMOUNT;

export function roundMoney(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Number(numeric.toFixed(2));
}

export function cashToQuota(amountYuan) {
  const numeric = Number(amountYuan);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.max(0, Math.round(numeric * QUOTA_PER_YUAN));
}

export function quotaToCash(quotaAmount) {
  const numeric = Number(quotaAmount);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return roundMoney(numeric / QUOTA_PER_YUAN);
}

export function getResidualUnitPriceYuan(config = {}) {
  const anchorCash = Number(config?.residual_recharge_anchor_cash_yuan ?? config?.residual_anchor_cash_yuan);
  if (Number.isFinite(anchorCash) && anchorCash > 0) {
    return Number((anchorCash / RESIDUAL_ANCHOR_AMOUNT).toFixed(6));
  }
  const numeric = Number(config?.residual_recharge_unit_price_yuan ?? config?.residual_unit_price_yuan);
  if (Number.isFinite(numeric) && numeric > 0) return Number(numeric.toFixed(6));
  const legacyQuotaPerUnit = Number(config?.residual_quota_per_unit);
  if (Number.isFinite(legacyQuotaPerUnit) && legacyQuotaPerUnit > 0) {
    return Number((legacyQuotaPerUnit / QUOTA_PER_YUAN).toFixed(6));
  }
  return DEFAULT_RESIDUAL_UNIT_PRICE_YUAN;
}

export function getResidualPurchaseAmountPerQuotaAnchor(config = {}) {
  const anchorCash = Number(config?.residual_purchase_anchor_cash_yuan);
  if (Number.isFinite(anchorCash) && anchorCash > 0) {
    return Math.max(1, Math.ceil((QUOTA_ANCHOR_YUAN / anchorCash) * RESIDUAL_ANCHOR_AMOUNT));
  }
  const amount = Number(config?.residual_purchase_amount_per_quota_anchor);
  if (Number.isFinite(amount) && amount > 0) return Math.max(1, Math.ceil(amount));
  const unitPrice = getResidualUnitPriceYuan(config);
  if (unitPrice <= 0) return DEFAULT_RESIDUAL_PURCHASE_AMOUNT_PER_QUOTA_ANCHOR;
  return Math.max(1, Math.ceil(QUOTA_ANCHOR_YUAN / unitPrice));
}

export function getResidualPurchaseUnitPriceYuan(config = {}) {
  const anchorCash = Number(config?.residual_purchase_anchor_cash_yuan);
  if (Number.isFinite(anchorCash) && anchorCash > 0) {
    return Number((anchorCash / RESIDUAL_ANCHOR_AMOUNT).toFixed(6));
  }
  const amount = getResidualPurchaseAmountPerQuotaAnchor(config);
  if (amount <= 0) return DEFAULT_RESIDUAL_UNIT_PRICE_YUAN;
  return Number((QUOTA_ANCHOR_YUAN / amount).toFixed(6));
}

export function residualToCash(residualAmount, config = {}) {
  const amount = Number(residualAmount);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Number((amount * getResidualUnitPriceYuan(config)).toFixed(4));
}

export function cashToResidual(amountYuan, config = {}) {
  const cash = Number(amountYuan);
  const residualAmount = getResidualPurchaseAmountPerQuotaAnchor(config);
  if (!Number.isFinite(cash) || cash < 0 || residualAmount <= 0) return null;
  return Math.max(0, Math.ceil((cash / QUOTA_ANCHOR_YUAN) * residualAmount));
}

export function getResidualQuotaPerUnit(config = {}) {
  return Math.max(1, cashToQuota(getResidualUnitPriceYuan(config)) || 1);
}

export function getResidualPerAnchorCash(config = {}) {
  return cashToResidual(QUOTA_ANCHOR_YUAN, config) || 0;
}

export function residualPerAnchorCashToUnitPrice(residualAmount) {
  const amount = Number(residualAmount);
  if (!Number.isFinite(amount) || amount <= 0) return DEFAULT_RESIDUAL_UNIT_PRICE_YUAN;
  return Number((QUOTA_ANCHOR_YUAN / amount).toFixed(6));
}

export function getResidualAnchorCashYuan(config = {}) {
  const explicitAnchorCash = Number(config?.residual_recharge_anchor_cash_yuan ?? config?.residual_anchor_cash_yuan);
  if (Number.isFinite(explicitAnchorCash) && explicitAnchorCash > 0) {
    return roundMoney(explicitAnchorCash);
  }
  return roundMoney(getResidualUnitPriceYuan(config) * RESIDUAL_ANCHOR_AMOUNT);
}

export function getResidualPurchaseAnchorCashYuan(config = {}) {
  const explicitAnchorCash = Number(config?.residual_purchase_anchor_cash_yuan);
  if (Number.isFinite(explicitAnchorCash) && explicitAnchorCash > 0) {
    return roundMoney(explicitAnchorCash);
  }
  return roundMoney(getResidualPurchaseUnitPriceYuan(config) * RESIDUAL_ANCHOR_AMOUNT);
}

export function residualAnchorCashToUnitPrice(amountYuan) {
  const cash = Number(amountYuan);
  if (!Number.isFinite(cash) || cash <= 0) return DEFAULT_RESIDUAL_UNIT_PRICE_YUAN;
  return Number((cash / RESIDUAL_ANCHOR_AMOUNT).toFixed(6));
}
