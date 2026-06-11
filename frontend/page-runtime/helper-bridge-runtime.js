function resetHelperBridgeFrame(frame) {
  if (!frame) return;
  try {
    frame.src = "about:blank";
  } catch (error) {
    console.warn("resetHelperBridgeFrame failed", error);
  }
}

function getHelperPublicBase(helperConfig) {
  return String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
}

function buildHelperBridgeUrl(ctx, action = "", extraSearch = {}) {
  const publicBase = getHelperPublicBase(ctx.helperConfig);
  const search = {
    bridge: "1",
    targetOrigin: ctx.locationOrigin,
    mallToken: ctx.getCurrentSessionToken?.() || "",
    ...extraSearch,
  };
  if (!action) {
    delete search.mallToken;
  } else {
    search.bridgeAction = action;
  }
  return ctx.withHelperCacheBuster(`${publicBase.replace(/\/$/, "")}/tokens`, search);
}

export function buildHelperBridgeBindUrl(ctx) {
  return buildHelperBridgeUrl(ctx, "", {
    importMethod: "wxQrcode",
    bridgeFlow: ctx.getPendingHelperBridgeIntent(),
  });
}

export function buildHelperBridgeSnapshotUrl(ctx, binding) {
  return buildHelperBridgeUrl(ctx, "teamSnapshot", {
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
  });
}

export function buildHelperBridgeLegacyInventoryUrl(ctx, binding, requestId = "") {
  return buildHelperBridgeUrl(ctx, "legacyInventory", {
    bindingId: binding?.id || "",
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    bridgeRequestId: requestId,
  });
}

export function buildHelperBridgeGameFeatureUrl(ctx, binding, feature) {
  return buildHelperBridgeUrl(ctx, "gameFeature", {
    bindingId: binding?.id || "",
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    gameFeature: feature,
  });
}

export function buildHelperBridgeTeamSwitchUrl(ctx, binding, teamId) {
  return buildHelperBridgeUrl(ctx, "teamSwitch", {
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    targetTeamId: teamId,
  });
}

export function buildHelperBridgeTeamPreviewUrl(ctx, binding, snapshotId) {
  return buildHelperBridgeUrl(ctx, "teamPreview", {
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    targetSnapshotId: snapshotId,
  });
}

export function buildHelperBridgeTeamRestoreUrl(ctx, binding, snapshotId, restorePlan) {
  return buildHelperBridgeUrl(ctx, "teamRestore", {
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    targetSnapshotId: snapshotId,
    restorePlan: ctx.encodeHelperBridgePayload(restorePlan),
  });
}

export function closeHelperBridgeModalRuntime(ctx) {
  if (!ctx.helperBridgeModal) return;
  ctx.helperBridgeModal.classList.add("hidden");
  ctx.helperBridgeModal.setAttribute("aria-hidden", "true");
  ctx.setHelperBridgeSurfaceState({
    mode: "",
    interactive: false,
  });
  resetHelperBridgeFrame(ctx.helperBridgeIframe);
}

export function clearHelperBridgeBackgroundFrameRuntime(ctx) {
  const state = ctx.getHelperBridgeBackgroundState();
  if (state?.timeoutId) {
    ctx.windowClearTimeout(state.timeoutId);
  }
  ctx.setHelperBridgeBackgroundState({
    mode: "",
    url: "",
    timeoutId: null,
  });
  resetHelperBridgeFrame(ctx.helperBridgeHiddenFrame);
  if (!ctx.getHelperBridgeSurfaceState()?.interactive) {
    ctx.setHelperBridgeSurfaceState({
      mode: "",
      interactive: false,
    });
  }
}

export function openHelperBridgeModalSurfaceRuntime(ctx, url, options = {}) {
  if (!ctx.helperBridgeModal || !ctx.helperBridgeIframe) return false;
  ctx.setHelperBridgeSurfaceState({
    mode: String(options.mode || "").trim(),
    interactive: true,
  });
  if (ctx.helperBridgeModalTitle) {
    ctx.helperBridgeModalTitle.textContent = options.title || "绑定游戏角色";
  }
  if (ctx.helperBridgeModalMessage) {
    ctx.helperBridgeModalMessage.textContent =
      options.message || "在当前页面完成角色绑定，选择后会自动带回商城。";
  }
  if (ctx.helperBridgeModalHint) {
    ctx.helperBridgeModalHint.textContent =
      options.hint || "支持扫码或 BIN 导入，完成后会自动返回商城，不需要手动回跳。";
  }
  ctx.helperBridgeModal.classList.remove("hidden");
  ctx.helperBridgeModal.setAttribute("aria-hidden", "false");
  resetHelperBridgeFrame(ctx.helperBridgeIframe);
  ctx.windowSetTimeout(() => {
    ctx.helperBridgeIframe.src = url;
  }, 20);
  return true;
}

export function runHelperBridgeInBackgroundRuntime(ctx, url, mode = "") {
  if (!ctx.helperBridgeHiddenFrame) return false;
  const backgroundState = ctx.getHelperBridgeBackgroundState();
  if (backgroundState?.timeoutId) {
    ctx.windowClearTimeout(backgroundState.timeoutId);
  }
  ctx.setHelperBridgeSurfaceState({
    mode: String(mode || "").trim(),
    interactive: false,
  });
  ctx.setHelperBridgeBackgroundState({
    mode: String(mode || "").trim(),
    url: String(url || "").trim(),
    timeoutId: null,
  });
  resetHelperBridgeFrame(ctx.helperBridgeHiddenFrame);
  ctx.windowSetTimeout(() => {
    ctx.helperBridgeHiddenFrame.src = url;
  }, 20);
  const timeoutId = ctx.windowSetTimeout(() => {
    const pendingState = ctx.getHelperBridgeBackgroundState();
    const pendingMode = pendingState?.mode || "";
    const pendingUrl = pendingState?.url || "";
    clearHelperBridgeBackgroundFrameRuntime(ctx);
    if (pendingMode === "legacyInventory") {
      ctx.setHelperInventoryMessage(
        "后台同步超过 45 秒没有返回，已切换到可见 helper 页面继续执行。",
        "error"
      );
      openHelperBridgeModalSurfaceRuntime(ctx, pendingUrl, {
        mode: "legacyInventory",
        title: "功法仓库同步",
        message: "后台同步超时，已切换到可见 helper 页面。这里会继续自动执行，并把错误直接显示出来。",
        hint: "如果仍然失败，请保留这个页面，我们继续按页面内提示定位。",
      });
      return;
    }
    if (pendingMode === "teamSnapshot") {
      ctx.setHelperSnapshotMessage(
        "后台读取超过 45 秒没有返回，已切换到可见 helper 页面继续执行。",
        "error"
      );
      openHelperBridgeModalSurfaceRuntime(ctx, pendingUrl, {
        mode: "teamSnapshot",
        title: "读取当前阵容",
        message: "后台读取超时，已切换到可见 helper 页面。这里会继续自动执行，并把错误直接显示出来。",
        hint: "如果仍然失败，请保留这个页面，我们继续按页面内提示定位。",
      });
      return;
    }
    if (pendingMode === "gameFeature") {
      ctx.setHelperGameFeatureMessage?.(
        "后台执行超过 45 秒没有返回，已切换到可见 helper 页面继续执行。",
        "error"
      );
      openHelperBridgeModalSurfaceRuntime(ctx, pendingUrl, {
        mode: "gameFeature",
        title: "执行 helper 脚本",
        message: "后台执行超时，已切换到可见 helper 页面。这里会继续自动执行，并把错误直接显示出来。",
        hint: "请保持页面打开，执行完成后会自动回传记录。",
      });
    }
  }, 45000);
  ctx.setHelperBridgeBackgroundState({
    ...ctx.getHelperBridgeBackgroundState(),
    timeoutId,
  });
  return true;
}
