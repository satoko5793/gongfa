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

const selectedProductIds = new Set();
let allProducts = [];
let allBundles = [];
let allUsers = [];
let allAudits = [];
let allQuotaLogs = [];
let linkedOrderUser = null;

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
    adminSession.innerHTML =
      '<div class="stack-item">当前未登录。可直接在后台页输入管理员游戏 ID 和密码登录。</div>';
    return false;
  }

  if (!profile) {
    adminSession.innerHTML = '<div class="stack-item">已检测到登录态，但当前无法读取管理员资料。</div>';
    return false;
  }

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
  const cancelReviewCount = currentOrderList.filter(
    (order) => order.status === "cancel_requested"
  ).length;
  const activeUsers = allUsers.filter((user) => user.status === "active").length;
  const totalQuota = allUsers.reduce((sum, user) => sum + Number(user.quota_balance || 0), 0);

  const cards = [
    { label: "商品总数", value: allProducts.length, hint: `上架中 ${onSaleCount}` },
    { label: "套餐总数", value: allBundles.length, hint: "独立 SKU" },
    { label: "用户总数", value: allUsers.length, hint: `活跃 ${activeUsers}` },
    { label: "待审核取消", value: cancelReviewCount, hint: "订单状态" },
    { label: "审计记录", value: allAudits.length, hint: "最近 200 条" },
    { label: "用户总额度", value: totalQuota, hint: "本地文件存储统计" },
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
    <span class="chip">订单联动用户：${escapeHtml(linkedOrderUser.game_role_name || "-")}</span>
    <span class="chip">游戏 ID：${escapeHtml(linkedOrderUser.game_role_id || "-")}</span>
    <button id="clear-linked-order-user-btn" class="ghost" type="button">清除联动</button>
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
  if (!products.length) {
    productsRoot.innerHTML = '<div class="stack-item">当前筛选条件下没有商品。</div>';
    syncSelectedProducts();
    return;
  }

  productsRoot.innerHTML = products
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
            <button class="ghost view-product-detail-btn" type="button">????</button>
            <button class="primary save-product-btn" type="button">保存商品</button>
            <button class="ghost save-status-btn" type="button">仅更新状态</button>
            <button class="ghost clear-manual-price-btn" type="button">恢复自动价</button>
          </div>
        </div>
      `;
    })
    .join("");

  syncSelectedProducts();
}

function renderUsers(users) {
  if (!users.length) {
    usersRoot.innerHTML = '<div class="stack-item">没有匹配到用户。</div>';
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
}

function renderBundles(bundles) {
  if (!bundles.length) {
    bundlesRoot.innerHTML = '<div class="stack-item">暂无套餐 SKU。</div>';
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
            <div>编码：${escapeHtml(bundle.code)}</div>
            <div>说明：${escapeHtml(bundle.description || "-")}</div>
            <div>标签：${escapeHtml((bundle.tags || []).join(" / ") || "-")}</div>
            <div>价格：${Number(bundle.price_quota || 0)} / 库存：${
              bundle.stock === null || bundle.stock === undefined ? "不限" : Number(bundle.stock)
            }</div>
            <div>展示顺序：${Number(bundle.display_rank || 999)}</div>
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
}

let currentOrderList = [];

function renderOrders(orders) {
  currentOrderList = orders;
  renderOverview();

  if (!orders.length) {
    ordersRoot.innerHTML = '<div class="stack-item">当前筛选条件下没有订单。</div>';
    return;
  }

  ordersRoot.innerHTML = orders
    .map((order) => {
      const items = (order.items || [])
        .map(
          (item) =>
            `<div class="order-item-line">${escapeHtml(item.product_name || "-")} / ${Number(
              item.price_quota || 0
            )} 额度</div>`
        )
        .join("");

      const isCancelRequested = order.status === "cancel_requested";
      const statusHint = isCancelRequested
        ? '<div class="muted">用户已发起取消申请，请在确认后通过或驳回。</div>'
        : "";
      const actionButtons = isCancelRequested
        ? `
            <button class="ghost save-order-remark-btn" type="button">保存备注</button>
            <button class="danger approve-cancel-order-btn" type="button">通过取消</button>
            <button class="primary reject-cancel-order-btn" type="button">驳回取消</button>
          `
        : `
            <button class="ghost save-order-remark-btn" type="button">保存备注</button>
            <button class="primary confirm-order-btn" type="button">确认订单</button>
            <button class="danger cancel-order-btn" type="button">取消订单</button>
          `;

      return `
        <div class="admin-card" data-order-id="${order.id}">
          <div class="admin-card-head">
            <div class="product-name">订单 #${order.id}</div>
            <span class="chip">${escapeHtml(formatOrderStatusLabel(order.status))}</span>
          </div>
          <div class="product-meta">
            <div>用户：${escapeHtml(order.game_role_name || "-")} / ${escapeHtml(
              order.game_server || "-"
            )} / ${escapeHtml(order.game_role_id || "-")}</div>
            <div>订单总额：${Number(order.total_quota || 0)}</div>
            <div>创建时间：${formatDate(order.created_at)}</div>
          </div>
          <div class="order-item-list">${items || '<div class="order-item-line">没有订单明细。</div>'}</div>
          <div class="inline-form order-toolbar">
            <input
              data-field="remark"
              type="text"
              value="${escapeHtml(order.remark || "")}"
              placeholder="填写后台备注或处理说明"
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
      return "管理员加额度";
    case "admin_subtract":
      return "管理员扣额度";
    case "order_deduct":
      return "下单扣减";
    case "order_refund":
      return "订单退款";
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
      setMessage("当前账号不是 admin，后台接口会返回 403。", "error");
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
    setMessage("后台数据已刷新。", "success");
  } catch (error) {
    renderSession(null);
    adminOverview.innerHTML = "";
    setMessage(`后台加载失败：${pickErrorMessage(error, "加载失败")}`, "error");
  }
}

async function submitAdminLogin(event) {
  event.preventDefault();
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
    adminLoginPasswordInput.value = "";
    setMessage("后台登录成功。", "success");
    await reloadAll();
  } catch (error) {
    setMessage(`后台登录失败：${pickErrorMessage(error, "登录失败")}`, "error");
  }
}

function logoutAdmin() {
  clearSession();
  adminLoginPasswordInput.value = "";
  renderSession(null);
  adminOverview.innerHTML = "";
  setMessage("已退出后台登录。", "success");
}

async function submitImport(event) {
  event.preventDefault();
  try {
    const result = await apiFetch("/admin/imports/cards-json", {
      method: "POST",
      body: JSON.stringify({
        source_type: "upload",
        source_file_name: importFileNameInput.value.trim() || null,
        raw_json: importJsonInput.value,
      }),
    });
    setMessage(`导入完成，共解析 ${result.parsed_count} 个商品。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`导入失败：${pickErrorMessage(error, "导入失败")}`, "error");
  }
}

async function loadSampleJson() {
  try {
    const response = await fetch("./legacy-json/legacy_getinfo-2026-03-13T17-54-19.json");
    importJsonInput.value = await response.text();
    importFileNameInput.value = "legacy_getinfo-2026-03-13T17-54-19.json";
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
                .split(/[,，|]/)
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
      await loadOrders();
      await loadQuotaLogs({ userId, limit: 100 });
      document.getElementById("orders")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
adminLogoutBtn?.addEventListener("click", logoutAdmin);
document.getElementById("import-form").addEventListener("submit", submitImport);
document.getElementById("load-sample-json-btn").addEventListener("click", loadSampleJson);
document.getElementById("reload-admin-btn").addEventListener("click", reloadAll);
document.getElementById("reload-orders-btn").addEventListener("click", () => {
  loadOrders().catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
});
document.getElementById("select-all-products-btn").addEventListener("click", () => {
  selectedProductIds.clear();
  getFilteredProducts().forEach((product) => selectedProductIds.add(product.id));
  renderProducts(getFilteredProducts());
});
document.getElementById("clear-selected-products-btn").addEventListener("click", () => {
  selectedProductIds.clear();
  productsRoot.querySelectorAll(".product-select").forEach((checkbox) => {
    checkbox.checked = false;
  });
  syncSelectedProducts();
});
document.getElementById("bulk-on-sale-btn").addEventListener("click", () => {
  bulkUpdateSelectedProducts("on_sale");
});
document.getElementById("bulk-off-sale-btn").addEventListener("click", () => {
  bulkUpdateSelectedProducts("off_sale");
});
document.getElementById("bulk-price-btn").addEventListener("click", () => {
  const price = Number(bulkPriceInput.value);
  if (!Number.isInteger(price) || price < 0) {
    setMessage("批量价格必须是大于等于 0 的整数。", "error");
    return;
  }
  bulkPatchSelectedProducts({ price_quota: price });
});
document.getElementById("bulk-stock-btn").addEventListener("click", () => {
  const stock = Number(bulkStockInput.value);
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

adminProductKeywordInput.addEventListener("input", () => {
  renderProducts(getFilteredProducts());
});
adminProductStatusFilter.addEventListener("change", () => {
  renderProducts(getFilteredProducts());
});
adminUserKeywordInput.addEventListener("input", () => {
  renderUsers(getFilteredUsers());
});
linkedOrderUserState?.addEventListener("click", (event) => {
  if (!event.target.closest("#clear-linked-order-user-btn")) return;
  linkedOrderUser = null;
  adminOrderKeywordInput.value = "";
  renderLinkedOrderUserState();
  loadQuotaLogs().catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
  loadOrders().catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
});
adminOrderStatusFilter.addEventListener("change", () => {
  loadOrders().catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
});
adminOrderKeywordInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  loadOrders().catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
});
adminOrderKeywordInput.addEventListener("input", () => {
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
document.getElementById("reload-quota-logs-btn").addEventListener("click", () => {
  loadQuotaLogs().catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
});
document.getElementById("reload-audits-btn").addEventListener("click", () => {
  loadAudits().catch((error) => setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error"));
});
adminQuotaLogTypeFilter?.addEventListener("change", () => {
  loadQuotaLogs().catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
});
adminQuotaLogKeywordInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  loadQuotaLogs().catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
});
adminAuditKeywordInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  loadAudits().catch((error) => setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error"));
});
adminAuditActionInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  loadAudits().catch((error) => setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error"));
});

reloadAll();
