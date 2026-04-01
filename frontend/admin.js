import { apiFetch, clearSession, formatDate, loadSession, saveSession } from "./shared.js";

const adminSession = document.getElementById("admin-session");
const adminMessage = document.getElementById("admin-message");
const adminOverview = document.getElementById("admin-overview");
const adminAlerts = document.getElementById("admin-alerts");
const adminAlertSummary = document.getElementById("admin-alert-summary");
const adminAlertActions = document.getElementById("admin-alert-actions");
const adminAlertTimestamp = document.getElementById("admin-alert-timestamp");
const adminProductModal = document.getElementById("admin-product-modal");
const adminProductModalBody = document.getElementById("admin-product-modal-body");
const closeAdminProductModalBtn = document.getElementById("close-admin-product-modal-btn");
const adminLoginForm = document.getElementById("admin-login-form");
const adminLoginRoleIdInput = document.getElementById("admin-login-role-id");
const adminLoginPasswordInput = document.getElementById("admin-login-password");
const adminLoginBtn = document.getElementById("admin-login-btn");
const adminLogoutBtn = document.getElementById("admin-logout-btn");
const importJsonInput = document.getElementById("import-json-input");
const importFileNameInput = document.getElementById("import-file-name");
const productsRoot = document.getElementById("admin-products");
const auctionsRoot = document.getElementById("admin-auctions");
const bundlesRoot = document.getElementById("admin-bundles");
const usersRoot = document.getElementById("admin-users");
const ordersRoot = document.getElementById("admin-orders");
const quotaLogsRoot = document.getElementById("admin-quota-logs");
const auditsRoot = document.getElementById("admin-audits");
const selectedProductsChip = document.getElementById("selected-products-chip");
const filteredProductsChip = document.getElementById("filtered-products-chip");
const discountedProductsChip = document.getElementById("discounted-products-chip");
const adminProductKeywordInput = document.getElementById("admin-product-keyword-input");
const adminProductStatusFilter = document.getElementById("admin-product-status-filter");
const adminProductDiscountFilter = document.getElementById("admin-product-discount-filter");
const adminProductCategoryTabs = document.getElementById("admin-product-category-tabs");
const adminProductSubcategoryTabs = document.getElementById("admin-product-subcategory-tabs");
const adminProductDetailTabs = document.getElementById("admin-product-detail-tabs");
const adminProductFullnessTabs = document.getElementById("admin-product-fullness-tabs");
const adminUserKeywordInput = document.getElementById("admin-user-keyword-input");
const adminRechargeKeywordInput = document.getElementById("admin-recharge-keyword-input");
const adminRechargeStatusFilter = document.getElementById("admin-recharge-status-filter");
const adminRechargeOrdersRoot = document.getElementById("admin-recharge-orders");
const adminRechargeConfigForm = document.getElementById("admin-recharge-config-form");
const adminRechargeEnabled = document.getElementById("admin-recharge-enabled");
const adminRechargeExchangeYuanInput = document.getElementById("admin-recharge-exchange-yuan");
const adminRechargeExchangeQuotaInput = document.getElementById("admin-recharge-exchange-quota");
const adminRechargeMinYuanInput = document.getElementById("admin-recharge-min-yuan");
const adminResidualTransferEnabledInput = document.getElementById("admin-residual-transfer-enabled");
const adminResidualAdminRoleIdInput = document.getElementById("admin-residual-admin-role-id");
const adminResidualAdminRoleNameInput = document.getElementById("admin-residual-admin-role-name");
const adminResidualAdminGameNameInput = document.getElementById("admin-residual-admin-game-name");
const adminResidualUnitLabelInput = document.getElementById("admin-residual-unit-label");
const adminResidualQuotaPerUnitInput = document.getElementById("admin-residual-quota-per-unit");
const adminSeasonMemberEnabledInput = document.getElementById("admin-season-member-enabled");
const adminSeasonMemberLabelInput = document.getElementById("admin-season-member-label");
const adminSeasonMemberExpiresAtInput = document.getElementById("admin-season-member-expires-at");
const adminSeasonMemberPriceInput = document.getElementById("admin-season-member-price");
const adminSeasonMemberQuotaInput = document.getElementById("admin-season-member-quota");
const adminSeasonMemberBonusRateInput = document.getElementById("admin-season-member-bonus-rate");
const adminRechargePresetsInput = document.getElementById("admin-recharge-presets");
const adminRechargePayeeNameInput = document.getElementById("admin-recharge-payee-name");
const adminRechargePayeeHintInput = document.getElementById("admin-recharge-payee-hint");
const adminRechargeQrImageUrlInput = document.getElementById("admin-recharge-qr-image-url");
const adminWechatPayeeNameInput = document.getElementById("admin-wechat-payee-name");
const adminWechatPayeeHintInput = document.getElementById("admin-wechat-payee-hint");
const adminWechatQrImageUrlInput = document.getElementById("admin-wechat-qr-image-url");
const adminRechargeInstructionsInput = document.getElementById("admin-recharge-instructions");
const adminResidualInstructionsInput = document.getElementById("admin-residual-instructions");
const adminRechargeQrPreview = document.getElementById("admin-recharge-qr-preview");
const adminWechatQrPreview = document.getElementById("admin-wechat-qr-preview");
const adminOrderKeywordInput = document.getElementById("admin-order-keyword-input");
const adminOrderStatusFilter = document.getElementById("admin-order-status-filter");
const adminQuotaLogKeywordInput = document.getElementById("admin-quota-log-keyword-input");
const adminQuotaLogTypeFilter = document.getElementById("admin-quota-log-type-filter");
const adminAuditKeywordInput = document.getElementById("admin-audit-keyword-input");
const adminAuditActionInput = document.getElementById("admin-audit-action-input");
const linkedOrderUserState = document.getElementById("linked-order-user-state");
const bulkPriceInput = document.getElementById("bulk-price-input");
const bulkStockInput = document.getElementById("bulk-stock-input");
const bulkDiscountRateInput = document.getElementById("bulk-discount-rate-input");
const randomDiscountCountInput = document.getElementById("random-discount-count-input");
const randomDiscountRateInput = document.getElementById("random-discount-rate-input");
const exportPosterAutoCountInput = document.getElementById("export-poster-auto-count-input");
const smartSelectHotProductsBtn = document.getElementById("smart-select-hot-products-btn");
const smartSelectBudgetProductsBtn = document.getElementById("smart-select-budget-products-btn");
const smartSelectMixedProductsBtn = document.getElementById("smart-select-mixed-products-btn");
const exportPosterTitleInput = document.getElementById("export-poster-title-input");
const exportPosterSubtitleInput = document.getElementById("export-poster-subtitle-input");
const exportPosterFootnoteInput = document.getElementById("export-poster-footnote-input");
const exportProductPosterBtn = document.getElementById("export-product-poster-btn");
const selectedAuctionProductChip = document.getElementById("selected-auction-product-chip");
const adminAuctionStartingPriceInput = document.getElementById("admin-auction-starting-price-input");
const adminAuctionMinIncrementInput = document.getElementById("admin-auction-min-increment-input");
const adminAuctionStartAtInput = document.getElementById("admin-auction-start-at-input");
const adminAuctionEndAtInput = document.getElementById("admin-auction-end-at-input");
const adminAuctionTitleInput = document.getElementById("admin-auction-title-input");
const adminAuctionRemarkInput = document.getElementById("admin-auction-remark-input");
const adminAuctionStatusFilter = document.getElementById("admin-auction-status-filter");
const recalculatePricingBtn = document.getElementById("recalculate-pricing-btn");
const importForm = document.getElementById("import-form");
const importSubmitBtn = document.getElementById("import-submit-btn");
const adminDebugAction = document.getElementById("admin-debug-action");
const adminDebugSession = document.getElementById("admin-debug-session");
const adminDebugError = document.getElementById("admin-debug-error");
const adminPageButtons = Array.from(document.querySelectorAll("[data-admin-page-tab]"));
const adminPagePanels = Array.from(document.querySelectorAll("[data-admin-page-panel]"));
const ordersPaginationRoot = document.getElementById("admin-orders-pagination");
const rechargeOrdersPaginationRoot = document.getElementById("admin-recharge-orders-pagination");
const quotaLogsPaginationRoot = document.getElementById("admin-quota-logs-pagination");
const auditsPaginationRoot = document.getElementById("admin-audits-pagination");
const productsPaginationRoot = document.getElementById("admin-products-pagination");
const bundlesPaginationRoot = document.getElementById("admin-bundles-pagination");
const usersPaginationRoot = document.getElementById("admin-users-pagination");

const selectedProductIds = new Set();
let allProducts = [];
let allBundles = [];
let allUsers = [];
let currentRechargeConfig = null;
let linkedOrderUser = null;
let activeAdminPage = "imports";
let activeAdminProductCategory = "all";
let activeAdminProductSubcategory = "all";
let activeAdminProductDetail = "all";
let activeAdminProductFullness = "all";
let currentOrderList = [];
let currentRechargeOrderList = [];
let currentAuctionList = [];
let overviewCounts = {
  pendingOrderCount: 0,
  cancelReviewCount: 0,
  rechargeReviewCount: 0,
};
const POSTER_EXPORT_LIMIT = 60;
const POSTER_WEBSITE = "gongfazhushou.cn";
const ADMIN_READ_ROLES = new Set(["admin", "poster_admin"]);
const ADMIN_WRITE_ROLES = new Set(["admin"]);
const READ_ONLY_WRITE_CONTROL_IDS = [
  "load-sample-json-btn",
  "import-submit-btn",
  "recalculate-pricing-btn",
  "bulk-on-sale-btn",
  "bulk-off-sale-btn",
  "bulk-price-input",
  "bulk-price-btn",
  "bulk-stock-input",
  "bulk-stock-btn",
  "bulk-discount-rate-input",
  "bulk-discount-btn",
  "bulk-restore-discount-btn",
  "filtered-restore-discount-btn",
  "random-discount-count-input",
  "random-discount-rate-input",
  "random-select-products-btn",
  "random-discount-btn",
  "admin-auction-starting-price-input",
  "admin-auction-min-increment-input",
  "admin-auction-start-at-input",
  "admin-auction-end-at-input",
  "admin-auction-title-input",
  "admin-auction-remark-input",
  "admin-create-auction-btn",
  "save-recharge-config-btn",
];
const loadedAdminPages = new Set();
let alertPollTimer = null;
let currentAdminProfile = null;
const paginationState = {
  products: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
  bundles: { page: 1, pageSize: 8, total: 0, totalPages: 0 },
  users: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
  orders: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  rechargeOrders: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  quotaLogs: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  audits: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
};

function setDebugLine(element, prefix, value) {
  if (!element) return;
  element.textContent = `${prefix}: ${value}`;
}

function markDebugAction(action) {
  setDebugLine(adminDebugAction, "action", action);
}

function markDebugSession(sessionState) {
  setDebugLine(adminDebugSession, "session", sessionState);
}

function markDebugError(errorText) {
  setDebugLine(adminDebugError, "error", errorText || "none");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pickErrorMessage(error, fallback = "请求失败") {
  return error?.payload?.error || error?.message || fallback;
}

function setMessage(text, type = "") {
  adminMessage.textContent = text || "";
  adminMessage.className = type ? `notice ${type}` : "notice";
  if (type === "error") {
    markDebugError(text || "unknown_error");
  } else if (text) {
    markDebugError("none");
  }
}

function getAdminRoleValue(profile = currentAdminProfile) {
  return String(profile?.role || "").trim();
}

function hasAdminReadAccess(profile = currentAdminProfile) {
  return ADMIN_READ_ROLES.has(getAdminRoleValue(profile));
}

function hasAdminWriteAccess(profile = currentAdminProfile) {
  return ADMIN_WRITE_ROLES.has(getAdminRoleValue(profile));
}

function isAdminReadOnlyMode(profile = currentAdminProfile) {
  return hasAdminReadAccess(profile) && !hasAdminWriteAccess(profile);
}

function getAdminRoleLabel(role) {
  switch (String(role || "").trim()) {
    case "admin":
      return "管理员";
    case "poster_admin":
      return "海报只读";
    case "user":
      return "普通用户";
    default:
      return role || "-";
  }
}

function guardAdminWriteAccess(message = "当前账号是只读海报权限，不能修改后台数据。") {
  if (hasAdminWriteAccess()) return true;
  setMessage(message, "error");
  return false;
}

function setElementDisabled(element, disabled) {
  if (!element || typeof element.disabled === "undefined") return;
  element.disabled = Boolean(disabled);
}

function applyAdminAccessMode() {
  const readOnly = isAdminReadOnlyMode();
  document.body.classList.toggle("admin-readonly-mode", readOnly);

  READ_ONLY_WRITE_CONTROL_IDS.forEach((id) => {
    setElementDisabled(document.getElementById(id), readOnly);
  });

  const importControls = importForm?.querySelectorAll("input, textarea, button") || [];
  importControls.forEach((element) => setElementDisabled(element, readOnly));

  const rechargeConfigControls =
    adminRechargeConfigForm?.querySelectorAll("input, select, textarea, button") || [];
  rechargeConfigControls.forEach((element) => setElementDisabled(element, readOnly));
}

function formatOrderStatusLabel(status) {
  switch (status) {
    case "pending":
      return "待处理";
    case "cancel_requested":
      return "待审核取消";
    case "confirmed":
      return "已确认";
    case "cancelled":
      return "已取消";
    default:
      return status || "-";
  }
}

function normalizePaginatedResponse(response, fallbackPageSize = 20) {
  if (Array.isArray(response)) {
    return {
      items: response,
      total: response.length,
      page: 1,
      page_size: fallbackPageSize,
      total_pages: response.length > 0 ? 1 : 0,
      has_more: false,
    };
  }

  return {
    items: Array.isArray(response?.items) ? response.items : [],
    total: Number(response?.total || 0),
    page: Number(response?.page || 1),
    page_size: Number(response?.page_size || fallbackPageSize),
    total_pages: Number(response?.total_pages || 0),
    has_more: Boolean(response?.has_more),
  };
}

function renderPagination(root, target, state) {
  if (!root) return;

  const total = Number(state?.total || 0);
  const page = Math.max(Number(state?.page || 1), 1);
  const totalPages = Math.max(Number(state?.totalPages || 0), 0);

  if (total === 0) {
    root.innerHTML = '<div class="pagination-meta">当前共 0 条记录。</div>';
    return;
  }

  root.innerHTML = `
    <div class="pagination-meta">第 ${page} / ${Math.max(totalPages, 1)} 页，共 ${total} 条</div>
    <div class="pagination-actions">
      <button
        class="ghost"
        type="button"
        data-pagination-target="${target}"
        data-pagination-page="${Math.max(page - 1, 1)}"
        ${page <= 1 ? "disabled" : ""}
      >上一页</button>
      <button
        class="ghost"
        type="button"
        data-pagination-target="${target}"
        data-pagination-page="${Math.min(page + 1, Math.max(totalPages, 1))}"
        ${totalPages === 0 || page >= totalPages ? "disabled" : ""}
      >下一页</button>
    </div>
  `;
}

function resetPagedState(target) {
  if (!paginationState[target]) return;
  paginationState[target].page = 1;
}

function markPageLoaded(page, loaded = true) {
  if (loaded) {
    loadedAdminPages.add(page);
    return;
  }
  loadedAdminPages.delete(page);
}

function sliceLocalPage(items, stateKey) {
  const state = paginationState[stateKey];
  const total = items.length;
  const pageSize = Number(state?.pageSize || 10);
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const nextPage = Math.min(Math.max(Number(state?.page || 1), 1), Math.max(totalPages, 1));
  paginationState[stateKey] = {
    ...state,
    page: nextPage,
    total,
    totalPages,
  };
  const start = (nextPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function formatOrderItemSnapshot(item) {
  const snapshot =
    item?.product_snapshot && typeof item.product_snapshot === "object" ? item.product_snapshot : {};
  const lines = [];

  if (String(snapshot.service_kind || "") === "draw_service") {
    if (snapshot.amount_quota) {
      lines.push(`代抽额度：${Number(snapshot.amount_quota)}`);
    }
    if (snapshot.season_label) {
      lines.push(`赛季：${snapshot.season_label}`);
    }
    if (snapshot.rule_summary) {
      lines.push(snapshot.rule_summary);
    }
    return lines;
  }

  if (snapshot.legacy_id) {
    lines.push(`Legacy ID：${snapshot.legacy_id}`);
  }

  const attackValue = Number(snapshot.attack_value || 0);
  const hpValue = Number(snapshot.hp_value || 0);
  if (attackValue > 0 || hpValue > 0) {
    lines.push(`攻击 / 血量：${attackValue} / ${hpValue}`);
  }

  if (snapshot.ext_attrs) {
    lines.push(`额外词条：${snapshot.ext_attrs}`);
  }

  if (snapshot.main_attrs) {
    lines.push(`主词条：${snapshot.main_attrs}`);
  }

  if (snapshot.season_display) {
    lines.push(`赛季：${snapshot.season_display}`);
  }

  return lines;
}

function isDrawServiceOrder(order) {
  return String(order?.order_source || "").trim() === "draw_service";
}

function getDrawServiceMeta(order) {
  if (order?.draw_service && typeof order.draw_service === "object") {
    return order.draw_service;
  }
  const item = Array.isArray(order?.items)
    ? order.items.find(
        (entry) =>
          entry?.product_snapshot &&
          String(entry.product_snapshot.service_kind || "").trim() === "draw_service"
      )
    : null;
  return item?.product_snapshot || null;
}

function getOrderSourceLabel(order) {
  if (isDrawServiceOrder(order)) return "代抽专区";
  if (order?.order_source === "guest_transfer") return "转账锁卡";
  if (order?.order_source === "external") return "外部交易";
  if (order?.order_source === "auction") return "拍卖成交";
  return "商城下单";
}

function renderSession(profile) {
  const session = loadSession();
  currentAdminProfile = profile || null;

  if (!session?.token) {
    markDebugSession("no_token");
    adminSession.innerHTML =
      '<div class="stack-item">当前未登录。可直接在后台页输入管理员或海报只读账号的游戏 ID 和密码登录。</div>';
    applyAdminAccessMode();
    return { canRead: false, canWrite: false };
  }

  if (!profile) {
    markDebugSession("token_without_profile");
    adminSession.innerHTML = '<div class="stack-item">已检测到登录态，但当前无法读取管理员资料。</div>';
    applyAdminAccessMode();
    return { canRead: false, canWrite: false };
  }

  markDebugSession(`token role=${profile.role || "-"}`);
  const canRead = hasAdminReadAccess(profile);
  const canWrite = hasAdminWriteAccess(profile);

  adminSession.innerHTML = [
    `当前账号：${escapeHtml(profile.game_role_name || "-")}`,
    `游戏 ID：${escapeHtml(profile.game_role_id || "-")}`,
    `区服：${escapeHtml(profile.game_server || "-")}`,
    `角色：${escapeHtml(getAdminRoleLabel(profile.role || "-"))}`,
    `当前额度：${Number(profile.quota_balance || 0)}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  applyAdminAccessMode();
  return { canRead, canWrite };
}

function renderOverview() {
  const onSaleCount = allProducts.filter((product) => product.status === "on_sale").length;
  const discountedCount = allProducts.filter(isDiscountedProduct).length;
  const pendingOrderCount = Number(overviewCounts.pendingOrderCount || 0);
  const cancelReviewCount = Number(overviewCounts.cancelReviewCount || 0);
  const rechargeReviewCount = Number(overviewCounts.rechargeReviewCount || 0);
  const activeUsers = allUsers.filter((user) => user.status === "active").length;
  const totalQuota = allUsers.reduce((sum, user) => sum + Number(user.quota_balance || 0), 0);

  const cards = [
    { label: "商品总数", value: allProducts.length, hint: `上架中 ${onSaleCount}` },
    { label: "打折商品", value: discountedCount, hint: "当前折扣管理" },
    { label: "套餐总数", value: allBundles.length, hint: "独立 SKU" },
    { label: "用户总数", value: allUsers.length, hint: `活跃 ${activeUsers}` },
    { label: "待处理订单", value: pendingOrderCount, hint: "交易处理" },
    { label: "待审取消", value: cancelReviewCount, hint: "商品订单" },
    { label: "待审充值", value: rechargeReviewCount, hint: "充值申请" },
    { label: "用户总额度", value: totalQuota, hint: "当前可用额度汇总" },
  ];

  adminOverview.innerHTML = cards
    .map(
      (card) => `
        <div class="overview-card">
          <div class="overview-label">${escapeHtml(card.label)}</div>
          <div class="overview-value">${escapeHtml(card.value)}</div>
          <div class="overview-hint">${escapeHtml(card.hint)}</div>
        </div>
      `
    )
    .join("");
}

function renderAdminAlerts() {
  if (!adminAlerts || !adminAlertSummary || !adminAlertActions) return;

  adminAlerts.classList.remove("hidden");

  const pendingOrderCount = Number(overviewCounts.pendingOrderCount || 0);
  const cancelReviewCount = Number(overviewCounts.cancelReviewCount || 0);
  const rechargeReviewCount = Number(overviewCounts.rechargeReviewCount || 0);
  const totalPending = pendingOrderCount + cancelReviewCount + rechargeReviewCount;
  const lastUpdated = formatDate(new Date().toISOString());

  if (adminAlertTimestamp) {
    adminAlertTimestamp.textContent = `上次刷新：${lastUpdated}`;
  }

  adminAlertSummary.innerHTML = `
    <div class="admin-alert-lead ${totalPending > 0 ? "hot" : ""}">
      ${
        totalPending > 0
          ? `当前有 ${totalPending} 条待处理事项，优先看订单和充值审核。`
          : "当前没有待处理的充值或交易。"
      }
    </div>
    <div class="admin-alert-grid">
      <div class="admin-alert-item ${pendingOrderCount > 0 ? "hot" : ""}">
        <div class="admin-alert-label">待处理订单</div>
        <div class="admin-alert-value ${pendingOrderCount > 0 ? "hot" : ""}">${pendingOrderCount}</div>
      </div>
      <div class="admin-alert-item ${cancelReviewCount > 0 ? "hot" : ""}">
        <div class="admin-alert-label">待审取消</div>
        <div class="admin-alert-value ${cancelReviewCount > 0 ? "hot" : ""}">${cancelReviewCount}</div>
      </div>
      <div class="admin-alert-item ${rechargeReviewCount > 0 ? "hot" : ""}">
        <div class="admin-alert-label">待审充值</div>
        <div class="admin-alert-value ${rechargeReviewCount > 0 ? "hot" : ""}">${rechargeReviewCount}</div>
      </div>
    </div>
  `;

  adminAlertActions.innerHTML = `
    <button class="ghost" type="button" data-alert-target="orders" data-alert-status="pending">去看订单</button>
    <button class="ghost" type="button" data-alert-target="orders" data-alert-status="cancel_requested">去看取消审核</button>
    <button class="ghost" type="button" data-alert-target="recharge" data-alert-status="pending_review">去看充值审核</button>
    <button class="ghost" type="button" id="refresh-alert-counts-btn">刷新提醒</button>
  `;
}

function clearAdminAlerts() {
  if (alertPollTimer) {
    window.clearInterval(alertPollTimer);
    alertPollTimer = null;
  }
  if (adminAlerts) {
    adminAlerts.classList.add("hidden");
  }
  if (adminAlertSummary) {
    adminAlertSummary.innerHTML = "";
  }
  if (adminAlertActions) {
    adminAlertActions.innerHTML = "";
  }
  if (adminAlertTimestamp) {
    adminAlertTimestamp.textContent = "等待首次刷新";
  }
}

function startAlertPolling() {
  if (alertPollTimer) {
    window.clearInterval(alertPollTimer);
  }
  alertPollTimer = window.setInterval(() => {
    loadOverviewCounts().catch(() => {});
  }, 60000);
}

function renderLinkedOrderUserState() {
  if (!linkedOrderUser) {
    linkedOrderUserState.innerHTML = "";
    return;
  }

  linkedOrderUserState.innerHTML = `
    <span class="chip">订单关联用户：${escapeHtml(linkedOrderUser.game_role_name || "-")}</span>
    <span class="chip">游戏 ID：${escapeHtml(linkedOrderUser.game_role_id || "-")}</span>
    <button id="clear-linked-order-user-btn" class="ghost" type="button">清除联动</button>
  `;
}

function renderRechargeConfig(config) {
  currentRechargeConfig = config || null;
  if (!config || !adminRechargeConfigForm) return;

  if (adminRechargeEnabled) adminRechargeEnabled.value = String(Boolean(config.enabled));
  if (adminRechargeExchangeYuanInput) adminRechargeExchangeYuanInput.value = Number(config.exchange_yuan || 1);
  if (adminRechargeExchangeQuotaInput) adminRechargeExchangeQuotaInput.value = Number(config.exchange_quota || 0);
  if (adminRechargeMinYuanInput) adminRechargeMinYuanInput.value = Number(config.min_amount_yuan || 1);
  if (adminResidualTransferEnabledInput) {
    adminResidualTransferEnabledInput.value = String(Boolean(config.residual_transfer_enabled));
  }
  if (adminResidualAdminRoleIdInput) {
    adminResidualAdminRoleIdInput.value = config.residual_admin_role_id || "";
  }
  if (adminResidualAdminRoleNameInput) {
    adminResidualAdminRoleNameInput.value = config.residual_admin_role_name || "";
  }
  if (adminResidualAdminGameNameInput) {
    adminResidualAdminGameNameInput.value = config.residual_admin_game_name || "";
  }
  if (adminResidualUnitLabelInput) {
    adminResidualUnitLabelInput.value = config.residual_unit_label || "";
  }
  if (adminResidualQuotaPerUnitInput) {
    adminResidualQuotaPerUnitInput.value = Number(config.residual_quota_per_unit || 1);
  }
  if (adminSeasonMemberEnabledInput) adminSeasonMemberEnabledInput.value = String(Boolean(config.season_member_enabled));
  if (adminSeasonMemberLabelInput) adminSeasonMemberLabelInput.value = config.season_member_season_label || "";
  if (adminSeasonMemberExpiresAtInput) adminSeasonMemberExpiresAtInput.value = config.season_member_expires_at || "";
  if (adminSeasonMemberPriceInput) adminSeasonMemberPriceInput.value = Number(config.season_member_price_yuan || 0);
  if (adminSeasonMemberQuotaInput) adminSeasonMemberQuotaInput.value = Number(config.season_member_quota || 0);
  if (adminSeasonMemberBonusRateInput) adminSeasonMemberBonusRateInput.value = Number(config.season_member_bonus_rate || 0);
  if (adminRechargePresetsInput) {
    adminRechargePresetsInput.value = Array.isArray(config.preset_amounts)
      ? config.preset_amounts.join(",")
      : "";
  }
  if (adminRechargePayeeNameInput) adminRechargePayeeNameInput.value = config.payee_name || "";
  if (adminRechargePayeeHintInput) adminRechargePayeeHintInput.value = config.payee_hint || "";
  if (adminRechargeQrImageUrlInput) adminRechargeQrImageUrlInput.value = config.qr_image_url || "";
  if (adminWechatPayeeNameInput) adminWechatPayeeNameInput.value = config.wechat_payee_name || "";
  if (adminWechatPayeeHintInput) adminWechatPayeeHintInput.value = config.wechat_payee_hint || "";
  if (adminWechatQrImageUrlInput) adminWechatQrImageUrlInput.value = config.wechat_qr_image_url || "";
  if (adminRechargeInstructionsInput) {
    adminRechargeInstructionsInput.value = Array.isArray(config.instructions)
      ? config.instructions.join("\n")
      : "";
  }
  if (adminResidualInstructionsInput) {
    adminResidualInstructionsInput.value = Array.isArray(config.residual_instructions)
      ? config.residual_instructions.join("\n")
      : "";
  }
  if (adminRechargeQrPreview) {
    adminRechargeQrPreview.src = config.qr_image_url || "/payment/alipay-qr.jpg";
  }
  if (adminWechatQrPreview) {
    adminWechatQrPreview.src = config.wechat_qr_image_url || "/payment/wechat-qr.png";
  }
  applyAdminAccessMode();
}

function activateAdminPage(page, { force = false } = {}) {
  activeAdminPage = page;

  adminPageButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-admin-page-tab") === page);
  });
  adminPagePanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-admin-page-panel") !== page);
  });

  return loadAdminPage(page, { force });
}

function setLinkedOrderUser(user) {
  linkedOrderUser = user
    ? {
        id: user.id,
        game_role_id: user.game_role_id,
        game_role_name: user.game_role_name,
      }
    : null;

  if (linkedOrderUser?.game_role_id) {
    adminOrderKeywordInput.value = String(linkedOrderUser.game_role_id);
  }

  renderLinkedOrderUserState();
}

function syncSelectedProducts() {
  selectedProductsChip.textContent = `已选 ${selectedProductIds.size}`;
  renderSelectedAuctionProduct();
}

function isDiscountedProduct(product) {
  return normalizeDiscountRate(product?.discount_rate) < 100;
}

function syncProductSummary(products = getFilteredProducts()) {
  syncSelectedProducts();
  if (filteredProductsChip) {
    filteredProductsChip.textContent = `当前筛选 ${products.length}`;
  }
  if (discountedProductsChip) {
    discountedProductsChip.textContent = `打折中 ${products.filter(isDiscountedProduct).length}`;
  }
}

function getSelectedAuctionProduct() {
  const selectedIds = [...selectedProductIds];
  if (selectedIds.length !== 1) return null;
  return allProducts.find((product) => Number(product.id) === Number(selectedIds[0])) || null;
}

function renderSelectedAuctionProduct() {
  if (!selectedAuctionProductChip) return;
  const product = getSelectedAuctionProduct();
  if (!product) {
    selectedAuctionProductChip.textContent = "当前未选择拍卖商品";
    return;
  }
  const auctionHint =
    product.auction_id && product.auction_status
      ? ` / 当前拍卖 ${product.auction_status} #${product.auction_id}`
      : "";
  selectedAuctionProductChip.textContent = `当前拍卖商品：#${product.id} ${product.name}${auctionHint}`;
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

function renderAuctions(auctions) {
  currentAuctionList = Array.isArray(auctions) ? auctions : [];
  if (!auctionsRoot) return;
  const canWrite = hasAdminWriteAccess();

  if (!currentAuctionList.length) {
    auctionsRoot.innerHTML = '<div class="stack-item">当前没有拍卖记录。</div>';
    return;
  }

  auctionsRoot.innerHTML = currentAuctionList
    .map((auction) => {
      const item = auction?.item || {};
      const bids = Array.isArray(auction?.bids) ? auction.bids : [];
      const bidLines = bids.length
        ? bids
            .slice(0, 5)
            .map(
              (bid) =>
                `<div class="stack-item">${escapeHtml(
                  bid.game_role_name || bid.nickname || bid.game_role_id || "-"
                )} / ${Number(bid.amount_quota || 0)} 额度 / ${formatDate(bid.created_at)}</div>`
            )
            .join("")
        : '<div class="stack-item">还没有人出价。</div>';

      return `
        <div class="admin-card" data-auction-id="${auction.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(auction.title || item.name || `拍卖 #${auction.id}`)}</div>
            <span class="chip">${escapeHtml(formatAuctionStatusLabel(auction.status))}</span>
          </div>
          <div class="product-meta">
            <div>商品：#${Number(auction.product_id || 0)} / ${escapeHtml(item.name || "-")}</div>
            <div>起拍价：${Number(auction.starting_price_quota || 0)} / 当前价：${Number(auction.current_price_quota || 0)} / 加价幅度：${Number(auction.min_increment_quota || 0)}</div>
            <div>领先者：${escapeHtml(auction.current_bid_user_name || auction.leading_bidder_label || "暂无")} / 游戏ID：${escapeHtml(auction.current_bid_user_game_role_id || "-")} / 用户ID：${Number(auction.current_bid_user_id || 0) || "-"} / 共 ${Number(auction.bid_count || 0)} 次出价</div>
            ${
              auction.current_bid_user_name || auction.leading_bidder_label
                ? `<div>领先者额度：${Number(auction.current_bid_user_quota_balance || 0)} / 成交价：${Number(auction.winning_amount_quota || auction.current_price_quota || 0)} / ${
                    auction.can_direct_settle ? "可直接扣额度结算" : "额度不足，走线下结算"
                  }</div>`
                : ""
            }
            <div>开始：${formatDate(auction.starts_at)} / 截止：${formatDate(auction.ends_at)}</div>
            ${auction.settled_order_id ? `<div>成交订单：#${Number(auction.settled_order_id)}</div>` : ""}
            ${auction.cancelled_reason ? `<div>流拍原因：${escapeHtml(auction.cancelled_reason)}</div>` : ""}
          </div>
          <div class="stack-list">${bidLines}</div>
          ${
            canWrite
              ? `
                  <div class="inline-form">
                    <input data-field="auction-remark" type="text" value="${escapeHtml(auction.remark || "")}" placeholder="结算或流拍备注，可选" />
                    <input data-field="auction-reason" type="text" value="${escapeHtml(auction.cancelled_reason || "")}" placeholder="流拍原因，可选" />
                  </div>
                  <div class="actions">
                    <button class="ghost reload-single-auction-btn" type="button">刷新</button>
                    <button class="primary settle-auction-direct-btn" type="button" ${
                      auction.status === "ended" && auction.can_direct_settle ? "" : "disabled"
                    }>扣额度结算</button>
                    <button class="ghost settle-auction-offline-btn" type="button" ${
                      auction.status === "ended" ? "" : "disabled"
                    }>联系管理员结算</button>
                    <button class="danger cancel-auction-btn" type="button" ${["settled", "cancelled"].includes(String(auction.status || "")) ? "disabled" : ""}>流拍</button>
                  </div>
                `
              : `
                  <div class="muted">备注：${escapeHtml(auction.remark || "-")}</div>
                  <div class="muted">流拍原因：${escapeHtml(auction.cancelled_reason || "-")}</div>
                `
          }
        </div>
      `;
    })
    .join("");
}

function parseDiscountRateInputValue(value, fallback = null) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 100) {
    return fallback;
  }
  return numeric;
}

function parsePositiveCountInputValue(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
}

function sampleProducts(list, count) {
  const items = [...list];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items.slice(0, count);
}

function getPricingMeta(product) {
  return product && product.pricing_meta && typeof product.pricing_meta === "object"
    ? product.pricing_meta
    : {};
}

function normalizeDiscountRate(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 100;
  const normalized = Math.round(numeric);
  if (normalized <= 0 || normalized > 100) return 100;
  return normalized;
}

function getDiscountLabel(discountRate) {
  const normalized = normalizeDiscountRate(discountRate);
  if (normalized >= 100) return "无折扣";
  const fold = normalized / 10;
  return Number.isInteger(fold) ? `${fold}折` : `${fold.toFixed(1)}折`;
}

function formatRate(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return `${(numeric * 100).toFixed(1)}%`;
}

function renderAdminProductCover(product) {
  const imageUrl = product?.image_url ? escapeHtml(product.image_url) : "";
  if (imageUrl) {
    return `
      <div class="admin-product-cover">
        <img
          src="${imageUrl}"
          alt="${escapeHtml(product.name || "product")}"
          loading="lazy"
          onerror="this.style.display='none'; this.parentElement.classList.add('fallback')"
        />
        <div class="admin-product-fallback">${escapeHtml(String(product.name || "?").slice(0, 1))}</div>
      </div>
    `;
  }

  return `
    <div class="admin-product-cover fallback">
      <div class="admin-product-fallback">${escapeHtml(String(product.name || "?").slice(0, 1))}</div>
    </div>
  `;
}

function renderPricingSummary(product, pricingMeta) {
  const atlasPrice = Number(pricingMeta?.atlas?.price || 0);
  const wearPrice = Number(pricingMeta?.wear?.price || 0);
  const marketFactor = Number(pricingMeta?.market?.factor || 1).toFixed(2);
  const attackRate = formatRate(pricingMeta?.atlas?.attack_rate);
  const hpRate = formatRate(pricingMeta?.atlas?.hp_rate);
  const fireRate = formatRate(pricingMeta?.wear?.fire_rate);
  const calmRate = formatRate(pricingMeta?.wear?.calm_rate);
  const referenceCaps = pricingMeta?.reference_caps || {};

  return `
    <div class="pricing-chip-row">
      <span class="pricing-chip">${escapeHtml(pricingMeta?.dominant_reason_label || "reason")}</span>
      <span class="pricing-chip">${escapeHtml(pricingMeta?.source === "manual" ? "manual" : "auto")}</span>
      <span class="pricing-chip">market ${marketFactor}</span>
      <span class="pricing-chip">${escapeHtml(pricingMeta?.reference_source || "reference")}</span>
    </div>
    <div class="pricing-grid">
      <div class="pricing-block">
        <strong>Atlas</strong>
        <span>${atlasPrice}</span>
        <small>ATK ${attackRate} / HP ${hpRate}</small>
      </div>
      <div class="pricing-block">
        <strong>Wear</strong>
        <span>${wearPrice}</span>
        <small>Fire ${fireRate} / Calm ${calmRate}</small>
      </div>
      <div class="pricing-block">
        <strong>Final</strong>
        <span>${Number(product.price_quota || 0)}</span>
        <small>Floor ${Number(pricingMeta?.floor_price || 0)}</small>
      </div>
      <div class="pricing-block">
        <strong>Caps</strong>
        <span>${Number(referenceCaps.attack_max || 0)} / ${Number(referenceCaps.hp_max || 0)}</span>
        <small>${Number(referenceCaps.fire_total_max || 0)} / ${Number(referenceCaps.calm_total_max || 0)}</small>
      </div>
    </div>
  `;
}

function openProductModal(product) {
  const pricingMeta = getPricingMeta(product);
  const rawSnapshot = {
    id: product.id,
    uid: product.uid,
    legacy_id: product.legacy_id,
    name: product.name,
    image_url: product.image_url,
    attack_value: product.attack_value,
    hp_value: product.hp_value,
    main_attrs: product.main_attrs,
    ext_attrs: product.ext_attrs,
    stock: product.stock,
    status: product.status,
    price_quota: product.price_quota,
    manual_price_quota: product.manual_price_quota,
    pricing_meta: pricingMeta,
  };

  adminProductModalBody.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-cover">
        ${renderAdminProductCover(product)}
      </div>
      <div class="product-detail-main">
        <div class="product-name">${escapeHtml(product.name || "-")}</div>
        <div class="detail-list">
          <div class="detail-row"><strong>UID</strong><span>${escapeHtml(product.uid || "-")}</span></div>
          <div class="detail-row"><strong>Legacy</strong><span>${escapeHtml(product.legacy_id || "-")}</span></div>
          <div class="detail-row"><strong>攻击 / 血量</strong><span>${Number(product.attack_value || 0)} / ${Number(product.hp_value || 0)}</span></div>
          <div class="detail-row"><strong>主词条</strong><span>${escapeHtml(product.main_attrs || "-")}</span></div>
          <div class="detail-row"><strong>额外词条</strong><span>${escapeHtml(product.ext_attrs || "-")}</span></div>
          <div class="detail-row"><strong>库存 / 状态</strong><span>${Number(product.stock || 0)} / ${escapeHtml(product.status || "-")}</span></div>
        </div>
        ${renderPricingSummary(product, pricingMeta)}
      </div>
    </div>
    <div class="detail-list">
      <div class="card-title">原始商品快照</div>
      <pre class="admin-detail-pre">${escapeHtml(JSON.stringify(rawSnapshot, null, 2))}</pre>
    </div>
  `;
  adminProductModal.classList.remove("hidden");
}

function closeProductModal() {
  adminProductModal.classList.add("hidden");
  adminProductModalBody.innerHTML = "";
}

function getAdminProductTierKey(product) {
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 500) return "gold";
  if (legacyId >= 400) return "red";
  if (legacyId >= 300) return "orange";
  if (legacyId >= 200) return "purple";
  if (legacyId >= 100) return "blue";
  return "green";
}

function getAdminProductTierLabelByKey(key) {
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

function isAdminCurrentSeasonProduct(product) {
  return Boolean(product?.is_current_season);
}

function isAdminSeasonCategory(category) {
  return category === "current_season" || category === "legacy_season";
}

function getAdminTopCategoryKey(product) {
  return isAdminCurrentSeasonProduct(product) ? "current_season" : "legacy_season";
}

function buildAdminProductCategoryEntries(products) {
  const labels = {
    all: "全部",
    current_season: "本赛季",
    legacy_season: "往赛季",
    bundle: "套餐",
  };
  const counts = { all: Array.isArray(products) ? products.length : 0 };
  for (const product of products || []) {
    const key = getAdminTopCategoryKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  counts.bundle = Array.isArray(allBundles) ? allBundles.length : 0;
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderAdminProductCategoryTabs(products) {
  if (!adminProductCategoryTabs) return;
  const entries = buildAdminProductCategoryEntries(products || []);
  const validKeys = new Set(entries.map((entry) => entry.key));
  if (!validKeys.has(activeAdminProductCategory)) {
    activeAdminProductCategory = "all";
  }
  adminProductCategoryTabs.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="category-tab ${entry.key === activeAdminProductCategory ? "active" : ""}"
          data-admin-product-category="${entry.key}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="category-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
}

function parseAdminExtAttrStats(extAttrs) {
  const raw = String(extAttrs || "").trim();
  if (!raw || raw === "无") {
    return { fire: 0, calm: 0 };
  }
  const fireMatch = raw.match(/走火\s*([0-9.]+)/);
  const calmMatch = raw.match(/气定\s*([0-9.]+)/);
  return {
    fire: fireMatch ? Number(fireMatch[1]) || 0 : 0,
    calm: calmMatch ? Number(calmMatch[1]) || 0 : 0,
  };
}

function getAdminGoldSubcategory(product) {
  if (getAdminProductTierKey(product) !== "gold") return "all";
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 600) return "rare";
  const extStats = parseAdminExtAttrStats(product?.ext_attrs);
  if (extStats.fire > 0 && extStats.calm > 0) return "double_term";
  if (extStats.fire > 0) return "fire_only";
  if (extStats.calm > 0) return "calm_only";
  return "no_term";
}

function getAdminNameSubcategoryKey(product) {
  const name = String(product?.name || "").trim();
  return name ? `name:${name}` : "all";
}

function buildAdminProductSubcategoryEntries(products, category) {
  if (!category || category === "bundle") return [];
  const subset = products || [];
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
    const key = getAdminProductTierKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderAdminProductSubcategoryTabs(products) {
  if (!adminProductSubcategoryTabs) return;
  if (!activeAdminProductCategory || activeAdminProductCategory === "bundle") {
    adminProductSubcategoryTabs.classList.add("hidden");
    adminProductSubcategoryTabs.innerHTML = "";
    activeAdminProductSubcategory = "all";
    return;
  }

  const entries = buildAdminProductSubcategoryEntries(products || [], activeAdminProductCategory);
  const validKeys = new Set(entries.map((entry) => entry.key));
  if (!validKeys.has(activeAdminProductSubcategory)) {
    activeAdminProductSubcategory = "all";
  }

  adminProductSubcategoryTabs.classList.toggle("hidden", entries.length <= 1);
  adminProductSubcategoryTabs.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === activeAdminProductSubcategory ? "active" : ""}"
          data-admin-product-subcategory="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
}

function buildAdminProductDetailEntries(products, tier) {
  if (!tier || tier === "all" || tier === "bundle") return [];
  const subset = (products || []).filter((product) => getAdminProductTierKey(product) === tier);
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
      const key = getAdminGoldSubcategory(product);
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(labels)
      .filter(([key]) => key === "all" || counts[key] > 0)
      .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
  }

  const counts = new Map();
  for (const product of subset) {
    const key = getAdminNameSubcategoryKey(product);
    counts.set(key, {
      key,
      label: String(product?.name || "未命名"),
      count: (counts.get(key)?.count || 0) + 1,
    });
  }

  return [
    { key: "all", label: `全部${getAdminProductTierLabelByKey(tier)}`, count: subset.length },
    ...Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label), "zh-Hans-CN")
    ),
  ];
}

function renderAdminProductDetailTabs(products) {
  if (!adminProductDetailTabs) return;
  const entries = buildAdminProductDetailEntries(products || [], activeAdminProductSubcategory);
  if (entries.length <= 1) {
    adminProductDetailTabs.classList.add("hidden");
    adminProductDetailTabs.innerHTML = "";
    activeAdminProductDetail = "all";
    return;
  }

  const validKeys = new Set(entries.map((entry) => entry.key));
  if (!validKeys.has(activeAdminProductDetail)) {
    activeAdminProductDetail = "all";
  }

  adminProductDetailTabs.classList.remove("hidden");
  adminProductDetailTabs.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === activeAdminProductDetail ? "active" : ""}"
          data-admin-product-detail="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
}

function getAdminProductFullnessKey(product) {
  const attack = Number(product?.attack_value || 0);
  const hp = Number(product?.hp_value || 0);
  const caps = {
    gold: { attack: 10000000, hp: 200000000 },
    red: { attack: 8000000, hp: 160000000 },
    orange: { attack: 5000000, hp: 100000000 },
    purple: { attack: 2000000, hp: 40000000 },
    blue: { attack: 1000000, hp: 20000000 },
  };
  const tierCaps = caps[getAdminProductTierKey(product)] || { attack: Number.MAX_SAFE_INTEGER, hp: Number.MAX_SAFE_INTEGER };
  const attackFull = attack > 0 && attack >= tierCaps.attack;
  const hpFull = hp > 0 && hp >= tierCaps.hp;
  if (attackFull && hpFull) return "double_full";
  if (attackFull) return "attack_full";
  if (hpFull) return "hp_full";
  return "none_full";
}

function buildAdminProductFullnessEntries(products, enabled) {
  if (!enabled) return [];
  const subset = products || [];
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
    const key = getAdminProductFullnessKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderAdminProductFullnessTabs(products) {
  if (!adminProductFullnessTabs) return;
  const entries = buildAdminProductFullnessEntries(
    products || [],
    activeAdminProductCategory !== "bundle" && activeAdminProductSubcategory !== "all"
  );
  if (entries.length <= 1) {
    adminProductFullnessTabs.classList.add("hidden");
    adminProductFullnessTabs.innerHTML = "";
    activeAdminProductFullness = "all";
    return;
  }

  const validKeys = new Set(entries.map((entry) => entry.key));
  if (!validKeys.has(activeAdminProductFullness)) {
    activeAdminProductFullness = "all";
  }

  adminProductFullnessTabs.classList.remove("hidden");
  adminProductFullnessTabs.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === activeAdminProductFullness ? "active" : ""}"
          data-admin-product-fullness="${entry.key}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
}

function filterAdminProductsByCategory(products, category) {
  if (!category || category === "all") return products || [];
  if (category === "current_season") {
    return (products || []).filter((product) => isAdminCurrentSeasonProduct(product));
  }
  if (category === "legacy_season") {
    return (products || []).filter((product) => !isAdminCurrentSeasonProduct(product));
  }
  if (category === "bundle") {
    return [];
  }
  return (products || []).filter((product) => getAdminProductTierKey(product) === category);
}

function filterAdminProductsBySubcategory(products, category, subcategory) {
  if (!category || category === "bundle") return products || [];
  if (!subcategory || subcategory === "all") return products || [];
  return (products || []).filter((product) => getAdminProductTierKey(product) === subcategory);
}

function filterAdminProductsByDetail(products, tier, detail) {
  if (!tier || tier === "all" || tier === "bundle") return products || [];
  if (!detail || detail === "all") return products || [];
  if (tier === "gold") {
    return (products || []).filter((product) => getAdminGoldSubcategory(product) === detail);
  }
  return (products || []).filter((product) => getAdminNameSubcategoryKey(product) === detail);
}

function filterAdminProductsByFullness(products, fullness) {
  if (!fullness || fullness === "all") return products || [];
  return (products || []).filter((product) => getAdminProductFullnessKey(product) === fullness);
}

function getAdminBaseFilteredProducts() {
  const keyword = String(adminProductKeywordInput.value || "").trim().toLowerCase();
  const status = adminProductStatusFilter.value;
  const discountFilter = adminProductDiscountFilter?.value || "all";

  return allProducts.filter((product) => {
    if (status !== "all" && product.status !== status) return false;
    if (discountFilter === "discounted" && !isDiscountedProduct(product)) return false;
    if (discountFilter === "full_price" && isDiscountedProduct(product)) return false;
    if (!keyword) return true;
    return [
      product.name,
      product.ext_attrs,
      product.source_file_name,
      String(product.legacy_id || ""),
      String(product.uid || ""),
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(keyword));
  });
}

function syncAdminProductFilters(products = getAdminBaseFilteredProducts()) {
  renderAdminProductCategoryTabs(products);
  const categoryFiltered = filterAdminProductsByCategory(products, activeAdminProductCategory);
  renderAdminProductSubcategoryTabs(categoryFiltered);
  const subcategoryFiltered = filterAdminProductsBySubcategory(
    categoryFiltered,
    activeAdminProductCategory,
    activeAdminProductSubcategory
  );
  renderAdminProductDetailTabs(subcategoryFiltered);
  const detailFiltered = filterAdminProductsByDetail(
    subcategoryFiltered,
    activeAdminProductSubcategory,
    activeAdminProductDetail
  );
  renderAdminProductFullnessTabs(detailFiltered);
}

function getFilteredProducts() {
  const baseFiltered = getAdminBaseFilteredProducts();
  const categoryFiltered = filterAdminProductsByCategory(baseFiltered, activeAdminProductCategory);
  const subcategoryFiltered = filterAdminProductsBySubcategory(
    categoryFiltered,
    activeAdminProductCategory,
    activeAdminProductSubcategory
  );
  const detailFiltered = filterAdminProductsByDetail(
    subcategoryFiltered,
    activeAdminProductSubcategory,
    activeAdminProductDetail
  );
  return filterAdminProductsByFullness(detailFiltered, activeAdminProductFullness);
}

function getDiscountedFilteredProducts() {
  return getFilteredProducts().filter(isDiscountedProduct);
}

function getRandomDiscountCandidates() {
  return getFilteredProducts().filter(
    (product) => product.status === "on_sale" && Number(product.stock || 0) > 0
  );
}

function formatPosterCompactNumber(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0";
  const abs = Math.abs(numeric);

  if (abs >= 100000000) {
    const unitValue = abs / 100000000;
    const digits = unitValue >= 100 ? 0 : unitValue >= 10 ? 1 : 2;
    return `${numeric < 0 ? "-" : ""}${Number(unitValue.toFixed(digits))}亿`;
  }

  if (abs >= 10000) {
    const unitValue = abs / 10000;
    const digits = unitValue >= 100 ? 0 : unitValue >= 10 ? 1 : 2;
    return `${numeric < 0 ? "-" : ""}${Number(unitValue.toFixed(digits))}万`;
  }

  return String(numeric);
}

function getPosterCashAmount(quotaAmount, rechargeConfig = currentRechargeConfig) {
  const quota = Number(quotaAmount || 0);
  const exchangeQuota = Number(rechargeConfig?.exchange_quota || 0);
  const exchangeYuan = Number(rechargeConfig?.exchange_yuan || 0);
  if (!Number.isFinite(quota) || quota <= 0 || exchangeQuota <= 0 || exchangeYuan <= 0) {
    return null;
  }
  return (quota * exchangeYuan) / exchangeQuota;
}

function formatPosterCashAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "RMB 待定";
  if (Math.abs(numeric - Math.round(numeric)) < 0.001) {
    return `¥${Math.round(numeric)}`;
  }
  return `¥${numeric.toFixed(2)}`;
}

function getPosterSeasonLabel(product) {
  const explicit = String(product?.season_display || "").trim();
  if (explicit) return explicit;
  const scheduleId = Number(product?.schedule_id || 0);
  if (!scheduleId) return isAdminCurrentSeasonProduct(product) ? "当前赛季" : "往赛季";
  return `${isAdminCurrentSeasonProduct(product) ? "S" + scheduleId + " 当前赛季" : "S" + scheduleId + " 老卡"}`;
}

function getPosterTermLabel(product) {
  const extAttrs = String(product?.ext_attrs || "").trim();
  if (extAttrs && extAttrs !== "无") {
    return extAttrs.replace(/\s+/g, " ");
  }
  const mainAttrs = String(product?.main_attrs || "").trim();
  return mainAttrs || "无额外词条";
}

function isPosterSoldProduct(product) {
  return String(product?.status || "").trim() === "sold";
}

function getPosterExportProducts() {
  const selected = allProducts.filter((product) => selectedProductIds.has(Number(product.id)));
  const fallbackCount = getPosterAutoPickCount();
  const source = selected.length > 0 ? selected : getFilteredProducts().slice(0, fallbackCount);
  return [...source]
    .sort(
      (a, b) =>
        Number(b?.effective_price_quota || b?.price_quota || 0) -
        Number(a?.effective_price_quota || a?.price_quota || 0)
    )
    .slice(0, selected.length > 0 ? POSTER_EXPORT_LIMIT : fallbackCount);
}

function getPosterAutoPickCount() {
  const raw = Number(exportPosterAutoCountInput?.value || 12);
  if (!Number.isInteger(raw)) return 12;
  return Math.min(Math.max(raw, 4), POSTER_EXPORT_LIMIT);
}

async function fetchRecentConfirmedProductStats() {
  const maxPages = 3;
  const pageSize = 100;
  const stats = new Map();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = normalizePaginatedResponse(
      await apiFetch(`/admin/orders?status=confirmed&page=${page}&page_size=${pageSize}`)
    );
    const orders = Array.isArray(response.items) ? response.items : [];

    orders.forEach((order) => {
      const createdAt = String(order?.created_at || "");
      const items = Array.isArray(order?.items) ? order.items : [];
      items.forEach((item) => {
        if (String(item?.item_kind || "card") !== "card") return;
        const productId = Number(item?.product_id || 0);
        if (!productId) return;
        const current = stats.get(productId) || {
          count: 0,
          lastSoldAt: "",
        };
        current.count += 1;
        if (!current.lastSoldAt || createdAt.localeCompare(current.lastSoldAt) > 0) {
          current.lastSoldAt = createdAt;
        }
        stats.set(productId, current);
      });
    });

    if (!response.has_more) break;
  }

  return stats;
}

function rankPosterCandidates(candidates, stats, mode) {
  return [...candidates].sort((a, b) => {
    const aStats = stats.get(Number(a.id)) || { count: 0, lastSoldAt: "" };
    const bStats = stats.get(Number(b.id)) || { count: 0, lastSoldAt: "" };

    if (mode === "hot") {
      const countDiff = bStats.count - aStats.count;
      if (countDiff !== 0) return countDiff;
      const soldDiff = String(bStats.lastSoldAt || "").localeCompare(String(aStats.lastSoldAt || ""));
      if (soldDiff !== 0) return soldDiff;
      return (
        Number(b.effective_price_quota || b.price_quota || 0) -
        Number(a.effective_price_quota || a.price_quota || 0)
      );
    }

    const aUnsold = aStats.count === 0 ? 1 : 0;
    const bUnsold = bStats.count === 0 ? 1 : 0;
    if (bUnsold !== aUnsold) return bUnsold - aUnsold;
    const staleDiff = String(aStats.lastSoldAt || "").localeCompare(String(bStats.lastSoldAt || ""));
    if (staleDiff !== 0) return staleDiff;
    const priceDiff =
      Number(a.effective_price_quota || a.price_quota || 0) -
      Number(b.effective_price_quota || b.price_quota || 0);
    if (priceDiff !== 0) return priceDiff;
    return Number(b.stock || 0) - Number(a.stock || 0);
  });
}

function applyPosterSelection(products) {
  selectedProductIds.clear();
  products.forEach((product) => selectedProductIds.add(Number(product.id)));
  renderProducts(getFilteredProducts());
}

async function autoSelectPosterProducts(mode) {
  const candidates = getFilteredProducts().filter(
    (product) => product.status === "on_sale" && Number(product.stock || 0) > 0
  );
  if (!candidates.length) {
    setMessage("当前筛选下没有可自动挑选的在售商品。", "error");
    return;
  }

  const pickCount = Math.min(getPosterAutoPickCount(), candidates.length);
  setMessage(mode === "hot" ? "正在分析最近热卖商品..." : "正在筛选冷门低价商品...");

  try {
    const stats = await fetchRecentConfirmedProductStats();
    const ranked = rankPosterCandidates(candidates, stats, mode);

    const picked = ranked.slice(0, pickCount);
    applyPosterSelection(picked);
    setMessage(
      mode === "hot"
        ? `已按最近已确认订单自动选中 ${picked.length} 件热卖商品。`
        : `已按近期少成交且价格较低的规则自动选中 ${picked.length} 件商品。`,
      "success"
    );
  } catch (error) {
    setMessage(`自动选品失败：${pickErrorMessage(error, "请稍后再试")}`, "error");
  }
}

async function autoSelectMixedPosterProducts() {
  const candidates = getFilteredProducts().filter(
    (product) => product.status === "on_sale" && Number(product.stock || 0) > 0
  );
  if (!candidates.length) {
    setMessage("当前筛选下没有可自动挑选的在售商品。", "error");
    return;
  }

  setMessage("正在组合热卖和冷门商品...");

  try {
    const pickCount = Math.min(getPosterAutoPickCount(), candidates.length);
    const hotCount = Math.ceil(pickCount / 2);
    const budgetCount = Math.floor(pickCount / 2);
    const stats = await fetchRecentConfirmedProductStats();
    const hotRanked = rankPosterCandidates(candidates, stats, "hot");
    const budgetRanked = rankPosterCandidates(candidates, stats, "budget");
    const picked = [];
    const used = new Set();

    hotRanked.forEach((product) => {
      if (picked.length >= hotCount) return;
      if (used.has(Number(product.id))) return;
      used.add(Number(product.id));
      picked.push(product);
    });

    budgetRanked.forEach((product) => {
      if (picked.length >= hotCount + budgetCount) return;
      if (used.has(Number(product.id))) return;
      used.add(Number(product.id));
      picked.push(product);
    });

    const fallbackRanked = hotRanked.concat(budgetRanked);
    fallbackRanked.forEach((product) => {
      if (picked.length >= pickCount) return;
      if (used.has(Number(product.id))) return;
      used.add(Number(product.id));
      picked.push(product);
    });

    applyPosterSelection(picked);
    setMessage(
      `已自动选中 ${picked.length} 件商品，按半热卖半冷门混合推荐。`,
      "success"
    );
  } catch (error) {
    setMessage(`混合选品失败：${pickErrorMessage(error, "请稍后再试")}`, "error");
  }
}

function createRoundedRectPath(ctx, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function fillRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundedRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function clipRoundedRect(ctx, x, y, width, height, radius) {
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.clip();
}

function fitTextToWidth(ctx, text, maxWidth) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let output = raw;
  while (output.length > 1 && ctx.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
}

function drawTextLine(ctx, text, x, y, maxWidth) {
  ctx.fillText(fitTextToWidth(ctx, text, maxWidth), x, y);
}

function measurePillWidth(ctx, text, horizontalPadding, minWidth, maxWidth) {
  const safeMaxWidth = Number.isFinite(maxWidth) ? Math.max(minWidth, maxWidth) : maxWidth;
  const fittedText = fitTextToWidth(ctx, text, safeMaxWidth - horizontalPadding * 2);
  const measuredWidth = Math.ceil(ctx.measureText(fittedText).width + horizontalPadding * 2);
  if (!Number.isFinite(safeMaxWidth)) return Math.max(minWidth, measuredWidth);
  return Math.max(minWidth, Math.min(safeMaxWidth, measuredWidth));
}

function drawShadowCard(ctx, x, y, width, height, radius, fillStyle, shadow = {}) {
  ctx.save();
  ctx.shadowColor = shadow.color || "rgba(84, 55, 28, 0.12)";
  ctx.shadowBlur = shadow.blur ?? 22;
  ctx.shadowOffsetX = shadow.offsetX ?? 0;
  ctx.shadowOffsetY = shadow.offsetY ?? 8;
  fillRoundedRect(ctx, x, y, width, height, radius, fillStyle);
  ctx.restore();
}

function setPosterFont(ctx, weight, size) {
  ctx.font = `${weight} ${size}px 'IBM Plex Sans', 'Segoe UI', sans-serif`;
}

function drawFittedText(ctx, text, x, y, maxWidth, options = {}) {
  const {
    weight = 700,
    size = 32,
    minSize = 18,
  } = options;
  let currentSize = size;
  while (currentSize > minSize) {
    setPosterFont(ctx, weight, currentSize);
    if (ctx.measureText(String(text || "").trim()).width <= maxWidth) break;
    currentSize -= 1;
  }
  drawTextLine(ctx, text, x, y, maxWidth);
  return currentSize;
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const sourceWidth = Number(image?.naturalWidth || image?.width || 0);
  const sourceHeight = Number(image?.naturalHeight || image?.height || 0);
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawPosterSoldOverlay(ctx, x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const overlayWidth = Math.min(width - 24, 224);
  const overlayHeight = 72;

  ctx.save();
  clipRoundedRect(ctx, x, y, width, height, 22);
  ctx.fillStyle = "rgba(20, 12, 10, 0.18)";
  ctx.fillRect(x, y, width, height);
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.16);
  drawShadowCard(
    ctx,
    -overlayWidth / 2,
    -overlayHeight / 2,
    overlayWidth,
    overlayHeight,
    24,
    "rgba(168, 44, 36, 0.92)",
    {
      color: "rgba(102, 20, 18, 0.3)",
      blur: 18,
      offsetY: 8,
    }
  );
  strokeRoundedRect(
    ctx,
    -overlayWidth / 2,
    -overlayHeight / 2,
    overlayWidth,
    overlayHeight,
    24,
    "rgba(255, 236, 228, 0.68)",
    2
  );
  ctx.fillStyle = "#fff8f0";
  drawFittedText(ctx, "已售出", -overlayWidth / 2 + 18, 13, overlayWidth - 36, {
    weight: 800,
    size: 38,
    minSize: 28,
  });
  ctx.restore();
}

function loadPosterImage(src) {
  const url = String(src || "").trim();
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function exportSelectedProductsPoster() {
  const products = getPosterExportProducts();
  if (!products.length) {
    setMessage("请先勾选想导出的特色商品，或先筛出一批商品。", "error");
    return;
  }

  if (exportProductPosterBtn) exportProductPosterBtn.disabled = true;
  setMessage("正在生成报价图，请稍候...");

  try {
    const title = String(exportPosterTitleInput?.value || "").trim() || "繁星功法商城 精选报价";
    const subtitle =
      String(exportPosterSubtitleInput?.value || "").trim() ||
      "热门好卡一图看清 | 残卷在上 RMB 在下";
    const footnote =
      String(exportPosterFootnoteInput?.value || "").trim() ||
      "更多商品都在繁星功法商城中，购买请进商城下单";

    const images = await Promise.all(products.map((product) => loadPosterImage(product.image_url)));
    const columns =
      products.length >= 36 ? 5 : products.length >= 16 ? 4 : products.length >= 7 ? 3 : 2;
    const canvasWidth = columns >= 5 ? 1600 : columns === 4 ? 1440 : columns === 3 ? 1280 : 1080;
    const outerPadding = 38;
    const gap = 20;
    const headerHeight = 266;
    const footerHeight = 116;
    const cardWidth = Math.floor(
      (canvasWidth - outerPadding * 2 - gap * (columns - 1)) / columns
    );
    const imageHeight = Math.round(cardWidth * 1.03);
    const contentHeight = 132;
    const priceHeight = 108;
    const cardHeight = imageHeight + contentHeight + priceHeight + 28;
    const rows = Math.ceil(products.length / columns);
    const canvasHeight =
      headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gap + footerHeight;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器不支持 canvas");

    const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    bgGradient.addColorStop(0, "#fff7ef");
    bgGradient.addColorStop(0.5, "#f7ebdc");
    bgGradient.addColorStop(1, "#efe3d1");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = "rgba(134, 105, 79, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvasWidth; x += 72) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(196, 85, 45, 0.08)";
    ctx.beginPath();
    ctx.arc(canvasWidth - 140, 88, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(114, canvasHeight - 96, 132, 0, Math.PI * 2);
    ctx.fill();

    const headerPanelX = outerPadding;
    const headerPanelY = 26;
    const headerPanelWidth = canvasWidth - outerPadding * 2;
    const headerPanelHeight = 194;
    drawShadowCard(ctx, headerPanelX, headerPanelY, headerPanelWidth, headerPanelHeight, 32, "rgba(255, 251, 246, 0.9)");
    strokeRoundedRect(ctx, headerPanelX, headerPanelY, headerPanelWidth, headerPanelHeight, 32, "rgba(125, 93, 67, 0.14)");

    const brandIconX = headerPanelX + 26;
    const brandIconY = headerPanelY + 24;
    const brandIconSize = 48;
    const brandIconGradient = ctx.createLinearGradient(
      brandIconX,
      brandIconY,
      brandIconX + brandIconSize,
      brandIconY + brandIconSize
    );
    brandIconGradient.addColorStop(0, "#1f3235");
    brandIconGradient.addColorStop(1, "#2f666d");
    drawShadowCard(ctx, brandIconX, brandIconY, brandIconSize, brandIconSize, 18, brandIconGradient, {
      color: "rgba(22, 45, 48, 0.18)",
      blur: 18,
      offsetY: 6,
    });
    ctx.strokeStyle = "rgba(255, 240, 229, 0.18)";
    ctx.lineWidth = 1;
    createRoundedRectPath(ctx, brandIconX + 3, brandIconY + 3, brandIconSize - 6, brandIconSize - 6, 15);
    ctx.stroke();
    ctx.fillStyle = "#fff3e6";
    ctx.beginPath();
    ctx.moveTo(brandIconX + 24, brandIconY + 11);
    ctx.lineTo(brandIconX + 29, brandIconY + 21);
    ctx.lineTo(brandIconX + 39, brandIconY + 24);
    ctx.lineTo(brandIconX + 29, brandIconY + 27);
    ctx.lineTo(brandIconX + 24, brandIconY + 37);
    ctx.lineTo(brandIconX + 19, brandIconY + 27);
    ctx.lineTo(brandIconX + 9, brandIconY + 24);
    ctx.lineTo(brandIconX + 19, brandIconY + 21);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd6b8";
    ctx.beginPath();
    ctx.arc(brandIconX + 33, brandIconY + 15, 4, 0, Math.PI * 2);
    ctx.fill();

    const promoWidth = 316;
    const promoHeight = 126;
    const promoX = headerPanelX + headerPanelWidth - promoWidth - 24;
    const promoY = headerPanelY + 26;
    const headerTextX = brandIconX + brandIconSize + 16;
    const headerTextWidth = promoX - headerTextX - 24;
    ctx.fillStyle = "#1f1a16";
    drawFittedText(ctx, title, headerTextX, headerPanelY + 104, headerTextWidth, {
      weight: 700,
      size: 58,
      minSize: 42,
    });
    ctx.fillStyle = "#6b5d51";
    drawFittedText(ctx, subtitle, headerTextX, headerPanelY + 144, headerTextWidth, {
      weight: 500,
      size: 25,
      minSize: 20,
    });
    setPosterFont(ctx, 600, 20);
    drawTextLine(
      ctx,
      `导出 ${products.length} 件${selectedProductIds.size > 0 ? "已选商品" : "当前筛选商品"} | ${new Date().toLocaleString("zh-CN")}`,
      headerTextX,
      headerPanelY + 176,
      headerTextWidth
    );
    const promoGradient = ctx.createLinearGradient(promoX, promoY, promoX + promoWidth, promoY + promoHeight);
    promoGradient.addColorStop(0, "#1f3235");
    promoGradient.addColorStop(1, "#2f666d");
    drawShadowCard(ctx, promoX, promoY, promoWidth, promoHeight, 28, promoGradient, {
      color: "rgba(22, 45, 48, 0.22)",
      blur: 28,
      offsetY: 10,
    });
    fillRoundedRect(ctx, promoX + 18, promoY + 18, 108, 30, 15, "rgba(255, 255, 255, 0.12)");
    ctx.fillStyle = "#fff8ef";
    ctx.font = "700 17px 'IBM Plex Sans', 'Segoe UI', sans-serif";
    ctx.fillText("购买请进商城下单", promoX + 28, promoY + 39);
    ctx.fillStyle = "#fff8ef";
    drawFittedText(ctx, POSTER_WEBSITE, promoX + 24, promoY + 82, promoWidth - 48, {
      weight: 700,
      size: 30,
      minSize: 22,
    });
    ctx.fillStyle = "rgba(255, 240, 229, 0.88)";
    setPosterFont(ctx, 600, 18);
    ctx.fillText("支持转账锁卡 / 残卷下单", promoX + 24, promoY + 110);

    for (const [index, product] of products.entries()) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const cardX = outerPadding + column * (cardWidth + gap);
      const cardY = headerHeight + row * (cardHeight + gap);
      const image = images[index];
      const tierLabel = getAdminProductTierLabelByKey(getAdminProductTierKey(product));
      const seasonLabel = getPosterSeasonLabel(product);
      const attackLabel = formatPosterCompactNumber(product.attack_value || 0);
      const hpLabel = formatPosterCompactNumber(product.hp_value || 0);
      const priceQuota = Number(product.effective_price_quota || product.price_quota || 0);
      const cashLabel = formatPosterCashAmount(getPosterCashAmount(priceQuota));
      const termLabel = getPosterTermLabel(product);
      const soldOut = isPosterSoldProduct(product);

      drawShadowCard(ctx, cardX, cardY, cardWidth, cardHeight, 28, "rgba(255, 255, 255, 0.92)");
      strokeRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 28, "rgba(125, 93, 67, 0.14)");

      const imageX = cardX + 14;
      const imageY = cardY + 14;
      const imageWidth = cardWidth - 28;
      fillRoundedRect(ctx, imageX, imageY, imageWidth, imageHeight, 22, "#f2e3cd");

      if (image) {
        ctx.save();
        clipRoundedRect(ctx, imageX, imageY, imageWidth, imageHeight, 22);
        drawCoverImage(ctx, image, imageX, imageY, imageWidth, imageHeight);
        ctx.restore();
      } else {
        const placeholderGradient = ctx.createLinearGradient(
          imageX,
          imageY,
          imageX + imageWidth,
          imageY + imageHeight
        );
        placeholderGradient.addColorStop(0, "#d8b178");
        placeholderGradient.addColorStop(1, "#596c6c");
        fillRoundedRect(ctx, imageX, imageY, imageWidth, imageHeight, 22, placeholderGradient);
        ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
        ctx.font = "700 54px 'IBM Plex Sans', 'Segoe UI', sans-serif";
        ctx.fillText(String(product.name || "?").slice(0, 1), imageX + 22, imageY + 72);
      }

      if (soldOut) {
        drawPosterSoldOverlay(ctx, imageX, imageY, imageWidth, imageHeight);
      }

      const topInset = 12;
      const topGap = 8;
      const topPillY = imageY + topInset;
      const hasDiscount = Number(product.discount_rate || 100) < 100;
      const discountPillWidth = hasDiscount ? 106 : 0;

      ctx.font = "700 20px 'IBM Plex Sans', 'Segoe UI', sans-serif";
      const tierPillWidth = measurePillWidth(ctx, tierLabel, 18, 92);
      const tierPillX = imageX + topInset;

      ctx.font = "700 18px 'IBM Plex Sans', 'Segoe UI', sans-serif";
      const seasonPillX = tierPillX + tierPillWidth + topGap;
      const seasonAvailableWidth =
        imageWidth - topInset * 2 - tierPillWidth - topGap - (hasDiscount ? discountPillWidth + topGap : 0);
      const seasonPillWidth = measurePillWidth(ctx, seasonLabel, 18, 112, seasonAvailableWidth);

      fillRoundedRect(ctx, tierPillX, topPillY, tierPillWidth, 36, 18, "rgba(31, 26, 22, 0.78)");
      fillRoundedRect(ctx, seasonPillX, topPillY, seasonPillWidth, 36, 18, "rgba(255, 247, 239, 0.88)");
      ctx.fillStyle = "#fff";
      ctx.font = "700 20px 'IBM Plex Sans', 'Segoe UI', sans-serif";
      ctx.fillText(tierLabel, tierPillX + 16, imageY + 36);
      ctx.fillStyle = "#224e52";
      ctx.font = "700 18px 'IBM Plex Sans', 'Segoe UI', sans-serif";
      drawTextLine(ctx, seasonLabel, seasonPillX + 16, imageY + 35, seasonPillWidth - 32);

      if (hasDiscount) {
        fillRoundedRect(
          ctx,
          imageX + imageWidth - 118,
          imageY + 12,
          106,
          36,
          18,
          "rgba(196, 85, 45, 0.88)"
        );
        ctx.fillStyle = "#fff";
        ctx.font = "700 18px 'IBM Plex Sans', 'Segoe UI', sans-serif";
        ctx.fillText(getDiscountLabel(product.discount_rate), imageX + imageWidth - 92, imageY + 36);
      }

      const contentX = cardX + 18;
      const contentY = imageY + imageHeight + 32;
      ctx.fillStyle = "#1f1a16";
      drawFittedText(ctx, product.name || "-", contentX, contentY, cardWidth - 36, {
        weight: 700,
        size: 32,
        minSize: 24,
      });
      ctx.fillStyle = "#6b5d51";
      setPosterFont(ctx, 600, 21);
      drawTextLine(
        ctx,
        `攻击 ${attackLabel} | 血量 ${hpLabel}`,
        contentX,
        contentY + 38,
        cardWidth - 36
      );
      fillRoundedRect(ctx, contentX, contentY + 48, Math.min(cardWidth - 36, 180), 34, 17, "rgba(239, 232, 221, 0.92)");
      ctx.fillStyle = "#5f5549";
      setPosterFont(ctx, 600, 18);
      drawTextLine(ctx, termLabel, contentX + 14, contentY + 71, cardWidth - 66);

      const priceBoxY = cardY + cardHeight - priceHeight - 14;
      fillRoundedRect(ctx, cardX + 14, priceBoxY, cardWidth - 28, priceHeight, 24, "#204246");
      fillRoundedRect(ctx, cardX + 18, priceBoxY + 52, cardWidth - 36, 42, 18, "rgba(255, 255, 255, 0.08)");

      ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
      setPosterFont(ctx, 700, 16);
      ctx.fillText("残卷价", cardX + 28, priceBoxY + 26);
      ctx.fillText("RMB", cardX + 28, priceBoxY + 80);
      ctx.fillStyle = "#fff8ef";
      drawFittedText(
        ctx,
        `${formatPosterCompactNumber(priceQuota)} 残卷`,
        cardX + 102,
        priceBoxY + 34,
        cardWidth - 144,
        {
          weight: 700,
          size: 34,
          minSize: 24,
        }
      );
      ctx.fillStyle = "#ffd1b8";
      drawFittedText(ctx, cashLabel, cardX + 102, priceBoxY + 83, cardWidth - 144, {
        weight: 700,
        size: 32,
        minSize: 24,
      });
    }

    const footerBarY = canvasHeight - 84;
    const footerBarHeight = 52;
    drawShadowCard(ctx, outerPadding, footerBarY, canvasWidth - outerPadding * 2, footerBarHeight, 26, "rgba(255, 250, 244, 0.92)", {
      color: "rgba(84, 55, 28, 0.08)",
      blur: 20,
      offsetY: 6,
    });
    strokeRoundedRect(ctx, outerPadding, footerBarY, canvasWidth - outerPadding * 2, footerBarHeight, 26, "rgba(125, 93, 67, 0.12)");
    ctx.fillStyle = "#6b5d51";
    setPosterFont(ctx, 500, 20);
    drawTextLine(ctx, footnote, outerPadding + 24, footerBarY + 33, canvasWidth - outerPadding * 2 - 400);
    const footerWebsiteText = `商城网址：${POSTER_WEBSITE}`;
    setPosterFont(ctx, 700, 20);
    const websiteBadgeWidth = Math.max(314, Math.ceil(ctx.measureText(footerWebsiteText).width + 44));
    const websiteBadgeX = canvasWidth - outerPadding - websiteBadgeWidth - 12;
    fillRoundedRect(ctx, websiteBadgeX, footerBarY + 8, websiteBadgeWidth, 36, 18, "#1f3235");
    ctx.fillStyle = "#fff6eb";
    drawFittedText(ctx, footerWebsiteText, websiteBadgeX + 20, footerBarY + 32, websiteBadgeWidth - 40, {
      weight: 700,
      size: 20,
      minSize: 16,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `gongfa-poster-${Date.now()}.png`;
    link.click();
    const selectedCount = allProducts.filter((product) => selectedProductIds.has(Number(product.id))).length;
    const suffix =
      selectedCount > POSTER_EXPORT_LIMIT
        ? `，已按上限导出前 ${POSTER_EXPORT_LIMIT} 件`
        : "";
    setMessage(`报价图已导出，共 ${products.length} 件商品${suffix}。`, "success");
  } catch (error) {
    setMessage(`报价图导出失败：${pickErrorMessage(error, "请稍后再试")}`, "error");
  } finally {
    if (exportProductPosterBtn) exportProductPosterBtn.disabled = false;
  }
}

function getFilteredUsers() {
  const keyword = String(adminUserKeywordInput.value || "").trim().toLowerCase();
  if (!keyword) return allUsers;

  return allUsers.filter((user) =>
    [
      user.game_role_name,
      user.game_role_id,
      user.game_server,
      user.role,
      user.status,
      user.nickname,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(keyword))
  );
}

function renderProducts(products) {
  const pagedProducts = sliceLocalPage(products, "products");
  const canWrite = hasAdminWriteAccess();

  if (!products.length) {
    productsRoot.innerHTML =
      activeAdminProductCategory === "bundle"
        ? '<div class="stack-item">套餐请在下方“套餐 SKU”模块里管理，这里只展示单卡商品。</div>'
        : '<div class="stack-item">当前筛选条件下没有商品。</div>';
    renderPagination(productsPaginationRoot, "products", paginationState.products);
    syncProductSummary(products);
    return;
  }

  productsRoot.innerHTML = pagedProducts
    .map((product) => {
      const pricingMeta = getPricingMeta(product);
      const pricingLabel = pricingMeta.source === "manual" ? "手动价" : "自动价";
      const dominantLabel = pricingMeta.dominant_reason_label || "-";
      const marketFactor = Number(pricingMeta?.market?.factor || 1).toFixed(2);
      const floorPrice = Number(pricingMeta.floor_price || 0);
      const autoPrice = Number(pricingMeta.auto_price || product.price_quota || 0);
      const manualPrice =
        product.manual_price_quota === null || product.manual_price_quota === undefined
          ? "-"
          : Number(product.manual_price_quota);
      const discountRate = normalizeDiscountRate(product.discount_rate);
      const effectivePrice = Number(product.effective_price_quota || product.price_quota || 0);
      const basePrice = Number(product.price_quota || 0);

      return `
        <div class="admin-card" data-product-id="${product.id}">
          <div class="admin-card-head">
            <label class="checkbox-line">
              <input class="product-select" type="checkbox" data-product-id="${product.id}" ${
                selectedProductIds.has(product.id) ? "checked" : ""
              } />
              <span>选中</span>
            </label>
            <span class="chip">${escapeHtml(product.status)}</span>
          </div>
                    <div class="admin-product-layout">
            ${renderAdminProductCover(product)}
            <div class="admin-product-main">
              <div class="product-name">${escapeHtml(product.name)}</div>
              <div class="product-meta">
                <div>UID / Legacy: ${escapeHtml(product.uid || "-")} / ${escapeHtml(product.legacy_id || "-")}</div>
                <div>Source: ${escapeHtml(product.source_file_name || "-")}</div>
                <div>Stats: ATK ${Number(product.attack_value || 0)} / HP ${Number(product.hp_value || 0)}</div>
                <div>Terms: ${escapeHtml(product.ext_attrs || "none")}</div>
                <div>Stock: ${Number(product.stock || 0)} / Base price: ${basePrice}</div>
                <div>Discount: ${escapeHtml(getDiscountLabel(discountRate))} / Final: ${effectivePrice}</div>
                <div>Auction: ${product.auction_id ? `#${Number(product.auction_id)} / ${escapeHtml(product.auction_status || "-")} / ${escapeHtml(formatDate(product.auction_ends_at || ""))}` : "none"}</div>
                <div>Pricing: ${pricingLabel} / Reason: ${escapeHtml(dominantLabel)}</div>
                <div>Floor: ${floorPrice} / Auto: ${autoPrice} / Manual: ${manualPrice}</div>
                <div>Market factor: ${marketFactor}</div>
              </div>
              ${renderPricingSummary(product, pricingMeta)}
            </div>
          </div>
          ${
            canWrite
              ? `
                  <div class="inline-form">
                    <input data-field="name" value="${escapeHtml(product.name)}" />
                    <input data-field="price_quota" type="number" value="${Number(product.price_quota || 0)}" />
                    <input data-field="discount_rate" type="number" min="1" max="100" value="${discountRate}" placeholder="折扣率" />
                    <input data-field="stock" type="number" value="${Number(product.stock || 0)}" />
                    <select data-field="status">
                      ${["draft", "on_sale", "off_sale", "sold"]
                        .map(
                          (status) =>
                            `<option value="${status}" ${product.status === status ? "selected" : ""}>${status}</option>`
                        )
                        .join("")}
                    </select>
                  </div>
                  <div class="inline-form">
                    <input data-field="external-buyer-label" type="text" placeholder="外部交易对象，例如微信直卖 / 熟人代拍" />
                    <input data-field="external-order-remark" type="text" placeholder="外部成交备注，可选" />
                    <button class="danger create-external-order-btn" type="button">记外部成交</button>
                  </div>
                  <div class="actions">
                    <button class="ghost view-product-detail-btn" type="button">查看详情</button>
                    <button class="primary save-product-btn" type="button">保存商品</button>
                    <button class="ghost save-status-btn" type="button">仅更新状态</button>
                    <button class="ghost clear-manual-price-btn" type="button">恢复自动价</button>
                  </div>
                `
              : `
                  <div class="actions">
                    <button class="ghost view-product-detail-btn" type="button">查看详情</button>
                  </div>
                `
          }
        </div>
      `;
    })
    .join("");

  renderPagination(productsPaginationRoot, "products", paginationState.products);
  syncProductSummary(products);
}

function renderUsers(users) {
  const pagedUsers = sliceLocalPage(users, "users");
  const canWrite = hasAdminWriteAccess();

  if (!users.length) {
    usersRoot.innerHTML = '<div class="stack-item">没有匹配到用户。</div>';
    renderPagination(usersPaginationRoot, "users", paginationState.users);
    return;
  }

  usersRoot.innerHTML = pagedUsers
    .map(
      (user) => `
        <div class="admin-card" data-user-id="${user.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(user.game_role_name || "-")}</div>
            <span class="chip">${escapeHtml(user.role || "-")}</span>
          </div>
          <div class="product-meta">
            <div>${escapeHtml(user.game_server || "-")} / ${escapeHtml(user.game_role_id || "-")}</div>
            <div>当前额度：${Number(user.quota_balance || 0)}</div>
            <div>账号状态：${escapeHtml(user.status || "-")}</div>
            <div>昵称：${escapeHtml(user.nickname || "-")}</div>
          </div>
          ${
            canWrite
              ? `
                  <div class="inline-form">
                    <input data-field="change_amount" type="number" placeholder="额度增减，可填负数" />
                    <input data-field="remark" type="text" placeholder="备注" />
                  </div>
                  <div class="actions tight">
                    <button class="ghost quick-quota-btn" type="button" data-amount="1000">+1000</button>
                    <button class="ghost quick-quota-btn" type="button" data-amount="5000">+5000</button>
                    <button class="ghost quick-quota-btn" type="button" data-amount="10000">+10000</button>
                    <button class="ghost view-user-orders-btn" type="button">查看订单</button>
                  </div>
                  <div class="actions">
                    <button class="primary save-quota-btn" type="button">调整额度</button>
                    <button class="ghost toggle-status-btn" type="button">${
                      user.status === "active" ? "禁用" : "启用"
                    }</button>
                  </div>
                `
              : `
                  <div class="actions">
                    <button class="ghost view-user-orders-btn" type="button">查看订单</button>
                  </div>
                `
          }
        </div>
      `
    )
    .join("");

  renderPagination(usersPaginationRoot, "users", paginationState.users);
}

function renderBundles(bundles) {
  const pagedBundles = sliceLocalPage(bundles, "bundles");
  const canWrite = hasAdminWriteAccess();

  if (!bundles.length) {
    bundlesRoot.innerHTML = '<div class="stack-item">暂无套餐 SKU。</div>';
    renderPagination(bundlesPaginationRoot, "bundles", paginationState.bundles);
    return;
  }

  bundlesRoot.innerHTML = pagedBundles
    .map(
      (bundle) => `
        <div class="admin-card" data-bundle-id="${bundle.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(bundle.name)}</div>
            <span class="chip">${escapeHtml(bundle.status)}</span>
          </div>
          <div class="product-meta">
            <div>编码：${escapeHtml(bundle.code)}</div>
            <div>说明：${escapeHtml(bundle.description || "-")}</div>
            <div>标签：${escapeHtml((bundle.tags || []).join(" / ") || "-")}</div>
            <div>价格：${Number(bundle.price_quota || 0)} / 库存：${
              bundle.stock === null || bundle.stock === undefined ? "不限" : Number(bundle.stock)
            }</div>
            <div>显示顺序：${Number(bundle.display_rank || 999)}</div>
          </div>
          ${
            canWrite
              ? `
                  <div class="inline-form">
                    <input data-field="name" value="${escapeHtml(bundle.name)}" />
                    <input data-field="description" value="${escapeHtml(bundle.description || "")}" />
                    <input
                      data-field="tags"
                      value="${escapeHtml((bundle.tags || []).join(", "))}"
                      placeholder="标签，逗号分隔"
                    />
                    <input data-field="price_quota" type="number" value="${Number(bundle.price_quota || 0)}" />
                    <input
                      data-field="stock"
                      type="text"
                      value="${bundle.stock === null || bundle.stock === undefined ? "" : Number(bundle.stock)}"
                      placeholder="留空表示不限量"
                    />
                    <input
                      data-field="display_rank"
                      type="number"
                      value="${Number(bundle.display_rank || 999)}"
                      placeholder="排序"
                    />
                    <select data-field="status">
                      ${["on_sale", "off_sale", "sold"]
                        .map(
                          (status) =>
                            `<option value="${status}" ${bundle.status === status ? "selected" : ""}>${status}</option>`
                        )
                        .join("")}
                    </select>
                  </div>
                  <div class="actions">
                    <button class="primary save-bundle-btn" type="button">保存套餐</button>
                    <button class="ghost save-bundle-status-btn" type="button">仅更新状态</button>
                  </div>
                `
              : ""
          }
        </div>
      `
    )
    .join("");

  renderPagination(bundlesPaginationRoot, "bundles", paginationState.bundles);
}

function formatRechargeReviewStatusLabel(status) {
  switch (status) {
    case "pending_review":
      return "待审核";
    case "approved":
      return "已通过";
    case "rejected":
      return "已驳回";
    default:
      return status || "-";
  }
}

function isResidualRechargeOrder(order) {
  return String(order?.order_type || "").trim() === "residual_transfer";
}

function formatRechargeOrderTitle(order) {
  if (order?.order_title) return order.order_title;
  if (isResidualRechargeOrder(order)) return "残卷转赠";
  if (order?.order_type === "season_member") return "赛季会员";
  return "普通充值";
}

function formatRechargeChannelLabel(channel) {
  if (String(channel || "").trim() === "wechat_qr") return "微信";
  if (String(channel || "").trim() === "game_residual_transfer") return "残卷转赠";
  return "支付宝";
}

function renderRechargeOrders(orders) {
  currentRechargeOrderList = orders;
  renderOverview();
  const canWrite = hasAdminWriteAccess();

  if (!adminRechargeOrdersRoot) return;
  if (!orders.length) {
    adminRechargeOrdersRoot.innerHTML = '<div class="stack-item">当前没有符合条件的充值订单。</div>';
    return;
  }

  adminRechargeOrdersRoot.innerHTML = orders
    .map((order) => {
      const amountLine = isResidualRechargeOrder(order)
        ? `转赠数量：${Number(order.transfer_amount || order.amount_yuan || 0)} ${escapeHtml(order.transfer_unit || "残卷")} / 预计额度：${Number(order.quota_amount || 0)}`
        : `充值金额：${Number(order.amount_yuan || 0)} 元 / 预计额度：${Number(order.quota_amount || 0)} / 支付方式：${formatRechargeChannelLabel(order.channel)}`;
      const referenceLabel = isResidualRechargeOrder(order) ? "转赠时间" : "付款时间";
      const statusHint =
        order.status === "pending_review"
          ? `<div class="muted">${isResidualRechargeOrder(order) ? "审核通过后会自动给用户增加额度，请先核对游戏内转赠记录和凭据。" : "审核通过后会自动给用户增加额度，请先核对付款备注和金额。"}</div>`
          : "";
      return `
        <div class="admin-card" data-recharge-order-id="${order.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(formatRechargeOrderTitle(order))} #${order.id}</div>
            <span class="chip">${escapeHtml(formatRechargeReviewStatusLabel(order.status))}</span>
          </div>
          <div class="product-meta">
            <div>用户：${escapeHtml(order.game_role_name || "-")} / ${escapeHtml(order.game_server || "-")} / ${escapeHtml(order.game_role_id || "-")}</div>
            <div>${amountLine}</div>
            <div>${referenceLabel}：${escapeHtml(order.payment_reference || "-")}</div>
            ${isResidualRechargeOrder(order) ? `<div>转赠目标：${escapeHtml(order.transfer_target_role_name || "admin残卷")} / ${escapeHtml(order.transfer_target_role_id || "-")}</div>` : ""}
            <div>提交时间：${formatDate(order.created_at)}</div>
          </div>
          ${order.payer_note ? `<div class="muted">用户备注：${escapeHtml(order.payer_note)}</div>` : ""}
          ${order.admin_remark ? `<div class="muted">管理员备注：${escapeHtml(order.admin_remark)}</div>` : ""}
          ${
            canWrite
              ? `
                  <div class="inline-form order-toolbar">
                    <input
                      data-field="admin_remark"
                      type="text"
                      value="${escapeHtml(order.admin_remark || "")}"
                      placeholder="填写审核备注，例如已核对付款截图"
                    />
                  </div>
                `
              : ""
          }
          ${statusHint}
          ${
            canWrite
              ? `
                  <div class="actions">
                    ${order.status === "pending_review" ? `
                      <button class="primary approve-recharge-order-btn" type="button">审核通过并加额度</button>
                      <button class="danger reject-recharge-order-btn" type="button">驳回申请</button>
                    ` : '<button class="ghost" type="button" disabled>已处理</button>'}
                  </div>
                `
              : ""
          }
        </div>
      `;
    })
    .join("");
}

function renderAudits(logs) {
  if (!logs.length) {
    auditsRoot.innerHTML = '<div class="stack-item">暂无审计日志。</div>';
    return;
  }

  auditsRoot.innerHTML = logs
    .map(
      (log) => `
        <div class="stack-item">
          <div>${escapeHtml(log.action)} / ${escapeHtml(log.target_type)} #${log.target_id}</div>
          <div class="muted">${escapeHtml(log.actor_role_name || "-")} / ${formatDate(log.created_at)}</div>
        </div>
      `
    )
    .join("");
}

async function loadQuotaLogs(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.quotaLogs.page || 1), 1);
  const query = new URLSearchParams();
  const keyword =
    options.keyword !== undefined ? options.keyword : adminQuotaLogKeywordInput?.value?.trim();
  const type =
    options.type !== undefined ? options.type : adminQuotaLogTypeFilter?.value || "all";
  const userId =
    options.userId !== undefined
      ? options.userId
      : linkedOrderUser?.id || null;

  if (keyword) query.set("keyword", keyword);
  if (type && type !== "all") query.set("type", type);
  if (userId) query.set("user_id", userId);
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.quotaLogs.pageSize));

  const response = normalizePaginatedResponse(await apiFetch(`/admin/quota-logs?${query.toString()}`));
  paginationState.quotaLogs = {
    ...paginationState.quotaLogs,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  renderQuotaLogs(response.items);
  renderPagination(quotaLogsPaginationRoot, "quotaLogs", paginationState.quotaLogs);
}

async function loadAudits(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.audits.page || 1), 1);
  const query = new URLSearchParams();
  const keyword =
    options.keyword !== undefined ? options.keyword : adminAuditKeywordInput?.value?.trim();
  const action =
    options.action !== undefined ? options.action : adminAuditActionInput?.value?.trim();

  if (keyword) query.set("keyword", keyword);
  if (action) query.set("action", action);
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.audits.pageSize));

  const response = normalizePaginatedResponse(await apiFetch(`/admin/audit-logs?${query.toString()}`));
  paginationState.audits = {
    ...paginationState.audits,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  renderAudits(response.items);
  renderPagination(auditsPaginationRoot, "audits", paginationState.audits);
}

function formatQuotaLogType(type) {
  switch (type) {
    case "admin_add":
      return "管理员加额度";
    case "admin_subtract":
      return "管理员扣额度";
    case "order_deduct":
      return "下单扣减";
    case "order_refund":
      return "订单退款";
    case "recharge_credit":
      return "充值到账";
    case "residual_transfer_credit":
      return "残卷到账";
    case "draw_service_rebate":
      return "代抽返利";
    case "beginner_guide_reward":
      return "新手教学奖励";
    default:
      return type || "-";
  }
}

function renderQuotaLogs(logs) {
  if (!logs.length) {
    quotaLogsRoot.innerHTML = '<div class="stack-item">暂无额度流水。</div>';
    return;
  }

  quotaLogsRoot.innerHTML = logs
    .map((log) => {
      const amount = Number(log.change_amount || 0);
      const prefix = amount > 0 ? "+" : "";
      return `
        <div class="stack-item">
          <div>${escapeHtml(log.game_role_name || "-")} / ${escapeHtml(log.game_role_id || "-")}</div>
          <div class="muted">${escapeHtml(formatQuotaLogType(log.type))} / ${prefix}${amount} / ${formatDate(
            log.created_at
          )}</div>
          <div class="muted">订单：${escapeHtml(log.order_id || "-")} / 备注：${escapeHtml(log.remark || "-")}</div>
        </div>
      `;
    })
    .join("");
}

function renderOrders(orders) {
  currentOrderList = Array.isArray(orders) ? orders : [];
  renderOverview();
  const canWrite = hasAdminWriteAccess();

  if (!ordersRoot) return;
  if (!currentOrderList.length) {
    ordersRoot.innerHTML = '<div class="stack-item">当前没有符合条件的订单。</div>';
    return;
  }

  ordersRoot.innerHTML = currentOrderList
    .map((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const drawMeta = getDrawServiceMeta(order);
      const itemLines = items.length
        ? items
            .map(
              (item) => `
                <div class="order-item-line">
                  <div><strong>${escapeHtml(item.product_name || item.bundle_name || "-")}</strong> / ${Number(item.price_quota || 0)} 额度</div>
                  ${
                    formatOrderItemSnapshot(item).length
                      ? `<div class="muted">${formatOrderItemSnapshot(item)
                          .map((line) => escapeHtml(line))
                          .join(" / ")}</div>`
                      : ""
                  }
                </div>
              `
            )
            .join("")
        : '<div class="order-item-line">没有订单明细</div>';

      const drawFields =
        isDrawServiceOrder(order) && drawMeta
          ? `
              ${
                order.status === "pending" && canWrite
                  ? `
                      <div class="inline-form order-toolbar">
                        <textarea
                          data-field="draw-returned-cards"
                          rows="3"
                          placeholder="确认代抽时填写返还了哪些卡"
                        >${escapeHtml(drawMeta.returned_cards_text || "")}</textarea>
                        <input
                          data-field="draw-best-gold"
                          type="text"
                          value="${escapeHtml(drawMeta.best_gold_card || "")}"
                          placeholder="如果触发 5w 首档奖励，填写本次选中的最佳金卡"
                        />
                      </div>
                    `
                  : `
                      <div class="muted">返还卡：${escapeHtml(drawMeta.returned_cards_text || "-")}</div>
                      <div class="muted">图鉴金卡：${escapeHtml(drawMeta.best_gold_card || "-")}</div>
                    `
              }
              <div class="muted">规则：返还所有双满紫 / 橙 / 红 / 金卡、>=2.5 单词条、双词条、珍；视频如需查看请让用户去咨询群联系管理员。</div>
              ${
                drawMeta.reward_summary
                  ? `<div class="muted">已结算奖励：${escapeHtml(drawMeta.reward_summary)}</div>`
                  : ""
              }
            `
          : "";

      const actionButtons =
        order.order_source === "external"
          ? `
              <button class="ghost save-order-remark-btn" type="button">保存备注</button>
            `
          : isDrawServiceOrder(order) && order.status === "pending"
            ? `
                <button class="ghost save-order-remark-btn" type="button">保存备注</button>
                <button class="primary confirm-order-btn" type="button">确认代抽</button>
                <button class="danger cancel-order-btn" type="button">取消订单</button>
              `
          :
        order.status === "cancel_requested"
          ? `
              <button class="ghost save-order-remark-btn" type="button">保存备注</button>
              <button class="danger approve-cancel-order-btn" type="button">通过取消</button>
              <button class="primary reject-cancel-order-btn" type="button">驳回取消</button>
            `
          : order.status === "pending"
            ? `
                <button class="ghost save-order-remark-btn" type="button">保存备注</button>
                <button class="primary confirm-order-btn" type="button">确认订单</button>
                <button class="danger cancel-order-btn" type="button">取消订单</button>
              `
            : `
                <button class="ghost save-order-remark-btn" type="button">保存备注</button>
              `;

      return `
        <div class="admin-card" data-order-id="${order.id}">
          <div class="admin-card-head">
            <div class="product-name">订单 #${order.id}</div>
            <span class="chip">${escapeHtml(formatOrderStatusLabel(order.status))}</span>
          </div>
          <div class="product-meta">
            <div>用户：${escapeHtml(order.game_role_name || "-")} / ${escapeHtml(order.game_server || "-")} / ${escapeHtml(order.game_role_id || "-")}</div>
            <div>来源：${escapeHtml(getOrderSourceLabel(order))}${order.buyer_label ? ` / 对象：${escapeHtml(order.buyer_label)}` : ""}</div>
            <div>订单总额：${Number(order.total_quota || 0)} 额度</div>
            ${
              order.order_source === "guest_transfer"
                ? String(order.payment_channel || "") === "game_residual_transfer"
                  ? `<div>转赠数量：${Number(order.transfer_amount || 0)} ${escapeHtml(order.transfer_unit || "残卷")} / 目标：${escapeHtml(order.transfer_target_role_name || "admin残卷")} / ${escapeHtml(order.transfer_target_role_id || "-")} / 转赠时间：${escapeHtml(order.payment_reference || "-")}</div>`
                  : `<div>转账金额：${Number(order.payment_amount_yuan || 0)} 元 / 方式：${escapeHtml(formatRechargeChannelLabel(order.payment_channel || "alipay_qr"))} / 付款时间：${escapeHtml(order.payment_reference || "-")}</div>`
                : ""
            }
            <div>创建时间：${formatDate(order.created_at)}</div>
            ${
              isDrawServiceOrder(order) && drawMeta
                ? `<div>代抽赛季：${escapeHtml(drawMeta.season_label || "-")} / 返利：${Number(drawMeta.rebate_quota || 0)}</div>`
                : ""
            }
          </div>
          ${order.cancel_reason ? `<div class="muted">取消原因：${escapeHtml(order.cancel_reason)}</div>` : ""}
          <div class="order-item-list">${itemLines}</div>
          ${
            canWrite
              ? `
                  <div class="inline-form order-toolbar">
                    <input
                      data-field="remark"
                      type="text"
                      value="${escapeHtml(order.remark || "")}"
                      placeholder="填写后台备注或处理说明"
                    />
                  </div>
                `
              : `<div class="muted">后台备注：${escapeHtml(order.remark || "-")}</div>`
          }
          ${drawFields}
          ${canWrite ? `<div class="actions">${actionButtons}</div>` : ""}
        </div>
      `;
    })
    .join("");
}

async function loadOrders(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.orders.page || 1), 1);
  const query = new URLSearchParams();
  if (adminOrderStatusFilter.value && adminOrderStatusFilter.value !== "all") {
    query.set("status", adminOrderStatusFilter.value);
  }
  if (adminOrderKeywordInput.value.trim()) {
    query.set("keyword", adminOrderKeywordInput.value.trim());
  }
  if (linkedOrderUser?.id) {
    query.set("user_id", String(linkedOrderUser.id));
  }
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.orders.pageSize));

  const suffix = query.toString();
  const response = normalizePaginatedResponse(await apiFetch(`/admin/orders${suffix ? `?${suffix}` : ""}`));
  paginationState.orders = {
    ...paginationState.orders,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  renderOrders(response.items);
  renderPagination(ordersPaginationRoot, "orders", paginationState.orders);
  renderLinkedOrderUserState();
}

async function loadRechargeOrders(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.rechargeOrders.page || 1), 1);
  const query = new URLSearchParams();
  if (adminRechargeStatusFilter?.value && adminRechargeStatusFilter.value !== "all") {
    query.set("status", adminRechargeStatusFilter.value);
  }
  if (adminRechargeKeywordInput?.value.trim()) {
    query.set("keyword", adminRechargeKeywordInput.value.trim());
  }
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.rechargeOrders.pageSize));

  const suffix = query.toString();
  const response = normalizePaginatedResponse(
    await apiFetch(`/admin/recharge-orders${suffix ? `?${suffix}` : ""}`)
  );
  paginationState.rechargeOrders = {
    ...paginationState.rechargeOrders,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  renderRechargeOrders(response.items);
  renderPagination(
    rechargeOrdersPaginationRoot,
    "rechargeOrders",
    paginationState.rechargeOrders
  );
}

async function loadRechargeConfig() {
  const config = await apiFetch("/admin/recharge-config");
  renderRechargeConfig(config);
}

async function loadAuctions() {
  const status = adminAuctionStatusFilter?.value || "all";
  const query = new URLSearchParams();
  if (status && status !== "all") {
    query.set("status", status);
  }
  const suffix = query.toString();
  try {
    const auctions = await apiFetch(`/admin/auctions${suffix ? `?${suffix}` : ""}`);
    renderAuctions(Array.isArray(auctions) ? auctions : []);
  } catch (error) {
    if (pickErrorMessage(error) === "Not Found") {
      currentAuctionList = [];
      renderAuctions([]);
      return;
    }
    throw error;
  }
}

async function loadOverviewCounts() {
  try {
    const [pendingOrders, cancelOrders, rechargeReviewOrders] = await Promise.all([
      apiFetch("/admin/orders?status=pending&page=1&page_size=1"),
      apiFetch("/admin/orders?status=cancel_requested&page=1&page_size=1"),
      apiFetch("/admin/recharge-orders?status=pending_review&page=1&page_size=1"),
    ]);
    overviewCounts = {
      pendingOrderCount: Number(pendingOrders?.total || 0),
      cancelReviewCount: Number(cancelOrders?.total || 0),
      rechargeReviewCount: Number(rechargeReviewOrders?.total || 0),
    };
  } catch (error) {
    overviewCounts = {
      pendingOrderCount: currentOrderList.filter((order) => order.status === "pending").length,
      cancelReviewCount: currentOrderList.filter((order) => order.status === "cancel_requested").length,
      rechargeReviewCount: currentRechargeOrderList.filter((order) => order.status === "pending_review").length,
    };
  }
  renderOverview();
  renderAdminAlerts();
}

async function loadBaseAdminData() {
  const profile = await apiFetch("/auth/me");
  const access = renderSession(profile);
  if (!access.canRead) {
    clearAdminAlerts();
    setMessage("当前账号没有后台查看权限。", "error");
    adminOverview.innerHTML = "";
    return false;
  }

  const [products, bundles, users, rechargeConfig] = await Promise.all([
    apiFetch("/admin/products"),
    apiFetch("/admin/bundles"),
    apiFetch("/admin/users"),
    apiFetch("/admin/recharge-config"),
  ]);

  allProducts = products;
  allBundles = bundles;
  allUsers = users;
  currentRechargeConfig = rechargeConfig;

  syncAdminProductFilters();
  renderProducts(getFilteredProducts());
  await loadAuctions();
  renderBundles(allBundles);
  renderUsers(getFilteredUsers());
  renderRechargeConfig(rechargeConfig);
  await loadOverviewCounts();
  startAlertPolling();
  markPageLoaded("imports");
  markPageLoaded("catalog");
  markPageLoaded("users");
  if (isAdminReadOnlyMode(profile)) {
    setMessage("当前账号为只读海报权限，可查看后台信息并导出广告图。", "success");
  }
  return true;
}

async function loadAdminPage(page, { force = false } = {}) {
  if (!force && loadedAdminPages.has(page)) return;

  if (page === "recharge") {
    await loadRechargeOrders({ page: paginationState.rechargeOrders.page });
    markPageLoaded("recharge");
    return;
  }

  if (page === "orders") {
    await loadOrders({ page: paginationState.orders.page });
    markPageLoaded("orders");
    return;
  }

  if (page === "logs") {
    await Promise.all([
      loadQuotaLogs({ page: paginationState.quotaLogs.page }),
      loadAudits({ page: paginationState.audits.page }),
    ]);
    markPageLoaded("logs");
  }
}

async function reloadAll() {
  try {
    loadedAdminPages.clear();
    const canRead = await loadBaseAdminData();
    if (!canRead) return;
    await activateAdminPage(activeAdminPage, { force: true });
    setMessage(
      isAdminReadOnlyMode()
        ? "后台数据已刷新。当前账号为只读海报权限。"
        : "后台数据已刷新。",
      "success"
    );
  } catch (error) {
    if (pickErrorMessage(error) === "missing_token") {
      renderSession(null);
      adminOverview.innerHTML = "";
      setMessage("", "");
      return;
    }
    renderSession(null);
    adminOverview.innerHTML = "";
    setMessage(`后台加载失败：${pickErrorMessage(error, "加载失败")}`, "error");
  }
}

async function submitAdminLogin(event) {
  event.preventDefault();
  markDebugAction("login_click");
  try {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: adminLoginRoleIdInput.value.trim(),
        password: adminLoginPasswordInput.value,
      }),
    });

    saveSession({
      token: result.token,
      profile: result.user,
    });
    markDebugSession(`login_ok role=${result.user?.role || "-"}`);
    adminLoginPasswordInput.value = "";
    setMessage("后台登录成功。", "success");
    await reloadAll();
  } catch (error) {
    markDebugError(`login_failed ${pickErrorMessage(error, "login_failed")}`);
    setMessage(`后台登录失败：${pickErrorMessage(error, "登录失败")}`, "error");
  }
}

function logoutAdmin() {
  clearAdminAlerts();
  clearSession();
  adminLoginPasswordInput.value = "";
  renderSession(null);
  adminOverview.innerHTML = "";
  setMessage("已退出后台登录。", "success");
}

async function submitImport(event) {
  event.preventDefault();
  if (!guardAdminWriteAccess()) return;
  markDebugAction("import_click");
  if (importSubmitBtn) {
    importSubmitBtn.disabled = true;
    importSubmitBtn.textContent = "导入中...";
  }
  setMessage("正在导入商品，请稍等...", "success");
  try {
    const result = await apiFetch("/admin/imports/cards-json", {
      method: "POST",
      body: JSON.stringify({
        source_type: "upload",
        source_file_name: importFileNameInput.value.trim() || null,
        raw_json: importJsonInput.value,
      }),
    });
    markDebugAction(`import_ok count=${result.parsed_count}`);
    setMessage(`导入完成，共解析 ${result.parsed_count} 个商品。`, "success");
    await reloadAll();
  } catch (error) {
    markDebugError(`import_failed ${pickErrorMessage(error, "import_failed")}`);
    setMessage(`导入失败：${pickErrorMessage(error, "导入失败")}`, "error");
  } finally {
    if (importSubmitBtn) {
      importSubmitBtn.disabled = false;
      importSubmitBtn.textContent = "导入并生成商品";
    }
  }
}

async function loadSampleJson() {
  try {
    const response = await fetch("./legacy-json/legacy_getinfo-2026-03-16T14-58-06.json");
    if (!response.ok) {
      throw new Error(`load_sample_failed_${response.status}`);
    }
    importJsonInput.value = await response.text();
    importFileNameInput.value = "legacy_getinfo-2026-03-16T14-58-06.json";
    setMessage("已载入示例 JSON。", "success");
  } catch (error) {
    setMessage(`载入示例失败：${pickErrorMessage(error, "载入失败")}`, "error");
  }
}

async function bulkUpdateSelectedProducts(status) {
  if (!guardAdminWriteAccess()) return;
  const productIds = [...selectedProductIds];
  if (productIds.length === 0) {
    setMessage("请先选择商品。", "error");
    return;
  }

  try {
    const result = await apiFetch("/admin/products/bulk-status", {
      method: "PATCH",
      body: JSON.stringify({
        product_ids: productIds,
        status,
      }),
    });
    setMessage(`批量操作完成，已更新 ${result.updated_count} 个商品。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`批量操作失败：${pickErrorMessage(error, "操作失败")}`, "error");
  }
}

async function bulkPatchSelectedProducts(patch) {
  if (!guardAdminWriteAccess()) return;
  const productIds = [...selectedProductIds];
  if (productIds.length === 0) {
    setMessage("请先选择商品。", "error");
    return;
  }

  try {
    const result = await apiFetch("/admin/products/bulk-update", {
      method: "PATCH",
      body: JSON.stringify({
        product_ids: productIds,
        ...patch,
      }),
    });
    setMessage(`批量更新完成，已更新 ${result.updated_count} 个商品。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`批量更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
}

async function restoreDiscountForProducts(products) {
  if (!guardAdminWriteAccess()) return;
  const productIds = [...new Set((products || []).map((product) => Number(product.id)).filter(Boolean))];
  if (productIds.length === 0) {
    setMessage("当前没有可恢复原价的商品。", "error");
    return;
  }

  try {
    const result = await apiFetch("/admin/products/bulk-update", {
      method: "PATCH",
      body: JSON.stringify({
        product_ids: productIds,
        discount_rate: 100,
      }),
    });
    setMessage(`已恢复 ${result.updated_count} 个商品的原价。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`恢复原价失败：${pickErrorMessage(error, "恢复失败")}`, "error");
  }
}

function applyRandomSelection() {
  const count = parsePositiveCountInputValue(randomDiscountCountInput?.value);
  if (!count) {
    setMessage("随机件数必须是大于 0 的整数。", "error");
    return [];
  }

  const candidates = getRandomDiscountCandidates();
  if (!candidates.length) {
    setMessage("当前筛选下没有可随机打折的在售商品。", "error");
    return [];
  }

  const picked = sampleProducts(candidates, Math.min(count, candidates.length));
  selectedProductIds.clear();
  picked.forEach((product) => selectedProductIds.add(product.id));
  renderProducts(getFilteredProducts());
  setMessage(`已随机选中 ${picked.length} 个商品。`, "success");
  return picked;
}

async function applyRandomDiscount() {
  if (!guardAdminWriteAccess()) return;
  const discountRate = parseDiscountRateInputValue(randomDiscountRateInput?.value);
  if (!discountRate) {
    setMessage("随机折扣率必须是 1 到 100 之间的整数。", "error");
    return;
  }

  const picked = applyRandomSelection();
  if (!picked.length) return;

  await bulkPatchSelectedProducts({ discount_rate: discountRate });
}

productsRoot.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-product-id]");
  if (!card) return;
  if (event.target.closest(".product-select")) return;

  const productId = Number(card.getAttribute("data-product-id"));
  const product = allProducts.find((item) => Number(item.id) === productId) || null;

  try {
    if (event.target.closest(".view-product-detail-btn")) {
      openProductModal(product);
      return;
    }
    if (!guardAdminWriteAccess()) return;

    if (event.target.closest(".save-product-btn")) {
      await apiFetch(`/admin/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: card.querySelector('[data-field="name"]').value.trim(),
          price_quota: Number(card.querySelector('[data-field="price_quota"]').value),
          discount_rate: Number(card.querySelector('[data-field="discount_rate"]').value),
          stock: Number(card.querySelector('[data-field="stock"]').value),
        }),
      });
      setMessage(`商品 #${productId} 已保存。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".save-status-btn")) {
      await apiFetch(`/admin/products/${productId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: card.querySelector('[data-field="status"]').value,
        }),
      });
      setMessage(`商品 #${productId} 状态已更新。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".clear-manual-price-btn")) {
      await apiFetch(`/admin/products/${productId}/manual-price`, {
        method: "DELETE",
      });
      setMessage(`商品 #${productId} 已恢复自动价。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".create-external-order-btn")) {
      const buyerLabel = card.querySelector('[data-field="external-buyer-label"]').value.trim();
      const remark = card.querySelector('[data-field="external-order-remark"]').value.trim();
      if (!buyerLabel) {
        setMessage("请先填写外部交易对象。", "error");
        return;
      }
      await apiFetch("/admin/orders/external", {
        method: "POST",
        body: JSON.stringify({
          item_id: productId,
          item_kind: "card",
          buyer_label: buyerLabel,
          remark: remark || null,
        }),
      });
      setMessage(`商品 #${productId} 已记录为外部成交。`, "success");
      await reloadAll();
    }
  } catch (error) {
    setMessage(`商品更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
});

productsRoot.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".product-select");
  if (!checkbox) return;
  const productId = Number(checkbox.getAttribute("data-product-id"));
  if (checkbox.checked) selectedProductIds.add(productId);
  else selectedProductIds.delete(productId);
  syncProductSummary(getFilteredProducts());
});

auctionsRoot?.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-auction-id]");
  if (!card) return;
  if (!guardAdminWriteAccess()) return;
  const auctionId = Number(card.getAttribute("data-auction-id") || 0);
  const remark = card.querySelector('[data-field="auction-remark"]')?.value?.trim() || "";
  const reason = card.querySelector('[data-field="auction-reason"]')?.value?.trim() || "";

  try {
    if (event.target.closest(".reload-single-auction-btn")) {
      await loadAuctions();
      setMessage(`拍卖 #${auctionId} 已刷新。`, "success");
      return;
    }

    if (event.target.closest(".settle-auction-direct-btn")) {
      await apiFetch(`/admin/auctions/${auctionId}/settle`, {
        method: "POST",
        body: JSON.stringify({ remark: remark || null, settlement_mode: "direct_quota" }),
      });
      setMessage(`拍卖 #${auctionId} 已扣额度并结算。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".settle-auction-offline-btn")) {
      await apiFetch(`/admin/auctions/${auctionId}/settle`, {
        method: "POST",
        body: JSON.stringify({ remark: remark || null, settlement_mode: "offline" }),
      });
      setMessage(`拍卖 #${auctionId} 已按线下支付方式结算。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".cancel-auction-btn")) {
      await apiFetch(`/admin/auctions/${auctionId}/cancel`, {
        method: "POST",
        body: JSON.stringify({
          reason: reason || null,
          remark: remark || null,
        }),
      });
      setMessage(`拍卖 #${auctionId} 已流拍。`, "success");
      await reloadAll();
    }
  } catch (error) {
    setMessage(`拍卖操作失败：${pickErrorMessage(error, "操作失败")}`, "error");
  }
});

bundlesRoot.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-bundle-id]");
  if (!card) return;
  if (!guardAdminWriteAccess()) return;
  const bundleId = Number(card.getAttribute("data-bundle-id"));

  try {
    if (event.target.closest(".save-bundle-btn")) {
      const stockRaw = card.querySelector('[data-field="stock"]').value.trim();
      const tagsRaw = card.querySelector('[data-field="tags"]').value.trim();
      await apiFetch(`/admin/bundles/${bundleId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: card.querySelector('[data-field="name"]').value.trim(),
          description: card.querySelector('[data-field="description"]').value.trim(),
          tags: tagsRaw
            ? tagsRaw
                .split(/[,锛寍]/)
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          price_quota: Number(card.querySelector('[data-field="price_quota"]').value),
          stock: stockRaw === "" ? null : Number(stockRaw),
          display_rank: Number(card.querySelector('[data-field="display_rank"]').value),
        }),
      });
      setMessage(`套餐 #${bundleId} 已保存。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".save-bundle-status-btn")) {
      await apiFetch(`/admin/bundles/${bundleId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: card.querySelector('[data-field="status"]').value,
        }),
      });
      setMessage(`套餐 #${bundleId} 状态已更新。`, "success");
      await reloadAll();
    }
  } catch (error) {
    setMessage(`套餐更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
});

usersRoot.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-user-id]");
  if (!card) return;
  const userId = Number(card.getAttribute("data-user-id"));
  const user = allUsers.find((item) => Number(item.id) === userId) || null;

  try {
    if (event.target.closest(".view-user-orders-btn")) {
      setLinkedOrderUser(user);
      adminOrderStatusFilter.value = "all";
      resetPagedState("orders");
      resetPagedState("quotaLogs");
      await activateAdminPage("orders", { force: true });
      document.querySelector('[data-admin-page-panel="orders"]')?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setMessage(`已切换到用户 ${user?.game_role_name || userId} 的订单视图。`, "success");
      return;
    }
    if (!guardAdminWriteAccess()) return;

    if (event.target.closest(".quick-quota-btn")) {
      const amount = Number(event.target.closest(".quick-quota-btn").dataset.amount || 0);
      await apiFetch(`/admin/users/${userId}/quota`, {
        method: "PATCH",
        body: JSON.stringify({
          change_amount: amount,
          remark: `quick_add_${amount}`,
        }),
      });
      setMessage(`用户 #${userId} 已快捷增加 ${amount} 额度。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".save-quota-btn")) {
      await apiFetch(`/admin/users/${userId}/quota`, {
        method: "PATCH",
        body: JSON.stringify({
          change_amount: Number(card.querySelector('[data-field="change_amount"]').value),
          remark: card.querySelector('[data-field="remark"]').value.trim(),
        }),
      });
      setMessage(`用户 #${userId} 额度已更新。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".toggle-status-btn")) {
      const nextStatus = event.target.textContent.includes("禁用") ? "disabled" : "active";
      await apiFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setMessage(`用户 #${userId} 状态已更新。`, "success");
      await reloadAll();
    }
  } catch (error) {
    setMessage(`用户更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
});

adminRechargeOrdersRoot?.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-recharge-order-id]");
  if (!card) return;
  if (!guardAdminWriteAccess()) return;
  const rechargeOrderId = Number(card.getAttribute("data-recharge-order-id"));
  const adminRemark = card.querySelector('[data-field="admin_remark"]')?.value?.trim() || "";

  try {
    if (event.target.closest(".approve-recharge-order-btn")) {
      await apiFetch(`/admin/recharge-orders/${rechargeOrderId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved", admin_remark: adminRemark }),
      });
      await reloadAll();
      setMessage(`充值单 #${rechargeOrderId} 已审核通过并加额度。`, "success");
      return;
    }

    if (event.target.closest(".reject-recharge-order-btn")) {
      await apiFetch(`/admin/recharge-orders/${rechargeOrderId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected", admin_remark: adminRemark }),
      });
      await loadOverviewCounts();
      await loadRechargeOrders();
      setMessage(`充值单 #${rechargeOrderId} 已驳回。`, "success");
    }
  } catch (error) {
    setMessage(`充值订单处理失败：${pickErrorMessage(error, "处理失败")}`, "error");
  }
});

adminRechargeQrImageUrlInput?.addEventListener("input", () => {
  if (!adminRechargeQrPreview) return;
  adminRechargeQrPreview.src =
    adminRechargeQrImageUrlInput.value.trim() || "/payment/alipay-qr.jpg";
});

adminWechatQrImageUrlInput?.addEventListener("input", () => {
  if (!adminWechatQrPreview) return;
  adminWechatQrPreview.src =
    adminWechatQrImageUrlInput.value.trim() || "/payment/wechat-qr.png";
});

adminRechargeConfigForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!guardAdminWriteAccess()) return;

  const presetAmounts = String(adminRechargePresetsInput.value || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
  const instructions = String(adminRechargeInstructionsInput.value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const residualInstructions = String(adminResidualInstructionsInput?.value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  try {
    const nextConfig = await apiFetch("/admin/recharge-config", {
      method: "PATCH",
      body: JSON.stringify({
        enabled: adminRechargeEnabled.value === "true",
        exchange_yuan: Number(adminRechargeExchangeYuanInput.value),
        exchange_quota: Number(adminRechargeExchangeQuotaInput.value),
        min_amount_yuan: Number(adminRechargeMinYuanInput.value),
        residual_transfer_enabled: adminResidualTransferEnabledInput?.value === "true",
        residual_admin_role_id: adminResidualAdminRoleIdInput?.value.trim(),
        residual_admin_role_name: adminResidualAdminRoleNameInput?.value.trim(),
        residual_admin_game_name: adminResidualAdminGameNameInput?.value.trim(),
        residual_unit_label: adminResidualUnitLabelInput?.value.trim(),
        residual_quota_per_unit: Number(adminResidualQuotaPerUnitInput?.value),
        season_member_enabled: adminSeasonMemberEnabledInput.value === "true",
        season_member_season_label: adminSeasonMemberLabelInput.value.trim(),
        season_member_expires_at: adminSeasonMemberExpiresAtInput.value.trim(),
        season_member_price_yuan: Number(adminSeasonMemberPriceInput.value),
        season_member_quota: Number(adminSeasonMemberQuotaInput.value),
        season_member_bonus_rate: Number(adminSeasonMemberBonusRateInput.value),
        preset_amounts: presetAmounts,
        qr_image_url: adminRechargeQrImageUrlInput.value.trim(),
        payee_name: adminRechargePayeeNameInput.value.trim(),
        payee_hint: adminRechargePayeeHintInput.value.trim(),
        wechat_qr_image_url: adminWechatQrImageUrlInput?.value.trim(),
        wechat_payee_name: adminWechatPayeeNameInput?.value.trim(),
        wechat_payee_hint: adminWechatPayeeHintInput?.value.trim(),
        instructions,
        residual_instructions: residualInstructions,
      }),
    });
    renderRechargeConfig(nextConfig);
    setMessage(
      `充值配置已保存，当前比例 ${Number(nextConfig.exchange_yuan || 1)} 元 = ${Number(nextConfig.exchange_quota || 0)} 额度。`,
      "success"
    );
  } catch (error) {
    setMessage(`充值配置保存失败：${pickErrorMessage(error, "保存失败")}`, "error");
  }
});

ordersRoot.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-order-id]");
  if (!card) return;
  if (!guardAdminWriteAccess()) return;
  const orderId = Number(card.getAttribute("data-order-id"));
  const remark = card.querySelector('[data-field="remark"]').value.trim();
  const returnedCardsText =
    card.querySelector('[data-field="draw-returned-cards"]')?.value?.trim() || "";
  const bestGoldCard =
    card.querySelector('[data-field="draw-best-gold"]')?.value?.trim() || "";

  try {
    if (event.target.closest(".save-order-remark-btn")) {
      await apiFetch(`/admin/orders/${orderId}/remark`, {
        method: "PATCH",
        body: JSON.stringify({ remark }),
      });
      setMessage(`订单 #${orderId} 备注已保存。`, "success");
      await loadOrders();
      return;
    }

    if (event.target.closest(".confirm-order-btn")) {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "confirmed",
          remark,
          returned_cards_text: returnedCardsText || null,
          best_gold_card: bestGoldCard || null,
        }),
      });
      setMessage(`订单 #${orderId} 已确认。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".cancel-order-btn")) {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled", remark }),
      });
      setMessage(`订单 #${orderId} 已取消。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".approve-cancel-order-btn")) {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled", remark }),
      });
      setMessage(`订单 #${orderId} 的取消申请已通过。`, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".reject-cancel-order-btn")) {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "pending", remark }),
      });
      setMessage(`订单 #${orderId} 的取消申请已驳回。`, "success");
      await reloadAll();
      return;
    }
  } catch (error) {
    setMessage(`订单更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
});

adminLoginForm?.addEventListener("submit", submitAdminLogin);
adminLoginBtn?.addEventListener("click", () => {
  submitAdminLogin({
    preventDefault() {},
  });
});
adminLogoutBtn?.addEventListener("click", logoutAdmin);
importForm?.addEventListener("submit", submitImport);
importSubmitBtn?.addEventListener("click", () => {
  submitImport({
    preventDefault() {},
  });
});
document.getElementById("load-sample-json-btn")?.addEventListener("click", loadSampleJson);
document.getElementById("reload-admin-btn")?.addEventListener("click", reloadAll);
adminPageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextPage = button.getAttribute("data-admin-page-tab");
    if (!nextPage) return;
    activateAdminPage(nextPage).catch((error) => {
      setMessage(`页面加载失败：${pickErrorMessage(error, "加载失败")}`, "error");
    });
  });
});
document.getElementById("reload-orders-btn")?.addEventListener("click", () => {
  resetPagedState("orders");
  loadOrders({ page: 1 }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
});
document.getElementById("select-all-products-btn")?.addEventListener("click", () => {
  selectedProductIds.clear();
  getFilteredProducts().forEach((product) => selectedProductIds.add(product.id));
  renderProducts(getFilteredProducts());
});
document.getElementById("select-discounted-products-btn")?.addEventListener("click", () => {
  selectedProductIds.clear();
  getDiscountedFilteredProducts().forEach((product) => selectedProductIds.add(product.id));
  renderProducts(getFilteredProducts());
});
document.getElementById("clear-selected-products-btn")?.addEventListener("click", () => {
  selectedProductIds.clear();
  productsRoot?.querySelectorAll(".product-select").forEach((checkbox) => {
    checkbox.checked = false;
  });
  syncProductSummary(getFilteredProducts());
});
document.getElementById("bulk-on-sale-btn")?.addEventListener("click", () => {
  bulkUpdateSelectedProducts("on_sale");
});
document.getElementById("bulk-off-sale-btn")?.addEventListener("click", () => {
  bulkUpdateSelectedProducts("off_sale");
});
document.getElementById("bulk-price-btn")?.addEventListener("click", () => {
  const price = Number(bulkPriceInput?.value);
  if (!Number.isInteger(price) || price < 0) {
    setMessage("批量价格必须是大于等于 0 的整数。", "error");
    return;
  }
  bulkPatchSelectedProducts({ price_quota: price });
});
document.getElementById("bulk-stock-btn")?.addEventListener("click", () => {
  const stock = Number(bulkStockInput?.value);
  if (!Number.isInteger(stock) || stock < 0) {
    setMessage("批量库存必须是大于等于 0 的整数。", "error");
    return;
  }
  bulkPatchSelectedProducts({ stock });
});
document.getElementById("bulk-discount-btn")?.addEventListener("click", () => {
  const discountRate = parseDiscountRateInputValue(bulkDiscountRateInput?.value);
  if (!discountRate) {
    setMessage("批量折扣率必须是 1 到 100 之间的整数。", "error");
    return;
  }
  bulkPatchSelectedProducts({ discount_rate: discountRate });
});
document.getElementById("bulk-restore-discount-btn")?.addEventListener("click", () => {
  restoreDiscountForProducts(
    allProducts.filter((product) => selectedProductIds.has(Number(product.id)) && isDiscountedProduct(product))
  );
});
document.getElementById("filtered-restore-discount-btn")?.addEventListener("click", () => {
  restoreDiscountForProducts(getDiscountedFilteredProducts());
});
document.getElementById("random-select-products-btn")?.addEventListener("click", () => {
  applyRandomSelection();
});
document.getElementById("random-discount-btn")?.addEventListener("click", () => {
  applyRandomDiscount();
});
smartSelectHotProductsBtn?.addEventListener("click", () => {
  autoSelectPosterProducts("hot");
});
smartSelectBudgetProductsBtn?.addEventListener("click", () => {
  autoSelectPosterProducts("budget");
});
smartSelectMixedProductsBtn?.addEventListener("click", () => {
  autoSelectMixedPosterProducts();
});
exportProductPosterBtn?.addEventListener("click", () => {
  exportSelectedProductsPoster();
});
document.getElementById("reload-auctions-btn")?.addEventListener("click", () => {
  loadAuctions().catch((error) => setMessage(`拍卖加载失败：${pickErrorMessage(error)}`, "error"));
});
document.getElementById("admin-create-auction-btn")?.addEventListener("click", async () => {
  if (!guardAdminWriteAccess()) return;
  const product = getSelectedAuctionProduct();
  if (!product) {
    setMessage("开拍前请先只选中一张商品。", "error");
    return;
  }
  if (product.auction_id) {
    setMessage("这张卡已经在拍卖流程里了。", "error");
    return;
  }

  try {
    await apiFetch("/admin/auctions", {
      method: "POST",
      body: JSON.stringify({
        product_id: Number(product.id),
        title: adminAuctionTitleInput?.value?.trim() || null,
        starting_price_quota: Number(adminAuctionStartingPriceInput?.value),
        min_increment_quota: Number(adminAuctionMinIncrementInput?.value),
        starts_at: adminAuctionStartAtInput?.value
          ? new Date(adminAuctionStartAtInput.value).toISOString()
          : null,
        ends_at: adminAuctionEndAtInput?.value
          ? new Date(adminAuctionEndAtInput.value).toISOString()
          : null,
        remark: adminAuctionRemarkInput?.value?.trim() || null,
      }),
    });
    setMessage(`商品 #${product.id} 已开拍。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`开拍失败：${pickErrorMessage(error, "开拍失败")}`, "error");
  }
});

recalculatePricingBtn?.addEventListener("click", async () => {
  if (!guardAdminWriteAccess()) return;
  try {
    const result = await apiFetch("/admin/pricing/recalculate", { method: "POST" });
    setMessage(`定价已重算，共处理 ${result.product_count} 个商品。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`重算定价失败：${pickErrorMessage(error, "重算失败")}`, "error");
  }
});

adminProductKeywordInput?.addEventListener("input", () => {
  syncAdminProductFilters();
  resetPagedState("products");
  renderProducts(getFilteredProducts());
});
adminProductStatusFilter?.addEventListener("change", () => {
  syncAdminProductFilters();
  resetPagedState("products");
  renderProducts(getFilteredProducts());
});
adminProductDiscountFilter?.addEventListener("change", () => {
  syncAdminProductFilters();
  resetPagedState("products");
  renderProducts(getFilteredProducts());
});
adminProductCategoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-product-category]");
  if (!button) return;
  activeAdminProductCategory = button.getAttribute("data-admin-product-category") || "all";
  activeAdminProductSubcategory = "all";
  activeAdminProductDetail = "all";
  activeAdminProductFullness = "all";
  syncAdminProductFilters();
  resetPagedState("products");
  renderProducts(getFilteredProducts());
  if (activeAdminProductCategory === "bundle") {
    document.getElementById("bundles")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMessage("套餐入口在下方的套餐 SKU 模块。", "success");
  }
});
adminProductSubcategoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-product-subcategory]");
  if (!button) return;
  activeAdminProductSubcategory =
    button.getAttribute("data-admin-product-subcategory") || "all";
  activeAdminProductDetail = "all";
  activeAdminProductFullness = "all";
  syncAdminProductFilters();
  resetPagedState("products");
  renderProducts(getFilteredProducts());
});
adminProductDetailTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-product-detail]");
  if (!button) return;
  activeAdminProductDetail = button.getAttribute("data-admin-product-detail") || "all";
  activeAdminProductFullness = "all";
  syncAdminProductFilters();
  resetPagedState("products");
  renderProducts(getFilteredProducts());
});
adminProductFullnessTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-product-fullness]");
  if (!button) return;
  activeAdminProductFullness =
    button.getAttribute("data-admin-product-fullness") || "all";
  resetPagedState("products");
  renderProducts(getFilteredProducts());
});
adminRechargeStatusFilter?.addEventListener("change", () => {
  resetPagedState("rechargeOrders");
  loadRechargeOrders({ page: 1 }).catch((error) => setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error"));
});
adminRechargeKeywordInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  resetPagedState("rechargeOrders");
  loadRechargeOrders({ page: 1 }).catch((error) => setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error"));
});
document.getElementById("reload-recharge-orders-btn")?.addEventListener("click", () => {
  resetPagedState("rechargeOrders");
  loadRechargeOrders({ page: 1 }).catch((error) => setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error"));
});

adminUserKeywordInput?.addEventListener("input", () => {
  resetPagedState("users");
  renderUsers(getFilteredUsers());
});
linkedOrderUserState?.addEventListener("click", (event) => {
  if (!event.target.closest("#clear-linked-order-user-btn")) return;
  linkedOrderUser = null;
  adminOrderKeywordInput.value = "";
  renderLinkedOrderUserState();
  resetPagedState("orders");
  resetPagedState("quotaLogs");
  if (activeAdminPage === "logs") {
    loadQuotaLogs({ page: 1 }).catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
  }
  loadOrders({ page: 1 }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
});
adminOrderStatusFilter?.addEventListener("change", () => {
  resetPagedState("orders");
  loadOrders({ page: 1 }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
});
adminOrderKeywordInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  resetPagedState("orders");
  loadOrders({ page: 1 }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
});
adminOrderKeywordInput?.addEventListener("input", () => {
  if (linkedOrderUser && adminOrderKeywordInput.value.trim() !== linkedOrderUser.game_role_id) {
    linkedOrderUser = null;
    renderLinkedOrderUserState();
  }
});
closeAdminProductModalBtn?.addEventListener("click", closeProductModal);
adminProductModal?.addEventListener("click", (event) => {
  if (event.target === adminProductModal) {
    closeProductModal();
  }
});
document.getElementById("reload-quota-logs-btn")?.addEventListener("click", () => {
  resetPagedState("quotaLogs");
  loadQuotaLogs({ page: 1 }).catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
});
document.getElementById("reload-audits-btn")?.addEventListener("click", () => {
  resetPagedState("audits");
  loadAudits({ page: 1 }).catch((error) => setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error"));
});
adminQuotaLogTypeFilter?.addEventListener("change", () => {
  resetPagedState("quotaLogs");
  loadQuotaLogs({ page: 1 }).catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
});
adminQuotaLogKeywordInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  resetPagedState("quotaLogs");
  loadQuotaLogs({ page: 1 }).catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
});
adminAuditKeywordInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  resetPagedState("audits");
  loadAudits({ page: 1 }).catch((error) => setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error"));
});
adminAuditActionInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  resetPagedState("audits");
  loadAudits({ page: 1 }).catch((error) => setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error"));
});
document.addEventListener("click", (event) => {
  const alertButton = event.target.closest("[data-alert-target]");
  if (alertButton) {
    const target = alertButton.getAttribute("data-alert-target");
    const status = alertButton.getAttribute("data-alert-status") || "all";

    if (target === "orders") {
      if (adminOrderStatusFilter) {
        adminOrderStatusFilter.value = status;
      }
      resetPagedState("orders");
      activateAdminPage("orders", { force: true })
        .then(() => {
          document.querySelector('[data-admin-page-panel="orders"]')?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          setMessage(`已跳转到${status === "cancel_requested" ? "取消审核" : "待处理"}订单。`, "success");
        })
        .catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
      return;
    }

    if (target === "recharge") {
      if (adminRechargeStatusFilter) {
        adminRechargeStatusFilter.value = status;
      }
      resetPagedState("rechargeOrders");
      activateAdminPage("recharge", { force: true })
        .then(() => {
          document.querySelector('[data-admin-page-panel="recharge"]')?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          setMessage("已跳转到待审核充值。", "success");
        })
        .catch((error) => setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error"));
      return;
    }
  }

  if (event.target.closest("#refresh-alert-counts-btn")) {
    loadOverviewCounts().catch((error) =>
      setMessage(`提醒刷新失败：${pickErrorMessage(error, "刷新失败")}`, "error")
    );
    return;
  }

  const button = event.target.closest("[data-pagination-target][data-pagination-page]");
  if (!button) return;

  const target = button.getAttribute("data-pagination-target");
  const page = Number(button.getAttribute("data-pagination-page"));
  if (!target || !Number.isInteger(page) || page < 1) return;

  if (target === "orders") {
    loadOrders({ page }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
    return;
  }
  if (target === "products") {
    paginationState.products.page = page;
    renderProducts(getFilteredProducts());
    return;
  }
  if (target === "users") {
    paginationState.users.page = page;
    renderUsers(getFilteredUsers());
    return;
  }
  if (target === "bundles") {
    paginationState.bundles.page = page;
    renderBundles(allBundles);
    return;
  }
  if (target === "rechargeOrders") {
    loadRechargeOrders({ page }).catch((error) =>
      setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error")
    );
    return;
  }
  if (target === "quotaLogs") {
    loadQuotaLogs({ page }).catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
    return;
  }
  if (target === "audits") {
    loadAudits({ page }).catch((error) => setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error"));
  }
});

markDebugAction("page_loaded_v20260320a");
markDebugSession(loadSession()?.token ? "token_present" : "no_token");
markDebugError("none");
window.__adminModuleReady = true;
reloadAll();
