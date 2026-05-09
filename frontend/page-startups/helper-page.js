export function getHelperPageStartupTasks(ctx) {
  return [
    {
      label: "startup.helperOrigin",
      run: () => {
        if (ctx.helperOriginInput) {
          ctx.helperOriginInput.value = ctx.getHelperOrigin();
        }
      },
    },
    {
      label: "startup.helperConfig",
      run: () => ctx.loadHelperConfig(),
    },
    {
      label: "startup.helperPanel",
      run: () => ctx.renderHelperBindingPanel(),
    },
    {
      label: "startup.helperInventory",
      run: () => ctx.renderHelperInventoryPanel(),
    },
    {
      label: "startup.helperSnapshots",
      run: () => ctx.renderHelperSnapshotPanel(),
    },
    {
      label: "startup.helperPreview",
      run: () => ctx.renderHelperRestorePreviewPanel(),
    },
  ];
}
