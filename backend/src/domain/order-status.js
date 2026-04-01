const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCEL_REQUESTED: "cancel_requested",
  CANCELLED: "cancelled",
});

const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUS));

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
};
