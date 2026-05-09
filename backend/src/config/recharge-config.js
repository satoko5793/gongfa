function parsePositiveInteger(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Math.floor(numeric);
  return normalized > 0 ? normalized : fallback;
}

function parseNonNegativeInteger(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Math.floor(numeric);
  return normalized >= 0 ? normalized : fallback;
}

function parsePositiveMoney(value, fallback) {
  const parsed = parseMoneyAmount(value);
  return parsed === null ? fallback : parsed;
}

function parseMoneyAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const normalized = Number(numeric.toFixed(2));
  if (normalized <= 0) return null;
  if (Math.abs(normalized * 100 - Math.round(normalized * 100)) > 0.000001) {
    return null;
  }
  return normalized;
}

function parseRate(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < 0) return fallback;
  return Number(numeric.toFixed(4));
}

function parsePricingDecaySpeed(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Number(numeric.toFixed(2));
  if (normalized < 0.2 || normalized > 5) return fallback;
  return normalized;
}

function parsePricingBonusRate(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Number(numeric.toFixed(4));
  if (normalized < 0 || normalized > 3) return fallback;
  return normalized;
}

function parsePricingThresholdRate(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Number(numeric.toFixed(4));
  if (normalized < 0.5 || normalized > 1) return fallback;
  return normalized;
}

function parsePricingPenaltyRate(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Number(numeric.toFixed(4));
  if (normalized < 0 || normalized > 1) return fallback;
  return normalized;
}

function parsePricingTermValue(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Number(numeric.toFixed(2));
  if (normalized < 0 || normalized > 10) return fallback;
  return normalized;
}

function parsePricingDiscountRate(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Math.round(numeric);
  if (normalized < 1 || normalized > 100) return fallback;
  return normalized;
}

function parsePricingPercent(value, fallback, { min = 0, max = 300 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Math.round(numeric);
  if (normalized < min || normalized > max) return fallback;
  return normalized;
}

function parseText(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

const PRICING_CONTROL_TIER_ORDER = ["green", "blue", "purple", "orange", "red", "gold"];
const PRICING_CONTROL_TIER_LABELS = {
  green: "绿卡",
  blue: "蓝卡",
  purple: "紫卡",
  orange: "橙卡",
  red: "红卡",
  gold: "金卡",
};

function buildDefaultPricingControls() {
  return {
    enabled: true,
    legacy_discount_rate: 100,
    legacy_double_term_discount_rate: 100,
    double_term_bonus_percent: 0,
    tiers: {
      green: {
        key: "green",
        label: PRICING_CONTROL_TIER_LABELS.green,
        atlas_min_quota: 100,
        atlas_max_quota: 600,
        atlas_double_full_quota: 600,
        atlas_decay_speed: 1,
        term_min_quota: 0,
        term_max_quota: 0,
        term_decay_speed: 1,
        term_attack_bonus_rate: 0,
        term_attack_bonus_start_rate: 0.95,
        term_attack_penalty_rate: 0,
        term_attack_penalty_start_rate: 0.85,
        term_attack_reference_min_value: 0,
        term_attack_reference_max_value: 0,
        term_value_reference_min: 0,
        term_value_reference_max: 0,
      },
      blue: {
        key: "blue",
        label: PRICING_CONTROL_TIER_LABELS.blue,
        atlas_min_quota: 120,
        atlas_max_quota: 1000,
        atlas_double_full_quota: 1000,
        atlas_decay_speed: 1,
        term_min_quota: 0,
        term_max_quota: 0,
        term_decay_speed: 1,
        term_attack_bonus_rate: 0,
        term_attack_bonus_start_rate: 0.95,
        term_attack_penalty_rate: 0,
        term_attack_penalty_start_rate: 0.85,
        term_attack_reference_min_value: 0,
        term_attack_reference_max_value: 0,
        term_value_reference_min: 0,
        term_value_reference_max: 0,
      },
      purple: {
        key: "purple",
        label: PRICING_CONTROL_TIER_LABELS.purple,
        atlas_min_quota: 120,
        atlas_max_quota: 1500,
        atlas_double_full_quota: 1500,
        atlas_decay_speed: 1,
        term_min_quota: 0,
        term_max_quota: 300,
        term_decay_speed: 1,
        term_attack_bonus_rate: 0,
        term_attack_bonus_start_rate: 0.95,
        term_attack_penalty_rate: 0,
        term_attack_penalty_start_rate: 0.85,
        term_attack_reference_min_value: 0,
        term_attack_reference_max_value: 0,
        term_value_reference_min: 0,
        term_value_reference_max: 0,
      },
      orange: {
        key: "orange",
        label: PRICING_CONTROL_TIER_LABELS.orange,
        atlas_min_quota: 160,
        atlas_max_quota: 2500,
        atlas_double_full_quota: 2500,
        atlas_decay_speed: 1,
        term_min_quota: 0,
        term_max_quota: 500,
        term_decay_speed: 1,
        term_attack_bonus_rate: 0,
        term_attack_bonus_start_rate: 0.95,
        term_attack_penalty_rate: 0,
        term_attack_penalty_start_rate: 0.85,
        term_attack_reference_min_value: 0,
        term_attack_reference_max_value: 0,
        term_value_reference_min: 0,
        term_value_reference_max: 0,
      },
      red: {
        key: "red",
        label: PRICING_CONTROL_TIER_LABELS.red,
        atlas_min_quota: 200,
        atlas_max_quota: 12000,
        atlas_double_full_quota: 12000,
        atlas_decay_speed: 1,
        term_min_quota: 0,
        term_max_quota: 1800,
        term_decay_speed: 1,
        term_attack_bonus_rate: 0,
        term_attack_bonus_start_rate: 0.95,
        term_attack_penalty_rate: 0,
        term_attack_penalty_start_rate: 0.85,
        term_attack_reference_min_value: 0,
        term_attack_reference_max_value: 0,
        term_value_reference_min: 0,
        term_value_reference_max: 0,
      },
      gold: {
        key: "gold",
        label: PRICING_CONTROL_TIER_LABELS.gold,
        atlas_min_quota: 500,
        atlas_max_quota: 50000,
        atlas_double_full_quota: 50000,
        atlas_decay_speed: 1,
        term_min_quota: 0,
        term_max_quota: 45000,
        term_decay_speed: 1,
        term_attack_bonus_rate: 0,
        term_attack_bonus_start_rate: 0.95,
        term_attack_penalty_rate: 0,
        term_attack_penalty_start_rate: 0.85,
        term_attack_reference_min_value: 8100000,
        term_attack_reference_max_value: 10000000,
        term_value_reference_min: 2.1,
        term_value_reference_max: 3.0,
        no_term_min_quota: 500,
        no_term_full_attack_quota: 20000,
        no_term_double_full_quota: 35000,
        no_term_hp_bonus_start_value: 198000000,
      },
    },
  };
}

function normalizePricingControls(rawPricingControls = {}, defaults = buildDefaultPricingControls()) {
  const source = rawPricingControls && typeof rawPricingControls === "object" ? rawPricingControls : {};
  const normalizedTiers = {};

  for (const tierKey of PRICING_CONTROL_TIER_ORDER) {
    const defaultTier = defaults.tiers[tierKey];
    const rawTier =
      source.tiers && typeof source.tiers === "object" && source.tiers[tierKey]
        ? source.tiers[tierKey]
        : {};

    const atlasMinQuota = parseNonNegativeInteger(
      rawTier.atlas_min_quota,
      defaultTier.atlas_min_quota
    );
    const atlasMaxQuota = Math.max(
      atlasMinQuota,
      parseNonNegativeInteger(rawTier.atlas_max_quota, defaultTier.atlas_max_quota)
    );
    const atlasDoubleFullQuota = Math.max(
      atlasMaxQuota,
      parseNonNegativeInteger(
        rawTier.atlas_double_full_quota,
        rawTier.atlas_double_full_quota === undefined
          ? atlasMaxQuota
          : defaultTier.atlas_double_full_quota
      )
    );
    const termMinQuota = parseNonNegativeInteger(
      rawTier.term_min_quota,
      defaultTier.term_min_quota
    );
    const termMaxQuota = Math.max(
      termMinQuota,
      parseNonNegativeInteger(rawTier.term_max_quota, defaultTier.term_max_quota)
    );
    const atlasDecaySpeed = parsePricingDecaySpeed(
      rawTier.atlas_decay_speed,
      defaultTier.atlas_decay_speed
    );
    const termDecaySpeed = parsePricingDecaySpeed(
      rawTier.term_decay_speed,
      defaultTier.term_decay_speed
    );
    const termAttackBonusRate = parsePricingBonusRate(
      rawTier.term_attack_bonus_rate,
      defaultTier.term_attack_bonus_rate
    );
    const termAttackBonusStartRate = parsePricingThresholdRate(
      rawTier.term_attack_bonus_start_rate,
      defaultTier.term_attack_bonus_start_rate
    );
    const termAttackPenaltyRate = parsePricingPenaltyRate(
      rawTier.term_attack_penalty_rate,
      defaultTier.term_attack_penalty_rate
    );
    const termAttackPenaltyStartRate = parsePricingThresholdRate(
      rawTier.term_attack_penalty_start_rate,
      defaultTier.term_attack_penalty_start_rate
    );
    const termAttackReferenceMinValue = parseNonNegativeInteger(
      rawTier.term_attack_reference_min_value,
      defaultTier.term_attack_reference_min_value
    );
    const termAttackReferenceMaxValue = Math.max(
      termAttackReferenceMinValue,
      parseNonNegativeInteger(
        rawTier.term_attack_reference_max_value,
        defaultTier.term_attack_reference_max_value
      )
    );
    const termValueReferenceMin = parsePricingTermValue(
      rawTier.term_value_reference_min,
      defaultTier.term_value_reference_min
    );
    const termValueReferenceMax = Math.max(
      termValueReferenceMin,
      parsePricingTermValue(
        rawTier.term_value_reference_max,
        defaultTier.term_value_reference_max
      )
    );
    const noTermMinQuota = parseNonNegativeInteger(
      rawTier.no_term_min_quota,
      defaultTier.no_term_min_quota
    );
    const noTermFullAttackQuota = Math.max(
      noTermMinQuota,
      parseNonNegativeInteger(
        rawTier.no_term_full_attack_quota,
        defaultTier.no_term_full_attack_quota
      )
    );
    const noTermDoubleFullQuota = Math.max(
      noTermFullAttackQuota,
      parseNonNegativeInteger(
        rawTier.no_term_double_full_quota,
        defaultTier.no_term_double_full_quota
      )
    );
    const noTermHpBonusStartValue = parseNonNegativeInteger(
      rawTier.no_term_hp_bonus_start_value,
      defaultTier.no_term_hp_bonus_start_value
    );

    normalizedTiers[tierKey] = {
      key: tierKey,
      label: PRICING_CONTROL_TIER_LABELS[tierKey],
      atlas_min_quota: atlasMinQuota,
      atlas_max_quota: atlasMaxQuota,
      atlas_double_full_quota: atlasDoubleFullQuota,
      atlas_decay_speed: atlasDecaySpeed,
      term_min_quota: termMinQuota,
      term_max_quota: termMaxQuota,
      term_decay_speed: termDecaySpeed,
      term_attack_bonus_rate: termAttackBonusRate,
      term_attack_bonus_start_rate: termAttackBonusStartRate,
      term_attack_penalty_rate: termAttackPenaltyRate,
      term_attack_penalty_start_rate: termAttackPenaltyStartRate,
      term_attack_reference_min_value: termAttackReferenceMinValue,
      term_attack_reference_max_value: termAttackReferenceMaxValue,
      term_value_reference_min: termValueReferenceMin,
      term_value_reference_max: termValueReferenceMax,
      no_term_min_quota: noTermMinQuota,
      no_term_full_attack_quota: noTermFullAttackQuota,
      no_term_double_full_quota: noTermDoubleFullQuota,
      no_term_hp_bonus_start_value: noTermHpBonusStartValue,
    };
  }

  return {
    enabled:
      source.enabled === undefined ? defaults.enabled : Boolean(source.enabled),
    legacy_discount_rate: parsePricingDiscountRate(
      source.legacy_discount_rate,
      defaults.legacy_discount_rate
    ),
    legacy_double_term_discount_rate: parsePricingDiscountRate(
      source.legacy_double_term_discount_rate,
      defaults.legacy_double_term_discount_rate
    ),
    double_term_bonus_percent: parsePricingPercent(
      source.double_term_bonus_percent,
      defaults.double_term_bonus_percent,
      { min: 0, max: 300 }
    ),
    tiers: normalizedTiers,
  };
}

function parsePresetAmounts(value, minimumAmount, exchangeYuan) {
  const source = String(value || "")
    .split(",")
    .map((item) => parseMoneyAmount(item.trim()))
    .filter((item) => item !== null && item >= minimumAmount);

  if (source.length > 0) {
    return [...new Set(source.map((item) => Number(item.toFixed(2))))];
  }

  const base = Math.max(exchangeYuan, minimumAmount, 1);
  return [1, 2, 5, 10, 20].map((multiplier) => Number((base * multiplier).toFixed(2)));
}

function buildDefaultRechargeConfig() {
  const exchangeYuan = parsePositiveMoney(process.env.RECHARGE_EXCHANGE_YUAN, 12);
  const exchangeQuota = parsePositiveInteger(
    process.env.RECHARGE_EXCHANGE_QUOTA,
    10000
  );
  const seasonMemberSeasonLabel = parseText(
    process.env.SEASON_MEMBER_SEASON_LABEL,
    "S5 朱明赛季"
  );
  const seasonMemberExpiresAt = parseText(
    process.env.SEASON_MEMBER_EXPIRES_AT,
    "2026-06-04T23:59:59+08:00"
  );
  const seasonMemberPriceYuan = parsePositiveMoney(
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
    parsePositiveMoney(process.env.RECHARGE_MIN_YUAN, exchangeYuan),
    exchangeYuan
  );
  const residualQuotaPerUnit = parsePositiveInteger(
    process.env.RESIDUAL_QUOTA_PER_UNIT,
    1
  );
  const lineupBaseSlots = parsePositiveInteger(process.env.LINEUP_BASE_SLOTS, 3);
  const lineupPermanentSlotQuota = parsePositiveInteger(
    process.env.LINEUP_PERMANENT_SLOT_QUOTA,
    5000
  );
  const lineupPermanentSlotMax = parseNonNegativeInteger(
    process.env.LINEUP_PERMANENT_SLOT_MAX,
    7
  );
  const lineupSeasonalSlotQuota = parsePositiveInteger(
    process.env.LINEUP_SEASONAL_SLOT_QUOTA,
    1000
  );
  const lineupMemberBonusSlots = parseNonNegativeInteger(
    process.env.LINEUP_MEMBER_BONUS_SLOTS,
    3
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
    residual_admin_game_name: parseText(
      process.env.RESIDUAL_ADMIN_GAME_NAME,
      "繁星✨秋"
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
    lineup_base_slots: lineupBaseSlots,
    lineup_permanent_slot_quota: lineupPermanentSlotQuota,
    lineup_permanent_slot_max: lineupPermanentSlotMax,
    lineup_seasonal_slot_quota: lineupSeasonalSlotQuota,
    lineup_member_bonus_slots: lineupMemberBonusSlots,
    preset_amounts: parsePresetAmounts(
      process.env.RECHARGE_PRESETS || "",
      minAmountYuan,
      exchangeYuan
    ),
    qr_image_url: process.env.ALIPAY_QR_IMAGE_URL || "/payment/alipay-qr.jpg",
    payee_name: process.env.ALIPAY_PAYEE_NAME || "支付宝收款码",
    payee_hint:
      process.env.ALIPAY_PAYEE_HINT ||
      "扫码转账后，填写付款时间即可，管理员审核通过后到账。",
    wechat_qr_image_url: process.env.WECHAT_QR_IMAGE_URL || "/payment/wechat-qr.png",
    wechat_payee_name: process.env.WECHAT_PAYEE_NAME || "微信收款码",
    wechat_payee_hint:
      process.env.WECHAT_PAYEE_HINT ||
      "支持微信扫码转账，填写付款时间后提交审核即可。",
    instructions: [
      "1. 先扫码完成支付宝转账，再回到页面提交充值申请。",
      "2. 提交时写付款时间即可，方便管理员快速核对。",
      "3. 审核通过后自动增加额度，驳回不会扣减任何现有额度。",
    ],
    residual_instructions: [
      "1. 在游戏内把残卷直接转给管理员账号，再回来提交审核。",
      "2. 管理员游戏 ID：584967604，1 残卷 = 1 额度。",
      "3. 提交时填写转赠时间即可，管理员会按时间核对。",
    ],
    pricing_controls: buildDefaultPricingControls(),
  };
}

function normalizeRechargeConfig(rawConfig = {}) {
  const defaults = buildDefaultRechargeConfig();
  const exchangeYuan = parsePositiveMoney(rawConfig.exchange_yuan, defaults.exchange_yuan);
  const exchangeQuota = parsePositiveInteger(rawConfig.exchange_quota, defaults.exchange_quota);
  const seasonMemberPriceYuan = parsePositiveMoney(
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
    parsePositiveMoney(rawConfig.min_amount_yuan, defaults.min_amount_yuan),
    1
  );
  const residualQuotaPerUnit = parsePositiveInteger(
    rawConfig.residual_quota_per_unit,
    defaults.residual_quota_per_unit
  );
  const lineupBaseSlots = parsePositiveInteger(
    rawConfig.lineup_base_slots,
    defaults.lineup_base_slots
  );
  const lineupPermanentSlotQuota = parsePositiveInteger(
    rawConfig.lineup_permanent_slot_quota,
    defaults.lineup_permanent_slot_quota
  );
  const lineupPermanentSlotMax = parseNonNegativeInteger(
    rawConfig.lineup_permanent_slot_max,
    defaults.lineup_permanent_slot_max
  );
  const lineupSeasonalSlotQuota = parsePositiveInteger(
    rawConfig.lineup_seasonal_slot_quota,
    defaults.lineup_seasonal_slot_quota
  );
  const lineupMemberBonusSlots = parseNonNegativeInteger(
    rawConfig.lineup_member_bonus_slots,
    defaults.lineup_member_bonus_slots
  );
  const pricingControls = normalizePricingControls(
    rawConfig.pricing_controls,
    defaults.pricing_controls
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
    residual_admin_game_name: parseText(
      rawConfig.residual_admin_game_name,
      defaults.residual_admin_game_name
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
    lineup_base_slots: lineupBaseSlots,
    lineup_permanent_slot_quota: lineupPermanentSlotQuota,
    lineup_permanent_slot_max: lineupPermanentSlotMax,
    lineup_seasonal_slot_quota: lineupSeasonalSlotQuota,
    lineup_member_bonus_slots: lineupMemberBonusSlots,
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
    wechat_qr_image_url: String(rawConfig.wechat_qr_image_url || defaults.wechat_qr_image_url),
    wechat_payee_name: String(rawConfig.wechat_payee_name || defaults.wechat_payee_name),
    wechat_payee_hint: String(rawConfig.wechat_payee_hint || defaults.wechat_payee_hint),
    instructions: Array.isArray(rawConfig.instructions) && rawConfig.instructions.length > 0
      ? rawConfig.instructions.map((item) => String(item || "").trim()).filter(Boolean)
      : defaults.instructions,
    residual_instructions:
      Array.isArray(rawConfig.residual_instructions) && rawConfig.residual_instructions.length > 0
        ? rawConfig.residual_instructions.map((item) => String(item || "").trim()).filter(Boolean)
        : defaults.residual_instructions,
    pricing_controls: pricingControls,
  };

  return normalized;
}

function getRechargeConfig(rawConfig = null) {
  return normalizeRechargeConfig(rawConfig || {});
}

function sanitizeAdminRechargeConfig(config = {}) {
  const normalized = getRechargeConfig(config);
  const nextPricingControls =
    normalized.pricing_controls &&
    typeof normalized.pricing_controls === "object" &&
    !Array.isArray(normalized.pricing_controls)
      ? {
          ...normalized.pricing_controls,
          tiers: { ...(normalized.pricing_controls.tiers || {}) },
        }
      : normalized.pricing_controls;

  if (nextPricingControls?.tiers) {
    for (const tierKey of PRICING_CONTROL_TIER_ORDER) {
      const tier = nextPricingControls.tiers[tierKey];
      if (!tier || typeof tier !== "object" || Array.isArray(tier)) continue;
      if (tierKey !== "gold") {
        const nextTier = { ...tier };
        delete nextTier.no_term_min_quota;
        delete nextTier.no_term_full_attack_quota;
        delete nextTier.no_term_double_full_quota;
        delete nextTier.no_term_hp_bonus_start_value;
        nextPricingControls.tiers[tierKey] = nextTier;
      }
    }
  }

  return {
    ...normalized,
    pricing_controls: nextPricingControls,
  };
}

function buildRechargeQuote(amountYuan, rechargeConfig) {
  const config = normalizeRechargeConfig(rechargeConfig || {});
  const normalizedAmount = parseMoneyAmount(amountYuan);
  if (normalizedAmount === null) {
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
  buildDefaultPricingControls,
  normalizePricingControls,
  normalizeRechargeConfig,
  getRechargeConfig,
  sanitizeAdminRechargeConfig,
  buildRechargeQuote,
  buildSeasonMemberQuote,
  buildResidualTransferQuote,
  PRICING_CONTROL_TIER_ORDER,
  PRICING_CONTROL_TIER_LABELS,
};
