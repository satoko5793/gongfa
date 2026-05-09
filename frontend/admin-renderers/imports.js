export function renderPendingImportEntriesView(refs, entries, { escapeHtml }) {
  if (refs.importBatchCountChip) {
    refs.importBatchCountChip.textContent = `已暂存 ${entries.length} 份`;
  }
  if (!refs.importBatchList) return;
  if (entries.length === 0) {
    refs.importBatchList.innerHTML = '<div class="stack-item">暂时还没有加入批量导入的 JSON。</div>';
    return;
  }
  refs.importBatchList.innerHTML = entries
    .map((entry, index) => {
      const lineCount = entry.raw_json.split("\n").length;
      return `
        <div class="stack-item">
          <div><strong>${escapeHtml(entry.source_file_name)}</strong></div>
          <div class="muted">第 ${index + 1} 份 / ${entry.raw_json.length} 字符 / ${lineCount} 行</div>
          <div class="actions" style="margin-top: 8px;">
            <button class="ghost remove-import-entry-btn" type="button" data-import-entry-id="${escapeHtml(entry.id)}">移除</button>
          </div>
        </div>
      `;
    })
    .join("");
}

export function renderPendingHelperInventoryEntriesView(refs, entries, { escapeHtml }) {
  if (refs.helperImportCountChip) {
    refs.helperImportCountChip.textContent = `已暂存 ${entries.length} 份功法 JSON`;
  }
  if (!refs.helperImportList) return;
  if (entries.length === 0) {
    refs.helperImportList.innerHTML = '<div class="stack-item">暂时还没有加入功法仓库导入的 JSON。</div>';
    return;
  }
  refs.helperImportList.innerHTML = entries
    .map((entry, index) => {
      const lineCount = entry.raw_json.split("\n").length;
      const meta = entry.meta || null;
      const summaryBits = [
        meta?.format === "helper_payload"
          ? "helper payload"
          : meta?.format === "legacy_getinfo"
            ? "legacy_getinfo"
            : "未识别格式",
        meta?.roleId ? `游戏 ID ${meta.roleId}` : "",
        meta?.roleName ? `角色 ${meta.roleName}` : "",
        meta?.server ? `区服 ${meta.server}` : "",
        meta?.currentScheduleId ? `赛季 S${meta.currentScheduleId}` : "",
        Number.isFinite(Number(meta?.itemCount)) ? `${Number(meta?.itemCount || 0)} 张功法` : "",
      ]
        .filter(Boolean)
        .join(" / ");
      return `
        <div class="stack-item">
          <div><strong>${escapeHtml(entry.source_file_name)}</strong></div>
          <div class="muted">第 ${index + 1} 份 / ${entry.raw_json.length} 字符 / ${lineCount} 行</div>
          ${summaryBits ? `<div class="muted" style="margin-top: 6px;">${escapeHtml(summaryBits)}</div>` : ""}
          <div class="actions" style="margin-top: 8px;">
            <button class="ghost remove-helper-import-entry-btn" type="button" data-helper-import-entry-id="${escapeHtml(entry.id)}">移除</button>
          </div>
        </div>
      `;
    })
    .join("");
}
