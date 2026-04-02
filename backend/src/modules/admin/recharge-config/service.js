const { getAdminRechargeConfigRepository } = require("./repository");

function buildRechargeConfigPatch(body = {}) {
  return {
    enabled: body.enabled,
    exchange_yuan: body.exchange_yuan,
    exchange_quota: body.exchange_quota,
    min_amount_yuan: body.min_amount_yuan,
    residual_transfer_enabled: body.residual_transfer_enabled,
    residual_admin_role_id: body.residual_admin_role_id,
    residual_admin_role_name: body.residual_admin_role_name,
    residual_admin_game_name: body.residual_admin_game_name,
    residual_unit_label: body.residual_unit_label,
    residual_quota_per_unit: body.residual_quota_per_unit,
    season_member_enabled: body.season_member_enabled,
    season_member_season_label: body.season_member_season_label,
    season_member_expires_at: body.season_member_expires_at,
    season_member_price_yuan: body.season_member_price_yuan,
    season_member_quota: body.season_member_quota,
    season_member_bonus_rate: body.season_member_bonus_rate,
    preset_amounts: body.preset_amounts,
    qr_image_url: body.qr_image_url,
    payee_name: body.payee_name,
    payee_hint: body.payee_hint,
    instructions: body.instructions,
    residual_instructions: body.residual_instructions,
  };
}

async function getAdminRechargeConfig() {
  const repository = getAdminRechargeConfigRepository();
  return await repository.getRechargeConfig();
}

async function updateAdminRechargeConfig(actorUser, body = {}) {
  const repository = getAdminRechargeConfigRepository();
  return await repository.updateRechargeConfig({
    patch: buildRechargeConfigPatch(body),
    actorUserId: actorUser.id,
  });
}

module.exports = {
  buildRechargeConfigPatch,
  getAdminRechargeConfig,
  updateAdminRechargeConfig,
};
