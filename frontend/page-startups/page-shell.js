export function getPageShellStartupTasks(ctx) {
  return [
    {
      label: "startup.pageMode",
      run: () => ctx.applyPageMode(),
    },
  ];
}
