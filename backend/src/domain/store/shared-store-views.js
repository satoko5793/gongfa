const { getStoreRuntime } = require("./core/runtime-context");

function getDep(name) {
  const runtime = getStoreRuntime();
  if (typeof runtime[name] !== "function" && runtime[name] === undefined) {
    throw new Error(`store_runtime_dependency_missing:${name}`);
  }
  return runtime[name];
}

function hydrateOrders(data, orders) {
  const clone = getDep("clone");
  return orders.map((order) => {
    const user = data.users.find((item) => item.id === order.user_id);
    const source = String(order?.order_source || "").trim();
    const preferGuestIdentity =
      (source === "guest_transfer" ||
        (source === "draw_service" &&
          String(order?.draw_service?.payment_method || "").trim() === "residual_transfer")) &&
      (order?.guest_game_role_id || order?.guest_game_role_name || order?.guest_nickname);
    return {
      ...clone(order),
      game_role_id: preferGuestIdentity
        ? order?.guest_game_role_id || user?.game_role_id || null
        : user?.game_role_id || order?.guest_game_role_id || null,
      game_server: preferGuestIdentity
        ? order?.guest_game_server || user?.game_server || null
        : user?.game_server || order?.guest_game_server || null,
      game_role_name: preferGuestIdentity
        ? order?.guest_game_role_name || user?.game_role_name || null
        : user?.game_role_name || order?.guest_game_role_name || null,
      nickname: preferGuestIdentity
        ? order?.guest_nickname || user?.nickname || null
        : user?.nickname || order?.guest_nickname || null,
      account_user_id: user?.id || null,
      account_game_role_id: user?.game_role_id || null,
      account_game_server: user?.game_server || null,
      account_game_role_name: user?.game_role_name || null,
      account_nickname: user?.nickname || null,
      order_source: order?.order_source || "mall",
      buyer_label: order?.buyer_label || null,
      items: clone(data.orderItems.filter((item) => item.order_id === order.id)),
    };
  });
}

function hydrateRechargeOrders(data, rechargeOrders) {
  const clone = getDep("clone");
  return rechargeOrders.map((order) => {
    const user = data.users.find((item) => item.id === order.user_id);
    const reviewer = data.users.find((item) => item.id === order.reviewed_by);
    const orderTitle =
      order.order_type === "season_member"
        ? "赛季会员"
        : order.order_type === "residual_transfer"
          ? "残卷转赠"
          : "普通充值";
    return {
      ...clone(order),
      order_title: orderTitle,
      game_role_id: user?.game_role_id || null,
      game_server: user?.game_server || null,
      game_role_name: user?.game_role_name || null,
      nickname: user?.nickname || null,
      reviewer_role_name: reviewer?.game_role_name || null,
    };
  });
}

function hydrateSingleOrder(data, order) {
  return hydrateOrders(data, [order])[0] || null;
}

function hydrateSingleRechargeOrder(data, rechargeOrder) {
  return hydrateRechargeOrders(data, [rechargeOrder])[0] || null;
}

function paginateItems(items, { limit = 20, offset = 0 } = {}) {
  const normalizedOffset = Math.max(Number(offset) || 0, 0);
  if (limit === null || limit === undefined) {
    return {
      total: items.length,
      items: items.slice(normalizedOffset),
    };
  }
  const normalizedLimit = Math.max(Number(limit) || 0, 0);
  return {
    total: items.length,
    items: items.slice(normalizedOffset, normalizedOffset + normalizedLimit),
  };
}

function filterOrdersForAdmin(data, { userId = null, orderId = null, status = null, keyword = "" } = {}) {
  let orders = data.orders.slice();
  if (orderId !== null) {
    orders = orders.filter((item) => item.id === Number(orderId));
  }
  if (userId !== null) {
    const normalizedUserId = Number(userId);
    const linkedUser = data.users.find((item) => item.id === normalizedUserId);
    const linkedRoleId = String(linkedUser?.game_role_id || "").trim();
    orders = orders.filter((item) => {
      if (item.user_id === normalizedUserId) return true;
      return (
        item.user_id === null &&
        String(item?.order_source || "").trim() === "guest_transfer" &&
        linkedRoleId &&
        String(item?.guest_game_role_id || "").trim() === linkedRoleId
      );
    });
  }
  if (status !== null && status !== undefined && status !== "" && status !== "all") {
    orders = orders.filter((item) => item.status === status);
  }
  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  if (trimmedKeyword) {
    orders = orders.filter((order) => {
      const user = data.users.find((item) => item.id === order.user_id);
      const items = data.orderItems.filter((item) => item.order_id === order.id);
      return [
        String(order.id),
        order?.buyer_label,
        order?.order_source,
        order?.remark,
        order?.guest_game_role_id,
        order?.guest_game_role_name,
        order?.guest_nickname,
        order?.payment_reference,
        order?.payment_channel,
        String(order?.payment_amount_yuan || ""),
        user?.game_role_id,
        user?.game_server,
        user?.game_role_name,
        user?.nickname,
        ...items.map((item) => item.product_name),
        ...items.map((item) => String(item.product_id)),
        ...items.map((item) => String(item.bundle_sku_id)),
        ...items.map((item) => item.item_kind),
        JSON.stringify(order?.draw_service || {}),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }
  orders.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return orders;
}

function filterRechargeOrdersForAdmin(
  data,
  { userId = null, rechargeOrderId = null, status = null, keyword = "" } = {}
) {
  let rechargeOrders = (data.rechargeOrders || []).slice();
  if (rechargeOrderId !== null) {
    rechargeOrders = rechargeOrders.filter((item) => item.id === Number(rechargeOrderId));
  }
  if (userId !== null) {
    rechargeOrders = rechargeOrders.filter((item) => item.user_id === Number(userId));
  }
  if (status !== null && status !== undefined && status !== "" && status !== "all") {
    rechargeOrders = rechargeOrders.filter((item) => item.status === status);
  }
  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  if (trimmedKeyword) {
    rechargeOrders = rechargeOrders.filter((order) => {
      const user = data.users.find((item) => item.id === order.user_id);
      return [
        String(order.id),
        user?.game_role_id,
        user?.game_server,
        user?.game_role_name,
        user?.nickname,
        order.payment_reference,
        order.payer_note,
        order.admin_remark,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }
  rechargeOrders.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return rechargeOrders;
}

function filterAuditLogsForAdmin(data, { keyword = "", action = "" } = {}) {
  let logs = (data.auditLogs || []).slice();
  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  const trimmedAction = String(action || "").trim().toLowerCase();
  if (trimmedAction && trimmedAction !== "all") {
    logs = logs.filter((log) => String(log.action || "").toLowerCase() === trimmedAction);
  }
  if (trimmedKeyword) {
    logs = logs.filter((log) => {
      const actor = data.users.find((item) => item.id === log.actor_user_id);
      return [
        log.action,
        log.target_type,
        String(log.target_id || ""),
        actor?.game_role_name,
        actor?.nickname,
        JSON.stringify(log.detail || {}),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }
  logs.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return logs;
}

function filterQuotaLogsForAdmin(data, { userId = null, keyword = "", type = "" } = {}) {
  let logs = (data.quotaLogs || []).slice();
  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  const trimmedType = String(type || "").trim().toLowerCase();
  if (userId !== null && userId !== undefined && userId !== "") {
    logs = logs.filter((item) => Number(item.user_id) === Number(userId));
  }
  if (trimmedType && trimmedType !== "all") {
    logs = logs.filter((item) => String(item.type || "").toLowerCase() === trimmedType);
  }
  if (trimmedKeyword) {
    logs = logs.filter((log) => {
      const user = data.users.find((item) => Number(item.id) === Number(log.user_id));
      return [
        user?.game_role_id,
        user?.game_role_name,
        user?.game_server,
        log.type,
        String(log.order_id || ""),
        log.remark,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }
  logs.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return logs;
}

module.exports = {
  hydrateOrders,
  hydrateRechargeOrders,
  hydrateSingleOrder,
  hydrateSingleRechargeOrder,
  paginateItems,
  filterOrdersForAdmin,
  filterRechargeOrdersForAdmin,
  filterAuditLogsForAdmin,
  filterQuotaLogsForAdmin,
};
