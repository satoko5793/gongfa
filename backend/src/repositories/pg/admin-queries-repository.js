const { pool } = require("../../db/pool");
const { listOrders, countOrders } = require("../../services/order-query");
const { buildAdminProductQueryResult, normalizeDiscountRate } = require("../../modules/admin/queries/product-filters");
const { RECHARGE_ORDER_STATUS } = require("../../domain/recharge-order-status");

function paginateRows(items, limit, offset) {
  const normalizedOffset = Math.max(Number(offset) || 0, 0);
  if (limit === null || limit === undefined) {
    return {
      items: items.slice(normalizedOffset),
      total: items.length,
    };
  }
  const normalizedLimit = Math.max(Number(limit) || 0, 0);
  return {
    items: items.slice(normalizedOffset, normalizedOffset + normalizedLimit),
    total: items.length,
  };
}

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
  return result.rows.map((product) => {
    const manualPriceQuota =
      product?.manual_price_quota === null || product?.manual_price_quota === undefined
        ? null
        : Number(product.manual_price_quota);
    const basePriceQuota = Number.isInteger(manualPriceQuota)
      ? manualPriceQuota
      : Number(product.price_quota || 0);
    const discountRate = normalizeDiscountRate(product.discount_rate);
    const effectivePriceQuota =
      discountRate >= 100
        ? basePriceQuota
        : Math.max(1, Math.round((basePriceQuota * discountRate) / 100));
    return {
      ...product,
      discount_rate: discountRate,
      effective_price_quota: effectivePriceQuota,
      discount_saved_quota: Math.max(0, basePriceQuota - effectivePriceQuota),
      is_discounted: discountRate < 100 && effectivePriceQuota < basePriceQuota,
      auction_id: null,
      auction_status: null,
      auction_ends_at: null,
      auction_current_price_quota: null,
    };
  });
}

async function listProductsQuery({
  keyword = "",
  status = "all",
  discount = "all",
  category = "all",
  subcategory = "all",
  detail = "all",
  fullness = "all",
  limit,
  offset,
}) {
  const [products, bundleCountResult] = await Promise.all([
    listProducts(),
    pool.query(`SELECT COUNT(*)::int AS total FROM bundle_skus`),
  ]);
  const queryResult = buildAdminProductQueryResult(
    products,
    { keyword, status, discount, category, subcategory, detail, fullness },
    { bundleCount: Number(bundleCountResult.rows[0]?.total || 0) }
  );
  const paged = paginateRows(queryResult.filtered, limit, offset);
  return {
    items: paged.items,
    total: paged.total,
    facets: queryResult.facets,
    summary: queryResult.summary,
    applied_filters: queryResult.appliedFilters,
  };
}

async function listBundles({ limit, offset }) {
  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM bundle_skus`);
  const result = await pool.query(
    `SELECT *
     FROM bundle_skus
     ORDER BY display_rank ASC, updated_at DESC
     LIMIT $1
     OFFSET $2`,
    [limit, offset]
  );
  return {
    items: result.rows,
    total: Number(countResult.rows[0]?.total || 0),
  };
}

async function listUsers({ keyword = "", limit, offset }) {
  const values = [];
  const filters = [];

  if (keyword) {
    values.push(`%${keyword}%`);
    filters.push(
      `(u.game_role_name ILIKE $${values.length} OR u.game_role_id ILIKE $${values.length} OR u.game_server ILIKE $${values.length} OR u.role ILIKE $${values.length} OR u.status ILIKE $${values.length} OR COALESCE(u.nickname, '') ILIKE $${values.length})`
    );
  }

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM users u
     ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}`,
    values.slice()
  );

  values.push(limit);
  values.push(offset);
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
     ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
     ORDER BY u.created_at DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );
  return {
    items: result.rows,
    total: Number(countResult.rows[0]?.total || 0),
  };
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

async function getOverview() {
  const [
    productsCount,
    onSaleCount,
    discountedCount,
    bundleCount,
    userStats,
    orderStats,
    rechargeStats,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM products`),
    pool.query(`SELECT COUNT(*)::int AS total FROM products WHERE status='on_sale'`),
    pool.query(`SELECT COUNT(*)::int AS total FROM products WHERE COALESCE(discount_rate, 100) < 100`),
    pool.query(`SELECT COUNT(*)::int AS total FROM bundle_skus`),
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status='active')::int AS active,
         COALESCE((SELECT SUM(balance) FROM user_quota_accounts), 0)::bigint AS total_quota
       FROM users`
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status='pending')::int AS pending_orders,
         COUNT(*) FILTER (WHERE status='cancel_requested')::int AS cancel_reviews
       FROM orders`
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE status='${RECHARGE_ORDER_STATUS.PENDING_REVIEW}')::int AS recharge_reviews
       FROM recharge_orders`
    ),
  ]);

  return {
    products: {
      total: Number(productsCount.rows[0]?.total || 0),
      on_sale: Number(onSaleCount.rows[0]?.total || 0),
      discounted: Number(discountedCount.rows[0]?.total || 0),
    },
    bundles: {
      total: Number(bundleCount.rows[0]?.total || 0),
    },
    users: {
      total: Number(userStats.rows[0]?.total || 0),
      active: Number(userStats.rows[0]?.active || 0),
      total_quota: Number(userStats.rows[0]?.total_quota || 0),
    },
    alerts: {
      pending_orders: Number(orderStats.rows[0]?.pending_orders || 0),
      cancel_reviews: Number(orderStats.rows[0]?.cancel_reviews || 0),
      recharge_reviews: Number(rechargeStats.rows[0]?.recharge_reviews || 0),
    },
  };
}

module.exports = {
  mode: "pg",
  listProducts: listProductsQuery,
  listBundles,
  listUsers,
  listOrders: listOrdersQuery,
  listRechargeOrders,
  listQuotaLogs,
  listAuditLogs,
  getOverview,
};
