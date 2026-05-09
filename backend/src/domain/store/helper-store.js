const { AUDIT_ACTIONS } = require("../audit-actions");
const { getStoreRuntime } = require("./core/runtime-context");

function sanitizeHelperBindingForPublic(binding) {
  if (!binding) return null;
  return {
    ...binding,
    helper_token: undefined,
    helper_ws_url: undefined,
    helper_import_method: undefined,
  };
}

function getHelperInventoryMergeKey(item) {
  return [
    Number(item?.legacy_id || 0),
    String(item?.display_name || "").trim(),
    Number(item?.attack_value || 0),
    Number(item?.hp_value || 0),
    String(item?.main_attr_text || "").trim(),
    String(item?.ext_attr_text || "").trim(),
    Number(item?.schedule_id || 0),
    Number(Boolean(item?.max)),
  ].join("::");
}

function sortHelperInventoryItems(list) {
  return [...(list || [])].sort((left, right) => {
    const seasonDiff = Number(Boolean(right?.is_current_season)) - Number(Boolean(left?.is_current_season));
    if (seasonDiff !== 0) return seasonDiff;
    const extDiff = Number(Boolean(right?.has_ext)) - Number(Boolean(left?.has_ext));
    if (extDiff !== 0) return extDiff;
    const scheduleDiff = Number(right?.schedule_id || 0) - Number(left?.schedule_id || 0);
    if (scheduleDiff !== 0) return scheduleDiff;
    const legacyDiff = Number(right?.legacy_id || 0) - Number(left?.legacy_id || 0);
    if (legacyDiff !== 0) return legacyDiff;
    const attackDiff = Number(right?.attack_value || 0) - Number(left?.attack_value || 0);
    if (attackDiff !== 0) return attackDiff;
    const hpDiff = Number(right?.hp_value || 0) - Number(left?.hp_value || 0);
    if (hpDiff !== 0) return hpDiff;
    return String(left?.display_name || "").localeCompare(String(right?.display_name || ""));
  });
}

function listHelperBindings(userId) {
  const { readData, clone } = getStoreRuntime();
  const data = readData();
  return clone(
    (data.helperBindings || [])
      .filter((item) => Number(item.user_id) === Number(userId))
      .map((item) => sanitizeHelperBindingForPublic(item))
      .sort((left, right) => Number(right.id || 0) - Number(left.id || 0))
  );
}

function resolveHelperBinding(userId, criteria = {}) {
  const { readData, clone } = getStoreRuntime();
  const data = readData();
  const normalizedBindTokenId = String(criteria.bind_token_id || "").trim();
  const normalizedRoleId = String(criteria.game_role_id || "").trim();
  const normalizedServer = String(criteria.game_server || "").trim();

  const bindings = (data.helperBindings || []).filter(
    (item) => Number(item.user_id) === Number(userId) && String(item.bind_status || "active") === "active"
  );

  let binding = null;
  if (normalizedBindTokenId) {
    binding = bindings.find((item) => String(item.bind_token_id || "").trim() === normalizedBindTokenId) || null;
  }
  if (!binding && normalizedRoleId) {
    binding =
      bindings.find(
        (item) =>
          String(item.game_role_id || "").trim() === normalizedRoleId &&
          (!normalizedServer || String(item.game_server || "").trim() === normalizedServer)
      ) || null;
  }
  return binding ? clone(binding) : null;
}

function listHelperSnapshots(userId) {
  const { readData, clone } = getStoreRuntime();
  const data = readData();
  return clone(
    (data.helperSnapshots || [])
      .filter((item) => Number(item.user_id) === Number(userId))
      .sort((left, right) => {
        const pinDiff = Number(Boolean(right?.is_pinned)) - Number(Boolean(left?.is_pinned));
        if (pinDiff !== 0) return pinDiff;
        return String(right.updated_at || right.created_at).localeCompare(
          String(left.updated_at || left.created_at)
        );
      })
  );
}

function listHelperInventories(userId) {
  const { readData, clone } = getStoreRuntime();
  const data = readData();
  const bindingsById = new Map(
    (data.helperBindings || [])
      .filter((item) => Number(item.user_id) === Number(userId))
      .map((item) => [Number(item.id), sanitizeHelperBindingForPublic(item)])
  );
  return clone(
    (data.helperInventories || [])
      .filter((item) => Number(item.user_id) === Number(userId))
      .map((item) => ({
        ...item,
        binding: item?.binding_id === null ? null : bindingsById.get(Number(item.binding_id)) || null,
        items: sortHelperInventoryItems(item?.items || []),
      }))
      .sort((left, right) =>
        String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at))
      )
  );
}

function listMergedHelperInventoryItems(userId) {
  const { readData, clone, buildCardSeasonMeta, getConfiguredCurrentSeasonScheduleId } = getStoreRuntime();
  const data = readData();
  const inventories = listHelperInventories(userId);
  const mergedMap = new Map();
  const currentScheduleId = getConfiguredCurrentSeasonScheduleId(data.rechargeConfig || {});

  inventories.forEach((inventory) => {
    const binding = inventory?.binding || null;
    const sourceRoleName =
      String(binding?.nickname || "").trim() ||
      String(binding?.game_role_name || inventory?.summary?.role_name || "").trim() ||
      "未命名炉子";
    const sourceServer = String(binding?.game_server || inventory?.summary?.server || "").trim() || "-";

    (inventory?.items || []).forEach((item) => {
      const key = getHelperInventoryMergeKey(item);
      const seasonMeta = buildCardSeasonMeta({
        scheduleId: item?.schedule_id,
        currentScheduleId: item?.current_schedule_id || currentScheduleId,
      });
      const existing = mergedMap.get(key);
      if (!existing) {
        mergedMap.set(key, {
          key,
          legacy_id: Number(item?.legacy_id || 0),
          display_name: String(item?.display_name || "").trim(),
          attack_value: Number(item?.attack_value || 0),
          hp_value: Number(item?.hp_value || 0),
          main_attr_text: String(item?.main_attr_text || "").trim(),
          ext_attr_text: String(item?.ext_attr_text || "").trim(),
          has_ext: Boolean(item?.has_ext),
          max: Boolean(item?.max),
          image_url: String(item?.image_url || "").trim(),
          ...seasonMeta,
          total_count: 1,
          source_roles: [
            {
              binding_id: inventory?.binding_id ?? null,
              role_name: sourceRoleName,
              server: sourceServer,
              count: 1,
            },
          ],
        });
        return;
      }

      existing.total_count += 1;
      const sourceRole = existing.source_roles.find(
        (role) =>
          Number(role?.binding_id || 0) === Number(inventory?.binding_id || 0) &&
          String(role?.role_name || "") === sourceRoleName &&
          String(role?.server || "") === sourceServer
      );
      if (sourceRole) sourceRole.count += 1;
      else {
        existing.source_roles.push({
          binding_id: inventory?.binding_id ?? null,
          role_name: sourceRoleName,
          server: sourceServer,
          count: 1,
        });
      }
    });
  });

  return clone(
    [...mergedMap.values()]
      .sort((left, right) => {
        const countDiff = Number(right?.total_count || 0) - Number(left?.total_count || 0);
        if (countDiff !== 0) return countDiff;
        const seasonDiff = Number(Boolean(right?.is_current_season)) - Number(Boolean(left?.is_current_season));
        if (seasonDiff !== 0) return seasonDiff;
        const extDiff = Number(Boolean(right?.has_ext)) - Number(Boolean(left?.has_ext));
        if (extDiff !== 0) return extDiff;
        const scheduleDiff = Number(right?.schedule_id || 0) - Number(left?.schedule_id || 0);
        if (scheduleDiff !== 0) return scheduleDiff;
        const legacyDiff = Number(right?.legacy_id || 0) - Number(left?.legacy_id || 0);
        if (legacyDiff !== 0) return legacyDiff;
        return String(left?.display_name || "").localeCompare(String(right?.display_name || ""));
      })
      .map((item) => ({
        ...item,
        source_roles: (item.source_roles || []).sort((left, right) => {
          const countDiff = Number(right?.count || 0) - Number(left?.count || 0);
          if (countDiff !== 0) return countDiff;
          return String(left?.role_name || "").localeCompare(String(right?.role_name || ""));
        }),
      }))
  );
}

function listHelperActionLogs(userId, { limit = 12 } = {}) {
  const { readData, clone } = getStoreRuntime();
  const data = readData();
  const normalizedLimit = Math.max(Math.min(Number(limit) || 12, 50), 1);
  return clone(
    (data.helperActionLogs || [])
      .filter((item) => Number(item.user_id) === Number(userId))
      .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
      .slice(0, normalizedLimit)
  );
}

function upsertHelperBinding(userId, payload) {
  const { readData, writeData, clone, now, nextId, addHelperActionLog } = getStoreRuntime();
  const data = readData();
  const timestamp = now();
  const normalizedRoleId = String(payload.game_role_id || "").trim();
  const normalizedServer = String(payload.game_server || "").trim();
  const normalizedRoleName = String(payload.game_role_name || "").trim();
  const normalizedBindTokenId = String(payload.bind_token_id || "").trim() || null;
  const normalizedNickname = String(payload.nickname || "").trim() || null;
  const normalizedHelperToken = String(payload.helper_token || "").trim() || null;
  const normalizedHelperWsUrl = String(payload.helper_ws_url || "").trim() || null;
  const normalizedHelperImportMethod = String(payload.helper_import_method || "").trim() || null;

  let binding = (data.helperBindings || []).find(
    (item) =>
      Number(item.user_id) === Number(userId) &&
      String(item.game_role_id || "") === normalizedRoleId &&
      String(item.game_server || "") === normalizedServer
  );

  if (!binding) {
    binding = {
      id: nextId(data.helperBindings || []),
      user_id: Number(userId),
      game_role_id: normalizedRoleId,
      game_server: normalizedServer,
      game_role_name: normalizedRoleName,
      bind_token_id: normalizedBindTokenId,
      nickname: normalizedNickname,
      helper_token: normalizedHelperToken,
      helper_ws_url: normalizedHelperWsUrl,
      helper_import_method: normalizedHelperImportMethod,
      bind_source: "helper_wx_scan",
      bind_status: "active",
      created_at: timestamp,
      updated_at: timestamp,
    };
    data.helperBindings.push(binding);
  } else {
    binding.game_role_name = normalizedRoleName;
    binding.bind_token_id = normalizedBindTokenId;
    binding.nickname = normalizedNickname;
    binding.helper_token = normalizedHelperToken || binding.helper_token || null;
    binding.helper_ws_url = normalizedHelperWsUrl || binding.helper_ws_url || null;
    binding.helper_import_method = normalizedHelperImportMethod || binding.helper_import_method || null;
    binding.bind_source = "helper_wx_scan";
    binding.bind_status = "active";
    binding.updated_at = timestamp;
  }

  addHelperActionLog(data, {
    userId,
    bindingId: binding.id,
    actionType: "helper_binding_upsert",
    actionPayload: {
      game_role_id: binding.game_role_id,
      game_server: binding.game_server,
      game_role_name: binding.game_role_name,
    },
  });

  writeData(data);
  return clone(binding);
}

function upsertHelperInventory(userId, payload) {
  const {
    readData,
    writeData,
    clone,
    now,
    nextId,
    buildCardSeasonMeta,
    getConfiguredCurrentSeasonScheduleId,
    addHelperActionLog,
  } = getStoreRuntime();
  const data = readData();
  const timestamp = now();
  const normalizedBindingId =
    payload?.binding_id === undefined || payload?.binding_id === null ? null : Number(payload.binding_id);
  const normalizedSummary =
    payload?.summary && typeof payload.summary === "object" && !Array.isArray(payload.summary)
      ? clone(payload.summary)
      : {};
  const normalizedItems = Array.isArray(payload?.items)
    ? payload.items.map((item) => ({
        ...buildCardSeasonMeta({
          scheduleId:
            item?.schedule_id ??
            item?.scheduleId ??
            item?.season_schedule_id ??
            item?.seasonScheduleId ??
            null,
          currentScheduleId:
            item?.current_schedule_id ??
            item?.currentScheduleId ??
            normalizedSummary?.current_schedule_id ??
            normalizedSummary?.currentScheduleId ??
            normalizedSummary?.role_schedule_id ??
            normalizedSummary?.roleScheduleId ??
            normalizedSummary?.schedule_id ??
            normalizedSummary?.scheduleId ??
            getConfiguredCurrentSeasonScheduleId(data.rechargeConfig || {}),
        }),
        row_key: String(item?.row_key || "").trim(),
        uid: String(item?.uid || "").trim(),
        legacy_id: Number(item?.legacy_id || 0),
        display_name: String(item?.display_name || "").trim(),
        attack_value: Number(item?.attack_value || 0),
        hp_value: Number(item?.hp_value || 0),
        main_attr_text: String(item?.main_attr_text || "").trim(),
        ext_attr_text: String(item?.ext_attr_text || "").trim(),
        has_ext: Boolean(item?.has_ext),
        is_locked: Boolean(item?.is_locked),
        max: Boolean(item?.max),
        image_url: String(item?.image_url || "").trim(),
      }))
    : [];

  let inventory = null;
  if (normalizedBindingId !== null) {
    inventory = (data.helperInventories || []).find(
      (item) => Number(item.user_id) === Number(userId) && Number(item.binding_id) === Number(normalizedBindingId)
    );
  }
  if (!inventory) {
    inventory = (data.helperInventories || []).find(
      (item) =>
        Number(item.user_id) === Number(userId) &&
        String(item?.summary?.role_id || "") === String(normalizedSummary?.role_id || "") &&
        String(item?.summary?.server || "") === String(normalizedSummary?.server || "")
    );
  }

  if (!inventory) {
    inventory = {
      id: nextId(data.helperInventories || []),
      user_id: Number(userId),
      binding_id: normalizedBindingId,
      source_type: String(payload?.source_type || "helper_bridge").trim() || "helper_bridge",
      summary: normalizedSummary,
      items: normalizedItems,
      created_at: timestamp,
      updated_at: timestamp,
    };
    data.helperInventories.unshift(inventory);
  } else {
    inventory.binding_id = normalizedBindingId;
    inventory.source_type = String(payload?.source_type || inventory.source_type || "helper_bridge").trim() || "helper_bridge";
    inventory.summary = normalizedSummary;
    inventory.items = normalizedItems;
    inventory.updated_at = timestamp;
  }

  addHelperActionLog(data, {
    userId,
    bindingId: normalizedBindingId,
    actionType: "helper_inventory_sync",
    actionPayload: {
      role_id: normalizedSummary?.role_id || "",
      server: normalizedSummary?.server || "",
      legacy_count: Number(normalizedSummary?.legacy_count || normalizedItems.length || 0),
      fragment_count: Number(normalizedSummary?.fragment_count || 0),
    },
    resultPayload: {
      inventory_id: inventory.id,
      item_count: normalizedItems.length,
    },
  });

  writeData(data);
  return clone({
    ...inventory,
    binding:
      normalizedBindingId === null
        ? null
        : sanitizeHelperBindingForPublic(
            (data.helperBindings || []).find((item) => Number(item.id) === Number(normalizedBindingId))
          ),
  });
}

function pruneHelperInventories(userId, keepInventoryIds = [], actorUserId = null) {
  const { readData, writeData, clone, addHelperActionLog, addAuditLog } = getStoreRuntime();
  const data = readData();
  const keepSet = new Set(
    (Array.isArray(keepInventoryIds) ? keepInventoryIds : [])
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0)
  );
  const removedInventories = [];

  data.helperInventories = (data.helperInventories || []).filter((inventory) => {
    if (Number(inventory?.user_id) !== Number(userId)) return true;
    if (keepSet.has(Number(inventory?.id))) return true;
    removedInventories.push(clone(inventory));
    return false;
  });

  if (removedInventories.length > 0) {
    addHelperActionLog(data, {
      userId,
      bindingId: null,
      actionType: AUDIT_ACTIONS.HELPER_INVENTORY_PRUNE,
      actionPayload: {
        keep_inventory_ids: Array.from(keepSet.values()),
      },
      resultPayload: {
        removed_inventory_ids: removedInventories.map((item) => Number(item.id)),
        removed_count: removedInventories.length,
      },
    });

    addAuditLog(data, {
      actorUserId,
      targetType: "helper_inventory",
      targetId: Number(userId),
      action: AUDIT_ACTIONS.HELPER_INVENTORY_PRUNE,
      detail: {
        user_id: Number(userId),
        keep_inventory_ids: Array.from(keepSet.values()),
        removed_inventory_ids: removedInventories.map((item) => Number(item.id)),
        removed_count: removedInventories.length,
      },
    });

    writeData(data);
  }

  return removedInventories;
}

function removeHelperBinding(userId, bindingId) {
  const { readData, writeData, clone, addHelperActionLog } = getStoreRuntime();
  const data = readData();
  const bindingIndex = (data.helperBindings || []).findIndex(
    (item) => Number(item.user_id) === Number(userId) && Number(item.id) === Number(bindingId)
  );
  if (bindingIndex === -1) return null;
  const [binding] = data.helperBindings.splice(bindingIndex, 1);
  addHelperActionLog(data, {
    userId,
    bindingId: binding.id,
    actionType: "helper_binding_remove",
    actionPayload: {
      game_role_id: binding.game_role_id,
      game_server: binding.game_server,
    },
  });
  writeData(data);
  return clone(binding);
}

function createHelperSnapshot(userId, payload) {
  const { readData, writeData, clone, now, nextId, getLineupSlotState, addHelperActionLog } =
    getStoreRuntime();
  const data = readData();
  const user = (data.users || []).find((item) => Number(item.id) === Number(userId));
  if (!user) {
    const err = new Error("user_not_found");
    err.statusCode = 404;
    throw err;
  }
  const userSnapshots = (data.helperSnapshots || []).filter((item) => Number(item.user_id) === Number(userId));
  const lineupState = getLineupSlotState(user, data.rechargeConfig || {}, data);
  if (userSnapshots.length >= lineupState.total_slots) {
    const err = new Error("helper_snapshot_limit_reached");
    err.statusCode = 400;
    err.details = [`每个账号最多保存 ${lineupState.total_slots} 套阵容，请先删除旧阵容。`];
    throw err;
  }
  const timestamp = now();
  const snapshot = {
    id: nextId(data.helperSnapshots || []),
    user_id: Number(userId),
    binding_id:
      payload?.binding_id === undefined || payload?.binding_id === null ? null : Number(payload.binding_id),
    source_type: String(payload?.source_type || "helper_bridge").trim() || "helper_bridge",
    snapshot_name:
      String(payload?.snapshot_name || "").trim() ||
      String(payload?.summary?.role_name || payload?.summary?.roleName || "阵容快照").trim() ||
      "阵容快照",
    is_pinned: false,
    summary:
      payload?.summary && typeof payload.summary === "object" && !Array.isArray(payload.summary)
        ? clone(payload.summary)
        : {},
    raw:
      payload?.raw && typeof payload.raw === "object" && !Array.isArray(payload.raw)
        ? clone(payload.raw)
        : {},
    created_at: timestamp,
    updated_at: timestamp,
  };

  data.helperSnapshots.unshift(snapshot);
  addHelperActionLog(data, {
    userId,
    bindingId: snapshot.binding_id,
    actionType: "helper_snapshot_create",
    actionPayload: {
      snapshot_name: snapshot.snapshot_name,
      source_type: snapshot.source_type,
    },
    resultPayload: {
      snapshot_id: snapshot.id,
    },
  });
  writeData(data);
  return clone(snapshot);
}

function getHelperSnapshotLimitForUser(userId) {
  const { readData, getLineupSlotConfig, getLineupSlotState } = getStoreRuntime();
  const data = readData();
  const user = (data.users || []).find((item) => Number(item.id) === Number(userId));
  if (!user) {
    return getLineupSlotConfig(data.rechargeConfig || {}).base_slots;
  }
  return getLineupSlotState(user, data.rechargeConfig || {}, data).total_slots;
}

function purchaseLineupSlot(userId, purchaseType) {
  const {
    readData,
    writeData,
    clone,
    now,
    ensureQuotaAccount,
    getLineupSlotConfig,
    ensureLineupSlotRecord,
    getLineupSlotState,
    applyQuotaChange,
    addAuditLog,
    withQuota,
  } = getStoreRuntime();
  const data = readData();
  const user = (data.users || []).find((item) => Number(item.id) === Number(userId));
  if (!user) {
    const err = new Error("user_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (user.status !== "active") {
    const err = new Error("user_disabled");
    err.statusCode = 403;
    throw err;
  }

  const normalizedType = String(purchaseType || "").trim();
  const slotConfig = getLineupSlotConfig(data.rechargeConfig || {});
  const slotRecord = ensureLineupSlotRecord(user);
  const lineupState = getLineupSlotState(user, data.rechargeConfig || {}, data);
  const timestamp = now();
  const account = ensureQuotaAccount(data, userId);

  let costQuota = 0;
  let detail = {};
  if (normalizedType === "permanent") {
    if (lineupState.permanent_purchases >= slotConfig.permanent_slot_max) {
      const err = new Error("lineup_slot_permanent_max_reached");
      err.statusCode = 400;
      throw err;
    }
    costQuota = slotConfig.permanent_slot_quota;
    slotRecord.permanent_purchases = lineupState.permanent_purchases + 1;
    detail = {
      purchase_type: "permanent",
      permanent_purchases: slotRecord.permanent_purchases,
      permanent_slot_max: slotConfig.permanent_slot_max,
      cost_quota: costQuota,
    };
  } else if (normalizedType === "seasonal") {
    costQuota = slotConfig.seasonal_slot_quota;
    const currentSeason = slotConfig.season_label;
    const currentCount = Math.max(Math.floor(Number(slotRecord.seasonal_slot_counts[currentSeason] || 0) || 0), 0);
    slotRecord.seasonal_slot_counts[currentSeason] = currentCount + 1;
    detail = {
      purchase_type: "seasonal",
      season_label: currentSeason,
      season_slots: slotRecord.seasonal_slot_counts[currentSeason],
      season_expires_at: slotConfig.season_expires_at,
      cost_quota: costQuota,
    };
  } else {
    const err = new Error("lineup_slot_purchase_type_invalid");
    err.statusCode = 400;
    throw err;
  }

  if (Number(account.balance || 0) < Number(costQuota || 0)) {
    const err = new Error("insufficient_quota");
    err.statusCode = 400;
    throw err;
  }

  applyQuotaChange(data, {
    userId,
    changeAmount: -costQuota,
    type:
      normalizedType === "permanent"
        ? "lineup_slot_permanent_purchase"
        : "lineup_slot_seasonal_purchase",
    remark:
      normalizedType === "permanent"
        ? `lineup_slot_permanent:${slotRecord.permanent_purchases}`
        : `lineup_slot_seasonal:${slotConfig.season_label}:${slotRecord.seasonal_slot_counts[slotConfig.season_label]}`,
  });
  user.updated_at = timestamp;

  addAuditLog(data, {
    actorUserId: Number(userId),
    targetType: "user",
    targetId: Number(userId),
    action: AUDIT_ACTIONS.LINEUP_SLOT_PURCHASE,
    detail,
  });

  writeData(data);
  return {
    user: withQuota(user, data),
    purchase: clone(detail),
  };
}

function removeHelperSnapshot(userId, snapshotId) {
  const { readData, writeData, clone, addHelperActionLog } = getStoreRuntime();
  const data = readData();
  const index = (data.helperSnapshots || []).findIndex(
    (item) => Number(item.user_id) === Number(userId) && Number(item.id) === Number(snapshotId)
  );
  if (index === -1) return null;
  const [snapshot] = data.helperSnapshots.splice(index, 1);
  addHelperActionLog(data, {
    userId,
    bindingId: snapshot.binding_id,
    actionType: "helper_snapshot_remove",
    actionPayload: {
      snapshot_id: snapshot.id,
      snapshot_name: snapshot.snapshot_name,
    },
  });
  writeData(data);
  return clone(snapshot);
}

function updateHelperSnapshot(userId, snapshotId, payload) {
  const { readData, writeData, clone, now, addHelperActionLog } = getStoreRuntime();
  const data = readData();
  const snapshot = (data.helperSnapshots || []).find(
    (item) => Number(item.user_id) === Number(userId) && Number(item.id) === Number(snapshotId)
  );
  if (!snapshot) return null;

  if (payload?.snapshot_name !== undefined) {
    const nextName = String(payload?.snapshot_name || "").trim();
    if (!nextName) return null;
    snapshot.snapshot_name = nextName;
  }
  if (payload?.is_pinned !== undefined) {
    const nextPinned = Boolean(payload.is_pinned);
    if (nextPinned) {
      (data.helperSnapshots || []).forEach((item) => {
        if (Number(item.user_id) === Number(userId)) {
          item.is_pinned = Number(item.id) === Number(snapshotId);
          if (item.is_pinned) item.updated_at = now();
        }
      });
    } else {
      snapshot.is_pinned = false;
    }
  }
  snapshot.updated_at = now();
  addHelperActionLog(data, {
    userId,
    bindingId: snapshot.binding_id,
    actionType: "helper_snapshot_update",
    actionPayload: {
      snapshot_id: snapshot.id,
      snapshot_name: snapshot.snapshot_name,
      is_pinned: Boolean(snapshot.is_pinned),
    },
  });
  writeData(data);
  return clone(snapshot);
}

function createHelperActionLog(userId, payload) {
  const { readData, writeData, clone, now, nextId } = getStoreRuntime();
  const data = readData();
  const normalizedBindingId =
    payload?.binding_id === undefined || payload?.binding_id === null ? null : Number(payload.binding_id);
  const log = {
    id: nextId(data.helperActionLogs || []),
    user_id: Number(userId),
    binding_id: normalizedBindingId,
    action_type: String(payload?.action_type || "").trim(),
    action_payload:
      payload?.action_payload && typeof payload.action_payload === "object"
        ? clone(payload.action_payload)
        : {},
    result_status: String(payload?.result_status || "ok").trim() || "ok",
    result_payload:
      payload?.result_payload && typeof payload.result_payload === "object"
        ? clone(payload.result_payload)
        : {},
    created_at: now(),
  };
  data.helperActionLogs.unshift(log);
  writeData(data);
  return clone(log);
}

module.exports = {
  listHelperBindings,
  resolveHelperBinding,
  listHelperSnapshots,
  listHelperInventories,
  listMergedHelperInventoryItems,
  listHelperActionLogs,
  upsertHelperBinding,
  upsertHelperInventory,
  pruneHelperInventories,
  removeHelperBinding,
  createHelperSnapshot,
  getHelperSnapshotLimitForUser,
  purchaseLineupSlot,
  removeHelperSnapshot,
  updateHelperSnapshot,
  createHelperActionLog,
};
