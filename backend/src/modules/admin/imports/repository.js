const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-imports-repository");
const pgRepository = require("../../../repositories/pg/admin-imports-repository");

function getAdminImportsRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminImportsRepository,
};
