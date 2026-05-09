export function getSessionPageStartupTasks(ctx) {
  return [
    {
      label: "startup.sessionFallback",
      run: () => ctx.hydrateSessionProfile(),
    },
    {
      label: "startup.accountDeferred",
      run: () => {
        if (!ctx.shouldDeferAccountBootstrap()) return;
        ctx.scheduleDeferredAccountBootstrap();
      },
    },
  ];
}
