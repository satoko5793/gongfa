const ordersStore = require("../orders-store");
const auctionsStore = require("../auctions-store");

function listRechargeOrders(filters) {
  return ordersStore.listRechargeOrders(filters);
}

function createRechargeOrder(userId, payload) {
  return ordersStore.createRechargeOrder(userId, payload);
}

function reviewRechargeOrder(rechargeOrderId, input, actorUserId) {
  return ordersStore.reviewRechargeOrder(rechargeOrderId, input, actorUserId);
}

function updateOrderStatus(orderId, status, remark, actorUserId, extra = {}) {
  return ordersStore.updateOrderStatus(orderId, status, remark, actorUserId, extra);
}

function updateOrderRemark(orderId, remark, actorUserId) {
  return ordersStore.updateOrderRemark(orderId, remark, actorUserId);
}

function createGuestTransferOrder(itemId, itemKind, payload) {
  return ordersStore.createGuestTransferOrder(itemId, itemKind, payload);
}

function createOrder(userId, itemId, itemKind, payload) {
  return ordersStore.createOrder(userId, itemId, itemKind, payload);
}

function createDrawServiceOrder(userId, payload) {
  return ordersStore.createDrawServiceOrder(userId, payload);
}

function listAuctionBidSummariesForUser(userId) {
  return auctionsStore.listAuctionBidSummariesForUser(userId);
}

function placeAuctionBid(auctionId, userId, amountQuota) {
  return auctionsStore.placeAuctionBid(auctionId, userId, amountQuota);
}

function requestOrderCancellation(orderId, userId, remark) {
  return ordersStore.requestOrderCancellation(orderId, userId, remark);
}

function listOrders(filters) {
  return ordersStore.listOrders(filters);
}

function createExternalOrder(itemId, itemKind, payload, actorUserId) {
  return ordersStore.createExternalOrder(itemId, itemKind, payload, actorUserId);
}

module.exports = {
  listRechargeOrders,
  createRechargeOrder,
  reviewRechargeOrder,
  updateOrderStatus,
  updateOrderRemark,
  createGuestTransferOrder,
  createOrder,
  createDrawServiceOrder,
  listAuctionBidSummariesForUser,
  placeAuctionBid,
  requestOrderCancellation,
  listOrders,
  createExternalOrder,
};
