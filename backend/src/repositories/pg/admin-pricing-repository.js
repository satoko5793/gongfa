const { pool } = require("../../db/pool");
const { writeAuditLog } = require("../../services/audit");
const { recalculateDatabasePricing } = require("../../services/pricing");

async function recalculatePricing({ actorUserId }) {
  const pricedProducts = await recalculateDatabasePricing(pool);
  await writeAuditLog({
    actorUserId,
    targetType: "product",
    targetId: 0,
    action: "product_pricing_recalculate",
    detail: { product_count: pricedProducts.length },
  });
  return { product_count: pricedProducts.length };
}

module.exports = {
  mode: "pg",
  recalculatePricing,
};
