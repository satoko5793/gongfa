const express = require("express");
const { pool } = require("../db/pool");
const { authRequired } = require("../middlewares/auth");
const { useFileStore } = require("../services/runtime");
const devStore = require("../services/dev-store");
const { signUser } = require("../services/jwt");
const {
  validateBindInput,
  validatePasswordRegisterInput,
  validatePasswordLoginInput,
} = require("../services/validate");
const { ensureQuotaAccount } = require("../services/quota");
const { hashPassword, verifyPassword } = require("../services/password-auth");

const authRouter = express.Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validatePasswordRegisterInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      const user = await devStore.registerPasswordUser({
        game_role_id: body.game_role_id.trim(),
        game_role_name: body.game_role_name.trim(),
        password: body.password,
      });
      const token = signUser(user);
      return res.json({ token, user });
    }

    const passwordHash = await hashPassword(body.password);
    const result = await pool.query(
      `INSERT INTO users
        (role, status, auth_provider, game_role_id, game_server, game_role_name, bind_token_id, nickname, password_hash, created_at, updated_at)
       VALUES ('user', 'active', 'password', $1, 'direct', $2, NULL, $3, $4, NOW(), NOW())
       RETURNING id, role, status, auth_provider, game_role_id, game_server, game_role_name, bind_token_id, nickname`,
      [
        body.game_role_id.trim(),
        body.game_role_name.trim(),
        null,
        passwordHash,
      ]
    );

    const user = result.rows[0];
    await ensureQuotaAccount(pool, user.id);
    const token = signUser(user);
    return res.json({ token, user });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "game_role_id_taken" });
    }
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validatePasswordLoginInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      const user = await devStore.loginPasswordUser(body.game_role_id.trim(), body.password);
      const token = signUser(user);
      return res.json({ token, user });
    }

    const result = await pool.query(
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
        u.password_hash,
        COALESCE(q.balance, 0) AS quota_balance
       FROM users u
       LEFT JOIN user_quota_accounts q ON q.user_id=u.id
       WHERE u.auth_provider='password' AND u.game_role_id=$1
       ORDER BY u.updated_at DESC
       LIMIT 1`,
      [body.game_role_id.trim()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "invalid_credentials" });
    }
    const matched = await verifyPassword(body.password, user.password_hash);
    if (!matched) {
      return res.status(401).json({ error: "invalid_credentials" });
    }
    if (user.status !== "active") {
      return res.status(403).json({ error: "user_disabled" });
    }

    delete user.password_hash;
    const token = signUser(user);
    return res.json({ token, user });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/game/bind", async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateBindInput(body);
    if (errors.length) {
      return res.status(400).json({ error: "invalid_input", details: errors });
    }

    if (useFileStore()) {
      const user = devStore.bindUser({
        game_role_id: body.game_role_id.trim(),
        game_server: body.game_server.trim(),
        game_role_name: body.game_role_name.trim(),
        bind_token_id: body.bind_token_id?.trim() || null,
        nickname: body.nickname?.trim() || null,
      });
      if (user.status !== "active") {
        return res.status(403).json({ error: "user_disabled" });
      }
      const token = signUser(user);
      return res.json({ token, user });
    }

    const result = await pool.query(
      `INSERT INTO users
        (role, status, auth_provider, game_role_id, game_server, game_role_name, bind_token_id, nickname, password_hash, created_at, updated_at)
       VALUES ('user', 'active', 'bind', $1, $2, $3, $4, $5, NULL, NOW(), NOW())
       ON CONFLICT (game_role_id, game_server)
       DO UPDATE SET
        auth_provider='bind',
        game_role_name=EXCLUDED.game_role_name,
        bind_token_id=EXCLUDED.bind_token_id,
        nickname=COALESCE(EXCLUDED.nickname, users.nickname),
        updated_at=NOW()
       RETURNING id, role, status, auth_provider, game_role_id, game_server, game_role_name, bind_token_id, nickname`,
      [
        body.game_role_id.trim(),
        body.game_server.trim(),
        body.game_role_name.trim(),
        body.bind_token_id?.trim() || null,
        body.nickname?.trim() || null,
      ]
    );

    const user = result.rows[0];
    if (user.status !== "active") {
      return res.status(403).json({ error: "user_disabled" });
    }

    await ensureQuotaAccount(pool, user.id);
    const token = signUser(user);
    return res.json({ token, user });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", authRequired, async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(devStore.getUserById(req.user.id));
    }
    const result = await pool.query(
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
    return res.json(result.rows[0] || null);
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", (req, res) => {
  res.json({ ok: true });
});

module.exports = { authRouter };
