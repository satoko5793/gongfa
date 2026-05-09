const productsStore = require("../../domain/store/repositories/products-file-store");

async function recalculatePricing({ actorUserId, requestId = null }) {
  const products = productsStore.recalculatePricing(actorUserId, requestId);
  return { product_count: products.length };
}

module.exports = {
  mode: "file",
  recalculatePricing,
};
