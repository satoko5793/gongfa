const usersStore = require("../users-store");
const helperStore = require("../helper-store");

function registerPasswordUser(payload) {
  return usersStore.registerPasswordUser(payload);
}

async function loginPasswordUser(gameRoleId, password) {
  return await usersStore.loginPasswordUser(gameRoleId, password);
}

function bindUser(payload) {
  return usersStore.bindUser(payload);
}

function getUserById(userId) {
  return usersStore.getUserById(userId);
}

function getQuota(userId) {
  return usersStore.getQuota(userId);
}

function changeUserQuota(userId, changeAmount, remark, actorUserId) {
  return usersStore.changeUserQuota(userId, changeAmount, remark, actorUserId);
}

function updateUserStatus(userId, status, actorUserId) {
  return usersStore.updateUserStatus(userId, status, actorUserId);
}

function updateUserHelperCapabilities(userId, capabilities, actorUserId) {
  return usersStore.updateUserHelperCapabilities(userId, capabilities, actorUserId);
}

function getRechargeConfig() {
  return usersStore.getRechargeConfig();
}

function updateRechargeConfig(patch, actorUserId, requestId = null) {
  return usersStore.updateRechargeConfig(patch, actorUserId, requestId);
}

function updateSelfProfile(userId, payload) {
  return usersStore.updateSelfProfile(userId, payload);
}

async function changeSelfPassword(userId, currentPassword, nextPassword) {
  return await usersStore.changeSelfPassword(userId, currentPassword, nextPassword);
}

function purchaseLineupSlot(userId, purchaseType) {
  return helperStore.purchaseLineupSlot(userId, purchaseType);
}

module.exports = {
  registerPasswordUser,
  loginPasswordUser,
  bindUser,
  getUserById,
  getQuota,
  changeUserQuota,
  updateUserStatus,
  updateUserHelperCapabilities,
  getRechargeConfig,
  updateRechargeConfig,
  updateSelfProfile,
  changeSelfPassword,
  purchaseLineupSlot,
};
