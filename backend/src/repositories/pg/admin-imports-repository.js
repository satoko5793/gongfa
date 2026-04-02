const { pool } = require("../../db/pool");
const { writeAuditLog } = require("../../services/audit");
const { recalculateDatabasePricing } = require("../../services/pricing");

async function importCards({ sourceType, sourceFileName, rawJson, importedBy, parsedProducts }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const importResult = await client.query(
      `INSERT INTO product_imports
        (source_type, source_file_name, raw_json, imported_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [sourceType, sourceFileName, rawJson, importedBy]
    );

    const importRow = importResult.rows[0];

    for (const product of parsedProducts) {
      await client.query(
        `INSERT INTO products
          (import_id, legacy_id, uid, name, image_url, schedule_id, current_schedule_id, is_current_season, season_tag, season_label, season_display, attack_value, hp_value, main_attrs, ext_attrs, stock, status, manual_price_quota, pricing_meta, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'on_sale', NULL, '{}'::jsonb, NOW(), NOW())
         ON CONFLICT (uid)
         DO UPDATE SET
          import_id=EXCLUDED.import_id,
          legacy_id=EXCLUDED.legacy_id,
          name=EXCLUDED.name,
          schedule_id=EXCLUDED.schedule_id,
          current_schedule_id=EXCLUDED.current_schedule_id,
          is_current_season=EXCLUDED.is_current_season,
          season_tag=EXCLUDED.season_tag,
          season_label=EXCLUDED.season_label,
          season_display=EXCLUDED.season_display,
          attack_value=EXCLUDED.attack_value,
          hp_value=EXCLUDED.hp_value,
          main_attrs=EXCLUDED.main_attrs,
          ext_attrs=EXCLUDED.ext_attrs,
          stock=EXCLUDED.stock,
          status='on_sale',
          pricing_meta='{}'::jsonb,
          image_url=COALESCE(products.image_url, EXCLUDED.image_url),
          updated_at=NOW()`,
        [
          importRow.id,
          product.legacy_id,
          product.uid,
          product.name,
          product.image_url,
          product.schedule_id,
          product.current_schedule_id,
          product.is_current_season,
          product.season_tag,
          product.season_label,
          product.season_display,
          product.attack_value,
          product.hp_value,
          product.main_attrs,
          product.ext_attrs,
          product.stock || 1,
        ]
      );
    }

    await recalculateDatabasePricing(client);

    await writeAuditLog(
      {
        actorUserId: importedBy,
        targetType: "import",
        targetId: importRow.id,
        action: "cards_import",
        detail: {
          source_type: importRow.source_type,
          source_file_name: importRow.source_file_name,
          parsed_count: parsedProducts.length,
        },
      },
      client
    );

    await client.query("COMMIT");
    return {
      import: importRow,
      parsed_count: parsedProducts.length,
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignore rollback cleanup errors
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  mode: "pg",
  importCards,
};
