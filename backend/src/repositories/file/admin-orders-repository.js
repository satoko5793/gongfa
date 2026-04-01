const devStore = require("../../services/dev-store");

async function reviewRechargeOrder({ rechargeOrderId, status, adminRemark, actorUserId }) {
  const updated = devStore.reviewRechargeOrder(
    rechargeOrderId,
    {
      status,
      adminRemark,
    },
    actorUserId
  );
  if (!updated) {
    const err = new Error("recharge_order_not_found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

async function updateOrderStatus({
  orderId,
  status,
  remark,
  actorUserId,
  returnedCardsText,
  bestGoldCard,
}) {
  const updated = devStore.updateOrderStatus(orderId, status, remark, actorUserId, {
    returnedCardsText,
    bestGoldCard,
  });
  if (!updated) {
    const err = new Error("order_not_found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

async function updateOrderRemark({ orderId, remark, actorUserId }) {
  const updated = devStore.updateOrderRemark(orderId, remark, actorUserId);
  if (!updated) {
    const err = new Error("order_not_found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

module.exports = {
  mode: "file",
  reviewRechargeOrder,
  updateOrderStatus,
  updateOrderRemark,
};
