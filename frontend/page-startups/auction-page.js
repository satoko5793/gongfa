export function getAuctionPageStartupTasks(ctx) {
  return [
    {
      label: "startup.auctions",
      run: () => ctx.loadAuctions(),
    },
  ];
}
