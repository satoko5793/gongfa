export async function submitDrawServiceOrderAction(ctx) {
  ctx.event?.preventDefault?.();

  const amountInput = document.getElementById("draw-service-amount-input");
  const rawAmount = Number(amountInput?.value || ctx.getSelectedDrawServiceAmount());
  const normalizedAmount = ctx.normalizeDrawServiceAmount(
    amountInput?.value || ctx.getSelectedDrawServiceAmount()
  );
  const balance = Number(ctx.getCurrentQuota()?.balance ?? ctx.getCurrentProfile()?.quota_balance ?? 0);

  if (!ctx.getCurrentProfile()) {
    ctx.setDrawServiceMessage("请先登录后再提交代抽订单。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (!normalizedAmount) {
    ctx.setDrawServiceMessage(`代抽额度最低 ${ctx.minQuota}。`, "error");
    return;
  }
  if (amountInput) {
    amountInput.value = String(normalizedAmount);
  }
  ctx.setSelectedDrawServiceAmount(normalizedAmount);
  if (normalizedAmount > balance) {
    const adjustedText =
      Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== normalizedAmount
        ? `已按 ${normalizedAmount} 额度补齐；`
        : "";
    ctx.setDrawServiceMessage(`${adjustedText}当前额度不足，先去获取额度再来提交。`, "error");
    return;
  }

  try {
    const order = await ctx.apiFetch("/orders/draw-service", {
      method: "POST",
      body: JSON.stringify({ amount_quota: normalizedAmount }),
    });
    const adjustedText =
      Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== normalizedAmount
        ? `已自动补齐到 ${normalizedAmount} 额度。`
        : "";
    ctx.setDrawServiceMessage(
      `${adjustedText}代抽单 #${order.id} 已提交，管理员代抽后会返还符合规则的卡，并在确认时录入返还结果。`,
      "success"
    );
    await ctx.loadAccount();
  } catch (error) {
    ctx.setDrawServiceMessage(`代抽提交失败：${error.message}`, "error");
  }
}
