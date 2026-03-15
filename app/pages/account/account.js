const { request } = require("../../utils/request");
const { loadSession, saveSession, clearSession } = require("../../utils/session");
const { STORE_COPY } = require("../../utils/store-copy");

function pickErrorMessage(error, fallback) {
  if (error?.details && Array.isArray(error.details) && error.details.length > 0) {
    return error.details.join(", ");
  }
  return error?.error || error?.message || fallback;
}

function formatDate(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").replace(".000Z", "").replace("Z", "");
}

function formatOrderStatus(status) {
  switch (status) {
    case "pending":
      return { label: "待处理", className: "status-pending" };
    case "confirmed":
      return { label: "已确认", className: "status-confirmed" };
    case "cancelled":
      return { label: "已取消", className: "status-cancelled" };
    default:
      return { label: status || "-", className: "status-neutral" };
  }
}

function formatOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "暂无商品明细";
  }

  const firstName = items[0]?.product_name || "未命名商品";
  if (items.length === 1) {
    return firstName;
  }

  return `${firstName} 等 ${items.length} 件商品`;
}

Page({
  data: {
    loading: false,
    submitting: false,
    notice: "",
    session: null,
    profile: null,
    quota: null,
    orders: [],
    registerForm: {
      game_role_id: "",
      game_role_name: "",
      password: "",
    },
    loginForm: {
      game_role_id: "",
      password: "",
    },
    storeCopy: STORE_COPY,
  },

  onLoad() {
    this.syncSessionFromStorage();
  },

  onShow() {
    const app = getApp();
    this.syncSessionFromStorage();

    if (app.globalData.lastCreatedOrder) {
      const order = app.globalData.lastCreatedOrder;
      this.setNotice(`最近下单：订单 #${order.id}，状态 ${formatOrderStatus(order.status).label}。`);
      app.globalData.lastCreatedOrder = null;
    }

    if (
      this.data.session?.token &&
      (!this.data.profile || app.globalData.accountNeedsRefresh)
    ) {
      app.globalData.accountNeedsRefresh = false;
      this.loadAccount();
    }
  },

  syncSessionFromStorage() {
    const app = getApp();
    const session = loadSession();
    app.globalData.session = session;
    this.setData({ session });
  },

  setNotice(message) {
    this.setData({ notice: message || "" });
  },

  onRegisterInput(event) {
    const field = event.currentTarget.dataset.field;
    if (!field) return;
    this.setData({
      [`registerForm.${field}`]: event.detail.value,
    });
  },

  onLoginInput(event) {
    const field = event.currentTarget.dataset.field;
    if (!field) return;
    this.setData({
      [`loginForm.${field}`]: event.detail.value,
    });
  },

  async submitRegister() {
    const form = this.data.registerForm;
    this.setData({ submitting: true });
    this.setNotice("");

    try {
      const result = await request("/auth/register", {
        method: "POST",
        data: {
          game_role_id: String(form.game_role_id || "").trim(),
          game_role_name: String(form.game_role_name || "").trim(),
          password: String(form.password || ""),
        },
      });

      const app = getApp();
      app.globalData.session = result;
      app.globalData.accountNeedsRefresh = false;
      saveSession(result);

      this.setData({
        session: result,
        registerForm: {
          game_role_id: "",
          game_role_name: "",
          password: "",
        },
      });

      this.setNotice("注册成功，已自动登录。");
      await this.loadAccount();
    } catch (error) {
      this.setNotice(`注册失败：${pickErrorMessage(error, "注册失败")}`);
    } finally {
      this.setData({ submitting: false });
    }
  },

  async submitLogin() {
    const form = this.data.loginForm;
    this.setData({ submitting: true });
    this.setNotice("");

    try {
      const result = await request("/auth/login", {
        method: "POST",
        data: {
          game_role_id: String(form.game_role_id || "").trim(),
          password: String(form.password || ""),
        },
      });

      const app = getApp();
      app.globalData.session = result;
      app.globalData.accountNeedsRefresh = false;
      saveSession(result);

      this.setData({
        session: result,
        loginForm: {
          game_role_id: "",
          password: "",
        },
      });

      this.setNotice("登录成功。");
      await this.loadAccount();
    } catch (error) {
      this.setNotice(`登录失败：${pickErrorMessage(error, "登录失败")}`);
    } finally {
      this.setData({ submitting: false });
    }
  },

  async loadAccount() {
    this.setData({ loading: true });

    try {
      const [profile, quota, orders] = await Promise.all([
        request("/auth/me"),
        request("/me/quota"),
        request("/me/orders"),
      ]);

      const app = getApp();
      app.globalData.accountNeedsRefresh = false;

      this.setData({
        profile,
        quota,
        orders: Array.isArray(orders)
          ? orders.map((order) => {
              const statusMeta = formatOrderStatus(order.status);
              return {
                ...order,
                created_at_label: formatDate(order.created_at),
                status_label: statusMeta.label,
                status_class: statusMeta.className,
                item_summary: formatOrderItems(order.items),
                item_count: Array.isArray(order.items) ? order.items.length : 0,
                can_request_cancel: order.status === "pending",
                cancel_request_pending: order.status === "cancel_requested",
              };
            })
          : [],
      });
    } catch (error) {
      if (error?.error === "missing_token" || error?.error === "invalid_token") {
        const app = getApp();
        app.globalData.session = null;
        app.globalData.accountNeedsRefresh = false;
        app.globalData.lastCreatedOrder = null;
        clearSession();
        this.setData({
          session: null,
          profile: null,
          quota: null,
          orders: [],
        });
      }
      this.setNotice(`账户加载失败：${pickErrorMessage(error, "账户加载失败")}`);
    } finally {
      this.setData({ loading: false });
    }
  },

  logout() {
    const app = getApp();
    app.globalData.session = null;
    app.globalData.accountNeedsRefresh = false;
    app.globalData.lastCreatedOrder = null;
    clearSession();
    this.setData({
      session: null,
      profile: null,
      quota: null,
      orders: [],
    });
    this.setNotice("已退出登录。");
  },

  async requestCancelOrder(event) {
    const orderId = Number(event.currentTarget.dataset.orderId || 0);
    if (!orderId) return;

    const modalResult = await new Promise((resolve) => {
      wx.showModal({
        title: "申请取消",
        content: "提交后需要管理员审核，通过后才会返还额度，确定继续吗？",
        confirmText: "提交申请",
        cancelText: "先不取消",
        success: resolve,
        fail: () => resolve({ confirm: false }),
      });
    });

    if (!modalResult.confirm) return;

    this.setData({ submitting: true });
    try {
      await request(`/orders/${orderId}/cancel-request`, {
        method: "POST",
        data: {},
      });
      this.setNotice(`订单 #${orderId} 已提交取消申请，请等待管理员审核。`);
      await this.loadAccount();
    } catch (error) {
      this.setNotice(`取消申请失败：${pickErrorMessage(error, "取消申请失败")}`);
    } finally {
      this.setData({ submitting: false });
    }
  },

  goMallTab() {
    wx.reLaunch({
      url: "/pages/index/index",
    });
  },

  goAccountTab() {},
});
