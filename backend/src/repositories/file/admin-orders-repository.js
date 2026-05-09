const ordersStore = require("../../domain/store/repositories/orders-file-store");

async function reviewRechargeOrder({ rechargeOrderId, status, adminRemark, actorUserId }) {
  const updated = ordersStore.reviewRechargeOrder(
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
  requestId = null,
  returnedCardsText,
  bestGoldCard,
}) {
  const updated = ordersStore.updateOrderStatus(orderId, status, remark, actorUserId, {
    requestId,
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
  const updated = ordersStore.updateOrderRemark(orderId, remark, actorUserId);
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
