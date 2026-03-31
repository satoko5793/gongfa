const jwt = require("jsonwebtoken");

const ADMIN_READ_ROLES = new Set(["admin", "poster_admin"]);
const ADMIN_WRITE_ROLES = new Set(["admin"]);

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || !ADMIN_WRITE_ROLES.has(String(req.user.role || "").trim())) {
    return res.status(403).json({ error: "admin_only" });
  }
  return next();
}

function adminReadOnly(req, res, next) {
  if (!req.user || !ADMIN_READ_ROLES.has(String(req.user.role || "").trim())) {
    return res.status(403).json({ error: "admin_only" });
  }
  return next();
}

function adminWriteOnly(req, res, next) {
  if (!req.user || !ADMIN_WRITE_ROLES.has(String(req.user.role || "").trim())) {
    return res.status(403).json({ error: "admin_write_only" });
  }
  return next();
}

module.exports = { authRequired, adminOnly, adminReadOnly, adminWriteOnly };
