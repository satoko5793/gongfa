const adminQueryStore = require("../admin-query-store");

function queryAdminOrders(filters) {
  return adminQueryStore.queryAdminOrders(filters);
}

function queryAdminProducts(filters) {
  return adminQueryStore.queryAdminProducts(filters);
}

function queryAdminBundles(filters) {
  return adminQueryStore.queryAdminBundles(filters);
}

function queryAdminUsers(filters) {
  return adminQueryStore.queryAdminUsers(filters);
}

function queryAdminRechargeOrders(filters) {
  return adminQueryStore.queryAdminRechargeOrders(filters);
}

function queryAdminQuotaLogs(filters) {
  return adminQueryStore.queryAdminQuotaLogs(filters);
}

function queryAdminAuditLogs(filters) {
  return adminQueryStore.queryAdminAuditLogs(filters);
}

function getAdminOverview() {
  return adminQueryStore.getAdminOverview();
}

module.exports = {
  queryAdminOrders,
  queryAdminProducts,
  queryAdminBundles,
  queryAdminUsers,
  queryAdminRechargeOrders,
  queryAdminQuotaLogs,
  queryAdminAuditLogs,
  getAdminOverview,
};
