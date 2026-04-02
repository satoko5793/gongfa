const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-catalog-repository");
const pgRepository = require("../../../repositories/pg/admin-catalog-repository");

function getAdminCatalogRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminCatalogRepository,
};
