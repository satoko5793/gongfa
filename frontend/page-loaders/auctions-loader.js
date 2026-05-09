export async function loadAuctionsData(ctx) {
  try {
    const [auctionResult, myBidResult] = await Promise.all([
      ctx.apiFetch("/products/auctions"),
      ctx.getCurrentProfile()
        ? ctx.apiFetch("/orders/auctions/mine").catch(() => ({ items: [] }))
        : Promise.resolve({ items: [] }),
    ]);
    ctx.setCurrentAuctions(Array.isArray(auctionResult?.items) ? auctionResult.items : []);
    ctx.setCurrentAuctionBidSummaries(Array.isArray(myBidResult?.items) ? myBidResult.items : []);
    ctx.renderAuctionZone(ctx.getCurrentProfile());
  } catch (error) {
    ctx.setCurrentAuctions([]);
    ctx.setCurrentAuctionBidSummaries([]);
    ctx.renderAuctionZone(ctx.getCurrentProfile());
    ctx.setAuctionMessage(`拍卖列表加载失败：${ctx.pickErrorMessage(error, "加载失败")}`, "error");
  }
}
