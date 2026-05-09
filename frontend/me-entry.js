import { apiFetch, clearSession, loadSession, saveSession } from "./shared.js?v=release-20260509-160631";
import { bootDeferredPageEntry } from "./page-entry-bootstrap.js?v=release-20260509-160631";
import { applyEntryNavSessionState, getEntrySessionProfile } from "./page-entry-session.js?v=release-20260509-160631";
import { RECHARGE_ORDER_STATUS } from "./app-constants.js?v=release-20260509-160631";
import {
  activateLiteAccountTab,
  fillLiteAccountForms,
  hydrateLiteAccountOverview,
  renderLiteAccountProfile,
  renderLiteRechargeSection,
  setAccountLiteNotice,
} from "./page-entry-account-lite.js?v=release-20260509-160631";

const session = loadSession();
const sessionProfile = getEntrySessionProfile(session);
const hasSession = Boolean(session?.token);

const accountMessage = document.getElementById("account-message");
const accountProfile = document.getElementById("account-profile");
const quotaBalance = document.getElementById("quota-balance");
const rechargeBody = document.getElementById("recharge-body");
const rechargeOrderList = document.getElementById("recharge-order-list");
const orderList = document.getElementById("order-list");
const accountRoleNameInput = document.getElementById("account-role-name");
const accountServerInput = document.getElementById("account-server");
const accountNicknameInput = document.getElementById("account-nickname");
const accountProfileForm = document.getElementById("account-profile-form");
const accountPasswordForm = document.getElementById("account-password-form");
const accountLogoutBtn = document.getElementById("account-logout-btn");
const accountSwitchLink = document.getElementById("account-switch-link");
const rechargePanel = document.getElementById("recharge-panel");
const orderPanel = document.getElementById("order-panel");

const accountTabButtons = Array.from(document.querySelectorAll("[data-account-tab]"));
const accountTabPanels = Array.from(document.querySelectorAll("[data-account-panel]"));
const setLiteAccountNotice = (text, type = "") => setAccountLiteNotice(accountMessage, text, type);

let liteAccountState = {
  profile: sessionProfile,
  quota: null,
  orders: [],
  rechargeOrders: [],
  rechargeConfig: null,
};
let liteRechargeUiState = null;

function shouldWakeHeavyAccountModule(tab) {
  return tab === "profile" || tab === "security" || tab === "recharge" || tab === "orders";
}

function getAccountTabFromHash(hashValue) {
  const normalizedHash = String(hashValue || "").replace(/^#/, "");
  if (normalizedHash === "recharge-panel") return "recharge";
  if (normalizedHash === "help-panel" || normalizedHash === "order-panel") return "orders";
  if (normalizedHash === "account") return "overview";
  return "";
}

function getHashForAccountTab(tab) {
  if (tab === "recharge") return "#recharge-panel";
  if (tab === "orders") return "#help-panel";
  if (tab === "overview") return "#account";
  return "";
}

function rerenderLiteRechargeView() {
  liteRechargeUiState = renderLiteRechargeSection({
    profile: liteAccountState.profile,
    rechargeConfig: liteAccountState.rechargeConfig,
    rechargeOrders: liteAccountState.rechargeOrders,
    rechargeBody,
    rechargeOrderList,
    rechargeUiState: liteRechargeUiState,
  });
}

function syncLiteRechargeDraftFields() {
  liteRechargeUiState = {
    ...(liteRechargeUiState || {}),
    paymentReference: String(rechargeBody?.querySelector("#lite-recharge-payment-reference")?.value || ""),
    payerNote: String(rechargeBody?.querySelector("#lite-recharge-note")?.value || ""),
  };
}

async function refreshLiteAccountOverview() {
  if (!hasSession) return null;
  const result = await hydrateLiteAccountOverview({
    hasSession,
    apiFetch,
    saveSession,
    session: loadSession(),
    accountProfile,
    quotaBalance,
    rechargeBody,
    rechargeOrderList,
    orderList,
    setAccountNotice: setLiteAccountNotice,
    fillForms: (profile) =>
      fillLiteAccountForms(profile, {
        accountRoleNameInput,
        accountServerInput,
        accountNicknameInput,
      }),
    onSessionExpired: () => {
      clearSession();
      liteAccountState = {
        profile: null,
        quota: null,
        orders: [],
        rechargeOrders: [],
        rechargeConfig: null,
      };
      liteRechargeUiState = null;
      renderLiteAccountProfile({
        profile: null,
        accountProfile,
        quotaBalance,
        rechargeBody,
        rechargeOrderList,
        orderList,
        setAccountNotice: setLiteAccountNotice,
      });
      window.location.href = "login.html";
    },
  });
  if (!result) return null;
  liteAccountState = {
    profile: result.profile || null,
    quota: result.quota || null,
    orders: result.orders || [],
    rechargeOrders: result.rechargeOrders || [],
    rechargeConfig: result.rechargeConfig || null,
  };
  rerenderLiteRechargeView();
  return result;
}

function handleLiteRechargeClick(event) {
  syncLiteRechargeDraftFields();
  const typeButton = event.target.closest("[data-lite-recharge-order-type]");
  if (typeButton) {
    liteRechargeUiState = {
      ...(liteRechargeUiState || {}),
      orderType: String(typeButton.getAttribute("data-lite-recharge-order-type") || "normal").trim() || "normal",
    };
    rerenderLiteRechargeView();
    return true;
  }

  const paymentButton = event.target.closest("[data-lite-payment-channel]");
  if (paymentButton) {
    liteRechargeUiState = {
      ...(liteRechargeUiState || {}),
      paymentChannel: String(paymentButton.getAttribute("data-lite-payment-channel") || "alipay_qr").trim() || "alipay_qr",
    };
    rerenderLiteRechargeView();
    return true;
  }

  const amountButton = event.target.closest("[data-lite-recharge-amount]");
  if (amountButton) {
    liteRechargeUiState = {
      ...(liteRechargeUiState || {}),
      amountValue: Number(amountButton.getAttribute("data-lite-recharge-amount") || 0),
    };
    rerenderLiteRechargeView();
    return true;
  }

  return false;
}

function handleLiteRechargeInput(event) {
  syncLiteRechargeDraftFields();
  if (event.target?.id !== "lite-recharge-amount-input") return false;
  liteRechargeUiState = {
    ...(liteRechargeUiState || {}),
    amountValue: Number(event.target.value || 0),
  };
  rerenderLiteRechargeView();
  const amountInput = rechargeBody?.querySelector("#lite-recharge-amount-input");
  if (amountInput && document.activeElement !== amountInput) {
    amountInput.focus();
    amountInput.setSelectionRange?.(String(amountInput.value || "").length, String(amountInput.value || "").length);
  }
  return true;
}

async function handleLiteRechargeSubmit(event) {
  if (event.target?.id !== "lite-recharge-form") return false;
  event.preventDefault();
  const sessionState = loadSession();
  if (!sessionState?.token) {
    setLiteAccountNotice("请先登录后再提交充值申请。", "error");
    return true;
  }
  if (!liteAccountState.profile || !liteAccountState.rechargeConfig) {
    setLiteAccountNotice("充值配置还在加载中，请稍后再试。", "error");
    return true;
  }

  const currentUiState = liteRechargeUiState || {};
  const orderType =
    currentUiState.orderType === "season_member"
      ? "season_member"
      : currentUiState.orderType === "residual_transfer"
        ? "residual_transfer"
        : "normal";
  const amountInput = rechargeBody?.querySelector("#lite-recharge-amount-input");
  const paymentReferenceInput = rechargeBody?.querySelector("#lite-recharge-payment-reference");
  const payerNoteInput = rechargeBody?.querySelector("#lite-recharge-note");
  const amountValue =
    orderType === "season_member"
      ? Number(liteAccountState.rechargeConfig?.season_member_price_yuan || 0)
      : Number(amountInput?.value || currentUiState.amountValue || 0);
  const paymentReference = String(paymentReferenceInput?.value || "").trim();
  const payerNote = String(payerNoteInput?.value || "").trim();

  if (orderType === "normal") {
    const rounded = Math.round(amountValue * 100) / 100;
    if (!(Number.isFinite(rounded) && rounded > 0)) {
      setLiteAccountNotice("充值金额必须大于 0。", "error");
      return true;
    }
  } else if (orderType === "residual_transfer") {
    if (!Number.isInteger(amountValue) || amountValue <= 0) {
      setLiteAccountNotice(`转赠${liteAccountState.rechargeConfig?.residual_unit_label || "残卷"}数量必须是大于 0 的整数。`, "error");
      return true;
    }
  } else {
    const pendingSeasonOrder = (liteAccountState.rechargeOrders || []).find(
      (order) =>
        order.order_type === "season_member" &&
        order.status === RECHARGE_ORDER_STATUS.PENDING_REVIEW &&
        String(order.season_label || "") === String(liteAccountState.rechargeConfig?.season_member_season_label || "")
    );
    if (liteAccountState.profile?.season_member_active) {
      setLiteAccountNotice("你本赛季已经是会员了，无需重复开通。", "error");
      return true;
    }
    if (pendingSeasonOrder) {
      setLiteAccountNotice("你的赛季会员申请正在审核中，请勿重复提交。", "error");
      return true;
    }
  }

  if (!paymentReference) {
    setLiteAccountNotice(orderType === "residual_transfer" ? "请填写转赠时间。": "请填写付款时间或付款备注。", "error");
    paymentReferenceInput?.focus();
    return true;
  }

  const submitButton = rechargeBody?.querySelector("#lite-recharge-submit-btn");
  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const result = await apiFetch("/me/recharge-orders", {
      method: "POST",
      body: JSON.stringify({
        order_type: orderType,
        amount_yuan: amountValue,
        payment_channel: orderType === "residual_transfer" ? undefined : currentUiState.paymentChannel || "alipay_qr",
        payment_reference: paymentReference,
        payer_note: payerNote || undefined,
      }),
    });
    setLiteAccountNotice(
      orderType === "season_member"
        ? `赛季会员申请已提交，订单 #${result.id} 等待管理员审核。`
        : orderType === "residual_transfer"
          ? `残卷转赠申请已提交，订单 #${result.id} 等待管理员审核。`
          : `充值申请已提交，订单 #${result.id} 等待管理员审核。`,
      "success"
    );
    await refreshLiteAccountOverview();
  } catch (error) {
    const code = error?.payload?.error || error?.message;
    const customMessage =
      code === "season_member_already_active"
        ? "你本赛季已经是会员了，无需重复开通。"
        : code === "season_member_pending_review"
          ? "你的赛季会员申请正在审核中，请勿重复提交。"
          : code === "season_member_disabled"
            ? "当前暂未开放赛季会员。"
            : code === "residual_transfer_disabled"
              ? "当前暂未开放残卷转赠。"
              : error?.payload?.details?.[0] || error?.message || "请稍后重试";
    setLiteAccountNotice(`充值申请提交失败：${customMessage}`, "error");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }

  return true;
}

const entry = bootDeferredPageEntry("me", "./app.js?v=release-20260509-160631", {
  idleTimeout: hasSession ? 400 : 1800,
  fallbackDelay: hasSession ? 80 : 600,
  autoBoot: false,
  wakeTargets: false,
  beforeBoot: () => {
    applyEntryNavSessionState(sessionProfile);
    activateLiteAccountTab(accountTabButtons, accountTabPanels, "overview");
    renderLiteAccountProfile({
      profile: sessionProfile,
      accountProfile,
      quotaBalance,
      rechargeBody,
      rechargeOrderList,
      orderList,
      setAccountNotice: setLiteAccountNotice,
    });
    fillLiteAccountForms(sessionProfile, {
      accountRoleNameInput,
      accountServerInput,
      accountNicknameInput,
    });
    if (hasSession) {
      void refreshLiteAccountOverview();
    }
  },
});

accountTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetTab = button.getAttribute("data-account-tab") || "overview";
    activateLiteAccountTab(accountTabButtons, accountTabPanels, targetTab);
    const nextHash = getHashForAccountTab(targetTab);
    if (nextHash && window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    if (shouldWakeHeavyAccountModule(targetTab)) {
      entry.ensureAppModule();
    }
  });
});

accountLogoutBtn?.addEventListener("click", () => {
  clearSession();
  window.location.href = "login.html";
});

accountSwitchLink?.addEventListener("click", () => {
  clearSession();
});

function bindWakeOnElement(element, eventNames) {
  if (!element) return;
  eventNames.forEach((eventName) => {
    element.addEventListener(
      eventName,
      () => {
        entry.ensureAppModule();
      },
      { passive: eventName !== "submit" }
    );
  });
}

bindWakeOnElement(accountProfileForm, ["submit", "focusin", "input"]);
bindWakeOnElement(accountPasswordForm, ["submit", "focusin", "input"]);
bindWakeOnElement(rechargePanel, ["click", "focusin", "input", "submit"]);
bindWakeOnElement(orderPanel, ["click", "focusin"]);

rechargeBody?.addEventListener("click", (event) => {
  handleLiteRechargeClick(event);
});
rechargeBody?.addEventListener("input", (event) => {
  handleLiteRechargeInput(event);
});
rechargeBody?.addEventListener("submit", (event) => {
  void handleLiteRechargeSubmit(event);
});

const initialAccountTab = getAccountTabFromHash(window.location.hash);
if (initialAccountTab) {
  activateLiteAccountTab(accountTabButtons, accountTabPanels, initialAccountTab);
  if (shouldWakeHeavyAccountModule(initialAccountTab)) {
    entry.ensureAppModule();
  }
}

window.addEventListener("hashchange", () => {
  const nextTab = getAccountTabFromHash(window.location.hash);
  if (!nextTab) return;
  activateLiteAccountTab(accountTabButtons, accountTabPanels, nextTab);
  if (shouldWakeHeavyAccountModule(nextTab)) {
    entry.ensureAppModule();
  }
});
