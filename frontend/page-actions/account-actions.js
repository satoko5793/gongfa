export async function saveAccountProfileAction(ctx) {
  const session = ctx.loadSession();
  if (!session?.token) {
    ctx.setAccountMessage("请先登录后再修改资料。", "error");
    return;
  }

  try {
    const profile = await ctx.apiFetch("/me/profile", {
      method: "PATCH",
      body: JSON.stringify({
        game_role_name: ctx.gameRoleName,
        nickname: ctx.nickname,
        game_server: ctx.gameServer,
      }),
    });
    ctx.saveSession({ ...session, profile });
    ctx.setAccountMessage("资料已更新。", "success");
    await ctx.loadAccount();
  } catch (error) {
    ctx.setAccountMessage(`资料更新失败：${ctx.pickErrorMessage(error, "更新失败")}`, "error");
  }
}

export async function changeAccountPasswordAction(ctx) {
  const session = ctx.loadSession();
  if (!session?.token) {
    ctx.setAccountMessage("请先登录后再修改密码。", "error");
    return;
  }

  if (!ctx.currentPassword || !ctx.newPassword) {
    ctx.setAccountMessage("请填写完整密码信息。", "error");
    return;
  }
  if (ctx.newPassword.length < 6) {
    ctx.setAccountMessage("新密码至少需要 6 位。", "error");
    return;
  }
  if (ctx.newPassword !== ctx.confirmPassword) {
    ctx.setAccountMessage("两次输入的新密码不一致。", "error");
    return;
  }

  try {
    await ctx.apiFetch("/me/password", {
      method: "PATCH",
      body: JSON.stringify({
        current_password: ctx.currentPassword,
        new_password: ctx.newPassword,
      }),
    });
    ctx.clearPasswordForm();
    ctx.setAccountMessage("密码已更新。", "success");
  } catch (error) {
    ctx.setAccountMessage(`密码更新失败：${ctx.pickErrorMessage(error, "更新失败")}`, "error");
  }
}

export function logoutCurrentSessionAction(ctx) {
  ctx.clearSession();
  ctx.loadHelperConfig().catch(() => {});
  ctx.resetPostLogoutUiState();
  ctx.activateAccountTab("overview");
  ctx.renderSessionSummary(null);
  ctx.renderProfile(null, null, []);
  ctx.renderRechargeSection(null, null, []);
  ctx.setNotice("已退出登录。", "success");
  ctx.setAccountMessage("");
  if (ctx.toBind) {
    ctx.navigateToLoginEntry();
  }
}
