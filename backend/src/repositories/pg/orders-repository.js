const { pool } = require("../../db/pool");
const { ORDER_STATUS } = require("../../domain/order-status");
const { writeAuditLog } = require("../../services/audit");
const { ensureBundleSeeds } = require("../../services/bundle-catalog");
const { listOrders } = require("../../services/order-query");
const { recalculateDatabasePricing } = require("../../services/pricing");
const { applyQuotaChange } = require("../../services/quota");

function createUnsupportedError(errorCode) {
  const err = new Error(errorCode);
  err.statusCode = 501;
  return err;
}

async function createOrder({ userId, itemId, itemKind }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await ensureBundleSeeds(client);

    const userResult = await client.query("SELECT id, status FROM users WHERE id=$1 FOR UPDATE", [
      userId,
    ]);
    if (userResult.rowCount === 0) {
      const err = new Error("user_not_found");
      err.statusCode = 404;
      throw err;
    }
    if (userResult.rows[0].status !== "active") {
      const err = new Error("user_disabled");
      err.statusCode = 403;
      throw err;
    }

    let item = null;
    const isBundle = itemKind === "bundle";

    if (isBundle) {
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
        const err = new Error("bundle_not_found");
        err.statusCode = 404;
        throw err;
      }
      item = { ...bundleResult.rows[0], item_kind: "bundle" };
      if (item.status !== "on_sale") {
        const err = new Error("bundle_not_on_sale");
        err.statusCode = 400;
        throw err;
      }
      if (item.stock !== null && Number(item.stock) <= 0) {
        const err = new Error("bundle_out_of_stock");
        err.statusCode = 400;
        throw err;
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
        const err = new Error("product_not_found");
        err.statusCode = 404;
        throw err;
      }
      item = { ...productResult.rows[0], item_kind: "card" };
      if (item.status !== "on_sale") {
        const err = new Error("product_not_on_sale");
        err.statusCode = 400;
        throw err;
      }
      if (Number(item.stock) <= 0) {
        const err = new Error("product_out_of_stock");
        err.statusCode = 400;
        throw err;
      }
    }

    await applyQuotaChange(client, {
      userId,
      changeAmount: -Number(item.price_quota),
      type: "order_deduct",
      remark: `order create for ${itemKind} ${item.id}`,
    });

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_quota, status, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [userId, item.price_quota, ORDER_STATUS.PENDING]
    );
    const order = orderResult.rows[0];

    const snapshot =
      isBundle
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
        isBundle ? null : item.id,
        isBundle ? item.id : null,
        item.name,
        snapshot,
        item.price_quota,
      ]
    );

    if (isBundle) {
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
        actorUserId: userId,
        targetType: "order",
        targetId: order.id,
        action: "order_create",
        detail: { item_kind: itemKind, item_id: item.id, total_quota: item.price_quota },
      },
      client
    );

    await client.query("COMMIT");
    return (await listOrders(pool, { orderId: order.id, userId, limit: 1 }))[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function requestCancellation({ orderId, userId, remark }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderResult = await client.query(
      "SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE",
      [orderId, userId]
    );
    if (orderResult.rowCount === 0) {
      return null;
    }

    const order = orderResult.rows[0];
    if (order.status !== ORDER_STATUS.PENDING) {
      const err = new Error("order_cancel_request_not_allowed");
      err.statusCode = 400;
      throw err;
    }

    await client.query(
      `UPDATE orders
       SET status=$2, remark=$3, updated_at=NOW()
       WHERE id=$1`,
      [order.id, ORDER_STATUS.CANCEL_REQUESTED, remark || order.remark || null]
    );

    await writeAuditLog(
      {
        actorUserId: userId,
        targetType: "order",
        targetId: order.id,
        action: "order_cancel_request",
        detail: { remark: remark || null },
      },
      client
    );

    await client.query("COMMIT");
    return (await listOrders(pool, { orderId: order.id, userId, limit: 1 }))[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getOrderById({ orderId, userId }) {
  return (await listOrders(pool, { orderId, userId, limit: 1 }))[0] || null;
}

async function createGuestTransferOrder() {
  throw createUnsupportedError("guest_transfer_order_not_supported_in_db_mode");
}

async function createDrawServiceOrder() {
  throw createUnsupportedError("draw_service_not_supported_in_db_mode");
}

async function listAuctionBidSummariesForUser() {
  throw createUnsupportedError("auction_not_supported_in_db_mode");
}

async function placeAuctionBid() {
  throw createUnsupportedError("auction_not_supported_in_db_mode");
}

module.exports = {
  mode: "pg",
  createGuestTransferOrder,
  createOrder,
  createDrawServiceOrder,
  listAuctionBidSummariesForUser,
  placeAuctionBid,
  requestCancellation,
  getOrderById,
};
