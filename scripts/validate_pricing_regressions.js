#!/usr/bin/env node

const { repriceProducts } = require("../backend/src/services/pricing");
const { getRechargeConfig, sanitizeAdminRechargeConfig } = require("../backend/src/config/recharge-config");
const { LEGACY_CAPS } = require("../backend/src/config/catalog-config");

function createProduct(id, legacyId, overrides = {}) {
  const caps = LEGACY_CAPS[legacyId] || {};
  return {
    id,
    legacy_id: legacyId,
    uid: `test-${id}`,
    name: `Product ${id}`,
    attack_value: Number(caps.attack_max || 0),
    hp_value: Number(caps.hp_max || 0),
    ext_attrs: "",
    schedule_id: null,
    current_schedule_id: null,
    is_current_season: false,
    season_display: "往赛季",
    main_attrs: "",
    price_quota: 0,
    manual_price_quota: null,
    stock: 1,
    status: "on_sale",
    pricing_meta: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildPricingConfig() {
  const rechargeConfig = getRechargeConfig();
  rechargeConfig.pricing_controls = rechargeConfig.pricing_controls || {};
  rechargeConfig.pricing_controls.enabled = true;
  rechargeConfig.pricing_controls.tiers.purple.atlas_double_full_quota = 7777;
  rechargeConfig.pricing_controls.tiers.red.atlas_double_full_quota = 18888;
  rechargeConfig.pricing_controls.tiers.gold.term_attack_bonus_rate = 0.5;
  rechargeConfig.pricing_controls.tiers.gold.term_attack_bonus_start_rate = 0.95;
  rechargeConfig.pricing_controls.tiers.gold.term_attack_penalty_rate = 0.4;
  rechargeConfig.pricing_controls.tiers.gold.term_attack_penalty_start_rate = 0.85;
  rechargeConfig.pricing_controls.legacy_discount_rate = 80;
  rechargeConfig.pricing_controls.legacy_double_term_discount_rate = 95;
  rechargeConfig.pricing_controls.double_term_bonus_percent = 15;
  return rechargeConfig;
}

function main() {
  const rechargeConfig = buildPricingConfig();
  const products = [
    createProduct(1, 201),
    createProduct(2, 401),
    createProduct(3, 501, {
      attack_value: 10000000,
      hp_value: 190000000,
    }),
    createProduct(4, 501, {
      attack_value: 10000000,
      hp_value: 190000000,
      ext_attrs: "走火入魔 2.3",
    }),
    createProduct(5, 601, {
      attack_value: 500000,
      hp_value: 5000000,
    }),
    createProduct(6, 501, {
      attack_value: 10000000,
      hp_value: 199000000,
      ext_attrs: "走火入魔 2.9 气定神闲 2.3",
      is_current_season: true,
      season_display: "本赛季",
    }),
    createProduct(7, 501, {
      attack_value: 8200000,
      hp_value: 199000000,
      ext_attrs: "走火入魔 2.9",
    }),
    createProduct(8, 501, {
      attack_value: 9000000,
      hp_value: 188000000,
      ext_attrs: "走火入魔 2.6 气定神闲 2.4",
    }),
  ];

  const priced = repriceProducts(products, [], new Date(), { rechargeConfig });
  const byId = new Map(priced.map((item) => [item.id, item]));

  const purpleDoubleFull = byId.get(1);
  const redDoubleFull = byId.get(2);
  const goldNoTerm = byId.get(3);
  const goldSingleTerm = byId.get(4);
  const rareLegacy = byId.get(5);
  const goldDualTerm = byId.get(6);
  const goldLowAttackTerm = byId.get(7);
  const legacyGoldDualTerm = byId.get(8);

  expect(
    purpleDoubleFull.pricing_meta.explain.exact_double_full === true &&
      purpleDoubleFull.pricing_meta.explain.atlas_double_full_quota_hit === true &&
      purpleDoubleFull.pricing_meta.atlas.reference_range.double_full_quota >= 7777,
    "Purple exact double-full should hit configured double-full quota."
  );
  expect(
    redDoubleFull.pricing_meta.explain.exact_double_full === true &&
      redDoubleFull.pricing_meta.explain.atlas_double_full_quota_hit === true &&
      redDoubleFull.pricing_meta.atlas.reference_range.double_full_quota >= 18888,
    "Red exact double-full should hit configured double-full quota."
  );
  expect(
    goldSingleTerm.price_quota >= goldNoTerm.price_quota,
    "Term gold card should not price below no-term gold card at same stats."
  );
  expect(
    rareLegacy.pricing_meta.legacy_discount.skipped_reason === "rare_exempt",
    "Rare legacy card should skip legacy discount."
  );
  expect(
    purpleDoubleFull.pricing_meta.legacy_discount.skipped_reason === "double_full_exempt",
    "Exact double-full card should skip legacy discount."
  );
  expect(
    !goldNoTerm.pricing_meta.wear.attack_adjustment,
    "No-term gold should not expose term attack adjustment details."
  );
  expect(
    Number(goldSingleTerm.pricing_meta.wear.attack_adjustment.multiplier || 0) > 1,
    "Term gold should receive configured positive attack multiplier when attack is high enough."
  );
  expect(
    goldNoTerm.pricing_meta.gold_no_term_direct_pricing === true,
    "No-term gold card should use dedicated no-term direct pricing path."
  );
  expect(
    goldDualTerm.pricing_meta.double_term_bonus.applies === true,
    "Dual-term gold card should apply configured double-term bonus."
  );
  expect(
    legacyGoldDualTerm.pricing_meta.legacy_discount.profile === "legacy_double_term" &&
      legacyGoldDualTerm.pricing_meta.legacy_discount.rate_percent === 95,
    "Legacy dual-term card should use the dedicated legacy dual-term discount rate."
  );
  expect(
    Number(goldLowAttackTerm.pricing_meta.wear.attack_adjustment.multiplier || 1) < 1,
    "Low-attack term gold should receive configured negative attack multiplier."
  );

  const sanitizedConfig = sanitizeAdminRechargeConfig(rechargeConfig);
  expect(
    !Object.keys(sanitizedConfig.pricing_controls.tiers.purple).some((key) => key.startsWith("no_term_")),
    "Non-gold tiers should not expose no_term_* fields in sanitized admin recharge config."
  );
  expect(
    Object.keys(sanitizedConfig.pricing_controls.tiers.gold).includes("no_term_full_attack_quota"),
    "Gold tier should retain no_term_* fields in sanitized admin recharge config."
  );

  console.log("Pricing regression checks passed.");
}

main();
