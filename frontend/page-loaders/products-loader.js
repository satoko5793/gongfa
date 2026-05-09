export async function loadProductsData(ctx, options = {}) {
  const { resetPage = false } = options;
  ctx.setDebugLine("products.load", "requesting");
  try {
    const meta = await ctx.apiFetch("/products/meta");
    if (meta?.recharge_config) {
      ctx.setPublicRechargeConfig(meta.recharge_config);
    }
    ctx.setDebugLine("products.meta", "ok");
  } catch (error) {
    // Keep product list usable even if the public pricing meta is temporarily unavailable.
    ctx.setDebugLine("products.meta", `error: ${error?.message || error}`);
  }

  const products = await ctx.apiFetch("/products");
  ctx.setAllProducts(products);
  ctx.setDebugLine("products.count", String(Array.isArray(products) ? products.length : 0));
  ctx.applyProductView({ resetPage });
  ctx.applyDiscountView({ resetPage });
}
