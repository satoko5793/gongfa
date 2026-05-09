const ordersStore = require("../../domain/store/repositories/orders-file-store");

async function createExternalOrder({ itemId, itemKind, buyerLabel, remark, actorUserId }) {
  return ordersStore.createExternalOrder(
    itemId,
    itemKind,
    {
      buyerLabel,
      remark,
    },
    actorUserId
  );
}

module.exports = {
  mode: "file",
  createExternalOrder,
};
