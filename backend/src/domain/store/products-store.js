const { getStoreRuntime } = require("./core/runtime-context");
const { buildDynamicBundles, findDynamicBundleById } = require("../dynamic-bundles");

function getDep(name) {
  const runtime = getStoreRuntime();
  if (typeof runtime[name] !== "function" && runtime[name] === undefined) {
    throw new Error(`store_runtime_dependency_missing:${name}`);
  }
  return runtime[name];
}

function listProducts({ keyword = "", sort = "created_desc", publicOnly = false } = {}) {
  const readData = getDep("readData");
  const clone = getDep("clone");
  const getAvailableProductStock = getDep("getAvailableProductStock");
  const normalizeCardProduct = getDep("normalizeCardProduct");
  const normalizeBundleSku = getDep("normalizeBundleSku");

  const data = readData({ mutable: false });
  const cards = data.products.filter((item) => {
    if (!publicOnly) return true;
    if (item.status !== "on_sale") return false;
    return getAvailableProductStock(data, item) > 0;
  });
  const bundles = (data.bundleSkus || []).filter((item) => (publicOnly ? item.status === "on_sale" : true));
  const normalizedCards = cards.map((item) => normalizeCardProduct(item, { includePricingMeta: !publicOnly }));
  let products = [
    ...normalizedCards,
    ...bundles.map((item) => normalizeBundleSku(item, { includePricingMeta: !publicOnly })),
    ...(publicOnly ? buildDynamicBundles(normalizedCards) : []),
  ];

  const trimmed = String(keyword || "").trim().toLowerCase();
  if (trimmed) {
    products = products.filter((item) =>
      [item.name, item.uid, item.main_attrs, item.ext_attrs, item.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmed))
    );
  }

  const sorters = {
    created_desc: (a, b) => String(b.created_at).localeCompare(String(a.created_at)),
    price_asc: (a, b) => a.price_quota - b.price_quota || b.id - a.id,
    price_desc: (a, b) => b.price_quota - a.price_quota || b.id - a.id,
    attack_desc: (a, b) => b.attack_value - a.attack_value || b.id - a.id,
    hp_desc: (a, b) => b.hp_value - a.hp_value || b.id - a.id,
  };
  products.sort(sorters[sort] || sorters.created_desc);
  return clone(products);
}

function getProductById(productId, { publicOnly = false, itemKind = "card" } = {}) {
  const readData = getDep("readData");
  const getAvailableProductStock = getDep("getAvailableProductStock");
  const normalizeCardProduct = getDep("normalizeCardProduct");
  const normalizeBundleSku = getDep("normalizeBundleSku");

  const data = readData({ mutable: false });
  if (itemKind === "bundle") {
    if (Number(productId) < 0) {
      const cards = data.products
        .filter((item) => item.status === "on_sale" && getAvailableProductStock(data, item) > 0)
        .map((item) => normalizeCardProduct(item, { includePricingMeta: !publicOnly }));
      return findDynamicBundleById(cards, productId);
    }
    const bundle = (data.bundleSkus || []).find(
      (item) => item.id === Number(productId) && (!publicOnly || item.status === "on_sale")
    );
    return bundle ? normalizeBundleSku(bundle, { includePricingMeta: !publicOnly }) : null;
  }
  const product = data.products.find(
    (item) => item.id === Number(productId) && (!publicOnly || item.status === "on_sale")
  );
  if (publicOnly && product && getAvailableProductStock(data, product) <= 0) {
    return null;
  }
  return product ? normalizeCardProduct(product, { includePricingMeta: !publicOnly }) : null;
}

function listBundleSkus({ publicOnly = false } = {}) {
  const readData = getDep("readData");
  const clone = getDep("clone");
  const normalizeBundleSku = getDep("normalizeBundleSku");
  const data = readData({ mutable: false });
  const bundles = (data.bundleSkus || [])
    .filter((item) => (!publicOnly || item.status === "on_sale"))
    .sort((a, b) => Number(a.display_rank || 999) - Number(b.display_rank || 999));
  return clone(
    bundles.map((item) => normalizeBundleSku(item, { includePricingMeta: !publicOnly }))
  );
}

module.exports = {
  listProducts,
  getProductById,
  listBundleSkus,
};
