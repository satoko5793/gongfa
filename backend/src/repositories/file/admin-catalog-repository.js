const productsStore = require("../../domain/store/repositories/products-file-store");

function notFoundError(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

async function bulkUpdateProductStatus({ productIds, status, actorUserId, requestId = null }) {
  return productsStore.bulkUpdateProductStatus(productIds, status, actorUserId, requestId);
}

async function bulkUpdateProducts({ productIds, patch, actorUserId, requestId = null }) {
  return productsStore.bulkUpdateProducts(productIds, patch, actorUserId, requestId);
}

async function updateProduct({ productId, patch, actorUserId }) {
  const updated = productsStore.updateProduct(productId, patch, actorUserId);
  if (!updated) {
    throw notFoundError("product_not_found");
  }
  return updated;
}

async function clearProductManualPrice({ productId, actorUserId }) {
  const updated = productsStore.clearProductManualPrice(productId, actorUserId);
  if (!updated) {
    throw notFoundError("product_not_found");
  }
  return updated;
}

async function updateProductStatus({ productId, status, actorUserId }) {
  const updated = productsStore.updateProductStatus(productId, status, actorUserId);
  if (!updated) {
    throw notFoundError("product_not_found");
  }
  return updated;
}

module.exports = {
  mode: "file",
  bulkUpdateProductStatus,
  bulkUpdateProducts,
  updateProduct,
  clearProductManualPrice,
  updateProductStatus,
};
