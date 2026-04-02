const { getAdminCatalogRepository } = require("./repository");

function buildProductPatch(body = {}) {
  return {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.image_url !== undefined ? { image_url: body.image_url } : {}),
    ...(body.attack_value !== undefined ? { attack_value: body.attack_value } : {}),
    ...(body.hp_value !== undefined ? { hp_value: body.hp_value } : {}),
    ...(body.main_attrs !== undefined ? { main_attrs: body.main_attrs } : {}),
    ...(body.ext_attrs !== undefined ? { ext_attrs: body.ext_attrs } : {}),
    ...(body.price_quota !== undefined ? { price_quota: body.price_quota } : {}),
    ...(body.discount_rate !== undefined ? { discount_rate: body.discount_rate } : {}),
    ...(body.stock !== undefined ? { stock: body.stock } : {}),
  };
}

function normalizeProductIds(productIds = []) {
  return [...new Set(productIds.map((item) => Number(item)).filter(Boolean))];
}

async function bulkUpdateProductStatus(actorUser, productIds, status) {
  const repository = getAdminCatalogRepository();
  return await repository.bulkUpdateProductStatus({
    productIds: normalizeProductIds(productIds),
    status,
    actorUserId: actorUser.id,
  });
}

async function bulkUpdateProducts(actorUser, productIds, body = {}) {
  const repository = getAdminCatalogRepository();
  return await repository.bulkUpdateProducts({
    productIds: normalizeProductIds(productIds),
    patch: buildProductPatch(body),
    actorUserId: actorUser.id,
  });
}

async function updateProduct(actorUser, productId, body = {}) {
  const repository = getAdminCatalogRepository();
  return await repository.updateProduct({
    productId,
    patch: buildProductPatch(body),
    actorUserId: actorUser.id,
  });
}

async function clearProductManualPrice(actorUser, productId) {
  const repository = getAdminCatalogRepository();
  return await repository.clearProductManualPrice({
    productId,
    actorUserId: actorUser.id,
  });
}

async function updateProductStatus(actorUser, productId, status) {
  const repository = getAdminCatalogRepository();
  return await repository.updateProductStatus({
    productId,
    status,
    actorUserId: actorUser.id,
  });
}

module.exports = {
  buildProductPatch,
  normalizeProductIds,
  bulkUpdateProductStatus,
  bulkUpdateProducts,
  updateProduct,
  clearProductManualPrice,
  updateProductStatus,
};
