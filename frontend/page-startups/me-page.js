export function getMePageStartupTasks(ctx) {
  return [
    {
      label: "startup.activateAccountTab",
      run: () => ctx.activateAccountTab(),
    },
    {
      label: "startup.syncHash",
      run: () => ctx.syncAccountTabWithHash(),
    },
    {
      label: "startup.account",
      run: () => ctx.loadAccount(),
    },
  ];
}
