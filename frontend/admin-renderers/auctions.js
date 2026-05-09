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

export function renderAuctionsSection(context, auctions = context.getCurrentAuctionList()) {
  const { refs, escapeHtml, formatDate, hasAdminWriteAccess } = context;
  const { auctionsRoot } = refs;
  const canWrite = hasAdminWriteAccess();

  if (!auctionsRoot) return;
  if (!Array.isArray(auctions) || auctions.length === 0) {
    auctionsRoot.innerHTML = '<div class="stack-item">当前没有拍卖记录。</div>';
    return;
  }

  auctionsRoot.innerHTML = auctions
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
