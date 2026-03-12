const { pool } = require("../db/pool");

async function createSmsCode(phone, code, expiresAt) {
  await pool.query(
    "INSERT INTO sms_codes (phone, code, expires_at, created_at) VALUES ($1, $2, $3, NOW())",
    [phone, code, expiresAt]
  );
}

async function useSmsCode(phone, code) {
  const result = await pool.query(
    "SELECT id, expires_at, used_at FROM sms_codes WHERE phone=$1 AND code=$2 ORDER BY created_at DESC LIMIT 1",
    [phone, code]
  );
  if (result.rowCount === 0) return { ok: false, reason: "not_found" };

  const row = result.rows[0];
  if (row.used_at) return { ok: false, reason: "used" };
  if (new Date(row.expires_at) < new Date()) return { ok: false, reason: "expired" };

  await pool.query("UPDATE sms_codes SET used_at=NOW() WHERE id=$1", [row.id]);
  return { ok: true };
}

module.exports = { createSmsCode, useSmsCode };
