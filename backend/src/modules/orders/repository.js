const { useFileStore } = require("../../services/runtime");
const fileOrdersRepository = require("../../repositories/file/orders-repository");
const pgOrdersRepository = require("../../repositories/pg/orders-repository");

function getOrdersRepository() {
  return useFileStore() ? fileOrdersRepository : pgOrdersRepository;
}

module.exports = {
  getOrdersRepository,
};
