export function normalizeDrawServiceAmount(value, { minQuota = 200, stepQuota = 200 } = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const roundedAmount = Math.ceil(amount / stepQuota) * stepQuota;
  return Math.max(minQuota, roundedAmount);
}

export function updateDrawServiceQuoteRuntime(ctx) {
  const amountInput = document.getElementById("draw-service-amount-input");
  const valueNode = document.getElementById("draw-service-quote-value");
  const detailNode = document.getElementById("draw-service-quote-detail");
  if (!amountInput || !valueNode || !detailNode) return;

  const normalizedAmount = ctx.normalizeDrawServiceAmount(amountInput.value);
  const balance = Number(ctx.getCurrentQuota()?.balance ?? ctx.getCurrentProfile()?.quota_balance ?? 0);

  if (!normalizedAmount) {
    valueNode.textContent = "请输入代抽额度";
    detailNode.textContent = `最低 ${ctx.minQuota}，不是 ${ctx.stepQuota} 的倍数会在提交时自动补齐。`;
    return;
  }

  const milestoneCount = Math.floor(normalizedAmount / ctx.milestoneQuota);
  const rawAmount = Number(amountInput.value || 0);
  const autoAdjusted = Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== normalizedAmount;
  valueNode.textContent = `本次代抽 ${normalizedAmount} 额度`;
  detailNode.textContent =
    milestoneCount > 0
      ? `${autoAdjusted ? `输入值会自动补齐到 ${normalizedAmount}；` : ""}本单已覆盖 ${milestoneCount} 个 5w 档位；当前可用额度 ${balance}`
      : `${autoAdjusted ? `输入值会自动补齐到 ${normalizedAmount}；` : ""}当前可用额度 ${balance}，累计满 5w 才会触发赛季返利。`;
}

export function handleDrawServiceBodyInputRuntime(ctx, event) {
  if (event.target?.id !== "draw-service-amount-input") return false;
  const nextValue = Number(event.target.value || 0);
  if (Number.isFinite(nextValue)) {
    ctx.setSelectedDrawServiceAmount(nextValue);
  }
  ctx.updateDrawServiceQuote();
  return true;
}

export function handleDrawServiceBodyClickRuntime(ctx, event) {
  const presetButton = event.target.closest("[data-draw-service-amount]");
  if (!presetButton) return false;
  const amount = Number(presetButton.getAttribute("data-draw-service-amount") || 0);
  ctx.setSelectedDrawServiceAmount(amount);
  ctx.renderDrawServiceZone(ctx.getCurrentProfile(), ctx.getCurrentQuota());
  return true;
}

export function handleDrawServiceBodySubmitRuntime(ctx, event) {
  if (event.target?.id !== "draw-service-form") return false;
  ctx.submitDrawServiceOrder(event);
  return true;
}
