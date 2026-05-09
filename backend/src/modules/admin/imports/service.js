const { parseLegacyProducts } = require("../../../services/legacy-parser");
const {
  buildHelperInventoryImportRawJson,
  normalizeHelperInventoryUpload,
  parseHelperInventoryProducts,
} = require("../../../services/helper-inventory-parser");
const { getConfiguredCurrentSeasonScheduleId } = require("../../../config/season-meta");
const { useFileStore } = require("../../../services/runtime");
const helperStore = require("../../../domain/store/repositories/helper-file-store");
const { getAdminRechargeConfigRepository } = require("../recharge-config/repository");
const { getAdminImportsRepository } = require("./repository");

function unwrapRawJson(rawValue) {
  let value = rawValue;
  while (typeof value === "string") {
    value = JSON.parse(value);
  }
  return value;
}

function buildImportSummary(result) {
  const importRow = result?.import || {};
  return {
    import: {
      id: importRow.id || null,
      source_type: importRow.source_type || null,
      source_file_name: importRow.source_file_name || null,
      imported_by: importRow.imported_by || null,
      created_at: importRow.created_at || null,
    },
    parsed_count: Number(result?.parsed_count || 0),
  };
}

function resolveHelperInventoryBinding(bindings, payload = {}) {
  const normalizedBindingId =
    payload?.binding_id === undefined || payload?.binding_id === null
      ? null
      : Number(payload.binding_id);
  if (normalizedBindingId !== null) {
    const exactBinding = (bindings || []).find(
      (item) => Number(item?.id || 0) === Number(normalizedBindingId)
    );
    if (exactBinding) return exactBinding;
  }

  const bindTokenId = String(payload?.summary?.bind_token_id || payload?.summary?.bindTokenId || "").trim();
  if (bindTokenId) {
    const bindTokenBinding = (bindings || []).find(
      (item) => String(item?.bind_token_id || "").trim() === bindTokenId
    );
    if (bindTokenBinding) return bindTokenBinding;
  }

  const roleId = String(payload?.summary?.role_id || payload?.summary?.roleId || "").trim();
  if (roleId) {
    const roleBinding = (bindings || []).find(
      (item) => String(item?.game_role_id || "").trim() === roleId
    );
    if (roleBinding) return roleBinding;
  }

  const server = String(payload?.summary?.server || "").trim();
  const roleName = String(payload?.summary?.role_name || payload?.summary?.roleName || "").trim();
  if (server && roleName) {
    return (
      (bindings || []).find(
        (item) =>
          String(item?.game_server || "").trim() === server &&
          String(item?.game_role_name || "").trim() === roleName
      ) || null
    );
  }

  return null;
}

function getHelperInventoryItemRoleId(item, fallbackRoleId = "") {
  const uid = String(item?.uid || item?.uId || "").trim();
  const [uidRoleId] = uid.split("-");
  return String(uidRoleId || fallbackRoleId || "").trim();
}

function splitHelperInventoryByRole(parsed) {
  const fallbackRoleId = String(parsed?.summary?.role_id || parsed?.summary?.roleId || "").trim();
  const groups = new Map();
  (Array.isArray(parsed?.items) ? parsed.items : []).forEach((item) => {
    const roleId = getHelperInventoryItemRoleId(item, fallbackRoleId);
    const key = roleId || "__unknown__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.entries()].map(([roleId, items]) => ({
    roleId: roleId === "__unknown__" ? fallbackRoleId : roleId,
    items,
  }));
}

function getInventoryMergeKey(matchedBinding, summary = {}, fallbackKey = "") {
  if (matchedBinding?.id) return `binding:${Number(matchedBinding.id)}`;
  const roleId = String(summary?.role_id || summary?.roleId || "").trim();
  const server = String(summary?.server || "").trim();
  return `role:${roleId || "-"}|server:${server || "-"}|fallback:${fallbackKey}`;
}

function getInventoryItemMergeKey(item, fallbackKey) {
  return (
    String(item?.uid || item?.uId || "").trim() ||
    String(item?.row_key || item?.rowKey || "").trim() ||
    fallbackKey
  );
}

async function importCardsJson(actorUser, body = {}) {
  const rawJson = unwrapRawJson(body.raw_json);
  const rechargeConfigRepository = getAdminRechargeConfigRepository();
  const rechargeConfig = await rechargeConfigRepository.getRechargeConfig();
  const currentSeasonScheduleId = getConfiguredCurrentSeasonScheduleId(rechargeConfig);
  const parsedProducts = parseLegacyProducts(rawJson, {
    currentScheduleId: currentSeasonScheduleId,
  });
  if (parsedProducts.length === 0) {
    const err = new Error("legacy_cards_not_found");
    err.statusCode = 400;
    throw err;
  }

  const repository = getAdminImportsRepository();
  const result = await repository.importCards({
    sourceType: body.source_type || "upload",
    sourceFileName: body.source_file_name || null,
    rawJson,
    importedBy: actorUser.id,
    parsedProducts,
  });
  return buildImportSummary(result);
}

async function importCardsJsonBatch(actorUser, body = {}) {
  const imports = Array.isArray(body.imports) ? body.imports : [];
  const rechargeConfigRepository = getAdminRechargeConfigRepository();
  const rechargeConfig = await rechargeConfigRepository.getRechargeConfig();
  const currentSeasonScheduleId = getConfiguredCurrentSeasonScheduleId(rechargeConfig);
  const files = [];
  const parsedProducts = [];

  imports.forEach((item, index) => {
    const rawJson = unwrapRawJson(item?.raw_json);
    const fileName = String(item?.source_file_name || "").trim() || `batch-import-${index + 1}.json`;
    const parsed = parseLegacyProducts(rawJson, {
      currentScheduleId: currentSeasonScheduleId,
    });
    if (parsed.length === 0) {
      const err = new Error("legacy_cards_not_found");
      err.statusCode = 400;
      err.details = [`第 ${index + 1} 份 JSON 没有解析到卡片：${fileName}`];
      throw err;
    }
    files.push({
      source_file_name: fileName,
      parsed_count: parsed.length,
      raw_json: rawJson,
    });
    parsedProducts.push(...parsed);
  });

  if (parsedProducts.length === 0) {
    const err = new Error("legacy_cards_not_found");
    err.statusCode = 400;
    throw err;
  }

  const repository = getAdminImportsRepository();
  const result = await repository.importCards({
    sourceType: "upload",
    sourceFileName:
      files.length === 1 ? files[0].source_file_name : `batch-import-${files.length}-files.json`,
    rawJson: {
      source: "upload_batch",
      file_count: files.length,
      files: files.map((item) => ({
        source_file_name: item.source_file_name,
        parsed_count: item.parsed_count,
        raw_json: item.raw_json,
      })),
    },
    importedBy: actorUser.id,
    parsedProducts,
  });

  return {
    ...buildImportSummary(result),
    batch_file_count: files.length,
    files: files.map((item) => ({
      source_file_name: item.source_file_name,
      parsed_count: item.parsed_count,
    })),
  };
}

async function importCurrentUserHelperInventories(actorUser) {
  if (!useFileStore()) {
    const err = new Error("helper_inventory_import_not_supported_in_db_mode");
    err.statusCode = 501;
    throw err;
  }

  const inventories = helperStore.listHelperInventories(actorUser.id);
  const rechargeConfigRepository = getAdminRechargeConfigRepository();
  const rechargeConfig = await rechargeConfigRepository.getRechargeConfig();
  const currentSeasonScheduleId = getConfiguredCurrentSeasonScheduleId(rechargeConfig);
  const parsedProducts = parseHelperInventoryProducts(inventories, {
    currentScheduleId: currentSeasonScheduleId,
  });
  if (parsedProducts.length === 0) {
    const err = new Error("helper_inventory_cards_not_found");
    err.statusCode = 400;
    throw err;
  }

  const seasonLabel = String(rechargeConfig?.season_member_season_label || "").trim();
  const repository = getAdminImportsRepository();
  const result = await repository.importCards({
    sourceType: "helper_bridge",
    sourceFileName: seasonLabel ? `helper-inventories-${seasonLabel}.json` : "helper-inventories.json",
    rawJson: buildHelperInventoryImportRawJson(inventories, {
      currentScheduleId: currentSeasonScheduleId,
      seasonLabel,
    }),
    importedBy: actorUser.id,
    parsedProducts,
  });
  return buildImportSummary(result);
}

async function importManualHelperInventories(actorUser, body = {}) {
  if (!useFileStore()) {
    const err = new Error("helper_inventory_import_not_supported_in_db_mode");
    err.statusCode = 501;
    throw err;
  }

  const imports = Array.isArray(body.imports) ? body.imports : [];
  if (imports.length === 0) {
    const err = new Error("helper_inventory_imports_required");
    err.statusCode = 400;
    throw err;
  }

  const bindings = helperStore.listHelperBindings(actorUser.id);
  const pendingInventories = new Map();
  const importedInventories = [];

  imports.forEach((item, index) => {
    const rawJson = unwrapRawJson(item?.raw_json);
    const fileName = String(item?.source_file_name || "").trim() || `helper-inventory-${index + 1}.json`;
    const syncedAt = new Date().toISOString();
    const parsed = normalizeHelperInventoryUpload(rawJson, {
      syncedAt,
      roleName: String(item?.role_name || "").trim(),
      server: String(item?.server || "").trim(),
    });
    if (!Array.isArray(parsed?.items) || parsed.items.length === 0) {
      const err = new Error("helper_inventory_cards_not_found");
      err.statusCode = 400;
      err.details = [`第 ${index + 1} 份 JSON 没有解析到功法：${fileName}`];
      throw err;
    }

    const splitGroups = splitHelperInventoryByRole(parsed);
    splitGroups.forEach((group, groupIndex) => {
      const groupPayload = {
        ...parsed,
        binding_id: splitGroups.length === 1 ? parsed?.binding_id : null,
        summary: {
          ...(parsed.summary || {}),
          role_id: String(group.roleId || "").trim(),
          legacy_count: group.items.length,
        },
        items: group.items,
      };
      const matchedBinding = resolveHelperInventoryBinding(bindings, groupPayload);
      const summary = {
        ...groupPayload.summary,
        role_id:
          String(groupPayload?.summary?.role_id || groupPayload?.summary?.roleId || "").trim() ||
          String(matchedBinding?.game_role_id || "").trim(),
        role_name:
          String(groupPayload?.summary?.role_name || groupPayload?.summary?.roleName || "").trim() ||
          String(item?.role_name || "").trim() ||
          String(matchedBinding?.nickname || matchedBinding?.game_role_name || "").trim(),
        server:
          String(groupPayload?.summary?.server || "").trim() ||
          String(item?.server || "").trim() ||
          String(matchedBinding?.game_server || "").trim(),
        bind_token_id:
          String(groupPayload?.summary?.bind_token_id || groupPayload?.summary?.bindTokenId || "").trim() ||
          String(matchedBinding?.bind_token_id || "").trim(),
        synced_at: String(groupPayload?.summary?.synced_at || "").trim() || syncedAt,
        legacy_count: group.items.length,
        fragment_count: Number(groupPayload?.summary?.fragment_count || 0),
      };
      const mergeKey = getInventoryMergeKey(matchedBinding, summary, `${index}-${groupIndex}`);
      if (!pendingInventories.has(mergeKey)) {
        pendingInventories.set(mergeKey, {
          matchedBinding,
          parsedBindingId: groupPayload?.binding_id ?? null,
          summary,
          itemMap: new Map(),
          sourceFileNames: new Set(),
        });
      }
      const pending = pendingInventories.get(mergeKey);
      pending.sourceFileNames.add(fileName);
      group.items.forEach((inventoryItem, itemIndex) => {
        pending.itemMap.set(
          getInventoryItemMergeKey(inventoryItem, `${index}-${groupIndex}-${itemIndex}`),
          inventoryItem
        );
      });
      pending.summary = {
        ...pending.summary,
        ...summary,
        legacy_count: pending.itemMap.size,
        source_file_names: Array.from(pending.sourceFileNames),
      };
    });
  });

  pendingInventories.forEach((pending) => {
    const items = Array.from(pending.itemMap.values());
    const created = helperStore.upsertHelperInventory(actorUser.id, {
      binding_id: pending.matchedBinding?.id ?? pending.parsedBindingId ?? null,
      source_type: "helper_bridge",
      summary: {
        ...pending.summary,
        legacy_count: items.length,
        source_file_names: Array.from(pending.sourceFileNames),
      },
      items,
    });

    importedInventories.push({
      inventory_id: Number(created?.id || 0),
      binding_id:
        created?.binding_id === undefined || created?.binding_id === null
          ? null
          : Number(created.binding_id),
      source_file_name: Array.from(pending.sourceFileNames).join(", "),
      role_id: String(created?.summary?.role_id || "").trim() || "",
      role_name: String(created?.summary?.role_name || "").trim() || "",
      server: String(created?.summary?.server || "").trim() || "",
      item_count: Array.isArray(created?.items) ? created.items.length : 0,
      matched_binding_name:
        String(created?.binding?.nickname || created?.binding?.game_role_name || "").trim() || "",
    });
  });

  const keptInventoryIds = importedInventories
    .map((item) => Number(item.inventory_id || 0))
    .filter((item) => Number.isInteger(item) && item > 0);
  const removedInventories = helperStore.pruneHelperInventories(
    actorUser.id,
    keptInventoryIds,
    actorUser.id
  );

  let productImport = null;
  if (body.import_products) {
    productImport = await importCurrentUserHelperInventories(actorUser);
  }

  return {
    imported_inventory_count: importedInventories.length,
    removed_inventory_count: removedInventories.length,
    inventories: importedInventories,
    merged_item_count: helperStore.listMergedHelperInventoryItems(actorUser.id).length,
    product_import: productImport,
  };
}

module.exports = {
  importCardsJson,
  importCardsJsonBatch,
  importCurrentUserHelperInventories,
  importManualHelperInventories,
};
