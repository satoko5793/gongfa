function validateParticipantInput(body) {
  const errors = [];

  if (!body.game_name) errors.push("game_name_required");
  if (typeof body.need_help_this_week !== "boolean") errors.push("need_help_this_week_required");
  if (typeof body.coupons_received !== "number") errors.push("coupons_received_required");
  if (!body.game_id) errors.push("game_id_required");
  if (typeof body.lian_gong_mode !== "number") errors.push("lian_gong_mode_required");

  return errors;
}

function validateLedgerInput(body) {
  const errors = [];
  if (!body.participant_id) errors.push("participant_id_required");
  if (!body.type) errors.push("type_required");
  return errors;
}

module.exports = { validateParticipantInput, validateLedgerInput };
