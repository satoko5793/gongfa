function hasSnapshotExactLegionResearch(ctx, snapshot) {
  const role = ctx.getSnapshotRoleObject(snapshot);
  const legionResearch =
    role?.legionResearch && typeof role.legionResearch === "object" ? role.legionResearch : {};
  return Object.keys(legionResearch).length > 0;
}

function hasSnapshotRestoreFlags(snapshot) {
  const restoreFlags = snapshot?.summary?.restore_flags;
  return Boolean(restoreFlags && typeof restoreFlags === "object");
}

function getSnapshotRestoreCapabilities(ctx, snapshot) {
  const rawHeroes = ctx.getSnapshotRawHeroes(snapshot);
  const summaryFlags = snapshot?.summary?.restore_flags || {};
  const weaponInfo = ctx.getSnapshotWeaponInfo(snapshot);
  const techCount = ctx.getSnapshotLegionResearchCount(snapshot);
  const attachmentOwnershipCount = getSnapshotAttachmentOwnershipCount(ctx, snapshot);
  const hasHeroes = rawHeroes.length > 0;
  const hasLevels =
    Boolean(summaryFlags.hero_levels) || rawHeroes.some((hero) => Number(hero?.level || 0) > 0);
  const hasAttachmentOwnership =
    Boolean(summaryFlags.attachment_ownership) || attachmentOwnershipCount > 0;
  const hasArtifacts =
    Boolean(summaryFlags.artifacts) ||
    rawHeroes.some((hero) => Boolean(hero?.artifact_id || hero?.fish_name));
  const hasPearlSkills =
    Boolean(summaryFlags.pearl_skills) ||
    rawHeroes.some((hero) => Boolean(hero?.pearl_skill_name || hero?.skillId));
  const hasQuench =
    Boolean(summaryFlags.equipment_quench) ||
    rawHeroes.some((hero) =>
      Array.isArray(hero?.equipment)
        ? hero.equipment.some((part) => Array.isArray(part?.slots) && part.slots.length > 0)
        : false
    );
  const hasResearch =
    Boolean(summaryFlags.legion_research) && hasSnapshotExactLegionResearch(ctx, snapshot);
  const techSummaryOnly = techCount > 0 && !hasSnapshotExactLegionResearch(ctx, snapshot);
  const hasWeapon = Boolean(summaryFlags.weapon) || Boolean(weaponInfo);

  return [
    {
      key: "heroes",
      label: "武将站位",
      status: hasHeroes ? "ready" : "missing",
      note: hasHeroes ? "helper 已有上下阵、换位和阵容槽切换编排" : "当前快照缺少可用武将数据",
    },
    {
      key: "hero_levels",
      label: "武将等级",
      status: hasLevels ? "ready" : "missing",
      note: hasLevels ? "helper 已有升级、进阶、重生回放逻辑" : "当前快照没有可靠等级数据",
    },
    {
      key: "attachment_ownership",
      label: "洗练归属",
      status: hasAttachmentOwnership ? "ready" : "missing",
      note: hasAttachmentOwnership
        ? `当前快照记录了 ${attachmentOwnershipCount} 个洗练归属标识，helper 会先把对应套装换回目标武将，再继续站位和等级恢复`
        : "当前快照没有洗练归属标识，无法可靠预演“这套洗练该跟谁走”",
    },
    {
      key: "artifacts",
      label: "鱼灵佩戴",
      status: hasArtifacts ? "ready" : "missing",
      note: hasArtifacts ? "helper 已有鱼灵装卸逻辑" : "当前快照没有鱼灵配置",
    },
    {
      key: "pearl_skills",
      label: "鱼珠技能",
      status: hasPearlSkills ? "ready" : "missing",
      note: hasPearlSkills ? "helper 已有替换、交换、卸下技能逻辑" : "当前快照没有鱼珠技能配置",
    },
    {
      key: "legion_research",
      label: "俱乐部科技",
      status: hasResearch ? "ready" : techSummaryOnly ? "recorded" : "missing",
      note: hasResearch
        ? `当前快照记录了 ${techCount} 项科技`
        : techSummaryOnly
          ? `摘要里显示有 ${techCount} 项科技，但这份快照缺少原始科技等级，请重新保存一次阵容`
          : "当前快照没有科技数据",
    },
    {
      key: "weapon",
      label: "主玩具",
      status: hasWeapon ? "ready" : "missing",
      note: hasWeapon ? `当前快照记录了 ${weaponInfo?.name || "主玩具"}` : "当前快照没有主玩具数据",
    },
    {
      key: "equipment_quench",
      label: "装备洗练",
      status: hasQuench ? "recorded" : "missing",
      note: hasQuench ? "已记录孔位与属性，helper 有独立淬炼工具，商城暂未接自动恢复" : "当前快照没有洗练孔位数据",
    },
  ];
}

function normalizePreviewHeroMap(ctx, snapshot) {
  const heroes = ctx.getSnapshotRawHeroes(snapshot);
  const byId = new Map();
  const bySlot = new Map();
  const byAttachment = new Map();
  heroes.forEach((hero) => {
    const heroId = Number(hero?.hero_id || 0);
    const slot = Number(hero?.slot ?? 0);
    const attachmentUid = ctx.normalizeHelperAttachmentUid(hero?.attachment_uid);
    if (heroId > 0) byId.set(heroId, hero);
    bySlot.set(slot, hero);
    if (attachmentUid) byAttachment.set(attachmentUid, hero);
  });
  return { heroes, byId, bySlot, byAttachment };
}

function compareLegionResearch(ctx, targetSnapshot, liveSnapshot) {
  const targetRole = ctx.getSnapshotRoleObject(targetSnapshot);
  const liveRole = ctx.getSnapshotRoleObject(liveSnapshot);
  const targetResearch =
    targetRole?.legionResearch && typeof targetRole.legionResearch === "object"
      ? targetRole.legionResearch
      : {};
  const liveResearch =
    liveRole?.legionResearch && typeof liveRole.legionResearch === "object"
      ? liveRole.legionResearch
      : {};
  const changedIds = new Set(
    [...Object.keys(targetResearch), ...Object.keys(liveResearch)].filter(
      (key) => Number(targetResearch[key] || 0) !== Number(liveResearch[key] || 0)
    )
  );
  return {
    targetCount: Object.keys(targetResearch).length,
    liveCount: Object.keys(liveResearch).length,
    changedCount: changedIds.size,
  };
}

function getSnapshotAttachmentOwnershipMap(ctx, snapshot) {
  const currentTeamById = new Map();
  ctx.getSnapshotRawHeroes(snapshot).forEach((hero) => {
    const heroId = Number(hero?.hero_id || 0);
    if (heroId > 0) currentTeamById.set(heroId, hero);
  });

  const byAttachment = new Map();
  Object.entries(ctx.getSnapshotRoleHeroes(snapshot)).forEach(([key, hero]) => {
    const heroId = Number(hero?.heroId || hero?.id || key || 0);
    const attachmentUid = ctx.normalizeHelperAttachmentUid(hero?.attachmentUid);
    if (!heroId || !attachmentUid) return;
    const teamHero = currentTeamById.get(heroId);
    byAttachment.set(attachmentUid, {
      attachment_uid: attachmentUid,
      hero_id: heroId,
      hero_name:
        String(teamHero?.hero_name || hero?.heroName || hero?.name || "").trim() ||
        `武将${heroId}`,
      slot: teamHero ? Number(teamHero?.slot ?? 0) : null,
      in_team: Boolean(teamHero),
    });
  });

  return {
    byAttachment,
  };
}

export function getSnapshotAttachmentOwnershipCount(ctx, snapshot) {
  return ctx.getSnapshotRawHeroes(snapshot).filter((hero) =>
    Boolean(ctx.normalizeHelperAttachmentUid(hero?.attachment_uid))
  ).length;
}

export function getSnapshotSafeRestoreBlockReason(ctx, snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return "未找到目标快照，请先刷新阵容快照列表。";
  }
  if (!hasSnapshotRestoreFlags(snapshot)) {
    return "这份快照是旧版结构，缺少安全恢复需要的标记，请先重新读取一份新快照。";
  }
  const rawHeroes = ctx.getSnapshotRawHeroes(snapshot);
  if (!rawHeroes.length) {
    return "这份快照没有可恢复的武将数据，请重新读取一份新快照。";
  }
  if (!rawHeroes.some((hero) => Boolean(ctx.normalizeHelperAttachmentUid(hero?.attachment_uid)))) {
    return "这份快照没有记录洗练归属，无法安全恢复到正确武将，请重新读取一份新快照。";
  }
  const summaryTechCount = Number(snapshot?.summary?.legion_research_count || 0);
  if (summaryTechCount > 0 && !hasSnapshotExactLegionResearch(ctx, snapshot)) {
    return "这份快照只记录了科技摘要，没有保存原始科技等级，暂时无法精确恢复科技，请先重新保存当前阵容。";
  }
  return "";
}

export function buildHelperRestorePlanFromSnapshot(ctx, snapshot) {
  const summary = snapshot?.summary || {};
  const teamInfo = ctx.getSnapshotCurrentTeamInfo(snapshot);
  const pearlMap = ctx.getSnapshotPearlMap(snapshot);
  const role = ctx.getSnapshotRoleObject(snapshot);
  const weaponInfo = ctx.getSnapshotWeaponInfo(snapshot);
  const heroes = ctx
    .getSnapshotRawHeroes(snapshot)
    .map((hero) => {
      const slot = Number(hero?.slot ?? 0);
      const teamHero = teamInfo?.[slot] || teamInfo?.[String(slot)] || {};
      const pearlId = Number(teamHero?.pearlId || 0) || null;
      const pearlData = pearlId ? pearlMap?.[pearlId] || {} : {};
      return {
        position: slot,
        hero_id: Number(hero?.hero_id || 0),
        hero_name: String(hero?.hero_name || "").trim(),
        level: Number(hero?.level || 0) || 0,
        attachment_uid: ctx.normalizeHelperAttachmentUid(hero?.attachment_uid),
        pearl_id: pearlId,
        skill_id: Number(pearlData?.skillId || 0) || null,
      };
    })
    .filter((hero) => Number(hero.hero_id || 0) > 0);

  return {
    snapshot_id: Number(snapshot?.id || 0) || null,
    snapshot_name: ctx.buildHelperSnapshotName(snapshot),
    team_id: Number(summary?.use_team_id || 0) || 0,
    role_name: String(summary?.role_name || "").trim(),
    server: String(summary?.server || "").trim(),
    weapon_id: Number(weaponInfo?.id || 0) || null,
    legion_research:
      role?.legionResearch && typeof role.legionResearch === "object" ? role.legionResearch : {},
    heroes,
  };
}

export function buildHelperSnapshotRestoreSummaryText(ctx, snapshot) {
  const capabilities = getSnapshotRestoreCapabilities(ctx, snapshot);
  const readyLabels = capabilities
    .filter((item) => item.status === "ready")
    .map((item) => item.label);
  const recordedLabels = capabilities
    .filter((item) => item.status === "recorded")
    .map((item) => `${item.label}已记录`);
  return [...readyLabels, ...recordedLabels].join("、") || "仅完成基础记录";
}

export function buildHelperSnapshotCapabilityMarkup(ctx, snapshot) {
  return getSnapshotRestoreCapabilities(ctx, snapshot)
    .map((item) => {
      const statusLabel =
        item.status === "ready" ? "可恢复" : item.status === "recorded" ? "已记录" : "缺数据";
      return `
        <article class="helper-capability-card ${item.status}">
          <div class="helper-capability-head">
            <strong>${ctx.escapeHtml(item.label)}</strong>
            <span class="helper-capability-state">${ctx.escapeHtml(statusLabel)}</span>
          </div>
          <div class="helper-capability-note">${ctx.escapeHtml(item.note)}</div>
        </article>
      `;
    })
    .join("");
}

export function buildHelperRestorePreview(ctx, targetSnapshot, liveSnapshot) {
  const targetSummary = targetSnapshot?.summary || {};
  const liveSummary = liveSnapshot?.summary || {};
  const target = normalizePreviewHeroMap(ctx, targetSnapshot);
  const live = normalizePreviewHeroMap(ctx, liveSnapshot);
  const liveAttachmentMap = getSnapshotAttachmentOwnershipMap(ctx, liveSnapshot);
  const steps = [];
  const warnings = [];
  const safeCounts = {
    hero_slots: 0,
    hero_levels: 0,
    attachment_transfers: 0,
    artifacts: 0,
    pearl_skills: 0,
    weapon: 0,
    legion_research: 0,
  };
  let recordedOnlyCount = 0;

  if (Number(targetSummary?.use_team_id || 0) !== Number(liveSummary?.use_team_id || 0)) {
    steps.push({
      type: "safe",
      label: "阵容槽位",
      description: `当前识别为阵容 ${liveSummary?.use_team_id || "-"}，目标快照记录的是阵容 ${targetSummary?.use_team_id || "-"}`,
    });
    safeCounts.hero_slots += 1;
  }

  live.heroes.forEach((hero) => {
    if (!target.byId.has(Number(hero?.hero_id || 0))) {
      steps.push({
        type: "safe",
        label: "下阵武将",
        description: `当前阵容里多出 ${hero?.hero_name || `武将${hero?.hero_id || "-"}`}，正式恢复时会先将其移出目标阵容。`,
      });
      safeCounts.hero_slots += 1;
    }
  });

  target.heroes.forEach((targetHero) => {
    const heroId = Number(targetHero?.hero_id || 0);
    const targetSlot = Number(targetHero?.slot ?? 0);
    const targetAttachmentUid = ctx.normalizeHelperAttachmentUid(targetHero?.attachment_uid);
    const currentHero = live.byId.get(heroId);
    const currentSlotHero = live.bySlot.get(targetSlot);
    const currentAttachmentHolder = targetAttachmentUid
      ? liveAttachmentMap.byAttachment.get(targetAttachmentUid)
      : null;

    if (targetAttachmentUid && currentAttachmentHolder && currentAttachmentHolder.hero_id !== heroId) {
      const holderLocation = currentAttachmentHolder.in_team
        ? `${currentAttachmentHolder.hero_name}（当前阵容位置 ${ctx.formatHelperBattleSlot(currentAttachmentHolder.slot)}）`
        : `${currentAttachmentHolder.hero_name}（当前不在上阵位）`;
      steps.push({
        type: "ownership",
        label: "迁移洗练套归属",
        description: `${targetHero?.hero_name || `武将${heroId}`} 目标绑定的是洗练归属 #${targetAttachmentUid}，这套当前在 ${holderLocation} 身上。真实恢复时 helper 会先通过换将/临时上阵把这套洗练归回 ${targetHero?.hero_name || `武将${heroId}`}，再继续站位和等级操作。`,
      });
      safeCounts.attachment_transfers += 1;
    } else if (targetAttachmentUid && !currentAttachmentHolder) {
      recordedOnlyCount += 1;
      warnings.push(
        `${targetHero?.hero_name || `武将${heroId}`} 目标需要洗练归属 #${targetAttachmentUid}，但当前角色列表里没有找到持有者，正式恢复时可能无法把对应洗练套归回。`
      );
    }

    if (!currentHero) {
      steps.push({
        type: "safe",
        label: "上阵武将",
        description: `需要把 ${targetHero?.hero_name || `武将${heroId}`} 上阵到位置 ${ctx.formatHelperBattleSlot(targetSlot)}。`,
      });
      safeCounts.hero_slots += 1;
    } else if (Number(currentHero?.slot ?? 0) !== targetSlot) {
      steps.push({
        type: "safe",
        label: "调整站位",
        description: `${targetHero?.hero_name || `武将${heroId}`} 当前在位置 ${ctx.formatHelperBattleSlot(currentHero?.slot)}，目标位置是 ${ctx.formatHelperBattleSlot(targetSlot)}。`,
      });
      safeCounts.hero_slots += 1;
    } else if (currentSlotHero && Number(currentSlotHero?.hero_id || 0) !== heroId) {
      steps.push({
        type: "safe",
        label: "修正站位",
        description: `位置 ${ctx.formatHelperBattleSlot(targetSlot)} 当前是 ${currentSlotHero?.hero_name || `武将${currentSlotHero?.hero_id || "-"}`}，目标应为 ${targetHero?.hero_name || `武将${heroId}`}。`,
      });
      safeCounts.hero_slots += 1;
    }

    const targetLevel = Number(targetHero?.level || 0);
    const liveLevel = Number(currentHero?.level || 0);
    if (targetLevel > 0 && targetLevel !== liveLevel) {
      steps.push({
        type: "safe",
        label: "调整等级",
        description:
          targetLevel > liveLevel
            ? `${targetHero?.hero_name || `武将${heroId}`} 需要从 Lv.${liveLevel || 0} 提升到 Lv.${targetLevel}。`
            : `${targetHero?.hero_name || `武将${heroId}`} 当前 Lv.${liveLevel || 0}，目标快照是 Lv.${targetLevel}，helper 会走重生后再升回的逻辑。`,
      });
      safeCounts.hero_levels += 1;
    }

    const targetFish = String(targetHero?.fish_name || "").trim();
    const liveFish = String(currentHero?.fish_name || "").trim();
    if ((targetFish || liveFish) && targetFish !== liveFish) {
      steps.push({
        type: "safe",
        label: "切换鱼灵",
        description: `${targetHero?.hero_name || `武将${heroId}`} 当前鱼灵是 ${liveFish || "未佩戴"}，目标是 ${targetFish || "未佩戴"}。`,
      });
      safeCounts.artifacts += 1;
    }

    const targetSkill = String(targetHero?.pearl_skill_name || "").trim();
    const liveSkill = String(currentHero?.pearl_skill_name || "").trim();
    if ((targetSkill || liveSkill) && targetSkill !== liveSkill) {
      steps.push({
        type: "safe",
        label: "切换鱼珠技能",
        description: `${targetHero?.hero_name || `武将${heroId}`} 当前鱼珠技能是 ${liveSkill || "未装配"}，目标是 ${targetSkill || "未装配"}。`,
      });
      safeCounts.pearl_skills += 1;
    }

    const targetEquip = JSON.stringify(Array.isArray(targetHero?.equipment) ? targetHero.equipment : []);
    const liveEquip = JSON.stringify(Array.isArray(currentHero?.equipment) ? currentHero.equipment : []);
    if (targetEquip !== liveEquip && targetEquip !== "[]") {
      if (!targetAttachmentUid) {
        recordedOnlyCount += 1;
        warnings.push(
          `${targetHero?.hero_name || `武将${heroId}`} 记录了洗练孔位，但没有洗练归属标识。商城现在无法判断这套洗练该跟着谁走，只能提示人工确认。`
        );
      } else if (!currentAttachmentHolder) {
        recordedOnlyCount += 1;
        warnings.push(
          `${targetHero?.hero_name || `武将${heroId}`} 的洗练孔位已记录，但当前没有找到归属 #${targetAttachmentUid} 的持有者，无法确认是否还能按原套装恢复。`
        );
      } else if (currentAttachmentHolder.hero_id === heroId) {
        recordedOnlyCount += 1;
        warnings.push(
          `${targetHero?.hero_name || `武将${heroId}`} 当前已经持有洗练归属 #${targetAttachmentUid}，但孔位属性和快照仍有差异。这通常表示原套装内容后来被改过，商城暂时不能把洗练数值回滚到快照状态。`
        );
      }
    }
  });

  const targetWeapon = ctx.getSnapshotWeaponInfo(targetSnapshot);
  const liveWeapon = ctx.getSnapshotWeaponInfo(liveSnapshot);
  if (
    (targetWeapon?.id || targetWeapon?.name) &&
    (targetWeapon?.id !== liveWeapon?.id || targetWeapon?.name !== liveWeapon?.name)
  ) {
    steps.push({
      type: "safe",
      label: "切换主玩具",
      description: `当前主玩具是 ${liveWeapon?.name || "未识别"}，目标快照是 ${targetWeapon?.name || "未识别"}。`,
    });
    safeCounts.weapon += 1;
  }

  const researchDiff = compareLegionResearch(ctx, targetSnapshot, liveSnapshot);
  if (researchDiff.changedCount > 0) {
    steps.push({
      type: "safe",
      label: "同步俱乐部科技",
      description: `检测到 ${researchDiff.changedCount} 项科技等级差异，helper 已有“重置后重建”的同步逻辑。`,
    });
    safeCounts.legion_research = researchDiff.changedCount;
  }

  return {
    target_snapshot_id: Number(targetSnapshot?.id || 0),
    target_snapshot_name: ctx.buildHelperSnapshotName(targetSnapshot),
    target_summary: targetSummary,
    live_summary: liveSummary,
    safe_counts: safeCounts,
    safe_step_count: Object.values(safeCounts).reduce((sum, value) => sum + Number(value || 0), 0),
    recorded_only_count: recordedOnlyCount,
    steps,
    warnings: Array.from(new Set(warnings)),
  };
}

export function buildHelperFishSlotsMarkup(ctx, fishSlots) {
  if (!Array.isArray(fishSlots) || !fishSlots.length) {
    return '<div class="stack-item">鱼珠孔位：-</div>';
  }
  return `
    <div class="helper-inline-chip-row">
      ${fishSlots
        .map((slot) => {
          const colorMeta = ctx.getHelperSlotColorMeta(slot?.color_id || slot?.colorId || 0);
          const attrText = `${ctx.getHelperAttrName(slot?.attr_id || slot?.attrId || 0)}+${Number(slot?.attr_num || slot?.attrNum || 0)}`;
          return `<span class="helper-slot-chip ${ctx.escapeHtml(colorMeta.tone)}">${ctx.escapeHtml(colorMeta.label)} · ${ctx.escapeHtml(attrText)}</span>`;
        })
        .join("")}
    </div>
  `;
}

export function buildHelperEquipmentMarkup(ctx, equipment) {
  if (!Array.isArray(equipment) || !equipment.length) {
    return '<div class="stack-item">洗练：当前快照没有更细的装备孔位数据。</div>';
  }
  return equipment
    .map((part) => {
      const slots = Array.isArray(part?.slots) ? part.slots : [];
      const bonusParts = [];
      if (Number(part?.bonus_attack || 0) > 0) bonusParts.push(`攻+${Number(part.bonus_attack)}`);
      if (Number(part?.bonus_defense || 0) > 0) bonusParts.push(`防+${Number(part.bonus_defense)}`);
      if (Number(part?.bonus_hp || 0) > 0) bonusParts.push(`血+${Number(part.bonus_hp)}`);
      return `
        <div class="helper-equip-part">
          <div class="helper-equip-part-head">
            <strong>${ctx.escapeHtml(ctx.helperEquipmentPartNames[Number(part?.part_id || 0)] || `部位${Number(part?.part_id || 0)}`)}</strong>
            <span>淬炼 ${ctx.escapeHtml(Number(part?.quench_times || 0))} 次</span>
            <span>${ctx.escapeHtml(bonusParts.join(" / ") || "暂无额外加成")}</span>
          </div>
          <div class="helper-inline-chip-row">
            ${
              slots.length
                ? slots
                    .map((slot) => {
                      const colorMeta = ctx.getHelperSlotColorMeta(slot?.color_id || 0);
                      const attrText = `${ctx.getHelperAttrName(slot?.attr_id || 0)}+${Number(slot?.attr_num || 0)}`;
                      const lockText = slot?.is_locked ? " · 锁" : "";
                      return `<span class="helper-slot-chip ${ctx.escapeHtml(colorMeta.tone)}">${ctx.escapeHtml(colorMeta.label)} · ${ctx.escapeHtml(attrText + lockText)}</span>`;
                    })
                    .join("")
                : '<span class="helper-chip">暂无孔位</span>'
            }
          </div>
        </div>
      `;
    })
    .join("");
}

export function buildHelperFishSlotsSummary(ctx, fishSlots) {
  if (!Array.isArray(fishSlots) || !fishSlots.length) {
    return "鱼珠孔位未记录";
  }
  const colorCounts = new Map();
  fishSlots.forEach((slot) => {
    const colorMeta = ctx.getHelperSlotColorMeta(slot?.color_id || slot?.colorId || 0);
    const label = colorMeta.label || "其他";
    colorCounts.set(label, Number(colorCounts.get(label) || 0) + 1);
  });
  const topColors = Array.from(colorCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label]) => label)
    .join(" / ");
  return topColors || "鱼珠孔位未记录";
}

export function buildHelperEquipmentSummary(ctx, equipment) {
  if (!Array.isArray(equipment) || !equipment.length) {
    return "洗练细节未记录";
  }
  let totalQuench = 0;
  let totalSlots = 0;
  let lockedSlots = 0;
  equipment.forEach((part) => {
    totalQuench += Number(part?.quench_times || 0);
    const slots = Array.isArray(part?.slots) ? part.slots : [];
    totalSlots += slots.length;
    lockedSlots += slots.filter((slot) => Boolean(slot?.is_locked)).length;
  });
  const details = [`淬炼 ${totalQuench}`];
  if (totalSlots > 0) details.push(`孔位 ${totalSlots}`);
  if (lockedSlots > 0) details.push(`锁孔 ${lockedSlots}`);
  return details.join(" · ");
}
