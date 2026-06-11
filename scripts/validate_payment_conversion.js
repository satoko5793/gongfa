#!/usr/bin/env node

const {
  cashToQuota,
  quotaToCash,
  residualToCash,
  cashToResidual,
  getResidualAnchorCashYuan,
  getResidualPurchaseAnchorCashYuan,
  getResidualPurchaseAmountPerQuotaAnchor,
  getResidualUnitPriceYuan,
  QUOTA_ANCHOR_YUAN,
  QUOTA_ANCHOR_QUOTA,
  QUOTA_PER_YUAN,
  RESIDUAL_ANCHOR_AMOUNT,
} = require("../backend/src/domain/payment-conversion");
const {
  buildRechargeQuote,
  buildResidualTransferQuote,
  buildSeasonMemberQuote,
  getRechargeConfig,
} = require("../backend/src/config/recharge-config");

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  expect(QUOTA_ANCHOR_YUAN === 8, "quota anchor yuan should stay fixed at 8.");
  expect(QUOTA_ANCHOR_QUOTA === 10000, "quota anchor amount should stay fixed at 10000.");
  expect(QUOTA_PER_YUAN === 1250, "quota per yuan should stay fixed at 1250.");
  expect(RESIDUAL_ANCHOR_AMOUNT === 10000, "residual anchor amount should stay at 10000.");
  expect(cashToQuota(8) === 10000, "8 yuan should convert to 10000 quota.");
  expect(cashToQuota(30) === 37500, "30 yuan should convert to 37500 quota.");
  expect(quotaToCash(10000) === 8, "10000 quota should convert to 8 yuan.");

  const config = getRechargeConfig({
    residual_unit_price_yuan: 0.02,
    season_member_price_yuan: 30,
    season_member_bonus_rate: 0.05,
  });

  const cashRecharge = buildRechargeQuote(8, config);
  expect(cashRecharge.quota_amount === 10000, "cash recharge should use fixed quota anchor.");
  expect(cashRecharge.quota_per_yuan === 1250, "cash recharge snapshot should include fixed quota rate.");

  const residualCash = residualToCash(100, config);
  expect(residualCash === 2, "100 residual at 0.02 yuan should equal 2 yuan.");
  const residualRecharge = buildResidualTransferQuote(100, config);
  expect(residualRecharge.transfer_cash_amount_yuan === 2, "residual quote should store cash equivalent.");
  expect(residualRecharge.quota_amount === 2500, "100 residual at 0.02 yuan should convert to 2500 quota.");
  expect(residualRecharge.residual_unit_price_yuan === 0.02, "residual quote should snapshot unit price.");

  const memberQuote = buildSeasonMemberQuote(config);
  expect(memberQuote.quota_amount === 37500, "season member quota should be derived from member cash price.");

  const residualForProduct = cashToResidual(quotaToCash(10000), config);
  expect(residualForProduct === 400, "10000 quota product should require 400 residual at 0.02 yuan each.");

  const anchorCashConfig = getRechargeConfig({
    residual_anchor_cash_yuan: 4,
    residual_unit_price_yuan: 0.0008,
  });
  expect(
    getResidualUnitPriceYuan(anchorCashConfig) === 0.0004,
    "editable anchor cash should override stale residual unit price."
  );
  expect(
    cashToResidual(quotaToCash(10000), anchorCashConfig) === 20000,
    "10000 quota product should require 20000 residual when 4 yuan = 10000 residual."
  );

  const splitResidualConfig = getRechargeConfig({
    residual_recharge_anchor_cash_yuan: 7.9,
    residual_purchase_anchor_cash_yuan: 7.9,
  });
  expect(
    buildResidualTransferQuote(10000, splitResidualConfig).quota_amount === 9875,
    "10000 residual recharge at 7.9 yuan should yield 9875 quota."
  );
  expect(
    cashToResidual(quotaToCash(10000), splitResidualConfig) === 10127,
    "10000 quota product should require more residual when purchase ratio is 7.9 yuan per 10000 residual."
  );
  expect(
    getResidualPurchaseAnchorCashYuan(splitResidualConfig) === 7.9,
    "purchase residual cash anchor should be stored independently from recharge ratio."
  );
  expect(
    getResidualPurchaseAmountPerQuotaAnchor(splitResidualConfig) === 10127,
    "purchase residual amount should be derived from purchase cash anchor."
  );
  expect(
    getRechargeConfig({ current_season_gold_min_display_cash_yuan: 8.5 })
      .current_season_gold_min_display_cash_yuan === 8.5,
    "current season gold min display cash threshold should be configurable."
  );

  const memberBonus = Math.floor(residualRecharge.quota_amount * Number(config.season_member_bonus_rate || 0));
  expect(memberBonus === 125, "member bonus should still apply to residual base quota.");

  const legacyResidualConfig = getRechargeConfig({ residual_quota_per_unit: 1 });
  expect(
    getResidualUnitPriceYuan(legacyResidualConfig) === 0.0008,
    "legacy 1 residual = 1 quota should migrate to 0.0008 yuan per residual."
  );
  expect(
    cashToResidual(8, legacyResidualConfig) === 10000,
    "legacy residual config should display as 8 yuan = 10000 residual."
  );
  expect(
    getResidualAnchorCashYuan(legacyResidualConfig) === 8,
    "legacy residual config should expose editable ratio as 8 yuan = 10000 residual."
  );
  expect(
    buildResidualTransferQuote(10000, legacyResidualConfig).quota_amount === 10000,
    "legacy residual config should preserve 1 residual = 1 quota value."
  );

  console.log("[ok] payment conversion validation passed");
}

main();
