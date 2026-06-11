function getAccountTabHash(targetTab) {
  if (targetTab === "profile") return "profile-panel";
  if (targetTab === "recharge") return "recharge-panel";
  if (targetTab === "orders") return "help-panel";
  return "account";
}

function getCurrentPageFile(pathname) {
  const path = String(pathname || window.location.pathname || "").trim();
  return path.split("/").pop() || "index.html";
}

export function activateAccountTabRuntime(ctx, tab, { scroll = false } = {}) {
  const allowedTabs = new Set(["overview", "profile", "security", "recharge", "orders"]);
  let nextTab = allowedTabs.has(tab) ? tab : "overview";
  if (nextTab === "security" && ctx.accountSecurityTabButton?.classList.contains("hidden")) {
    nextTab = "overview";
  }
  ctx.setActiveAccountTab(nextTab);
  ctx.accountTabButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-account-tab") === nextTab);
  });
  ctx.accountTabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-account-panel") !== nextTab);
  });
  if (scroll) {
    ctx.accountSection?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
  return nextTab;
}

export function syncAccountTabWithHashRuntime(ctx) {
  const hash = String(window.location.hash || "").replace(/^#/, "");
  const hashMap = {
    account: "overview",
    "profile-panel": "profile",
    "recharge-panel": "recharge",
    "help-panel": "orders",
    "order-panel": "orders",
  };
  if (!hashMap[hash]) return null;
  return activateAccountTabRuntime(ctx, hashMap[hash]);
}

export function navigateToAccountTabLinkRuntime(ctx, link, targetTab, options = {}) {
  const href = String(link?.getAttribute("href") || "").trim();
  const nextHash = getAccountTabHash(targetTab);
  const currentPageFile = getCurrentPageFile(ctx.pathname);
  const samePageHref =
    !href ||
    href === "#" ||
    href.startsWith("#") ||
    href === currentPageFile ||
    href.endsWith(`/${currentPageFile}`);
  if (!samePageHref) {
    window.location.href = `${href.split("#")[0]}#${nextHash}`;
    return true;
  }
  window.location.hash = nextHash;
  activateAccountTabRuntime(ctx, targetTab, options);
  return false;
}

export function handleOrderListClickRuntime(ctx, event) {
  const viewButton = event.target.closest(".purchase-view-tab");
  if (viewButton) {
    ctx.setActivePurchaseView?.(viewButton.getAttribute("data-purchase-view"));
    return true;
  }
  const pageButton = event.target.closest(".purchase-page-btn");
  if (pageButton) {
    ctx.changePurchasePage?.(
      pageButton.getAttribute("data-purchase-view"),
      Number(pageButton.getAttribute("data-purchase-page") || 1)
    );
    return true;
  }
  const cancelButton = event.target.closest(".request-cancel-btn");
  if (cancelButton) {
    ctx.requestCancelOrder(cancelButton.getAttribute("data-order-id"));
    return true;
  }
  const deliveryButton = event.target.closest(".escrow-delivery-btn");
  if (deliveryButton) {
    ctx.submitEscrowDelivery(deliveryButton.getAttribute("data-escrow-id"));
    return true;
  }
  const confirmButton = event.target.closest(".escrow-confirm-btn");
  if (confirmButton) {
    ctx.confirmEscrowReceipt(confirmButton.getAttribute("data-escrow-id"));
    return true;
  }
  const disputeButton = event.target.closest(".escrow-dispute-btn");
  if (disputeButton) {
    ctx.disputeEscrowTrade(disputeButton.getAttribute("data-escrow-id"));
    return true;
  }
  return false;
}

export function handleAccountLogoutClickRuntime(ctx) {
  ctx.logoutCurrentSession();
  return true;
}

export function handleAccountSwitchClickRuntime(ctx, event) {
  event.preventDefault();
  ctx.logoutCurrentSession({ toBind: true });
  return true;
}

export function handleAccountProfileSubmitRuntime(ctx, event) {
  if (event.target?.id !== "account-profile-form") return false;
  ctx.saveAccountProfile(event);
  return true;
}

export function handleAccountPasswordSubmitRuntime(ctx, event) {
  if (event.target?.id !== "account-password-form") return false;
  ctx.changeAccountPassword(event);
  return true;
}

export function handleAccountTabButtonClickRuntime(ctx, event) {
  const button = event.currentTarget || event.target?.closest?.("[data-account-tab]");
  if (!button) return false;
  ctx.activateAccountTab(button.getAttribute("data-account-tab"));
  return true;
}
