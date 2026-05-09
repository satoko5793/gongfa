const { buildCardSeasonMeta, parseSeasonScheduleId } = require("../config/season-meta");
const { parseLegacyHelperInventory } = require("./legacy-parser");

function normalizeHelperInventoryScheduleId(value) {
  return parseSeasonScheduleId(value);
}

function getHelperInventoryItemScheduleId(item) {
  return normalizeHelperInventoryScheduleId(
    item?.schedule_id ??
      item?.scheduleId ??
      item?.season_schedule_id ??
      item?.seasonScheduleId ??
      null
  );
}

function getHelperInventoryCurrentScheduleId(inventory, fallbackCurrentScheduleId) {
  return (
    normalizeHelperInventoryScheduleId(fallbackCurrentScheduleId) ||
    normalizeHelperInventoryScheduleId(
      inventory?.summary?.current_schedule_id ??
        inventory?.summary?.currentScheduleId ??
        inventory?.summary?.role_schedule_id ??
        inventory?.summary?.roleScheduleId ??
        inventory?.summary?.schedule_id ??
        inventory?.summary?.scheduleId ??
        null
    ) ||
    null
  );
}

function parseHelperInventoryProducts(inventories, options = {}) {
  const grouped = new Map();

  (Array.isArray(inventories) ? inventories : []).forEach((inventory, inventoryIndex) => {
    const currentScheduleId = getHelperInventoryCurrentScheduleId(
      inventory,
      options.currentScheduleId
    );

    (Array.isArray(inventory?.items) ? inventory.items : []).forEach((item, itemIndex) => {
      const legacyId = Number(item?.legacy_id || item?.legacyId || 0);
      if (!legacyId) return;

      const scheduleId = getHelperInventoryItemScheduleId(item);
      const seasonMeta = buildCardSeasonMeta({
        scheduleId,
        currentScheduleId,
      });
      const name =
        String(item?.display_name || item?.displayName || `功法 ${legacyId}`).trim() ||
        `功法 ${legacyId}`;
      const product = {
        legacy_id: legacyId,
        name,
        image_url: String(item?.image_url || item?.imageUrl || "").trim() || null,
        attack_value: Number(item?.attack_value || item?.attackValue || 0),
        hp_value: Number(item?.hp_value || item?.hpValue || 0),
        main_attrs: String(item?.main_attr_text || item?.mainAttrText || "").trim(),
        ext_attrs: String(item?.ext_attr_text || item?.extAttrText || "").trim(),
        stock: 1,
        source_uids: [
          String(item?.uid || item?.uId || `${inventory?.id || inventoryIndex}-${itemIndex}`).trim(),
        ],
        ...seasonMeta,
      };
      const groupKey = [
        product.legacy_id,
        product.name,
        product.attack_value,
        product.hp_value,
        product.main_attrs,
        product.ext_attrs,
        product.schedule_id || "-",
      ].join("|");
      const existing = grouped.get(groupKey);
      if (existing) {
        existing.stock += 1;
        existing.source_uids.push(...product.source_uids);
        return;
      }
      grouped.set(groupKey, {
        ...product,
        uid: groupKey,
      });
    });
  });

  return [...grouped.values()];
}

function buildHelperInventoryImportRawJson(inventories, options = {}) {
  const currentScheduleId = normalizeHelperInventoryScheduleId(options.currentScheduleId);
  return {
    imported_from: "helper_inventories",
    inventory_count: Array.isArray(inventories) ? inventories.length : 0,
    current_schedule_id: currentScheduleId,
    season_label: String(options.seasonLabel || "").trim() || null,
    inventories: (Array.isArray(inventories) ? inventories : []).map((inventory) => ({
      id: Number(inventory?.id || 0) || null,
      binding_id:
        inventory?.binding_id === undefined || inventory?.binding_id === null
          ? null
          : Number(inventory.binding_id),
      updated_at: inventory?.updated_at || inventory?.created_at || null,
      summary: inventory?.summary && typeof inventory.summary === "object" ? inventory.summary : {},
      item_count: Array.isArray(inventory?.items) ? inventory.items.length : 0,
    })),
  };
}

function inferRoleIdFromHelperItems(items) {
  const firstUid = String(items?.[0]?.uid || items?.[0]?.uId || "").trim();
  if (!firstUid) return "";
  const [roleId] = firstUid.split("-");
  return String(roleId || "").trim();
}

function normalizeHelperInventoryUpload(source, options = {}) {
  const value = source && typeof source === "object" ? source : {};
  const isHelperPayload =
    value?.summary &&
    typeof value.summary === "object" &&
    !Array.isArray(value.summary) &&
    Array.isArray(value.items);
  if (!isHelperPayload) {
    return parseLegacyHelperInventory(value, options);
  }

  const summary = value.summary && typeof value.summary === "object" ? { ...value.summary } : {};
  const items = Array.isArray(value.items)
    ? value.items.map((item) => ({
        row_key: String(item?.row_key || item?.rowKey || "").trim(),
        uid: String(item?.uid || item?.uId || "").trim(),
        legacy_id: Number(item?.legacy_id || item?.legacyId || 0),
        display_name:
          String(item?.display_name || item?.displayName || "").trim() ||
          `功法 ${Number(item?.legacy_id || item?.legacyId || 0) || "-"}`,
        attack_value: Number(item?.attack_value || item?.attackValue || 0),
        hp_value: Number(item?.hp_value || item?.hpValue || 0),
        main_attr_text: String(item?.main_attr_text || item?.mainAttrText || "").trim(),
        ext_attr_text: String(item?.ext_attr_text || item?.extAttrText || "").trim(),
        has_ext:
          item?.has_ext !== undefined ? Boolean(item?.has_ext) : Boolean(item?.hasExt),
        is_locked:
          item?.is_locked !== undefined ? Boolean(item?.is_locked) : Boolean(item?.isLocked),
        max: Boolean(item?.max),
        image_url: String(item?.image_url || item?.imageUrl || "").trim(),
        schedule_id: getHelperInventoryItemScheduleId(item),
      }))
    : [];

  const roleId =
    String(summary?.role_id || summary?.roleId || "").trim() || inferRoleIdFromHelperItems(items);

  return {
    binding_id:
      value?.binding_id === undefined || value?.binding_id === null
        ? null
        : Number(value.binding_id),
    source_type: String(value?.source_type || "helper_bridge").trim() || "helper_bridge",
    summary: {
      ...summary,
      role_id: roleId,
      role_name:
        String(summary?.role_name || summary?.roleName || options.roleName || "").trim() || "",
      server: String(summary?.server || options.server || "").trim() || "",
      current_schedule_id: getHelperInventoryCurrentScheduleId(value, options.currentScheduleId),
      role_schedule_id:
        normalizeHelperInventoryScheduleId(
          summary?.role_schedule_id ?? summary?.roleScheduleId ?? summary?.schedule_id ?? summary?.scheduleId
        ) || getHelperInventoryCurrentScheduleId(value, options.currentScheduleId),
      legacy_count: Number(summary?.legacy_count || summary?.legacyCount || items.length || 0),
      fragment_count: Number(summary?.fragment_count || summary?.fragmentCount || 0),
      synced_at: String(summary?.synced_at || summary?.syncedAt || options.syncedAt || "").trim() || new Date().toISOString(),
    },
    items,
  };
}

module.exports = {
  buildHelperInventoryImportRawJson,
  getHelperInventoryCurrentScheduleId,
  getHelperInventoryItemScheduleId,
  normalizeHelperInventoryUpload,
  parseHelperInventoryProducts,
};
