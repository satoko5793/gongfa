const RECHARGE_ORDER_STATUS = Object.freeze({
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const RECHARGE_ORDER_STATUS_VALUES = Object.freeze(Object.values(RECHARGE_ORDER_STATUS));

module.exports = {
  RECHARGE_ORDER_STATUS,
  RECHARGE_ORDER_STATUS_VALUES,
};
