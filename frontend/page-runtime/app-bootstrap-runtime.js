export function bindGlobalAppEvents(ctx) {
  ctx.productDetailModal?.addEventListener("click", (event) => {
    if (event.target === ctx.productDetailModal) {
      ctx.closeProductModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !ctx.productDetailModal?.classList.contains("hidden")) {
      ctx.closeProductModal();
    }
  });

  window.addEventListener("message", (event) => {
    if (ctx.handleHelperBridgeMessage(event)) return;
    ctx.applyIncomingPayload(event.data);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === ctx.sessionStorageKey) {
      ctx.loadAccount();
    }
  });

  window.addEventListener("hashchange", ctx.syncAccountTabWithHash);
  window.addEventListener("scroll", ctx.syncDockWithViewport, { passive: true });
  window.addEventListener("resize", ctx.syncDockWithViewport);
  window.addEventListener("error", (event) => {
    ctx.setDebugLine("window.error", event?.message || "unknown");
  });
  window.addEventListener("unhandledrejection", (event) => {
    ctx.setDebugLine("window.rejection", event?.reason?.message || String(event?.reason || "unknown"));
  });
}

export function runAppBootSequence(ctx) {
  ctx.setDebugLine("boot", "module_loaded");
  ctx.getStartupTasksForMode(ctx.currentPageMode, ctx.startupContext).forEach((task) => {
    ctx.safeRun(task.label, task.run);
  });
  return window.setInterval(ctx.updateAuctionCountdowns, ctx.auctionCountdownTickMs);
}
