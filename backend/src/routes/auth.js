const express = require("express");
const { pool } = require("../db/pool");
const { signUser } = require("../services/jwt");
const { sendSmsCode } = require("../services/sms");
const { createSmsCode, useSmsCode } = require("../services/sms-store");

const authRouter = express.Router();

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

authRouter.post("/sms/send", async (req, res) => {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: "phone_required" });

  const code = genCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await createSmsCode(phone, code, expiresAt);
  await sendSmsCode(phone, code);

  return res.json({ ok: true });
});

authRouter.post("/sms/verify", async (req, res) => {
  const { phone, code } = req.body || {};
  if (!phone || !code) return res.status(400).json({ error: "phone_code_required" });

  const check = await useSmsCode(phone, code);
  if (!check.ok) return res.status(400).json({ error: check.reason });

  const existing = await pool.query("SELECT id, phone, role FROM users WHERE phone=$1", [phone]);
  let user;
  if (existing.rowCount === 0) {
    const inserted = await pool.query(
      "INSERT INTO users (phone, role, status, created_at) VALUES ($1, 'user', 'active', NOW()) RETURNING id, phone, role",
      [phone]
    );
    user = inserted.rows[0];
  } else {
    user = existing.rows[0];
  }

  const token = signUser(user);
  return res.json({ token, user });
});

module.exports = { authRouter };
