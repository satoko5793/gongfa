export async function submitDrawServiceOrderAction(ctx) {
  ctx.event?.preventDefault?.();

  const amountInput = document.getElementById("draw-service-wan-input");
  const rawAmount = Number(amountInput?.value || ctx.getSelectedDrawServiceWan());
  const quote = ctx.getDrawServiceSelectionQuote(
    amountInput?.value || ctx.getSelectedDrawServiceWan()
  );
  const balance = Number(ctx.getCurrentQuota()?.balance ?? ctx.getCurrentProfile()?.quota_balance ?? 0);

  if (!ctx.getCurrentProfile()) {
    ctx.setDrawServiceMessage("请先登录后再提交代抽订单。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (!quote) {
    ctx.setDrawServiceMessage("请选择代抽档位并填写抽取数量。", "error");
    return;
  }
  if (quote.blockedReason === "season_member_required") {
    ctx.setDrawServiceMessage("请先开通本赛季会员后再使用 6.5 元 / 1w 代抽福利档；该福利每赛季一次。", "error");
    return;
  }
  if (quote.blockedReason === "season_member_draw_benefit_max_exceeded") {
    ctx.setDrawServiceMessage(`赛季会员福利档每赛季一次，单次最多 ${quote.maxDrawWan}w。`, "error");
    return;
  }
  if (quote.blockedReason === "residual_transfer_disabled") {
    ctx.setDrawServiceMessage("残卷转赠审核暂时关闭，请换用其他档位或联系管理员。", "error");
    return;
  }
  if (amountInput) {
    amountInput.value = String(quote.drawAmountWan);
  }
  ctx.setSelectedDrawServiceWan(quote.drawAmountWan);
  ctx.setSelectedDrawServiceTierKey(quote.tierKey);
  const isResidualTransfer = quote.paymentMethod === "residual_transfer";
  const roleId = String(document.getElementById("draw-service-role-id")?.value || "").trim();
  const roleName = String(document.getElementById("draw-service-role-name")?.value || "").trim();
  const nickname = String(document.getElementById("draw-service-nickname")?.value || "").trim();
  const paymentReference = String(document.getElementById("draw-service-payment-reference")?.value || "").trim();
  const payerNote = String(document.getElementById("draw-service-payer-note")?.value || "").trim();

  if (isResidualTransfer) {
    if (!roleId) {
      ctx.setDrawServiceMessage("请填写游戏 ID，方便管理员核对残卷转赠。", "error");
      return;
    }
    if (!roleName) {
      ctx.setDrawServiceMessage("请填写角色名，方便管理员核对残卷转赠。", "error");
      return;
    }
    if (!paymentReference) {
      ctx.setDrawServiceMessage("请填写转赠时间。", "error");
      return;
    }
  }

  if (!isResidualTransfer && quote.amountQuota > balance) {
    const adjustedText =
      Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== quote.drawAmountWan
        ? `已按 ${quote.drawAmountWan}w 补齐；`
        : "";
    ctx.setDrawServiceMessage(`${adjustedText}本次需扣 ${quote.amountQuota} 额度，当前额度不足。`, "error");
    return;
  }

  try {
    const order = await ctx.apiFetch("/orders/draw-service", {
      method: "POST",
      body: JSON.stringify({
        tier_key: quote.tierKey,
        draw_amount_wan: quote.drawAmountWan,
        transfer_amount: isResidualTransfer ? quote.transferAmount : undefined,
        game_role_id: isResidualTransfer ? roleId : undefined,
        game_role_name: isResidualTransfer ? roleName : undefined,
        nickname: isResidualTransfer && nickname ? nickname : undefined,
        payment_reference: isResidualTransfer ? paymentReference : undefined,
        payer_note: isResidualTransfer && payerNote ? payerNote : undefined,
      }),
    });
    const adjustedText =
      Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== quote.drawAmountWan
        ? `已自动补齐到 ${quote.drawAmountWan}w。`
        : "";
    ctx.setDrawServiceMessage(
      isResidualTransfer
        ? `${adjustedText}代抽单 #${order.id} 已提交，${quote.tier.label}，等待管理员核对 ${quote.transferAmount} ${quote.transferUnit} 转赠后代抽。`
        : `${adjustedText}代抽单 #${order.id} 已提交，${quote.tier.label}，扣 ${quote.amountQuota} 额度。管理员完成后会录入返还结果。`,
      "success"
    );
    await ctx.loadAccount();
  } catch (error) {
    const message =
      String(error?.message || "").includes("season_member_required")
        ? "请先开通本赛季会员后再使用 6.5 元 / 1w 代抽福利档；该福利每赛季一次。"
        : String(error?.message || "").includes("season_member_draw_benefit_max_exceeded")
          ? "赛季会员福利档每赛季一次，单次最多 5w。"
          : String(error?.message || "").includes("season_member_draw_benefit_used")
            ? "本赛季已使用过 6.5 元 / 1w 代抽福利档。"
          : String(error?.message || "").includes("transfer_amount_mismatch")
            ? "残卷转赠数量与当前档位不一致，请刷新后重新提交。"
          : String(error?.message || "").includes("payment_reference_required")
            ? "请填写转赠时间。"
        : `代抽提交失败：${error.message}`;
    ctx.setDrawServiceMessage(message, "error");
  }
}
