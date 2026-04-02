function unsupported() {
  const err = new Error("auction_not_supported_in_db_mode");
  err.statusCode = 501;
  throw err;
}

async function listAuctions() {
  unsupported();
}

async function createAuction() {
  unsupported();
}

async function settleAuction() {
  unsupported();
}

async function cancelAuction() {
  unsupported();
}

module.exports = {
  mode: "pg",
  listAuctions,
  createAuction,
  settleAuction,
  cancelAuction,
};
