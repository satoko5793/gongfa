import { ADMIN_ROLES, isAdminRole } from "./app-constants.js?v=release-20260611-151806";

export function getEntrySessionProfile(session) {
  if (!session || typeof session !== "object") return null;
  const source =
    session.profile && typeof session.profile === "object"
      ? session.profile
      : session.user && typeof session.user === "object"
        ? session.user
        : null;
  if (!source) return null;
  return {
    ...source,
    game_role_id: source.game_role_id || "",
    game_server: source.game_server || "direct",
    game_role_name: source.game_role_name || "已登录",
    role: source.role || "user",
    auth_provider: source.auth_provider || "password",
    quota_balance: Number(source.quota_balance ?? 0),
  };
}

export function applyEntryNavSessionState(profile) {
  const navBindLink = document.getElementById("nav-bind-link");
  const navAdminLink = document.getElementById("nav-admin-link");
  const loggedIn = Boolean(profile);
  const isAdmin = isAdminRole(profile?.role);

  if (navBindLink) {
    navBindLink.classList.toggle("hidden", loggedIn);
  }
  if (navAdminLink) {
    navAdminLink.classList.toggle("hidden", !isAdmin);
  }
}

export function renderEntrySessionSummary(profile) {
  const sessionSummary = document.getElementById("session-summary");
  const sessionRole = document.getElementById("session-role");
  if (!sessionSummary || !sessionRole) return;

  if (!profile) {
    sessionSummary.textContent = "未登录";
    sessionRole.textContent = "请先登录账号再充值或下单。";
    return;
  }

  sessionSummary.textContent = profile.game_role_name || "已登录";
  const authLabel = profile.auth_provider === "password" ? "密码登录" : "绑定登录";
  const serverText = profile.game_server || "未填写区服";
  const roleLabel =
    profile.role === ADMIN_ROLES.ADMIN
      ? "管理员"
      : profile.role === ADMIN_ROLES.POSTER_ADMIN
        ? "海报后台"
        : profile.role || "用户";
  sessionRole.textContent = `${serverText} / ${roleLabel} / ${authLabel}`;
}
