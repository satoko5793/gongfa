const QUOTA_ANCHOR_YUAN = 8;
const QUOTA_ANCHOR_QUOTA = 10000;
const QUOTA_PER_YUAN = QUOTA_ANCHOR_QUOTA / QUOTA_ANCHOR_YUAN;
const RESIDUAL_ANCHOR_AMOUNT = 10000;
const DEFAULT_RESIDUAL_UNIT_PRICE_YUAN = 1 / QUOTA_PER_YUAN;
const DEFAULT_RESIDUAL_PURCHASE_AMOUNT_PER_QUOTA_ANCHOR = RESIDUAL_ANCHOR_AMOUNT;

function roundMoney(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Number(numeric.toFixed(2));
}

function parsePositiveDecimal(value, fallback, precision = 4) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Number(numeric.toFixed(precision));
}

function cashToQuota(amountYuan) {
  const numeric = Number(amountYuan);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.max(0, Math.round(numeric * QUOTA_PER_YUAN));
}

function quotaToCash(quotaAmount) {
  const numeric = Number(quotaAmount);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return roundMoney(numeric / QUOTA_PER_YUAN);
}

function getResidualUnitPriceYuan(config = {}) {
  const anchorCash = parsePositiveDecimal(
    config.residual_recharge_anchor_cash_yuan ?? config.residual_anchor_cash_yuan,
    null,
    2
  );
  if (anchorCash !== null) {
    return parsePositiveDecimal(
      anchorCash / RESIDUAL_ANCHOR_AMOUNT,
      DEFAULT_RESIDUAL_UNIT_PRICE_YUAN,
      6
    );
  }
  const explicitUnitPrice = parsePositiveDecimal(
    config.residual_recharge_unit_price_yuan ?? config.residual_unit_price_yuan,
    null,
    6
  );
  if (explicitUnitPrice !== null) return explicitUnitPrice;
  const legacyQuotaPerUnit = Number(config.residual_quota_per_unit);
  if (Number.isFinite(legacyQuotaPerUnit) && legacyQuotaPerUnit > 0) {
    return parsePositiveDecimal(
      legacyQuotaPerUnit / QUOTA_PER_YUAN,
      DEFAULT_RESIDUAL_UNIT_PRICE_YUAN,
      6
    );
  }
  return DEFAULT_RESIDUAL_UNIT_PRICE_YUAN;
}

function getResidualPurchaseAmountPerQuotaAnchor(config = {}) {
  const anchorCash = parsePositiveDecimal(config.residual_purchase_anchor_cash_yuan, null, 2);
  if (anchorCash !== null) {
    return Math.max(1, Math.ceil((QUOTA_ANCHOR_YUAN / anchorCash) * RESIDUAL_ANCHOR_AMOUNT));
  }
  const explicitAmount = Number(config.residual_purchase_amount_per_quota_anchor);
  if (Number.isFinite(explicitAmount) && explicitAmount > 0) {
    return Math.max(1, Math.ceil(explicitAmount));
  }
  const cash = quotaToCash(QUOTA_ANCHOR_QUOTA);
  const unitPrice = getResidualUnitPriceYuan(config);
  if (cash === null || unitPrice <= 0) return DEFAULT_RESIDUAL_PURCHASE_AMOUNT_PER_QUOTA_ANCHOR;
  return Math.max(1, Math.ceil(cash / unitPrice));
}

function getResidualPurchaseUnitPriceYuan(config = {}) {
  const anchorCash = parsePositiveDecimal(config.residual_purchase_anchor_cash_yuan, null, 2);
  if (anchorCash !== null) {
    return parsePositiveDecimal(
      anchorCash / RESIDUAL_ANCHOR_AMOUNT,
      DEFAULT_RESIDUAL_UNIT_PRICE_YUAN,
      6
    );
  }
  const amount = getResidualPurchaseAmountPerQuotaAnchor(config);
  return parsePositiveDecimal(
    QUOTA_ANCHOR_YUAN / amount,
    DEFAULT_RESIDUAL_UNIT_PRICE_YUAN,
    6
  );
}

function residualToCash(residualAmount, config = {}) {
  const amount = Number(residualAmount);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Number((amount * getResidualUnitPriceYuan(config)).toFixed(4));
}

function cashToResidual(amountYuan, config = {}) {
  const cash = Number(amountYuan);
  const residualAmount = getResidualPurchaseAmountPerQuotaAnchor(config);
  if (!Number.isFinite(cash) || cash < 0 || residualAmount <= 0) return null;
  return Math.max(0, Math.ceil((cash / QUOTA_ANCHOR_YUAN) * residualAmount));
}

function getDerivedResidualQuotaPerUnit(config = {}) {
  return Math.max(1, cashToQuota(getResidualUnitPriceYuan(config)) || 1);
}

function getResidualAnchorCashYuan(config = {}) {
  return roundMoney(getResidualUnitPriceYuan(config) * RESIDUAL_ANCHOR_AMOUNT);
}

function getResidualPurchaseAnchorCashYuan(config = {}) {
  const explicitAnchorCash = parsePositiveDecimal(config.residual_purchase_anchor_cash_yuan, null, 2);
  if (explicitAnchorCash !== null) return roundMoney(explicitAnchorCash);
  return roundMoney(getResidualPurchaseUnitPriceYuan(config) * RESIDUAL_ANCHOR_AMOUNT);
}

function residualAnchorCashToUnitPrice(amountYuan) {
  return parsePositiveDecimal(
    Number(amountYuan) / RESIDUAL_ANCHOR_AMOUNT,
    DEFAULT_RESIDUAL_UNIT_PRICE_YUAN,
    6
  );
}

function buildPaymentConversionSnapshot(config = {}) {
  const residualUnitPriceYuan = getResidualUnitPriceYuan(config);
  const residualPurchaseAmountPerQuotaAnchor = getResidualPurchaseAmountPerQuotaAnchor(config);
  const residualPurchaseUnitPriceYuan = getResidualPurchaseUnitPriceYuan(config);
  return {
    quota_anchor_yuan: QUOTA_ANCHOR_YUAN,
    quota_anchor_quota: QUOTA_ANCHOR_QUOTA,
    quota_per_yuan: QUOTA_PER_YUAN,
    residual_anchor_amount: RESIDUAL_ANCHOR_AMOUNT,
    residual_recharge_anchor_cash_yuan: getResidualAnchorCashYuan(config),
    residual_recharge_unit_price_yuan: residualUnitPriceYuan,
    residual_anchor_cash_yuan: getResidualAnchorCashYuan(config),
    residual_unit_price_yuan: residualUnitPriceYuan,
    residual_purchase_anchor_quota: QUOTA_ANCHOR_QUOTA,
    residual_purchase_anchor_cash_yuan: getResidualPurchaseAnchorCashYuan(config),
    residual_purchase_amount_per_quota_anchor: residualPurchaseAmountPerQuotaAnchor,
    residual_purchase_unit_price_yuan: residualPurchaseUnitPriceYuan,
    residual_quota_per_unit: getDerivedResidualQuotaPerUnit({
      residual_unit_price_yuan: residualUnitPriceYuan,
    }),
  };
}

module.exports = {
  QUOTA_ANCHOR_YUAN,
  QUOTA_ANCHOR_QUOTA,
  QUOTA_PER_YUAN,
  RESIDUAL_ANCHOR_AMOUNT,
  DEFAULT_RESIDUAL_UNIT_PRICE_YUAN,
  DEFAULT_RESIDUAL_PURCHASE_AMOUNT_PER_QUOTA_ANCHOR,
  parsePositiveDecimal,
  cashToQuota,
  quotaToCash,
  residualToCash,
  cashToResidual,
  getResidualUnitPriceYuan,
  getResidualPurchaseAmountPerQuotaAnchor,
  getResidualPurchaseUnitPriceYuan,
  getResidualPurchaseAnchorCashYuan,
  getDerivedResidualQuotaPerUnit,
  getResidualAnchorCashYuan,
  residualAnchorCashToUnitPrice,
  buildPaymentConversionSnapshot,
};
