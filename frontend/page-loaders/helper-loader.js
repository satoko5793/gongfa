export async function loadHelperConfigData(ctx) {
  try {
    const result = await ctx.apiFetch("/helper/config");
    const helperConfig = ctx.mergeHelperConfig(result);
    const defaultOrigin = String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
    const resolvedOrigin = ctx.ensureHelperOrigin(defaultOrigin);
    ctx.setHelperOriginInputValue(resolvedOrigin);
  } catch (error) {
    console.warn("helper config load failed", error);
  } finally {
    ctx.renderHelperLab();
    ctx.loadHelperBindings();
    ctx.loadHelperInventories();
    ctx.loadHelperSnapshots();
    ctx.loadHelperActionLogs();
  }
}

export async function loadHelperBindingsData(ctx) {
  if (!ctx.getCurrentProfile() || !ctx.isHelperLineupEnabled() || !ctx.isHelperScanBindEnabled()) {
    ctx.setCurrentHelperBindings([]);
    ctx.syncActiveHelperBindingPreference();
    ctx.renderHelperBindingPanel();
    ctx.renderHelperInventoryPanel();
    return;
  }

  try {
    const bindings = await ctx.apiFetch("/helper/bindings/current");
    ctx.setCurrentHelperBindings(bindings);
    ctx.syncActiveHelperBindingPreference();
  } catch (error) {
    ctx.setCurrentHelperBindings([]);
    ctx.syncActiveHelperBindingPreference();
    ctx.setHelperBindMessage(`读取绑定失败：${ctx.pickErrorMessage(error, "读取失败")}`, "error");
  } finally {
    ctx.renderHelperBindingPanel();
    ctx.renderHelperInventoryPanel();
    ctx.renderHelperTeamSwitchPanel();
  }
}

export async function loadHelperInventoriesData(ctx) {
  if (!ctx.getCurrentProfile() || !ctx.isHelperInventoryEnabled()) {
    ctx.setCurrentHelperInventories([]);
    ctx.setCurrentHelperMergedItems([]);
    ctx.renderHelperInventoryPanel();
    return;
  }

  try {
    const payload = await ctx.apiFetch("/helper/inventories");
    ctx.setCurrentHelperInventories(Array.isArray(payload?.inventories) ? payload.inventories : []);
    ctx.setCurrentHelperMergedItems(Array.isArray(payload?.merged_items) ? payload.merged_items : []);
  } catch (error) {
    ctx.setCurrentHelperInventories([]);
    ctx.setCurrentHelperMergedItems([]);
    ctx.setHelperInventoryMessage(`读取功法仓库失败：${ctx.pickErrorMessage(error, "读取失败")}`, "error");
  } finally {
    ctx.renderHelperInventoryPanel();
  }
}

export async function loadHelperSnapshotsData(ctx) {
  if (!ctx.getCurrentProfile() || !ctx.isHelperLineupEnabled() || !ctx.isHelperSnapshotEnabled()) {
    ctx.setCurrentHelperSnapshots([]);
    ctx.renderHelperSnapshotPanel();
    ctx.setCurrentHelperRestorePreview(null);
    ctx.renderHelperRestorePreviewPanel();
    return;
  }

  try {
    const snapshots = await ctx.apiFetch("/helper/snapshots");
    ctx.setCurrentHelperSnapshots(snapshots);
  } catch (error) {
    ctx.setCurrentHelperSnapshots([]);
    ctx.setHelperSnapshotMessage(`读取快照失败：${ctx.pickErrorMessage(error, "读取失败")}`, "error");
  } finally {
    const preview = ctx.getCurrentHelperRestorePreview();
    if (
      preview &&
      !(ctx.getCurrentHelperSnapshots() || []).some(
        (item) => Number(item?.id) === Number(preview?.target_snapshot_id || 0)
      )
    ) {
      ctx.setCurrentHelperRestorePreview(null);
    }
    ctx.renderHelperSnapshotPanel();
    ctx.renderHelperRestorePreviewPanel();
    ctx.renderHelperTeamSwitchPanel();
  }
}

export async function loadHelperActionLogsData(ctx) {
  if (!ctx.getCurrentProfile() || !ctx.isHelperLineupEnabled() || !ctx.isHelperActionLogsEnabled()) {
    ctx.setCurrentHelperActionLogs([]);
    ctx.renderHelperTeamSwitchPanel();
    ctx.renderHelperRestoreResultPanel?.();
    return;
  }

  try {
    const logs = await ctx.apiFetch("/helper/action-logs?limit=12");
    ctx.setCurrentHelperActionLogs(logs);
  } catch (error) {
    ctx.setCurrentHelperActionLogs([]);
    ctx.setHelperSwitchMessage(`读取切换记录失败：${ctx.pickErrorMessage(error, "读取失败")}`, "error");
  } finally {
    ctx.renderHelperTeamSwitchPanel();
    ctx.renderHelperRestoreResultPanel?.();
  }
}
