const { ORDER_STATUS_VALUES } = require("../../domain/order-status");

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

function validateOrderCreate(body) {
  const errors = [];
  const itemId = body.item_id ?? body.product_id;
  if (!isInteger(itemId)) errors.push("item_id_required");
  if (
    body.item_kind !== undefined &&
    !["card", "bundle"].includes(String(body.item_kind).trim())
  ) {
    errors.push("item_kind_invalid");
  }
  return errors;
}

function validateGuestTransferOrderCreate(body) {
  const errors = [];
  const itemId = body.item_id ?? body.product_id;
  const paymentChannel = String(body.payment_channel || "alipay_qr").trim() || "alipay_qr";
  if (!isInteger(itemId)) errors.push("item_id_required");
  if (
    body.item_kind !== undefined &&
    !["card", "bundle"].includes(String(body.item_kind).trim())
  ) {
    errors.push("item_kind_invalid");
  }
  if (!requiredString(body.game_role_id)) errors.push("game_role_id_required");
  if (!requiredString(body.game_role_name)) errors.push("game_role_name_required");
  if (body.nickname !== undefined && !optionalString(body.nickname)) {
    errors.push("nickname_invalid");
  }
  if (
    paymentChannel === "game_residual_transfer"
      ? !Number.isInteger(body.transfer_amount) || Number(body.transfer_amount) <= 0
      : !isPositiveMoneyAmount(body.amount_yuan)
  ) {
    errors.push("amount_yuan_invalid");
  }
  if (!requiredString(body.payment_reference)) {
    errors.push("payment_reference_required");
  }
  if (
    body.payment_channel !== undefined &&
    !["alipay_qr", "wechat_qr", "game_residual_transfer"].includes(paymentChannel)
  ) {
    errors.push("payment_channel_invalid");
  }
  if (body.payer_note !== undefined && !optionalString(body.payer_note)) {
    errors.push("payer_note_invalid");
  }
  return [...new Set(errors)];
}

function validateOrderCancelRequestInput(body) {
  const errors = [];
  if (body.remark !== undefined && body.remark !== null && typeof body.remark !== "string") {
    errors.push("remark_invalid");
  }
  return errors;
}

function validateOrderStatus(status) {
  return ORDER_STATUS_VALUES.includes(status);
}

function validateDrawOrderCreate(body) {
  const errors = [];
  if (!isInteger(body?.amount_quota)) {
    errors.push("amount_quota_invalid");
    return errors;
  }
  const amount = Number(body.amount_quota);
  if (amount < 200) {
    errors.push("amount_quota_too_small");
  }
  if (amount % 200 !== 0) {
    errors.push("amount_quota_step_invalid");
  }
  return [...new Set(errors)];
}

function validateAuctionBidCreate(body) {
  const errors = [];
  if (!isInteger(body?.amount_quota) || Number(body.amount_quota) <= 0) {
    errors.push("amount_quota_invalid");
  }
  return [...new Set(errors)];
}

module.exports = {
  validateOrderCreate,
  validateGuestTransferOrderCreate,
  validateOrderCancelRequestInput,
  validateOrderStatus,
  validateDrawOrderCreate,
  validateAuctionBidCreate,
};
