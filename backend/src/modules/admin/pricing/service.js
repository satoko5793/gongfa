const { getAdminPricingRepository } = require("./repository");

async function recalculatePricing(actorUser, requestId = null) {
  const repository = getAdminPricingRepository();
  return await repository.recalculatePricing({
    actorUserId: actorUser.id,
    requestId,
  });
}

module.exports = {
  recalculatePricing,
};
