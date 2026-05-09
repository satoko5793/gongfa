import { renderOrdersSection } from "../admin-renderers/orders.js?v=release-20260509-160631";

export async function loadOrdersPage(context) {
  await context.loadOrders({ page: context.paginationState.orders.page });
  context.markPageLoaded("orders");
}

export function bindOrdersPageEvents(context) {
  const {
    refs,
    apiFetch,
    setMessage,
    pickErrorMessage,
    guardAdminWriteAccess,
    canConfirmOrders,
    reloadAll,
    loadOrders,
    loadQuotaLogs,
    resetPagedState,
    renderLinkedOrderUserState,
    setLinkedOrderUser,
    getLinkedOrderUser,
    getActiveAdminPage,
  } = context;

  refs.ordersRoot?.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-order-id]");
    if (!card) return;
    const orderId = Number(card.getAttribute("data-order-id"));
    const remark = card.querySelector('[data-field="remark"]').value.trim();
    const returnedCardsText =
      card.querySelector('[data-field="draw-returned-cards"]')?.value?.trim() || "";
    const bestGoldCard = card.querySelector('[data-field="draw-best-gold"]')?.value?.trim() || "";

    try {
      if (event.target.closest(".confirm-order-btn")) {
        if (!canConfirmOrders()) {
          setMessage("当前账号没有确认订单权限。", "error");
          return;
        }
        await apiFetch(`/admin/orders/${orderId}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "confirmed",
            remark,
            returned_cards_text: returnedCardsText || null,
            best_gold_card: bestGoldCard || null,
          }),
        });
        setMessage(`订单 #${orderId} 已确认。`, "success");
        await reloadAll();
        return;
      }

      if (!guardAdminWriteAccess()) return;

      if (event.target.closest(".save-order-remark-btn")) {
        await apiFetch(`/admin/orders/${orderId}/remark`, {
          method: "PATCH",
          body: JSON.stringify({ remark }),
        });
        setMessage(`订单 #${orderId} 备注已保存。`, "success");
        await loadOrders();
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
      }
    } catch (error) {
      setMessage(`订单更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
    }
  });

  document.getElementById("reload-orders-btn")?.addEventListener("click", () => {
    resetPagedState("orders");
    loadOrders({ page: 1 }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
  });

  refs.linkedOrderUserState?.addEventListener("click", (event) => {
    if (!event.target.closest("#clear-linked-order-user-btn")) return;
    setLinkedOrderUser(null);
    if (refs.adminOrderKeywordInput) refs.adminOrderKeywordInput.value = "";
    renderLinkedOrderUserState();
    resetPagedState("orders");
    resetPagedState("quotaLogs");
    if (getActiveAdminPage() === "logs") {
      loadQuotaLogs({ page: 1 }).catch((error) =>
        setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error")
      );
    }
    loadOrders({ page: 1 }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
  });

  refs.adminOrderStatusFilter?.addEventListener("change", () => {
    resetPagedState("orders");
    loadOrders({ page: 1 }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
  });

  refs.adminOrderKeywordInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resetPagedState("orders");
    loadOrders({ page: 1 }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
  });

  refs.adminOrderKeywordInput?.addEventListener("input", () => {
    const linkedUser = getLinkedOrderUser();
    if (linkedUser && refs.adminOrderKeywordInput.value.trim() !== linkedUser.game_role_id) {
      setLinkedOrderUser(null);
      renderLinkedOrderUserState();
    }
  });
}

export function renderOrdersPage(context) {
  renderOrdersSection(context);
}
