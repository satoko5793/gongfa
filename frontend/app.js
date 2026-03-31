import {
  apiFetch,
  clearSession,
  getHelperOrigin,
  loadSession,
  normalizeBindPayload,
  saveSession,
  setHelperOrigin,
  formatDate,
} from "./shared.js";

const productGrid = document.getElementById("product-grid");
const discountProductsSection = document.getElementById("discount-products-section");
const discountProductGrid = document.getElementById("discount-product-grid");
const discountProductPagination = document.getElementById("discount-product-pagination");
const productCategoryTabs = document.getElementById("product-category-tabs");
const productSubcategoryTabs = document.getElementById("product-subcategory-tabs");
const productDetailTabs = document.getElementById("product-detail-tabs");
const productFullnessTabs = document.getElementById("product-fullness-tabs");
const discountCategoryTabs = document.getElementById("discount-category-tabs");
const discountSubcategoryTabs = document.getElementById("discount-subcategory-tabs");
const discountDetailTabs = document.getElementById("discount-detail-tabs");
const discountFullnessTabs = document.getElementById("discount-fullness-tabs");
const productPagination = document.getElementById("product-pagination");
const productsSection = document.getElementById("products");
const keywordInput = document.getElementById("product-keyword-input");
const sortSelect = document.getElementById("product-sort-select");
const discountKeywordInput = document.getElementById("discount-keyword-input");
const discountSortSelect = document.getElementById("discount-sort-select");
const sessionSummary = document.getElementById("session-summary");
const sessionRole = document.getElementById("session-role");
const navBindLink = document.getElementById("nav-bind-link");
const navAdminLink = document.getElementById("nav-admin-link");
const helperOriginInput = document.getElementById("helper-origin-input");
const bindMessage = document.getElementById("bind-message");
const bindSection = document.getElementById("bind");
const accountSection = document.getElementById("account");
const auctionZoneSection = document.getElementById("auction-zone");
const auctionStatusTabs = document.getElementById("auction-status-tabs");
const auctionBody = document.getElementById("auction-body");
const auctionMessage = document.getElementById("auction-message");
const drawServiceZoneSection = document.getElementById("draw-service-zone");
const drawServiceBody = document.getElementById("draw-service-body");
const drawServiceMessage = document.getElementById("draw-service-message");
const accountProfile = document.getElementById("account-profile");
const quotaBalance = document.getElementById("quota-balance");
const orderList = document.getElementById("order-list");
const accountMessage = document.getElementById("account-message");
const accountLogoutBtn = document.getElementById("account-logout-btn");
const accountSwitchLink = document.getElementById("account-switch-link");
const accountProfileForm = document.getElementById("account-profile-form");
const accountRoleNameInput = document.getElementById("account-role-name");
const accountServerInput = document.getElementById("account-server");
const accountNicknameInput = document.getElementById("account-nickname");
const accountPasswordPanel = document.getElementById("account-password-panel");
const accountPasswordForm = document.getElementById("account-password-form");
const accountCurrentPasswordInput = document.getElementById("account-current-password");
const accountNewPasswordInput = document.getElementById("account-new-password");
const accountConfirmPasswordInput = document.getElementById("account-confirm-password");
const rechargeBody = document.getElementById("recharge-body");
const rechargeOrderList = document.getElementById("recharge-order-list");
const beginnerGuideSummary = document.getElementById("beginner-guide-summary");
const beginnerGuideReward = document.getElementById("beginner-guide-reward");
const beginnerGuideSteps = document.getElementById("beginner-guide-steps");
const beginnerFlowSection = document.querySelector(".beginner-flow");
const beginnerCarousel = document.getElementById("beginner-carousel");
const beginnerCarouselTrack = document.getElementById("beginner-carousel-track");
const beginnerGuideTabs = Array.from(document.querySelectorAll("[data-guide-page-target]"));
const beginnerGuidePrevBtn = document.getElementById("beginner-guide-prev");
const beginnerGuideNextBtn = document.getElementById("beginner-guide-next");
const recentSalesList = document.getElementById("recent-sales-list");
const authTabButtons = Array.from(document.querySelectorAll("[data-auth-tab]"));
const authTabPanels = Array.from(document.querySelectorAll("[data-auth-panel]"));
const accountTabButtons = Array.from(document.querySelectorAll("[data-account-tab]"));
const accountTabPanels = Array.from(document.querySelectorAll("[data-account-panel]"));
const accountTabLinks = Array.from(document.querySelectorAll("[data-account-tab-target]"));
const accountSecurityTabButton = document.querySelector('[data-account-tab="security"]');
const pageDockItems = Array.from(document.querySelectorAll("[data-dock-target]"));
const discountDockButton = document.querySelector('[data-dock-target="discount-products-section"]');

const registerForm = document.getElementById("register-form");
const registerRoleIdInput = document.getElementById("register-role-id");
const registerRoleNameInput = document.getElementById("register-role-name");
const registerPasswordInput = document.getElementById("register-password");
const registerPasswordConfirmInput = document.getElementById("register-password-confirm");
const loginForm = document.getElementById("login-form");
const loginRoleIdInput = document.getElementById("login-role-id");
const loginPasswordInput = document.getElementById("login-password");
const bindForm = document.getElementById("bind-form");
const bindRoleIdInput = document.getElementById("bind-role-id");
const bindServerInput = document.getElementById("bind-server");
const bindRoleNameInput = document.getElementById("bind-role-name");
const bindTokenIdInput = document.getElementById("bind-token-id");
const bindNicknameInput = document.getElementById("bind-nickname");

const productDetailModal = document.getElementById("product-detail-modal");
const productDetailBody = document.getElementById("product-detail-body");
const productDetailMessage = document.getElementById("product-detail-message");

let allProducts = [];
let currentProducts = [];
let currentDiscountProducts = [];
let activeItemId = null;
let activeItemKind = "card";
let activeCategory = "all";
let activeSubcategory = "all";
let activeDetail = "all";
let activeFullness = "all";
let activeDiscountCategory = "all";
let activeDiscountSubcategory = "all";
let activeDiscountDetail = "all";
let activeDiscountFullness = "all";
let currentRechargeConfig = null;
let publicRechargeConfig = null;
let currentRechargeOrders = [];
let currentProfile = null;
let currentQuota = null;
let selectedRechargeAmount = null;
let selectedRechargeOrderType = "normal";
let selectedRechargePaymentChannel = "alipay_qr";
let selectedGuestTransferPaymentChannel = "alipay_qr";
let pendingDirectPurchaseContext = null;
let selectedDrawServiceAmount = 200;
let productSearchTimer = null;
let discountSearchTimer = null;
let activeAuthTab = "register";
let activeAccountTab = "overview";
let activeDockTarget = "products";
let activeGuidePage = "tutorial";
let recentSalesItems = [];
let currentAuctions = [];
let currentAuctionBidSummaries = [];
let activeAuctionStatus = "live";
const productPaginationState = {
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
};
const discountPaginationState = {
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
};
const BEGINNER_GUIDE_REWARD_QUOTA = 1000;
const DRAW_SERVICE_MIN_QUOTA = 200;
const DRAW_SERVICE_STEP_QUOTA = 200;
const DRAW_SERVICE_MILESTONE_QUOTA = 50000;
const DRAW_SERVICE_FIRST_REBATE_QUOTA = 10000;
const DRAW_SERVICE_REPEAT_REBATE_QUOTA = 5000;
const AUCTION_COUNTDOWN_TICK_MS = 1000;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createImageFallbackSvg(name, kind = "card") {
  const label = String(name || "??").slice(0, 12);
  const colors =
    kind === "bundle"
      ? { a: "#c4552d", b: "#234e52" }
      : { a: "#d7b188", b: "#465f63" };
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='760'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${colors.a}'/><stop offset='100%' stop-color='${colors.b}'/></linearGradient></defs><rect width='100%' height='100%' rx='32' fill='url(#g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='42' fill='white' font-family='sans-serif'>${escapeHtml(label)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const BUNDLE_COLLAGE_MAP = {
  atlas_orange_and_below: [
    "/gongfa/yunqijue.png",
    "/gongfa/suibianzhang.png",
    "/gongfa/tuitanggu.png",
    "/gongfa/paolu-caoshangfei.png",
  ],
  atlas_red_and_below: [
    "/gongfa/xiaoqiang-busishen.png",
    "/gongfa/moyu-huajin.png",
    "/gongfa/mopai-toushiyan.png",
    "/gongfa/zhedeng-yaojue.png",
  ],
  atlas_full_attack_set: [
    "/gongfa/gangjing-gangqi.png",
    "/gongfa/gangshang-kaihuashou.png",
    "/gongfa/yexing-daofa.png",
    "/gongfa/duichuanchang-wengongshu.png",
  ],
  atlas_high_attack_full_dex: [
    "/gongfa/xiaoqiang-busishen.png",
    "/gongfa/gangjing-gangqi.png",
    "/gongfa/mopai-toushiyan.png",
    "/gongfa/yunqijue.png",
  ],
};

function getImagePayload(product, kind = product?.item_kind || "card") {
  const placeholder = createImageFallbackSvg(product?.name, kind);
  const fallbacks = getImageFallbackCandidates(product);
  const src = product?.image_url || fallbacks.shift() || placeholder;
  return {
    src,
    fallbacks,
    placeholder,
  };
}

function getImageFallbackCandidates(product) {
  const candidates = [];
  const fileName = String(product.image_url || "").split("/").pop();
  if (fileName) {
    candidates.push(`/helper-public/legacy-assets/${fileName}`);
  }
  return candidates;
}

function getBundleCollageSources(product) {
  const code = String(product?.uid || product?.code || "").trim();
  const mapped = BUNDLE_COLLAGE_MAP[code] || [];
  if (mapped.length > 0) return mapped;

  return [
    "/gongfa/xiaoqiang-busishen.png",
    "/gongfa/yunqijue.png",
    "/gongfa/gangjing-gangqi.png",
    "/gongfa/mopai-toushiyan.png",
  ];
}

function renderBundleCollage(product, variant = "grid") {
  const sources = getBundleCollageSources(product);
  const placeholder = createImageFallbackSvg(product?.name || "??", "bundle");
  const imageClass = variant === "detail" ? "bundle-detail-collage-image" : "bundle-collage-image";
  const slots = sources.slice(0, 4);

  return `
    <div class="bundle-collage bundle-collage-four">
      ${slots
        .map(
          (src, index) => `
            <div class="bundle-collage-slot slot-${index + 1}">
              <img
                class="${imageClass}"
                src="${escapeHtml(src)}"
                alt="${escapeHtml(product?.name || "??")}"
                data-fallbacks=""
                data-placeholder="${escapeHtml(placeholder)}"
              />
            </div>
          `
        )
        .join("")}
      <div class="bundle-collage-gloss"></div>
      <div class="product-cover-overlay"></div>
    </div>
  `;
}

function bindImageFallbacks(root = document) {
  root
    .querySelectorAll(
      "img.product-image, img.product-detail-image, img.bundle-collage-image, img.bundle-detail-collage-image"
    )
    .forEach((img) => {
      if (img.dataset.fallbackBound === "1") return;
      img.dataset.fallbackBound = "1";
      img.addEventListener("error", () => {
        const list = String(img.dataset.fallbacks || "")
          .split("|")
          .map((item) => item.trim())
          .filter(Boolean);
        if (list.length > 0) {
          const next = list.shift();
          img.dataset.fallbacks = list.join("|");
          img.src = next;
          return;
        }
        img.src = img.dataset.placeholder || createImageFallbackSvg(img.alt || "??");
      });
    });
}

function setNotice(text, type = "") {
  bindMessage.textContent = text || "";
  bindMessage.className = type ? `notice ${type}` : "notice";
}

function setAccountMessage(text, type = "") {
  if (!accountMessage) return;
  accountMessage.textContent = text || "";
  accountMessage.className = type ? `notice ${type}` : "notice";
}

function activateAuthTab(tab) {
  activeAuthTab = tab === "login" ? "login" : "register";
  authTabButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-auth-tab") === activeAuthTab);
  });
  authTabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-auth-panel") !== activeAuthTab);
  });
}

function activateAccountTab(tab, { scroll = false } = {}) {
  const allowedTabs = new Set(["overview", "profile", "security", "recharge", "orders"]);
  let nextTab = allowedTabs.has(tab) ? tab : "overview";
  if (nextTab === "security" && accountSecurityTabButton?.classList.contains("hidden")) {
    nextTab = "overview";
  }
  activeAccountTab = nextTab;
  accountTabButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-account-tab") === activeAccountTab);
  });
  accountTabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-account-panel") !== activeAccountTab);
  });
  if (scroll) {
    accountSection?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function syncAccountTabWithHash() {
  const hash = String(window.location.hash || "").replace(/^#/, "");
  const hashMap = {
    account: "overview",
    "recharge-panel": "recharge",
    "help-panel": "orders",
    "order-panel": "orders",
  };
  if (!hashMap[hash]) return;
  activateAccountTab(hashMap[hash]);
}

function getDockSections() {
  return [
    { key: "products", node: productsSection },
    { key: "discount-products-section", node: discountProductsSection },
    { key: "account", node: accountSection },
    { key: "auction-zone", node: auctionZoneSection },
    { key: "draw-service-zone", node: drawServiceZoneSection },
  ].filter((entry) => entry.node && !entry.node.classList.contains("hidden"));
}

function getScrollOffset() {
  const headerHeight = document.querySelector(".app-header")?.offsetHeight || 0;
  return headerHeight + 28;
}

function setActiveDockTarget(target) {
  activeDockTarget = target;
  pageDockItems.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-dock-target") === target);
  });
}

function scrollSectionIntoView(section) {
  if (!section) return;
  const top = window.scrollY + section.getBoundingClientRect().top - getScrollOffset();
  window.scrollTo({
    top: Math.max(top, 0),
    behavior: "smooth",
  });
}

function navigateWithDock(target) {
  if (target === "account") {
    window.location.hash = "account";
    activateAccountTab("overview");
    scrollSectionIntoView(accountSection);
    setActiveDockTarget(target);
    return;
  }
  const section = document.getElementById(target);
  if (!section) return;
  if (target === "products") {
    window.location.hash = "products";
  } else if (target === "discount-products-section") {
    window.location.hash = "discount-products-section";
  } else {
    window.location.hash = target;
  }
  scrollSectionIntoView(section);
  setActiveDockTarget(target);
}

function syncDiscountDockVisibility(hasDiscounts) {
  if (!discountDockButton) return;
  discountDockButton.classList.toggle("hidden", !hasDiscounts);
  if (!hasDiscounts && activeDockTarget === "discount-products-section") {
    setActiveDockTarget("products");
  }
}

function syncDockWithViewport() {
  const sections = getDockSections();
  if (!sections.length) return;
  const probe = window.scrollY + getScrollOffset() + Math.min(window.innerHeight * 0.22, 140);
  let nextActive = sections[0].key;
  sections.forEach((entry) => {
    const top = window.scrollY + entry.node.getBoundingClientRect().top;
    if (top <= probe) {
      nextActive = entry.key;
    }
  });
  if (nextActive !== activeDockTarget) {
    setActiveDockTarget(nextActive);
  }
}

function updateShellVisibility(profile) {
  const loggedIn = Boolean(profile);
  const isAdmin = profile?.role === "admin" || profile?.role === "poster_admin";
  const canChangePassword = loggedIn && profile?.auth_provider === "password";
  navBindLink?.classList.toggle("hidden", loggedIn);
  navAdminLink?.classList.toggle("hidden", !isAdmin);
  bindSection?.classList.toggle("hidden", loggedIn);
  accountLogoutBtn?.classList.toggle("hidden", !loggedIn);
  accountSwitchLink?.classList.toggle("hidden", !loggedIn);
  accountSecurityTabButton?.classList.toggle("hidden", !canChangePassword);
  if (!canChangePassword && activeAccountTab === "security") {
    activeAccountTab = "overview";
  }
  accountPasswordPanel?.classList.toggle("hidden", !canChangePassword || activeAccountTab !== "security");
  activateAccountTab(activeAccountTab);
}

function fillAccountForms(profile) {
  if (!accountRoleNameInput || !accountServerInput || !accountNicknameInput) return;
  accountRoleNameInput.value = profile?.game_role_name || "";
  accountServerInput.value = profile?.game_server || "";
  accountServerInput.disabled = !profile;
  accountNicknameInput.value = profile?.nickname || "";
}

function setProductDetailMessage(text, type = "") {
  productDetailMessage.textContent = text || "";
  productDetailMessage.className = type ? `notice ${type}` : "notice";
}

function pickErrorMessage(error, fallback) {
  const details = error?.payload?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.join(", ");
  }
  return error?.payload?.error || error?.message || fallback;
}

function getCurrentQuotaValue() {
  const value = Number(String(quotaBalance.textContent || "").trim());
  return Number.isFinite(value) ? value : null;
}

function fillBindForm(payload) {
  if (!payload) return;
  bindRoleIdInput.value = payload.game_role_id || "";
  bindServerInput.value = payload.game_server || "";
  bindRoleNameInput.value = payload.game_role_name || "";
  bindTokenIdInput.value = payload.bind_token_id || "";
  bindNicknameInput.value = payload.nickname || "";
  setNotice("已收到 helper 回传的角色信息，可以直接提交绑定。", "success");
}

function renderSessionSummary(profile) {
  updateShellVisibility(profile);
  if (!profile) {
    sessionSummary.textContent = "未登录";
    sessionRole.textContent = "请先登录账号再充值或下单。";
    fillAccountForms(null);
    return;
  }

  sessionSummary.textContent = profile.game_role_name || "已登录";
  const authLabel = profile.auth_provider === "password" ? "密码登录" : "绑定登录";
  const serverText = profile.game_server || "未填写区服";
  const roleLabel =
    profile.role === "admin"
      ? "管理员"
      : profile.role === "poster_admin"
        ? "海报后台"
        : profile.role || "用户";
  sessionRole.textContent = `${serverText} / ${roleLabel} / ${authLabel}`;
  fillAccountForms(profile);
}

function isBundle(product) {
  return String(product?.item_kind || "card") === "bundle";
}

function getTierKey(product) {
  if (isBundle(product)) return "bundle";
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 500) return "gold";
  if (legacyId >= 400) return "red";
  if (legacyId >= 300) return "orange";
  if (legacyId >= 200) return "purple";
  if (legacyId >= 100) return "blue";
  return "green";
}

function getTierLabelByKey(key) {
  const mapping = {
    bundle: "套餐",
    gold: "金卡",
    red: "红卡",
    orange: "橙卡",
    purple: "紫卡",
    blue: "蓝卡",
    green: "绿卡",
  };
  return mapping[key] || "商品";
}

function getTierLabel(product) {
  return getTierLabelByKey(getTierKey(product));
}

function isCurrentSeasonProduct(product) {
  return Boolean(product?.is_current_season);
}

function getSeasonDisplayText(product) {
  if (isBundle(product)) return "套餐";
  const explicit = String(product?.season_display || "").trim();
  if (explicit) return explicit;
  const scheduleId = Number(product?.schedule_id || 0);
  if (!scheduleId) return "老卡";
  return isCurrentSeasonProduct(product) ? `S${scheduleId} 当前赛季` : `S${scheduleId} 老卡`;
}

function getProductCategory(product) {
  return getTierKey(product);
}

function isSeasonCategory(category) {
  return category === "current_season" || category === "legacy_season";
}

function getTopCategoryKey(product) {
  if (isBundle(product)) return "bundle";
  return isCurrentSeasonProduct(product) ? "current_season" : "legacy_season";
}

function buildCategoryEntries(products) {
  const labels = {
    all: "全部",
    current_season: "本赛季",
    legacy_season: "往赛季",
    bundle: "套餐",
  };
  const counts = { all: Array.isArray(products) ? products.length : 0 };
  for (const product of products || []) {
    const key = getTopCategoryKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderCategoryTabs(container, products, activeKey, dataAttr = "category") {
  if (!container) return activeKey;
  const entries = buildCategoryEntries(products || []);
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
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="category-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function getGoldSubcategory(product) {
  if (getTierKey(product) !== "gold" || isBundle(product)) return "all";
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 600) return "rare";
  const extStats = parseExtAttrStats(product?.ext_attrs);
  if (extStats.fire > 0 && extStats.calm > 0) return "double_term";
  if (extStats.fire > 0) return "fire_only";
  if (extStats.calm > 0) return "calm_only";
  return "no_term";
}

function getNameSubcategoryKey(product) {
  const name = String(product?.name || "").trim();
  return name ? `name:${name}` : "all";
}

function buildSubcategoryEntries(products, category) {
  if (category === "bundle") return [];
  const subset = (products || []).filter((product) => !isBundle(product));
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
    const key = getTierKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderSubcategoryTabs(container, products, category, activeKey, dataAttr = "subcategory") {
  if (!container) return activeKey;
  if (!category || category === "bundle") {
    container.classList.add("hidden");
    container.innerHTML = "";
    return "all";
  }

  const entries = buildSubcategoryEntries(products || [], category);
  const validKeys = new Set(entries.map((entry) => entry.key));
  const nextActiveKey = validKeys.has(activeKey) ? activeKey : "all";
  container.classList.toggle("hidden", entries.length <= 1);
  container.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === nextActiveKey ? "active" : ""}"
          data-${dataAttr}="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function buildDetailEntries(products, tier) {
  if (!tier || tier === "all" || tier === "bundle") return [];
  const subset = (products || []).filter((product) => !isBundle(product) && getTierKey(product) === tier);
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
      const key = getGoldSubcategory(product);
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
    { key: "all", label: `全部${getTierLabelByKey(tier)}`, count: subset.length },
    ...Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label), "zh-Hans-CN")
    ),
  ];
}

function renderDetailTabs(container, products, tier, activeKey, dataAttr = "detail") {
  if (!container) return activeKey;
  const entries = buildDetailEntries(products || [], tier);
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
          data-${dataAttr}="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function getFullnessKey(product) {
  const attackFull = isAttackFull(product);
  const hpFull = isHpFull(product);
  if (attackFull && hpFull) return "double_full";
  if (attackFull) return "attack_full";
  if (hpFull) return "hp_full";
  return "none_full";
}

function buildFullnessEntries(products, enabled) {
  if (!enabled) return [];
  const subset = (products || []).filter((product) => !isBundle(product));
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
    const key = getFullnessKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderFullnessTabs(container, products, enabled, activeKey, dataAttr = "fullness") {
  if (!container) return activeKey;
  const entries = buildFullnessEntries(products || [], enabled);
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
          data-${dataAttr}="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function resetProductPagination() {
  productPaginationState.page = 1;
}

function resetDiscountPagination() {
  discountPaginationState.page = 1;
}

function scrollProductsIntoView() {
  productsSection?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function getPagedProducts(products) {
  const total = Array.isArray(products) ? products.length : 0;
  const pageSize = Number(productPaginationState.pageSize || 12);
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const page = Math.min(
    Math.max(Number(productPaginationState.page || 1), 1),
    Math.max(totalPages, 1)
  );

  productPaginationState.page = page;
  productPaginationState.total = total;
  productPaginationState.totalPages = totalPages;

  if (total === 0) {
    return [];
  }

  const start = (page - 1) * pageSize;
  return products.slice(start, start + pageSize);
}

function getPagedDiscountProducts(products) {
  const total = Array.isArray(products) ? products.length : 0;
  const pageSize = Number(discountPaginationState.pageSize || 12);
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const page = Math.min(
    Math.max(Number(discountPaginationState.page || 1), 1),
    Math.max(totalPages, 1)
  );

  discountPaginationState.page = page;
  discountPaginationState.total = total;
  discountPaginationState.totalPages = totalPages;

  if (total === 0) {
    return [];
  }

  const start = (page - 1) * pageSize;
  return products.slice(start, start + pageSize);
}

function renderProductPagination() {
  if (!productPagination) return;

  const total = Number(productPaginationState.total || 0);
  const page = Math.max(Number(productPaginationState.page || 1), 1);
  const totalPages = Math.max(Number(productPaginationState.totalPages || 0), 0);

  if (total === 0) {
    productPagination.innerHTML = '<div class="pagination-meta">当前共 0 件商品。</div>';
    return;
  }

  productPagination.innerHTML = `
    <div class="pagination-meta">第 ${page} / ${Math.max(totalPages, 1)} 页，共 ${total} 件商品</div>
    <div class="pagination-actions">
      <button
        class="ghost"
        type="button"
        data-product-page="${Math.max(page - 1, 1)}"
        ${page <= 1 ? "disabled" : ""}
      >上一页</button>
      <button
        class="ghost"
        type="button"
        data-product-page="${Math.min(page + 1, Math.max(totalPages, 1))}"
        ${totalPages === 0 || page >= totalPages ? "disabled" : ""}
      >下一页</button>
    </div>
  `;
}

function filterProductsByCategory(products, category) {
  if (!category || category === "all") return products || [];
  if (category === "current_season") {
    return (products || []).filter((product) => !isBundle(product) && isCurrentSeasonProduct(product));
  }
  if (category === "legacy_season") {
    return (products || []).filter((product) => !isBundle(product) && !isCurrentSeasonProduct(product));
  }
  return (products || []).filter((product) => getProductCategory(product) === category);
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

function filterProductsBySubcategory(products, category, subcategory) {
  if (!category || category === "bundle") return products || [];
  if (!subcategory || subcategory === "all") return products || [];
  return (products || []).filter((product) => getTierKey(product) === subcategory);
}

function filterProductsByDetail(products, tier, detail) {
  if (!tier || tier === "all" || tier === "bundle") return products || [];
  if (!detail || detail === "all") return products || [];
  if (tier === "gold") {
    return (products || []).filter((product) => getGoldSubcategory(product) === detail);
  }
  return (products || []).filter((product) => getNameSubcategoryKey(product) === detail);
}

function filterProductsByFullness(products, fullness) {
  if (!fullness || fullness === "all") return products || [];
  return (products || []).filter((product) => getFullnessKey(product) === fullness);
}

function getTierOrder(product) {
  const mapping = {
    gold: 6,
    red: 5,
    orange: 4,
    purple: 3,
    blue: 2,
    green: 1,
    bundle: 0,
  };
  return mapping[getTierKey(product)] || 0;
}

function parseExtAttrStats(extAttrs) {
  const raw = String(extAttrs || "").trim();
  if (!raw || raw === "无") {
    return {
      fire: 0,
      calm: 0,
      total: 0,
      kindRank: 0,
    };
  }

  const fireMatch = raw.match(/走火\s*([0-9.]+)/);
  const calmMatch = raw.match(/气定\s*([0-9.]+)/);
  const fire = fireMatch ? Number(fireMatch[1]) || 0 : 0;
  const calm = calmMatch ? Number(calmMatch[1]) || 0 : 0;

  let kindRank = 0;
  if (fire > 0 && calm > 0) {
    kindRank = 3;
  } else if (fire > 0) {
    kindRank = 2;
  } else if (calm > 0) {
    kindRank = 1;
  }

  return {
    fire,
    calm,
    total: fire + calm,
    kindRank,
  };
}

function compareShopDefault(a, b) {
  const aIsBundle = isBundle(a);
  const bIsBundle = isBundle(b);
  if (aIsBundle !== bIsBundle) return aIsBundle ? 1 : -1;

  if (aIsBundle && bIsBundle) {
    const rankDiff = Number(a?.display_rank || 999) - Number(b?.display_rank || 999);
    if (rankDiff !== 0) return rankDiff;
    return Number(b?.item_id || 0) - Number(a?.item_id || 0);
  }

  const tierDiff = getTierOrder(b) - getTierOrder(a);
  if (tierDiff !== 0) return tierDiff;

  const seasonDiff = Number(Boolean(b?.is_current_season)) - Number(Boolean(a?.is_current_season));
  if (seasonDiff !== 0) return seasonDiff;

  const aExt = parseExtAttrStats(a?.ext_attrs);
  const bExt = parseExtAttrStats(b?.ext_attrs);
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

function sortProducts(products, sortMode) {
  const list = [...(products || [])];
  const sorters = {
    shop_default: compareShopDefault,
    price_asc: (a, b) => Number(a.price_quota || 0) - Number(b.price_quota || 0) || compareShopDefault(a, b),
    price_desc: (a, b) => Number(b.price_quota || 0) - Number(a.price_quota || 0) || compareShopDefault(a, b),
    attack_desc: (a, b) =>
      Number(b.attack_value || 0) - Number(a.attack_value || 0) || compareShopDefault(a, b),
    attack_asc: (a, b) => Number(a.attack_value || 0) - Number(b.attack_value || 0) || compareShopDefault(a, b),
    hp_desc: (a, b) => Number(b.hp_value || 0) - Number(a.hp_value || 0) || compareShopDefault(a, b),
    hp_asc: (a, b) => Number(a.hp_value || 0) - Number(b.hp_value || 0) || compareShopDefault(a, b),
  };
  list.sort(sorters[sortMode] || sorters.shop_default);
  return list;
}

function isAttackFull(product) {
  const attack = Number(product?.attack_value || 0);
  const caps = { gold: 10000000, red: 8000000, orange: 5000000, purple: 2000000, blue: 1000000 };
  return attack > 0 && attack >= (caps[getTierKey(product)] || attack + 1);
}

function isHpFull(product) {
  const hp = Number(product?.hp_value || 0);
  const caps = { gold: 200000000, red: 160000000, orange: 100000000, purple: 40000000, blue: 20000000 };
  return hp > 0 && hp >= (caps[getTierKey(product)] || hp + 1);
}

function formatCompactNumber(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0";
  const abs = Math.abs(numeric);

  if (abs >= 100000000) {
    const unitValue = abs / 100000000;
    const digits = unitValue >= 100 ? 0 : unitValue >= 10 ? 1 : 2;
    const compact = Number(unitValue.toFixed(digits));
    return `${numeric < 0 ? "-" : ""}${compact}亿`;
  }

  if (abs >= 10000) {
    const unitValue = abs / 10000;
    const digits = unitValue >= 100 ? 0 : unitValue >= 10 ? 1 : 2;
    const compact = Number(unitValue.toFixed(digits));
    return `${numeric < 0 ? "-" : ""}${compact}万`;
  }

  return String(numeric);
}

function getEffectiveRechargeConfig() {
  return currentRechargeConfig || publicRechargeConfig || null;
}

function getQuotaCashAmount(quotaAmount, rechargeConfig = getEffectiveRechargeConfig()) {
  const quota = Number(quotaAmount || 0);
  const exchangeQuota = Number(rechargeConfig?.exchange_quota || 0);
  const exchangeYuan = Number(rechargeConfig?.exchange_yuan || 0);
  if (!Number.isFinite(quota) || quota <= 0 || exchangeQuota <= 0 || exchangeYuan <= 0) {
    return null;
  }
  return (quota * exchangeYuan) / exchangeQuota;
}

function getOriginalQuotaPrice(product) {
  const original = Number(product?.original_price_quota || 0);
  const current = Number(product?.price_quota || 0);
  return original > 0 ? original : current;
}

function isDiscountedProduct(product) {
  return (
    !isBundle(product) &&
    Boolean(product?.is_discounted) &&
    Number(product?.original_price_quota || 0) > Number(product?.price_quota || 0)
  );
}

function getDiscountedProducts(products) {
  return (products || [])
    .filter((product) => isDiscountedProduct(product))
    .sort((a, b) => {
      const rateDiff = Number(a?.discount_rate || 100) - Number(b?.discount_rate || 100);
      if (rateDiff !== 0) return rateDiff;
      const saveDiff =
        Number(b?.discount_saved_quota || 0) - Number(a?.discount_saved_quota || 0);
      if (saveDiff !== 0) return saveDiff;
      return compareShopDefault(a, b);
    });
}

function formatCashAmount(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  if (Math.abs(numeric - Math.round(numeric)) < 0.001) {
    return `¥${Math.round(numeric)}`;
  }
  return `¥${numeric.toFixed(2)}`;
}

function getProductCashPriceText(product, rechargeConfig = getEffectiveRechargeConfig()) {
  const amount = getQuotaCashAmount(product?.price_quota, rechargeConfig);
  if (amount === null) return "";
  return formatCashAmount(amount);
}

function getDirectPurchaseAmountYuan(product, rechargeConfig = getEffectiveRechargeConfig()) {
  const cashAmount = getQuotaCashAmount(product?.price_quota, rechargeConfig);
  if (cashAmount === null) return null;
  return Number(cashAmount.toFixed(2));
}

function getQuotaCashText(quotaAmount, rechargeConfig = getEffectiveRechargeConfig()) {
  const cashAmount = getQuotaCashAmount(quotaAmount, rechargeConfig);
  if (cashAmount === null) return "RMB 待定";
  return formatCashAmount(cashAmount);
}

function buildDirectPurchaseContext(product, rechargeConfig = getEffectiveRechargeConfig()) {
  const amountYuan = getDirectPurchaseAmountYuan(product, rechargeConfig);
  if (!product || amountYuan === null) return null;
  return {
    itemId: Number(product.item_id || 0),
    itemKind: String(product.item_kind || "card"),
    productName: String(product.name || "商品"),
    quotaAmount: Number(product.price_quota || 0),
    amountYuan,
  };
}

function getRechargePaymentMethods(rechargeConfig = getEffectiveRechargeConfig()) {
  const methods = [];
  if (String(rechargeConfig?.qr_image_url || "").trim()) {
    methods.push({
      key: "alipay_qr",
      label: "支付宝",
      imageUrl: rechargeConfig.qr_image_url,
      name: rechargeConfig.payee_name || "支付宝收款码",
      hint: rechargeConfig.payee_hint || "扫码转账后再提交审核",
    });
  }
  if (String(rechargeConfig?.wechat_qr_image_url || "").trim()) {
    methods.push({
      key: "wechat_qr",
      label: "微信",
      imageUrl: rechargeConfig.wechat_qr_image_url,
      name: rechargeConfig.wechat_payee_name || "微信收款码",
      hint: rechargeConfig.wechat_payee_hint || "扫码转账后再提交审核",
    });
  }
  return methods;
}

function getGuestPurchaseMethods(rechargeConfig = getEffectiveRechargeConfig()) {
  const methods = [...getRechargePaymentMethods(rechargeConfig)];
  if (rechargeConfig?.residual_transfer_enabled) {
    methods.push({
      key: "game_residual_transfer",
      label: rechargeConfig?.residual_unit_label || "残卷转赠",
    });
  }
  return methods;
}

function ensureRechargePaymentChannel(rechargeConfig = getEffectiveRechargeConfig()) {
  const methods = getRechargePaymentMethods(rechargeConfig);
  if (!methods.length) {
    selectedRechargePaymentChannel = "alipay_qr";
    return null;
  }
  if (!methods.some((item) => item.key === selectedRechargePaymentChannel)) {
    selectedRechargePaymentChannel = methods[0].key;
  }
  return methods.find((item) => item.key === selectedRechargePaymentChannel) || methods[0];
}

function ensureGuestTransferPaymentChannel(rechargeConfig = getEffectiveRechargeConfig()) {
  const methods = getGuestPurchaseMethods(rechargeConfig);
  if (!methods.length) {
    selectedGuestTransferPaymentChannel = "alipay_qr";
    return null;
  }
  if (!methods.some((item) => item.key === selectedGuestTransferPaymentChannel)) {
    selectedGuestTransferPaymentChannel = methods[0].key;
  }
  return (
    methods.find((item) => item.key === selectedGuestTransferPaymentChannel) || methods[0]
  );
}

function getDirectResidualAmount(product, rechargeConfig = getEffectiveRechargeConfig()) {
  const quotaPerUnit = Math.max(Number(rechargeConfig?.residual_quota_per_unit || 0), 0);
  if (!product || quotaPerUnit <= 0) return null;
  return Math.ceil(Number(product?.price_quota || 0) / quotaPerUnit);
}

function formatRechargeChannelLabel(channel) {
  if (String(channel || "").trim() === "wechat_qr") return "微信";
  if (String(channel || "").trim() === "game_residual_transfer") return "残卷转赠";
  return "支付宝";
}

function isPositiveMoneyAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return false;
  return Math.abs(numeric * 100 - Math.round(numeric * 100)) < 0.000001;
}

function formatFullStatValue(value, isFull = false) {
  const compact = formatCompactNumber(value);
  return isFull ? `${compact}（满）` : compact;
}

function renderFullStatValue(value, isFull = false) {
  const className = isFull ? ' class="stat-no-wrap"' : "";
  return `<span${className}>${escapeHtml(formatFullStatValue(value, isFull))}</span>`;
}

function renderStatBlock(label, value, isFull = false, compact = false) {
  const numeric = Number(value || 0);
  const displayValue = isFull
    ? renderFullStatValue(numeric, true)
    : compact
      ? renderFullStatValue(value, false)
      : Number(value || 0);

  return `
    <div class="stat-block ${isFull ? "full" : ""}">
      <span class="stat-label">${escapeHtml(label)}</span>
      <strong class="stat-value">${displayValue}</strong>
    </div>
  `;
}

function formatTermBadgeLabel(label, product) {
  const raw = String(label || "").trim();
  if (!raw) return "";
  if (getTierKey(product) !== "gold") return raw;

  const match = raw.match(/^(走火|气定)\s*([0-9.]+)$/);
  if (!match) return raw;

  const value = Number(match[2] || 0);
  if (!Number.isFinite(value) || value < 3) return raw;
  return `${match[1]} ${match[2]}（满）`;
}

function parseTermBadges(text, product) {
  if (isBundle(product)) {
    const tags = Array.isArray(product?.tags) ? product.tags : [];
    return tags.slice(0, 4).map((item) => ({ label: String(item), kind: "bundle" }));
  }
  const raw = String(text || "").replace(/无/g, "").trim();
  if (!raw) return [];
  return raw
    .split(/[|/、,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((item) => ({ label: formatTermBadgeLabel(item, product), kind: "term" }));
}

function renderTermBadge(badge) {
  return `<span class="term-badge ${escapeHtml(badge.kind || "term")}">${escapeHtml(badge.label || "")}</span>`;
}

function renderProductVisual(product, variant = "grid") {
  if (isBundle(product) && !product?.image_url) {
    return renderBundleCollage(product, variant);
  }

  const payload = getImagePayload(product, product?.item_kind || "card");
  const imageClass = variant === "detail" ? "product-detail-image" : "product-image";
  return `
    <div class="product-image-shell ${variant === "detail" ? "detail" : "grid"}">
      <img
        class="${imageClass}"
        src="${escapeHtml(payload.src)}"
        alt="${escapeHtml(product?.name || "??")}" 
        data-fallbacks="${escapeHtml(payload.fallbacks.join("|"))}"
        data-placeholder="${escapeHtml(payload.placeholder)}"
      />
      <div class="product-badge-row">
        <span class="product-badge">${escapeHtml(getTierLabel(product))}</span>
        <span class="product-badge subtle">${isBundle(product) ? "套餐" : `ID ${escapeHtml(product?.legacy_id || "-")}`}</span>
        ${isBundle(product) ? "" : `<span class="product-badge subtle">${escapeHtml(getSeasonDisplayText(product))}</span>`}
      </div>
    </div>
  `;
}

function renderDiscountPagination() {
  if (!discountProductPagination) return;

  const total = Number(discountPaginationState.total || 0);
  const page = Math.max(Number(discountPaginationState.page || 1), 1);
  const totalPages = Math.max(Number(discountPaginationState.totalPages || 0), 0);

  if (total === 0) {
    discountProductPagination.innerHTML = '<div class="pagination-meta">当前筛选下没有打折商品。</div>';
    return;
  }

  discountProductPagination.innerHTML = `
    <div class="pagination-meta">第 ${page} / ${Math.max(totalPages, 1)} 页，共 ${total} 件商品</div>
    <div class="pagination-actions">
      <button
        class="ghost"
        type="button"
        data-discount-page="${Math.max(page - 1, 1)}"
        ${page <= 1 ? "disabled" : ""}
      >上一页</button>
      <button
        class="ghost"
        type="button"
        data-discount-page="${Math.min(page + 1, Math.max(totalPages, 1))}"
        ${totalPages === 0 || page >= totalPages ? "disabled" : ""}
      >下一页</button>
    </div>
  `;
}

function renderProductCard(product) {
  const termBadges = parseTermBadges(product.ext_attrs, product);
  const stockLabel =
    product.stock === null || product.stock === undefined
      ? "不限量"
      : `库存 ${Number(product.stock || 0)}`;
  const cashPriceText = getProductCashPriceText(product);
  const subtitle = isBundle(product)
    ? `${getTierLabel(product)} / ${escapeHtml(product.uid || "")}`
    : `${getTierLabel(product)} / ID ${product.legacy_id} / ${escapeHtml(getSeasonDisplayText(product))}`;
  const bodyHtml = isBundle(product)
    ? `<div class="product-meta">${escapeHtml(product.description || product.main_attrs || "套餐商品")}</div>`
    : `
        <div class="product-stats-grid">
          ${renderStatBlock("攻击", product.attack_value, isAttackFull(product), true)}
          ${renderStatBlock("血量", product.hp_value, isHpFull(product), true)}
        </div>
      `;
  const originalPriceQuota = getOriginalQuotaPrice(product);
  const discounted = isDiscountedProduct(product);

  return `
    <article class="product-card ${discounted ? "discounted" : ""}">
      <div class="product-cover">${renderProductVisual(product, "grid")}</div>
      <div class="product-summary">
        <div class="product-headline">
          <div class="discount-title-line">
            <div class="product-name">${escapeHtml(product.name)}</div>
            ${discounted ? `<span class="chip discount">${escapeHtml(product.discount_label || "限时折扣")}</span>` : ""}
          </div>
          <div class="product-type-chip">${subtitle}</div>
        </div>
        ${bodyHtml}
        <div class="term-row">
          ${
            termBadges.length > 0
              ? termBadges.map((badge) => renderTermBadge(badge)).join("")
              : '<span class="term-empty">无额外词条</span>'
          }
        </div>
      </div>
      <div class="chip-row">
        ${discounted ? `<span class="chip original-price">原价 ${formatCompactNumber(originalPriceQuota)}</span>` : ""}
        <span class="chip ${discounted ? "accent" : ""}">现价 ${formatCompactNumber(product.price_quota || 0)}</span>
        ${cashPriceText ? `<span class="chip accent">${escapeHtml(cashPriceText)}</span>` : ""}
        ${discounted && Number(product.discount_saved_quota || 0) > 0 ? `<span class="chip discount">立省 ${formatCompactNumber(product.discount_saved_quota)}</span>` : ""}
        <span class="chip">${escapeHtml(product.stock_label || stockLabel)}</span>
      </div>
      <div class="actions">
        <button class="ghost detail-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">详情</button>
        <button class="ghost direct-buy-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">转账锁卡</button>
        <button class="primary buy-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">购买</button>
      </div>
    </article>
  `;
}

function renderDiscountProducts(products) {
  if (!discountProductsSection || !discountProductGrid) return;
  const allDiscountedProducts = getDiscountedProducts(allProducts);
  const discountedProducts = (products || []).filter((product) => isDiscountedProduct(product));
  const hasAnyDiscounts = allDiscountedProducts.length > 0;
  discountProductsSection.classList.toggle("hidden", !hasAnyDiscounts);
  syncDiscountDockVisibility(hasAnyDiscounts);
  if (!hasAnyDiscounts) {
    discountProductGrid.innerHTML = "";
    discountPaginationState.page = 1;
    discountPaginationState.total = 0;
    discountPaginationState.totalPages = 0;
    renderDiscountPagination();
    syncDockWithViewport();
    return;
  }
  if (!discountedProducts.length) {
    discountProductGrid.innerHTML = '<div class="stack-item">当前筛选下没有打折商品。</div>';
    discountPaginationState.page = 1;
    discountPaginationState.total = 0;
    discountPaginationState.totalPages = 0;
    renderDiscountPagination();
    syncDockWithViewport();
    return;
  }
  const pagedDiscountProducts = getPagedDiscountProducts(discountedProducts);
  discountProductGrid.innerHTML = pagedDiscountProducts.map((product) => renderProductCard(product)).join("");
  bindImageFallbacks(discountProductGrid);
  renderDiscountPagination();
  syncDockWithViewport();
}

function applyProductView(options = {}) {
  const { resetPage = false } = options;
  if (resetPage) {
    resetProductPagination();
  }
  const keywordFiltered = filterProductsByKeyword(allProducts, keywordInput?.value || "");
  activeCategory = renderCategoryTabs(productCategoryTabs, keywordFiltered, activeCategory, "category");
  const categoryFiltered = filterProductsByCategory(keywordFiltered, activeCategory);
  activeSubcategory = renderSubcategoryTabs(
    productSubcategoryTabs,
    categoryFiltered,
    activeCategory,
    activeSubcategory,
    "subcategory"
  );
  const subcategoryFiltered = filterProductsBySubcategory(
    categoryFiltered,
    activeCategory,
    activeSubcategory
  );
  activeDetail = renderDetailTabs(
    productDetailTabs,
    categoryFiltered,
    activeSubcategory,
    activeDetail,
    "detail"
  );
  const detailFiltered = filterProductsByDetail(
    subcategoryFiltered,
    activeSubcategory,
    activeDetail
  );
  activeFullness = renderFullnessTabs(
    productFullnessTabs,
    detailFiltered,
    activeCategory !== "bundle" && activeSubcategory !== "all",
    activeFullness,
    "fullness"
  );
  const filtered = filterProductsByFullness(detailFiltered, activeFullness);
  currentProducts = sortProducts(filtered, sortSelect?.value || "shop_default");
  renderProducts(currentProducts);
}

function applyDiscountView(options = {}) {
  const { resetPage = false } = options;
  if (resetPage) {
    resetDiscountPagination();
  }

  const allDiscountedProducts = getDiscountedProducts(allProducts);
  const keywordFiltered = filterProductsByKeyword(allDiscountedProducts, discountKeywordInput?.value || "");
  activeDiscountCategory = renderCategoryTabs(
    discountCategoryTabs,
    keywordFiltered,
    activeDiscountCategory,
    "discount-category"
  );
  const categoryFiltered = filterProductsByCategory(keywordFiltered, activeDiscountCategory);
  activeDiscountSubcategory = renderSubcategoryTabs(
    discountSubcategoryTabs,
    categoryFiltered,
    activeDiscountCategory,
    activeDiscountSubcategory,
    "discount-subcategory"
  );
  const subcategoryFiltered = filterProductsBySubcategory(
    categoryFiltered,
    activeDiscountCategory,
    activeDiscountSubcategory
  );
  activeDiscountDetail = renderDetailTabs(
    discountDetailTabs,
    categoryFiltered,
    activeDiscountSubcategory,
    activeDiscountDetail,
    "discount-detail"
  );
  const detailFiltered = filterProductsByDetail(
    subcategoryFiltered,
    activeDiscountSubcategory,
    activeDiscountDetail
  );
  activeDiscountFullness = renderFullnessTabs(
    discountFullnessTabs,
    detailFiltered,
    activeDiscountCategory !== "bundle" && activeDiscountSubcategory !== "all",
    activeDiscountFullness,
    "discount-fullness"
  );
  const filtered = filterProductsByFullness(detailFiltered, activeDiscountFullness);
  currentDiscountProducts = sortProducts(filtered, discountSortSelect?.value || "shop_default");
  renderDiscountProducts(currentDiscountProducts);
}

function renderProducts(products) {
  const pagedProducts = getPagedProducts(products);

  if (!products || products.length === 0) {
    productGrid.innerHTML = '<div class="stack-item">当前分类下没有已上架商品。</div>';
    renderProductPagination();
    return;
  }

  productGrid.innerHTML = pagedProducts.map((product) => renderProductCard(product)).join("");

  bindImageFallbacks(productGrid);
  renderProductPagination();
}
function formatOrderStatus(status) {
  const mapping = {
    pending: "待处理",
    confirmed: "已完成",
    cancel_requested: "待审核取消",
    cancelled: "已取消",
  };
  return mapping[status] || status || "-";
}

function formatRechargeStatus(status) {
  const mapping = {
    pending_review: "待审核",
    approved: "已通过",
    rejected: "已驳回",
  };
  return mapping[status] || status || "-";
}

function isDrawServiceOrder(order) {
  return String(order?.order_source || "").trim() === "draw_service";
}

function getDrawServiceMeta(order) {
  if (!order) return null;
  if (order.draw_service && typeof order.draw_service === "object") {
    return order.draw_service;
  }
  const item = Array.isArray(order.items)
    ? order.items.find(
        (entry) => entry?.product_snapshot && String(entry.product_snapshot.service_kind || "") === "draw_service"
      )
    : null;
  return item?.product_snapshot || null;
}

function normalizeDrawServiceAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const roundedAmount = Math.ceil(amount / DRAW_SERVICE_STEP_QUOTA) * DRAW_SERVICE_STEP_QUOTA;
  return Math.max(DRAW_SERVICE_MIN_QUOTA, roundedAmount);
}

function setDrawServiceMessage(text, type = "") {
  if (!drawServiceMessage) return;
  drawServiceMessage.textContent = text || "";
  drawServiceMessage.className = type ? `notice ${type}` : "notice";
}

function updateDrawServiceQuote() {
  const amountInput = document.getElementById("draw-service-amount-input");
  const valueNode = document.getElementById("draw-service-quote-value");
  const detailNode = document.getElementById("draw-service-quote-detail");
  if (!amountInput || !valueNode || !detailNode) return;

  const normalizedAmount = normalizeDrawServiceAmount(amountInput.value);
  const balance = Number(currentQuota?.balance ?? currentProfile?.quota_balance ?? 0);

  if (!normalizedAmount) {
    valueNode.textContent = "请输入代抽额度";
    detailNode.textContent = "最低 200，不是 200 的倍数会在提交时自动补齐。";
    return;
  }

  const milestoneCount = Math.floor(normalizedAmount / DRAW_SERVICE_MILESTONE_QUOTA);
  const rawAmount = Number(amountInput.value || 0);
  const autoAdjusted = Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== normalizedAmount;
  valueNode.textContent = `本次代抽 ${normalizedAmount} 额度`;
  detailNode.textContent =
    milestoneCount > 0
      ? `${autoAdjusted ? `输入值会自动补齐到 ${normalizedAmount}；` : ""}本单已覆盖 ${milestoneCount} 个 5w 档位；当前可用额度 ${balance}`
      : `${autoAdjusted ? `输入值会自动补齐到 ${normalizedAmount}；` : ""}当前可用额度 ${balance}，累计满 5w 才会触发赛季返利。`;
}

function renderDrawServiceZone(profile, quota) {
  if (!drawServiceBody) return;
  currentProfile = profile || null;
  currentQuota = quota || null;

  if (!profile) {
    drawServiceBody.innerHTML = `
      <div class="stack-item">登录后才能提交代抽订单，系统会直接从你的额度里扣除。</div>
      <div class="actions">
        <a class="ghost-link" href="#bind">去登录</a>
      </div>
    `;
    setDrawServiceMessage("");
    return;
  }

  const balance = Number(quota?.balance ?? profile?.quota_balance ?? 0);
  if (!normalizeDrawServiceAmount(selectedDrawServiceAmount)) {
    selectedDrawServiceAmount = DRAW_SERVICE_MIN_QUOTA;
  }

  drawServiceBody.innerHTML = `
    <form id="draw-service-form" class="form-grid" novalidate>
      <div class="draw-service-balance-card">
        <strong>当前可用额度 ${balance}</strong>
        <span class="muted">代抽单提交后会立即扣额度，管理员确认完成后按规则返还卡和阶段奖励。</span>
      </div>
      <label>
        代抽额度
        <input
          id="draw-service-amount-input"
          type="number"
          min="${DRAW_SERVICE_MIN_QUOTA}"
          step="${DRAW_SERVICE_STEP_QUOTA}"
          value="${selectedDrawServiceAmount}"
          required
        />
      </label>
      <div class="preset-list">
        ${[200, 1000, 2000, 5000, 10000, 50000]
          .map(
            (amount) => `
              <button
                class="preset-chip ${Number(selectedDrawServiceAmount) === Number(amount) ? "active" : ""}"
                type="button"
                data-draw-service-amount="${amount}"
              >${amount} 额度</button>
            `
          )
          .join("")}
      </div>
      <div class="recharge-quote">
        <span class="muted">本次代抽预览</span>
        <strong id="draw-service-quote-value"></strong>
        <span id="draw-service-quote-detail" class="muted"></span>
      </div>
      <div class="stack-item muted">
        返还卡由管理员代抽后人工录入；如需代抽视频确认真实性，请在“我的信息”里的“订单帮助”中，通过微信群联系管理员索取。
      </div>
      <div class="actions">
        <button class="primary" type="submit">提交代抽订单</button>
      </div>
    </form>
  `;

  const amountInput = document.getElementById("draw-service-amount-input");
  amountInput?.addEventListener("input", () => {
    const nextValue = Number(amountInput.value || 0);
    if (Number.isFinite(nextValue)) {
      selectedDrawServiceAmount = nextValue;
    }
    updateDrawServiceQuote();
  });

  drawServiceBody.querySelectorAll("[data-draw-service-amount]").forEach((button) => {
    button.addEventListener("click", () => {
      const amount = Number(button.getAttribute("data-draw-service-amount") || 0);
      selectedDrawServiceAmount = amount;
      if (amountInput) amountInput.value = String(amount);
      renderDrawServiceZone(currentProfile, currentQuota);
    });
  });

  document.getElementById("draw-service-form")?.addEventListener("submit", submitDrawServiceOrder);
  updateDrawServiceQuote();
  setDrawServiceMessage("");
}

async function submitDrawServiceOrder(event) {
  event.preventDefault();
  const amountInput = document.getElementById("draw-service-amount-input");
  const normalizedAmount = normalizeDrawServiceAmount(amountInput?.value || selectedDrawServiceAmount);
  const balance = Number(currentQuota?.balance ?? currentProfile?.quota_balance ?? 0);

  if (!currentProfile) {
    setDrawServiceMessage("请先登录后再提交代抽订单。", "error");
    window.location.hash = "bind";
    return;
  }
  if (!normalizedAmount) {
    setDrawServiceMessage("代抽额度最低 200。", "error");
    return;
  }
  const rawAmount = Number(amountInput?.value || selectedDrawServiceAmount);
  if (amountInput) {
    amountInput.value = String(normalizedAmount);
  }
  selectedDrawServiceAmount = normalizedAmount;
  if (normalizedAmount > balance) {
    const adjustedText =
      Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== normalizedAmount
        ? `已按 ${normalizedAmount} 额度补齐；`
        : "";
    setDrawServiceMessage(`${adjustedText}当前额度不足，先去获取额度再来提交。`, "error");
    return;
  }

  try {
    const order = await apiFetch("/orders/draw-service", {
      method: "POST",
      body: JSON.stringify({ amount_quota: normalizedAmount }),
    });
    const adjustedText =
      Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== normalizedAmount
        ? `已自动补齐到 ${normalizedAmount} 额度。`
        : "";
    setDrawServiceMessage(
      `${adjustedText}代抽单 #${order.id} 已提交，管理员代抽后会返还符合规则的卡，并在确认时录入返还结果。`,
      "success"
    );
    await loadAccount();
  } catch (error) {
    setDrawServiceMessage(`代抽提交失败：${error.message}`, "error");
  }
}

function setAuctionMessage(text, type = "") {
  if (!auctionMessage) return;
  auctionMessage.textContent = text || "";
  auctionMessage.className = type ? `notice ${type}` : "notice";
}

function formatAuctionStatusLabel(status) {
  switch (String(status || "").trim()) {
    case "live":
      return "进行中";
    case "scheduled":
      return "即将开始";
    case "ended":
      return "等待结算";
    case "settled":
      return "已成交";
    case "cancelled":
      return "已流拍";
    default:
      return status || "-";
  }
}

function formatAuctionTimeLabel(auction) {
  const status = String(auction?.status || "").trim();
  if (status === "scheduled") {
    return `开始时间：${formatDate(auction?.starts_at || "")}`;
  }
  if (status === "settled") {
    return `成交时间：${formatDate(auction?.settled_at || auction?.updated_at || "")}`;
  }
  if (status === "cancelled") {
    return `流拍时间：${formatDate(auction?.cancelled_at || auction?.updated_at || "")}`;
  }
  return `截止时间：${formatDate(auction?.ends_at || "")}`;
}

function formatAuctionCountdownDuration(targetTimeMs, nowMs = Date.now()) {
  const diff = Math.max(0, Number(targetTimeMs || 0) - Number(nowMs || 0));
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}天 ${String(hours).padStart(2, "0")}时`;
  if (hours > 0) return `${hours}时 ${String(minutes).padStart(2, "0")}分`;
  if (minutes > 0) return `${minutes}分 ${String(seconds).padStart(2, "0")}秒`;
  return `${seconds}秒`;
}

function getAuctionCountdownMeta(auction, nowMs = Date.now()) {
  const status = String(auction?.status || "").trim();
  const startMs = new Date(auction?.starts_at || "").getTime();
  const endMs = new Date(auction?.ends_at || "").getTime();
  if (status === "scheduled") {
    if (Number.isFinite(startMs) && startMs > nowMs) {
      return {
        tone: "scheduled",
        label: "距开始",
        value: formatAuctionCountdownDuration(startMs, nowMs),
      };
    }
    return { tone: "scheduled", label: "即将开始", value: "请稍后刷新" };
  }
  if (status === "live") {
    if (Number.isFinite(endMs) && endMs > nowMs) {
      const remaining = endMs - nowMs;
      return {
        tone: remaining <= 10 * 60 * 1000 ? "urgent" : remaining <= 60 * 60 * 1000 ? "soon" : "live",
        label: "距结束",
        value: formatAuctionCountdownDuration(endMs, nowMs),
      };
    }
    return { tone: "ended", label: "已结束", value: "等待管理员结算" };
  }
  if (status === "ended") return { tone: "ended", label: "已结束", value: "等待管理员结算" };
  if (status === "settled") return { tone: "settled", label: "拍卖结果", value: "已成交" };
  if (status === "cancelled") return { tone: "cancelled", label: "拍卖结果", value: "已流拍" };
  return { tone: "default", label: "拍卖状态", value: formatAuctionStatusLabel(status) };
}

function renderAuctionCountdown(auction) {
  const meta = getAuctionCountdownMeta(auction);
  return `
    <div class="auction-countdown ${escapeHtml(meta.tone)}" data-auction-countdown-id="${auction.id}">
      <span class="auction-countdown-label">${escapeHtml(meta.label)}</span>
      <strong class="auction-countdown-value">${escapeHtml(meta.value)}</strong>
    </div>
  `;
}

function renderAuctionBidQuickChips(nextMinBid) {
  const options = [
    { label: "最低价", amount: nextMinBid },
    { label: "+500", amount: nextMinBid + 500 },
    { label: "+1000", amount: nextMinBid + 1000 },
    { label: "+2000", amount: nextMinBid + 2000 },
    { label: "+5000", amount: nextMinBid + 5000 },
  ];
  return `
    <div class="auction-bid-quick-list">
      ${options
        .map(
          (option) => `
            <button
              class="ghost auction-bid-quick-btn"
              type="button"
              data-auction-bid-target="${Number(option.amount || 0)}"
            >${escapeHtml(option.label)}</button>
          `
        )
        .join("")}
    </div>
  `;
}

function getAuctionBidSummary(auctionId) {
  return (
    currentAuctionBidSummaries.find(
      (item) => Number(item.auction_id || 0) === Number(auctionId || 0)
    ) || null
  );
}

function renderAuctionZone(profile) {
  if (!auctionBody) return;

  if (auctionStatusTabs) {
    auctionStatusTabs.querySelectorAll("[data-auction-status]").forEach((button) => {
      button.classList.toggle(
        "active",
        String(button.getAttribute("data-auction-status") || "") === activeAuctionStatus
      );
    });
  }

  const filteredAuctions = currentAuctions.filter(
    (auction) => String(auction?.status || "").trim() === activeAuctionStatus
  );

  if (!filteredAuctions.length) {
    auctionBody.innerHTML = `<div class="stack-item">当前这个分组里还没有拍卖商品。</div>`;
    return;
  }

  auctionBody.innerHTML = filteredAuctions
    .map((auction) => {
      const item = auction?.item || {};
      const termBadges = parseTermBadges(item?.ext_attrs, item);
      const myBid = getAuctionBidSummary(auction.id);
      const canBid = profile && String(auction?.status || "").trim() === "live";
      const suggestedBid = Number(auction?.next_min_bid_quota || auction?.starting_price_quota || 0);
      const currentPrice = Number(auction.current_price_quota || 0);
      const startingPrice = Number(auction.starting_price_quota || 0);
      const minIncrement = Number(auction.min_increment_quota || 0);
      const itemSubtitle = isBundle(item)
        ? `${getTierLabel(item)} / ${escapeHtml(item.uid || "")}`
        : `${getTierLabel(item)} / ID ${item.legacy_id || "-"} / ${escapeHtml(getSeasonDisplayText(item))}`;
      const recommendedBid =
        myBid && !myBid.is_leading
          ? Math.max(suggestedBid, Number(myBid.highest_bid_amount || 0) + minIncrement)
          : suggestedBid;
      const myStatus = myBid
        ? myBid.is_leading
          ? "你当前领先"
          : `你出过价，最高 ${Number(myBid.highest_bid_amount || 0)}`
        : profile
          ? "你还没有出价"
          : "登录后才能出价";

      return `
        <article class="admin-card auction-card" data-auction-id="${auction.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(auction.title || item.name || `拍卖 #${auction.id}`)}</div>
            <span class="chip">${escapeHtml(formatAuctionStatusLabel(auction.status))}</span>
          </div>
          ${renderAuctionCountdown(auction)}
          <div class="auction-card-layout">
            <div class="auction-card-visual">
              ${item && item.name ? renderProductVisual(item, "grid") : '<div class="product-visual fallback">拍卖商品</div>'}
            </div>
            <div class="auction-card-main">
              <div class="auction-card-headline">
                <div class="product-name">${escapeHtml(item.name || "-")}</div>
                <div class="product-type-chip">${itemSubtitle}</div>
              </div>
              ${
                isBundle(item)
                  ? `<div class="product-meta">${escapeHtml(item.description || item.main_attrs || "套餐商品")}</div>`
                  : `
                    <div class="product-stats-grid compact">
                      ${renderStatBlock("攻击", item.attack_value, isAttackFull(item), true)}
                      ${renderStatBlock("血量", item.hp_value, isHpFull(item), true)}
                    </div>
                    <div class="term-row compact">
                      ${
                        termBadges.length > 0
                          ? termBadges.map((badge) => renderTermBadge(badge)).join("")
                          : '<span class="term-empty">无词条</span>'
                      }
                    </div>
                  `
              }
              <div class="auction-summary-grid">
                <div class="auction-summary-card primary">
                  <span class="label">当前最高价</span>
                  <strong>${currentPrice}</strong>
                  <span class="cash">${escapeHtml(getQuotaCashText(currentPrice))}</span>
                </div>
                <div class="auction-summary-card">
                  <span class="label">出价人</span>
                  <strong>${escapeHtml(auction.leading_bidder_label || "无")}</strong>
                  <span class="muted">共 ${Number(auction.bid_count || 0)} 次出价</span>
                </div>
              </div>
              <div class="auction-meta-row">
                <span>起拍 ${startingPrice}</span>
                <span>最低加价 ${minIncrement}</span>
                <span>下次最低 ${suggestedBid}</span>
              </div>
              <div class="auction-meta-note">${escapeHtml(myStatus)}</div>
            </div>
          </div>
          ${
            canBid
              ? `
                <div class="auction-bid-box">
                  ${renderAuctionBidQuickChips(suggestedBid)}
                  <div class="inline-form auction-bid-form">
                    <div class="auction-bid-input-wrap">
                      <div class="auction-bid-input-row">
                        <input
                          data-field="auction-bid-amount"
                          type="number"
                          min="${suggestedBid}"
                          step="1"
                          inputmode="numeric"
                          value="${recommendedBid}"
                        />
                        <button class="primary submit-auction-bid-btn" type="button">提交出价</button>
                      </div>
                      <div class="auction-bid-hint">
                        你可以直接输入更高价格，不必只加最低档；拍卖成功后请加管理员微信 18930468426 沟通支付。
                      </div>
                      <div class="auction-bid-preview muted" data-field="auction-bid-preview">
                        本次出价约 ${escapeHtml(getQuotaCashText(recommendedBid))}
                      </div>
                    </div>
                  </div>
                </div>
              `
              : `<div class="stack-item muted">${
                  profile
                    ? "这个拍卖当前不能继续出价，可以等管理员结算或切到其它分组。"
                    : "登录后可参与拍卖出价。"
                }</div>`
          }
        </article>
      `;
    })
    .join("");
}

async function loadAuctions() {
  try {
    const [auctionResult, myBidResult] = await Promise.all([
      apiFetch("/products/auctions"),
      currentProfile ? apiFetch("/orders/auctions/mine").catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
    ]);
    currentAuctions = Array.isArray(auctionResult?.items) ? auctionResult.items : [];
    currentAuctionBidSummaries = Array.isArray(myBidResult?.items) ? myBidResult.items : [];
    renderAuctionZone(currentProfile);
  } catch (error) {
    currentAuctions = [];
    currentAuctionBidSummaries = [];
    renderAuctionZone(currentProfile);
    setAuctionMessage(`拍卖列表加载失败：${pickErrorMessage(error, "加载失败")}`, "error");
  }
}

async function submitAuctionBid(auctionId, amountQuota) {
  try {
    const result = await apiFetch(`/orders/auctions/${auctionId}/bids`, {
      method: "POST",
      body: JSON.stringify({ amount_quota: Number(amountQuota) }),
    });
    setAuctionMessage(
      `拍卖 #${auctionId} 出价成功，当前价格 ${Number(result.current_price_quota || 0)} 额度。`,
      "success"
    );
    await Promise.all([loadAuctions(), loadAccount()]);
  } catch (error) {
    setAuctionMessage(`出价失败：${pickErrorMessage(error, "出价失败")}`, "error");
  }
}

function updateAuctionBidPreview(card) {
  if (!card) return;
  const amountInput = card.querySelector('[data-field="auction-bid-amount"]');
  const previewNode = card.querySelector('[data-field="auction-bid-preview"]');
  if (!amountInput || !previewNode) return;
  const auctionId = Number(card.getAttribute("data-auction-id") || 0);
  const auction = currentAuctions.find((item) => Number(item?.id || 0) === auctionId) || null;
  const nextMinBid = Number(auction?.next_min_bid_quota || auction?.starting_price_quota || 0);
  const enteredAmount = Number(amountInput.value || 0);
  if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
    previewNode.textContent = `最低可出 ${nextMinBid} 额度，约 ${getQuotaCashText(nextMinBid)}。`;
    return;
  }
  if (enteredAmount < nextMinBid) {
    previewNode.textContent = `当前输入 ${enteredAmount} 额度，低于最低可出 ${nextMinBid} 额度。`;
    return;
  }
  previewNode.textContent = `本次出价 ${enteredAmount} 额度，约 ${getQuotaCashText(enteredAmount)}。`;
}

function updateAuctionCountdowns() {
  if (!auctionBody) return;
  const nodes = auctionBody.querySelectorAll("[data-auction-countdown-id]");
  if (!nodes.length) return;
  const nowMs = Date.now();
  nodes.forEach((node) => {
    const auctionId = Number(node.getAttribute("data-auction-countdown-id") || 0);
    const auction = currentAuctions.find((item) => Number(item?.id || 0) === auctionId);
    if (!auction) return;
    const meta = getAuctionCountdownMeta(auction, nowMs);
    node.className = `auction-countdown ${meta.tone}`;
    const labelNode = node.querySelector(".auction-countdown-label");
    const valueNode = node.querySelector(".auction-countdown-value");
    if (labelNode) labelNode.textContent = meta.label;
    if (valueNode) valueNode.textContent = meta.value;
  });
}


function renderGuideGlyph(type) {
  if (type === "account") {
    return `
      <svg viewBox="0 0 48 48" class="guide-glyph" aria-hidden="true">
        <circle cx="24" cy="16" r="8" fill="currentColor" opacity="0.22"></circle>
        <path d="M24 9a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 20c8.6 0 15 4.4 15 10v2H9v-2c0-5.6 6.4-10 15-10Z" fill="currentColor"></path>
      </svg>
    `;
  }
  if (type === "recharge") {
    return `
      <svg viewBox="0 0 48 48" class="guide-glyph" aria-hidden="true">
        <rect x="8" y="12" width="32" height="24" rx="8" fill="currentColor" opacity="0.18"></rect>
        <path d="M14 20h20M14 28h9" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path>
        <circle cx="33" cy="28" r="5" fill="currentColor"></circle>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 48 48" class="guide-glyph" aria-hidden="true">
      <path d="M10 15h18l10 9-10 9H10a4 4 0 0 1-4-4V19a4 4 0 0 1 4-4Z" fill="currentColor" opacity="0.18"></path>
      <path d="M12 18h14l7 6-7 6H12Z" fill="currentColor"></path>
      <circle cx="35" cy="24" r="4" fill="#fff6e8"></circle>
    </svg>
  `;
}

function formatRecentSaleTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60 * 1000) return "刚刚";
  if (diff < 60 * 60 * 1000) return `${Math.max(Math.floor(diff / (60 * 1000)), 1)} 分钟前`;
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.max(Math.floor(diff / (60 * 60 * 1000)), 1)} 小时前`;
  }
  if (diff < 3 * 24 * 60 * 60 * 1000) {
    return `${Math.max(Math.floor(diff / (24 * 60 * 60 * 1000)), 1)} 天前`;
  }
  return formatDate(value);
}

function setActiveGuidePage(page) {
  activeGuidePage = page === "sales" ? "sales" : "tutorial";
  if (beginnerCarouselTrack) {
    beginnerCarouselTrack.style.transform =
      activeGuidePage === "sales" ? "translateX(-100%)" : "translateX(0)";
  }
  beginnerGuideTabs.forEach((button) => {
    const isActive = button.getAttribute("data-guide-page-target") === activeGuidePage;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  if (beginnerGuidePrevBtn) beginnerGuidePrevBtn.disabled = activeGuidePage === "tutorial";
  if (beginnerGuideNextBtn) beginnerGuideNextBtn.disabled = activeGuidePage === "sales";
}

function renderRecentSales(items = []) {
  if (!recentSalesList) return;
  if (!Array.isArray(items) || items.length === 0) {
    recentSalesList.innerHTML = `
      <div class="recent-sales-empty">
        <div class="panel-title">最近成交正在准备中</div>
        <div class="muted">等第一批成交确认后，这里会自动展示匿名成交摘要。</div>
      </div>
    `;
    return;
  }

  recentSalesList.innerHTML = items
    .map(
      (item) => `
        <article class="recent-sale-item">
          <div class="recent-sale-top">
            <span class="chip subtle-chip">${escapeHtml(item.order_source_label || "商城成交")}</span>
            <span class="recent-sale-time">${escapeHtml(formatRecentSaleTime(item.created_at))}</span>
          </div>
          <div class="recent-sale-title">${escapeHtml(item.buyer_label || "匿名用户")} 买下 ${escapeHtml(item.item_title || "已成交商品")}</div>
          <div class="recent-sale-meta">
            <span>${escapeHtml(item.item_kind_label || "商品")} / ${Number(item.item_count || 1)} 项</span>
            <span>${Number(item.total_quota || 0)} 额度</span>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadRecentSales() {
  try {
    const result = await apiFetch("/products/recent-sales?limit=8");
    recentSalesItems = Array.isArray(result?.items) ? result.items : [];
    renderRecentSales(recentSalesItems);
  } catch (error) {
    console.error(error);
    renderRecentSales([]);
  }
}

function renderBeginnerGuide(profile, orders = [], rechargeOrders = []) {
  if (!beginnerGuideSteps || !beginnerGuideSummary || !beginnerGuideReward) return;

  const rewardQuota = Number(profile?.beginner_guide_reward_quota || BEGINNER_GUIDE_REWARD_QUOTA);
  const hasAccount = Boolean(profile);
  const hasApprovedRecharge = rechargeOrders.some((order) => order.status === "approved");
  const hasPendingRecharge = rechargeOrders.some((order) => order.status === "pending_review");
  const hasConfirmedOrder = orders.some((order) => order.status === "confirmed");
  const hasPendingOrder = orders.some((order) =>
    ["pending", "cancel_requested"].includes(String(order.status || ""))
  );
  const rewardEarned = Boolean(profile?.beginner_guide_reward_earned);

  if (beginnerFlowSection) {
    beginnerFlowSection.classList.remove("hidden");
  }

  const steps = [
    {
      index: "01",
      type: "account",
      title: "注册并登录",
      done: hasAccount,
      current: !hasAccount,
      description: hasAccount
        ? `当前账号：${escapeHtml(profile.game_role_name || profile.game_role_id || "已登录")}`
        : "先进入注册或登录，后续充值和下单都会绑定在这个账号下。",
      actionLabel: hasAccount ? "已完成" : "去注册登录",
      actionHref: "#bind",
      actionTarget: "",
    },
    {
      index: "02",
      type: "recharge",
      title: "获取一次额度",
      done: hasApprovedRecharge,
      current: hasAccount && !hasApprovedRecharge,
      description: hasApprovedRecharge
        ? "通过残卷赠送或充值获取额度，额度已经到账。"
        : hasPendingRecharge
          ? "你已经提交过残卷赠送或充值申请，等待管理员审核通过后就算完成这一步。"
          : "去“我的”里通过残卷赠送或充值获取额度，审核通过后会自动到账。",
      actionLabel: hasApprovedRecharge ? "已完成" : hasPendingRecharge ? "查看进度" : "去获取额度",
      actionHref: "#account",
      actionTarget: "recharge",
    },
    {
      index: "03",
      type: "order",
      title: "完成首单消费",
      done: hasConfirmedOrder,
      current: hasAccount && hasApprovedRecharge && !hasConfirmedOrder,
      description: hasConfirmedOrder
        ? rewardEarned
          ? `首单已完成，奖励 ${rewardQuota} 额度已经发放。`
          : "首单已完成，奖励会自动到账。"
        : hasPendingOrder
          ? "你已经提交过订单，等管理员确认后就算完成首单。"
          : "从商城挑一件合适的商品下单，管理员确认后就能完成首单。",
      actionLabel: hasConfirmedOrder ? "已完成" : hasPendingOrder ? "查看订单" : "去选商品",
      actionHref: hasConfirmedOrder || hasPendingOrder ? "#account" : "#products",
      actionTarget: hasConfirmedOrder || hasPendingOrder ? "orders" : "",
    },
  ];

  beginnerGuideSummary.textContent = rewardEarned
    ? `新手教学奖励已到账 ${rewardQuota} 额度，你可以继续直接下单，也可以切到最近成交查看公开流水。`
    : hasConfirmedOrder && hasApprovedRecharge
      ? `三步已完成，系统会自动发放 ${rewardQuota} 额度奖励。`
      : `完成注册、获取一次额度、完成首单后，额外奖励 ${rewardQuota} 额度。`;
  beginnerGuideReward.textContent = rewardEarned
    ? `奖励已发放 +${rewardQuota}`
    : `完成三步奖励 ${rewardQuota} 额度`;
  beginnerGuideReward.classList.toggle("claimed", rewardEarned);

  beginnerGuideSteps.innerHTML = rewardEarned
    ? `
      <article class="tutorial-complete-card">
        <div class="tutorial-step-icon">${renderGuideGlyph("order")}</div>
        <div class="flow-step-index">GUIDE COMPLETE</div>
        <div class="flow-step-title">新手奖励已经到账</div>
        <div class="muted">你已经完成注册、获取额度和首单消费，后面可以直接逛商城，也可以切到“最近成交”查看公开成交摘要。</div>
        <div class="actions">
          <a class="ghost-link tutorial-link" href="#products">继续逛商城</a>
          <a class="ghost-link tutorial-link" href="#account">查看我的信息</a>
        </div>
      </article>
    `
    : steps
        .map((step) => {
          const statusLabel = step.done ? "已完成" : step.current ? "当前推荐" : "未完成";
          const statusClass = step.done ? "done" : step.current ? "current" : "pending";
          const actionAttrs = step.actionTarget ? ` data-account-tab-target="${step.actionTarget}"` : "";
          return `
            <article class="flow-step tutorial-step ${statusClass}">
              <div class="tutorial-step-top">
                <div class="tutorial-step-icon">${renderGuideGlyph(step.type)}</div>
                <span class="tutorial-status ${statusClass}">${statusLabel}</span>
              </div>
              <div class="flow-step-index">${step.index}</div>
              <div class="flow-step-title">${step.title}</div>
              <div class="muted">${step.description}</div>
              <a class="ghost-link tutorial-link" href="${step.actionHref}"${actionAttrs}>${step.actionLabel}</a>
            </article>
          `;
        })
        .join("");
}

function renderProfile(profile, quota, orders) {
  if (!profile) {
    accountProfile.innerHTML = '<div class="stack-item">请先登录后查看账号信息。</div>';
    quotaBalance.textContent = "-";
    orderList.innerHTML = '<div class="stack-item">登录后可查看最近订单。</div>';
    setAccountMessage("");
    return;
  }

  const memberStatus = profile.season_member_active
    ? `本赛季会员，权益截止 ${escapeHtml(formatDate(profile.season_member_expires_at || ""))}`
    : "当前未开通";
  const memberBenefit = profile.season_member_active
    ? `后续获得额度额外 +${Number(profile.season_member_bonus_percent || 0)}%`
    : `开通后获得额度额外 +${Number(profile.season_member_bonus_percent || 0)}%`;
  const beginnerRewardStatus = profile.beginner_guide_reward_earned
    ? `已领取 ${Number(profile.beginner_guide_reward_quota || BEGINNER_GUIDE_REWARD_QUOTA)} 额度`
    : `完成教学三步后可领取 ${Number(profile.beginner_guide_reward_quota || BEGINNER_GUIDE_REWARD_QUOTA)} 额度`;

  accountProfile.innerHTML = [
    `角色名称：${escapeHtml(profile.game_role_name || "-")}`,
    `游戏 ID：${escapeHtml(profile.game_role_id || "-")}`,
    `区服：${escapeHtml(profile.game_server || "-")}`,
    `账号角色：${escapeHtml(profile.role || "-")}`,
    `登录方式：${escapeHtml(profile.auth_provider === "password" ? "密码登录" : "绑定登录")}`,
    `昵称：${escapeHtml(profile.nickname || "-")}`,
    `会员状态：${memberStatus}`,
    `会员权益：${memberBenefit}`,
    `新手奖励：${beginnerRewardStatus}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  quotaBalance.textContent = String(quota?.balance ?? profile.quota_balance ?? 0);

  if (!orders || orders.length === 0) {
    orderList.innerHTML = '<div class="stack-item">暂时没有订单。</div>';
    return;
  }

  orderList.innerHTML = orders
    .map((order) => {
      const itemNames = (order.items || []).map((item) => item.product_name).join(" / ");
      const drawMeta = getDrawServiceMeta(order);
      const remark = order.remark ? `<div class="muted">备注：${escapeHtml(order.remark)}</div>` : "";
      const drawLines =
        isDrawServiceOrder(order) && drawMeta
          ? `
              <div class="muted">代抽额度：${Number(drawMeta.amount_quota || order.total_quota || 0)} / 赛季：${escapeHtml(drawMeta.season_label || "-")}</div>
              ${drawMeta.returned_cards_text ? `<div class="muted">返还卡：${escapeHtml(drawMeta.returned_cards_text)}</div>` : ""}
              ${drawMeta.reward_summary ? `<div class="muted">阶段奖励：${escapeHtml(drawMeta.reward_summary)}</div>` : ""}
              ${drawMeta.best_gold_card ? `<div class="muted">图鉴金卡：${escapeHtml(drawMeta.best_gold_card)}</div>` : ""}
            `
          : "";
      const actions =
        order.status === "pending"
          ? `<div class="actions"><button class="ghost request-cancel-btn" type="button" data-order-id="${order.id}">申请取消</button></div>`
          : order.status === "cancel_requested"
            ? '<div class="muted">已提交取消申请，等待管理员审核。</div>'
            : "";

      return `
        <div class="stack-item">
          <div>订单 #${order.id} / ${escapeHtml(formatOrderStatus(order.status))}</div>
          <div class="muted">${escapeHtml(isDrawServiceOrder(order) ? "代抽项目" : "商品")}：${escapeHtml(itemNames || "-")}</div>
          <div class="muted">消耗：${Number(order.total_quota || 0)} / 下单时间：${formatDate(order.created_at)}</div>
          ${drawLines}
          ${remark}
          ${actions}
        </div>
      `;
    })
    .join("");
}

function findPendingSeasonMemberOrder(rechargeOrders, rechargeConfig) {
  return (rechargeOrders || []).find(
    (order) =>
      order.order_type === "season_member" &&
      order.status === "pending_review" &&
      String(order.season_label || "") === String(rechargeConfig?.season_member_season_label || "")
  ) || null;
}

function isResidualTransferOrder(order) {
  return String(order?.order_type || "").trim() === "residual_transfer";
}

function formatRechargeOrderTitle(order) {
  if (order?.order_title) return order.order_title;
  if (isResidualTransferOrder(order)) return "残卷转赠";
  if (order?.order_type === "season_member") return "赛季会员";
  return "普通充值";
}

function formatRechargeOrderAmountLine(order) {
  const quotaLine =
    Number(order?.bonus_quota_amount || 0) > 0
      ? `到账：${Number(order?.base_quota_amount || 0)} 基础 + ${Number(order?.bonus_quota_amount || 0)} 加成 = ${Number(order?.quota_amount || 0)} 额度`
      : `到账：${Number(order?.quota_amount || 0)} 额度`;

  if (isResidualTransferOrder(order)) {
    return `转赠：${Number(order?.transfer_amount || order?.amount_yuan || 0)} ${escapeHtml(order?.transfer_unit || "残卷")} / ${quotaLine}`;
  }

  return `金额：${formatCashAmount(order?.amount_yuan || 0)} / ${quotaLine} / 支付方式：${escapeHtml(formatRechargeChannelLabel(order?.channel))}`;
}

function formatRechargeReferenceLine(order) {
  const label = isResidualTransferOrder(order) ? "转赠时间" : "付款时间";
  return `${label}：${escapeHtml(order?.payment_reference || "-")}`;
}

function getRechargeQuoteSummary(profile, rechargeConfig, amountYuan, orderType = "normal") {
  const normalizedType =
    orderType === "season_member"
      ? "season_member"
      : orderType === "residual_transfer"
        ? "residual_transfer"
        : "normal";
  const seasonLabel = rechargeConfig?.season_member_season_label || "当前赛季";
  const seasonExpiresText = rechargeConfig?.season_member_expires_at
    ? formatDate(rechargeConfig.season_member_expires_at)
    : "-";
  const bonusPercent = Number(rechargeConfig?.season_member_bonus_percent || 0);

  if (normalizedType === "season_member") {
    const memberQuota = Number(rechargeConfig?.season_member_quota || 0);
    const memberAmount = Number(rechargeConfig?.season_member_price_yuan || 0);
    return {
      orderType: normalizedType,
      amountYuan: memberAmount,
      baseQuota: memberQuota,
      bonusQuota: 0,
      totalQuota: memberQuota,
      amountLabel: `${memberAmount} 元开通 ${seasonLabel} 会员`,
      detailLabel: `会员截止 ${seasonExpiresText}，后续每次获得额度额外 +${bonusPercent}%`,
      submitLabel: "已付款，申请开通会员",
      lockedAmount: true,
      amountInputLabel: "充值金额（元）",
      amountInputMin: memberAmount,
      amountInputStep: 1,
      referenceLabel: "付款时间",
      referencePlaceholder: "建议填写付款时间，例如 19:42",
      notePlaceholder: "例如：已付款，如需补充可写角色名或付款方式",
    };
  }

  if (normalizedType === "residual_transfer") {
    const normalizedAmount = Math.max(Number(amountYuan) || 0, 0);
    const quotaPerUnit = Math.max(Number(rechargeConfig?.residual_quota_per_unit || 1), 1);
    const unitLabel = rechargeConfig?.residual_unit_label || "残卷";
    const targetRoleId = rechargeConfig?.residual_admin_role_id || "584967604";
    const baseQuota = normalizedAmount * quotaPerUnit;
    const bonusQuota = profile?.season_member_active
      ? Math.floor(baseQuota * Number(rechargeConfig?.season_member_bonus_rate || 0))
      : 0;
    return {
      orderType: normalizedType,
      amountYuan: normalizedAmount,
      baseQuota,
      bonusQuota,
      totalQuota: baseQuota + bonusQuota,
      amountLabel: `1 ${unitLabel} = ${quotaPerUnit} 额度`,
      detailLabel: profile?.season_member_active
        ? `游戏内直接转给管理员 ${targetRoleId}，会员加成已生效，本次额外赠送 ${bonusQuota} 额度。`
        : `游戏内直接转给管理员 ${targetRoleId}，管理员审核后到账。`,
      submitLabel: "已转赠，提交审核",
      lockedAmount: false,
      amountInputLabel: `${unitLabel}数量`,
      amountInputMin: 1,
      amountInputStep: 1,
      referenceLabel: "转赠时间",
      referencePlaceholder: "建议填写转赠时间，例如 19:42",
      notePlaceholder: "例如：19:42 转给 584967604 共 300 残卷",
    };
  }

  const normalizedAmount = Math.max(Number(amountYuan) || 0, 0);
  const baseQuota = Math.round(
    (normalizedAmount * Number(rechargeConfig?.exchange_quota || 0)) /
      Math.max(Number(rechargeConfig?.exchange_yuan || 1), 1)
  );
  const bonusQuota = profile?.season_member_active
    ? Math.floor(baseQuota * Number(rechargeConfig?.season_member_bonus_rate || 0))
    : 0;
  const totalQuota = baseQuota + bonusQuota;
  const detailLabel = profile?.season_member_active
    ? `会员加成已生效，本次额外赠送 ${bonusQuota} 额度。`
    : "支持任意金额转账，系统会按当前比例实时折算到账。";

  return {
    orderType: normalizedType,
    amountYuan: normalizedAmount,
    baseQuota,
    bonusQuota,
    totalQuota,
    amountLabel: `当前兑换比例：${Number(rechargeConfig?.exchange_yuan || 1)} 元 = ${Number(rechargeConfig?.exchange_quota || 0)} 额度`,
    detailLabel,
    submitLabel: "已付款，提交审核",
    lockedAmount: false,
    amountInputLabel: "充值金额（元）",
    amountInputMin: 0.01,
    amountInputStep: 0.01,
    referenceLabel: "付款时间",
    referencePlaceholder: "建议填写付款时间，例如 19:42",
    notePlaceholder: "例如：已付款，如需补充可写角色名或付款方式",
  };
}

function updateRechargeQuotePreview(profile, rechargeConfig) {
  const quoteNode = document.getElementById("recharge-quote-value");
  const detailNode = document.getElementById("recharge-quote-detail");
  if (!quoteNode || !detailNode || !rechargeConfig) return;

  const amountInput = document.getElementById("recharge-amount-input");
  const amountValue =
    selectedRechargeOrderType === "season_member"
      ? Number(rechargeConfig?.season_member_price_yuan || 0)
      : Number(amountInput?.value || selectedRechargeAmount || 0);
  const quoteSummary = getRechargeQuoteSummary(
    profile,
    rechargeConfig,
    amountValue,
    selectedRechargeOrderType
  );

  quoteNode.textContent = `${quoteSummary.totalQuota} 额度`;
  detailNode.textContent =
    quoteSummary.bonusQuota > 0
      ? `${quoteSummary.baseQuota} 基础额度 + ${quoteSummary.bonusQuota} 会员加成`
      : `${quoteSummary.baseQuota} 基础额度`;
}

function renderRechargeSection(profile, rechargeConfig, rechargeOrders) {
  if (!rechargeBody || !rechargeOrderList) return;

  if (!profile) {
    rechargeBody.innerHTML = '<div class="stack-item">登录后可发起额度充值申请。</div>';
    rechargeOrderList.innerHTML = '<div class="stack-item">登录后可查看充值记录。</div>';
    return;
  }

  if (!rechargeConfig?.enabled) {
    rechargeBody.innerHTML = '<div class="stack-item">当前暂未开放充值。</div>';
    rechargeOrderList.innerHTML = '<div class="stack-item">暂无充值记录。</div>';
    return;
  }

  const presets = Array.isArray(rechargeConfig.preset_amounts) && rechargeConfig.preset_amounts.length
    ? rechargeConfig.preset_amounts
    : [rechargeConfig.min_amount_yuan || rechargeConfig.exchange_yuan || 10];
  if (!isPositiveMoneyAmount(selectedRechargeAmount)) {
    selectedRechargeAmount = Number(presets[0]);
  }
  const availableRechargeTypes = ["normal", "season_member"];
  if (rechargeConfig?.residual_transfer_enabled) {
    availableRechargeTypes.push("residual_transfer");
  }
  if (!availableRechargeTypes.includes(selectedRechargeOrderType)) {
    selectedRechargeOrderType = "normal";
  }

  const pendingSeasonOrder = findPendingSeasonMemberOrder(rechargeOrders, rechargeConfig);
  const paymentMethods = getRechargePaymentMethods(rechargeConfig);
  const activePaymentMethod = ensureRechargePaymentChannel(rechargeConfig);
  const directPurchaseContext =
    selectedRechargeOrderType === "normal" && pendingDirectPurchaseContext
      ? pendingDirectPurchaseContext
      : null;
  if (directPurchaseContext && Number(selectedRechargeAmount) !== Number(directPurchaseContext.amountYuan)) {
    selectedRechargeAmount = Number(directPurchaseContext.amountYuan);
  }
  const quoteSummary = getRechargeQuoteSummary(
    profile,
    rechargeConfig,
    selectedRechargeOrderType === "season_member" ? rechargeConfig.season_member_price_yuan : selectedRechargeAmount,
    selectedRechargeOrderType
  );
  const memberStatusText = profile.season_member_active
    ? `你已开通 ${escapeHtml(profile.season_member_season_label || rechargeConfig.season_member_season_label || "当前赛季")} 会员，权益截止 ${escapeHtml(formatDate(profile.season_member_expires_at || rechargeConfig.season_member_expires_at || ""))}`
    : pendingSeasonOrder
      ? `你的 ${escapeHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员申请正在审核中。`
      : `${escapeHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员：${Number(rechargeConfig.season_member_price_yuan || 0)} 元得 ${Number(rechargeConfig.season_member_quota || 0)} 额度，后续获得额度额外 +${Number(rechargeConfig.season_member_bonus_percent || 0)}%。`;
  const seasonMemberDisabled = Boolean(profile.season_member_active || pendingSeasonOrder);
  const isResidualTransfer = selectedRechargeOrderType === "residual_transfer";
  const transferTargetRoleId = rechargeConfig?.residual_admin_role_id || "584967604";
  const transferTargetRoleName = rechargeConfig?.residual_admin_role_name || "admin残卷";
  const transferTargetGameName = rechargeConfig?.residual_admin_game_name || "繁星✨秋";
  const transferUnitLabel = rechargeConfig?.residual_unit_label || "残卷";
  const paymentMethodTabsHtml =
    !isResidualTransfer && paymentMethods.length > 1
      ? `
          <div class="preset-list">
            ${paymentMethods
              .map(
                (method) =>
                  `<button class="preset-chip ${selectedRechargePaymentChannel === method.key ? "active" : ""}" type="button" data-payment-channel="${method.key}">${escapeHtml(method.label)}</button>`
              )
              .join("")}
          </div>
        `
      : "";
  const submitLabel = directPurchaseContext ? "已转账，提交购买审核" : quoteSummary.submitLabel;
  const directPurchaseBannerHtml = directPurchaseContext
    ? `
        <div class="recharge-direct-banner">
          <div>
            <strong>当前是转账购买</strong>
            <div class="muted">${escapeHtml(directPurchaseContext.productName)} / ${directPurchaseContext.quotaAmount} 额度 / ${escapeHtml(formatCashAmount(directPurchaseContext.amountYuan))}</div>
            <div class="muted">这笔金额按商品精确价格预填，和普通充值分开显示。</div>
          </div>
          <button class="ghost" type="button" data-direct-purchase-clear="1">切回普通充值</button>
        </div>
      `
    : "";
  const sideCardHtml = isResidualTransfer
    ? `
        <div class="recharge-qr-card">
          <div><strong>${escapeHtml(transferTargetRoleName)}</strong></div>
          <div class="muted">游戏名称：${escapeHtml(transferTargetGameName)}</div>
          <div class="muted">游戏 ID：${escapeHtml(transferTargetRoleId)}</div>
          <div class="muted">兑换比例：1 ${escapeHtml(transferUnitLabel)} = ${Number(rechargeConfig?.residual_quota_per_unit || 1)} 额度</div>
          <div class="stack-list">
            ${(rechargeConfig.residual_instructions || []).map((line) => `<div class="stack-item">${escapeHtml(line)}</div>`).join("")}
          </div>
        </div>
      `
    : `
        <div class="recharge-qr-card">
          ${paymentMethodTabsHtml}
          <img class="recharge-qr-image" src="${escapeHtml(activePaymentMethod?.imageUrl || rechargeConfig.qr_image_url)}" alt="${escapeHtml(activePaymentMethod?.name || "收款码")}" />
          <div><strong>${escapeHtml(activePaymentMethod?.name || rechargeConfig.payee_name || "收款码")}</strong></div>
          <div class="muted">${escapeHtml(activePaymentMethod?.hint || rechargeConfig.payee_hint || "扫码转账后再提交审核")}</div>
          <div class="stack-list">
            ${(rechargeConfig.instructions || []).map((line) => `<div class="stack-item">${escapeHtml(line)}</div>`).join("")}
          </div>
        </div>
      `;

  rechargeBody.innerHTML = `
    <div class="recharge-layout">
      <div class="recharge-rate-banner">
        <strong>赛季会员</strong>
        <span>${memberStatusText}</span>
        <span class="muted">本赛季截止 ${escapeHtml(formatDate(rechargeConfig.season_member_expires_at || ""))}</span>
      </div>
      <div class="recharge-layout-split">
        ${sideCardHtml}
        <form id="recharge-form" class="form-grid">
          ${directPurchaseBannerHtml}
          <div class="preset-list">
            <button class="preset-chip ${selectedRechargeOrderType === "normal" ? "active" : ""}" type="button" data-recharge-order-type="normal">普通充值</button>
            <button class="preset-chip ${selectedRechargeOrderType === "season_member" ? "active" : ""}" type="button" data-recharge-order-type="season_member">赛季会员</button>
            ${rechargeConfig?.residual_transfer_enabled ? `<button class="preset-chip ${selectedRechargeOrderType === "residual_transfer" ? "active" : ""}" type="button" data-recharge-order-type="residual_transfer">残卷转赠</button>` : ""}
          </div>
          <div class="recharge-rate-banner">
            <strong>${escapeHtml(quoteSummary.amountLabel)}</strong>
            <span class="muted">${escapeHtml(quoteSummary.detailLabel)}</span>
          </div>
          <label>${escapeHtml(quoteSummary.amountInputLabel)}
            <input id="recharge-amount-input" type="number" min="${Number(quoteSummary.amountInputMin || 1)}" step="${Number(quoteSummary.amountInputStep || 1)}" value="${quoteSummary.amountYuan}" ${(quoteSummary.lockedAmount || directPurchaseContext) ? "readonly" : ""} />
          </label>
          ${selectedRechargeOrderType === "normal" && !directPurchaseContext ? `
            <div class="preset-list">
              ${presets
                .map((amount) => `<button class="preset-chip ${Number(amount) === Number(selectedRechargeAmount) ? "active" : ""}" type="button" data-recharge-amount="${amount}">${amount} 元</button>`)
                .join("")}
            </div>
          ` : ""}
          <div class="recharge-quote">
            <span class="muted">本次预计到账</span>
            <strong id="recharge-quote-value">${quoteSummary.totalQuota} 额度</strong>
            <span id="recharge-quote-detail" class="muted">${quoteSummary.baseQuota} 基础额度${quoteSummary.bonusQuota > 0 ? ` + ${quoteSummary.bonusQuota} 会员加成` : ""}</span>
          </div>
          <label>${escapeHtml(quoteSummary.referenceLabel)}
            <input id="recharge-payment-reference" type="text" maxlength="100" placeholder="${escapeHtml(quoteSummary.referencePlaceholder)}" required />
          </label>
          <label>补充说明（可选）
            <textarea id="recharge-note" rows="3" placeholder="${escapeHtml(quoteSummary.notePlaceholder)}"></textarea>
          </label>
          <div class="actions">
            <button id="recharge-submit-btn" class="primary" type="submit" ${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? "disabled" : ""}>${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? (profile.season_member_active ? "本赛季已开通" : "会员申请审核中") : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (!rechargeOrders || rechargeOrders.length === 0) {
    rechargeOrderList.innerHTML = '<div class="stack-item">暂无充值记录。</div>';
    return;
  }

  rechargeOrderList.innerHTML = rechargeOrders
    .map((order) => {
      const adminRemark = order.admin_remark ? `<div class="muted">审核备注：${escapeHtml(order.admin_remark)}</div>` : "";
      const payerNote = order.payer_note ? `<div class="muted">补充说明：${escapeHtml(order.payer_note)}</div>` : "";
      return `
        <div class="stack-item">
          <div>${escapeHtml(formatRechargeOrderTitle(order))} #${order.id} / ${escapeHtml(formatRechargeStatus(order.status))}</div>
          <div class="muted">${formatRechargeOrderAmountLine(order)}</div>
          <div class="muted">${formatRechargeReferenceLine(order)}</div>
          <div class="muted">提交时间：${formatDate(order.created_at)}</div>
          ${isResidualTransferOrder(order) ? `<div class="muted">转赠目标：${escapeHtml(order.transfer_target_role_name || "admin残卷")} / ${escapeHtml(order.transfer_target_role_id || "-")}</div>` : ""}
          ${order.season_label ? `<div class="muted">赛季：${escapeHtml(order.season_label)}</div>` : ""}
          ${payerNote}
          ${adminRemark}
        </div>
      `;
    })
    .join("");
}

function findProduct(itemId, itemKind) {
  return (
    allProducts.find(
      (item) =>
        Number(item.item_id) === Number(itemId) && String(item.item_kind) === String(itemKind)
    ) || null
  );
}

function openProductModal(itemId, itemKind) {
  const product = findProduct(itemId, itemKind);
  if (!product) return;

  activeItemId = Number(product.item_id);
  activeItemKind = product.item_kind || "card";
  setProductDetailMessage("");

  const termBadges = parseTermBadges(product.ext_attrs, product);
  const session = loadSession();
  const sessionProfile = session?.profile || null;
  const rechargeConfig = getEffectiveRechargeConfig();
  const directPurchaseContext = buildDirectPurchaseContext(product, rechargeConfig);
  const directResidualAmount = getDirectResidualAmount(product, rechargeConfig);
  const guestPaymentMethods = getGuestPurchaseMethods(rechargeConfig);
  const activeGuestPaymentMethod = ensureGuestTransferPaymentChannel(rechargeConfig);
  const isResidualGuestPurchase =
    String(activeGuestPaymentMethod?.key || "") === "game_residual_transfer";
  const stockLabel = product.stock === null || product.stock === undefined ? "不限量" : `${Number(product.stock)} 件`;
  const attackIsFull = isAttackFull(product);
  const hpIsFull = isHpFull(product);
  const cashPriceText = getProductCashPriceText(product);
  const originalPriceQuota = getOriginalQuotaPrice(product);
  const discounted = isDiscountedProduct(product);
  const detailRows = isBundle(product)
    ? `
        <div class="detail-row"><strong>类型</strong><span>套餐 SKU</span></div>
        <div class="detail-row"><strong>编码</strong><span>${escapeHtml(product.uid || "-")}</span></div>
        <div class="detail-row"><strong>库存</strong><span>${escapeHtml(stockLabel)}</span></div>
      `
    : `
        <div class="detail-row"><strong>攻击</strong><span>${renderFullStatValue(product.attack_value || 0, attackIsFull)}</span></div>
        <div class="detail-row"><strong>血量</strong><span>${renderFullStatValue(product.hp_value || 0, hpIsFull)}</span></div>
        <div class="detail-row"><strong>赛季</strong><span>${escapeHtml(getSeasonDisplayText(product))}</span></div>
        <div class="detail-row"><strong>库存</strong><span>${escapeHtml(stockLabel)}</span></div>
      `;

  productDetailBody.innerHTML = `
    <div class="product-detail-shell">
      <div class="product-detail-layout">
        <div class="product-detail-cover">${renderProductVisual(product, "detail")}</div>
        <div class="product-detail-main">
          <div class="product-headline">
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-type-chip">${escapeHtml(getTierLabel(product))} / ${escapeHtml(product.uid || "-")}</div>
          </div>
          ${isBundle(product) ? `<div class="product-meta">${escapeHtml(product.description || product.main_attrs || "套餐商品")}</div>` : ""}
          <div class="term-row">${termBadges.length > 0 ? termBadges.map((badge) => renderTermBadge(badge)).join("") : '<span class="term-empty">无额外词条</span>'}</div>
          <div class="detail-list">
            <div class="detail-row"><strong>价格</strong><span>${discounted ? `原价 ${originalPriceQuota} / ` : ""}${Number(product.price_quota || 0)} 额度${cashPriceText ? ` / ${escapeHtml(cashPriceText)}` : ""}${discounted ? ` / ${escapeHtml(product.discount_label || "折扣")}` : ""}</span></div>
            ${detailRows}
            <div class="detail-row"><strong>额度购买账号</strong><span>${escapeHtml(sessionProfile?.game_role_name || "未登录")}</span></div>
          </div>
          <div class="product-detail-actions">
            <button class="ghost" type="button" id="modal-close-btn">返回</button>
            <button class="ghost" type="button" id="direct-buy-btn">转账锁卡</button>
            <button class="primary" type="button" id="confirm-buy-btn">确认购买</button>
          </div>
        </div>
      </div>
      <div id="guest-transfer-panel" class="guest-transfer-panel hidden">
        ${
          directPurchaseContext && activeGuestPaymentMethod
            ? `
                <div class="guest-transfer-grid">
                  <div class="recharge-qr-card guest-transfer-card">
                    ${
                      guestPaymentMethods.length > 1
                        ? `
                            <div class="preset-list guest-transfer-methods">
                              ${guestPaymentMethods
                                .map(
                                  (method) => `
                                    <button
                                      class="preset-chip ${selectedGuestTransferPaymentChannel === method.key ? "active" : ""}"
                                      type="button"
                                      data-guest-payment-channel="${method.key}"
                                    >${escapeHtml(method.label)}</button>
                                  `
                                )
                                .join("")}
                            </div>
                          `
                        : ""
                    }
                    ${
                      isResidualGuestPurchase
                        ? `
                            <div class="guest-transfer-card-title"><strong>${escapeHtml(rechargeConfig?.residual_admin_role_name || "admin残卷")}</strong></div>
                            <div class="muted">游戏名称：${escapeHtml(rechargeConfig?.residual_admin_game_name || "-")}</div>
                            <div class="muted">游戏 ID：${escapeHtml(rechargeConfig?.residual_admin_role_id || "-")}</div>
                            <div class="muted">兑换比例：1 ${escapeHtml(rechargeConfig?.residual_unit_label || "残卷")} = ${Number(rechargeConfig?.residual_quota_per_unit || 1)} 额度</div>
                          `
                        : `
                            <img class="recharge-qr-image" src="${escapeHtml(activeGuestPaymentMethod.imageUrl || "")}" alt="${escapeHtml(activeGuestPaymentMethod.name || "收款码")}" />
                            <div class="guest-transfer-card-title"><strong>${escapeHtml(activeGuestPaymentMethod.name || "收款码")}</strong></div>
                            <div class="muted">${escapeHtml(activeGuestPaymentMethod.hint || "转账后填写付款时间提交")}</div>
                          `
                    }
                    <div class="stack-list">
                      ${(
                        isResidualGuestPurchase
                          ? Array.isArray(rechargeConfig?.residual_instructions)
                            ? rechargeConfig.residual_instructions
                            : []
                          : Array.isArray(rechargeConfig?.instructions)
                            ? rechargeConfig.instructions
                            : []
                      )
                        .map((line) => `<div class="stack-item">${escapeHtml(line)}</div>`)
                        .join("")}
                    </div>
                  </div>
                  <form id="guest-transfer-form" class="guest-transfer-form" novalidate>
                    <div class="guest-transfer-summary">
                      <div class="recharge-rate-banner">
                        <strong>${isResidualGuestPurchase ? "残卷锁卡" : "转账锁卡"}</strong>
                        <span>订单提交后会先锁定这张卡，等待管理员核对${isResidualGuestPurchase ? "转赠" : "收款"}后确认。</span>
                      </div>
                      <div class="recharge-quote">
                        <span class="muted">${isResidualGuestPurchase ? "本单需要转赠" : "本单金额"}</span>
                        <strong>${escapeHtml(
                          isResidualGuestPurchase
                            ? `${Number(directResidualAmount || 0)} ${rechargeConfig?.residual_unit_label || "残卷"}`
                            : formatCashAmount(directPurchaseContext.amountYuan)
                        )}</strong>
                        <span class="muted">${Number(directPurchaseContext.quotaAmount)} 额度，商品会先锁定</span>
                      </div>
                    </div>
                    <div class="guest-transfer-fields">
                      <label>游戏 ID
                        <input id="guest-transfer-role-id" type="text" maxlength="60" value="${escapeHtml(sessionProfile?.game_role_id || "")}" placeholder="例如 584967604" required />
                      </label>
                      <label>角色名
                        <input id="guest-transfer-role-name" type="text" maxlength="60" value="${escapeHtml(sessionProfile?.game_role_name || "")}" placeholder="例如 繁星秋" required />
                      </label>
                      <label>昵称（可选）
                        <input id="guest-transfer-nickname" type="text" maxlength="60" value="${escapeHtml(sessionProfile?.nickname || "")}" placeholder="方便你这边识别即可" />
                      </label>
                      <label>${isResidualGuestPurchase ? "转赠时间" : "付款时间"}
                        <input id="guest-transfer-reference" type="text" maxlength="100" placeholder="${escapeHtml(isResidualGuestPurchase ? "例如 19:42 已转残卷" : "例如 19:42 支付宝已转")}" required />
                      </label>
                      <label class="guest-transfer-field-span">补充说明（可选）
                        <textarea id="guest-transfer-note" rows="3" placeholder="${escapeHtml(
                          isResidualGuestPurchase
                            ? `例如：已向 ${rechargeConfig?.residual_admin_role_id || "584967604"} 转了 ${Number(directResidualAmount || 0)} ${rechargeConfig?.residual_unit_label || "残卷"}`
                            : "例如：尾号 5218，已按订单金额转账"
                        )}"></textarea>
                      </label>
                    </div>
                    <div class="guest-transfer-form-actions">
                      <button class="ghost" type="button" data-guest-transfer-cancel="1">收起</button>
                      <button class="primary" type="submit">${isResidualGuestPurchase ? "已转赠，提交锁卡订单" : "已转账，提交锁卡订单"}</button>
                    </div>
                  </form>
                </div>
              `
            : `
                <div class="stack-item">
                  当前还没拿到收款配置，请稍后刷新页面再试，或先联系管理员手动处理。
                </div>
              `
        }
      </div>
    </div>
  `;

  productDetailModal.classList.remove("hidden");
  productDetailModal.setAttribute("aria-hidden", "false");
  bindImageFallbacks(productDetailBody);
  document.getElementById("modal-close-btn").addEventListener("click", closeProductModal);
  document
    .getElementById("direct-buy-btn")
    .addEventListener("click", () => startDirectPurchase(product.item_id, product.item_kind || "card"));
  document.getElementById("confirm-buy-btn").addEventListener("click", confirmPurchase);
  document.getElementById("guest-transfer-form")?.addEventListener("submit", submitGuestTransferOrder);
  productDetailBody.querySelectorAll("[data-guest-payment-channel]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedGuestTransferPaymentChannel =
        button.getAttribute("data-guest-payment-channel") || "alipay_qr";
      openProductModal(product.item_id, product.item_kind || "card");
      toggleGuestTransferPanel(true);
    });
  });
  productDetailBody
    .querySelector('[data-guest-transfer-cancel="1"]')
    ?.addEventListener("click", () => toggleGuestTransferPanel(false));
}

function closeProductModal() {
  activeItemId = null;
  activeItemKind = "card";
  productDetailModal.classList.add("hidden");
  productDetailModal.setAttribute("aria-hidden", "true");
  productDetailBody.innerHTML = "";
  setProductDetailMessage("");
}

function toggleGuestTransferPanel(visible) {
  const panel = document.getElementById("guest-transfer-panel");
  if (!panel) return;
  panel.classList.toggle("hidden", !visible);
  if (visible) {
    window.requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

async function submitGuestTransferOrder(event) {
  event.preventDefault();
  const product = findProduct(activeItemId, activeItemKind);
  if (!product) {
    setProductDetailMessage("当前商品不存在或已下架。", "error");
    return;
  }

  const directPurchaseContext = buildDirectPurchaseContext(product, getEffectiveRechargeConfig());
  if (!directPurchaseContext) {
    setProductDetailMessage("当前还没拿到金额换算配置，请稍后再试。", "error");
    return;
  }
  const isResidualGuestPurchase = selectedGuestTransferPaymentChannel === "game_residual_transfer";
  const directResidualAmount = getDirectResidualAmount(product, getEffectiveRechargeConfig());

  const roleId = document.getElementById("guest-transfer-role-id")?.value.trim() || "";
  const roleName = document.getElementById("guest-transfer-role-name")?.value.trim() || "";
  const nickname = document.getElementById("guest-transfer-nickname")?.value.trim() || "";
  const paymentReference =
    document.getElementById("guest-transfer-reference")?.value.trim() || "";
  const payerNote = document.getElementById("guest-transfer-note")?.value.trim() || "";

  if (!roleId) {
    setProductDetailMessage("请填写游戏 ID。", "error");
    return;
  }
  if (!roleName) {
    setProductDetailMessage("请填写角色名。", "error");
    return;
  }
  if (!paymentReference) {
    setProductDetailMessage("请填写付款时间或付款备注。", "error");
    return;
  }

  try {
    const order = await apiFetch("/orders/guest-transfer", {
      method: "POST",
      body: JSON.stringify({
        item_id: Number(product.item_id),
        item_kind: product.item_kind || "card",
        game_role_id: roleId,
        game_role_name: roleName,
        nickname: nickname || undefined,
        amount_yuan: isResidualGuestPurchase ? undefined : directPurchaseContext.amountYuan,
        transfer_amount: isResidualGuestPurchase ? Number(directResidualAmount || 0) : undefined,
        payment_channel: selectedGuestTransferPaymentChannel,
        payment_reference: paymentReference,
        payer_note: payerNote || undefined,
      }),
    });
    closeProductModal();
    const paymentLabel = isResidualGuestPurchase
      ? "残卷转赠"
      : formatRechargeChannelLabel(selectedGuestTransferPaymentChannel);
    setNotice(
      `锁卡订单 #${order.id} 已提交，${product.name} 已先为你保留，等待管理员核对${paymentLabel}${isResidualGuestPurchase ? "" : "收款"}。`,
      "success"
    );
    await loadProducts({ resetPage: false });
  } catch (error) {
    const expectedAmount = Number(error?.payload?.expected_amount_yuan || 0);
    const expectedTransferAmount = Number(error?.payload?.expected_transfer_amount || 0);
    const transferUnit = String(error?.payload?.transfer_unit || "残卷");
    const customMessage =
      pickErrorMessage(error, "提交失败") === "amount_yuan_mismatch" && expectedAmount > 0
        ? `订单金额已变化，请按最新金额 ${formatCashAmount(expectedAmount)} 重新提交。`
        : pickErrorMessage(error, "提交失败") === "transfer_amount_mismatch" &&
            expectedTransferAmount > 0
          ? `订单所需转赠数量已变化，请按最新数量 ${expectedTransferAmount} ${transferUnit} 重新提交。`
        : pickErrorMessage(error, "提交失败");
    setProductDetailMessage(`锁卡提交失败：${customMessage}`, "error");
  }
}

function startDirectPurchase(itemId, itemKind = "card") {
  const product = findProduct(itemId, itemKind);
  if (!product) return;
  if (Number(activeItemId) !== Number(product.item_id) || String(activeItemKind) !== String(product.item_kind || "card")) {
    openProductModal(product.item_id, product.item_kind || "card");
  }
  toggleGuestTransferPanel(true);
}

async function loadProducts(options = {}) {
  const { resetPage = false } = options;
  try {
    const meta = await apiFetch("/products/meta");
    publicRechargeConfig = meta?.recharge_config || publicRechargeConfig;
  } catch (error) {
    // Keep product list usable even if the public pricing meta is temporarily unavailable.
  }
  const products = await apiFetch("/products");
  allProducts = products;
  applyProductView({ resetPage });
  applyDiscountView({ resetPage });
}

async function loadAccount() {
  const session = loadSession();
  if (!session?.token) {
    currentRechargeConfig = null;
    currentRechargeOrders = [];
    currentProfile = null;
    currentQuota = null;
    selectedRechargePaymentChannel = "alipay_qr";
    pendingDirectPurchaseContext = null;
    renderSessionSummary(null);
    renderProfile(null, null, []);
    renderBeginnerGuide(null, [], []);
    renderRechargeSection(null, null, []);
    renderDrawServiceZone(null, null);
    currentAuctionBidSummaries = [];
    renderAuctionZone(null);
    return;
  }

  try {
    const [profile, quota, orders, rechargeConfig, rechargeOrders] = await Promise.all([
      apiFetch("/auth/me"),
      apiFetch("/me/quota"),
      apiFetch("/me/orders"),
      apiFetch("/me/recharge-config"),
      apiFetch("/me/recharge-orders"),
    ]);
    saveSession({ ...session, profile });
    currentRechargeConfig = rechargeConfig;
    publicRechargeConfig = rechargeConfig;
    currentRechargeOrders = rechargeOrders || [];
    currentProfile = profile;
    currentQuota = quota;
    renderSessionSummary(profile);
    renderProfile(profile, quota, orders || []);
    renderBeginnerGuide(profile, orders || [], rechargeOrders || []);
    renderRechargeSection(profile, rechargeConfig, rechargeOrders || []);
    renderDrawServiceZone(profile, quota);
    await loadAuctions();
    setNotice("");
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      currentRechargeConfig = null;
      currentRechargeOrders = [];
      currentProfile = null;
      currentQuota = null;
      selectedRechargePaymentChannel = "alipay_qr";
      pendingDirectPurchaseContext = null;
      renderSessionSummary(null);
      renderProfile(null, null, []);
      renderBeginnerGuide(null, [], []);
      renderRechargeSection(null, null, []);
      renderDrawServiceZone(null, null);
      currentAuctionBidSummaries = [];
      renderAuctionZone(null);
      setNotice("登录状态已失效，请重新登录。", "error");
      return;
    }
    setNotice(`账户信息加载失败：${error.message}`, "error");
  }
}

async function submitRechargeOrder(event) {
  event.preventDefault();
  const session = loadSession();
  if (!session?.token) {
    setAccountMessage("请先登录后再提交充值申请。", "error");
    return;
  }

  const amountInput = document.getElementById("recharge-amount-input");
  const referenceInput = document.getElementById("recharge-payment-reference");
  const noteInput = document.getElementById("recharge-note");
  const orderType =
    selectedRechargeOrderType === "season_member"
      ? "season_member"
      : selectedRechargeOrderType === "residual_transfer"
        ? "residual_transfer"
        : "normal";
  const amountYuan =
    orderType === "season_member"
      ? Number(currentRechargeConfig?.season_member_price_yuan || 0)
      : Number(amountInput?.value);
  const paymentReference = referenceInput?.value?.trim() || "";
  const payerNote = noteInput?.value?.trim() || "";
  const sessionProfile = session.profile || null;
  const pendingSeasonOrder = findPendingSeasonMemberOrder(currentRechargeOrders, currentRechargeConfig);

  if (orderType === "normal") {
    if (!isPositiveMoneyAmount(amountYuan)) {
      setAccountMessage("充值金额必须大于 0，且最多保留两位小数。", "error");
      return;
    }
  } else if (orderType === "residual_transfer") {
    if (!Number.isInteger(amountYuan) || amountYuan <= 0) {
      setAccountMessage(`转赠${currentRechargeConfig?.residual_unit_label || "残卷"}数量必须是大于 0 的整数。`, "error");
      return;
    }
  } else {
    if (sessionProfile?.season_member_active) {
      setAccountMessage("你本赛季已经是会员了，无需重复开通。", "error");
      return;
    }
    if (pendingSeasonOrder) {
      setAccountMessage("你的赛季会员申请正在审核中，请勿重复提交。", "error");
      return;
    }
  }
  if (!paymentReference) {
    setAccountMessage("请填写付款备注、付款单号或转账尾号。", "error");
    return;
  }

  try {
    const result = await apiFetch("/me/recharge-orders", {
      method: "POST",
      body: JSON.stringify({
        order_type: orderType,
        amount_yuan: amountYuan,
        payment_channel: orderType === "residual_transfer" ? undefined : selectedRechargePaymentChannel,
        payment_reference: paymentReference,
        payer_note: payerNote,
      }),
    });
    selectedRechargeAmount = amountYuan;
    selectedRechargeOrderType = "normal";
    pendingDirectPurchaseContext = null;
    setAccountMessage(
      orderType === "season_member"
        ? `赛季会员申请已提交，订单 #${result.id} 等待管理员审核。`
        : orderType === "residual_transfer"
          ? `残卷转赠申请已提交，订单 #${result.id} 等待管理员审核。`
        : `充值申请已提交，订单 #${result.id} 等待管理员审核。`,
      "success"
    );
    await loadAccount();
  } catch (error) {
    const code = error?.payload?.error || error?.message;
    const customMessage =
      code === "season_member_already_active"
        ? "你本赛季已经是会员了，无需重复开通。"
        : code === "season_member_pending_review"
          ? "你的赛季会员申请正在审核中，请勿重复提交。"
          : code === "season_member_disabled"
            ? "当前暂未开放赛季会员。"
            : code === "residual_transfer_disabled"
              ? "当前暂未开放残卷转赠。"
            : pickErrorMessage(error, "提交失败");
    setAccountMessage(`充值申请提交失败：${customMessage}`, "error");
  }
}

async function bindAccount(event) {
  event.preventDefault();
  setNotice("正在绑定...", "");
  try {
    const result = await apiFetch("/auth/game/bind", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: bindRoleIdInput.value.trim(),
        game_server: bindServerInput.value.trim(),
        game_role_name: bindRoleNameInput.value.trim(),
        bind_token_id: bindTokenIdInput.value.trim(),
        nickname: bindNicknameInput.value.trim(),
      }),
    });
    saveSession(result);
    setNotice("绑定成功，已保存登录状态。", "success");
    activateAccountTab("overview");
    window.location.hash = "account";
    await loadAccount();
  } catch (error) {
    setNotice(`绑定失败：${pickErrorMessage(error, "绑定失败")}`, "error");
  }
}

async function loginAccount(event) {
  event.preventDefault();
  setNotice("正在登录...", "");
  try {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: loginRoleIdInput.value.trim(),
        password: loginPasswordInput.value,
      }),
    });
    saveSession(result);
    setNotice("登录成功。", "success");
    loginPasswordInput.value = "";
    activateAccountTab("overview");
    window.location.hash = "account";
    await loadAccount();
  } catch (error) {
    setNotice(`登录失败：${pickErrorMessage(error, "登录失败")}`, "error");
  }
}

async function confirmPurchase() {
  const session = loadSession();
  if (!session?.token) {
    setProductDetailMessage("请先登录后再购买。", "error");
    setNotice("请先登录后再购买。", "error");
    window.location.hash = "bind";
    return;
  }

  const product = findProduct(activeItemId, activeItemKind);
  if (!product) {
    setProductDetailMessage("当前商品不存在或已下架。", "error");
    return;
  }

  const currentQuota = getCurrentQuotaValue();
  const price = Number(product.price_quota || 0);
  if (currentQuota !== null && currentQuota < price) {
    setProductDetailMessage(`当前额度不足，还差 ${price - currentQuota}。`, "error");
    return;
  }

  const remaining = currentQuota === null ? null : currentQuota - price;
  const confirmed = window.confirm([
    `确认购买：${product.name}`,
    `消耗额度：${price}`,
    remaining === null ? "购买后余额将重新从服务端读取。" : `购买后剩余：${remaining}`,
  ].join("\n"));

  if (!confirmed) {
    setProductDetailMessage("已取消购买。");
    return;
  }

  try {
    const order = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ item_id: Number(activeItemId), item_kind: activeItemKind }),
    });
    const latestQuota = await apiFetch("/me/quota");
    const nextBalance = Number(latestQuota?.balance ?? remaining ?? 0);
    setNotice(`下单成功，订单 #${order.id} 已创建。`, "success");
    setProductDetailMessage(`已扣除 ${price} 额度，剩余 ${nextBalance}。`, "success");
    closeProductModal();
    await Promise.all([loadProducts(), loadAccount()]);
  } catch (error) {
    const message = pickErrorMessage(error, "下单失败");
    setProductDetailMessage(`下单失败：${message}`, "error");
    setNotice(`下单失败：${message}`, "error");
  }
}

async function requestCancelOrder(orderId) {
  const confirmed = window.confirm("确认提交取消申请？管理员审核通过后会退回额度并恢复库存。");
  if (!confirmed) return;

  try {
    await apiFetch(`/orders/${orderId}/cancel-request`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setNotice(`订单 #${orderId} 已提交取消申请。`, "success");
    await loadAccount();
  } catch (error) {
    setNotice(`提交取消申请失败：${pickErrorMessage(error, "提交失败")}`, "error");
  }
}

async function saveAccountProfile(event) {
  event.preventDefault();
  const session = loadSession();
  if (!session?.token) {
    setAccountMessage("请先登录后再修改资料。", "error");
    return;
  }

  try {
    const profile = await apiFetch("/me/profile", {
      method: "PATCH",
      body: JSON.stringify({
        game_role_name: accountRoleNameInput.value.trim(),
        nickname: accountNicknameInput.value.trim(),
        game_server: accountServerInput.value.trim(),
      }),
    });
    saveSession({ ...session, profile });
    setAccountMessage("资料已更新。", "success");
    await loadAccount();
  } catch (error) {
    setAccountMessage(`资料更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
}

async function changeAccountPassword(event) {
  event.preventDefault();
  const session = loadSession();
  if (!session?.token) {
    setAccountMessage("请先登录后再修改密码。", "error");
    return;
  }

  const currentPassword = accountCurrentPasswordInput.value;
  const newPassword = accountNewPasswordInput.value;
  const confirmPassword = accountConfirmPasswordInput.value;

  if (!currentPassword || !newPassword) {
    setAccountMessage("请填写完整密码信息。", "error");
    return;
  }
  if (newPassword.length < 6) {
    setAccountMessage("新密码至少需要 6 位。", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    setAccountMessage("两次输入的新密码不一致。", "error");
    return;
  }

  try {
    await apiFetch("/me/password", {
      method: "PATCH",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    accountCurrentPasswordInput.value = "";
    accountNewPasswordInput.value = "";
    accountConfirmPasswordInput.value = "";
    setAccountMessage("密码已更新。", "success");
  } catch (error) {
    setAccountMessage(`密码更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
}

function logoutCurrentSession(options = {}) {
  clearSession();
  currentRechargeConfig = null;
  currentRechargeOrders = [];
  selectedRechargePaymentChannel = "alipay_qr";
  pendingDirectPurchaseContext = null;
  activateAccountTab("overview");
  renderSessionSummary(null);
  renderProfile(null, null, []);
  renderRechargeSection(null, null, []);
  setNotice("已退出登录。", "success");
  setAccountMessage("");
  if (options.toBind) {
    window.location.hash = "bind";
  }
}

function openHelper() {
  const origin = helperOriginInput.value.trim();
  if (!origin) {
    setNotice("请先填写 helper 地址。", "error");
    return;
  }
  setHelperOrigin(origin);
  window.open(origin, "_blank");
}

function applyIncomingPayload(payload) {
  const normalized = normalizeBindPayload(payload);
  if (normalized) fillBindForm(normalized);
}
function syncRegisterPasswordValidation(showMessage = false) {
  if (!registerPasswordInput || !registerPasswordConfirmInput) return true;
  const mismatch = registerPasswordConfirmInput.value.length > 0 && registerPasswordInput.value !== registerPasswordConfirmInput.value;
  registerPasswordConfirmInput.setCustomValidity(mismatch ? "两次输入的密码不一致" : "");
  if (showMessage && mismatch) {
    registerPasswordConfirmInput.reportValidity();
  }
  return !mismatch;
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  registerRoleIdInput.setCustomValidity("");
  if (!syncRegisterPasswordValidation(true)) {
    setNotice("两次输入的密码不一致，请重新确认。", "error");
    registerPasswordConfirmInput.focus();
    return;
  }

  setNotice("正在注册...", "");
  try {
    const result = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: registerRoleIdInput.value.trim(),
        game_role_name: registerRoleNameInput.value.trim(),
        password: registerPasswordInput.value,
      }),
    });
    saveSession(result);
    setNotice("注册成功，已自动登录。", "success");
    registerPasswordInput.value = "";
    registerPasswordConfirmInput.value = "";
    syncRegisterPasswordValidation(false);
    activateAccountTab("overview");
    window.location.hash = "account";
    await loadAccount();
  } catch (error) {
    const isRoleIdTaken = error?.payload?.error === "game_role_id_taken";
    const message = isRoleIdTaken ? "这个游戏 ID 已经注册过账号了，请直接登录。" : pickErrorMessage(error, "注册失败");
    if (isRoleIdTaken) {
      registerRoleIdInput.setCustomValidity(message);
      registerRoleIdInput.reportValidity();
      registerRoleIdInput.focus();
    }
    setNotice(`注册失败：${message}`, "error");
  }
}

document.getElementById("reload-products-btn").addEventListener("click", () => {
  loadProducts().catch((error) => setNotice(`商品刷新失败：${error.message}`, "error"));
});

auctionStatusTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-auction-status]");
  if (!button) return;
  activeAuctionStatus = String(button.getAttribute("data-auction-status") || "live").trim() || "live";
  renderAuctionZone(currentProfile);
});

auctionBody?.addEventListener("click", (event) => {
  const quickButton = event.target.closest("[data-auction-bid-target]");
  if (quickButton) {
    const card = event.target.closest("[data-auction-id]");
    const amountInput = card?.querySelector('[data-field="auction-bid-amount"]');
    if (card && amountInput) {
      amountInput.value = String(Number(quickButton.getAttribute("data-auction-bid-target") || 0));
      updateAuctionBidPreview(card);
      amountInput.focus();
      amountInput.select?.();
    }
    return;
  }
  const button = event.target.closest(".submit-auction-bid-btn");
  if (!button) return;
  const card = event.target.closest("[data-auction-id]");
  if (!card) return;
  if (!currentProfile) {
    setAuctionMessage("请先登录后再参与拍卖。", "error");
    window.location.hash = "bind";
    return;
  }
  const auctionId = Number(card.getAttribute("data-auction-id") || 0);
  const amountInput = card.querySelector('[data-field="auction-bid-amount"]');
  submitAuctionBid(auctionId, Number(amountInput?.value || 0));
});
auctionBody?.addEventListener("input", (event) => {
  if (event.target?.getAttribute("data-field") !== "auction-bid-amount") return;
  const card = event.target.closest("[data-auction-id]");
  updateAuctionBidPreview(card);
});

document.getElementById("save-helper-origin-btn").addEventListener("click", () => {
  setHelperOrigin(helperOriginInput.value.trim());
  setNotice("helper 地址已保存。", "success");
});
document.getElementById("open-helper-btn").addEventListener("click", openHelper);
document.getElementById("logout-btn").addEventListener("click", () => logoutCurrentSession());
accountLogoutBtn?.addEventListener("click", () => logoutCurrentSession());
accountSwitchLink?.addEventListener("click", (event) => {
  event.preventDefault();
  logoutCurrentSession({ toBind: true });
});
document.getElementById("close-product-detail-btn").addEventListener("click", closeProductModal);

bindForm.addEventListener("submit", bindAccount);
registerForm.addEventListener("submit", handleRegisterSubmit);
loginForm.addEventListener("submit", loginAccount);
accountProfileForm?.addEventListener("submit", saveAccountProfile);
accountPasswordForm?.addEventListener("submit", changeAccountPassword);
registerPasswordInput?.addEventListener("input", () => syncRegisterPasswordValidation(false));
registerPasswordConfirmInput?.addEventListener("input", () => syncRegisterPasswordValidation(false));
registerPasswordConfirmInput?.addEventListener("blur", () => syncRegisterPasswordValidation(true));
registerRoleIdInput?.addEventListener("input", () => registerRoleIdInput.setCustomValidity(""));
authTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateAuthTab(button.getAttribute("data-auth-tab"));
  });
});
accountTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateAccountTab(button.getAttribute("data-account-tab"));
  });
});
accountTabLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetTab = link.getAttribute("data-account-tab-target") || "overview";
    event.preventDefault();
    window.location.hash =
      targetTab === "recharge" ? "recharge-panel" : targetTab === "orders" ? "help-panel" : "account";
    activateAccountTab(targetTab, { scroll: true });
  });
});
beginnerGuideTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveGuidePage(button.getAttribute("data-guide-page-target") || "tutorial");
  });
});
beginnerGuidePrevBtn?.addEventListener("click", () => setActiveGuidePage("tutorial"));
beginnerGuideNextBtn?.addEventListener("click", () => setActiveGuidePage("sales"));
if (beginnerCarousel) {
  let touchStartX = 0;
  let touchDeltaX = 0;
  beginnerCarousel.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.touches[0]?.clientX || 0;
      touchDeltaX = 0;
    },
    { passive: true }
  );
  beginnerCarousel.addEventListener(
    "touchmove",
    (event) => {
      const currentX = event.touches[0]?.clientX || touchStartX;
      touchDeltaX = currentX - touchStartX;
    },
    { passive: true }
  );
  beginnerCarousel.addEventListener("touchend", () => {
    if (Math.abs(touchDeltaX) < 48) return;
    setActiveGuidePage(touchDeltaX < 0 ? "sales" : "tutorial");
  });
}
pageDockItems.forEach((button) => {
  button.addEventListener("click", () => {
    navigateWithDock(button.getAttribute("data-dock-target") || "products");
  });
});
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-account-tab-target]");
  if (!link || accountTabLinks.includes(link)) return;
  const targetTab = link.getAttribute("data-account-tab-target") || "overview";
  event.preventDefault();
  window.location.hash =
    targetTab === "recharge" ? "recharge-panel" : targetTab === "orders" ? "help-panel" : "account";
  activateAccountTab(targetTab, { scroll: true });
});
keywordInput.addEventListener("input", () => {
  resetProductPagination();
  if (productSearchTimer) {
    window.clearTimeout(productSearchTimer);
  }
  productSearchTimer = window.setTimeout(() => {
    applyProductView({ resetPage: true });
  }, 120);
});
sortSelect.addEventListener("change", () => applyProductView({ resetPage: true }));
productCategoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.getAttribute("data-category") || "all";
  activeSubcategory = "all";
  activeDetail = "all";
  activeFullness = "all";
  applyProductView({ resetPage: true });
});
productSubcategoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-subcategory]");
  if (!button) return;
  activeSubcategory = button.getAttribute("data-subcategory") || "all";
  activeDetail = "all";
  activeFullness = "all";
  applyProductView({ resetPage: true });
});
productDetailTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-detail]");
  if (!button) return;
  activeDetail = button.getAttribute("data-detail") || "all";
  activeFullness = "all";
  applyProductView({ resetPage: true });
});
productFullnessTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-fullness]");
  if (!button) return;
  activeFullness = button.getAttribute("data-fullness") || "all";
  applyProductView({ resetPage: true });
});
discountKeywordInput?.addEventListener("input", () => {
  resetDiscountPagination();
  if (discountSearchTimer) {
    window.clearTimeout(discountSearchTimer);
  }
  discountSearchTimer = window.setTimeout(() => {
    applyDiscountView({ resetPage: true });
  }, 120);
});
discountSortSelect?.addEventListener("change", () => applyDiscountView({ resetPage: true }));
discountCategoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-category]");
  if (!button) return;
  activeDiscountCategory = button.getAttribute("data-discount-category") || "all";
  activeDiscountSubcategory = "all";
  activeDiscountDetail = "all";
  activeDiscountFullness = "all";
  applyDiscountView({ resetPage: true });
});
discountSubcategoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-subcategory]");
  if (!button) return;
  activeDiscountSubcategory = button.getAttribute("data-discount-subcategory") || "all";
  activeDiscountDetail = "all";
  activeDiscountFullness = "all";
  applyDiscountView({ resetPage: true });
});
discountDetailTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-detail]");
  if (!button) return;
  activeDiscountDetail = button.getAttribute("data-discount-detail") || "all";
  activeDiscountFullness = "all";
  applyDiscountView({ resetPage: true });
});
discountFullnessTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-fullness]");
  if (!button) return;
  activeDiscountFullness = button.getAttribute("data-discount-fullness") || "all";
  applyDiscountView({ resetPage: true });
});
function handleProductGridClick(event) {
  const directBuyButton = event.target.closest(".direct-buy-btn");
  if (directBuyButton) {
    startDirectPurchase(
      directBuyButton.getAttribute("data-item-id"),
      directBuyButton.getAttribute("data-item-kind")
    );
    return;
  }

  const button = event.target.closest(".detail-btn, .buy-btn");
  if (!button) return;
  openProductModal(button.getAttribute("data-item-id"), button.getAttribute("data-item-kind"));
}

productGrid.addEventListener("click", handleProductGridClick);
discountProductGrid?.addEventListener("click", handleProductGridClick);
productPagination?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-page]");
  if (!button) return;
  const page = Number(button.getAttribute("data-product-page"));
  if (!Number.isInteger(page) || page < 1) return;
  productPaginationState.page = page;
  renderProducts(currentProducts);
  scrollProductsIntoView();
});
discountProductPagination?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-page]");
  if (!button) return;
  const page = Number(button.getAttribute("data-discount-page"));
  if (!Number.isInteger(page) || page < 1) return;
  discountPaginationState.page = page;
  renderDiscountProducts(currentDiscountProducts);
  discountProductsSection?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});
rechargeBody?.addEventListener("click", (event) => {
  const clearDirectPurchaseButton = event.target.closest("[data-direct-purchase-clear]");
  if (clearDirectPurchaseButton) {
    pendingDirectPurchaseContext = null;
    const session = loadSession();
    renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
    setAccountMessage("已切回普通充值。", "success");
    return;
  }

  const paymentChannelButton = event.target.closest("[data-payment-channel]");
  if (paymentChannelButton) {
    selectedRechargePaymentChannel = String(paymentChannelButton.getAttribute("data-payment-channel") || "alipay_qr").trim() || "alipay_qr";
    const session = loadSession();
    renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
    return;
  }

  const typeButton = event.target.closest("[data-recharge-order-type]");
  if (typeButton) {
    const nextType = String(typeButton.getAttribute("data-recharge-order-type") || "").trim();
    selectedRechargeOrderType =
      nextType === "season_member" || nextType === "residual_transfer" ? nextType : "normal";
    if (selectedRechargeOrderType !== "normal") {
      pendingDirectPurchaseContext = null;
    }
    const session = loadSession();
    renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
    return;
  }

  const amountButton = event.target.closest("[data-recharge-amount]");
  if (!amountButton) return;
  selectedRechargeAmount = Number(amountButton.getAttribute("data-recharge-amount") || 0);
  const amountInput = document.getElementById("recharge-amount-input");
  if (amountInput && isPositiveMoneyAmount(selectedRechargeAmount)) {
    amountInput.value = String(selectedRechargeAmount);
  }
  const session = loadSession();
  renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
});
rechargeBody?.addEventListener("input", (event) => {
  if (event.target?.id !== "recharge-amount-input") return;
  selectedRechargeAmount = Number(event.target.value || 0);
  const session = loadSession();
  updateRechargeQuotePreview(session?.profile || null, currentRechargeConfig);
  rechargeBody.querySelectorAll("[data-recharge-amount]").forEach((node) => {
    node.classList.toggle("active", Number(node.getAttribute("data-recharge-amount")) === Number(selectedRechargeAmount));
  });
});
rechargeBody?.addEventListener("submit", (event) => {
  if (event.target?.id !== "recharge-form") return;
  submitRechargeOrder(event);
});
orderList.addEventListener("click", (event) => {
  const button = event.target.closest(".request-cancel-btn");
  if (!button) return;
  requestCancelOrder(button.getAttribute("data-order-id"));
});
productDetailModal.addEventListener("click", (event) => {
  if (event.target === productDetailModal) closeProductModal();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !productDetailModal.classList.contains("hidden")) {
    closeProductModal();
  }
});
window.addEventListener("message", (event) => applyIncomingPayload(event.data));
window.addEventListener("storage", (event) => {
  if (event.key === "gongfa_session_v1") loadAccount();
});
window.addEventListener("hashchange", syncAccountTabWithHash);
window.addEventListener("scroll", syncDockWithViewport, { passive: true });
window.addEventListener("resize", syncDockWithViewport);

activateAuthTab(activeAuthTab);
activateAccountTab(activeAccountTab);
syncAccountTabWithHash();
syncDockWithViewport();
setActiveGuidePage("tutorial");
helperOriginInput.value = getHelperOrigin();
renderBeginnerGuide(null, [], []);
renderRecentSales([]);
loadProducts().catch((error) => setNotice(`商品加载失败：${error.message}`, "error"));
loadAuctions();
loadRecentSales();
loadAccount();
window.setInterval(updateAuctionCountdowns, AUCTION_COUNTDOWN_TICK_MS);
