const adminQueriesStore = require("../../domain/store/repositories/admin-queries-file-store");

async function listOrders({ userId, status, keyword, limit, offset }) {
  return adminQueriesStore.queryAdminOrders({
    userId,
    status,
    keyword,
    limit,
    offset,
  });
}

async function listProducts(filters = {}) {
  return adminQueriesStore.queryAdminProducts(filters);
}

async function listBundles({ limit, offset }) {
  return adminQueriesStore.queryAdminBundles({ limit, offset });
}

async function listUsers({ keyword, limit, offset }) {
  return adminQueriesStore.queryAdminUsers({ keyword, limit, offset });
}

async function listRechargeOrders({ userId, status, keyword, limit, offset }) {
  return adminQueriesStore.queryAdminRechargeOrders({
    userId,
    status,
    keyword,
    limit,
    offset,
  });
}

async function listQuotaLogs({ userId, keyword, type, limit, offset }) {
  return adminQueriesStore.queryAdminQuotaLogs({
    userId,
    keyword,
    type,
    limit,
    offset,
  });
}

async function listAuditLogs({ keyword, action, limit, offset }) {
  return adminQueriesStore.queryAdminAuditLogs({
    keyword,
    action,
    limit,
    offset,
  });
}

async function getOverview() {
  return adminQueriesStore.getAdminOverview();
}

module.exports = {
  mode: "file",
  listProducts,
  listBundles,
  listUsers,
  listOrders,
  listRechargeOrders,
  listQuotaLogs,
  listAuditLogs,
  getOverview,
};
