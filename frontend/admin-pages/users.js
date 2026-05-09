import { renderUsersSection } from "../admin-renderers/users.js?v=release-20260509-160631";

export async function loadUsersPage(context) {
  await context.loadUsers({ page: context.paginationState.users.page });
  context.markPageLoaded("users");
}

export function bindUsersPageEvents(context) {
  const {
    refs,
    apiFetch,
    setMessage,
    pickErrorMessage,
    guardAdminWriteAccess,
    setLinkedOrderUser,
    activateAdminPage,
    resetPagedState,
    reloadAll,
    loadUsers,
    getAllUsers,
  } = context;

  refs.usersRoot?.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-user-id]");
    if (!card) return;
    const userId = Number(card.getAttribute("data-user-id"));
    const user = getAllUsers().find((item) => Number(item.id) === userId) || null;

    try {
      if (event.target.closest(".view-user-orders-btn")) {
        setLinkedOrderUser(user);
        if (refs.adminOrderStatusFilter) refs.adminOrderStatusFilter.value = "all";
        resetPagedState("orders");
        resetPagedState("quotaLogs");
        await activateAdminPage("orders", { force: true });
        document.querySelector('[data-admin-page-panel="orders"]')?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        setMessage(`已切换到用户 ${user?.game_role_name || userId} 的订单视图。`, "success");
        return;
      }
      if (!guardAdminWriteAccess()) return;

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
        return;
      }

      if (event.target.closest(".save-helper-capabilities-btn")) {
        const helperCapabilities = [...card.querySelectorAll("[data-helper-capability]:checked")]
          .map((input) => String(input.getAttribute("data-helper-capability") || "").trim())
          .filter(Boolean);
        await apiFetch(`/admin/users/${userId}/helper-capabilities`, {
          method: "PATCH",
          body: JSON.stringify({ helper_capabilities: helperCapabilities }),
        });
        setMessage(`用户 #${userId} helper 授权已更新。`, "success");
        await loadUsers({ page: context.paginationState.users.page });
      }
    } catch (error) {
      setMessage(`用户更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
    }
  });

  refs.adminUserKeywordInput?.addEventListener("input", () => {
    resetPagedState("users");
    loadUsers({ page: 1 }).catch((error) =>
      setMessage(`用户加载失败：${pickErrorMessage(error, "加载失败")}`, "error")
    );
  });
}

export function renderUsersPage(context) {
  renderUsersSection(context);
}
