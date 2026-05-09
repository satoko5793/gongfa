const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = "/Users/xyq/Desktop/123/gongfa";
const FRONTEND = path.join(ROOT, "frontend");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function sizeOf(file) {
  return fs.statSync(file).size;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function includesAll(source, patterns, label) {
  patterns.forEach((pattern) => {
    assert(source.includes(pattern), `${label} 缺少关键片段: ${pattern}`);
  });
}

function excludesAll(source, patterns, label) {
  patterns.forEach((pattern) => {
    assert(!source.includes(pattern), `${label} 不应包含片段: ${pattern}`);
  });
}

function validateHtmlEntries() {
  const files = [
    ["shop.html", 16000],
    ["login.html", 10000],
    ["me.html", 14000],
    ["script.html", 10000],
    ["auction.html", 8000],
  ];

  files.forEach(([name, maxSize]) => {
    const file = path.join(FRONTEND, name);
    const source = read(file);
    const bytes = sizeOf(file);
    assert(bytes <= maxSize, `${name} 体积超出阈值: ${bytes} > ${maxSize}`);
    assert(!source.includes('src="./app.js'), `${name} 不应直接挂载 app.js`);
    assert(source.includes('type="module" src="./'), `${name} 缺少页面入口脚本`);
  });
}

function validateEntryScripts() {
  const loginEntry = read(path.join(FRONTEND, "login-entry.js"));
  const shopEntry = read(path.join(FRONTEND, "shop-entry.js"));
  const meEntry = read(path.join(FRONTEND, "me-entry.js"));
  const scriptEntry = read(path.join(FRONTEND, "script-entry.js"));
  const auctionEntry = read(path.join(FRONTEND, "auction-entry.js"));
  const bootstrap = read(path.join(FRONTEND, "page-entry-bootstrap.js"));

  includesAll(bootstrap, ["autoBoot = true", "wakeTargets = null"], "page-entry-bootstrap.js");

  includesAll(loginEntry, ["handleLazyHelperAuthClick", "import(APP_MODULE_SRC)", "POST_AUTH_TARGET_KEY"], "login-entry.js");
  excludesAll(loginEntry, ["bootDeferredPageEntry(", 'from "./page-runtime/auth-post-auth-runtime.js"'], "login-entry.js");

  includesAll(
    shopEntry,
    ["IntersectionObserver", "startShopLiteShell"],
    "shop-entry.js"
  );
  excludesAll(
    shopEntry,
    ["[productsSection, beginnerFlowSection, discountProductsSection]", "scheduleDeferredBootstrap(", "requestIdleCallback(start"],
    "shop-entry.js"
  );

  includesAll(meEntry, ["autoBoot: false", "hydrateLiteAccountOverview"], "me-entry.js");
  excludesAll(meEntry, ["document.addEventListener("], "me-entry.js");
  includesAll(
    meEntry,
    ["bindWakeOnElement(accountProfileForm", "bindWakeOnElement(rechargePanel", "shouldWakeHeavyAccountModule(targetTab)"],
    "me-entry.js"
  );
  includesAll(scriptEntry, ["autoBoot: false", "helperSaveBindBtn", "helperBuyPermanentSlotBtn"], "script-entry.js");
  excludesAll(scriptEntry, ["wakeTargets: [helperLabSection]"], "script-entry.js");
  includesAll(auctionEntry, ["autoBoot: false", "wakeTargets: false", "startAuctionLiteShell"], "auction-entry.js");
}

function validateLiteModules() {
  const shopLite = read(path.join(FRONTEND, "page-entry-shop-lite.js"));
  const accountLite = read(path.join(FRONTEND, "page-entry-account-lite.js"));
  const helperLite = read(path.join(FRONTEND, "page-entry-helper-lite.js"));
  const auctionLite = read(path.join(FRONTEND, "page-entry-auction-lite.js"));

  includesAll(shopLite, ["loadLiteStorefront", 'apiFetch("/products")'], "page-entry-shop-lite.js");
  includesAll(accountLite, ["hydrateLiteAccountOverview", 'apiFetch("/auth/me")'], "page-entry-account-lite.js");
  includesAll(helperLite, ["prepareHelperLiteShell", "bindWakeOnHelperIntent"], "page-entry-helper-lite.js");
  includesAll(
    auctionLite,
    [
      "loadLiteAuctionsAndQuota",
      'apiFetch("/products/auctions")',
      'apiFetch("/me/quota")',
      "bindLiteDrawWake",
      "bindLiteAuctionWake",
      'data-lite-auction-action="wake"',
    ],
    "page-entry-auction-lite.js"
  );
}

function extractScriptPath(html, scriptName) {
  const pattern = new RegExp(`<script[^>]+src="([^"]*${scriptName.replace(".", "\\.")}[^"]*)"`);
  const match = html.match(pattern);
  assert(match, `无法在页面里找到 ${scriptName}`);
  return match[1];
}

function extractStylePath(html) {
  const match = html.match(/<link[^>]+href="([^"]*styles\.css[^"]*)"/);
  assert(match, "无法在页面里找到 styles.css");
  return match[1];
}

async function fetchHeaders(baseUrl, pathname) {
  const url = new URL(pathname, baseUrl).toString();
  const response = await fetch(url, { method: "HEAD" });
  assert(response.ok, `${url} 响应失败: ${response.status}`);
  return response.headers;
}

async function validateResponseHeaders(baseUrl) {
  const rootHtmlResponse = await fetch(new URL("/", baseUrl).toString());
  assert(rootHtmlResponse.ok, `根页面请求失败: ${rootHtmlResponse.status}`);
  const rootHtml = await rootHtmlResponse.text();
  const stylePath = extractStylePath(rootHtml);
  const shopEntryPath = extractScriptPath(rootHtml, "shop-entry.js");

  const shopEntryResponse = await fetch(new URL(shopEntryPath, baseUrl).toString());
  assert(shopEntryResponse.ok, `商城入口请求失败: ${shopEntryResponse.status}`);
  const shopEntrySource = await shopEntryResponse.text();
  const appMatch = shopEntrySource.match(/APP_MODULE_SRC\s*=\s*"([^"]*app\.js[^"]*)"/);
  assert(appMatch, "shop-entry.js 缺少 app.js 入口");
  const appPath = appMatch[1];

  const rootHeaders = await fetchHeaders(baseUrl, "/");
  const cssHeaders = await fetchHeaders(baseUrl, stylePath);
  const shopEntryHeaders = await fetchHeaders(baseUrl, shopEntryPath);
  const appHeaders = await fetchHeaders(baseUrl, appPath);

  assert(
    String(rootHeaders.get("cache-control") || "").includes("no-store"),
    "根页面 HTML 应保持 no-store"
  );
  assert(
    String(cssHeaders.get("cache-control") || "").includes("no-store"),
    "styles.css 应保持 no-store"
  );
  assert(
    String(shopEntryHeaders.get("cache-control") || "").includes("no-store"),
    "shop-entry.js 应保持 no-store"
  );
  assert(
    String(appHeaders.get("cache-control") || "").includes("no-store"),
    "app.js 应保持 no-store"
  );
}

function parseBaseUrl() {
  const flagIndex = process.argv.indexOf("--base-url");
  if (flagIndex === -1) return "";
  return String(process.argv[flagIndex + 1] || "").trim();
}

async function main() {
  validateHtmlEntries();
  validateEntryScripts();
  validateLiteModules();
  const baseUrl = parseBaseUrl();
  if (baseUrl) {
    await validateResponseHeaders(baseUrl);
  }
  console.log("[ok] entry performance validation passed");
}

main().catch((error) => {
  console.error(`[error] ${error.message || error}`);
  process.exit(1);
});
