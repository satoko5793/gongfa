const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-pricing-repository");
const pgRepository = require("../../../repositories/pg/admin-pricing-repository");

function getAdminPricingRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminPricingRepository,
};
