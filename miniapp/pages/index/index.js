const { request } = require("../../utils/request");

Page({
  data: {
    loading: false,
    error: "",
    products: [],
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

  async loadProducts() {
    this.setData({ loading: true, error: "" });
    try {
      const products = await request("/products");
      this.setData({ products: Array.isArray(products) ? products : [] });
    } catch (error) {
      this.setData({
        error: error?.error || error?.message || "商品加载失败",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  openProductDetail(event) {
    const itemId = event.currentTarget.dataset.itemId;
    const itemKind = event.currentTarget.dataset.itemKind || "card";
    if (!itemId) return;

    wx.navigateTo({
      url: `/pages/product-detail/product-detail?item_id=${itemId}&item_kind=${itemKind}`,
    });
  },
});
