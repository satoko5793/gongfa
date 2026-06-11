const { AUDIT_ACTIONS } = require("../audit-actions");
const { findDynamicBundleById, isDynamicBundleItem } = require("../dynamic-bundles");
const {
  assertPublicProductDisplayAllowed,
  assertQuotaPurchaseAllowed,
} = require("../purchase-policy");
const { QUOTA_LOG_TYPES } = require("../quota-log-types");
const { RECHARGE_ORDER_STATUS } = require("../recharge-order-status");
const { getStoreRuntime } = require("./core/runtime-context");
const {
  hydrateOrders,
  hydrateRechargeOrders,
  hydrateSingleRechargeOrder,
  paginateItems,
  filterOrdersForAdmin,
  filterRechargeOrdersForAdmin,
} = require("./shared-store-views");

function getDep(name) {
  const runtime = getStoreRuntime();
  if (typeof runtime[name] !== "function" && runtime[name] === undefined) {
    throw new Error(`store_runtime_dependency_missing:${name}`);
  }
  return runtime[name];
}

function getDynamicBundleForOrder(data, itemId, { normalizeCardProduct, getAvailableProductStock, bundleSelection = null }) {
  const cards = (data.products || [])
    .filter((product) => product.status === "on_sale" && getAvailableProductStock(data, product) > 0)
    .map((product) => normalizeCardProduct(product, { includePricingMeta: false }));
  return findDynamicBundleById(cards, itemId, bundleSelection);
}

function applyDynamicBundleStockChange(data, bundle, amount, now) {
  const components = Array.isArray(bundle?.bundle_components) ? bundle.bundle_components : [];
  for (const component of components) {
    const product = (data.products || []).find((item) => Number(item.id) === Number(component.product_id));
    if (!product) continue;
    product.stock = Math.max(0, Number(product.stock || 0) + Number(amount || 0));
    if (product.stock <= 0) {
      product.status = "sold";
    } else if (product.status === "sold") {
      product.status = "on_sale";
    }
    product.updated_at = now();
  }
}

function listOrders({
  userId = null,
  orderId = null,
  status = null,
  keyword = "",
  limit = 100,
  offset = 0,
} = {}) {
  const readData = getDep("readData");
  const data = readData({ mutable: false });
  const orders = filterOrdersForAdmin(data, { userId, orderId, status, keyword });
  const paged = paginateItems(orders, { limit, offset });
  return hydrateOrders(data, paged.items);
}

function createExternalOrder(
  itemId,
  itemKind = "card",
  { buyerLabel, remark = null } = {},
  actorUserId
) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const nextId = getDep("nextId");
  const now = getDep("now");
  const clone = getDep("clone");
  const ensureProductNotBlockedByAuction = getDep("ensureProductNotBlockedByAuction");
  const getEffectiveQuotaPrice = getDep("getEffectiveQuotaPrice");
  const addAuditLog = getDep("addAuditLog");
  const repriceDataProducts = getDep("repriceDataProducts");

  const data = readData();
  const isBundle = itemKind === "bundle";
  const item = isBundle
    ? (data.bundleSkus || []).find((bundle) => bundle.id === Number(itemId))
    : data.products.find((product) => product.id === Number(itemId));

  if (!item) {
    const err = new Error(isBundle ? "bundle_not_found" : "product_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (!isBundle) {
    ensureProductNotBlockedByAuction(data, item.id, "product_in_auction");
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

  const effectivePriceQuota = getEffectiveQuotaPrice(item.price_quota, item.discount_rate);

  const order = {
    id: nextId(data.orders),
    user_id: null,
    total_quota: effectivePriceQuota,
    status: "confirmed",
    remark: remark || null,
    order_source: "external",
    buyer_label: String(buyerLabel || "").trim(),
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
    price_quota: effectivePriceQuota,
    created_at: now(),
  });

  if (isBundle) {
    if (item.stock !== null && item.stock !== undefined) {
      item.stock = Number(item.stock) - 1;
      if (item.stock <= 0) item.status = "sold";
    }
    item.updated_at = now();
  } else {
    item.stock = Number(item.stock) - 1;
    if (item.stock <= 0) item.status = "sold";
    item.updated_at = now();
  }

  addAuditLog(data, {
    actorUserId,
    targetType: "order",
    targetId: order.id,
    action: AUDIT_ACTIONS.EXTERNAL_ORDER_CREATE,
    detail: {
      item_kind: itemKind,
      item_id: item.id,
      total_quota: effectivePriceQuota,
      buyer_label: order.buyer_label,
      remark: order.remark,
    },
  });

  repriceDataProducts(data);
  writeData(data);
  return listOrders({ orderId: order.id, limit: 1 })[0];
}

function listRechargeOrders({
  userId = null,
  rechargeOrderId = null,
  status = null,
  keyword = "",
  limit = 100,
  offset = 0,
} = {}) {
  const readData = getDep("readData");
  const data = readData({ mutable: false });
  const rechargeOrders = filterRechargeOrdersForAdmin(data, {
    userId,
    rechargeOrderId,
    status,
    keyword,
  });
  const paged = paginateItems(rechargeOrders, { limit, offset });
  return hydrateRechargeOrders(data, paged.items);
}

function createRechargeOrder(
  userId,
  {
    amountYuan,
    quotaAmount,
    transferAmount = null,
    transferUnit = null,
    transferCashAmountYuan = null,
    transferTargetRoleId = null,
    transferTargetRoleName = null,
    quotaAnchorYuan = null,
    quotaAnchorQuota = null,
    quotaPerYuan = null,
    residualUnitPriceYuan = null,
    paymentChannel = null,
    paymentReference,
    payerNote,
    orderType = "normal",
  }
) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const nextId = getDep("nextId");
  const now = getDep("now");
  const normalizeRechargeConfig = getDep("normalizeRechargeConfig");
  const getSeasonMemberState = getDep("getSeasonMemberState");
  const addAuditLog = getDep("addAuditLog");

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
  const config = normalizeRechargeConfig(data.rechargeConfig || {});
  const normalizedOrderType = String(orderType || "normal").trim() || "normal";
  const memberState = getSeasonMemberState(user, config);
  if (normalizedOrderType === "residual_transfer" && !config.residual_transfer_enabled) {
    const err = new Error("residual_transfer_disabled");
    err.statusCode = 400;
    throw err;
  }
  if (normalizedOrderType === "season_member") {
    if (!config.season_member_enabled) {
      const err = new Error("season_member_disabled");
      err.statusCode = 400;
      throw err;
    }
    if (memberState.active) {
      const err = new Error("season_member_already_active");
      err.statusCode = 400;
      throw err;
    }
    const hasPendingSameSeason = (data.rechargeOrders || []).some(
      (item) =>
        Number(item.user_id) === Number(userId) &&
        item.status === RECHARGE_ORDER_STATUS.PENDING_REVIEW &&
        item.order_type === "season_member" &&
        String(item.season_label || "") === String(config.season_member_season_label || "")
    );
    if (hasPendingSameSeason) {
      const err = new Error("season_member_pending_review");
      err.statusCode = 400;
      throw err;
    }
  }

  const baseQuotaAmount = Number(quotaAmount);
  const bonusQuotaAmount =
    (normalizedOrderType === "normal" || normalizedOrderType === "residual_transfer") &&
    memberState.active
      ? Math.floor(baseQuotaAmount * Number(config.season_member_bonus_rate || 0))
      : 0;
  const normalizedPaymentChannel =
    normalizedOrderType === "residual_transfer"
      ? "game_residual_transfer"
      : String(paymentChannel || "").trim() === "wechat_qr"
        ? "wechat_qr"
        : "alipay_qr";

  const rechargeOrder = {
    id: nextId(data.rechargeOrders || []),
    user_id: Number(userId),
    channel: normalizedPaymentChannel,
    order_type: normalizedOrderType,
    amount_yuan: Number(amountYuan),
    transfer_amount:
      normalizedOrderType === "residual_transfer" ? Number(transferAmount || amountYuan || 0) : null,
    transfer_cash_amount_yuan:
      normalizedOrderType === "residual_transfer" && transferCashAmountYuan !== null
        ? Number(transferCashAmountYuan)
        : null,
    transfer_unit:
      normalizedOrderType === "residual_transfer"
        ? String(transferUnit || config.residual_unit_label || "残卷")
        : null,
    transfer_target_role_id:
      normalizedOrderType === "residual_transfer"
        ? String(transferTargetRoleId || config.residual_admin_role_id || "584967604")
        : null,
    transfer_target_role_name:
      normalizedOrderType === "residual_transfer"
        ? String(transferTargetRoleName || config.residual_admin_role_name || "admin残卷")
        : null,
    base_quota_amount: baseQuotaAmount,
    bonus_quota_amount: bonusQuotaAmount,
    quota_amount: baseQuotaAmount + bonusQuotaAmount,
    quota_anchor_yuan: Number(quotaAnchorYuan || config.exchange_yuan || 8),
    quota_anchor_quota: Number(quotaAnchorQuota || config.exchange_quota || 10000),
    quota_per_yuan: Number(quotaPerYuan || config.quota_per_yuan || 1250),
    residual_unit_price_yuan:
      normalizedOrderType === "residual_transfer"
        ? Number(residualUnitPriceYuan || config.residual_unit_price_yuan || 0)
        : null,
    season_label:
      normalizedOrderType === "season_member" ? String(config.season_member_season_label || "") : null,
    payment_reference: String(paymentReference || "").trim(),
    payer_note: payerNote ? String(payerNote).trim() : null,
    admin_remark: null,
    status: RECHARGE_ORDER_STATUS.PENDING_REVIEW,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now(),
    updated_at: now(),
  };

  data.rechargeOrders.push(rechargeOrder);
  addAuditLog(data, {
    actorUserId: Number(userId),
    targetType: "recharge_order",
    targetId: rechargeOrder.id,
    action: AUDIT_ACTIONS.RECHARGE_ORDER_CREATE,
    detail: {
      amount_yuan: rechargeOrder.amount_yuan,
      transfer_amount: rechargeOrder.transfer_amount,
      transfer_cash_amount_yuan: rechargeOrder.transfer_cash_amount_yuan,
      transfer_unit: rechargeOrder.transfer_unit,
      quota_anchor_yuan: rechargeOrder.quota_anchor_yuan,
      quota_anchor_quota: rechargeOrder.quota_anchor_quota,
      quota_per_yuan: rechargeOrder.quota_per_yuan,
      residual_unit_price_yuan: rechargeOrder.residual_unit_price_yuan,
      quota_amount: rechargeOrder.quota_amount,
      order_type: rechargeOrder.order_type,
      channel: rechargeOrder.channel,
    },
  });
  writeData(data);
  return hydrateSingleRechargeOrder(data, rechargeOrder);
}

function createDrawServiceOrder(
  userId,
  {
    amountQuota,
    tierKey = null,
    drawAmountWan = null,
    transferAmount = null,
    paymentReference = null,
    payerNote = null,
    gameRoleId = null,
    gameRoleName = null,
    nickname = null,
  } = {}
) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const nextId = getDep("nextId");
  const now = getDep("now");
  const normalizeDrawAmountQuota = getDep("normalizeDrawAmountQuota");
  const normalizeRechargeConfig = getDep("normalizeRechargeConfig");
  const quoteDrawServiceOrder = getDep("quoteDrawServiceOrder");
  const getSeasonMemberState = getDep("getSeasonMemberState");
  const applyQuotaChange = getDep("applyQuotaChange");
  const getCurrentDrawSeasonLabel = getDep("getCurrentDrawSeasonLabel");
  const getDrawServiceSnapshot = getDep("getDrawServiceSnapshot");
  const addAuditLog = getDep("addAuditLog");

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

  const rechargeConfig = normalizeRechargeConfig(data.rechargeConfig || {});
  const quote =
    tierKey || drawAmountWan !== null
      ? quoteDrawServiceOrder(rechargeConfig, { tierKey, drawAmountWan })
      : null;
  const quotedAmount = Number(quote?.amount_quota || 0);
  const normalizedAmount = quote && Number.isInteger(quotedAmount) && quotedAmount > 0
    ? quotedAmount
    : normalizeDrawAmountQuota(amountQuota);
  if (!normalizedAmount) {
    const err = new Error("draw_amount_quota_invalid");
    err.statusCode = 400;
    throw err;
  }
  if (quote?.requires_season_member && !getSeasonMemberState(user, rechargeConfig).active) {
    const err = new Error("season_member_required");
    err.statusCode = 403;
    throw err;
  }
  const isResidualTransferDraw =
    String(quote?.payment_method || "").trim() === "residual_transfer";
  const normalizedTransferAmount = isResidualTransferDraw ? Number(transferAmount || 0) : null;
  const expectedTransferAmount = isResidualTransferDraw ? Number(quote?.transfer_amount || 0) : null;
  const normalizedPaymentReference = String(paymentReference || "").trim();
  const normalizedGameRoleId = String(gameRoleId || user.game_role_id || "").trim();
  const normalizedGameRoleName = String(gameRoleName || user.game_role_name || "").trim();
  const normalizedNickname = String(nickname || user.nickname || "").trim();

  if (isResidualTransferDraw) {
    if (!rechargeConfig.residual_transfer_enabled) {
      const err = new Error("residual_transfer_disabled");
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isInteger(normalizedTransferAmount) || normalizedTransferAmount <= 0) {
      const err = new Error("transfer_amount_invalid");
      err.statusCode = 400;
      throw err;
    }
    if (normalizedTransferAmount !== expectedTransferAmount) {
      const err = new Error("transfer_amount_mismatch");
      err.statusCode = 400;
      err.payload = {
        expected_transfer_amount: expectedTransferAmount,
        transfer_unit: quote?.transfer_unit || rechargeConfig.residual_unit_label || "残卷",
      };
      throw err;
    }
    if (!normalizedGameRoleId) {
      const err = new Error("game_role_id_required");
      err.statusCode = 400;
      throw err;
    }
    if (!normalizedGameRoleName) {
      const err = new Error("game_role_name_required");
      err.statusCode = 400;
      throw err;
    }
    if (!normalizedPaymentReference) {
      const err = new Error("payment_reference_required");
      err.statusCode = 400;
      throw err;
    }
  }
  const seasonLabel = getCurrentDrawSeasonLabel(data);
  if (
    quote?.max_draw_wan_per_order &&
    Number(quote.draw_amount_wan || 0) > Number(quote.max_draw_wan_per_order || 0)
  ) {
    const err = new Error("season_member_draw_benefit_max_exceeded");
    err.statusCode = 400;
    throw err;
  }
  if (quote?.once_per_season) {
    const alreadyUsedBenefit = (data.orders || []).some(
      (item) =>
        Number(item?.user_id) === Number(userId) &&
        String(item?.order_source || "") === "draw_service" &&
        String(item?.status || "") !== "cancelled" &&
        String(item?.draw_service?.tier_key || "") === String(quote.tier_key || "") &&
        String(item?.draw_service?.season_label || "") === String(seasonLabel || "")
    );
    if (alreadyUsedBenefit) {
      const err = new Error("season_member_draw_benefit_used");
      err.statusCode = 400;
      throw err;
    }
  }

  if (!isResidualTransferDraw) {
    applyQuotaChange(data, {
      userId,
      changeAmount: -normalizedAmount,
      type: QUOTA_LOG_TYPES.ORDER_DEDUCT,
      remark: `draw_service_order_create:${normalizedAmount}`,
    });
  }

  const drawService = {
    amount_quota: normalizedAmount,
    draw_amount_wan: quote?.draw_amount_wan ?? null,
    tier_key: quote?.tier_key ?? null,
    tier_label: quote?.tier_label ?? (quote?.legacy ? "旧版代抽" : null),
    tier_description: quote?.description ?? null,
    requires_season_member: Boolean(quote?.requires_season_member),
    max_draw_wan_per_order: quote?.max_draw_wan_per_order ?? null,
    once_per_season: Boolean(quote?.once_per_season),
    price_yuan_per_wan: quote?.price_yuan_per_wan ?? null,
    cash_amount_yuan: quote?.cash_amount_yuan ?? null,
    payment_method: isResidualTransferDraw ? "residual_transfer" : "quota",
    transfer_amount: isResidualTransferDraw ? normalizedTransferAmount : null,
    transfer_amount_per_wan: isResidualTransferDraw ? quote?.transfer_amount_per_wan ?? null : null,
    transfer_unit: isResidualTransferDraw
      ? quote?.transfer_unit || rechargeConfig.residual_unit_label || "残卷"
      : null,
    transfer_target_role_id: isResidualTransferDraw
      ? quote?.transfer_target_role_id || rechargeConfig.residual_admin_role_id || "584967604"
      : null,
    transfer_target_role_name: isResidualTransferDraw
      ? quote?.transfer_target_role_name || rechargeConfig.residual_admin_role_name || "admin残卷"
      : null,
    transfer_reference: isResidualTransferDraw ? normalizedPaymentReference : null,
    season_label: seasonLabel,
    returned_cards_text: null,
    best_gold_card: null,
    rebate_quota: 0,
    reward_summary: null,
    reward_milestones: 0,
    atlas_bonus_granted: false,
    atlas_bonus_label: null,
    video_notice: quote?.video_notice || getDep("drawServiceVideoNotice"),
    rule_summary: quote?.rule_notice || getDep("drawServiceRuleSummary"),
    settled_at: null,
  };
  const productName =
    drawService.tier_label && drawService.draw_amount_wan
      ? `代抽 ${drawService.tier_label} x ${drawService.draw_amount_wan}w`
      : `代抽 ${normalizedAmount} 额度`;

  const order = {
    id: nextId(data.orders),
    user_id: Number(userId),
    total_quota: normalizedAmount,
    status: "pending",
    remark: isResidualTransferDraw && payerNote ? String(payerNote).trim() : null,
    order_source: "draw_service",
    draw_service: drawService,
    buyer_label: isResidualTransferDraw ? normalizedGameRoleName : null,
    guest_game_role_id: isResidualTransferDraw ? normalizedGameRoleId : null,
    guest_game_role_name: isResidualTransferDraw ? normalizedGameRoleName : null,
    guest_game_server: null,
    guest_nickname: isResidualTransferDraw ? normalizedNickname || null : null,
    payment_channel: isResidualTransferDraw ? "game_residual_transfer" : null,
    payment_reference: isResidualTransferDraw ? normalizedPaymentReference : null,
    payment_amount_yuan: null,
    transfer_amount: isResidualTransferDraw ? normalizedTransferAmount : null,
    transfer_cash_amount_yuan: isResidualTransferDraw ? Number(quote?.cash_amount_yuan || 0) : null,
    residual_unit_price_yuan:
      isResidualTransferDraw && normalizedTransferAmount > 0
        ? Number((Number(quote?.cash_amount_yuan || 0) / normalizedTransferAmount).toFixed(8))
        : null,
    transfer_unit: isResidualTransferDraw ? drawService.transfer_unit : null,
    transfer_target_role_id: isResidualTransferDraw ? drawService.transfer_target_role_id : null,
    transfer_target_role_name: isResidualTransferDraw ? drawService.transfer_target_role_name : null,
    created_at: now(),
    updated_at: now(),
  };
  data.orders.push(order);

  data.orderItems.push({
    id: nextId(data.orderItems),
    order_id: order.id,
    item_kind: "service",
    product_id: null,
    bundle_sku_id: null,
    product_name: productName,
    product_snapshot: getDrawServiceSnapshot(drawService),
    price_quota: normalizedAmount,
    created_at: now(),
  });

  if (!isResidualTransferDraw) {
    const quotaLog = data.quotaLogs[data.quotaLogs.length - 1];
    if (quotaLog && quotaLog.type === QUOTA_LOG_TYPES.ORDER_DEDUCT && !quotaLog.order_id) {
      quotaLog.order_id = order.id;
    }
  }

  addAuditLog(data, {
    actorUserId: Number(userId),
    targetType: "order",
    targetId: order.id,
    action: AUDIT_ACTIONS.DRAW_SERVICE_ORDER_CREATE,
    detail: {
      amount_quota: normalizedAmount,
      draw_amount_wan: drawService.draw_amount_wan,
      tier_key: drawService.tier_key,
      tier_label: drawService.tier_label,
      price_yuan_per_wan: drawService.price_yuan_per_wan,
      payment_method: drawService.payment_method,
      transfer_amount: drawService.transfer_amount,
      transfer_unit: drawService.transfer_unit,
      season_label: drawService.season_label,
    },
  });

  writeData(data);
  return listOrders({ orderId: order.id, userId: Number(userId), limit: 1 })[0];
}

function reviewRechargeOrder(rechargeOrderId, { status, adminRemark = null }, actorUserId) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const normalizeRechargeConfig = getDep("normalizeRechargeConfig");
  const applyQuotaChange = getDep("applyQuotaChange");
  const maybeGrantBeginnerGuideReward = getDep("maybeGrantBeginnerGuideReward");
  const addAuditLog = getDep("addAuditLog");

  const data = readData();
  const rechargeOrder = (data.rechargeOrders || []).find(
    (item) => item.id === Number(rechargeOrderId)
  );
  if (!rechargeOrder) return null;
  if (rechargeOrder.status !== RECHARGE_ORDER_STATUS.PENDING_REVIEW) {
    const err = new Error("recharge_order_review_not_allowed");
    err.statusCode = 400;
    throw err;
  }

  rechargeOrder.status = status;
  rechargeOrder.admin_remark = adminRemark ? String(adminRemark).trim() : null;
  rechargeOrder.reviewed_by = Number(actorUserId);
  rechargeOrder.reviewed_at = now();
  rechargeOrder.updated_at = now();

  if (status === RECHARGE_ORDER_STATUS.APPROVED) {
    const user = data.users.find((item) => item.id === Number(rechargeOrder.user_id));
    const config = normalizeRechargeConfig(data.rechargeConfig || {});
    if (rechargeOrder.order_type === "season_member" && user) {
      user.season_member = {
        season_label: String(rechargeOrder.season_label || config.season_member_season_label || ""),
        activated_at: now(),
        source_recharge_order_id: Number(rechargeOrder.id),
      };
      user.updated_at = now();
      applyQuotaChange(data, {
        userId: rechargeOrder.user_id,
        changeAmount: Number(rechargeOrder.base_quota_amount || rechargeOrder.quota_amount || 0),
        type: QUOTA_LOG_TYPES.SEASON_MEMBER_CREDIT,
        remark: rechargeOrder.admin_remark || `season_member#${rechargeOrder.id}`,
        bonusAmount: 0,
      });
    } else {
      applyQuotaChange(data, {
        userId: rechargeOrder.user_id,
        changeAmount: Number(rechargeOrder.base_quota_amount || rechargeOrder.quota_amount || 0),
        type:
          rechargeOrder.order_type === "residual_transfer"
            ? "residual_transfer_credit"
            : QUOTA_LOG_TYPES.RECHARGE_CREDIT,
        remark: rechargeOrder.admin_remark || `recharge_order#${rechargeOrder.id}`,
        bonusAmount: Number(rechargeOrder.bonus_quota_amount || 0),
      });
    }
    maybeGrantBeginnerGuideReward(data, rechargeOrder.user_id, actorUserId, "recharge_approved");
  }

  addAuditLog(data, {
    actorUserId: Number(actorUserId),
    targetType: "recharge_order",
    targetId: rechargeOrder.id,
    action: AUDIT_ACTIONS.RECHARGE_ORDER_REVIEW,
    detail: {
      status,
      quota_amount: rechargeOrder.quota_amount,
      base_quota_amount: rechargeOrder.base_quota_amount,
      bonus_quota_amount: rechargeOrder.bonus_quota_amount,
      amount_yuan: rechargeOrder.amount_yuan,
      transfer_amount: rechargeOrder.transfer_amount,
      transfer_cash_amount_yuan: rechargeOrder.transfer_cash_amount_yuan,
      transfer_unit: rechargeOrder.transfer_unit,
      quota_anchor_yuan: rechargeOrder.quota_anchor_yuan,
      quota_anchor_quota: rechargeOrder.quota_anchor_quota,
      quota_per_yuan: rechargeOrder.quota_per_yuan,
      residual_unit_price_yuan: rechargeOrder.residual_unit_price_yuan,
      order_type: rechargeOrder.order_type,
      admin_remark: rechargeOrder.admin_remark,
    },
  });

  writeData(data);
  return listRechargeOrders({ rechargeOrderId: rechargeOrder.id, limit: 1 })[0];
}

function createOrder(userId, itemId, itemKind = "card", { remark = null, bundleSelection = null } = {}) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const nextId = getDep("nextId");
  const now = getDep("now");
  const clone = getDep("clone");
  const ensureProductNotBlockedByAuction = getDep("ensureProductNotBlockedByAuction");
  const getEffectiveQuotaPrice = getDep("getEffectiveQuotaPrice");
  const ensureQuotaAccount = getDep("ensureQuotaAccount");
  const normalizeCardProduct = getDep("normalizeCardProduct");
  const getAvailableProductStock = getDep("getAvailableProductStock");
  const applyQuotaChange = getDep("applyQuotaChange");
  const addAuditLog = getDep("addAuditLog");
  const repriceDataProducts = getDep("repriceDataProducts");
  const hydrateSingleOrder = getDep("hydrateSingleOrder");

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
  const dynamicBundle =
    isBundle && Number(itemId) < 0
      ? getDynamicBundleForOrder(data, itemId, { normalizeCardProduct, getAvailableProductStock, bundleSelection })
      : null;
  const item = dynamicBundle || (isBundle
    ? (data.bundleSkus || []).find((bundle) => bundle.id === Number(itemId))
    : data.products.find((product) => product.id === Number(itemId)));

  if (!item) {
    const err = new Error(isBundle ? "bundle_not_found" : "product_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (dynamicBundle) {
    for (const component of dynamicBundle.bundle_components || []) {
      ensureProductNotBlockedByAuction(data, component.product_id, "product_in_auction");
    }
  } else if (!isBundle) {
    ensureProductNotBlockedByAuction(data, item.id, "product_in_auction");
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
  if (isBundle && !dynamicBundle && item.stock !== null && item.stock !== undefined && Number(item.stock) <= 0) {
    const err = new Error("bundle_out_of_stock");
    err.statusCode = 400;
    throw err;
  }

  const effectivePriceQuota = getEffectiveQuotaPrice(item.price_quota, item.discount_rate);
  const purchasePolicyConfig = data.rechargeConfig || {};
  if (!isBundle) {
    assertPublicProductDisplayAllowed(
      { ...item, effective_price_quota: effectivePriceQuota },
      purchasePolicyConfig
    );
    assertQuotaPurchaseAllowed(item, purchasePolicyConfig);
  }
  const quotaAccount = ensureQuotaAccount(data, userId);
  if (Number(quotaAccount.balance || 0) < effectivePriceQuota) {
    const err = new Error("insufficient_quota");
    err.statusCode = 400;
    err.payload = {
      balance: Number(quotaAccount.balance || 0),
      required_quota: effectivePriceQuota,
    };
    throw err;
  }

  applyQuotaChange(data, {
    userId,
    changeAmount: -effectivePriceQuota,
    type: QUOTA_LOG_TYPES.ORDER_DEDUCT,
    remark: remark || `order create for ${itemKind} ${item.id}`,
  });

  const order = {
    id: nextId(data.orders),
    user_id: Number(userId),
    total_quota: effectivePriceQuota,
    status: "pending",
    remark: remark ? String(remark).trim() : null,
    created_at: now(),
    updated_at: now(),
  };
  data.orders.push(order);

  data.orderItems.push({
    id: nextId(data.orderItems),
    order_id: order.id,
    item_kind: itemKind,
    product_id: isBundle ? null : item.id,
    bundle_sku_id: isBundle && !dynamicBundle ? item.id : null,
    product_name: item.name,
    product_snapshot: clone(item),
    price_quota: effectivePriceQuota,
    created_at: now(),
  });

  if (dynamicBundle) {
    applyDynamicBundleStockChange(data, item, -1, now);
  } else if (isBundle) {
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
  if (quotaLog && quotaLog.type === QUOTA_LOG_TYPES.ORDER_DEDUCT && !quotaLog.order_id) {
    quotaLog.order_id = order.id;
  }

  addAuditLog(data, {
    actorUserId: userId,
    targetType: "order",
    targetId: order.id,
    action: AUDIT_ACTIONS.ORDER_CREATE,
    detail: {
      item_kind: itemKind,
      item_id: item.id,
      total_quota: effectivePriceQuota,
      component_product_ids: dynamicBundle
        ? (dynamicBundle.bundle_components || []).map((component) => Number(component.product_id))
        : undefined,
      remark: order.remark,
    },
  });

  repriceDataProducts(data);
  writeData(data);
  return hydrateSingleOrder(data, order);
}

function createGuestTransferOrder(
  itemId,
  itemKind = "card",
  {
    userId = null,
    gameRoleId,
    gameRoleName,
    nickname = null,
    amountYuan,
    transferAmount = null,
    paymentChannel = "alipay_qr",
    paymentReference,
    payerNote = null,
    bundleSelection = null,
  } = {}
) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const nextId = getDep("nextId");
  const now = getDep("now");
  const clone = getDep("clone");
  const normalizeRechargeConfig = getDep("normalizeRechargeConfig");
  const buildDefaultRechargeConfig = getDep("buildDefaultRechargeConfig");
  const getQuotaCashAmountFromStore = getDep("getQuotaCashAmountFromStore");
  const getEffectiveQuotaPrice = getDep("getEffectiveQuotaPrice");
  const normalizeCardProduct = getDep("normalizeCardProduct");
  const getAvailableProductStock = getDep("getAvailableProductStock");
  const ensureProductNotBlockedByAuction = getDep("ensureProductNotBlockedByAuction");
  const addAuditLog = getDep("addAuditLog");
  const repriceDataProducts = getDep("repriceDataProducts");
  const hydrateSingleOrder = getDep("hydrateSingleOrder");

  const data = readData();
  const linkedUser = userId !== null ? data.users.find((item) => item.id === Number(userId)) : null;
  if (userId !== null && !linkedUser) {
    const err = new Error("user_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (linkedUser && linkedUser.status !== "active") {
    const err = new Error("user_disabled");
    err.statusCode = 403;
    throw err;
  }
  const isBundle = itemKind === "bundle";
  const dynamicBundle =
    isBundle && Number(itemId) < 0
      ? getDynamicBundleForOrder(data, itemId, { normalizeCardProduct, getAvailableProductStock, bundleSelection })
      : null;
  const item = dynamicBundle || (isBundle
    ? (data.bundleSkus || []).find((bundle) => bundle.id === Number(itemId))
    : data.products.find((product) => product.id === Number(itemId)));

  if (!item) {
    const err = new Error(isBundle ? "bundle_not_found" : "product_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (dynamicBundle) {
    for (const component of dynamicBundle.bundle_components || []) {
      ensureProductNotBlockedByAuction(data, component.product_id, "product_in_auction");
    }
  } else if (!isBundle) {
    ensureProductNotBlockedByAuction(data, item.id, "product_in_auction");
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
  if (isBundle && !dynamicBundle && item.stock !== null && item.stock !== undefined && Number(item.stock) <= 0) {
    const err = new Error("bundle_out_of_stock");
    err.statusCode = 400;
    throw err;
  }

  const effectivePriceQuota = getEffectiveQuotaPrice(item.price_quota, item.discount_rate);
  assertPublicProductDisplayAllowed(
    { ...item, effective_price_quota: effectivePriceQuota },
    data.rechargeConfig || {}
  );
  const normalizedPaymentChannel =
    String(paymentChannel || "").trim() === "wechat_qr"
      ? "wechat_qr"
      : String(paymentChannel || "").trim() === "game_residual_transfer"
        ? "game_residual_transfer"
        : "alipay_qr";
  const normalizedAmountYuan =
    normalizedPaymentChannel === "game_residual_transfer"
      ? null
      : Number(Number(amountYuan || 0).toFixed(2));
  const config = normalizeRechargeConfig(data?.rechargeConfig || buildDefaultRechargeConfig());
  const expectedAmountYuan = getQuotaCashAmountFromStore(data, effectivePriceQuota);
  const normalizedTransferAmount =
    normalizedPaymentChannel === "game_residual_transfer"
      ? Math.max(Number(transferAmount || 0), 0)
      : null;
  const expectedTransferAmount =
    normalizedPaymentChannel === "game_residual_transfer"
      ? Math.ceil(
          (effectivePriceQuota / Number(config.exchange_quota || 10000)) *
            Number(config.residual_purchase_amount_per_quota_anchor || 10000)
        )
      : null;

  if (normalizedPaymentChannel === "game_residual_transfer") {
    if (!config.residual_transfer_enabled) {
      const err = new Error("residual_transfer_disabled");
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isInteger(normalizedTransferAmount) || normalizedTransferAmount <= 0) {
      const err = new Error("transfer_amount_invalid");
      err.statusCode = 400;
      throw err;
    }
    if (normalizedTransferAmount !== expectedTransferAmount) {
      const err = new Error("transfer_amount_mismatch");
      err.statusCode = 400;
      err.payload = {
        expected_transfer_amount: expectedTransferAmount,
        transfer_unit: config.residual_unit_label || "残卷",
      };
      throw err;
    }
  } else if (
    !Number.isFinite(normalizedAmountYuan) ||
    normalizedAmountYuan <= 0 ||
    Math.abs(normalizedAmountYuan - expectedAmountYuan) > 0.01
  ) {
    const err = new Error("amount_yuan_mismatch");
    err.statusCode = 400;
    err.payload = { expected_amount_yuan: expectedAmountYuan };
    throw err;
  }

  const order = {
    id: nextId(data.orders),
    user_id: linkedUser ? Number(linkedUser.id) : null,
    total_quota: effectivePriceQuota,
    status: "pending",
    remark: payerNote ? String(payerNote).trim() : null,
    order_source: "guest_transfer",
    buyer_label: String(gameRoleName || "").trim(),
    guest_game_role_id: String(gameRoleId || "").trim(),
    guest_game_role_name: String(gameRoleName || "").trim(),
    guest_game_server: null,
    guest_nickname: nickname ? String(nickname).trim() : null,
    payment_channel: normalizedPaymentChannel,
    payment_reference: String(paymentReference || "").trim(),
    payment_amount_yuan: normalizedAmountYuan,
    payment_quota_anchor_yuan: Number(config.exchange_yuan || 8),
    payment_quota_anchor_quota: Number(config.exchange_quota || 10000),
    payment_quota_per_yuan: Number(config.quota_per_yuan || 1250),
    transfer_amount: normalizedTransferAmount,
    transfer_cash_amount_yuan:
      normalizedPaymentChannel === "game_residual_transfer"
        ? Number(expectedAmountYuan.toFixed(4))
        : null,
    residual_unit_price_yuan:
      normalizedPaymentChannel === "game_residual_transfer"
        ? Number((expectedAmountYuan / Math.max(normalizedTransferAmount || 1, 1)).toFixed(8))
        : null,
    residual_purchase_amount_per_quota_anchor:
      normalizedPaymentChannel === "game_residual_transfer"
        ? Number(config.residual_purchase_amount_per_quota_anchor || 10000)
        : null,
    residual_purchase_anchor_cash_yuan:
      normalizedPaymentChannel === "game_residual_transfer"
        ? Number(config.residual_purchase_anchor_cash_yuan || 0)
        : null,
    transfer_unit:
      normalizedPaymentChannel === "game_residual_transfer"
        ? String(config.residual_unit_label || "残卷")
        : null,
    transfer_target_role_id:
      normalizedPaymentChannel === "game_residual_transfer"
        ? String(config.residual_admin_role_id || "584967604")
        : null,
    transfer_target_role_name:
      normalizedPaymentChannel === "game_residual_transfer"
        ? String(config.residual_admin_role_name || "admin残卷")
        : null,
    created_at: now(),
    updated_at: now(),
  };
  data.orders.push(order);

  data.orderItems.push({
    id: nextId(data.orderItems),
    order_id: order.id,
    item_kind: itemKind,
    product_id: isBundle ? null : item.id,
    bundle_sku_id: isBundle && !dynamicBundle ? item.id : null,
    product_name: item.name,
    product_snapshot: clone(item),
    price_quota: effectivePriceQuota,
    created_at: now(),
  });

  if (dynamicBundle) {
    applyDynamicBundleStockChange(data, item, -1, now);
  } else if (isBundle) {
    if (item.stock !== null && item.stock !== undefined) {
      item.stock = Number(item.stock) - 1;
      if (item.stock <= 0) item.status = "sold";
    }
    item.updated_at = now();
  } else {
    item.stock = Number(item.stock) - 1;
    if (item.stock <= 0) item.status = "sold";
    item.updated_at = now();
  }

  addAuditLog(data, {
    actorUserId: null,
    targetType: "order",
    targetId: order.id,
    action: AUDIT_ACTIONS.GUEST_TRANSFER_ORDER_CREATE,
    detail: {
      item_kind: itemKind,
      item_id: item.id,
      component_product_ids: dynamicBundle
        ? (dynamicBundle.bundle_components || []).map((component) => Number(component.product_id))
        : undefined,
      total_quota: effectivePriceQuota,
      game_role_id: order.guest_game_role_id,
      game_role_name: order.guest_game_role_name,
      payment_channel: order.payment_channel,
      payment_amount_yuan: order.payment_amount_yuan,
      transfer_amount: order.transfer_amount,
      transfer_unit: order.transfer_unit,
    },
  });

  repriceDataProducts(data);
  writeData(data);
  return hydrateSingleOrder(data, order);
}

function requestOrderCancellation(orderId, userId, remark = null) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const addAuditLog = getDep("addAuditLog");

  const data = readData();
  const order = data.orders.find(
    (item) => item.id === Number(orderId) && item.user_id === Number(userId)
  );
  if (!order) return null;

  if (order.status !== "pending") {
    const err = new Error("order_cancel_request_not_allowed");
    err.statusCode = 400;
    throw err;
  }

  order.status = "cancel_requested";
  order.remark = remark || order.remark || null;
  order.updated_at = now();

  addAuditLog(data, {
    actorUserId: userId,
    targetType: "order",
    targetId: order.id,
    action: AUDIT_ACTIONS.ORDER_CANCEL_REQUEST,
    detail: { remark: remark || null },
  });

  writeData(data);
  return listOrders({ orderId: order.id, userId: Number(userId), limit: 1 })[0];
}

function updateOrderStatus(orderId, status, remark, actorUserId, options = {}) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const applyQuotaChange = getDep("applyQuotaChange");
  const calculateDrawServiceReward = getDep("calculateDrawServiceReward");
  const isDrawServiceOrder = getDep("isDrawServiceOrder");
  const maybeGrantBeginnerGuideReward = getDep("maybeGrantBeginnerGuideReward");
  const addAuditLog = getDep("addAuditLog");
  const repriceDataProducts = getDep("repriceDataProducts");

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
        if (item.product_snapshot?.dynamic_bundle) {
          applyDynamicBundleStockChange(data, item.product_snapshot, 1, now);
          return;
        }
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
    if (order.user_id !== null && order.user_id !== undefined) {
      applyQuotaChange(data, {
        userId: order.user_id,
        changeAmount: Number(order.total_quota),
        type: QUOTA_LOG_TYPES.ORDER_REFUND,
        orderId: order.id,
        remark: remark || "admin cancel order",
      });
    }
  }

  order.status = status;
  order.remark = remark || null;
  order.updated_at = now();
  if (status === "confirmed" && previousStatus !== "confirmed" && isDrawServiceOrder(order)) {
    const returnedCardsText = String(options.returnedCardsText || "").trim();
    const bestGoldCard = String(options.bestGoldCard || "").trim();
    if (!returnedCardsText) {
      const err = new Error("draw_returned_cards_required");
      err.statusCode = 400;
      throw err;
    }

    const reward = calculateDrawServiceReward(data, order);
    if (reward.grantsAtlasBonus && !bestGoldCard) {
      const err = new Error("draw_best_gold_card_required");
      err.statusCode = 400;
      throw err;
    }

    order.draw_service = {
      ...(order.draw_service || {}),
      season_label: reward.seasonLabel,
      returned_cards_text: returnedCardsText,
      best_gold_card: bestGoldCard || null,
      rebate_quota: reward.rebateQuota,
      reward_summary: reward.rewardSummary,
      reward_milestones: reward.crossedMilestones,
      atlas_bonus_granted: reward.grantsAtlasBonus,
      atlas_bonus_label: reward.atlasBonusLabel,
      season_total_before: reward.previousTotal,
      season_total_after: reward.nextTotal,
      video_notice: getDep("drawServiceVideoNotice"),
      settled_at: now(),
    };

    if (reward.rebateQuota > 0) {
      applyQuotaChange(data, {
        userId: order.user_id,
        changeAmount: reward.rebateQuota,
        type: QUOTA_LOG_TYPES.DRAW_SERVICE_REBATE,
        orderId: order.id,
        remark: reward.rewardSummary,
        bonusAmount: 0,
      });
    }
  }
  if (status === "confirmed" && previousStatus !== "confirmed") {
    maybeGrantBeginnerGuideReward(data, order.user_id, actorUserId, "order_confirmed");
  }

  addAuditLog(data, {
    actorUserId,
    targetType: "order",
    targetId: order.id,
    action: AUDIT_ACTIONS.ORDER_STATUS_UPDATE,
    detail: {
      from: previousStatus,
      to: status,
      remark: remark || null,
      request_id: options?.requestId || null,
    },
  });

  repriceDataProducts(data);
  writeData(data);
  return listOrders({ orderId: order.id, limit: 1 })[0];
}

function updateOrderRemark(orderId, remark, actorUserId) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const addAuditLog = getDep("addAuditLog");

  const data = readData();
  const order = data.orders.find((item) => item.id === Number(orderId));
  if (!order) return null;

  order.remark = remark || null;
  order.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "order",
    targetId: order.id,
    action: AUDIT_ACTIONS.ORDER_REMARK_UPDATE,
    detail: { remark: order.remark },
  });

  writeData(data);
  return listOrders({ orderId: order.id, limit: 1 })[0];
}

module.exports = {
  listOrders,
  createExternalOrder,
  listRechargeOrders,
  createRechargeOrder,
  createDrawServiceOrder,
  reviewRechargeOrder,
  createOrder,
  createGuestTransferOrder,
  requestOrderCancellation,
  updateOrderStatus,
  updateOrderRemark,
};
