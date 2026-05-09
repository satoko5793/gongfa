export async function saveHelperInventoryFromBridgeAction(ctx, payload) {
  const created = await ctx.apiFetch("/helper/inventories", {
    method: "POST",
    body: JSON.stringify({
      binding_id:
        payload?.binding_id === undefined || payload?.binding_id === null
          ? null
          : Number(payload.binding_id),
      source_type: "helper_bridge",
      summary: payload?.summary || {},
      items: Array.isArray(payload?.items) ? payload.items : [],
    }),
  });
  await ctx.loadHelperInventories();
  return created;
}

export async function saveHelperSnapshotFromBridgeAction(ctx, payload) {
  const activeBinding = ctx.getActiveHelperBinding();
  const snapshotLimit = Math.max(Number(ctx.getHelperConfig()?.limits?.snapshots_per_user || 3) || 3, 1);
  const snapshotCount = Array.isArray(ctx.getCurrentHelperSnapshots()) ? ctx.getCurrentHelperSnapshots().length : 0;
  if (snapshotCount >= snapshotLimit) {
    throw new Error(`每个账号最多保存 ${snapshotLimit} 套阵容，请先删除旧阵容。`);
  }
  const snapshotName =
    String(payload?.summary?.role_name || "").trim()
      ? `${String(payload.summary.role_name).trim()} · 阵容 ${Number(payload?.summary?.use_team_id || 1)}`
      : "阵容快照";
  const created = await ctx.apiFetch("/helper/snapshots", {
    method: "POST",
    body: JSON.stringify({
      binding_id: activeBinding?.id ?? null,
      source_type: "helper_bridge",
      snapshot_name: snapshotName,
      summary: payload?.summary || {},
      raw: payload?.raw || {},
    }),
  });
  ctx.setCurrentHelperSnapshots(
    ctx.sortHelperSnapshotsList([
      created,
      ...(ctx.getCurrentHelperSnapshots() || []).filter((item) => Number(item.id) !== Number(created.id)),
    ])
  );
  ctx.renderHelperSnapshotPanel();
  return created;
}

export async function saveHelperActionLogFromBridgeAction(ctx, payload) {
  const activeBinding = ctx.getActiveHelperBinding();
  const created = await ctx.apiFetch("/helper/action-logs", {
    method: "POST",
    body: JSON.stringify({
      binding_id: activeBinding?.id ?? null,
      action_type: payload?.action_type || "helper_team_switch",
      action_payload: payload?.action_payload || {},
      result_status: payload?.result_status || "ok",
      result_payload: payload?.result_payload || {},
    }),
  });
  ctx.setCurrentHelperActionLogs([
    created,
    ...(ctx.getCurrentHelperActionLogs() || []).filter((item) => Number(item.id) !== Number(created.id)),
  ]);
  ctx.renderHelperTeamSwitchPanel();
  return created;
}

export async function updateHelperSnapshotMetaAction(ctx, snapshotId, payload) {
  const updated = await ctx.apiFetch(`/helper/snapshots/${snapshotId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  ctx.setCurrentHelperSnapshots(
    ctx.sortHelperSnapshotsList(
      (ctx.getCurrentHelperSnapshots() || []).map((item) =>
        Number(item?.id) === Number(snapshotId)
          ? updated
          : payload?.is_pinned
            ? { ...item, is_pinned: false }
            : item
      )
    )
  );
  if (Number(ctx.getCurrentHelperRestorePreview()?.target_snapshot_id || 0) === Number(snapshotId || 0)) {
    ctx.setCurrentHelperRestorePreview({
      ...ctx.getCurrentHelperRestorePreview(),
      target_snapshot_name: updated.snapshot_name,
    });
    ctx.renderHelperRestorePreviewPanel();
  }
  ctx.renderHelperSnapshotPanel();
  return updated;
}

export async function removeHelperSnapshotAction(ctx, snapshotId) {
  try {
    await ctx.apiFetch(`/helper/snapshots/${snapshotId}`, {
      method: "DELETE",
    });
    ctx.deleteExpandedHelperSnapshotId(Number(snapshotId || 0));
    ctx.setCurrentHelperSnapshots(
      (ctx.getCurrentHelperSnapshots() || []).filter((item) => Number(item.id) !== Number(snapshotId))
    );
    if (Number(ctx.getCurrentHelperRestorePreview()?.target_snapshot_id || 0) === Number(snapshotId || 0)) {
      ctx.setCurrentHelperRestorePreview(null);
      ctx.renderHelperRestorePreviewPanel();
    }
    ctx.renderHelperSnapshotPanel();
    ctx.setHelperSnapshotMessage("阵容快照已删除。", "success");
  } catch (error) {
    ctx.setHelperSnapshotMessage(`删除快照失败：${ctx.pickErrorMessage(error, "删除失败")}`, "error");
  }
}

export async function renameHelperSnapshotAction(ctx, snapshotId) {
  const targetSnapshot = (ctx.getCurrentHelperSnapshots() || []).find(
    (item) => Number(item?.id) === Number(snapshotId || 0)
  );
  if (!targetSnapshot) {
    ctx.setHelperSnapshotMessage("没有找到要重命名的阵容。", "error");
    return;
  }
  const currentName = String(targetSnapshot?.snapshot_name || ctx.buildHelperSnapshotName(targetSnapshot)).trim();
  const nextName = ctx.promptForSnapshotName(currentName);
  if (nextName === null) return;
  const normalizedName = String(nextName || "").trim();
  if (!normalizedName) {
    ctx.setHelperSnapshotMessage("阵容名不能为空。", "error");
    return;
  }
  if (normalizedName.length > 40) {
    ctx.setHelperSnapshotMessage("阵容名最多 40 个字。", "error");
    return;
  }
  try {
    const updated = await updateHelperSnapshotMetaAction(ctx, snapshotId, { snapshot_name: normalizedName });
    if (updated) {
      ctx.setHelperSnapshotMessage(`阵容已改名为“${normalizedName}”。`, "success");
    }
  } catch (error) {
    ctx.setHelperSnapshotMessage(`重命名失败：${ctx.pickErrorMessage(error, "保存失败")}`, "error");
  }
}

export async function togglePinHelperSnapshotAction(ctx, snapshotId) {
  const targetSnapshot = (ctx.getCurrentHelperSnapshots() || []).find(
    (item) => Number(item?.id) === Number(snapshotId || 0)
  );
  if (!targetSnapshot) {
    ctx.setHelperSnapshotMessage("没有找到要置顶的阵容。", "error");
    return;
  }
  const nextPinned = !Boolean(targetSnapshot?.is_pinned);
  try {
    await updateHelperSnapshotMetaAction(ctx, snapshotId, { is_pinned: nextPinned });
    ctx.setHelperSnapshotMessage(
      nextPinned
        ? `已将“${ctx.buildHelperSnapshotName(targetSnapshot)}”置顶显示。`
        : `已取消“${ctx.buildHelperSnapshotName(targetSnapshot)}”的置顶。`,
      "success"
    );
  } catch (error) {
    ctx.setHelperSnapshotMessage(`置顶保存失败：${ctx.pickErrorMessage(error, "保存失败")}`, "error");
  }
}

export function handleHelperBridgeMessageAction(ctx, event) {
  const data = event?.data;
  if (!data) {
    return false;
  }
  if (typeof data?.type === "string" && data.type.startsWith("gongfa_helper_")) {
    ctx.setDebugLine("helper.message", data.type);
  }
  if (data.type === "gongfa_helper_team_switch_result") {
    ctx.clearHelperBridgeBackgroundFrame();
    saveHelperActionLogFromBridgeAction(ctx, data.payload || {})
      .then((created) => {
        const fallbackMessage =
          created?.result_status === "ok"
            ? `已切换到阵容 ${created?.result_payload?.use_team_id || created?.action_payload?.team_id || "-"}.`
            : `切换到阵容 ${created?.action_payload?.team_id || "-"} 失败。`;
        ctx.setHelperSwitchMessage(
          created?.result_payload?.message || fallbackMessage,
          created?.result_status === "ok" ? "success" : "error"
        );
        ctx.loadHelperActionLogs();
        ctx.setLocationHash("helper-lab");
      })
      .catch((error) => {
        ctx.setHelperSwitchMessage(`切换记录保存失败：${ctx.pickErrorMessage(error, "保存失败")}`, "error");
      });
    return true;
  }
  if (data.type === "gongfa_helper_legacy_inventory") {
    ctx.clearHelperBridgeBackgroundFrame();
    saveHelperInventoryFromBridgeAction(ctx, data.payload || {})
      .then((created) => {
        const nextState = { ...ctx.getHelperInventorySyncState() };
        nextState.completed = Number(nextState.completed || 0) + 1;
        ctx.setHelperInventorySyncState(nextState);
        const bindingRoleName =
          ctx.normalizeHelperDisplayRoleName(
            created?.binding?.game_role_name || created?.summary?.role_name,
            created?.binding?.game_role_id || created?.summary?.role_id
          ) || "该角色";
        ctx.setHelperInventoryMessage(
          `已同步 ${bindingRoleName} 的功法库存，当前共 ${Number(created?.summary?.legacy_count || created?.items?.length || 0)} 张功法。`,
          "success"
        );
        if (ctx.getHelperInventorySyncState().running) {
          ctx.startNextHelperInventorySyncInQueue();
        }
        ctx.setLocationHash("helper-lab");
      })
      .catch((error) => {
        const nextState = { ...ctx.getHelperInventorySyncState() };
        nextState.failures = [
          ...(Array.isArray(nextState.failures) ? nextState.failures : []),
          {
            binding_id: Number(data?.payload?.binding_id || 0),
            role_name: String(data?.payload?.summary?.role_name || "").trim() || "未命名角色",
            message: ctx.pickErrorMessage(error, "保存失败"),
          },
        ];
        ctx.setHelperInventorySyncState(nextState);
        ctx.setHelperInventoryMessage(`功法库存保存失败：${ctx.pickErrorMessage(error, "保存失败")}`, "error");
        if (ctx.getHelperInventorySyncState().running) {
          ctx.startNextHelperInventorySyncInQueue();
        }
      });
    return true;
  }
  if (data.type === "gongfa_helper_legacy_inventory_error") {
    ctx.clearHelperBridgeBackgroundFrame();
    const nextState = { ...ctx.getHelperInventorySyncState() };
    nextState.failures = [
      ...(Array.isArray(nextState.failures) ? nextState.failures : []),
      {
        binding_id: Number(data?.payload?.binding_id || 0),
        role_name: String(data?.payload?.role_name || "").trim() || "未命名角色",
        message: String(data?.payload?.message || "功法库存同步失败").trim(),
      },
    ];
    ctx.setHelperInventorySyncState(nextState);
    ctx.setHelperInventoryMessage(
      String(data?.payload?.message || "功法库存同步失败").trim() || "功法库存同步失败",
      "error"
    );
    if (ctx.getHelperInventorySyncState().running) {
      ctx.startNextHelperInventorySyncInQueue();
    }
    return true;
  }
  if (data.type === "gongfa_helper_team_snapshot") {
    ctx.clearHelperBridgeBackgroundFrame();
    saveHelperSnapshotFromBridgeAction(ctx, data.payload || {})
      .then((created) => {
        ctx.setHelperSnapshotMessage(`阵容已保存：${ctx.buildHelperSnapshotName(created)}。`, "success");
        ctx.loadHelperSnapshots();
        ctx.setLocationHash("helper-lab");
      })
      .catch((error) => {
        ctx.setHelperSnapshotMessage(`快照保存失败：${ctx.pickErrorMessage(error, "保存失败")}`, "error");
      });
    return true;
  }
  if (data.type === "gongfa_helper_team_restore_result") {
    ctx.clearHelperBridgeBackgroundFrame();
    saveHelperActionLogFromBridgeAction(ctx, data.payload || {})
      .then((created) => {
        const fallbackMessage =
          created?.result_status === "ok" || created?.result_status === "warning"
            ? "阵容还原已执行。"
            : "阵容还原失败。";
        const resultPayload = created?.result_payload || {};
        ctx.setHelperRestoreProgress({
          status:
            created?.result_status === "error"
              ? "error"
              : created?.result_status === "warning"
                ? "warning"
                : "success",
          percent: 100,
          label:
            created?.result_status === "error"
              ? "恢复失败"
              : created?.result_status === "warning"
                ? "恢复完成，仍有待确认项"
                : "恢复完成",
          detail: resultPayload?.message || fallbackMessage,
        });
        ctx.setHelperSwitchMessage(
          resultPayload?.message || fallbackMessage,
          created?.result_status === "ok" || created?.result_status === "warning" ? "success" : "error"
        );
        ctx.setCurrentHelperRestorePreview(null);
        ctx.renderHelperRestorePreviewPanel();
        ctx.loadHelperSnapshots();
        ctx.loadHelperActionLogs();
        ctx.setLocationHash("helper-lab");
      })
      .catch((error) => {
        ctx.setHelperSwitchMessage(`恢复记录保存失败：${ctx.pickErrorMessage(error, "保存失败")}`, "error");
      });
    return true;
  }
  if (data.type === "gongfa_helper_team_restore_progress") {
    ctx.setHelperRestoreProgress(data.payload || null);
    ctx.setLocationHash("helper-lab");
    return true;
  }
  if (data.type === "gongfa_helper_game_feature_result") {
    ctx.clearHelperBridgeBackgroundFrame();
    saveHelperActionLogFromBridgeAction(ctx, data.payload || {})
      .then((created) => {
        const status = String(created?.result_status || "ok").trim();
        ctx.setHelperGameFeatureMessage(
          created?.result_payload?.message || (status === "error" ? "helper 脚本执行失败。" : "helper 脚本已执行。"),
          status === "error" ? "error" : "success"
        );
        ctx.loadHelperActionLogs();
        ctx.setLocationHash("helper-lab");
      })
      .catch((error) => {
        ctx.setHelperGameFeatureMessage(`脚本记录保存失败：${ctx.pickErrorMessage(error, "保存失败")}`, "error");
      });
    return true;
  }
  if (data.type === "gongfa_helper_team_preview") {
    ctx.clearHelperBridgeBackgroundFrame();
    const snapshotId = Number(data?.payload?.snapshot_id || ctx.getPendingHelperPreviewSnapshotId() || 0);
    const targetSnapshot = (ctx.getCurrentHelperSnapshots() || []).find((item) => Number(item?.id) === snapshotId);
    if (!targetSnapshot) {
      ctx.setHelperPreviewMessage("收到预演结果，但目标快照已不存在或尚未加载。", "error");
      return true;
    }
    ctx.setCurrentHelperRestorePreview(ctx.buildHelperRestorePreview(targetSnapshot, data?.payload?.live_snapshot || {}));
    ctx.setPendingHelperPreviewSnapshotId(null);
    ctx.renderHelperRestorePreviewPanel();
    const preview = ctx.getCurrentHelperRestorePreview();
    ctx.setHelperPreviewMessage(
      `系统已完成还原核对：${preview?.safe_step_count || 0} 项可自动处理，${preview?.recorded_only_count || 0} 项仅记录。`,
      "success"
    );
    ctx.setLocationHash("helper-lab");
    return true;
  }
  if (data.type !== "gongfa_helper_bind_role") {
    return false;
  }
  const payload = ctx.normalizeBindPayload(data.payload || data);
  if (!payload) {
    const pendingIntent = ctx.getPendingHelperBridgeIntent();
    if (pendingIntent === ctx.HELPER_BRIDGE_INTENT_AUTH) {
      ctx.setHelperAuthMessage("收到的 helper 回传数据不完整，请重新选择角色。", "error");
    } else {
      ctx.setHelperBindMessage("收到的 helper 回传数据不完整，请重新选择角色。", "error");
    }
    return true;
  }
  const pendingIntent = ctx.getPendingHelperBridgeIntent();
  if (pendingIntent === ctx.HELPER_BRIDGE_INTENT_AUTH) {
    ctx.completeHelperScanAuth(payload);
    return true;
  }
  ctx.closeHelperBridgeModal();
  const bridgePayload = {
    ...payload,
    helper_token: data.payload?.helper_token || "",
    helper_ws_url: data.payload?.helper_ws_url || "",
    helper_import_method: data.payload?.helper_import_method || "wxQrcode",
  };
  ctx.setPendingHelperBridgePayload(bridgePayload);
  ctx.saveHelperBridgeSession(bridgePayload);
  ctx.clearPendingHelperBridgeIntent();
  ctx.fillBindForm(payload);
  ctx.renderHelperBindingPanel();
  ctx.renderHelperRestorePreviewPanel();
  ctx.setHelperBindMessage(`已接收角色：${payload.game_role_name}，确认后可绑定到当前商城账号。`, "success");
  ctx.setLocationHash("helper-lab");
  return true;
}
