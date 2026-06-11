const helperStore = require("../helper-store");

function getHelperSnapshotLimitForUser(userId) {
  return helperStore.getHelperSnapshotLimitForUser(userId);
}

function listHelperBindings(userId) {
  return helperStore.listHelperBindings(userId);
}

function resolveHelperBinding(userId, criteria = {}) {
  return helperStore.resolveHelperBinding(userId, criteria);
}

function upsertHelperBinding(userId, payload) {
  return helperStore.upsertHelperBinding(userId, payload);
}

function removeHelperBinding(userId, bindingId) {
  return helperStore.removeHelperBinding(userId, bindingId);
}

function listHelperSnapshots(userId) {
  return helperStore.listHelperSnapshots(userId);
}

function listHelperInventories(userId) {
  return helperStore.listHelperInventories(userId);
}

function listHelperInventorySummary(userId) {
  return helperStore.listHelperInventorySummary(userId);
}

function listHelperInventoryItems(userId, options) {
  return helperStore.listHelperInventoryItems(userId, options);
}

function upsertHelperInventory(userId, payload) {
  return helperStore.upsertHelperInventory(userId, payload);
}

function upsertHelperInventoriesBatch(userId, payloads) {
  return helperStore.upsertHelperInventoriesBatch(userId, payloads);
}

function pruneHelperInventories(userId, keepInventoryIds, actorUserId) {
  return helperStore.pruneHelperInventories(userId, keepInventoryIds, actorUserId);
}

function listMergedHelperInventoryItems(userId) {
  return helperStore.listMergedHelperInventoryItems(userId);
}

function createHelperSnapshot(userId, payload) {
  return helperStore.createHelperSnapshot(userId, payload);
}

function updateHelperSnapshot(userId, snapshotId, payload) {
  return helperStore.updateHelperSnapshot(userId, snapshotId, payload);
}

function removeHelperSnapshot(userId, snapshotId) {
  return helperStore.removeHelperSnapshot(userId, snapshotId);
}

function listHelperActionLogs(userId, options = {}) {
  return helperStore.listHelperActionLogs(userId, options);
}

function createHelperActionLog(userId, payload) {
  return helperStore.createHelperActionLog(userId, payload);
}

function createConsignmentListing(userId, payload) {
  return helperStore.createConsignmentListing(userId, payload);
}

function listConsignmentListingsForUser(userId) {
  return helperStore.listConsignmentListingsForUser(userId);
}

function listAdminConsignmentListings(options) {
  return helperStore.listAdminConsignmentListings(options);
}

function listPublicConsignmentProducts(options) {
  return helperStore.listPublicConsignmentProducts(options);
}

function reviewConsignmentListing(actorUserId, listingId, payload) {
  return helperStore.reviewConsignmentListing(actorUserId, listingId, payload);
}

function withdrawConsignmentListing(userId, listingId) {
  return helperStore.withdrawConsignmentListing(userId, listingId);
}

function createEscrowTrade(userId, payload) {
  return helperStore.createEscrowTrade(userId, payload);
}

function listEscrowTradesForUser(userId) {
  return helperStore.listEscrowTradesForUser(userId);
}

function listAdminEscrowTrades(options) {
  return helperStore.listAdminEscrowTrades(options);
}

function listAdminPaymentReviews(options) {
  return helperStore.listAdminPaymentReviews(options);
}

function submitEscrowDelivery(userId, tradeId, payload) {
  return helperStore.submitEscrowDelivery(userId, tradeId, payload);
}

function addEscrowEvidence(userId, tradeId, file) {
  return helperStore.addEscrowEvidence(userId, tradeId, file);
}

function confirmEscrowReceipt(userId, tradeId) {
  return helperStore.confirmEscrowReceipt(userId, tradeId);
}

function disputeEscrowTrade(userId, tradeId, payload) {
  return helperStore.disputeEscrowTrade(userId, tradeId, payload);
}

function reviewEscrowPayment(actorUserId, tradeId, payload) {
  return helperStore.reviewEscrowPayment(actorUserId, tradeId, payload);
}

function resolveEscrowTrade(actorUserId, tradeId, payload) {
  return helperStore.resolveEscrowTrade(actorUserId, tradeId, payload);
}

function markEscrowSettlement(actorUserId, tradeId, payload) {
  return helperStore.markEscrowSettlement(actorUserId, tradeId, payload);
}

module.exports = {
  getHelperSnapshotLimitForUser,
  listHelperBindings,
  resolveHelperBinding,
  upsertHelperBinding,
  removeHelperBinding,
  listHelperSnapshots,
  listHelperInventories,
  listHelperInventorySummary,
  listHelperInventoryItems,
  upsertHelperInventory,
  upsertHelperInventoriesBatch,
  pruneHelperInventories,
  listMergedHelperInventoryItems,
  createHelperSnapshot,
  updateHelperSnapshot,
  removeHelperSnapshot,
  listHelperActionLogs,
  createHelperActionLog,
  createConsignmentListing,
  listConsignmentListingsForUser,
  listAdminConsignmentListings,
  listPublicConsignmentProducts,
  reviewConsignmentListing,
  withdrawConsignmentListing,
  createEscrowTrade,
  listEscrowTradesForUser,
  listAdminEscrowTrades,
  listAdminPaymentReviews,
  submitEscrowDelivery,
  addEscrowEvidence,
  confirmEscrowReceipt,
  disputeEscrowTrade,
  reviewEscrowPayment,
  resolveEscrowTrade,
  markEscrowSettlement,
};
