function buildHelperRestoreProgressMarkup(ctx, progress) {
  if (!progress) return "";
  const percent = Math.max(0, Math.min(100, Number(progress?.percent || 0)));
  const status = String(progress?.status || "running").trim() || "running";
  const label = String(progress?.label || "正在还原").trim() || "正在还原";
  const detail = String(progress?.detail || "").trim();
  return `
    <div class="helper-restore-progress-card ${ctx.escapeHtml(status)}">
      <div class="helper-restore-progress-head">
        <div>
          <div class="helper-snapshot-kicker">还原进度</div>
          <strong class="helper-snapshot-title">${ctx.escapeHtml(label)}</strong>
        </div>
        <span class="helper-chip">${ctx.escapeHtml(`${percent}%`)}</span>
      </div>
      <div class="helper-progress-track" aria-hidden="true">
        <div class="helper-progress-fill" style="width:${percent}%"></div>
      </div>
      <div class="helper-status-meta">${ctx.escapeHtml(detail || "系统正在执行阵容恢复，请保持页面打开。")}</div>
    </div>
  `;
}

const HELPER_CAPABILITY = {
  INVENTORY_SYNC_CURRENT: "inventory.sync_current",
  INVENTORY_SYNC_ALL: "inventory.sync_all",
  SNAPSHOT_CREATE: "snapshot.create",
  LOGS_READ: "logs.read",
  GAME_DAILY_TASKS: "game.daily_tasks",
  GAME_SALT_ROBOT_CLAIM: "game.salt_robot_claim",
  GAME_HANGUP_CLAIM: "game.hangup_claim",
  GAME_HANGUP_EXTEND: "game.hangup_extend",
  GAME_CLUB_CHECKIN: "game.club_checkin",
  GAME_CLUB_RANKING: "game.club_ranking",
  GAME_TOWER_CHALLENGE: "game.tower_challenge",
  GAME_ARENA_CHALLENGE: "game.arena_challenge",
};

const HELPER_GAME_FEATURES = [
  {
    key: "daily_tasks",
    capability: HELPER_CAPABILITY.GAME_DAILY_TASKS,
    title: "每日任务",
    description: "领取每日任务奖励。",
  },
  {
    key: "salt_robot_claim",
    capability: HELPER_CAPABILITY.GAME_SALT_ROBOT_CLAIM,
    title: "盐罐机器人",
    description: "领取盐罐机器人奖励。",
  },
  {
    key: "hangup_claim",
    capability: HELPER_CAPABILITY.GAME_HANGUP_CLAIM,
    title: "挂机领取",
    description: "领取当前挂机收益。",
  },
  {
    key: "hangup_extend",
    capability: HELPER_CAPABILITY.GAME_HANGUP_EXTEND,
    title: "挂机加钟",
    description: "执行 4 次分享加钟。",
  },
  {
    key: "club_checkin",
    capability: HELPER_CAPABILITY.GAME_CLUB_CHECKIN,
    title: "俱乐部签到",
    description: "执行俱乐部签到。",
  },
  {
    key: "club_ranking",
    capability: HELPER_CAPABILITY.GAME_CLUB_RANKING,
    title: "俱乐部报名",
    description: "报名俱乐部排位。",
  },
  {
    key: "tower_challenge",
    capability: HELPER_CAPABILITY.GAME_TOWER_CHALLENGE,
    title: "咸将塔单次",
    description: "只挑战 1 次咸将塔。",
  },
  {
    key: "arena_challenge",
    capability: HELPER_CAPABILITY.GAME_ARENA_CHALLENGE,
    title: "竞技场单次",
    description: "选择一个目标挑战 1 次。",
  },
];

const HELPER_INVENTORY_PREVIEW_LIMIT = 0;

export function renderHelperRestoreProgressPanel(ctx) {
  if (!ctx.helperRestoreProgressCurrent) return;
  if (!ctx.currentHelperRestoreProgress) {
    ctx.helperRestoreProgressCurrent.innerHTML = "";
    ctx.helperRestoreProgressCurrent.classList.add("hidden");
    return;
  }
  ctx.helperRestoreProgressCurrent.innerHTML = buildHelperRestoreProgressMarkup(
    ctx,
    ctx.currentHelperRestoreProgress
  );
  ctx.helperRestoreProgressCurrent.classList.remove("hidden");
}

export function renderHelperAuthEntry(ctx) {
  if (!ctx.helperOpenAuthPopupBtn || !ctx.helperAuthNote) return;
  const enabled = ctx.isHelperScanAuthEnabled();
  ctx.helperOpenAuthPopupBtn.disabled = !enabled;
  ctx.helperAuthNote.textContent = enabled
    ? "直接用微信扫码选择角色，商城会自动进入对应账号。之后阵容保存和一键还原也会默认跟着这个角色走。"
    : "当前环境还没有开放扫码进入，请先用密码登录。";
  if (
    enabled &&
    ctx.helperAuthMessage?.classList.contains("error") &&
    ctx.helperAuthMessage.textContent.includes("未开启")
  ) {
    ctx.setHelperAuthMessage("");
  }
}

export function renderHelperBindingPanel(ctx) {
  if (!ctx.helperBindCurrent) return;
  const bindings = Array.isArray(ctx.currentHelperBindings) ? ctx.currentHelperBindings : [];
  const activeBinding = ctx.syncActiveHelperBindingPreference();
  const draft = ctx.pendingHelperBridgePayload;
  const helperAllowed = ctx.hasAnyHelperCapability?.() === true;

  [ctx.helperOpenBindPopupBtn, ctx.helperSaveBindBtn, ctx.helperClearBindBtn].forEach((button) => {
    if (!button) return;
    button.classList.toggle("hidden", !helperAllowed);
    button.disabled = !helperAllowed;
  });

  if (!helperAllowed) {
    ctx.helperBindCurrent.innerHTML = `
      <div class="helper-status-card">
        <div class="helper-status-main">
          <strong>当前账号暂未开放 helper 功能</strong>
          <div class="muted">测试服会按账号单独开通，开通后这里会显示绑定入口。</div>
        </div>
      </div>
    `;
    return;
  }

  if (!draft && !activeBinding) {
    ctx.helperBindCurrent.innerHTML = `
      <div class="helper-status-card">
        <div class="helper-status-main">
          <strong>还没有绑定角色</strong>
          <div class="muted">先扫码一次，后面的阵容保存和一键还原都会自动跟着这个角色走。</div>
        </div>
      </div>
    `;
    return;
  }

  const parts = [];
  if (draft) {
    parts.push(`
      <div class="helper-status-card pending">
        <div class="helper-status-main">
          <span class="helper-status-badge">待确认</span>
          <strong>${ctx.escapeHtml(ctx.normalizeHelperDisplayRoleName(draft.game_role_name, draft.game_role_id) || "-")}</strong>
          <div class="muted">${ctx.escapeHtml(draft.game_server || "-")} / 角色 ID ${ctx.escapeHtml(draft.game_role_id || "-")}</div>
        </div>
        <div class="helper-status-meta">这一步只是把扫码结果带回商城，点“确认绑定”后才会正式生效。</div>
      </div>
    `);
  }
  if (activeBinding) {
    parts.push(`
      <div class="helper-status-card ready helper-status-card-active">
        <div class="helper-status-main">
          <span class="helper-status-badge">当前使用</span>
          <strong>${ctx.escapeHtml(ctx.normalizeHelperDisplayRoleName(activeBinding.game_role_name, activeBinding.game_role_id) || "-")}</strong>
          <div class="muted">${ctx.escapeHtml(activeBinding.game_server || "-")} / 角色 ID ${ctx.escapeHtml(activeBinding.game_role_id || "-")}</div>
        </div>
        <div class="helper-status-meta">最近更新：${ctx.escapeHtml(ctx.formatDate(activeBinding.updated_at))}</div>
        <div class="actions">
          <button type="button" class="ghost helper-remove-binding-btn" data-helper-binding-id="${Number(activeBinding.id || 0)}">解绑角色</button>
        </div>
      </div>
    `);
  }
  const otherBindings = bindings.filter(
    (item) => Number(item?.id || 0) !== Number(activeBinding?.id || 0)
  );
  if (otherBindings.length) {
    parts.push(`
      <div class="helper-bind-selection">
        <div class="helper-binding-list-title">已绑定的其他角色</div>
        <div class="helper-binding-list">
          ${otherBindings
            .map(
              (binding) => `
                <article class="helper-status-card helper-status-card-compact">
                  <div class="helper-status-main">
                    <span class="helper-status-badge">已绑定</span>
                    <strong>${ctx.escapeHtml(ctx.normalizeHelperDisplayRoleName(binding.game_role_name, binding.game_role_id) || "-")}</strong>
                    <div class="muted">${ctx.escapeHtml(binding.game_server || "-")} / 角色 ID ${ctx.escapeHtml(binding.game_role_id || "-")}</div>
                  </div>
                  <div class="helper-status-meta">最近更新：${ctx.escapeHtml(ctx.formatDate(binding.updated_at))}</div>
                  <div class="actions">
                    <button type="button" class="ghost helper-set-active-binding-btn" data-helper-binding-id="${Number(binding.id || 0)}">设为当前使用</button>
                    <button type="button" class="ghost helper-remove-binding-btn" data-helper-binding-id="${Number(binding.id || 0)}">解绑角色</button>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `);
  }
  ctx.helperBindCurrent.innerHTML = parts.join("");
}

function buildHelperInventoryItemMarkup(ctx, item, { compact = false } = {}) {
  const name = String(item?.display_name || "功法").trim() || "功法";
  const imageUrl = ctx.getHelperInventoryImageUrl(item);
  const subtitle = [`攻 ${Number(item?.attack_value || 0) || "-"}`, `血 ${Number(item?.hp_value || 0) || "-"}`]
    .filter(Boolean)
    .join(" / ");
  const attrSummary = [String(item?.main_attr_text || "").trim(), String(item?.ext_attr_text || "").trim()]
    .filter((value) => value && value !== "无")
    .join(" · ");
  const seasonDisplay = String(item?.season_display || "").trim();
  const metaChips = [
    Number(item?.total_count || 0) > 1 ? `×${Number(item.total_count)}` : "",
    seasonDisplay,
    item?.has_ext ? "带词条" : "",
    item?.max ? "双满" : "",
  ]
    .filter(Boolean)
    .map((chip) => `<span class="helper-chip">${ctx.escapeHtml(chip)}</span>`)
    .join("");
  const sourceMarkup = Array.isArray(item?.source_roles)
    ? `<div class="helper-inventory-sources">${item.source_roles
        .map(
          (role) =>
            `<span class="helper-chip helper-chip-soft">${ctx.escapeHtml(role?.role_name || "-")} ×${ctx.escapeHtml(role?.count || 1)}</span>`
        )
        .join("")}</div>`
    : "";
  return `
    <article class="helper-inventory-item ${compact ? "compact" : ""}">
      ${
        imageUrl
          ? `<img class="helper-inventory-item-image" src="${ctx.escapeHtml(imageUrl)}" alt="${ctx.escapeHtml(name)}" loading="lazy" />`
          : `<div class="helper-inventory-item-image placeholder">${ctx.escapeHtml(name.slice(0, 2))}</div>`
      }
      <div class="helper-inventory-item-body">
        <div class="helper-inventory-item-name">${ctx.escapeHtml(name)}</div>
        <div class="helper-inventory-item-meta">${ctx.escapeHtml(subtitle)}</div>
        ${attrSummary ? `<div class="helper-inventory-item-attrs">${ctx.escapeHtml(attrSummary)}</div>` : ""}
        ${metaChips ? `<div class="helper-inventory-item-chips">${metaChips}</div>` : ""}
        ${compact ? "" : sourceMarkup}
      </div>
    </article>
  `;
}

export function renderHelperInventoryPanel(ctx) {
  if (!ctx.helperInventoryBindings || !ctx.helperInventoryMerged) return;
  const bindings = Array.isArray(ctx.currentHelperBindings) ? ctx.currentHelperBindings : [];
  const activeBinding = ctx.getActiveHelperBinding();
  const mergedItems = Array.isArray(ctx.currentHelperMergedItems) ? ctx.currentHelperMergedItems : [];
  const canImportProducts = String(ctx.currentProfile?.role || "").trim() === "admin";
  const importRunning = Boolean(ctx.helperInventoryImportState?.running);
  const canSyncCurrent = ctx.hasHelperCapability?.(HELPER_CAPABILITY.INVENTORY_SYNC_CURRENT) === true;
  const canSyncAll = ctx.hasHelperCapability?.(HELPER_CAPABILITY.INVENTORY_SYNC_ALL) === true;

  if (!ctx.currentProfile || !ctx.isHelperInventoryEnabled()) {
    ctx.helperInventoryBindings.innerHTML =
      '<div class="stack-item">绑定多个角色后，就能在这里分别看到每个炉子的功法库存。</div>';
    ctx.helperInventoryMerged.innerHTML =
      '<div class="stack-item">同步完成后，这里会展示多个炉子合并后的总仓库。</div>';
    if (ctx.helperSyncCurrentInventoryBtn) ctx.helperSyncCurrentInventoryBtn.disabled = true;
    if (ctx.helperSyncAllInventoryBtn) ctx.helperSyncAllInventoryBtn.disabled = true;
    ctx.helperSyncCurrentInventoryBtn?.classList.toggle("hidden", true);
    ctx.helperSyncAllInventoryBtn?.classList.toggle("hidden", true);
    ctx.setHelperInventoryMessage("", "");
    return;
  }

  if (ctx.helperSyncCurrentInventoryBtn) {
    ctx.helperSyncCurrentInventoryBtn.classList.toggle("hidden", !canSyncCurrent);
    ctx.helperSyncCurrentInventoryBtn.disabled =
      !canSyncCurrent || !activeBinding || ctx.helperInventorySyncState.running;
    ctx.helperSyncCurrentInventoryBtn.textContent =
      ctx.helperInventorySyncState.running && ctx.helperInventorySyncState.mode === "current"
        ? "同步中..."
        : "同步当前号功法";
  }
  if (ctx.helperSyncAllInventoryBtn) {
    ctx.helperSyncAllInventoryBtn.classList.toggle("hidden", !canSyncAll);
    ctx.helperSyncAllInventoryBtn.disabled =
      !canSyncAll || !bindings.length || ctx.helperInventorySyncState.running;
    ctx.helperSyncAllInventoryBtn.textContent =
      ctx.helperInventorySyncState.running && ctx.helperInventorySyncState.mode === "all"
        ? `同步中 ${ctx.helperInventorySyncState.completed}/${ctx.helperInventorySyncState.total || 0}`
        : "同步全部炉子";
  }

  if (!bindings.length) {
    ctx.helperInventoryBindings.innerHTML =
      '<div class="stack-item">先绑定至少一个游戏角色，才能同步各个炉子的功法库存。</div>';
  } else {
    ctx.helperInventoryBindings.innerHTML = bindings
      .map((binding) => {
        const inventory = ctx.getHelperInventoryBinding(binding?.id);
        const count = Number(
          inventory?.summary?.legacy_count || (inventory?.items || []).length || 0
        );
        const fragmentCount = Number(inventory?.summary?.fragment_count || 0);
        const updatedAt =
          inventory?.updated_at || inventory?.summary?.synced_at || binding?.updated_at;
        const isCurrent =
          Number(binding?.id || 0) === Number(activeBinding?.id || 0);
        const syncingThisOne =
          ctx.helperInventorySyncState.running &&
          Number(ctx.helperInventorySyncState.currentBindingId || 0) === Number(binding?.id || 0);
        return `
          <article class="helper-inventory-binding-card ${isCurrent ? "active" : ""}">
            <div class="helper-inventory-binding-head">
              <div>
                <div class="helper-snapshot-kicker">${isCurrent ? "当前使用" : "已绑定角色"}</div>
                <strong>${ctx.escapeHtml(ctx.normalizeHelperDisplayRoleName(binding?.game_role_name, binding?.game_role_id) || "-")}</strong>
                <div class="muted">${ctx.escapeHtml(binding?.game_server || "-")} / 角色 ID ${ctx.escapeHtml(binding?.game_role_id || "-")}</div>
              </div>
              <div class="helper-inventory-binding-summary">
                <strong>${count}</strong>
                <span>张功法</span>
              </div>
            </div>
            <div class="helper-hero-meta helper-hero-meta-soft">
              <span class="helper-chip">残卷 ${fragmentCount}</span>
              <span class="helper-chip">${ctx.escapeHtml(updatedAt ? `${ctx.formatDate(updatedAt)} 同步` : "未同步")}</span>
            </div>
            <div class="helper-status-meta">${
              inventory?.items?.length
                ? `功法明细已收起，避免同步后一次性加载大量卡片图片。`
                : "还没有同步过这个角色的功法库存。"
            }</div>
            <div class="actions">
              <button type="button" class="ghost helper-sync-binding-inventory-btn" data-helper-binding-id="${Number(binding?.id || 0)}">
                ${syncingThisOne ? "同步中..." : "同步这个炉子"}
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  if (!mergedItems.length) {
    ctx.helperInventoryMerged.innerHTML =
      '<div class="stack-item">还没有任何炉子完成同步。先点“同步当前号功法”或“同步全部炉子”，总仓库就会出现在这里。</div>';
    return;
  }

  const totalCardCount = mergedItems.reduce(
    (sum, item) => sum + Number(item?.total_count || 0),
    0
  );
  const expanded = ctx.isHelperInventoryExpanded?.() === true;
  const visibleMergedItems = expanded
    ? mergedItems
    : mergedItems.slice(0, HELPER_INVENTORY_PREVIEW_LIMIT);
  const hiddenMergedCount = Math.max(mergedItems.length - visibleMergedItems.length, 0);
  ctx.helperInventoryMerged.innerHTML = `
    <div class="helper-inventory-merged-head">
      <div>
        <div class="helper-snapshot-kicker">合并总仓库</div>
        <div class="muted">共 ${mergedItems.length} 种功法 / ${totalCardCount} 张，后面自动发货会从完整仓库里选对应炉子。</div>
      </div>
      ${
        canImportProducts
          ? `<button type="button" class="ghost helper-import-inventory-products-btn" ${importRunning ? "disabled" : ""}>${
              importRunning ? "导入中..." : "导入为商城商品"
            }</button>`
          : ""
      }
    </div>
    ${
      hiddenMergedCount > 0 || expanded
        ? `<div class="helper-inventory-summary-card">
            <div>
              <strong>${expanded ? "正在显示完整仓库" : "功法明细已收起"}</strong>
              <div class="muted">${
                expanded
                  ? "完整列表可能比较长，收起后页面会更轻。"
                  : `当前没有加载任何功法卡片，${hiddenMergedCount} 种明细已收起，自动发货和导入仍使用完整数据。`
              }</div>
            </div>
            <button type="button" class="ghost helper-toggle-inventory-expanded-btn" data-helper-inventory-expanded="${expanded ? "0" : "1"}">
              ${expanded ? "收起明细" : "加载功法明细"}
            </button>
          </div>`
        : ""
    }
    <div class="helper-inventory-grid">
      ${visibleMergedItems.map((item) => buildHelperInventoryItemMarkup(ctx, item)).join("")}
    </div>
  `;
}

export function renderHelperGameFeaturesPanel(ctx) {
  if (!ctx.helperGameFeatureList) return;
  const activeBinding = ctx.getActiveHelperBinding();
  const canUseGameFeatures =
    Boolean(ctx.currentProfile) &&
    ctx.isHelperGameFeaturesEnabled?.() === true &&
    ctx.hasAnyHelperCapability?.() === true;
  const availableFeatures = HELPER_GAME_FEATURES.filter(
    (feature) => ctx.hasHelperCapability?.(feature.capability) === true
  );

  if (!canUseGameFeatures) {
    ctx.helperGameFeatureList.innerHTML =
      '<div class="stack-item">当前账号暂未开放 helper 游戏脚本，测试服授权后会显示可用按钮。</div>';
    ctx.setHelperGameFeatureMessage?.("", "");
    return;
  }

  if (!availableFeatures.length) {
    ctx.helperGameFeatureList.innerHTML =
      '<div class="stack-item">当前账号还没有具体脚本权限，请在后台勾选后再试。</div>';
    ctx.setHelperGameFeatureMessage?.("", "");
    return;
  }

  ctx.helperGameFeatureList.innerHTML = `
    <div class="helper-game-feature-grid">
      ${availableFeatures
        .map(
          (feature) => `
            <article class="helper-status-card helper-status-card-compact">
              <div class="helper-status-main">
                <span class="helper-status-badge">脚本</span>
                <strong>${ctx.escapeHtml(feature.title)}</strong>
                <div class="muted">${ctx.escapeHtml(feature.description)}</div>
              </div>
              <div class="actions">
                <button type="button" class="ghost helper-run-game-feature-btn" data-helper-game-feature="${ctx.escapeHtml(feature.key)}" ${activeBinding ? "" : "disabled"}>
                  ${activeBinding ? "执行" : "先绑定角色"}
                </button>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

export function buildHelperSnapshotName(snapshot) {
  const explicitName = String(snapshot?.snapshot_name || "").trim();
  if (explicitName) return explicitName;
  const summary = snapshot?.summary || {};
  const roleName = String(summary?.role_name || summary?.roleName || "阵容").trim() || "阵容";
  const teamId = Number(summary?.use_team_id || summary?.useTeamId || 0);
  if (teamId > 0) return `${roleName} · ${teamId}号阵容`;
  return `${roleName} · 云端存档`;
}

export function formatRelativeTime(value, formatDate) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes <= 0) return "刚刚保存";
  if (diffMinutes < 60) return `${diffMinutes} 分钟前保存`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} 小时前保存`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} 天前保存`;
  return `${formatDate(value)} 保存`;
}

export function formatRelativeActionTime(value, formatDate) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes <= 0) return "刚刚执行";
  if (diffMinutes < 60) return `${diffMinutes} 分钟前执行`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} 小时前执行`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} 天前执行`;
  return `${formatDate(value)} 执行`;
}

export function formatHelperBattleSlot(slot) {
  const numericSlot = Number(slot);
  if (!Number.isInteger(numericSlot) || numericSlot < 0) return "-";
  return String(numericSlot + 1);
}

export function sortHelperSnapshotsList(list) {
  return [...(list || [])].sort((left, right) => {
    const pinDiff = Number(Boolean(right?.is_pinned)) - Number(Boolean(left?.is_pinned));
    if (pinDiff !== 0) return pinDiff;
    return String(right?.updated_at || right?.created_at || "").localeCompare(
      String(left?.updated_at || left?.created_at || "")
    );
  });
}

function getHelperSnapshotIdentityKey(snapshot) {
  const summary = snapshot?.summary || {};
  return [
    String(summary?.role_id || summary?.roleId || "").trim(),
    String(summary?.server || "").trim(),
    Number(summary?.use_team_id || summary?.useTeamId || 0) || 0,
  ].join("::");
}

function getHelperSnapshotFreshnessScore(ctx, snapshot) {
  const summary = snapshot?.summary || {};
  return (
    Number(summary?.hero_count || 0) * 1000 +
    ctx.getSnapshotLegionResearchCount(snapshot) * 10 +
    ctx.getSnapshotAttachmentOwnershipCount(snapshot)
  );
}

function partitionHelperSnapshots(ctx, list) {
  const ordered = sortHelperSnapshotsList(list);
  const winnerByKey = new Map();

  ordered.forEach((snapshot) => {
    const key = getHelperSnapshotIdentityKey(snapshot);
    const score = getHelperSnapshotFreshnessScore(ctx, snapshot);
    const createdAt = String(snapshot?.created_at || snapshot?.updated_at || "");
    const current = winnerByKey.get(key);
    if (!current || score > current.score || (score === current.score && createdAt > current.createdAt)) {
      winnerByKey.set(key, {
        id: Number(snapshot?.id || 0),
        score,
        createdAt,
      });
    }
  });

  const active = [];
  const archived = [];
  ordered.forEach((snapshot) => {
    const key = getHelperSnapshotIdentityKey(snapshot);
    const winner = winnerByKey.get(key);
    if (winner && winner.id === Number(snapshot?.id || 0)) {
      active.push(snapshot);
    } else {
      archived.push(snapshot);
    }
  });

  return { active, archived };
}

function buildHelperSnapshotHeroStripMarkup(ctx, snapshot) {
  const heroes = ctx.getSnapshotRawHeroes(snapshot).slice(0, 6);
  if (!heroes.length) {
    return '<div class="helper-hero-strip-empty">暂无武将摘要</div>';
  }
  return heroes
    .map((hero) => {
      const avatarUrl = ctx.getHeroAvatarUrl(hero);
      const heroName = String(hero?.hero_name || "武将").trim() || "武将";
      const fishName = String(hero?.fish_name || "").trim();
      const pearlSkillName = String(hero?.pearl_skill_name || "").trim();
      const miniMeta =
        fishName || pearlSkillName
          ? [fishName, pearlSkillName].filter(Boolean).join(" · ")
          : `Lv.${hero?.level || 0}`;
      return `
        <article class="helper-hero-mini">
          <span class="helper-hero-mini-slot">${ctx.escapeHtml(formatHelperBattleSlot(hero?.slot))}号位</span>
          ${
            avatarUrl
              ? `<img class="helper-hero-mini-avatar" src="${ctx.escapeHtml(avatarUrl)}" alt="${ctx.escapeHtml(heroName)}" loading="lazy" />`
              : `<div class="helper-hero-mini-avatar placeholder">${ctx.escapeHtml(heroName.slice(0, 2))}</div>`
          }
          <div class="helper-hero-mini-body">
            <span class="helper-hero-mini-name">${ctx.escapeHtml(heroName)}</span>
            <span class="helper-hero-mini-meta">${ctx.escapeHtml(miniMeta)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function buildHelperSnapshotDetailMarkup(ctx, snapshot) {
  const summary = snapshot?.summary || {};
  const heroes = ctx.getSnapshotRawHeroes(snapshot);
  const weaponInfo = ctx.getSnapshotWeaponInfo(snapshot);
  const techCount = ctx.getSnapshotLegionResearchCount(snapshot);
  const attachmentOwnershipCount = ctx.getSnapshotAttachmentOwnershipCount(snapshot);
  if (!heroes.length) {
    return '<div class="stack-item">当前快照没有可展示的武将摘要。</div>';
  }
  const overviewCards = [
    { label: "阵容位", value: `${summary?.use_team_id || 0} 号`, accent: "accent" },
    { label: "武将", value: `${summary?.hero_count || heroes.length || 0} 名` },
    { label: "科技", value: techCount > 0 ? `${techCount} 项` : "未记录" },
    { label: "主玩具", value: weaponInfo?.name || "未记录", accent: weaponInfo ? "success" : "" },
  ]
    .map(
      (item) => `
        <article class="helper-overview-card ${item.accent || ""}">
          <div class="helper-overview-label">${ctx.escapeHtml(item.label)}</div>
          <div class="helper-overview-value">${ctx.escapeHtml(item.value)}</div>
        </article>
      `
    )
    .join("");
  const heroMarkup = heroes
    .map((hero) => {
      const avatarUrl = ctx.getHeroAvatarUrl(hero);
      const attachmentUid = ctx.normalizeHelperAttachmentUid(hero?.attachment_uid);
      const topMetaBits = [`Lv.${hero?.level || 0}`, hero?.power ? `${hero.power} 战力` : ""]
        .filter(Boolean)
        .join(" · ");
      const fishAndPearl = [hero?.fish_name || "未佩戴", hero?.pearl_skill_name || "无鱼珠技能"]
        .filter(Boolean)
        .join(" · ");
      const equipSummary = [
        ctx.buildHelperEquipmentSummary(hero?.equipment),
        `${hero?.red_count || 0} 红淬 / ${hero?.hole_count || 0} 开孔`,
      ]
        .filter(Boolean)
        .join(" · ");
      const quickMeta = [
        { label: "鱼灵 / 鱼珠", value: fishAndPearl },
        { label: "洗练归属", value: attachmentUid ? `#${attachmentUid}` : "未记录" },
        { label: "鱼珠孔位", value: ctx.buildHelperFishSlotsSummary(hero?.fish_slots) },
        { label: "洗练 / 开孔", value: equipSummary },
      ]
        .map(
          (item) => `
            <div class="helper-hero-quick-meta">
              <span class="helper-hero-quick-label">${ctx.escapeHtml(item.label)}</span>
              <strong>${ctx.escapeHtml(item.value)}</strong>
            </div>
          `
        )
        .join("");
      return `
        <article class="helper-hero-card">
          <div class="helper-hero-avatar-wrap">
            ${
              avatarUrl
                ? `<img class="helper-hero-avatar" src="${ctx.escapeHtml(avatarUrl)}" alt="${ctx.escapeHtml(hero.hero_name || "武将")}" loading="lazy" />`
                : `<div class="helper-hero-avatar placeholder">${ctx.escapeHtml(String(hero.hero_name || "武将").slice(0, 2))}</div>`
            }
            <span class="helper-hero-slot">#${ctx.escapeHtml(formatHelperBattleSlot(hero?.slot))}</span>
          </div>
          <div class="helper-hero-body">
            <div class="helper-hero-head">
              <div class="helper-hero-heading">
                <strong>${ctx.escapeHtml(hero.hero_name || "武将")}</strong>
                <span class="helper-hero-headline-meta">${ctx.escapeHtml(topMetaBits)}</span>
              </div>
              <span class="helper-hero-type">${ctx.escapeHtml(hero.hero_type || "未知阵营")}</span>
            </div>
            <div class="helper-hero-quick-grid">${quickMeta}</div>
          </div>
        </article>
      `;
    })
    .join("");
  return `
    <div class="helper-detail-overview">
      <div class="helper-overview-grid">${overviewCards}</div>
    </div>
    <div class="helper-hero-stack">${heroMarkup}</div>
  `;
}

function buildHelperPreviewMarkup(ctx, preview) {
  if (!preview) {
    return '<div class="stack-item">选择某份历史快照后，这里会展示“当前阵容”和“目标快照”之间的恢复步骤预演。</div>';
  }
  const safeSummary = [
    preview?.safe_counts?.hero_slots ? `站位 ${preview.safe_counts.hero_slots}` : "",
    preview?.safe_counts?.hero_levels ? `等级 ${preview.safe_counts.hero_levels}` : "",
    preview?.safe_counts?.attachment_transfers ? `归属 ${preview.safe_counts.attachment_transfers}` : "",
    preview?.safe_counts?.artifacts ? `鱼灵 ${preview.safe_counts.artifacts}` : "",
    preview?.safe_counts?.pearl_skills ? `鱼珠 ${preview.safe_counts.pearl_skills}` : "",
    preview?.safe_counts?.legion_research ? `科技 ${preview.safe_counts.legion_research}` : "",
    preview?.safe_counts?.weapon ? `玩具 ${preview.safe_counts.weapon}` : "",
  ]
    .filter(Boolean)
    .join(" / ");
  const warningMarkup =
    Array.isArray(preview?.warnings) && preview.warnings.length
      ? `<div class="helper-preview-warning-list">${preview.warnings
          .map((item) => `<div class="stack-item">${ctx.escapeHtml(item)}</div>`)
          .join("")}</div>`
      : "";
  const stepMarkup =
    Array.isArray(preview?.steps) && preview.steps.length
      ? `<div class="helper-preview-step-list">${preview.steps
          .map(
            (step, index) => `
              <article class="helper-preview-step ${ctx.escapeHtml(step.type || "safe")}">
                <div class="helper-preview-step-head">
                  <span class="helper-preview-step-index">步骤 ${index + 1}</span>
                  <strong>${ctx.escapeHtml(step.label || "恢复动作")}</strong>
                </div>
                <div class="helper-capability-note">${ctx.escapeHtml(step.description || "-")}</div>
              </article>
            `
          )
          .join("")}</div>`
      : '<div class="stack-item">当前阵容和目标快照已经非常接近，没有检测到需要执行的安全恢复步骤。</div>';

  return `
    <div class="helper-snapshot-item">
      <div class="stack-item"><strong>目标快照：</strong>${ctx.escapeHtml(preview?.target_snapshot_name || "-")}</div>
      <div class="stack-item">当前实时阵容：阵容 ${ctx.escapeHtml(preview?.live_summary?.use_team_id || "-")} / ${ctx.escapeHtml(preview?.live_summary?.role_name || "-")} / ${ctx.escapeHtml(preview?.live_summary?.server || "-")}</div>
      <div class="stack-item">安全恢复步骤：${ctx.escapeHtml(preview?.safe_step_count || 0)} 项${safeSummary ? `（${ctx.escapeHtml(safeSummary)}）` : ""}</div>
      <div class="stack-item">执行顺序：若涉及洗练归属，helper 会先迁移对应套装，再继续站位、等级、鱼灵和科技动作。</div>
      <div class="stack-item">仅记录未自动恢复：${ctx.escapeHtml(preview?.recorded_only_count || 0)} 项</div>
      ${warningMarkup}
      ${stepMarkup}
    </div>
  `;
}

function renderHelperSnapshotCard(ctx, snapshot, { isLatest = false, isArchived = false } = {}) {
  const summary = snapshot?.summary || {};
  const snapshotId = Number(snapshot?.id || 0);
  const teamId = Number(summary?.use_team_id || 0);
  const expanded = ctx.expandedHelperSnapshotIds.has(snapshotId);
  const heroes = Array.isArray(summary.heroes) ? summary.heroes : [];
  const weaponInfo = ctx.getSnapshotWeaponInfo(snapshot);
  const legionResearchCount = ctx.getSnapshotLegionResearchCount(snapshot);
  const safeRestoreBlockReason = ctx.getSnapshotSafeRestoreBlockReason(snapshot);
  const safeRestoreReady = !safeRestoreBlockReason;
  const heroStripMarkup = buildHelperSnapshotHeroStripMarkup(ctx, snapshot);
  const metaBits = [
    teamId > 0 ? `${teamId}号阵容` : "",
    `${summary.hero_count || heroes.length || 0} 名武将`,
    legionResearchCount > 0 ? `科技 ${legionResearchCount} 项` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const snapshotOverviewMarkup = [
    { label: "阵容", value: teamId > 0 ? `${teamId} 号` : "未识别" },
    { label: "武将", value: `${summary.hero_count || heroes.length || 0} 名` },
    { label: "科技", value: legionResearchCount > 0 ? `${legionResearchCount} 项` : "未记录" },
    { label: "主玩具", value: weaponInfo?.name || "未记录" },
  ]
    .map(
      (item) => `
        <div class="helper-snapshot-stat">
          <span class="helper-snapshot-stat-label">${ctx.escapeHtml(item.label)}</span>
          <strong class="helper-snapshot-stat-value">${ctx.escapeHtml(item.value)}</strong>
        </div>
      `
    )
    .join("");
  return `
    <article class="helper-snapshot-card ${isLatest ? "latest" : ""} ${isArchived ? "archived" : ""}">
      <div class="helper-snapshot-head">
        <div class="helper-snapshot-title-group">
          <div class="helper-snapshot-kicker">${ctx.escapeHtml(snapshot?.is_pinned ? "已置顶" : isLatest ? "当前保存" : isArchived ? "旧版快照" : "云端阵容")}</div>
          <strong class="helper-snapshot-title">${ctx.escapeHtml(buildHelperSnapshotName(snapshot))}</strong>
          <div class="helper-snapshot-subtitle">${ctx.escapeHtml(summary.role_name || "-")} / ${ctx.escapeHtml(summary.server || "-")}</div>
        </div>
        <div class="helper-snapshot-time">
          <div>${ctx.escapeHtml(formatRelativeTime(snapshot.created_at || summary.captured_at, ctx.formatDate))}</div>
          <div>${ctx.escapeHtml(ctx.formatDate(snapshot.created_at || summary.captured_at))}</div>
        </div>
      </div>
      <div class="helper-snapshot-summary">${ctx.escapeHtml(metaBits || "阵容信息已保存")}</div>
      <div class="helper-snapshot-stage">
        <div class="helper-hero-mini-strip">${heroStripMarkup}</div>
      </div>
      <div class="helper-snapshot-stat-grid">${snapshotOverviewMarkup}</div>
      <div class="helper-hero-meta helper-hero-meta-soft">
        ${snapshot?.is_pinned ? '<span class="helper-chip helper-chip-accent">已置顶</span>' : ""}
        ${isArchived ? '<span class="helper-chip">检测到更新版</span>' : ""}
        <span class="helper-chip">${ctx.escapeHtml(ctx.buildHelperSnapshotRestoreSummaryText(snapshot))}</span>
        ${weaponInfo?.name ? `<span class="helper-chip">主玩具 ${ctx.escapeHtml(weaponInfo.name)}</span>` : ""}
      </div>
      <div class="actions">
        ${
          ctx.helperConfig?.features?.team_restore
            ? `<button type="button" class="primary helper-restore-snapshot-btn" data-helper-snapshot-id="${snapshotId}" ${
                safeRestoreReady ? "" : "disabled"
              } title="${ctx.escapeHtml(
                safeRestoreReady ? "按这份阵容执行一键还原" : safeRestoreBlockReason
              )}">一键还原</button>`
            : ctx.helperConfig?.features?.team_switch && teamId > 0
              ? `<button type="button" class="primary helper-switch-to-snapshot-btn" data-helper-team-id="${teamId}" data-helper-snapshot-id="${snapshotId}">切回这套阵容</button>`
              : ""
        }
        <button type="button" class="ghost helper-toggle-snapshot-detail-btn" data-helper-snapshot-id="${snapshotId}">
          ${expanded ? "收起详情" : "查看详情"}
        </button>
        <button type="button" class="ghost helper-rename-snapshot-btn" data-helper-snapshot-id="${snapshotId}">
          重命名
        </button>
        <button type="button" class="ghost helper-pin-snapshot-btn" data-helper-snapshot-id="${snapshotId}" data-helper-pin-state="${snapshot?.is_pinned ? "on" : "off"}">
          ${snapshot?.is_pinned ? "取消置顶" : "置顶阵容"}
        </button>
        <button type="button" class="ghost helper-remove-snapshot-btn" data-helper-snapshot-id="${snapshotId}">删除快照</button>
      </div>
      ${
        isArchived
          ? '<div class="helper-capability-note">这份是同一套阵容的较旧版本，系统已自动优先展示更新、更完整的快照。</div>'
          : ""
      }
      ${
        ctx.helperConfig?.features?.team_restore && !safeRestoreReady
          ? `<div class="helper-capability-note">${ctx.escapeHtml(safeRestoreBlockReason)}</div>`
          : ""
      }
      ${
        expanded
          ? `<div class="helper-snapshot-detail">${buildHelperSnapshotDetailMarkup(ctx, snapshot)}</div>`
          : ""
      }
    </article>
  `;
}

function renderHelperSlotSummaryPanel(ctx, snapshotCount, snapshotLimit) {
  if (!ctx.helperSlotSummary) return;
  const plan = ctx.getHelperLineupPlan();
  if (!ctx.currentProfile) {
    ctx.helperSlotSummary.innerHTML =
      '<div class="stack-item">登录后可查看阵容槽位，并购买更多保存栏位。</div>';
    if (ctx.helperBuyPermanentSlotBtn) ctx.helperBuyPermanentSlotBtn.disabled = true;
    if (ctx.helperBuySeasonalSlotBtn) ctx.helperBuySeasonalSlotBtn.disabled = true;
    ctx.setHelperSlotMessage("", "");
    return;
  }

  const baseSlots = Math.max(
    Number(ctx.currentProfile?.lineup_slot_base || plan.base_slots) || plan.base_slots,
    1
  );
  const permanentSlots = Math.max(
    Number(ctx.currentProfile?.lineup_slot_permanent || 0) || 0,
    0
  );
  const seasonalSlots = Math.max(
    Number(ctx.currentProfile?.lineup_slot_seasonal || 0) || 0,
    0
  );
  const memberBonusSlots = Math.max(
    Number(ctx.currentProfile?.lineup_slot_member_bonus || 0) || 0,
    0
  );
  const availableSlots = Math.max(snapshotLimit - snapshotCount, 0);
  const seasonLabel =
    String(ctx.currentProfile?.lineup_slot_season_label || plan.season_label).trim() ||
    plan.season_label;
  const seasonExpiresAt =
    ctx.currentProfile?.lineup_slot_season_expires_at || plan.season_expires_at;

  ctx.helperSlotSummary.innerHTML = `
    <div class="helper-slot-summary-card">
      <div class="helper-slot-summary-top">
        <div>
          <div class="helper-snapshot-kicker">阵容槽位</div>
          <div class="helper-slot-summary-value">${snapshotCount} / ${snapshotLimit}</div>
        </div>
        <div class="helper-slot-summary-caption">当前还可再保存 ${availableSlots} 套</div>
      </div>
      <div class="helper-slot-chip-row">
        <span class="helper-slot-mini-chip">基础 ${baseSlots}</span>
        <span class="helper-slot-mini-chip">永久 ${permanentSlots}</span>
        <span class="helper-slot-mini-chip">${ctx.escapeHtml(seasonLabel)} ${seasonalSlots}</span>
        <span class="helper-slot-mini-chip">会员赠送 ${memberBonusSlots}</span>
      </div>
      <div class="helper-slot-summary-caption">
        永久槽 ${plan.permanent_slot_quota} 额度 / 个，最多再买 ${Math.max(plan.permanent_slot_max - Number(ctx.currentProfile?.lineup_slot_permanent_purchases || permanentSlots || 0), 0)} 个。
        赛季槽 ${plan.seasonal_slot_quota} 额度 / 个，持续到 ${ctx.escapeHtml(ctx.formatDate(seasonExpiresAt || "")) || "赛季结束"}。
      </div>
    </div>
  `;

  if (ctx.helperBuyPermanentSlotBtn) {
    const reachedPermanentCap =
      Number(ctx.currentProfile?.lineup_slot_permanent_purchases || permanentSlots || 0) >=
      plan.permanent_slot_max;
    ctx.helperBuyPermanentSlotBtn.disabled = reachedPermanentCap;
    ctx.helperBuyPermanentSlotBtn.textContent = reachedPermanentCap
      ? `永久槽已满 ${plan.permanent_slot_max}/${plan.permanent_slot_max}`
      : `+1 永久槽（${plan.permanent_slot_quota}）`;
  }
  if (ctx.helperBuySeasonalSlotBtn) {
    ctx.helperBuySeasonalSlotBtn.disabled = false;
    ctx.helperBuySeasonalSlotBtn.textContent = `+1 ${seasonLabel}槽（${plan.seasonal_slot_quota}）`;
  }
}

export function renderHelperSnapshotPanel(ctx) {
  const { active, archived } = partitionHelperSnapshots(ctx, ctx.currentHelperSnapshots);
  const canCreateSnapshot = ctx.hasHelperCapability?.(HELPER_CAPABILITY.SNAPSHOT_CREATE) === true;
  const snapshotLimit = Math.max(
    Number(ctx.helperConfig?.limits?.snapshots_per_user || 3) || 3,
    1
  );
  const snapshotCount = Array.isArray(ctx.currentHelperSnapshots)
    ? ctx.currentHelperSnapshots.length
    : 0;
  const snapshotLimitReached = snapshotCount >= snapshotLimit;

  renderHelperSlotSummaryPanel(ctx, snapshotCount, snapshotLimit);

  if (ctx.helperReadSnapshotBtn) {
    ctx.helperReadSnapshotBtn.classList.toggle("hidden", !canCreateSnapshot);
    ctx.helperReadSnapshotBtn.disabled = !canCreateSnapshot;
    ctx.helperReadSnapshotBtn.textContent = snapshotLimitReached
      ? `已满 ${snapshotCount}/${snapshotLimit}`
      : "保存当前阵容";
    ctx.helperReadSnapshotBtn.title = snapshotLimitReached
      ? `已达到 ${snapshotLimit} 套阵容上限，请先删除旧阵容`
      : "保存当前阵容";
  }
  if (
    snapshotLimitReached &&
    ctx.helperSnapshotMessage &&
    !String(ctx.helperSnapshotMessage.textContent || "").trim()
  ) {
    ctx.setHelperSnapshotMessage(
      `当前最多保存 ${snapshotLimit} 套阵容，请先删除旧阵容再继续保存。`,
      "success"
    );
  }

  if (ctx.helperSnapshotCurrent) {
    const latest = Array.isArray(active) ? active[0] : null;
    if (!canCreateSnapshot) {
      ctx.helperSnapshotCurrent.innerHTML =
        '<div class="stack-item">当前账号暂未开放阵容快照保存。</div>';
    } else if (!latest) {
      ctx.helperSnapshotCurrent.innerHTML =
        '<div class="stack-item">还没有保存过阵容，点上面的“保存当前阵容”就可以开始。</div>';
    } else {
      ctx.helperSnapshotCurrent.innerHTML = renderHelperSnapshotCard(ctx, latest, {
        isLatest: true,
      });
    }
  }

  if (ctx.helperSnapshotList) {
    const snapshots = ctx.showArchivedHelperSnapshots
      ? [...active.slice(1), ...archived]
      : active.slice(1);
    if (!snapshots.length) {
      ctx.helperSnapshotList.innerHTML = archived.length
        ? `<div class="stack-item">其余都是旧版快照。<button type="button" class="ghost helper-toggle-archived-snapshots-btn" data-helper-archived-state="${ctx.showArchivedHelperSnapshots ? "on" : "off"}">${ctx.showArchivedHelperSnapshots ? "收起旧版快照" : `显示旧版快照（${archived.length}）`}</button></div>`
        : "";
      return;
    }
    const archivedIds = new Set(archived.map((snapshot) => Number(snapshot?.id || 0)));
    ctx.helperSnapshotList.innerHTML = `
      ${
        archived.length
          ? `<div class="stack-item">系统已自动隐藏 ${archived.length} 份旧版重复快照。<button type="button" class="ghost helper-toggle-archived-snapshots-btn" data-helper-archived-state="${ctx.showArchivedHelperSnapshots ? "on" : "off"}">${ctx.showArchivedHelperSnapshots ? "收起旧版快照" : `显示旧版快照（${archived.length}）`}</button></div>`
          : ""
      }
      ${snapshots
        .slice(0, 6)
        .map((snapshot) =>
          renderHelperSnapshotCard(ctx, snapshot, {
            isArchived: archivedIds.has(Number(snapshot?.id || 0)),
          })
        )
        .join("")}
    `;
  }
}

export function renderHelperRestorePreviewPanel(ctx) {
  if (!ctx.helperPreviewCurrent) return;
  ctx.helperPreviewCurrent.innerHTML = buildHelperPreviewMarkup(
    ctx,
    ctx.currentHelperRestorePreview
  );
}

function getLatestHelperTeamId(ctx) {
  const latestAction = Array.isArray(ctx.currentHelperActionLogs)
    ? ctx.currentHelperActionLogs[0]
    : null;
  const latestSnapshot = Array.isArray(ctx.currentHelperSnapshots)
    ? ctx.currentHelperSnapshots[0]
    : null;
  const actionTeamId = Number(
    latestAction?.result_payload?.use_team_id || latestAction?.action_payload?.team_id || 0
  );
  if (Number.isInteger(actionTeamId) && actionTeamId > 0) return actionTeamId;
  const snapshotTeamId = Number(latestSnapshot?.summary?.use_team_id || 0);
  if (Number.isInteger(snapshotTeamId) && snapshotTeamId > 0) return snapshotTeamId;
  return 0;
}

function formatHelperActionLogTitle(log) {
  const actionType = String(log?.action_type || "").trim();
  const okText = log?.result_status === "ok" || log?.result_status === "warning" ? "成功" : "失败";
  switch (actionType) {
    case "helper_binding_upsert":
      return `${okText}：绑定角色`;
    case "helper_binding_remove":
      return `${okText}：解绑角色`;
    case "helper_inventory_sync":
      return `${okText}：功法仓库同步`;
    case "helper_snapshot_create":
      return `${okText}：保存阵容`;
    case "helper_snapshot_update":
      return `${okText}：更新阵容`;
    case "helper_snapshot_remove":
      return `${okText}：删除阵容`;
    case "helper_team_restore":
      return `${okText}：安全恢复`;
    case "helper_team_switch":
      return `${okText}：切换阵容`;
    case "helper_game_feature":
      return `${okText}：${log?.result_payload?.feature_label || log?.action_payload?.feature_label || "游戏脚本"}`;
    default:
      return `${okText}：${actionType || "helper 动作"}`;
  }
}

function formatHelperActionLogDetail(log, fallbackText) {
  const actionType = String(log?.action_type || "").trim();
  if (actionType === "helper_inventory_sync") {
    return `同步 ${Number(log?.result_payload?.item_count || 0)} 个功法条目`;
  }
  if (actionType === "helper_snapshot_create") {
    return `快照：${log?.action_payload?.snapshot_name || log?.result_payload?.snapshot_id || "-"}`;
  }
  if (actionType === "helper_binding_upsert" || actionType === "helper_binding_remove") {
    return `${log?.action_payload?.game_role_name || "-"} / ${log?.action_payload?.game_server || "-"}`;
  }
  if (actionType === "helper_game_feature") {
    return log?.result_payload?.message || log?.action_payload?.feature || "helper 游戏脚本";
  }
  return fallbackText;
}

function buildHelperRestoreResultMarkup(ctx, log) {
  if (!log) {
    return '<div class="stack-item">还没有执行过一键还原。</div>';
  }
  const resultPayload = log?.result_payload || {};
  const restoreCounts = resultPayload?.restore_counts || {};
  const changedBits = [
    restoreCounts?.attachment_transfers ? `洗练归属 ${restoreCounts.attachment_transfers} 套` : "",
    restoreCounts?.hero_adds || restoreCounts?.hero_moves || restoreCounts?.hero_removes
      ? `武将 ${Number(restoreCounts?.hero_adds || 0) + Number(restoreCounts?.hero_moves || 0) + Number(restoreCounts?.hero_removes || 0)} 名`
      : "",
    restoreCounts?.team_attempts > 1 ? `武将重试 ${restoreCounts.team_attempts} 轮` : "",
    restoreCounts?.hero_verify_mismatches ? `武将待确认 ${restoreCounts.hero_verify_mismatches} 处` : "",
    restoreCounts?.artifact_loads || restoreCounts?.artifact_unloads
      ? `鱼灵 ${Number(restoreCounts?.artifact_loads || 0) + Number(restoreCounts?.artifact_unloads || 0)} 次`
      : "",
    restoreCounts?.pearl_skill_changes ? `鱼珠 ${restoreCounts.pearl_skill_changes} 处` : "",
    restoreCounts?.legion_steps || restoreCounts?.legion_resets
      ? `科技 ${Number(restoreCounts?.legion_steps || 0) + Number(restoreCounts?.legion_resets || 0)} 步`
      : "",
    restoreCounts?.legion_attempts > 1 ? `科技重试 ${restoreCounts.legion_attempts} 轮` : "",
    restoreCounts?.legion_verify_mismatches ? `科技待确认 ${restoreCounts.legion_verify_mismatches} 项` : "",
    restoreCounts?.weapon_changes ? `玩具 ${restoreCounts.weapon_changes} 次` : "",
  ].filter(Boolean);
  const warnings = Array.isArray(resultPayload?.warnings) ? resultPayload.warnings : [];
  const resultCards = [
    { label: "恢复目标", value: log?.action_payload?.snapshot_name || "阵容还原" },
    {
      label: "当前落点",
      value: `${resultPayload?.role_name || "-"} / ${resultPayload?.use_team_id ? `${resultPayload.use_team_id} 号阵容` : "目标阵容"}`,
    },
    {
      label: "本次动作",
      value: changedBits.length ? changedBits.slice(0, 3).join(" · ") : "没有明显变更",
    },
    {
      label: "待确认项",
      value: warnings.length ? `${warnings.length} 条` : "无",
      accent: warnings.length ? "warning" : "success",
    },
  ]
    .map(
      (item) => `
        <article class="helper-restore-stat ${item.accent || ""}">
          <div class="helper-restore-stat-label">${ctx.escapeHtml(item.label)}</div>
          <div class="helper-restore-stat-value">${ctx.escapeHtml(item.value)}</div>
        </article>
      `
    )
    .join("");
  return `
    <div class="helper-restore-result-card ${ctx.escapeHtml(log?.result_status || "ok")}">
      <div class="helper-restore-result-head">
        <div>
          <div class="helper-snapshot-kicker">最近一次还原</div>
          <strong class="helper-snapshot-title">${ctx.escapeHtml(log?.action_payload?.snapshot_name || "阵容还原")}</strong>
        </div>
        <div class="helper-snapshot-time">
          <div>${ctx.escapeHtml(formatRelativeActionTime(log?.created_at, ctx.formatDate))}</div>
          <div>${ctx.escapeHtml(ctx.formatDate(log?.created_at))}</div>
        </div>
      </div>
      <div class="helper-snapshot-summary">已恢复到 ${ctx.escapeHtml(resultPayload?.role_name || "-")} / ${ctx.escapeHtml(resultPayload?.server || "-")} / ${ctx.escapeHtml(resultPayload?.use_team_id ? `${resultPayload.use_team_id}号阵容` : "目标阵容")}</div>
      <div class="helper-restore-stat-grid">${resultCards}</div>
      <div class="helper-hero-meta helper-hero-meta-soft">
        ${
          changedBits.length
            ? changedBits.map((item) => `<span class="helper-chip">${ctx.escapeHtml(item)}</span>`).join("")
            : '<span class="helper-chip">本次没有检测到明显变更</span>'
        }
      </div>
      <div class="helper-status-meta helper-restore-message">${ctx.escapeHtml(resultPayload?.message || "阵容还原已执行。")}</div>
      ${
        warnings.length
          ? `<div class="helper-restore-warning-list">${warnings
              .map((item) => `<div class="helper-restore-warning-item">${ctx.escapeHtml(item)}</div>`)
              .join("")}</div>`
          : '<div class="helper-status-meta">仅记录未处理项：无</div>'
      }
    </div>
  `;
}

export function renderHelperRestoreResultPanel(ctx) {
  if (!ctx.helperRestoreResultCurrent) return;
  const latestRestoreLog = (ctx.currentHelperActionLogs || []).find(
    (item) => String(item?.action_type || "").trim() === "helper_team_restore"
  );
  ctx.helperRestoreResultCurrent.innerHTML = buildHelperRestoreResultMarkup(
    ctx,
    latestRestoreLog
  );
}

export function renderHelperTeamSwitchPanel(ctx) {
  const activeBinding = ctx.getActiveHelperBinding();
  const latestTeamId = getLatestHelperTeamId(ctx);
  const latestAction = Array.isArray(ctx.currentHelperActionLogs)
    ? ctx.currentHelperActionLogs[0]
    : null;
  const canReadLogs = ctx.hasHelperCapability?.(HELPER_CAPABILITY.LOGS_READ) === true;

  if (ctx.helperTeamSwitchCurrent) {
    ctx.helperTeamSwitchCurrent.classList.toggle(
      "hidden",
      !ctx.helperConfig?.features?.team_switch && !ctx.helperConfig?.features?.team_restore
    );
    if (!activeBinding) {
      ctx.helperTeamSwitchCurrent.innerHTML =
        '<div class="stack-item">请先完成 helper 角色绑定，再切换预设阵容。</div>';
    } else {
      ctx.helperTeamSwitchCurrent.innerHTML = `
        <div class="helper-snapshot-item">
          <div class="stack-item"><strong>当前绑定：</strong>${ctx.escapeHtml(activeBinding.game_role_name || "-")} / ${ctx.escapeHtml(activeBinding.game_server || "-")}</div>
          <div class="stack-item">已知当前阵容：${ctx.escapeHtml(latestTeamId > 0 ? `阵容 ${latestTeamId}` : "暂未识别")}</div>
          <div class="stack-item">${ctx.escapeHtml(latestAction ? "最近一次执行已记录" : "还没有执行记录")}</div>
        </div>
      `;
    }
  }

  if (ctx.helperTeamSwitchControls) {
    ctx.helperTeamSwitchControls.classList.toggle("hidden", !ctx.helperConfig?.features?.team_switch);
    ctx.helperTeamSwitchControls.querySelectorAll("[data-helper-team-id]").forEach((button) => {
      const teamId = Number(button.getAttribute("data-helper-team-id") || 0);
      button.classList.toggle("active", latestTeamId > 0 && teamId === latestTeamId);
      button.toggleAttribute("disabled", !activeBinding || !ctx.helperConfig?.features?.team_switch);
    });
  }

  if (ctx.helperTeamSwitchLog) {
    ctx.helperTeamSwitchLog.classList.toggle("hidden", !canReadLogs);
    const logs = Array.isArray(ctx.currentHelperActionLogs) ? ctx.currentHelperActionLogs : [];
    if (!logs.length) {
      ctx.helperTeamSwitchLog.innerHTML = '<div class="stack-item">执行记录会显示在这里。</div>';
      ctx.renderHelperRestoreResultPanel();
      return;
    }
    ctx.helperTeamSwitchLog.innerHTML = logs
      .slice(0, 6)
      .map((log) => {
        const actionType = String(log?.action_type || "").trim();
        const requestedTeamId = Number(log?.action_payload?.team_id || 0);
        const resultTeamId = Number(log?.result_payload?.use_team_id || requestedTeamId || 0);
        const roleText = [log?.result_payload?.role_name, log?.result_payload?.server]
          .filter(Boolean)
          .join(" / ");
        const restoreCounts = log?.result_payload?.restore_counts || {};
        const restoreBits = [
          restoreCounts?.attachment_transfers ? `归属 ${restoreCounts.attachment_transfers}` : "",
          restoreCounts?.hero_adds || restoreCounts?.hero_moves || restoreCounts?.hero_removes
            ? `站位 ${Number(restoreCounts?.hero_adds || 0) + Number(restoreCounts?.hero_moves || 0) + Number(restoreCounts?.hero_removes || 0)}`
            : "",
          restoreCounts?.hero_level_steps || restoreCounts?.hero_rebirths || restoreCounts?.hero_order_steps
            ? `等级 ${Number(restoreCounts?.hero_level_steps || 0) + Number(restoreCounts?.hero_rebirths || 0) + Number(restoreCounts?.hero_order_steps || 0)}`
            : "",
          restoreCounts?.artifact_loads || restoreCounts?.artifact_unloads
            ? `鱼灵 ${Number(restoreCounts?.artifact_loads || 0) + Number(restoreCounts?.artifact_unloads || 0)}`
            : "",
          restoreCounts?.pearl_skill_changes ? `鱼珠 ${restoreCounts.pearl_skill_changes}` : "",
          restoreCounts?.legion_steps || restoreCounts?.legion_resets
            ? `科技 ${Number(restoreCounts?.legion_steps || 0) + Number(restoreCounts?.legion_resets || 0)}`
            : "",
          restoreCounts?.weapon_changes ? `玩具 ${restoreCounts.weapon_changes}` : "",
        ]
          .filter(Boolean)
          .join(" / ");
        const fallbackDetail = `请求阵容 ${requestedTeamId || "-"} / 当前阵容 ${resultTeamId || "-"}`;
        const title = formatHelperActionLogTitle(log);
        const detail = formatHelperActionLogDetail(log, fallbackDetail);
        return `
          <div class="helper-snapshot-item">
            <div class="stack-item"><strong>${ctx.escapeHtml(title)}</strong></div>
            <div class="stack-item">角色：${ctx.escapeHtml(roleText || "-")}</div>
            ${
              actionType === "helper_team_restore"
                ? `<div class="stack-item">目标快照：${ctx.escapeHtml(log?.action_payload?.snapshot_name || log?.action_payload?.snapshot_id || "-")} / 阵容 ${ctx.escapeHtml(resultTeamId || log?.action_payload?.team_id || "-")}</div>`
                : ""
            }
            ${
              actionType === "helper_team_restore" && restoreBits
                ? `<div class="stack-item">执行统计：${ctx.escapeHtml(restoreBits)}</div>`
                : ""
            }
            <div class="stack-item">时间：${ctx.escapeHtml(ctx.formatDate(log.created_at))}</div>
            <div class="stack-item">说明：${ctx.escapeHtml(log?.result_payload?.message || detail || "-")}</div>
          </div>
        `;
      })
      .join("");
  }
  ctx.renderHelperRestoreResultPanel();
}
