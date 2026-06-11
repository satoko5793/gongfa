import { QUOTA_LOG_TYPES } from "../app-constants.js?v=release-20260611-151806";

function formatQuotaLogType(type) {
  switch (type) {
    case QUOTA_LOG_TYPES.ADMIN_ADD:
      return "管理员加额度";
    case QUOTA_LOG_TYPES.ADMIN_SUBTRACT:
      return "管理员扣额度";
    case "order_deduct":
      return "下单扣减";
    case "order_refund":
      return "订单退款";
    case QUOTA_LOG_TYPES.RECHARGE_CREDIT:
      return "充值到账";
    case "residual_transfer_credit":
      return "残卷到账";
    case "draw_service_rebate":
      return "代抽返利";
    case "lineup_slot_permanent_purchase":
      return "购买永久阵容槽";
    case "lineup_slot_seasonal_purchase":
      return "购买赛季阵容槽";
    case "beginner_guide_reward":
      return "新手教学奖励";
    default:
      return type || "-";
  }
}

export function renderQuotaLogsSection(context, logs = context.getCurrentQuotaLogList()) {
  const { refs, escapeHtml, formatDate } = context;
  const { quotaLogsRoot } = refs;
  if (!quotaLogsRoot) return;

  if (!Array.isArray(logs) || logs.length === 0) {
    quotaLogsRoot.innerHTML = '<div class="stack-item">暂无额度流水。</div>';
    return;
  }

  quotaLogsRoot.innerHTML = logs
    .map((log) => {
      const amount = Number(log.change_amount || 0);
      const prefix = amount > 0 ? "+" : "";
      return `
        <div class="stack-item quota-log-item">
          <div>${escapeHtml(log.game_role_name || "-")} / ${escapeHtml(log.game_role_id || "-")}</div>
          <div class="muted">${escapeHtml(formatQuotaLogType(log.type))} / ${prefix}${amount} / ${formatDate(
            log.created_at
          )}</div>
          <div class="muted">订单：${escapeHtml(log.order_id || "-")} / 备注：${escapeHtml(log.remark || "-")}</div>
        </div>
      `;
    })
    .join("");
}

export function renderAuditsSection(context, logs = context.getCurrentAuditList()) {
  const { refs, escapeHtml, formatDate } = context;
  const { auditsRoot } = refs;
  if (!auditsRoot) return;

  if (!Array.isArray(logs) || logs.length === 0) {
    auditsRoot.innerHTML = '<div class="stack-item">暂无审计日志。</div>';
    return;
  }

  auditsRoot.innerHTML = logs
    .map(
      (log) => `
        <div class="stack-item audit-log-item">
          <div>${escapeHtml(log.action)} / ${escapeHtml(log.target_type)} #${log.target_id}</div>
          <div class="muted">${escapeHtml(log.actor_role_name || "-")} / ${formatDate(log.created_at)}</div>
        </div>
      `
    )
    .join("");
}

export function renderLogsSection(context) {
  renderQuotaLogsSection(context);
  renderAuditsSection(context);
}
