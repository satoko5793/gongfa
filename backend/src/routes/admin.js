const express = require("express");
const { pool } = require("../db/pool");
const { authRequired, adminOnly } = require("../middlewares/auth");
const { writeAuditLog } = require("../services/audit");

const adminRouter = express.Router();
adminRouter.use(authRequired, adminOnly);

adminRouter.get("/participants", async (req, res) => {
  const result = await pool.query(
    "SELECT p.*, u.phone FROM participants p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC"
  );
  return res.json(result.rows);
});

adminRouter.patch("/participants/:id/admin-fields", async (req, res) => {
  const body = req.body || {};
  const result = await pool.query(
    `INSERT INTO admin_fields
      (participant_id, coupons_given, card_green, card_blue, card_purple, card_orange, card_red, card_gold, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
     ON CONFLICT (participant_id)
     DO UPDATE SET
      coupons_given=EXCLUDED.coupons_given,
      card_green=EXCLUDED.card_green,
      card_blue=EXCLUDED.card_blue,
      card_purple=EXCLUDED.card_purple,
      card_orange=EXCLUDED.card_orange,
      card_red=EXCLUDED.card_red,
      card_gold=EXCLUDED.card_gold,
      updated_at=NOW()
     RETURNING *`,
    [
      req.params.id,
      body.coupons_given,
      body.card_green,
      body.card_blue,
      body.card_purple,
      body.card_orange,
      body.card_red,
      body.card_gold,
    ]
  );

  await writeAuditLog({
    participantId: req.params.id,
    adminId: req.user.id,
    action: "admin_fields_update",
    remark: null,
  });

  return res.json(result.rows[0]);
});

adminRouter.patch("/participants/:id/status", async (req, res) => {
  const { status, remark } = req.body || {};
  const result = await pool.query(
    "UPDATE participants SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *",
    [req.params.id, status]
  );

  await writeAuditLog({
    participantId: req.params.id,
    adminId: req.user.id,
    action: `status_${status}`,
    remark: remark || null,
  });

  return res.json(result.rows[0]);
});

adminRouter.get("/audit-logs", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500"
  );
  return res.json(result.rows);
});

module.exports = { adminRouter };
