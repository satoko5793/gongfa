import { RECHARGE_ORDER_STATUS } from "../app-constants.js?v=release-20260509-160631";

export function isPositiveMoneyAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return false;
  return Math.abs(numeric * 100 - Math.round(numeric * 100)) < 0.0001;
}

export function findPendingSeasonMemberOrder(rechargeOrders, rechargeConfig) {
  return (
    (rechargeOrders || []).find(
      (order) =>
        order.order_type === "season_member" &&
        order.status === RECHARGE_ORDER_STATUS.PENDING_REVIEW &&
        String(order.season_label || "") === String(rechargeConfig?.season_member_season_label || "")
    ) || null
  );
}

export function isResidualTransferOrder(order) {
  return String(order?.order_type || "").trim() === "residual_transfer";
}

export function formatRechargeStatus(status) {
  const mapping = {
    [RECHARGE_ORDER_STATUS.PENDING_REVIEW]: "待审核",
    [RECHARGE_ORDER_STATUS.APPROVED]: "已通过",
    [RECHARGE_ORDER_STATUS.REJECTED]: "已驳回",
  };
  return mapping[status] || status || "-";
}

export function formatRechargeOrderTitle(order) {
  if (order?.order_title) return order.order_title;
  if (isResidualTransferOrder(order)) return "残卷转赠";
  if (order?.order_type === "season_member") return "赛季会员";
  return "普通充值";
}

export function formatRechargeOrderAmountLine(ctx, order) {
  const quotaLine =
    Number(order?.bonus_quota_amount || 0) > 0
      ? `到账：${Number(order?.base_quota_amount || 0)} 基础 + ${Number(order?.bonus_quota_amount || 0)} 加成 = ${Number(order?.quota_amount || 0)} 额度`
      : `到账：${Number(order?.quota_amount || 0)} 额度`;

  if (isResidualTransferOrder(order)) {
    return `转赠：${Number(order?.transfer_amount || order?.amount_yuan || 0)} ${ctx.escapeHtml(order?.transfer_unit || "残卷")} / ${quotaLine}`;
  }

  return `金额：${ctx.formatCashAmount(order?.amount_yuan || 0)} / ${quotaLine} / 支付方式：${ctx.escapeHtml(ctx.formatRechargeChannelLabel(order?.channel))}`;
}

export function formatRechargeReferenceLine(ctx, order) {
  const label = isResidualTransferOrder(order) ? "转赠时间" : "付款时间";
  return `${label}：${ctx.escapeHtml(order?.payment_reference || "-")}`;
}

export function getRechargeQuoteSummary(ctx, profile, rechargeConfig, amountYuan, orderType = "normal") {
  const normalizedType =
    orderType === "season_member"
      ? "season_member"
      : orderType === "residual_transfer"
        ? "residual_transfer"
        : "normal";
  const seasonLabel = rechargeConfig?.season_member_season_label || "当前赛季";
  const seasonExpiresText = rechargeConfig?.season_member_expires_at
    ? ctx.formatDate(rechargeConfig.season_member_expires_at)
    : "-";
  const bonusPercent = Number(rechargeConfig?.season_member_bonus_percent || 0);

  if (normalizedType === "season_member") {
    const memberQuota = Number(rechargeConfig?.season_member_quota || 0);
    const memberAmount = Number(rechargeConfig?.season_member_price_yuan || 0);
    return {
      orderType: normalizedType,
      amountYuan: memberAmount,
      baseQuota: memberQuota,
      bonusQuota: 0,
      totalQuota: memberQuota,
      amountLabel: `${memberAmount} 元开通 ${seasonLabel} 会员`,
      detailLabel: `会员截止 ${seasonExpiresText}，后续每次获得额度额外 +${bonusPercent}%`,
      submitLabel: "已付款，申请开通会员",
      lockedAmount: true,
      amountInputLabel: "充值金额（元）",
      amountInputMin: memberAmount,
      amountInputStep: 1,
      referenceLabel: "付款时间",
      referencePlaceholder: "建议填写付款时间，例如 19:42",
      notePlaceholder: "例如：已付款，如需补充可写角色名或付款方式",
    };
  }

  if (normalizedType === "residual_transfer") {
    const normalizedAmount = Math.max(Number(amountYuan) || 0, 0);
    const quotaPerUnit = Math.max(Number(rechargeConfig?.residual_quota_per_unit || 1), 1);
    const unitLabel = rechargeConfig?.residual_unit_label || "残卷";
    const targetRoleId = rechargeConfig?.residual_admin_role_id || "584967604";
    const baseQuota = normalizedAmount * quotaPerUnit;
    const bonusQuota = profile?.season_member_active
      ? Math.floor(baseQuota * Number(rechargeConfig?.season_member_bonus_rate || 0))
      : 0;
    return {
      orderType: normalizedType,
      amountYuan: normalizedAmount,
      baseQuota,
      bonusQuota,
      totalQuota: baseQuota + bonusQuota,
      amountLabel: `1 ${unitLabel} = ${quotaPerUnit} 额度`,
      detailLabel: profile?.season_member_active
        ? `游戏内直接转给管理员 ${targetRoleId}，会员加成已生效，本次额外赠送 ${bonusQuota} 额度。`
        : `游戏内直接转给管理员 ${targetRoleId}，管理员审核后到账。`,
      submitLabel: "已转赠，提交审核",
      lockedAmount: false,
      amountInputLabel: `${unitLabel}数量`,
      amountInputMin: 1,
      amountInputStep: 1,
      referenceLabel: "转赠时间",
      referencePlaceholder: "建议填写转赠时间，例如 19:42",
      notePlaceholder: "例如：19:42 转给 584967604 共 300 残卷",
    };
  }

  const normalizedAmount = Math.max(Number(amountYuan) || 0, 0);
  const baseQuota = Math.round(
    (normalizedAmount * Number(rechargeConfig?.exchange_quota || 0)) /
      Math.max(Number(rechargeConfig?.exchange_yuan || 1), 0.01)
  );
  const bonusQuota = profile?.season_member_active
    ? Math.floor(baseQuota * Number(rechargeConfig?.season_member_bonus_rate || 0))
    : 0;
  const totalQuota = baseQuota + bonusQuota;
  const detailLabel = profile?.season_member_active
    ? `会员加成已生效，本次额外赠送 ${bonusQuota} 额度。`
    : "支持任意金额转账，系统会按当前比例实时折算到账。";

  return {
    orderType: normalizedType,
    amountYuan: normalizedAmount,
    baseQuota,
    bonusQuota,
    totalQuota,
    amountLabel: `当前兑换比例：${Number(rechargeConfig?.exchange_yuan || 1)} 元 = ${Number(rechargeConfig?.exchange_quota || 0)} 额度`,
    detailLabel,
    submitLabel: "已付款，提交审核",
    lockedAmount: false,
    amountInputLabel: "充值金额（元）",
    amountInputMin: 0.01,
    amountInputStep: 0.01,
    referenceLabel: "付款时间",
    referencePlaceholder: "建议填写付款时间，例如 19:42",
    notePlaceholder: "例如：已付款，如需补充可写角色名或付款方式",
  };
}
