function normalizeDiscountRate(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 100;
  const normalized = Math.round(numeric);
  if (normalized <= 0 || normalized > 100) return 100;
  return normalized;
}

function isDiscountedProduct(product) {
  return normalizeDiscountRate(product?.discount_rate) < 100;
}

function normalizeKeyword(value) {
  return String(value || "").trim().toLowerCase();
}

function getAdminProductTierKey(product) {
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 500) return "gold";
  if (legacyId >= 400) return "red";
  if (legacyId >= 300) return "orange";
  if (legacyId >= 200) return "purple";
  if (legacyId >= 100) return "blue";
  return "green";
}

function isAdminCurrentSeasonProduct(product) {
  return Boolean(product?.is_current_season);
}

function getAdminTopCategoryKey(product) {
  return isAdminCurrentSeasonProduct(product) ? "current_season" : "legacy_season";
}

function parseAdminExtAttrStats(extAttrs) {
  const raw = String(extAttrs || "").trim();
  if (!raw || raw === "无") {
    return { fire: 0, calm: 0 };
  }
  const fireMatch = raw.match(/走火\s*([0-9.]+)/);
  const calmMatch = raw.match(/气定\s*([0-9.]+)/);
  return {
    fire: fireMatch ? Number(fireMatch[1]) || 0 : 0,
    calm: calmMatch ? Number(calmMatch[1]) || 0 : 0,
  };
}

function getAdminGoldSubcategory(product) {
  if (getAdminProductTierKey(product) !== "gold") return "all";
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 600) return "rare";
  const extStats = parseAdminExtAttrStats(product?.ext_attrs);
  if (extStats.fire > 0 && extStats.calm > 0) return "double_term";
  if (extStats.fire > 0) return "fire_only";
  if (extStats.calm > 0) return "calm_only";
  return "no_term";
}

function getAdminNameSubcategoryKey(product) {
  const name = String(product?.name || "").trim();
  return name ? `name:${name}` : "all";
}

function getAdminProductFullnessKey(product) {
  const attack = Number(product?.attack_value || 0);
  const hp = Number(product?.hp_value || 0);
  const caps = {
    gold: { attack: 10000000, hp: 200000000 },
    red: { attack: 8000000, hp: 160000000 },
    orange: { attack: 5000000, hp: 100000000 },
    purple: { attack: 2000000, hp: 40000000 },
    blue: { attack: 1000000, hp: 20000000 },
  };
  const tierCaps =
    caps[getAdminProductTierKey(product)] || {
      attack: Number.MAX_SAFE_INTEGER,
      hp: Number.MAX_SAFE_INTEGER,
    };
  const attackFull = attack > 0 && attack >= tierCaps.attack;
  const hpFull = hp > 0 && hp >= tierCaps.hp;
  if (attackFull && hpFull) return "double_full";
  if (attackFull) return "attack_full";
  if (hpFull) return "hp_full";
  return "none_full";
}

function buildAdminProductCategoryEntries(products, bundleCount = 0) {
  const labels = {
    all: "全部",
    current_season: "本赛季",
    legacy_season: "往赛季",
    bundle: "套餐",
  };
  const counts = {
    all: Array.isArray(products) ? products.length : 0,
    bundle: Math.max(Number(bundleCount) || 0, 0),
  };
  for (const product of products || []) {
    const key = getAdminTopCategoryKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || (counts[key] || 0) > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function buildAdminProductSubcategoryEntries(products, category) {
  if (!category || category === "bundle") return [];
  const subset = products || [];
  if (!subset.length) return [];

  const labels = {
    all:
      category === "current_season"
        ? "全部本赛季"
        : category === "legacy_season"
          ? "全部往赛季"
          : "全部卡阶",
    gold: "金卡",
    red: "红卡",
    orange: "橙卡",
    purple: "紫卡",
    blue: "蓝卡",
    green: "绿卡",
  };
  const counts = { all: subset.length };
  for (const product of subset) {
    const key = getAdminProductTierKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || (counts[key] || 0) > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function getAdminProductTierLabelByKey(key) {
  const mapping = {
    gold: "金卡",
    red: "红卡",
    orange: "橙卡",
    purple: "紫卡",
    blue: "蓝卡",
    green: "绿卡",
  };
  return mapping[key] || "商品";
}

function buildAdminProductDetailEntries(products, tier) {
  if (!tier || tier === "all" || tier === "bundle") return [];
  const subset = (products || []).filter((product) => getAdminProductTierKey(product) === tier);
  if (!subset.length) return [];

  if (tier === "gold") {
    const labels = {
      all: "全部金卡",
      rare: "珍卡",
      double_term: "双词条",
      fire_only: "走火",
      calm_only: "气定",
      no_term: "无词条",
    };
    const counts = { all: subset.length };
    for (const product of subset) {
      const key = getAdminGoldSubcategory(product);
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(labels)
      .filter(([key]) => key === "all" || (counts[key] || 0) > 0)
      .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
  }

  const counts = new Map();
  for (const product of subset) {
    const key = getAdminNameSubcategoryKey(product);
    counts.set(key, {
      key,
      label: String(product?.name || "未命名"),
      count: (counts.get(key)?.count || 0) + 1,
    });
  }

  return [
    { key: "all", label: `全部${getAdminProductTierLabelByKey(tier)}`, count: subset.length },
    ...Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label), "zh-Hans-CN")
    ),
  ];
}

function buildAdminProductFullnessEntries(products, enabled) {
  if (!enabled) return [];
  const subset = products || [];
  if (!subset.length) return [];

  const labels = {
    all: "全部",
    double_full: "双满",
    attack_full: "攻击满",
    hp_full: "血量满",
    none_full: "都不满",
  };
  const counts = { all: subset.length };
  for (const product of subset) {
    const key = getAdminProductFullnessKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || (counts[key] || 0) > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function filterAdminProductsByCategory(products, category) {
  if (!category || category === "all") return products || [];
  if (category === "current_season") {
    return (products || []).filter((product) => isAdminCurrentSeasonProduct(product));
  }
  if (category === "legacy_season") {
    return (products || []).filter((product) => !isAdminCurrentSeasonProduct(product));
  }
  if (category === "bundle") {
    return [];
  }
  return products || [];
}

function filterAdminProductsBySubcategory(products, category, subcategory) {
  if (!category || category === "bundle") return products || [];
  if (!subcategory || subcategory === "all") return products || [];
  return (products || []).filter((product) => getAdminProductTierKey(product) === subcategory);
}

function filterAdminProductsByDetail(products, tier, detail) {
  if (!tier || tier === "all" || tier === "bundle") return products || [];
  if (!detail || detail === "all") return products || [];
  if (tier === "gold") {
    return (products || []).filter((product) => getAdminGoldSubcategory(product) === detail);
  }
  return (products || []).filter((product) => getAdminNameSubcategoryKey(product) === detail);
}

function filterAdminProductsByFullness(products, fullness) {
  if (!fullness || fullness === "all") return products || [];
  return (products || []).filter((product) => getAdminProductFullnessKey(product) === fullness);
}

function pickActiveKey(entries, current, fallback = "all") {
  const validKeys = new Set((entries || []).map((entry) => entry.key));
  if (validKeys.has(current)) return current;
  if (validKeys.has(fallback)) return fallback;
  return entries?.[0]?.key || fallback;
}

function filterProductsByBase(products, filters = {}) {
  const keyword = normalizeKeyword(filters.keyword);
  const status = String(filters.status || "all").trim();
  const discount = String(filters.discount || "all").trim();

  return (products || []).filter((product) => {
    if (status !== "all" && product.status !== status) return false;
    if (discount === "discounted" && !isDiscountedProduct(product)) return false;
    if (discount === "full_price" && isDiscountedProduct(product)) return false;
    if (!keyword) return true;

    return [
      product.name,
      product.ext_attrs,
      product.source_file_name,
      String(product.legacy_id || ""),
      String(product.uid || ""),
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(keyword));
  });
}

function buildAdminProductQueryResult(products, filters = {}, options = {}) {
  const bundleCount = Math.max(Number(options.bundleCount) || 0, 0);
  const normalizedFilters = {
    keyword: String(filters.keyword || "").trim(),
    status: String(filters.status || "all").trim() || "all",
    discount: String(filters.discount || "all").trim() || "all",
    category: String(filters.category || "all").trim() || "all",
    subcategory: String(filters.subcategory || "all").trim() || "all",
    detail: String(filters.detail || "all").trim() || "all",
    fullness: String(filters.fullness || "all").trim() || "all",
  };

  const baseFiltered = filterProductsByBase(products, normalizedFilters);
  const categories = buildAdminProductCategoryEntries(baseFiltered, bundleCount);
  const activeCategory = pickActiveKey(categories, normalizedFilters.category);
  const categoryFiltered = filterAdminProductsByCategory(baseFiltered, activeCategory);
  const subcategories = buildAdminProductSubcategoryEntries(categoryFiltered, activeCategory);
  const activeSubcategory = pickActiveKey(subcategories, normalizedFilters.subcategory);
  const subcategoryFiltered = filterAdminProductsBySubcategory(
    categoryFiltered,
    activeCategory,
    activeSubcategory
  );
  const details = buildAdminProductDetailEntries(subcategoryFiltered, activeSubcategory);
  const activeDetail = pickActiveKey(details, normalizedFilters.detail);
  const detailFiltered = filterAdminProductsByDetail(
    subcategoryFiltered,
    activeSubcategory,
    activeDetail
  );
  const fullnessEnabled = activeCategory !== "bundle" && activeSubcategory !== "all";
  const fullnessEntries = buildAdminProductFullnessEntries(detailFiltered, fullnessEnabled);
  const activeFullness = fullnessEnabled
    ? pickActiveKey(fullnessEntries, normalizedFilters.fullness)
    : "all";
  const filtered = filterAdminProductsByFullness(detailFiltered, activeFullness);

  return {
    filtered,
    facets: {
      categories,
      subcategories,
      details,
      fullness: fullnessEnabled ? fullnessEntries : [],
    },
    summary: {
      filtered_total: filtered.length,
      discounted_total: filtered.filter(isDiscountedProduct).length,
    },
    appliedFilters: {
      keyword: normalizedFilters.keyword,
      status: normalizedFilters.status,
      discount: normalizedFilters.discount,
      category: activeCategory,
      subcategory: activeSubcategory,
      detail: activeDetail,
      fullness: activeFullness,
    },
  };
}

module.exports = {
  buildAdminProductQueryResult,
  normalizeDiscountRate,
  isDiscountedProduct,
};
