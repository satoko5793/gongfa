const { pool } = require("../db/pool");

function isAdmin(user) {
  return user && user.role === "admin";
}

async function canAccessOrder(user, orderId) {
  if (isAdmin(user)) return true;
  const result = await pool.query("SELECT id FROM orders WHERE id=$1 AND user_id=$2", [
    orderId,
    user.id,
  ]);
  return result.rowCount > 0;
}

module.exports = { isAdmin, canAccessOrder };
