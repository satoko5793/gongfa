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
    ctx.setCurrentHelperInventorySummary?.(null);
    ctx.setCurrentHelperInventoryPage?.(null);
    ctx.setCurrentConsignmentListings?.([]);
    ctx.renderHelperInventoryPanel();
    return;
  }

  try {
    const query = ctx.getHelperInventoryQuery?.() || {};
    const params = new URLSearchParams();
    params.set("page", String(query.page || 1));
    params.set("page_size", String(query.pageSize || 30));
    params.set("merged", query.merged ? "1" : "0");
    if (query.keyword) params.set("keyword", String(query.keyword));
    if (query.bindingId) params.set("binding_id", String(query.bindingId));
    const [summary, pagePayload, consignments] = await Promise.all([
      ctx.apiFetch("/helper/inventories/summary"),
      ctx.apiFetch(`/helper/inventories/items?${params.toString()}`),
      ctx.apiFetch("/helper/consignments").catch(() => []),
    ]);
    ctx.setCurrentHelperInventorySummary?.(summary || null);
    ctx.setCurrentHelperInventories(Array.isArray(summary?.inventories) ? summary.inventories : []);
    ctx.setCurrentHelperInventoryPage?.(pagePayload || null);
    ctx.setCurrentHelperMergedItems(Array.isArray(pagePayload?.items) ? pagePayload.items : []);
    ctx.setCurrentConsignmentListings?.(Array.isArray(consignments) ? consignments : []);
  } catch (error) {
    ctx.setCurrentHelperInventories([]);
    ctx.setCurrentHelperMergedItems([]);
    ctx.setCurrentHelperInventorySummary?.(null);
    ctx.setCurrentHelperInventoryPage?.(null);
    ctx.setCurrentConsignmentListings?.([]);
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
