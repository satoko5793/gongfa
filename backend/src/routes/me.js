const express = require("express");
const { pool } = require("../db/pool");
const { authRequired } = require("../middlewares/auth");
const { useFileStore } = require("../services/runtime");
const devStore = require("../services/dev-store");
const { ensureQuotaAccount } = require("../services/quota");
const { listOrders } = require("../services/order-query");
const {
  getRechargeConfig,
  buildRechargeQuote,
  buildSeasonMemberQuote,
  buildResidualTransferQuote,
} = require("../config/recharge-config");
const {
  validateProfileUpdateInput,
  validatePasswordChangeInput,
  validateRechargeOrderCreate,
} = require("../services/validate");
const { hashPassword, verifyPassword } = require("../services/password-auth");

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

meRouter.get("/recharge-config", async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(getRechargeConfig(devStore.getRechargeConfig()));
    }
    return res.json(getRechargeConfig());
  } catch (error) {
    return next(error);
  }
});

meRouter.get("/recharge-orders", async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(devStore.listRechargeOrders({ userId: req.user.id, limit: 100 }));
    }
    return res.status(501).json({ error: "recharge_order_not_supported_in_db_mode" });
  } catch (error) {
    return next(error);
  }
});

meRouter.post("/recharge-orders", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateRechargeOrderCreate(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }
    const orderType = String(body.order_type || "normal").trim() || "normal";

    const rechargeConfig = useFileStore()
      ? getRechargeConfig(devStore.getRechargeConfig())
      : getRechargeConfig();
    if (orderType === "residual_transfer" && !rechargeConfig.residual_transfer_enabled) {
      return res.status(400).json({ error: "residual_transfer_disabled" });
    }
    const quote =
      orderType === "season_member"
        ? buildSeasonMemberQuote(rechargeConfig)
        : orderType === "residual_transfer"
          ? buildResidualTransferQuote(body.amount_yuan, rechargeConfig)
          : buildRechargeQuote(body.amount_yuan, rechargeConfig);
    if (!quote) {
      return res.status(400).json({ error: "amount_yuan_invalid" });
    }

    if (useFileStore()) {
      return res.json(
        devStore.createRechargeOrder(req.user.id, {
          amountYuan: quote.amount_yuan,
          quotaAmount: quote.quota_amount,
          transferAmount: quote.transfer_amount || null,
          transferUnit: quote.transfer_unit || null,
          transferTargetRoleId: quote.target_role_id || null,
          transferTargetRoleName: quote.target_role_name || null,
          paymentChannel: body.payment_channel || null,
          paymentReference: body.payment_reference,
          payerNote: body.payer_note || null,
          orderType,
        })
      );
    }

    return res.status(501).json({ error: "recharge_order_not_supported_in_db_mode" });
  } catch (error) {
    return next(error);
  }
});

meRouter.patch("/profile", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateProfileUpdateInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      const user = devStore.updateSelfProfile(req.user.id, {
        game_role_name:
          body.game_role_name !== undefined ? body.game_role_name.trim() : undefined,
        nickname: body.nickname !== undefined ? body.nickname.trim() : undefined,
        game_server: body.game_server !== undefined ? body.game_server.trim() : undefined,
      });
      if (!user) {
        return res.status(404).json({ error: "user_not_found" });
      }
      return res.json(user);
    }

    const currentResult = await pool.query(
      `SELECT
        u.id,
        u.role,
        u.status,
        u.auth_provider,
        u.game_role_id,
        u.game_server,
        u.game_role_name,
        u.bind_token_id,
        u.nickname,
        COALESCE(q.balance, 0) AS quota_balance
       FROM users u
       LEFT JOIN user_quota_accounts q ON q.user_id=u.id
       WHERE u.id=$1`,
      [req.user.id]
    );
    const currentUser = currentResult.rows[0];
    if (!currentUser) {
      return res.status(404).json({ error: "user_not_found" });
    }

    const nextGameRoleName =
      body.game_role_name !== undefined ? body.game_role_name.trim() : currentUser.game_role_name;
    const nextNickname =
      body.nickname !== undefined ? body.nickname.trim() || null : currentUser.nickname;
    const nextGameServer =
      body.game_server !== undefined ? body.game_server.trim() : currentUser.game_server;

    const result = await pool.query(
      `UPDATE users
       SET game_role_name=$2,
           nickname=$3,
           game_server=$4,
           updated_at=NOW()
       WHERE id=$1
       RETURNING id, role, status, auth_provider, game_role_id, game_server, game_role_name, bind_token_id, nickname`,
      [req.user.id, nextGameRoleName, nextNickname, nextGameServer]
    );

    return res.json({
      ...result.rows[0],
      quota_balance: currentUser.quota_balance,
    });
  } catch (error) {
    return next(error);
  }
});

meRouter.patch("/password", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validatePasswordChangeInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      await devStore.changeSelfPassword(req.user.id, body.current_password, body.new_password);
      return res.json({ ok: true });
    }

    const result = await pool.query(
      "SELECT id, auth_provider, password_hash FROM users WHERE id=$1",
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }
    if (user.auth_provider !== "password") {
      return res.status(400).json({ error: "password_login_only" });
    }

    const matched = await verifyPassword(body.current_password, user.password_hash);
    if (!matched) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const nextHash = await hashPassword(body.new_password);
    await pool.query("UPDATE users SET password_hash=$2, updated_at=NOW() WHERE id=$1", [
      req.user.id,
      nextHash,
    ]);

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = { meRouter };
