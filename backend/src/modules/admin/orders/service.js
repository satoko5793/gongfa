const { getAdminOrdersRepository } = require("./repository");

async function reviewRechargeOrder(actorUser, rechargeOrderId, body) {
  const repository = getAdminOrdersRepository();
  return await repository.reviewRechargeOrder({
    rechargeOrderId,
    status: body.status,
    adminRemark: body.admin_remark || null,
    actorUserId: actorUser.id,
  });
}

async function updateOrderStatus(actorUser, orderId, body) {
  const repository = getAdminOrdersRepository();
  return await repository.updateOrderStatus({
    orderId,
    status: body.status,
    remark: body.remark || null,
    actorUserId: actorUser.id,
    returnedCardsText: body.returned_cards_text || null,
    bestGoldCard: body.best_gold_card || null,
  });
}

async function updateOrderRemark(actorUser, orderId, body) {
  const repository = getAdminOrdersRepository();
  return await repository.updateOrderRemark({
    orderId,
    remark: body.remark || null,
    actorUserId: actorUser.id,
  });
}

module.exports = {
  reviewRechargeOrder,
  updateOrderStatus,
  updateOrderRemark,
};
