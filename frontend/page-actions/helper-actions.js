const HELPER_GAME_FEATURES = {
  daily_tasks: {
    capability: "game.daily_tasks",
    label: "每日任务",
  },
  salt_robot_claim: {
    capability: "game.salt_robot_claim",
    label: "盐罐机器人",
  },
  hangup_claim: {
    capability: "game.hangup_claim",
    label: "挂机领取",
  },
  hangup_extend: {
    capability: "game.hangup_extend",
    label: "挂机加钟",
  },
  club_checkin: {
    capability: "game.club_checkin",
    label: "俱乐部签到",
  },
  club_ranking: {
    capability: "game.club_ranking",
    label: "俱乐部报名",
  },
  tower_challenge: {
    capability: "game.tower_challenge",
    label: "咸将塔单次",
  },
  arena_challenge: {
    capability: "game.arena_challenge",
    label: "竞技场单次",
  },
};

export function startHelperInventorySyncAction(ctx, bindings, mode = "current") {
  const filteredBindings = (bindings || []).filter(Boolean);
  if (!ctx.getCurrentProfile()) {
    ctx.setHelperInventoryMessage("请先登录商城账号，再同步功法仓库。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (!ctx.isHelperInventoryEnabled()) {
    ctx.setHelperInventoryMessage(ctx.getHelperLineupDisabledReason("当前环境未开启功法仓库同步。"), "error");
    return;
  }
  if (!filteredBindings.length) {
    ctx.setHelperInventoryMessage("请先绑定至少一个游戏角色，再同步功法仓库。", "error");
    return;
  }
  if (ctx.getHelperInventorySyncState().running) {
    ctx.setHelperInventoryMessage("上一轮功法同步还在进行中，请稍等。", "error");
    return;
  }
  ctx.setHelperInventorySyncState({
    running: true,
    mode,
    queue: [...filteredBindings],
    total: filteredBindings.length,
    completed: 0,
    failures: [],
    currentBindingId: null,
    pendingInventories: [],
    batchSaving: false,
  });
  ctx.renderHelperInventoryPanel();
  ctx.startNextHelperInventorySyncInQueue();
}

export function syncCurrentHelperInventoryAction(ctx) {
  const activeBinding = ctx.getActiveHelperBinding();
  if (!activeBinding) {
    ctx.setHelperInventoryMessage("请先选择一个当前使用角色，再同步功法仓库。", "error");
    return;
  }
  ctx.startHelperInventorySync([activeBinding], "current");
}

export function syncAllHelperInventoriesAction(ctx) {
  const bindings = Array.isArray(ctx.getCurrentHelperBindings()) ? ctx.getCurrentHelperBindings() : [];
  ctx.startHelperInventorySync(bindings, "all");
}

export function openHelperGameFeatureAction(ctx, featureKey) {
  const feature = HELPER_GAME_FEATURES[String(featureKey || "").trim()];
  if (!feature) {
    ctx.setHelperGameFeatureMessage("未知 helper 脚本功能。", "error");
    return;
  }
  if (!ctx.getCurrentProfile()) {
    ctx.setHelperGameFeatureMessage("请先登录商城账号，再执行 helper 脚本。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (!ctx.isHelperLineupEnabled() || !ctx.isHelperGameFeaturesEnabled()) {
    ctx.setHelperGameFeatureMessage(ctx.getHelperLineupDisabledReason("当前环境未开启 helper 游戏脚本。"), "error");
    return;
  }
  if (ctx.hasHelperCapability?.(feature.capability) !== true) {
    ctx.setHelperGameFeatureMessage(`当前账号没有“${feature.label}”权限。`, "error");
    return;
  }
  const activeBinding = ctx.getActiveHelperBinding();
  if (!activeBinding) {
    ctx.setHelperGameFeatureMessage("请先完成 helper 角色绑定，再执行脚本。", "error");
    return;
  }
  const confirmed = ctx.confirmAction(
    `确认让 helper 对“${activeBinding.game_role_name || "当前角色"}”执行“${feature.label}”吗？`
  );
  if (!confirmed) {
    ctx.setHelperGameFeatureMessage(`已取消执行“${feature.label}”。`, "");
    return;
  }
  const opened = ctx.runHelperBridgeInBackground(
    ctx.buildHelperBridgeGameFeatureUrl(activeBinding, featureKey),
    "gameFeature"
  );
  if (!opened) {
    ctx.setHelperGameFeatureMessage("当前页面暂时无法执行 helper 脚本，请稍后重试。", "error");
    return;
  }
  ctx.setHelperGameFeatureMessage(`正在执行“${feature.label}”，完成后会写入执行日志。`, "success");
}

export async function importHelperInventoryProductsAction(ctx) {
  const profile = ctx.getCurrentProfile();
  if (!profile) {
    ctx.setHelperInventoryMessage("请先登录管理员账号，再导入商城商品。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (String(profile?.role || "").trim() !== "admin") {
    ctx.setHelperInventoryMessage("当前账号没有导入商品权限。", "error");
    return;
  }
  const inventories = Array.isArray(ctx.getCurrentHelperInventories()) ? ctx.getCurrentHelperInventories() : [];
  const hasItems = inventories.some(
    (inventory) => Number(inventory?.item_count || 0) > 0 || (Array.isArray(inventory?.items) && inventory.items.length > 0)
  );
  if (!hasItems) {
    ctx.setHelperInventoryMessage("还没有已同步的功法库存，先同步当前号或全部炉子。", "error");
    return;
  }
  if (ctx.getHelperInventoryImportState().running) {
    ctx.setHelperInventoryMessage("上一轮导入还没完成，请稍等。", "error");
    return;
  }
  const seasonLabel = String(ctx.getHelperLineupPlan()?.season_label || "当前赛季").trim() || "当前赛季";
  const confirmed = ctx.confirmAction(
    `把已同步功法仓库导入商城商品吗？系统会按当前赛季配置（${seasonLabel}）重新判断本季和老卡，并覆盖旧的未保留商品。`
  );
  if (!confirmed) return;

  ctx.setHelperInventoryImportState({ running: true });
  ctx.renderHelperInventoryPanel();
  ctx.setHelperInventoryMessage("正在把已同步库存导入商城商品，请稍等...", "success");
  try {
    const result = await ctx.apiFetch("/admin/imports/helper-inventories", {
      method: "POST",
    });
    await ctx.loadProducts();
    await ctx.loadHelperInventories();
    ctx.setHelperInventoryMessage(
      `导入完成，共生成 ${Number(result?.parsed_count || 0)} 个商品分组。`,
      "success"
    );
  } catch (error) {
    ctx.setHelperInventoryMessage(`导入失败：${ctx.pickErrorMessage(error, "导入失败")}`, "error");
  } finally {
    ctx.setHelperInventoryImportState({ running: false });
    ctx.renderHelperInventoryPanel();
  }
}

export async function purchaseHelperSlotAction(ctx, purchaseType) {
  if (!ctx.getCurrentProfile()) {
    ctx.setHelperSlotMessage("请先登录商城账号，再购买阵容槽位。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (!ctx.isHelperLineupEnabled()) {
    ctx.setHelperSlotMessage(ctx.getHelperLineupDisabledReason("当前环境未开启阵容中心。"), "error");
    return;
  }

  const plan = ctx.getHelperLineupPlan();
  const isPermanent = purchaseType === "permanent";
  const label = isPermanent ? "永久阵容槽" : `${plan.season_label}阵容槽`;
  const quotaCost = isPermanent ? plan.permanent_slot_quota : plan.seasonal_slot_quota;
  const balance = Number(ctx.getCurrentQuota()?.balance ?? ctx.getCurrentProfile()?.quota_balance ?? 0);
  if (balance < quotaCost) {
    ctx.setHelperSlotMessage(`额度不足，购买 ${label} 需要 ${quotaCost} 额度，当前只有 ${balance}。`, "error");
    return;
  }
  const note = isPermanent
    ? `确认花费 ${quotaCost} 额度购买 1 个永久阵容槽吗？`
    : `确认花费 ${quotaCost} 额度租用 1 个 ${plan.season_label} 阵容槽吗？到 ${ctx.formatDate(plan.season_expires_at || "") || "赛季结束"} 自动失效。`;
  if (!ctx.confirmAction(note)) {
    return;
  }

  try {
    const result = await ctx.apiFetch("/me/lineup-slots/purchase", {
      method: "POST",
      body: JSON.stringify({ purchase_type: purchaseType }),
    });
    const session = ctx.loadSession();
    if (session?.token && result?.user) {
      ctx.saveSession({ ...session, profile: result.user });
    }
    ctx.setHelperSlotMessage(`已购买 ${label}，现在最多可保存 ${Number(result?.user?.lineup_slot_limit || 0)} 套阵容。`, "success");
    await ctx.loadAccount();
    await ctx.loadHelperConfig();
  } catch (error) {
    const code = error?.payload?.error || error?.message || "";
    const message =
      code === "lineup_slot_permanent_max_reached"
        ? `永久阵容槽最多购买 ${plan.permanent_slot_max} 个。`
        : code === "insufficient_quota"
          ? "额度不足，暂时无法购买阵容槽。"
          : ctx.pickErrorMessage(error, "购买失败");
    ctx.setHelperSlotMessage(`购买失败：${message}`, "error");
  }
}

export function openHelperSnapshotAction(ctx) {
  if (!ctx.getCurrentProfile()) {
    ctx.setHelperSnapshotMessage("请先登录商城账号，再保存阵容。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (!ctx.isHelperLineupEnabled() || !ctx.isHelperSnapshotEnabled()) {
    ctx.setHelperSnapshotMessage(ctx.getHelperLineupDisabledReason("当前环境未开启阵容保存。"), "error");
    return;
  }
  const activeBinding = ctx.getActiveHelperBinding();
  if (!activeBinding) {
    ctx.setHelperSnapshotMessage("请先完成角色绑定，再保存阵容。", "error");
    return;
  }
  const snapshotLimit = Math.max(Number(ctx.getHelperConfig()?.limits?.snapshots_per_user || 3) || 3, 1);
  const snapshotCount = Array.isArray(ctx.getCurrentHelperSnapshots()) ? ctx.getCurrentHelperSnapshots().length : 0;
  if (snapshotCount >= snapshotLimit) {
    const limitMessage = `当前最多保存 ${snapshotLimit} 套阵容，请先删除旧阵容再继续保存。`;
    ctx.setHelperSnapshotMessage(limitMessage, "error");
    ctx.alertMessage(limitMessage);
    return;
  }
  if (!activeBinding.bind_token_id) {
    ctx.setHelperSnapshotMessage("当前绑定信息不完整，请重新扫码绑定一次。", "error");
    return;
  }
  const opened = ctx.runHelperBridgeInBackground(
    ctx.buildHelperBridgeSnapshotUrl(activeBinding),
    "teamSnapshot"
  );
  if (!opened) {
    ctx.setHelperSnapshotMessage("当前页面暂时无法启动阵容保存，请稍后重试。", "error");
    return;
  }
  ctx.setHelperSnapshotMessage("正在保存当前阵容，完成后会自动出现在下方卡片里。", "success");
}

export function openHelperTeamSwitchAction(ctx, teamId) {
  if (!ctx.getCurrentProfile()) {
    ctx.setHelperSwitchMessage("请先登录商城账号，再切换预设阵容。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (!ctx.isHelperLineupEnabled() || !ctx.isHelperTeamSwitchEnabled()) {
    ctx.setHelperSwitchMessage(ctx.getHelperLineupDisabledReason("当前环境未开启 helper 预设阵容切换。"), "error");
    return;
  }
  const activeBinding = ctx.getActiveHelperBinding();
  if (!activeBinding) {
    ctx.setHelperSwitchMessage("请先完成 helper 角色绑定，再切换预设阵容。", "error");
    return;
  }
  const normalizedTeamId = Number(teamId || 0);
  if (!Number.isInteger(normalizedTeamId) || normalizedTeamId < 1 || normalizedTeamId > 4) {
    ctx.setHelperSwitchMessage("目标阵容号无效，只支持 1-4 号预设阵容。", "error");
    return;
  }
  const confirmed = ctx.confirmAction(
    [
      `将直接切换到阵容 ${normalizedTeamId}。`,
      "这一步会真正写游戏，不是预演。",
      "如果你只是想先看差异，请点“先做恢复预演”。",
    ].join("\n")
  );
  if (!confirmed) {
    ctx.setHelperSwitchMessage(`已取消切换到阵容 ${normalizedTeamId}。`, "");
    return;
  }
  const opened = ctx.runHelperBridgeInBackground(
    ctx.buildHelperBridgeTeamSwitchUrl(activeBinding, normalizedTeamId),
    "teamSwitch"
  );
  if (!opened) {
    ctx.setHelperSwitchMessage("当前页面暂时无法执行阵容切换，请稍后重试。", "error");
    return;
  }
  ctx.setHelperSwitchMessage(`正在切换到阵容 ${normalizedTeamId}，完成后会自动同步结果。`, "success");
}

export function openHelperPreviewAction(ctx, snapshotId) {
  if (!ctx.getCurrentProfile()) {
    ctx.setHelperPreviewMessage("请先登录商城账号，再进行恢复预演。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (!ctx.isHelperLineupEnabled() || !ctx.isHelperSnapshotEnabled()) {
    ctx.setHelperPreviewMessage(ctx.getHelperLineupDisabledReason("当前环境未开启 helper 阵容快照能力。"), "error");
    return;
  }
  const activeBinding = ctx.getActiveHelperBinding();
  if (!activeBinding) {
    ctx.setHelperPreviewMessage("请先完成 helper 角色绑定，再进行恢复预演。", "error");
    return;
  }
  const targetSnapshot = (ctx.getCurrentHelperSnapshots() || []).find(
    (item) => Number(item?.id) === Number(snapshotId || 0)
  );
  if (!targetSnapshot) {
    ctx.setHelperPreviewMessage("未找到要预演的目标快照，请先刷新快照列表。", "error");
    return;
  }
  ctx.setPendingHelperPreviewSnapshotId(Number(snapshotId || 0));
  const opened = ctx.runHelperBridgeInBackground(
    ctx.buildHelperBridgeTeamPreviewUrl(activeBinding, snapshotId),
    "teamPreview"
  );
  if (!opened) {
    ctx.setHelperPreviewMessage("当前页面暂时无法执行恢复预演，请稍后重试。", "error");
    return;
  }
  ctx.setHelperPreviewMessage(`系统正在核对“${ctx.buildHelperSnapshotName(targetSnapshot)}”的还原步骤。`, "success");
}

export function openHelperRestoreAction(ctx, snapshotId) {
  if (!ctx.getCurrentProfile()) {
    ctx.setHelperSwitchMessage("请先登录商城账号，再执行安全恢复。", "error");
    ctx.navigateToLoginEntry();
    return;
  }
  if (!ctx.isHelperLineupEnabled() || !ctx.isHelperTeamRestoreEnabled()) {
    ctx.setHelperSwitchMessage(ctx.getHelperLineupDisabledReason("当前环境未开启 helper 安全恢复 Beta。"), "error");
    return;
  }
  const activeBinding = ctx.getActiveHelperBinding();
  if (!activeBinding) {
    ctx.setHelperSwitchMessage("请先完成 helper 角色绑定，再执行安全恢复。", "error");
    return;
  }
  const targetSnapshot = (ctx.getCurrentHelperSnapshots() || []).find(
    (item) => Number(item?.id) === Number(snapshotId || 0)
  );
  if (!targetSnapshot) {
    ctx.setHelperSwitchMessage("未找到要恢复的目标快照，请先刷新快照列表。", "error");
    return;
  }
  const restoreBlockReason = ctx.getSnapshotSafeRestoreBlockReason(targetSnapshot);
  if (restoreBlockReason) {
    ctx.setHelperSwitchMessage(restoreBlockReason, "error");
    return;
  }
  const restorePlan = ctx.buildHelperRestorePlanFromSnapshot(targetSnapshot);
  if (!restorePlan.team_id || !Array.isArray(restorePlan.heroes) || !restorePlan.heroes.length) {
    ctx.setHelperSwitchMessage("这份快照缺少足够的恢复信息，请先重新读取一份新快照。", "error");
    return;
  }
  const confirmed = ctx.confirmAction(
    [
      `确认一键还原到“${ctx.buildHelperSnapshotName(targetSnapshot)}”？`,
      "系统会自动校对洗练归属，再恢复阵容、等级、鱼灵、鱼珠、科技和玩具。",
      "不会回滚洗练数值本身。",
    ].join("\n")
  );
  if (!confirmed) {
    ctx.setHelperSwitchMessage(`已取消还原“${ctx.buildHelperSnapshotName(targetSnapshot)}”。`, "");
    return;
  }
  const opened = ctx.runHelperBridgeInBackground(
    ctx.buildHelperBridgeTeamRestoreUrl(activeBinding, snapshotId, restorePlan),
    "teamRestore"
  );
  if (!opened) {
    ctx.setHelperSwitchMessage("当前页面暂时无法执行一键还原，请稍后重试。", "error");
    return;
  }
  ctx.setHelperRestoreProgress({
    status: "running",
    percent: 0,
    label: "准备还原",
    detail: `正在打开“${ctx.buildHelperSnapshotName(targetSnapshot)}”的恢复窗口`,
  });
  ctx.setHelperSwitchMessage(
    `正在还原“${ctx.buildHelperSnapshotName(targetSnapshot)}”，完成后会自动同步最新状态。`,
    "success"
  );
}

export async function savePendingHelperBindingAction(ctx) {
  if (!ctx.getCurrentProfile()) {
    ctx.setHelperBindMessage("请先登录商城账号。", "error");
    return;
  }
  const pendingPayload = ctx.getPendingHelperBridgePayload();
  if (!pendingPayload) {
    ctx.setHelperBindMessage("当前没有待保存的 helper 角色，请先扫码选择角色。", "error");
    return;
  }
  try {
    const result = await ctx.apiFetch("/helper/bindings/current", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: pendingPayload.game_role_id,
        game_server: pendingPayload.game_server,
        game_role_name: pendingPayload.game_role_name,
        bind_token_id: pendingPayload.bind_token_id || "",
        nickname: pendingPayload.nickname || "",
        helper_token: pendingPayload.helper_token || "",
        helper_ws_url: pendingPayload.helper_ws_url || "",
        helper_import_method: pendingPayload.helper_import_method || "",
      }),
    });
    await Promise.allSettled([ctx.loadHelperBindings(), ctx.loadHelperInventories()]);
    ctx.setActiveHelperBinding(result?.id);
    ctx.setHelperBindMessage("角色已绑定到当前商城账号。", "success");
    ctx.renderHelperBindingPanel();
    ctx.renderHelperGameFeaturesPanel?.();
    ctx.renderHelperTeamSwitchPanel();
  } catch (error) {
    ctx.setHelperBindMessage(`绑定失败：${ctx.pickErrorMessage(error, "绑定失败")}`, "error");
  }
}

export async function removeHelperBindingAction(ctx, bindingId) {
  try {
    await ctx.apiFetch(`/helper/bindings/current/${bindingId}`, {
      method: "DELETE",
    });
    ctx.setCurrentHelperBindings((ctx.getCurrentHelperBindings() || []).filter(
      (item) => Number(item?.id || 0) !== Number(bindingId || 0)
    ));
    ctx.syncActiveHelperBindingPreference();
    await ctx.loadHelperInventories();
    ctx.setHelperBindMessage("helper 绑定已解除。", "success");
    ctx.renderHelperBindingPanel();
    ctx.renderHelperGameFeaturesPanel?.();
    ctx.renderHelperTeamSwitchPanel();
  } catch (error) {
    ctx.setHelperBindMessage(`解绑失败：${ctx.pickErrorMessage(error, "解绑失败")}`, "error");
  }
}

export function clearPendingHelperSelectionAction(ctx) {
  ctx.setPendingHelperBridgePayload(null);
  ctx.clearHelperBridgeSession();
  ctx.clearPendingHelperBridgeIntent();
  ctx.renderHelperBindingPanel();
  ctx.renderHelperGameFeaturesPanel?.();
  ctx.setHelperBindMessage("已清空刚刚扫码带回来的角色。", "success");
}

export async function autoBindHelperRoleToCurrentSessionAction(ctx, payload) {
  if (!ctx.isHelperScanBindEnabled?.() && !ctx.isHelperScanAuthEnabled?.()) return null;
  try {
    const result = await ctx.apiFetch("/helper/bindings/current", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: payload.game_role_id,
        game_server: payload.game_server,
        game_role_name: payload.game_role_name,
        bind_token_id: payload.bind_token_id || "",
        nickname: payload.nickname || "",
        helper_token: payload.helper_token || "",
        helper_ws_url: payload.helper_ws_url || "",
        helper_import_method: payload.helper_import_method || "",
      }),
    });
    await ctx.loadHelperBindings();
    ctx.setActiveHelperBinding(result?.id);
    ctx.renderHelperBindingPanel();
    ctx.renderHelperGameFeaturesPanel?.();
    ctx.renderHelperTeamSwitchPanel();
    return result;
  } catch (error) {
    console.warn("auto bind helper role failed", error);
    return null;
  }
}

export async function completeHelperScanAuthAction(ctx, payload) {
  ctx.setHelperAuthMessage("正在通过扫码登录商城账号...", "");
  try {
    const result = await ctx.apiFetch("/auth/game/bind", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: payload.game_role_id,
        game_server: payload.game_server,
        game_role_name: payload.game_role_name,
        bind_token_id: payload.bind_token_id || "",
        nickname: payload.nickname || "",
      }),
    });
    ctx.saveSession(result);
    ctx.applyImmediateAuthResult(result);
    await ctx.loadHelperConfig();
    ctx.setPendingHelperBridgePayload(null);
    ctx.clearHelperBridgeSession();
    ctx.clearPendingHelperBridgeIntent();
    await ctx.autoBindHelperRoleToCurrentSession(payload);
    ctx.schedulePostAuthAccountFocus();
    const successMessage = `已进入账号 ${payload.game_role_name}，后续阵容会默认绑定这个角色。`;
    ctx.closeHelperBridgeModal();
    ctx.setHelperAuthMessage(successMessage, "success");
    ctx.setNotice(successMessage, "success");
    if (ctx.navigateToPostAuthSurface()) return;
    ctx.activateAccountTab("overview");
    ctx.setLocationHash(ctx.isHelperLineupEnabled() ? "helper-lab" : "account");
    await Promise.allSettled([
      ctx.loadAccount(),
      ctx.loadHelperBindings(),
      ctx.loadHelperSnapshots(),
      ctx.loadHelperActionLogs(),
    ]);
  } catch (error) {
    const message = ctx.pickErrorMessage(error, "扫码进入失败");
    const prefix =
      error?.payload?.error === "invalid_input"
        ? "helper 回传数据不完整"
        : "商城绑定失败";
    ctx.setHelperAuthMessage(`${prefix}：${message}`, "error");
    ctx.setNotice(`${prefix}：${message}`, "error");
  }
}

export function clearHelperRestorePreviewAction(ctx) {
  ctx.setCurrentHelperRestorePreview(null);
  ctx.setPendingHelperPreviewSnapshotId(null);
  ctx.renderHelperRestorePreviewPanel();
  ctx.setHelperPreviewMessage("恢复预演结果已清空。", "success");
}
