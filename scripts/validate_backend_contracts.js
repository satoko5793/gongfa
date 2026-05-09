#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const jwt = require(path.join(__dirname, "..", "backend", "node_modules", "jsonwebtoken"));

const repoRoot = path.resolve(__dirname, "..");

function fail(message) {
  console.error(`[fail] ${message}`);
  process.exit(1);
}

function check(message) {
  console.log(`[check] ${message}`);
}

function ok(message) {
  console.log(`[ok] ${message}`);
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assertFileExists(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`missing required file: ${relativePath}`);
  }
}

function assertIncludes(relativePath, pattern) {
  const content = read(path.join(repoRoot, relativePath));
  if (!content.includes(pattern)) {
    fail(`${relativePath} missing expected pattern: ${pattern}`);
  }
}

function assertNotIncludes(relativePath, pattern) {
  const content = read(path.join(repoRoot, relativePath));
  if (content.includes(pattern)) {
    fail(`${relativePath} still contains forbidden literal: ${pattern}`);
  }
}

async function fetchJson(baseUrl, pathname, options = {}) {
  const response = await fetch(new URL(pathname, baseUrl), options);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { response, data };
}

function assertErrorEnvelope(result, expectedStatus) {
  if (result.response.status !== expectedStatus) {
    fail(`expected HTTP ${expectedStatus}, got ${result.response.status}`);
  }
  const payload = result.data;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    fail(`expected JSON object error payload, got ${typeof payload}`);
  }
  if (!payload.error || !payload.message || !payload.request_id) {
    fail(`error payload missing required fields: ${JSON.stringify(payload)}`);
  }
  const headerRequestId = result.response.headers.get("x-request-id");
  if (!headerRequestId) {
    fail("missing X-Request-Id header");
  }
}

function buildAdminToken(options = {}) {
  if (options.adminToken) return options.adminToken;
  if (!options.adminJwtSecret) return "";
  return jwt.sign(
    {
      id: Number(options.adminUserId || 8),
      role: String(options.adminRole || "admin"),
      status: "active",
      game_role_id: String(options.adminGameRoleId || "584967604"),
      game_server: String(options.adminGameServer || "direct"),
      game_role_name: String(options.adminGameRoleName || "繁星✨秋"),
      auth_provider: String(options.adminAuthProvider || "password"),
    },
    options.adminJwtSecret,
    { expiresIn: "1h" }
  );
}

async function runAuthenticatedAdminChecks(baseUrl, options = {}) {
  const adminToken = buildAdminToken(options);
  if (!adminToken) return;

  check("checking authenticated admin recharge-config roundtrip");
  const headers = {
    Authorization: `Bearer ${adminToken}`,
  };
  const configResult = await fetchJson(baseUrl, "/admin/recharge-config", { headers });
  if (configResult.response.status !== 200 || !configResult.data || typeof configResult.data !== "object") {
    fail(`authenticated /admin/recharge-config failed: ${configResult.response.status}`);
  }
  if (!configResult.data.request_id) {
    fail("authenticated /admin/recharge-config missing request_id");
  }

  const patchBody = { ...configResult.data };
  delete patchBody.request_id;
  const patchResult = await fetchJson(baseUrl, "/admin/recharge-config", {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patchBody),
  });
  if (patchResult.response.status !== 200) {
    fail(`authenticated recharge-config PATCH failed: ${patchResult.response.status} ${JSON.stringify(patchResult.data)}`);
  }
  if (!patchResult.data?.request_id) {
    fail("authenticated recharge-config PATCH missing request_id");
  }
  if (!patchResult.data?.pricing_reprice_status) {
    fail("authenticated recharge-config PATCH missing pricing_reprice_status");
  }
}

async function runHttpChecks(baseUrl, options = {}) {
  check(`checking backend public health endpoint: ${baseUrl}`);
  const health = await fetchJson(baseUrl, "/health");
  if (health.response.status !== 200 || health.data?.ok !== true) {
    fail(`/health check failed: ${JSON.stringify(health.data)}`);
  }

  check("checking public products endpoint");
  const products = await fetchJson(baseUrl, "/products");
  if (products.response.status !== 200) {
    fail(`/products failed with ${products.response.status}`);
  }
  if (!Array.isArray(products.data) && !Array.isArray(products.data?.items)) {
    fail(`/products returned unexpected shape`);
  }

  check("checking unauthenticated auth/admin error envelopes");
  assertErrorEnvelope(await fetchJson(baseUrl, "/auth/me"), 401);
  assertErrorEnvelope(await fetchJson(baseUrl, "/admin/overview"), 401);
  assertErrorEnvelope(await fetchJson(baseUrl, "/admin/recharge-config"), 401);

  await runAuthenticatedAdminChecks(baseUrl, options);
}

async function main() {
  const args = process.argv.slice(2);
  function getArg(name, fallback = "") {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] || fallback : fallback;
  }
  const baseUrl = getArg("--base-url");
  const adminToken = getArg("--admin-token");
  const adminJwtSecret = getArg("--admin-jwt-secret");
  const adminUserId = getArg("--admin-user-id", "8");
  const adminRole = getArg("--admin-role", "admin");
  const adminGameRoleId = getArg("--admin-game-role-id", "584967604");
  const adminGameServer = getArg("--admin-game-server", "direct");
  const adminGameRoleName = getArg("--admin-game-role-name", "繁星✨秋");
  const adminAuthProvider = getArg("--admin-auth-provider", "password");

  check("checking backend constant modules");
  [
    "backend/src/domain/admin-roles.js",
    "backend/src/domain/recharge-order-status.js",
    "backend/src/domain/quota-log-types.js",
    "backend/src/domain/audit-actions.js",
    "backend/src/domain/errors/http.js",
  ].forEach(assertFileExists);

  check("checking backend request context and error envelope wiring");
  assertIncludes("backend/src/server.js", "attachRequestContext");
  assertIncludes("backend/src/server.js", "sendErrorResponse");
  assertIncludes("frontend/shared.js", "data?.request_id");

  check("checking critical backend files for centralized constants");
  assertIncludes("backend/src/middlewares/auth.js", "canReadAdmin");
  assertIncludes("backend/src/middlewares/auth.js", "canWriteAdmin");
  assertIncludes("backend/src/services/dev-store.js", "AUDIT_ACTIONS");
  assertIncludes("backend/src/services/dev-store.js", "QUOTA_LOG_TYPES");
  assertIncludes("backend/src/services/dev-store.js", "RECHARGE_ORDER_STATUS");
  assertIncludes("backend/src/repositories/pg/admin-pricing-repository.js", "AUDIT_ACTIONS");
  assertIncludes("backend/src/repositories/pg/admin-users-repository.js", "QUOTA_LOG_TYPES");
  assertIncludes("backend/src/routes/auth.js", 'modules/auth/file-service');
  assertIncludes("backend/src/routes/me.js", 'modules/me/file-service');
  assertIncludes("backend/src/routes/products.js", 'modules/products/file-service');
  assertIncludes("backend/src/routes/helper.js", 'modules/helper/file-service');

  assertNotIncludes("backend/src/middlewares/auth.js", 'new Set(["admin", "poster_admin"])');
  assertNotIncludes("backend/src/repositories/pg/admin-pricing-repository.js", 'action: "product_pricing_recalculate"');
  assertNotIncludes("backend/src/repositories/pg/admin-users-repository.js", 'type: changeAmount > 0 ? "admin_add" : "admin_subtract"');
  assertNotIncludes("backend/src/routes/auth.js", 'require("../services/dev-store")');
  assertNotIncludes("backend/src/routes/me.js", 'require("../services/dev-store")');
  assertNotIncludes("backend/src/routes/products.js", 'require("../services/dev-store")');
  assertNotIncludes("backend/src/routes/helper.js", 'require("../services/dev-store")');
  assertNotIncludes("backend/src/modules/auth/file-service.js", 'require("../../services/dev-store")');
  assertNotIncludes("backend/src/modules/me/file-service.js", 'require("../../services/dev-store")');
  assertNotIncludes("backend/src/modules/products/file-service.js", 'require("../../services/dev-store")');
  assertNotIncludes("backend/src/modules/helper/file-service.js", 'require("../../services/dev-store")');
  assertNotIncludes("frontend/admin-pages/catalog.js", "export function bindCatalogPageEvents() {\n  return null;\n}");
  assertNotIncludes("frontend/admin-pages/orders.js", "export function bindOrdersPageEvents() {\n  return null;\n}");
  assertNotIncludes("frontend/admin-pages/recharge.js", "export function bindRechargePageEvents() {\n  return null;\n}");
  assertNotIncludes("frontend/admin-pages/users.js", "export function bindUsersPageEvents() {\n  return null;\n}");
  assertNotIncludes("frontend/admin-pages/logs.js", "export function bindLogsPageEvents() {\n  return null;\n}");
  assertNotIncludes("frontend/admin-renderers/users.js", "return null;");
  assertNotIncludes("frontend/admin-renderers/logs.js", "return null;");
  assertNotIncludes("frontend/admin.js", 'usersRoot.addEventListener("click"');
  assertNotIncludes("frontend/admin.js", "function renderProducts(");
  assertNotIncludes("frontend/admin.js", "function renderOrders(");
  assertNotIncludes("frontend/admin.js", "function renderRechargeOrders(");
  assertNotIncludes("backend/src/domain/store/repositories/products-file-store.js", 'require("../../../services/dev-store")');
  assertNotIncludes("backend/src/domain/store/repositories/orders-file-store.js", 'require("../../../services/dev-store")');
  assertNotIncludes("backend/src/domain/store/repositories/users-file-store.js", 'require("../../../services/dev-store")');
  assertNotIncludes("backend/src/domain/store/repositories/admin-queries-file-store.js", 'require("../../../services/dev-store")');
  assertNotIncludes("backend/src/domain/store/repositories/helper-file-store.js", 'require("../../../services/dev-store")');
  assertNotIncludes("backend/src/domain/store/repositories/auctions-file-store.js", 'require("../../../services/dev-store")');
  assertNotIncludes("backend/src/domain/store/users-store.js", 'services/dev-store');
  assertNotIncludes("backend/src/domain/store/orders-store.js", 'services/dev-store');
  assertNotIncludes("backend/src/domain/store/auctions-store.js", 'services/dev-store');
  assertNotIncludes("backend/src/domain/store/products-store.js", 'services/dev-store');
  assertNotIncludes("backend/src/domain/store/shared-store-views.js", 'services/dev-store');

  if (baseUrl) {
    await runHttpChecks(baseUrl, {
      adminToken,
      adminJwtSecret,
      adminUserId,
      adminRole,
      adminGameRoleId,
      adminGameServer,
      adminGameRoleName,
      adminAuthProvider,
    });
  }

  ok("backend contract validation passed");
}

main().catch((error) => {
  fail(error?.message || String(error));
});
