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
const keywordInput = document.getElementById("product-keyword-input");
const sortSelect = document.getElementById("product-sort-select");
const sessionSummary = document.getElementById("session-summary");
const sessionRole = document.getElementById("session-role");
const helperOriginInput = document.getElementById("helper-origin-input");
const bindMessage = document.getElementById("bind-message");
const accountProfile = document.getElementById("account-profile");
const quotaBalance = document.getElementById("quota-balance");
const orderList = document.getElementById("order-list");

const registerForm = document.getElementById("register-form");
const registerRoleIdInput = document.getElementById("register-role-id");
const registerRoleNameInput = document.getElementById("register-role-name");
const registerPasswordInput = document.getElementById("register-password");
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createImageFallbackSvg(name, kind = "card") {
  const label = String(name || "商品").slice(0, 12);
  const colors =
    kind === "bundle"
      ? { a: "#c4552d", b: "#234e52" }
      : { a: "#d7b188", b: "#465f63" };
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='760'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${colors.a}'/><stop offset='100%' stop-color='${colors.b}'/></linearGradient></defs><rect width='100%' height='100%' rx='32' fill='url(#g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='42' fill='white' font-family='sans-serif'>${escapeHtml(label)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

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
      img.src = img.dataset.placeholder || createImageFallbackSvg(img.alt || "商品");
    });
  });
}

function setNotice(text, type = "") {
  bindMessage.textContent = text || "";
  bindMessage.className = type ? `notice ${type}` : "notice";
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
  if (!profile) {
    sessionSummary.textContent = "未登录";
    sessionRole.textContent = "请先登录账号再购买";
    return;
  }

  sessionSummary.textContent = profile.game_role_name || "已登录";
  const authLabel = profile.auth_provider === "password" ? "密码登录" : "绑定登录";
  const serverText = profile.auth_provider === "password" ? "免区服" : profile.game_server;
  sessionRole.textContent = `${serverText} / ${profile.role} / ${authLabel}`;
}

function isBundle(product) {
  return product?.item_kind === "bundle";
}

function isAtlasBundle(product) {
  if (!isBundle(product)) return false;
  const tags = Array.isArray(product.tags) ? product.tags : [];
  return tags.includes("图鉴") || String(product.uid || "").startsWith("atlas_");
}

function getReferenceCaps(product) {
  return product?.pricing_meta?.reference_caps && typeof product.pricing_meta.reference_caps === "object"
    ? product.pricing_meta.reference_caps
    : {};
}

function isFullByCap(currentValue, capValue) {
  const current = Number(currentValue) || 0;
  const cap = Number(capValue) || 0;
  if (cap <= 0) return false;
  return current >= cap;
}

function isAttackFull(product) {
  if (isBundle(product)) return false;
  return isFullByCap(product?.attack_value, getReferenceCaps(product).attack_max);
}

function isHpFull(product) {
  if (isBundle(product)) return false;
  return isFullByCap(product?.hp_value, getReferenceCaps(product).hp_max);
}

function getTermCount(product) {
  if (isBundle(product)) return 0;
  const text = String(product?.ext_attrs || "").trim();
  if (!text || text === "无") return 0;
  return [...text.matchAll(/(走火(?:入魔)?|气定(?:神闲)?)\s*[0-9.]+/g)].length;
}

function parseTermValues(product) {
  const text = String(product?.ext_attrs || "").trim();
  const result = { fire: 0, calm: 0 };
  if (!text || text === "无") return result;

  for (const match of text.matchAll(/走火(?:入魔)?\s*([0-9.]+)/g)) {
    result.fire += Number(match[1]) || 0;
  }
  for (const match of text.matchAll(/气定(?:神闲)?\s*([0-9.]+)/g)) {
    result.calm += Number(match[1]) || 0;
  }
  return result;
}

function getLegacyTheme(product) {
  if (isBundle(product)) {
    return {
      border: "#b5532d",
      glow: "rgba(196,85,45,0.18)",
      top: "#f0c39f",
      bottom: "#25565a",
      badge: "#fff0df",
      label: "套餐",
    };
  }

  const id = Number(product?.legacy_id || 0);
  if (id >= 500) {
    return {
      border: "#ceaa37",
      glow: "rgba(206,170,55,0.22)",
      top: "#f5e6a3",
      bottom: "#6d5118",
      badge: "#fff4c7",
      label: "天阶",
    };
  }
  if (id >= 400) {
    return {
      border: "#dd6478",
      glow: "rgba(221,100,120,0.2)",
      top: "#f3b2c0",
      bottom: "#6b2634",
      badge: "#ffe1e7",
      label: "绝品",
    };
  }
  if (id >= 300) {
    return {
      border: "#df8a45",
      glow: "rgba(223,138,69,0.2)",
      top: "#f5c29a",
      bottom: "#6b3c1d",
      badge: "#ffe7d2",
      label: "珍品",
    };
  }
  if (id >= 200) {
    return {
      border: "#9a74df",
      glow: "rgba(154,116,223,0.2)",
      top: "#ccb6f6",
      bottom: "#442a6e",
      badge: "#efe5ff",
      label: "奇品",
    };
  }
  if (id >= 100) {
    return {
      border: "#5d98e8",
      glow: "rgba(93,152,232,0.2)",
      top: "#bdd7ff",
      bottom: "#27436e",
      badge: "#e6f0ff",
      label: "良品",
    };
  }
  return {
    border: "#4caf72",
    glow: "rgba(76,175,114,0.2)",
    top: "#b6ebc8",
    bottom: "#234b33",
    badge: "#e0f6e7",
    label: "基础",
  };
}

function parseTermBadges(text, product) {
  if (isBundle(product)) {
    return String(text || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({ kind: "plain", text: item, isFull: false }));
  }

  const value = String(text || "").trim();
  if (!value || value === "无") return [];
  const referenceCaps = getReferenceCaps(product);
  const termValues = parseTermValues(product);
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (item.startsWith("走火")) {
        return {
          kind: "fire",
          text: item,
          isFull: isFullByCap(termValues.fire, referenceCaps.fire_total_max),
        };
      }
      if (item.startsWith("气定")) {
        return {
          kind: "calm",
          text: item,
          isFull: isFullByCap(termValues.calm, referenceCaps.calm_total_max),
        };
      }
      return { kind: "plain", text: item, isFull: false };
    });
}

function renderStatBlock(label, value, isFull = false) {
  return `
    <div class="stat-block">
      <span class="stat-label-row">
        <span class="stat-label">${label}</span>
        ${isFull ? '<span class="stat-full-mark">满</span>' : ""}
      </span>
      <span class="stat-value">${Number(value || 0)}</span>
    </div>
  `;
}

function renderTermBadge(badge) {
  return `
    <span class="term-badge ${badge.kind} ${badge.isFull ? "full" : ""}">
      ${escapeHtml(badge.text)}
      ${badge.isFull ? '<span class="term-full-mark">满</span>' : ""}
    </span>
  `;
}

function dedupeByUid(products) {
  const seen = new Set();
  const output = [];
  for (const product of products) {
    const key = String(product.uid || product.id || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(product);
  }
  return output;
}

function getTierBucket(product) {
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 500) return "gold";
  if (legacyId >= 400) return "red";
  if (legacyId >= 300) return "orange";
  if (legacyId >= 200) return "purple";
  if (legacyId >= 100) return "blue";
  return "green";
}

function getProductCategory(product) {
  if (isAtlasBundle(product)) return "atlas";
  if (isBundle(product)) return "bundle";
  return getTierBucket(product);
}

function getCategoryDefinitions() {
  return {
    all: { label: "全部" },
    atlas: { label: "图鉴" },
    bundle: { label: "套餐" },
    gold: { label: "金卡" },
    red: { label: "红卡" },
    orange: { label: "橙卡" },
    purple: { label: "紫卡" },
    blue: { label: "蓝卡" },
    green: { label: "绿卡" },
  };
}

function buildCategoryEntries(products) {
  const defs = getCategoryDefinitions();
  const counts = products.reduce(
    (map, product) => {
      const key = getProductCategory(product);
      map[key] = (map[key] || 0) + 1;
      return map;
    },
    { all: products.length }
  );

  const orderedKeys = ["all", "atlas", "bundle", "gold", "red", "orange", "purple", "blue", "green"];
  return orderedKeys
    .filter((key) => key === "all" || Number(counts[key] || 0) > 0)
    .map((key) => ({
      key,
      label: defs[key].label,
      count: Number(counts[key] || 0),
    }));
}

function renderCategoryTabs(products) {
  const entries = buildCategoryEntries(products);
  const validKeys = new Set(entries.map((item) => item.key));
  if (!validKeys.has(activeCategory)) {
    activeCategory = "all";
  }

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

function filterProductsByCategory(products, category) {
  if (!category || category === "all") return products;
  return products.filter((product) => getProductCategory(product) === category);
}

function pickTierRepresentatives(cards, tiers) {
  const chosen = [];
  for (const tier of tiers) {
    const match = cards.find((item) => getTierBucket(item) === tier);
    if (match) chosen.push(match);
  }
  return chosen;
}

function pickBundlePreviewCards(bundle, products = allProducts.length ? allProducts : currentProducts) {
  const code = String(bundle.code || bundle.uid || "");
  const cards = products.filter((item) => !isBundle(item));
  const sortByAttack = (a, b) =>
    Number(b.attack_value || 0) - Number(a.attack_value || 0) ||
    Number(b.hp_value || 0) - Number(a.hp_value || 0) ||
    compareShopDefault(a, b);
  const sortByLegacyThenAttack = (a, b) =>
    Number(b.legacy_id || 0) - Number(a.legacy_id || 0) || sortByAttack(a, b);

  let selected = [];
  if (code === "atlas_orange_and_below") {
    const pool = cards
      .filter((item) => ["orange", "purple", "blue", "green"].includes(getTierBucket(item)))
      .sort(compareShopDefault);
    selected = [
      ...pickTierRepresentatives(pool, ["orange", "purple", "blue", "green"]),
      ...pool,
    ];
  } else if (code === "atlas_red_and_below") {
    const pool = cards
      .filter((item) => ["red", "orange", "purple", "blue"].includes(getTierBucket(item)))
      .sort(compareShopDefault);
    selected = [
      ...pickTierRepresentatives(pool, ["red", "orange", "purple", "blue"]),
      ...pool,
    ];
  } else if (code === "atlas_full_attack_set") {
    const pool = cards.filter((item) => Number(item.attack_value || 0) > 0).sort(sortByAttack);
    selected = [
      ...pickTierRepresentatives(pool, ["gold", "red", "orange", "purple", "blue", "green"]),
      ...pool,
    ];
  } else if (code === "atlas_high_attack_full_dex") {
    const pool = cards
      .filter((item) => Number(item.attack_value || 0) > 0)
      .sort(sortByLegacyThenAttack);
    selected = [
      ...pickTierRepresentatives(pool, ["gold", "red", "orange", "purple", "blue", "green"]),
      ...pool,
    ];
  }

  const fallback = cards.slice().sort(compareShopDefault);
  const targetSize =
    code === "atlas_full_attack_set" || code === "atlas_high_attack_full_dex" ? 6 : 4;
  return dedupeByUid([...selected, ...fallback]).slice(0, targetSize);
}

function renderBundleCollage(bundle, variant = "grid") {
  const previewCards = pickBundlePreviewCards(bundle);
  const imageClass = variant === "detail" ? "bundle-detail-collage-image" : "bundle-collage-image";
  const layoutClass = previewCards.length >= 6 ? "bundle-collage-six" : "bundle-collage-four";

  if (previewCards.length === 0) {
      return `
      <div class="bundle-collage bundle-collage-empty ${layoutClass}">
        <img
          class="${imageClass}"
          src="${createImageFallbackSvg(bundle.name, "bundle")}"
          alt="${escapeHtml(bundle.name)}"
          data-fallbacks=""
          data-placeholder="${createImageFallbackSvg(bundle.name, "bundle")}"
        />
      </div>
    `;
  }

  return `
    <div class="bundle-collage ${layoutClass}">
      ${previewCards
        .map((card, index) => {
          const image = getImagePayload(card, "card");
          return `
            <div class="bundle-collage-slot slot-${index + 1}">
              <img
                class="${imageClass}"
                src="${image.src}"
                alt="${escapeHtml(card.name)}"
                data-fallbacks="${image.fallbacks.join("|")}"
                data-placeholder="${image.placeholder}"
              />
            </div>
          `;
        })
        .join("")}
      <div class="bundle-collage-gloss"></div>
    </div>
  `;
}

function renderProductVisual(product, variant = "grid") {
  const image = getImagePayload(product, product.item_kind);
  const imageClass = variant === "detail" ? "product-detail-image" : "product-image";
  if (isBundle(product) && !product.image_url) {
    return renderBundleCollage(product, variant);
  }

  return `
    <img
      class="${imageClass}"
      src="${image.src}"
      alt="${escapeHtml(product.name)}"
      data-fallbacks="${image.fallbacks.join("|")}"
      data-placeholder="${image.placeholder}"
    />
  `;
}

function compareShopDefault(a, b) {
  if (isBundle(a) || isBundle(b)) {
    if (isBundle(a) && isBundle(b)) {
      return Number(a.display_rank || 999) - Number(b.display_rank || 999);
    }
    return isBundle(a) ? -1 : 1;
  }

  const legacyDiff = Number(b.legacy_id || 0) - Number(a.legacy_id || 0);
  if (legacyDiff !== 0) return legacyDiff;

  const termCountDiff = getTermCount(b) - getTermCount(a);
  if (termCountDiff !== 0) return termCountDiff;

  const aTerms = parseTermValues(a);
  const bTerms = parseTermValues(b);
  const totalTermDiff = bTerms.fire + bTerms.calm - (aTerms.fire + aTerms.calm);
  if (totalTermDiff !== 0) return totalTermDiff;

  const fireDiff = bTerms.fire - aTerms.fire;
  if (fireDiff !== 0) return fireDiff;

  const calmDiff = bTerms.calm - aTerms.calm;
  if (calmDiff !== 0) return calmDiff;

  const attackDiff = Number(b.attack_value || 0) - Number(a.attack_value || 0);
  if (attackDiff !== 0) return attackDiff;

  const hpDiff = Number(b.hp_value || 0) - Number(a.hp_value || 0);
  if (hpDiff !== 0) return hpDiff;

  return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
}

function sortProducts(products, sortMode) {
  const list = [...products];
  const sorters = {
    shop_default: compareShopDefault,
    price_asc: (a, b) =>
      Number(a.price_quota || 0) - Number(b.price_quota || 0) || compareShopDefault(a, b),
    price_desc: (a, b) =>
      Number(b.price_quota || 0) - Number(a.price_quota || 0) || compareShopDefault(a, b),
    attack_asc: (a, b) =>
      Number(a.attack_value || 0) - Number(b.attack_value || 0) ||
      Number(a.hp_value || 0) - Number(b.hp_value || 0) ||
      compareShopDefault(a, b),
    hp_asc: (a, b) =>
      Number(a.hp_value || 0) - Number(b.hp_value || 0) ||
      Number(a.attack_value || 0) - Number(b.attack_value || 0) ||
      compareShopDefault(a, b),
  };

  list.sort(sorters[sortMode] || sorters.shop_default);
  return list;
}

function applyProductView() {
  const filtered = filterProductsByCategory(allProducts, activeCategory);
  currentProducts = sortProducts(filtered, sortSelect.value);
  renderCategoryTabs(allProducts);
  renderProducts(currentProducts);
}

function renderProducts(products) {
  if (!products || products.length === 0) {
    productGrid.innerHTML = '<div class="stack-item">当前分类下没有已上架商品。</div>';
    return;
  }

  productGrid.innerHTML = products
    .map((product) => {
      const theme = getLegacyTheme(product);
      const termBadges = parseTermBadges(product.ext_attrs, product);
      const stockLabel =
        product.stock === null || product.stock === undefined
          ? "不限量"
          : `库存 ${Number(product.stock || 0)}`;
      const subtitle = isBundle(product)
        ? `${theme.label} / ${escapeHtml(product.uid || "")}`
        : `${theme.label} / ID ${product.legacy_id}`;
      const bodyHtml = isBundle(product)
        ? `<div class="product-meta">${escapeHtml(product.description || product.main_attrs || "套餐商品")}</div>`
        : `
            <div class="product-stats-grid">
              ${renderStatBlock("攻击", product.attack_value, isAttackFull(product))}
              ${renderStatBlock("血量", product.hp_value, isHpFull(product))}
            </div>
          `;

      return `
        <article
          class="product-card"
          style="--product-border:${theme.border};--product-glow:${theme.glow};--product-top:${theme.top};--product-bottom:${theme.bottom};--product-badge:${theme.badge};"
        >
          <div class="product-cover">
            ${renderProductVisual(product, "grid")}
            <div class="product-cover-overlay"></div>
          </div>
          <div>
            <div class="product-headline">
              <div class="product-name">${escapeHtml(product.name)}</div>
              <div class="product-type-chip">${subtitle}</div>
            </div>
            ${bodyHtml}
            <div class="term-row">
              ${
                termBadges.length > 0
                  ? termBadges
                      .map((badge) => renderTermBadge(badge))
                      .join("")
                  : '<span class="term-empty">无额外标签</span>'
              }
            </div>
          </div>
          <div class="chip-row">
            <span class="chip">价格 ${Number(product.price_quota || 0)} 额度</span>
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
}

function renderProfile(profile, quota, orders) {
  if (!profile) {
    accountProfile.innerHTML = '<div class="stack-item">?????</div>';
    quotaBalance.textContent = "-";
    orderList.innerHTML = '<div class="stack-item">???????</div>';
    return;
  }

  accountProfile.innerHTML = [
    `????${escapeHtml(profile.game_role_name)}` ,
    `?? ID?${escapeHtml(profile.game_role_id)}` ,
    `???${escapeHtml(profile.auth_provider === "password" ? "-" : profile.game_server)}` ,
    `???${escapeHtml(profile.role)}` ,
    `?????${escapeHtml(profile.auth_provider === "password" ? "????" : "????")}` ,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  quotaBalance.textContent = String(quota?.balance ?? profile.quota_balance ?? 0);

  if (!orders || orders.length === 0) {
    orderList.innerHTML = '<div class="stack-item">?????</div>';
    return;
  }

  orderList.innerHTML = orders
    .map((order) => {
      const itemNames = (order.items || []).map((item) => item.product_name).join(" / ");
      const remark = order.remark
        ? `<div class="muted">???${escapeHtml(order.remark)}</div>`
        : "";
      const actions =
        order.status === "pending"
          ? `
            <div class="actions">
              <button class="ghost request-cancel-btn" type="button" data-order-id="${order.id}">
                ????
              </button>
            </div>
          `
          : order.status === "cancel_requested"
            ? '<div class="muted">????????????????</div>'
            : "";

      return `
        <div class="stack-item">
          <div>?? #${order.id} / ${escapeHtml(order.status)}</div>
          <div class="muted">???${escapeHtml(itemNames || "-")}</div>
          <div class="muted">???${Number(order.total_quota || 0)} / ?????${formatDate(order.created_at)}</div>
          ${remark}
          ${actions}
        </div>
      `;
    })
    .join("");
}
function findProduct(itemId, itemKind) {
  return (
    currentProducts.find(
      (item) => Number(item.item_id) === Number(itemId) && String(item.item_kind) === String(itemKind)
    ) || null
  );
}

function openProductModal(itemId, itemKind) {
  const product = findProduct(itemId, itemKind);
  if (!product) return;

  activeItemId = Number(product.item_id);
  activeItemKind = product.item_kind || "card";
  setProductDetailMessage("");

  const theme = getLegacyTheme(product);
  const termBadges = parseTermBadges(product.ext_attrs, product);
  const session = loadSession();
  const stockLabel =
    product.stock === null || product.stock === undefined ? "不限量" : `${Number(product.stock)} 件`;

  const detailRows = isBundle(product)
    ? `
        <div class="detail-row"><strong>类型</strong><span>套餐 SKU</span></div>
        <div class="detail-row"><strong>编码</strong><span>${escapeHtml(product.uid || "-")}</span></div>
        <div class="detail-row"><strong>库存</strong><span>${escapeHtml(stockLabel)}</span></div>
      `
    : `
        <div class="detail-row"><strong>攻击</strong><span>${Number(product.attack_value || 0)}</span></div>
        <div class="detail-row"><strong>血量</strong><span>${Number(product.hp_value || 0)}</span></div>
        <div class="detail-row"><strong>库存</strong><span>${escapeHtml(stockLabel)}</span></div>
      `;

  productDetailBody.innerHTML = `
    <div
      class="product-detail-layout"
      style="--product-border:${theme.border};--product-glow:${theme.glow};--product-top:${theme.top};--product-bottom:${theme.bottom};--product-badge:${theme.badge};"
    >
      <div class="product-detail-cover">
        ${renderProductVisual(product, "detail")}
      </div>
      <div class="product-detail-main">
        <div class="product-headline">
          <div class="product-name">${escapeHtml(product.name)}</div>
          <div class="product-type-chip">${theme.label} / ${escapeHtml(product.uid || "-")}</div>
        </div>
        ${
          isBundle(product)
            ? `<div class="product-meta">${escapeHtml(product.description || product.main_attrs || "套餐商品")}</div>`
            : ""
        }
        <div class="term-row">
          ${
            termBadges.length > 0
              ? termBadges
                  .map((badge) => renderTermBadge(badge))
                  .join("")
              : '<span class="term-empty">无额外标签</span>'
          }
        </div>
        <div class="detail-list">
          <div class="detail-row"><strong>价格</strong><span>${Number(product.price_quota || 0)} 额度</span></div>
          ${detailRows}
          <div class="detail-row"><strong>购买账号</strong><span>${session?.profile?.game_role_name || "未绑定"}</span></div>
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
  applyProductView();
}

async function loadAccount() {
  const session = loadSession();
  if (!session?.token) {
    renderSessionSummary(null);
    renderProfile(null, null, []);
    return;
  }

  try {
    const profile = await apiFetch("/auth/me");
    const quota = await apiFetch("/me/quota");
    const orders = await apiFetch("/me/orders");
    saveSession({ ...session, profile });
    renderSessionSummary(profile);
    renderProfile(profile, quota, orders);
  } catch (error) {
    clearSession();
    renderSessionSummary(null);
    renderProfile(null, null, []);
    setNotice(`会话已失效：${error.message}`, "error");
  }
}

async function bindAccount(event) {
  event.preventDefault();
  setNotice("正在绑定...", "");
  try {
    const payload = {
      game_role_id: bindRoleIdInput.value.trim(),
      game_server: bindServerInput.value.trim(),
      game_role_name: bindRoleNameInput.value.trim(),
      bind_token_id: bindTokenIdInput.value.trim(),
      nickname: bindNicknameInput.value.trim(),
    };
    const result = await apiFetch("/auth/game/bind", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    saveSession(result);
    setNotice("绑定成功，已保存登录状态。", "success");
    await loadAccount();
  } catch (error) {
    setNotice(`绑定失败：${error.message}`, "error");
  }
}

async function registerAccount(event) {
  event.preventDefault();
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
    await loadAccount();
  } catch (error) {
    setNotice(`注册失败：${error.message}`, "error");
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
    await loadAccount();
  } catch (error) {
    setNotice(`登录失败：${error.message}`, "error");
  }
}

async function confirmPurchase() {
  const session = loadSession();
  if (!session?.token) {
    setProductDetailMessage("???????????", "error");
    setNotice("???????????", "error");
    window.location.hash = "bind";
    return;
  }

  const product = findProduct(activeItemId, activeItemKind);
  if (!product) {
    setProductDetailMessage("????????????", "error");
    return;
  }

  const currentQuota = getCurrentQuotaValue();
  const price = Number(product.price_quota || 0);
  if (currentQuota !== null && currentQuota < price) {
    setProductDetailMessage(`??????? ${price - currentQuota}?`, "error");
    return;
  }

  const remaining = currentQuota === null ? null : currentQuota - price;
  const confirmed = window.confirm([
    `?????${product.name}`,
    `?????${price}`,
    remaining === null ? "??????????" : `??????${remaining}`,
  ].join("\n"));

  if (!confirmed) {
    setProductDetailMessage("??????");
    return;
  }

  try {
    const order = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        item_id: Number(activeItemId),
        item_kind: activeItemKind,
      }),
    });
    const latestQuota = await apiFetch("/me/quota");
    const nextBalance = Number(latestQuota?.balance ?? remaining ?? 0);
    setNotice(`??????? #${order.id} ????`, "success");
    setProductDetailMessage(`??? ${price} ??????? ${nextBalance}?`, "success");
    closeProductModal();
    await Promise.all([loadProducts(), loadAccount()]);
  } catch (error) {
    const message = pickErrorMessage(error, "????");
    setProductDetailMessage(`?????${message}`, "error");
    setNotice(`?????${message}`, "error");
  }
}

async function requestCancelOrder(orderId) {
  const confirmed = window.confirm("?????????????????????");
  if (!confirmed) return;

  try {
    await apiFetch(`/orders/${orderId}/cancel-request`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setNotice(`?? #${orderId} ????????`, "success");
    await loadAccount();
  } catch (error) {
    const message = pickErrorMessage(error, "??????");
    setNotice(`???????${message}`, "error");
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

document.getElementById("reload-products-btn").addEventListener("click", () => {
  loadProducts().catch((error) => setNotice(`商品刷新失败：${error.message}`, "error"));
});
document.getElementById("save-helper-origin-btn").addEventListener("click", () => {
  setHelperOrigin(helperOriginInput.value.trim());
  setNotice("helper 地址已保存。", "success");
});
document.getElementById("open-helper-btn").addEventListener("click", openHelper);
document.getElementById("logout-btn").addEventListener("click", () => {
  clearSession();
  renderSessionSummary(null);
  renderProfile(null, null, []);
  setNotice("已退出登录。", "success");
});
document.getElementById("close-product-detail-btn").addEventListener("click", closeProductModal);

bindForm.addEventListener("submit", bindAccount);
registerForm.addEventListener("submit", registerAccount);
loginForm.addEventListener("submit", loginAccount);
keywordInput.addEventListener("input", () => {
  loadProducts().catch((error) => setNotice(`商品刷新失败：${error.message}`, "error"));
});
sortSelect.addEventListener("change", () => {
  applyProductView();
});
productCategoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.getAttribute("data-category") || "all";
  applyProductView();
});
productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".detail-btn, .buy-btn");
  if (!button) return;
  openProductModal(button.getAttribute("data-item-id"), button.getAttribute("data-item-kind"));
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

helperOriginInput.value = getHelperOrigin();
loadProducts().catch((error) => setNotice(`商品加载失败：${error.message}`, "error"));
loadAccount();
