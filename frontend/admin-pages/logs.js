import { renderLogsSection } from "../admin-renderers/logs.js?v=release-20260611-151806";

export async function loadLogsPage(context) {
  await Promise.all([
    context.loadQuotaLogs({ page: context.paginationState.quotaLogs.page }),
    context.loadAudits({ page: context.paginationState.audits.page }),
  ]);
  context.markPageLoaded("logs");
}

export function bindLogsPageEvents(context) {
  const {
    refs,
    setMessage,
    pickErrorMessage,
    resetPagedState,
    loadQuotaLogs,
    loadAudits,
  } = context;

  document.getElementById("reload-quota-logs-btn")?.addEventListener("click", () => {
    resetPagedState("quotaLogs");
    loadQuotaLogs({ page: 1 }).catch((error) =>
      setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error")
    );
  });

  document.getElementById("reload-audits-btn")?.addEventListener("click", () => {
    resetPagedState("audits");
    loadAudits({ page: 1 }).catch((error) =>
      setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error")
    );
  });

  refs.adminQuotaLogTypeFilter?.addEventListener("change", () => {
    resetPagedState("quotaLogs");
    loadQuotaLogs({ page: 1 }).catch((error) =>
      setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error")
    );
  });

  refs.adminQuotaLogKeywordInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resetPagedState("quotaLogs");
    loadQuotaLogs({ page: 1 }).catch((error) =>
      setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error")
    );
  });

  refs.adminAuditKeywordInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resetPagedState("audits");
    loadAudits({ page: 1 }).catch((error) =>
      setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error")
    );
  });

  refs.adminAuditActionInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resetPagedState("audits");
    loadAudits({ page: 1 }).catch((error) =>
      setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error")
    );
  });
}

export function renderLogsPage(context) {
  renderLogsSection(context);
}
