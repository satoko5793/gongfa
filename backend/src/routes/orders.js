const express = require("express");
const { authRequired, authOptional } = require("../middlewares/auth");
const {
  validateOrderCreate,
  validateGuestTransferOrderCreate,
  validateConsignmentEscrowCreate,
  validateEscrowDeliveryInput,
  validateEscrowDisputeInput,
  validateOrderCancelRequestInput,
  validateDrawOrderCreate,
  validateAuctionBidCreate,
} = require("../modules/orders/validators");
const {
  createGuestTransferOrder,
  createOrder,
  createDrawServiceOrder,
  createConsignmentEscrowTrade,
  listConsignmentEscrowTradesForUser,
  submitConsignmentEscrowDelivery,
  addConsignmentEscrowEvidence,
  confirmConsignmentEscrowReceipt,
  disputeConsignmentEscrowTrade,
  listAuctionBidSummariesForUser,
  placeAuctionBid,
  requestCancellation,
  getOrderById,
} = require("../modules/orders/service");
const {
  uploadEscrowEvidenceImage,
  toPublicEvidenceFile,
} = require("../modules/orders/escrow-upload");

const ordersRouter = express.Router();

function sendValidationError(res, errors) {
  if (errors.length === 1 && errors[0] === "remark_invalid") {
    return res.status(400).json({ error: "remark_invalid" });
  }
  return res.status(400).json({ error: "invalid_input", details: errors });
}

ordersRouter.post("/guest-transfer", authOptional, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateGuestTransferOrderCreate(body);
    if (errors.length) {
      return sendValidationError(res, errors);
    }
    return res.json(await createGuestTransferOrder(req.user || null, body));
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

ordersRouter.post("/consignments", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateConsignmentEscrowCreate(body);
    if (errors.length) return sendValidationError(res, errors);
    return res.json(await createConsignmentEscrowTrade(req.user, body));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.get("/consignments/mine", async (req, res, next) => {
  try {
    return res.json(await listConsignmentEscrowTradesForUser(req.user));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/consignments/:id/delivery", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateEscrowDeliveryInput(body);
    if (errors.length) return sendValidationError(res, errors);
    return res.json(await submitConsignmentEscrowDelivery(req.user, req.params.id, body));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/consignments/:id/evidence-images", async (req, res, next) => {
  uploadEscrowEvidenceImage(req, res, async (error) => {
    if (error) return next(error);
    try {
      if (!req.file) return res.status(400).json({ error: "evidence_image_required" });
      return res.json(
        await addConsignmentEscrowEvidence(req.user, req.params.id, toPublicEvidenceFile(req.file))
      );
    } catch (innerError) {
      return next(innerError);
    }
  });
});

ordersRouter.post("/consignments/:id/confirm-receipt", async (req, res, next) => {
  try {
    return res.json(await confirmConsignmentEscrowReceipt(req.user, req.params.id));
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/consignments/:id/dispute", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateEscrowDisputeInput(body);
    if (errors.length) return sendValidationError(res, errors);
    return res.json(await disputeConsignmentEscrowTrade(req.user, req.params.id, body));
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
