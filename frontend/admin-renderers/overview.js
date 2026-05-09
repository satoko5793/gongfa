import { ORDER_STATUS, RECHARGE_ORDER_STATUS } from "../app-constants.js?v=release-20260509-160631";

export function renderSessionView(
  refs,
  { session, profile, markDebugSession, getAdminRoleLabel, applyAdminAccessMode, hasAdminReadAccess, hasAdminWriteAccess, escapeHtml }
) {
  if (!session?.token) {
    markDebugSession("no_token");
    refs.adminSession.innerHTML =
      '<div class="stack-item">当前未登录。可直接在后台页输入管理员或海报只读账号的游戏 ID 和密码登录。</div>';
    applyAdminAccessMode();
    return { canRead: false, canWrite: false };
  }

  if (!profile) {
    markDebugSession("token_without_profile");
    refs.adminSession.innerHTML = '<div class="stack-item">已检测到登录态，但当前无法读取管理员资料。</div>';
    applyAdminAccessMode();
    return { canRead: false, canWrite: false };
  }

  markDebugSession(`token role=${profile.role || "-"}`);
  const canRead = hasAdminReadAccess(profile);
  const canWrite = hasAdminWriteAccess(profile);

  refs.adminSession.innerHTML = [
    `当前账号：${escapeHtml(profile.game_role_name || "-")}`,
    `游戏 ID：${escapeHtml(profile.game_role_id || "-")}`,
    `区服：${escapeHtml(profile.game_server || "-")}`,
    `角色：${escapeHtml(getAdminRoleLabel(profile.role || "-"))}`,
    `当前额度：${Number(profile.quota_balance || 0)}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  applyAdminAccessMode();
  return { canRead, canWrite };
}

export function renderOverviewSection(refs, overviewData, { escapeHtml }) {
  const onSaleCount = Number(overviewData?.products?.on_sale || 0);
  const discountedCount = Number(overviewData?.products?.discounted || 0);
  const pendingOrderCount = Number(overviewData?.alerts?.pending_orders || 0);
  const cancelReviewCount = Number(overviewData?.alerts?.cancel_reviews || 0);
  const rechargeReviewCount = Number(overviewData?.alerts?.recharge_reviews || 0);
  const activeUsers = Number(overviewData?.users?.active || 0);
  const totalQuota = Number(overviewData?.users?.total_quota || 0);

  const cards = [
    { label: "商品总数", value: Number(overviewData?.products?.total || 0), hint: `上架中 ${onSaleCount}` },
    { label: "打折商品", value: discountedCount, hint: "当前折扣管理" },
    { label: "套餐总数", value: Number(overviewData?.bundles?.total || 0), hint: "独立 SKU" },
    { label: "用户总数", value: Number(overviewData?.users?.total || 0), hint: `活跃 ${activeUsers}` },
    { label: "待处理订单", value: pendingOrderCount, hint: "交易处理" },
    { label: "待审取消", value: cancelReviewCount, hint: "商品订单" },
    { label: "待审充值", value: rechargeReviewCount, hint: "充值申请" },
    { label: "用户总额度", value: totalQuota, hint: "当前可用额度汇总" },
  ];

  refs.adminOverview.innerHTML = cards
    .map(
      (card) => `
        <div class="overview-card">
          <div class="overview-label">${escapeHtml(card.label)}</div>
          <div class="overview-value">${escapeHtml(card.value)}</div>
          <div class="overview-hint">${escapeHtml(card.hint)}</div>
        </div>
      `
    )
    .join("");
}

export function renderAdminAlertsSection(refs, overviewData, { formatDate }) {
  if (!refs.adminAlerts || !refs.adminAlertSummary || !refs.adminAlertActions) return;

  refs.adminAlerts.classList.remove("hidden");

  const pendingOrderCount = Number(overviewData?.alerts?.pending_orders || 0);
  const cancelReviewCount = Number(overviewData?.alerts?.cancel_reviews || 0);
  const rechargeReviewCount = Number(overviewData?.alerts?.recharge_reviews || 0);
  const totalPending = pendingOrderCount + cancelReviewCount + rechargeReviewCount;
  const lastUpdated = formatDate(new Date().toISOString());

  if (refs.adminAlertTimestamp) {
    refs.adminAlertTimestamp.textContent = `上次刷新：${lastUpdated}`;
  }

  refs.adminAlertSummary.innerHTML = `
    <div class="admin-alert-lead ${totalPending > 0 ? "hot" : ""}">
      ${
        totalPending > 0
          ? `当前有 ${totalPending} 条待处理事项，优先看订单和充值审核。`
          : "当前没有待处理的充值或交易。"
      }
    </div>
    <div class="admin-alert-grid">
      <div class="admin-alert-item ${pendingOrderCount > 0 ? "hot" : ""}">
        <div class="admin-alert-label">待处理订单</div>
        <div class="admin-alert-value ${pendingOrderCount > 0 ? "hot" : ""}">${pendingOrderCount}</div>
      </div>
      <div class="admin-alert-item ${cancelReviewCount > 0 ? "hot" : ""}">
        <div class="admin-alert-label">待审取消</div>
        <div class="admin-alert-value ${cancelReviewCount > 0 ? "hot" : ""}">${cancelReviewCount}</div>
      </div>
      <div class="admin-alert-item ${rechargeReviewCount > 0 ? "hot" : ""}">
        <div class="admin-alert-label">待审充值</div>
        <div class="admin-alert-value ${rechargeReviewCount > 0 ? "hot" : ""}">${rechargeReviewCount}</div>
      </div>
    </div>
  `;

  refs.adminAlertActions.innerHTML = `
    <button class="ghost" type="button" data-alert-target="orders" data-alert-status="${ORDER_STATUS.PENDING}">去看订单</button>
    <button class="ghost" type="button" data-alert-target="orders" data-alert-status="${ORDER_STATUS.CANCEL_REQUESTED}">去看取消审核</button>
    <button class="ghost" type="button" data-alert-target="recharge" data-alert-status="${RECHARGE_ORDER_STATUS.PENDING_REVIEW}">去看充值审核</button>
    <button class="ghost" type="button" id="refresh-alert-counts-btn">刷新提醒</button>
  `;
}

export function clearAdminAlertsSection(refs) {
  if (refs.adminAlerts) {
    refs.adminAlerts.classList.add("hidden");
  }
  if (refs.adminAlertSummary) {
    refs.adminAlertSummary.innerHTML = "";
  }
  if (refs.adminAlertActions) {
    refs.adminAlertActions.innerHTML = "";
  }
  if (refs.adminAlertTimestamp) {
    refs.adminAlertTimestamp.textContent = "等待首次刷新";
  }
}
