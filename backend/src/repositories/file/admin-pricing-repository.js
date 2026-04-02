const devStore = require("../../services/dev-store");

async function recalculatePricing({ actorUserId }) {
  const products = devStore.recalculatePricing(actorUserId);
  return { product_count: products.length };
}

module.exports = {
  mode: "file",
  recalculatePricing,
};
