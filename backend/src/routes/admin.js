const express = require("express");
const { pool } = require("../db/pool");
const { authRequired, adminOnly } = require("../middlewares/auth");
const { useFileStore } = require("../services/runtime");
const devStore = require("../services/dev-store");
const {
  validateImportInput,
  validateProductStatus,
  validateProductUpdate,
  validateBundleUpdate,
  validateQuotaChange,
  validateOrderStatus,
  validateRechargeReviewInput,
  validateRechargeConfigUpdateInput,
} = require("../services/validate");
const { parseLegacyProducts } = require("../services/legacy-parser");
const { applyQuotaChange, ensureQuotaAccount } = require("../services/quota");
const { listOrders, countOrders } = require("../services/order-query");
const { writeAuditLog } = require("../services/audit");
const { recalculateDatabasePricing } = require("../services/pricing");
const { ensureBundleSeeds } = require("../services/bundle-catalog");
const { getRechargeConfig } = require("../config/recharge-config");

const adminRouter = express.Router();
adminRouter.use(authRequired, adminOnly);

function unwrapRawJson(rawValue) {
  let value = rawValue;
  while (typeof value === "string") {
    value = JSON.parse(value);
  }
  return value;
}

function buildImportSummary(result) {
  const importRow = result?.import || {};
  return {
    import: {
      id: importRow.id || null,
      source_type: importRow.source_type || null,
      source_file_name: importRow.source_file_name || null,
      imported_by: importRow.imported_by || null,
      created_at: importRow.created_at || null,
    },
    parsed_count: Number(result?.parsed_count || 0),
  };
}

function parsePagination(query, defaultPageSize = 20, maxPageSize = 100) {
  const page = Math.max(Number(query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.page_size) || defaultPageSize, 1), maxPageSize);
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

function buildPaginatedResponse(items, total, page, pageSize) {
  const normalizedTotal = Math.max(Number(total) || 0, 0);
  const totalPages = normalizedTotal > 0 ? Math.ceil(normalizedTotal / pageSize) : 0;
  return {
    items,
    total: normalizedTotal,
    page,
    page_size: pageSize,
    total_pages: totalPages,
    has_more: page < totalPages,
  };
}

adminRouter.post("/imports/cards-json", async (req, res, next) => {
  if (useFileStore()) {
    try {
      const body = req.body || {};
      const errors = validateImportInput(body);
      if (errors.length) {
        return res.status(400).json({ error: "invalid_input", details: errors });
      }
      const rawJson = unwrapRawJson(body.raw_json);
      const parsedProducts = parseLegacyProducts(rawJson);
      if (parsedProducts.length === 0) {
        return res.status(400).json({ error: "legacy_cards_not_found" });
      }
      return res.json(
        buildImportSummary(
          devStore.importCards({
            sourceType: body.source_type || "upload",
            sourceFileName: body.source_file_name || null,
            rawJson,
            importedBy: req.user.id,
            parsedProducts,
          })
        )
      );
    } catch (error) {
      return next(error);
    }
  }
  const client = await pool.connect();
  try {
    const body = req.body || {};
    const errors = validateImportInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    const rawJson = unwrapRawJson(body.raw_json);
    const parsedProducts = parseLegacyProducts(rawJson);
    if (parsedProducts.length === 0) {
      return res.status(400).json({ error: "legacy_cards_not_found" });
    }

    await client.query("BEGIN");

    const importResult = await client.query(
      `INSERT INTO product_imports
        (source_type, source_file_name, raw_json, imported_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        body.source_type || "upload",
        body.source_file_name || null,
        rawJson,
        req.user.id,
      ]
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
        actorUserId: req.user.id,
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
    return res.json(
      buildImportSummary({
        import: importRow,
        parsed_count: parsedProducts.length,
      })
    );
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

adminRouter.get("/products", async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(devStore.listAdminProducts());
    }
    const result = await pool.query(
      `SELECT
        p.*,
        i.source_type,
        i.source_file_name,
        i.created_at AS imported_at
       FROM products p
       LEFT JOIN product_imports i ON i.id=p.import_id
       ORDER BY p.updated_at DESC, p.id DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/products/bulk-status", async (req, res, next) => {
  try {
    const { product_ids: productIds, status } = req.body || {};
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "product_ids_required" });
    }
    if (!validateProductStatus(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }

    const normalizedIds = [...new Set(productIds.map((item) => Number(item)).filter(Boolean))];
    if (normalizedIds.length === 0) {
      return res.status(400).json({ error: "product_ids_required" });
    }

    if (useFileStore()) {
      return res.json(devStore.bulkUpdateProductStatus(normalizedIds, status, req.user.id));
    }

    const result = await pool.query(
      `UPDATE products
       SET status=$2, updated_at=NOW()
       WHERE id = ANY($1::int[])
       RETURNING id`,
      [normalizedIds, status]
    );

    await writeAuditLog({
      actorUserId: req.user.id,
      targetType: "product",
      targetId: normalizedIds[0],
      action: "product_bulk_status_update",
      detail: { product_ids: normalizedIds, status, updated_count: result.rowCount },
    });

    return res.json({ updated_count: result.rowCount, status });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/products/bulk-update", async (req, res, next) => {
  try {
    const { product_ids: productIds, ...body } = req.body || {};
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "product_ids_required" });
    }

    const patch = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.image_url !== undefined) patch.image_url = body.image_url;
    if (body.attack_value !== undefined) patch.attack_value = body.attack_value;
    if (body.hp_value !== undefined) patch.hp_value = body.hp_value;
    if (body.main_attrs !== undefined) patch.main_attrs = body.main_attrs;
    if (body.ext_attrs !== undefined) patch.ext_attrs = body.ext_attrs;
    if (body.price_quota !== undefined) patch.price_quota = body.price_quota;
    if (body.stock !== undefined) patch.stock = body.stock;

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "patch_required" });
    }

    const errors = validateProductUpdate(patch);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    const normalizedIds = [...new Set(productIds.map((item) => Number(item)).filter(Boolean))];
    if (normalizedIds.length === 0) {
      return res.status(400).json({ error: "product_ids_required" });
    }

    if (useFileStore()) {
      return res.json(devStore.bulkUpdateProducts(normalizedIds, patch, req.user.id));
    }

    const manualPrice =
      Object.prototype.hasOwnProperty.call(patch, "price_quota") ? patch.price_quota : undefined;
    if (Object.prototype.hasOwnProperty.call(patch, "price_quota")) {
      delete patch.price_quota;
    }

    const fields = [];
    const values = [normalizedIds];
    let index = 2;

    for (const [key, value] of Object.entries(patch)) {
      fields.push(`${key}=$${index}`);
      values.push(value);
      index += 1;
    }

    fields.push(`updated_at=NOW()`);

    if (manualPrice !== undefined) {
      fields.push(`manual_price_quota=$${index}`);
      values.push(manualPrice);
      index += 1;
    }

    const result = await pool.query(
      `UPDATE products
       SET ${fields.join(", ")}
       WHERE id = ANY($1::int[])
       RETURNING id`,
      values
    );

    await writeAuditLog({
      actorUserId: req.user.id,
       targetType: "product",
       targetId: normalizedIds[0],
       action: "product_bulk_update",
      detail: {
        product_ids: normalizedIds,
        patch: {
          ...patch,
          ...(manualPrice !== undefined ? { manual_price_quota: manualPrice } : {}),
        },
        updated_count: result.rowCount,
      },
    });

    await recalculateDatabasePricing(pool);

    return res.json({
      updated_count: result.rowCount,
      patch: {
        ...patch,
        ...(manualPrice !== undefined ? { manual_price_quota: manualPrice } : {}),
      },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/products/:id", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateProductUpdate(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      const updated = devStore.updateProduct(
        req.params.id,
        {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.image_url !== undefined ? { image_url: body.image_url } : {}),
          ...(body.attack_value !== undefined ? { attack_value: body.attack_value } : {}),
          ...(body.hp_value !== undefined ? { hp_value: body.hp_value } : {}),
          ...(body.main_attrs !== undefined ? { main_attrs: body.main_attrs } : {}),
          ...(body.ext_attrs !== undefined ? { ext_attrs: body.ext_attrs } : {}),
          ...(body.price_quota !== undefined ? { price_quota: body.price_quota } : {}),
          ...(body.stock !== undefined ? { stock: body.stock } : {}),
        },
        req.user.id
      );
      if (!updated) {
        return res.status(404).json({ error: "product_not_found" });
      }
      return res.json(updated);
    }

    const manualPrice =
      Object.prototype.hasOwnProperty.call(body, "price_quota") ? body.price_quota : undefined;

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
        stock=COALESCE($9, stock),
        updated_at=NOW()
       WHERE id=$1
       RETURNING *`,
      [
        req.params.id,
        body.name ?? null,
        body.image_url ?? null,
        body.attack_value ?? null,
        body.hp_value ?? null,
        body.main_attrs ?? null,
        body.ext_attrs ?? null,
        manualPrice ?? null,
        body.stock ?? null,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "product_not_found" });
    }

    await writeAuditLog({
      actorUserId: req.user.id,
      targetType: "product",
      targetId: Number(req.params.id),
      action: "product_update",
      detail: {
        ...body,
        ...(manualPrice !== undefined ? { manual_price_quota: manualPrice } : {}),
      },
    });

    await recalculateDatabasePricing(pool);
    const refreshed = await pool.query("SELECT * FROM products WHERE id=$1", [req.params.id]);
    return res.json(refreshed.rows[0]);
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/products/:id/manual-price", async (req, res, next) => {
  try {
    if (useFileStore()) {
      const updated = devStore.clearProductManualPrice(req.params.id, req.user.id);
      if (!updated) {
        return res.status(404).json({ error: "product_not_found" });
      }
      return res.json(updated);
    }

    const result = await pool.query(
      `UPDATE products
       SET manual_price_quota=NULL, updated_at=NOW()
       WHERE id=$1
       RETURNING id`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "product_not_found" });
    }

    await writeAuditLog({
      actorUserId: req.user.id,
      targetType: "product",
      targetId: Number(req.params.id),
      action: "product_manual_price_clear",
      detail: null,
    });

    await recalculateDatabasePricing(pool);
    const refreshed = await pool.query("SELECT * FROM products WHERE id=$1", [req.params.id]);
    return res.json(refreshed.rows[0]);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/products/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!validateProductStatus(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }

    if (useFileStore()) {
      const updated = devStore.updateProductStatus(req.params.id, status, req.user.id);
      if (!updated) {
        return res.status(404).json({ error: "product_not_found" });
      }
      return res.json(updated);
    }

    const result = await pool.query(
      "UPDATE products SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *",
      [req.params.id, status]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "product_not_found" });
    }

    await writeAuditLog({
      actorUserId: req.user.id,
      targetType: "product",
      targetId: Number(req.params.id),
      action: "product_status_update",
      detail: { status },
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/bundles", async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(devStore.listAdminBundles());
    }
    await ensureBundleSeeds(pool);
    const result = await pool.query(
      `SELECT *
       FROM bundle_skus
       ORDER BY display_rank ASC, updated_at DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/bundles/:id", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateBundleUpdate(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      const updated = devStore.updateBundleSku(req.params.id, body, req.user.id);
      if (!updated) {
        return res.status(404).json({ error: "bundle_not_found" });
      }
      return res.json(updated);
    }
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
        req.params.id,
        body.name ?? null,
        body.description ?? null,
        body.image_url ?? null,
        body.tags ?? null,
        body.price_quota ?? null,
        body.stock === null,
        body.stock ?? null,
        body.display_rank ?? null,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "bundle_not_found" });
    }

    await writeAuditLog({
      actorUserId: req.user.id,
      targetType: "product",
      targetId: Number(req.params.id),
      action: "bundle_update",
      detail: body,
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/bundles/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["on_sale", "off_sale", "sold"].includes(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }

    if (useFileStore()) {
      const updated = devStore.updateBundleSkuStatus(req.params.id, status, req.user.id);
      if (!updated) {
        return res.status(404).json({ error: "bundle_not_found" });
      }
      return res.json(updated);
    }
    await ensureBundleSeeds(pool);

    const result = await pool.query(
      `UPDATE bundle_skus
       SET status=$2, updated_at=NOW()
       WHERE id=$1
       RETURNING *`,
      [req.params.id, status]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "bundle_not_found" });
    }

    await writeAuditLog({
      actorUserId: req.user.id,
      targetType: "product",
      targetId: Number(req.params.id),
      action: "bundle_status_update",
      detail: { status },
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(devStore.listUsers());
    }
    const result = await pool.query(
      `SELECT
        u.id,
        u.role,
        u.status,
        u.game_role_id,
        u.game_server,
        u.game_role_name,
        u.bind_token_id,
        u.nickname,
        u.created_at,
        u.updated_at,
        COALESCE(q.balance, 0) AS quota_balance
       FROM users u
       LEFT JOIN user_quota_accounts q ON q.user_id=u.id
       ORDER BY u.created_at DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/users/:id/quota", async (req, res, next) => {
  if (useFileStore()) {
    try {
      const body = req.body || {};
      const errors = validateQuotaChange(body);
      if (errors.length) {
        return res.status(400).json({ error: "invalid_input", details: errors });
      }
      const result = devStore.changeUserQuota(
        req.params.id,
        body.change_amount,
        body.remark || null,
        req.user.id
      );
      if (!result) {
        return res.status(404).json({ error: "user_not_found" });
      }
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }
  const client = await pool.connect();
  try {
    const body = req.body || {};
    const errors = validateQuotaChange(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    await client.query("BEGIN");

    const userResult = await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
      req.params.id,
    ]);
    if (userResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "user_not_found" });
    }

    await ensureQuotaAccount(client, req.params.id);
    const nextBalance = await applyQuotaChange(client, {
      userId: Number(req.params.id),
      changeAmount: body.change_amount,
      type: body.change_amount > 0 ? "admin_add" : "admin_subtract",
      remark: body.remark || null,
    });

    await writeAuditLog(
      {
        actorUserId: req.user.id,
        targetType: "user",
        targetId: Number(req.params.id),
        action: "user_quota_change",
        detail: { change_amount: body.change_amount, next_balance: nextBalance },
      },
      client
    );

    await client.query("COMMIT");
    return res.json({ user_id: Number(req.params.id), balance: nextBalance });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

adminRouter.patch("/users/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }

    if (useFileStore()) {
      const updated = devStore.updateUserStatus(req.params.id, status, req.user.id);
      if (!updated) {
        return res.status(404).json({ error: "user_not_found" });
      }
      return res.json(updated);
    }

    const result = await pool.query(
      "UPDATE users SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *",
      [req.params.id, status]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "user_not_found" });
    }

    await writeAuditLog({
      actorUserId: req.user.id,
      targetType: "user",
      targetId: Number(req.params.id),
      action: "user_status_update",
      detail: { status },
    });

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/orders", async (req, res, next) => {
  try {
    const userId = Number.isFinite(Number(req.query.user_id)) ? Number(req.query.user_id) : null;
    const status = String(req.query.status || "").trim();
    const keyword = String(req.query.keyword || "").trim();
    const { page, pageSize, offset } = parsePagination(req.query, 20, 100);

    if (useFileStore()) {
      const allOrders = devStore.listOrders({
        userId,
        status,
        keyword,
        limit: null,
      });
      const items = allOrders.slice(offset, offset + pageSize);
      return res.json(buildPaginatedResponse(items, allOrders.length, page, pageSize));
    }
    const total = await countOrders(pool, { userId, status, keyword });
    const orders = await listOrders(pool, { userId, status, keyword, limit: pageSize, offset });
    return res.json(buildPaginatedResponse(orders, total, page, pageSize));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/recharge-config", async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(getRechargeConfig(devStore.getRechargeConfig()));
    }
    return res.json(getRechargeConfig());
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/recharge-config", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateRechargeConfigUpdateInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      const nextConfig = devStore.updateRechargeConfig(
        {
          enabled: body.enabled,
          exchange_yuan: body.exchange_yuan,
          exchange_quota: body.exchange_quota,
          min_amount_yuan: body.min_amount_yuan,
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
        },
        req.user.id
      );
      return res.json(nextConfig);
    }

    return res.status(501).json({ error: "recharge_config_not_supported_in_db_mode" });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/recharge-orders", async (req, res, next) => {
  try {
    const userId = Number.isFinite(Number(req.query.user_id)) ? Number(req.query.user_id) : null;
    const status = String(req.query.status || "").trim();
    const keyword = String(req.query.keyword || "").trim();
    const { page, pageSize, offset } = parsePagination(req.query, 20, 100);

    if (useFileStore()) {
      const allOrders = devStore.listRechargeOrders({
        userId,
        status,
        keyword,
        limit: null,
      });
      const items = allOrders.slice(offset, offset + pageSize);
      return res.json(buildPaginatedResponse(items, allOrders.length, page, pageSize));
    }

    return res.status(501).json({ error: "recharge_order_not_supported_in_db_mode" });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/recharge-orders/:id/review", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateRechargeReviewInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      const updated = devStore.reviewRechargeOrder(
        req.params.id,
        {
          status: body.status,
          adminRemark: body.admin_remark || null,
        },
        req.user.id
      );
      if (!updated) {
        return res.status(404).json({ error: "recharge_order_not_found" });
      }
      return res.json(updated);
    }

    return res.status(501).json({ error: "recharge_order_not_supported_in_db_mode" });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/quota-logs", async (req, res, next) => {
  try {
    const userId = Number.isFinite(Number(req.query.user_id)) ? Number(req.query.user_id) : null;
    const keyword = String(req.query.keyword || "").trim();
    const type = String(req.query.type || "").trim();
    const { page, pageSize, offset } = parsePagination(req.query, 20, 100);

    if (useFileStore()) {
      const allLogs = devStore.listQuotaLogs({
        userId,
        keyword,
        type,
        limit: null,
      });
      const items = allLogs.slice(offset, offset + pageSize);
      return res.json(buildPaginatedResponse(items, allLogs.length, page, pageSize));
    }

    const values = [];
    const filters = [];

    if (userId) {
      values.push(userId);
      filters.push(`q.user_id=$${values.length}`);
    }

    if (type && type !== "all") {
      values.push(type);
      filters.push(`q.type=$${values.length}`);
    }

    if (keyword) {
      values.push(`%${keyword}%`);
      filters.push(
        `(u.game_role_id ILIKE $${values.length} OR u.game_role_name ILIKE $${values.length} OR u.game_server ILIKE $${values.length} OR COALESCE(q.remark, '') ILIKE $${values.length} OR CAST(COALESCE(q.order_id, 0) AS TEXT) ILIKE $${values.length})`
      );
    }

    const countValues = values.slice();

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM quota_logs q
       LEFT JOIN users u ON u.id=q.user_id
       ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}`,
      countValues
    );

    values.push(pageSize);
    values.push(offset);

    const result = await pool.query(
      `SELECT
        q.*,
        u.game_role_id,
        u.game_role_name,
        u.game_server
       FROM quota_logs q
       LEFT JOIN users u ON u.id=q.user_id
       ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
       ORDER BY q.created_at DESC
       LIMIT $${values.length - 1}
       OFFSET $${values.length}`,
      values
    );

    return res.json(
      buildPaginatedResponse(result.rows, Number(countResult.rows[0]?.total || 0), page, pageSize)
    );
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/pricing/recalculate", async (req, res, next) => {
  try {
    if (useFileStore()) {
      const products = devStore.recalculatePricing(req.user.id);
      return res.json({ product_count: products.length });
    }

    const pricedProducts = await recalculateDatabasePricing(pool);
    await writeAuditLog({
      actorUserId: req.user.id,
      targetType: "product",
      targetId: 0,
      action: "product_pricing_recalculate",
      detail: { product_count: pricedProducts.length },
    });
    return res.json({ product_count: pricedProducts.length });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/orders/:id/status", async (req, res, next) => {
  if (useFileStore()) {
    try {
      const { status, remark } = req.body || {};
      if (!validateOrderStatus(status)) {
        return res.status(400).json({ error: "status_invalid" });
      }
      const updated = devStore.updateOrderStatus(
        req.params.id,
        status,
        remark || null,
        req.user.id
      );
      if (!updated) {
        return res.status(404).json({ error: "order_not_found" });
      }
      return res.json(updated);
    } catch (error) {
      return next(error);
    }
  }
  const client = await pool.connect();
  try {
    const { status, remark } = req.body || {};
    if (!validateOrderStatus(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }

    await client.query("BEGIN");

    const orderResult = await client.query("SELECT * FROM orders WHERE id=$1 FOR UPDATE", [
      req.params.id,
    ]);
    if (orderResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "order_not_found" });
    }

    const order = orderResult.rows[0];
    if (order.status === "cancelled" && status !== "cancelled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "invalid_order_transition" });
    }

    if (status === "cancelled" && order.status !== "cancelled") {
      const itemsResult = await client.query(
        "SELECT item_kind, product_id, bundle_sku_id FROM order_items WHERE order_id=$1",
        [order.id]
      );

      for (const item of itemsResult.rows) {
        if (item.item_kind === "bundle") {
          await client.query(
            `UPDATE bundle_skus
             SET
              stock=CASE WHEN stock IS NULL THEN NULL ELSE stock+1 END,
              status=CASE WHEN status='sold' THEN 'on_sale' ELSE status END,
              updated_at=NOW()
             WHERE id=$1`,
            [item.bundle_sku_id]
          );
          continue;
        }

        await client.query(
          `UPDATE products
           SET
            stock=stock+1,
            status=CASE WHEN status='sold' THEN 'on_sale' ELSE status END,
            updated_at=NOW()
           WHERE id=$1`,
          [item.product_id]
        );
      }

      await applyQuotaChange(client, {
        userId: order.user_id,
        changeAmount: Number(order.total_quota),
        type: "order_refund",
        orderId: order.id,
        remark: remark || "admin cancel order",
      });
    }

    await client.query(
      `UPDATE orders
       SET status=$2, remark=$3, updated_at=NOW()
       WHERE id=$1`,
      [order.id, status, remark || null]
    );

    await recalculateDatabasePricing(client);

    await writeAuditLog(
      {
        actorUserId: req.user.id,
        targetType: "order",
        targetId: order.id,
        action: "order_status_update",
        detail: { from: order.status, to: status, remark: remark || null },
      },
      client
    );

    await client.query("COMMIT");
    const [fullOrder] = await listOrders(pool, { orderId: order.id, limit: 1 });
    return res.json(fullOrder || null);
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

adminRouter.patch("/orders/:id/remark", async (req, res, next) => {
  if (useFileStore()) {
    try {
      const { remark } = req.body || {};
      if (remark !== undefined && remark !== null && typeof remark !== "string") {
        return res.status(400).json({ error: "remark_invalid" });
      }
      const updated = devStore.updateOrderRemark(req.params.id, remark || null, req.user.id);
      if (!updated) {
        return res.status(404).json({ error: "order_not_found" });
      }
      return res.json(updated);
    } catch (error) {
      return next(error);
    }
  }

  const client = await pool.connect();
  try {
    const { remark } = req.body || {};
    if (remark !== undefined && remark !== null && typeof remark !== "string") {
      return res.status(400).json({ error: "remark_invalid" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE orders
       SET remark=$2, updated_at=NOW()
       WHERE id=$1
       RETURNING id`,
      [req.params.id, remark || null]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "order_not_found" });
    }

    await writeAuditLog(
      {
        actorUserId: req.user.id,
        targetType: "order",
        targetId: Number(req.params.id),
        action: "order_remark_update",
        detail: { remark: remark || null },
      },
      client
    );

    await client.query("COMMIT");
    const [fullOrder] = await listOrders(pool, { orderId: req.params.id, limit: 1 });
    return res.json(fullOrder || null);
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

adminRouter.get("/audit-logs", async (req, res, next) => {
  try {
    const keyword = String(req.query.keyword || "").trim();
    const action = String(req.query.action || "").trim();
    const { page, pageSize, offset } = parsePagination(req.query, 20, 100);
    if (useFileStore()) {
      const allLogs = devStore.listAuditLogs({ keyword, action, limit: null });
      const items = allLogs.slice(offset, offset + pageSize);
      return res.json(buildPaginatedResponse(items, allLogs.length, page, pageSize));
    }

    const values = [];
    const filters = [];

    if (action && action !== "all") {
      values.push(action);
      filters.push(`a.action=$${values.length}`);
    }

    if (keyword) {
      values.push(`%${keyword}%`);
      filters.push(
        `(a.action ILIKE $${values.length} OR a.target_type ILIKE $${values.length} OR CAST(a.target_id AS TEXT) ILIKE $${values.length} OR COALESCE(u.game_role_name, '') ILIKE $${values.length} OR COALESCE(u.nickname, '') ILIKE $${values.length} OR CAST(COALESCE(a.detail, '{}'::jsonb) AS TEXT) ILIKE $${values.length})`
      );
    }

    const countValues = values.slice();

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM audit_logs a
       LEFT JOIN users u ON u.id=a.actor_user_id
       ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}`,
      countValues
    );

    values.push(pageSize);
    values.push(offset);

    const result = await pool.query(
      `SELECT
        a.*,
        u.game_role_name AS actor_role_name,
        u.nickname AS actor_nickname
       FROM audit_logs a
       LEFT JOIN users u ON u.id=a.actor_user_id
       ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
       ORDER BY a.created_at DESC
       LIMIT $${values.length - 1}
       OFFSET $${values.length}`,
      values
    );
    return res.json(
      buildPaginatedResponse(result.rows, Number(countResult.rows[0]?.total || 0), page, pageSize)
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = { adminRouter };
