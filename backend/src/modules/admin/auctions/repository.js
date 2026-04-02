const { useFileStore } = require("../../../services/runtime");
const fileRepository = require("../../../repositories/file/admin-auctions-repository");
const pgRepository = require("../../../repositories/pg/admin-auctions-repository");

function getAdminAuctionsRepository() {
  return useFileStore() ? fileRepository : pgRepository;
}

module.exports = {
  getAdminAuctionsRepository,
};
