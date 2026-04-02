const { getAdminBundlesRepository } = require("./repository");

async function listAdminBundles() {
  const repository = getAdminBundlesRepository();
  return await repository.listBundles();
}

async function updateBundle(actorUser, bundleId, patch = {}) {
  const repository = getAdminBundlesRepository();
  return await repository.updateBundle({
    bundleId,
    patch,
    actorUserId: actorUser.id,
  });
}

async function updateBundleStatus(actorUser, bundleId, status) {
  const repository = getAdminBundlesRepository();
  return await repository.updateBundleStatus({
    bundleId,
    status,
    actorUserId: actorUser.id,
  });
}

module.exports = {
  listAdminBundles,
  updateBundle,
  updateBundleStatus,
};
