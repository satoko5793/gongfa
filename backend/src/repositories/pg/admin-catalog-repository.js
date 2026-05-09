const { pool } = require("../../db/pool");
const { writeAuditLog } = require("../../services/audit");
const { recalculateDatabasePricing } = require("../../services/pricing");
const { AUDIT_ACTIONS } = require("../../domain/audit-actions");

function notFoundError(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

async function bulkUpdateProductStatus({ productIds, status, actorUserId, requestId = null }) {
  const result = await pool.query(
    `UPDATE products
     SET status=$2, updated_at=NOW()
     WHERE id = ANY($1::int[])
     RETURNING id`,
    [productIds, status]
  );

  await writeAuditLog({
    actorUserId,
    targetType: "product",
    targetId: productIds[0],
    action: AUDIT_ACTIONS.PRODUCT_BULK_STATUS_UPDATE,
    detail: { product_ids: productIds, status, updated_count: result.rowCount, request_id: requestId },
  });

  return { updated_count: result.rowCount, status };
}

async function bulkUpdateProducts({ productIds, patch, actorUserId, requestId = null }) {
  const nextPatch = { ...patch };
  const manualPrice =
    Object.prototype.hasOwnProperty.call(nextPatch, "manual_price_quota")
      ? nextPatch.manual_price_quota
      : Object.prototype.hasOwnProperty.call(nextPatch, "price_quota")
      ? nextPatch.price_quota
      : undefined;
  if (Object.prototype.hasOwnProperty.call(nextPatch, "manual_price_quota")) {
    delete nextPatch.manual_price_quota;
  }
  if (Object.prototype.hasOwnProperty.call(nextPatch, "price_quota")) {
    delete nextPatch.price_quota;
  }

  const fields = [];
  const values = [productIds];
  let index = 2;

  for (const [key, value] of Object.entries(nextPatch)) {
    fields.push(`${key}=$${index}`);
    values.push(value);
    index += 1;
  }

  fields.push("updated_at=NOW()");

  if (manualPrice !== undefined) {
    fields.push(`manual_price_quota=$${index}`);
    values.push(manualPrice);
  }

  const result = await pool.query(
    `UPDATE products
     SET ${fields.join(", ")}
     WHERE id = ANY($1::int[])
     RETURNING id`,
    values
  );

  await writeAuditLog({
    actorUserId,
    targetType: "product",
    targetId: productIds[0],
    action: AUDIT_ACTIONS.PRODUCT_BULK_UPDATE,
    detail: {
      product_ids: productIds,
      patch: {
        ...nextPatch,
        ...(manualPrice !== undefined ? { manual_price_quota: manualPrice } : {}),
      },
      updated_count: result.rowCount,
      request_id: requestId,
    },
  });

  await recalculateDatabasePricing(pool);

  return {
    updated_count: result.rowCount,
    patch: {
      ...nextPatch,
      ...(manualPrice !== undefined ? { manual_price_quota: manualPrice } : {}),
    },
  };
}

async function updateProduct({ productId, patch, actorUserId }) {
  const manualPrice =
    Object.prototype.hasOwnProperty.call(patch, "manual_price_quota")
      ? patch.manual_price_quota
      : Object.prototype.hasOwnProperty.call(patch, "price_quota")
      ? patch.price_quota
      : undefined;

  const result = await pool.query(
    `UPDATE products
     SET
      name=COALESCE($2, name),
      image_url=COALESCE($3, image_url),
      attack_value=COALESCE($4, attack_value),
      hp_value=COALESCE($5, hp_value),
      main_attrs=COALESCE($6, main_attrs),
      ext_attrs=COALESCE($7, ext_attrs),
      manual_price_quota=COALESCE($8, manual_price_quota),
      discount_rate=COALESCE($9, discount_rate),
      stock=COALESCE($10, stock),
      updated_at=NOW()
     WHERE id=$1
     RETURNING *`,
    [
      productId,
      patch.name ?? null,
      patch.image_url ?? null,
      patch.attack_value ?? null,
      patch.hp_value ?? null,
      patch.main_attrs ?? null,
      patch.ext_attrs ?? null,
      manualPrice ?? null,
      patch.discount_rate ?? null,
      patch.stock ?? null,
    ]
  );

  if (result.rowCount === 0) {
    throw notFoundError("product_not_found");
  }

  await writeAuditLog({
    actorUserId,
    targetType: "product",
    targetId: Number(productId),
    action: AUDIT_ACTIONS.PRODUCT_UPDATE,
    detail: {
      ...patch,
      ...(manualPrice !== undefined ? { manual_price_quota: manualPrice } : {}),
    },
  });

  await recalculateDatabasePricing(pool);
  const refreshed = await pool.query("SELECT * FROM products WHERE id=$1", [productId]);
  return refreshed.rows[0];
}

async function clearProductManualPrice({ productId, actorUserId }) {
  const result = await pool.query(
    `UPDATE products
     SET manual_price_quota=NULL, updated_at=NOW()
     WHERE id=$1
     RETURNING id`,
    [productId]
  );

  if (result.rowCount === 0) {
    throw notFoundError("product_not_found");
  }

  await writeAuditLog({
    actorUserId,
    targetType: "product",
    targetId: Number(productId),
    action: AUDIT_ACTIONS.PRODUCT_MANUAL_PRICE_CLEAR,
    detail: null,
  });

  await recalculateDatabasePricing(pool);
  const refreshed = await pool.query("SELECT * FROM products WHERE id=$1", [productId]);
  return refreshed.rows[0];
}

async function updateProductStatus({ productId, status, actorUserId }) {
  const result = await pool.query(
    "UPDATE products SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *",
    [productId, status]
  );
  if (result.rowCount === 0) {
    throw notFoundError("product_not_found");
  }

  await writeAuditLog({
    actorUserId,
    targetType: "product",
    targetId: Number(productId),
    action: AUDIT_ACTIONS.PRODUCT_STATUS_UPDATE,
    detail: { status },
  });

  return result.rows[0];
}

module.exports = {
  mode: "pg",
  bulkUpdateProductStatus,
  bulkUpdateProducts,
  updateProduct,
  clearProductManualPrice,
  updateProductStatus,
};
