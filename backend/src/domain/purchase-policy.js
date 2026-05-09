const { getLegacyTier, parseTermMetrics } = require("./pricing/core/reference-caps");

const SEASON_DURATION_DAYS = 28;
const SEASON_FIRST_WEEK_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const QUOTA_BLOCK_CODE = "quota_purchase_restricted_current_season_first_week";
const QUOTA_BLOCK_REASON =
  "赛季首周，当赛季双词条金卡、2.5 及以上单词条金卡暂不支持额度购买，请使用转账锁卡或残卷转赠。";
const SINGLE_TERM_QUOTA_BLOCK_MIN_VALUE = 2.5;

function parseDateMs(value) {
  const date = new Date(value || 0);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
}

function getCurrentSeasonFirstWeekWindow(rechargeConfig = {}, now = new Date()) {
  const expiresAtMs = parseDateMs(rechargeConfig?.season_member_expires_at);
  const nowMs = parseDateMs(now);
  if (!expiresAtMs || !nowMs) {
    return {
      active: false,
      starts_at: null,
      ends_at: null,
    };
  }

  const startsAtMs = expiresAtMs - SEASON_DURATION_DAYS * DAY_MS + 1000;
  const endsAtMs = startsAtMs + SEASON_FIRST_WEEK_DAYS * DAY_MS - 1000;
  return {
    active: nowMs >= startsAtMs && nowMs <= endsAtMs,
    starts_at: new Date(startsAtMs).toISOString(),
    ends_at: new Date(endsAtMs).toISOString(),
  };
}

function getCardTermValues(product) {
  const metrics = parseTermMetrics(product?.ext_attrs || "");
  return [...(metrics.fire_values || []), ...(metrics.calm_values || [])].filter(
    (value) => Number.isFinite(Number(value)) && Number(value) > 0
  );
}

function isQuotaRestrictedTermGoldCard(product) {
  if (!product || String(product.item_kind || "card") === "bundle") return false;
  const tier = String(product.tier || getLegacyTier(product.legacy_id)).trim().toLowerCase();
  if (!Boolean(product.is_current_season) || tier !== "gold") return false;

  const termValues = getCardTermValues(product);
  if (termValues.length >= 2) return true;
  if (termValues.length !== 1) return false;
  return Number(termValues[0]) >= SINGLE_TERM_QUOTA_BLOCK_MIN_VALUE;
}

function buildQuotaPurchasePolicy(product, rechargeConfig = {}, options = {}) {
  const window = getCurrentSeasonFirstWeekWindow(rechargeConfig, options.now || new Date());
  const disabled = window.active && isQuotaRestrictedTermGoldCard(product);
  return {
    quota_purchase_disabled: disabled,
    quota_purchase_policy_code: disabled ? QUOTA_BLOCK_CODE : "",
    quota_purchase_disabled_reason: disabled ? QUOTA_BLOCK_REASON : "",
    quota_purchase_policy_window: window,
  };
}

function assertQuotaPurchaseAllowed(product, rechargeConfig = {}, options = {}) {
  const policy = buildQuotaPurchasePolicy(product, rechargeConfig, options);
  if (!policy.quota_purchase_disabled) return policy;

  const err = new Error(QUOTA_BLOCK_CODE);
  err.statusCode = 400;
  err.errorCode = QUOTA_BLOCK_CODE;
  err.publicMessage = QUOTA_BLOCK_REASON;
  err.details = [QUOTA_BLOCK_REASON];
  throw err;
}

function attachQuotaPurchasePolicy(product, rechargeConfig = {}, options = {}) {
  if (!product || typeof product !== "object") return product;
  const policy = buildQuotaPurchasePolicy(product, rechargeConfig, options);
  return {
    ...product,
    quota_purchase_disabled: policy.quota_purchase_disabled,
    quota_purchase_policy_code: policy.quota_purchase_policy_code,
    quota_purchase_disabled_reason: policy.quota_purchase_disabled_reason,
    quota_purchase_policy_window: policy.quota_purchase_policy_window,
  };
}

module.exports = {
  QUOTA_BLOCK_CODE,
  QUOTA_BLOCK_REASON,
  SINGLE_TERM_QUOTA_BLOCK_MIN_VALUE,
  getCurrentSeasonFirstWeekWindow,
  getCardTermValues,
  isQuotaRestrictedTermGoldCard,
  buildQuotaPurchasePolicy,
  assertQuotaPurchaseAllowed,
  attachQuotaPurchasePolicy,
};
