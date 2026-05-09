const { pool } = require("../../db/pool");
const { applyQuotaChange, ensureQuotaAccount } = require("../../services/quota");
const { writeAuditLog } = require("../../services/audit");
const { QUOTA_LOG_TYPES } = require("../../domain/quota-log-types");
const { AUDIT_ACTIONS } = require("../../domain/audit-actions");

function notFoundError(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

async function changeUserQuota({ userId, changeAmount, remark, actorUserId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [userId]);
    if (userResult.rowCount === 0) {
      await client.query("ROLLBACK");
      throw notFoundError("user_not_found");
    }

    await ensureQuotaAccount(client, userId);
    const nextBalance = await applyQuotaChange(client, {
      userId: Number(userId),
      changeAmount,
      type: changeAmount > 0 ? QUOTA_LOG_TYPES.ADMIN_ADD : QUOTA_LOG_TYPES.ADMIN_SUBTRACT,
      remark,
    });

    await writeAuditLog(
      {
        actorUserId,
        targetType: "user",
        targetId: Number(userId),
        action: AUDIT_ACTIONS.USER_QUOTA_CHANGE,
        detail: { change_amount: changeAmount, next_balance: nextBalance },
      },
      client
    );

    await client.query("COMMIT");
    return { user_id: Number(userId), balance: nextBalance };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignore rollback cleanup errors
    }
    throw error;
  } finally {
    client.release();
  }
}

async function updateUserStatus({ userId, status, actorUserId }) {
  const result = await pool.query(
    "UPDATE users SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *",
    [userId, status]
  );
  if (result.rowCount === 0) {
    throw notFoundError("user_not_found");
  }

  await writeAuditLog({
    actorUserId,
    targetType: "user",
    targetId: Number(userId),
    action: AUDIT_ACTIONS.USER_STATUS_UPDATE,
    detail: { status },
  });

  return result.rows[0];
}

async function updateUserHelperCapabilities() {
  const err = new Error("helper_capabilities_not_supported_in_db_mode");
  err.statusCode = 501;
  throw err;
}

module.exports = {
  mode: "pg",
  changeUserQuota,
  updateUserStatus,
  updateUserHelperCapabilities,
};
