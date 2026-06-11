const { AUDIT_ACTIONS } = require("../audit-actions");
const { QUOTA_LOG_TYPES } = require("../quota-log-types");
const { cashToQuota, cashToResidual } = require("../payment-conversion");
const { getStoreRuntime } = require("./core/runtime-context");

const CONSIGNMENT_INVENTORY_FRESH_MS = 60 * 60 * 1000;
const CONSIGNMENT_STATUS = {
  SUBMITTED: "submitted",
  APPROVED: "approved",
  RESERVED: "reserved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
  WITHDRAWN: "withdrawn",
};
const ESCROW_STATUS = {
  AWAITING_PAYMENT_REVIEW: "awaiting_payment_review",
  ESCROWED: "escrowed",
  DELIVERED: "delivered",
  DISPUTED: "disputed",
  COMPLETED: "completed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
};
const PAYMENT_REVIEW_STATUS = {
  NOT_REQUIRED: "not_required",
  AUTO_CONFIRMED: "auto_confirmed",
  MANUAL_PENDING: "manual_pending",
  MANUAL_CONFIRMED: "manual_confirmed",
  REJECTED: "rejected",
};
const ESCROW_AUTO_CONFIRM_MS = 48 * 60 * 60 * 1000;
const PAYMENT_METHOD_LABELS = {
  cash: "人民币",
  quota: "额度",
  residual: "残卷",
};
const mergedInventoryCache = new Map();

function autoApproveSubmittedConsignments(data) {
  const { now } = getStoreRuntime();
  const timestamp = now();
  let changed = false;
  for (const listing of data?.consignmentListings || []) {
    if (String(listing?.status || "") !== CONSIGNMENT_STATUS.SUBMITTED) continue;
    listing.status = CONSIGNMENT_STATUS.APPROVED;
    listing.auto_approved = true;
    listing.reviewed_by = listing.reviewed_by ?? null;
    listing.reviewed_at = listing.reviewed_at || timestamp;
    listing.review_note = listing.review_note || "背包库存校验通过，自动上架。";
    listing.updated_at = timestamp;
    changed = true;
  }
  return changed;
}

const LEGACY_DISPLAY_NAME_BY_ID = {
  1: "随便掌",
  2: "折凳要诀",
  101: "退堂鼓",
  102: "杠上开花手",
  201: "也行刀法",
  202: "摸牌透视眼",
  301: "杠精罡气",
  302: "摸鱼化劲",
  401: "对穿肠文攻术",
  402: "小强不死身",
  403: "跑路草上飞",
  501: "运气决",
  601: "珍 运气决",
  602: "珍 连环马后炮",
  603: "珍 乾坤一掷",
};
const LEGACY_TERM_LABEL_BY_ID = {
  604: "走火",
  605: "气定",
};

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

function getBindingsById(data, userId) {
  return new Map(
    (data.helperBindings || [])
      .filter((item) => Number(item.user_id) === Number(userId))
      .map((item) => [Number(item.id), sanitizeHelperBindingForPublic(item)])
  );
}

function getHelperInventoryItemKey(item, index = 0) {
  const explicit = String(item?.item_key || item?.uid || item?.row_key || "").trim();
  if (explicit) return explicit;
  return `${getHelperInventoryMergeKey(item)}::${Number(index || 0)}`;
}

function decorateHelperInventory(data, inventory, bindingsById, scheduleIndex = null) {
  const binding = inventory?.binding_id === null ? null : bindingsById.get(Number(inventory.binding_id)) || null;
  const resolvedScheduleIndex = scheduleIndex || buildHelperInventoryScheduleIndex(data);
  return {
    ...inventory,
    binding,
    items: sortHelperInventoryItems(inventory?.items || []).map((item, index) => {
      const normalizedItem = normalizeHelperInventoryItemForRead(data, item, inventory, resolvedScheduleIndex);
      return {
        ...normalizedItem,
        item_key: getHelperInventoryItemKey(normalizedItem, index),
        inventory_id: Number(inventory?.id || 0),
        binding_id: inventory?.binding_id ?? null,
        source_role_name:
          String(binding?.nickname || "").trim() ||
          String(binding?.game_role_name || inventory?.summary?.role_name || "").trim() ||
          "未命名炉子",
        source_server: String(binding?.game_server || inventory?.summary?.server || "").trim() || "-",
      };
    }),
  };
}

function getInventoryVersion(data, userId) {
  return (data.helperInventories || [])
    .filter((item) => Number(item.user_id) === Number(userId))
    .map((item) => `${Number(item.id || 0)}:${String(item.updated_at || item.created_at || "")}:${Number((item.items || []).length)}`)
    .sort()
    .join("|");
}

function buildInventorySeasonCounts(items = []) {
  return items.reduce(
    (result, item) => {
      result.total += 1;
      if (item?.is_current_season) result.current += 1;
      else result.legacy += 1;
      if (item?.has_ext) result.with_ext += 1;
      if (item?.max) result.max += 1;
      return result;
    },
    { total: 0, current: 0, legacy: 0, with_ext: 0, max: 0 }
  );
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function pickFirstNumber(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return 0;
}

function normalizeLegacyTermValue(attrId, rawValue, mappedValue) {
  const mapped = String(mappedValue ?? "").trim();
  if (mapped) return mapped;
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return "";
  return [604, 605].includes(Number(attrId)) ? (numeric / 100).toFixed(1) : String(numeric);
}

function parseLegacyAttrText(text) {
  return String(text || "")
    .split("|")
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+)\s*:\s*([^→]+?)(?:\s*→\s*(.+))?$/);
      if (!match) return null;
      return {
        attrId: Number(match[1]),
        rawValue: String(match[2] || "").trim(),
        mappedValue: String(match[3] || "").trim(),
      };
    })
    .filter(Boolean);
}

function normalizeLegacyMainAttrText(text) {
  const normalized = String(text || "").trim();
  if (!normalized || normalized === "无") return "";
  const pairs = parseLegacyAttrText(normalized);
  if (!pairs.length) return normalized;
  const visiblePairs = pairs.filter((pair) => ![1, 2, 3].includes(Number(pair.attrId)));
  if (!visiblePairs.length) return "";
  return visiblePairs
    .map((pair) => {
      const label = LEGACY_TERM_LABEL_BY_ID[pair.attrId] || `属性${pair.attrId}`;
      const value = normalizeLegacyTermValue(pair.attrId, pair.rawValue, pair.mappedValue);
      return value ? `${label} ${value}` : label;
    })
    .join(" | ");
}

function normalizeLegacyExtAttrText(text) {
  const normalized = String(text || "").trim();
  if (!normalized || normalized === "无") return "无";
  const pairs = parseLegacyAttrText(normalized);
  if (!pairs.length) return normalized;
  return (
    pairs
      .map((pair) => {
        const label = LEGACY_TERM_LABEL_BY_ID[pair.attrId] || `属性${pair.attrId}`;
        const value = normalizeLegacyTermValue(pair.attrId, pair.rawValue, pair.mappedValue);
        return value ? `${label} ${value}` : label;
      })
      .filter(Boolean)
      .join(" | ") || "无"
  );
}

function getExpectedLegacyImageUrl(legacyId) {
  const name = LEGACY_DISPLAY_NAME_BY_ID[Number(legacyId)];
  return name ? `./legacy-assets/${encodeURIComponent(name)}.png` : "";
}

function normalizeLegacyImageUrl(rawUrl, legacyId) {
  const url = String(rawUrl || "").trim();
  const expectedUrl = getExpectedLegacyImageUrl(legacyId);
  if (expectedUrl && (!url || /^data:image\/svg\+xml/i.test(url))) return expectedUrl;
  return url;
}

function normalizeLegacyDisplayName(rawName, legacyId) {
  const name = String(rawName || "").trim();
  const expectedName = LEGACY_DISPLAY_NAME_BY_ID[Number(legacyId)] || "";
  if (expectedName && (!name || name === "功法" || name === "未知功法" || /^功法\s*\d+$/.test(name))) {
    return expectedName;
  }
  return name || expectedName || (legacyId ? `功法 ${legacyId}` : "功法");
}

function getHelperInventorySeasonSignature(item) {
  return [
    Number(item?.legacy_id || item?.legacyId || 0),
    Number(item?.attack_value || item?.attackValue || 0),
    Number(item?.hp_value || item?.hpValue || 0),
    normalizeLegacyMainAttrText(pickFirstText(item?.main_attr_text, item?.mainAttrText, item?.main_attrs)),
    normalizeLegacyExtAttrText(pickFirstText(item?.ext_attr_text, item?.extAttrText, item?.ext_attrs)),
  ].join("|");
}

function buildHelperInventoryScheduleIndex(data) {
  const index = new Map();
  (Array.isArray(data?.products) ? data.products : []).forEach((product) => {
    const scheduleId = pickFirstNumber(product?.schedule_id, product?.scheduleId);
    if (!scheduleId) return;
    const signature = getHelperInventorySeasonSignature({
      legacy_id: product?.legacy_id,
      attack_value: product?.attack_value,
      hp_value: product?.hp_value,
      main_attr_text: product?.main_attrs,
      ext_attr_text: product?.ext_attrs,
    });
    const bucket = index.get(signature) || new Map();
    bucket.set(scheduleId, Number(bucket.get(scheduleId) || 0) + 1);
    index.set(signature, bucket);

    const legacyId = pickFirstNumber(product?.legacy_id, product?.legacyId);
    if (legacyId) {
      const legacyKey = `legacy:${legacyId}`;
      const legacyBucket = index.get(legacyKey) || new Map();
      legacyBucket.set(scheduleId, Number(legacyBucket.get(scheduleId) || 0) + 1);
      index.set(legacyKey, legacyBucket);
    }
  });
  return index;
}

function pickDominantScheduleFromBucket(bucket) {
  if (!bucket?.size) return null;
  return [...bucket.entries()].sort((left, right) => right[1] - left[1] || right[0] - left[0])[0][0];
}

function inferHelperInventoryScheduleId(item, scheduleIndex, currentScheduleId) {
  const explicitScheduleId = pickFirstNumber(
    item?.schedule_id,
    item?.scheduleId,
    item?.season_schedule_id,
    item?.seasonScheduleId,
    item?.raw?.schedule_id,
    item?.raw?.scheduleId
  );
  if (explicitScheduleId) return explicitScheduleId;

  const signature = getHelperInventorySeasonSignature(item);
  const exactScheduleId = pickDominantScheduleFromBucket(scheduleIndex?.get(signature));
  if (exactScheduleId) return exactScheduleId;

  const legacyId = pickFirstNumber(item?.legacy_id, item?.legacyId);
  const legacyScheduleId = pickDominantScheduleFromBucket(scheduleIndex?.get(`legacy:${legacyId}`));
  if (legacyScheduleId) return legacyScheduleId;

  if (legacyId >= 601 && legacyId <= 699 && currentScheduleId) return currentScheduleId;
  return null;
}

function normalizeHelperInventoryItemForRead(data, item, inventory = {}, scheduleIndex = null) {
  const { buildCardSeasonMeta, getConfiguredCurrentSeasonScheduleId } = getStoreRuntime();
  const legacyId = pickFirstNumber(item?.legacy_id, item?.legacyId);
  const mainAttrText = normalizeLegacyMainAttrText(pickFirstText(item?.main_attr_text, item?.mainAttrText));
  const extAttrText = normalizeLegacyExtAttrText(pickFirstText(item?.ext_attr_text, item?.extAttrText));
  const currentScheduleId =
    pickFirstNumber(
      item?.current_schedule_id,
      item?.currentScheduleId,
      inventory?.summary?.current_schedule_id,
      inventory?.summary?.currentScheduleId,
      inventory?.summary?.role_schedule_id,
      inventory?.summary?.roleScheduleId
    ) || getConfiguredCurrentSeasonScheduleId(data.rechargeConfig || {});
  const scheduleId = inferHelperInventoryScheduleId(
    { ...item, legacy_id: legacyId, main_attr_text: mainAttrText, ext_attr_text: extAttrText },
    scheduleIndex,
    currentScheduleId
  );
  const seasonMeta = buildCardSeasonMeta({
    scheduleId,
    currentScheduleId,
  });
  return {
    ...item,
    ...seasonMeta,
    legacy_id: legacyId,
    display_name: normalizeLegacyDisplayName(pickFirstText(item?.display_name, item?.displayName), legacyId),
    attack_value: pickFirstNumber(item?.attack_value, item?.attackValue),
    hp_value: pickFirstNumber(item?.hp_value, item?.hpValue),
    main_attr_text: mainAttrText,
    ext_attr_text: extAttrText,
    has_ext:
      item?.has_ext !== undefined
        ? Boolean(item?.has_ext)
        : item?.hasExt !== undefined
          ? Boolean(item?.hasExt)
          : Boolean(extAttrText && extAttrText !== "无"),
    is_locked: item?.is_locked !== undefined ? Boolean(item?.is_locked) : Boolean(item?.isLocked),
    max: Boolean(item?.max),
    image_url: normalizeLegacyImageUrl(pickFirstText(item?.image_url, item?.imageUrl), legacyId),
  };
}

function listHelperInventorySummary(userId) {
  const { readData, clone } = getStoreRuntime();
  const data = readData();
  const bindingsById = getBindingsById(data, userId);
  const scheduleIndex = buildHelperInventoryScheduleIndex(data);
  const inventories = (data.helperInventories || [])
    .filter((item) => Number(item.user_id) === Number(userId))
    .map((inventory) => {
      const binding = inventory?.binding_id === null ? null : bindingsById.get(Number(inventory.binding_id)) || null;
      const items = (Array.isArray(inventory?.items) ? inventory.items : []).map((item) =>
        normalizeHelperInventoryItemForRead(data, item, inventory, scheduleIndex)
      );
      return {
        id: Number(inventory?.id || 0),
        user_id: Number(inventory?.user_id || 0),
        binding_id: inventory?.binding_id ?? null,
        binding,
        source_type: String(inventory?.source_type || "helper_bridge").trim() || "helper_bridge",
        summary: inventory?.summary || {},
        item_count: items.length,
        fragment_count: Number(inventory?.summary?.fragment_count || 0),
        season_counts: buildInventorySeasonCounts(items),
        created_at: inventory?.created_at || null,
        updated_at: inventory?.updated_at || null,
      };
    })
    .sort((left, right) =>
      String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at))
    );
  const totals = inventories.reduce(
    (result, inventory) => {
      result.inventory_count += 1;
      result.item_count += Number(inventory.item_count || 0);
      result.fragment_count += Number(inventory.fragment_count || 0);
      result.current_season_count += Number(inventory.season_counts?.current || 0);
      result.legacy_season_count += Number(inventory.season_counts?.legacy || 0);
      result.with_ext_count += Number(inventory.season_counts?.with_ext || 0);
      result.max_count += Number(inventory.season_counts?.max || 0);
      const updatedAt = String(inventory.updated_at || "");
      if (updatedAt && (!result.latest_synced_at || updatedAt > result.latest_synced_at)) {
        result.latest_synced_at = updatedAt;
      }
      return result;
    },
    {
      inventory_count: 0,
      item_count: 0,
      fragment_count: 0,
      current_season_count: 0,
      legacy_season_count: 0,
      with_ext_count: 0,
      max_count: 0,
      latest_synced_at: null,
    }
  );
  return clone({ inventories, totals });
}

function normalizeHelperInventoryPayload(data, payload, timestamp) {
  const { clone, buildCardSeasonMeta, getConfiguredCurrentSeasonScheduleId } = getStoreRuntime();
  const scheduleIndex = buildHelperInventoryScheduleIndex(data);
  const normalizedBindingId =
    payload?.binding_id === undefined || payload?.binding_id === null ? null : Number(payload.binding_id);
  const normalizedSummary =
    payload?.summary && typeof payload.summary === "object" && !Array.isArray(payload.summary)
      ? clone(payload.summary)
      : {};
  const normalizedItems = Array.isArray(payload?.items)
    ? payload.items.map((item) => {
        const legacyId = pickFirstNumber(item?.legacy_id, item?.legacyId);
        const extAttrText = normalizeLegacyExtAttrText(
          pickFirstText(item?.ext_attr_text, item?.extAttrText)
        );
        const imageUrl = normalizeLegacyImageUrl(pickFirstText(item?.image_url, item?.imageUrl), legacyId);
        const currentScheduleId =
          pickFirstNumber(
            item?.current_schedule_id,
            item?.currentScheduleId,
            normalizedSummary?.current_schedule_id,
            normalizedSummary?.currentScheduleId,
            normalizedSummary?.role_schedule_id,
            normalizedSummary?.roleScheduleId,
            normalizedSummary?.schedule_id,
            normalizedSummary?.scheduleId
          ) || getConfiguredCurrentSeasonScheduleId(data.rechargeConfig || {});
        const mainAttrText = normalizeLegacyMainAttrText(
          pickFirstText(item?.main_attr_text, item?.mainAttrText)
        );
        const scheduleId = inferHelperInventoryScheduleId(
          { ...item, legacy_id: legacyId, main_attr_text: mainAttrText, ext_attr_text: extAttrText },
          scheduleIndex,
          currentScheduleId
        );
        return {
          ...buildCardSeasonMeta({
            scheduleId,
            currentScheduleId,
          }),
          row_key: pickFirstText(item?.row_key, item?.rowKey),
          uid: pickFirstText(item?.uid, item?.uId),
          legacy_id: legacyId,
          display_name: normalizeLegacyDisplayName(pickFirstText(item?.display_name, item?.displayName), legacyId),
          attack_value: pickFirstNumber(item?.attack_value, item?.attackValue),
          hp_value: pickFirstNumber(item?.hp_value, item?.hpValue),
          main_attr_text: mainAttrText,
          ext_attr_text: extAttrText,
          has_ext:
            item?.has_ext !== undefined
              ? Boolean(item?.has_ext)
              : item?.hasExt !== undefined
                ? Boolean(item?.hasExt)
                : Boolean(extAttrText && extAttrText !== "无"),
          is_locked:
            item?.is_locked !== undefined ? Boolean(item?.is_locked) : Boolean(item?.isLocked),
          max: Boolean(item?.max),
          image_url: imageUrl,
        };
      })
    : [];
  return {
    bindingId: normalizedBindingId,
    sourceType: String(payload?.source_type || "helper_bridge").trim() || "helper_bridge",
    summary: normalizedSummary,
    items: normalizedItems,
    timestamp,
  };
}

function applyHelperInventoryUpsert(data, userId, payload, timestamp) {
  const { nextId, addHelperActionLog } = getStoreRuntime();
  const normalized = normalizeHelperInventoryPayload(data, payload, timestamp);
  let inventory = null;
  if (normalized.bindingId !== null) {
    inventory = (data.helperInventories || []).find(
      (item) => Number(item.user_id) === Number(userId) && Number(item.binding_id) === Number(normalized.bindingId)
    );
  }
  if (!inventory) {
    inventory = (data.helperInventories || []).find(
      (item) =>
        Number(item.user_id) === Number(userId) &&
        String(item?.summary?.role_id || "") === String(normalized.summary?.role_id || "") &&
        String(item?.summary?.server || "") === String(normalized.summary?.server || "")
    );
  }

  if (!inventory) {
    inventory = {
      id: nextId(data.helperInventories || []),
      user_id: Number(userId),
      binding_id: normalized.bindingId,
      source_type: normalized.sourceType,
      summary: normalized.summary,
      items: normalized.items,
      created_at: timestamp,
      updated_at: timestamp,
    };
    data.helperInventories.unshift(inventory);
  } else {
    inventory.binding_id = normalized.bindingId;
    inventory.source_type = normalized.sourceType;
    inventory.summary = normalized.summary;
    inventory.items = normalized.items;
    inventory.updated_at = timestamp;
  }

  addHelperActionLog(data, {
    userId,
    bindingId: normalized.bindingId,
    actionType: "helper_inventory_sync",
    actionPayload: {
      role_id: normalized.summary?.role_id || "",
      server: normalized.summary?.server || "",
      legacy_count: Number(normalized.summary?.legacy_count || normalized.items.length || 0),
      fragment_count: Number(normalized.summary?.fragment_count || 0),
    },
    resultPayload: {
      inventory_id: inventory.id,
      item_count: normalized.items.length,
    },
  });

  return inventory;
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
  const bindingsById = getBindingsById(data, userId);
  const scheduleIndex = buildHelperInventoryScheduleIndex(data);
  return clone(
    (data.helperInventories || [])
      .filter((item) => Number(item.user_id) === Number(userId))
      .map((item) => decorateHelperInventory(data, item, bindingsById, scheduleIndex))
      .sort((left, right) =>
        String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at))
      )
  );
}

function listMergedHelperInventoryItems(userId) {
  const { readData, clone, buildCardSeasonMeta, getConfiguredCurrentSeasonScheduleId } = getStoreRuntime();
  const data = readData();
  const cacheKey = `${Number(userId)}:${getInventoryVersion(data, userId)}`;
  const cached = mergedInventoryCache.get(cacheKey);
  if (cached) return clone(cached);
  for (const key of mergedInventoryCache.keys()) {
    if (key.startsWith(`${Number(userId)}:`) && key !== cacheKey) mergedInventoryCache.delete(key);
  }
  const bindingsById = getBindingsById(data, userId);
  const scheduleIndex = buildHelperInventoryScheduleIndex(data);
  const inventories = (data.helperInventories || [])
    .filter((item) => Number(item.user_id) === Number(userId))
    .map((item) => decorateHelperInventory(data, item, bindingsById, scheduleIndex));
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

  const mergedItems = [...mergedMap.values()]
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
    }));
  mergedInventoryCache.set(cacheKey, mergedItems);
  return clone(mergedItems);
}

function itemMatchesKeyword(item, keyword) {
  const normalized = String(keyword || "").trim().toLowerCase();
  if (!normalized) return true;
  return [
    item?.display_name,
    item?.legacy_id,
    item?.main_attr_text,
    item?.ext_attr_text,
    item?.source_role_name,
    item?.source_server,
    item?.season_display,
  ]
    .map((value) => String(value || "").toLowerCase())
    .some((value) => value.includes(normalized));
}

function listHelperInventoryItems(userId, options = {}) {
  const { readData, clone } = getStoreRuntime();
  const data = readData();
  const merged = ["1", "true", "yes"].includes(String(options?.merged || "").trim().toLowerCase());
  const page = Math.max(Number.parseInt(options?.page, 10) || 1, 1);
  const pageSize = Math.max(Math.min(Number.parseInt(options?.page_size ?? options?.pageSize, 10) || 30, 100), 1);
  const keyword = String(options?.keyword || "").trim();
  const bindingId =
    options?.binding_id === undefined || options?.binding_id === null || String(options.binding_id).trim() === ""
      ? null
      : Number(options.binding_id);
  const bindingsById = getBindingsById(data, userId);
  const scheduleIndex = buildHelperInventoryScheduleIndex(data);
  const inventories = (data.helperInventories || [])
    .filter((inventory) => Number(inventory.user_id) === Number(userId))
    .filter((inventory) => bindingId === null || Number(inventory.binding_id || 0) === Number(bindingId))
    .map((inventory) => decorateHelperInventory(data, inventory, bindingsById, scheduleIndex));
  const allItems = merged
    ? listMergedHelperInventoryItems(userId)
    : inventories.flatMap((inventory) => inventory.items || []);
  const filteredItems = allItems.filter((item) => itemMatchesKeyword(item, keyword));
  const total = filteredItems.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const normalizedPage = Math.min(page, totalPages);
  const offset = (normalizedPage - 1) * pageSize;
  return clone({
    items: filteredItems.slice(offset, offset + pageSize),
    total,
    page: normalizedPage,
    page_size: pageSize,
    total_pages: totalPages,
    has_more: normalizedPage < totalPages,
    merged,
    keyword,
    binding_id: bindingId,
  });
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
  const { readData, writeData, clone, now } = getStoreRuntime();
  const data = readData();
  const timestamp = now();
  const inventory = applyHelperInventoryUpsert(data, userId, payload, timestamp);
  writeData(data);
  return clone(
    decorateHelperInventory(data, inventory, getBindingsById(data, userId), buildHelperInventoryScheduleIndex(data))
  );
}

function upsertHelperInventoriesBatch(userId, payloads = []) {
  const { readData, writeData, clone, now } = getStoreRuntime();
  const data = readData();
  const timestamp = now();
  const inventories = (Array.isArray(payloads) ? payloads : []).map((payload) =>
    applyHelperInventoryUpsert(data, userId, payload, timestamp)
  );
  writeData(data);
  const bindingsById = getBindingsById(data, userId);
  const scheduleIndex = buildHelperInventoryScheduleIndex(data);
  return clone({
    inventories: inventories.map((inventory) => decorateHelperInventory(data, inventory, bindingsById, scheduleIndex)),
    summary: listHelperInventorySummary(userId),
  });
}

function findHelperInventoryItemForUser(data, userId, payload = {}) {
  const inventoryId = Number(payload?.inventory_id || payload?.inventoryId || 0);
  const bindingId =
    payload?.binding_id === undefined || payload?.binding_id === null || String(payload.binding_id).trim() === ""
      ? null
      : Number(payload.binding_id);
  const itemKey = String(payload?.item_key || payload?.itemKey || "").trim();
  if (!inventoryId || !itemKey) return null;
  const bindingsById = getBindingsById(data, userId);
  const inventory = (data.helperInventories || []).find(
    (item) =>
      Number(item.user_id) === Number(userId) &&
      Number(item.id) === Number(inventoryId) &&
      (bindingId === null || Number(item.binding_id || 0) === Number(bindingId))
  );
  if (!inventory) return null;
  const decorated = decorateHelperInventory(data, inventory, bindingsById, buildHelperInventoryScheduleIndex(data));
  const item = (decorated.items || []).find((candidate) => String(candidate?.item_key || "") === itemKey);
  if (!item) return null;
  return { inventory: decorated, item };
}

function buildConsignmentSnapshot(item) {
  return {
    item_key: String(item?.item_key || "").trim(),
    legacy_id: Number(item?.legacy_id || 0),
    display_name: String(item?.display_name || "").trim(),
    attack_value: Number(item?.attack_value || 0),
    hp_value: Number(item?.hp_value || 0),
    main_attr_text: String(item?.main_attr_text || "").trim(),
    ext_attr_text: String(item?.ext_attr_text || "").trim(),
    has_ext: Boolean(item?.has_ext),
    max: Boolean(item?.max),
    image_url: String(item?.image_url || "").trim(),
    schedule_id: item?.schedule_id ?? null,
    current_schedule_id: item?.current_schedule_id ?? null,
    is_current_season: Boolean(item?.is_current_season),
    season_display: String(item?.season_display || "").trim(),
    source_role_name: String(item?.source_role_name || "").trim(),
    source_server: String(item?.source_server || "").trim(),
  };
}

function normalizeConsignmentPriceYuan(payload = {}) {
  const rawPrice = payload?.price_yuan !== undefined ? payload.price_yuan : payload?.price_quota;
  const priceText = String(rawPrice ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(priceText)) return 0;
  const price = Number(priceText);
  if (!Number.isFinite(price) || price <= 0) return 0;
  return Math.round(price * 100) / 100;
}

function normalizePositiveInteger(value) {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) return null;
  return numeric;
}

function getConsignmentPricingSnapshot(data, priceYuan, payload = {}) {
  const accepted = Array.isArray(payload?.accepted_payment_methods)
    ? payload.accepted_payment_methods.map((item) => String(item || "").trim())
    : ["cash"];
  const acceptedSet = new Set(accepted.filter((item) => ["cash", "quota", "residual"].includes(item)));
  if (!acceptedSet.size) acceptedSet.add("cash");
  const config = data.rechargeConfig || {};
  const quotaPrice =
    normalizePositiveInteger(payload?.quota_price) ||
    (acceptedSet.has("quota") ? cashToQuota(priceYuan) : null);
  const residualPrice =
    normalizePositiveInteger(payload?.residual_price) ||
    (acceptedSet.has("residual") ? cashToResidual(priceYuan, config) : null);
  const paymentOptions = [];
  if (acceptedSet.has("cash")) {
    paymentOptions.push({ method: "cash", label: PAYMENT_METHOD_LABELS.cash, price_yuan: priceYuan });
  }
  if (acceptedSet.has("quota") && quotaPrice) {
    paymentOptions.push({ method: "quota", label: PAYMENT_METHOD_LABELS.quota, price_quota: quotaPrice });
  }
  if (acceptedSet.has("residual") && residualPrice) {
    paymentOptions.push({
      method: "residual",
      label: PAYMENT_METHOD_LABELS.residual,
      transfer_amount: residualPrice,
      transfer_unit: config.residual_unit_label || "残卷",
    });
  }
  if (!paymentOptions.length) {
    paymentOptions.push({ method: "cash", label: PAYMENT_METHOD_LABELS.cash, price_yuan: priceYuan });
  }
  return {
    paymentOptions,
    pricingSnapshot: {
      price_yuan: priceYuan,
      quota_price: quotaPrice,
      residual_price: residualPrice,
      residual_unit_label: config.residual_unit_label || "残卷",
      quota_anchor_yuan: Number(config.exchange_yuan || 8),
      quota_anchor_quota: Number(config.exchange_quota || 10000),
      residual_purchase_amount_per_quota_anchor: Number(config.residual_purchase_amount_per_quota_anchor || 10000),
      auto_price_methods: Array.isArray(payload?.auto_price_methods)
        ? payload.auto_price_methods.map((item) => String(item || "").trim()).filter(Boolean)
        : [],
    },
  };
}

function getPaymentOption(listing, method) {
  return getPaymentOptionsForListing(listing).find(
    (item) => String(item?.method || "").trim() === String(method || "").trim()
  );
}

function getPaymentOptionsForListing(listing) {
  const options = Array.isArray(listing?.payment_options) ? listing.payment_options.filter(Boolean) : [];
  if (options.length) return options;
  const priceYuan = Number(listing?.price_yuan ?? listing?.price_quota ?? 0);
  return Number.isFinite(priceYuan) && priceYuan > 0
    ? [{ method: "cash", label: PAYMENT_METHOD_LABELS.cash, price_yuan: priceYuan }]
    : [];
}

function createConsignmentListing(userId, payload) {
  const { readData, writeData, clone, now, nextId, addAuditLog } = getStoreRuntime();
  const data = readData();
  const timestamp = now();
  const found = findHelperInventoryItemForUser(data, userId, payload);
  if (!found) {
    const err = new Error("helper_inventory_item_not_found");
    err.statusCode = 404;
    throw err;
  }
  const updatedAtMs = Date.parse(found.inventory?.updated_at || "");
  if (!Number.isFinite(updatedAtMs) || Date.now() - updatedAtMs > CONSIGNMENT_INVENTORY_FRESH_MS) {
    const err = new Error("helper_inventory_stale");
    err.statusCode = 409;
    err.details = ["请先重新同步背包，寄售申请需要使用 1 小时内的库存数据。"];
    throw err;
  }
  const seller = (data.users || []).find((item) => Number(item.id) === Number(userId));
  const sellerContactInfo = String(seller?.contact_info || "").trim();
  if (!sellerContactInfo) {
    const err = new Error("seller_contact_required");
    err.statusCode = 409;
    err.details = ["请先到个人后台的资料里填写微信或联系方式，再上架寄售。"];
    throw err;
  }
  const priceYuan = normalizeConsignmentPriceYuan(payload);
  if (!priceYuan) {
    const err = new Error("price_yuan_invalid");
    err.statusCode = 400;
    throw err;
  }
  const { paymentOptions, pricingSnapshot } = getConsignmentPricingSnapshot(data, priceYuan, payload);
  const listing = {
    id: nextId(data.consignmentListings || []),
    seller_user_id: Number(userId),
    seller_binding_id: found.inventory?.binding_id ?? null,
    seller_display_name: String(seller?.game_role_name || seller?.nickname || "").trim(),
    seller_contact_info: sellerContactInfo,
    inventory_id: Number(found.inventory?.id || 0),
    inventory_item_key: String(found.item?.item_key || "").trim(),
    item_snapshot: buildConsignmentSnapshot(found.item),
    price_yuan: priceYuan,
    price_quota: pricingSnapshot.quota_price || priceYuan,
    residual_price: pricingSnapshot.residual_price || null,
    payment_options: paymentOptions,
    pricing_snapshot: pricingSnapshot,
    seller_remark: String(payload?.seller_remark || payload?.remark || "").trim(),
    status: CONSIGNMENT_STATUS.APPROVED,
    auto_approved: true,
    reviewed_by: null,
    reviewed_at: timestamp,
    review_note: "背包库存校验通过，自动上架。",
    created_at: timestamp,
    updated_at: timestamp,
  };
  data.consignmentListings = Array.isArray(data.consignmentListings) ? data.consignmentListings : [];
  data.consignmentListings.unshift(listing);
  addAuditLog(data, {
    actorUserId: userId,
    targetType: "consignment_listing",
    targetId: listing.id,
    action: "consignment_submit",
    detail: {
      listing_id: listing.id,
      inventory_id: listing.inventory_id,
      inventory_item_key: listing.inventory_item_key,
      status: listing.status,
      price_yuan: listing.price_yuan,
      payment_options: listing.payment_options,
    },
  });
  writeData(data);
  return clone(listing);
}

function listConsignmentListingsForUser(userId) {
  const { readData, writeData, clone } = getStoreRuntime();
  const data = readData();
  const approvedChanged = autoApproveSubmittedConsignments(data);
  const escrowChanged = applyEscrowAutoConfirm(data);
  if (approvedChanged || escrowChanged) writeData(data);
  return clone(
    (data.consignmentListings || [])
      .filter((item) => Number(item.seller_user_id) === Number(userId))
      .map((item) => ({
        ...item,
        escrow_trade:
          hydrateEscrowTrade(data, (data.escrowTrades || []).find(
            (trade) => Number(trade.consignment_listing_id) === Number(item.id)
          )) || null,
      }))
      .sort((left, right) => String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at)))
  );
}

function listAdminConsignmentListings(options = {}) {
  const { readData, writeData, clone } = getStoreRuntime();
  const data = readData();
  if (autoApproveSubmittedConsignments(data)) writeData(data);
  const status = String(options?.status || "all").trim();
  const usersById = new Map((data.users || []).map((user) => [Number(user.id), user]));
  const listings = (data.consignmentListings || [])
    .filter((item) => status === "all" || String(item.status || "") === status)
    .map((item) => {
      const seller = usersById.get(Number(item.seller_user_id));
      return {
        ...item,
        seller: seller
          ? {
              id: Number(seller.id || 0),
              game_role_id: String(seller.game_role_id || "").trim(),
              game_role_name: String(seller.game_role_name || "").trim(),
              game_server: String(seller.game_server || "").trim(),
              contact_info: String(seller.contact_info || "").trim(),
              role: String(seller.role || "user").trim(),
            }
          : null,
      };
    })
    .sort((left, right) => String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at)));
  return clone({ items: listings, total: listings.length, status });
}

function buildPublicConsignmentProduct(listing, data = null) {
  const snapshot = listing?.item_snapshot || {};
  const priceYuan = Number(listing?.price_yuan ?? listing?.price_quota ?? 0);
  const listingId = Number(listing?.id || 0);
  const seller = (data?.users || []).find((item) => Number(item.id) === Number(listing?.seller_user_id));
  const sellerDisplayName =
    String(listing?.seller_display_name || seller?.game_role_name || seller?.nickname || snapshot?.source_role_name || "").trim();
  const sellerContactInfo = String(listing?.seller_contact_info || seller?.contact_info || "").trim();
  return {
    id: -listingId,
    item_kind: "consignment",
    item_id: listingId,
    legacy_id: Number(snapshot?.legacy_id || 0),
    uid: `consignment-${listingId}`,
    name: String(snapshot?.display_name || "功法").trim() || "功法",
    image_url: String(snapshot?.image_url || "").trim(),
    schedule_id: snapshot?.schedule_id === undefined ? null : snapshot.schedule_id,
    current_schedule_id:
      snapshot?.current_schedule_id === undefined ? null : snapshot.current_schedule_id,
    is_current_season: Boolean(snapshot?.is_current_season),
    season_tag: Boolean(snapshot?.is_current_season) ? "current" : "legacy",
    season_label: String(snapshot?.season_display || "").trim() || "-",
    season_display: String(snapshot?.season_display || "").trim() || "玩家寄售",
    attack_value: Number(snapshot?.attack_value || 0),
    hp_value: Number(snapshot?.hp_value || 0),
    main_attrs: String(snapshot?.main_attr_text || "").trim(),
    ext_attrs: String(snapshot?.ext_attr_text || "").trim(),
    price_yuan: Number.isFinite(priceYuan) ? Math.max(priceYuan, 0) : 0,
    price_quota: Number(getPaymentOption(listing, "quota")?.price_quota || listing?.price_quota || 0),
    original_price_quota: Number(getPaymentOption(listing, "quota")?.price_quota || listing?.price_quota || 0),
    residual_price: Number(getPaymentOption(listing, "residual")?.transfer_amount || listing?.residual_price || 0) || null,
    payment_options: getPaymentOptionsForListing(listing),
    pricing_snapshot:
      listing?.pricing_snapshot && typeof listing.pricing_snapshot === "object"
        ? listing.pricing_snapshot
        : {},
    stock: 1,
    status: "on_sale",
    description: "玩家寄售商品，转账、额度或残卷都会先进入平台托管。",
    tags: ["玩家寄售"],
    code: `consignment-${listingId}`,
    display_rank: 500,
    stock_label: "寄售 1 张",
    is_consignment: true,
    consignment_status: String(listing?.status || "").trim(),
    consignment_listing_id: listingId,
    seller_display_name: sellerDisplayName,
    seller_contact_info: sellerContactInfo,
    seller_role_name: String(snapshot?.source_role_name || "").trim(),
    seller_server: String(snapshot?.source_server || "").trim(),
    created_at: listing?.created_at || "",
    updated_at: listing?.updated_at || listing?.created_at || "",
  };
}

function listPublicConsignmentProducts(options = {}) {
  const { readData, writeData, clone } = getStoreRuntime();
  const data = readData();
  if (autoApproveSubmittedConsignments(data)) writeData(data);
  const keyword = String(options?.keyword || "").trim().toLowerCase();
  let products = (data.consignmentListings || [])
    .filter((item) => String(item?.status || "") === CONSIGNMENT_STATUS.APPROVED)
    .map((item) => buildPublicConsignmentProduct(item, data))
    .filter((item) => Number(item.price_yuan || 0) > 0);

  if (keyword) {
    products = products.filter((item) =>
      [
        item.name,
        item.legacy_id,
        item.uid,
        item.main_attrs,
        item.ext_attrs,
        item.seller_display_name,
        item.seller_contact_info,
        item.seller_role_name,
        item.seller_server,
        item.description,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword))
    );
  }

  products.sort((left, right) =>
    String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at))
  );
  return clone(products);
}

function reviewConsignmentListing(actorUserId, listingId, payload = {}) {
  const { readData, writeData, clone, now, addAuditLog } = getStoreRuntime();
  const data = readData();
  const listing = (data.consignmentListings || []).find((item) => Number(item.id) === Number(listingId));
  if (!listing) return null;
  const nextStatus = String(payload?.status || "").trim();
  if (![CONSIGNMENT_STATUS.APPROVED, CONSIGNMENT_STATUS.REJECTED, CONSIGNMENT_STATUS.SUSPENDED].includes(nextStatus)) {
    const err = new Error("consignment_status_invalid");
    err.statusCode = 400;
    throw err;
  }
  listing.status = nextStatus;
  listing.reviewed_by = Number(actorUserId || 0);
  listing.reviewed_at = now();
  listing.review_note = String(payload?.review_note || "").trim();
  listing.updated_at = listing.reviewed_at;
  addAuditLog(data, {
    actorUserId,
    targetType: "consignment_listing",
    targetId: listing.id,
    action: "consignment_review",
    detail: {
      status: listing.status,
      review_note: listing.review_note,
    },
  });
  writeData(data);
  return clone(listing);
}

function withdrawConsignmentListing(userId, listingId) {
  const { readData, writeData, clone, now, addAuditLog } = getStoreRuntime();
  const data = readData();
  const listing = (data.consignmentListings || []).find(
    (item) => Number(item.id) === Number(listingId) && Number(item.seller_user_id) === Number(userId)
  );
  if (!listing) return null;
  if (![CONSIGNMENT_STATUS.SUBMITTED, CONSIGNMENT_STATUS.APPROVED].includes(String(listing.status || ""))) {
    const err = new Error("consignment_not_withdrawable");
    err.statusCode = 409;
    throw err;
  }
  listing.status = CONSIGNMENT_STATUS.WITHDRAWN;
  listing.updated_at = now();
  addAuditLog(data, {
    actorUserId: userId,
    targetType: "consignment_listing",
    targetId: listing.id,
    action: "consignment_withdraw",
    detail: { listing_id: listing.id },
  });
  writeData(data);
  return clone(listing);
}

function hydrateEscrowTrade(data, trade) {
  if (!trade) return null;
  const buyer = (data.users || []).find((item) => Number(item.id) === Number(trade.buyer_user_id));
  const seller = (data.users || []).find((item) => Number(item.id) === Number(trade.seller_user_id));
  const listing = (data.consignmentListings || []).find(
    (item) => Number(item.id) === Number(trade.consignment_listing_id)
  );
  const evidence = (data.escrowEvidence || []).filter((item) => Number(item.trade_id) === Number(trade.id));
  return {
    ...trade,
    payment_review: buildPaymentReviewSnapshot(trade),
    listing: listing || null,
    item_snapshot: trade.item_snapshot || listing?.item_snapshot || {},
    buyer: buyer
      ? {
          id: Number(buyer.id || 0),
          game_role_id: String(buyer.game_role_id || "").trim(),
          game_role_name: String(buyer.game_role_name || "").trim(),
          nickname: String(buyer.nickname || "").trim(),
        }
      : null,
    seller: seller
      ? {
          id: Number(seller.id || 0),
        game_role_id: String(seller.game_role_id || "").trim(),
        game_role_name: String(seller.game_role_name || "").trim(),
        nickname: String(seller.nickname || "").trim(),
        contact_info: String(seller.contact_info || "").trim(),
      }
    : null,
    evidence,
  };
}

function addEscrowLedger(data, entry) {
  const { nextId, now } = getStoreRuntime();
  data.escrowLedger = Array.isArray(data.escrowLedger) ? data.escrowLedger : [];
  data.escrowLedger.unshift({
    id: nextId(data.escrowLedger),
    trade_id: Number(entry.trade_id || entry.tradeId || 0),
    actor_user_id:
      entry.actor_user_id === undefined || entry.actor_user_id === null ? null : Number(entry.actor_user_id),
    action: String(entry.action || "").trim(),
    detail: entry.detail && typeof entry.detail === "object" ? entry.detail : {},
    created_at: now(),
  });
}

function getEscrowAmountForMethod(option, method) {
  if (method === "cash") return Number(option?.price_yuan || 0);
  if (method === "quota") return Number(option?.price_quota || 0);
  if (method === "residual") return Number(option?.transfer_amount || 0);
  return 0;
}

function getPaymentReviewStatusForTrade(trade) {
  const explicit = String(trade?.payment_review_status || "").trim();
  if (explicit) return explicit;
  const method = String(trade?.payment_method || "").trim();
  const status = String(trade?.status || "").trim();
  if (method === "quota") return PAYMENT_REVIEW_STATUS.AUTO_CONFIRMED;
  if (status === ESCROW_STATUS.AWAITING_PAYMENT_REVIEW) return PAYMENT_REVIEW_STATUS.MANUAL_PENDING;
  if (status === ESCROW_STATUS.CANCELLED) return PAYMENT_REVIEW_STATUS.REJECTED;
  if ([ESCROW_STATUS.ESCROWED, ESCROW_STATUS.DELIVERED, ESCROW_STATUS.DISPUTED, ESCROW_STATUS.COMPLETED].includes(status)) {
    return PAYMENT_REVIEW_STATUS.MANUAL_CONFIRMED;
  }
  return PAYMENT_REVIEW_STATUS.MANUAL_PENDING;
}

function getPaymentReviewSourceForTrade(trade) {
  const explicit = String(trade?.payment_review_source || "").trim();
  if (explicit) return explicit;
  return String(trade?.payment_method || "").trim() === "quota" ? "internal_quota" : "manual_admin";
}

function buildPaymentReviewSnapshot(trade) {
  const status = getPaymentReviewStatusForTrade(trade);
  return {
    status,
    source: getPaymentReviewSourceForTrade(trade),
    pending: status === PAYMENT_REVIEW_STATUS.MANUAL_PENDING,
    reference: String(trade?.payment_reference || "").trim(),
    reviewed_by: trade?.payment_reviewed_by === undefined || trade?.payment_reviewed_by === null ? null : Number(trade.payment_reviewed_by),
    reviewed_at: trade?.payment_reviewed_at || null,
    admin_note: String(trade?.admin_note || "").trim(),
  };
}

function applyEscrowAutoConfirm(data) {
  const { now, applyQuotaChange } = getStoreRuntime();
  const timestamp = now();
  let changed = false;
  for (const trade of data.escrowTrades || []) {
    if (String(trade.status || "") !== ESCROW_STATUS.DELIVERED) continue;
    const deliveredMs = Date.parse(trade.delivered_at || "");
    if (!Number.isFinite(deliveredMs) || Date.now() - deliveredMs < ESCROW_AUTO_CONFIRM_MS) continue;
    trade.status = ESCROW_STATUS.COMPLETED;
    trade.completed_at = timestamp;
    trade.auto_confirmed = true;
    trade.updated_at = timestamp;
    if (String(trade.payment_method || "") === "quota" && !trade.seller_quota_settled_at) {
      applyQuotaChange(data, {
        userId: trade.seller_user_id,
        changeAmount: Number(trade.amount || 0),
        type: QUOTA_LOG_TYPES.ADMIN_ADD,
        remark: `escrow_release:${trade.id}`,
        bonusAmount: 0,
      });
      trade.seller_quota_settled_at = timestamp;
      trade.settlement_status = "settled";
    } else if (String(trade.payment_method || "") !== "quota") {
      trade.settlement_status = trade.settlement_status || "pending_manual";
    }
    addEscrowLedger(data, {
      trade_id: trade.id,
      action: "auto_confirm_receipt",
      detail: { delivered_at: trade.delivered_at },
    });
    changed = true;
  }
  return changed;
}

function createEscrowTrade(buyerUserId, payload = {}) {
  const { readData, writeData, clone, now, nextId, ensureQuotaAccount, applyQuotaChange, addAuditLog } =
    getStoreRuntime();
  const data = readData();
  applyEscrowAutoConfirm(data);
  const buyer = (data.users || []).find((item) => Number(item.id) === Number(buyerUserId));
  if (!buyer || buyer.status !== "active") {
    const err = new Error(!buyer ? "user_not_found" : "user_disabled");
    err.statusCode = !buyer ? 404 : 403;
    throw err;
  }
  const listing = (data.consignmentListings || []).find(
    (item) => Number(item.id) === Number(payload?.listing_id || payload?.item_id)
  );
  if (!listing) {
    const err = new Error("consignment_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (Number(listing.seller_user_id) === Number(buyerUserId)) {
    const err = new Error("cannot_buy_own_consignment");
    err.statusCode = 400;
    throw err;
  }
  if (String(listing.status || "") !== CONSIGNMENT_STATUS.APPROVED) {
    const err = new Error("consignment_not_available");
    err.statusCode = 409;
    throw err;
  }
  const paymentMethod = String(payload?.payment_method || "cash").trim();
  const option = getPaymentOption(listing, paymentMethod);
  if (!option) {
    const err = new Error("payment_method_not_allowed");
    err.statusCode = 400;
    throw err;
  }
  const amount = getEscrowAmountForMethod(option, paymentMethod);
  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error("escrow_amount_invalid");
    err.statusCode = 400;
    throw err;
  }
  const timestamp = now();
  if (paymentMethod === "quota") {
    const account = ensureQuotaAccount(data, buyerUserId);
    if (Number(account.balance || 0) < Number(amount || 0)) {
      const err = new Error("insufficient_quota");
      err.statusCode = 400;
      err.payload = { balance: Number(account.balance || 0), required_quota: Number(amount || 0) };
      throw err;
    }
    applyQuotaChange(data, {
      userId: buyerUserId,
      changeAmount: -Number(amount),
      type: QUOTA_LOG_TYPES.ORDER_DEDUCT,
      remark: `escrow_hold:${listing.id}`,
    });
  } else if (!String(payload?.payment_reference || "").trim()) {
    const err = new Error("payment_reference_required");
    err.statusCode = 400;
    throw err;
  }
  const trade = {
    id: nextId(data.escrowTrades || []),
    consignment_listing_id: Number(listing.id),
    buyer_user_id: Number(buyerUserId),
    seller_user_id: Number(listing.seller_user_id),
    payment_method: paymentMethod,
    amount: Number(amount),
    amount_yuan: paymentMethod === "cash" ? Number(amount) : null,
    amount_quota: paymentMethod === "quota" ? Number(amount) : null,
    transfer_amount: paymentMethod === "residual" ? Number(amount) : null,
    transfer_unit: paymentMethod === "residual" ? option.transfer_unit || "残卷" : null,
    payment_reference: String(payload?.payment_reference || "").trim(),
    payment_review_status:
      paymentMethod === "quota"
        ? PAYMENT_REVIEW_STATUS.AUTO_CONFIRMED
        : PAYMENT_REVIEW_STATUS.MANUAL_PENDING,
    payment_review_source: paymentMethod === "quota" ? "internal_quota" : "manual_admin",
    payment_reviewed_by: null,
    payment_reviewed_at: paymentMethod === "quota" ? timestamp : null,
    buyer_note: String(payload?.buyer_note || payload?.remark || "").trim(),
    item_snapshot: clone(listing.item_snapshot || {}),
    listing_snapshot: clone(listing),
    status:
      paymentMethod === "quota"
        ? ESCROW_STATUS.ESCROWED
        : ESCROW_STATUS.AWAITING_PAYMENT_REVIEW,
    settlement_status: paymentMethod === "quota" ? "pending_auto" : "pending_payment_review",
    delivered_at: null,
    delivery_note: "",
    completed_at: null,
    disputed_at: null,
    dispute_note: "",
    resolved_at: null,
    settlement_marked_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
  data.escrowTrades = Array.isArray(data.escrowTrades) ? data.escrowTrades : [];
  data.escrowTrades.unshift(trade);
  listing.status = CONSIGNMENT_STATUS.RESERVED;
  listing.reserved_trade_id = trade.id;
  listing.updated_at = timestamp;
  addEscrowLedger(data, {
    trade_id: trade.id,
    actor_user_id: buyerUserId,
    action: "trade_create",
    detail: { payment_method: paymentMethod, amount },
  });
  addAuditLog(data, {
    actorUserId: buyerUserId,
    targetType: "escrow_trade",
    targetId: trade.id,
    action: "escrow_trade_create",
    detail: { listing_id: listing.id, payment_method: paymentMethod, amount },
  });
  writeData(data);
  return clone(hydrateEscrowTrade(data, trade));
}

function listEscrowTradesForUser(userId) {
  const { readData, writeData, clone } = getStoreRuntime();
  const data = readData();
  const changed = applyEscrowAutoConfirm(data);
  if (changed) writeData(data);
  const items = (data.escrowTrades || [])
    .filter((item) => Number(item.buyer_user_id) === Number(userId) || Number(item.seller_user_id) === Number(userId))
    .sort((left, right) => String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at)))
    .map((item) => hydrateEscrowTrade(data, item));
  return clone(items);
}

function listAdminEscrowTrades(options = {}) {
  const { readData, writeData, clone } = getStoreRuntime();
  const data = readData();
  const changed = applyEscrowAutoConfirm(data);
  if (changed) writeData(data);
  const status = String(options?.status || "all").trim();
  const items = (data.escrowTrades || [])
    .filter((item) => status === "all" || String(item.status || "") === status)
    .sort((left, right) => String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at)))
    .map((item) => hydrateEscrowTrade(data, item));
  return clone({ items, total: items.length, status });
}

function listAdminPaymentReviews(options = {}) {
  const { readData, writeData, clone } = getStoreRuntime();
  const data = readData();
  const changed = applyEscrowAutoConfirm(data);
  if (changed) writeData(data);
  const status = String(options?.status || "all").trim();
  const method = String(options?.method || "all").trim();
  const items = (data.escrowTrades || [])
    .map((item) => hydrateEscrowTrade(data, item))
    .filter((item) => String(item?.payment_method || "") !== "quota")
    .filter((item) => status === "all" || String(item?.payment_review?.status || "") === status)
    .filter((item) => method === "all" || String(item?.payment_method || "") === method)
    .sort((left, right) => {
      const leftPending = left?.payment_review?.pending ? 1 : 0;
      const rightPending = right?.payment_review?.pending ? 1 : 0;
      if (leftPending !== rightPending) return rightPending - leftPending;
      return String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at));
    });
  const summary = items.reduce(
    (result, item) => {
      const reviewStatus = String(item?.payment_review?.status || "unknown");
      result[reviewStatus] = Number(result[reviewStatus] || 0) + 1;
      return result;
    },
    {}
  );
  return clone({ items, total: items.length, status, method, summary });
}

function submitEscrowDelivery(userId, tradeId, payload = {}) {
  const { readData, writeData, clone, now, addAuditLog } = getStoreRuntime();
  const data = readData();
  applyEscrowAutoConfirm(data);
  const trade = (data.escrowTrades || []).find((item) => Number(item.id) === Number(tradeId));
  if (!trade || Number(trade.seller_user_id) !== Number(userId)) return null;
  if (String(trade.status || "") !== ESCROW_STATUS.ESCROWED) {
    const err = new Error("escrow_delivery_not_allowed");
    err.statusCode = 409;
    throw err;
  }
  const note = String(payload?.delivery_note || payload?.note || "").trim();
  if (!note) {
    const err = new Error("delivery_note_required");
    err.statusCode = 400;
    throw err;
  }
  trade.status = ESCROW_STATUS.DELIVERED;
  trade.delivery_note = note;
  trade.delivered_at = now();
  trade.updated_at = trade.delivered_at;
  addEscrowLedger(data, { trade_id: trade.id, actor_user_id: userId, action: "seller_delivery", detail: { note } });
  addAuditLog(data, {
    actorUserId: userId,
    targetType: "escrow_trade",
    targetId: trade.id,
    action: "escrow_delivery_submit",
    detail: { delivery_note: note },
  });
  writeData(data);
  return clone(hydrateEscrowTrade(data, trade));
}

function addEscrowEvidence(userId, tradeId, file) {
  const { readData, writeData, clone, now, nextId } = getStoreRuntime();
  const data = readData();
  const trade = (data.escrowTrades || []).find((item) => Number(item.id) === Number(tradeId));
  if (!trade || ![trade.buyer_user_id, trade.seller_user_id].some((id) => Number(id) === Number(userId))) {
    return null;
  }
  const evidence = {
    id: nextId(data.escrowEvidence || []),
    trade_id: Number(trade.id),
    user_id: Number(userId),
    evidence_type: "image",
    url: String(file?.url || "").trim(),
    original_name: String(file?.original_name || "").trim(),
    mime_type: String(file?.mime_type || "").trim(),
    size: Number(file?.size || 0),
    created_at: now(),
  };
  data.escrowEvidence = Array.isArray(data.escrowEvidence) ? data.escrowEvidence : [];
  data.escrowEvidence.unshift(evidence);
  addEscrowLedger(data, { trade_id: trade.id, actor_user_id: userId, action: "evidence_upload", detail: { url: evidence.url } });
  writeData(data);
  return clone(evidence);
}

function confirmEscrowReceipt(userId, tradeId) {
  const { readData, writeData, clone, now, applyQuotaChange, addAuditLog } = getStoreRuntime();
  const data = readData();
  applyEscrowAutoConfirm(data);
  const trade = (data.escrowTrades || []).find((item) => Number(item.id) === Number(tradeId));
  if (!trade || Number(trade.buyer_user_id) !== Number(userId)) return null;
  if (String(trade.status || "") !== ESCROW_STATUS.DELIVERED) {
    const err = new Error("escrow_confirm_not_allowed");
    err.statusCode = 409;
    throw err;
  }
  trade.status = ESCROW_STATUS.COMPLETED;
  trade.completed_at = now();
  trade.updated_at = trade.completed_at;
  if (String(trade.payment_method || "") === "quota") {
    applyQuotaChange(data, {
      userId: trade.seller_user_id,
      changeAmount: Number(trade.amount || 0),
      type: QUOTA_LOG_TYPES.ADMIN_ADD,
      remark: `escrow_release:${trade.id}`,
      bonusAmount: 0,
    });
    trade.seller_quota_settled_at = trade.completed_at;
    trade.settlement_status = "settled";
  } else {
    trade.settlement_status = "pending_manual";
  }
  addEscrowLedger(data, { trade_id: trade.id, actor_user_id: userId, action: "buyer_confirm_receipt" });
  addAuditLog(data, {
    actorUserId: userId,
    targetType: "escrow_trade",
    targetId: trade.id,
    action: "escrow_confirm_receipt",
    detail: {},
  });
  writeData(data);
  return clone(hydrateEscrowTrade(data, trade));
}

function disputeEscrowTrade(userId, tradeId, payload = {}) {
  const { readData, writeData, clone, now, addAuditLog } = getStoreRuntime();
  const data = readData();
  applyEscrowAutoConfirm(data);
  const trade = (data.escrowTrades || []).find((item) => Number(item.id) === Number(tradeId));
  if (!trade || Number(trade.buyer_user_id) !== Number(userId)) return null;
  if (![ESCROW_STATUS.ESCROWED, ESCROW_STATUS.DELIVERED].includes(String(trade.status || ""))) {
    const err = new Error("escrow_dispute_not_allowed");
    err.statusCode = 409;
    throw err;
  }
  trade.status = ESCROW_STATUS.DISPUTED;
  trade.disputed_at = now();
  trade.dispute_note = String(payload?.dispute_note || payload?.note || "").trim();
  trade.updated_at = trade.disputed_at;
  addEscrowLedger(data, { trade_id: trade.id, actor_user_id: userId, action: "buyer_dispute", detail: { note: trade.dispute_note } });
  addAuditLog(data, {
    actorUserId: userId,
    targetType: "escrow_trade",
    targetId: trade.id,
    action: "escrow_dispute",
    detail: { dispute_note: trade.dispute_note },
  });
  writeData(data);
  return clone(hydrateEscrowTrade(data, trade));
}

function reviewEscrowPayment(actorUserId, tradeId, payload = {}) {
  const { readData, writeData, clone, now, addAuditLog } = getStoreRuntime();
  const data = readData();
  const trade = (data.escrowTrades || []).find((item) => Number(item.id) === Number(tradeId));
  if (!trade) return null;
  if (String(trade.status || "") !== ESCROW_STATUS.AWAITING_PAYMENT_REVIEW) {
    const err = new Error("escrow_payment_review_not_allowed");
    err.statusCode = 409;
    throw err;
  }
  const approved = payload?.approved !== false;
  const listing = (data.consignmentListings || []).find((item) => Number(item.id) === Number(trade.consignment_listing_id));
  if (approved) {
    trade.status = ESCROW_STATUS.ESCROWED;
    trade.payment_reviewed_by = Number(actorUserId || 0);
    trade.payment_reviewed_at = now();
    trade.payment_review_status = PAYMENT_REVIEW_STATUS.MANUAL_CONFIRMED;
    trade.payment_review_source = "manual_admin";
    trade.settlement_status = "pending_delivery";
  } else {
    trade.status = ESCROW_STATUS.CANCELLED;
    trade.cancelled_at = now();
    trade.payment_reviewed_by = Number(actorUserId || 0);
    trade.payment_reviewed_at = trade.cancelled_at;
    trade.payment_review_status = PAYMENT_REVIEW_STATUS.REJECTED;
    trade.payment_review_source = "manual_admin";
    trade.settlement_status = "cancelled";
    if (listing) {
      listing.status = CONSIGNMENT_STATUS.APPROVED;
      listing.reserved_trade_id = null;
      listing.updated_at = trade.cancelled_at;
    }
  }
  trade.admin_note = String(payload?.admin_note || payload?.note || "").trim();
  trade.updated_at = now();
  addEscrowLedger(data, { trade_id: trade.id, actor_user_id: actorUserId, action: approved ? "payment_approve" : "payment_reject", detail: { note: trade.admin_note } });
  addAuditLog(data, {
    actorUserId,
    targetType: "escrow_trade",
    targetId: trade.id,
    action: "escrow_payment_review",
    detail: { approved, note: trade.admin_note },
  });
  writeData(data);
  return clone(hydrateEscrowTrade(data, trade));
}

function resolveEscrowTrade(actorUserId, tradeId, payload = {}) {
  const { readData, writeData, clone, now, applyQuotaChange, addAuditLog } = getStoreRuntime();
  const data = readData();
  const trade = (data.escrowTrades || []).find((item) => Number(item.id) === Number(tradeId));
  if (!trade) return null;
  const resolution = String(payload?.resolution || "").trim();
  const listing = (data.consignmentListings || []).find((item) => Number(item.id) === Number(trade.consignment_listing_id));
  if (!["refund", "release"].includes(resolution)) {
    const err = new Error("escrow_resolution_invalid");
    err.statusCode = 400;
    throw err;
  }
  if (resolution === "refund") {
    if (String(trade.payment_method || "") === "quota") {
      applyQuotaChange(data, {
        userId: trade.buyer_user_id,
        changeAmount: Number(trade.amount || 0),
        type: QUOTA_LOG_TYPES.ORDER_REFUND,
        remark: `escrow_refund:${trade.id}`,
      });
    }
    trade.status = ESCROW_STATUS.REFUNDED;
    trade.settlement_status = "refunded";
    if (listing) {
      listing.status = CONSIGNMENT_STATUS.APPROVED;
      listing.reserved_trade_id = null;
      listing.updated_at = now();
    }
  } else {
    trade.status = ESCROW_STATUS.COMPLETED;
    trade.completed_at = now();
    if (String(trade.payment_method || "") === "quota" && !trade.seller_quota_settled_at) {
      applyQuotaChange(data, {
        userId: trade.seller_user_id,
        changeAmount: Number(trade.amount || 0),
        type: QUOTA_LOG_TYPES.ADMIN_ADD,
        remark: `escrow_release:${trade.id}`,
        bonusAmount: 0,
      });
      trade.seller_quota_settled_at = now();
      trade.settlement_status = "settled";
    } else if (String(trade.payment_method || "") !== "quota") {
      trade.settlement_status = "pending_manual";
    }
  }
  trade.resolved_by = Number(actorUserId || 0);
  trade.resolved_at = now();
  trade.resolution_note = String(payload?.note || payload?.admin_note || "").trim();
  trade.updated_at = trade.resolved_at;
  addEscrowLedger(data, { trade_id: trade.id, actor_user_id: actorUserId, action: `resolve_${resolution}`, detail: { note: trade.resolution_note } });
  addAuditLog(data, {
    actorUserId,
    targetType: "escrow_trade",
    targetId: trade.id,
    action: "escrow_resolve",
    detail: { resolution, note: trade.resolution_note },
  });
  writeData(data);
  return clone(hydrateEscrowTrade(data, trade));
}

function markEscrowSettlement(actorUserId, tradeId, payload = {}) {
  const { readData, writeData, clone, now, addAuditLog } = getStoreRuntime();
  const data = readData();
  const trade = (data.escrowTrades || []).find((item) => Number(item.id) === Number(tradeId));
  if (!trade) return null;
  if (String(trade.status || "") !== ESCROW_STATUS.COMPLETED) {
    const err = new Error("escrow_settlement_not_allowed");
    err.statusCode = 409;
    throw err;
  }
  trade.settlement_status = "settled";
  trade.settlement_marked_by = Number(actorUserId || 0);
  trade.settlement_marked_at = now();
  trade.settlement_note = String(payload?.note || payload?.settlement_note || "").trim();
  trade.updated_at = trade.settlement_marked_at;
  addEscrowLedger(data, { trade_id: trade.id, actor_user_id: actorUserId, action: "settlement_marked", detail: { note: trade.settlement_note } });
  addAuditLog(data, {
    actorUserId,
    targetType: "escrow_trade",
    targetId: trade.id,
    action: "escrow_settlement_mark",
    detail: { note: trade.settlement_note },
  });
  writeData(data);
  return clone(hydrateEscrowTrade(data, trade));
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
  CONSIGNMENT_STATUS,
  ESCROW_STATUS,
  PAYMENT_REVIEW_STATUS,
  listHelperBindings,
  resolveHelperBinding,
  listHelperSnapshots,
  listHelperInventories,
  listHelperInventorySummary,
  listHelperInventoryItems,
  listMergedHelperInventoryItems,
  listHelperActionLogs,
  upsertHelperBinding,
  upsertHelperInventory,
  upsertHelperInventoriesBatch,
  createConsignmentListing,
  listConsignmentListingsForUser,
  listAdminConsignmentListings,
  listPublicConsignmentProducts,
  reviewConsignmentListing,
  withdrawConsignmentListing,
  createEscrowTrade,
  listEscrowTradesForUser,
  listAdminEscrowTrades,
  listAdminPaymentReviews,
  submitEscrowDelivery,
  addEscrowEvidence,
  confirmEscrowReceipt,
  disputeEscrowTrade,
  reviewEscrowPayment,
  resolveEscrowTrade,
  markEscrowSettlement,
  pruneHelperInventories,
  removeHelperBinding,
  createHelperSnapshot,
  getHelperSnapshotLimitForUser,
  purchaseLineupSlot,
  removeHelperSnapshot,
  updateHelperSnapshot,
  createHelperActionLog,
};
