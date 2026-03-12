const express = require("express");
const { pool } = require("../db/pool");
const { authRequired } = require("../middlewares/auth");
const { validateLedgerInput } = require("../services/validate");
const { canAccessParticipant } = require("../services/authz");

const ledgerRouter = express.Router();
ledgerRouter.use(authRequired);

ledgerRouter.get("/", async (req, res) => {
  const participantId = req.query.participant_id;
  if (!participantId) return res.status(400).json({ error: "participant_id_required" });

  const allowed = await canAccessParticipant(req.user, participantId);
  if (!allowed) return res.status(403).json({ error: "forbidden" });

  const result = await pool.query(
    "SELECT * FROM ledger_entries WHERE participant_id=$1 ORDER BY created_at DESC",
    [participantId]
  );
  return res.json(result.rows);
});

ledgerRouter.post("/", async (req, res) => {
  const body = req.body || {};
  const errors = validateLedgerInput(body);
  if (errors.length) return res.status(400).json({ error: "invalid_input", details: errors });

  const allowed = await canAccessParticipant(req.user, body.participant_id);
  if (!allowed) return res.status(403).json({ error: "forbidden" });

  const result = await pool.query(
    `INSERT INTO ledger_entries
      (participant_id, type, amount, card_type, card_count, note, status, created_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
     RETURNING *`,
    [
      body.participant_id,
      body.type,
      body.amount,
      body.card_type,
      body.card_count,
      body.note,
      body.status || "pending",
      req.user.id,
    ]
  );
  return res.json(result.rows[0]);
});

ledgerRouter.patch("/:id", async (req, res) => {
  const body = req.body || {};
  const result = await pool.query(
    `UPDATE ledger_entries SET
      status=$2,
      note=$3
     WHERE id=$1
     RETURNING *`,
    [req.params.id, body.status, body.note]
  );
  return res.json(result.rows[0]);
});

module.exports = { ledgerRouter };
