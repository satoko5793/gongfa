const {
  QUOTA_ANCHOR_YUAN,
  QUOTA_ANCHOR_QUOTA,
  QUOTA_PER_YUAN,
  DEFAULT_RESIDUAL_UNIT_PRICE_YUAN,
  RESIDUAL_ANCHOR_AMOUNT,
  cashToQuota,
  residualToCash,
  getResidualUnitPriceYuan,
  getResidualPurchaseAmountPerQuotaAnchor,
  getResidualPurchaseUnitPriceYuan,
  getResidualPurchaseAnchorCashYuan,
  getDerivedResidualQuotaPerUnit,
  buildPaymentConversionSnapshot,
} = require("../domain/payment-conversion");

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

function parseNonNegativeMoney(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  const normalized = Number(numeric.toFixed(2));
  if (Math.abs(normalized * 100 - Math.round(normalized * 100)) > 0.000001) {
    return fallback;
  }
  return normalized;
}

function parsePositiveDecimal(value, fallback, precision = 4) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Number(numeric.toFixed(precision));
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

function parseOptionalText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

const DEFAULT_SEASON_MEMBER_SEASON_LABEL = "S6 第六赛季";
const DEFAULT_SEASON_MEMBER_EXPIRES_AT = "2026-07-02T23:59:59+08:00";
const LEGACY_DEFAULT_SEASON_MEMBER_SEASON_LABEL = "S5 朱明赛季";
const LEGACY_DEFAULT_SEASON_MEMBER_EXPIRES_AT = "2026-06-04T23:59:59+08:00";

function shouldMigrateLegacyDefaultSeason(rawConfig = {}) {
  const label = String(rawConfig.season_member_season_label || "").trim();
  const expiresAt = String(rawConfig.season_member_expires_at || "").trim();
  return (
    label === LEGACY_DEFAULT_SEASON_MEMBER_SEASON_LABEL &&
    (!expiresAt || expiresAt === LEGACY_DEFAULT_SEASON_MEMBER_EXPIRES_AT)
  );
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

const DRAW_SERVICE_DEFAULT_TIER_ORDER = [
  "tier_6",
  "tier_7",
  "tier_8",
  "tier_10",
  "own_scrolls",
  "season_member_benefit",
];

function buildDefaultDrawServiceConfig() {
  return {
    enabled: true,
    unit_label: "1w",
    min_draw_wan: 1,
    step_draw_wan: 1,
    preset_draw_wan: [1, 3, 5, 10],
    default_tier_key: "tier_8",
    video_notice: "如需代抽视频确认真实性，请在“我的信息”里的“订单帮助”中，通过微信群联系管理员索取。",
    rule_notice: "旧规则“抽 5w 返 1w”已取消；用户按本次选择的档位和抽取数量提交代抽单。",
    tiers: [
      {
        key: "tier_6",
        label: "6 元 / 1w",
        price_yuan_per_wan: 6,
        description: "仅返珍",
      },
      {
        key: "tier_7",
        label: "7 元 / 1w",
        price_yuan_per_wan: 7,
        description: "返双词条、珍、双满金、单 3.0",
      },
      {
        key: "tier_8",
        label: "8 元 / 1w",
        price_yuan_per_wan: 8,
        description: "返珍、双词条、2.5+ 单词条、双满紫-金卡",
      },
      {
        key: "tier_10",
        label: "10 元 / 1w",
        price_yuan_per_wan: 10,
        description: "返全金红、双满橙紫",
      },
      {
        key: "own_scrolls",
        label: "自己的卷",
        price_yuan_per_wan: 8,
        description: "自己的卷需先转残卷给管理员，按 8 元 / 1w 档返珍、双词条、2.5+ 单词条、双满紫-金卡",
        payment_method: "residual_transfer",
        transfer_amount_per_wan: 10000,
      },
      {
        key: "season_member_benefit",
        label: "赛季会员福利 6.5 元 / 1w",
        price_yuan_per_wan: 6.5,
        description: "开通赛季会员可用；每赛季一次，最多 5w，抽 5w 按第三档返还规则",
        requires_season_member: true,
        max_draw_wan_per_order: 5,
        once_per_season: true,
      },
    ],
  };
}

function normalizeDrawServiceTierKey(value, fallback) {
  const key = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return key || fallback;
}

function normalizeDrawServiceConfig(rawDrawService = {}, defaults = buildDefaultDrawServiceConfig()) {
  const source = rawDrawService && typeof rawDrawService === "object" ? rawDrawService : {};
  const defaultTierByKey = new Map(defaults.tiers.map((tier) => [tier.key, tier]));
  const rawTiers = Array.isArray(source.tiers) ? source.tiers : [];
  const seen = new Set();
  const tiers = [];

  for (const defaultKey of DRAW_SERVICE_DEFAULT_TIER_ORDER) {
    const defaultTier = defaultTierByKey.get(defaultKey);
    const rawTier =
      rawTiers.find((tier) => String(tier?.key || "").trim() === defaultKey) ||
      (defaultKey === "season_member_benefit"
        ? rawTiers.find((tier) => String(tier?.key || "").trim() === "fan_badge")
        : null) ||
      {};
    const isLegacyFanBadge =
      defaultKey === "season_member_benefit" &&
      String(rawTier?.key || "").trim() === "fan_badge";
    const isLegacySeasonMemberBenefitDescription =
      defaultKey === "season_member_benefit" &&
      String(rawTier?.description || "").trim() === "开通赛季会员可用；抽 5w 按第三档返还规则";
    const isLegacyOwnScrollsDescription =
      defaultKey === "own_scrolls" &&
      String(rawTier?.description || "").trim() ===
        "自己的卷按 8 元 / 1w 档，返珍、双词条、2.5+ 单词条、双满紫-金卡";
    const key = defaultTier.key;
    seen.add(key);
    if (isLegacyFanBadge) seen.add("fan_badge");
    tiers.push({
      key,
      label: parseText(isLegacyFanBadge ? "" : rawTier.label, defaultTier.label),
      price_yuan_per_wan: parsePositiveMoney(
        rawTier.price_yuan_per_wan,
        defaultTier.price_yuan_per_wan
      ),
      description: parseText(
        isLegacyFanBadge || isLegacySeasonMemberBenefitDescription || isLegacyOwnScrollsDescription
          ? ""
          : rawTier.description,
        defaultTier.description
      ),
      requires_season_member:
        defaultTier.requires_season_member === true
          ? true
          : Boolean(rawTier.requires_season_member),
      payment_method:
        defaultTier.payment_method === "residual_transfer" ||
        String(rawTier.payment_method || "").trim() === "residual_transfer"
          ? "residual_transfer"
          : "quota",
      transfer_amount_per_wan: parsePositiveInteger(
        rawTier.transfer_amount_per_wan,
        defaultTier.transfer_amount_per_wan || 0
      ),
      max_draw_wan_per_order: parseNonNegativeInteger(
        rawTier.max_draw_wan_per_order,
        defaultTier.max_draw_wan_per_order || 0
      ),
      once_per_season:
        defaultTier.once_per_season === true ? true : Boolean(rawTier.once_per_season),
    });
  }

  for (const rawTier of rawTiers) {
    const key = normalizeDrawServiceTierKey(rawTier?.key, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    tiers.push({
      key,
      label: parseText(rawTier.label, key),
      price_yuan_per_wan: parsePositiveMoney(rawTier.price_yuan_per_wan, 8),
      description: parseOptionalText(rawTier.description, ""),
      requires_season_member: Boolean(rawTier.requires_season_member),
      payment_method:
        String(rawTier.payment_method || "").trim() === "residual_transfer"
          ? "residual_transfer"
          : "quota",
      transfer_amount_per_wan: parsePositiveInteger(rawTier.transfer_amount_per_wan, 0),
      max_draw_wan_per_order: parseNonNegativeInteger(rawTier.max_draw_wan_per_order, 0),
      once_per_season: Boolean(rawTier.once_per_season),
    });
  }

  const minDrawWan = parsePositiveInteger(source.min_draw_wan, defaults.min_draw_wan);
  const stepDrawWan = parsePositiveInteger(source.step_draw_wan, defaults.step_draw_wan);
  const presetDrawWan = Array.isArray(source.preset_draw_wan)
    ? source.preset_draw_wan
        .map((item) => parsePositiveInteger(item, null))
        .filter((item) => item !== null && item >= minDrawWan)
    : defaults.preset_draw_wan;
  const uniquePresets = [...new Set(presetDrawWan)].sort((a, b) => a - b);
  const defaultTierKey = normalizeDrawServiceTierKey(
    source.default_tier_key,
    defaults.default_tier_key
  );
  const firstTierKey = tiers[0]?.key || defaults.default_tier_key;

  return {
    enabled: source.enabled === undefined ? defaults.enabled : Boolean(source.enabled),
    unit_label: parseText(source.unit_label, defaults.unit_label),
    min_draw_wan: minDrawWan,
    step_draw_wan: stepDrawWan,
    preset_draw_wan: uniquePresets.length ? uniquePresets : defaults.preset_draw_wan,
    default_tier_key: tiers.some((tier) => tier.key === defaultTierKey)
      ? defaultTierKey
      : firstTierKey,
    video_notice: parseText(source.video_notice, defaults.video_notice),
    rule_notice: parseText(source.rule_notice, defaults.rule_notice),
    tiers,
  };
}

function quoteDrawServiceOrder(rechargeConfig, { tierKey, drawAmountWan, amountQuota } = {}) {
  const config = normalizeRechargeConfig(rechargeConfig || {});
  const drawService = normalizeDrawServiceConfig(config.draw_service);
  if (!drawService.enabled) return null;

  const normalizedTierKey = normalizeDrawServiceTierKey(tierKey, drawService.default_tier_key);
  const tier =
    drawService.tiers.find((item) => item.key === normalizedTierKey) ||
    drawService.tiers.find((item) => item.key === drawService.default_tier_key) ||
    drawService.tiers[0];
  if (!tier) return null;

  const rawWan = Number(drawAmountWan);
  if (!Number.isFinite(rawWan) || rawWan <= 0) {
    if (amountQuota !== undefined && amountQuota !== null) {
      const legacyAmount = Number(amountQuota);
      if (Number.isInteger(legacyAmount) && legacyAmount > 0) {
        return {
          legacy: true,
          amount_quota: legacyAmount,
          draw_amount_wan: null,
          tier_key: null,
          tier_label: "旧版代抽",
          price_yuan_per_wan: null,
          cash_amount_yuan: quotaToCashSafe(legacyAmount),
          description: "",
          rule_notice: drawService.rule_notice,
          video_notice: drawService.video_notice,
        };
      }
    }
    return null;
  }

  const roundedWan =
    Math.ceil(Math.max(rawWan, drawService.min_draw_wan) / drawService.step_draw_wan) *
    drawService.step_draw_wan;
  const drawWan = Math.max(drawService.min_draw_wan, roundedWan);
  const cashAmountYuan = Number((drawWan * Number(tier.price_yuan_per_wan || 0)).toFixed(2));
  const quotaAmount = cashToQuota(cashAmountYuan);
  if (!quotaAmount) return null;
  const paymentMethod =
    String(tier.payment_method || "").trim() === "residual_transfer"
      ? "residual_transfer"
      : "quota";
  const transferAmount =
    paymentMethod === "residual_transfer"
      ? Math.max(Math.ceil(drawWan * Number(tier.transfer_amount_per_wan || 10000)), 1)
      : null;

  return {
    legacy: false,
    amount_quota: quotaAmount,
    draw_amount_wan: drawWan,
    tier_key: tier.key,
    tier_label: tier.label,
    price_yuan_per_wan: Number(tier.price_yuan_per_wan || 0),
    cash_amount_yuan: cashAmountYuan,
    payment_method: paymentMethod,
    transfer_amount: transferAmount,
    transfer_amount_per_wan:
      paymentMethod === "residual_transfer" ? Number(tier.transfer_amount_per_wan || 10000) : null,
    transfer_unit: config.residual_unit_label || "残卷",
    transfer_target_role_id: config.residual_admin_role_id || "584967604",
    transfer_target_role_name: config.residual_admin_role_name || "admin残卷",
    description: tier.description,
    requires_season_member: Boolean(tier.requires_season_member),
    max_draw_wan_per_order: Number(tier.max_draw_wan_per_order || 0),
    once_per_season: Boolean(tier.once_per_season),
    rule_notice: drawService.rule_notice,
    video_notice: drawService.video_notice,
  };
}

function quotaToCashSafe(quotaAmount) {
  const quota = Number(quotaAmount);
  if (!Number.isFinite(quota) || quota <= 0) return null;
  return Number((quota / QUOTA_PER_YUAN).toFixed(2));
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
  const exchangeYuan = QUOTA_ANCHOR_YUAN;
  const exchangeQuota = QUOTA_ANCHOR_QUOTA;
  const seasonMemberSeasonLabel = parseText(
    process.env.SEASON_MEMBER_SEASON_LABEL,
    DEFAULT_SEASON_MEMBER_SEASON_LABEL
  );
  const seasonMemberExpiresAt = parseText(
    process.env.SEASON_MEMBER_EXPIRES_AT,
    DEFAULT_SEASON_MEMBER_EXPIRES_AT
  );
  const seasonMemberPriceYuan = parsePositiveMoney(
    process.env.SEASON_MEMBER_PRICE_YUAN,
    30
  );
  const seasonMemberQuota = parsePositiveInteger(
    process.env.SEASON_MEMBER_QUOTA,
    cashToQuota(seasonMemberPriceYuan)
  );
  const seasonMemberBonusRate = parseRate(
    process.env.SEASON_MEMBER_BONUS_RATE,
    0.05
  );
  const minAmountYuan = Math.max(
    parsePositiveMoney(process.env.RECHARGE_MIN_YUAN, exchangeYuan),
    exchangeYuan
  );
  const currentSeasonGoldMinDisplayCashYuan = parseNonNegativeMoney(
    process.env.CURRENT_SEASON_GOLD_MIN_DISPLAY_CASH_YUAN,
    0
  );
  const residualUnitPriceYuan = getResidualUnitPriceYuan({
    residual_recharge_anchor_cash_yuan: process.env.RESIDUAL_RECHARGE_ANCHOR_CASH_YUAN,
    residual_unit_price_yuan: process.env.RESIDUAL_UNIT_PRICE_YUAN,
    residual_quota_per_unit: process.env.RESIDUAL_QUOTA_PER_UNIT,
  });
  const residualPurchaseAmountPerQuotaAnchor = getResidualPurchaseAmountPerQuotaAnchor({
    residual_unit_price_yuan: residualUnitPriceYuan,
    residual_purchase_anchor_cash_yuan: process.env.RESIDUAL_PURCHASE_ANCHOR_CASH_YUAN,
    residual_purchase_amount_per_quota_anchor: process.env.RESIDUAL_PURCHASE_AMOUNT_PER_QUOTA_ANCHOR,
  });
  const residualPurchaseUnitPriceYuan = getResidualPurchaseUnitPriceYuan({
    residual_purchase_anchor_cash_yuan: process.env.RESIDUAL_PURCHASE_ANCHOR_CASH_YUAN,
    residual_purchase_amount_per_quota_anchor: residualPurchaseAmountPerQuotaAnchor,
  });
  const residualPurchaseAnchorCashYuan = getResidualPurchaseAnchorCashYuan({
    residual_purchase_anchor_cash_yuan: process.env.RESIDUAL_PURCHASE_ANCHOR_CASH_YUAN,
    residual_purchase_amount_per_quota_anchor: residualPurchaseAmountPerQuotaAnchor,
  });
  const residualQuotaPerUnit = getDerivedResidualQuotaPerUnit(
    { residual_unit_price_yuan: residualUnitPriceYuan }
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
    current_season_gold_min_display_cash_yuan: currentSeasonGoldMinDisplayCashYuan,
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
    residual_unit_price_yuan: residualUnitPriceYuan,
    residual_recharge_unit_price_yuan: residualUnitPriceYuan,
    residual_anchor_amount: RESIDUAL_ANCHOR_AMOUNT,
    residual_recharge_anchor_cash_yuan: Number((residualUnitPriceYuan * RESIDUAL_ANCHOR_AMOUNT).toFixed(2)),
    residual_anchor_cash_yuan: Number((residualUnitPriceYuan * RESIDUAL_ANCHOR_AMOUNT).toFixed(2)),
    residual_purchase_anchor_quota: QUOTA_ANCHOR_QUOTA,
    residual_purchase_anchor_cash_yuan: residualPurchaseAnchorCashYuan,
    residual_purchase_amount_per_quota_anchor: residualPurchaseAmountPerQuotaAnchor,
    residual_purchase_unit_price_yuan: residualPurchaseUnitPriceYuan,
    residual_quota_per_unit: residualQuotaPerUnit,
    season_member_enabled: true,
    season_member_season_label: seasonMemberSeasonLabel,
    season_member_expires_at: seasonMemberExpiresAt,
    season_member_price_yuan: seasonMemberPriceYuan,
    season_member_quota: cashToQuota(seasonMemberPriceYuan) || seasonMemberQuota,
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
      "2. 管理员游戏 ID：584967604，残卷按提交时后台单价折算为额度。",
      "3. 提交时填写转赠时间即可，管理员会按时间核对。",
    ],
    draw_service: buildDefaultDrawServiceConfig(),
    pricing_controls: buildDefaultPricingControls(),
  };
}

function normalizeRechargeConfig(rawConfig = {}) {
  const defaults = buildDefaultRechargeConfig();
  const exchangeYuan = QUOTA_ANCHOR_YUAN;
  const exchangeQuota = QUOTA_ANCHOR_QUOTA;
  const seasonMemberPriceYuan = parsePositiveMoney(
    rawConfig.season_member_price_yuan,
    defaults.season_member_price_yuan
  );
  const seasonMemberQuota = cashToQuota(seasonMemberPriceYuan) || defaults.season_member_quota;
  const seasonMemberBonusRate = parseRate(
    rawConfig.season_member_bonus_rate,
    defaults.season_member_bonus_rate
  );
  const minAmountYuan = Math.max(
    parsePositiveMoney(rawConfig.min_amount_yuan, defaults.min_amount_yuan),
    1
  );
  const currentSeasonGoldMinDisplayCashYuan = parseNonNegativeMoney(
    rawConfig.current_season_gold_min_display_cash_yuan,
    defaults.current_season_gold_min_display_cash_yuan
  );
  const residualUnitPriceYuan = getResidualUnitPriceYuan({
    residual_recharge_anchor_cash_yuan: rawConfig.residual_recharge_anchor_cash_yuan,
    residual_anchor_cash_yuan: rawConfig.residual_anchor_cash_yuan,
    residual_recharge_unit_price_yuan: rawConfig.residual_recharge_unit_price_yuan,
    residual_unit_price_yuan: rawConfig.residual_unit_price_yuan,
    residual_quota_per_unit: rawConfig.residual_quota_per_unit,
  });
  const residualPurchaseAmountPerQuotaAnchor = getResidualPurchaseAmountPerQuotaAnchor({
    residual_unit_price_yuan: residualUnitPriceYuan,
    residual_purchase_anchor_cash_yuan: rawConfig.residual_purchase_anchor_cash_yuan,
    residual_purchase_amount_per_quota_anchor: rawConfig.residual_purchase_amount_per_quota_anchor,
  });
  const residualPurchaseUnitPriceYuan = getResidualPurchaseUnitPriceYuan({
    residual_purchase_anchor_cash_yuan: rawConfig.residual_purchase_anchor_cash_yuan,
    residual_purchase_amount_per_quota_anchor: residualPurchaseAmountPerQuotaAnchor,
  });
  const residualPurchaseAnchorCashYuan = getResidualPurchaseAnchorCashYuan({
    residual_purchase_anchor_cash_yuan: rawConfig.residual_purchase_anchor_cash_yuan,
    residual_purchase_amount_per_quota_anchor: residualPurchaseAmountPerQuotaAnchor,
  });
  const residualQuotaPerUnit = getDerivedResidualQuotaPerUnit(
    { residual_unit_price_yuan: residualUnitPriceYuan }
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
  const drawService = normalizeDrawServiceConfig(rawConfig.draw_service, defaults.draw_service);
  const migrateLegacyDefaultSeason = shouldMigrateLegacyDefaultSeason(rawConfig);
  const seasonMemberSeasonLabelSource = migrateLegacyDefaultSeason
    ? defaults.season_member_season_label
    : rawConfig.season_member_season_label;
  const seasonMemberExpiresAtSource = migrateLegacyDefaultSeason
    ? defaults.season_member_expires_at
    : rawConfig.season_member_expires_at;

  const normalized = {
    enabled: rawConfig.enabled === undefined ? defaults.enabled : Boolean(rawConfig.enabled),
    channel: "alipay_qr",
    exchange_yuan: exchangeYuan,
    exchange_quota: exchangeQuota,
    quota_per_yuan: QUOTA_PER_YUAN,
    min_amount_yuan: minAmountYuan,
    current_season_gold_min_display_cash_yuan: currentSeasonGoldMinDisplayCashYuan,
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
    residual_unit_price_yuan: residualUnitPriceYuan,
    residual_recharge_unit_price_yuan: residualUnitPriceYuan,
    residual_anchor_amount: RESIDUAL_ANCHOR_AMOUNT,
    residual_recharge_anchor_cash_yuan: Number((residualUnitPriceYuan * RESIDUAL_ANCHOR_AMOUNT).toFixed(2)),
    residual_anchor_cash_yuan: Number((residualUnitPriceYuan * RESIDUAL_ANCHOR_AMOUNT).toFixed(2)),
    residual_purchase_anchor_quota: QUOTA_ANCHOR_QUOTA,
    residual_purchase_anchor_cash_yuan: residualPurchaseAnchorCashYuan,
    residual_purchase_amount_per_quota_anchor: residualPurchaseAmountPerQuotaAnchor,
    residual_purchase_unit_price_yuan: residualPurchaseUnitPriceYuan,
    residual_quota_per_unit: residualQuotaPerUnit,
    season_member_enabled:
      rawConfig.season_member_enabled === undefined
        ? defaults.season_member_enabled
        : Boolean(rawConfig.season_member_enabled),
    season_member_season_label: parseText(
      seasonMemberSeasonLabelSource,
      defaults.season_member_season_label
    ),
    season_member_expires_at: parseText(
      seasonMemberExpiresAtSource,
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
    draw_service: drawService,
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
    quota_amount: cashToQuota(normalizedAmount),
    ...buildPaymentConversionSnapshot(config),
  };
}

function buildSeasonMemberQuote(rechargeConfig) {
  const config = normalizeRechargeConfig(rechargeConfig || {});
  if (!config.season_member_enabled) return null;

  return {
    amount_yuan: Number(config.season_member_price_yuan || 0),
    quota_amount: cashToQuota(config.season_member_price_yuan),
    season_label: config.season_member_season_label,
    expires_at: config.season_member_expires_at,
    bonus_rate: Number(config.season_member_bonus_rate || 0),
    ...buildPaymentConversionSnapshot(config),
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
    transfer_cash_amount_yuan: residualToCash(normalizedAmount, config),
    quota_amount: cashToQuota(residualToCash(normalizedAmount, config)),
    target_role_id: config.residual_admin_role_id,
    target_role_name: config.residual_admin_role_name,
    ...buildPaymentConversionSnapshot(config),
  };
}

module.exports = {
  buildDefaultRechargeConfig,
  buildDefaultDrawServiceConfig,
  buildDefaultPricingControls,
  normalizeDrawServiceConfig,
  normalizePricingControls,
  normalizeRechargeConfig,
  getRechargeConfig,
  sanitizeAdminRechargeConfig,
  buildRechargeQuote,
  buildSeasonMemberQuote,
  buildResidualTransferQuote,
  quoteDrawServiceOrder,
  PRICING_CONTROL_TIER_ORDER,
  PRICING_CONTROL_TIER_LABELS,
  DRAW_SERVICE_DEFAULT_TIER_ORDER,
};
