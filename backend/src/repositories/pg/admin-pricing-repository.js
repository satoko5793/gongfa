const { pool } = require("../../db/pool");
const { writeAuditLog } = require("../../services/audit");
const { recalculateDatabasePricing } = require("../../services/pricing");
const { AUDIT_ACTIONS } = require("../../domain/audit-actions");

async function recalculatePricing({ actorUserId, requestId = null }) {
  const pricedProducts = await recalculateDatabasePricing(pool);
  await writeAuditLog({
    actorUserId,
    targetType: "product",
    targetId: 0,
    action: AUDIT_ACTIONS.PRODUCT_PRICING_RECALCULATE,
    detail: { product_count: pricedProducts.length, request_id: requestId },
  });
  return { product_count: pricedProducts.length };
}

module.exports = {
  mode: "pg",
  recalculatePricing,
};
