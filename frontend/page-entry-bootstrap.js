export function activatePageNav(pageMode) {
  document.querySelectorAll("[data-page-link]").forEach((link) => {
    const isActive = link.getAttribute("data-page-link") === pageMode;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

export function bootDeferredPageEntry(
  pageMode,
  appModuleSrc,
  {
    idleTimeout = 800,
    fallbackDelay = 120,
    beforeBoot = null,
    autoBoot = true,
    wakeTargets = null,
  } = {}
) {
  window.__GONGFA_PAGE_MODE__ = pageMode;
  activatePageNav(pageMode);
  if (typeof beforeBoot === "function") {
    beforeBoot();
  }

  let appModulePromise = null;

  const ensureAppModule = () => {
    if (!appModulePromise) {
      appModulePromise = import(appModuleSrc);
    }
    return appModulePromise;
  };

  const wake = () => {
    ensureAppModule();
  };

  const targets =
    Array.isArray(wakeTargets) && wakeTargets.length
      ? wakeTargets.filter(Boolean)
      : wakeTargets === false
        ? []
        : [window];

  targets.forEach((target) => {
    ["pointerdown", "keydown", "touchstart", "focusin"].forEach((eventName) => {
      target.addEventListener(eventName, wake, {
        once: true,
        passive: eventName === "touchstart",
      });
    });
  });

  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => ensureAppModule(), { timeout: idleTimeout });
      return;
    }
    window.setTimeout(() => ensureAppModule(), fallbackDelay);
  };

  if (autoBoot) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(schedule);
    });
  }

  return {
    ensureAppModule,
  };
}
