const devStore = require("../../services/dev-store");

function notFoundError(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

async function bulkUpdateProductStatus({ productIds, status, actorUserId }) {
  return devStore.bulkUpdateProductStatus(productIds, status, actorUserId);
}

async function bulkUpdateProducts({ productIds, patch, actorUserId }) {
  return devStore.bulkUpdateProducts(productIds, patch, actorUserId);
}

async function updateProduct({ productId, patch, actorUserId }) {
  const updated = devStore.updateProduct(productId, patch, actorUserId);
  if (!updated) {
    throw notFoundError("product_not_found");
  }
  return updated;
}

async function clearProductManualPrice({ productId, actorUserId }) {
  const updated = devStore.clearProductManualPrice(productId, actorUserId);
  if (!updated) {
    throw notFoundError("product_not_found");
  }
  return updated;
}

async function updateProductStatus({ productId, status, actorUserId }) {
  const updated = devStore.updateProductStatus(productId, status, actorUserId);
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
