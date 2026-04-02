const devStore = require("../../services/dev-store");

function notFoundError(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

async function listBundles() {
  return devStore.listAdminBundles();
}

async function updateBundle({ bundleId, patch, actorUserId }) {
  const updated = devStore.updateBundleSku(bundleId, patch, actorUserId);
  if (!updated) {
    throw notFoundError("bundle_not_found");
  }
  return updated;
}

async function updateBundleStatus({ bundleId, status, actorUserId }) {
  const updated = devStore.updateBundleSkuStatus(bundleId, status, actorUserId);
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
