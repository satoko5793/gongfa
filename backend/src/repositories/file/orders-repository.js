const ordersStore = require("../../domain/store/repositories/orders-file-store");
const helperStore = require("../../domain/store/repositories/helper-file-store");

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

async function createDrawServiceOrder({
  userId,
  amountQuota,
  tierKey = null,
  drawAmountWan = null,
  transferAmount = null,
  paymentReference = null,
  payerNote = null,
  gameRoleId = null,
  gameRoleName = null,
  nickname = null,
}) {
  return ordersStore.createDrawServiceOrder(userId, {
    amountQuota,
    tierKey,
    drawAmountWan,
    transferAmount,
    paymentReference,
    payerNote,
    gameRoleId,
    gameRoleName,
    nickname,
  });
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

async function createConsignmentEscrowTrade({ userId, body }) {
  return helperStore.createEscrowTrade(userId, body);
}

async function listConsignmentEscrowTradesForUser({ userId }) {
  return helperStore.listEscrowTradesForUser(userId);
}

async function submitConsignmentEscrowDelivery({ userId, tradeId, body }) {
  return helperStore.submitEscrowDelivery(userId, tradeId, body);
}

async function addConsignmentEscrowEvidence({ userId, tradeId, file }) {
  return helperStore.addEscrowEvidence(userId, tradeId, file);
}

async function confirmConsignmentEscrowReceipt({ userId, tradeId }) {
  return helperStore.confirmEscrowReceipt(userId, tradeId);
}

async function disputeConsignmentEscrowTrade({ userId, tradeId, body }) {
  return helperStore.disputeEscrowTrade(userId, tradeId, body);
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
  createConsignmentEscrowTrade,
  listConsignmentEscrowTradesForUser,
  submitConsignmentEscrowDelivery,
  addConsignmentEscrowEvidence,
  confirmConsignmentEscrowReceipt,
  disputeConsignmentEscrowTrade,
};
