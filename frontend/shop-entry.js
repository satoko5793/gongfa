import { loadSession } from "./shared.js?v=release-20260611-151806";
import { startShopLiteShell } from "./page-entry-shop-lite.js?v=release-20260611-151806";
import { renderShopHonorPanel } from "./season-honor-runtime.js?v=release-20260611-151806";
import {
  applyEntryNavSessionState,
  getEntrySessionProfile,
  renderEntrySessionSummary,
} from "./page-entry-session.js?v=release-20260611-151806";

window.__GONGFA_PAGE_MODE__ = "shop";

const APP_MODULE_SRC = "./app.js?v=release-20260611-151806";

const heroStageTrigger = document.getElementById("hero-stage-trigger");
const heroStageImage = document.getElementById("hero-stage-image");
const shopHonorRoot = document.getElementById("shop-honor-panel-root");
const beginnerGuideSummary = document.getElementById("beginner-guide-summary");
const beginnerGuideReward = document.getElementById("beginner-guide-reward");
const beginnerGuideSteps = document.getElementById("beginner-guide-steps");
const beginnerCarouselTrack = document.getElementById("beginner-carousel-track");
const beginnerGuideTabs = Array.from(document.querySelectorAll("[data-guide-page-target]"));
const beginnerGuidePrevBtn = document.getElementById("beginner-guide-prev");
const beginnerGuideNextBtn = document.getElementById("beginner-guide-next");
const recentSalesList = document.getElementById("recent-sales-list");
const productGrid = document.getElementById("product-grid");
const productPagination = document.getElementById("product-pagination");
const reloadProductsButton = document.getElementById("reload-products-btn");
const productKeywordInput = document.getElementById("product-keyword-input");
const productSortSelect = document.getElementById("product-sort-select");
const productCategoryTabs = document.getElementById("product-category-tabs");
const productSubcategoryTabs = document.getElementById("product-subcategory-tabs");
const productDetailTabs = document.getElementById("product-detail-tabs");
const productFullnessTabs = document.getElementById("product-fullness-tabs");
const discountKeywordInput = document.getElementById("discount-keyword-input");
const discountSortSelect = document.getElementById("discount-sort-select");
const discountCategoryTabs = document.getElementById("discount-category-tabs");
const discountSubcategoryTabs = document.getElementById("discount-subcategory-tabs");
const discountDetailTabs = document.getElementById("discount-detail-tabs");
const discountFullnessTabs = document.getElementById("discount-fullness-tabs");
const discountProductPagination = document.getElementById("discount-product-pagination");
const productsSection = document.getElementById("products");
const discountProductsSection = document.getElementById("discount-products-section");
const pageNavLinks = Array.from(document.querySelectorAll("[data-page-link]"));
const session = loadSession();
const sessionProfile = getEntrySessionProfile(session);
const hasSession = Boolean(session?.token);

let appModulePromise = null;
let heroRotateTimer = null;

function activateShopNav() {
  pageNavLinks.forEach((link) => {
    const isActive = link.getAttribute("data-page-link") === "shop";
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function renderSessionSummary(profile) {
  applyEntryNavSessionState(profile);
  renderEntrySessionSummary(profile);
}

function hydrateSessionSummary() {
  renderSessionSummary(sessionProfile);
}

function renderSeasonHonor() {
  if (!shopHonorRoot) return;
  shopHonorRoot.innerHTML = renderShopHonorPanel();
}

function applyHeroStageFrame(index, sources, scales, shifts) {
  if (!heroStageImage || !sources.length) return;
  heroStageImage.src = sources[index] || sources[0];
  heroStageImage.style.setProperty("--hero-art-scale", String(scales[index] || 1));
  heroStageImage.style.setProperty("--hero-art-shift-y", `${shifts[index] || 0}px`);
}

function bindHeroStageRotation() {
  if (!heroStageTrigger || !heroStageImage) return;
  const sources = String(heroStageImage.dataset.heroSources || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  if (sources.length <= 1) return;

  const scales = String(heroStageImage.dataset.heroScales || "")
    .split("|")
    .map((item) => Number(item.trim() || 1));
  const shifts = String(heroStageImage.dataset.heroShifts || "")
    .split("|")
    .map((item) => Number(item.trim() || 0));

  let index = 0;
  const schedule = () => {
    window.clearInterval(heroRotateTimer);
    heroRotateTimer = window.setInterval(() => {
      index = (index + 1) % sources.length;
      applyHeroStageFrame(index, sources, scales, shifts);
    }, 10000);
  };
  const next = () => {
    index = (index + 1) % sources.length;
    applyHeroStageFrame(index, sources, scales, shifts);
    schedule();
  };

  heroStageTrigger.addEventListener("click", next);
  heroStageTrigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    next();
  });

  applyHeroStageFrame(index, sources, scales, shifts);
  schedule();
}

function ensureAppModule() {
  if (!appModulePromise) {
    appModulePromise = import(APP_MODULE_SRC);
  }
  return appModulePromise;
}

function scheduleAutoWake() {
  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => ensureAppModule(), { timeout: 1200 });
      return;
    }
    window.setTimeout(() => ensureAppModule(), 180);
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(schedule);
  });
}

function bindEarlyWakeEvents() {
  const wake = () => {
    ensureAppModule();
  };
  [
    reloadProductsButton,
    productKeywordInput,
    productSortSelect,
    productCategoryTabs,
    productSubcategoryTabs,
    productDetailTabs,
    productFullnessTabs,
    productPagination,
    discountKeywordInput,
    discountSortSelect,
    discountCategoryTabs,
    discountSubcategoryTabs,
    discountDetailTabs,
    discountFullnessTabs,
    discountProductPagination,
  ].forEach((element) => {
    if (!element) return;
    ["pointerdown", "keydown", "touchstart", "focusin"].forEach((eventName) => {
      element.addEventListener(eventName, wake, {
        once: true,
        passive: eventName === "touchstart",
      });
    });
  });
}

function bindViewportBootstrap() {
  if (!hasSession || typeof window.IntersectionObserver !== "function") return;
  const targets = [productsSection, discountProductsSection].filter(Boolean);
  if (!targets.length) return;
  const observer = new window.IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      ensureAppModule();
    },
    {
      rootMargin: "240px 0px",
      threshold: 0.01,
    }
  );
  targets.forEach((target) => observer.observe(target));
}

activateShopNav();
renderSeasonHonor();
hydrateSessionSummary();
bindHeroStageRotation();
bindEarlyWakeEvents();
bindViewportBootstrap();
scheduleAutoWake();
startShopLiteShell({
  profile: sessionProfile,
  beginnerGuideSteps,
  productGrid,
  productPagination,
  recentSalesList,
  beginnerGuideSummary,
  beginnerGuideReward,
  beginnerCarouselTrack,
  beginnerGuideTabs,
  beginnerGuidePrevBtn,
  beginnerGuideNextBtn,
  wakeHeavyModule: ensureAppModule,
});
