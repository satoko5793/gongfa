const devStore = require("../../services/dev-store");

function paginate(items, limit, offset) {
  const normalizedOffset = Math.max(Number(offset) || 0, 0);
  const normalizedLimit = Math.max(Number(limit) || 0, 0);
  return items.slice(normalizedOffset, normalizedOffset + normalizedLimit);
}

async function listOrders({ userId, status, keyword, limit, offset }) {
  const allOrders = devStore.listOrders({
    userId,
    status,
    keyword,
    limit: null,
  });
  return {
    items: paginate(allOrders, limit, offset),
    total: allOrders.length,
  };
}

async function listProducts() {
  return devStore.listAdminProducts();
}

async function listUsers() {
  return devStore.listUsers();
}

async function listRechargeOrders({ userId, status, keyword, limit, offset }) {
  const allOrders = devStore.listRechargeOrders({
    userId,
    status,
    keyword,
    limit: null,
  });
  return {
    items: paginate(allOrders, limit, offset),
    total: allOrders.length,
  };
}

async function listQuotaLogs({ userId, keyword, type, limit, offset }) {
  const allLogs = devStore.listQuotaLogs({
    userId,
    keyword,
    type,
    limit: null,
  });
  return {
    items: paginate(allLogs, limit, offset),
    total: allLogs.length,
  };
}

async function listAuditLogs({ keyword, action, limit, offset }) {
  const allLogs = devStore.listAuditLogs({
    keyword,
    action,
    limit: null,
  });
  return {
    items: paginate(allLogs, limit, offset),
    total: allLogs.length,
  };
}

module.exports = {
  mode: "file",
  listProducts,
  listUsers,
  listOrders,
  listRechargeOrders,
  listQuotaLogs,
  listAuditLogs,
};
