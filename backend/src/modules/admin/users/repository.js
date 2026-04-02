const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-users-repository");
const pgRepository = require("../../../repositories/pg/admin-users-repository");

function getAdminUsersRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminUsersRepository,
};
