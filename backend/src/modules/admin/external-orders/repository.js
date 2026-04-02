const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-external-orders-repository");
const pgRepository = require("../../../repositories/pg/admin-external-orders-repository");

function getAdminExternalOrdersRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminExternalOrdersRepository,
};
