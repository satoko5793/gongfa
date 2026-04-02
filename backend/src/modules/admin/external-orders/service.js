const { getAdminExternalOrdersRepository } = require("./repository");

async function createExternalOrder(actorUser, body = {}) {
  const repository = getAdminExternalOrdersRepository();
  return await repository.createExternalOrder({
    itemId: body.item_id ?? body.product_id,
    itemKind: body.item_kind || "card",
    buyerLabel: body.buyer_label,
    remark: body.remark || null,
    actorUserId: actorUser.id,
  });
}

module.exports = {
  createExternalOrder,
};
