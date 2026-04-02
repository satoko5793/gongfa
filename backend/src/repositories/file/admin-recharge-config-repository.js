const devStore = require("../../services/dev-store");
const { getRechargeConfig } = require("../../config/recharge-config");

async function getAdminRechargeConfig() {
  return getRechargeConfig(devStore.getRechargeConfig());
}

async function updateRechargeConfig({ patch, actorUserId }) {
  return devStore.updateRechargeConfig(patch, actorUserId);
}

module.exports = {
  mode: "file",
  getRechargeConfig: getAdminRechargeConfig,
  updateRechargeConfig,
};
