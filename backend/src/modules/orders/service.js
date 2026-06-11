const { canAccessOrder } = require("../../services/authz");
const { toAuctionBidSummaryResponse, toOrderDetail } = require("./mapper");
const { ensureCanReadOrder } = require("./policy");
const { getOrdersRepository } = require("./repository");

async function createGuestTransferOrder(user, body) {
  const repository = getOrdersRepository();
  return toOrderDetail(
    await repository.createGuestTransferOrder({
      userId: user?.id || null,
      itemId: body.item_id ?? body.product_id,
      itemKind: body.item_kind || "card",
      bundleSelection: body.bundle_selection || null,
      body,
    })
  );
}

async function createOrder(user, body) {
  const repository = getOrdersRepository();
  return toOrderDetail(
    await repository.createOrder({
      userId: user.id,
      itemId: body.item_id ?? body.product_id,
      itemKind: body.item_kind || "card",
      bundleSelection: body.bundle_selection || null,
      remark: body.remark || null,
    })
  );
}

async function createDrawServiceOrder(user, body) {
  const repository = getOrdersRepository();
  return toOrderDetail(
    await repository.createDrawServiceOrder({
      userId: user.id,
      amountQuota: Number(body.amount_quota),
      tierKey: body.tier_key || null,
      drawAmountWan: body.draw_amount_wan === undefined ? null : Number(body.draw_amount_wan),
      transferAmount: body.transfer_amount === undefined ? null : Number(body.transfer_amount),
      paymentReference: body.payment_reference || null,
      payerNote: body.payer_note || null,
      gameRoleId: body.game_role_id || null,
      gameRoleName: body.game_role_name || null,
      nickname: body.nickname || null,
    })
  );
}

async function listAuctionBidSummariesForUser(user) {
  const repository = getOrdersRepository();
  return toAuctionBidSummaryResponse(
    await repository.listAuctionBidSummariesForUser({ userId: user.id })
  );
}

async function placeAuctionBid(user, auctionId, body) {
  const repository = getOrdersRepository();
  return await repository.placeAuctionBid({
    auctionId,
    userId: user.id,
    amountQuota: Number(body.amount_quota),
  });
}

async function requestCancellation(user, orderId, body) {
  const repository = getOrdersRepository();
  if (repository.mode === "pg" && user.role !== "admin") {
    ensureCanReadOrder(await canAccessOrder(user, orderId));
  }

  const order = await repository.requestCancellation({
    orderId,
    userId: user.id,
    remark: body.remark || null,
  });

  if (!order) {
    const err = new Error("order_not_found");
    err.statusCode = 404;
    throw err;
  }

  return toOrderDetail(order);
}

async function getOrderById(user, orderId) {
  const repository = getOrdersRepository();
  if (repository.mode === "pg" && user.role !== "admin") {
    ensureCanReadOrder(await canAccessOrder(user, orderId));
  }

  const order = await repository.getOrderById({
    orderId,
    userId: user.role === "admin" ? null : user.id,
    role: user.role,
  });

  if (!order) {
    const err = new Error("order_not_found");
    err.statusCode = 404;
    throw err;
  }

  return toOrderDetail(order);
}

async function createConsignmentEscrowTrade(user, body) {
  const repository = getOrdersRepository();
  if (repository.mode !== "file") {
    const err = new Error("escrow_trades_not_supported_in_db_mode");
    err.statusCode = 501;
    throw err;
  }
  return repository.createConsignmentEscrowTrade({ userId: user.id, body });
}

async function listConsignmentEscrowTradesForUser(user) {
  const repository = getOrdersRepository();
  if (repository.mode !== "file") return [];
  return repository.listConsignmentEscrowTradesForUser({ userId: user.id });
}

async function submitConsignmentEscrowDelivery(user, tradeId, body) {
  const repository = getOrdersRepository();
  const trade = await repository.submitConsignmentEscrowDelivery({ userId: user.id, tradeId, body });
  if (!trade) {
    const err = new Error("escrow_trade_not_found");
    err.statusCode = 404;
    throw err;
  }
  return trade;
}

async function addConsignmentEscrowEvidence(user, tradeId, file) {
  const repository = getOrdersRepository();
  const evidence = await repository.addConsignmentEscrowEvidence({ userId: user.id, tradeId, file });
  if (!evidence) {
    const err = new Error("escrow_trade_not_found");
    err.statusCode = 404;
    throw err;
  }
  return evidence;
}

async function confirmConsignmentEscrowReceipt(user, tradeId) {
  const repository = getOrdersRepository();
  const trade = await repository.confirmConsignmentEscrowReceipt({ userId: user.id, tradeId });
  if (!trade) {
    const err = new Error("escrow_trade_not_found");
    err.statusCode = 404;
    throw err;
  }
  return trade;
}

async function disputeConsignmentEscrowTrade(user, tradeId, body) {
  const repository = getOrdersRepository();
  const trade = await repository.disputeConsignmentEscrowTrade({ userId: user.id, tradeId, body });
  if (!trade) {
    const err = new Error("escrow_trade_not_found");
    err.statusCode = 404;
    throw err;
  }
  return trade;
}

module.exports = {
  createGuestTransferOrder,
  createOrder,
  createDrawServiceOrder,
  listAuctionBidSummariesForUser,
  placeAuctionBid,
  requestCancellation,
  getOrderById,
  createConsignmentEscrowTrade,
  listConsignmentEscrowTradesForUser,
  submitConsignmentEscrowDelivery,
  addConsignmentEscrowEvidence,
  confirmConsignmentEscrowReceipt,
  disputeConsignmentEscrowTrade,
};
