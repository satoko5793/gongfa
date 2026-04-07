const { pool } = require("../db/pool");

async function ensureQuotaAccount(db = pool, userId) {
  await db.query(
    `INSERT INTO user_quota_accounts (user_id, balance, updated_at)
     VALUES ($1, 0, NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

async function applyQuotaChange(
  db = pool,
  { userId, changeAmount, type, orderId = null, remark = null }
) {
  await ensureQuotaAccount(db, userId);

  const result = await db.query(
    "SELECT balance FROM user_quota_accounts WHERE user_id=$1 FOR UPDATE",
    [userId]
  );
  const balance = Number(result.rows[0]?.balance || 0);
  const nextBalance = balance + Number(changeAmount);

  await db.query(
    "UPDATE user_quota_accounts SET balance=$2, updated_at=NOW() WHERE user_id=$1",
    [userId, nextBalance]
  );

  await db.query(
    `INSERT INTO quota_logs (user_id, change_amount, type, order_id, remark, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId, changeAmount, type, orderId, remark]
  );

  return nextBalance;
}

module.exports = { ensureQuotaAccount, applyQuotaChange };
