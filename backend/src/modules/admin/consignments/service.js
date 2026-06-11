const helperStore = require("../../../domain/store/repositories/helper-file-store");

async function listAdminConsignments(query = {}) {
  return helperStore.listAdminConsignmentListings({
    status: query?.status || "all",
  });
}

async function reviewAdminConsignment(actorUser, listingId, payload) {
  return helperStore.reviewConsignmentListing(actorUser?.id, listingId, payload);
}

async function listAdminEscrowTrades(query = {}) {
  return helperStore.listAdminEscrowTrades({ status: query?.status || "all" });
}

async function listAdminPaymentReviews(query = {}) {
  return helperStore.listAdminPaymentReviews({
    status: query?.status || "all",
    method: query?.method || "all",
  });
}

async function reviewAdminEscrowPayment(actorUser, tradeId, payload) {
  return helperStore.reviewEscrowPayment(actorUser?.id, tradeId, payload);
}

async function resolveAdminEscrowTrade(actorUser, tradeId, payload) {
  return helperStore.resolveEscrowTrade(actorUser?.id, tradeId, payload);
}

async function markAdminEscrowSettlement(actorUser, tradeId, payload) {
  return helperStore.markEscrowSettlement(actorUser?.id, tradeId, payload);
}

module.exports = {
  listAdminConsignments,
  reviewAdminConsignment,
  listAdminEscrowTrades,
  listAdminPaymentReviews,
  reviewAdminEscrowPayment,
  resolveAdminEscrowTrade,
  markAdminEscrowSettlement,
};
