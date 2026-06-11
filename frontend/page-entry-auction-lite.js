import { apiFetch, formatDate } from "./shared.js?v=release-20260611-151806";
import { formatAuctionStatusLabel } from "./auction-formatters.js?v=release-20260611-151806";
import { renderDrawServiceZoneContent } from "./page-renderers/draw-service-renderers.js?v=release-20260611-151806";

const DRAW_SERVICE_MIN_QUOTA = 200;
const DRAW_SERVICE_STEP_QUOTA = 200;

function formatAuctionTimeLine(auction) {
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

export function startAuctionLiteShell({
  profile,
  auctionBody,
  auctionStatusTabs,
  drawServiceBody,
  drawServiceMessage,
  wakeHeavyModule = null,
}) {
  let activeAuctionStatus = "live";
  let liteAuctions = [];
  let liteQuota = null;
  let liteRechargeConfig = null;

  function renderLiteAuctionZone() {
    if (!auctionBody) return;

    auctionStatusTabs?.querySelectorAll("[data-auction-status]").forEach((button) => {
      button.classList.toggle(
        "active",
        String(button.getAttribute("data-auction-status") || "") === activeAuctionStatus
      );
    });

    const items = liteAuctions.filter(
      (auction) => String(auction?.status || "").trim() === activeAuctionStatus
    );
    if (!items.length) {
      auctionBody.innerHTML = '<div class="stack-item">当前这个分组里还没有拍卖商品。</div>';
      return;
    }

    auctionBody.innerHTML = items
      .map((auction) => {
        const item = auction?.item || {};
        const currentPrice = Number(auction?.current_price_quota || 0);
        const bidCount = Number(auction?.bid_count || 0);
        const nextMinBid = Number(auction?.next_min_bid_quota || auction?.starting_price_quota || 0);
        return `
          <article class="admin-card auction-card">
            <div class="admin-card-head">
              <div class="product-name">${auction?.title || item?.name || `拍卖 #${Number(auction?.id || 0)}`}</div>
              <span class="chip">${formatAuctionStatusLabel(auction?.status)}</span>
            </div>
            <div class="auction-summary-grid">
              <div class="auction-summary-card primary">
                <span class="label">当前最高价</span>
                <strong>${currentPrice}</strong>
                <span class="cash">下次最低 ${nextMinBid}</span>
              </div>
              <div class="auction-summary-card">
                <span class="label">当前状态</span>
                <strong>${auction?.leading_bidder_label || "暂无领先人"}</strong>
                <span class="muted">共 ${bidCount} 次出价</span>
              </div>
            </div>
            <div class="auction-meta-row">
              <span>${item?.name || "拍卖商品"}</span>
              <span>${formatAuctionTimeLine(auction)}</span>
            </div>
            <div class="stack-item muted">
              ${
                profile
                  ? "完整出价面板正在加载中，稍等片刻即可操作。"
                  : "登录后即可查看你的出价状态并参与拍卖。"
              }
            </div>
            <div class="actions">
              ${
                profile
                  ? '<button class="ghost" type="button" data-lite-auction-action="wake">进入完整出价面板</button>'
                  : '<a class="ghost-link" href="login.html">登录后参与拍卖</a>'
              }
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderLiteDrawService() {
    if (!drawServiceBody) return;
    if (drawServiceMessage) {
      drawServiceMessage.textContent = profile
        ? "轻量代抽面板已就绪，继续编辑额度或提交时会自动接管完整交互。"
        : "";
      drawServiceMessage.className = "notice";
    }
    drawServiceBody.innerHTML = renderDrawServiceZoneContent(
      {
        minQuota: DRAW_SERVICE_MIN_QUOTA,
        stepQuota: DRAW_SERVICE_STEP_QUOTA,
        rechargeConfig: liteRechargeConfig,
        drawServiceConfig: liteRechargeConfig?.draw_service || null,
        selectedTierKey: liteRechargeConfig?.draw_service?.default_tier_key || "tier_8",
        selectedDrawWan: liteRechargeConfig?.draw_service?.min_draw_wan || 1,
      },
      profile || null,
      liteQuota,
      {
        tierKey: liteRechargeConfig?.draw_service?.default_tier_key || "tier_8",
        drawAmountWan: liteRechargeConfig?.draw_service?.min_draw_wan || 1,
      }
    );
  }

  async function loadLiteAuctionsAndQuota() {
    try {
      const [auctionResult, quotaResult, metaResult] = await Promise.all([
        apiFetch("/products/auctions"),
        profile ? apiFetch("/me/quota").catch(() => null) : Promise.resolve(null),
        apiFetch("/products/meta").catch(() => null),
      ]);
      liteAuctions = Array.isArray(auctionResult?.items) ? auctionResult.items : [];
      liteQuota = quotaResult && typeof quotaResult === "object" ? quotaResult : null;
      liteRechargeConfig = metaResult?.recharge_config || null;
      renderLiteAuctionZone();
      renderLiteDrawService();
    } catch (error) {
      liteAuctions = [];
      if (auctionBody) {
        auctionBody.innerHTML = `<div class="stack-item">拍卖列表加载失败：${error?.message || "加载失败"}</div>`;
      }
      renderLiteDrawService();
    }
  }

  function bindLiteAuctionTabs() {
    auctionStatusTabs?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-auction-status]");
      if (!button) return;
      activeAuctionStatus =
        String(button.getAttribute("data-auction-status") || "live").trim() || "live";
      renderLiteAuctionZone();
    });
  }

  function bindLiteAuctionWake() {
    if (!auctionBody || typeof wakeHeavyModule !== "function") return;
    auctionBody.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-lite-auction-action='wake']")) return;
      wakeHeavyModule();
    });
  }

  function bindLiteDrawWake() {
    if (!drawServiceBody || typeof wakeHeavyModule !== "function") return;
    ["submit", "input", "focusin", "click"].forEach((eventName) => {
      drawServiceBody.addEventListener(
        eventName,
        (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          if (
            target.closest("#draw-service-form") ||
            target.closest("[data-draw-service-tier-key]") ||
            target.closest("[data-draw-service-wan]") ||
            target.closest("#draw-service-wan-input")
          ) {
            wakeHeavyModule();
          }
        },
        { passive: eventName !== "submit" }
      );
    });
  }

  renderLiteDrawService();
  renderLiteAuctionZone();
  bindLiteAuctionTabs();
  bindLiteAuctionWake();
  bindLiteDrawWake();
  void loadLiteAuctionsAndQuota();

  return {
    loadLiteAuctionsAndQuota,
    renderLiteAuctionZone,
    renderLiteDrawService,
  };
}
