const { pool } = require("../db/pool");

async function writeAuditLog({ participantId, adminId, action, remark }) {
  await pool.query(
    "INSERT INTO audit_logs (participant_id, admin_id, action, remark, created_at) VALUES ($1,$2,$3,$4,NOW())",
    [participantId, adminId, action, remark || null]
  );
}

module.exports = { writeAuditLog };
