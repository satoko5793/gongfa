async function createExternalOrder() {
  const err = new Error("external_order_not_supported_in_db_mode");
  err.statusCode = 501;
  throw err;
}

module.exports = {
  mode: "pg",
  createExternalOrder,
};
