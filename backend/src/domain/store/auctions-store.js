const { AUDIT_ACTIONS } = require("../audit-actions");
const { QUOTA_LOG_TYPES } = require("../quota-log-types");
const { getStoreRuntime } = require("./core/runtime-context");

function getDep(name) {
  const runtime = getStoreRuntime();
  if (typeof runtime[name] !== "function" && runtime[name] === undefined) {
    throw new Error(`store_runtime_dependency_missing:${name}`);
  }
  return runtime[name];
}

function hydrateAuction(data, auction, { publicView = false } = {}) {
  const clone = getDep("clone");
  const normalizeCardProduct = getDep("normalizeCardProduct");
  const ensureQuotaAccount = getDep("ensureQuotaAccount");
  const getAuctionBuyerLabel = getDep("getAuctionBuyerLabel");

  const product = (data.products || []).find((item) => Number(item.id) === Number(auction.product_id));
  const snapshotBase =
    auction?.product_snapshot && typeof auction.product_snapshot === "object"
      ? auction.product_snapshot
      : product;
  const item = snapshotBase
    ? normalizeCardProduct(
        { ...snapshotBase, id: Number(auction.product_id) },
        { includePricingMeta: !publicView }
      )
    : null;
  const bids = (data.auctionBids || [])
    .filter((bid) => Number(bid.auction_id) === Number(auction.id))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const leadingUser = (data.users || []).find(
    (user) => Number(user.id) === Number(auction.current_bid_user_id)
  );
  const leadingAccount = leadingUser ? ensureQuotaAccount(data, Number(leadingUser.id)) : null;
  const nextMinBidQuota = auction.current_bid_user_id
    ? Number(auction.current_price_quota || 0) + Number(auction.min_increment_quota || 0)
    : Number(auction.starting_price_quota || 0);
  const winningAmount = Number(auction.current_price_quota || auction.starting_price_quota || 0);
  const base = {
    ...clone(auction),
    item,
    bid_count: bids.length,
    next_min_bid_quota: nextMinBidQuota,
    leading_bidder_label: leadingUser ? getAuctionBuyerLabel(leadingUser) : "无",
    current_bid_user_name: leadingUser?.game_role_name || null,
    current_bid_user_game_role_id: leadingUser?.game_role_id || null,
    current_bid_user_quota_balance: leadingAccount ? Number(leadingAccount.balance || 0) : null,
    winning_amount_quota: winningAmount,
    can_direct_settle: leadingAccount ? Number(leadingAccount.balance || 0) >= winningAmount : false,
  };

  if (publicView) {
    delete base.product_snapshot;
    delete base.created_by;
    delete base.current_bid_user_id;
    delete base.current_bid_user_name;
    delete base.current_bid_user_game_role_id;
    delete base.current_bid_user_quota_balance;
    delete base.can_direct_settle;
    delete base.winning_bid_user_id;
    return base;
  }

  return {
    ...base,
    bids: bids.map((bid) => {
      const bidUser = (data.users || []).find((user) => Number(user.id) === Number(bid.user_id));
      return {
        ...clone(bid),
        game_role_id: bidUser?.game_role_id || null,
        game_role_name: bidUser?.game_role_name || null,
        nickname: bidUser?.nickname || null,
      };
    }),
  };
}

function listAuctions({ status = "all", auctionId = null, publicView = false } = {}) {
  const readData = getDep("readData");
  const clone = getDep("clone");

  const data = readData({ mutable: false });
  let auctions = (data.auctions || []).slice();

  if (auctionId !== null && auctionId !== undefined) {
    auctions = auctions.filter((auction) => Number(auction.id) === Number(auctionId));
  }
  if (status && status !== "all") {
    auctions = auctions.filter(
      (auction) => String(auction.status || "").trim() === String(status).trim()
    );
  }

  const statusOrder = {
    live: 0,
    scheduled: 1,
    ended: 2,
    settled: 3,
    cancelled: 4,
  };
  auctions.sort(
    (a, b) =>
      Number(statusOrder[String(a.status || "").trim()] ?? 9) -
        Number(statusOrder[String(b.status || "").trim()] ?? 9) ||
      String(a.ends_at || "").localeCompare(String(b.ends_at || "")) ||
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
  );

  return clone(auctions.map((auction) => hydrateAuction(data, auction, { publicView })));
}

function listAuctionBidSummariesForUser(userId) {
  const readData = getDep("readData");
  const clone = getDep("clone");

  const data = readData();
  const bids = (data.auctionBids || []).filter((bid) => Number(bid.user_id) === Number(userId));
  const grouped = new Map();

  bids.forEach((bid) => {
    const auctionId = Number(bid.auction_id);
    const current = grouped.get(auctionId) || {
      auction_id: auctionId,
      latest_bid_amount: 0,
      highest_bid_amount: 0,
      latest_bid_at: null,
    };
    const amount = Number(bid.amount_quota || 0);
    if (amount >= current.highest_bid_amount) {
      current.highest_bid_amount = amount;
    }
    if (!current.latest_bid_at || String(bid.created_at).localeCompare(String(current.latest_bid_at)) > 0) {
      current.latest_bid_at = bid.created_at;
      current.latest_bid_amount = amount;
    }
    grouped.set(auctionId, current);
  });

  return clone(
    [...grouped.values()].map((entry) => {
      const auction = (data.auctions || []).find((item) => Number(item.id) === Number(entry.auction_id));
      return {
        ...entry,
        status: auction?.status || null,
        current_price_quota: Number(auction?.current_price_quota || 0),
        is_leading: Number(auction?.current_bid_user_id || 0) === Number(userId),
      };
    })
  );
}

function createAuction(
  productId,
  {
    title = null,
    startingPriceQuota,
    minIncrementQuota,
    startsAt = null,
    endsAt,
    remark = null,
  },
  actorUserId
) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const clone = getDep("clone");
  const now = getDep("now");
  const nextId = getDep("nextId");
  const hasConfirmedSaleRecord = getDep("hasConfirmedSaleRecord");
  const ensureProductNotBlockedByAuction = getDep("ensureProductNotBlockedByAuction");
  const addAuditLog = getDep("addAuditLog");

  const data = readData();
  const product = data.products.find((item) => Number(item.id) === Number(productId));
  if (!product) {
    const err = new Error("product_not_found");
    err.statusCode = 404;
    throw err;
  }
  const productStatus = String(product.status || "").trim();
  const canAuctionOffSale =
    productStatus === "off_sale" && Number(product.stock) > 0 && !hasConfirmedSaleRecord(data, product.id);
  if (productStatus !== "on_sale" && !canAuctionOffSale) {
    const err = new Error("product_not_on_sale");
    err.statusCode = 400;
    throw err;
  }
  if (Number(product.stock) <= 0) {
    const err = new Error("product_out_of_stock");
    err.statusCode = 400;
    throw err;
  }
  ensureProductNotBlockedByAuction(data, product.id, "product_in_auction");

  const normalizedStartingPrice = Number(startingPriceQuota);
  const normalizedIncrement = Number(minIncrementQuota);
  const startValue = startsAt ? new Date(startsAt) : new Date();
  const endValue = new Date(endsAt);
  if (!Number.isInteger(normalizedStartingPrice) || normalizedStartingPrice <= 0) {
    const err = new Error("auction_starting_price_invalid");
    err.statusCode = 400;
    throw err;
  }
  if (!Number.isInteger(normalizedIncrement) || normalizedIncrement <= 0) {
    const err = new Error("auction_min_increment_invalid");
    err.statusCode = 400;
    throw err;
  }
  if (Number.isNaN(startValue.getTime()) || Number.isNaN(endValue.getTime())) {
    const err = new Error("auction_time_invalid");
    err.statusCode = 400;
    throw err;
  }
  if (endValue.getTime() <= startValue.getTime()) {
    const err = new Error("auction_end_before_start");
    err.statusCode = 400;
    throw err;
  }

  const auction = {
    id: nextId(data.auctions || []),
    item_kind: "card",
    product_id: Number(product.id),
    title: String(title || "").trim() || product.name,
    remark: remark ? String(remark).trim() : null,
    status: startValue.getTime() > Date.now() ? "scheduled" : "live",
    product_snapshot: clone(product),
    starting_price_quota: normalizedStartingPrice,
    min_increment_quota: normalizedIncrement,
    current_price_quota: normalizedStartingPrice,
    current_bid_user_id: null,
    current_bid_at: null,
    starts_at: startValue.toISOString(),
    ends_at: endValue.toISOString(),
    settled_order_id: null,
    settled_at: null,
    cancelled_at: null,
    cancelled_reason: null,
    winning_bid_amount: null,
    winning_bid_user_id: null,
    created_by: Number(actorUserId),
    created_at: now(),
    updated_at: now(),
  };
  data.auctions.push(auction);

  addAuditLog(data, {
    actorUserId,
    targetType: "auction",
    targetId: auction.id,
    action: AUDIT_ACTIONS.AUCTION_CREATE,
    detail: {
      product_id: Number(product.id),
      starting_price_quota: normalizedStartingPrice,
      min_increment_quota: normalizedIncrement,
      starts_at: auction.starts_at,
      ends_at: auction.ends_at,
    },
  });

  writeData(data);
  return listAuctions({ auctionId: auction.id })[0];
}

function placeAuctionBid(auctionId, userId, amountQuota) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const nextId = getDep("nextId");
  const refreshAuctionStatuses = getDep("refreshAuctionStatuses");
  const addAuditLog = getDep("addAuditLog");

  const data = readData();
  const user = data.users.find((item) => Number(item.id) === Number(userId));
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

  refreshAuctionStatuses(data);
  const auction = (data.auctions || []).find((item) => Number(item.id) === Number(auctionId));
  if (!auction) {
    const err = new Error("auction_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (String(auction.status || "") !== "live") {
    const err = new Error("auction_not_live");
    err.statusCode = 400;
    throw err;
  }

  const normalizedAmount = Number(amountQuota);
  if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
    const err = new Error("auction_bid_amount_invalid");
    err.statusCode = 400;
    throw err;
  }
  const nextMinBidQuota = auction.current_bid_user_id
    ? Number(auction.current_price_quota || 0) + Number(auction.min_increment_quota || 0)
    : Number(auction.starting_price_quota || 0);
  if (normalizedAmount < nextMinBidQuota) {
    const err = new Error("auction_bid_too_low");
    err.statusCode = 400;
    err.payload = { next_min_bid_quota: nextMinBidQuota };
    throw err;
  }

  const bid = {
    id: nextId(data.auctionBids || []),
    auction_id: Number(auction.id),
    user_id: Number(userId),
    amount_quota: normalizedAmount,
    created_at: now(),
  };
  data.auctionBids.push(bid);
  auction.current_price_quota = normalizedAmount;
  auction.current_bid_user_id = Number(userId);
  auction.current_bid_at = bid.created_at;
  auction.updated_at = now();

  addAuditLog(data, {
    actorUserId: Number(userId),
    targetType: "auction",
    targetId: Number(auction.id),
    action: AUDIT_ACTIONS.AUCTION_BID_CREATE,
    detail: {
      amount_quota: normalizedAmount,
      next_min_bid_quota: normalizedAmount + Number(auction.min_increment_quota || 0),
    },
  });

  writeData(data);
  return listAuctions({ auctionId: auction.id, publicView: true })[0];
}

function settleAuction(auctionId, { remark = null, settlementMode = "offline" } = {}, actorUserId) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const nextId = getDep("nextId");
  const clone = getDep("clone");
  const refreshAuctionStatuses = getDep("refreshAuctionStatuses");
  const applyQuotaChange = getDep("applyQuotaChange");
  const addAuditLog = getDep("addAuditLog");
  const repriceDataProducts = getDep("repriceDataProducts");

  const data = readData();
  refreshAuctionStatuses(data);
  const auction = (data.auctions || []).find((item) => Number(item.id) === Number(auctionId));
  if (!auction) {
    const err = new Error("auction_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (!["ended", "live"].includes(String(auction.status || "").trim())) {
    const err = new Error("auction_settle_not_allowed");
    err.statusCode = 400;
    throw err;
  }
  if (String(auction.status || "").trim() === "live" && new Date(auction.ends_at).getTime() > Date.now()) {
    const err = new Error("auction_not_ended");
    err.statusCode = 400;
    throw err;
  }
  if (!auction.current_bid_user_id) {
    const err = new Error("auction_no_bids");
    err.statusCode = 400;
    throw err;
  }

  const product = data.products.find((item) => Number(item.id) === Number(auction.product_id));
  if (!product) {
    const err = new Error("product_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (Number(product.stock) <= 0) {
    const err = new Error("product_out_of_stock");
    err.statusCode = 400;
    throw err;
  }

  const winningAmount = Number(auction.current_price_quota || auction.starting_price_quota || 0);
  const normalizedSettlementMode =
    String(settlementMode || "").trim() === "direct_quota" ? "direct_quota" : "offline";

  if (normalizedSettlementMode === "direct_quota") {
    applyQuotaChange(data, {
      userId: Number(auction.current_bid_user_id),
      changeAmount: -winningAmount,
      type: QUOTA_LOG_TYPES.ORDER_DEDUCT,
      remark: `auction_settle:${auction.id}`,
      bonusAmount: 0,
    });
  }

  const order = {
    id: nextId(data.orders),
    user_id: Number(auction.current_bid_user_id),
    total_quota: winningAmount,
    status: "confirmed",
    remark: remark ? String(remark).trim() : null,
    order_source: "auction",
    auction_id: Number(auction.id),
    payment_mode: normalizedSettlementMode,
    created_at: now(),
    updated_at: now(),
  };
  data.orders.push(order);

  data.orderItems.push({
    id: nextId(data.orderItems),
    order_id: order.id,
    item_kind: "card",
    product_id: Number(product.id),
    bundle_sku_id: null,
    product_name: product.name,
    product_snapshot: clone(product),
    price_quota: winningAmount,
    created_at: now(),
  });

  if (normalizedSettlementMode === "direct_quota") {
    const quotaLog = data.quotaLogs[data.quotaLogs.length - 1];
    if (quotaLog && quotaLog.type === QUOTA_LOG_TYPES.ORDER_DEDUCT && !quotaLog.order_id) {
      quotaLog.order_id = order.id;
    }
  }

  product.stock = Number(product.stock) - 1;
  product.updated_at = now();
  if (product.stock <= 0) {
    product.status = "sold";
  }

  auction.status = "settled";
  auction.settled_order_id = Number(order.id);
  auction.settled_at = now();
  auction.winning_bid_amount = winningAmount;
  auction.winning_bid_user_id = Number(auction.current_bid_user_id);
  auction.remark = remark ? String(remark).trim() : auction.remark || null;
  auction.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "auction",
    targetId: Number(auction.id),
    action: AUDIT_ACTIONS.AUCTION_SETTLE,
    detail: {
      order_id: Number(order.id),
      product_id: Number(product.id),
      winning_bid_amount: winningAmount,
      winning_bid_user_id: Number(auction.current_bid_user_id),
      settlement_mode: normalizedSettlementMode,
    },
  });

  repriceDataProducts(data);
  writeData(data);
  return listAuctions({ auctionId: auction.id })[0];
}

function cancelAuction(auctionId, { reason = null, remark = null } = {}, actorUserId) {
  const readData = getDep("readData");
  const writeData = getDep("writeData");
  const now = getDep("now");
  const refreshAuctionStatuses = getDep("refreshAuctionStatuses");
  const addAuditLog = getDep("addAuditLog");

  const data = readData();
  refreshAuctionStatuses(data);
  const auction = (data.auctions || []).find((item) => Number(item.id) === Number(auctionId));
  if (!auction) {
    const err = new Error("auction_not_found");
    err.statusCode = 404;
    throw err;
  }
  if (["settled", "cancelled"].includes(String(auction.status || "").trim())) {
    const err = new Error("auction_cancel_not_allowed");
    err.statusCode = 400;
    throw err;
  }

  auction.status = "cancelled";
  auction.cancelled_at = now();
  auction.cancelled_reason = reason ? String(reason).trim() : null;
  auction.remark = remark ? String(remark).trim() : auction.remark || null;
  auction.updated_at = now();

  addAuditLog(data, {
    actorUserId,
    targetType: "auction",
    targetId: Number(auction.id),
    action: AUDIT_ACTIONS.AUCTION_CANCEL,
    detail: {
      reason: auction.cancelled_reason,
      remark: auction.remark,
      bid_count: Number(
        (data.auctionBids || []).filter((bid) => Number(bid.auction_id) === Number(auction.id)).length
      ),
    },
  });

  writeData(data);
  return listAuctions({ auctionId: auction.id })[0];
}

module.exports = {
  listAuctions,
  listAuctionBidSummariesForUser,
  createAuction,
  placeAuctionBid,
  settleAuction,
  cancelAuction,
};
