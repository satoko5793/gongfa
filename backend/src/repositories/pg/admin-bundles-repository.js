const { pool } = require("../../db/pool");
const { writeAuditLog } = require("../../services/audit");
const { ensureBundleSeeds } = require("../../services/bundle-catalog");

function notFoundError(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

async function listBundles() {
  await ensureBundleSeeds(pool);
  const result = await pool.query(
    `SELECT *
     FROM bundle_skus
     ORDER BY display_rank ASC, updated_at DESC`
  );
  return result.rows;
}

async function updateBundle({ bundleId, patch, actorUserId }) {
  await ensureBundleSeeds(pool);
  const result = await pool.query(
    `UPDATE bundle_skus
     SET
      name=COALESCE($2, name),
      description=COALESCE($3, description),
      image_url=COALESCE($4, image_url),
      tags=COALESCE($5, tags),
      price_quota=COALESCE($6, price_quota),
      stock=CASE WHEN $7::boolean THEN NULL ELSE COALESCE($8, stock) END,
      display_rank=COALESCE($9, display_rank),
      updated_at=NOW()
     WHERE id=$1
     RETURNING *`,
    [
      bundleId,
      patch.name ?? null,
      patch.description ?? null,
      patch.image_url ?? null,
      patch.tags ?? null,
      patch.price_quota ?? null,
      patch.stock === null,
      patch.stock ?? null,
      patch.display_rank ?? null,
    ]
  );

  if (result.rowCount === 0) {
    throw notFoundError("bundle_not_found");
  }

  await writeAuditLog({
    actorUserId,
    targetType: "product",
    targetId: Number(bundleId),
    action: "bundle_update",
    detail: patch,
  });

  return result.rows[0];
}

async function updateBundleStatus({ bundleId, status, actorUserId }) {
  await ensureBundleSeeds(pool);
  const result = await pool.query(
    `UPDATE bundle_skus
     SET status=$2, updated_at=NOW()
     WHERE id=$1
     RETURNING *`,
    [bundleId, status]
  );

  if (result.rowCount === 0) {
    throw notFoundError("bundle_not_found");
  }

  await writeAuditLog({
    actorUserId,
    targetType: "product",
    targetId: Number(bundleId),
    action: "bundle_status_update",
    detail: { status },
  });

  return result.rows[0];
}

module.exports = {
  mode: "pg",
  listBundles,
  updateBundle,
  updateBundleStatus,
};
