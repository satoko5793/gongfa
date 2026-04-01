function toOrderDetail(order) {
  return order;
}

function toAuctionBidSummaryResponse(items) {
  return {
    items,
  };
}

module.exports = {
  toOrderDetail,
  toAuctionBidSummaryResponse,
};
