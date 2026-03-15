const { loadSession } = require("./utils/session");

App({
  globalData: {
    session: null,
    apiBaseUrl: "",
    accountNeedsRefresh: false,
    productListNeedsRefresh: false,
    lastCreatedOrder: null,
  },

  onLaunch() {
    this.globalData.session = loadSession();
  },
});
