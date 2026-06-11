export async function loadAccountData(ctx) {
  const session = ctx.loadSession();
  if (!session?.token) {
    ctx.setDebugLine("account.session", "missing");
    ctx.renderLoggedOutAccountState();
    return;
  }

  const sessionProfileFallback = ctx.getSessionProfileFallback(session);
  if (sessionProfileFallback) {
    ctx.setDebugLine(
      "account.session",
      `${sessionProfileFallback.game_role_id || "-"} / ${sessionProfileFallback.game_role_name || "-"}`
    );
    ctx.applySessionProfileFallback(sessionProfileFallback);
  }

  try {
    const profile = await ctx.apiFetch("/auth/me");
    const [quotaResult, ordersResult, rechargeConfigResult, rechargeOrdersResult, escrowTradesResult] =
      await Promise.allSettled([
        ctx.apiFetch("/me/quota"),
        ctx.apiFetch("/me/orders"),
        ctx.apiFetch("/me/recharge-config"),
        ctx.apiFetch("/me/recharge-orders"),
        ctx.apiFetch("/orders/consignments/mine"),
      ]);
    const quota =
      quotaResult.status === "fulfilled"
        ? quotaResult.value
        : { balance: profile?.quota_balance ?? sessionProfileFallback?.quota_balance ?? 0 };
    const rechargeConfig =
      rechargeConfigResult.status === "fulfilled" ? rechargeConfigResult.value : null;
    const normalizedOrders =
      ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value)
        ? ordersResult.value
        : [];
    const normalizedRechargeOrders =
      rechargeOrdersResult.status === "fulfilled" && Array.isArray(rechargeOrdersResult.value)
        ? rechargeOrdersResult.value
        : [];
    const normalizedEscrowTrades =
      escrowTradesResult.status === "fulfilled" && Array.isArray(escrowTradesResult.value)
        ? escrowTradesResult.value
        : [];

    ctx.saveSession({ ...session, profile });
    ctx.applyLoadedAccountState({
      profile,
      quota,
      orders: normalizedOrders,
      rechargeConfig,
      rechargeOrders: normalizedRechargeOrders,
      escrowTrades: normalizedEscrowTrades,
    });

    ctx.setDebugLine("account.profile", `${profile?.game_role_id || "-"} / ${profile?.game_role_name || "-"}`);
    ctx.setDebugLine("account.quota", String(quota?.balance ?? profile?.quota_balance ?? 0));
    ctx.setDebugLine("account.orders", String(normalizedOrders.length));
    if (ordersResult.status === "rejected") {
      ctx.setDebugLine("account.orders_error", ordersResult.reason?.message || "load_failed");
    }
    if (rechargeOrdersResult.status === "rejected") {
      ctx.setDebugLine(
        "account.recharge_orders_error",
        rechargeOrdersResult.reason?.message || "load_failed"
      );
    }

    if (ctx.shouldBootstrap("helper")) {
      ctx.loadHelperBindings();
      ctx.loadHelperInventories();
      ctx.loadHelperSnapshots();
      ctx.loadHelperActionLogs();
    }
    if (ctx.shouldBootstrap("auctions")) {
      await ctx.loadAuctions();
    }
    if (ctx.consumePostAuthAccountFocus()) {
      ctx.focusAccountAfterAuth();
    }
    const secondaryErrors = [
      quotaResult.status === "rejected" ? "额度" : "",
      ordersResult.status === "rejected" ? "订单" : "",
      rechargeConfigResult.status === "rejected" ? "充值配置" : "",
      rechargeOrdersResult.status === "rejected" ? "充值记录" : "",
      escrowTradesResult.status === "rejected" ? "担保交易" : "",
    ].filter(Boolean);
    ctx.setNotice(
      secondaryErrors.length
        ? `账户信息部分加载成功，以下内容稍后可重试：${secondaryErrors.join("、")}`
        : ""
    );
  } catch (error) {
    ctx.setDebugLine("account.error", error?.message || String(error));
    if (error.status === 401 || error.status === 403) {
      ctx.clearSession();
      ctx.renderLoggedOutAccountState("登录状态已失效，请重新登录。", "error");
      return;
    }
    ctx.setNotice(`账户信息加载失败：${error.message}`, "error");
  }
}
