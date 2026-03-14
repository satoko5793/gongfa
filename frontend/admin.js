import { apiFetch, formatDate, loadSession } from "./shared.js";

const adminSession = document.getElementById("admin-session");
const adminMessage = document.getElementById("admin-message");
const importJsonInput = document.getElementById("import-json-input");
const importFileNameInput = document.getElementById("import-file-name");
const productsRoot = document.getElementById("admin-products");
const bundlesRoot = document.getElementById("admin-bundles");
const usersRoot = document.getElementById("admin-users");
const ordersRoot = document.getElementById("admin-orders");
const auditsRoot = document.getElementById("admin-audits");
const selectedProductsChip = document.getElementById("selected-products-chip");
const adminProductKeywordInput = document.getElementById("admin-product-keyword-input");
const adminProductStatusFilter = document.getElementById("admin-product-status-filter");
const adminOrderKeywordInput = document.getElementById("admin-order-keyword-input");
const adminOrderStatusFilter = document.getElementById("admin-order-status-filter");
const bulkPriceInput = document.getElementById("bulk-price-input");
const bulkStockInput = document.getElementById("bulk-stock-input");
const recalculatePricingBtn = document.getElementById("recalculate-pricing-btn");

const selectedProductIds = new Set();
let allProducts = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setMessage(text, type = "") {
  adminMessage.textContent = text || "";
  adminMessage.className = type ? `notice ${type}` : "notice";
}

function renderSession(profile) {
  const session = loadSession();
  if (!session?.token) {
    adminSession.innerHTML =
      '<div class="stack-item">未检测到登录态。请先到前台登录账号，再使用管理员账号进入后台。</div>';
    return false;
  }

  if (!profile) {
    adminSession.innerHTML = '<div class="stack-item">无法读取当前账号信息。</div>';
    return false;
  }

  adminSession.innerHTML = [
    `角色名：${escapeHtml(profile.game_role_name)}`,
    `角色 ID：${escapeHtml(profile.game_role_id)}`,
    `区服：${escapeHtml(profile.game_server)}`,
    `角色：${escapeHtml(profile.role)}`,
    `余额：${profile.quota_balance ?? 0}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  return profile.role === "admin";
}

function syncSelectedProducts() {
  selectedProductsChip.textContent = `已选 ${selectedProductIds.size}`;
}

function getPricingMeta(product) {
  return product && product.pricing_meta && typeof product.pricing_meta === "object"
    ? product.pricing_meta
    : {};
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
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(keyword));
  });
}

function renderProducts(products) {
  if (!products.length) {
    productsRoot.innerHTML = '<div class="stack-item">暂无商品。</div>';
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
              <span>选择</span>
            </label>
            <span class="chip">${escapeHtml(product.status)}</span>
          </div>
          <div class="product-name">${escapeHtml(product.name)}</div>
          <div class="product-meta">
            <div>来源：${escapeHtml(product.source_file_name || "-")}</div>
            <div>属性：攻击 ${Number(product.attack_value || 0)} / 血量 ${Number(product.hp_value || 0)}</div>
            <div>词条：${escapeHtml(product.ext_attrs || "无")}</div>
            <div>库存：${Number(product.stock || 0)} / 最终价格：${Number(product.price_quota || 0)}</div>
            <div>定价：${pricingLabel} / 主因：${escapeHtml(dominantLabel)}</div>
            <div>底价：${floorPrice} / 自动价：${autoPrice} / 手动价：${manualPrice}</div>
            <div>市场系数：${marketFactor}</div>
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
    usersRoot.innerHTML = '<div class="stack-item">暂无用户。</div>';
    return;
  }

  usersRoot.innerHTML = users
    .map(
      (user) => `
        <div class="admin-card" data-user-id="${user.id}">
          <div class="product-name">${escapeHtml(user.game_role_name)}</div>
          <div class="product-meta">
            <div>${escapeHtml(user.game_server)} / ${escapeHtml(user.game_role_id)}</div>
            <div>当前额度：${Number(user.quota_balance || 0)}</div>
            <div>状态：${escapeHtml(user.status)}</div>
          </div>
          <div class="inline-form">
            <input data-field="change_amount" type="number" placeholder="额度增减，可填负数" />
            <input data-field="remark" type="text" placeholder="备注" />
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

function renderOrders(orders) {
  if (!orders.length) {
    ordersRoot.innerHTML = '<div class="stack-item">暂无订单。</div>';
    return;
  }

  ordersRoot.innerHTML = orders
    .map((order) => {
      const items = (order.items || [])
        .map(
          (item) =>
            `<div class="order-item-line">${escapeHtml(item.product_name)} / ${Number(item.price_quota || 0)} 额度</div>`
        )
        .join("");

      return `
        <div class="admin-card" data-order-id="${order.id}">
          <div class="admin-card-head">
            <div class="product-name">订单 #${order.id}</div>
            <span class="chip">${escapeHtml(order.status)}</span>
          </div>
          <div class="product-meta">
            <div>用户：${escapeHtml(order.game_role_name || "-")} / ${escapeHtml(order.game_server || "-")} / ${escapeHtml(order.game_role_id || "-")}</div>
            <div>总额度：${Number(order.total_quota || 0)}</div>
            <div>创建时间：${formatDate(order.created_at)}</div>
          </div>
          <div class="order-item-list">${items || '<div class="order-item-line">无商品明细</div>'}</div>
          <div class="inline-form order-toolbar">
            <input
              data-field="remark"
              type="text"
              value="${escapeHtml(order.remark || "")}"
              placeholder="履约备注，例如已交付、待联系"
            />
          </div>
          <div class="actions">
            <button class="ghost save-order-remark-btn" type="button">保存备注</button>
            <button class="primary confirm-order-btn" type="button">确认订单</button>
            <button class="danger cancel-order-btn" type="button">取消订单</button>
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
}

async function reloadAll() {
  try {
    const profile = await apiFetch("/auth/me");
    const isAdmin = renderSession(profile);
    if (!isAdmin) {
      setMessage("当前账号不是 admin，后台接口会返回 403。", "error");
      return;
    }

    const [products, bundles, users, audits] = await Promise.all([
      apiFetch("/admin/products"),
      apiFetch("/admin/bundles"),
      apiFetch("/admin/users"),
      apiFetch("/admin/audit-logs"),
    ]);

    allProducts = products;
    renderProducts(getFilteredProducts());
    renderBundles(bundles);
    renderUsers(users);
    renderAudits(audits);
    await loadOrders();
    setMessage("后台数据已刷新。", "success");
  } catch (error) {
    renderSession(null);
    setMessage(`后台加载失败：${error.message}`, "error");
  }
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
    setMessage(`导入失败：${error.message}`, "error");
  }
}

async function loadSampleJson() {
  try {
    const response = await fetch("./legacy-json/legacy_getinfo-2026-03-13T17-54-19.json");
    importJsonInput.value = await response.text();
    importFileNameInput.value = "legacy_getinfo-2026-03-13T17-54-19.json";
    setMessage("已载入示例 JSON。", "success");
  } catch (error) {
    setMessage(`载入示例失败：${error.message}`, "error");
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
    setMessage(`批量操作失败：${error.message}`, "error");
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
    setMessage(`批量更新失败：${error.message}`, "error");
  }
}

productsRoot.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-product-id]");
  if (!card) return;
  if (event.target.closest(".product-select")) return;

  const productId = Number(card.getAttribute("data-product-id"));

  try {
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
    setMessage(`商品更新失败：${error.message}`, "error");
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
                .split(/[,，/|]/)
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
    setMessage(`套餐更新失败：${error.message}`, "error");
  }
});

usersRoot.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-user-id]");
  if (!card) return;
  const userId = Number(card.getAttribute("data-user-id"));

  try {
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
    setMessage(`用户更新失败：${error.message}`, "error");
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
    }
  } catch (error) {
    setMessage(`订单更新失败：${error.message}`, "error");
  }
});

document.getElementById("import-form").addEventListener("submit", submitImport);
document.getElementById("load-sample-json-btn").addEventListener("click", loadSampleJson);
document.getElementById("reload-admin-btn").addEventListener("click", reloadAll);
document.getElementById("reload-orders-btn").addEventListener("click", () => {
  loadOrders().catch((error) => setMessage(`订单加载失败：${error.message}`, "error"));
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
    setMessage(`重算定价失败：${error.message}`, "error");
  }
});

adminProductKeywordInput.addEventListener("input", () => {
  renderProducts(getFilteredProducts());
});
adminProductStatusFilter.addEventListener("change", () => {
  renderProducts(getFilteredProducts());
});
adminOrderStatusFilter.addEventListener("change", () => {
  loadOrders().catch((error) => setMessage(`订单加载失败：${error.message}`, "error"));
});
adminOrderKeywordInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  loadOrders().catch((error) => setMessage(`订单加载失败：${error.message}`, "error"));
});

reloadAll();
