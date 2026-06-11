const STATUS_LABELS = {
  submitted: "历史待上架",
  approved: "已上架",
  reserved: "交易中",
  rejected: "已拒绝",
  suspended: "已冻结",
  withdrawn: "已撤回",
};
const ESCROW_STATUS_LABELS = {
  awaiting_payment_review: "待确认收款",
  escrowed: "已托管待发货",
  delivered: "已发货",
  disputed: "纠纷中",
  completed: "已完成",
  refunded: "已退款",
  cancelled: "已取消",
};
const PAYMENT_REVIEW_LABELS = {
  manual_pending: "待人工确认",
  manual_confirmed: "人工已确认",
  rejected: "已驳回",
  auto_confirmed: "自动确认",
  not_required: "无需审核",
};
const PAYMENT_METHOD_LABELS = {
  cash: "人民币转账",
  residual: "残卷转赠",
  quota: "额度支付",
};

function formatConsignmentPriceYuan(listing) {
  const price = Number(listing?.price_yuan ?? listing?.price_quota ?? 0);
  if (!Number.isFinite(price) || price <= 0) return "未填价格";
  return `${Number.isInteger(price) ? String(price) : price.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} 元`;
}

function formatEscrowAmount(trade) {
  const method = String(trade?.payment_method || "");
  if (method === "quota") return `${Number(trade?.amount || 0)} 额度`;
  if (method === "residual") return `${Number(trade?.transfer_amount || trade?.amount || 0)} ${trade?.transfer_unit || "残卷"}`;
  return `${Number(trade?.amount_yuan || trade?.amount || 0)} 元`;
}

export function renderConsignmentsSection(ctx) {
  const root = ctx.refs.consignmentsRoot;
  if (!root) return;
  const listings = ctx.getCurrentConsignmentList?.() || [];
  const escrowTrades = ctx.getCurrentEscrowTradeList?.() || [];
  const paymentReviews = ctx.getCurrentPaymentReviewList?.() || [];
  const pendingPaymentCount = paymentReviews.filter((trade) => trade?.payment_review?.pending).length;
  const paymentReviewHtml = `
    <div class="admin-section-subtitle">支付审核中心</div>
    <div class="admin-item-meta">额度支付已由站内账本自动托管；人民币转账和残卷转赠先在这里人工确认，后续接官方支付回调也复用这条队列。</div>
    <div class="chip-row">
      <span class="chip">待确认 ${Number(pendingPaymentCount)}</span>
      <span class="chip">队列 ${Number(paymentReviews.length)}</span>
    </div>
    ${
      paymentReviews.length
        ? paymentReviews
            .map((trade) => {
              const item = trade.item_snapshot || {};
              const review = trade.payment_review || {};
              const reviewStatus = String(review.status || "");
              const actions = [
                review.pending ? `<button type="button" class="primary admin-escrow-action-btn" data-escrow-id="${Number(trade.id || 0)}" data-escrow-action="payment_approve">确认已收款</button>` : "",
                review.pending ? `<button type="button" class="danger admin-escrow-action-btn" data-escrow-id="${Number(trade.id || 0)}" data-escrow-action="payment_reject">驳回付款</button>` : "",
              ].filter(Boolean).join("");
              return `
                <article class="admin-item ${review.pending ? "highlight" : ""}">
                  <div class="admin-item-main">
                    <div class="admin-item-title">支付 #${Number(trade.id || 0)} / ${ctx.escapeHtml(item.display_name || "功法")}</div>
                    <div class="admin-item-meta">
                      ${ctx.escapeHtml(PAYMENT_METHOD_LABELS[trade.payment_method] || trade.payment_method || "-")} / ${ctx.escapeHtml(formatEscrowAmount(trade))} / ${ctx.escapeHtml(PAYMENT_REVIEW_LABELS[reviewStatus] || reviewStatus || "-")}
                    </div>
                    <div class="admin-item-meta">买家：${ctx.escapeHtml(trade.buyer?.game_role_name || trade.buyer?.game_role_id || "-")} / 卖家：${ctx.escapeHtml(trade.seller?.game_role_name || trade.seller?.game_role_id || "-")}</div>
                    <div class="admin-item-meta">付款/转赠说明：${ctx.escapeHtml(trade.payment_reference || "-")}</div>
                    ${trade.buyer_note ? `<div class="admin-item-meta">买家备注：${ctx.escapeHtml(trade.buyer_note)}</div>` : ""}
                    ${review.admin_note ? `<div class="admin-item-meta">审核备注：${ctx.escapeHtml(review.admin_note)}</div>` : ""}
                    <div class="admin-item-meta">下单时间：${ctx.escapeHtml(ctx.formatDate(trade.created_at))}</div>
                  </div>
                  <div class="admin-item-actions">${actions || `<span class="chip">${ctx.escapeHtml(PAYMENT_REVIEW_LABELS[reviewStatus] || reviewStatus || "-")}</span>`}</div>
                </article>
              `;
            })
            .join("")
        : '<div class="empty-state">当前没有需要确认的转账或残卷支付。</div>'
    }
  `;
  const listingHtml = listings.length ? listings
    .map((listing) => {
      const item = listing?.item_snapshot || {};
      const seller = listing?.seller || {};
      const status = String(listing?.status || "");
      const canReview = status === "submitted";
      return `
        <article class="admin-item">
          <div class="admin-item-main">
            <div class="admin-item-title">${ctx.escapeHtml(item.display_name || "功法")}</div>
            <div class="admin-item-meta">
              卖家 ${ctx.escapeHtml(seller.game_role_name || seller.game_role_id || "-")} / ${ctx.escapeHtml(item.source_role_name || "-")} / ${ctx.escapeHtml(item.source_server || "-")}
            </div>
            <div class="admin-item-meta">${ctx.escapeHtml([item.main_attr_text, item.ext_attr_text].filter(Boolean).join(" · ") || "-")}</div>
            <div class="chip-row">
              <span class="chip">${ctx.escapeHtml(STATUS_LABELS[status] || status || "-")}</span>
              <span class="chip">价格 ${ctx.escapeHtml(formatConsignmentPriceYuan(listing))}</span>
              <span class="chip">${ctx.escapeHtml(ctx.formatDate(listing.updated_at || listing.created_at))}</span>
            </div>
            ${listing.seller_remark ? `<div class="admin-item-meta">备注：${ctx.escapeHtml(listing.seller_remark)}</div>` : ""}
            ${listing.review_note ? `<div class="admin-item-meta">管理备注：${ctx.escapeHtml(listing.review_note)}</div>` : ""}
          </div>
          <div class="admin-item-actions">
            <button type="button" class="ghost admin-consignment-review-btn" data-consignment-id="${Number(listing.id || 0)}" data-consignment-status="approved" ${canReview ? "" : "disabled"}>上架</button>
            <button type="button" class="ghost admin-consignment-review-btn" data-consignment-id="${Number(listing.id || 0)}" data-consignment-status="rejected" ${status === "submitted" ? "" : "disabled"}>拒绝历史申请</button>
            <button type="button" class="danger admin-consignment-review-btn" data-consignment-id="${Number(listing.id || 0)}" data-consignment-status="suspended" ${status === "approved" ? "" : "disabled"}>冻结</button>
          </div>
        </article>
      `;
    })
    .join("") : '<div class="empty-state">当前没有寄售申请。</div>';
  const escrowHtml = `
    <div class="admin-section-subtitle">担保交易处理</div>
    ${
      escrowTrades.length
        ? escrowTrades
            .map((trade) => {
              const item = trade.item_snapshot || {};
              const amount = formatEscrowAmount(trade);
              const actions = [
                trade.status === "awaiting_payment_review" ? `<button type="button" class="ghost admin-escrow-action-btn" data-escrow-id="${Number(trade.id || 0)}" data-escrow-action="payment_approve">确认收款</button>` : "",
                trade.status === "awaiting_payment_review" ? `<button type="button" class="ghost admin-escrow-action-btn" data-escrow-id="${Number(trade.id || 0)}" data-escrow-action="payment_reject">驳回</button>` : "",
                trade.status === "disputed" ? `<button type="button" class="ghost admin-escrow-action-btn" data-escrow-id="${Number(trade.id || 0)}" data-escrow-action="release">放款</button>` : "",
                trade.status === "disputed" ? `<button type="button" class="danger admin-escrow-action-btn" data-escrow-id="${Number(trade.id || 0)}" data-escrow-action="refund">退款</button>` : "",
                trade.status === "completed" && trade.settlement_status === "pending_manual" ? `<button type="button" class="ghost admin-escrow-action-btn" data-escrow-id="${Number(trade.id || 0)}" data-escrow-action="settlement">标记已结算</button>` : "",
              ].filter(Boolean).join("");
              return `
                <article class="admin-item">
                  <div class="admin-item-main">
                    <div class="admin-item-title">担保 #${Number(trade.id || 0)} / ${ctx.escapeHtml(item.display_name || "功法")}</div>
                    <div class="admin-item-meta">状态：${ctx.escapeHtml(ESCROW_STATUS_LABELS[trade.status] || trade.status || "-")} / 金额：${ctx.escapeHtml(amount)} / 结算：${ctx.escapeHtml(trade.settlement_status || "-")}</div>
                    <div class="admin-item-meta">买家：${ctx.escapeHtml(trade.buyer?.game_role_name || trade.buyer?.game_role_id || "-")} / 卖家：${ctx.escapeHtml(trade.seller?.game_role_name || trade.seller?.game_role_id || "-")}</div>
                    ${trade.payment_reference ? `<div class="admin-item-meta">付款备注：${ctx.escapeHtml(trade.payment_reference)}</div>` : ""}
                    ${trade.delivery_note ? `<div class="admin-item-meta">发货：${ctx.escapeHtml(trade.delivery_note)}</div>` : ""}
                    ${(trade.evidence || []).length ? `<div class="admin-item-meta">证据：${(trade.evidence || []).map((item) => `<a href="${ctx.escapeHtml(item.url)}" target="_blank" rel="noreferrer">图片</a>`).join(" / ")}</div>` : ""}
                  </div>
                  <div class="admin-item-actions">${actions}</div>
                </article>
              `;
            })
            .join("")
        : '<div class="empty-state">当前没有担保交易。</div>'
    }
  `;
  root.innerHTML = `${paymentReviewHtml}${listingHtml}${escrowHtml}`;
}
