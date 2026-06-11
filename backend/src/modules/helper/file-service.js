const helperStore = require("../../domain/store/repositories/helper-file-store");
const usersStore = require("../../domain/store/repositories/users-file-store");
const { getRechargeConfig } = require("../../config/recharge-config");

function getHelperRechargeConfig() {
  return getRechargeConfig(usersStore.getRechargeConfig());
}

function getHelperSnapshotLimitForUser(userId) {
  return helperStore.getHelperSnapshotLimitForUser(userId);
}

function listHelperBindings(userId) {
  return helperStore.listHelperBindings(userId);
}

function resolveHelperBinding(userId, criteria) {
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

function createHelperSnapshot(userId, payload) {
  return helperStore.createHelperSnapshot(userId, payload);
}

function updateHelperSnapshot(userId, snapshotId, payload) {
  return helperStore.updateHelperSnapshot(userId, snapshotId, payload);
}

function removeHelperSnapshot(userId, snapshotId) {
  return helperStore.removeHelperSnapshot(userId, snapshotId);
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

function listMergedHelperInventoryItems(userId) {
  return helperStore.listMergedHelperInventoryItems(userId);
}

function upsertHelperInventory(userId, payload) {
  return helperStore.upsertHelperInventory(userId, payload);
}

function upsertHelperInventoriesBatch(userId, payloads) {
  return helperStore.upsertHelperInventoriesBatch(userId, payloads);
}

function createConsignmentListing(userId, payload) {
  return helperStore.createConsignmentListing(userId, payload);
}

function listConsignmentListingsForUser(userId) {
  return helperStore.listConsignmentListingsForUser(userId);
}

function withdrawConsignmentListing(userId, listingId) {
  return helperStore.withdrawConsignmentListing(userId, listingId);
}

function listHelperActionLogs(userId, options) {
  return helperStore.listHelperActionLogs(userId, options);
}

function createHelperActionLog(userId, payload) {
  return helperStore.createHelperActionLog(userId, payload);
}

module.exports = {
  getHelperRechargeConfig,
  getHelperSnapshotLimitForUser,
  listHelperBindings,
  resolveHelperBinding,
  upsertHelperBinding,
  removeHelperBinding,
  listHelperSnapshots,
  createHelperSnapshot,
  updateHelperSnapshot,
  removeHelperSnapshot,
  listHelperInventories,
  listHelperInventorySummary,
  listHelperInventoryItems,
  listMergedHelperInventoryItems,
  upsertHelperInventory,
  upsertHelperInventoriesBatch,
  createConsignmentListing,
  listConsignmentListingsForUser,
  withdrawConsignmentListing,
  listHelperActionLogs,
  createHelperActionLog,
};
