const usersStore = require("../../domain/store/repositories/users-file-store");
const { getRechargeConfig } = require("../../config/recharge-config");

async function getAdminRechargeConfig() {
  return getRechargeConfig(usersStore.getRechargeConfig());
}

async function updateRechargeConfig({ patch, actorUserId, requestId = null }) {
  return usersStore.updateRechargeConfig(patch, actorUserId, requestId);
}

module.exports = {
  mode: "file",
  getRechargeConfig: getAdminRechargeConfig,
  updateRechargeConfig,
};
