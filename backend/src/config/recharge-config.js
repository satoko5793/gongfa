function parsePositiveInteger(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Math.floor(numeric);
  return normalized > 0 ? normalized : fallback;
}

function parseRate(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < 0) return fallback;
  return Number(numeric.toFixed(4));
}

function parseText(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function parsePresetAmounts(value, minimumAmount, exchangeYuan) {
  const source = String(value || "")
    .split(",")
    .map((item) => parsePositiveInteger(item.trim(), 0))
    .filter((item) => item >= minimumAmount);

  if (source.length > 0) {
    return [...new Set(source)];
  }

  const base = Math.max(exchangeYuan, minimumAmount, 1);
  return [1, 2, 5, 10, 20].map((multiplier) => base * multiplier);
}

function buildDefaultRechargeConfig() {
  const exchangeYuan = parsePositiveInteger(process.env.RECHARGE_EXCHANGE_YUAN, 12);
  const exchangeQuota = parsePositiveInteger(
    process.env.RECHARGE_EXCHANGE_QUOTA,
    10000
  );
  const seasonMemberSeasonLabel = parseText(
    process.env.SEASON_MEMBER_SEASON_LABEL,
    "S3 黄金赛季"
  );
  const seasonMemberExpiresAt = parseText(
    process.env.SEASON_MEMBER_EXPIRES_AT,
    "2026-04-10T00:00:00+08:00"
  );
  const seasonMemberPriceYuan = parsePositiveInteger(
    process.env.SEASON_MEMBER_PRICE_YUAN,
    30
  );
  const seasonMemberQuota = parsePositiveInteger(
    process.env.SEASON_MEMBER_QUOTA,
    30000
  );
  const seasonMemberBonusRate = parseRate(
    process.env.SEASON_MEMBER_BONUS_RATE,
    0.05
  );
  const minAmountYuan = Math.max(
    parsePositiveInteger(process.env.RECHARGE_MIN_YUAN, exchangeYuan),
    exchangeYuan
  );
  const residualQuotaPerUnit = parsePositiveInteger(
    process.env.RESIDUAL_QUOTA_PER_UNIT,
    1
  );

  return {
    enabled: true,
    channel: "alipay_qr",
    exchange_yuan: exchangeYuan,
    exchange_quota: exchangeQuota,
    min_amount_yuan: minAmountYuan,
    residual_transfer_enabled: true,
    residual_admin_role_id: parseText(
      process.env.RESIDUAL_ADMIN_ROLE_ID,
      "584967604"
    ),
    residual_admin_role_name: parseText(
      process.env.RESIDUAL_ADMIN_ROLE_NAME,
      "admin残卷"
    ),
    residual_unit_label: parseText(
      process.env.RESIDUAL_UNIT_LABEL,
      "残卷"
    ),
    residual_quota_per_unit: residualQuotaPerUnit,
    season_member_enabled: true,
    season_member_season_label: seasonMemberSeasonLabel,
    season_member_expires_at: seasonMemberExpiresAt,
    season_member_price_yuan: seasonMemberPriceYuan,
    season_member_quota: seasonMemberQuota,
    season_member_bonus_rate: seasonMemberBonusRate,
    preset_amounts: parsePresetAmounts(
      process.env.RECHARGE_PRESETS || "",
      minAmountYuan,
      exchangeYuan
    ),
    qr_image_url: process.env.ALIPAY_QR_IMAGE_URL || "/payment/alipay-qr.jpg",
    payee_name: process.env.ALIPAY_PAYEE_NAME || "支付宝收款码",
    payee_hint:
      process.env.ALIPAY_PAYEE_HINT ||
      "扫码转账后，填写付款备注或订单号，管理员审核通过后到账。",
    instructions: [
      "1. 先扫码完成支付宝转账，再回到页面提交充值申请。",
      "2. 付款备注建议填写游戏 ID 或支付宝订单号，方便管理员快速核对。",
      "3. 审核通过后自动增加额度，驳回不会扣减任何现有额度。",
    ],
    residual_instructions: [
      "1. 在游戏内把残卷直接转给管理员账号，再回来提交审核。",
      "2. 管理员游戏 ID：584967604，1 残卷 = 1 额度。",
      "3. 提交时请填写转赠时间、截图说明或能帮助核对的备注。",
    ],
  };
}

function normalizeRechargeConfig(rawConfig = {}) {
  const defaults = buildDefaultRechargeConfig();
  const exchangeYuan = parsePositiveInteger(rawConfig.exchange_yuan, defaults.exchange_yuan);
  const exchangeQuota = parsePositiveInteger(rawConfig.exchange_quota, defaults.exchange_quota);
  const seasonMemberPriceYuan = parsePositiveInteger(
    rawConfig.season_member_price_yuan,
    defaults.season_member_price_yuan
  );
  const seasonMemberQuota = parsePositiveInteger(
    rawConfig.season_member_quota,
    defaults.season_member_quota
  );
  const seasonMemberBonusRate = parseRate(
    rawConfig.season_member_bonus_rate,
    defaults.season_member_bonus_rate
  );
  const minAmountYuan = Math.max(
    parsePositiveInteger(rawConfig.min_amount_yuan, defaults.min_amount_yuan),
    1
  );
  const residualQuotaPerUnit = parsePositiveInteger(
    rawConfig.residual_quota_per_unit,
    defaults.residual_quota_per_unit
  );

  const normalized = {
    enabled: rawConfig.enabled === undefined ? defaults.enabled : Boolean(rawConfig.enabled),
    channel: "alipay_qr",
    exchange_yuan: exchangeYuan,
    exchange_quota: exchangeQuota,
    quota_per_yuan: Number((exchangeQuota / exchangeYuan).toFixed(4)),
    min_amount_yuan: minAmountYuan,
    residual_transfer_enabled:
      rawConfig.residual_transfer_enabled === undefined
        ? defaults.residual_transfer_enabled
        : Boolean(rawConfig.residual_transfer_enabled),
    residual_admin_role_id: parseText(
      rawConfig.residual_admin_role_id,
      defaults.residual_admin_role_id
    ),
    residual_admin_role_name: parseText(
      rawConfig.residual_admin_role_name,
      defaults.residual_admin_role_name
    ),
    residual_unit_label: parseText(
      rawConfig.residual_unit_label,
      defaults.residual_unit_label
    ),
    residual_quota_per_unit: residualQuotaPerUnit,
    season_member_enabled:
      rawConfig.season_member_enabled === undefined
        ? defaults.season_member_enabled
        : Boolean(rawConfig.season_member_enabled),
    season_member_season_label: parseText(
      rawConfig.season_member_season_label,
      defaults.season_member_season_label
    ),
    season_member_expires_at: parseText(
      rawConfig.season_member_expires_at,
      defaults.season_member_expires_at
    ),
    season_member_price_yuan: seasonMemberPriceYuan,
    season_member_quota: seasonMemberQuota,
    season_member_bonus_rate: seasonMemberBonusRate,
    season_member_bonus_percent: Number((seasonMemberBonusRate * 100).toFixed(2)),
    preset_amounts: parsePresetAmounts(
      Array.isArray(rawConfig.preset_amounts)
        ? rawConfig.preset_amounts.join(",")
        : rawConfig.preset_amounts || defaults.preset_amounts.join(","),
      minAmountYuan,
      exchangeYuan
    ),
    qr_image_url: String(rawConfig.qr_image_url || defaults.qr_image_url),
    payee_name: String(rawConfig.payee_name || defaults.payee_name),
    payee_hint: String(rawConfig.payee_hint || defaults.payee_hint),
    instructions: Array.isArray(rawConfig.instructions) && rawConfig.instructions.length > 0
      ? rawConfig.instructions.map((item) => String(item || "").trim()).filter(Boolean)
      : defaults.instructions,
    residual_instructions:
      Array.isArray(rawConfig.residual_instructions) && rawConfig.residual_instructions.length > 0
        ? rawConfig.residual_instructions.map((item) => String(item || "").trim()).filter(Boolean)
        : defaults.residual_instructions,
  };

  return normalized;
}

function getRechargeConfig(rawConfig = null) {
  return normalizeRechargeConfig(rawConfig || {});
}

function buildRechargeQuote(amountYuan, rechargeConfig) {
  const config = normalizeRechargeConfig(rechargeConfig || {});
  const normalizedAmount = Number(amountYuan);
  if (!Number.isInteger(normalizedAmount) || normalizedAmount < config.min_amount_yuan) {
    return null;
  }

  return {
    amount_yuan: normalizedAmount,
    quota_amount: Math.round(
      (normalizedAmount * Number(config.exchange_quota || 0)) / Number(config.exchange_yuan || 1)
    ),
  };
}

function buildSeasonMemberQuote(rechargeConfig) {
  const config = normalizeRechargeConfig(rechargeConfig || {});
  if (!config.season_member_enabled) return null;

  return {
    amount_yuan: Number(config.season_member_price_yuan || 0),
    quota_amount: Number(config.season_member_quota || 0),
    season_label: config.season_member_season_label,
    expires_at: config.season_member_expires_at,
    bonus_rate: Number(config.season_member_bonus_rate || 0),
  };
}

function buildResidualTransferQuote(amount, rechargeConfig) {
  const config = normalizeRechargeConfig(rechargeConfig || {});
  if (!config.residual_transfer_enabled) return null;

  const normalizedAmount = Number(amount);
  if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
    return null;
  }

  return {
    amount_yuan: normalizedAmount,
    transfer_amount: normalizedAmount,
    transfer_unit: config.residual_unit_label,
    quota_amount: normalizedAmount * Number(config.residual_quota_per_unit || 1),
    target_role_id: config.residual_admin_role_id,
    target_role_name: config.residual_admin_role_name,
  };
}

module.exports = {
  buildDefaultRechargeConfig,
  normalizeRechargeConfig,
  getRechargeConfig,
  buildRechargeQuote,
  buildSeasonMemberQuote,
  buildResidualTransferQuote,
};
