const { BUNDLE_SKU_SEEDS, RETIRED_BUNDLE_CODES } = require("../config/catalog-config");

async function ensureBundleSeeds(db) {
  const existingResult = await db.query("SELECT code FROM bundle_skus");
  const existingCodes = new Set(existingResult.rows.map((row) => row.code));
  let insertedCount = 0;

  for (const seed of BUNDLE_SKU_SEEDS) {
    if (existingCodes.has(seed.code)) continue;

    await db.query(
      `INSERT INTO bundle_skus
        (code, name, description, image_url, tags, price_quota, stock, status, display_rank, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        seed.code,
        seed.name,
        seed.description || null,
        seed.image_url || null,
        Array.isArray(seed.tags) ? seed.tags : [],
        Number(seed.price_quota) || 0,
        seed.stock === null || seed.stock === undefined ? null : Number(seed.stock),
        seed.status || "on_sale",
        Number(seed.display_rank) || 999,
      ]
    );
    insertedCount += 1;
  }

  for (const code of RETIRED_BUNDLE_CODES) {
    const retiredResult = await db.query("SELECT id FROM bundle_skus WHERE code=$1", [code]);
    if (retiredResult.rowCount === 0) continue;

    const bundleId = retiredResult.rows[0].id;
    const orderResult = await db.query(
      "SELECT 1 FROM order_items WHERE bundle_sku_id=$1 LIMIT 1",
      [bundleId]
    );

    if (orderResult.rowCount > 0) {
      await db.query(
        `UPDATE bundle_skus
         SET status='off_sale', updated_at=NOW()
         WHERE id=$1`,
        [bundleId]
      );
      continue;
    }

    await db.query("DELETE FROM bundle_skus WHERE id=$1", [bundleId]);
  }

  return insertedCount;
}

module.exports = {
  ensureBundleSeeds,
};
