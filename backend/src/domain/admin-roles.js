const ADMIN_ROLES = Object.freeze({
  ADMIN: "admin",
  POSTER_ADMIN: "poster_admin",
});

const ADMIN_READ_ROLE_VALUES = Object.freeze([
  ADMIN_ROLES.ADMIN,
  ADMIN_ROLES.POSTER_ADMIN,
]);

const ADMIN_WRITE_ROLE_VALUES = Object.freeze([ADMIN_ROLES.ADMIN]);

function normalizeRole(role) {
  return String(role || "").trim();
}

function canReadAdmin(role) {
  return ADMIN_READ_ROLE_VALUES.includes(normalizeRole(role));
}

function canWriteAdmin(role) {
  return ADMIN_WRITE_ROLE_VALUES.includes(normalizeRole(role));
}

module.exports = {
  ADMIN_ROLES,
  ADMIN_READ_ROLE_VALUES,
  ADMIN_WRITE_ROLE_VALUES,
  canReadAdmin,
  canWriteAdmin,
  normalizeRole,
};
