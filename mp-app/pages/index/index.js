const { request } = require("../../utils/request");
const { API_BASE_URL } = require("../../utils/config");
const { STORE_COPY } = require("../../utils/store-copy");

const CATEGORY_ORDER = ["all", "atlas", "bundle", "gold", "red", "orange", "purple", "blue", "green"];

function normalizeImageUrl(imageUrl) {
  const value = String(imageUrl || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  if (value.startsWith("./")) return `${API_BASE_URL}/${value.slice(2)}`;
  return `${API_BASE_URL}/${value}`;
}

function isBundle(product) {
  return product?.item_kind === "bundle";
}

function isAtlasBundle(product) {
  if (!isBundle(product)) return false;
  const text = `${product.name || ""} ${product.description || ""} ${product.uid || ""}`;
  return /图鉴/.test(text) || String(product.uid || "").startsWith("atlas_");
}

function getTierKey(product) {
  if (isAtlasBundle(product)) return "atlas";
  if (isBundle(product)) return "bundle";

  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 500) return "gold";
  if (legacyId >= 400) return "red";
  if (legacyId >= 300) return "orange";
  if (legacyId >= 200) return "purple";
  if (legacyId >= 100) return "blue";
  return "green";
}

function getTierMeta(product) {
  const key = getTierKey(product);
  const map = {
    atlas: { key, label: "图鉴", className: "theme-atlas", cardLabel: "图鉴套餐" },
    bundle: { key, label: "套餐", className: "theme-bundle", cardLabel: "套餐商品" },
    gold: { key, label: "天阶", className: "theme-gold", cardLabel: "金卡" },
    red: { key, label: "绝品", className: "theme-red", cardLabel: "红卡" },
    orange: { key, label: "珍品", className: "theme-orange", cardLabel: "橙卡" },
    purple: { key, label: "奇品", className: "theme-purple", cardLabel: "紫卡" },
    blue: { key, label: "良品", className: "theme-blue", cardLabel: "蓝卡" },
    green: { key, label: "基础", className: "theme-green", cardLabel: "绿卡" },
  };
  return map[key];
}

function buildCategoryList(products) {
  const labels = {
    all: "全部",
    atlas: "图鉴",
    bundle: "套餐",
    gold: "金卡",
    red: "红卡",
    orange: "橙卡",
    purple: "紫卡",
    blue: "蓝卡",
    green: "绿卡",
  };

  const counts = products.reduce(
    (acc, product) => {
      const key = getTierKey(product);
      acc.all += 1;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { all: 0 }
  );

  return CATEGORY_ORDER.filter((key) => key === "all" || counts[key] > 0).map((key) => ({
    key,
    label: labels[key],
    count: counts[key] || 0,
  }));
}

function buildSearchBlob(product) {
  return [
    product.name,
    product.uid,
    product.main_attrs,
    product.ext_attrs,
    product.description,
    product.legacy_id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getTermCount(product) {
  if (isBundle(product)) return 0;
  const text = String(product?.ext_attrs || "").trim();
  if (!text || text === "无") return 0;
  return [...text.matchAll(/(走火(?:入魔)?|气定(?:神闲)?)\s*[0-9.]+/g)].length;
}

function parseTermValues(product) {
  const text = String(product?.ext_attrs || "").trim();
  const result = { fire: 0, calm: 0 };
  if (!text || text === "无") return result;

  for (const match of text.matchAll(/走火(?:入魔)?\s*([0-9.]+)/g)) {
    result.fire += Number(match[1]) || 0;
  }
  for (const match of text.matchAll(/气定(?:神闲)?\s*([0-9.]+)/g)) {
    result.calm += Number(match[1]) || 0;
  }
  return result;
}

function dedupeByUid(products) {
  const seen = new Set();
  const output = [];
  for (const product of products) {
    const key = String(product.uid || `${product.item_kind}-${product.item_id}`);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(product);
  }
  return output;
}

function pickTierRepresentatives(cards, tierKeys) {
  const result = [];
  for (const tierKey of tierKeys) {
    const match = cards.find((item) => getTierKey(item) === tierKey);
    if (match) result.push(match);
  }
  return result;
}

function compareByAttackDesc(a, b) {
  return (
    Number(b.attack_value || 0) - Number(a.attack_value || 0) ||
    Number(b.hp_value || 0) - Number(a.hp_value || 0) ||
    Number(b.legacy_id || 0) - Number(a.legacy_id || 0) ||
    Number(a.item_id || 0) - Number(b.item_id || 0)
  );
}

function compareByLegacyThenAttack(a, b) {
  return Number(b.legacy_id || 0) - Number(a.legacy_id || 0) || compareByAttackDesc(a, b);
}

function compareShopDefault(a, b) {
  if (isBundle(a) || isBundle(b)) {
    if (isBundle(a) && isBundle(b)) {
      return Number(a.display_rank || 999) - Number(b.display_rank || 999);
    }
    return isBundle(a) ? -1 : 1;
  }

  const legacyDiff = Number(b.legacy_id || 0) - Number(a.legacy_id || 0);
  if (legacyDiff !== 0) return legacyDiff;

  const termCountDiff = getTermCount(b) - getTermCount(a);
  if (termCountDiff !== 0) return termCountDiff;

  const aTerms = parseTermValues(a);
  const bTerms = parseTermValues(b);
  const totalTermDiff = bTerms.fire + bTerms.calm - (aTerms.fire + aTerms.calm);
  if (totalTermDiff !== 0) return totalTermDiff;

  const fireDiff = bTerms.fire - aTerms.fire;
  if (fireDiff !== 0) return fireDiff;

  const calmDiff = bTerms.calm - aTerms.calm;
  if (calmDiff !== 0) return calmDiff;

  const attackDiff = Number(b.attack_value || 0) - Number(a.attack_value || 0);
  if (attackDiff !== 0) return attackDiff;

  const hpDiff = Number(b.hp_value || 0) - Number(a.hp_value || 0);
  if (hpDiff !== 0) return hpDiff;

  return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
}

function pickBundlePreviewCards(bundle, allProducts) {
  const code = String(bundle.uid || bundle.code || "");
  const cards = allProducts.filter((item) => !isBundle(item));
  let selected = [];
  let fallback = cards.slice();
  let targetSize = 4;

  if (code === "atlas_orange_and_below") {
    const pool = cards.filter((item) =>
      ["orange", "purple", "blue", "green"].includes(getTierKey(item))
    );
    selected = pickTierRepresentatives(pool, ["orange", "purple", "blue", "green"]);
    fallback = pool;
  } else if (code === "atlas_red_and_below") {
    const pool = cards.filter((item) =>
      ["red", "orange", "purple", "blue"].includes(getTierKey(item))
    );
    selected = pickTierRepresentatives(pool, ["red", "orange", "purple", "blue"]);
    fallback = pool;
  } else if (code === "atlas_full_attack_set" || code === "atlas_high_attack_full_dex") {
    const pool = cards.filter((item) => Number(item.attack_value || 0) > 0);
    selected = pickTierRepresentatives(pool, ["gold", "red", "orange", "purple", "blue", "green"]);
    fallback = code === "atlas_high_attack_full_dex"
      ? pool.slice().sort(compareByLegacyThenAttack)
      : pool.slice().sort(compareByAttackDesc);
    targetSize = 6;
  }

  return dedupeByUid([...selected, ...fallback]).slice(0, targetSize);
}

function buildCover(product, allProducts) {
  const directCover = normalizeImageUrl(product.image_url);
  if (directCover) {
    return {
      cover_mode: "single",
      cover_url: directCover,
      cover_images: [],
      cover_text: getTierMeta(product).label,
    };
  }

  if (isAtlasBundle(product)) {
    const coverImages = pickBundlePreviewCards(product, allProducts)
      .map((item, index) => ({
        key: `${product.item_id}-${index}`,
        url: normalizeImageUrl(item.image_url),
      }))
      .filter((item) => item.url);

    if (coverImages.length > 0) {
      return {
        cover_mode: "collage",
        cover_url: "",
        cover_images: coverImages,
        cover_text: "图鉴",
      };
    }
  }

  return {
    cover_mode: "fallback",
    cover_url: "",
    cover_images: [],
    cover_text: getTierMeta(product).label,
  };
}

function normalizeSummary(product) {
  if (isBundle(product)) {
    return String(product.description || product.main_attrs || "图鉴和套餐商品");
  }

  const text = String(product.ext_attrs || product.main_attrs || "").trim();
  if (!text || text === "无") return "无额外词条";
  return text;
}

function normalizeProduct(product, index, allProducts) {
  const tierMeta = getTierMeta(product);
  const cover = buildCover(product, allProducts);

  return {
    ...product,
    list_key: `${product.item_kind || "card"}-${product.item_id}-${index}`,
    category_key: tierMeta.key,
    tier_label: tierMeta.label,
    theme_class: tierMeta.className,
    item_kind_label: tierMeta.cardLabel,
    summary: normalizeSummary(product),
    attack_label: product.attack_value ? String(product.attack_value) : "-",
    hp_label: product.hp_value ? String(product.hp_value) : "-",
    price_label: Number(product.price_quota || 0),
    search_blob: buildSearchBlob(product),
    ...cover,
  };
}

Page({
  data: {
    loading: false,
    error: "",
    keyword: "",
    activeCategory: "all",
    products: [],
    filteredProducts: [],
    categories: [],
    storeCopy: STORE_COPY,
  },

  onLoad() {
    this.loadProducts();
  },

  onShow() {
    const app = getApp();
    if (app.globalData.productListNeedsRefresh) {
      app.globalData.productListNeedsRefresh = false;
      this.loadProducts();
    }
  },

  onPullDownRefresh() {
    this.loadProducts({ silent: true });
  },

  async loadProducts(options = {}) {
    this.setData({ loading: !options.silent, error: "" });
    try {
      const products = await request("/products");
      const rawProducts = Array.isArray(products) ? products : [];
      const normalized = rawProducts.map((product, index) =>
        normalizeProduct(product, index, rawProducts)
      );
      normalized.sort(compareShopDefault);
      this.setData({
        products: normalized,
        categories: buildCategoryList(normalized),
      });
      this.applyFilters(normalized, this.data.keyword, this.data.activeCategory);
    } catch (error) {
      this.setData({
        error: error?.error || error?.message || "商品加载失败",
        products: [],
        filteredProducts: [],
        categories: [],
      });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  applyFilters(products, keyword, activeCategory) {
    const nextKeyword = String(keyword || "").trim().toLowerCase();
    const filteredProducts = (products || []).filter((product) => {
      const matchedCategory = activeCategory === "all" || product.category_key === activeCategory;
      const matchedKeyword = !nextKeyword || product.search_blob.includes(nextKeyword);
      return matchedCategory && matchedKeyword;
    }).sort(compareShopDefault);

    this.setData({
      filteredProducts,
      keyword,
      activeCategory,
    });
  },

  onKeywordInput(event) {
    const keyword = event.detail.value || "";
    this.applyFilters(this.data.products, keyword, this.data.activeCategory);
  },

  clearKeyword() {
    this.applyFilters(this.data.products, "", this.data.activeCategory);
  },

  selectCategory(event) {
    const category = event.currentTarget.dataset.category || "all";
    this.applyFilters(this.data.products, this.data.keyword, category);
  },

  openProductDetail(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const itemKind = event.currentTarget.dataset.itemKind || "card";
    if (!itemId) return;

    wx.navigateTo({
      url: `/pages/product-detail/product-detail?item_id=${itemId}&item_kind=${itemKind}`,
    });
  },

  goMallTab() {},

  goAccountTab() {
    wx.reLaunch({
      url: "/pages/account/account",
    });
  },
});
