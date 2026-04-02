const devStore = require("../../services/dev-store");

async function listAuctions({ status }) {
  return devStore.listAuctions({ status });
}

async function createAuction({ productId, input, actorUserId }) {
  return devStore.createAuction(productId, input, actorUserId);
}

async function settleAuction({ auctionId, input, actorUserId }) {
  return devStore.settleAuction(auctionId, input, actorUserId);
}

async function cancelAuction({ auctionId, input, actorUserId }) {
  return devStore.cancelAuction(auctionId, input, actorUserId);
}

module.exports = {
  mode: "file",
  listAuctions,
  createAuction,
  settleAuction,
  cancelAuction,
};
