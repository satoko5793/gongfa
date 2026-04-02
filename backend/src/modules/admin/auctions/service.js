const { getAdminAuctionsRepository } = require("./repository");

async function listAdminAuctions(query = {}) {
  const repository = getAdminAuctionsRepository();
  return await repository.listAuctions({
    status: String(query.status || "all").trim() || "all",
  });
}

async function createAdminAuction(actorUser, body = {}) {
  const repository = getAdminAuctionsRepository();
  return await repository.createAuction({
    productId: Number(body.product_id),
    input: {
      title: body.title || null,
      startingPriceQuota: Number(body.starting_price_quota),
      minIncrementQuota: Number(body.min_increment_quota),
      startsAt: body.starts_at || null,
      endsAt: body.ends_at,
      remark: body.remark || null,
    },
    actorUserId: actorUser.id,
  });
}

async function settleAdminAuction(actorUser, auctionId, body = {}) {
  const repository = getAdminAuctionsRepository();
  return await repository.settleAuction({
    auctionId,
    input: {
      remark: body.remark || null,
      settlementMode: body.settlement_mode || "offline",
    },
    actorUserId: actorUser.id,
  });
}

async function cancelAdminAuction(actorUser, auctionId, body = {}) {
  const repository = getAdminAuctionsRepository();
  return await repository.cancelAuction({
    auctionId,
    input: {
      reason: body.reason || null,
      remark: body.remark || null,
    },
    actorUserId: actorUser.id,
  });
}

module.exports = {
  listAdminAuctions,
  createAdminAuction,
  settleAdminAuction,
  cancelAdminAuction,
};
