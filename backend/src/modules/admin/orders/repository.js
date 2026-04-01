const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-orders-repository");
const pgRepository = require("../../../repositories/pg/admin-orders-repository");

function getAdminOrdersRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminOrdersRepository,
};
