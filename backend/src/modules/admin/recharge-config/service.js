const {
  sanitizeAdminRechargeConfig,
} = require("../../../config/recharge-config");
const { getAdminRechargeConfigRepository } = require("./repository");

function stripUnsupportedNoTermFieldsFromPricingControls(pricingControls) {
  if (!pricingControls || typeof pricingControls !== "object" || Array.isArray(pricingControls)) {
    return pricingControls;
  }
  const nextPricingControls = {
    ...pricingControls,
    tiers:
      pricingControls.tiers && typeof pricingControls.tiers === "object"
        ? { ...pricingControls.tiers }
        : pricingControls.tiers,
  };

  if (nextPricingControls.tiers && typeof nextPricingControls.tiers === "object") {
    for (const tierKey of ["green", "blue", "purple", "orange", "red"]) {
      const tier = nextPricingControls.tiers[tierKey];
      if (!tier || typeof tier !== "object" || Array.isArray(tier)) continue;
      const nextTier = { ...tier };
      delete nextTier.no_term_min_quota;
      delete nextTier.no_term_full_attack_quota;
      delete nextTier.no_term_double_full_quota;
      delete nextTier.no_term_hp_bonus_start_value;
      nextPricingControls.tiers[tierKey] = nextTier;
    }
  }

  return nextPricingControls;
}

function buildRechargeConfigPatch(body = {}) {
  return {
    enabled: body.enabled,
    exchange_yuan: body.exchange_yuan,
    exchange_quota: body.exchange_quota,
    min_amount_yuan: body.min_amount_yuan,
    current_season_gold_min_display_cash_yuan: body.current_season_gold_min_display_cash_yuan,
    residual_transfer_enabled: body.residual_transfer_enabled,
    residual_admin_role_id: body.residual_admin_role_id,
    residual_admin_role_name: body.residual_admin_role_name,
    residual_admin_game_name: body.residual_admin_game_name,
    residual_unit_label: body.residual_unit_label,
    residual_recharge_anchor_cash_yuan: body.residual_recharge_anchor_cash_yuan,
    residual_recharge_unit_price_yuan: body.residual_recharge_unit_price_yuan,
    residual_anchor_cash_yuan: body.residual_anchor_cash_yuan,
    residual_unit_price_yuan: body.residual_unit_price_yuan,
    residual_purchase_anchor_cash_yuan: body.residual_purchase_anchor_cash_yuan,
    residual_purchase_amount_per_quota_anchor: body.residual_purchase_amount_per_quota_anchor,
    residual_quota_per_unit: body.residual_quota_per_unit,
    season_member_enabled: body.season_member_enabled,
    season_member_season_label: body.season_member_season_label,
    season_member_expires_at: body.season_member_expires_at,
    season_member_price_yuan: body.season_member_price_yuan,
    season_member_quota: body.season_member_quota,
    season_member_bonus_rate: body.season_member_bonus_rate,
    lineup_base_slots: body.lineup_base_slots,
    lineup_permanent_slot_quota: body.lineup_permanent_slot_quota,
    lineup_permanent_slot_max: body.lineup_permanent_slot_max,
    lineup_seasonal_slot_quota: body.lineup_seasonal_slot_quota,
    lineup_member_bonus_slots: body.lineup_member_bonus_slots,
    preset_amounts: body.preset_amounts,
    qr_image_url: body.qr_image_url,
    payee_name: body.payee_name,
    payee_hint: body.payee_hint,
    wechat_qr_image_url: body.wechat_qr_image_url,
    wechat_payee_name: body.wechat_payee_name,
    wechat_payee_hint: body.wechat_payee_hint,
    instructions: body.instructions,
    residual_instructions: body.residual_instructions,
    draw_service: body.draw_service,
    pricing_controls: stripUnsupportedNoTermFieldsFromPricingControls(body.pricing_controls),
  };
}

async function getAdminRechargeConfig() {
  const repository = getAdminRechargeConfigRepository();
  return sanitizeAdminRechargeConfig(await repository.getRechargeConfig());
}

async function updateAdminRechargeConfig(actorUser, body = {}, requestId = null) {
  const repository = getAdminRechargeConfigRepository();
  return await repository.updateRechargeConfig({
    patch: buildRechargeConfigPatch(body),
    actorUserId: actorUser.id,
    requestId,
  });
}

module.exports = {
  buildRechargeConfigPatch,
  getAdminRechargeConfig,
  updateAdminRechargeConfig,
};
