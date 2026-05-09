function repriceStoreProducts(data, dependencies = {}) {
  const { repriceProducts, buildOrderEvents } = dependencies;
  if (typeof repriceProducts !== "function" || typeof buildOrderEvents !== "function") {
    throw new Error("reprice_store_products_dependencies_invalid");
  }

  const pricedProducts = repriceProducts(
    data.products || [],
    buildOrderEvents(data.orders || [], data.orderItems || []),
    new Date(),
    { rechargeConfig: data.rechargeConfig || {} }
  );

  const pricedById = new Map(pricedProducts.map((item) => [Number(item.id), item]));
  data.products = (data.products || []).map((product) => {
    const priced = pricedById.get(Number(product.id));
    if (!priced) return product;
    return {
      ...product,
      price_quota: priced.price_quota,
      pricing_meta: priced.pricing_meta,
    };
  });

  return pricedProducts;
}

module.exports = {
  repriceStoreProducts,
};
