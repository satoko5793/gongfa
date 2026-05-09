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

function upsertHelperInventory(userId, payload) {
  return helperStore.upsertHelperInventory(userId, payload);
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

module.exports = {
  getHelperSnapshotLimitForUser,
  listHelperBindings,
  resolveHelperBinding,
  upsertHelperBinding,
  removeHelperBinding,
  listHelperSnapshots,
  listHelperInventories,
  upsertHelperInventory,
  pruneHelperInventories,
  listMergedHelperInventoryItems,
  createHelperSnapshot,
  updateHelperSnapshot,
  removeHelperSnapshot,
  listHelperActionLogs,
  createHelperActionLog,
};
