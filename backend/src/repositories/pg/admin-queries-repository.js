const { pool } = require("../../db/pool");
const { listOrders, countOrders } = require("../../services/order-query");

function buildQuotaLogFilters({ userId = null, keyword = "", type = "" } = {}) {
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

  return { values, filters };
}

async function listOrdersQuery({ userId, status, keyword, limit, offset }) {
  const total = await countOrders(pool, { userId, status, keyword });
  const items = await listOrders(pool, { userId, status, keyword, limit, offset });
  return { items, total };
}

async function listProducts() {
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
  return result.rows;
}

async function listUsers() {
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
  return result.rows;
}

async function listRechargeOrders() {
  const err = new Error("recharge_order_not_supported_in_db_mode");
  err.statusCode = 501;
  throw err;
}

async function listQuotaLogs({ userId, keyword, type, limit, offset }) {
  const { values, filters } = buildQuotaLogFilters({ userId, keyword, type });
  const countValues = values.slice();
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM quota_logs q
     LEFT JOIN users u ON u.id=q.user_id
     ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}`,
    countValues
  );

  values.push(limit);
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

  return {
    items: result.rows,
    total: Number(countResult.rows[0]?.total || 0),
  };
}

async function listAuditLogs({ keyword, action, limit, offset }) {
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

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM audit_logs a
     LEFT JOIN users u ON u.id=a.actor_user_id
     ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}`,
    values.slice()
  );

  values.push(limit);
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

  return {
    items: result.rows,
    total: Number(countResult.rows[0]?.total || 0),
  };
}

module.exports = {
  mode: "pg",
  listProducts,
  listUsers,
  listOrders: listOrdersQuery,
  listRechargeOrders,
  listQuotaLogs,
  listAuditLogs,
};
