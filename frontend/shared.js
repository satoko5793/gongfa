const SESSION_KEY = "gongfa_session_v1";
const HELPER_ORIGIN_KEY = "gongfa_helper_origin_v1";

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

export function getHelperOrigin() {
  return window.localStorage.getItem(HELPER_ORIGIN_KEY) || "http://localhost:3000";
}

export function setHelperOrigin(origin) {
  window.localStorage.setItem(HELPER_ORIGIN_KEY, origin);
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", { hour12: false });
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

  if (!gameRoleId || !gameServer || !gameRoleName) return null;

  return {
    game_role_id: String(gameRoleId),
    game_server: String(gameServer),
    game_role_name: String(gameRoleName),
    bind_token_id: String(bindTokenId || ""),
    nickname: String(nickname || ""),
  };
}

export async function apiFetch(path, options = {}) {
  const session = loadSession();
  const headers = {
    "Content-Type": "application/json",
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
    const error = new Error(data?.error || response.statusText);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}
