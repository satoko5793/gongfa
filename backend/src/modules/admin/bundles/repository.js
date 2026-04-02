const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-bundles-repository");
const pgRepository = require("../../../repositories/pg/admin-bundles-repository");

function getAdminBundlesRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminBundlesRepository,
};
