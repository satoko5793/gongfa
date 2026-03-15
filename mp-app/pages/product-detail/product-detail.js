const { request } = require("../../utils/request");
const { loadSession } = require("../../utils/session");
const { API_BASE_URL } = require("../../utils/config");

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

function getThemeMeta(product) {
  const key = getTierKey(product);
  const map = {
    atlas: { className: "theme-atlas", label: "图鉴" },
    bundle: { className: "theme-bundle", label: "套餐" },
    gold: { className: "theme-gold", label: "天阶" },
    red: { className: "theme-red", label: "绝品" },
    orange: { className: "theme-orange", label: "珍品" },
    purple: { className: "theme-purple", label: "奇品" },
    blue: { className: "theme-blue", label: "良品" },
    green: { className: "theme-green", label: "基础" },
  };
  return map[key];
}

function getStatusLabel(status) {
  switch (status) {
    case "on_sale":
      return "在售";
    case "sold":
      return "已售罄";
    case "off_sale":
      return "已下架";
    default:
      return status || "-";
  }
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").trim();
  if (!text || text === "无") return fallback;
  return text;
}

function getReferenceCaps(product) {
  return product?.pricing_meta?.reference_caps && typeof product.pricing_meta.reference_caps === "object"
    ? product.pricing_meta.reference_caps
    : {};
}

function isFullByCap(currentValue, capValue) {
  const current = Number(currentValue) || 0;
  const cap = Number(capValue) || 0;
  return cap > 0 && current >= cap;
}

function parseTermTotals(product) {
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

function parseTermBadges(product) {
  const text = String(product?.ext_attrs || "").trim();
  if (!text || text === "无") return [];

  const caps = getReferenceCaps(product);
  const totals = parseTermTotals(product);

  return text
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => {
      if (item.startsWith("走火")) {
        return {
          key: `term-fire-${index}`,
          label: item,
          kind: "fire",
          isFull: isFullByCap(totals.fire, caps.fire_total_max),
        };
      }
      if (item.startsWith("气定")) {
        return {
          key: `term-calm-${index}`,
          label: item,
          kind: "calm",
          isFull: isFullByCap(totals.calm, caps.calm_total_max),
        };
      }
      return {
        key: `term-plain-${index}`,
        label: item,
        kind: "plain",
        isFull: false,
      };
    });
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

async function buildBundleCover(product) {
  const directCover = normalizeImageUrl(product.image_url);
  if (directCover) {
    return {
      cover_mode: "single",
      cover_url: directCover,
      cover_images: [],
    };
  }

  if (!isAtlasBundle(product)) {
    return {
      cover_mode: "fallback",
      cover_url: "",
      cover_images: [],
    };
  }

  try {
    const allProducts = await request("/products");
    const coverImages = pickBundlePreviewCards(product, Array.isArray(allProducts) ? allProducts : [])
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
      };
    }
  } catch {
    // Ignore and keep fallback.
  }

  return {
    cover_mode: "fallback",
    cover_url: "",
    cover_images: [],
  };
}

Page({
  data: {
    loading: false,
    submitting: false,
    error: "",
    notice: "",
    orderResult: null,
    product: null,
    itemId: 0,
    itemKind: "card",
    session: null,
  },

  onLoad(query) {
    const itemId = Number(query.item_id || query.id || 0);
    const itemKind = query.item_kind || "card";

    if (!itemId) {
      this.setData({ error: "缺少商品 ID。" });
      return;
    }

    this.setData({ itemId, itemKind });
    this.syncSession();
    this.loadProduct(itemId, itemKind);
  },

  onShow() {
    this.syncSession();
  },

  syncSession() {
    const app = getApp();
    const session = loadSession();
    app.globalData.session = session;
    this.setData({ session });
  },

  async loadProduct(itemId, itemKind) {
    this.setData({ loading: true, error: "", product: null });
    try {
      const product = await request(`/products/${itemId}?item_kind=${itemKind}`);
      const themeMeta = getThemeMeta(product);
      const cover = await buildBundleCover(product);
      const caps = getReferenceCaps(product);

      this.setData({
        product: {
          ...product,
          ...cover,
          theme_class: themeMeta.className,
          tier_label: themeMeta.label,
          status_label: getStatusLabel(product.status),
          main_attrs_label: normalizeText(product.main_attrs),
          ext_attrs_label: normalizeText(product.ext_attrs),
          attack_is_full: isFullByCap(product.attack_value, caps.attack_max),
          hp_is_full: isFullByCap(product.hp_value, caps.hp_max),
          term_badges: parseTermBadges(product),
        },
      });
    } catch (error) {
      this.setData({
        error: error?.error || error?.message || "商品详情加载失败。",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  goToAccount() {
    wx.navigateTo({
      url: "/pages/account/account",
    });
  },

  goToOrders() {
    this.goToAccount();
  },

  goMallTab() {
    wx.reLaunch({
      url: "/pages/index/index",
    });
  },

  goAccountTab() {
    wx.reLaunch({
      url: "/pages/account/account",
    });
  },

  async submitOrder() {
    if (!this.data.session?.token) {
      this.setData({ notice: "请先登录后再购买。"});
      this.goToAccount();
      return;
    }

    const product = this.data.product;
    if (!product) return;

    try {
      const quota = await request("/me/quota");
      const currentBalance = Number(quota?.balance ?? 0);
      const price = Number(product.price_quota || 0);
      const remaining = currentBalance - price;

      if (remaining < 0) {
        this.setData({ notice: `额度不足，还差 ${Math.abs(remaining)}。` });
        return;
      }

      const modalResult = await new Promise((resolve) => {
        wx.showModal({
          title: "确认购买",
          content: `商品：${product.name}
扣除额度：${price}
购买后剩余：${remaining}`,
          confirmText: "确认购买",
          cancelText: "暂不购买",
          success: resolve,
          fail: () => resolve({ confirm: false }),
        });
      });

      if (!modalResult.confirm) {
        this.setData({ notice: "已取消本次购买。"});
        return;
      }

      this.setData({ submitting: true, notice: "", orderResult: null });
      const order = await request("/orders", {
        method: "POST",
        data: {
          item_id: Number(product.item_id),
          item_kind: product.item_kind || this.data.itemKind || "card",
        },
      });
      const latestQuota = await request("/me/quota");

      const app = getApp();
      app.globalData.accountNeedsRefresh = true;
      app.globalData.productListNeedsRefresh = true;
      app.globalData.lastCreatedOrder = {
        id: order.id,
        status: order.status,
        total_quota: order.total_quota,
      };

      this.setData({
        notice: `下单成功，订单 #${order.id} 已创建。`,
        orderResult: {
          id: order.id,
          status: getStatusLabel(order.status),
          total_quota: order.total_quota,
          remaining_balance: Number(latestQuota?.balance ?? remaining),
        },
      });

      await this.loadProduct(this.data.itemId, this.data.itemKind);
    } catch (error) {
      const message =
        error?.details && Array.isArray(error.details) && error.details.length > 0
          ? error.details.join(", ")
          : error?.error || error?.message || "下单失败";
      this.setData({
        notice: `下单失败：${message}`,
      });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
