const productsStore = require("../../domain/store/repositories/products-file-store");

function notFoundError(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

async function listBundles() {
  return productsStore.listAdminBundles();
}

async function updateBundle({ bundleId, patch, actorUserId }) {
  const updated = productsStore.updateBundleSku(bundleId, patch, actorUserId);
  if (!updated) {
    throw notFoundError("bundle_not_found");
  }
  return updated;
}

async function updateBundleStatus({ bundleId, status, actorUserId }) {
  const updated = productsStore.updateBundleSkuStatus(bundleId, status, actorUserId);
  if (!updated) {
    throw notFoundError("bundle_not_found");
  }
  return updated;
}

module.exports = {
  mode: "file",
  listBundles,
  updateBundle,
  updateBundleStatus,
};
