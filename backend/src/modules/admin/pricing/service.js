const { getAdminPricingRepository } = require("./repository");

async function recalculatePricing(actorUser) {
  const repository = getAdminPricingRepository();
  return await repository.recalculatePricing({
    actorUserId: actorUser.id,
  });
}

module.exports = {
  recalculatePricing,
};
