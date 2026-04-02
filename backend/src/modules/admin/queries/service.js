const { getAdminQueriesRepository } = require("./repository");

function parsePagination(query, defaultPageSize = 20, maxPageSize = 100) {
  const page = Math.max(Number(query?.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query?.page_size) || defaultPageSize, 1), maxPageSize);
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

function buildPaginatedResponse(items, total, page, pageSize) {
  const normalizedTotal = Math.max(Number(total) || 0, 0);
  const totalPages = normalizedTotal > 0 ? Math.ceil(normalizedTotal / pageSize) : 0;
  return {
    items,
    total: normalizedTotal,
    page,
    page_size: pageSize,
    total_pages: totalPages,
    has_more: page < totalPages,
  };
}

function parseCommonListFilters(query) {
  return {
    userId: Number.isFinite(Number(query?.user_id)) ? Number(query.user_id) : null,
    status: String(query?.status || "").trim(),
    keyword: String(query?.keyword || "").trim(),
  };
}

async function listAdminOrders(query = {}) {
  const repository = getAdminQueriesRepository();
  const filters = parseCommonListFilters(query);
  const { page, pageSize, offset } = parsePagination(query, 20, 100);
  const result = await repository.listOrders({
    ...filters,
    limit: pageSize,
    offset,
  });
  return buildPaginatedResponse(result.items, result.total, page, pageSize);
}

async function listAdminProducts() {
  const repository = getAdminQueriesRepository();
  return await repository.listProducts();
}

async function listAdminUsers() {
  const repository = getAdminQueriesRepository();
  return await repository.listUsers();
}

async function listAdminRechargeOrders(query = {}) {
  const repository = getAdminQueriesRepository();
  const filters = parseCommonListFilters(query);
  const { page, pageSize, offset } = parsePagination(query, 20, 100);
  const result = await repository.listRechargeOrders({
    ...filters,
    limit: pageSize,
    offset,
  });
  return buildPaginatedResponse(result.items, result.total, page, pageSize);
}

async function listAdminQuotaLogs(query = {}) {
  const repository = getAdminQueriesRepository();
  const { page, pageSize, offset } = parsePagination(query, 20, 100);
  const result = await repository.listQuotaLogs({
    userId: Number.isFinite(Number(query?.user_id)) ? Number(query.user_id) : null,
    keyword: String(query?.keyword || "").trim(),
    type: String(query?.type || "").trim(),
    limit: pageSize,
    offset,
  });
  return buildPaginatedResponse(result.items, result.total, page, pageSize);
}

async function listAdminAuditLogs(query = {}) {
  const repository = getAdminQueriesRepository();
  const { page, pageSize, offset } = parsePagination(query, 20, 100);
  const result = await repository.listAuditLogs({
    keyword: String(query?.keyword || "").trim(),
    action: String(query?.action || "").trim(),
    limit: pageSize,
    offset,
  });
  return buildPaginatedResponse(result.items, result.total, page, pageSize);
}

module.exports = {
  listAdminProducts,
  listAdminUsers,
  listAdminOrders,
  listAdminRechargeOrders,
  listAdminQuotaLogs,
  listAdminAuditLogs,
};
