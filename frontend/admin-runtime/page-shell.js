export function setDebugLine(element, prefix, value) {
  if (!element) return;
  element.textContent = `${prefix}: ${value}`;
}

export function renderPagination(root, target, state) {
  if (!root) return;

  const total = Number(state?.total || 0);
  const page = Math.max(Number(state?.page || 1), 1);
  const totalPages = Math.max(Number(state?.totalPages || 0), 0);

  if (total === 0) {
    root.innerHTML = '<div class="pagination-meta">当前共 0 条记录。</div>';
    return;
  }

  root.innerHTML = `
    <div class="pagination-meta">第 ${page} / ${Math.max(totalPages, 1)} 页，共 ${total} 条</div>
    <div class="pagination-actions">
      <button
        class="ghost"
        type="button"
        data-pagination-target="${target}"
        data-pagination-page="${Math.max(page - 1, 1)}"
        ${page <= 1 ? "disabled" : ""}
      >上一页</button>
      <button
        class="ghost"
        type="button"
        data-pagination-target="${target}"
        data-pagination-page="${Math.min(page + 1, Math.max(totalPages, 1))}"
        ${totalPages === 0 || page >= totalPages ? "disabled" : ""}
      >下一页</button>
    </div>
  `;
}

export async function activateAdminPageShell(page, { refs, setActivePage, loadPage, force = false, renderPage }) {
  setActivePage(page);

  refs.adminPageButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-admin-page-tab") === page);
  });
  refs.adminPagePanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-admin-page-panel") !== page);
  });

  if (typeof renderPage === "function") {
    renderPage(page);
  }
  return loadPage(page, { force });
}
