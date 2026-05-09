export const PAGE_MODE_BY_FILE = {
  "index.html": "legacy",
  "shop.html": "shop",
  "login.html": "login",
  "script.html": "script",
  "auction.html": "auction",
  "me.html": "me",
};

export const PAGE_MODE_CONFIG = {
  legacy: {
    title: "25000 繁星功法商城",
    navActive: "shop",
    sections: {
      hero: true,
      beginner: false,
      products: true,
      discount: true,
      bind: true,
      helper: true,
      account: true,
      auction: true,
      draw: true,
      dock: true,
      footer: true,
    },
    bootstrap: {
      account: true,
      helper: true,
      products: true,
      auctions: true,
      recentSales: false,
    },
  },
  shop: {
    title: "25000 繁星功法商城 - 商城",
    navActive: "shop",
    sections: {
      hero: true,
      beginner: true,
      products: true,
      discount: true,
      bind: false,
      helper: false,
      account: false,
      auction: false,
      draw: false,
      dock: false,
      footer: true,
    },
    bootstrap: {
      account: true,
      helper: false,
      products: true,
      auctions: false,
      recentSales: true,
    },
  },
  login: {
    title: "25000 繁星功法商城 - 登录",
    navActive: "login",
    sections: {
      hero: false,
      beginner: false,
      products: false,
      discount: false,
      bind: true,
      helper: false,
      account: false,
      auction: false,
      draw: false,
      dock: false,
      footer: false,
    },
    bootstrap: {
      account: false,
      helper: false,
      products: false,
      auctions: false,
      recentSales: false,
    },
  },
  script: {
    title: "25000 繁星功法商城 - 功法检测",
    navActive: "script",
    sections: {
      hero: false,
      beginner: false,
      products: false,
      discount: false,
      bind: false,
      helper: true,
      account: false,
      auction: false,
      draw: false,
      dock: false,
      footer: true,
    },
    bootstrap: {
      account: true,
      helper: true,
      products: false,
      auctions: false,
      recentSales: false,
    },
  },
  auction: {
    title: "25000 繁星功法商城 - 拍卖代抽",
    navActive: "auction",
    sections: {
      hero: false,
      beginner: false,
      products: false,
      discount: false,
      bind: false,
      helper: false,
      account: false,
      auction: true,
      draw: true,
      dock: false,
      footer: true,
    },
    bootstrap: {
      account: true,
      helper: false,
      products: false,
      auctions: true,
      recentSales: false,
    },
  },
  me: {
    title: "25000 繁星功法商城 - 个人后台",
    navActive: "me",
    sections: {
      hero: false,
      beginner: false,
      products: false,
      discount: false,
      bind: false,
      helper: false,
      account: true,
      auction: false,
      draw: false,
      dock: false,
      footer: true,
    },
    bootstrap: {
      account: true,
      helper: false,
      products: false,
      auctions: false,
      recentSales: false,
    },
  },
};

export function resolveCurrentPageMode({ pathname, pageEntry, globalPageMode }) {
  const normalizedPageEntry = String(globalPageMode || pageEntry || "").trim().toLowerCase();
  if (PAGE_MODE_CONFIG[normalizedPageEntry]) {
    return normalizedPageEntry;
  }

  const currentPageFile = String(pathname || "")
    .split("/")
    .pop()
    .trim()
    .toLowerCase();
  return PAGE_MODE_BY_FILE[currentPageFile || "index.html"] || "legacy";
}

export function createPageRuntime({ pathname, pageEntry, globalPageMode }) {
  const currentPageMode = resolveCurrentPageMode({ pathname, pageEntry, globalPageMode });

  function getPageModeConfig() {
    return PAGE_MODE_CONFIG[currentPageMode] || PAGE_MODE_CONFIG.legacy;
  }

  function shouldBootstrap(key) {
    return Boolean(getPageModeConfig().bootstrap?.[key]);
  }

  function isPageSectionEnabled(key) {
    return Boolean(getPageModeConfig().sections?.[key]);
  }

  return {
    currentPageMode,
    getPageModeConfig,
    shouldBootstrap,
    isPageSectionEnabled,
  };
}
