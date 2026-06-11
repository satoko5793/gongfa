import { ORDER_STATUS, RECHARGE_ORDER_STATUS } from "../app-constants.js?v=release-20260611-151806";

function renderGuideGlyph(type) {
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

function formatRecentSaleTime(ctx, value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60 * 1000) return "刚刚";
  if (diff < 60 * 60 * 1000) return `${Math.max(Math.floor(diff / (60 * 1000)), 1)} 分钟前`;
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.max(Math.floor(diff / (60 * 60 * 1000)), 1)} 小时前`;
  }
  if (diff < 3 * 24 * 60 * 60 * 1000) {
    return `${Math.max(Math.floor(diff / (24 * 60 * 60 * 1000)), 1)} 天前`;
  }
  return ctx.formatDate(value);
}

export function renderRecentSalesSection(ctx, items = []) {
  if (!ctx.recentSalesList) return;
  if (!ctx.isPageSectionEnabled("beginner")) {
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    ctx.recentSalesList.innerHTML = `
      <div class="recent-sales-empty">
        <div class="panel-title">最近成交正在准备中</div>
        <div class="muted">等第一批成交确认后，这里会自动展示匿名成交摘要。</div>
      </div>
    `;
    return;
  }

  ctx.recentSalesList.innerHTML = items
    .map(
      (item) => `
        <article class="recent-sale-item">
          <div class="recent-sale-top">
            <span class="chip subtle-chip">${ctx.escapeHtml(item.order_source_label || "商城成交")}</span>
            <span class="recent-sale-time">${ctx.escapeHtml(formatRecentSaleTime(ctx, item.created_at))}</span>
          </div>
          <div class="recent-sale-title">${ctx.escapeHtml(item.buyer_label || "匿名用户")} 买下 ${ctx.escapeHtml(item.item_title || "已成交商品")}</div>
          <div class="recent-sale-meta">
            <span>${ctx.escapeHtml(item.item_kind_label || "商品")} / ${Number(item.item_count || 1)} 项</span>
            <span>${Number(item.total_quota || 0)} 额度</span>
          </div>
        </article>
      `
    )
    .join("");
}

export function renderBeginnerGuideSection(ctx, profile, orders = [], rechargeOrders = []) {
  if (!ctx.beginnerGuideSteps || !ctx.beginnerGuideSummary || !ctx.beginnerGuideReward) return;
  if (!ctx.isPageSectionEnabled("beginner")) {
    ctx.beginnerFlowSection?.classList.add("hidden");
    return;
  }

  const rewardQuota = Number(profile?.beginner_guide_reward_quota || ctx.beginnerGuideRewardQuota);
  const hasAccount = Boolean(profile);
  const hasApprovedRecharge = rechargeOrders.some((order) => order.status === RECHARGE_ORDER_STATUS.APPROVED);
  const hasPendingRecharge = rechargeOrders.some((order) => order.status === RECHARGE_ORDER_STATUS.PENDING_REVIEW);
  const hasConfirmedOrder = orders.some((order) => order.status === ORDER_STATUS.CONFIRMED);
  const hasPendingOrder = orders.some((order) =>
    [ORDER_STATUS.PENDING, ORDER_STATUS.CANCEL_REQUESTED].includes(String(order.status || ""))
  );
  const rewardEarned = Boolean(profile?.beginner_guide_reward_earned);

  if (ctx.beginnerFlowSection) {
    ctx.beginnerFlowSection.classList.remove("hidden");
  }

  const steps = [
    {
      index: "01",
      type: "account",
      title: "注册并登录",
      done: hasAccount,
      current: !hasAccount,
      description: hasAccount
        ? `当前账号：${ctx.escapeHtml(profile.game_role_name || profile.game_role_id || "已登录")}`
        : "先进入注册或登录，后续充值和下单都会绑定在这个账号下。",
      actionLabel: hasAccount ? "已完成" : "去注册登录",
      actionHref: "#bind",
      actionTarget: "",
    },
    {
      index: "02",
      type: "recharge",
      title: "获取一次额度",
      done: hasApprovedRecharge,
      current: hasAccount && !hasApprovedRecharge,
      description: hasApprovedRecharge
        ? "通过残卷赠送或充值获取额度，额度已经到账。"
        : hasPendingRecharge
          ? "你已经提交过残卷赠送或充值申请，等待管理员审核通过后就算完成这一步。"
          : "去“我的”里通过残卷赠送或充值获取额度，审核通过后会自动到账。",
      actionLabel: hasApprovedRecharge ? "已完成" : hasPendingRecharge ? "查看进度" : "去获取额度",
      actionHref: "me.html#recharge-panel",
      actionTarget: "recharge",
    },
    {
      index: "03",
      type: "order",
      title: "完成首单消费",
      done: hasConfirmedOrder,
      current: hasAccount && hasApprovedRecharge && !hasConfirmedOrder,
      description: hasConfirmedOrder
        ? rewardEarned
          ? `首单已完成，奖励 ${rewardQuota} 额度已经发放。`
          : "首单已完成，奖励会自动到账。"
        : hasPendingOrder
          ? "你已经提交过订单，等管理员确认后就算完成首单。"
          : "从商城挑一件合适的商品下单，管理员确认后就能完成首单。",
      actionLabel: hasConfirmedOrder ? "已完成" : hasPendingOrder ? "查看订单" : "去选商品",
      actionHref: hasConfirmedOrder || hasPendingOrder ? "me.html#help-panel" : "#products",
      actionTarget: hasConfirmedOrder || hasPendingOrder ? "orders" : "",
    },
  ];

  ctx.beginnerGuideSummary.textContent = rewardEarned
    ? `新手教学奖励已到账 ${rewardQuota} 额度，你可以继续直接下单，也可以切到最近成交查看公开流水。`
    : hasConfirmedOrder && hasApprovedRecharge
      ? `三步已完成，系统会自动发放 ${rewardQuota} 额度奖励。`
      : `完成注册、获取一次额度、完成首单后，额外奖励 ${rewardQuota} 额度。`;
  ctx.beginnerGuideReward.textContent = rewardEarned
    ? `奖励已发放 +${rewardQuota}`
    : `完成三步奖励 ${rewardQuota} 额度`;
  ctx.beginnerGuideReward.classList.toggle("claimed", rewardEarned);

  ctx.beginnerGuideSteps.innerHTML = rewardEarned
    ? `
      <article class="tutorial-complete-card">
        <div class="tutorial-step-icon">${renderGuideGlyph("order")}</div>
        <div class="flow-step-index">GUIDE COMPLETE</div>
        <div class="flow-step-title">新手奖励已经到账</div>
        <div class="muted">你已经完成注册、获取额度和首单消费，后面可以直接逛商城，也可以切到“最近成交”查看公开成交摘要。</div>
        <div class="actions">
          <a class="ghost-link tutorial-link" href="#products">继续逛商城</a>
          <a class="ghost-link tutorial-link" href="me.html#account">查看我的信息</a>
        </div>
      </article>
    `
    : steps
        .map((step) => {
          const statusLabel = step.done ? "已完成" : step.current ? "当前推荐" : "未完成";
          const statusClass = step.done ? "done" : step.current ? "current" : "pending";
          const actionAttrs = step.actionTarget ? ` data-account-tab-target="${step.actionTarget}"` : "";
          return `
            <article class="flow-step tutorial-step ${statusClass}">
              <div class="tutorial-step-top">
                <div class="tutorial-step-icon">${renderGuideGlyph(step.type)}</div>
                <span class="tutorial-status ${statusClass}">${statusLabel}</span>
              </div>
              <div class="flow-step-index">${step.index}</div>
              <div class="flow-step-title">${step.title}</div>
              <div class="muted">${step.description}</div>
              <a class="ghost-link tutorial-link" href="${step.actionHref}"${actionAttrs}>${step.actionLabel}</a>
            </article>
          `;
        })
        .join("");
}
