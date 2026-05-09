export async function bindAccountAction(ctx) {
  ctx.setNotice("正在绑定...", "");
  try {
    const result = await ctx.apiFetch("/auth/game/bind", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: ctx.bindRoleId,
        game_server: ctx.bindServer,
        game_role_name: ctx.bindRoleName,
        bind_token_id: ctx.bindTokenId,
        nickname: ctx.bindNickname,
      }),
    });
    ctx.saveSession(result);
    ctx.applyImmediateAuthResult(result);
    await ctx.loadHelperConfig();
    ctx.schedulePostAuthAccountFocus();
    ctx.setNotice("绑定成功，已保存登录状态。", "success");
    await ctx.completePostAuthNavigation();
  } catch (error) {
    ctx.setNotice(`绑定失败：${ctx.pickErrorMessage(error, "绑定失败")}`, "error");
  }
}

export async function loginAccountAction(ctx) {
  ctx.setNotice("正在登录...", "");
  try {
    const result = await ctx.apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: ctx.roleId,
        password: ctx.password,
      }),
    });
    ctx.saveSession(result);
    ctx.applyImmediateAuthResult(result);
    await ctx.loadHelperConfig();
    ctx.schedulePostAuthAccountFocus();
    ctx.setNotice("登录成功。", "success");
    ctx.clearPasswordInput();
    await ctx.completePostAuthNavigation();
  } catch (error) {
    ctx.setNotice(`登录失败：${ctx.pickErrorMessage(error, "登录失败")}`, "error");
  }
}

export async function registerAccountAction(ctx) {
  ctx.clearRoleIdValidity();
  if (!ctx.validatePasswordMatch()) {
    ctx.setNotice("两次输入的密码不一致，请重新确认。", "error");
    ctx.focusPasswordConfirm();
    return;
  }

  ctx.setNotice("正在注册...", "");
  try {
    const result = await ctx.apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: ctx.roleId,
        game_role_name: ctx.roleName,
        password: ctx.password,
      }),
    });
    ctx.saveSession(result);
    ctx.applyImmediateAuthResult(result);
    await ctx.loadHelperConfig();
    ctx.schedulePostAuthAccountFocus();
    ctx.setNotice("注册成功，已自动登录。", "success");
    ctx.clearRegisterPasswords();
    await ctx.completePostAuthNavigation();
  } catch (error) {
    const isRoleIdTaken = error?.payload?.error === "game_role_id_taken";
    const message = isRoleIdTaken ? "这个游戏 ID 已经注册过账号了，请直接登录。" : ctx.pickErrorMessage(error, "注册失败");
    if (isRoleIdTaken) {
      ctx.markRoleIdTaken(message);
    }
    ctx.setNotice(`注册失败：${message}`, "error");
  }
}
