const auctionsStore = require("../../domain/store/repositories/auctions-file-store");

async function listAuctions({ status }) {
  return auctionsStore.listAuctions({ status });
}

async function createAuction({ productId, input, actorUserId }) {
  return auctionsStore.createAuction(productId, input, actorUserId);
}

async function settleAuction({ auctionId, input, actorUserId }) {
  return auctionsStore.settleAuction(auctionId, input, actorUserId);
}

async function cancelAuction({ auctionId, input, actorUserId }) {
  return auctionsStore.cancelAuction(auctionId, input, actorUserId);
}

module.exports = {
  mode: "file",
  listAuctions,
  createAuction,
  settleAuction,
  cancelAuction,
};
