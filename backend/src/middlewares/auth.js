const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");
const { canReadAdmin, canWriteAdmin } = require("../domain/admin-roles");
const { getCurrentUser: getCurrentFileUser } = require("../modules/auth/file-service");
const { useFileStore } = require("../services/runtime");

async function getCurrentUserFromStore(userId) {
  if (useFileStore()) {
    return getCurrentFileUser(userId);
  }

  const result = await pool.query(
    `SELECT
      id,
      role,
      status,
      auth_provider,
      game_role_id,
      game_server,
      game_role_name,
      bind_token_id,
      nickname
     FROM users
     WHERE id=$1
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function hydrateCurrentUser(payload) {
  const currentUser = await getCurrentUserFromStore(payload.id);
  if (!currentUser) {
    const err = new Error("invalid_token");
    err.statusCode = 401;
    throw err;
  }
  if (currentUser.status !== "active") {
    const err = new Error("user_disabled");
    err.statusCode = 403;
    throw err;
  }
  return {
    ...payload,
    ...currentUser,
    id: Number(currentUser.id),
  };
}

async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await hydrateCurrentUser(payload);
    return next();
  } catch (e) {
    if (e?.statusCode === 403) {
      return res.status(403).json({ error: e.message || "user_disabled" });
    }
    return res.status(401).json({ error: "invalid_token" });
  }
}

async function authOptional(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await hydrateCurrentUser(jwt.verify(token, process.env.JWT_SECRET));
  } catch (e) {
    req.user = null;
  }
  return next();
}

function adminOnly(req, res, next) {
  if (!req.user || !canWriteAdmin(req.user.role)) {
    return res.status(403).json({ error: "admin_only" });
  }
  return next();
}

function adminReadOnly(req, res, next) {
  if (!req.user || !canReadAdmin(req.user.role)) {
    return res.status(403).json({ error: "admin_only" });
  }
  return next();
}

function adminWriteOnly(req, res, next) {
  if (!req.user || !canWriteAdmin(req.user.role)) {
    return res.status(403).json({ error: "admin_write_only" });
  }
  return next();
}

module.exports = { authRequired, authOptional, adminOnly, adminReadOnly, adminWriteOnly };
