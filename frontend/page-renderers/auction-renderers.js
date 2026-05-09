export function formatAuctionStatusLabel(status) {
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

export function formatAuctionCountdownDuration(targetTimeMs, nowMs = Date.now()) {
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

export function getAuctionCountdownMeta(auction, nowMs = Date.now()) {
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

export function renderAuctionCountdown(ctx, auction) {
  const meta = getAuctionCountdownMeta(auction);
  return `
    <div class="auction-countdown ${ctx.escapeHtml(meta.tone)}" data-auction-countdown-id="${auction.id}">
      <span class="auction-countdown-label">${ctx.escapeHtml(meta.label)}</span>
      <strong class="auction-countdown-value">${ctx.escapeHtml(meta.value)}</strong>
    </div>
  `;
}

export function renderAuctionBidQuickChips(ctx, nextMinBid) {
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
            >${ctx.escapeHtml(option.label)}</button>
          `
        )
        .join("")}
    </div>
  `;
}

export function renderAuctionZone(ctx, profile) {
  if (!ctx.auctionBody) return;

  if (ctx.auctionStatusTabs) {
    ctx.auctionStatusTabs.querySelectorAll("[data-auction-status]").forEach((button) => {
      button.classList.toggle(
        "active",
        String(button.getAttribute("data-auction-status") || "") === ctx.getActiveAuctionStatus()
      );
    });
  }

  const filteredAuctions = ctx
    .getCurrentAuctions()
    .filter((auction) => String(auction?.status || "").trim() === ctx.getActiveAuctionStatus());

  if (!filteredAuctions.length) {
    ctx.auctionBody.innerHTML = '<div class="stack-item">当前这个分组里还没有拍卖商品。</div>';
    return;
  }

  ctx.auctionBody.innerHTML = filteredAuctions
    .map((auction) => {
      const item = auction?.item || {};
      const termBadges = ctx.parseTermBadges(item?.ext_attrs, item);
      const myBid = ctx.getAuctionBidSummary(auction.id);
      const canBid = profile && String(auction?.status || "").trim() === "live";
      const suggestedBid = Number(auction?.next_min_bid_quota || auction?.starting_price_quota || 0);
      const currentPrice = Number(auction.current_price_quota || 0);
      const startingPrice = Number(auction.starting_price_quota || 0);
      const minIncrement = Number(auction.min_increment_quota || 0);
      const itemSubtitle = ctx.isBundle(item)
        ? `${ctx.getTierLabel(item)} / ${ctx.escapeHtml(item.uid || "")}`
        : `${ctx.getTierLabel(item)} / ID ${item.legacy_id || "-"} / ${ctx.escapeHtml(ctx.getSeasonDisplayText(item))}`;
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
            <div class="product-name">${ctx.escapeHtml(auction.title || item.name || `拍卖 #${auction.id}`)}</div>
            <span class="chip">${ctx.escapeHtml(formatAuctionStatusLabel(auction.status))}</span>
          </div>
          ${renderAuctionCountdown(ctx, auction)}
          <div class="auction-card-layout">
            <div class="auction-card-visual">
              ${item && item.name ? ctx.renderProductVisual(item, "grid") : '<div class="product-visual fallback">拍卖商品</div>'}
            </div>
            <div class="auction-card-main">
              <div class="auction-card-headline">
                <div class="product-name">${ctx.escapeHtml(item.name || "-")}</div>
                <div class="product-type-chip">${itemSubtitle}</div>
              </div>
              ${
                ctx.isBundle(item)
                  ? `<div class="product-meta">${ctx.escapeHtml(item.description || item.main_attrs || "套餐商品")}</div>`
                  : `
                    <div class="product-stats-grid compact">
                      ${ctx.renderStatBlock("攻击", item.attack_value, ctx.isAttackFull(item), true)}
                      ${ctx.renderStatBlock("血量", item.hp_value, ctx.isHpFull(item), true)}
                    </div>
                    <div class="term-row compact">
                      ${
                        termBadges.length > 0
                          ? termBadges.map((badge) => ctx.renderTermBadge(badge)).join("")
                          : '<span class="term-empty">无词条</span>'
                      }
                    </div>
                  `
              }
              <div class="auction-summary-grid">
                <div class="auction-summary-card primary">
                  <span class="label">当前最高价</span>
                  <strong>${currentPrice}</strong>
                  <span class="cash">${ctx.escapeHtml(ctx.getQuotaCashText(currentPrice))}</span>
                </div>
                <div class="auction-summary-card">
                  <span class="label">出价人</span>
                  <strong>${ctx.escapeHtml(auction.leading_bidder_label || "无")}</strong>
                  <span class="muted">共 ${Number(auction.bid_count || 0)} 次出价</span>
                </div>
              </div>
              <div class="auction-meta-row">
                <span>起拍 ${startingPrice}</span>
                <span>最低加价 ${minIncrement}</span>
                <span>下次最低 ${suggestedBid}</span>
              </div>
              <div class="auction-meta-note">${ctx.escapeHtml(myStatus)}</div>
            </div>
          </div>
          ${
            canBid
              ? `
                <div class="auction-bid-box">
                  ${renderAuctionBidQuickChips(ctx, suggestedBid)}
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
                        本次出价约 ${ctx.escapeHtml(ctx.getQuotaCashText(recommendedBid))}
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
