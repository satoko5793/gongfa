const { pool } = require("../db/pool");

function buildOrderFilters({ orderId = null, userId = null, status = null, keyword = "" } = {}) {
  const where = [];
  const values = [];

  if (orderId !== null) {
    values.push(orderId);
    where.push(`o.id=$${values.length}`);
  }

  if (userId !== null) {
    values.push(userId);
    where.push(`o.user_id=$${values.length}`);
  }

  if (status !== null && status !== undefined && status !== "" && status !== "all") {
    values.push(status);
    where.push(`o.status=$${values.length}`);
  }

  const trimmedKeyword = String(keyword || "").trim();
  if (trimmedKeyword) {
    values.push(`%${trimmedKeyword}%`);
    const keywordRef = `$${values.length}`;
    where.push(`(
      CAST(o.id AS TEXT) ILIKE ${keywordRef}
      OR u.game_role_id ILIKE ${keywordRef}
      OR u.game_server ILIKE ${keywordRef}
      OR u.game_role_name ILIKE ${keywordRef}
      OR COALESCE(u.nickname, '') ILIKE ${keywordRef}
      OR EXISTS (
        SELECT 1
        FROM order_items oi
        WHERE oi.order_id=o.id
          AND (
            oi.product_name ILIKE ${keywordRef}
            OR CAST(oi.product_id AS TEXT) ILIKE ${keywordRef}
            OR CAST(oi.bundle_sku_id AS TEXT) ILIKE ${keywordRef}
            OR oi.item_kind ILIKE ${keywordRef}
          )
      )
    )`);
  }

  return { where, values };
}

async function listOrders(
  db = pool,
  { orderId = null, userId = null, status = null, keyword = "", limit = 100, offset = 0 } = {}
) {
  const { where, values } = buildOrderFilters({ orderId, userId, status, keyword });

  values.push(limit);
  values.push(Math.max(Number(offset) || 0, 0));

  const result = await db.query(
    `SELECT
      o.*,
      u.game_role_id,
      u.game_server,
      u.game_role_name,
      u.nickname
     FROM orders o
     JOIN users u ON u.id=o.user_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY o.created_at DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  if (result.rowCount === 0) return [];

  const orderIds = result.rows.map((row) => row.id);
  const itemsResult = await db.query(
    `SELECT id, order_id, item_kind, product_id, bundle_sku_id, product_name, product_snapshot, price_quota, created_at
     FROM order_items
     WHERE order_id = ANY($1::int[])
     ORDER BY id ASC`,
    [orderIds]
  );

  const itemsByOrderId = new Map();
  for (const item of itemsResult.rows) {
    const list = itemsByOrderId.get(item.order_id) || [];
    list.push(item);
    itemsByOrderId.set(item.order_id, list);
  }

  return result.rows.map((row) => ({
    ...row,
    items: itemsByOrderId.get(row.id) || [],
  }));
}

async function countOrders(db = pool, filters = {}) {
  const { where, values } = buildOrderFilters(filters);
  const result = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM orders o
     JOIN users u ON u.id=o.user_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`,
    values
  );
  return Number(result.rows[0]?.total || 0);
}

module.exports = { buildOrderFilters, listOrders, countOrders };
