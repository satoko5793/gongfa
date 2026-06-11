import { apiFetch, escapeHtml } from "./shared.js?v=release-20260611-151806";
import {
  cashToResidual,
  quotaToCash,
} from "./payment-conversion.js?v=release-20260611-151806";

let liteRechargeConfig = null;

function formatCompactNumber(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0";
  if (Math.abs(numeric) >= 10000) {
    return `${(numeric / 10000).toFixed(numeric % 10000 === 0 ? 0 : 1)}w`;
  }
  return String(Math.round(numeric));
}

function formatCashAmount(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  if (Math.abs(numeric - Math.round(numeric)) < 0.001) return `¥${Math.round(numeric)}`;
  return `¥${numeric.toFixed(2)}`;
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
  return date.toLocaleString("zh-CN", { hour12: false });
}

function renderLiteGuideGlyph(type) {
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

function renderLiteGuideSteps(beginnerGuideSteps, profile) {
  if (!beginnerGuideSteps) return;
  const hasProfile = Boolean(profile);
  const steps = [
    {
      index: "01",
      type: "account",
      title: "注册并登录",
      status: hasProfile ? "done" : "current",
      label: hasProfile ? "已完成" : "当前推荐",
      description: hasProfile
        ? `当前账号：${escapeHtml(profile?.game_role_name || profile?.game_role_id || "已登录")}`
        : "先登录账号，后续充值、下单和查看订单都会跟着这个账号走。",
      href: "login.html",
      actionLabel: hasProfile ? "切换账号" : "去登录",
    },
    {
      index: "02",
      type: "recharge",
      title: "获取一次额度",
      status: "pending",
      label: "下一步",
      description: hasProfile
        ? "去个人后台完成残卷赠送或充值申请，审核通过后额度会自动到账。"
        : "登录后去个人后台完成残卷赠送或充值申请，审核通过后额度会自动到账。",
      href: "me.html#recharge",
      actionLabel: "去充值",
    },
    {
      index: "03",
      type: "order",
      title: "完成首单消费",
      status: "pending",
      label: "最后一步",
      description: "在商城挑一张合适的卡，确认购买后就算完成首单，奖励会自动补发。",
      href: "#products",
      actionLabel: "去选商品",
    },
  ];

  beginnerGuideSteps.innerHTML = steps
    .map(
      (step) => `
        <article class="flow-step tutorial-step ${step.status}">
          <div class="tutorial-step-top">
            <div class="tutorial-step-icon">${renderLiteGuideGlyph(step.type)}</div>
            <span class="tutorial-status ${step.status}">${step.label}</span>
          </div>
          <div class="flow-step-index">${step.index}</div>
          <div class="flow-step-title">${step.title}</div>
          <div class="muted">${step.description}</div>
          <a class="ghost-link tutorial-link" href="${step.href}">${step.actionLabel}</a>
        </article>
      `
    )
    .join("");
}

function getTierLabel(product) {
  const tier = String(product?.tier || product?.quality || "").trim().toLowerCase();
  if (tier === "gold") return "金";
  if (tier === "red") return "红";
  if (tier === "orange") return "橙";
  if (tier === "purple") return "紫";
  if (tier === "blue") return "蓝";
  if (tier === "green") return "绿";
  if (String(product?.item_kind || "").trim() === "bundle") return "套餐";
  return tier ? tier.toUpperCase() : "功法";
}

function getProductSubtitle(product) {
  const season = String(product?.season_label || product?.season_name || product?.season || "").trim();
  if (String(product?.item_kind || "").trim() === "bundle") {
    return `${getTierLabel(product)} / 套餐`;
  }
  return season ? `${getTierLabel(product)} / ${escapeHtml(season)}` : getTierLabel(product);
}

function getPriceLine(product) {
  const current = Number(product?.price_quota || 0);
  const original = Number(product?.original_price_quota || 0);
  const cashAmount = quotaToCash(current);
  const residualAmount = cashAmount === null ? null : cashToResidual(cashAmount, liteRechargeConfig);
  const cashChip = cashAmount === null ? "" : `<span class="chip accent soft">${escapeHtml(formatCashAmount(cashAmount))}</span>`;
  const residualChip =
    residualAmount === null
      ? ""
      : `<span class="chip subtle">${escapeHtml(`${residualAmount} ${liteRechargeConfig?.residual_unit_label || "残卷"}`)}</span>`;
  if (original > current) {
    return `
      <span class="chip original-price">原 ${formatCompactNumber(original)}</span>
      <span class="chip accent">额度 ${formatCompactNumber(current)}</span>
      ${cashChip}
      ${residualChip}
    `;
  }
  return `
    <span class="chip strong">额度 ${formatCompactNumber(current)}</span>
    ${cashChip}
    ${residualChip}
  `;
}

function renderLiteProductCard(product) {
  const imageUrl = String(product?.image_url || "").trim();
  const quotaPurchaseDisabled = Boolean(product?.quota_purchase_disabled);
  const quotaDisabledReason =
    product?.quota_purchase_disabled_reason ||
    "赛季首周，当赛季双词条金卡、2.5 及以上单词条金卡暂不支持额度购买，请使用转账锁卡或残卷转赠。";
  const imageBlock = imageUrl
    ? `<div class="product-image-shell grid"><img class="product-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product?.name || "商品")}" loading="lazy" /></div>`
    : `<div class="product-image-shell grid"><div class="product-visual fallback">${escapeHtml(
        product?.name || "商品"
      )}</div></div>`;

  return `
    <article class="product-card">
      <div class="product-cover">${imageBlock}</div>
      <div class="product-summary">
        <div class="product-headline">
          <div class="discount-title-line">
            <div class="product-name">${escapeHtml(product?.name || "未命名商品")}</div>
            ${
              Number(product?.original_price_quota || 0) > Number(product?.price_quota || 0)
                ? `<span class="chip discount">${escapeHtml(product?.discount_label || "限时折扣")}</span>`
                : ""
            }
          </div>
          <div class="product-type-chip">${getProductSubtitle(product)}</div>
        </div>
        <div class="product-meta">
          ${escapeHtml(product?.description || product?.main_attrs || "轻量预览已就绪，完整详情会在继续操作时自动加载。")}
        </div>
      </div>
      <div class="chip-row">
        ${getPriceLine(product)}
        ${
          product?.stock !== null && product?.stock !== undefined && Number(product.stock) <= 1
            ? `<span class="chip subtle">余量 ${Number(product.stock || 0)}</span>`
            : ""
        }
      </div>
      <div class="actions">
        <button class="ghost" type="button" data-lite-product-action="detail" data-lite-item-id="${Number(product?.item_id || product?.id || 0)}" data-lite-item-kind="${escapeHtml(product?.item_kind || "card")}">查看详情</button>
        <button class="primary" type="button" data-lite-product-action="wake" data-lite-item-id="${Number(product?.item_id || product?.id || 0)}" data-lite-item-kind="${escapeHtml(product?.item_kind || "card")}">${quotaPurchaseDisabled ? "转账/转卷锁卡" : "继续购买"}</button>
      </div>
    </article>
  `;
}

function renderLiteProductList(productGrid, items) {
  if (!productGrid) return;
  if (!items.length) {
    productGrid.innerHTML = '<div class="stack-item">商品正在补货中，稍后刷新完整商城查看。</div>';
    return;
  }
  productGrid.innerHTML = items.map((product) => renderLiteProductCard(product)).join("");
}

function renderLiteRecentSales(recentSalesList, items) {
  if (!recentSalesList) return;
  if (!items.length) {
    recentSalesList.innerHTML = `
      <div class="recent-sales-empty">
        <div class="panel-title">最近成交正在准备中</div>
        <div class="muted">轻量首页先展示商品预览，完整成交摘要会在完整商城接管后自动补齐。</div>
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
          <div class="recent-sale-title">${escapeHtml(item.buyer_label || "匿名用户")} 买下 ${escapeHtml(
            item.item_title || "已成交商品"
          )}</div>
          <div class="recent-sale-meta">
            <span>${escapeHtml(item.item_kind_label || "商品")} / ${Number(item.item_count || 1)} 项</span>
            <span>${Number(item.total_quota || 0)} 额度</span>
          </div>
        </article>
      `
    )
    .join("");
}

export function startShopLiteShell({
  profile,
  beginnerGuideSteps,
  productGrid,
  productPagination,
  recentSalesList,
  beginnerGuideSummary,
  beginnerGuideReward,
  beginnerCarouselTrack,
  beginnerGuideTabs = [],
  beginnerGuidePrevBtn,
  beginnerGuideNextBtn,
  wakeHeavyModule,
}) {
  let activeGuidePage = "tutorial";

  function renderLiteGuidePage() {
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

  function setGuidePage(page) {
    activeGuidePage = page === "sales" ? "sales" : "tutorial";
    renderLiteGuidePage();
  }

  function bindLiteGuideControls() {
    beginnerGuideTabs.forEach((button) => {
      button.addEventListener("click", () => {
        setGuidePage(button.getAttribute("data-guide-page-target") || "tutorial");
      });
    });
    beginnerGuidePrevBtn?.addEventListener("click", () => setGuidePage("tutorial"));
    beginnerGuideNextBtn?.addEventListener("click", () => setGuidePage("sales"));
  }

  if (beginnerGuideSummary) {
    beginnerGuideSummary.textContent = profile
      ? "欢迎回来，轻量商城已经先展示商品预览，继续筛选或购买时会自动切到完整商城。"
      : "轻量商城已先展示部分商品预览，登录后可继续购买、转账锁卡和查看完整新手流程。";
  }
  if (beginnerGuideReward) {
    beginnerGuideReward.textContent = profile ? "轻量商城已启动" : "登录后解锁完整流程";
  }
  renderLiteGuideSteps(beginnerGuideSteps, profile);
  if (productGrid) {
    productGrid.innerHTML = '<div class="stack-item">商品预览加载中...</div>';
  }
  if (productPagination) {
    productPagination.innerHTML =
      '<div class="muted">正在准备轻量商品预览，筛选、分页和完整详情会在需要时自动接管。</div>';
  }

  const wakeFromProductAction = async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const actionButton = target.closest("[data-lite-product-action]");
    if (!actionButton) return;
    const action = String(actionButton.getAttribute("data-lite-product-action") || "").trim();
    const itemId = Number(actionButton.getAttribute("data-lite-item-id") || 0);
    const itemKind = String(actionButton.getAttribute("data-lite-item-kind") || "card").trim() || "card";
    const originalLabel = actionButton.textContent || "";

    actionButton.setAttribute("disabled", "disabled");
    actionButton.textContent = action === "detail" ? "正在打开..." : "正在加载...";
    if (productPagination) {
      productPagination.innerHTML =
        '<div class="muted">正在切换到完整商城，商品详情和购买面板马上就绪...</div>';
    }

    try {
      await wakeHeavyModule();
      const appActions = window.__GONGFA_APP_ACTIONS__;
      if (action === "detail") {
        appActions?.openProductModal?.(itemId, itemKind);
      } else {
        appActions?.startDirectPurchase?.(itemId, itemKind);
      }
    } catch (_error) {
      actionButton.removeAttribute("disabled");
      actionButton.textContent = originalLabel;
      if (productPagination) {
        productPagination.innerHTML =
          '<div class="muted">完整商城加载失败，请再点一次或刷新页面后重试。</div>';
      }
    }
  };

  productGrid?.addEventListener("click", wakeFromProductAction);
  bindLiteGuideControls();
  renderLiteGuidePage();

  async function loadLiteStorefront() {
    try {
      const [products, recentSales, meta] = await Promise.all([
        apiFetch("/products?page=1&page_size=12"),
        apiFetch("/products/recent-sales?limit=8").catch(() => ({ items: [] })),
        apiFetch("/products/meta").catch(() => null),
      ]);
      liteRechargeConfig = meta?.recharge_config || null;
      const productItems = Array.isArray(products)
        ? products.slice(0, 12)
        : Array.isArray(products?.items)
          ? products.items
          : [];
      const recentSaleItems = Array.isArray(recentSales?.items) ? recentSales.items : [];
      renderLiteProductList(productGrid, productItems);
      renderLiteRecentSales(recentSalesList, recentSaleItems);
      if (productPagination) {
        const total = Array.isArray(products)
          ? products.length
          : Number(products?.total || productItems.length);
        productPagination.innerHTML = `
          <div class="muted">
            轻量首屏先展示 ${productItems.length} / ${total} 件商品，点击筛选、分页、详情或购买后会自动加载完整商城。
          </div>
        `;
      }
    } catch (error) {
      if (productGrid) {
        productGrid.innerHTML = `<div class="stack-item">商品预览加载失败：${escapeHtml(
          error?.message || "加载失败"
        )}</div>`;
      }
      if (productPagination) {
        productPagination.innerHTML =
          '<div class="muted">轻量预览加载失败，继续操作时会尝试拉起完整商城。</div>';
      }
    }
  }

  void loadLiteStorefront();

  return {
    loadLiteStorefront,
    setGuidePage,
  };
}
