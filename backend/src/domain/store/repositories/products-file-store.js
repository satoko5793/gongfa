const { getStoreRuntime } = require("../core/runtime-context");

function getAction(name) {
  return getStoreRuntime().actions[name];
}

function listPublicProducts(filters = {}) {
  return getAction("listProducts")(filters);
}

function getPublicProductById(productId, options = {}) {
  return getAction("getProductById")(productId, options);
}

function listPublicRecentOrders(limit = 32) {
  return getAction("listOrders")({ status: "confirmed", limit });
}

function listPublicAuctions(status = "all") {
  return getAction("listAuctions")({ status, publicView: true });
}

function listAdminBundles() {
  return getAction("listAdminBundles")();
}

function updateBundleSku(bundleId, patch, actorUserId) {
  return getAction("updateBundleSku")(bundleId, patch, actorUserId);
}

function updateBundleSkuStatus(bundleId, status, actorUserId) {
  return getAction("updateBundleSkuStatus")(bundleId, status, actorUserId);
}

function bulkUpdateProductStatus(productIds, status, actorUserId, requestId = null) {
  return getAction("bulkUpdateProductStatus")(productIds, status, actorUserId, requestId);
}

function bulkUpdateProducts(productIds, patch, actorUserId, requestId = null) {
  return getAction("bulkUpdateProducts")(productIds, patch, actorUserId, requestId);
}

function updateProduct(productId, patch, actorUserId) {
  return getAction("updateProduct")(productId, patch, actorUserId);
}

function clearProductManualPrice(productId, actorUserId) {
  return getAction("clearProductManualPrice")(productId, actorUserId);
}

function updateProductStatus(productId, status, actorUserId) {
  return getAction("updateProductStatus")(productId, status, actorUserId);
}

function importCards(payload) {
  return getAction("importCards")(payload);
}

function recalculatePricing(actorUserId, requestId = null) {
  return getAction("recalculatePricing")(actorUserId, requestId);
}

module.exports = {
  listPublicProducts,
  getPublicProductById,
  listPublicRecentOrders,
  listPublicAuctions,
  listAdminBundles,
  updateBundleSku,
  updateBundleSkuStatus,
  bulkUpdateProductStatus,
  bulkUpdateProducts,
  updateProduct,
  clearProductManualPrice,
  updateProductStatus,
  importCards,
  recalculatePricing,
};
