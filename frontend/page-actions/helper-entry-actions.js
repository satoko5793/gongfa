export function openHelperToolAction(ctx) {
  const origin = String(ctx.getHelperOriginInputValue?.() || "").trim();
  if (!origin) {
    ctx.setNotice("请先填写 helper 地址。", "error");
    return false;
  }
  ctx.setHelperOrigin(origin);
  ctx.openWindow(ctx.withHelperCacheBuster(origin), "_blank");
  return true;
}

export function openHelperBindPopupAction(ctx) {
  if (!ctx.getCurrentProfile()) {
    ctx.setHelperBindMessage("请先登录商城账号，再绑定游戏角色。", "error");
    ctx.navigateToLoginEntry();
    return false;
  }
  if (!ctx.isHelperLineupEnabled() || !ctx.isHelperScanBindEnabled()) {
    ctx.setHelperBindMessage(ctx.getHelperLineupDisabledReason("当前环境未开启角色绑定。"), "error");
    return false;
  }
  ctx.rememberHelperBridgeIntent(ctx.HELPER_BRIDGE_INTENT_BIND);
  const opened = ctx.openHelperBridgeModalSurface(ctx.buildHelperBridgeBindUrl(), {
    mode: "bind",
    title: "绑定游戏角色",
    message: "在当前页面完成角色绑定。你可以扫码，也可以在角色列表里直接选择已有角色。",
    hint: "完成后会自动回到商城，不需要手动切回。",
  });
  if (!opened) {
    ctx.setHelperBindMessage("当前页面暂时无法打开角色绑定层，请稍后重试。", "error");
    return false;
  }
  ctx.setHelperBindMessage("角色绑定层已打开，请在当前页面完成扫码或选择角色。", "success");
  return true;
}

export async function openHelperAuthPopupAction(ctx) {
  await ctx.loadHelperConfig?.();
  if (!ctx.isHelperScanAuthEnabled()) {
    ctx.setHelperAuthMessage("当前环境未开启扫码登录商城账号。", "error");
    return false;
  }
  ctx.rememberHelperBridgeIntent(ctx.HELPER_BRIDGE_INTENT_AUTH);
  const opened = ctx.openHelperBridgeModalSurface(ctx.buildHelperBridgeBindUrl(), {
    mode: "auth",
    title: "扫码登录商城账号",
    message: "在当前页面完成扫码或选择游戏角色，系统会自动进入对应商城账号。",
    hint: "扫码后选中角色即可，不需要再手动回跳。",
  });
  if (!opened) {
    ctx.setHelperAuthMessage("当前页面暂时无法打开扫码登录层，请稍后重试。", "error");
    return false;
  }
  ctx.setHelperAuthMessage("扫码登录层已打开，请在当前页面扫码并选择角色。", "success");
  return true;
}
