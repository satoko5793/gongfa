const { ORDER_STATUS } = require("../../domain/order-status");

function ensureCanRequestCancellation(order) {
  if (!order) {
    const err = new Error("order_not_found");
    err.statusCode = 404;
    throw err;
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    const err = new Error("order_cancel_request_not_allowed");
    err.statusCode = 400;
    throw err;
  }
}

function ensureCanReadOrder(allowed) {
  if (!allowed) {
    const err = new Error("forbidden");
    err.statusCode = 403;
    throw err;
  }
}

module.exports = {
  ensureCanRequestCancellation,
  ensureCanReadOrder,
};
