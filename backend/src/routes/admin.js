const express = require("express");
const { authRequired, adminReadOnly, adminWriteOnly } = require("../middlewares/auth");
const {
  validateImportInput,
  validateProductStatus,
  validateProductUpdate,
  validateBundleUpdate,
  validateQuotaChange,
  validateOrderStatus,
  validateExternalOrderCreate,
  validateRechargeReviewInput,
  validateRechargeConfigUpdateInput,
  validateAuctionCreate,
  validateAuctionCancelInput,
} = require("../services/validate");
const {
  reviewRechargeOrder,
  updateOrderStatus,
  updateOrderRemark,
} = require("../modules/admin/orders/service");
const {
  listAdminProducts,
  listAdminUsers,
  listAdminOrders,
  listAdminRechargeOrders,
  listAdminQuotaLogs,
  listAdminAuditLogs,
} = require("../modules/admin/queries/service");
const {
  bulkUpdateProductStatus,
  bulkUpdateProducts,
  updateProduct,
  clearProductManualPrice,
  updateProductStatus,
  buildProductPatch,
  normalizeProductIds,
} = require("../modules/admin/catalog/service");
const {
  changeUserQuota,
  updateUserStatus,
} = require("../modules/admin/users/service");
const {
  listAdminBundles,
  updateBundle,
  updateBundleStatus,
} = require("../modules/admin/bundles/service");
const {
  getAdminRechargeConfig,
  updateAdminRechargeConfig,
} = require("../modules/admin/recharge-config/service");
const { importCardsJson } = require("../modules/admin/imports/service");
const { recalculatePricing } = require("../modules/admin/pricing/service");
const { createExternalOrder } = require("../modules/admin/external-orders/service");
const {
  listAdminAuctions,
  createAdminAuction,
  settleAdminAuction,
  cancelAdminAuction,
} = require("../modules/admin/auctions/service");

const adminRouter = express.Router();
adminRouter.use(authRequired, adminReadOnly);

adminRouter.post("/imports/cards-json", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateImportInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(await importCardsJson(req.user, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/products", async (req, res, next) => {
  try {
    return res.json(await listAdminProducts());
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/products/bulk-status", adminWriteOnly, async (req, res, next) => {
  try {
    const { product_ids: productIds, status } = req.body || {};
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "product_ids_required" });
    }
    if (!validateProductStatus(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }

    const normalizedIds = normalizeProductIds(productIds);
    if (normalizedIds.length === 0) {
      return res.status(400).json({ error: "product_ids_required" });
    }
    return res.json(await bulkUpdateProductStatus(req.user, normalizedIds, status));
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/products/bulk-update", adminWriteOnly, async (req, res, next) => {
  try {
    const { product_ids: productIds, ...body } = req.body || {};
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "product_ids_required" });
    }

    const patch = buildProductPatch(body);

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "patch_required" });
    }

    const errors = validateProductUpdate(patch);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    const normalizedIds = normalizeProductIds(productIds);
    if (normalizedIds.length === 0) {
      return res.status(400).json({ error: "product_ids_required" });
    }
    return res.json(await bulkUpdateProducts(req.user, normalizedIds, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/products/:id", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateProductUpdate(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    return res.json(await updateProduct(req.user, req.params.id, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/products/:id/manual-price", adminWriteOnly, async (req, res, next) => {
  try {
    return res.json(await clearProductManualPrice(req.user, req.params.id));
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/products/:id/status", adminWriteOnly, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!validateProductStatus(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }

    return res.json(await updateProductStatus(req.user, req.params.id, status));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/bundles", async (req, res, next) => {
  try {
    return res.json(await listAdminBundles());
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/bundles/:id", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateBundleUpdate(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    return res.json(await updateBundle(req.user, req.params.id, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/bundles/:id/status", adminWriteOnly, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["on_sale", "off_sale", "sold"].includes(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }

    return res.json(await updateBundleStatus(req.user, req.params.id, status));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    return res.json(await listAdminUsers());
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/users/:id/quota", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateQuotaChange(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(await changeUserQuota(req.user, req.params.id, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/users/:id/status", adminWriteOnly, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }

    return res.json(await updateUserStatus(req.user, req.params.id, status));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/orders", async (req, res, next) => {
  try {
    return res.json(await listAdminOrders(req.query || {}));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/recharge-config", async (req, res, next) => {
  try {
    return res.json(await getAdminRechargeConfig());
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/recharge-config", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateRechargeConfigUpdateInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    return res.json(await updateAdminRechargeConfig(req.user, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/recharge-orders", async (req, res, next) => {
  try {
    return res.json(await listAdminRechargeOrders(req.query || {}));
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/recharge-orders/:id/review", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateRechargeReviewInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(await reviewRechargeOrder(req.user, req.params.id, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/quota-logs", async (req, res, next) => {
  try {
    return res.json(await listAdminQuotaLogs(req.query || {}));
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/pricing/recalculate", adminWriteOnly, async (req, res, next) => {
  try {
    return res.json(await recalculatePricing(req.user));
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const { status, returned_cards_text, best_gold_card } = req.body || {};
    if (!validateOrderStatus(status)) {
      return res.status(400).json({ error: "status_invalid" });
    }
    if (
      returned_cards_text !== undefined &&
      returned_cards_text !== null &&
      typeof returned_cards_text !== "string"
    ) {
      return res.status(400).json({ error: "returned_cards_text_invalid" });
    }
    if (
      best_gold_card !== undefined &&
      best_gold_card !== null &&
      typeof best_gold_card !== "string"
    ) {
      return res.status(400).json({ error: "best_gold_card_invalid" });
    }
    const role = String(req.user?.role || "").trim();
    const canConfirmOnly = role === "poster_admin" && String(status || "") === "confirmed";
    if (role !== "admin" && !canConfirmOnly) {
      return res.status(403).json({ error: "admin_write_only" });
    }
    return res.json(await updateOrderStatus(req.user, req.params.id, req.body || {}));
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/orders/external", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateExternalOrderCreate(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    return res.json(await createExternalOrder(req.user, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/orders/:id/remark", adminWriteOnly, async (req, res, next) => {
  try {
    const { remark } = req.body || {};
    if (remark !== undefined && remark !== null && typeof remark !== "string") {
      return res.status(400).json({ error: "remark_invalid" });
    }
    return res.json(await updateOrderRemark(req.user, req.params.id, req.body || {}));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/auctions", async (req, res, next) => {
  try {
    return res.json(await listAdminAuctions(req.query || {}));
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/auctions", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateAuctionCreate(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    return res.json(await createAdminAuction(req.user, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/auctions/:id/settle", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    if (body.remark !== undefined && body.remark !== null && typeof body.remark !== "string") {
      return res.status(400).json({ error: "remark_invalid" });
    }
    if (
      body.settlement_mode !== undefined &&
      !["offline", "direct_quota"].includes(String(body.settlement_mode || "").trim())
    ) {
      return res.status(400).json({ error: "settlement_mode_invalid" });
    }

    return res.json(await settleAdminAuction(req.user, req.params.id, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.post("/auctions/:id/cancel", adminWriteOnly, async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateAuctionCancelInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    return res.json(await cancelAdminAuction(req.user, req.params.id, body));
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/audit-logs", async (req, res, next) => {
  try {
    return res.json(await listAdminAuditLogs(req.query || {}));
  } catch (error) {
    return next(error);
  }
});

module.exports = { adminRouter };
