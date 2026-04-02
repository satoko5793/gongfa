const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-recharge-config-repository");
const pgRepository = require("../../../repositories/pg/admin-recharge-config-repository");

function getAdminRechargeConfigRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminRechargeConfigRepository,
};
