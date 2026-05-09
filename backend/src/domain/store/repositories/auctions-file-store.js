const auctionsStore = require("../auctions-store");

function listAuctions(options = {}) {
  return auctionsStore.listAuctions(options);
}

function createAuction(productId, input, actorUserId) {
  return auctionsStore.createAuction(productId, input, actorUserId);
}

function settleAuction(auctionId, input, actorUserId) {
  return auctionsStore.settleAuction(auctionId, input, actorUserId);
}

function cancelAuction(auctionId, input, actorUserId) {
  return auctionsStore.cancelAuction(auctionId, input, actorUserId);
}

module.exports = {
  listAuctions,
  createAuction,
  settleAuction,
  cancelAuction,
};
