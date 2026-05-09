export async function loadRecentSalesData(ctx) {
  try {
    const result = await ctx.apiFetch("/products/recent-sales?limit=8");
    const items = Array.isArray(result?.items) ? result.items : [];
    ctx.setRecentSalesItems(items);
    ctx.renderRecentSales(items);
  } catch (error) {
    console.error(error);
    ctx.setRecentSalesItems([]);
    ctx.renderRecentSales([]);
  }
}
