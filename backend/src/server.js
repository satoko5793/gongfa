const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const express = require("express");
const app = express();

const { authRouter } = require("./routes/auth");
const { productsRouter } = require("./routes/products");
const { meRouter } = require("./routes/me");
const { ordersRouter } = require("./routes/orders");
const { adminRouter } = require("./routes/admin");
const { helperRouter } = require("./routes/helper");

function parseAllowedOrigin(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  try {
    return new URL(normalized).origin;
  } catch {
    return "";
  }
}

const helperAllowedOrigins = new Set([parseAllowedOrigin(process.env.HELPER_ORIGIN)].filter(Boolean));

function helperCors(req, res, next) {
  const requestOrigin = String(req.headers.origin || "").trim();
  if (requestOrigin && helperAllowedOrigins.has(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  }
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  return next();
}

app.use(express.json({ limit: "5mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/me", meRouter);
app.use("/orders", ordersRouter);
app.use("/admin", adminRouter);
app.use("/helper", helperCors, helperRouter);
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
