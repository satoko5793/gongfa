import { renderConsignmentsSection } from "../admin-renderers/consignments.js?v=release-20260611-151806";

export async function loadConsignmentsPage(ctx) {
  const status = ctx.refs.adminConsignmentStatusFilter?.value || "all";
  const [result, escrowResult, paymentResult] = await Promise.all([
    ctx.apiFetch(`/admin/consignments?status=${encodeURIComponent(status)}`),
    ctx.apiFetch("/admin/escrow-trades?status=all").catch(() => ({ items: [] })),
    ctx.apiFetch("/admin/payment-reviews?status=all").catch(() => ({ items: [] })),
  ]);
  ctx.setCurrentConsignmentList(Array.isArray(result?.items) ? result.items : []);
  ctx.setCurrentEscrowTradeList?.(Array.isArray(escrowResult?.items) ? escrowResult.items : []);
  ctx.setCurrentPaymentReviewList?.(Array.isArray(paymentResult?.items) ? paymentResult.items : []);
  renderConsignmentsPage(ctx);
  ctx.markPageLoaded?.("consignments");
}

export function renderConsignmentsPage(ctx) {
  renderConsignmentsSection(ctx);
}

export function bindConsignmentsPageEvents(ctx) {
  ctx.refs.reloadConsignmentsBtn?.addEventListener("click", () => {
    loadConsignmentsPage(ctx).catch((error) => {
      ctx.setMessage(`寄售刷新失败：${ctx.pickErrorMessage(error, "刷新失败")}`, "error");
    });
  });
  ctx.refs.adminConsignmentStatusFilter?.addEventListener("change", () => {
    loadConsignmentsPage(ctx).catch((error) => {
      ctx.setMessage(`寄售刷新失败：${ctx.pickErrorMessage(error, "刷新失败")}`, "error");
    });
  });
  ctx.refs.consignmentsRoot?.addEventListener("click", (event) => {
    const escrowButton = event.target?.closest?.(".admin-escrow-action-btn");
    if (escrowButton) {
      if (!ctx.guardAdminWriteAccess?.("处理担保交易")) return;
      const tradeId = escrowButton.getAttribute("data-escrow-id");
      const action = escrowButton.getAttribute("data-escrow-action");
      const note = window.prompt("处理备注，可选", "") ?? "";
      let request = null;
      if (action === "payment_approve") {
        request = ctx.apiFetch(`/admin/escrow-trades/${tradeId}/payment-review`, {
          method: "PATCH",
          body: JSON.stringify({ approved: true, admin_note: note }),
        });
      } else if (action === "payment_reject") {
        request = ctx.apiFetch(`/admin/escrow-trades/${tradeId}/payment-review`, {
          method: "PATCH",
          body: JSON.stringify({ approved: false, admin_note: note }),
        });
      } else if (action === "refund" || action === "release") {
        request = ctx.apiFetch(`/admin/escrow-trades/${tradeId}/resolve`, {
          method: "PATCH",
          body: JSON.stringify({ resolution: action, note }),
        });
      } else if (action === "settlement") {
        request = ctx.apiFetch(`/admin/escrow-trades/${tradeId}/settlement`, {
          method: "PATCH",
          body: JSON.stringify({ note }),
        });
      }
      request
        ?.then(() => loadConsignmentsPage(ctx))
        .then(() => ctx.setMessage("担保交易已更新。", "success"))
        .catch((error) => {
          ctx.setMessage(`担保处理失败：${ctx.pickErrorMessage(error, "处理失败")}`, "error");
        });
      return;
    }
    const button = event.target?.closest?.(".admin-consignment-review-btn");
    if (!button) return;
    if (!ctx.guardAdminWriteAccess?.("审核寄售申请")) return;
    const listingId = button.getAttribute("data-consignment-id");
    const status = button.getAttribute("data-consignment-status");
    const reviewNote = window.prompt("审核备注，可选", "") ?? "";
    ctx.apiFetch(`/admin/consignments/${listingId}/review`, {
      method: "PATCH",
      body: JSON.stringify({ status, review_note: reviewNote }),
    })
      .then(() => loadConsignmentsPage(ctx))
      .then(() => ctx.setMessage("寄售状态已更新。", "success"))
      .catch((error) => {
        ctx.setMessage(`寄售状态更新失败：${ctx.pickErrorMessage(error, "更新失败")}`, "error");
      });
  });
}
