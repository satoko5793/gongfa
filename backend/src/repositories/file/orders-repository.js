const devStore = require("../../services/dev-store");

async function createGuestTransferOrder({ itemId, itemKind, body }) {
  return devStore.createGuestTransferOrder(itemId, itemKind, {
    gameRoleId: body.game_role_id,
    gameRoleName: body.game_role_name,
    nickname: body.nickname || null,
    amountYuan: Number(body.amount_yuan),
    transferAmount: body.transfer_amount === undefined ? null : Number(body.transfer_amount),
    paymentChannel: body.payment_channel || "alipay_qr",
    paymentReference: body.payment_reference,
    payerNote: body.payer_note || null,
  });
}

async function createOrder({ userId, itemId, itemKind }) {
  return devStore.createOrder(userId, itemId, itemKind);
}

async function createDrawServiceOrder({ userId, amountQuota }) {
  return devStore.createDrawServiceOrder(userId, { amountQuota });
}

async function listAuctionBidSummariesForUser({ userId }) {
  return devStore.listAuctionBidSummariesForUser(userId);
}

async function placeAuctionBid({ auctionId, userId, amountQuota }) {
  return devStore.placeAuctionBid(auctionId, userId, amountQuota);
}

async function requestCancellation({ orderId, userId, remark }) {
  return devStore.requestOrderCancellation(orderId, userId, remark);
}

async function getOrderById({ orderId, userId, role }) {
  return (
    devStore.listOrders({
      orderId,
      userId: role === "admin" ? null : userId,
      limit: 1,
    })[0] || null
  );
}

module.exports = {
  mode: "file",
  createGuestTransferOrder,
  createOrder,
  createDrawServiceOrder,
  listAuctionBidSummariesForUser,
  placeAuctionBid,
  requestCancellation,
  getOrderById,
};
