export async function submitAuctionBidAction(ctx) {
  try {
    const result = await ctx.apiFetch(`/orders/auctions/${ctx.auctionId}/bids`, {
      method: "POST",
      body: JSON.stringify({ amount_quota: Number(ctx.amountQuota) }),
    });
    ctx.setAuctionMessage(
      `拍卖 #${ctx.auctionId} 出价成功，当前价格 ${Number(result.current_price_quota || 0)} 额度。`,
      "success"
    );
    await Promise.all([ctx.loadAuctions(), ctx.loadAccount()]);
  } catch (error) {
    ctx.setAuctionMessage(`出价失败：${ctx.pickErrorMessage(error, "出价失败")}`, "error");
  }
}
