const { pool } = require("../db/pool");

async function writeAuditLog(
  { actorUserId, targetType, targetId, action, detail = null },
  db = pool
) {
  await db.query(
    `INSERT INTO audit_logs
      (actor_user_id, target_type, target_id, action, detail, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [actorUserId || null, targetType, targetId, action, detail]
  );
}

module.exports = { writeAuditLog };
