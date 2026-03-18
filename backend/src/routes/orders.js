const express = require("express");
const { pool } = require("../db/pool");
const { authRequired } = require("../middlewares/auth");
const { useFileStore } = require("../services/runtime");
const devStore = require("../services/dev-store");
const { validateOrderCreate, validateDrawOrderCreate } = require("../services/validate");
const { listOrders } = require("../services/order-query");
const { applyQuotaChange } = require("../services/quota");
const { canAccessOrder } = require("../services/authz");
const { writeAuditLog } = require("../services/audit");
const { recalculateDatabasePricing } = require("../services/pricing");
const { ensureBundleSeeds } = require("../services/bundle-catalog");

const ordersRouter = express.Router();
ordersRouter.use(authRequired);

ordersRouter.post("/", async (req, res, next) => {
  if (useFileStore()) {
    try {
      const body = req.body || {};
      const errors = validateOrderCreate(body);
      if (errors.length) {
        return res.status(400).json({ error: "invalid_input", details: errors });
      }
      return res.json(
        devStore.createOrder(req.user.id, body.item_id ?? body.product_id, body.item_kind || "card")
      );
    } catch (error) {
      return next(error);
    }
  }
  const client = await pool.connect();
  try {
    const body = req.body || {};
    const errors = validateOrderCreate(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    const itemKind = body.item_kind || "card";
    const itemId = body.item_id ?? body.product_id;

    await client.query("BEGIN");
    await ensureBundleSeeds(client);

    const userResult = await client.query(
      "SELECT id, status FROM users WHERE id=$1 FOR UPDATE",
      [req.user.id]
    );
    if (userResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "user_not_found" });
    }
    if (userResult.rows[0].status !== "active") {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "user_disabled" });
    }

    let item = null;

    if (itemKind === "bundle") {
      const bundleResult = await client.query(
        `SELECT
          id,
          code,
          name,
          description,
          image_url,
          tags,
          price_quota,
          stock,
          status
         FROM bundle_skus
         WHERE id=$1
         FOR UPDATE`,
        [itemId]
      );
      if (bundleResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "bundle_not_found" });
      }
      item = { ...bundleResult.rows[0], item_kind: "bundle" };
      if (item.status !== "on_sale") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "bundle_not_on_sale" });
      }
      if (item.stock !== null && Number(item.stock) <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "bundle_out_of_stock" });
      }
    } else {
      const productResult = await client.query(
        `SELECT
          id,
          legacy_id,
          uid,
          name,
          image_url,
          attack_value,
          hp_value,
          main_attrs,
          ext_attrs,
          price_quota,
          stock,
          status
         FROM products
         WHERE id=$1
         FOR UPDATE`,
        [itemId]
      );
      if (productResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "product_not_found" });
      }
      item = { ...productResult.rows[0], item_kind: "card" };
      if (item.status !== "on_sale") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "product_not_on_sale" });
      }
      if (Number(item.stock) <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "product_out_of_stock" });
      }
    }

    await applyQuotaChange(client, {
      userId: req.user.id,
      changeAmount: -Number(item.price_quota),
      type: "order_deduct",
      remark: `order create for ${itemKind} ${item.id}`,
    });

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_quota, status, created_at, updated_at)
       VALUES ($1, $2, 'pending', NOW(), NOW())
       RETURNING *`,
      [req.user.id, item.price_quota]
    );
    const order = orderResult.rows[0];

    const snapshot =
      itemKind === "bundle"
        ? {
            code: item.code,
            name: item.name,
            description: item.description,
            image_url: item.image_url,
            tags: item.tags,
          }
        : {
            legacy_id: item.legacy_id,
            uid: item.uid,
            name: item.name,
            image_url: item.image_url,
            attack_value: item.attack_value,
            hp_value: item.hp_value,
            main_attrs: item.main_attrs,
            ext_attrs: item.ext_attrs,
          };

    await client.query(
      `INSERT INTO order_items
        (order_id, item_kind, product_id, bundle_sku_id, product_name, product_snapshot, price_quota, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        order.id,
        itemKind,
        itemKind === "card" ? item.id : null,
        itemKind === "bundle" ? item.id : null,
        item.name,
        snapshot,
        item.price_quota,
      ]
    );

    if (itemKind === "bundle") {
      if (item.stock !== null) {
        await client.query(
          `UPDATE bundle_skus
           SET
            stock=stock-1,
            status=CASE WHEN stock-1 <= 0 THEN 'sold' ELSE status END,
            updated_at=NOW()
           WHERE id=$1`,
          [item.id]
        );
      }
    } else {
      await client.query(
        `UPDATE products
         SET
          stock=stock-1,
          status=CASE WHEN stock-1 <= 0 THEN 'sold' ELSE status END,
          updated_at=NOW()
         WHERE id=$1`,
        [item.id]
      );
    }

    await recalculateDatabasePricing(client);

    await writeAuditLog(
      {
        actorUserId: req.user.id,
        targetType: "order",
        targetId: order.id,
        action: "order_create",
        detail: { item_kind: itemKind, item_id: item.id, total_quota: item.price_quota },
      },
      client
    );

    await client.query("COMMIT");

    const [fullOrder] = await listOrders(pool, {
      orderId: order.id,
      userId: req.user.id,
      limit: 1,
    });
    return res.json(fullOrder);
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

ordersRouter.post("/draw-service", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateDrawOrderCreate(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      return res.json(
        devStore.createDrawServiceOrder(req.user.id, {
          amountQuota: Number(body.amount_quota),
        })
      );
    }

    return res.status(501).json({ error: "draw_service_not_supported_in_db_mode" });
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/:id/cancel-request", async (req, res, next) => {
  if (useFileStore()) {
    try {
      const body = req.body || {};
      if (body.remark !== undefined && body.remark !== null && typeof body.remark !== "string") {
        return res.status(400).json({ error: "remark_invalid" });
      }
      const order = devStore.requestOrderCancellation(req.params.id, req.user.id, body.remark || null);
      if (!order) {
        return res.status(404).json({ error: "order_not_found" });
      }
      return res.json(order);
    } catch (error) {
      return next(error);
    }
  }

  const client = await pool.connect();
  try {
    const body = req.body || {};
    if (body.remark !== undefined && body.remark !== null && typeof body.remark !== "string") {
      return res.status(400).json({ error: "remark_invalid" });
    }

    const allowed = await canAccessOrder(req.user, req.params.id);
    if (!allowed) {
      return res.status(403).json({ error: "forbidden" });
    }

    await client.query("BEGIN");
    const orderResult = await client.query(
      "SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE",
      [req.params.id, req.user.id]
    );
    if (orderResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "order_not_found" });
    }

    const order = orderResult.rows[0];
    if (order.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "order_cancel_request_not_allowed" });
    }

    await client.query(
      `UPDATE orders
       SET status='cancel_requested', remark=$2, updated_at=NOW()
       WHERE id=$1`,
      [order.id, body.remark || order.remark || null]
    );

    await writeAuditLog(
      {
        actorUserId: req.user.id,
        targetType: "order",
        targetId: order.id,
        action: "order_cancel_request",
        detail: { remark: body.remark || null },
      },
      client
    );

    await client.query("COMMIT");
    const [fullOrder] = await listOrders(pool, {
      orderId: order.id,
      userId: req.user.id,
      limit: 1,
    });
    return res.json(fullOrder);
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

ordersRouter.get("/:id", async (req, res, next) => {
  try {
    if (useFileStore()) {
      const order = devStore.listOrders({
        orderId: req.params.id,
        userId: req.user.role === "admin" ? null : req.user.id,
        limit: 1,
      })[0];
      if (!order) {
        return res.status(404).json({ error: "order_not_found" });
      }
      return res.json(order);
    }
    const allowed = await canAccessOrder(req.user, req.params.id);
    if (!allowed) {
      return res.status(403).json({ error: "forbidden" });
    }

    const orders = await listOrders(pool, {
      orderId: req.params.id,
      userId: req.user.role === "admin" ? null : req.user.id,
      limit: 1,
    });

    if (orders.length === 0) {
      return res.status(404).json({ error: "order_not_found" });
    }

    return res.json(orders[0]);
  } catch (error) {
    return next(error);
  }
});

module.exports = { ordersRouter };
