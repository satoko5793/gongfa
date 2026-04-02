const { getRechargeConfig } = require("../../config/recharge-config");

async function getAdminRechargeConfig() {
  return getRechargeConfig();
}

async function updateRechargeConfig() {
  const err = new Error("recharge_config_not_supported_in_db_mode");
  err.statusCode = 501;
  throw err;
}

module.exports = {
  mode: "pg",
  getRechargeConfig: getAdminRechargeConfig,
  updateRechargeConfig,
};
