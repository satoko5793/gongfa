const SESSION_KEY = "gongfa_session_v1";
const HELPER_ORIGIN_KEY = "gongfa_helper_origin_v1";
const HELPER_BRIDGE_SESSION_KEY = "gongfa_helper_bridge_session_v1";
const HELPER_BRIDGE_INTENT_KEY = "gongfa_helper_bridge_intent_v1";
const DEFAULT_HELPER_ORIGIN = "http://localhost:3000";

export function loadSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function loadHelperBridgeSession() {
  try {
    return JSON.parse(window.localStorage.getItem(HELPER_BRIDGE_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveHelperBridgeSession(session) {
  window.localStorage.setItem(HELPER_BRIDGE_SESSION_KEY, JSON.stringify(session || null));
}

export function clearHelperBridgeSession() {
  window.localStorage.removeItem(HELPER_BRIDGE_SESSION_KEY);
}

export function loadHelperBridgeIntent() {
  return window.localStorage.getItem(HELPER_BRIDGE_INTENT_KEY) || "";
}

export function saveHelperBridgeIntent(intent) {
  const normalizedIntent = String(intent || "").trim();
  if (!normalizedIntent) {
    window.localStorage.removeItem(HELPER_BRIDGE_INTENT_KEY);
    return;
  }
  window.localStorage.setItem(HELPER_BRIDGE_INTENT_KEY, normalizedIntent);
}

export function clearHelperBridgeIntent() {
  window.localStorage.removeItem(HELPER_BRIDGE_INTENT_KEY);
}

export function getHelperOrigin() {
  return window.localStorage.getItem(HELPER_ORIGIN_KEY) || DEFAULT_HELPER_ORIGIN;
}

export function setHelperOrigin(origin) {
  window.localStorage.setItem(HELPER_ORIGIN_KEY, origin);
}

export function ensureHelperOrigin(origin) {
  const current = window.localStorage.getItem(HELPER_ORIGIN_KEY);
  if (current) return current;
  const nextOrigin = String(origin || "").trim() || DEFAULT_HELPER_ORIGIN;
  window.localStorage.setItem(HELPER_ORIGIN_KEY, nextOrigin);
  return nextOrigin;
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", { hour12: false });
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function pickErrorMessage(error, fallback = "请求失败") {
  const details = error?.payload?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.join(", ");
  }
  return (
    error?.payload?.error ||
    error?.payload?.message ||
    error?.message ||
    error?.cause?.message ||
    error?.code ||
    fallback
  );
}

export function normalizeBindPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const source = payload.body && typeof payload.body === "object" ? payload.body : payload;
  const gameRoleId = source.game_role_id || source.roleId || source.role_id;
  const gameServer = source.game_server || source.server || source.gameServer;
  const gameRoleName =
    source.game_role_name || source.roleName || source.role_name || source.name;
  const bindTokenId = source.bind_token_id || source.tokenId || source.token_id || "";
  const nickname = source.nickname || source.nickName || "";
  const helperToken = source.helper_token || source.helperToken || "";
  const helperWsUrl = source.helper_ws_url || source.helperWsUrl || "";
  const helperImportMethod = source.helper_import_method || source.helperImportMethod || "";

  if (!gameRoleId || !gameServer || !gameRoleName) return null;

  return {
    game_role_id: String(gameRoleId),
    game_server: String(gameServer),
    game_role_name: String(gameRoleName),
    bind_token_id: String(bindTokenId || ""),
    nickname: String(nickname || ""),
    helper_token: String(helperToken || ""),
    helper_ws_url: String(helperWsUrl || ""),
    helper_import_method: String(helperImportMethod || ""),
  };
}

export async function apiFetch(path, options = {}) {
  const session = loadSession();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || response.statusText);
    error.status = response.status;
    error.code = data?.error || null;
    error.requestId = data?.request_id || null;
    error.payload = data;
    throw error;
  }

  return data;
}
