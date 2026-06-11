const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

if (!String(process.env.JWT_SECRET || "").trim()) {
  throw new Error("JWT_SECRET is required before starting the server");
}

const express = require("express");
const app = express();
const { attachRequestContext, sendErrorResponse } = require("./domain/errors/http");

const { authRouter } = require("./routes/auth");
const { productsRouter } = require("./routes/products");
const { meRouter } = require("./routes/me");
const { ordersRouter } = require("./routes/orders");
const { adminRouter } = require("./routes/admin");
const { helperRouter } = require("./routes/helper");
const { getRuntimeDataDir } = require("./modules/orders/escrow-upload");

const NO_STORE_STATIC_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".css",
]);

const IMMUTABLE_STATIC_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
]);

function setStaticCacheHeaders(res, filePath) {
  const extension = path.extname(String(filePath || "")).toLowerCase();
  if (extension === ".html") {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return;
  }
  if (NO_STORE_STATIC_EXTENSIONS.has(extension)) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return;
  }
  if (IMMUTABLE_STATIC_EXTENSIONS.has(extension)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
}

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
app.use(attachRequestContext);

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/favicon.ico", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.redirect(302, "/favicon.svg");
});

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/me", meRouter);
app.use("/orders", ordersRouter);
app.use("/admin", adminRouter);
app.use("/helper", helperCors, helperRouter);
app.use(
  "/uploads",
  express.static(path.resolve(getRuntimeDataDir(), "uploads"), {
    setHeaders: setStaticCacheHeaders,
  })
);
app.get("/index.html", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.redirect(302, "/shop.html");
});
app.use(
  "/helper-public",
  express.static(path.resolve(__dirname, "..", "..", "xyzw_web_helper", "public"), {
    setHeaders: setStaticCacheHeaders,
  })
);
app.use(
  express.static(path.resolve(__dirname, "..", "..", "frontend"), {
    index: false,
    setHeaders: setStaticCacheHeaders,
  })
);

app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.resolve(__dirname, "..", "..", "frontend", "shop.html"));
});

app.use((err, req, res, next) => {
  console.error("[request_error]", {
    request_id: req.requestId || null,
    method: req.method,
    path: req.originalUrl || req.url,
    error: err?.errorCode || err?.message || "internal_error",
    status: err?.statusCode || err?.status || 500,
  }, err);
  sendErrorResponse(res, err, req);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API running on :${port}`);
});
