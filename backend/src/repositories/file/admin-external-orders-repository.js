const devStore = require("../../services/dev-store");

async function createExternalOrder({ itemId, itemKind, buyerLabel, remark, actorUserId }) {
  return devStore.createExternalOrder(
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
