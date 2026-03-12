const express = require("express");
const { pool } = require("../db/pool");
const { authRequired } = require("../middlewares/auth");
const { validateParticipantInput } = require("../services/validate");

const meRouter = express.Router();
meRouter.use(authRequired);

meRouter.get("/participant", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM participants WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
    [req.user.id]
  );
  return res.json(result.rows[0] || null);
});

meRouter.post("/participant", async (req, res) => {
  const body = req.body || {};
  const errors = validateParticipantInput(body);
  if (errors.length) return res.status(400).json({ error: "invalid_input", details: errors });

  const result = await pool.query(
    `INSERT INTO participants
      (user_id, game_name, need_help_this_week, coupons_received, game_id, lian_gong_mode, contact_wechat, status, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',NOW(),NOW())
     RETURNING *`,
    [
      req.user.id,
      body.game_name,
      body.need_help_this_week,
      body.coupons_received,
      body.game_id,
      body.lian_gong_mode,
      body.contact_wechat,
    ]
  );
  return res.json(result.rows[0]);
});

meRouter.patch("/participant", async (req, res) => {
  const body = req.body || {};
  const errors = validateParticipantInput(body);
  if (errors.length) return res.status(400).json({ error: "invalid_input", details: errors });

  const result = await pool.query(
    `UPDATE participants SET
      game_name=$2,
      need_help_this_week=$3,
      coupons_received=$4,
      game_id=$5,
      lian_gong_mode=$6,
      contact_wechat=$7,
      updated_at=NOW()
     WHERE user_id=$1 AND status='pending'
     RETURNING *`,
    [
      req.user.id,
      body.game_name,
      body.need_help_this_week,
      body.coupons_received,
      body.game_id,
      body.lian_gong_mode,
      body.contact_wechat,
    ]
  );
  if (result.rowCount === 0) return res.status(400).json({ error: "not_pending" });
  return res.json(result.rows[0]);
});

module.exports = { meRouter };
