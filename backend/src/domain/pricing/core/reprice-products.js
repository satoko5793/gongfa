function buildRepriceSummary(pricedProducts = []) {
  const items = Array.isArray(pricedProducts) ? pricedProducts : [];
  return {
    status: "success",
    product_count: items.length,
    sample_product_ids: items.slice(0, 5).map((item) => Number(item?.id || 0)).filter(Boolean),
  };
}

function buildRepriceFailureSummary(error) {
  return {
    status: "failed",
    error: String(error?.message || "pricing_reprice_failed"),
  };
}

function attachRepriceStatus(config, status) {
  return {
    ...config,
    pricing_reprice_status: {
      saved: true,
      ...status,
      updated_at: new Date().toISOString(),
    },
  };
}

module.exports = {
  buildRepriceSummary,
  buildRepriceFailureSummary,
  attachRepriceStatus,
};
