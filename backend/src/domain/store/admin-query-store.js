const { RECHARGE_ORDER_STATUS } = require("../recharge-order-status");
const { getStoreRuntime } = require("./core/runtime-context");
const usersStore = require("./users-store");
const {
  hydrateOrders,
  hydrateRechargeOrders,
  paginateItems,
  filterOrdersForAdmin,
  filterRechargeOrdersForAdmin,
  filterAuditLogsForAdmin,
  filterQuotaLogsForAdmin,
} = require("./shared-store-views");

function queryAdminProducts({
  keyword = "",
  status = "all",
  discount = "all",
  category = "all",
  subcategory = "all",
  detail = "all",
  fullness = "all",
  limit = 20,
  offset = 0,
} = {}) {
  const { readData, clone, buildAdminProductView, paginateItems, buildAdminProductQueryResult } =
    getStoreRuntime();
  const data = readData({ mutable: false });
  const products = (data.products || [])
    .map((product) => buildAdminProductView(data, product))
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  const result = buildAdminProductQueryResult(
    products,
    { keyword, status, discount, category, subcategory, detail, fullness },
    { bundleCount: (data.bundleSkus || []).length }
  );
  const paged = paginateItems(result.filtered, { limit, offset });
  return {
    items: clone(paged.items),
    total: paged.total,
    facets: clone(result.facets),
    summary: clone(result.summary),
    applied_filters: clone(result.appliedFilters),
  };
}

function queryAdminOrders({ userId = null, orderId = null, status = null, keyword = "", limit = 20, offset = 0 } = {}) {
  const { readData } = getStoreRuntime();
  const data = readData({ mutable: false });
  const orders = filterOrdersForAdmin(data, { userId, orderId, status, keyword });
  const paged = paginateItems(orders, { limit, offset });
  return {
    items: hydrateOrders(data, paged.items),
    total: paged.total,
  };
}

function queryAdminRechargeOrders({
  userId = null,
  rechargeOrderId = null,
  status = null,
  keyword = "",
  limit = 20,
  offset = 0,
} = {}) {
  const { readData } = getStoreRuntime();
  const data = readData({ mutable: false });
  const rechargeOrders = filterRechargeOrdersForAdmin(data, {
    userId,
    rechargeOrderId,
    status,
    keyword,
  });
  const paged = paginateItems(rechargeOrders, { limit, offset });
  return {
    items: hydrateRechargeOrders(data, paged.items),
    total: paged.total,
  };
}

function queryAdminBundles({ limit = 20, offset = 0 } = {}) {
  const { readData, clone } = getStoreRuntime();
  const data = readData({ mutable: false });
  const bundles = (data.bundleSkus || [])
    .slice()
    .sort(
      (a, b) =>
        Number(a.display_rank || 999) - Number(b.display_rank || 999) ||
        String(b.updated_at).localeCompare(String(a.updated_at))
    );
  const paged = paginateItems(bundles, { limit, offset });
  return {
    items: clone(paged.items),
    total: paged.total,
  };
}

function queryAdminUsers({ keyword = "", limit = 20, offset = 0 } = {}) {
  const { readData, clone } = getStoreRuntime();
  const data = readData({ mutable: false });
  let users = (data.users || [])
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  if (trimmedKeyword) {
    users = users.filter((user) =>
      [
        user.game_role_name,
        user.game_role_id,
        user.game_server,
        user.role,
        user.status,
        user.nickname,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword))
    );
  }

  const paged = paginateItems(users, { limit, offset });
  return {
    items: clone(paged.items.map((user) => usersStore.buildUserAdminView(user, data))),
    total: paged.total,
  };
}

function queryAdminAuditLogs({ keyword = "", action = "", limit = 20, offset = 0 } = {}) {
  const { readData, clone } = getStoreRuntime();
  const data = readData({ mutable: false });
  const logs = filterAuditLogsForAdmin(data, { keyword, action });
  const paged = paginateItems(logs, { limit, offset });
  return {
    items: clone(
      paged.items.map((log) => {
        const actor = (data.users || []).find((item) => item.id === log.actor_user_id);
        return {
          ...log,
          actor_role_name: actor?.game_role_name || null,
          actor_nickname: actor?.nickname || null,
        };
      })
    ),
    total: paged.total,
  };
}

function queryAdminQuotaLogs({ userId = null, keyword = "", type = "", limit = 20, offset = 0 } = {}) {
  const { readData, clone } = getStoreRuntime();
  const data = readData({ mutable: false });
  const logs = filterQuotaLogsForAdmin(data, { userId, keyword, type });
  const paged = paginateItems(logs, { limit, offset });
  return {
    items: clone(
      paged.items.map((log) => {
        const user = (data.users || []).find((item) => Number(item.id) === Number(log.user_id));
        return {
          ...log,
          game_role_id: user?.game_role_id || null,
          game_role_name: user?.game_role_name || null,
          game_server: user?.game_server || null,
        };
      })
    ),
    total: paged.total,
  };
}

function getAdminOverview() {
  const { readData, normalizeDiscountRate } = getStoreRuntime();
  const data = readData({ mutable: false });
  const products = data.products || [];
  const bundles = data.bundleSkus || [];
  const users = data.users || [];
  const orders = data.orders || [];
  const rechargeOrders = data.rechargeOrders || [];
  const totalQuota = (data.quotaAccounts || []).reduce(
    (sum, account) => sum + Number(account?.balance || 0),
    0
  );

  return {
    products: {
      total: products.length,
      on_sale: products.filter((item) => String(item?.status || "").trim() === "on_sale").length,
      discounted: products.filter((item) => normalizeDiscountRate(item?.discount_rate) < 100).length,
    },
    bundles: {
      total: bundles.length,
    },
    users: {
      total: users.length,
      active: users.filter((item) => String(item?.status || "").trim() === "active").length,
      total_quota: totalQuota,
    },
    alerts: {
      pending_orders: orders.filter((item) => String(item?.status || "").trim() === "pending").length,
      cancel_reviews: orders.filter((item) => String(item?.status || "").trim() === "cancel_requested").length,
      recharge_reviews: rechargeOrders.filter(
        (item) => String(item?.status || "").trim() === RECHARGE_ORDER_STATUS.PENDING_REVIEW
      ).length,
    },
  };
}

function listUsers() {
  return queryAdminUsers({ limit: null }).items;
}

function listAuditLogs({ keyword = "", action = "", limit = 200, offset = 0 } = {}) {
  return queryAdminAuditLogs({ keyword, action, limit, offset }).items;
}

function listQuotaLogs({ userId = null, keyword = "", type = "", limit = 200, offset = 0 } = {}) {
  return queryAdminQuotaLogs({ userId, keyword, type, limit, offset }).items;
}

module.exports = {
  queryAdminProducts,
  queryAdminOrders,
  queryAdminRechargeOrders,
  queryAdminBundles,
  queryAdminUsers,
  queryAdminAuditLogs,
  queryAdminQuotaLogs,
  getAdminOverview,
  listUsers,
  listAuditLogs,
  listQuotaLogs,
};
