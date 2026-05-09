import {
  apiFetch,
  clearSession,
  getHelperOrigin,
  saveSession,
  setHelperOrigin,
} from "./shared.js?v=release-20260509-160631";

window.__GONGFA_PAGE_MODE__ = "login";

const APP_MODULE_SRC = "./app.js?v=release-20260509-160631";
const POST_AUTH_TARGET_KEY = "gongfa_post_auth_target_v1";

const bindMessage = document.getElementById("bind-message");
const helperAuthMessage = document.getElementById("helper-auth-message");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const bindForm = document.getElementById("bind-form");
const logoutBtn = document.getElementById("logout-btn");
const helperOpenAuthPopupBtn = document.getElementById("helper-open-auth-popup-btn");
const helperOriginInput = document.getElementById("helper-origin-input");
const saveHelperOriginButton = document.getElementById("save-helper-origin-btn");
const openHelperButton = document.getElementById("open-helper-btn");
const registerRoleIdInput = document.getElementById("register-role-id");
const registerRoleNameInput = document.getElementById("register-role-name");
const registerPasswordInput = document.getElementById("register-password");
const registerPasswordConfirmInput = document.getElementById("register-password-confirm");
const loginRoleIdInput = document.getElementById("login-role-id");
const loginPasswordInput = document.getElementById("login-password");
const bindRoleIdInput = document.getElementById("bind-role-id");
const bindServerInput = document.getElementById("bind-server");
const bindRoleNameInput = document.getElementById("bind-role-name");
const bindTokenIdInput = document.getElementById("bind-token-id");
const bindNicknameInput = document.getElementById("bind-nickname");
const authTabButtons = Array.from(document.querySelectorAll("[data-auth-tab]"));
const authPanels = Array.from(document.querySelectorAll("[data-auth-panel]"));

let helperRuntimeLoaded = false;
let helperRuntimePromise = null;

function setNotice(text, type = "") {
  if (!bindMessage) return;
  bindMessage.textContent = text || "";
  bindMessage.className = type ? `notice ${type}` : "notice";
}

function setHelperAuthNotice(text, type = "") {
  if (!helperAuthMessage) return;
  helperAuthMessage.textContent = text || "";
  helperAuthMessage.className = text ? `notice ${type}` : "notice hidden";
}

function activateAuthTab(tab) {
  const activeTab = tab === "login" ? "login" : "register";
  authTabButtons.forEach((button) => {
    const isActive = button.getAttribute("data-auth-tab") === activeTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  authPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-auth-panel") !== activeTab);
  });
}

function syncRegisterPasswordValidation(report = false) {
  const password = registerPasswordInput?.value || "";
  const confirm = registerPasswordConfirmInput?.value || "";
  const mismatch = Boolean(confirm) && password !== confirm;
  if (registerPasswordConfirmInput) {
    registerPasswordConfirmInput.setCustomValidity(mismatch ? "两次输入的密码不一致" : "");
    if (report) {
      registerPasswordConfirmInput.reportValidity();
    }
  }
  return !mismatch;
}

function pickErrorMessage(error, fallback) {
  const explicitMessage =
    error?.payload?.error || error?.message || error?.cause?.message || fallback;
  return String(explicitMessage || fallback).trim() || fallback;
}

function navigateToAccountSurface() {
  window.location.href = "me.html#account";
}

function completeLightAuthNavigation() {
  try {
    window.sessionStorage.setItem(POST_AUTH_TARGET_KEY, "account");
  } catch {
    // Ignore storage failures and keep the auth flow usable.
  }
  navigateToAccountSurface();
}

function populateHelperOrigin() {
  if (!helperOriginInput) return;
  helperOriginInput.value = getHelperOrigin();
}

function handleSaveHelperOrigin() {
  if (!helperOriginInput) return;
  const nextOrigin = helperOriginInput.value.trim();
  if (!nextOrigin) {
    setNotice("请先填写 helper 地址。", "error");
    return;
  }
  setHelperOrigin(nextOrigin);
  setNotice("helper 地址已保存。", "success");
}

function handleOpenHelperTool() {
  const nextOrigin = helperOriginInput?.value.trim() || getHelperOrigin();
  if (!nextOrigin) {
    setNotice("请先填写 helper 地址。", "error");
    return;
  }
  setHelperOrigin(nextOrigin);
  window.open(nextOrigin, "_blank", "noopener,noreferrer");
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  registerRoleIdInput?.setCustomValidity("");
  if (!syncRegisterPasswordValidation(true)) {
    setNotice("两次输入的密码不一致，请重新确认。", "error");
    registerPasswordConfirmInput?.focus();
    return;
  }

  setNotice("正在注册...", "");
  try {
    const result = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: registerRoleIdInput?.value.trim() || "",
        game_role_name: registerRoleNameInput?.value.trim() || "",
        password: registerPasswordInput?.value || "",
      }),
    });
    saveSession(result);
    setNotice("注册成功，已自动登录。", "success");
    if (registerPasswordInput) registerPasswordInput.value = "";
    if (registerPasswordConfirmInput) registerPasswordConfirmInput.value = "";
    completeLightAuthNavigation();
  } catch (error) {
    const message = pickErrorMessage(error, "注册失败");
    if (error?.payload?.error === "game_role_id_taken" && registerRoleIdInput) {
      registerRoleIdInput.setCustomValidity("这个游戏 ID 已经注册过账号了，请直接登录。");
      registerRoleIdInput.reportValidity();
    }
    setNotice(`注册失败：${message}`, "error");
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  setNotice("正在登录...", "");
  try {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: loginRoleIdInput?.value.trim() || "",
        password: loginPasswordInput?.value || "",
      }),
    });
    saveSession(result);
    setNotice("登录成功。", "success");
    if (loginPasswordInput) loginPasswordInput.value = "";
    completeLightAuthNavigation();
  } catch (error) {
    setNotice(`登录失败：${pickErrorMessage(error, "登录失败")}`, "error");
  }
}

async function handleBindSubmit(event) {
  event.preventDefault();
  setNotice("正在绑定...", "");
  try {
    const result = await apiFetch("/auth/game/bind", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: bindRoleIdInput?.value.trim() || "",
        game_server: bindServerInput?.value.trim() || "",
        game_role_name: bindRoleNameInput?.value.trim() || "",
        bind_token_id: bindTokenIdInput?.value.trim() || "",
        nickname: bindNicknameInput?.value.trim() || "",
      }),
    });
    saveSession(result);
    setNotice("绑定成功，已保存登录状态。", "success");
    completeLightAuthNavigation();
  } catch (error) {
    setNotice(`绑定失败：${pickErrorMessage(error, "绑定失败")}`, "error");
  }
}

function handleLogoutClick() {
  clearSession();
  setNotice("已退出登录。", "success");
}

async function ensureHelperRuntime() {
  if (helperRuntimeLoaded) return true;
  if (!helperRuntimePromise) {
    helperRuntimePromise = import(APP_MODULE_SRC).then(() => {
      helperRuntimeLoaded = true;
      return true;
    });
  }
  return helperRuntimePromise;
}

async function handleLazyHelperAuthClick(event) {
  event.preventDefault();
  if (!helperOpenAuthPopupBtn) return;
  helperOpenAuthPopupBtn.disabled = true;
  setHelperAuthNotice("正在加载扫码登录组件...", "success");
  try {
    await ensureHelperRuntime();
    helperOpenAuthPopupBtn.removeEventListener("click", handleLazyHelperAuthClick);
    helperOpenAuthPopupBtn.disabled = false;
    setHelperAuthNotice("", "");
    helperOpenAuthPopupBtn.click();
  } catch (error) {
    helperOpenAuthPopupBtn.disabled = false;
    setHelperAuthNotice(`加载扫码登录组件失败：${pickErrorMessage(error, "请稍后重试")}`, "error");
  }
}

function bindLightAuthPage() {
  if (window.__gongfaAuthBound) return;
  window.__gongfaAuthBound = true;

  activateAuthTab("register");
  populateHelperOrigin();

  registerForm?.addEventListener("submit", handleRegisterSubmit);
  loginForm?.addEventListener("submit", handleLoginSubmit);
  bindForm?.addEventListener("submit", handleBindSubmit);
  logoutBtn?.addEventListener("click", handleLogoutClick);
  saveHelperOriginButton?.addEventListener("click", handleSaveHelperOrigin);
  openHelperButton?.addEventListener("click", handleOpenHelperTool);
  helperOpenAuthPopupBtn?.addEventListener("click", handleLazyHelperAuthClick);

  authTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateAuthTab(button.getAttribute("data-auth-tab"));
    });
  });

  registerPasswordInput?.addEventListener("input", () => syncRegisterPasswordValidation(false));
  registerPasswordConfirmInput?.addEventListener("input", () => syncRegisterPasswordValidation(false));
  registerPasswordConfirmInput?.addEventListener("blur", () => syncRegisterPasswordValidation(true));
  registerRoleIdInput?.addEventListener("input", () => registerRoleIdInput.setCustomValidity(""));
}

bindLightAuthPage();
