const express = require("express");
const { pool } = require("../db/pool");
const { authRequired } = require("../middlewares/auth");
const { useFileStore } = require("../services/runtime");
const devStore = require("../services/dev-store");
const { ensureQuotaAccount } = require("../services/quota");
const { listOrders } = require("../services/order-query");

const meRouter = express.Router();
meRouter.use(authRequired);

meRouter.get("/quota", async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(devStore.getQuota(req.user.id));
    }
    await ensureQuotaAccount(pool, req.user.id);
    const result = await pool.query(
      "SELECT user_id, balance, updated_at FROM user_quota_accounts WHERE user_id=$1",
      [req.user.id]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

meRouter.get("/orders", async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(devStore.listOrders({ userId: req.user.id, limit: 100 }));
    }
    const orders = await listOrders(pool, { userId: req.user.id, limit: 100 });
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
});

module.exports = { meRouter };
