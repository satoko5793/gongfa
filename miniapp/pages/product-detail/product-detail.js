const { request } = require("../../utils/request");
const { loadSession } = require("../../utils/session");

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
      this.setData({ product });
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

  async submitOrder() {
    if (!this.data.session?.token) {
      this.setData({ notice: "请先登录后再购买。" });
      this.goToAccount();
      return;
    }

    const product = this.data.product;
    if (!product) return;

    this.setData({ submitting: true, notice: "", orderResult: null });
    try {
      const order = await request("/orders", {
        method: "POST",
        data: {
          item_id: Number(product.item_id),
          item_kind: product.item_kind || this.data.itemKind || "card",
        },
      });

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
          status: order.status,
          total_quota: order.total_quota,
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
