function buildCategoryEntries(ctx, products) {
  const labels = {
    all: "全部",
    current_season: "本赛季",
    legacy_season: "往赛季",
    bundle: "套餐",
  };
  const counts = { all: Array.isArray(products) ? products.length : 0 };
  for (const product of products || []) {
    const key = ctx.getTopCategoryKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderCategoryTabs(ctx, container, products, activeKey, dataAttr = "category") {
  if (!container) return activeKey;
  const entries = buildCategoryEntries(ctx, products || []);
  const validKeys = new Set(entries.map((item) => item.key));
  const nextActiveKey = validKeys.has(activeKey) ? activeKey : "all";
  container.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="category-tab ${entry.key === nextActiveKey ? "active" : ""}"
          data-${dataAttr}="${entry.key}"
        >
          <span class="tab-label">${ctx.escapeHtml(entry.label)}</span>
          <span class="category-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function getGoldSubcategory(ctx, product) {
  if (ctx.getTierKey(product) !== "gold" || ctx.isBundle(product)) return "all";
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 600) return "rare";
  const extStats = ctx.parseExtAttrStats(product?.ext_attrs);
  if (extStats.fire > 0 && extStats.calm > 0) return "double_term";
  if (extStats.fire > 0) return "fire_only";
  if (extStats.calm > 0) return "calm_only";
  return "no_term";
}

function getNameSubcategoryKey(product) {
  const name = String(product?.name || "").trim();
  return name ? `name:${name}` : "all";
}

function buildSubcategoryEntries(ctx, products, category) {
  if (category === "bundle") return [];
  const subset = (products || []).filter((product) => !ctx.isBundle(product));
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
    const key = ctx.getTierKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderSubcategoryTabs(ctx, container, products, category, activeKey, dataAttr = "subcategory") {
  if (!container) return activeKey;
  if (!category || category === "bundle") {
    container.classList.add("hidden");
    container.innerHTML = "";
    return "all";
  }

  const entries = buildSubcategoryEntries(ctx, products || [], category);
  const validKeys = new Set(entries.map((entry) => entry.key));
  const nextActiveKey = validKeys.has(activeKey) ? activeKey : "all";
  container.classList.toggle("hidden", entries.length <= 1);
  container.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === nextActiveKey ? "active" : ""}"
          data-${dataAttr}="${ctx.escapeHtml(entry.key)}"
        >
          <span class="tab-label">${ctx.escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function buildDetailEntries(ctx, products, tier) {
  if (!tier || tier === "all" || tier === "bundle") return [];
  const subset = (products || []).filter(
    (product) => !ctx.isBundle(product) && ctx.getTierKey(product) === tier
  );
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
      const key = getGoldSubcategory(ctx, product);
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(labels)
      .filter(([key]) => key === "all" || counts[key] > 0)
      .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
  }

  const counts = new Map();
  for (const product of subset) {
    const key = getNameSubcategoryKey(product);
    counts.set(key, {
      key,
      label: String(product?.name || "未命名"),
      count: (counts.get(key)?.count || 0) + 1,
    });
  }

  return [
    { key: "all", label: `全部${ctx.getTierLabelByKey(tier)}`, count: subset.length },
    ...Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label), "zh-Hans-CN")
    ),
  ];
}

function renderDetailTabs(ctx, container, products, tier, activeKey, dataAttr = "detail") {
  if (!container) return activeKey;
  const entries = buildDetailEntries(ctx, products || [], tier);
  if (entries.length <= 1) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return "all";
  }

  const validKeys = new Set(entries.map((entry) => entry.key));
  const nextActiveKey = validKeys.has(activeKey) ? activeKey : "all";
  container.classList.remove("hidden");
  container.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === nextActiveKey ? "active" : ""}"
          data-${dataAttr}="${ctx.escapeHtml(entry.key)}"
        >
          <span class="tab-label">${ctx.escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function getFullnessKey(ctx, product) {
  const attackFull = ctx.isAttackFull(product);
  const hpFull = ctx.isHpFull(product);
  if (attackFull && hpFull) return "double_full";
  if (attackFull) return "attack_full";
  if (hpFull) return "hp_full";
  return "none_full";
}

function buildFullnessEntries(ctx, products, enabled) {
  if (!enabled) return [];
  const subset = (products || []).filter((product) => !ctx.isBundle(product));
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
    const key = getFullnessKey(ctx, product);
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderFullnessTabs(ctx, container, products, enabled, activeKey, dataAttr = "fullness") {
  if (!container) return activeKey;
  const entries = buildFullnessEntries(ctx, products || [], enabled);
  if (entries.length <= 1) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return "all";
  }

  const validKeys = new Set(entries.map((entry) => entry.key));
  const nextActiveKey = validKeys.has(activeKey) ? activeKey : "all";
  container.classList.remove("hidden");
  container.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === nextActiveKey ? "active" : ""}"
          data-${dataAttr}="${ctx.escapeHtml(entry.key)}"
        >
          <span class="tab-label">${ctx.escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function getPagedProducts(state, products) {
  const total = Array.isArray(products) ? products.length : 0;
  const pageSize = Number(state.pageSize || 12);
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const page = Math.min(Math.max(Number(state.page || 1), 1), Math.max(totalPages, 1));

  state.page = page;
  state.total = total;
  state.totalPages = totalPages;

  if (total === 0) {
    return [];
  }

  const start = (page - 1) * pageSize;
  return products.slice(start, start + pageSize);
}

function renderPagination(container, state, dataAttr, emptyText) {
  if (!container) return;

  const total = Number(state.total || 0);
  const page = Math.max(Number(state.page || 1), 1);
  const totalPages = Math.max(Number(state.totalPages || 0), 0);

  if (total === 0) {
    container.innerHTML = `<div class="pagination-meta">${emptyText}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="pagination-meta">第 ${page} / ${Math.max(totalPages, 1)} 页，共 ${total} 件商品</div>
    <div class="pagination-actions">
      <button
        class="ghost"
        type="button"
        data-${dataAttr}="${Math.max(page - 1, 1)}"
        ${page <= 1 ? "disabled" : ""}
      >上一页</button>
      <button
        class="ghost"
        type="button"
        data-${dataAttr}="${Math.min(page + 1, Math.max(totalPages, 1))}"
        ${totalPages === 0 || page >= totalPages ? "disabled" : ""}
      >下一页</button>
    </div>
  `;
}

function filterProductsByCategory(ctx, products, category) {
  if (!category || category === "all") return products || [];
  if (category === "current_season") {
    return (products || []).filter(
      (product) => !ctx.isBundle(product) && ctx.isCurrentSeasonProduct(product)
    );
  }
  if (category === "legacy_season") {
    return (products || []).filter(
      (product) => !ctx.isBundle(product) && !ctx.isCurrentSeasonProduct(product)
    );
  }
  return (products || []).filter((product) => ctx.getProductCategory(product) === category);
}

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
}

function buildProductSearchText(product) {
  return [
    product?.name,
    product?.legacy_id,
    product?.uid,
    product?.ext_attrs,
    product?.item_id,
    product?.description,
  ]
    .map((item) => String(item || "").trim().toLowerCase())
    .join(" ");
}

function filterProductsByKeyword(products, keyword) {
  const needle = normalizeSearchText(keyword);
  if (!needle) return products || [];
  return (products || []).filter((product) => buildProductSearchText(product).includes(needle));
}

function filterProductsBySubcategory(ctx, products, category, subcategory) {
  if (!category || category === "bundle") return products || [];
  if (!subcategory || subcategory === "all") return products || [];
  return (products || []).filter((product) => ctx.getTierKey(product) === subcategory);
}

function filterProductsByDetail(ctx, products, tier, detail) {
  if (!tier || tier === "all" || tier === "bundle") return products || [];
  if (!detail || detail === "all") return products || [];
  if (tier === "gold") {
    return (products || []).filter((product) => getGoldSubcategory(ctx, product) === detail);
  }
  return (products || []).filter((product) => getNameSubcategoryKey(product) === detail);
}

function filterProductsByFullness(ctx, products, fullness) {
  if (!fullness || fullness === "all") return products || [];
  return (products || []).filter((product) => getFullnessKey(ctx, product) === fullness);
}

function getTierOrder(ctx, product) {
  const mapping = {
    gold: 6,
    red: 5,
    orange: 4,
    purple: 3,
    blue: 2,
    green: 1,
    bundle: 0,
  };
  return mapping[ctx.getTierKey(product)] || 0;
}

function compareShopDefault(ctx, a, b) {
  const aIsBundle = ctx.isBundle(a);
  const bIsBundle = ctx.isBundle(b);
  if (aIsBundle !== bIsBundle) return aIsBundle ? 1 : -1;

  if (aIsBundle && bIsBundle) {
    const rankDiff = Number(a?.display_rank || 999) - Number(b?.display_rank || 999);
    if (rankDiff !== 0) return rankDiff;
    return Number(b?.item_id || 0) - Number(a?.item_id || 0);
  }

  const tierDiff = getTierOrder(ctx, b) - getTierOrder(ctx, a);
  if (tierDiff !== 0) return tierDiff;

  const seasonDiff =
    Number(Boolean(b?.is_current_season)) - Number(Boolean(a?.is_current_season));
  if (seasonDiff !== 0) return seasonDiff;

  const aExt = ctx.parseExtAttrStats(a?.ext_attrs);
  const bExt = ctx.parseExtAttrStats(b?.ext_attrs);
  const kindDiff = bExt.kindRank - aExt.kindRank;
  if (kindDiff !== 0) return kindDiff;

  const totalDiff = bExt.total - aExt.total;
  if (totalDiff !== 0) return totalDiff;

  const fireDiff = bExt.fire - aExt.fire;
  if (fireDiff !== 0) return fireDiff;

  const calmDiff = bExt.calm - aExt.calm;
  if (calmDiff !== 0) return calmDiff;

  const attackDiff = Number(b?.attack_value || 0) - Number(a?.attack_value || 0);
  if (attackDiff !== 0) return attackDiff;

  const hpDiff = Number(b?.hp_value || 0) - Number(a?.hp_value || 0);
  if (hpDiff !== 0) return hpDiff;

  const priceDiff = Number(b?.price_quota || 0) - Number(a?.price_quota || 0);
  if (priceDiff !== 0) return priceDiff;

  return Number(b?.item_id || 0) - Number(a?.item_id || 0);
}

function sortProducts(ctx, products, sortMode) {
  const list = [...(products || [])];
  const compareDefault = (a, b) => compareShopDefault(ctx, a, b);
  const sorters = {
    shop_default: compareDefault,
    price_asc: (a, b) => Number(a.price_quota || 0) - Number(b.price_quota || 0) || compareDefault(a, b),
    price_desc: (a, b) => Number(b.price_quota || 0) - Number(a.price_quota || 0) || compareDefault(a, b),
    attack_desc: (a, b) => Number(b.attack_value || 0) - Number(a.attack_value || 0) || compareDefault(a, b),
    attack_asc: (a, b) => Number(a.attack_value || 0) - Number(b.attack_value || 0) || compareDefault(a, b),
    hp_desc: (a, b) => Number(b.hp_value || 0) - Number(a.hp_value || 0) || compareDefault(a, b),
    hp_asc: (a, b) => Number(a.hp_value || 0) - Number(b.hp_value || 0) || compareDefault(a, b),
  };
  list.sort(sorters[sortMode] || sorters.shop_default);
  return list;
}

export function renderProducts(ctx, products) {
  const pagedProducts = getPagedProducts(ctx.getProductPaginationState(), products);

  if (!products || products.length === 0) {
    ctx.productGrid.innerHTML = '<div class="stack-item">当前分类下没有已上架商品。</div>';
    renderPagination(ctx.productPagination, ctx.getProductPaginationState(), "product-page", "当前共 0 件商品。");
    return;
  }

  const policyNotice = ctx.getQuotaPurchasePageNotice
    ? ctx.getQuotaPurchasePageNotice(products)
    : "";
  ctx.productGrid.innerHTML = `
    ${policyNotice ? `<div class="product-grid-policy-note">${ctx.escapeHtml(policyNotice)}</div>` : ""}
    ${pagedProducts.map((product) => ctx.renderProductCard(product)).join("")}
  `;
  ctx.bindImageFallbacks(ctx.productGrid);
  renderPagination(ctx.productPagination, ctx.getProductPaginationState(), "product-page", "当前共 0 件商品。");
}

export function renderDiscountProducts(ctx, products) {
  if (!ctx.discountProductsSection || !ctx.discountProductGrid) return;
  const allDiscountedProducts = ctx.getDiscountedProducts(ctx.getAllProducts());
  const discountedProducts = (products || []).filter((product) => ctx.isDiscountedProduct(product));
  const hasAnyDiscounts = allDiscountedProducts.length > 0;
  ctx.discountProductsSection.classList.toggle("hidden", !hasAnyDiscounts);
  ctx.syncDiscountDockVisibility(hasAnyDiscounts);
  if (!hasAnyDiscounts) {
    ctx.discountProductGrid.innerHTML = "";
    const state = ctx.getDiscountPaginationState();
    state.page = 1;
    state.total = 0;
    state.totalPages = 0;
    renderPagination(ctx.discountProductPagination, state, "discount-page", "当前筛选下没有打折商品。");
    ctx.syncDockWithViewport();
    return;
  }
  if (!discountedProducts.length) {
    ctx.discountProductGrid.innerHTML = '<div class="stack-item">当前筛选下没有打折商品。</div>';
    const state = ctx.getDiscountPaginationState();
    state.page = 1;
    state.total = 0;
    state.totalPages = 0;
    renderPagination(ctx.discountProductPagination, state, "discount-page", "当前筛选下没有打折商品。");
    ctx.syncDockWithViewport();
    return;
  }
  const pagedDiscountProducts = getPagedProducts(ctx.getDiscountPaginationState(), discountedProducts);
  const policyNotice = ctx.getQuotaPurchasePageNotice
    ? ctx.getQuotaPurchasePageNotice(discountedProducts)
    : "";
  ctx.discountProductGrid.innerHTML = `
    ${policyNotice ? `<div class="product-grid-policy-note">${ctx.escapeHtml(policyNotice)}</div>` : ""}
    ${pagedDiscountProducts.map((product) => ctx.renderProductCard(product)).join("")}
  `;
  ctx.bindImageFallbacks(ctx.discountProductGrid);
  renderPagination(ctx.discountProductPagination, ctx.getDiscountPaginationState(), "discount-page", "当前筛选下没有打折商品。");
  ctx.syncDockWithViewport();
}

export function applyProductView(ctx, options = {}) {
  const { resetPage = false } = options;
  if (resetPage) {
    ctx.getProductPaginationState().page = 1;
  }
  const keywordFiltered = filterProductsByKeyword(ctx.getAllProducts(), ctx.getKeywordValue());
  ctx.setActiveCategory(
    renderCategoryTabs(ctx, ctx.productCategoryTabs, keywordFiltered, ctx.getActiveCategory(), "category")
  );
  const categoryFiltered = filterProductsByCategory(ctx, keywordFiltered, ctx.getActiveCategory());
  ctx.setActiveSubcategory(
    renderSubcategoryTabs(
      ctx,
      ctx.productSubcategoryTabs,
      categoryFiltered,
      ctx.getActiveCategory(),
      ctx.getActiveSubcategory(),
      "subcategory"
    )
  );
  const subcategoryFiltered = filterProductsBySubcategory(
    ctx,
    categoryFiltered,
    ctx.getActiveCategory(),
    ctx.getActiveSubcategory()
  );
  ctx.setActiveDetail(
    renderDetailTabs(
      ctx,
      ctx.productDetailTabs,
      categoryFiltered,
      ctx.getActiveSubcategory(),
      ctx.getActiveDetail(),
      "detail"
    )
  );
  const detailFiltered = filterProductsByDetail(
    ctx,
    subcategoryFiltered,
    ctx.getActiveSubcategory(),
    ctx.getActiveDetail()
  );
  ctx.setActiveFullness(
    renderFullnessTabs(
      ctx,
      ctx.productFullnessTabs,
      detailFiltered,
      ctx.getActiveCategory() !== "bundle" && ctx.getActiveSubcategory() !== "all",
      ctx.getActiveFullness(),
      "fullness"
    )
  );
  const filtered = filterProductsByFullness(ctx, detailFiltered, ctx.getActiveFullness());
  const currentProducts = sortProducts(ctx, filtered, ctx.getSortValue());
  ctx.setCurrentProducts(currentProducts);
  renderProducts(ctx, currentProducts);
}

export function applyDiscountView(ctx, options = {}) {
  const { resetPage = false } = options;
  if (resetPage) {
    ctx.getDiscountPaginationState().page = 1;
  }

  const allDiscountedProducts = ctx.getDiscountedProducts(ctx.getAllProducts());
  const keywordFiltered = filterProductsByKeyword(allDiscountedProducts, ctx.getDiscountKeywordValue());
  ctx.setActiveDiscountCategory(
    renderCategoryTabs(
      ctx,
      ctx.discountCategoryTabs,
      keywordFiltered,
      ctx.getActiveDiscountCategory(),
      "discount-category"
    )
  );
  const categoryFiltered = filterProductsByCategory(
    ctx,
    keywordFiltered,
    ctx.getActiveDiscountCategory()
  );
  ctx.setActiveDiscountSubcategory(
    renderSubcategoryTabs(
      ctx,
      ctx.discountSubcategoryTabs,
      categoryFiltered,
      ctx.getActiveDiscountCategory(),
      ctx.getActiveDiscountSubcategory(),
      "discount-subcategory"
    )
  );
  const subcategoryFiltered = filterProductsBySubcategory(
    ctx,
    categoryFiltered,
    ctx.getActiveDiscountCategory(),
    ctx.getActiveDiscountSubcategory()
  );
  ctx.setActiveDiscountDetail(
    renderDetailTabs(
      ctx,
      ctx.discountDetailTabs,
      categoryFiltered,
      ctx.getActiveDiscountSubcategory(),
      ctx.getActiveDiscountDetail(),
      "discount-detail"
    )
  );
  const detailFiltered = filterProductsByDetail(
    ctx,
    subcategoryFiltered,
    ctx.getActiveDiscountSubcategory(),
    ctx.getActiveDiscountDetail()
  );
  ctx.setActiveDiscountFullness(
    renderFullnessTabs(
      ctx,
      ctx.discountFullnessTabs,
      detailFiltered,
      ctx.getActiveDiscountCategory() !== "bundle" && ctx.getActiveDiscountSubcategory() !== "all",
      ctx.getActiveDiscountFullness(),
      "discount-fullness"
    )
  );
  const filtered = filterProductsByFullness(ctx, detailFiltered, ctx.getActiveDiscountFullness());
  const currentDiscountProducts = sortProducts(ctx, filtered, ctx.getDiscountSortValue());
  ctx.setCurrentDiscountProducts(currentDiscountProducts);
  renderDiscountProducts(ctx, currentDiscountProducts);
}
