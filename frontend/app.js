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
const productCategoryTabs = document.getElementById("product-category-tabs");
const productPagination = document.getElementById("product-pagination");
const productsSection = document.getElementById("products");
const keywordInput = document.getElementById("product-keyword-input");
const sortSelect = document.getElementById("product-sort-select");
const sessionSummary = document.getElementById("session-summary");
const sessionRole = document.getElementById("session-role");
const navBindLink = document.getElementById("nav-bind-link");
const navAdminLink = document.getElementById("nav-admin-link");
const helperOriginInput = document.getElementById("helper-origin-input");
const bindMessage = document.getElementById("bind-message");
const bindSection = document.getElementById("bind");
const accountSection = document.getElementById("account");
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
const authTabButtons = Array.from(document.querySelectorAll("[data-auth-tab]"));
const authTabPanels = Array.from(document.querySelectorAll("[data-auth-panel]"));
const accountTabButtons = Array.from(document.querySelectorAll("[data-account-tab]"));
const accountTabPanels = Array.from(document.querySelectorAll("[data-account-panel]"));
const accountTabLinks = Array.from(document.querySelectorAll("[data-account-tab-target]"));
const accountSecurityTabButton = document.querySelector('[data-account-tab="security"]');

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
let activeItemId = null;
let activeItemKind = "card";
let activeCategory = "all";
let currentRechargeConfig = null;
let currentRechargeOrders = [];
let selectedRechargeAmount = null;
let selectedRechargeOrderType = "normal";
let productSearchTimer = null;
let activeAuthTab = "register";
let activeAccountTab = "overview";
const productPaginationState = {
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
};

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

function updateShellVisibility(profile) {
  const loggedIn = Boolean(profile);
  const isAdmin = profile?.role === "admin";
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
  sessionRole.textContent = `${serverText} / ${profile.role} / ${authLabel}`;
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

function getTierLabel(product) {
  const mapping = {
    bundle: "套餐",
    gold: "金卡",
    red: "红卡",
    orange: "橙卡",
    purple: "紫卡",
    blue: "蓝卡",
    green: "绿卡",
  };
  return mapping[getTierKey(product)] || "商品";
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

function buildCategoryEntries(products) {
  const labels = {
    all: "全部",
    bundle: "套餐",
    gold: "金卡",
    red: "红卡",
    orange: "橙卡",
    purple: "紫卡",
    blue: "蓝卡",
    green: "绿卡",
  };
  const counts = { all: Array.isArray(products) ? products.length : 0 };
  for (const product of products || []) {
    const key = getProductCategory(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderCategoryTabs(products) {
  const entries = buildCategoryEntries(products || []);
  const validKeys = new Set(entries.map((item) => item.key));
  if (!validKeys.has(activeCategory)) activeCategory = "all";
  productCategoryTabs.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="category-tab ${entry.key === activeCategory ? "active" : ""}"
          data-category="${entry.key}"
        >
          ${escapeHtml(entry.label)}
          <span class="category-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
}

function resetProductPagination() {
  productPaginationState.page = 1;
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
  return (products || []).filter((product) => getProductCategory(product) === category);
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
    attack_asc: (a, b) => Number(a.attack_value || 0) - Number(b.attack_value || 0) || compareShopDefault(a, b),
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
        <span class="product-badge subtle">${isBundle(product) ? "??" : `ID ${escapeHtml(product?.legacy_id || "-")}`}</span>
        ${isBundle(product) ? "" : `<span class="product-badge subtle">${escapeHtml(getSeasonDisplayText(product))}</span>`}
      </div>
    </div>
  `;
}

function applyProductView(options = {}) {
  const { resetPage = false } = options;
  if (resetPage) {
    resetProductPagination();
  }
  const filtered = filterProductsByCategory(allProducts, activeCategory);
  currentProducts = sortProducts(filtered, sortSelect.value);
  renderCategoryTabs(allProducts);
  renderProducts(currentProducts);
}

function renderProducts(products) {
  const pagedProducts = getPagedProducts(products);

  if (!products || products.length === 0) {
    productGrid.innerHTML = '<div class="stack-item">当前分类下没有已上架商品。</div>';
    renderProductPagination();
    return;
  }

  productGrid.innerHTML = pagedProducts
    .map((product) => {
      const termBadges = parseTermBadges(product.ext_attrs, product);
      const stockLabel = product.stock === null || product.stock === undefined ? "不限量" : `库存 ${Number(product.stock || 0)}`;
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

      return `
        <article class="product-card">
          <div class="product-cover">${renderProductVisual(product, "grid")}</div>
          <div>
            <div class="product-headline">
              <div class="product-name">${escapeHtml(product.name)}</div>
              <div class="product-type-chip">${subtitle}</div>
            </div>
            ${bodyHtml}
            <div class="term-row">
              ${termBadges.length > 0 ? termBadges.map((badge) => renderTermBadge(badge)).join("") : '<span class="term-empty">无额外词条</span>'}
            </div>
          </div>
          <div class="chip-row">
            <span class="chip">价 ${formatCompactNumber(product.price_quota || 0)}</span>
            <span class="chip">${escapeHtml(product.stock_label || stockLabel)}</span>
          </div>
          <div class="actions">
            <button class="ghost detail-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">详情</button>
            <button class="primary buy-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">购买</button>
          </div>
        </article>
      `;
    })
    .join("");

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

  accountProfile.innerHTML = [
    `角色名称：${escapeHtml(profile.game_role_name || "-")}`,
    `游戏 ID：${escapeHtml(profile.game_role_id || "-")}`,
    `区服：${escapeHtml(profile.game_server || "-")}`,
    `账号角色：${escapeHtml(profile.role || "-")}`,
    `登录方式：${escapeHtml(profile.auth_provider === "password" ? "密码登录" : "绑定登录")}`,
    `昵称：${escapeHtml(profile.nickname || "-")}`,
    `会员状态：${memberStatus}`,
    `会员权益：${memberBenefit}`,
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
      const remark = order.remark ? `<div class="muted">备注：${escapeHtml(order.remark)}</div>` : "";
      const actions =
        order.status === "pending"
          ? `<div class="actions"><button class="ghost request-cancel-btn" type="button" data-order-id="${order.id}">申请取消</button></div>`
          : order.status === "cancel_requested"
            ? '<div class="muted">已提交取消申请，等待管理员审核。</div>'
            : "";

      return `
        <div class="stack-item">
          <div>订单 #${order.id} / ${escapeHtml(formatOrderStatus(order.status))}</div>
          <div class="muted">商品：${escapeHtml(itemNames || "-")}</div>
          <div class="muted">消耗：${Number(order.total_quota || 0)} / 下单时间：${formatDate(order.created_at)}</div>
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

  return `金额：${Number(order?.amount_yuan || 0)} 元 / ${quotaLine}`;
}

function formatRechargeReferenceLine(order) {
  const label = isResidualTransferOrder(order) ? "转赠凭据" : "付款凭据";
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
      referenceLabel: "支付宝付款备注或订单号",
      referencePlaceholder: "建议填写付款备注、尾号或支付宝订单号",
      notePlaceholder: "例如：已用本人支付宝转账，备注写了游戏 ID",
    };
  }

  if (normalizedType === "residual_transfer") {
    const normalizedAmount = Math.max(Number(amountYuan) || 0, 0);
    const quotaPerUnit = Math.max(Number(rechargeConfig?.residual_quota_per_unit || 1), 1);
    const unitLabel = rechargeConfig?.residual_unit_label || "残卷";
    const targetRoleId = rechargeConfig?.residual_admin_role_id || "584967604";
    return {
      orderType: normalizedType,
      amountYuan: normalizedAmount,
      baseQuota: normalizedAmount * quotaPerUnit,
      bonusQuota: 0,
      totalQuota: normalizedAmount * quotaPerUnit,
      amountLabel: `1 ${unitLabel} = ${quotaPerUnit} 额度`,
      detailLabel: `游戏内直接转给管理员 ${targetRoleId}，管理员审核后到账。`,
      submitLabel: "已转赠，提交审核",
      lockedAmount: false,
      amountInputLabel: `${unitLabel}数量`,
      amountInputMin: 1,
      amountInputStep: 1,
      referenceLabel: "转赠凭据",
      referencePlaceholder: "建议填写转赠时间、截图说明或游戏内邮件记录",
      notePlaceholder: "例如：19:42 转给 584967604 共 300 残卷，角色名 XXX",
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
    : `最低充值 ${Number(rechargeConfig?.min_amount_yuan || 1)} 元，非整组金额也会按当前比例折算到账。`;

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
    amountInputMin: Number(rechargeConfig?.min_amount_yuan || 1),
    amountInputStep: 1,
    referenceLabel: "支付宝付款备注或订单号",
    referencePlaceholder: "建议填写付款备注、尾号或支付宝订单号",
    notePlaceholder: "例如：已用本人支付宝转账，备注写了游戏 ID",
  };
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
    : [rechargeConfig.min_amount_yuan || 10];
  if (!Number.isInteger(selectedRechargeAmount) || selectedRechargeAmount <= 0) {
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
          <img class="recharge-qr-image" src="${escapeHtml(rechargeConfig.qr_image_url)}" alt="支付宝收款码" />
          <div><strong>${escapeHtml(rechargeConfig.payee_name || "支付宝收款码")}</strong></div>
          <div class="muted">${escapeHtml(rechargeConfig.payee_hint || "扫码转账后再提交审核")}</div>
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
            <input id="recharge-amount-input" type="number" min="${Number(quoteSummary.amountInputMin || 1)}" step="${Number(quoteSummary.amountInputStep || 1)}" value="${quoteSummary.amountYuan}" ${quoteSummary.lockedAmount ? "readonly" : ""} />
          </label>
          ${selectedRechargeOrderType === "normal" ? `
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
            <button id="recharge-submit-btn" class="primary" type="submit" ${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? "disabled" : ""}>${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? (profile.season_member_active ? "本赛季已开通" : "会员申请审核中") : quoteSummary.submitLabel}</button>
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
  return currentProducts.find((item) => Number(item.item_id) === Number(itemId) && String(item.item_kind) === String(itemKind)) || null;
}

function openProductModal(itemId, itemKind) {
  const product = findProduct(itemId, itemKind);
  if (!product) return;

  activeItemId = Number(product.item_id);
  activeItemKind = product.item_kind || "card";
  setProductDetailMessage("");

  const termBadges = parseTermBadges(product.ext_attrs, product);
  const session = loadSession();
  const stockLabel = product.stock === null || product.stock === undefined ? "不限量" : `${Number(product.stock)} 件`;
  const attackIsFull = isAttackFull(product);
  const hpIsFull = isHpFull(product);
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
          <div class="detail-row"><strong>价格</strong><span>${Number(product.price_quota || 0)} 额度</span></div>
          ${detailRows}
          <div class="detail-row"><strong>购买账号</strong><span>${escapeHtml(session?.profile?.game_role_name || "未登录")}</span></div>
        </div>
        <div class="actions">
          <button class="ghost" type="button" id="modal-close-btn">返回</button>
          <button class="primary" type="button" id="confirm-buy-btn">确认购买</button>
        </div>
      </div>
    </div>
  `;

  productDetailModal.classList.remove("hidden");
  productDetailModal.setAttribute("aria-hidden", "false");
  bindImageFallbacks(productDetailBody);
  document.getElementById("modal-close-btn").addEventListener("click", closeProductModal);
  document.getElementById("confirm-buy-btn").addEventListener("click", confirmPurchase);
}

function closeProductModal() {
  activeItemId = null;
  activeItemKind = "card";
  productDetailModal.classList.add("hidden");
  productDetailModal.setAttribute("aria-hidden", "true");
  productDetailBody.innerHTML = "";
  setProductDetailMessage("");
}

async function loadProducts() {
  const query = new URLSearchParams();
  if (keywordInput.value.trim()) query.set("keyword", keywordInput.value.trim());
  const suffix = query.toString();
  const products = await apiFetch(`/products${suffix ? `?${suffix}` : ""}`);
  allProducts = products;
  applyProductView({ resetPage: true });
}

async function loadAccount() {
  const session = loadSession();
  if (!session?.token) {
    currentRechargeConfig = null;
    currentRechargeOrders = [];
    renderSessionSummary(null);
    renderProfile(null, null, []);
    renderRechargeSection(null, null, []);
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
    currentRechargeOrders = rechargeOrders || [];
    renderSessionSummary(profile);
    renderProfile(profile, quota, orders || []);
    renderRechargeSection(profile, rechargeConfig, rechargeOrders || []);
    setNotice("");
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      currentRechargeConfig = null;
      currentRechargeOrders = [];
      renderSessionSummary(null);
      renderProfile(null, null, []);
      renderRechargeSection(null, null, []);
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
    if (!Number.isInteger(amountYuan) || amountYuan < Number(currentRechargeConfig?.min_amount_yuan || 1)) {
      setAccountMessage(`充值金额不能低于 ${Number(currentRechargeConfig?.min_amount_yuan || 1)} 元。`, "error");
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
        payment_reference: paymentReference,
        payer_note: payerNote,
      }),
    });
    selectedRechargeAmount = amountYuan;
    selectedRechargeOrderType = "normal";
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
keywordInput.addEventListener("input", () => {
  resetProductPagination();
  if (productSearchTimer) {
    window.clearTimeout(productSearchTimer);
  }
  productSearchTimer = window.setTimeout(() => {
    loadProducts().catch((error) => setNotice(`商品刷新失败：${error.message}`, "error"));
  }, 220);
});
sortSelect.addEventListener("change", () => applyProductView({ resetPage: true }));
productCategoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.getAttribute("data-category") || "all";
  applyProductView({ resetPage: true });
});
productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".detail-btn, .buy-btn");
  if (!button) return;
  openProductModal(button.getAttribute("data-item-id"), button.getAttribute("data-item-kind"));
});
productPagination?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-page]");
  if (!button) return;
  const page = Number(button.getAttribute("data-product-page"));
  if (!Number.isInteger(page) || page < 1) return;
  productPaginationState.page = page;
  renderProducts(currentProducts);
  scrollProductsIntoView();
});
rechargeBody?.addEventListener("click", (event) => {
  const typeButton = event.target.closest("[data-recharge-order-type]");
  if (typeButton) {
    const nextType = String(typeButton.getAttribute("data-recharge-order-type") || "").trim();
    selectedRechargeOrderType =
      nextType === "season_member" || nextType === "residual_transfer" ? nextType : "normal";
    const session = loadSession();
    renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
    return;
  }

  const amountButton = event.target.closest("[data-recharge-amount]");
  if (!amountButton) return;
  selectedRechargeAmount = Number(amountButton.getAttribute("data-recharge-amount") || 0);
  const amountInput = document.getElementById("recharge-amount-input");
  if (amountInput && Number.isInteger(selectedRechargeAmount) && selectedRechargeAmount > 0) {
    amountInput.value = String(selectedRechargeAmount);
  }
  const session = loadSession();
  renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
});
rechargeBody?.addEventListener("input", (event) => {
  if (event.target?.id !== "recharge-amount-input") return;
  selectedRechargeAmount = Number(event.target.value || 0);
  const quoteNode = document.getElementById("recharge-quote-value");
  if (quoteNode && currentRechargeConfig) {
    const quotaQuote = Math.round(
      (Math.max(Number(selectedRechargeAmount) || 0, 0) * Number(currentRechargeConfig.exchange_quota || 0)) /
        Math.max(Number(currentRechargeConfig.exchange_yuan || 1), 1)
    );
    quoteNode.textContent = `${quotaQuote} 额度`;
  }
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

activateAuthTab(activeAuthTab);
activateAccountTab(activeAccountTab);
syncAccountTabWithHash();
helperOriginInput.value = getHelperOrigin();
loadProducts().catch((error) => setNotice(`商品加载失败：${error.message}`, "error"));
loadAccount();
