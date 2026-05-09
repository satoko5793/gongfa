import { ADMIN_ROLES, RECHARGE_ORDER_STATUS } from "./app-constants.js?v=release-20260509-160631";

export function setAccountLiteNotice(accountMessage, text, type = "") {
  if (!accountMessage) return;
  accountMessage.textContent = text || "";
  accountMessage.className = type ? `notice ${type}` : "notice";
}

function escapeLiteHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatLiteDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", { hour12: false });
}

function isLitePositiveMoneyAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return false;
  return Math.abs(numeric * 100 - Math.round(numeric * 100)) < 0.0001;
}

function getLiteRechargePaymentMethods(rechargeConfig) {
  const methods = [];
  if (String(rechargeConfig?.qr_image_url || "").trim()) {
    methods.push({
      key: "alipay_qr",
      label: "支付宝",
      imageUrl: rechargeConfig.qr_image_url,
      name: rechargeConfig.payee_name || "支付宝收款码",
      hint: rechargeConfig.payee_hint || "扫码转账后再提交审核",
    });
  }
  if (String(rechargeConfig?.wechat_qr_image_url || "").trim()) {
    methods.push({
      key: "wechat_qr",
      label: "微信",
      imageUrl: rechargeConfig.wechat_qr_image_url,
      name: rechargeConfig.wechat_payee_name || "微信收款码",
      hint: rechargeConfig.wechat_payee_hint || "扫码转账后再提交审核",
    });
  }
  return methods;
}

function findPendingLiteSeasonMemberOrder(rechargeOrders, rechargeConfig) {
  return (
    (rechargeOrders || []).find(
      (order) =>
        order.order_type === "season_member" &&
        order.status === RECHARGE_ORDER_STATUS.PENDING_REVIEW &&
        String(order.season_label || "") === String(rechargeConfig?.season_member_season_label || "")
    ) || null
  );
}

function buildLiteRechargeQuote(profile, rechargeConfig, amountValue, orderType = "normal") {
  const normalizedType =
    orderType === "season_member"
      ? "season_member"
      : orderType === "residual_transfer"
        ? "residual_transfer"
        : "normal";
  const seasonLabel = rechargeConfig?.season_member_season_label || "当前赛季";
  const seasonExpiresText = formatLiteDate(rechargeConfig?.season_member_expires_at || "");
  const bonusPercent = Number(rechargeConfig?.season_member_bonus_percent || 0);

  if (normalizedType === "season_member") {
    const memberQuota = Number(rechargeConfig?.season_member_quota || 0);
    const memberAmount = Number(rechargeConfig?.season_member_price_yuan || 0);
    return {
      orderType: normalizedType,
      amountValue: memberAmount,
      amountLabel: `${memberAmount} 元开通 ${seasonLabel} 会员`,
      detailLabel: `会员截止 ${seasonExpiresText}，后续每次获得额度额外 +${bonusPercent}%`,
      submitLabel: "已付款，申请开通会员",
      amountInputLabel: "充值金额（元）",
      amountInputMin: memberAmount,
      amountInputStep: 1,
      referenceLabel: "付款时间",
      referencePlaceholder: "建议填写付款时间，例如 19:42",
      notePlaceholder: "例如：已付款，如需补充可写角色名或付款方式",
      baseQuota: memberQuota,
      bonusQuota: 0,
      totalQuota: memberQuota,
      lockedAmount: true,
    };
  }

  if (normalizedType === "residual_transfer") {
    const normalizedAmount = Math.max(Math.floor(Number(amountValue) || 0), 0);
    const quotaPerUnit = Math.max(Number(rechargeConfig?.residual_quota_per_unit || 1), 1);
    const unitLabel = rechargeConfig?.residual_unit_label || "残卷";
    const targetRoleId = rechargeConfig?.residual_admin_role_id || "584967604";
    const baseQuota = normalizedAmount * quotaPerUnit;
    const bonusQuota = profile?.season_member_active
      ? Math.floor(baseQuota * Number(rechargeConfig?.season_member_bonus_rate || 0))
      : 0;
    return {
      orderType: normalizedType,
      amountValue: normalizedAmount,
      amountLabel: `1 ${unitLabel} = ${quotaPerUnit} 额度`,
      detailLabel: profile?.season_member_active
        ? `游戏内直接转给管理员 ${targetRoleId}，会员加成已生效，本次额外赠送 ${bonusQuota} 额度。`
        : `游戏内直接转给管理员 ${targetRoleId}，管理员审核后到账。`,
      submitLabel: "已转赠，提交审核",
      amountInputLabel: `${unitLabel}数量`,
      amountInputMin: 1,
      amountInputStep: 1,
      referenceLabel: "转赠时间",
      referencePlaceholder: "建议填写转赠时间，例如 19:42",
      notePlaceholder: `例如：19:42 转给 ${targetRoleId} 共 ${normalizedAmount || ""} ${unitLabel}`,
      baseQuota,
      bonusQuota,
      totalQuota: baseQuota + bonusQuota,
      lockedAmount: false,
    };
  }

  const normalizedAmount = Math.max(Number(amountValue) || 0, 0);
  const exchangeQuota = Number(rechargeConfig?.exchange_quota || 0);
  const exchangeYuan = Math.max(Number(rechargeConfig?.exchange_yuan || 1), 0.01);
  const baseQuota = Math.round((normalizedAmount * exchangeQuota) / exchangeYuan);
  const bonusQuota = profile?.season_member_active
    ? Math.floor(baseQuota * Number(rechargeConfig?.season_member_bonus_rate || 0))
    : 0;
  return {
    orderType: normalizedType,
    amountValue: normalizedAmount,
    amountLabel: `当前兑换比例：${Number(rechargeConfig?.exchange_yuan || 1)} 元 = ${exchangeQuota} 额度`,
    detailLabel: profile?.season_member_active
      ? `会员加成已生效，本次额外赠送 ${bonusQuota} 额度。`
      : "支持任意金额转账，系统会按当前比例实时折算到账。",
    submitLabel: "已付款，提交审核",
    amountInputLabel: "充值金额（元）",
    amountInputMin: 0.01,
    amountInputStep: 0.01,
    referenceLabel: "付款时间",
    referencePlaceholder: "建议填写付款时间，例如 19:42",
    notePlaceholder: "例如：已付款，如需补充可写角色名或付款方式",
    baseQuota,
    bonusQuota,
    totalQuota: baseQuota + bonusQuota,
    lockedAmount: false,
  };
}

function formatLiteRechargeChannelLabel(channel) {
  if (String(channel || "").trim() === "wechat_qr") return "微信";
  if (String(channel || "").trim() === "game_residual_transfer") return "残卷转赠";
  return "支付宝";
}

export function renderLiteRechargeSection({
  profile,
  rechargeConfig,
  rechargeOrders,
  rechargeBody,
  rechargeOrderList,
  rechargeUiState,
} = {}) {
  if (!rechargeBody || !rechargeOrderList) return rechargeUiState || null;

  if (!profile) {
    rechargeBody.innerHTML = '<div class="stack-item">登录后可发起额度充值申请。</div>';
    rechargeOrderList.innerHTML = '<div class="stack-item">登录后可查看充值记录。</div>';
    return rechargeUiState || null;
  }

  if (!rechargeConfig?.enabled) {
    rechargeBody.innerHTML = '<div class="stack-item">当前暂未开放充值。</div>';
    rechargeOrderList.innerHTML = '<div class="stack-item">暂无充值记录。</div>';
    return rechargeUiState || null;
  }

  const presets =
    Array.isArray(rechargeConfig.preset_amounts) && rechargeConfig.preset_amounts.length
      ? rechargeConfig.preset_amounts
      : [rechargeConfig.min_amount_yuan || rechargeConfig.exchange_yuan || 10];
  const paymentMethods = getLiteRechargePaymentMethods(rechargeConfig);
  const availableRechargeTypes = ["normal", "season_member"];
  if (rechargeConfig?.residual_transfer_enabled) {
    availableRechargeTypes.push("residual_transfer");
  }
  const pendingSeasonOrder = findPendingLiteSeasonMemberOrder(rechargeOrders, rechargeConfig);
  const nextState = {
    orderType: availableRechargeTypes.includes(rechargeUiState?.orderType)
      ? rechargeUiState.orderType
      : "normal",
    paymentChannel: paymentMethods.some((item) => item.key === rechargeUiState?.paymentChannel)
      ? rechargeUiState.paymentChannel
      : paymentMethods[0]?.key || "alipay_qr",
    amountValue: Number(rechargeUiState?.amountValue || 0),
    paymentReference: String(rechargeUiState?.paymentReference || ""),
    payerNote: String(rechargeUiState?.payerNote || ""),
  };
  if (nextState.orderType === "season_member") {
    nextState.amountValue = Number(rechargeConfig?.season_member_price_yuan || 0);
  } else if (nextState.orderType === "residual_transfer") {
    nextState.amountValue = Number.isInteger(nextState.amountValue) && nextState.amountValue > 0 ? nextState.amountValue : 1;
  } else if (!isLitePositiveMoneyAmount(nextState.amountValue)) {
    nextState.amountValue = Number(presets[0] || rechargeConfig.min_amount_yuan || 10);
  }

  const quote = buildLiteRechargeQuote(profile, rechargeConfig, nextState.amountValue, nextState.orderType);
  const activePaymentMethod =
    paymentMethods.find((item) => item.key === nextState.paymentChannel) || paymentMethods[0] || null;
  const memberStatusText = profile.season_member_active
    ? `你已开通 ${escapeLiteHtml(profile.season_member_season_label || rechargeConfig.season_member_season_label || "当前赛季")} 会员，权益截止 ${escapeLiteHtml(formatLiteDate(profile.season_member_expires_at || rechargeConfig.season_member_expires_at || ""))}`
    : pendingSeasonOrder
      ? `你的 ${escapeLiteHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员申请正在审核中。`
      : `${escapeLiteHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员：${Number(rechargeConfig.season_member_price_yuan || 0)} 元得 ${Number(rechargeConfig.season_member_quota || 0)} 额度，后续获得额度额外 +${Number(rechargeConfig.season_member_bonus_percent || 0)}%。`;
  const seasonMemberDisabled = Boolean(profile.season_member_active || pendingSeasonOrder);
  const isResidualTransfer = nextState.orderType === "residual_transfer";

  rechargeBody.innerHTML = `
    <div class="recharge-layout">
      <div class="recharge-rate-banner">
        <strong>赛季会员</strong>
        <span>${memberStatusText}</span>
        <span class="muted">本赛季截止 ${escapeLiteHtml(formatLiteDate(rechargeConfig.season_member_expires_at || ""))}</span>
      </div>
      <div class="recharge-layout-split">
        <div class="recharge-qr-card">
          ${
            isResidualTransfer
              ? `
                <div><strong>${escapeLiteHtml(rechargeConfig?.residual_admin_role_name || "admin残卷")}</strong></div>
                <div class="muted">游戏名称：${escapeLiteHtml(rechargeConfig?.residual_admin_game_name || "繁星✨秋")}</div>
                <div class="muted">游戏 ID：${escapeLiteHtml(rechargeConfig?.residual_admin_role_id || "584967604")}</div>
                <div class="muted">兑换比例：1 ${escapeLiteHtml(rechargeConfig?.residual_unit_label || "残卷")} = ${Number(rechargeConfig?.residual_quota_per_unit || 1)} 额度</div>
                <div class="stack-list">
                  ${(rechargeConfig.residual_instructions || []).map((line) => `<div class="stack-item">${escapeLiteHtml(line)}</div>`).join("")}
                </div>
              `
              : `
                <div class="preset-list">
                  ${paymentMethods
                    .map(
                      (method) =>
                        `<button class="preset-chip ${method.key === nextState.paymentChannel ? "active" : ""}" type="button" data-lite-payment-channel="${escapeLiteHtml(method.key)}">${escapeLiteHtml(method.label)}</button>`
                    )
                    .join("")}
                </div>
                ${activePaymentMethod?.imageUrl ? `<img class="recharge-qr-image" src="${escapeLiteHtml(activePaymentMethod.imageUrl)}" alt="${escapeLiteHtml(activePaymentMethod.name || "收款码")}" />` : ""}
                <div><strong>${escapeLiteHtml(activePaymentMethod?.name || "收款码")}</strong></div>
                <div class="muted">${escapeLiteHtml(activePaymentMethod?.hint || "扫码转账后再提交审核")}</div>
                <div class="stack-list">
                  ${(rechargeConfig.instructions || []).map((line) => `<div class="stack-item">${escapeLiteHtml(line)}</div>`).join("")}
                </div>
              `
          }
        </div>
        <form id="lite-recharge-form" class="form-grid">
          <div class="preset-list">
            <button class="preset-chip ${nextState.orderType === "normal" ? "active" : ""}" type="button" data-lite-recharge-order-type="normal">普通充值</button>
            <button class="preset-chip ${nextState.orderType === "season_member" ? "active" : ""}" type="button" data-lite-recharge-order-type="season_member">赛季会员</button>
            ${rechargeConfig?.residual_transfer_enabled ? `<button class="preset-chip ${nextState.orderType === "residual_transfer" ? "active" : ""}" type="button" data-lite-recharge-order-type="residual_transfer">残卷转赠</button>` : ""}
          </div>
          <div class="recharge-rate-banner">
            <strong>${escapeLiteHtml(quote.amountLabel)}</strong>
            <span class="muted">${escapeLiteHtml(quote.detailLabel)}</span>
          </div>
          <label>${escapeLiteHtml(quote.amountInputLabel)}
            <input id="lite-recharge-amount-input" type="number" min="${Number(quote.amountInputMin || 1)}" step="${Number(quote.amountInputStep || 1)}" value="${quote.amountValue}" ${quote.lockedAmount ? "readonly" : ""} />
          </label>
          ${
            nextState.orderType === "normal"
              ? `
                <div class="preset-list">
                  ${presets
                    .map(
                      (amount) =>
                        `<button class="preset-chip ${Number(amount) === Number(nextState.amountValue) ? "active" : ""}" type="button" data-lite-recharge-amount="${Number(amount)}">${Number(amount)} 元</button>`
                    )
                    .join("")}
                </div>
              `
              : ""
          }
          <div class="recharge-quote">
            <span class="muted">本次预计到账</span>
            <strong>${Number(quote.totalQuota || 0)} 额度</strong>
            <span class="muted">${Number(quote.baseQuota || 0)} 基础额度${Number(quote.bonusQuota || 0) > 0 ? ` + ${Number(quote.bonusQuota || 0)} 会员加成` : ""}</span>
          </div>
          <label>${escapeLiteHtml(quote.referenceLabel)}
            <input id="lite-recharge-payment-reference" type="text" maxlength="100" placeholder="${escapeLiteHtml(quote.referencePlaceholder)}" value="${escapeLiteHtml(nextState.paymentReference)}" required />
          </label>
          <label>补充说明（可选）
            <textarea id="lite-recharge-note" rows="3" placeholder="${escapeLiteHtml(quote.notePlaceholder)}">${escapeLiteHtml(nextState.payerNote)}</textarea>
          </label>
          <div class="actions">
            <button id="lite-recharge-submit-btn" class="primary" type="submit" ${seasonMemberDisabled && nextState.orderType === "season_member" ? "disabled" : ""}>${seasonMemberDisabled && nextState.orderType === "season_member" ? (profile.season_member_active ? "本赛季已开通" : "会员申请审核中") : escapeLiteHtml(quote.submitLabel)}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  rechargeOrderList.innerHTML = Array.isArray(rechargeOrders) && rechargeOrders.length
    ? rechargeOrders
        .slice(0, 5)
        .map(
          (order) => `
            <div class="stack-item">
              <div>${escapeLiteHtml(formatLiteRechargeOrderTitle(order))} #${order.id} / ${escapeLiteHtml(formatLiteRechargeStatus(order.status))}</div>
              <div class="muted">${escapeLiteHtml(formatLiteRechargeOrderAmountLine(order))}</div>
              <div class="muted">${escapeLiteHtml(formatLiteRechargeReferenceLine(order))}</div>
              <div class="muted">提交时间：${escapeLiteHtml(formatLiteDate(order.created_at))}</div>
            </div>
          `
        )
        .join("")
    : '<div class="stack-item">最近还没有充值记录。</div>';

  return nextState;
}

function formatLiteRechargeOrderTitle(order) {
  if (String(order?.order_type || "").trim() === "season_member") return "赛季会员";
  if (String(order?.order_type || "").trim() === "residual_transfer") return "残卷转赠";
  return "普通充值";
}

function formatLiteRechargeOrderAmountLine(order) {
  if (String(order?.order_type || "").trim() === "residual_transfer") {
    return `转赠：${Number(order?.transfer_amount || order?.amount_yuan || 0)} ${order?.transfer_unit || "残卷"} / 到账：${Number(order?.quota_amount || 0)} 额度`;
  }
  return `金额：${Number(order?.amount_yuan || 0)} 元 / 到账：${Number(order?.quota_amount || 0)} 额度 / 支付方式：${formatLiteRechargeChannelLabel(order?.channel)}`;
}

function formatLiteRechargeReferenceLine(order) {
  return `${String(order?.order_type || "").trim() === "residual_transfer" ? "转赠时间" : "付款时间"}：${order?.payment_reference || "-"}`;
}

export function activateLiteAccountTab(accountTabButtons, accountTabPanels, tab) {
  const activeTab = tab || "overview";
  accountTabButtons.forEach((button) => {
    const isActive = button.getAttribute("data-account-tab") === activeTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  accountTabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-account-panel") !== activeTab);
  });
}

export function renderLiteAccountProfile({
  profile,
  quota = null,
  orders = null,
  rechargeOrders = null,
  rechargeConfig = null,
  rechargeUiState = null,
  accountProfile,
  quotaBalance,
  rechargeBody,
  rechargeOrderList,
  orderList,
  setAccountNotice,
} = {}) {
  if (!accountProfile || !quotaBalance || !orderList || !rechargeBody || !rechargeOrderList) return;
  if (!profile) {
    accountProfile.innerHTML = [
      "请先登录后查看账号信息。",
      "登录后可以直接查看余额、充值、订单和阵容同步状态。",
    ]
      .map((line) => `<div class="stack-item">${line}</div>`)
      .join("");
    quotaBalance.textContent = "-";
    rechargeBody.innerHTML = '<div class="stack-item">登录后可发起额度充值申请。</div>';
    rechargeOrderList.innerHTML = '<div class="stack-item">登录后可查看充值记录。</div>';
    orderList.innerHTML = '<div class="stack-item">登录后可查看最近订单。</div>';
    setAccountNotice?.("请先登录后再使用个人后台完整功能。", "error");
    return;
  }

  const authLabel = profile.auth_provider === "password" ? "密码登录" : "绑定登录";
  const roleLabel =
    profile.role === "admin"
      ? "管理员"
      : profile.role === ADMIN_ROLES.POSTER_ADMIN
        ? "海报后台"
        : profile.role || "用户";
  const effectiveQuota = quota?.balance ?? profile.quota_balance ?? 0;
  accountProfile.innerHTML = [
    `角色名称：${profile.game_role_name || "-"}`,
    `游戏 ID：${profile.game_role_id || "-"}`,
    `区服：${profile.game_server || "-"}`,
    `账号角色：${roleLabel}`,
    `登录方式：${authLabel}`,
    `当前额度：${Number(effectiveQuota || 0)}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");
  quotaBalance.textContent = String(Number(effectiveQuota || 0));
  rechargeBody.innerHTML =
    '<div class="stack-item">充值面板正在加载中，稍等片刻即可查看收款码和报价。</div>';
  rechargeOrderList.innerHTML =
    '<div class="stack-item">充值记录正在加载中，稍等片刻即可查看。</div>';
  if (Array.isArray(orders)) {
    orderList.innerHTML = orders.length
      ? orders
          .slice(0, 5)
          .map(
            (order) => `
              <div class="stack-item">
                <div>订单 #${order.id} / ${order.status || "-"}</div>
                <div class="muted">消耗：${Number(order.total_quota || 0)} / 下单时间：${order.created_at || "-"}</div>
              </div>
            `
          )
          .join("")
      : '<div class="stack-item">最近还没有订单。</div>';
    if (Array.isArray(rechargeOrders)) {
      renderLiteRechargeSection({
        profile,
        rechargeConfig,
        rechargeOrders,
        rechargeBody,
        rechargeOrderList,
        rechargeUiState,
      });
    }
    setAccountNotice?.("账户概览已加载，充值和最近记录已可直接使用。", "success");
    return;
  }
  orderList.innerHTML = '<div class="stack-item">订单列表正在加载中，稍等片刻即可查看。</div>';
  setAccountNotice?.("个人后台正在加载概览...", "");
}

export function fillLiteAccountForms(profile, fields = {}) {
  if (!profile) return;
  const { accountRoleNameInput, accountServerInput, accountNicknameInput } = fields;
  if (accountRoleNameInput) accountRoleNameInput.value = profile.game_role_name || "";
  if (accountServerInput) accountServerInput.value = profile.game_server || "";
  if (accountNicknameInput) accountNicknameInput.value = profile.nickname || "";
}

export async function hydrateLiteAccountOverview({
  hasSession,
  apiFetch,
  saveSession,
  session,
  accountProfile,
  quotaBalance,
  rechargeBody,
  rechargeOrderList,
  orderList,
  setAccountNotice,
  fillForms,
  onSessionExpired,
} = {}) {
  if (!hasSession) return null;
  try {
    const [profile, quota, orders, rechargeOrders, rechargeConfig] = await Promise.all([
      apiFetch("/auth/me"),
      apiFetch("/me/quota"),
      apiFetch("/me/orders"),
      apiFetch("/me/recharge-orders").catch(() => []),
      apiFetch("/me/recharge-config").catch(() => null),
    ]);
    const normalizedOrders = Array.isArray(orders) ? orders : [];
    const normalizedRechargeOrders = Array.isArray(rechargeOrders) ? rechargeOrders : [];
    saveSession?.({ ...(session || {}), profile });
    renderLiteAccountProfile({
      profile,
      quota,
      orders: normalizedOrders,
      rechargeOrders: normalizedRechargeOrders,
      rechargeConfig,
      accountProfile,
      quotaBalance,
      rechargeBody,
      rechargeOrderList,
      orderList,
      setAccountNotice,
    });
    fillForms?.(profile);
    return {
      profile,
      quota,
      orders: normalizedOrders,
      rechargeOrders: normalizedRechargeOrders,
      rechargeConfig,
    };
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      onSessionExpired?.();
      return null;
    }
    setAccountNotice?.(`账户概览加载失败：${error?.message || "请稍后重试"}`, "error");
    return null;
  }
}

function formatLiteRechargeStatus(status) {
  const normalized = String(status || "").trim();
  if (normalized === RECHARGE_ORDER_STATUS.PENDING_REVIEW) return "待审核";
  if (normalized === "approved") return "已通过";
  if (normalized === "rejected") return "已驳回";
  return normalized || "-";
}
