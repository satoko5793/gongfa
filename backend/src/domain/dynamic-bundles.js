const DYNAMIC_BUNDLE_ID_BASE = -9100;

const TIER_BUNDLE_DEFINITIONS = [
  {
    id: DYNAMIC_BUNDLE_ID_BASE,
    tier: "red",
    name: "红卡图鉴套",
    description: "选择攻击和血量档位后，系统从每个红卡卡种里各挑一张同档位最便宜的卡。",
    tags: ["动态套餐", "红卡", "图鉴套"],
    legacyIds: [401, 402, 403],
    displayRank: 110,
  },
  {
    id: DYNAMIC_BUNDLE_ID_BASE - 1,
    tier: "orange",
    name: "橙卡图鉴套",
    description: "选择攻击和血量档位后，系统从每个橙卡卡种里各挑一张同档位最便宜的卡。",
    tags: ["动态套餐", "橙卡", "图鉴套"],
    legacyIds: [301, 302],
    displayRank: 120,
  },
  {
    id: DYNAMIC_BUNDLE_ID_BASE - 2,
    tier: "purple",
    name: "紫卡图鉴套",
    description: "选择攻击和血量档位后，系统从每个紫卡卡种里各挑一张同档位最便宜的卡。",
    tags: ["动态套餐", "紫卡", "图鉴套"],
    legacyIds: [201, 202],
    displayRank: 130,
  },
  {
    id: DYNAMIC_BUNDLE_ID_BASE - 3,
    tier: "blue",
    name: "蓝卡图鉴套",
    description: "选择攻击和血量档位后，系统从每个蓝卡卡种里各挑一张同档位最便宜的卡。",
    tags: ["动态套餐", "蓝卡", "图鉴套"],
    legacyIds: [101, 102],
    displayRank: 140,
  },
  {
    id: DYNAMIC_BUNDLE_ID_BASE - 4,
    tier: "green",
    name: "绿卡图鉴套",
    description: "选择攻击和血量档位后，系统从每个绿卡卡种里各挑一张同档位最便宜的卡。",
    tags: ["动态套餐", "绿卡", "图鉴套"],
    legacyIds: [1, 2],
    displayRank: 150,
  },
];

function getAvailableStock(product) {
  if (product?.stock === null || product?.stock === undefined) return Number.POSITIVE_INFINITY;
  const stock = Number(product.stock || 0);
  return Number.isFinite(stock) ? Math.max(stock, 0) : 0;
}

function getProductPrice(product) {
  const price = Number(product?.effective_price_quota ?? product?.price_quota ?? 0);
  return Number.isFinite(price) ? Math.max(price, 0) : 0;
}

function isOnSaleProduct(product) {
  return (
    String(product?.item_kind || "card") === "card" &&
    String(product?.status || "on_sale") === "on_sale" &&
    getAvailableStock(product) > 0
  );
}

function compareCheapestProduct(left, right) {
  const priceDiff = getProductPrice(left) - getProductPrice(right);
  if (priceDiff !== 0) return priceDiff;
  return Number(left?.item_id || left?.id || 0) - Number(right?.item_id || right?.id || 0);
}

function formatCompactStat(value, stat) {
  const numeric = Number(value || 0);
  if (stat === "attack") return `${Number((numeric / 10000).toFixed(1)).toString()}w攻`;
  if (numeric >= 100000000) return `${Number((numeric / 100000000).toFixed(2)).toString()}亿血`;
  return `${Number((numeric / 10000).toFixed(1)).toString()}w血`;
}

function buildComponentSnapshot(product) {
  return {
    product_id: Number(product.item_id || product.id),
    item_id: Number(product.item_id || product.id),
    uid: product.uid || "",
    legacy_id: Number(product.legacy_id || 0),
    name: product.name || "",
    image_url: product.image_url || null,
    attack_value: Number(product.attack_value || 0),
    hp_value: Number(product.hp_value || 0),
    main_attrs: product.main_attrs || "",
    ext_attrs: product.ext_attrs || "",
    price_quota: getProductPrice(product),
    role: product.name || `ID ${product.legacy_id}`,
  };
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => Number(value || 0)).filter((value) => value > 0))].sort(
    (left, right) => left - right
  );
}

function chooseCheapestSet(products, definition, selection = {}) {
  const attackMin = Number(selection.attack_min || 0);
  const hpMin = Number(selection.hp_min || 0);
  const selected = [];
  let totalPrice = 0;

  for (const legacyId of definition.legacyIds) {
    const candidates = products
      .filter(
        (product) =>
          Number(product.legacy_id || 0) === Number(legacyId) &&
          Number(product.attack_value || 0) === attackMin &&
          Number(product.hp_value || 0) === hpMin
      )
      .sort(compareCheapestProduct);
    const picked = candidates[0];
    if (!picked) return null;
    selected.push(picked);
    totalPrice += getProductPrice(picked);
  }

  return {
    selected,
    totalPrice,
    attack_min: attackMin,
    hp_min: hpMin,
  };
}

function buildVariant(products, definition, attackMin, hpMin) {
  const chosen = chooseCheapestSet(products, definition, {
    attack_min: attackMin,
    hp_min: hpMin,
  });
  if (!chosen) return null;
  return {
    attack_min: Number(attackMin),
    hp_min: Number(hpMin),
    label: `${formatCompactStat(attackMin, "attack")} / ${formatCompactStat(hpMin, "hp")}`,
    price_quota: chosen.totalPrice,
    bundle_components: chosen.selected.map(buildComponentSnapshot),
  };
}

function buildVariants(products, definition) {
  const byLegacy = new Map();
  for (const legacyId of definition.legacyIds) {
    byLegacy.set(
      legacyId,
      products.filter((product) => Number(product.legacy_id || 0) === Number(legacyId))
    );
    if (byLegacy.get(legacyId).length === 0) return [];
  }

  const attackValues = uniqueSorted(
    [...byLegacy.values()].flatMap((items) => items.map((product) => product.attack_value))
  );
  const hpValues = uniqueSorted(
    [...byLegacy.values()].flatMap((items) => items.map((product) => product.hp_value))
  );
  const variants = [];
  for (const attackMin of attackValues) {
    for (const hpMin of hpValues) {
      const variant = buildVariant(products, definition, attackMin, hpMin);
      if (variant) variants.push(variant);
    }
  }
  variants.sort(
    (left, right) =>
      left.price_quota - right.price_quota ||
      left.attack_min - right.attack_min ||
      left.hp_min - right.hp_min
  );
  return variants;
}

function buildBundleOptions(variants, products, definition) {
  const tierProducts = products.filter((product) =>
    definition.legacyIds.some((legacyId) => Number(legacyId) === Number(product.legacy_id || 0))
  );
  return {
    attack: uniqueSorted(tierProducts.map((product) => product.attack_value)).map((value) => ({
      value,
      label: formatCompactStat(value, "attack"),
      has_any_set: variants.some((variant) => Number(variant.attack_min) === Number(value)),
    })),
    hp: uniqueSorted(tierProducts.map((product) => product.hp_value)).map((value) => ({
      value,
      label: formatCompactStat(value, "hp"),
      has_any_set: variants.some((variant) => Number(variant.hp_min) === Number(value)),
    })),
  };
}

function buildDynamicBundle(definition, products, selection = null) {
  const variants = buildVariants(products, definition);
  if (variants.length === 0) return null;
  const selectedVariant =
    selection && Number(selection.attack_min) > 0 && Number(selection.hp_min) > 0
      ? buildVariant(products, definition, Number(selection.attack_min), Number(selection.hp_min))
      : variants[0];
  if (!selectedVariant) return null;

  const stockValues = selectedVariant.bundle_components
    .map((component) => {
      const product = products.find((item) => Number(item.item_id || item.id) === Number(component.product_id));
      return product ? getAvailableStock(product) : 0;
    })
    .filter(Number.isFinite);
  const stock = stockValues.length ? Math.max(Math.min(...stockValues), 1) : null;

  return {
    id: definition.id,
    item_id: definition.id,
    item_kind: "bundle",
    dynamic_bundle: true,
    configurable_bundle: true,
    bundle_code: `dynamic_${definition.tier}_atlas_set`,
    legacy_id: 0,
    uid: `dynamic_${definition.tier}_atlas_set`,
    code: `dynamic_${definition.tier}_atlas_set`,
    name: definition.name,
    description: `${definition.description} 当前选择：${selectedVariant.label}。`,
    image_url: selectedVariant.bundle_components[0]?.image_url || null,
    schedule_id: null,
    current_schedule_id: null,
    is_current_season: false,
    season_tag: "bundle",
    season_label: "-",
    season_display: "套餐",
    attack_value: 0,
    hp_value: 0,
    main_attrs: definition.description,
    ext_attrs: definition.tags.join(" | "),
    tags: definition.tags,
    price_quota: selectedVariant.price_quota,
    original_price_quota: selectedVariant.price_quota,
    stock,
    status: "on_sale",
    display_rank: definition.displayRank,
    pricing_meta: {
      source: "dynamic_bundle",
      dominant_reason_label: "组件卡价格合计",
    },
    bundle_options: buildBundleOptions(variants, products, definition),
    bundle_variants: variants,
    selected_bundle_options: {
      attack_min: selectedVariant.attack_min,
      hp_min: selectedVariant.hp_min,
    },
    bundle_components: selectedVariant.bundle_components,
    bundle_component_product_ids: selectedVariant.bundle_components.map((item) => Number(item.product_id)),
    stock_label: stock === null ? "不限量" : `库存 ${stock}`,
  };
}

function buildDynamicBundles(products) {
  const cards = (products || []).filter(isOnSaleProduct);
  return TIER_BUNDLE_DEFINITIONS.map((definition) => buildDynamicBundle(definition, cards)).filter(Boolean);
}

function findDynamicBundleById(products, itemId, selection = null) {
  const id = Number(itemId);
  if (!Number.isInteger(id) || id >= 0) return null;
  const definition = TIER_BUNDLE_DEFINITIONS.find((item) => Number(item.id) === id);
  if (!definition) return null;
  return buildDynamicBundle(definition, (products || []).filter(isOnSaleProduct), selection);
}

function isDynamicBundleItem(item) {
  return Boolean(item?.dynamic_bundle) || Number(item?.item_id || item?.id || 0) < 0;
}

module.exports = {
  TIER_BUNDLE_DEFINITIONS,
  buildDynamicBundles,
  findDynamicBundleById,
  isDynamicBundleItem,
};
