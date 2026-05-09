export function getShopPageStartupTasks(ctx) {
  return [
    {
      label: "startup.syncDock",
      run: () => {
        if (!ctx.getPageModeConfig().sections.dock) return;
        ctx.syncDockWithViewport();
      },
    },
    {
      label: "startup.guidePage",
      run: () => {
        if (!ctx.getPageModeConfig().sections.beginner) return;
        ctx.setActiveGuidePage("tutorial");
      },
    },
    {
      label: "startup.beginnerGuide",
      run: () => {
        if (!ctx.getPageModeConfig().sections.beginner) return;
        ctx.renderBeginnerGuide(null, [], []);
      },
    },
    {
      label: "startup.recentSalesRender",
      run: () => {
        if (!ctx.getPageModeConfig().sections.beginner) return;
        ctx.renderRecentSales([]);
      },
    },
    {
      label: "startup.products",
      run: () =>
        ctx.loadProducts().catch((error) => {
          ctx.setNotice(`商品加载失败：${error.message}`, "error");
          throw error;
        }),
    },
    {
      label: "startup.recentSales",
      run: () => {
        if (!ctx.getPageModeConfig().bootstrap.recentSales) return;
        ctx.loadRecentSales();
      },
    },
  ];
}
