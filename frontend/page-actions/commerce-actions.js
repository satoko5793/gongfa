function refreshAfterWrite(task) {
  Promise.resolve()
    .then(() => task())
    .catch(() => {});
}

export async function submitRechargeOrderAction(ctx) {
  const session = ctx.loadSession();
  if (!session?.token) {
    ctx.setAccountMessage("请先登录后再提交充值申请。", "error");
    return;
  }

  const orderType =
    ctx.selectedRechargeOrderType === "season_member"
      ? "season_member"
      : ctx.selectedRechargeOrderType === "residual_transfer"
        ? "residual_transfer"
        : "normal";
  const amountYuan =
    orderType === "season_member"
      ? Number(ctx.currentRechargeConfig?.season_member_price_yuan || 0)
      : Number(ctx.amountValue);
  const paymentReference = String(ctx.paymentReference || "").trim();
  const payerNote = String(ctx.payerNote || "").trim();
  const sessionProfile = session.profile || null;
  const pendingSeasonOrder = ctx.findPendingSeasonMemberOrder(ctx.currentRechargeOrders, ctx.currentRechargeConfig);

  if (orderType === "normal") {
    if (!ctx.isPositiveMoneyAmount(amountYuan)) {
      ctx.setAccountMessage("充值金额必须大于 0，且最多保留两位小数。", "error");
      return;
    }
  } else if (orderType === "residual_transfer") {
    if (!Number.isInteger(amountYuan) || amountYuan <= 0) {
      ctx.setAccountMessage(`转赠${ctx.currentRechargeConfig?.residual_unit_label || "残卷"}数量必须是大于 0 的整数。`, "error");
      return;
    }
  } else {
    if (sessionProfile?.season_member_active) {
      ctx.setAccountMessage("你本赛季已经是会员了，无需重复开通。", "error");
      return;
    }
    if (pendingSeasonOrder) {
      ctx.setAccountMessage("你的赛季会员申请正在审核中，请勿重复提交。", "error");
      return;
    }
  }
  if (!paymentReference) {
    ctx.setAccountMessage("请填写付款备注、付款单号或转账尾号。", "error");
    return;
  }

  try {
    const result = await ctx.apiFetch("/me/recharge-orders", {
      method: "POST",
      body: JSON.stringify({
        order_type: orderType,
        amount_yuan: amountYuan,
        payment_channel: orderType === "residual_transfer" ? undefined : ctx.selectedRechargePaymentChannel,
        payment_reference: paymentReference,
        payer_note: payerNote,
      }),
    });
    ctx.handleRechargeSubmitSuccess({ orderType, amountYuan, orderId: result.id });
    refreshAfterWrite(() => ctx.loadAccount());
  } catch (error) {
    const code = error?.payload?.error || error?.message;
    const customMessage =
      code === "season_member_already_active"
        ? "你本赛季已经是会员了，无需重复开通。"
        : code === "season_member_pending_review"
          ? "你的赛季会员申请正在审核中，请勿重复提交。"
          : code === "season_member_disabled"
            ? "当前暂未开放赛季会员。"
            : code === "residual_transfer_disabled"
              ? "当前暂未开放残卷转赠。"
              : ctx.pickErrorMessage(error, "提交失败");
    ctx.setAccountMessage(`充值申请提交失败：${customMessage}`, "error");
  }
}

export async function confirmPurchaseAction(ctx) {
  const session = ctx.loadSession();
  if (!session?.token) {
    ctx.setProductDetailMessage("请先登录后再购买。", "error");
    ctx.setNotice("请先登录后再购买。", "error");
    ctx.navigateToLoginEntry();
    return;
  }

  const product = ctx.findProduct(ctx.activeItemId, ctx.activeItemKind);
  if (!product) {
    ctx.setProductDetailMessage("当前商品不存在或已下架。", "error");
    return;
  }
  const quotaPolicy = ctx.getQuotaPurchasePolicy ? ctx.getQuotaPurchasePolicy(product) : null;
  if (quotaPolicy?.quota_purchase_disabled) {
    const message =
      quotaPolicy.quota_purchase_disabled_reason ||
      "赛季首周，当赛季双词条金卡、2.5 及以上单词条金卡暂不支持额度购买，请使用转账锁卡或残卷转赠。";
    ctx.setProductDetailMessage(message, "error");
    ctx.setNotice(message, "error");
    return;
  }

  const remark = String(ctx.remark || "").trim();
  let currentQuota = ctx.getCurrentQuotaValue();
  const price = Number(product.price_quota || 0);
  try {
    const latestQuota = await ctx.apiFetch("/me/quota");
    const latestBalance = Number(latestQuota?.balance);
    if (Number.isFinite(latestBalance)) {
      currentQuota = latestBalance;
    }
  } catch (_error) {
    // Fall back to the last rendered quota when quota refresh is temporarily unavailable.
  }
  if (currentQuota !== null && currentQuota < price) {
    ctx.setProductDetailMessage(`当前额度不足，还差 ${price - currentQuota}。`, "error");
    return;
  }

  const remaining = currentQuota === null ? null : currentQuota - price;
  ctx.setProductDetailMessage(
    remaining === null
      ? `正在提交购买：${product.name}，额度余额会在提交后自动刷新。`
      : `正在提交购买：${product.name}，预计剩余 ${remaining} 额度。`
  );

  try {
    const order = await ctx.apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        item_id: Number(ctx.activeItemId),
        item_kind: ctx.activeItemKind,
        bundle_selection: product?.configurable_bundle ? ctx.bundleSelection || product.selected_bundle_options : undefined,
        remark: remark || undefined,
      }),
    });
    ctx.setNotice(`下单成功，订单 #${order.id} 已创建。`, "success");
    ctx.setProductDetailMessage(
      remaining === null
        ? `已扣除 ${price} 额度，余额稍后自动刷新。`
        : `已扣除 ${price} 额度，剩余 ${remaining}。`,
      "success"
    );
    ctx.closeProductModal();
    refreshAfterWrite(() => Promise.allSettled([ctx.loadProducts(), ctx.loadAccount()]));
  } catch (error) {
    const baseMessage = ctx.pickErrorMessage(error, "下单失败");
    const message =
      baseMessage === "quota_purchase_restricted_current_season_first_week"
        ? "赛季首周，当赛季双词条金卡、2.5 及以上单词条金卡暂不支持额度购买，请使用转账锁卡或残卷转赠。"
        : baseMessage;
    ctx.setProductDetailMessage(`下单失败：${message}`, "error");
    ctx.setNotice(`下单失败：${message}`, "error");
  }
}

export async function requestCancelOrderAction(ctx) {
  const confirmed = ctx.confirmCancelOrder();
  if (!confirmed) return;

  try {
    await ctx.apiFetch(`/orders/${ctx.orderId}/cancel-request`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    ctx.setNotice(`订单 #${ctx.orderId} 已提交取消申请。`, "success");
    refreshAfterWrite(() => ctx.loadAccount());
  } catch (error) {
    ctx.setNotice(`提交取消申请失败：${ctx.pickErrorMessage(error, "提交失败")}`, "error");
  }
}

export async function submitGuestTransferOrderAction(ctx) {
  const product = ctx.findProduct(ctx.activeItemId, ctx.activeItemKind);
  if (!product) {
    ctx.setProductDetailMessage("当前商品不存在或已下架。", "error");
    return;
  }

  const rechargeConfig = ctx.getEffectiveRechargeConfig();
  const directPurchaseContext = ctx.buildDirectPurchaseContext(product, rechargeConfig);
  if (!directPurchaseContext) {
    ctx.setProductDetailMessage("当前还没拿到金额换算配置，请稍后再试。", "error");
    return;
  }
  const isResidualGuestPurchase = ctx.selectedGuestTransferPaymentChannel === "game_residual_transfer";
  const directResidualAmount = ctx.getDirectResidualAmount(product, rechargeConfig);

  const roleId = String(ctx.roleId || "").trim();
  const roleName = String(ctx.roleName || "").trim();
  const nickname = String(ctx.nickname || "").trim();
  const paymentReference = String(ctx.paymentReference || "").trim();
  const payerNote = String(ctx.payerNote || "").trim();

  if (!roleId) {
    ctx.setProductDetailMessage("请填写游戏 ID。", "error");
    return;
  }
  if (!roleName) {
    ctx.setProductDetailMessage("请填写角色名。", "error");
    return;
  }
  if (!paymentReference) {
    ctx.setProductDetailMessage("请填写付款时间或付款备注。", "error");
    return;
  }

  try {
    const order = await ctx.apiFetch("/orders/guest-transfer", {
      method: "POST",
      body: JSON.stringify({
        item_id: Number(product.item_id),
        item_kind: product.item_kind || "card",
        bundle_selection: product?.configurable_bundle ? ctx.bundleSelection || product.selected_bundle_options : undefined,
        game_role_id: roleId,
        game_role_name: roleName,
        nickname: nickname || undefined,
        amount_yuan: isResidualGuestPurchase ? undefined : directPurchaseContext.amountYuan,
        transfer_amount: isResidualGuestPurchase ? Number(directResidualAmount || 0) : undefined,
        payment_channel: ctx.selectedGuestTransferPaymentChannel,
        payment_reference: paymentReference,
        payer_note: payerNote || undefined,
      }),
    });
    ctx.closeProductModal();
    const paymentLabel = isResidualGuestPurchase
      ? "残卷转赠"
      : ctx.formatRechargeChannelLabel(ctx.selectedGuestTransferPaymentChannel);
    ctx.setNotice(
      `锁卡订单 #${order.id} 已提交，${product.name} 已先为你保留，等待管理员核对${paymentLabel}${isResidualGuestPurchase ? "" : "收款"}。`,
      "success"
    );
    refreshAfterWrite(() => ctx.loadProducts({ resetPage: false }));
  } catch (error) {
    const expectedAmount = Number(error?.payload?.expected_amount_yuan || 0);
    const expectedTransferAmount = Number(error?.payload?.expected_transfer_amount || 0);
    const transferUnit = String(error?.payload?.transfer_unit || "残卷");
    const baseMessage = ctx.pickErrorMessage(error, "提交失败");
    const customMessage =
      baseMessage === "amount_yuan_mismatch" && expectedAmount > 0
        ? `订单金额已变化，请按最新金额 ${ctx.formatCashAmount(expectedAmount)} 重新提交。`
        : baseMessage === "transfer_amount_mismatch" && expectedTransferAmount > 0
          ? `订单所需转赠数量已变化，请按最新数量 ${expectedTransferAmount} ${transferUnit} 重新提交。`
          : baseMessage;
    ctx.setProductDetailMessage(`锁卡提交失败：${customMessage}`, "error");
  }
}
