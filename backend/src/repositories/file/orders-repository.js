const ordersStore = require("../../domain/store/repositories/orders-file-store");

async function createGuestTransferOrder({ userId, itemId, itemKind, body }) {
  return ordersStore.createGuestTransferOrder(itemId, itemKind, {
    userId,
    gameRoleId: body.game_role_id,
    gameRoleName: body.game_role_name,
    nickname: body.nickname || null,
    amountYuan: Number(body.amount_yuan),
    transferAmount: body.transfer_amount === undefined ? null : Number(body.transfer_amount),
    paymentChannel: body.payment_channel || "alipay_qr",
    paymentReference: body.payment_reference,
    payerNote: body.payer_note || null,
    bundleSelection: body.bundle_selection || null,
  });
}

async function createOrder({ userId, itemId, itemKind, remark, bundleSelection = null }) {
  return ordersStore.createOrder(userId, itemId, itemKind, { remark, bundleSelection });
}

async function createDrawServiceOrder({ userId, amountQuota }) {
  return ordersStore.createDrawServiceOrder(userId, { amountQuota });
}

async function listAuctionBidSummariesForUser({ userId }) {
  return ordersStore.listAuctionBidSummariesForUser(userId);
}

async function placeAuctionBid({ auctionId, userId, amountQuota }) {
  return ordersStore.placeAuctionBid(auctionId, userId, amountQuota);
}

async function requestCancellation({ orderId, userId, remark }) {
  return ordersStore.requestOrderCancellation(orderId, userId, remark);
}

async function getOrderById({ orderId, userId, role }) {
  return (
    ordersStore.listOrders({
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
