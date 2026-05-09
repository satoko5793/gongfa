export function bindAuthEntryEvents(ctx) {
  if (window.__gongfaAuthBound) return;

  ctx.bindForm?.addEventListener("submit", ctx.bindAccount);
  ctx.registerForm?.addEventListener("submit", ctx.handleRegisterSubmit);
  ctx.loginForm?.addEventListener("submit", ctx.loginAccount);

  ctx.registerPasswordInput?.addEventListener("input", () =>
    ctx.syncRegisterPasswordValidation(false)
  );
  ctx.registerPasswordConfirmInput?.addEventListener("input", () =>
    ctx.syncRegisterPasswordValidation(false)
  );
  ctx.registerPasswordConfirmInput?.addEventListener("blur", () =>
    ctx.syncRegisterPasswordValidation(true)
  );
  ctx.registerRoleIdInput?.addEventListener("input", () =>
    ctx.registerRoleIdInput.setCustomValidity("")
  );

  ctx.authTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      ctx.activateAuthTab(button.getAttribute("data-auth-tab"));
    });
  });

  window.__gongfaAuthBound = true;
}

export function bindAccountShellEvents(ctx) {
  ctx.accountTabButtons.forEach((button) => {
    button.addEventListener("click", (event) => ctx.handleAccountTabButtonClick(event));
  });
  ctx.accountTabLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetTab = link.getAttribute("data-account-tab-target") || "overview";
      event.preventDefault();
      ctx.navigateToAccountTabLink(link, targetTab, { scroll: true });
    });
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-account-tab-target]");
    if (!link || ctx.accountTabLinks.includes(link)) return;
    const targetTab = link.getAttribute("data-account-tab-target") || "overview";
    event.preventDefault();
    ctx.navigateToAccountTabLink(link, targetTab, { scroll: true });
  });
}

export function bindBeginnerGuideEvents(ctx) {
  ctx.beginnerGuideTabs.forEach((button) => {
    button.addEventListener("click", () => {
      ctx.setActiveGuidePage(button.getAttribute("data-guide-page-target") || "tutorial");
    });
  });
  ctx.beginnerGuidePrevBtn?.addEventListener("click", () => ctx.setActiveGuidePage("tutorial"));
  ctx.beginnerGuideNextBtn?.addEventListener("click", () => ctx.setActiveGuidePage("sales"));

  if (!ctx.beginnerCarousel) return;
  let touchStartX = 0;
  let touchDeltaX = 0;
  ctx.beginnerCarousel.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.touches[0]?.clientX || 0;
      touchDeltaX = 0;
    },
    { passive: true }
  );
  ctx.beginnerCarousel.addEventListener(
    "touchmove",
    (event) => {
      const currentX = event.touches[0]?.clientX || touchStartX;
      touchDeltaX = currentX - touchStartX;
    },
    { passive: true }
  );
  ctx.beginnerCarousel.addEventListener("touchend", () => {
    if (Math.abs(touchDeltaX) < 48) return;
    ctx.setActiveGuidePage(touchDeltaX < 0 ? "sales" : "tutorial");
  });
}

export function bindPageDockEvents(ctx) {
  ctx.pageDockItems.forEach((button) => {
    button.addEventListener("click", () => {
      ctx.navigateWithDock(button.getAttribute("data-dock-target") || "products");
    });
  });
  ctx.mobileAdminLink?.addEventListener("click", () => {
    window.location.href = "admin.html";
  });
}
