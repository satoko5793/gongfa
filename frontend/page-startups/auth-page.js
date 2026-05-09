export function getAuthPageStartupTasks(ctx) {
  return [
    {
      label: "startup.activateAuthTab",
      run: () => ctx.activateAuthTab(),
    },
  ];
}
