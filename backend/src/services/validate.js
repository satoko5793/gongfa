function requiredString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalString(value) {
  return value === undefined || value === null || typeof value === "string";
}

function isInteger(value) {
  return Number.isInteger(value);
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
  if (!requiredString(body.password)) errors.push("password_required");
  if (requiredString(body.password) && body.password.trim().length < 6) {
    errors.push("password_too_short");
  }
  if (!optionalString(body.nickname)) errors.push("nickname_invalid");
  return errors;
}

function validatePasswordLoginInput(body) {
  const errors = [];
  if (!requiredString(body.game_role_id)) errors.push("game_role_id_required");
  if (!requiredString(body.password)) errors.push("password_required");
  return errors;
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
  const intFields = ["attack_value", "hp_value", "price_quota", "stock"];
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

function validateOrderStatus(status) {
  return ["pending", "confirmed", "cancelled"].includes(status);
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
  validateImportInput,
  validateProductStatus,
  validateProductUpdate,
  validateBundleUpdate,
  validateQuotaChange,
  validateOrderCreate,
  validateOrderStatus,
};
