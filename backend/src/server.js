const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const express = require("express");
const app = express();

const { authRouter } = require("./routes/auth");
const { productsRouter } = require("./routes/products");
const { meRouter } = require("./routes/me");
const { ordersRouter } = require("./routes/orders");
const { adminRouter } = require("./routes/admin");

app.use(express.json({ limit: "5mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/me", meRouter);
app.use("/orders", ordersRouter);
app.use("/admin", adminRouter);
app.use(
  "/helper-public",
  express.static(path.resolve(__dirname, "..", "..", "xyzw_web_helper", "public"))
);
app.use(express.static(path.resolve(__dirname, "..", "..", "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "..", "frontend", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "internal_error" });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API running on :${port}`);
});
