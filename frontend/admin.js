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
const bundlesRoot = document.getElementById("admin-bundles");
const usersRoot = document.getElementById("admin-users");
const ordersRoot = document.getElementById("admin-orders");
const quotaLogsRoot = document.getElementById("admin-quota-logs");
const auditsRoot = document.getElementById("admin-audits");
const selectedProductsChip = document.getElementById("selected-products-chip");
const adminProductKeywordInput = document.getElementById("admin-product-keyword-input");
const adminProductStatusFilter = document.getElementById("admin-product-status-filter");
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
const adminRechargeInstructionsInput = document.getElementById("admin-recharge-instructions");
const adminResidualInstructionsInput = document.getElementById("admin-residual-instructions");
const adminRechargeQrPreview = document.getElementById("admin-recharge-qr-preview");
const adminOrderKeywordInput = document.getElementById("admin-order-keyword-input");
const adminOrderStatusFilter = document.getElementById("admin-order-status-filter");
const adminQuotaLogKeywordInput = document.getElementById("admin-quota-log-keyword-input");
const adminQuotaLogTypeFilter = document.getElementById("admin-quota-log-type-filter");
const adminAuditKeywordInput = document.getElementById("admin-audit-keyword-input");
const adminAuditActionInput = document.getElementById("admin-audit-action-input");
const linkedOrderUserState = document.getElementById("linked-order-user-state");
const bulkPriceInput = document.getElementById("bulk-price-input");
const bulkStockInput = document.getElementById("bulk-stock-input");
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
let currentOrderList = [];
let currentRechargeOrderList = [];
let overviewCounts = {
  pendingOrderCount: 0,
  cancelReviewCount: 0,
  rechargeReviewCount: 0,
};
const loadedAdminPages = new Set();
let alertPollTimer = null;
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

function renderSession(profile) {
  const session = loadSession();

  if (!session?.token) {
    markDebugSession("no_token");
    adminSession.innerHTML =
      '<div class="stack-item">当前未登录。可直接在后台页输入管理员游戏 ID 和密码登录。</div>';
    return false;
  }

  if (!profile) {
    markDebugSession("token_without_profile");
    adminSession.innerHTML = '<div class="stack-item">已检测到登录态，但当前无法读取管理员资料。</div>';
    return false;
  }

  markDebugSession(`token role=${profile.role || "-"}`);

  adminSession.innerHTML = [
    `当前账号：${escapeHtml(profile.game_role_name || "-")}`,
    `游戏 ID：${escapeHtml(profile.game_role_id || "-")}`,
    `区服：${escapeHtml(profile.game_server || "-")}`,
    `角色：${escapeHtml(profile.role || "-")}`,
    `当前额度：${Number(profile.quota_balance || 0)}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  return profile.role === "admin";
}

function renderOverview() {
  const onSaleCount = allProducts.filter((product) => product.status === "on_sale").length;
  const pendingOrderCount = Number(overviewCounts.pendingOrderCount || 0);
  const cancelReviewCount = Number(overviewCounts.cancelReviewCount || 0);
  const rechargeReviewCount = Number(overviewCounts.rechargeReviewCount || 0);
  const activeUsers = allUsers.filter((user) => user.status === "active").length;
  const totalQuota = allUsers.reduce((sum, user) => sum + Number(user.quota_balance || 0), 0);

  const cards = [
    { label: "商品总数", value: allProducts.length, hint: `上架中 ${onSaleCount}` },
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
}

function getPricingMeta(product) {
  return product && product.pricing_meta && typeof product.pricing_meta === "object"
    ? product.pricing_meta
    : {};
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

function getFilteredProducts() {
  const keyword = String(adminProductKeywordInput.value || "").trim().toLowerCase();
  const status = adminProductStatusFilter.value;

  return allProducts.filter((product) => {
    if (status !== "all" && product.status !== status) return false;
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

  if (!products.length) {
    productsRoot.innerHTML = '<div class="stack-item">当前筛选条件下没有商品。</div>';
    renderPagination(productsPaginationRoot, "products", paginationState.products);
    syncSelectedProducts();
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
                <div>Stock: ${Number(product.stock || 0)} / Price: ${Number(product.price_quota || 0)}</div>
                <div>Pricing: ${pricingLabel} / Reason: ${escapeHtml(dominantLabel)}</div>
                <div>Floor: ${floorPrice} / Auto: ${autoPrice} / Manual: ${manualPrice}</div>
                <div>Market factor: ${marketFactor}</div>
              </div>
              ${renderPricingSummary(product, pricingMeta)}
            </div>
          </div>
          <div class="inline-form">
            <input data-field="name" value="${escapeHtml(product.name)}" />
            <input data-field="price_quota" type="number" value="${Number(product.price_quota || 0)}" />
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
          <div class="actions">
            <button class="ghost view-product-detail-btn" type="button">查看详情</button>
            <button class="primary save-product-btn" type="button">保存商品</button>
            <button class="ghost save-status-btn" type="button">仅更新状态</button>
            <button class="ghost clear-manual-price-btn" type="button">恢复自动价</button>
          </div>
        </div>
      `;
    })
    .join("");

  renderPagination(productsPaginationRoot, "products", paginationState.products);
  syncSelectedProducts();
}

function renderUsers(users) {
  const pagedUsers = sliceLocalPage(users, "users");

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
        </div>
      `
    )
    .join("");

  renderPagination(usersPaginationRoot, "users", paginationState.users);
}

function renderBundles(bundles) {
  const pagedBundles = sliceLocalPage(bundles, "bundles");

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

function renderRechargeOrders(orders) {
  currentRechargeOrderList = orders;
  renderOverview();

  if (!adminRechargeOrdersRoot) return;
  if (!orders.length) {
    adminRechargeOrdersRoot.innerHTML = '<div class="stack-item">当前没有符合条件的充值订单。</div>';
    return;
  }

  adminRechargeOrdersRoot.innerHTML = orders
    .map((order) => {
      const amountLine = isResidualRechargeOrder(order)
        ? `转赠数量：${Number(order.transfer_amount || order.amount_yuan || 0)} ${escapeHtml(order.transfer_unit || "残卷")} / 预计额度：${Number(order.quota_amount || 0)}`
        : `充值金额：${Number(order.amount_yuan || 0)} 元 / 预计额度：${Number(order.quota_amount || 0)}`;
      const referenceLabel = isResidualRechargeOrder(order) ? "转赠凭据" : "付款备注";
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
          <div class="inline-form order-toolbar">
            <input
              data-field="admin_remark"
              type="text"
              value="${escapeHtml(order.admin_remark || "")}"
              placeholder="填写审核备注，例如已核对付款截图"
            />
          </div>
          ${statusHint}
          <div class="actions">
            ${order.status === "pending_review" ? `
              <button class="primary approve-recharge-order-btn" type="button">审核通过并加额度</button>
              <button class="danger reject-recharge-order-btn" type="button">驳回申请</button>
            ` : '<button class="ghost" type="button" disabled>已处理</button>'}
          </div>
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

  if (!ordersRoot) return;
  if (!currentOrderList.length) {
    ordersRoot.innerHTML = '<div class="stack-item">当前没有符合条件的订单。</div>';
    return;
  }

  ordersRoot.innerHTML = currentOrderList
    .map((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
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

      const actionButtons =
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
            <div>订单总额：${Number(order.total_quota || 0)} 额度</div>
            <div>创建时间：${formatDate(order.created_at)}</div>
          </div>
          ${order.cancel_reason ? `<div class="muted">取消原因：${escapeHtml(order.cancel_reason)}</div>` : ""}
          <div class="order-item-list">${itemLines}</div>
          <div class="inline-form order-toolbar">
            <input
              data-field="remark"
              type="text"
              value="${escapeHtml(order.remark || "")}"
              placeholder="填写后台备注或处理说明"
            />
          </div>
          <div class="actions">
            ${actionButtons}
          </div>
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
  const isAdmin = renderSession(profile);
  if (!isAdmin) {
    clearAdminAlerts();
    setMessage("当前账号不是 admin，后台接口会返回 403。", "error");
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

  renderProducts(getFilteredProducts());
  renderBundles(allBundles);
  renderUsers(getFilteredUsers());
  renderRechargeConfig(rechargeConfig);
  await loadOverviewCounts();
  startAlertPolling();
  markPageLoaded("imports");
  markPageLoaded("catalog");
  markPageLoaded("users");
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
    const isAdmin = await loadBaseAdminData();
    if (!isAdmin) return;
    await activateAdminPage(activeAdminPage, { force: true });
    setMessage("后台数据已刷新。", "success");
  } catch (error) {
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

    if (event.target.closest(".save-product-btn")) {
      await apiFetch(`/admin/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: card.querySelector('[data-field="name"]').value.trim(),
          price_quota: Number(card.querySelector('[data-field="price_quota"]').value),
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
  syncSelectedProducts();
});

bundlesRoot.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-bundle-id]");
  if (!card) return;
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

adminRechargeConfigForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

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
  const orderId = Number(card.getAttribute("data-order-id"));
  const remark = card.querySelector('[data-field="remark"]').value.trim();

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
        body: JSON.stringify({ status: "confirmed", remark }),
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
document.getElementById("clear-selected-products-btn")?.addEventListener("click", () => {
  selectedProductIds.clear();
  productsRoot?.querySelectorAll(".product-select").forEach((checkbox) => {
    checkbox.checked = false;
  });
  syncSelectedProducts();
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

recalculatePricingBtn?.addEventListener("click", async () => {
  try {
    const result = await apiFetch("/admin/pricing/recalculate", { method: "POST" });
    setMessage(`定价已重算，共处理 ${result.product_count} 个商品。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`重算定价失败：${pickErrorMessage(error, "重算失败")}`, "error");
  }
});

adminProductKeywordInput?.addEventListener("input", () => {
  resetPagedState("products");
  renderProducts(getFilteredProducts());
});
adminProductStatusFilter?.addEventListener("change", () => {
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

markDebugAction("page_loaded_v20260317m");
markDebugSession(loadSession()?.token ? "token_present" : "no_token");
markDebugError("none");
window.__adminModuleReady = true;
reloadAll();
