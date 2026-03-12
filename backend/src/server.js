const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const express = require("express");
const app = express();

const { authRouter } = require("./routes/auth");
const { meRouter } = require("./routes/me");
const { adminRouter } = require("./routes/admin");
const { ledgerRouter } = require("./routes/ledger");

app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/admin", adminRouter);
app.use("/ledger", ledgerRouter);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API running on :${port}`);
});
