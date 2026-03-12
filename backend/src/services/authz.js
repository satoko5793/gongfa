const { pool } = require("../db/pool");

function isAdmin(user) {
  return user && user.role === "admin";
}

async function canAccessParticipant(user, participantId) {
  if (isAdmin(user)) return true;
  const result = await pool.query(
    "SELECT id FROM participants WHERE id=$1 AND user_id=$2",
    [participantId, user.id]
  );
  return result.rowCount > 0;
}

module.exports = { isAdmin, canAccessParticipant };
