import { ORDER_STATUS } from "../app-constants.js?v=release-20260509-160631";

export function renderProfileSection(ctx, profile, quota, orders) {
  if (!ctx.accountProfile || !ctx.quotaBalance || !ctx.orderList) return;

  if (!profile) {
    ctx.accountProfile.innerHTML = '<div class="stack-item">请先登录后查看账号信息。</div>';
    ctx.quotaBalance.textContent = "-";
    ctx.orderList.innerHTML = '<div class="stack-item">登录后可查看最近订单。</div>';
    ctx.setAccountMessage("");
    return;
  }

  const memberStatus = profile.season_member_active
    ? `本赛季会员，权益截止 ${ctx.escapeHtml(ctx.formatDate(profile.season_member_expires_at || ""))}`
    : "当前未开通";
  const memberBenefit = profile.season_member_active
    ? `后续获得额度额外 +${Number(profile.season_member_bonus_percent || 0)}%`
    : `开通后获得额度额外 +${Number(profile.season_member_bonus_percent || 0)}%`;
  const beginnerRewardStatus = profile.beginner_guide_reward_earned
    ? `已领取 ${Number(profile.beginner_guide_reward_quota || ctx.beginnerGuideRewardQuota)} 额度`
    : `完成教学三步后可领取 ${Number(profile.beginner_guide_reward_quota || ctx.beginnerGuideRewardQuota)} 额度`;

  ctx.accountProfile.innerHTML = [
    `角色名称：${ctx.escapeHtml(profile.game_role_name || "-")}`,
    `游戏 ID：${ctx.escapeHtml(profile.game_role_id || "-")}`,
    `区服：${ctx.escapeHtml(profile.game_server || "-")}`,
    `账号角色：${ctx.escapeHtml(profile.role || "-")}`,
    `登录方式：${ctx.escapeHtml(profile.auth_provider === "password" ? "密码登录" : "绑定登录")}`,
    `昵称：${ctx.escapeHtml(profile.nickname || "-")}`,
    `会员状态：${memberStatus}`,
    `会员权益：${memberBenefit}`,
    `新手奖励：${beginnerRewardStatus}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  ctx.quotaBalance.textContent = String(quota?.balance ?? profile.quota_balance ?? 0);

  if (!orders || orders.length === 0) {
    ctx.orderList.innerHTML = '<div class="stack-item">暂时没有订单。</div>';
    return;
  }

  ctx.orderList.innerHTML = orders
    .map((order) => {
      const itemNames = (order.items || []).map((item) => item.product_name).join(" / ");
      const drawMeta = ctx.getDrawServiceMeta(order);
      const remark = order.remark ? `<div class="muted">备注：${ctx.escapeHtml(order.remark)}</div>` : "";
      const drawLines =
        ctx.isDrawServiceOrder(order) && drawMeta
          ? `
              <div class="muted">代抽额度：${Number(drawMeta.amount_quota || order.total_quota || 0)} / 赛季：${ctx.escapeHtml(drawMeta.season_label || "-")}</div>
              ${drawMeta.returned_cards_text ? `<div class="muted">返还卡：${ctx.escapeHtml(drawMeta.returned_cards_text)}</div>` : ""}
              ${drawMeta.reward_summary ? `<div class="muted">阶段奖励：${ctx.escapeHtml(drawMeta.reward_summary)}</div>` : ""}
              ${drawMeta.best_gold_card ? `<div class="muted">图鉴金卡：${ctx.escapeHtml(drawMeta.best_gold_card)}</div>` : ""}
            `
          : "";
      const actions =
        order.status === ORDER_STATUS.PENDING
          ? `<div class="actions"><button class="ghost request-cancel-btn" type="button" data-order-id="${order.id}">申请取消</button></div>`
          : order.status === ORDER_STATUS.CANCEL_REQUESTED
            ? '<div class="muted">已提交取消申请，等待管理员审核。</div>'
            : "";

      return `
        <div class="stack-item">
          <div>订单 #${order.id} / ${ctx.escapeHtml(ctx.formatOrderStatus(order.status))}</div>
          <div class="muted">${ctx.escapeHtml(ctx.isDrawServiceOrder(order) ? "代抽项目" : "商品")}：${ctx.escapeHtml(itemNames || "-")}</div>
          <div class="muted">消耗：${Number(order.total_quota || 0)} / 下单时间：${ctx.formatDate(order.created_at)}</div>
          ${drawLines}
          ${remark}
          ${actions}
        </div>
      `;
    })
    .join("");
}

export function renderRechargeSection(ctx, profile, rechargeConfig, rechargeOrders) {
  if (!ctx.rechargeBody || !ctx.rechargeOrderList) return;

  if (!profile) {
    ctx.rechargeBody.innerHTML = '<div class="stack-item">登录后可发起额度充值申请。</div>';
    ctx.rechargeOrderList.innerHTML = '<div class="stack-item">登录后可查看充值记录。</div>';
    return;
  }

  if (!rechargeConfig?.enabled) {
    ctx.rechargeBody.innerHTML = '<div class="stack-item">当前暂未开放充值。</div>';
    ctx.rechargeOrderList.innerHTML = '<div class="stack-item">暂无充值记录。</div>';
    return;
  }

  const presets =
    Array.isArray(rechargeConfig.preset_amounts) && rechargeConfig.preset_amounts.length
      ? rechargeConfig.preset_amounts
      : [rechargeConfig.min_amount_yuan || rechargeConfig.exchange_yuan || 10];
  if (!ctx.isPositiveMoneyAmount(ctx.getSelectedRechargeAmount())) {
    ctx.setSelectedRechargeAmount(Number(presets[0]));
  }

  const availableRechargeTypes = ["normal", "season_member"];
  if (rechargeConfig?.residual_transfer_enabled) {
    availableRechargeTypes.push("residual_transfer");
  }

  let selectedRechargeOrderType = ctx.getSelectedRechargeOrderType();
  if (!availableRechargeTypes.includes(selectedRechargeOrderType)) {
    ctx.setSelectedRechargeOrderType("normal");
    selectedRechargeOrderType = "normal";
  }

  const pendingSeasonOrder = ctx.findPendingSeasonMemberOrder(rechargeOrders, rechargeConfig);
  const paymentMethods = ctx.getRechargePaymentMethods(rechargeConfig);
  const activePaymentMethod = ctx.ensureRechargePaymentChannel(rechargeConfig);
  const pendingDirectPurchaseContext = ctx.getPendingDirectPurchaseContext();
  const directPurchaseContext =
    selectedRechargeOrderType === "normal" && pendingDirectPurchaseContext
      ? pendingDirectPurchaseContext
      : null;

  if (
    directPurchaseContext &&
    Number(ctx.getSelectedRechargeAmount()) !== Number(directPurchaseContext.amountYuan)
  ) {
    ctx.setSelectedRechargeAmount(Number(directPurchaseContext.amountYuan));
  }

  const quoteSummary = ctx.getRechargeQuoteSummary(
    profile,
    rechargeConfig,
    selectedRechargeOrderType === "season_member"
      ? rechargeConfig.season_member_price_yuan
      : ctx.getSelectedRechargeAmount(),
    selectedRechargeOrderType
  );
  const memberStatusText = profile.season_member_active
    ? `你已开通 ${ctx.escapeHtml(profile.season_member_season_label || rechargeConfig.season_member_season_label || "当前赛季")} 会员，权益截止 ${ctx.escapeHtml(ctx.formatDate(profile.season_member_expires_at || rechargeConfig.season_member_expires_at || ""))}`
    : pendingSeasonOrder
      ? `你的 ${ctx.escapeHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员申请正在审核中。`
      : `${ctx.escapeHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员：${Number(rechargeConfig.season_member_price_yuan || 0)} 元得 ${Number(rechargeConfig.season_member_quota || 0)} 额度，后续获得额度额外 +${Number(rechargeConfig.season_member_bonus_percent || 0)}%。`;
  const seasonMemberDisabled = Boolean(profile.season_member_active || pendingSeasonOrder);
  const isResidualTransfer = selectedRechargeOrderType === "residual_transfer";
  const transferTargetRoleId = rechargeConfig?.residual_admin_role_id || "584967604";
  const transferTargetRoleName = rechargeConfig?.residual_admin_role_name || "admin残卷";
  const transferTargetGameName = rechargeConfig?.residual_admin_game_name || "繁星✨秋";
  const transferUnitLabel = rechargeConfig?.residual_unit_label || "残卷";
  const paymentMethodTabsHtml =
    !isResidualTransfer && paymentMethods.length > 1
      ? `
          <div class="preset-list">
            ${paymentMethods
              .map(
                (method) =>
                  `<button class="preset-chip ${ctx.getSelectedRechargePaymentChannel() === method.key ? "active" : ""}" type="button" data-payment-channel="${method.key}">${ctx.escapeHtml(method.label)}</button>`
              )
              .join("")}
          </div>
        `
      : "";
  const submitLabel = directPurchaseContext ? "已转账，提交购买审核" : quoteSummary.submitLabel;
  const directPurchaseBannerHtml = directPurchaseContext
    ? `
        <div class="recharge-direct-banner">
          <div>
            <strong>当前是转账购买</strong>
            <div class="muted">${ctx.escapeHtml(directPurchaseContext.productName)} / ${directPurchaseContext.quotaAmount} 额度 / ${ctx.escapeHtml(ctx.formatCashAmount(directPurchaseContext.amountYuan))}</div>
            <div class="muted">这笔金额按商品精确价格预填，和普通充值分开显示。</div>
          </div>
          <button class="ghost" type="button" data-direct-purchase-clear="1">切回普通充值</button>
        </div>
      `
    : "";
  const sideCardHtml = isResidualTransfer
    ? `
        <div class="recharge-qr-card">
          <div><strong>${ctx.escapeHtml(transferTargetRoleName)}</strong></div>
          <div class="muted">游戏名称：${ctx.escapeHtml(transferTargetGameName)}</div>
          <div class="muted">游戏 ID：${ctx.escapeHtml(transferTargetRoleId)}</div>
          <div class="muted">兑换比例：1 ${ctx.escapeHtml(transferUnitLabel)} = ${Number(rechargeConfig?.residual_quota_per_unit || 1)} 额度</div>
          <div class="stack-list">
            ${(rechargeConfig.residual_instructions || []).map((line) => `<div class="stack-item">${ctx.escapeHtml(line)}</div>`).join("")}
          </div>
        </div>
      `
    : `
        <div class="recharge-qr-card">
          ${paymentMethodTabsHtml}
          <img class="recharge-qr-image" src="${ctx.escapeHtml(activePaymentMethod?.imageUrl || rechargeConfig.qr_image_url)}" alt="${ctx.escapeHtml(activePaymentMethod?.name || "收款码")}" />
          <div><strong>${ctx.escapeHtml(activePaymentMethod?.name || rechargeConfig.payee_name || "收款码")}</strong></div>
          <div class="muted">${ctx.escapeHtml(activePaymentMethod?.hint || rechargeConfig.payee_hint || "扫码转账后再提交审核")}</div>
          <div class="stack-list">
            ${(rechargeConfig.instructions || []).map((line) => `<div class="stack-item">${ctx.escapeHtml(line)}</div>`).join("")}
          </div>
        </div>
      `;

  ctx.rechargeBody.innerHTML = `
    <div class="recharge-layout">
      <div class="recharge-rate-banner">
        <strong>赛季会员</strong>
        <span>${memberStatusText}</span>
        <span class="muted">本赛季截止 ${ctx.escapeHtml(ctx.formatDate(rechargeConfig.season_member_expires_at || ""))}</span>
      </div>
      <div class="recharge-layout-split">
        ${sideCardHtml}
        <form id="recharge-form" class="form-grid">
          ${directPurchaseBannerHtml}
          <div class="preset-list">
            <button class="preset-chip ${selectedRechargeOrderType === "normal" ? "active" : ""}" type="button" data-recharge-order-type="normal">普通充值</button>
            <button class="preset-chip ${selectedRechargeOrderType === "season_member" ? "active" : ""}" type="button" data-recharge-order-type="season_member">赛季会员</button>
            ${rechargeConfig?.residual_transfer_enabled ? `<button class="preset-chip ${selectedRechargeOrderType === "residual_transfer" ? "active" : ""}" type="button" data-recharge-order-type="residual_transfer">残卷转赠</button>` : ""}
          </div>
          <div class="recharge-rate-banner">
            <strong>${ctx.escapeHtml(quoteSummary.amountLabel)}</strong>
            <span class="muted">${ctx.escapeHtml(quoteSummary.detailLabel)}</span>
          </div>
          <label>${ctx.escapeHtml(quoteSummary.amountInputLabel)}
            <input id="recharge-amount-input" type="number" min="${Number(quoteSummary.amountInputMin || 1)}" step="${Number(quoteSummary.amountInputStep || 1)}" value="${quoteSummary.amountYuan}" ${(quoteSummary.lockedAmount || directPurchaseContext) ? "readonly" : ""} />
          </label>
          ${selectedRechargeOrderType === "normal" && !directPurchaseContext ? `
            <div class="preset-list">
              ${presets
                .map((amount) => `<button class="preset-chip ${Number(amount) === Number(ctx.getSelectedRechargeAmount()) ? "active" : ""}" type="button" data-recharge-amount="${amount}">${amount} 元</button>`)
                .join("")}
            </div>
          ` : ""}
          <div class="recharge-quote">
            <span class="muted">本次预计到账</span>
            <strong id="recharge-quote-value">${quoteSummary.totalQuota} 额度</strong>
            <span id="recharge-quote-detail" class="muted">${quoteSummary.baseQuota} 基础额度${quoteSummary.bonusQuota > 0 ? ` + ${quoteSummary.bonusQuota} 会员加成` : ""}</span>
          </div>
          <label>${ctx.escapeHtml(quoteSummary.referenceLabel)}
            <input id="recharge-payment-reference" type="text" maxlength="100" placeholder="${ctx.escapeHtml(quoteSummary.referencePlaceholder)}" required />
          </label>
          <label>补充说明（可选）
            <textarea id="recharge-note" rows="3" placeholder="${ctx.escapeHtml(quoteSummary.notePlaceholder)}"></textarea>
          </label>
          <div class="actions">
            <button id="recharge-submit-btn" class="primary" type="submit" ${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? "disabled" : ""}>${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? (profile.season_member_active ? "本赛季已开通" : "会员申请审核中") : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (!rechargeOrders || rechargeOrders.length === 0) {
    ctx.rechargeOrderList.innerHTML = '<div class="stack-item">暂无充值记录。</div>';
    return;
  }

  ctx.rechargeOrderList.innerHTML = rechargeOrders
    .map((order) => {
      const adminRemark = order.admin_remark ? `<div class="muted">审核备注：${ctx.escapeHtml(order.admin_remark)}</div>` : "";
      const payerNote = order.payer_note ? `<div class="muted">补充说明：${ctx.escapeHtml(order.payer_note)}</div>` : "";
      return `
        <div class="stack-item">
          <div>${ctx.escapeHtml(ctx.formatRechargeOrderTitle(order))} #${order.id} / ${ctx.escapeHtml(ctx.formatRechargeStatus(order.status))}</div>
          <div class="muted">${ctx.formatRechargeOrderAmountLine(order)}</div>
          <div class="muted">${ctx.formatRechargeReferenceLine(order)}</div>
          <div class="muted">提交时间：${ctx.formatDate(order.created_at)}</div>
          ${ctx.isResidualTransferOrder(order) ? `<div class="muted">转赠目标：${ctx.escapeHtml(order.transfer_target_role_name || "admin残卷")} / ${ctx.escapeHtml(order.transfer_target_role_id || "-")}</div>` : ""}
          ${order.season_label ? `<div class="muted">赛季：${ctx.escapeHtml(order.season_label)}</div>` : ""}
          ${payerNote}
          ${adminRemark}
        </div>
      `;
    })
    .join("");
}
