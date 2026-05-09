export const ADMIN_ROLES = Object.freeze({
  ADMIN: "admin",
  POSTER_ADMIN: "poster_admin",
});

export const ADMIN_READ_ROLE_VALUES = Object.freeze([
  ADMIN_ROLES.ADMIN,
  ADMIN_ROLES.POSTER_ADMIN,
]);

export const ADMIN_WRITE_ROLE_VALUES = Object.freeze([ADMIN_ROLES.ADMIN]);

export const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCEL_REQUESTED: "cancel_requested",
  CANCELLED: "cancelled",
});

export const RECHARGE_ORDER_STATUS = Object.freeze({
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const QUOTA_LOG_TYPES = Object.freeze({
  ADMIN_ADD: "admin_add",
  ADMIN_SUBTRACT: "admin_subtract",
  RECHARGE_CREDIT: "recharge_credit",
});

export function isAdminRole(role) {
  return ADMIN_READ_ROLE_VALUES.includes(String(role || "").trim());
}

