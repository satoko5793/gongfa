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

function parseAdminProductFilters(query = {}) {
  return {
    keyword: String(query?.keyword || "").trim(),
    status: String(query?.status || "all").trim() || "all",
    discount: String(query?.discount || "all").trim() || "all",
    category: String(query?.category || "all").trim() || "all",
    subcategory: String(query?.subcategory || "all").trim() || "all",
    detail: String(query?.detail || "all").trim() || "all",
    fullness: String(query?.fullness || "all").trim() || "all",
  };
}

async function listAdminProducts(query = {}) {
  const repository = getAdminQueriesRepository();
  const filters = parseAdminProductFilters(query);
  const { page, pageSize, offset } = parsePagination(query, 12, 100);
  const result = await repository.listProducts({
    ...filters,
    limit: pageSize,
    offset,
  });
  return {
    ...buildPaginatedResponse(result.items, result.total, page, pageSize),
    facets: result.facets || {
      categories: [],
      subcategories: [],
      details: [],
      fullness: [],
    },
    summary: result.summary || {
      filtered_total: Number(result.total || 0),
      discounted_total: 0,
    },
    applied_filters: result.applied_filters || filters,
  };
}

async function listAdminBundles(query = {}) {
  const repository = getAdminQueriesRepository();
  const { page, pageSize, offset } = parsePagination(query, 8, 100);
  const result = await repository.listBundles({
    limit: pageSize,
    offset,
  });
  return buildPaginatedResponse(result.items, result.total, page, pageSize);
}

async function listAdminUsers(query = {}) {
  const repository = getAdminQueriesRepository();
  const { page, pageSize, offset } = parsePagination(query, 10, 100);
  const result = await repository.listUsers({
    keyword: String(query?.keyword || "").trim(),
    limit: pageSize,
    offset,
  });
  return buildPaginatedResponse(result.items, result.total, page, pageSize);
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

async function getAdminOverview() {
  const repository = getAdminQueriesRepository();
  return await repository.getOverview();
}

module.exports = {
  listAdminProducts,
  listAdminBundles,
  listAdminUsers,
  listAdminOrders,
  listAdminRechargeOrders,
  listAdminQuotaLogs,
  listAdminAuditLogs,
  getAdminOverview,
};
