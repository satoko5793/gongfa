const { canAccessOrder } = require("../../services/authz");
const { toAuctionBidSummaryResponse, toOrderDetail } = require("./mapper");
const { ensureCanReadOrder } = require("./policy");
const { getOrdersRepository } = require("./repository");

async function createGuestTransferOrder(body) {
  const repository = getOrdersRepository();
  return toOrderDetail(
    await repository.createGuestTransferOrder({
      itemId: body.item_id ?? body.product_id,
      itemKind: body.item_kind || "card",
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
    })
  );
}

async function createDrawServiceOrder(user, body) {
  const repository = getOrdersRepository();
  return toOrderDetail(
    await repository.createDrawServiceOrder({
      userId: user.id,
      amountQuota: Number(body.amount_quota),
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

module.exports = {
  createGuestTransferOrder,
  createOrder,
  createDrawServiceOrder,
  listAuctionBidSummariesForUser,
  placeAuctionBid,
  requestCancellation,
  getOrderById,
};
