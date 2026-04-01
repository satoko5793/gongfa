const { pool } = require("../../db/pool");
const { applyQuotaChange } = require("../../services/quota");
const { listOrders } = require("../../services/order-query");
const { writeAuditLog } = require("../../services/audit");
const { recalculateDatabasePricing } = require("../../services/pricing");

async function reviewRechargeOrder() {
  const err = new Error("recharge_order_not_supported_in_db_mode");
  err.statusCode = 501;
  throw err;
}

async function updateOrderStatus({
  orderId,
  status,
  remark,
  actorUserId,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query("SELECT * FROM orders WHERE id=$1 FOR UPDATE", [orderId]);
    if (orderResult.rowCount === 0) {
      await client.query("ROLLBACK");
      const err = new Error("order_not_found");
      err.statusCode = 404;
      throw err;
    }

    const order = orderResult.rows[0];
    if (order.status === "cancelled" && status !== "cancelled") {
      await client.query("ROLLBACK");
      const err = new Error("invalid_order_transition");
      err.statusCode = 400;
      throw err;
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
      [order.id, status, remark]
    );

    await recalculateDatabasePricing(client);

    await writeAuditLog(
      {
        actorUserId,
        targetType: "order",
        targetId: order.id,
        action: "order_status_update",
        detail: { from: order.status, to: status, remark },
      },
      client
    );

    await client.query("COMMIT");
    const [fullOrder] = await listOrders(pool, { orderId: order.id, limit: 1 });
    return fullOrder || null;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignore rollback errors after a failed transaction cleanup
    }
    throw error;
  } finally {
    client.release();
  }
}

async function updateOrderRemark({ orderId, remark, actorUserId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE orders
       SET remark=$2, updated_at=NOW()
       WHERE id=$1
       RETURNING id`,
      [orderId, remark]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      const err = new Error("order_not_found");
      err.statusCode = 404;
      throw err;
    }

    await writeAuditLog(
      {
        actorUserId,
        targetType: "order",
        targetId: Number(orderId),
        action: "order_remark_update",
        detail: { remark },
      },
      client
    );

    await client.query("COMMIT");
    const [fullOrder] = await listOrders(pool, { orderId, limit: 1 });
    return fullOrder || null;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignore rollback errors after a failed transaction cleanup
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  mode: "pg",
  reviewRechargeOrder,
  updateOrderStatus,
  updateOrderRemark,
};
