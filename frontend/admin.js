import { apiFetch, clearSession, formatDate, loadSession, saveSession } from "./shared.js";

const adminSession = document.getElementById("admin-session");
const adminMessage = document.getElementById("admin-message");
const adminOverview = document.getElementById("admin-overview");
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

const selectedProductIds = new Set();
let allProducts = [];
let allBundles = [];
let allUsers = [];
let allAudits = [];
let allQuotaLogs = [];
let linkedOrderUser = null;

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

function pickErrorMessage(error, fallback = "璇锋眰澶辫触") {
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

function renderSession(profile) {
  const session = loadSession();

  if (!session?.token) {
    markDebugSession("no_token");
    adminSession.innerHTML =
      '<div class="stack-item">褰撳墠鏈櫥褰曘€傚彲鐩存帴鍦ㄥ悗鍙伴〉杈撳叆绠＄悊鍛樻父鎴?ID 鍜屽瘑鐮佺櫥褰曘€?/div>';
    return false;
  }

  if (!profile) {
    markDebugSession("token_without_profile");
    adminSession.innerHTML = '<div class="stack-item">宸叉娴嬪埌鐧诲綍鎬侊紝浣嗗綋鍓嶆棤娉曡鍙栫鐞嗗憳璧勬枡銆?/div>';
    return false;
  }

  markDebugSession(`token role=${profile.role || "-"}`);

  adminSession.innerHTML = [
    `褰撳墠璐﹀彿锛?{escapeHtml(profile.game_role_name || "-")}`,
    `娓告垙 ID锛?{escapeHtml(profile.game_role_id || "-")}`,
    `鍖烘湇锛?{escapeHtml(profile.game_server || "-")}`,
    `瑙掕壊锛?{escapeHtml(profile.role || "-")}`,
    `褰撳墠棰濆害锛?{Number(profile.quota_balance || 0)}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  return profile.role === "admin";
}

function renderOverview() {
  const onSaleCount = allProducts.filter((product) => product.status === "on_sale").length;
  const cancelReviewCount = currentOrderList.filter(
    (order) => order.status === "cancel_requested"
  ).length;
  const activeUsers = allUsers.filter((user) => user.status === "active").length;
  const totalQuota = allUsers.reduce((sum, user) => sum + Number(user.quota_balance || 0), 0);

  const cards = [
    { label: "鍟嗗搧鎬绘暟", value: allProducts.length, hint: `涓婃灦涓?${onSaleCount}` },
    { label: "濂楅鎬绘暟", value: allBundles.length, hint: "鐙珛 SKU" },
    { label: "鐢ㄦ埛鎬绘暟", value: allUsers.length, hint: `娲昏穬 ${activeUsers}` },
    { label: "寰呭鏍稿彇娑?, value: cancelReviewCount, hint: "璁㈠崟鐘舵€? },
    { label: "瀹¤璁板綍", value: allAudits.length, hint: "鏈€杩?200 鏉? },
    { label: "鐢ㄦ埛鎬婚搴?, value: totalQuota, hint: "鏈湴鏂囦欢瀛樺偍缁熻" },
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

function renderLinkedOrderUserState() {
  if (!linkedOrderUser) {
    linkedOrderUserState.innerHTML = "";
    return;
  }

  linkedOrderUserState.innerHTML = `
    <span class="chip">璁㈠崟鑱斿姩鐢ㄦ埛锛?{escapeHtml(linkedOrderUser.game_role_name || "-")}</span>
    <span class="chip">娓告垙 ID锛?{escapeHtml(linkedOrderUser.game_role_id || "-")}</span>
    <button id="clear-linked-order-user-btn" class="ghost" type="button">娓呴櫎鑱斿姩</button>
  `;
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
  selectedProductsChip.textContent = `宸查€?${selectedProductIds.size}`;
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
          <div class="detail-row"><strong>鏀诲嚮 / 琛€閲?/strong><span>${Number(product.attack_value || 0)} / ${Number(product.hp_value || 0)}</span></div>
          <div class="detail-row"><strong>涓昏瘝鏉?/strong><span>${escapeHtml(product.main_attrs || "-")}</span></div>
          <div class="detail-row"><strong>棰濆璇嶆潯</strong><span>${escapeHtml(product.ext_attrs || "-")}</span></div>
          <div class="detail-row"><strong>搴撳瓨 / 鐘舵€?/strong><span>${Number(product.stock || 0)} / ${escapeHtml(product.status || "-")}</span></div>
        </div>
        ${renderPricingSummary(product, pricingMeta)}
      </div>
    </div>
    <div class="detail-list">
      <div class="card-title">鍘熷鍟嗗搧蹇収</div>
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
  if (!products.length) {
    productsRoot.innerHTML = '<div class="stack-item">褰撳墠绛涢€夋潯浠朵笅娌℃湁鍟嗗搧銆?/div>';
    syncSelectedProducts();
    return;
  }

  productsRoot.innerHTML = products
    .map((product) => {
      const pricingMeta = getPricingMeta(product);
      const pricingLabel = pricingMeta.source === "manual" ? "鎵嬪姩浠? : "鑷姩浠?;
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
              <span>閫変腑</span>
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
            <button class="ghost view-product-detail-btn" type="button">????</button>
            <button class="primary save-product-btn" type="button">淇濆瓨鍟嗗搧</button>
            <button class="ghost save-status-btn" type="button">浠呮洿鏂扮姸鎬?/button>
            <button class="ghost clear-manual-price-btn" type="button">鎭㈠鑷姩浠?/button>
          </div>
        </div>
      `;
    })
    .join("");

  syncSelectedProducts();
}

function renderUsers(users) {
  if (!users.length) {
    usersRoot.innerHTML = '<div class="stack-item">娌℃湁鍖归厤鍒扮敤鎴枫€?/div>';
    return;
  }

  usersRoot.innerHTML = users
    .map(
      (user) => `
        <div class="admin-card" data-user-id="${user.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(user.game_role_name || "-")}</div>
            <span class="chip">${escapeHtml(user.role || "-")}</span>
          </div>
          <div class="product-meta">
            <div>${escapeHtml(user.game_server || "-")} / ${escapeHtml(user.game_role_id || "-")}</div>
            <div>褰撳墠棰濆害锛?{Number(user.quota_balance || 0)}</div>
            <div>璐﹀彿鐘舵€侊細${escapeHtml(user.status || "-")}</div>
            <div>鏄电О锛?{escapeHtml(user.nickname || "-")}</div>
          </div>
          <div class="inline-form">
            <input data-field="change_amount" type="number" placeholder="棰濆害澧炲噺锛屽彲濉礋鏁? />
            <input data-field="remark" type="text" placeholder="澶囨敞" />
          </div>
          <div class="actions tight">
            <button class="ghost quick-quota-btn" type="button" data-amount="1000">+1000</button>
            <button class="ghost quick-quota-btn" type="button" data-amount="5000">+5000</button>
            <button class="ghost quick-quota-btn" type="button" data-amount="10000">+10000</button>
            <button class="ghost view-user-orders-btn" type="button">鏌ョ湅璁㈠崟</button>
          </div>
          <div class="actions">
            <button class="primary save-quota-btn" type="button">璋冩暣棰濆害</button>
            <button class="ghost toggle-status-btn" type="button">${
              user.status === "active" ? "绂佺敤" : "鍚敤"
            }</button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderBundles(bundles) {
  if (!bundles.length) {
    bundlesRoot.innerHTML = '<div class="stack-item">鏆傛棤濂楅 SKU銆?/div>';
    return;
  }

  bundlesRoot.innerHTML = bundles
    .map(
      (bundle) => `
        <div class="admin-card" data-bundle-id="${bundle.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(bundle.name)}</div>
            <span class="chip">${escapeHtml(bundle.status)}</span>
          </div>
          <div class="product-meta">
            <div>缂栫爜锛?{escapeHtml(bundle.code)}</div>
            <div>璇存槑锛?{escapeHtml(bundle.description || "-")}</div>
            <div>鏍囩锛?{escapeHtml((bundle.tags || []).join(" / ") || "-")}</div>
            <div>浠锋牸锛?{Number(bundle.price_quota || 0)} / 搴撳瓨锛?{
              bundle.stock === null || bundle.stock === undefined ? "涓嶉檺" : Number(bundle.stock)
            }</div>
            <div>灞曠ず椤哄簭锛?{Number(bundle.display_rank || 999)}</div>
          </div>
          <div class="inline-form">
            <input data-field="name" value="${escapeHtml(bundle.name)}" />
            <input data-field="description" value="${escapeHtml(bundle.description || "")}" />
            <input
              data-field="tags"
              value="${escapeHtml((bundle.tags || []).join(", "))}"
              placeholder="鏍囩锛岄€楀彿鍒嗛殧"
            />
            <input data-field="price_quota" type="number" value="${Number(bundle.price_quota || 0)}" />
            <input
              data-field="stock"
              type="text"
              value="${bundle.stock === null || bundle.stock === undefined ? "" : Number(bundle.stock)}"
              placeholder="鐣欑┖琛ㄧず涓嶉檺閲?
            />
            <input
              data-field="display_rank"
              type="number"
              value="${Number(bundle.display_rank || 999)}"
              placeholder="鎺掑簭"
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
            <button class="primary save-bundle-btn" type="button">淇濆瓨濂楅</button>
            <button class="ghost save-bundle-status-btn" type="button">浠呮洿鏂扮姸鎬?/button>
          </div>
        </div>
      `
    )
    .join("");
}

let currentOrderList = [];

function renderOrders(orders) {
  currentOrderList = orders;
  renderOverview();

  if (!orders.length) {
    ordersRoot.innerHTML = '<div class="stack-item">褰撳墠绛涢€夋潯浠朵笅娌℃湁璁㈠崟銆?/div>';
    return;
  }

  ordersRoot.innerHTML = orders
    .map((order) => {
      const items = (order.items || [])
        .map(
          (item) =>
            `<div class="order-item-line">${escapeHtml(item.product_name || "-")} / ${Number(
              item.price_quota || 0
            )} 棰濆害</div>`
        )
        .join("");

      const isCancelRequested = order.status === "cancel_requested";
      const statusHint = isCancelRequested
        ? '<div class="muted">鐢ㄦ埛宸插彂璧峰彇娑堢敵璇凤紝璇峰湪纭鍚庨€氳繃鎴栭┏鍥炪€?/div>'
        : "";
      const actionButtons = isCancelRequested
        ? `
            <button class="ghost save-order-remark-btn" type="button">淇濆瓨澶囨敞</button>
            <button class="danger approve-cancel-order-btn" type="button">閫氳繃鍙栨秷</button>
            <button class="primary reject-cancel-order-btn" type="button">椹冲洖鍙栨秷</button>
          `
        : `
            <button class="ghost save-order-remark-btn" type="button">淇濆瓨澶囨敞</button>
            <button class="primary confirm-order-btn" type="button">纭璁㈠崟</button>
            <button class="danger cancel-order-btn" type="button">鍙栨秷璁㈠崟</button>
          `;

      return `
        <div class="admin-card" data-order-id="${order.id}">
          <div class="admin-card-head">
            <div class="product-name">璁㈠崟 #${order.id}</div>
            <span class="chip">${escapeHtml(formatOrderStatusLabel(order.status))}</span>
          </div>
          <div class="product-meta">
            <div>鐢ㄦ埛锛?{escapeHtml(order.game_role_name || "-")} / ${escapeHtml(
              order.game_server || "-"
            )} / ${escapeHtml(order.game_role_id || "-")}</div>
            <div>璁㈠崟鎬婚锛?{Number(order.total_quota || 0)}</div>
            <div>鍒涘缓鏃堕棿锛?{formatDate(order.created_at)}</div>
          </div>
          <div class="order-item-list">${items || '<div class="order-item-line">娌℃湁璁㈠崟鏄庣粏銆?/div>'}</div>
          <div class="inline-form order-toolbar">
            <input
              data-field="remark"
              type="text"
              value="${escapeHtml(order.remark || "")}"
              placeholder="濉啓鍚庡彴澶囨敞鎴栧鐞嗚鏄?
            />
          </div>
          ${statusHint}
          <div class="actions">
            ${actionButtons}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderAudits(logs) {
  if (!logs.length) {
    auditsRoot.innerHTML = '<div class="stack-item">鏆傛棤瀹¤鏃ュ織銆?/div>';
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
  query.set("limit", String(options.limit || 200));

  const logs = await apiFetch(`/admin/quota-logs?${query.toString()}`);
  if (!userId) {
    allQuotaLogs = logs;
  }
  renderQuotaLogs(logs);
}

async function loadAudits() {
  const query = new URLSearchParams();
  const keyword = adminAuditKeywordInput?.value?.trim();
  const action = adminAuditActionInput?.value?.trim();

  if (keyword) query.set("keyword", keyword);
  if (action) query.set("action", action);
  query.set("limit", "200");

  const logs = await apiFetch(`/admin/audit-logs?${query.toString()}`);
  allAudits = logs;
  renderAudits(logs);
}

function formatQuotaLogType(type) {
  switch (type) {
    case "admin_add":
      return "绠＄悊鍛樺姞棰濆害";
    case "admin_subtract":
      return "绠＄悊鍛樻墸棰濆害";
    case "order_deduct":
      return "涓嬪崟鎵ｅ噺";
    case "order_refund":
      return "璁㈠崟閫€娆?;
    default:
      return type || "-";
  }
}

function renderQuotaLogs(logs) {
  if (!logs.length) {
    quotaLogsRoot.innerHTML = '<div class="stack-item">鏆傛棤棰濆害娴佹按銆?/div>';
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
          <div class="muted">璁㈠崟锛?{escapeHtml(log.order_id || "-")} / 澶囨敞锛?{escapeHtml(log.remark || "-")}</div>
        </div>
      `;
    })
    .join("");
}

async function loadOrders() {
  const query = new URLSearchParams();
  if (adminOrderStatusFilter.value && adminOrderStatusFilter.value !== "all") {
    query.set("status", adminOrderStatusFilter.value);
  }
  if (adminOrderKeywordInput.value.trim()) {
    query.set("keyword", adminOrderKeywordInput.value.trim());
  }
  query.set("limit", "200");

  const suffix = query.toString();
  const orders = await apiFetch(`/admin/orders${suffix ? `?${suffix}` : ""}`);
  renderOrders(orders);
  renderLinkedOrderUserState();
}

async function reloadAll() {
  try {
    const profile = await apiFetch("/auth/me");
    const isAdmin = renderSession(profile);
    if (!isAdmin) {
      setMessage("褰撳墠璐﹀彿涓嶆槸 admin锛屽悗鍙版帴鍙ｄ細杩斿洖 403銆?, "error");
      adminOverview.innerHTML = "";
      return;
    }

    const [products, bundles, users, audits, quotaLogs] = await Promise.all([
      apiFetch("/admin/products"),
      apiFetch("/admin/bundles"),
      apiFetch("/admin/users"),
      apiFetch("/admin/audit-logs?limit=200"),
      apiFetch("/admin/quota-logs?limit=200"),
    ]);

    allProducts = products;
    allBundles = bundles;
    allUsers = users;
    allAudits = audits;
    allQuotaLogs = quotaLogs;

    renderProducts(getFilteredProducts());
    renderBundles(allBundles);
    renderUsers(getFilteredUsers());
    renderQuotaLogs(allQuotaLogs);
    renderAudits(allAudits);
    await loadOrders();
    renderOverview();
    setMessage("鍚庡彴鏁版嵁宸插埛鏂般€?, "success");
  } catch (error) {
    renderSession(null);
    adminOverview.innerHTML = "";
    setMessage(`鍚庡彴鍔犺浇澶辫触锛?{pickErrorMessage(error, "鍔犺浇澶辫触")}`, "error");
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
    setMessage("鍚庡彴鐧诲綍鎴愬姛銆?, "success");
    await reloadAll();
  } catch (error) {
    markDebugError(`login_failed ${pickErrorMessage(error, "login_failed")}`);
    setMessage(`鍚庡彴鐧诲綍澶辫触锛?{pickErrorMessage(error, "鐧诲綍澶辫触")}`, "error");
  }
}

function logoutAdmin() {
  clearSession();
  adminLoginPasswordInput.value = "";
  renderSession(null);
  adminOverview.innerHTML = "";
  setMessage("宸查€€鍑哄悗鍙扮櫥褰曘€?, "success");
}

async function submitImport(event) {
  event.preventDefault();
  markDebugAction("import_click");
  if (importSubmitBtn) {
    importSubmitBtn.disabled = true;
    importSubmitBtn.textContent = "瀵煎叆涓?..";
  }
  setMessage("姝ｅ湪瀵煎叆鍟嗗搧锛岃绋嶇瓑...", "success");
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
    setMessage(`瀵煎叆瀹屾垚锛屽叡瑙ｆ瀽 ${result.parsed_count} 涓晢鍝併€俙, "success");
    await reloadAll();
  } catch (error) {
    markDebugError(`import_failed ${pickErrorMessage(error, "import_failed")}`);
    setMessage(`瀵煎叆澶辫触锛?{pickErrorMessage(error, "瀵煎叆澶辫触")}`, "error");
  } finally {
    if (importSubmitBtn) {
      importSubmitBtn.disabled = false;
      importSubmitBtn.textContent = "导入并生成商品";
    }
  }
}

async function loadSampleJson() {
  try {
    const response = await fetch("./legacy-json/legacy_getinfo-2026-03-13T17-54-19.json");
    importJsonInput.value = await response.text();
    importFileNameInput.value = "legacy_getinfo-2026-03-13T17-54-19.json";
    setMessage("宸茶浇鍏ョず渚?JSON銆?, "success");
  } catch (error) {
    setMessage(`杞藉叆绀轰緥澶辫触锛?{pickErrorMessage(error, "杞藉叆澶辫触")}`, "error");
  }
}

async function bulkUpdateSelectedProducts(status) {
  const productIds = [...selectedProductIds];
  if (productIds.length === 0) {
    setMessage("璇峰厛閫夋嫨鍟嗗搧銆?, "error");
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
    setMessage(`鎵归噺鎿嶄綔瀹屾垚锛屽凡鏇存柊 ${result.updated_count} 涓晢鍝併€俙, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`鎵归噺鎿嶄綔澶辫触锛?{pickErrorMessage(error, "鎿嶄綔澶辫触")}`, "error");
  }
}

async function bulkPatchSelectedProducts(patch) {
  const productIds = [...selectedProductIds];
  if (productIds.length === 0) {
    setMessage("璇峰厛閫夋嫨鍟嗗搧銆?, "error");
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
    setMessage(`鎵归噺鏇存柊瀹屾垚锛屽凡鏇存柊 ${result.updated_count} 涓晢鍝併€俙, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`鎵归噺鏇存柊澶辫触锛?{pickErrorMessage(error, "鏇存柊澶辫触")}`, "error");
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
      setMessage(`鍟嗗搧 #${productId} 宸蹭繚瀛樸€俙, "success");
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
      setMessage(`鍟嗗搧 #${productId} 鐘舵€佸凡鏇存柊銆俙, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".clear-manual-price-btn")) {
      await apiFetch(`/admin/products/${productId}/manual-price`, {
        method: "DELETE",
      });
      setMessage(`鍟嗗搧 #${productId} 宸叉仮澶嶈嚜鍔ㄤ环銆俙, "success");
      await reloadAll();
    }
  } catch (error) {
    setMessage(`鍟嗗搧鏇存柊澶辫触锛?{pickErrorMessage(error, "鏇存柊澶辫触")}`, "error");
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
      setMessage(`濂楅 #${bundleId} 宸蹭繚瀛樸€俙, "success");
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
      setMessage(`濂楅 #${bundleId} 鐘舵€佸凡鏇存柊銆俙, "success");
      await reloadAll();
    }
  } catch (error) {
    setMessage(`濂楅鏇存柊澶辫触锛?{pickErrorMessage(error, "鏇存柊澶辫触")}`, "error");
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
      await loadOrders();
      await loadQuotaLogs({ userId, limit: 100 });
      document.getElementById("orders")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setMessage(`宸插垏鎹㈠埌鐢ㄦ埛 ${user?.game_role_name || userId} 鐨勮鍗曡鍥俱€俙, "success");
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
      setMessage(`鐢ㄦ埛 #${userId} 宸插揩鎹峰鍔?${amount} 棰濆害銆俙, "success");
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
      setMessage(`鐢ㄦ埛 #${userId} 棰濆害宸叉洿鏂般€俙, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".toggle-status-btn")) {
      const nextStatus = event.target.textContent.includes("绂佺敤") ? "disabled" : "active";
      await apiFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setMessage(`鐢ㄦ埛 #${userId} 鐘舵€佸凡鏇存柊銆俙, "success");
      await reloadAll();
    }
  } catch (error) {
    setMessage(`鐢ㄦ埛鏇存柊澶辫触锛?{pickErrorMessage(error, "鏇存柊澶辫触")}`, "error");
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
      setMessage(`璁㈠崟 #${orderId} 澶囨敞宸蹭繚瀛樸€俙, "success");
      await loadOrders();
      return;
    }

    if (event.target.closest(".confirm-order-btn")) {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "confirmed", remark }),
      });
      setMessage(`璁㈠崟 #${orderId} 宸茬‘璁ゃ€俙, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".cancel-order-btn")) {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled", remark }),
      });
      setMessage(`璁㈠崟 #${orderId} 宸插彇娑堛€俙, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".approve-cancel-order-btn")) {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled", remark }),
      });
      setMessage(`璁㈠崟 #${orderId} 鐨勫彇娑堢敵璇峰凡閫氳繃銆俙, "success");
      await reloadAll();
      return;
    }

    if (event.target.closest(".reject-cancel-order-btn")) {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "pending", remark }),
      });
      setMessage(`璁㈠崟 #${orderId} 鐨勫彇娑堢敵璇峰凡椹冲洖銆俙, "success");
      await reloadAll();
      return;
    }
  } catch (error) {
    setMessage(`璁㈠崟鏇存柊澶辫触锛?{pickErrorMessage(error, "鏇存柊澶辫触")}`, "error");
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
document.getElementById("reload-orders-btn")?.addEventListener("click", () => {
  loadOrders().catch((error) => setMessage(`璁㈠崟鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
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
    setMessage("鎵归噺浠锋牸蹇呴』鏄ぇ浜庣瓑浜?0 鐨勬暣鏁般€?, "error");
    return;
  }
  bulkPatchSelectedProducts({ price_quota: price });
});
document.getElementById("bulk-stock-btn")?.addEventListener("click", () => {
  const stock = Number(bulkStockInput?.value);
  if (!Number.isInteger(stock) || stock < 0) {
    setMessage("鎵归噺搴撳瓨蹇呴』鏄ぇ浜庣瓑浜?0 鐨勬暣鏁般€?, "error");
    return;
  }
  bulkPatchSelectedProducts({ stock });
});

recalculatePricingBtn?.addEventListener("click", async () => {
  try {
    const result = await apiFetch("/admin/pricing/recalculate", { method: "POST" });
    setMessage(`瀹氫环宸查噸绠楋紝鍏卞鐞?${result.product_count} 涓晢鍝併€俙, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`閲嶇畻瀹氫环澶辫触锛?{pickErrorMessage(error, "閲嶇畻澶辫触")}`, "error");
  }
});

adminProductKeywordInput?.addEventListener("input", () => {
  renderProducts(getFilteredProducts());
});
adminProductStatusFilter?.addEventListener("change", () => {
  renderProducts(getFilteredProducts());
});
adminUserKeywordInput?.addEventListener("input", () => {
  renderUsers(getFilteredUsers());
});
linkedOrderUserState?.addEventListener("click", (event) => {
  if (!event.target.closest("#clear-linked-order-user-btn")) return;
  linkedOrderUser = null;
  adminOrderKeywordInput.value = "";
  renderLinkedOrderUserState();
  loadQuotaLogs().catch((error) => setMessage(`棰濆害娴佹按鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
  loadOrders().catch((error) => setMessage(`璁㈠崟鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
});
adminOrderStatusFilter?.addEventListener("change", () => {
  loadOrders().catch((error) => setMessage(`璁㈠崟鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
});
adminOrderKeywordInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  loadOrders().catch((error) => setMessage(`璁㈠崟鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
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
  loadQuotaLogs().catch((error) => setMessage(`棰濆害娴佹按鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
});
document.getElementById("reload-audits-btn")?.addEventListener("click", () => {
  loadAudits().catch((error) => setMessage(`瀹¤鏃ュ織鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
});
adminQuotaLogTypeFilter?.addEventListener("change", () => {
  loadQuotaLogs().catch((error) => setMessage(`棰濆害娴佹按鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
});
adminQuotaLogKeywordInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  loadQuotaLogs().catch((error) => setMessage(`棰濆害娴佹按鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
});
adminAuditKeywordInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  loadAudits().catch((error) => setMessage(`瀹¤鏃ュ織鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
});
adminAuditActionInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  loadAudits().catch((error) => setMessage(`瀹¤鏃ュ織鍔犺浇澶辫触锛?{pickErrorMessage(error)}`, "error"));
});

markDebugAction("page_loaded");
markDebugSession(loadSession()?.token ? "token_present" : "no_token");
markDebugError("none");
window.__adminModuleReady = true;
reloadAll();
