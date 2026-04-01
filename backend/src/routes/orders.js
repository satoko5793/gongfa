const express = require("express");
const { authRequired } = require("../middlewares/auth");
const {
  validateOrderCreate,
  validateGuestTransferOrderCreate,
  validateOrderCancelRequestInput,
  validateDrawOrderCreate,
  validateAuctionBidCreate,
} = require("../modules/orders/validators");
const {
  createGuestTransferOrder,
  createOrder,
  createDrawServiceOrder,
  listAuctionBidSummariesForUser,
  placeAuctionBid,
  requestCancellation,
  getOrderById,
} = require("../modules/orders/service");

const ordersRouter = express.Router();

function sendValidationError(res, errors) {
  if (errors.length === 1 && errors[0] === "remark_invalid") {
    return res.status(400).json({ error: "remark_invalid" });
  }
  return res.status(400).json({ error: "invalid_input", details: errors });
}

ordersRouter.post("/guest-transfer", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateGuestTransferOrderCreate(body);
    if (errors.length) {
      return sendValidationError(res, errors);
    }
    return res.json(await createGuestTransferOrder(body));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.use(authRequired);

ordersRouter.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateOrderCreate(body);
    if (errors.length) {
      return sendValidationError(res, errors);
    }
    return res.json(await createOrder(req.user, body));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/draw-service", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateDrawOrderCreate(body);
    if (errors.length) {
      return sendValidationError(res, errors);
    }
    return res.json(await createDrawServiceOrder(req.user, body));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.get("/auctions/mine", async (req, res, next) => {
  try {
    return res.json(await listAuctionBidSummariesForUser(req.user));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/auctions/:id/bids", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateAuctionBidCreate(body);
    if (errors.length) {
      return sendValidationError(res, errors);
    }
    return res.json(await placeAuctionBid(req.user, req.params.id, body));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/:id/cancel-request", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateOrderCancelRequestInput(body);
    if (errors.length) {
      return sendValidationError(res, errors);
    }
    return res.json(await requestCancellation(req.user, req.params.id, body));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.get("/:id", async (req, res, next) => {
  try {
    return res.json(await getOrderById(req.user, req.params.id));
  } catch (error) {
    return next(error);
  }
});

module.exports = { ordersRouter };
