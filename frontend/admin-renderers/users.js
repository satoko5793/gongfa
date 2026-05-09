const HELPER_CAPABILITY_OPTIONS = [
  ["inventory.sync_current", "同步当前号"],
  ["inventory.sync_all", "同步全部炉子"],
  ["snapshot.create", "保存阵容"],
  ["logs.read", "查看日志"],
  ["game.daily_tasks", "每日任务"],
  ["game.salt_robot_claim", "盐罐领取"],
  ["game.hangup_claim", "挂机领取"],
  ["game.hangup_extend", "挂机加钟"],
  ["game.club_checkin", "俱乐部签到"],
  ["game.club_ranking", "俱乐部报名"],
  ["game.tower_challenge", "咸将塔单次"],
  ["game.arena_challenge", "竞技场单次"],
];

export function renderUsersSection(context, users = context.getAllUsers()) {
  const { refs, escapeHtml, hasAdminWriteAccess } = context;
  const { usersRoot } = refs;
  if (!usersRoot) return;

  const canWrite = hasAdminWriteAccess();
  if (!Array.isArray(users) || users.length === 0) {
    usersRoot.innerHTML = '<div class="stack-item">没有匹配到用户。</div>';
    return;
  }

  usersRoot.innerHTML = users
    .map(
      (user) => {
        const isAdmin = String(user.role || "").trim() === "admin";
        const helperCapabilities = new Set(
          isAdmin
            ? HELPER_CAPABILITY_OPTIONS.map(([value]) => value)
            : Array.isArray(user.helper_capabilities)
              ? user.helper_capabilities
              : []
        );
        const helperCapabilityControls = HELPER_CAPABILITY_OPTIONS.map(
          ([value, label]) => `
            <label class="helper-capability-toggle">
              <input type="checkbox" data-helper-capability="${escapeHtml(value)}" ${helperCapabilities.has(value) ? "checked" : ""} ${isAdmin ? "disabled" : ""} />
              <span>${escapeHtml(label)}</span>
            </label>
          `
        ).join("");
        return `
        <div class="admin-card" data-user-id="${user.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(user.game_role_name || "-")}</div>
            <span class="chip">${escapeHtml(user.role || "-")}</span>
          </div>
          <div class="product-meta">
            <div>${escapeHtml(user.game_server || "-")} / ${escapeHtml(user.game_role_id || "-")}</div>
            <div>当前额度：${Number(user.quota_balance || 0)}</div>
            <div>账号状态：${escapeHtml(user.status || "-")}</div>
            <div>昵称：${escapeHtml(user.nickname || "-")}</div>
            <div>阵容槽位：已存 ${Number(user.lineup_slot_saved || 0)} / 可用 ${Number(user.lineup_slot_limit || 0)}</div>
            <div>槽位构成：基础 ${Number(user.lineup_slot_base || 0)} / 永久 ${Number(user.lineup_slot_permanent || 0)} / 赛季 ${Number(user.lineup_slot_seasonal || 0)} / 会员赠送 ${Number(user.lineup_slot_member_bonus || 0)}</div>
            <div>Helper：${isAdmin ? "管理员默认全开" : helperCapabilities.size ? [...helperCapabilities].map((item) => escapeHtml(item)).join(" / ") : "未授权"}</div>
          </div>
          ${
            canWrite
              ? `
                  <div class="inline-form">
                    <input data-field="change_amount" type="number" placeholder="额度增减，可填负数" />
                    <input data-field="remark" type="text" placeholder="备注" />
                  </div>
                  <div class="actions tight">
                    <button class="ghost quick-quota-btn" type="button" data-amount="1000">+1000</button>
                    <button class="ghost quick-quota-btn" type="button" data-amount="5000">+5000</button>
                    <button class="ghost quick-quota-btn" type="button" data-amount="10000">+10000</button>
                    <button class="ghost view-user-orders-btn" type="button">查看订单</button>
                  </div>
                  <div class="actions">
                    <button class="primary save-quota-btn" type="button">调整额度</button>
                    <button class="ghost toggle-status-btn" type="button">${
                      user.status === "active" ? "禁用" : "启用"
                    }</button>
                  </div>
                  <div class="helper-capability-panel">
                    <div class="muted">Helper 测试服能力</div>
                    <div class="helper-capability-grid">${helperCapabilityControls}</div>
                    <button class="ghost save-helper-capabilities-btn" type="button" ${isAdmin ? "disabled" : ""}>保存 helper 授权</button>
                  </div>
                `
              : `
                  <div class="actions">
                    <button class="ghost view-user-orders-btn" type="button">查看订单</button>
                  </div>
                `
          }
        </div>
      `;
      }
    )
    .join("");
}
