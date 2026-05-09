export function prepareHelperLiteShell({
  profile,
  helperLabSection,
  helperLabBadge,
  helperLabNote,
  helperBindMessage,
  helperClearPreviewBtn,
  loadingCopy = "阵容中心正在加载中，稍等片刻就能继续同步功法、保存快照和执行还原。",
  loggedOutCopy = "先登录商城账号，再继续同步功法、保存阵容快照和执行一键还原。",
  loadingNotice = "阵容组件正在加载中，首次进入可能需要等待片刻。",
  loggedOutNotice = "请先登录商城账号，再继续使用阵容同步和还原功能。",
} = {}) {
  helperLabSection?.classList.remove("hidden");
  if (helperLabBadge) {
    helperLabBadge.textContent = profile ? "准备中" : "登录后可用";
  }
  if (helperLabNote) {
    helperLabNote.textContent = profile ? loadingCopy : loggedOutCopy;
  }
  if (helperBindMessage) {
    helperBindMessage.textContent = profile ? loadingNotice : loggedOutNotice;
    helperBindMessage.className = profile ? "notice" : "notice error";
  }
  helperClearPreviewBtn?.classList.add("hidden");
}

export function bindWakeOnHelperIntent({
  buttons = [],
  helperBindMessage,
  ensureAppModule,
} = {}) {
  buttons.forEach(([button, message]) => {
    if (!button) return;
    button.dataset.entryLoadingHint = message;
    button.addEventListener("click", (event) => {
      if (button.dataset.entryReady === "1") return;
      event.preventDefault();
      if (helperBindMessage) {
        helperBindMessage.textContent = message;
        helperBindMessage.className = "notice";
      }
      ensureAppModule()
        .then(() => {
          button.dataset.entryReady = "1";
          if (helperBindMessage) {
            helperBindMessage.textContent = "阵容组件已就绪，可以继续操作。";
            helperBindMessage.className = "notice success";
          }
        })
        .catch((error) => {
          if (helperBindMessage) {
            helperBindMessage.textContent = `阵容组件加载失败：${error?.message || "请稍后重试"}`;
            helperBindMessage.className = "notice error";
          }
        });
    });
  });
}
