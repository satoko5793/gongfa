const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-queries-repository");
const pgRepository = require("../../../repositories/pg/admin-queries-repository");

function getAdminQueriesRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminQueriesRepository,
};
