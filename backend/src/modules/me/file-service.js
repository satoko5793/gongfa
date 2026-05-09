const usersStore = require("../../domain/store/repositories/users-file-store");
const ordersStore = require("../../domain/store/repositories/orders-file-store");
const { getRechargeConfig } = require("../../config/recharge-config");

function getUserQuota(userId) {
  return usersStore.getQuota(userId);
}

function listUserOrders(userId, limit = 100) {
  return ordersStore.listOrders({ userId, limit });
}

function getUserRechargeConfig() {
  return getRechargeConfig(usersStore.getRechargeConfig());
}

function listUserRechargeOrders(userId, limit = 100) {
  return ordersStore.listRechargeOrders({ userId, limit });
}

function createUserRechargeOrder(userId, payload) {
  return ordersStore.createRechargeOrder(userId, payload);
}

function purchaseUserLineupSlot(userId, purchaseType) {
  return usersStore.purchaseLineupSlot(userId, purchaseType);
}

function updateUserProfile(userId, payload) {
  return usersStore.updateSelfProfile(userId, payload);
}

async function changeUserPassword(userId, currentPassword, nextPassword) {
  return await usersStore.changeSelfPassword(userId, currentPassword, nextPassword);
}

module.exports = {
  getUserQuota,
  listUserOrders,
  getUserRechargeConfig,
  listUserRechargeOrders,
  createUserRechargeOrder,
  purchaseUserLineupSlot,
  updateUserProfile,
  changeUserPassword,
};
