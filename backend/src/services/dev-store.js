const fs = require("fs");
const path = require("path");
const { buildOrderEvents, repriceProducts } = require("./pricing");
const { BUNDLE_SKU_SEEDS, RETIRED_BUNDLE_CODES } = require("../config/catalog-config");
const { hashPassword, verifyPassword } = require("./password-auth");

const dataPath = path.resolve(__dirname, "..", "..", "dev-data.json");

function now() {
  return new Date().toISOString();
}

function defaultData() {
  return {
    users: [],
    productImports: [],
    products: [],
    bundleSkus: [],
    quotaAccounts: [],
    quotaLogs: [],
    orders: [],
    orderItems: [],
    auditLogs: [],
  };
}

function seedBundleSkus(data) {
  const existingByCode = new Map((data.bundleSkus || []).map((item) => [item.code, item]));
  const referencedBundleIds = new Set(
    (data.orderItems || [])
      .map((item) => Number(item.bundle_sku_id))
      .filter(Boolean)
  );
  const seeded = [];
  let changed = false;

  for (const seed of BUNDLE_SKU_SEEDS) {
    const existing = existingByCode.get(seed.code);
    if (existing) {
      seeded.push({
        ...existing,
        description: existing.description ?? seed.description,
        tags: Array.isArray(existing.tags) ? existing.tags : seed.tags,
        display_rank:
          existing.display_rank === undefined ? seed.display_rank : existing.display_rank,
      });
      continue;
    }

    changed = true;
    seeded.push({
      id: nextId(seeded),
      code: seed.code,
      name: seed.name,
      description: seed.description,
      tags: seed.tags,
      image_url: seed.image_url || null,
      price_quota: seed.price_quota,
      stock: seed.stock,
      status: seed.status || "on_sale",
      display_rank: seed.display_rank || 999,
      created_at: now(),
      updated_at: now(),
    });
  }

  for (const existing of data.bundleSkus || []) {
    if (BUNDLE_SKU_SEEDS.some((seed) => seed.code === existing.code)) continue;
    if (!referencedBundleIds.has(Number(existing.id))) {
      changed = true;
      continue;
    }

    const nextStatus = RETIRED_BUNDLE_CODES.includes(existing.code) ? "off_sale" : existing.status;
    if (nextStatus !== existing.status) {
      changed = true;
    }

    seeded.push({
      ...existing,
      status: nextStatus,
    });
  }

  if ((data.bundleSkus || []).length !== seeded.length) {
    changed = true;
  }

  data.bundleSkus = seeded;
  return changed;
}

function removeLegacySeedJunk(data) {
  const importIdsToRemove = new Set(
    (data.productImports || [])
      .filter(
        (item) =>
          item?.source_file_name === "x.json" &&
          item?.raw_json &&
          typeof item.raw_json === "object" &&
          !Array.isArray(item.raw_json) &&
          Object.keys(item.raw_json).length === 0
      )
      .map((item) => Number(item.id))
      .filter(Boolean)
  );

  if (importIdsToRemove.size === 0) {
    return false;
  }

  const initialProductCount = (data.products || []).length;
  const initialImportCount = (data.productImports || []).length;

  data.products = (data.products || []).filter((item) => !importIdsToRemove.has(Number(item.import_id)));
  data.productImports = (data.productImports || []).filter(
    (item) => !importIdsToRemove.has(Number(item.id))
  );

  return (
    data.products.length !== initialProductCount || data.productImports.length !== initialImportCount
  );
}

function repriceDataProducts(data) {
  const pricedProducts = repriceProducts(
    data.products || [],
    buildOrderEvents(data.orders || [], data.orderItems || [])
  );

  const pricedById = new Map(pricedProducts.map((item) => [Number(item.id), item]));
  data.products = (data.products || []).map((product) => {
    const priced = pricedById.get(Number(product.id));
    if (!priced) return product;
    return {
      ...product,
      price_quota: priced.price_quota,
      pricing_meta: priced.pricing_meta,
    };
  });
}

function normalizeData(data) {
  const next = {
    ...defaultData(),
    ...data,
  };

  let changed = seedBundleSkus(next);
  if (removeLegacySeedJunk(next)) {
    changed = true;
  }
  next.products = (next.products || []).map((product) => {
    const normalized = {
      ...product,
      manual_price_quota:
        product?.manual_price_quota === undefined ? null : product.manual_price_quota,
      pricing_meta:
        product?.pricing_meta && typeof product.pricing_meta === "object"
          ? product.pricing_meta
          : {},
    };
    if (product && product.status === "draft") {
      changed = true;
      normalized.status = "on_sale";
    }
    if (product?.manual_price_quota === undefined || !product?.pricing_meta) {
      changed = true;
    }
    return normalized;
  });
  next.orderItems = (next.orderItems || []).map((item) => {
    if (item?.item_kind === undefined || item?.bundle_sku_id === undefined) {
      changed = true;
    }
    return {
      ...item,
      item_kind: item?.item_kind || "card",
      product_id: item?.product_id === undefined ? null : item.product_id,
      bundle_sku_id: item?.bundle_sku_id === undefined ? null : item.bundle_sku_id,
    };
  });
  next.users = (next.users || []).map((user) => {
    const normalized = {
      ...user,
      auth_provider: user?.auth_provider || "bind",
      password_hash: user?.password_hash || null,
    };
    if (!user?.auth_provider || user?.password_hash === undefined) {
      changed = true;
    }
    return normalized;
  });

  if (changed) {
    repriceDataProducts(next);
    writeData(next);
  }

  return next;
}

function readData() {
  if (!fs.existsSync(dataPath)) {
    return defaultData();
  }
  try {
    return normalizeData(JSON.parse(fs.readFileSync(dataPath, "utf8")));
  } catch {
    return defaultData();
  }
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeUser(user) {
  if (!user) return null;
  const next = { ...clone(user) };
  delete next.password_hash;
  return next;
}

function ensureQuotaAccount(data, userId) {
  let account = data.quotaAccounts.find((item) => item.user_id === Number(userId));
  if (!account) {
    account = { user_id: Number(userId), balance: 0, updated_at: now() };
    data.quotaAccounts.push(account);
  }
  return account;
}

function withQuota(user, data) {
  const account = ensureQuotaAccount(data, user.id);
  return {
    ...sanitizeUser(user),
    quota_balance: account.balance,
  };
}

function normalizeCardProduct(product) {
  return {
    ...clone(product),
    item_kind: "card",
    item_id: Number(product.id),
    stock_label: `库存 ${Number(product.stock || 0)}`,
  };
}

function normalizeBundleSku(bundle) {
  return {
    ...clone(bundle),
    item_kind: "bundle",
    item_id: Number(bundle.id),
    legacy_id: 0,
    uid: bundle.code,
    main_attrs: bundle.description || "",
    ext_attrs: Array.isArray(bundle.tags) ? bundle.tags.join(" | ") : "",
    attack_value: 0,
    hp_value: 0,
    pricing_meta: {
      source: "bundle",
      dominant_reason_label: "套餐固定价",
    },
    stock_label: bundle.stock === null || bundle.stock === undefined ? "不限量" : `库存 ${bundle.stock}`,
  };
}

function addAuditLog(data, { actorUserId, targetType, targetId, action, detail = null }) {
  data.auditLogs.unshift({
    id: nextId(data.auditLogs),
    actor_user_id: actorUserId || null,
    target_type: targetType,
    target_id: Number(targetId),
    action,
    detail,
    created_at: now(),
  });
}

function bindUser(payload) {
  const data = readData();
  const timestamp = now();
  let user = data.users.find(
    (item) =>
      item.game_role_id === payload.game_role_id && item.game_server === payload.game_server
  );

  if (!user) {
    user = {
      id: nextId(data.users),
      role: data.users.length === 0 ? "admin" : "user",
      status: "active",
      auth_provider: "bind",
      game_role_id: payload.game_role_id,
      game_server: payload.game_server,
      game_role_name: payload.game_role_name,
      bind_token_id: payload.bind_token_id || null,
      nickname: payload.nickname || null,
      password_hash: null,
      created_at: timestamp,
      updated_at: timestamp,
    };
    data.users.push(user);
  } else {
    user.game_role_name = payload.game_role_name;
    user.bind_token_id = payload.bind_token_id || null;
    user.nickname = payload.nickname || user.nickname || null;
    user.auth_provider = user.auth_provider || "bind";
    user.updated_at = timestamp;
  }

  ensureQuotaAccount(data, user.id);
  writeData(data);
  return withQuota(user, data);
}

async function registerPasswordUser(payload) {
  const data = readData();
  const timestamp = now();
  const gameRoleId = String(payload.game_role_id || "").trim();
  const nickname = payload.nickname ? String(payload.nickname).trim() : null;

  const existing = data.users.find(
    (item) => item.auth_provider === "password" && item.game_role_id === gameRoleId
  );
  if (existing) {
    const err = new Error("game_role_id_taken");
    err.statusCode = 409;
    throw err;
  }

  const user = {
    id: nextId(data.users),
    role: data.users.length === 0 ? "admin" : "user",
    status: "active",
    auth_provider: "password",
    game_role_id: gameRoleId,
    game_server: "direct",
    game_role_name: nickname || gameRoleId,
    bind_token_id: null,
    nickname,
    password_hash: await hashPassword(payload.password),
    created_at: timestamp,
    updated_at: timestamp,
  };

  data.users.push(user);
  ensureQuotaAccount(data, user.id);
  writeData(data);
  return withQuota(user, data);
}

async function loginPasswordUser(gameRoleId, password) {
  const data = readData();
  const user = data.users.find(
    (item) => item.auth_provider === "password" && item.game_role_id === String(gameRoleId || "").trim()
  );
  if (!user) {
    const err = new Error("invalid_credentials");
    err.statusCode = 401;
    throw err;
  }
  const matched = await verifyPassword(password, user.password_hash);
  if (!matched) {
    const err = new Error("invalid_credentials");
    err.statusCode = 401;
    throw err;
  }
  if (user.status !== "active") {
    const err = new Error("user_disabled");
    err.statusCode = 403;
    throw err;
  }
  return withQuota(user, data);
}

function getUserById(userId) {
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  return user ? withQuota(user, data) : null;
}

function listProducts({ keyword = "", sort = "created_desc", publicOnly = false } = {}) {
  const data = readData();
  const cards = data.products.filter((item) => (publicOnly ? item.status === "on_sale" : true));
  const bundles = (data.bundleSkus || []).filter((item) => (publicOnly ? item.status === "on_sale" : true));
  let products = [...cards.map(normalizeCardProduct), ...bundles.map(normalizeBundleSku)];

  const trimmed = String(keyword || "").trim().toLowerCase();
  if (trimmed) {
    products = products.filter((item) =>
      [item.name, item.uid, item.main_attrs, item.ext_attrs, item.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmed))
    );
  }

  const sorters = {
    created_desc: (a, b) => String(b.created_at).localeCompare(String(a.created_at)),
    price_asc: (a, b) => a.price_quota - b.price_quota || b.id - a.id,
    price_desc: (a, b) => b.price_quota - a.price_quota || b.id - a.id,
    attack_desc: (a, b) => b.attack_value - a.attack_value || b.id - a.id,
    hp_desc: (a, b) => b.hp_value - a.hp_value || b.id - a.id,
  };
  products.sort(sorters[sort] || sorters.created_desc);
  return clone(products);
}

function getProductById(productId, { publicOnly = false, itemKind = "card" } = {}) {
  const data = readData();
  if (itemKind === "bundle") {
    const bundle = (data.bundleSkus || []).find(
      (item) => item.id === Number(productId) && (!publicOnly || item.status === "on_sale")
    );
    return bundle ? normalizeBundleSku(bundle) : null;
  }
  const product = data.products.find(
    (item) => item.id === Number(productId) && (!publicOnly || item.status === "on_sale")
  );
  return product ? normalizeCardProduct(product) : null;
}

function getQuota(userId) {
  const data = readData();
  const account = ensureQuotaAccount(data, Number(userId));
  writeData(data);
  return clone(account);
}

function hydrateOrders(data, orders) {
  return orders.map((order) => {
    const user = data.users.find((item) => item.id === order.user_id);
    return {
      ...clone(order),
      game_role_id: user?.game_role_id || null,
      game_server: user?.game_server || null,
      game_role_name: user?.game_role_name || null,
      nickname: user?.nickname || null,
      items: clone(data.orderItems.filter((item) => item.order_id === order.id)),
    };
  });
}

function listBundleSkus({ publicOnly = false } = {}) {
  const data = readData();
  const bundles = (data.bundleSkus || [])
    .filter((item) => (!publicOnly || item.status === "on_sale"))
    .sort((a, b) => Number(a.display_rank || 999) - Number(b.display_rank || 999));
  return clone(bundles.map(normalizeBundleSku));
}

function listOrders({ userId = null, orderId = null, status = null, keyword = "", limit = 100 } = {}) {
  const data = readData();
  let orders = data.orders.slice();
  if (orderId !== null) {
    orders = orders.filter((item) => item.id === Number(orderId));
  }
  if (userId !== null) {
    orders = orders.filter((item) => item.user_id === Number(userId));
  }
  if (status !== null && status !== undefined && status !== "" && status !== "all") {
    orders = orders.filter((item) => item.status === status);
  }
  const trimmedKeyword = String(keyword || "").trim().toLowerCase();
  if (trimmedKeyword) {
    orders = orders.filter((order) => {
      const user = data.users.find((item) => item.id === order.user_id);
      const items = data.orderItems.filter((item) => item.order_id === order.id);
      return [
        String(order.id),
        user?.game_role_id,
        user?.game_server,
        user?.game_role_name,
        user?.nickname,
        ...items.map((item) => item.product_name),
        ...items.map((item) => String(item.product_id)),
        ...items.map((item) => String(item.bundle_sku_id)),
        ...items.map((item) => item.item_kind),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(trimmedKeyword));
    });
  }
  orders.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return hydrateOrders(data, orders.slice(0, limit));
}

function applyQuotaChange(data, { userId, changeAmount, type, orderId = null, remark = null }) {
  const account = ensureQuotaAccount(data, userId);
  const nextBalance = Number(account.balance) + Number(changeAmount);
  if (nextBalance < 0) {
    const err = new Error("insufficient_quota");
    err.statusCode = 400;
    throw err;
  }
  account.balance = nextBalance;
  account.updated_at = now();
  data.quotaLogs.push({
    id: nextId(data.quotaLogs),
    user_id: Number(userId),
    change_amount: Number(changeAmount),
    type,
    order_id: orderId ? Number(orderId) : null,
    remark,
    created_at: now(),
  });
  return nextBalance;
}

function importCards({ sourceType, sourceFileName, rawJson, importedBy, parsedProducts }) {
  const data = readData();
  const importId = nextId(data.productImports);
  const importedAt = now();

  const importRow = {
    id: importId,
    source_type: sourceType || "upload",
    source_file_name: sourceFileName || null,
    raw_json: rawJson,
    imported_by: importedBy || null,
    created_at: importedAt,
  };
  data.productImports.push(importRow);

  parsedProducts.forEach((product) => {
    let existing = data.products.find((item) => item.uid === product.uid);
    if (!existing) {
      existing = {
        id: nextId(data.products),
        import_id: importId,
        legacy_id: product.legacy_id,
        uid: product.uid,
        name: product.name,
        image_url: product.image_url || null,
        attack_value: product.attack_value || 0,
        hp_value: product.hp_value || 0,
        main_attrs: product.main_attrs || "",
        ext_attrs: product.ext_attrs || "",
        price_quota: 0,
        manual_price_quota: null,
        pricing_meta: {},
        stock: Number(product.stock) || 1,
        status: "on_sale",
        created_at: importedAt,
        updated_at: importedAt,
      };
      data.products.push(existing);
    } else {
      existing.import_id = importId;
      existing.legacy_id = product.legacy_id;
      existing.name = product.name;
      existing.image_url = existing.image_url || product.image_url || null;
      existing.attack_value = product.attack_value || 0;
      existing.hp_value = product.hp_value || 0;
      existing.main_attrs = product.main_attrs || "";
      existing.ext_attrs = product.ext_attrs || "";
      existing.stock = Number(product.stock) || 1;
      existing.status = "on_sale";
      existing.updated_at = importedAt;
    }
  });

  repriceDataProducts(data);

  addAuditLog(data, {
    actorUserId: importedBy,
    targetType: "import",
    targetId: importId,
    action: "cards_import",
    detail: {
      source_type: importRow.source_type,
      source_file_name: importRow.source_file_name,
      parsed_count: parsedProducts.length,
    },
  });

  writeData(data);
  return { import: clone(importRow), parsed_count: parsedProducts.length };
}

function listAdminProducts() {
  const data = readData();
  return clone(
    data.products
      .map((product) => {
        const imported = data.productImports.find((item) => item.id === product.import_id);
        return {
          ...product,
          source_type: imported?.source_type || null,
          source_file_name: imported?.source_file_name || null,
          imported_at: imported?.created_at || null,
        };
      })
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
  );
}

function listAdminBundles() {
  const data = readData();
  return clone(
    (data.bundleSkus || []).sort(
      (a, b) =>
        Number(a.display_rank || 999) - Number(b.display_rank || 999) ||
        String(b.updated_at).localeCompare(String(a.updated_at))
    )
  );
}

function updateProduct(productId, patch, actorUserId) {
  const data = readData();
  const product = data.products.find((item) => item.id === Number(productId));
  if (!product) return null;

  const nextPatch = { ...patch };
  if (Object.prototype.hasOwnProperty.call(nextPatch, "price_quota")) {
    product.manual_price_quota = Number(nextPatch.price_quota);
    delete nextPatch.price_quota;
  }

  Object.assign(product, nextPatch, { updated_at: now() });
  repriceDataProducts(data);
  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: product.id,
    action: "product_update",
    detail: {
      ...nextPatch,
      ...(Object.prototype.hasOwnProperty.call(patch, "price_quota")
        ? { manual_price_quota: Number(patch.price_quota) }
        : {}),
    },
  });
  writeData(data);
  return clone(data.products.find((item) => item.id === Number(productId)));
}

function updateProductStatus(productId, status, actorUserId) {
  return updateProduct(productId, { status }, actorUserId);
}

function updateBundleSku(bundleId, patch, actorUserId) {
  const data = readData();
  const bundle = (data.bundleSkus || []).find((item) => item.id === Number(bundleId));
  if (!bundle) return null;

  Object.assign(bundle, patch, { updated_at: now() });
  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: bundle.id,
    action: "bundle_update",
    detail: patch,
  });
  writeData(data);
  return clone(bundle);
}

function updateBundleSkuStatus(bundleId, status, actorUserId) {
  return updateBundleSku(bundleId, { status }, actorUserId);
}

function bulkUpdateProductStatus(productIds, status, actorUserId) {
  const data = readData();
  const normalizedIds = [...new Set(productIds.map((item) => Number(item)).filter(Boolean))];
  let updatedCount = 0;

  data.products.forEach((product) => {
    if (!normalizedIds.includes(Number(product.id))) return;
    product.status = status;
    product.updated_at = now();
    updatedCount += 1;
  });

  if (updatedCount > 0) {
    addAuditLog(data, {
      actorUserId,
      targetType: "product",
      targetId: normalizedIds[0],
      action: "product_bulk_status_update",
      detail: { product_ids: normalizedIds, status, updated_count: updatedCount },
    });
    writeData(data);
  }

  return { updated_count: updatedCount, status };
}

function bulkUpdateProducts(productIds, patch, actorUserId) {
  const data = readData();
  const normalizedIds = [...new Set(productIds.map((item) => Number(item)).filter(Boolean))];
  let updatedCount = 0;
  const nextPatch = { ...patch };
  const manualPrice =
    Object.prototype.hasOwnProperty.call(nextPatch, "price_quota") &&
    Number.isInteger(Number(nextPatch.price_quota))
      ? Number(nextPatch.price_quota)
      : null;

  if (Object.prototype.hasOwnProperty.call(nextPatch, "price_quota")) {
    delete nextPatch.price_quota;
  }

  data.products.forEach((product) => {
    if (!normalizedIds.includes(Number(product.id))) return;
    if (manualPrice !== null) {
      product.manual_price_quota = manualPrice;
    }
    Object.assign(product, nextPatch, { updated_at: now() });
    updatedCount += 1;
  });

  if (updatedCount > 0) {
    repriceDataProducts(data);
    addAuditLog(data, {
      actorUserId,
      targetType: "product",
      targetId: normalizedIds[0],
      action: "product_bulk_update",
      detail: {
        product_ids: normalizedIds,
        patch: {
          ...nextPatch,
          ...(manualPrice !== null ? { manual_price_quota: manualPrice } : {}),
        },
        updated_count: updatedCount,
      },
    });
    writeData(data);
  }

  return {
    updated_count: updatedCount,
    patch: {
      ...nextPatch,
      ...(manualPrice !== null ? { manual_price_quota: manualPrice } : {}),
    },
  };
}

function listUsers() {
  const data = readData();
  return clone(
    data.users
      .map((user) => withQuota(user, data))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  );
}

function changeUserQuota(userId, changeAmount, remark, actorUserId) {
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) return null;
  const balance = applyQuotaChange(data, {
    userId,
    changeAmount,
    type: changeAmount > 0 ? "admin_add" : "admin_subtract",
    remark: remark || null,
  });
  addAuditLog(data, {
    actorUserId,
    targetType: "user",
    targetId: Number(userId),
    action: "user_quota_change",
    detail: { change_amount: Number(changeAmount), next_balance: balance },
  });
  writeData(data);
  return { user_id: Number(userId), balance };
}

function updateUserStatus(userId, status, actorUserId) {
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
  if (!user) return null;
  user.status = status;
  user.updated_at = now();
  addAuditLog(data, {
    actorUserId,
    targetType: "user",
    targetId: user.id,
    action: "user_status_update",
    detail: { status },
  });
  writeData(data);
  return withQuota(user, data);
}

function createOrder(userId, itemId, itemKind = "card") {
  const data = readData();
  const user = data.users.find((item) => item.id === Number(userId));
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

  const isBundle = itemKind === "bundle";
  const item = isBundle
    ? (data.bundleSkus || []).find((bundle) => bundle.id === Number(itemId))
    : data.products.find((product) => product.id === Number(itemId));

  if (!item) {
    const err = new Error(isBundle ? "bundle_not_found" : "product_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (item.status !== "on_sale") {
    const err = new Error(isBundle ? "bundle_not_on_sale" : "product_not_on_sale");
    err.statusCode = 400;
    throw err;
  }
  if (!isBundle && Number(item.stock) <= 0) {
    const err = new Error("product_out_of_stock");
    err.statusCode = 400;
    throw err;
  }
  if (isBundle && item.stock !== null && item.stock !== undefined && Number(item.stock) <= 0) {
    const err = new Error("bundle_out_of_stock");
    err.statusCode = 400;
    throw err;
  }

  applyQuotaChange(data, {
    userId,
    changeAmount: -Number(item.price_quota),
    type: "order_deduct",
    remark: `order create for ${itemKind} ${item.id}`,
  });

  const order = {
    id: nextId(data.orders),
    user_id: Number(userId),
    total_quota: Number(item.price_quota),
    status: "pending",
    remark: null,
    created_at: now(),
    updated_at: now(),
  };
  data.orders.push(order);

  data.orderItems.push({
    id: nextId(data.orderItems),
    order_id: order.id,
    item_kind: itemKind,
    product_id: isBundle ? null : item.id,
    bundle_sku_id: isBundle ? item.id : null,
    product_name: item.name,
    product_snapshot: clone(item),
    price_quota: Number(item.price_quota),
    created_at: now(),
  });

  if (isBundle) {
    if (item.stock !== null && item.stock !== undefined) {
      item.stock = Number(item.stock) - 1;
      if (item.stock <= 0) {
        item.status = "sold";
      }
    }
    item.updated_at = now();
  } else {
    item.stock = Number(item.stock) - 1;
    item.updated_at = now();
    if (item.stock <= 0) {
      item.status = "sold";
    }
  }

  const quotaLog = data.quotaLogs[data.quotaLogs.length - 1];
  if (quotaLog && quotaLog.type === "order_deduct" && !quotaLog.order_id) {
    quotaLog.order_id = order.id;
  }

  addAuditLog(data, {
    actorUserId: userId,
    targetType: "order",
    targetId: order.id,
    action: "order_create",
    detail: { item_kind: itemKind, item_id: item.id, total_quota: item.price_quota },
  });

  repriceDataProducts(data);
  writeData(data);
  return listOrders({ orderId: order.id, userId: Number(userId), limit: 1 })[0];
}

function updateOrderStatus(orderId, status, remark, actorUserId) {
  const data = readData();
  const order = data.orders.find((item) => item.id === Number(orderId));
  if (!order) return null;
  const previousStatus = order.status;
  if (order.status === "cancelled" && status !== "cancelled") {
    const err = new Error("invalid_order_transition");
    err.statusCode = 400;
    throw err;
  }

  if (status === "cancelled" && order.status !== "cancelled") {
    const items = data.orderItems.filter((item) => item.order_id === order.id);
    items.forEach((item) => {
      if (item.item_kind === "bundle") {
        const bundle = (data.bundleSkus || []).find((entry) => entry.id === item.bundle_sku_id);
        if (bundle) {
          if (bundle.stock !== null && bundle.stock !== undefined) {
            bundle.stock = Number(bundle.stock) + 1;
          }
          if (bundle.status === "sold") bundle.status = "on_sale";
          bundle.updated_at = now();
        }
        return;
      }

      const product = data.products.find((p) => p.id === item.product_id);
      if (product) {
        product.stock = Number(product.stock) + 1;
        if (product.status === "sold") product.status = "on_sale";
        product.updated_at = now();
      }
    });
    applyQuotaChange(data, {
      userId: order.user_id,
      changeAmount: Number(order.total_quota),
      type: "order_refund",
      orderId: order.id,
      remark: remark || "admin cancel order",
    });
  }

  order.status = status;
  order.remark = remark || null;
  order.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "order",
    targetId: order.id,
    action: "order_status_update",
    detail: { from: previousStatus, to: status, remark: remark || null },
  });

  repriceDataProducts(data);
  writeData(data);
  return listOrders({ orderId: order.id, limit: 1 })[0];
}

function updateOrderRemark(orderId, remark, actorUserId) {
  const data = readData();
  const order = data.orders.find((item) => item.id === Number(orderId));
  if (!order) return null;

  order.remark = remark || null;
  order.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "order",
    targetId: order.id,
    action: "order_remark_update",
    detail: { remark: order.remark },
  });

  writeData(data);
  return listOrders({ orderId: order.id, limit: 1 })[0];
}

function clearProductManualPrice(productId, actorUserId) {
  const data = readData();
  const product = data.products.find((item) => item.id === Number(productId));
  if (!product) return null;

  product.manual_price_quota = null;
  product.updated_at = now();
  repriceDataProducts(data);

  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: product.id,
    action: "product_manual_price_clear",
    detail: null,
  });

  writeData(data);
  return clone(data.products.find((item) => item.id === Number(productId)));
}

function recalculatePricing(actorUserId = null) {
  const data = readData();
  repriceDataProducts(data);
  addAuditLog(data, {
    actorUserId,
    targetType: "product",
    targetId: 0,
    action: "product_pricing_recalculate",
    detail: { product_count: data.products.length },
  });
  writeData(data);
  return clone(data.products);
}

function listAuditLogs() {
  const data = readData();
  return clone(
    data.auditLogs.slice(0, 200).map((log) => {
      const actor = data.users.find((item) => item.id === log.actor_user_id);
      return {
        ...log,
        actor_role_name: actor?.game_role_name || null,
        actor_nickname: actor?.nickname || null,
      };
    })
  );
}

module.exports = {
  bindUser,
  registerPasswordUser,
  loginPasswordUser,
  getUserById,
  listProducts,
  getProductById,
  listBundleSkus,
  getQuota,
  listOrders,
  importCards,
  listAdminProducts,
  listAdminBundles,
  updateProduct,
  updateProductStatus,
  updateBundleSku,
  updateBundleSkuStatus,
  bulkUpdateProductStatus,
  bulkUpdateProducts,
  clearProductManualPrice,
  recalculatePricing,
  listUsers,
  changeUserQuota,
  updateUserStatus,
  createOrder,
  updateOrderStatus,
  updateOrderRemark,
  listAuditLogs,
};
