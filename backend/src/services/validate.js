const {
  validateOrderCreate,
  validateGuestTransferOrderCreate,
  validateOrderCancelRequestInput,
  validateOrderStatus,
  validateDrawOrderCreate,
  validateAuctionBidCreate,
} = require("../modules/orders/validators");

function requiredString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalString(value) {
  return value === undefined || value === null || typeof value === "string";
}

function isInteger(value) {
  return Number.isInteger(value);
}

function isPositiveMoneyAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return false;
  return Math.abs(numeric * 100 - Math.round(numeric * 100)) < 0.000001;
}

function validateBindInput(body) {
  const errors = [];
  if (!requiredString(body.game_role_id)) errors.push("game_role_id_required");
  if (!requiredString(body.game_server)) errors.push("game_server_required");
  if (!requiredString(body.game_role_name)) errors.push("game_role_name_required");
  if (!optionalString(body.bind_token_id)) errors.push("bind_token_id_invalid");
  if (!optionalString(body.nickname)) errors.push("nickname_invalid");
  return errors;
}

function validatePasswordRegisterInput(body) {
  const errors = [];
  if (!requiredString(body.game_role_id)) errors.push("game_role_id_required");
  if (!requiredString(body.game_role_name)) errors.push("game_role_name_required");
  if (!requiredString(body.password)) errors.push("password_required");
  if (requiredString(body.password) && body.password.trim().length < 6) {
    errors.push("password_too_short");
  }
  return errors;
}

function validatePasswordLoginInput(body) {
  const errors = [];
  if (!requiredString(body.game_role_id)) errors.push("game_role_id_required");
  if (!requiredString(body.password)) errors.push("password_required");
  return errors;
}

function validateProfileUpdateInput(body) {
  const errors = [];
  if (
    body.game_role_name === undefined &&
    body.nickname === undefined &&
    body.game_server === undefined
  ) {
    errors.push("profile_update_empty");
  }
  if (body.game_role_name !== undefined && !requiredString(body.game_role_name)) {
    errors.push("game_role_name_required");
  }
  if (body.nickname !== undefined && !optionalString(body.nickname)) {
    errors.push("nickname_invalid");
  }
  if (body.game_server !== undefined && !requiredString(body.game_server)) {
    errors.push("game_server_required");
  }
  return errors;
}

function validatePasswordChangeInput(body) {
  const errors = [];
  if (!requiredString(body.current_password)) errors.push("current_password_required");
  if (!requiredString(body.new_password)) errors.push("new_password_required");
  if (requiredString(body.new_password) && body.new_password.trim().length < 6) {
    errors.push("new_password_too_short");
  }
  return errors;
}

function validateRechargeOrderCreate(body) {
  const errors = [];
  const orderType = String(body.order_type || "normal").trim() || "normal";
  if (
    body.order_type !== undefined &&
    !["normal", "season_member", "residual_transfer"].includes(orderType)
  ) {
    errors.push("order_type_invalid");
  }
  if (
    (orderType === "residual_transfer" && !Number.isInteger(body.amount_yuan)) ||
    (orderType !== "residual_transfer" && !isPositiveMoneyAmount(body.amount_yuan)) ||
    Number(body.amount_yuan) <= 0
  ) {
    errors.push("amount_yuan_invalid");
  }
  if (!requiredString(body.payment_reference)) {
    errors.push("payment_reference_required");
  }
  if (
    body.payment_channel !== undefined &&
    !["alipay_qr", "wechat_qr"].includes(String(body.payment_channel || "").trim())
  ) {
    errors.push("payment_channel_invalid");
  }
  if (body.payment_reference !== undefined && !requiredString(body.payment_reference)) {
    errors.push("payment_reference_invalid");
  }
  if (body.payer_note !== undefined && !optionalString(body.payer_note)) {
    errors.push("payer_note_invalid");
  }
  return [...new Set(errors)];
}

function validateRechargeReviewInput(body) {
  const errors = [];
  if (!["approved", "rejected"].includes(String(body.status || ""))) {
    errors.push("status_invalid");
  }
  if (body.admin_remark !== undefined && !optionalString(body.admin_remark)) {
    errors.push("admin_remark_invalid");
  }
  return errors;
}

function validateRechargeConfigUpdateInput(body) {
  const errors = [];
  if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
    errors.push("enabled_invalid");
  }
  if (
    body.season_member_enabled !== undefined &&
    typeof body.season_member_enabled !== "boolean"
  ) {
    errors.push("season_member_enabled_invalid");
  }
  if (
    body.residual_transfer_enabled !== undefined &&
    typeof body.residual_transfer_enabled !== "boolean"
  ) {
    errors.push("residual_transfer_enabled_invalid");
  }
  for (const field of ["exchange_yuan", "exchange_quota", "min_amount_yuan"]) {
    if (
      body[field] !== undefined &&
      (!Number.isInteger(body[field]) || Number(body[field]) <= 0)
    ) {
      errors.push(`${field}_invalid`);
    }
  }
  if (
    body.residual_quota_per_unit !== undefined &&
    (!Number.isInteger(body.residual_quota_per_unit) || Number(body.residual_quota_per_unit) <= 0)
  ) {
    errors.push("residual_quota_per_unit_invalid");
  }
  for (const field of ["season_member_price_yuan", "season_member_quota"]) {
    if (
      body[field] !== undefined &&
      (!Number.isInteger(body[field]) || Number(body[field]) <= 0)
    ) {
      errors.push(`${field}_invalid`);
    }
  }
  if (
    body.season_member_bonus_rate !== undefined &&
    (typeof body.season_member_bonus_rate !== "number" ||
      !Number.isFinite(body.season_member_bonus_rate) ||
      body.season_member_bonus_rate < 0)
  ) {
    errors.push("season_member_bonus_rate_invalid");
  }
  if (body.preset_amounts !== undefined) {
    if (!Array.isArray(body.preset_amounts)) {
      errors.push("preset_amounts_invalid");
    } else if (
      body.preset_amounts.some(
        (item) => !Number.isInteger(item) || Number(item) <= 0
      )
    ) {
      errors.push("preset_amounts_invalid");
    }
  }
  for (const field of [
    "qr_image_url",
    "payee_name",
    "payee_hint",
    "wechat_qr_image_url",
    "wechat_payee_name",
    "wechat_payee_hint",
    "residual_admin_role_id",
    "residual_admin_role_name",
    "residual_admin_game_name",
    "residual_unit_label",
    "season_member_season_label",
    "season_member_expires_at",
  ]) {
    if (body[field] !== undefined && !requiredString(body[field])) {
      errors.push(`${field}_invalid`);
    }
  }
  if (body.instructions !== undefined) {
    if (!Array.isArray(body.instructions)) {
      errors.push("instructions_invalid");
    } else if (body.instructions.some((item) => !requiredString(item))) {
      errors.push("instructions_invalid");
    }
  }
  if (body.residual_instructions !== undefined) {
    if (!Array.isArray(body.residual_instructions)) {
      errors.push("residual_instructions_invalid");
    } else if (body.residual_instructions.some((item) => !requiredString(item))) {
      errors.push("residual_instructions_invalid");
    }
  }
  return [...new Set(errors)];
}

function validateImportInput(body) {
  const errors = [];
  if (!body || body.raw_json === undefined || body.raw_json === null) {
    errors.push("raw_json_required");
  }
  if (
    body &&
    body.source_type !== undefined &&
    !["upload", "helper_bridge"].includes(body.source_type)
  ) {
    errors.push("source_type_invalid");
  }
  return errors;
}

function validateProductUpdate(body) {
  const errors = [];
  const intFields = ["attack_value", "hp_value", "price_quota", "stock", "discount_rate"];
  for (const field of intFields) {
    if (body[field] !== undefined && !isInteger(body[field])) {
      errors.push(`${field}_invalid`);
    }
  }
  const stringFields = ["name", "image_url", "main_attrs", "ext_attrs"];
  for (const field of stringFields) {
    if (body[field] !== undefined && !optionalString(body[field])) {
      errors.push(`${field}_invalid`);
    }
  }
  return errors;
}

function validateProductStatus(status) {
  return ["draft", "on_sale", "off_sale", "sold"].includes(status);
}

function validateQuotaChange(body) {
  const errors = [];
  if (!isInteger(body.change_amount) || body.change_amount === 0) {
    errors.push("change_amount_invalid");
  }
  if (!optionalString(body.remark)) errors.push("remark_invalid");
  return errors;
}

function validateExternalOrderCreate(body) {
  const errors = [];
  const itemId = body.item_id ?? body.product_id;
  if (!isInteger(itemId)) errors.push("item_id_required");
  if (
    body.item_kind !== undefined &&
    !["card", "bundle"].includes(String(body.item_kind).trim())
  ) {
    errors.push("item_kind_invalid");
  }
  if (!requiredString(body.buyer_label)) {
    errors.push("buyer_label_required");
  }
  if (body.buyer_label !== undefined && !requiredString(body.buyer_label)) {
    errors.push("buyer_label_invalid");
  }
  if (body.remark !== undefined && !optionalString(body.remark)) {
    errors.push("remark_invalid");
  }
  return [...new Set(errors)];
}

function validateAuctionCreate(body) {
  const errors = [];
  if (!isInteger(body?.product_id)) errors.push("product_id_required");
  if (!isInteger(body?.starting_price_quota) || Number(body.starting_price_quota) <= 0) {
    errors.push("starting_price_quota_invalid");
  }
  if (!isInteger(body?.min_increment_quota) || Number(body.min_increment_quota) <= 0) {
    errors.push("min_increment_quota_invalid");
  }
  if (!requiredString(body?.ends_at)) {
    errors.push("ends_at_required");
  }
  if (body?.starts_at !== undefined && body?.starts_at !== null && !requiredString(body.starts_at)) {
    errors.push("starts_at_invalid");
  }
  if (body?.title !== undefined && !optionalString(body.title)) {
    errors.push("title_invalid");
  }
  if (body?.remark !== undefined && !optionalString(body.remark)) {
    errors.push("remark_invalid");
  }
  return [...new Set(errors)];
}

function validateAuctionCancelInput(body) {
  const errors = [];
  if (body?.reason !== undefined && !optionalString(body.reason)) {
    errors.push("reason_invalid");
  }
  if (body?.remark !== undefined && !optionalString(body.remark)) {
    errors.push("remark_invalid");
  }
  return [...new Set(errors)];
}

function validateBundleUpdate(body) {
  const errors = [];
  const intFields = ["price_quota", "display_rank"];
  for (const field of intFields) {
    if (body[field] !== undefined && !isInteger(body[field])) {
      errors.push(`${field}_invalid`);
    }
  }
  if (
    body.stock !== undefined &&
    body.stock !== null &&
    !Number.isInteger(body.stock)
  ) {
    errors.push("stock_invalid");
  }
  const stringFields = ["name", "description", "image_url"];
  for (const field of stringFields) {
    if (body[field] !== undefined && !optionalString(body[field])) {
      errors.push(`${field}_invalid`);
    }
  }
  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    errors.push("tags_invalid");
  }
  return errors;
}

module.exports = {
  validateBindInput,
  validatePasswordRegisterInput,
  validatePasswordLoginInput,
  validateProfileUpdateInput,
  validatePasswordChangeInput,
  validateRechargeOrderCreate,
  validateRechargeReviewInput,
  validateRechargeConfigUpdateInput,
  validateImportInput,
  validateProductStatus,
  validateProductUpdate,
  validateBundleUpdate,
  validateQuotaChange,
  validateOrderCreate,
  validateGuestTransferOrderCreate,
  validateOrderCancelRequestInput,
  validateDrawOrderCreate,
  validateOrderStatus,
  validateExternalOrderCreate,
  validateAuctionCreate,
  validateAuctionBidCreate,
  validateAuctionCancelInput,
};
