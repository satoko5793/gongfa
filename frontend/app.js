import {
  apiFetch,
  clearHelperBridgeIntent,
  clearSession,
  clearHelperBridgeSession,
  ensureHelperOrigin,
  getHelperOrigin,
  loadHelperBridgeIntent,
  loadSession,
  loadHelperBridgeSession,
  normalizeBindPayload,
  saveHelperBridgeIntent,
  saveSession,
  saveHelperBridgeSession,
  setHelperOrigin,
  formatDate,
  escapeHtml as sharedEscapeHtml,
  pickErrorMessage as sharedPickErrorMessage,
} from "./shared.js?v=release-20260611-151806";
import {
  ADMIN_ROLES,
  ORDER_STATUS,
  isAdminRole,
} from "./app-constants.js?v=release-20260611-151806";
import { createPageRuntime } from "./page-mode.js?v=release-20260611-151806";
import {
  submitAuctionBidAction,
} from "./page-actions/auction-actions.js?v=release-20260611-151806";
import {
  changeAccountPasswordAction,
  logoutCurrentSessionAction,
  saveAccountProfileAction,
} from "./page-actions/account-actions.js?v=release-20260611-151806";
import {
  bindAccountAction,
  loginAccountAction,
  registerAccountAction,
} from "./page-actions/auth-actions.js?v=release-20260611-151806";
import {
  confirmPurchaseAction,
  requestCancelOrderAction,
  submitGuestTransferOrderAction,
  submitRechargeOrderAction,
} from "./page-actions/commerce-actions.js?v=release-20260611-151806";
import { submitDrawServiceOrderAction } from "./page-actions/draw-service-actions.js?v=release-20260611-151806";
import {
  importHelperInventoryProductsAction,
  autoBindHelperRoleToCurrentSessionAction,
  clearHelperRestorePreviewAction,
  clearPendingHelperSelectionAction,
  completeHelperScanAuthAction,
  purchaseHelperSlotAction,
  removeHelperBindingAction,
  savePendingHelperBindingAction,
  startHelperInventorySyncAction,
  openHelperGameFeatureAction,
  syncAllHelperInventoriesAction,
  syncCurrentHelperInventoryAction,
} from "./page-actions/helper-actions.js?v=release-20260611-151806";

import {
  openHelperAuthPopupAction,
  openHelperBindPopupAction,
  openHelperToolAction,
} from "./page-actions/helper-entry-actions.js?v=release-20260611-151806";
import {
  openHelperPreviewPopupAction,
  openHelperRestorePopupAction,
  openHelperSnapshotPopupAction,
  openHelperTeamSwitchPopupAction,
} from "./page-actions/helper-popup-actions.js?v=release-20260611-151806";
import {
  handleHelperBridgeMessageAction,
  removeHelperSnapshotAction,
  renameHelperSnapshotAction,
  saveHelperActionLogFromBridgeAction,
  saveHelperInventoryFromBridgeAction,
  saveHelperSnapshotFromBridgeAction,
  togglePinHelperSnapshotAction,
  updateHelperSnapshotMetaAction,
} from "./page-actions/helper-bridge-actions.js?v=release-20260611-151806";
import { loadAccountData } from "./page-loaders/account-loader.js?v=release-20260611-151806";
import { loadAuctionsData } from "./page-loaders/auctions-loader.js?v=release-20260611-151806";
import {
  loadHelperActionLogsData,
  loadHelperBindingsData,
  loadHelperConfigData,
  loadHelperInventoriesData,
  loadHelperSnapshotsData,
} from "./page-loaders/helper-loader.js?v=release-20260611-151806";
import { loadProductsData } from "./page-loaders/products-loader.js?v=release-20260611-151806";
import { loadRecentSalesData } from "./page-loaders/recent-sales-loader.js?v=release-20260611-151806";
import {
  buildHelperSnapshotName as buildHelperSnapshotNameView,
  formatHelperBattleSlot as formatHelperBattleSlotView,
  renderHelperAuthEntry as renderHelperAuthEntryView,
  renderHelperBindingPanel as renderHelperBindingPanelView,
  renderHelperGameFeaturesPanel as renderHelperGameFeaturesPanelView,
  renderHelperInventoryPanel as renderHelperInventoryPanelView,
  renderHelperRestorePreviewPanel as renderHelperRestorePreviewPanelView,
  renderHelperRestoreProgressPanel as renderHelperRestoreProgressPanelView,
  renderHelperRestoreResultPanel as renderHelperRestoreResultPanelView,
  renderHelperSnapshotPanel as renderHelperSnapshotPanelView,
  renderHelperTeamSwitchPanel as renderHelperTeamSwitchPanelView,
  sortHelperSnapshotsList as sortHelperSnapshotsListView,
} from "./page-renderers/helper-renderers.js?v=release-20260611-151806";
import {
  formatAuctionCountdownDuration as formatAuctionCountdownDurationView,
  formatAuctionStatusLabel as formatAuctionStatusLabelView,
  getAuctionCountdownMeta as getAuctionCountdownMetaView,
  renderAuctionZone as renderAuctionZoneView,
} from "./page-renderers/auction-renderers.js?v=release-20260611-151806";
import {
  renderProfileSection as renderProfileSectionView,
  renderRechargeSection as renderRechargeSectionView,
} from "./page-renderers/account-renderers.js?v=release-20260611-151806";
import { renderDrawServiceZoneContent } from "./page-renderers/draw-service-renderers.js?v=release-20260611-151806";
import { renderProductDetailModalContent } from "./page-renderers/product-detail-renderers.js?v=release-20260611-151806";
import {
  formatFullStatValue as formatFullStatValueView,
  formatTermBadgeLabel as formatTermBadgeLabelView,
  parseTermBadges as parseTermBadgesView,
  renderFullStatValue as renderFullStatValueView,
  renderProductCard as renderProductCardView,
  renderProductTermRow as renderProductTermRowView,
  renderProductVisual as renderProductVisualView,
  renderStatBlock as renderStatBlockView,
  renderTermBadge as renderTermBadgeView,
} from "./page-renderers/product-card-renderers.js?v=release-20260611-151806";
import {
  applyDiscountView as applyDiscountViewRenderer,
  applyProductView as applyProductViewRenderer,
  renderDiscountProducts as renderDiscountProductsView,
  renderProducts as renderProductsView,
} from "./page-renderers/product-list-renderers.js?v=release-20260611-151806";
import {
  renderBeginnerGuideSection as renderBeginnerGuideSectionView,
  renderRecentSalesSection as renderRecentSalesSectionView,
} from "./page-renderers/shop-home-renderers.js?v=release-20260611-151806";
import {
  buildHelperBridgeBindUrl as buildHelperBridgeBindUrlRuntime,
  buildHelperBridgeGameFeatureUrl as buildHelperBridgeGameFeatureUrlRuntime,
  buildHelperBridgeLegacyInventoryUrl as buildHelperBridgeLegacyInventoryUrlRuntime,
  buildHelperBridgeSnapshotUrl as buildHelperBridgeSnapshotUrlRuntime,
  buildHelperBridgeTeamPreviewUrl as buildHelperBridgeTeamPreviewUrlRuntime,
  buildHelperBridgeTeamRestoreUrl as buildHelperBridgeTeamRestoreUrlRuntime,
  buildHelperBridgeTeamSwitchUrl as buildHelperBridgeTeamSwitchUrlRuntime,
  clearHelperBridgeBackgroundFrameRuntime,
  closeHelperBridgeModalRuntime,
  openHelperBridgeModalSurfaceRuntime,
  runHelperBridgeInBackgroundRuntime,
} from "./page-runtime/helper-bridge-runtime.js?v=release-20260611-151806";
import {
  buildDirectPurchaseContext as buildDirectPurchaseContextRuntime,
  ensureGuestTransferPaymentChannel as ensureGuestTransferPaymentChannelRuntime,
  ensureRechargePaymentChannel as ensureRechargePaymentChannelRuntime,
  formatRechargeChannelLabel as formatRechargeChannelLabelRuntime,
  getDirectPurchaseAmountYuan as getDirectPurchaseAmountYuanRuntime,
  getDirectResidualAmount as getDirectResidualAmountRuntime,
  getDiscountedProducts as getDiscountedProductsRuntime,
  getEffectiveRechargeConfig as getEffectiveRechargeConfigRuntime,
  getGuestPurchaseMethods as getGuestPurchaseMethodsRuntime,
  getOriginalQuotaPrice as getOriginalQuotaPriceRuntime,
  getProductCashPriceText as getProductCashPriceTextRuntime,
  getProductResidualPriceText as getProductResidualPriceTextRuntime,
  getQuotaCashAmount as getQuotaCashAmountRuntime,
  getQuotaCashText as getQuotaCashTextRuntime,
  getRechargePaymentMethods as getRechargePaymentMethodsRuntime,
  isDiscountedProduct as isDiscountedProductRuntime,
} from "./page-runtime/commerce-builders.js?v=release-20260611-151806";
import {
  createConfirmPurchaseContext,
  createRequestCancelOrderContext,
  createSubmitGuestTransferOrderContext,
  createSubmitRechargeOrderContext,
} from "./page-runtime/commerce-action-contexts.js?v=release-20260611-151806";
import {
  createBindAccountContext,
  createChangeAccountPasswordContext,
  createLoginAccountContext,
  createLogoutCurrentSessionContext,
  createRegisterAccountContext,
  createSaveAccountProfileContext,
} from "./page-runtime/auth-account-action-contexts.js?v=release-20260611-151806";
import {
  applyImmediateAuthResultRuntime,
  completePostAuthNavigationRuntime,
  consumePostAuthAccountFocusRuntime,
  focusAccountAfterAuthRuntime,
  schedulePostAuthAccountFocusRuntime,
} from "./page-runtime/auth-post-auth-runtime.js?v=release-20260611-151806";
import {
  findPendingSeasonMemberOrder as findPendingSeasonMemberOrderRuntime,
  formatRechargeOrderAmountLine as formatRechargeOrderAmountLineRuntime,
  formatRechargeOrderTitle as formatRechargeOrderTitleRuntime,
  formatRechargeReferenceLine as formatRechargeReferenceLineRuntime,
  formatRechargeStatus as formatRechargeStatusRuntime,
  getRechargeQuoteSummary as getRechargeQuoteSummaryRuntime,
  isPositiveMoneyAmount as isPositiveMoneyAmountRuntime,
  isResidualTransferOrder as isResidualTransferOrderRuntime,
} from "./page-runtime/recharge-builders.js?v=release-20260611-151806";
import {
  buildHelperEquipmentMarkup as buildHelperEquipmentMarkupRuntime,
  buildHelperEquipmentSummary as buildHelperEquipmentSummaryRuntime,
  buildHelperFishSlotsMarkup as buildHelperFishSlotsMarkupRuntime,
  buildHelperFishSlotsSummary as buildHelperFishSlotsSummaryRuntime,
  buildHelperRestorePlanFromSnapshot as buildHelperRestorePlanFromSnapshotRuntime,
  buildHelperRestorePreview as buildHelperRestorePreviewRuntime,
  buildHelperSnapshotCapabilityMarkup as buildHelperSnapshotCapabilityMarkupRuntime,
  buildHelperSnapshotRestoreSummaryText as buildHelperSnapshotRestoreSummaryTextRuntime,
  getSnapshotAttachmentOwnershipCount as getSnapshotAttachmentOwnershipCountRuntime,
  getSnapshotSafeRestoreBlockReason as getSnapshotSafeRestoreBlockReasonRuntime,
} from "./page-runtime/helper-restore-builders.js?v=release-20260611-151806";
import {
  bindGlobalAppEvents,
  runAppBootSequence,
} from "./page-runtime/app-bootstrap-runtime.js?v=release-20260611-151806";
import { createAppStartupContext } from "./page-runtime/app-startup-context.js?v=release-20260611-151806";
import {
  activateAccountTabRuntime,
  handleAccountLogoutClickRuntime,
  handleAccountPasswordSubmitRuntime,
  handleAccountProfileSubmitRuntime,
  handleAccountSwitchClickRuntime,
  handleAccountTabButtonClickRuntime,
  handleOrderListClickRuntime,
  navigateToAccountTabLinkRuntime,
  syncAccountTabWithHashRuntime,
} from "./page-runtime/account-runtime.js?v=release-20260611-151806";
import {
  handleAuctionBodyClickRuntime,
  handleAuctionBodyInputRuntime,
  handleAuctionStatusTabsClickRuntime,
  updateAuctionBidPreviewRuntime,
  updateAuctionCountdownsRuntime,
} from "./page-runtime/auction-runtime.js?v=release-20260611-151806";
import {
  handleDrawServiceBodyClickRuntime,
  handleDrawServiceBodyInputRuntime,
  handleDrawServiceBodySubmitRuntime,
  getDrawServiceSelectionQuote as getDrawServiceSelectionQuoteRuntime,
  normalizeDrawServiceAmount as normalizeDrawServiceAmountRuntime,
  normalizeDrawServiceWan as normalizeDrawServiceWanRuntime,
  updateDrawServiceQuoteRuntime,
} from "./page-runtime/draw-service-runtime.js?v=release-20260611-151806";
import {
  handleRechargePanelClickRuntime,
  handleRechargePanelInputRuntime,
  handleRechargePanelSubmitRuntime,
  updateRechargeQuotePreviewRuntime,
} from "./page-runtime/recharge-runtime.js?v=release-20260611-151806";
import {
  closeProductModalRuntime,
  handleProductGridClickRuntime,
  openProductModalRuntime,
  startDirectPurchaseRuntime,
  toggleGuestTransferPanelRuntime,
} from "./page-runtime/product-modal-runtime.js?v=release-20260611-151806";
import {
  buildActiveProductState,
  createProductModalRuntimeContext,
  findProductInList,
  isActiveProductState,
} from "./page-runtime/product-modal-context.js?v=release-20260611-151806";
import {
  bindAccountShellEvents,
  bindAuthEntryEvents,
  bindBeginnerGuideEvents,
  bindPageDockEvents,
} from "./page-runtime/page-shell-bindings.js?v=release-20260611-151806";
import { bindHelperShellEvents } from "./page-runtime/helper-shell-bindings.js?v=release-20260611-151806";
import { bindPageInteractionEvents } from "./page-runtime/page-interaction-bindings.js?v=release-20260611-151806";
import {
  getLoginEntryHrefRuntime,
  getPostAuthSurfaceUrlRuntime,
  navigateToLoginEntryRuntime,
  navigateToPostAuthSurfaceRuntime,
  navigateWithDockRuntime,
  scrollSectionIntoViewRuntime,
  setActiveDockTargetRuntime,
  syncDiscountDockVisibilityRuntime,
  syncDockWithViewportRuntime,
} from "./page-runtime/page-navigation-runtime.js?v=release-20260611-151806";
import {
  handleDiscountCategoryClickRuntime,
  handleDiscountDetailClickRuntime,
  handleDiscountFullnessClickRuntime,
  handleDiscountKeywordInputRuntime,
  handleDiscountPaginationClickRuntime,
  handleDiscountSortChangeRuntime,
  handleDiscountSubcategoryClickRuntime,
  handleProductCategoryClickRuntime,
  handleProductDetailClickRuntime,
  handleProductFullnessClickRuntime,
  handleProductKeywordInputRuntime,
  handleProductPaginationClickRuntime,
  handleProductSortChangeRuntime,
  handleProductSubcategoryClickRuntime,
} from "./page-runtime/product-list-runtime.js?v=release-20260611-151806";
import { getStartupTasksForMode } from "./page-startups/index.js?v=release-20260611-151806";

const SEASON_DURATION_DAYS = 28;
const SEASON_FIRST_WEEK_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const QUOTA_PURCHASE_BLOCK_REASON =
  "赛季首周，当赛季双词条金卡、2.5 及以上单词条金卡暂不支持额度购买，请使用转账锁卡或残卷转赠。";
const SINGLE_TERM_QUOTA_BLOCK_MIN_VALUE = 2.5;

const productGrid = document.getElementById("product-grid");
const discountProductsSection = document.getElementById("discount-products-section");
const discountProductGrid = document.getElementById("discount-product-grid");
const discountProductPagination = document.getElementById("discount-product-pagination");
const productCategoryTabs = document.getElementById("product-category-tabs");
const productSubcategoryTabs = document.getElementById("product-subcategory-tabs");
const productDetailTabs = document.getElementById("product-detail-tabs");
const productFullnessTabs = document.getElementById("product-fullness-tabs");
const discountCategoryTabs = document.getElementById("discount-category-tabs");
const discountSubcategoryTabs = document.getElementById("discount-subcategory-tabs");
const discountDetailTabs = document.getElementById("discount-detail-tabs");
const discountFullnessTabs = document.getElementById("discount-fullness-tabs");
const productPagination = document.getElementById("product-pagination");
const productsSection = document.getElementById("products");
const keywordInput = document.getElementById("product-keyword-input");
const sortSelect = document.getElementById("product-sort-select");
const discountKeywordInput = document.getElementById("discount-keyword-input");
const discountSortSelect = document.getElementById("discount-sort-select");
const sessionSummary = document.getElementById("session-summary");
const sessionRole = document.getElementById("session-role");
const navBindLink = document.getElementById("nav-bind-link");
const navAdminLink = document.getElementById("nav-admin-link");
const helperOriginInput = document.getElementById("helper-origin-input");
const helperEntryNote = document.getElementById("helper-entry-note");
const helperLabSection = document.getElementById("helper-lab");
const helperLabBadge = document.getElementById("helper-lab-badge");
const helperLabStage = document.getElementById("helper-lab-stage");
const helperFeatureList = document.getElementById("helper-feature-list");
const helperLabNote = document.getElementById("helper-lab-note");
const helperLabOpenLink = document.getElementById("helper-lab-open-link");
const helperAuthMessage = document.getElementById("helper-auth-message");
const helperAuthNote = document.getElementById("helper-auth-note");
const helperOpenAuthPopupBtn = document.getElementById("helper-open-auth-popup-btn");
const helperBindMessage = document.getElementById("helper-bind-message");
const helperInventoryMessage = document.getElementById("helper-inventory-message");
const helperInventoryBindings = document.getElementById("helper-inventory-bindings");
const helperInventoryMerged = document.getElementById("helper-inventory-merged");
const helperSyncCurrentInventoryBtn = document.getElementById("helper-sync-current-inventory-btn");
const helperSyncAllInventoryBtn = document.getElementById("helper-sync-all-inventory-btn");
const helperBindCurrent = document.getElementById("helper-bind-current");
const helperOpenBindPopupBtn = document.getElementById("helper-open-bind-popup-btn");
const helperSaveBindBtn = document.getElementById("helper-save-bind-btn");
const helperClearBindBtn = document.getElementById("helper-clear-bind-btn");
const helperSlotSummary = document.getElementById("helper-slot-summary");
const helperSlotMessage = document.getElementById("helper-slot-message");
const helperBuyPermanentSlotBtn = document.getElementById("helper-buy-permanent-slot-btn");
const helperBuySeasonalSlotBtn = document.getElementById("helper-buy-seasonal-slot-btn");
const helperReadSnapshotBtn = document.getElementById("helper-read-snapshot-btn");
const helperSnapshotMessage = document.getElementById("helper-snapshot-message");
const helperSnapshotCurrent = document.getElementById("helper-snapshot-current");
const helperSnapshotList = document.getElementById("helper-snapshot-list");
const helperRestoreProgressCurrent = document.getElementById("helper-restore-progress-current");
const helperRestoreResultCurrent = document.getElementById("helper-restore-result-current");
const helperClearPreviewBtn = document.getElementById("helper-clear-preview-btn");
const helperPreviewMessage = document.getElementById("helper-preview-message");
const helperPreviewCurrent = document.getElementById("helper-preview-current");
const helperTeamSwitchControls = document.getElementById("helper-team-switch-controls");
const helperTeamSwitchMessage = document.getElementById("helper-team-switch-message");
const helperTeamSwitchCurrent = document.getElementById("helper-team-switch-current");
const helperTeamSwitchLog = document.getElementById("helper-team-switch-log");
const helperLabDockItem = document.getElementById("helper-lab-dock-item");
const debugPanel = document.getElementById("debug-panel");
const debugLines = document.getElementById("debug-lines");
const bindMessage = document.getElementById("bind-message");
const bindSection = document.getElementById("bind");
const accountSection = document.getElementById("account");
const auctionZoneSection = document.getElementById("auction-zone");
const auctionStatusTabs = document.getElementById("auction-status-tabs");
const auctionBody = document.getElementById("auction-body");
const auctionMessage = document.getElementById("auction-message");
const drawServiceZoneSection = document.getElementById("draw-service-zone");
const drawServiceBody = document.getElementById("draw-service-body");
const drawServiceMessage = document.getElementById("draw-service-message");
const accountProfile = document.getElementById("account-profile");
const quotaBalance = document.getElementById("quota-balance");
const orderList = document.getElementById("order-list");
const accountMessage = document.getElementById("account-message");
const accountLogoutBtn = document.getElementById("account-logout-btn");
const accountSwitchLink = document.getElementById("account-switch-link");
const accountProfileForm = document.getElementById("account-profile-form");
const accountRoleNameInput = document.getElementById("account-role-name");
const accountServerInput = document.getElementById("account-server");
const accountNicknameInput = document.getElementById("account-nickname");
const accountContactInput = document.getElementById("account-contact");
const accountPasswordPanel = document.getElementById("account-password-panel");
const accountPasswordForm = document.getElementById("account-password-form");
const accountCurrentPasswordInput = document.getElementById("account-current-password");
const accountNewPasswordInput = document.getElementById("account-new-password");
const accountConfirmPasswordInput = document.getElementById("account-confirm-password");
const rechargeBody = document.getElementById("recharge-body");
const rechargeOrderList = document.getElementById("recharge-order-list");
const heroSection = document.querySelector(".hero");
const beginnerGuideSummary = document.getElementById("beginner-guide-summary");
const beginnerGuideReward = document.getElementById("beginner-guide-reward");
const beginnerGuideSteps = document.getElementById("beginner-guide-steps");
const beginnerFlowSection = document.querySelector(".beginner-flow");
const beginnerCarousel = document.getElementById("beginner-carousel");
const beginnerCarouselTrack = document.getElementById("beginner-carousel-track");
const beginnerGuideTabs = Array.from(document.querySelectorAll("[data-guide-page-target]"));
const beginnerGuidePrevBtn = document.getElementById("beginner-guide-prev");
const beginnerGuideNextBtn = document.getElementById("beginner-guide-next");
const recentSalesList = document.getElementById("recent-sales-list");
const authTabButtons = Array.from(document.querySelectorAll("[data-auth-tab]"));
const authTabPanels = Array.from(document.querySelectorAll("[data-auth-panel]"));
const accountTabButtons = Array.from(document.querySelectorAll("[data-account-tab]"));
const accountTabPanels = Array.from(document.querySelectorAll("[data-account-panel]"));
const accountTabLinks = Array.from(document.querySelectorAll("[data-account-tab-target]"));
const pageNavLinks = Array.from(document.querySelectorAll("[data-page-link]"));
const accountSecurityTabButton = document.querySelector('[data-account-tab="security"]');
const pageDock = document.querySelector(".page-dock");
const pageDockItems = Array.from(document.querySelectorAll("[data-dock-target]"));
const discountDockButton = document.querySelector('[data-dock-target="discount-products-section"]');
const mobileAdminLink = document.getElementById("mobile-admin-link");
const pageFooter = document.querySelector(".footer");

const registerForm = document.getElementById("register-form");
const registerRoleIdInput = document.getElementById("register-role-id");
const registerRoleNameInput = document.getElementById("register-role-name");
const registerPasswordInput = document.getElementById("register-password");
const registerPasswordConfirmInput = document.getElementById("register-password-confirm");
const loginForm = document.getElementById("login-form");
const loginRoleIdInput = document.getElementById("login-role-id");
const loginPasswordInput = document.getElementById("login-password");
const bindForm = document.getElementById("bind-form");
const bindRoleIdInput = document.getElementById("bind-role-id");
const bindServerInput = document.getElementById("bind-server");
const bindRoleNameInput = document.getElementById("bind-role-name");
const bindTokenIdInput = document.getElementById("bind-token-id");
const bindNicknameInput = document.getElementById("bind-nickname");

const productDetailModal = document.getElementById("product-detail-modal");
const productDetailBody = document.getElementById("product-detail-body");
const productDetailMessage = document.getElementById("product-detail-message");
const helperBridgeModal = document.getElementById("helper-bridge-modal");
const helperBridgeIframe = document.getElementById("helper-bridge-iframe");
const helperBridgeHiddenFrame = document.getElementById("helper-bridge-hidden-frame");
const helperBridgeModalTitle = document.getElementById("helper-bridge-modal-title");
const helperBridgeModalMessage = document.getElementById("helper-bridge-modal-message");
const helperBridgeModalHint = document.getElementById("helper-bridge-modal-hint");
const closeHelperBridgeModalBtn = document.getElementById("close-helper-bridge-modal-btn");
const helperGameFeatureList = document.getElementById("helper-game-feature-list");
const helperGameFeatureMessage = document.getElementById("helper-game-feature-message");

const { currentPageMode, getPageModeConfig, shouldBootstrap, isPageSectionEnabled } = createPageRuntime({
  pathname: window.location.pathname,
  pageEntry: document.body?.dataset.pageEntry || document.documentElement?.dataset.pageEntry || "",
  globalPageMode: window.__GONGFA_PAGE_MODE__ || "",
});

function setSectionVisibility(node, visible) {
  if (!node) return;
  node.classList.toggle("hidden", !visible);
}

function applyPageMode() {
  const config = getPageModeConfig();
  document.body.dataset.pageMode = currentPageMode;
  if (config.title) {
    document.title = config.title;
  }
  pageNavLinks.forEach((link) => {
    const isActive = link.getAttribute("data-page-link") === config.navActive;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  setSectionVisibility(heroSection, config.sections.hero);
  setSectionVisibility(beginnerFlowSection, config.sections.beginner);
  setSectionVisibility(productsSection, config.sections.products);
  setSectionVisibility(discountProductsSection, config.sections.discount);
  setSectionVisibility(bindSection, config.sections.bind);
  setSectionVisibility(helperLabSection, config.sections.helper);
  setSectionVisibility(accountSection, config.sections.account);
  setSectionVisibility(auctionZoneSection, config.sections.auction);
  setSectionVisibility(drawServiceZoneSection, config.sections.draw);
  setSectionVisibility(pageDock, config.sections.dock);
  setSectionVisibility(pageFooter, config.sections.footer);
}

let allProducts = [];
let currentProducts = [];
let currentDiscountProducts = [];
let activeItemId = null;
let activeItemKind = "card";
let activeCategory = "all";
let activeSubcategory = "all";
let activeDetail = "all";
let activeFullness = "all";
let activeDiscountCategory = "all";
let activeDiscountSubcategory = "all";
let activeDiscountDetail = "all";
let activeDiscountFullness = "all";
let currentRechargeConfig = null;
let publicRechargeConfig = null;
let currentRechargeOrders = [];
let currentProfile = null;
let currentQuota = null;
let selectedRechargeAmount = null;
let selectedRechargeOrderType = "normal";
let selectedRechargePaymentChannel = "alipay_qr";
let selectedGuestTransferPaymentChannel = "alipay_qr";
let pendingDirectPurchaseContext = null;
let selectedDrawServiceTierKey = "tier_8";
let selectedDrawServiceWan = 1;
let productSearchTimer = null;
let discountSearchTimer = null;
let activeAuthTab = "register";
let activeAccountTab = "overview";
let activeDockTarget = "products";
let activeGuidePage = "tutorial";
let deferredAccountBootstrapQueued = false;
let recentSalesItems = [];
let currentAuctions = [];
let currentAuctionBidSummaries = [];
let currentAccountOrders = [];
let currentEscrowTrades = [];
let activePurchaseView = "mall";
let purchasePaginationState = {
  mall: 1,
  escrow_buy: 1,
  escrow_sell: 1,
};
let activeAuctionStatus = "live";
let currentHelperBindings = [];
let currentHelperInventories = [];
let currentHelperMergedItems = [];
let currentHelperInventorySummary = null;
let currentHelperInventoryPage = null;
let helperInventoryQuery = {
  page: 1,
  pageSize: 30,
  keyword: "",
  bindingId: "",
  merged: false,
};
let currentConsignmentListings = [];
let currentHelperSnapshots = [];
let currentHelperActionLogs = [];
let currentHelperRestorePreview = null;
let currentHelperRestoreProgress = null;
let pendingHelperPreviewSnapshotId = null;
let expandedHelperSnapshotIds = new Set();
let showArchivedHelperSnapshots = false;
let helperInventoryExpanded = false;
let helperInventorySyncState = {
  running: false,
  mode: "",
  queue: [],
  total: 0,
  completed: 0,
  failures: [],
  currentBindingId: null,
  currentRequestId: "",
  currentRoleName: "",
  itemTimeoutId: null,
  pendingInventories: [],
  batchSaving: false,
};
let helperInventoryImportState = {
  running: false,
};

function setAllProducts(products) {
  allProducts = Array.isArray(products) ? products : [];
}

function setPublicRechargeConfig(config) {
  if (!config) return;
  publicRechargeConfig = config;
}

function setRecentSalesItems(items) {
  recentSalesItems = Array.isArray(items) ? items : [];
}

function setCurrentAuctions(items) {
  currentAuctions = Array.isArray(items) ? items : [];
}

function setCurrentAuctionBidSummaries(items) {
  currentAuctionBidSummaries = Array.isArray(items) ? items : [];
}

function setCurrentAccountOrders(items) {
  currentAccountOrders = Array.isArray(items) ? items : [];
}

function getPurchasePage(view) {
  return Math.max(Number(purchasePaginationState?.[view] || 1) || 1, 1);
}

function renderCurrentAccountPurchases() {
  renderProfile(currentProfile, currentQuota, currentAccountOrders, currentEscrowTrades);
}

function setActivePurchaseView(view) {
  const normalized = ["mall", "escrow_buy", "escrow_sell"].includes(String(view || ""))
    ? String(view)
    : "mall";
  activePurchaseView = normalized;
  renderCurrentAccountPurchases();
}

function changePurchasePage(view, page) {
  const normalized = ["mall", "escrow_buy", "escrow_sell"].includes(String(view || ""))
    ? String(view)
    : activePurchaseView;
  purchasePaginationState = {
    ...purchasePaginationState,
    [normalized]: Math.max(Number(page) || 1, 1),
  };
  activePurchaseView = normalized;
  renderCurrentAccountPurchases();
}

function setCurrentHelperBindings(items) {
  currentHelperBindings = Array.isArray(items) ? items : [];
}

function getCurrentHelperBindings() {
  return currentHelperBindings;
}

function findHelperBindingById(bindingId) {
  return (currentHelperBindings || []).find((item) => Number(item?.id || 0) === Number(bindingId || 0)) || null;
}

function setCurrentHelperInventories(items) {
  currentHelperInventories = Array.isArray(items) ? items : [];
}

function getCurrentHelperInventories() {
  return currentHelperInventories;
}

function setCurrentHelperMergedItems(items) {
  currentHelperMergedItems = Array.isArray(items) ? items : [];
  helperInventoryExpanded = false;
}

function setCurrentHelperInventorySummary(summary) {
  currentHelperInventorySummary = summary && typeof summary === "object" ? { ...summary } : null;
}

function setCurrentHelperInventoryPage(page) {
  currentHelperInventoryPage = page && typeof page === "object" ? { ...page } : null;
}

function getHelperInventoryQuery() {
  return { ...helperInventoryQuery };
}

function updateHelperInventoryQuery(patch = {}) {
  helperInventoryQuery = {
    ...helperInventoryQuery,
    ...(patch || {}),
  };
}

function setCurrentConsignmentListings(items) {
  currentConsignmentListings = Array.isArray(items) ? items : [];
}

function setCurrentHelperSnapshots(items) {
  currentHelperSnapshots = Array.isArray(items) ? items : [];
}

function getCurrentHelperSnapshots() {
  return currentHelperSnapshots;
}

function setCurrentHelperActionLogs(items) {
  currentHelperActionLogs = Array.isArray(items) ? items : [];
}

function getCurrentHelperActionLogs() {
  return currentHelperActionLogs;
}

function getCurrentHelperRestorePreview() {
  return currentHelperRestorePreview;
}

function setCurrentHelperRestorePreview(preview) {
  currentHelperRestorePreview = preview && typeof preview === "object" ? { ...preview } : null;
}

function getCurrentProfile() {
  return currentProfile;
}

function getCurrentQuota() {
  return currentQuota;
}

function getHelperConfig() {
  return helperConfig;
}

function getHelperInventorySyncState() {
  return helperInventorySyncState;
}

function setHelperInventorySyncState(state) {
  helperInventorySyncState = state && typeof state === "object" ? { ...state } : helperInventorySyncState;
}

function getHelperInventoryImportState() {
  return helperInventoryImportState;
}

function setHelperInventoryImportState(state) {
  helperInventoryImportState =
    state && typeof state === "object" ? { ...helperInventoryImportState, ...state } : helperInventoryImportState;
}

function getPendingHelperBridgePayload() {
  return pendingHelperBridgePayload;
}

function setPendingHelperBridgePayload(payload) {
  pendingHelperBridgePayload = payload && typeof payload === "object" ? { ...payload } : null;
}

function setPendingHelperPreviewSnapshotId(snapshotId) {
  pendingHelperPreviewSnapshotId = snapshotId ? Number(snapshotId) : null;
}

function getPendingHelperPreviewSnapshotId() {
  return pendingHelperPreviewSnapshotId;
}

function isHelperScanBindEnabled() {
  return Boolean(helperConfig?.features?.scan_bind);
}

function isHelperSnapshotEnabled() {
  return Boolean(helperConfig?.features?.team_snapshot);
}

function isHelperTeamSwitchEnabled() {
  return Boolean(helperConfig?.features?.team_switch);
}

function isHelperTeamRestoreEnabled() {
  return Boolean(helperConfig?.features?.team_restore);
}

function isHelperActionLogsEnabled() {
  return Boolean(helperConfig?.features?.action_logs);
}

function isHelperGameFeaturesEnabled() {
  return Boolean(helperConfig?.features?.game_features);
}

function hasHelperCapability(capability) {
  return (helperConfig?.capabilities || []).includes(String(capability || "").trim());
}

function hasAnyHelperCapability() {
  return Array.isArray(helperConfig?.capabilities) && helperConfig.capabilities.length > 0;
}

function mergeHelperConfig(result) {
  helperConfig = {
    ...helperConfig,
    ...(result || {}),
    features: {
      ...helperConfig.features,
      ...(result?.features || {}),
    },
    capabilities: Array.isArray(result?.capabilities) ? result.capabilities : helperConfig.capabilities || [],
    plans: {
      ...helperConfig.plans,
      ...(result?.plans || {}),
    },
    access: {
      ...helperConfig.access,
      ...(result?.access || {}),
    },
  };
  return helperConfig;
}

function setHelperOriginInputValue(value) {
  if (helperOriginInput) {
    helperOriginInput.value = value;
  }
}

function resetAccountSessionState() {
  currentRechargeConfig = null;
  currentRechargeOrders = [];
  currentProfile = null;
  currentQuota = null;
  currentAccountOrders = [];
  currentEscrowTrades = [];
  activePurchaseView = "mall";
  purchasePaginationState = { mall: 1, escrow_buy: 1, escrow_sell: 1 };
  selectedRechargePaymentChannel = "alipay_qr";
  pendingDirectPurchaseContext = null;
  setCurrentAuctionBidSummaries([]);
  currentHelperBindings = [];
  currentHelperInventories = [];
  currentHelperMergedItems = [];
  currentHelperInventorySummary = null;
  currentHelperInventoryPage = null;
  helperInventoryQuery = { page: 1, pageSize: 30, keyword: "", bindingId: "", merged: false };
  currentConsignmentListings = [];
  currentHelperSnapshots = [];
  currentHelperActionLogs = [];
  currentHelperRestorePreview = null;
  currentHelperRestoreProgress = null;
  pendingHelperPreviewSnapshotId = null;
  resetHelperInventorySyncState();
}

function renderLoggedOutAccountState(noticeText = "", noticeType = "") {
  deferredAccountBootstrapQueued = false;
  resetAccountSessionState();
  renderSessionSummary(null);
  renderProfile(null, null, []);
  renderBeginnerGuide(null, [], []);
  renderRechargeSection(null, null, []);
  renderDrawServiceZone(null, null);
  renderAuctionZone(null);
  renderHelperBindingPanel();
  renderHelperInventoryPanel();
  renderHelperGameFeaturesPanel();
  renderHelperSnapshotPanel();
  renderHelperRestorePreviewPanel();
  renderHelperRestoreProgressPanel();
  renderHelperTeamSwitchPanel();
  setNotice(noticeText, noticeType);
}

function applySessionProfileFallback(profile) {
  currentProfile = profile;
  currentQuota = {
    balance: Number(profile?.quota_balance ?? 0),
  };
  renderSessionSummary(profile);
  renderProfile(profile, currentQuota, []);
}

function hydrateSessionProfile() {
  const session = loadSession();
  const sessionProfileFallback = getSessionProfileFallback(session);
  if (!sessionProfileFallback) {
    renderSessionSummary(null);
    return false;
  }
  applySessionProfileFallback(sessionProfileFallback);
  return true;
}

function shouldDeferAccountBootstrap() {
  return currentPageMode === "shop";
}

function scheduleDeferredAccountBootstrap() {
  const session = loadSession();
  if (!session?.token || deferredAccountBootstrapQueued) return false;
  deferredAccountBootstrapQueued = true;
  const runBootstrap = () => {
    deferredAccountBootstrapQueued = false;
    return safeRun("startup.account.deferred", () => loadAccount());
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(runBootstrap, { timeout: 1200 });
    return true;
  }
  window.setTimeout(runBootstrap, 120);
  return true;
}

function applyLoadedAccountState({ profile, quota, orders, rechargeConfig, rechargeOrders, escrowTrades }) {
  deferredAccountBootstrapQueued = false;
  currentRechargeConfig = rechargeConfig;
  publicRechargeConfig = rechargeConfig;
  currentRechargeOrders = rechargeOrders || [];
  setCurrentAccountOrders(orders || []);
  currentEscrowTrades = escrowTrades || [];
  currentProfile = profile;
  currentQuota = quota;
  renderSessionSummary(profile);
  renderProfile(profile, quota, orders || [], currentEscrowTrades);
  renderBeginnerGuide(profile, orders || [], rechargeOrders || []);
  renderRechargeSection(profile, rechargeConfig, rechargeOrders || []);
  renderDrawServiceZone(profile, quota);
}

function handleRechargeSubmitSuccess({ orderType, amountYuan, orderId }) {
  selectedRechargeAmount = amountYuan;
  selectedRechargeOrderType = "normal";
  pendingDirectPurchaseContext = null;
  setAccountMessage(
    orderType === "season_member"
      ? `赛季会员申请已提交，订单 #${orderId} 等待管理员审核。`
      : orderType === "residual_transfer"
        ? `残卷转赠申请已提交，订单 #${orderId} 等待管理员审核。`
        : `充值申请已提交，订单 #${orderId} 等待管理员审核。`,
    "success"
  );
}

function applyImmediateAuthResult(result) {
  return applyImmediateAuthResultRuntime(
    {
      getSessionProfileFallback,
      renderSessionSummary,
      renderProfile,
    },
    result
  );
}

function resetPostLogoutUiState() {
  currentRechargeConfig = null;
  currentRechargeOrders = [];
  selectedRechargePaymentChannel = "alipay_qr";
  pendingDirectPurchaseContext = null;
}

function focusAccountAfterAuth() {
  return focusAccountAfterAuthRuntime({
    accountSection,
    activateAccountTab,
    scrollSectionIntoView,
    setActiveDockTarget,
  });
}

async function completePostAuthNavigation() {
  return completePostAuthNavigationRuntime({
    navigateToPostAuthSurface,
    activateAccountTab,
    loadAccount,
  });
}

let pendingHelperBridgePayload = loadHelperBridgeSession();
let pendingHelperBridgeIntent = loadHelperBridgeIntent();
let helperBridgeSurfaceState = {
  mode: "",
  interactive: false,
};
let helperBridgeBackgroundState = {
  mode: "",
  url: "",
  timeoutId: null,
};
let helperConfig = {
  enabled: false,
  mode: "off",
  public_base: "/xyzw-helper",
  api_base: "/api",
  features: {
    scan_bind: false,
    legacy_inventory: false,
    team_snapshot: false,
    team_switch: false,
    team_restore: false,
    action_logs: false,
    game_features: false,
  },
  capabilities: [],
  access: {
    whitelist_active: false,
    lineup_allowed: true,
    reason: "",
  },
  limits: {
    snapshots_per_user: 3,
  },
  plans: {
    base_slots: 3,
    permanent_slot_quota: 5000,
    permanent_slot_max: 7,
    seasonal_slot_quota: 1000,
    member_bonus_slots: 3,
    season_label: "当前赛季",
    season_expires_at: null,
  },
};
const HELPER_BRIDGE_INTENT_AUTH = "scan_auth";
const HELPER_BRIDGE_INTENT_BIND = "bind_current";
const productPaginationState = {
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
};
const discountPaginationState = {
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
};
const BEGINNER_GUIDE_REWARD_QUOTA = 1000;
const DRAW_SERVICE_MIN_QUOTA = 200;
const DRAW_SERVICE_STEP_QUOTA = 200;
const AUCTION_COUNTDOWN_TICK_MS = 1000;
const POST_AUTH_TARGET_KEY = "gongfa_post_auth_target_v1";
const HELPER_CACHE_BUSTER = "20260513-helper-inventory-sync-2";
const debugState = new Map();
const HELPER_EQUIPMENT_PART_NAMES = {
  1: "武器",
  2: "铠甲",
  3: "头冠",
  4: "坐骑",
};
const HELPER_ATTR_NAMES = {
  1: "攻击",
  2: "血量",
  3: "防御",
  4: "速度",
  5: "破甲",
  6: "破抵",
  7: "精准",
  8: "格挡",
  9: "减伤",
  10: "暴击",
  11: "抗暴",
  12: "爆伤",
  13: "抗爆伤",
  14: "技伤",
  15: "免控",
  16: "免眩晕",
  17: "免冰冻",
  18: "免沉默",
  19: "免流血",
  20: "免中毒",
  21: "免灼烧",
};
const HELPER_SLOT_COLOR_META = {
  0: { label: "未开", tone: "empty" },
  1: { label: "白", tone: "white" },
  2: { label: "绿", tone: "green" },
  3: { label: "蓝", tone: "blue" },
  4: { label: "紫", tone: "purple" },
  5: { label: "橙", tone: "orange" },
  6: { label: "红", tone: "red" },
};

function normalizeHelperAttachmentUid(value) {
  const attachmentUid = Number(value || 0);
  return attachmentUid > 0 ? attachmentUid : null;
}

function escapeHtml(value) {
  return sharedEscapeHtml(value);
}

function normalizeHelperDisplayRoleName(value, roleId = "") {
  const rawName = String(value || "").trim();
  const normalizedRoleId = String(roleId || "").trim();
  if (!rawName) return "";
  if (normalizedRoleId) {
    const suffixPattern = new RegExp(`-\\d+-${normalizedRoleId.replace(/[.*+?^${}()|[\]\\\\]/g, "\\$&")}$`);
    if (suffixPattern.test(rawName)) {
      return rawName.replace(suffixPattern, "").trim() || rawName;
    }
  }
  return rawName;
}

function getHelperPublicAssetUrl(rawPath) {
  const normalized = String(rawPath || "").trim();
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const cleanPath = normalized.replace(/^\/+/, "");
  return `/helper-public/${cleanPath}`;
}

function getHeroAvatarUrl(hero) {
  const directAvatar = getHelperPublicAssetUrl(hero?.hero_avatar || "");
  if (directAvatar) return directAvatar;
  return "";
}

function getHelperAttrName(attrId) {
  return HELPER_ATTR_NAMES[Number(attrId || 0)] || `属性${Number(attrId || 0)}`;
}

function getHelperSlotColorMeta(colorId) {
  return HELPER_SLOT_COLOR_META[Number(colorId || 0)] || HELPER_SLOT_COLOR_META[0];
}

function getSnapshotRawHeroes(snapshot) {
  const rawHeroes = Array.isArray(snapshot?.raw?.heroes) ? snapshot.raw.heroes : [];
  if (rawHeroes.length) return rawHeroes;
  const summaryHeroes = Array.isArray(snapshot?.summary?.heroes) ? snapshot.summary.heroes : [];
  return summaryHeroes.map((hero) => ({
    slot: hero?.slot,
    hero_id: hero?.hero_id,
    hero_name: hero?.hero_name,
    hero_type: hero?.hero_type,
    hero_avatar: hero?.hero_avatar,
    level: hero?.level,
    power: hero?.power,
    attachment_uid: hero?.attachment_uid,
    fish_name: hero?.fish_name,
    pearl_skill_name: hero?.pearl_skill_name,
    red_count: hero?.red_count,
    hole_count: hero?.hole_count,
    fish_slots: [],
    equipment: [],
  }));
}

function getSnapshotRoleObject(snapshot) {
  const raw = snapshot?.raw?.role_info;
  const fallbackRoleSnapshot = snapshot?.raw?.role_snapshot;
  const role =
    raw?.role ||
    raw?.roleInfo?.role ||
    raw?.roleInfo ||
    fallbackRoleSnapshot ||
    raw ||
    {};
  return role && typeof role === "object" ? role : {};
}

function getSnapshotRoleHeroes(snapshot) {
  const role = getSnapshotRoleObject(snapshot);
  return role?.heroes && typeof role.heroes === "object" ? role.heroes : {};
}

function getSnapshotPresetTeamRoot(snapshot) {
  const raw = snapshot?.raw?.preset_team;
  const root = raw?.presetTeamInfo ?? raw ?? {};
  const nested = root?.presetTeamInfo ?? root;
  return {
    useTeamId: Number(root?.useTeamId || nested?.useTeamId || snapshot?.summary?.use_team_id || 1) || 1,
    teams: nested && typeof nested === "object" ? nested : {},
  };
}

function getSnapshotCurrentTeamEntry(snapshot) {
  const preset = getSnapshotPresetTeamRoot(snapshot);
  return preset.teams?.[preset.useTeamId] || preset.teams?.[String(preset.useTeamId)] || {};
}

function getSnapshotCurrentTeamInfo(snapshot) {
  const entry = getSnapshotCurrentTeamEntry(snapshot);
  const teamInfo = entry?.teamInfo;
  return teamInfo && typeof teamInfo === "object" ? teamInfo : {};
}

function getSnapshotPearlMap(snapshot) {
  const role = getSnapshotRoleObject(snapshot);
  const pearlMap = role?.pearlMap;
  return pearlMap && typeof pearlMap === "object" ? pearlMap : {};
}

function getSnapshotWeaponInfo(snapshot) {
  const summary = snapshot?.summary || {};
  const entry = getSnapshotCurrentTeamEntry(snapshot);
  const weaponId =
    Number(summary?.weapon_id || entry?.weapon?.weaponId || 0) || 0;
  const weaponName = String(summary?.weapon_name || "").trim();
  if (weaponId > 0 || weaponName) {
    return {
      id: weaponId,
      name: weaponName || `玩具 ${weaponId}`,
    };
  }
  return null;
}

function getSnapshotLegionResearchCount(snapshot) {
  const role = getSnapshotRoleObject(snapshot);
  const legionResearch =
    role?.legionResearch && typeof role.legionResearch === "object" ? role.legionResearch : {};
  const exactCount = Object.keys(legionResearch).length;
  if (exactCount > 0) return exactCount;
  return Number(snapshot?.summary?.legion_research_count || 0);
}

function getSnapshotAttachmentOwnershipCount(snapshot) {
  return getSnapshotAttachmentOwnershipCountRuntime(getHelperRestoreBuilderContext(), snapshot);
}

function isSnapshotSafeRestoreReady(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;
  return !getSnapshotSafeRestoreBlockReason(snapshot);
}

function getSnapshotSafeRestoreBlockReason(snapshot) {
  return getSnapshotSafeRestoreBlockReasonRuntime(getHelperRestoreBuilderContext(), snapshot);
}

function encodeHelperBridgePayload(payload) {
  try {
    const json = JSON.stringify(payload || {});
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window
      .btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  } catch (error) {
    console.error("encodeHelperBridgePayload failed", error);
    return "";
  }
}

function buildHelperRestorePlanFromSnapshot(snapshot) {
  return buildHelperRestorePlanFromSnapshotRuntime(getHelperRestoreBuilderContext(), snapshot);
}

function buildHelperSnapshotRestoreSummaryText(snapshot) {
  return buildHelperSnapshotRestoreSummaryTextRuntime(getHelperRestoreBuilderContext(), snapshot);
}

function buildHelperSnapshotCapabilityMarkup(snapshot) {
  return buildHelperSnapshotCapabilityMarkupRuntime(getHelperRestoreBuilderContext(), snapshot);
}

function buildHelperRestorePreview(targetSnapshot, liveSnapshot) {
  return buildHelperRestorePreviewRuntime(
    getHelperRestoreBuilderContext(),
    targetSnapshot,
    liveSnapshot
  );
}

function buildHelperFishSlotsMarkup(fishSlots) {
  return buildHelperFishSlotsMarkupRuntime(getHelperRestoreBuilderContext(), fishSlots);
}

function buildHelperEquipmentMarkup(equipment) {
  return buildHelperEquipmentMarkupRuntime(getHelperRestoreBuilderContext(), equipment);
}

function buildHelperFishSlotsSummary(fishSlots) {
  return buildHelperFishSlotsSummaryRuntime(getHelperRestoreBuilderContext(), fishSlots);
}

function buildHelperEquipmentSummary(equipment) {
  return buildHelperEquipmentSummaryRuntime(getHelperRestoreBuilderContext(), equipment);
}

function createImageFallbackSvg(name, kind = "card") {
  const label = String(name || "??").slice(0, 12);
  const colors =
    kind === "bundle"
      ? { a: "#c4552d", b: "#234e52" }
      : { a: "#d7b188", b: "#465f63" };
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='760'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${colors.a}'/><stop offset='100%' stop-color='${colors.b}'/></linearGradient></defs><rect width='100%' height='100%' rx='32' fill='url(#g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='42' fill='white' font-family='sans-serif'>${escapeHtml(label)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const BUNDLE_COLLAGE_MAP = {
  atlas_orange_and_below: [
    "/gongfa/yunqijue.png",
    "/gongfa/suibianzhang.png",
    "/gongfa/tuitanggu.png",
    "/gongfa/paolu-caoshangfei.png",
  ],
  atlas_red_and_below: [
    "/gongfa/xiaoqiang-busishen.png",
    "/gongfa/moyu-huajin.png",
    "/gongfa/mopai-toushiyan.png",
    "/gongfa/zhedeng-yaojue.png",
  ],
  atlas_full_attack_set: [
    "/gongfa/gangjing-gangqi.png",
    "/gongfa/gangshang-kaihuashou.png",
    "/gongfa/yexing-daofa.png",
    "/gongfa/duichuanchang-wengongshu.png",
  ],
  atlas_high_attack_full_dex: [
    "/gongfa/xiaoqiang-busishen.png",
    "/gongfa/gangjing-gangqi.png",
    "/gongfa/mopai-toushiyan.png",
    "/gongfa/yunqijue.png",
  ],
};

function getImagePayload(product, kind = product?.item_kind || "card") {
  const placeholder = createImageFallbackSvg(product?.name, kind);
  const fallbacks = getImageFallbackCandidates(product);
  const src = getPreferredImageSrc(product, fallbacks) || placeholder;
  return {
    src,
    fallbacks,
    placeholder,
  };
}

function getPreferredImageSrc(product, fallbacks = []) {
  const raw = String(product?.image_url || "").trim();
  if (!raw) return fallbacks.shift() || "";
  const hdCandidate = getHdImageCandidate(raw);
  if (hdCandidate) {
    fallbacks.push(raw);
    return hdCandidate;
  }
  return raw;
}

function getHdImageCandidate(src) {
  if (!/legacy-assets\//.test(src)) return "";
  return src.replace(/(^\.?\/)?legacy-assets\//, "/legacy-assets-hd/");
}

function getImageFallbackCandidates(product) {
  const candidates = [];
  const raw = String(product?.image_url || "").trim();
  const hdCandidate = getHdImageCandidate(raw);
  if (hdCandidate) {
    candidates.push(hdCandidate);
  }
  const fileName = raw.split("/").pop();
  if (fileName) {
    candidates.push(`/helper-public/legacy-assets/${fileName}`);
  }
  return candidates;
}

function getBundleCollageSources(product) {
  const componentSources = Array.isArray(product?.bundle_components)
    ? product.bundle_components
        .map((item) => String(item?.image_url || "").trim())
        .filter(Boolean)
    : [];
  if (componentSources.length > 0) return componentSources;

  const code = String(product?.uid || product?.code || "").trim();
  const mapped = BUNDLE_COLLAGE_MAP[code] || [];
  if (mapped.length > 0) return mapped;

  return [
    "/gongfa/xiaoqiang-busishen.png",
    "/gongfa/yunqijue.png",
    "/gongfa/gangjing-gangqi.png",
    "/gongfa/mopai-toushiyan.png",
  ];
}

function renderBundleCollage(product, variant = "grid") {
  const sources = getBundleCollageSources(product);
  const placeholder = createImageFallbackSvg(product?.name || "??", "bundle");
  const imageClass = variant === "detail" ? "bundle-detail-collage-image" : "bundle-collage-image";
  const slots = sources.slice(0, 4);

  return `
    <div class="bundle-collage bundle-collage-four">
      ${slots
        .map(
          (src, index) => `
            <div class="bundle-collage-slot slot-${index + 1}">
              <img
                class="${imageClass}"
                src="${escapeHtml(src)}"
                alt="${escapeHtml(product?.name || "??")}"
                data-fallbacks=""
                data-placeholder="${escapeHtml(placeholder)}"
              />
            </div>
          `
        )
        .join("")}
      <div class="bundle-collage-gloss"></div>
      <div class="product-cover-overlay"></div>
    </div>
  `;
}

function applyDynamicBundleSelection(product, selection = {}) {
  if (!product?.configurable_bundle || !Array.isArray(product.bundle_variants)) return null;
  const attackMin = Number(selection.attack_min || product.selected_bundle_options?.attack_min || 0);
  const hpMin = Number(selection.hp_min || product.selected_bundle_options?.hp_min || 0);
  const variant =
    product.bundle_variants.find(
      (item) => Number(item.attack_min || 0) === attackMin && Number(item.hp_min || 0) === hpMin
    ) || null;
  if (!variant) {
    setProductDetailMessage("当前档位暂时凑不齐一套，请换一个数值。", "error");
    return null;
  }
  product.price_quota = Number(variant.price_quota || 0);
  product.original_price_quota = Number(variant.price_quota || 0);
  product.bundle_components = Array.isArray(variant.bundle_components)
    ? variant.bundle_components
    : [];
  product.bundle_component_product_ids = product.bundle_components.map((item) => Number(item.product_id));
  product.selected_bundle_options = {
    attack_min: Number(variant.attack_min || 0),
    hp_min: Number(variant.hp_min || 0),
  };
  product.description = `${product.main_attrs || product.description || "动态套餐"} 当前选择：${variant.label || ""}。`;
  return product;
}

function bindImageFallbacks(root = document) {
  root
    .querySelectorAll(
      "img.product-image, img.product-detail-image, img.bundle-collage-image, img.bundle-detail-collage-image"
    )
    .forEach((img) => {
      if (img.dataset.fallbackBound === "1") return;
      img.dataset.fallbackBound = "1";
      img.addEventListener("error", () => {
        const list = String(img.dataset.fallbacks || "")
          .split("|")
          .map((item) => item.trim())
          .filter(Boolean);
        if (list.length > 0) {
          const next = list.shift();
          img.dataset.fallbacks = list.join("|");
          img.src = next;
          return;
        }
        img.src = img.dataset.placeholder || createImageFallbackSvg(img.alt || "??");
      });
    });
}

function setNotice(text, type = "") {
  if (!bindMessage) return;
  bindMessage.textContent = text || "";
  bindMessage.className = type ? `notice ${type}` : "notice";
}

function shouldShowDebugPanel() {
  const host = String(window.location.host || "");
  const search = String(window.location.search || "");
  return host.includes(":8081") || host === "101.34.247.186:8081" || search.includes("debug=1");
}

function renderDebugPanel() {
  if (!debugPanel || !debugLines) return;
  const visible = shouldShowDebugPanel();
  debugPanel.classList.toggle("hidden", !visible);
  if (!visible) return;
  debugLines.innerHTML = Array.from(debugState.entries())
    .map(
      ([key, value]) =>
        `<div class="debug-line"><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</div>`
    )
    .join("");
}

function isHelperScanAuthEnabled() {
  return Boolean(
    helperConfig?.enabled &&
      (helperConfig?.features?.scan_auth || helperConfig?.features?.scan_bind)
  );
}

function isHelperLineupEnabled() {
  return Boolean(helperConfig?.enabled && helperConfig?.access?.lineup_allowed !== false);
}

function getHelperLineupDisabledReason(defaultText = "当前环境未启用阵容中心。") {
  return String(helperConfig?.access?.reason || defaultText).trim() || defaultText;
}

function setDebugLine(key, value) {
  debugState.set(String(key), String(value));
  renderDebugPanel();
}

function safeRun(label, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.catch((error) => {
        setDebugLine(label, `error: ${error?.message || error}`);
        throw error;
      });
    }
    setDebugLine(label, "ok");
    return result;
  } catch (error) {
    setDebugLine(label, `error: ${error?.message || error}`);
    return null;
  }
}

function getSessionProfileFallback(session) {
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

function schedulePostAuthAccountFocus() {
  return schedulePostAuthAccountFocusRuntime(window.sessionStorage, POST_AUTH_TARGET_KEY);
}

function consumePostAuthAccountFocus() {
  return consumePostAuthAccountFocusRuntime(window.sessionStorage, POST_AUTH_TARGET_KEY);
}

function setAccountMessage(text, type = "") {
  if (!accountMessage) return;
  accountMessage.textContent = text || "";
  accountMessage.className = type ? `notice ${type}` : "notice";
}

function activateAuthTab(tab) {
  activeAuthTab = tab === "login" ? "login" : "register";
  authTabButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-auth-tab") === activeAuthTab);
  });
  authTabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-auth-panel") !== activeAuthTab);
  });
}

function activateAccountTab(tab, { scroll = false } = {}) {
  return activateAccountTabRuntime(getAccountInteractionRuntimeContext(), tab, { scroll });
}

function syncAccountTabWithHash() {
  return syncAccountTabWithHashRuntime(getAccountInteractionRuntimeContext());
}

function getLoginEntryHref() {
  return getLoginEntryHrefRuntime(currentPageMode);
}

function navigateToLoginEntry() {
  return navigateToLoginEntryRuntime(getPageNavigationRuntimeContext());
}

function getPostAuthSurfaceUrl() {
  return getPostAuthSurfaceUrlRuntime(currentPageMode);
}

function navigateToPostAuthSurface() {
  return navigateToPostAuthSurfaceRuntime(getPageNavigationRuntimeContext());
}

function navigateToAccountTabLink(link, targetTab, options = {}) {
  return navigateToAccountTabLinkRuntime(getAccountInteractionRuntimeContext(), link, targetTab, options);
}

function setActiveDockTarget(target) {
  return setActiveDockTargetRuntime(getPageNavigationRuntimeContext(), target);
}

function scrollSectionIntoView(section) {
  return scrollSectionIntoViewRuntime(getPageNavigationRuntimeContext(), section);
}

function navigateWithDock(target) {
  return navigateWithDockRuntime(getPageNavigationRuntimeContext(), target);
}

function syncDiscountDockVisibility(hasDiscounts) {
  return syncDiscountDockVisibilityRuntime(getPageNavigationRuntimeContext(), hasDiscounts);
}

function syncDockWithViewport() {
  return syncDockWithViewportRuntime(getPageNavigationRuntimeContext());
}

function updateShellVisibility(profile) {
  const loggedIn = Boolean(profile);
  const isAdmin = isAdminRole(profile?.role);
  const canChangePassword = loggedIn && profile?.auth_provider === "password";
  const allowBindSurface = isPageSectionEnabled("bind");
  const keepBindVisible = currentPageMode === "login";
  navBindLink?.classList.toggle("hidden", loggedIn);
  navAdminLink?.classList.toggle("hidden", !isAdmin);
  mobileAdminLink?.classList.toggle("hidden", !isAdmin);
  bindSection?.classList.toggle("hidden", !allowBindSurface || (loggedIn && !keepBindVisible));
  accountLogoutBtn?.classList.toggle("hidden", !loggedIn);
  accountSwitchLink?.classList.toggle("hidden", !loggedIn);
  accountSecurityTabButton?.classList.toggle("hidden", !canChangePassword);
  if (!canChangePassword && activeAccountTab === "security") {
    activeAccountTab = "overview";
  }
  accountPasswordPanel?.classList.toggle("hidden", !canChangePassword || activeAccountTab !== "security");
  activateAccountTab(activeAccountTab);
}

function fillAccountForms(profile) {
  if (!accountRoleNameInput || !accountServerInput || !accountNicknameInput) return;
  accountRoleNameInput.value = profile?.game_role_name || "";
  accountServerInput.value = profile?.game_server || "";
  accountServerInput.disabled = !profile;
  accountNicknameInput.value = profile?.nickname || "";
  if (accountContactInput) accountContactInput.value = profile?.contact_info || "";
}

function setProductDetailMessage(text, type = "") {
  productDetailMessage.textContent = text || "";
  productDetailMessage.className = type ? `notice ${type}` : "notice";
}

function pickErrorMessage(error, fallback) {
  return sharedPickErrorMessage(error, fallback);
}

function getCurrentQuotaValue() {
  if (quotaBalance) {
    const renderedValue = Number(String(quotaBalance.textContent || "").trim());
    if (Number.isFinite(renderedValue)) {
      return renderedValue;
    }
  }
  const stateValue = Number(currentQuota?.balance ?? currentProfile?.quota_balance);
  return Number.isFinite(stateValue) ? stateValue : null;
}

function fillBindForm(payload) {
  if (!payload) return;
  bindRoleIdInput.value = payload.game_role_id || "";
  bindServerInput.value = payload.game_server || "";
  bindRoleNameInput.value = payload.game_role_name || "";
  bindTokenIdInput.value = payload.bind_token_id || "";
  bindNicknameInput.value = payload.nickname || "";
  setNotice("已收到 helper 回传的角色信息，可以直接提交绑定。", "success");
}

function getHelperRestoreBuilderContext() {
  return {
    escapeHtml,
    helperEquipmentPartNames: HELPER_EQUIPMENT_PART_NAMES,
    getSnapshotRawHeroes,
    getSnapshotRoleObject,
    getSnapshotRoleHeroes,
    getSnapshotCurrentTeamInfo,
    getSnapshotPearlMap,
    getSnapshotWeaponInfo,
    getSnapshotLegionResearchCount,
    normalizeHelperAttachmentUid,
    buildHelperSnapshotName,
    getHelperSlotColorMeta,
    getHelperAttrName,
    formatHelperBattleSlot,
  };
}

function getHelperRendererContext() {
  return {
    escapeHtml,
    formatDate,
    currentProfile,
    helperConfig,
    pendingHelperBridgePayload,
    currentHelperBindings,
    currentHelperInventories,
    currentHelperMergedItems,
    currentHelperInventorySummary,
    currentHelperInventoryPage,
    helperInventoryQuery,
    currentConsignmentListings,
    currentHelperSnapshots,
    currentHelperActionLogs,
    currentHelperRestorePreview,
    currentHelperRestoreProgress,
    helperInventorySyncState,
    helperInventoryImportState,
    isHelperInventoryExpanded: () => helperInventoryExpanded,
    showArchivedHelperSnapshots,
    expandedHelperSnapshotIds,
    helperRestoreProgressCurrent,
    helperOpenAuthPopupBtn,
    helperOpenBindPopupBtn,
    helperSaveBindBtn,
    helperClearBindBtn,
    helperAuthNote,
    helperAuthMessage,
    helperBindCurrent,
    helperInventoryBindings,
    helperInventoryMerged,
    helperGameFeatureList,
    helperSyncCurrentInventoryBtn,
    helperSyncAllInventoryBtn,
    helperReadSnapshotBtn,
    helperSnapshotMessage,
    helperSnapshotCurrent,
    helperSnapshotList,
    helperSlotSummary,
    helperBuyPermanentSlotBtn,
    helperBuySeasonalSlotBtn,
    helperPreviewCurrent,
    helperTeamSwitchCurrent,
    helperTeamSwitchControls,
    helperTeamSwitchLog,
    helperRestoreResultCurrent,
    isHelperScanAuthEnabled,
    hasHelperCapability,
    hasAnyHelperCapability,
    isHelperGameFeaturesEnabled,
    setHelperGameFeatureMessage,
    setHelperAuthMessage,
    syncActiveHelperBindingPreference,
    normalizeHelperDisplayRoleName,
    isHelperInventoryEnabled,
    setHelperInventoryMessage,
    getActiveHelperBinding,
    getHelperInventoryBinding,
    getHelperInventoryImageUrl,
    getSnapshotWeaponInfo,
    getSnapshotLegionResearchCount,
    getSnapshotAttachmentOwnershipCount,
    buildHelperSnapshotRestoreSummaryText,
    getSnapshotRawHeroes,
    getHeroAvatarUrl,
    getSnapshotSafeRestoreBlockReason,
    normalizeHelperAttachmentUid,
    buildHelperEquipmentSummary,
    buildHelperFishSlotsSummary,
    getHelperLineupPlan,
    setHelperSlotMessage,
    renderHelperRestoreResultPanel: () => renderHelperRestoreResultPanel(),
  };
}

function getHelperBridgeSurfaceState() {
  return helperBridgeSurfaceState;
}

function setHelperBridgeSurfaceState(state) {
  helperBridgeSurfaceState = state && typeof state === "object" ? { ...state } : helperBridgeSurfaceState;
}

function getHelperBridgeBackgroundState() {
  return helperBridgeBackgroundState;
}

function setHelperBridgeBackgroundState(state) {
  helperBridgeBackgroundState =
    state && typeof state === "object" ? { ...state } : helperBridgeBackgroundState;
}

function getHelperBridgeRuntimeContext() {
  return {
    helperConfig,
    withHelperCacheBuster,
    getPendingHelperBridgeIntent,
    locationOrigin: window.location.origin,
    getCurrentSessionToken: () => getCurrentSessionToken(),
    encodeHelperBridgePayload,
    helperBridgeModal,
    helperBridgeIframe,
    helperBridgeModalTitle,
    helperBridgeModalMessage,
    helperBridgeModalHint,
    helperBridgeHiddenFrame,
    getHelperBridgeSurfaceState,
    setHelperBridgeSurfaceState,
    getHelperBridgeBackgroundState,
    setHelperBridgeBackgroundState,
    windowSetTimeout: (fn, delay) => window.setTimeout(fn, delay),
    windowClearTimeout: (id) => window.clearTimeout(id),
    setHelperInventoryMessage,
    setHelperSnapshotMessage,
    setHelperGameFeatureMessage,
  };
}

function getHelperPopupActionContext() {
  return {
    getCurrentProfile,
    navigateToLoginEntry,
    isHelperLineupEnabled,
    getHelperLineupDisabledReason,
    getActiveHelperBinding,
    getCurrentHelperSnapshots,
    runHelperBridgeInBackground,
    buildHelperBridgeSnapshotUrl,
    buildHelperBridgeTeamSwitchUrl,
    buildHelperBridgeTeamPreviewUrl,
    buildHelperBridgeTeamRestoreUrl,
    buildHelperBridgeGameFeatureUrl,
    setHelperSnapshotMessage,
    setHelperSwitchMessage,
    setHelperPreviewMessage,
    setHelperGameFeatureMessage,
    isHelperSnapshotEnabled,
    isHelperTeamSwitchEnabled,
    isHelperTeamRestoreEnabled,
    isHelperGameFeaturesEnabled,
    hasHelperCapability,
    getHelperConfig,
    alertMessage: (text) => window.alert(text),
    confirmAction: (text) => window.confirm(text),
    setPendingHelperPreviewSnapshotId,
    getSnapshotSafeRestoreBlockReason,
    buildHelperRestorePlanFromSnapshot,
    setHelperRestoreProgress,
    buildHelperSnapshotName,
  };
}

function getAppStartupContext() {
  return createAppStartupContext({
    applyPageMode,
    hydrateSessionProfile,
    shouldDeferAccountBootstrap,
    scheduleDeferredAccountBootstrap,
    activateAuthTab,
    activeAuthTab,
    activateAccountTab,
    activeAccountTab,
    syncAccountTabWithHash,
    syncDockWithViewport,
    getPageModeConfig,
    setActiveGuidePage,
    renderBeginnerGuide,
    renderRecentSales,
    loadProducts,
    setNotice,
    loadRecentSales,
    helperOriginInput,
    getHelperOrigin,
    loadHelperConfig,
    renderHelperBindingPanel,
    renderHelperInventoryPanel,
    renderHelperSnapshotPanel,
    renderHelperRestorePreviewPanel,
    loadAuctions,
    loadAccount,
  });
}

function getPageNavigationRuntimeContext() {
  return {
    currentPageMode,
    setLocationHash: (hash) => {
      window.location.hash = hash;
    },
    setLocationHref: (href) => {
      window.location.href = href;
    },
    pageDockItems,
    setActiveDockTargetValue: (value) => {
      activeDockTarget = value || "products";
    },
    getActiveDockTargetValue: () => activeDockTarget,
    getHeaderHeight: () => document.querySelector(".app-header")?.offsetHeight || 0,
    getScrollY: () => window.scrollY,
    getInnerHeight: () => window.innerHeight,
    scrollTo: (options) => window.scrollTo(options),
    getElementById: (target) => document.getElementById(target),
    productsSection,
    discountProductsSection,
    accountSection,
    helperLabSection,
    auctionZoneSection,
    drawServiceZoneSection,
    discountDockButton,
    activateAccountTab: (tab) => activateAccountTab(tab),
  };
}

function getPageInteractionBindingsContext() {
  return {
    reloadProductsButton: document.getElementById("reload-products-btn"),
    handleReloadProducts: () => {
      loadProducts().catch((error) => setNotice(`商品刷新失败：${error.message}`, "error"));
    },
    globalLogoutButton: document.getElementById("logout-btn"),
    accountLogoutBtn,
    accountSwitchLink,
    accountProfileForm,
    accountPasswordForm,
    orderList,
    handleAccountLogoutClick: () =>
      handleAccountLogoutClickRuntime(getAccountInteractionRuntimeContext()),
    handleAccountSwitchClick: (event) =>
      handleAccountSwitchClickRuntime(getAccountInteractionRuntimeContext(), event),
    handleAccountProfileSubmit: (event) =>
      handleAccountProfileSubmitRuntime(getAccountInteractionRuntimeContext(), event),
    handleAccountPasswordSubmit: (event) =>
      handleAccountPasswordSubmitRuntime(getAccountInteractionRuntimeContext(), event),
    handleOrderListClick: (event) =>
      handleOrderListClickRuntime(getAccountInteractionRuntimeContext(), event),
    keywordInput,
    sortSelect,
    productCategoryTabs,
    productSubcategoryTabs,
    productDetailTabs,
    productFullnessTabs,
    discountKeywordInput,
    discountSortSelect,
    discountCategoryTabs,
    discountSubcategoryTabs,
    discountDetailTabs,
    discountFullnessTabs,
    productGrid,
    discountProductGrid,
    productPagination,
    discountProductPagination,
    closeProductDetailButton: document.getElementById("close-product-detail-btn"),
    handleProductKeywordInput: () => handleProductKeywordInputRuntime(getProductListRuntimeContext()),
    handleProductSortChange: () => handleProductSortChangeRuntime(getProductListRuntimeContext()),
    handleProductCategoryClick: (event) =>
      handleProductCategoryClickRuntime(getProductListRuntimeContext(), event),
    handleProductSubcategoryClick: (event) =>
      handleProductSubcategoryClickRuntime(getProductListRuntimeContext(), event),
    handleProductDetailClick: (event) =>
      handleProductDetailClickRuntime(getProductListRuntimeContext(), event),
    handleProductFullnessClick: (event) =>
      handleProductFullnessClickRuntime(getProductListRuntimeContext(), event),
    handleDiscountKeywordInput: () =>
      handleDiscountKeywordInputRuntime(getProductListRuntimeContext()),
    handleDiscountSortChange: () =>
      handleDiscountSortChangeRuntime(getProductListRuntimeContext()),
    handleDiscountCategoryClick: (event) =>
      handleDiscountCategoryClickRuntime(getProductListRuntimeContext(), event),
    handleDiscountSubcategoryClick: (event) =>
      handleDiscountSubcategoryClickRuntime(getProductListRuntimeContext(), event),
    handleDiscountDetailClick: (event) =>
      handleDiscountDetailClickRuntime(getProductListRuntimeContext(), event),
    handleDiscountFullnessClick: (event) =>
      handleDiscountFullnessClickRuntime(getProductListRuntimeContext(), event),
    handleProductGridClick: (event) =>
      handleProductGridClickRuntime(getProductModalRuntimeContext(), event),
    handleProductPaginationClick: (event) =>
      handleProductPaginationClickRuntime(getProductListRuntimeContext(), event),
    handleDiscountPaginationClick: (event) =>
      handleDiscountPaginationClickRuntime(getProductListRuntimeContext(), event),
    closeProductModal,
    auctionStatusTabs,
    auctionBody,
    handleAuctionStatusTabsClick: (event) =>
      handleAuctionStatusTabsClickRuntime(getAuctionInteractionRuntimeContext(), event),
    handleAuctionBodyClick: (event) =>
      handleAuctionBodyClickRuntime(getAuctionInteractionRuntimeContext(), event),
    handleAuctionBodyInput: (event) =>
      handleAuctionBodyInputRuntime(getAuctionInteractionRuntimeContext(), event),
    drawServiceBody,
    handleDrawServiceBodyClick: (event) =>
      handleDrawServiceBodyClickRuntime(getDrawServiceRuntimeContext(), event),
    handleDrawServiceBodyInput: (event) =>
      handleDrawServiceBodyInputRuntime(getDrawServiceRuntimeContext(), event),
    handleDrawServiceBodySubmit: (event) =>
      handleDrawServiceBodySubmitRuntime(getDrawServiceRuntimeContext(), event),
    rechargeBody,
    handleRechargePanelClick: (event) =>
      handleRechargePanelClickRuntime(getRechargeInteractionRuntimeContext(), event),
    handleRechargePanelInput: (event) =>
      handleRechargePanelInputRuntime(getRechargeInteractionRuntimeContext(), event),
    handleRechargePanelSubmit: (event) =>
      handleRechargePanelSubmitRuntime(getRechargeInteractionRuntimeContext(), event),
  };
}

function getHelperShellBindingsContext() {
  return {
    saveHelperOriginButton: document.getElementById("save-helper-origin-btn"),
    openHelperButton: document.getElementById("open-helper-btn"),
    getHelperOriginInputValue: () => helperOriginInput.value,
    setHelperOrigin,
    setNotice,
    openHelper,
    helperOpenBindPopupBtn,
    helperOpenAuthPopupBtn,
    openHelperBindPopup,
    openHelperAuthPopup,
    helperSaveBindBtn,
    helperClearBindBtn,
    savePendingHelperBinding,
    clearPendingHelperSelection,
    helperSyncCurrentInventoryBtn,
    helperSyncAllInventoryBtn,
    syncCurrentHelperInventory,
    syncAllHelperInventories,
    helperBuyPermanentSlotBtn,
    helperBuySeasonalSlotBtn,
    purchaseHelperSlot,
    helperReadSnapshotBtn,
    openHelperSnapshotPopup,
    helperClearPreviewBtn,
    clearHelperRestorePreview,
    helperTeamSwitchControls,
    openHelperTeamSwitchPopup,
    helperBindCurrent,
    setActiveHelperBinding,
    setHelperBindMessage,
    removeHelperBinding,
    helperInventoryBindings,
    helperInventoryMerged,
    helperGameFeatureList,
    openHelperGameFeaturePopup,
    toggleHelperInventoryExpanded: (expanded) => {
      helperInventoryExpanded = Boolean(expanded);
      renderHelperInventoryPanel();
    },
    applyHelperInventoryFilter,
    changeHelperInventoryPage,
    submitConsignmentListing,
    withdrawConsignmentListing,
    submitEscrowDelivery,
    getHelperInventoryPage: () => currentHelperInventoryPage,
    getHelperInventoryQuery,
    getCurrentHelperInventoryItems: () => currentHelperMergedItems,
    findHelperBinding: (bindingId) =>
      (currentHelperBindings || []).find((item) => Number(item?.id || 0) === Number(bindingId || 0)),
    getCurrentProfile,
    getCurrentHelperInventories,
    setHelperInventoryMessage,
    getHelperLineupPlan,
    getHelperInventoryImportState,
    setHelperInventoryImportState,
    importHelperInventoryProducts,
    loadProducts,
    loadHelperInventories,
    apiFetch,
    pickErrorMessage,
    renderHelperInventoryPanel,
    navigateToLoginEntry,
    startHelperInventorySync,
    helperBridgeHiddenFrame,
    getHelperBridgeHiddenFrameSrc: () => helperBridgeHiddenFrame?.getAttribute("src") || "",
    setDebugLine,
    helperSnapshotCurrent,
    helperSnapshotList,
    toggleArchivedHelperSnapshots: () => {
      showArchivedHelperSnapshots = !showArchivedHelperSnapshots;
      renderHelperSnapshotPanel();
    },
    toggleExpandedHelperSnapshot: (snapshotId) => {
      const numericSnapshotId = Number(snapshotId || 0);
      if (!numericSnapshotId) return;
      if (expandedHelperSnapshotIds.has(numericSnapshotId)) {
        expandedHelperSnapshotIds.delete(numericSnapshotId);
      } else {
        expandedHelperSnapshotIds.add(numericSnapshotId);
      }
      renderHelperSnapshotPanel();
    },
    openHelperRestorePopup,
    openHelperPreviewPopup,
    renameHelperSnapshot,
    togglePinHelperSnapshot,
    removeHelperSnapshot,
    closeHelperBridgeModalBtn,
    closeHelperBridgeModal,
    helperBridgeModal,
  };
}

function promptForSnapshotName(currentName) {
  return window.prompt("给这套阵容起个名字", currentName);
}

function setLocationHash(hash) {
  window.location.hash = hash;
}

function rememberHelperBridgeIntent(intent) {
  pendingHelperBridgeIntent = String(intent || "").trim();
  saveHelperBridgeIntent(pendingHelperBridgeIntent);
}

function getPreferredHelperBindingStorageKey() {
  const accountId = String(currentProfile?.id || currentProfile?.game_role_id || "guest").trim() || "guest";
  return `gongfa_helper_active_binding_v1:${accountId}`;
}

function loadPreferredHelperBindingId() {
  try {
    const stored = window.localStorage.getItem(getPreferredHelperBindingStorageKey());
    const value = Number(stored || 0);
    return Number.isInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function savePreferredHelperBindingId(bindingId) {
  const numericId = Number(bindingId || 0);
  try {
    if (numericId > 0) {
      window.localStorage.setItem(getPreferredHelperBindingStorageKey(), String(numericId));
    } else {
      window.localStorage.removeItem(getPreferredHelperBindingStorageKey());
    }
  } catch {
    // Ignore storage failures.
  }
}

function getActiveHelperBinding() {
  const bindings = Array.isArray(currentHelperBindings) ? currentHelperBindings : [];
  if (!bindings.length) return null;
  const preferredId = loadPreferredHelperBindingId();
  const preferredBinding = bindings.find((item) => Number(item?.id || 0) === preferredId);
  if (preferredBinding) return preferredBinding;
  return bindings[0] || null;
}

function syncActiveHelperBindingPreference() {
  const bindings = Array.isArray(currentHelperBindings) ? currentHelperBindings : [];
  if (!bindings.length) {
    savePreferredHelperBindingId(0);
    return null;
  }
  const activeBinding = getActiveHelperBinding();
  if (activeBinding?.id) {
    savePreferredHelperBindingId(activeBinding.id);
  }
  return activeBinding;
}

function setActiveHelperBinding(bindingId) {
  const numericId = Number(bindingId || 0);
  if (!numericId) return;
  savePreferredHelperBindingId(numericId);
  renderHelperBindingPanel();
  renderHelperGameFeaturesPanel();
  renderHelperTeamSwitchPanel();
}

function deleteExpandedHelperSnapshotId(snapshotId) {
  expandedHelperSnapshotIds.delete(Number(snapshotId || 0));
}

function clearPendingHelperBridgeIntent() {
  pendingHelperBridgeIntent = "";
  clearHelperBridgeIntent();
}

function getPendingHelperBridgeIntent() {
  const storedIntent = String(pendingHelperBridgeIntent || "").trim();
  if (storedIntent) return storedIntent;
  return currentProfile ? HELPER_BRIDGE_INTENT_BIND : HELPER_BRIDGE_INTENT_AUTH;
}

function setHelperAuthMessage(text, type = "") {
  if (!helperAuthMessage) return;
  helperAuthMessage.textContent = text || "";
  helperAuthMessage.className = text ? (type ? `notice ${type}` : "notice") : "notice hidden";
}

function setHelperBindMessage(text, type = "") {
  if (!helperBindMessage) return;
  helperBindMessage.textContent = text || "";
  helperBindMessage.className = text ? (type ? `notice ${type}` : "notice") : "notice hidden";
}

function setHelperSnapshotMessage(text, type = "") {
  if (!helperSnapshotMessage) return;
  helperSnapshotMessage.textContent = text || "";
  helperSnapshotMessage.className = text ? (type ? `notice ${type}` : "notice") : "notice hidden";
}

function setHelperSlotMessage(text, type = "") {
  if (!helperSlotMessage) return;
  helperSlotMessage.textContent = text || "";
  helperSlotMessage.className = text ? (type ? `notice ${type}` : "notice") : "notice hidden";
}

function setHelperPreviewMessage(text, type = "") {
  if (!helperPreviewMessage) return;
  helperPreviewMessage.textContent = text || "";
  helperPreviewMessage.className = text ? (type ? `notice ${type}` : "notice") : "notice hidden";
}

function setHelperSwitchMessage(text, type = "") {
  if (!helperTeamSwitchMessage) return;
  helperTeamSwitchMessage.textContent = text || "";
  helperTeamSwitchMessage.className = text ? (type ? `notice ${type}` : "notice") : "notice hidden";
}

function setHelperGameFeatureMessage(text, type = "") {
  if (!helperGameFeatureMessage) return;
  helperGameFeatureMessage.textContent = text || "";
  helperGameFeatureMessage.className = text ? (type ? `notice ${type}` : "notice") : "notice hidden";
}

function setHelperRestoreProgress(progress) {
  currentHelperRestoreProgress = progress && typeof progress === "object" ? { ...progress } : null;
  renderHelperRestoreProgressPanel();
}

function renderHelperRestoreProgressPanel() {
  return renderHelperRestoreProgressPanelView(getHelperRendererContext());
}

function withHelperCacheBuster(rawUrl, extraSearch = {}) {
  try {
    const url = new URL(rawUrl, window.location.origin);
    url.searchParams.set("v", HELPER_CACHE_BUSTER);
    Object.entries(extraSearch || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
    return url.toString();
  } catch {
    return String(rawUrl || "");
  }
}

function renderHelperAuthEntry() {
  return renderHelperAuthEntryView(getHelperRendererContext());
}

function renderHelperBindingPanel() {
  return renderHelperBindingPanelView(getHelperRendererContext());
}

function isHelperInventoryEnabled() {
  return isHelperLineupEnabled() && Boolean(helperConfig?.features?.legacy_inventory);
}

function setHelperInventoryMessage(text, type = "") {
  if (!helperInventoryMessage) return;
  helperInventoryMessage.textContent = text || "";
  helperInventoryMessage.className = `notice${type ? ` ${type}` : ""}${text ? "" : " hidden"}`;
}

function getHelperInventoryBinding(bindingId) {
  return (currentHelperInventories || []).find(
    (item) => Number(item?.binding_id || 0) === Number(bindingId || 0)
  );
}

function getHelperInventoryImageUrl(item) {
  const rawUrl = String(item?.image_url || "").trim();
  if (!rawUrl) return "";
  if (/^(https?:)?\/\//i.test(rawUrl) || rawUrl.startsWith("/")) return rawUrl;
  return `/${rawUrl.replace(/^\/+/, "")}`;
}

function renderHelperInventoryPanel() {
  return renderHelperInventoryPanelView(getHelperRendererContext());
}

function renderHelperGameFeaturesPanel() {
  return renderHelperGameFeaturesPanelView(getHelperRendererContext());
}

function buildHelperSnapshotName(snapshot) {
  return buildHelperSnapshotNameView(snapshot);
}

function formatHelperBattleSlot(slot) {
  return formatHelperBattleSlotView(slot);
}

function sortHelperSnapshotsList(list) {
  return sortHelperSnapshotsListView(list);
}

function getHelperLineupPlan() {
  return {
    base_slots: Math.max(Number(helperConfig?.plans?.base_slots || 3) || 3, 1),
    permanent_slot_quota: Math.max(Number(helperConfig?.plans?.permanent_slot_quota || 5000) || 5000, 1),
    permanent_slot_max: Math.max(Number(helperConfig?.plans?.permanent_slot_max || 7) || 7, 0),
    seasonal_slot_quota: Math.max(Number(helperConfig?.plans?.seasonal_slot_quota || 1000) || 1000, 1),
    member_bonus_slots: Math.max(Number(helperConfig?.plans?.member_bonus_slots || 3) || 3, 0),
    season_label: String(helperConfig?.plans?.season_label || "当前赛季").trim() || "当前赛季",
    season_expires_at: helperConfig?.plans?.season_expires_at || null,
  };
}

function renderHelperSnapshotPanel() {
  return renderHelperSnapshotPanelView(getHelperRendererContext());
}

function renderHelperRestorePreviewPanel() {
  return renderHelperRestorePreviewPanelView(getHelperRendererContext());
}

function renderHelperTeamSwitchPanel() {
  return renderHelperTeamSwitchPanelView(getHelperRendererContext());
}

async function loadHelperBindings() {
  return loadHelperBindingsData({
    getCurrentProfile: () => currentProfile,
    isHelperLineupEnabled,
    isHelperScanBindEnabled,
    setCurrentHelperBindings,
    syncActiveHelperBindingPreference,
    renderHelperBindingPanel,
    renderHelperInventoryPanel,
    renderHelperTeamSwitchPanel,
    apiFetch,
    setHelperBindMessage,
    pickErrorMessage,
  });
}

async function loadHelperInventories() {
  return loadHelperInventoriesData({
    getCurrentProfile: () => currentProfile,
    isHelperInventoryEnabled,
    setCurrentHelperInventories,
    setCurrentHelperMergedItems,
    setCurrentHelperInventorySummary,
    setCurrentHelperInventoryPage,
    getHelperInventoryQuery,
    setCurrentConsignmentListings,
    renderHelperInventoryPanel,
    apiFetch,
    setHelperInventoryMessage,
    pickErrorMessage,
  });
}

async function loadHelperSnapshots() {
  return loadHelperSnapshotsData({
    getCurrentProfile: () => currentProfile,
    isHelperLineupEnabled,
    isHelperSnapshotEnabled,
    setCurrentHelperSnapshots,
    getCurrentHelperSnapshots,
    renderHelperSnapshotPanel,
    getCurrentHelperRestorePreview,
    setCurrentHelperRestorePreview,
    renderHelperRestorePreviewPanel,
    renderHelperTeamSwitchPanel,
    apiFetch,
    setHelperSnapshotMessage,
    pickErrorMessage,
  });
}

function resetHelperInventorySyncState() {
  clearHelperInventorySyncItemTimeout();
  helperInventorySyncState = {
    running: false,
    mode: "",
    queue: [],
    total: 0,
    completed: 0,
    failures: [],
    currentBindingId: null,
    currentRequestId: "",
    currentRoleName: "",
    itemTimeoutId: null,
    pendingInventories: [],
    batchSaving: false,
  };
}

function clearHelperInventorySyncItemTimeout() {
  if (helperInventorySyncState?.itemTimeoutId) {
    window.clearTimeout(helperInventorySyncState.itemTimeoutId);
  }
  helperInventorySyncState = {
    ...helperInventorySyncState,
    itemTimeoutId: null,
  };
}

function isCurrentHelperInventoryBridgeRequest(requestId) {
  const normalized = String(requestId || "").trim();
  if (!normalized) return true;
  return String(helperInventorySyncState?.currentRequestId || "").trim() === normalized;
}

function isCurrentHelperInventoryBridgePayload(payload = {}) {
  if (!helperInventorySyncState.running) return true;
  const requestId = String(payload?.bridge_request_id || "").trim();
  const currentRequestId = String(helperInventorySyncState?.currentRequestId || "").trim();
  if (requestId && currentRequestId) {
    return requestId === currentRequestId;
  }
  const payloadBindingId = Number(payload?.binding_id || 0);
  const currentBindingId = Number(helperInventorySyncState?.currentBindingId || 0);
  return !payloadBindingId || !currentBindingId || payloadBindingId === currentBindingId;
}

function failCurrentHelperInventorySyncByTimeout(requestId) {
  if (!helperInventorySyncState.running || !isCurrentHelperInventoryBridgeRequest(requestId)) return;
  const currentBindingId = Number(helperInventorySyncState.currentBindingId || 0);
  const roleName = String(helperInventorySyncState.currentRoleName || "").trim() || "未命名角色";
  clearHelperBridgeBackgroundFrame();
  closeHelperBridgeModal();
  helperInventorySyncState.failures = [
    ...(Array.isArray(helperInventorySyncState.failures) ? helperInventorySyncState.failures : []),
    {
      binding_id: currentBindingId,
      role_name: roleName,
      message: "同步超过 120 秒没有返回，已自动跳过这个炉子。",
    },
  ];
  helperInventorySyncState.currentBindingId = null;
  helperInventorySyncState.currentRequestId = "";
  helperInventorySyncState.currentRoleName = "";
  helperInventorySyncState.itemTimeoutId = null;
  setHelperInventoryMessage(`同步 ${roleName} 超时，已跳过并继续处理后续炉子。`, "error");
  renderHelperInventoryPanel();
  startNextHelperInventorySyncInQueue();
}

function shouldDeferHelperInventoryBatchSave() {
  return helperInventorySyncState.running === true && helperInventorySyncState.mode === "all";
}

function queueHelperInventoryBatchPayload(payload) {
  const nextState = { ...helperInventorySyncState };
  nextState.pendingInventories = [
    ...(Array.isArray(nextState.pendingInventories) ? nextState.pendingInventories : []),
    {
      binding_id:
        payload?.binding_id === undefined || payload?.binding_id === null
          ? null
          : Number(payload.binding_id),
      source_type: "helper_bridge",
      summary: payload?.summary || {},
      items: Array.isArray(payload?.items) ? payload.items : [],
    },
  ];
  setHelperInventorySyncState(nextState);
  return {
    deferred: true,
    summary: payload?.summary || {},
    items: Array.isArray(payload?.items) ? payload.items : [],
    binding: findHelperBindingById(payload?.binding_id),
  };
}

async function flushHelperInventoryBatchSave() {
  const pendingInventories = Array.isArray(helperInventorySyncState.pendingInventories)
    ? helperInventorySyncState.pendingInventories
    : [];
  if (!pendingInventories.length) return null;
  helperInventorySyncState.batchSaving = true;
  renderHelperInventoryPanel();
  const result = await apiFetch("/helper/inventories/batch", {
    method: "POST",
    body: JSON.stringify({ inventories: pendingInventories }),
  });
  helperInventorySyncState.pendingInventories = [];
  helperInventorySyncState.batchSaving = false;
  await loadHelperInventories();
  return result;
}

function startNextHelperInventorySyncInQueue() {
  const nextBinding = helperInventorySyncState.queue.shift() || null;
  if (!nextBinding) {
    const finishSync = () => {
      const failureCount = helperInventorySyncState.failures.length;
      const total = helperInventorySyncState.total || 0;
      const completed = helperInventorySyncState.completed || 0;
      const failureSummary = failureCount
        ? `，其中 ${failureCount} 个炉子失败：${helperInventorySyncState.failures
            .map((item) => item?.role_name || "未命名角色")
            .join("、")}`
        : "";
      setHelperInventoryMessage(`功法仓库同步完成，成功 ${completed}/${total}${failureSummary}。`, failureCount ? "error" : "success");
      resetHelperInventorySyncState();
      renderHelperInventoryPanel();
    };
    if ((helperInventorySyncState.pendingInventories || []).length) {
      setHelperInventoryMessage("正在批量写入功法仓库...", "success");
      flushHelperInventoryBatchSave()
        .then(finishSync)
        .catch((error) => {
          setHelperInventoryMessage(`批量保存功法仓库失败：${pickErrorMessage(error, "保存失败")}`, "error");
          resetHelperInventorySyncState();
          renderHelperInventoryPanel();
        });
      return;
    }
    finishSync();
    return;
  }

  helperInventorySyncState.currentBindingId = Number(nextBinding?.id || 0);
  helperInventorySyncState.currentRequestId = `legacy-inventory-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  helperInventorySyncState.currentRoleName =
    normalizeHelperDisplayRoleName(nextBinding?.game_role_name, nextBinding?.game_role_id) || "该角色";
  clearHelperInventorySyncItemTimeout();
  const requestId = helperInventorySyncState.currentRequestId;
  helperInventorySyncState.itemTimeoutId = window.setTimeout(
    () => failCurrentHelperInventorySyncByTimeout(requestId),
    120000
  );
  renderHelperInventoryPanel();
  const opened = runHelperBridgeInBackground(
    buildHelperBridgeLegacyInventoryUrl(nextBinding, helperInventorySyncState.currentRequestId),
    "legacyInventory"
  );
  if (!opened) {
    clearHelperInventorySyncItemTimeout();
    helperInventorySyncState.failures.push({
      binding_id: Number(nextBinding?.id || 0),
      role_name: normalizeHelperDisplayRoleName(nextBinding?.game_role_name, nextBinding?.game_role_id),
      message: "当前页面暂时无法启动功法同步",
    });
    helperInventorySyncState.currentBindingId = null;
    helperInventorySyncState.currentRequestId = "";
    helperInventorySyncState.currentRoleName = "";
    startNextHelperInventorySyncInQueue();
    return;
  }
  setHelperInventoryMessage(
    `正在同步 ${helperInventorySyncState.currentRoleName} 的功法库存（${helperInventorySyncState.completed + 1}/${helperInventorySyncState.total}）...`,
    "success"
  );
}

function startHelperInventorySync(bindings, mode = "current") {
  return startHelperInventorySyncAction(
    {
      getCurrentProfile,
      setHelperInventoryMessage,
      navigateToLoginEntry,
      isHelperInventoryEnabled,
      getHelperLineupDisabledReason,
      getHelperInventorySyncState,
      setHelperInventorySyncState,
      renderHelperInventoryPanel,
      startNextHelperInventorySyncInQueue,
    },
    bindings,
    mode
  );
}

function syncCurrentHelperInventory() {
  return syncCurrentHelperInventoryAction({
    getActiveHelperBinding,
    setHelperInventoryMessage,
    startHelperInventorySync: (bindings, mode) => startHelperInventorySync(bindings, mode),
  });
}

function syncAllHelperInventories() {
  return syncAllHelperInventoriesAction({
    getCurrentHelperBindings,
    startHelperInventorySync: (bindings, mode) => startHelperInventorySync(bindings, mode),
  });
}

function importHelperInventoryProducts() {
  return importHelperInventoryProductsAction({
    getCurrentProfile,
    navigateToLoginEntry,
    getCurrentHelperInventories,
    getHelperLineupPlan,
    getHelperInventoryImportState,
    setHelperInventoryImportState,
    renderHelperInventoryPanel,
    setHelperInventoryMessage,
    confirmAction: (text) => window.confirm(text),
    apiFetch,
    pickErrorMessage,
    loadProducts,
    loadHelperInventories,
  });
}

function applyHelperInventoryFilter({ keyword, bindingId } = {}) {
  updateHelperInventoryQuery({
    page: 1,
    keyword: keyword === undefined ? helperInventoryQuery.keyword : String(keyword || "").trim(),
    bindingId: bindingId === undefined ? helperInventoryQuery.bindingId : String(bindingId || "").trim(),
  });
  return loadHelperInventories();
}

function changeHelperInventoryPage(page) {
  updateHelperInventoryQuery({ page: Math.max(Number(page) || 1, 1) });
  return loadHelperInventories();
}

function openConsignmentListingForm() {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <div class="eyebrow">玩家寄售</div>
            <h3>上架寄售</h3>
            <p>从 1 小时内同步的背包卡发起，提交后自动进入商城；人民币价格必填，额度和残卷可留空自动换算。</p>
          </div>
          <button class="ghost" type="button" data-consignment-form-cancel="1">关闭</button>
        </div>
        <form class="form-grid" data-consignment-form="1">
          <label>人民币价格
            <input name="price_yuan" type="number" min="0.01" step="0.01" placeholder="例如 420" required />
          </label>
          <div class="stack-item">
            <strong>接受支付方式</strong>
            <div class="preset-list">
              <label class="preset-chip active"><input name="method" type="checkbox" value="cash" checked /> 人民币</label>
              <label class="preset-chip active"><input name="method" type="checkbox" value="quota" checked /> 额度</label>
              <label class="preset-chip active"><input name="method" type="checkbox" value="residual" checked /> 残卷</label>
            </div>
          </div>
          <label>额度价格（可选）
            <input name="quota_price" type="number" min="1" step="1" placeholder="留空自动换算" />
          </label>
          <label>残卷价格（可选）
            <input name="residual_price" type="number" min="1" step="1" placeholder="留空自动换算" />
          </label>
          <label>备注（可选）
            <textarea name="seller_remark" rows="3" placeholder="例如发货时间、联系方式、特殊说明"></textarea>
          </label>
          <div class="actions">
            <button class="ghost" type="button" data-consignment-form-cancel="1">取消</button>
            <button class="primary" type="submit">提交并上架</button>
          </div>
        </form>
      </div>
    `;
    const cleanup = (value) => {
      backdrop.remove();
      resolve(value);
    };
    backdrop.querySelectorAll('[data-consignment-form-cancel="1"]').forEach((button) => {
      button.addEventListener("click", () => cleanup(null));
    });
    backdrop.querySelectorAll('input[name="method"]').forEach((input) => {
      input.addEventListener("change", () => {
        input.closest(".preset-chip")?.classList.toggle("active", input.checked);
      });
    });
    backdrop.querySelector('[data-consignment-form="1"]')?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const methods = Array.from(form.querySelectorAll('input[name="method"]:checked')).map((input) => input.value);
      cleanup({
        priceText: form.querySelector('[name="price_yuan"]')?.value || "",
        acceptedMethods: methods,
        quotaPriceText: form.querySelector('[name="quota_price"]')?.value || "",
        residualPriceText: form.querySelector('[name="residual_price"]')?.value || "",
        sellerRemark: form.querySelector('[name="seller_remark"]')?.value || "",
      });
    });
    document.body.appendChild(backdrop);
    backdrop.querySelector('[name="price_yuan"]')?.focus();
  });
}

async function submitConsignmentListing(item) {
  if (!item) return;
  if (!String(currentProfile?.contact_info || "").trim()) {
    setHelperInventoryMessage("上架寄售前请先到个人后台资料里填写微信或联系方式，方便买家遇到问题时联系。", "error");
    if (window.confirm("上架寄售需要先填写微信或联系方式。现在去个人后台资料页补充吗？")) {
      window.location.href = "me.html#profile-panel";
    }
    return;
  }
  const formResult = await openConsignmentListingForm();
  if (!formResult) return;
  const { priceText, acceptedMethods, quotaPriceText, residualPriceText, sellerRemark } = formResult;
  const normalizedPriceText = String(priceText || "").trim();
  const priceYuan = Number(normalizedPriceText);
  if (!Number.isFinite(priceYuan) || priceYuan <= 0 || !/^\d+(?:\.\d{1,2})?$/.test(normalizedPriceText)) {
    setHelperInventoryMessage("寄售价格需要是大于 0 的人民币金额，最多两位小数。", "error");
    return;
  }
  if (!acceptedMethods.length) {
    setHelperInventoryMessage("至少选择一种收款方式。", "error");
    return;
  }
  const quotaPrice = String(quotaPriceText || "").trim() ? Number(quotaPriceText) : null;
  const residualPrice = String(residualPriceText || "").trim() ? Number(residualPriceText) : null;
  if (quotaPrice !== null && (!Number.isInteger(quotaPrice) || quotaPrice <= 0)) {
    setHelperInventoryMessage("额度价格必须是大于 0 的整数，或留空自动换算。", "error");
    return;
  }
  if (residualPrice !== null && (!Number.isInteger(residualPrice) || residualPrice <= 0)) {
    setHelperInventoryMessage("残卷价格必须是大于 0 的整数，或留空自动换算。", "error");
    return;
  }
  try {
    await apiFetch("/helper/consignments", {
      method: "POST",
      body: JSON.stringify({
        inventory_id: Number(item.inventory_id || 0),
        binding_id: item.binding_id ?? null,
        item_key: String(item.item_key || "").trim(),
        price_yuan: Math.round(priceYuan * 100) / 100,
        accepted_payment_methods: acceptedMethods,
        quota_price: quotaPrice || undefined,
        residual_price: residualPrice || undefined,
        auto_price_methods: [
          quotaPrice === null && acceptedMethods.includes("quota") ? "quota" : "",
          residualPrice === null && acceptedMethods.includes("residual") ? "residual" : "",
        ].filter(Boolean),
        seller_remark: sellerRemark,
      }),
    });
    setHelperInventoryMessage("寄售已提交并自动上架到商城。", "success");
    await loadHelperInventories();
  } catch (error) {
    setHelperInventoryMessage(`提交寄售失败：${pickErrorMessage(error, "提交失败")}`, "error");
  }
}

async function withdrawConsignmentListing(listingId) {
  if (!window.confirm("确定撤回这个寄售申请吗？")) return;
  try {
    await apiFetch(`/helper/consignments/${listingId}/withdraw`, { method: "PATCH" });
    setHelperInventoryMessage("寄售申请已撤回。", "success");
    await loadHelperInventories();
  } catch (error) {
    setHelperInventoryMessage(`撤回失败：${pickErrorMessage(error, "撤回失败")}`, "error");
  }
}

async function loadHelperActionLogs() {
  return loadHelperActionLogsData({
    getCurrentProfile: () => currentProfile,
    isHelperLineupEnabled,
    isHelperActionLogsEnabled,
    setCurrentHelperActionLogs,
    renderHelperTeamSwitchPanel,
    renderHelperRestoreResultPanel,
    apiFetch,
    setHelperSwitchMessage,
    pickErrorMessage,
  });
}

function buildHelperBridgeBindUrl() {
  return buildHelperBridgeBindUrlRuntime(getHelperBridgeRuntimeContext());
}

function getCurrentSessionToken() {
  const session = loadSession();
  return String(session?.token || "").trim();
}

function buildHelperBridgeSnapshotUrl(binding) {
  return buildHelperBridgeSnapshotUrlRuntime(getHelperBridgeRuntimeContext(), binding);
}

function buildHelperBridgeLegacyInventoryUrl(binding) {
  return buildHelperBridgeLegacyInventoryUrlRuntime(getHelperBridgeRuntimeContext(), binding);
}

function buildHelperBridgeGameFeatureUrl(binding, feature) {
  return buildHelperBridgeGameFeatureUrlRuntime(getHelperBridgeRuntimeContext(), binding, feature);
}

function buildHelperBridgeTeamSwitchUrl(binding, teamId) {
  return buildHelperBridgeTeamSwitchUrlRuntime(getHelperBridgeRuntimeContext(), binding, teamId);
}

function buildHelperBridgeTeamPreviewUrl(binding, snapshotId) {
  return buildHelperBridgeTeamPreviewUrlRuntime(getHelperBridgeRuntimeContext(), binding, snapshotId);
}

function buildHelperBridgeTeamRestoreUrl(binding, snapshotId, restorePlan) {
  return buildHelperBridgeTeamRestoreUrlRuntime(
    getHelperBridgeRuntimeContext(),
    binding,
    snapshotId,
    restorePlan
  );
}

function closeHelperBridgeModal() {
  return closeHelperBridgeModalRuntime(getHelperBridgeRuntimeContext());
}

function clearHelperBridgeBackgroundFrame() {
  return clearHelperBridgeBackgroundFrameRuntime(getHelperBridgeRuntimeContext());
}

function openHelperBridgeModalSurface(url, options = {}) {
  return openHelperBridgeModalSurfaceRuntime(getHelperBridgeRuntimeContext(), url, options);
}

function runHelperBridgeInBackground(url, mode = "") {
  return runHelperBridgeInBackgroundRuntime(getHelperBridgeRuntimeContext(), url, mode);
}

function openHelperBindPopup() {
  return openHelperBindPopupAction({
    getCurrentProfile,
    setHelperBindMessage,
    navigateToLoginEntry,
    isHelperLineupEnabled,
    isHelperScanBindEnabled,
    getHelperLineupDisabledReason,
    rememberHelperBridgeIntent,
    HELPER_BRIDGE_INTENT_BIND,
    openHelperBridgeModalSurface,
    buildHelperBridgeBindUrl,
  });
}

function openHelperAuthPopup() {
  return openHelperAuthPopupAction({
    loadHelperConfig,
    isHelperScanAuthEnabled,
    setHelperAuthMessage,
    rememberHelperBridgeIntent,
    HELPER_BRIDGE_INTENT_AUTH,
    openHelperBridgeModalSurface,
    buildHelperBridgeBindUrl,
  });
}

async function purchaseHelperSlot(purchaseType) {
  return purchaseHelperSlotAction(
    {
      getCurrentProfile,
      setHelperSlotMessage,
      navigateToLoginEntry,
      isHelperLineupEnabled,
      getHelperLineupDisabledReason,
      getHelperLineupPlan,
      getCurrentQuota,
      formatDate,
      confirmAction: (text) => window.confirm(text),
      apiFetch,
      loadSession,
      saveSession,
      loadAccount,
      loadHelperConfig,
      pickErrorMessage,
    },
    purchaseType
  );
}

function openHelperSnapshotPopup() {
  return openHelperSnapshotPopupAction(getHelperPopupActionContext());
}

function openHelperTeamSwitchPopup(teamId) {
  return openHelperTeamSwitchPopupAction(getHelperPopupActionContext(), teamId);
}

function openHelperPreviewPopup(snapshotId) {
  return openHelperPreviewPopupAction(getHelperPopupActionContext(), snapshotId);
}

function openHelperRestorePopup(snapshotId) {
  return openHelperRestorePopupAction(getHelperPopupActionContext(), snapshotId);
}

function openHelperGameFeaturePopup(feature) {
  return openHelperGameFeatureAction(getHelperPopupActionContext(), feature);
}

async function savePendingHelperBinding() {
  return savePendingHelperBindingAction({
    getCurrentProfile,
    getPendingHelperBridgePayload,
    setHelperBindMessage,
    apiFetch,
    loadHelperBindings,
    loadHelperInventories,
    setActiveHelperBinding,
    renderHelperBindingPanel,
    renderHelperGameFeaturesPanel,
    renderHelperTeamSwitchPanel,
    pickErrorMessage,
  });
}

async function removeHelperBinding(bindingId) {
  return removeHelperBindingAction({
    apiFetch,
    setCurrentHelperBindings,
    getCurrentHelperBindings,
    syncActiveHelperBindingPreference,
    loadHelperInventories,
    setHelperBindMessage,
    renderHelperBindingPanel,
    renderHelperGameFeaturesPanel,
    renderHelperTeamSwitchPanel,
    pickErrorMessage,
  }, bindingId);
}

function clearPendingHelperSelection() {
  return clearPendingHelperSelectionAction({
    setPendingHelperBridgePayload,
    clearHelperBridgeSession,
    clearPendingHelperBridgeIntent,
    renderHelperBindingPanel,
    setHelperBindMessage,
  });
}

async function autoBindHelperRoleToCurrentSession(payload) {
  return autoBindHelperRoleToCurrentSessionAction({
    isHelperScanBindEnabled,
    isHelperScanAuthEnabled,
    apiFetch,
    loadHelperBindings,
    setActiveHelperBinding,
    renderHelperBindingPanel,
    renderHelperTeamSwitchPanel,
  }, payload);
}

async function completeHelperScanAuth(payload) {
  return completeHelperScanAuthAction({
    setHelperAuthMessage,
    apiFetch,
    saveSession,
    applyImmediateAuthResult,
    loadHelperConfig,
    setPendingHelperBridgePayload,
    clearHelperBridgeSession,
    clearPendingHelperBridgeIntent,
    autoBindHelperRoleToCurrentSession: (nextPayload) => autoBindHelperRoleToCurrentSession(nextPayload),
    schedulePostAuthAccountFocus,
    closeHelperBridgeModal,
    setNotice,
    navigateToPostAuthSurface,
    activateAccountTab,
    setLocationHash: (hash) => {
      window.location.hash = hash;
    },
    isHelperLineupEnabled,
    loadAccount,
    loadHelperBindings,
    loadHelperSnapshots,
    loadHelperActionLogs,
    pickErrorMessage,
  }, payload);
}

function clearHelperRestorePreview() {
  return clearHelperRestorePreviewAction({
    setCurrentHelperRestorePreview,
    setPendingHelperPreviewSnapshotId,
    renderHelperRestorePreviewPanel,
    setHelperPreviewMessage,
  });
}

async function saveHelperInventoryFromBridge(payload) {
  return saveHelperInventoryFromBridgeAction({
    apiFetch,
    loadHelperInventories,
  }, payload);
}

async function saveHelperSnapshotFromBridge(payload) {
  return saveHelperSnapshotFromBridgeAction({
    apiFetch,
    getActiveHelperBinding,
    getHelperConfig,
    getCurrentHelperSnapshots,
    setCurrentHelperSnapshots,
    sortHelperSnapshotsList,
    renderHelperSnapshotPanel,
  }, payload);
}

async function saveHelperActionLogFromBridge(payload) {
  return saveHelperActionLogFromBridgeAction({
    apiFetch,
    getActiveHelperBinding,
    setCurrentHelperActionLogs,
    getCurrentHelperActionLogs,
    renderHelperTeamSwitchPanel,
  }, payload);
}

async function removeHelperSnapshot(snapshotId) {
  return removeHelperSnapshotAction({
    apiFetch,
    deleteExpandedHelperSnapshotId,
    getCurrentHelperSnapshots,
    setCurrentHelperSnapshots,
    getCurrentHelperRestorePreview,
    setCurrentHelperRestorePreview,
    renderHelperRestorePreviewPanel,
    renderHelperSnapshotPanel,
    setHelperSnapshotMessage,
    pickErrorMessage,
  }, snapshotId);
}

async function renameHelperSnapshot(snapshotId) {
  return renameHelperSnapshotAction({
    getCurrentHelperSnapshots,
    setHelperSnapshotMessage,
    buildHelperSnapshotName,
    promptForSnapshotName,
    pickErrorMessage,
    apiFetch,
    setCurrentHelperSnapshots,
    sortHelperSnapshotsList,
    getCurrentHelperRestorePreview,
    setCurrentHelperRestorePreview,
    renderHelperRestorePreviewPanel,
    renderHelperSnapshotPanel,
  }, snapshotId);
}

async function updateHelperSnapshotMeta(snapshotId, payload) {
  return updateHelperSnapshotMetaAction({
    apiFetch,
    getCurrentHelperSnapshots,
    setCurrentHelperSnapshots,
    sortHelperSnapshotsList,
    getCurrentHelperRestorePreview,
    setCurrentHelperRestorePreview,
    renderHelperRestorePreviewPanel,
    renderHelperSnapshotPanel,
  }, snapshotId, payload);
}

async function togglePinHelperSnapshot(snapshotId) {
  return togglePinHelperSnapshotAction({
    getCurrentHelperSnapshots,
    setHelperSnapshotMessage,
    buildHelperSnapshotName,
    pickErrorMessage,
    apiFetch,
    setCurrentHelperSnapshots,
    sortHelperSnapshotsList,
    getCurrentHelperRestorePreview,
    setCurrentHelperRestorePreview,
    renderHelperRestorePreviewPanel,
    renderHelperSnapshotPanel,
  }, snapshotId);
}

function renderHelperRestoreResultPanel() {
  return renderHelperRestoreResultPanelView(getHelperRendererContext());
}

function handleHelperBridgeMessage(event) {
  return handleHelperBridgeMessageAction({
    saveHelperInventoryFromBridge: (payload) => saveHelperInventoryFromBridge(payload),
    saveHelperSnapshotFromBridge: (payload) => saveHelperSnapshotFromBridge(payload),
    saveHelperActionLogFromBridge: (payload) => saveHelperActionLogFromBridge(payload),
    updateHelperSnapshotMeta: (snapshotId, payload) => updateHelperSnapshotMeta(snapshotId, payload),
    removeHelperSnapshot: (snapshotId) => removeHelperSnapshot(snapshotId),
    renameHelperSnapshot: (snapshotId) => renameHelperSnapshot(snapshotId),
    togglePinHelperSnapshot: (snapshotId) => togglePinHelperSnapshot(snapshotId),
    apiFetch,
    loadHelperInventories,
    loadHelperSnapshots,
    loadHelperActionLogs,
    getActiveHelperBinding,
    getHelperConfig,
    getCurrentHelperSnapshots,
    setCurrentHelperSnapshots,
    sortHelperSnapshotsList,
    renderHelperSnapshotPanel,
    setCurrentHelperActionLogs,
    getCurrentHelperActionLogs,
    renderHelperTeamSwitchPanel,
    getCurrentHelperRestorePreview,
    setCurrentHelperRestorePreview,
    renderHelperRestorePreviewPanel,
    deleteExpandedHelperSnapshotId,
    setHelperSnapshotMessage,
    pickErrorMessage,
    buildHelperSnapshotName,
    promptForSnapshotName,
    setDebugLine,
    clearHelperBridgeBackgroundFrame,
    setHelperSwitchMessage,
    setLocationHash,
    getHelperInventorySyncState,
    setHelperInventorySyncState,
    clearHelperInventorySyncItemTimeout,
    isCurrentHelperInventoryBridgeRequest,
    isCurrentHelperInventoryBridgePayload,
    shouldDeferHelperInventoryBatchSave,
    queueHelperInventoryBatchPayload,
    normalizeHelperDisplayRoleName,
    setHelperInventoryMessage,
    startNextHelperInventorySyncInQueue,
    setHelperRestoreProgress,
    getPendingHelperPreviewSnapshotId,
    setPendingHelperPreviewSnapshotId,
    buildHelperRestorePreview,
    setHelperPreviewMessage,
    normalizeBindPayload,
    getPendingHelperBridgeIntent,
    HELPER_BRIDGE_INTENT_AUTH,
    setHelperAuthMessage,
    setHelperGameFeatureMessage,
    setHelperBindMessage,
    completeHelperScanAuth: (payload) => completeHelperScanAuth(payload),
    closeHelperBridgeModal,
    setPendingHelperBridgePayload,
    saveHelperBridgeSession,
    clearPendingHelperBridgeIntent,
    fillBindForm,
    renderHelperBindingPanel,
  }, event);
}

function renderHelperLab() {
  const enabled = isHelperLineupEnabled();
  const allowHelperSurface = isPageSectionEnabled("helper");
  const keepHelperSurface = currentPageMode === "script" || currentPageMode === "me";
  const features = helperConfig?.features || {};
  const publicBase = String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
  const accessReason = getHelperLineupDisabledReason();

  helperLabSection?.classList.toggle("hidden", !allowHelperSurface || (!enabled && !keepHelperSurface));
  helperLabDockItem?.classList.toggle("hidden", !isPageSectionEnabled("dock") || !enabled);
  if (helperLabBadge) {
    helperLabBadge.textContent = enabled ? "可用" : helperConfig?.access?.whitelist_active ? "白名单中" : "未启用";
  }
  if (helperLabNote) {
    helperLabNote.textContent = enabled
      ? "保存一次当前阵容，之后就能直接从云端卡片里一键切回。系统会自动处理还原前的校验，不需要你手动预演。"
      : accessReason;
  }
  if (helperEntryNote) {
    helperEntryNote.textContent = enabled
      ? "当前环境已启用 helper 实验入口，建议只在测试服账号上联调。"
      : helperConfig?.access?.whitelist_active
        ? "阵容中心正在灰度开放中，只有白名单账号会显示这个入口。"
        : "当前主流程不依赖 helper，这里只保留给历史兼容或调试使用。";
  }
  if (helperLabOpenLink) {
    helperLabOpenLink.href = withHelperCacheBuster(`${publicBase.replace(/\/$/, "")}/`);
    helperLabOpenLink.classList.toggle("hidden", String(currentProfile?.role || "").trim() !== "admin");
  }
  renderHelperAuthEntry();
  renderHelperBindingPanel();
  renderHelperInventoryPanel();
  renderHelperGameFeaturesPanel();
  renderHelperSnapshotPanel();
  renderHelperRestoreProgressPanel();
  renderHelperRestorePreviewPanel();
  renderHelperTeamSwitchPanel();
}

async function loadHelperConfig() {
  return loadHelperConfigData({
    apiFetch,
    mergeHelperConfig,
    ensureHelperOrigin,
    setHelperOriginInputValue,
    renderHelperLab,
    loadHelperBindings,
    loadHelperInventories,
    loadHelperSnapshots,
    loadHelperActionLogs,
  });
}

function renderSessionSummary(profile) {
  updateShellVisibility(profile);
  renderHelperAuthEntry();
  if (!profile) {
    if (sessionSummary) {
      sessionSummary.textContent = "未登录";
    }
    if (sessionRole) {
      sessionRole.textContent = "请先登录账号再充值或下单。";
    }
    fillAccountForms(null);
    return;
  }

  if (sessionSummary) {
    sessionSummary.textContent = profile.game_role_name || "已登录";
  }
  const authLabel = profile.auth_provider === "password" ? "密码登录" : "绑定登录";
  const serverText = profile.game_server || "未填写区服";
  const roleLabel =
    profile.role === "admin"
      ? "管理员"
      : profile.role === ADMIN_ROLES.POSTER_ADMIN
        ? "海报后台"
        : profile.role || "用户";
  if (sessionRole) {
    sessionRole.textContent = `${serverText} / ${roleLabel} / ${authLabel}`;
  }
  fillAccountForms(profile);
}

function isBundle(product) {
  return String(product?.item_kind || "card") === "bundle";
}

function getTierKey(product) {
  if (isBundle(product)) return "bundle";
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 500) return "gold";
  if (legacyId >= 400) return "red";
  if (legacyId >= 300) return "orange";
  if (legacyId >= 200) return "purple";
  if (legacyId >= 100) return "blue";
  return "green";
}

function getTierLabelByKey(key) {
  const mapping = {
    bundle: "套餐",
    gold: "金卡",
    red: "红卡",
    orange: "橙卡",
    purple: "紫卡",
    blue: "蓝卡",
    green: "绿卡",
  };
  return mapping[key] || "商品";
}

function getTierLabel(product) {
  return getTierLabelByKey(getTierKey(product));
}

function isCurrentSeasonProduct(product) {
  return Boolean(product?.is_current_season);
}

function parsePurchasePolicyTime(value) {
  const date = new Date(value || 0);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
}

function getProductTermValues(product) {
  const text = String(product?.ext_attrs || "").trim();
  const fireValues = [...text.matchAll(/走火(?:入魔)?\s*([0-9.]+)/g)].map(
    (match) => Number(match[1]) || 0
  );
  const calmValues = [...text.matchAll(/气定(?:神闲)?\s*([0-9.]+)/g)].map(
    (match) => Number(match[1]) || 0
  );
  return [...fireValues, ...calmValues].filter(
    (value) => Number.isFinite(Number(value)) && Number(value) > 0
  );
}

function getSeasonFirstWeekWindow(rechargeConfig = getEffectiveRechargeConfig()) {
  const explicitWindow = rechargeConfig?.quota_purchase_policy_window;
  if (explicitWindow && typeof explicitWindow === "object") {
    return {
      active: Boolean(explicitWindow.active),
      starts_at: explicitWindow.starts_at || null,
      ends_at: explicitWindow.ends_at || null,
    };
  }

  const expiresAtMs = parsePurchasePolicyTime(rechargeConfig?.season_member_expires_at);
  const nowMs = Date.now();
  if (!expiresAtMs) {
    return { active: false, starts_at: null, ends_at: null };
  }
  const startsAtMs = expiresAtMs - SEASON_DURATION_DAYS * DAY_MS + 1000;
  const endsAtMs = startsAtMs + SEASON_FIRST_WEEK_DAYS * DAY_MS - 1000;
  return {
    active: nowMs >= startsAtMs && nowMs <= endsAtMs,
    starts_at: new Date(startsAtMs).toISOString(),
    ends_at: new Date(endsAtMs).toISOString(),
  };
}

function isQuotaRestrictedTermGoldProduct(product) {
  if (
    isBundle(product) ||
    String(product?.item_kind || "") === "consignment" ||
    !isCurrentSeasonProduct(product) ||
    getTierKey(product) !== "gold"
  ) {
    return false;
  }
  const termValues = getProductTermValues(product);
  if (termValues.length >= 2) return true;
  if (termValues.length !== 1) return false;
  return Number(termValues[0]) >= SINGLE_TERM_QUOTA_BLOCK_MIN_VALUE;
}

function getQuotaPurchasePolicy(product, rechargeConfig = getEffectiveRechargeConfig()) {
  if (product?.quota_purchase_disabled !== undefined) {
    return {
      quota_purchase_disabled: Boolean(product.quota_purchase_disabled),
      quota_purchase_disabled_reason:
        product.quota_purchase_disabled_reason || QUOTA_PURCHASE_BLOCK_REASON,
      quota_purchase_policy_code: product.quota_purchase_policy_code || "",
      quota_purchase_policy_window:
        product.quota_purchase_policy_window || getSeasonFirstWeekWindow(rechargeConfig),
    };
  }

  const window = getSeasonFirstWeekWindow(rechargeConfig);
  const disabled = window.active && isQuotaRestrictedTermGoldProduct(product);
  const endsAtText = window.ends_at ? formatDate(window.ends_at) : "";
  const reason = endsAtText
    ? `赛季首周（截至 ${endsAtText}），当赛季双词条金卡、2.5 及以上单词条金卡暂不支持额度购买，请使用转账锁卡或残卷转赠。`
    : QUOTA_PURCHASE_BLOCK_REASON;
  return {
    quota_purchase_disabled: disabled,
    quota_purchase_disabled_reason: disabled ? reason : "",
    quota_purchase_policy_code: disabled ? "quota_purchase_restricted_current_season_first_week" : "",
    quota_purchase_policy_window: window,
  };
}

function getQuotaPurchasePageNotice(products = allProducts) {
  const items = Array.isArray(products) ? products : [];
  const hasRestrictedProduct = items.some(
    (product) => getQuotaPurchasePolicy(product).quota_purchase_disabled
  );
  if (!hasRestrictedProduct) return "";
  const window = getSeasonFirstWeekWindow();
  const endsAtText = window.ends_at ? formatDate(window.ends_at) : "";
  return endsAtText
    ? `购买规则：赛季首周截至 ${endsAtText}，当赛季双词条金卡、2.5 及以上单词条金卡不支持额度购买；2.5 以下单词条金卡可用额度购买。`
    : `购买规则：${QUOTA_PURCHASE_BLOCK_REASON}`;
}

function getSeasonDisplayText(product) {
  if (isBundle(product)) return "套餐";
  const explicit = String(product?.season_display || "").trim();
  if (explicit) return explicit;
  const scheduleId = Number(product?.schedule_id || 0);
  if (!scheduleId) return "老卡";
  return isCurrentSeasonProduct(product) ? `S${scheduleId} 当前赛季` : `S${scheduleId} 老卡`;
}

function getSeasonCompactLabel(product) {
  if (isBundle(product)) return "套餐";
  const scheduleId = Number(product?.schedule_id || 0);
  if (!scheduleId) return "往季";
  return isCurrentSeasonProduct(product) ? `S${scheduleId} 本季` : `S${scheduleId} 往季`;
}

function getProductCategory(product) {
  return getTierKey(product);
}

function isSeasonCategory(category) {
  return category === "current_season" || category === "legacy_season";
}

function getTopCategoryKey(product) {
  if (isBundle(product)) return "bundle";
  return isCurrentSeasonProduct(product) ? "current_season" : "legacy_season";
}

function scrollProductsIntoView() {
  productsSection?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function resetProductPagination() {
  productPaginationState.page = 1;
}

function resetDiscountPagination() {
  discountPaginationState.page = 1;
}

function parseExtAttrStats(extAttrs) {
  const raw = String(extAttrs || "").trim();
  if (!raw || raw === "无") {
    return {
      fire: 0,
      calm: 0,
      total: 0,
      kindRank: 0,
    };
  }

  const fireMatch = raw.match(/走火\s*([0-9.]+)/);
  const calmMatch = raw.match(/气定\s*([0-9.]+)/);
  const fire = fireMatch ? Number(fireMatch[1]) || 0 : 0;
  const calm = calmMatch ? Number(calmMatch[1]) || 0 : 0;

  let kindRank = 0;
  if (fire > 0 && calm > 0) {
    kindRank = 3;
  } else if (fire > 0) {
    kindRank = 2;
  } else if (calm > 0) {
    kindRank = 1;
  }

  return {
    fire,
    calm,
    total: fire + calm,
    kindRank,
  };
}

function isAttackFull(product) {
  const attack = Number(product?.attack_value || 0);
  const caps = { gold: 10000000, red: 8000000, orange: 5000000, purple: 2000000, blue: 1000000 };
  return attack > 0 && attack >= (caps[getTierKey(product)] || attack + 1);
}

function isHpFull(product) {
  const hp = Number(product?.hp_value || 0);
  const caps = { gold: 200000000, red: 160000000, orange: 100000000, purple: 40000000, blue: 20000000 };
  return hp > 0 && hp >= (caps[getTierKey(product)] || hp + 1);
}

function formatCompactNumber(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0";
  const abs = Math.abs(numeric);

  if (abs >= 100000000) {
    const unitValue = abs / 100000000;
    const digits = unitValue >= 100 ? 0 : unitValue >= 10 ? 1 : 2;
    const compact = Number(unitValue.toFixed(digits));
    return `${numeric < 0 ? "-" : ""}${compact}亿`;
  }

  if (abs >= 10000) {
    const unitValue = abs / 10000;
    const digits = unitValue >= 100 ? 0 : unitValue >= 10 ? 1 : 2;
    const compact = Number(unitValue.toFixed(digits));
    return `${numeric < 0 ? "-" : ""}${compact}万`;
  }

  return String(numeric);
}

function getEffectiveRechargeConfig() {
  return getEffectiveRechargeConfigRuntime(getCommerceBuilderContext());
}

function getQuotaCashAmount(quotaAmount, rechargeConfig = getEffectiveRechargeConfig()) {
  return getQuotaCashAmountRuntime(getCommerceBuilderContext(), quotaAmount, rechargeConfig);
}

function getOriginalQuotaPrice(product) {
  return getOriginalQuotaPriceRuntime(product);
}

function isDiscountedProduct(product) {
  return isDiscountedProductRuntime(getCommerceBuilderContext(), product);
}

function getDiscountedProducts(products) {
  return getDiscountedProductsRuntime(getCommerceBuilderContext(), products);
}

function formatCashAmount(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  if (Math.abs(numeric - Math.round(numeric)) < 0.001) {
    return `¥${Math.round(numeric)}`;
  }
  return `¥${numeric.toFixed(2)}`;
}

function getProductCashPriceText(product, rechargeConfig = getEffectiveRechargeConfig()) {
  return getProductCashPriceTextRuntime(getCommerceBuilderContext(), product, rechargeConfig);
}

function getProductResidualPriceText(product, rechargeConfig = getEffectiveRechargeConfig()) {
  return getProductResidualPriceTextRuntime(getCommerceBuilderContext(), product, rechargeConfig);
}

function getDirectPurchaseAmountYuan(product, rechargeConfig = getEffectiveRechargeConfig()) {
  return getDirectPurchaseAmountYuanRuntime(getCommerceBuilderContext(), product, rechargeConfig);
}

function getQuotaCashText(quotaAmount, rechargeConfig = getEffectiveRechargeConfig()) {
  return getQuotaCashTextRuntime(getCommerceBuilderContext(), quotaAmount, rechargeConfig);
}

function buildDirectPurchaseContext(product, rechargeConfig = getEffectiveRechargeConfig()) {
  return buildDirectPurchaseContextRuntime(getCommerceBuilderContext(), product, rechargeConfig);
}

function getRechargePaymentMethods(rechargeConfig = getEffectiveRechargeConfig()) {
  return getRechargePaymentMethodsRuntime(getCommerceBuilderContext(), rechargeConfig);
}

function getGuestPurchaseMethods(rechargeConfig = getEffectiveRechargeConfig()) {
  return getGuestPurchaseMethodsRuntime(getCommerceBuilderContext(), rechargeConfig);
}

function ensureRechargePaymentChannel(rechargeConfig = getEffectiveRechargeConfig()) {
  return ensureRechargePaymentChannelRuntime(getCommerceBuilderContext(), rechargeConfig);
}

function ensureGuestTransferPaymentChannel(rechargeConfig = getEffectiveRechargeConfig()) {
  return ensureGuestTransferPaymentChannelRuntime(getCommerceBuilderContext(), rechargeConfig);
}

function getDirectResidualAmount(product, rechargeConfig = getEffectiveRechargeConfig()) {
  return getDirectResidualAmountRuntime(product, rechargeConfig);
}

function formatRechargeChannelLabel(channel) {
  return formatRechargeChannelLabelRuntime(channel);
}

function getRechargeBuilderContext() {
  return {
    escapeHtml,
    formatCashAmount,
    formatDate,
    formatRechargeChannelLabel,
  };
}

function getCommerceBuilderContext() {
  return {
    getCurrentRechargeConfig: () => currentRechargeConfig,
    getPublicRechargeConfig: () => publicRechargeConfig,
    formatCashAmount,
    isBundle,
    getTierKey,
    getSelectedRechargePaymentChannel: () => selectedRechargePaymentChannel,
    setSelectedRechargePaymentChannel: (value) => {
      selectedRechargePaymentChannel = String(value || "alipay_qr").trim() || "alipay_qr";
    },
    getSelectedGuestTransferPaymentChannel: () => selectedGuestTransferPaymentChannel,
    setSelectedGuestTransferPaymentChannel: (value) => {
      selectedGuestTransferPaymentChannel =
        String(value || "alipay_qr").trim() || "alipay_qr";
    },
  };
}

function isPositiveMoneyAmount(value) {
  return isPositiveMoneyAmountRuntime(value);
}

function getProductCardRendererContext() {
  return {
    escapeHtml,
    formatCompactNumber,
    getTierKey,
    isBundle,
    getTierLabel,
    getSeasonDisplayText,
    getSeasonCompactLabel,
    renderBundleCollage,
    getImagePayload,
    getProductCashPriceText,
    getProductResidualPriceText,
    getOriginalQuotaPrice,
    isDiscountedProduct,
    isAttackFull,
    isHpFull,
    getQuotaPurchasePolicy,
    getQuotaPurchasePageNotice,
  };
}

function formatFullStatValue(value, isFull = false) {
  return formatFullStatValueView(getProductCardRendererContext(), value, isFull);
}

function renderFullStatValue(value, isFull = false) {
  return renderFullStatValueView(getProductCardRendererContext(), value, isFull);
}

function renderStatBlock(label, value, isFull = false, compact = false) {
  return renderStatBlockView(getProductCardRendererContext(), label, value, isFull, compact);
}

function formatTermBadgeLabel(label, product) {
  return formatTermBadgeLabelView(getProductCardRendererContext(), label, product);
}

function parseTermBadges(text, product) {
  return parseTermBadgesView(getProductCardRendererContext(), text, product);
}

function renderTermBadge(badge) {
  return renderTermBadgeView(getProductCardRendererContext(), badge);
}

function renderProductTermRow(termBadges, limit = 2) {
  return renderProductTermRowView(getProductCardRendererContext(), termBadges, limit);
}

function renderProductVisual(product, variant = "grid") {
  return renderProductVisualView(getProductCardRendererContext(), product, variant);
}

function renderProductCard(product) {
  return renderProductCardView(getProductCardRendererContext(), product);
}

function getProductListRendererContext() {
  return {
    escapeHtml,
    productCategoryTabs,
    productSubcategoryTabs,
    productDetailTabs,
    productFullnessTabs,
    productGrid,
    productPagination,
    discountProductsSection,
    discountCategoryTabs,
    discountSubcategoryTabs,
    discountDetailTabs,
    discountFullnessTabs,
    discountProductGrid,
    discountProductPagination,
    getTopCategoryKey,
    getTierKey,
    getTierLabelByKey,
    getProductCategory,
    isBundle,
    isCurrentSeasonProduct,
    parseExtAttrStats,
    isAttackFull,
    isHpFull,
    getAllProducts: () => allProducts,
    getKeywordValue: () => keywordInput?.value || "",
    getDiscountKeywordValue: () => discountKeywordInput?.value || "",
    getSortValue: () => sortSelect?.value || "shop_default",
    getDiscountSortValue: () => discountSortSelect?.value || "shop_default",
    getActiveCategory: () => activeCategory,
    setActiveCategory: (value) => {
      activeCategory = value || "all";
    },
    getActiveSubcategory: () => activeSubcategory,
    setActiveSubcategory: (value) => {
      activeSubcategory = value || "all";
    },
    getActiveDetail: () => activeDetail,
    setActiveDetail: (value) => {
      activeDetail = value || "all";
    },
    getActiveFullness: () => activeFullness,
    setActiveFullness: (value) => {
      activeFullness = value || "all";
    },
    getActiveDiscountCategory: () => activeDiscountCategory,
    setActiveDiscountCategory: (value) => {
      activeDiscountCategory = value || "all";
    },
    getActiveDiscountSubcategory: () => activeDiscountSubcategory,
    setActiveDiscountSubcategory: (value) => {
      activeDiscountSubcategory = value || "all";
    },
    getActiveDiscountDetail: () => activeDiscountDetail,
    setActiveDiscountDetail: (value) => {
      activeDiscountDetail = value || "all";
    },
    getActiveDiscountFullness: () => activeDiscountFullness,
    setActiveDiscountFullness: (value) => {
      activeDiscountFullness = value || "all";
    },
    setCurrentProducts: (items) => {
      currentProducts = Array.isArray(items) ? items : [];
    },
    setCurrentDiscountProducts: (items) => {
      currentDiscountProducts = Array.isArray(items) ? items : [];
    },
    getProductPaginationState: () => productPaginationState,
    getDiscountPaginationState: () => discountPaginationState,
    getDiscountedProducts,
    isDiscountedProduct,
    renderProductCard,
    getQuotaPurchasePageNotice,
    bindImageFallbacks,
    syncDiscountDockVisibility,
    syncDockWithViewport,
  };
}

function getProductListRuntimeContext() {
  return {
    searchDelayMs: 120,
    getProductSearchTimer: () => productSearchTimer,
    setProductSearchTimer: (value) => {
      productSearchTimer = value ?? null;
    },
    getDiscountSearchTimer: () => discountSearchTimer,
    setDiscountSearchTimer: (value) => {
      discountSearchTimer = value ?? null;
    },
    resetProductPagination,
    resetDiscountPagination,
    applyProductView,
    applyDiscountView,
    renderProducts,
    renderDiscountProducts,
    scrollProductsIntoView,
    scrollDiscountProductsIntoView: () => {
      discountProductsSection?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    getCurrentProducts: () => currentProducts,
    getCurrentDiscountProducts: () => currentDiscountProducts,
    getProductPaginationState: () => productPaginationState,
    getDiscountPaginationState: () => discountPaginationState,
    setActiveCategory: (value) => {
      activeCategory = value || "all";
    },
    setActiveSubcategory: (value) => {
      activeSubcategory = value || "all";
    },
    setActiveDetail: (value) => {
      activeDetail = value || "all";
    },
    setActiveFullness: (value) => {
      activeFullness = value || "all";
    },
    setActiveDiscountCategory: (value) => {
      activeDiscountCategory = value || "all";
    },
    setActiveDiscountSubcategory: (value) => {
      activeDiscountSubcategory = value || "all";
    },
    setActiveDiscountDetail: (value) => {
      activeDiscountDetail = value || "all";
    },
    setActiveDiscountFullness: (value) => {
      activeDiscountFullness = value || "all";
    },
  };
}

function renderDiscountProducts(products) {
  return renderDiscountProductsView(getProductListRendererContext(), products);
}

function applyProductView(options = {}) {
  return applyProductViewRenderer(getProductListRendererContext(), options);
}

function applyDiscountView(options = {}) {
  return applyDiscountViewRenderer(getProductListRendererContext(), options);
}

function renderProducts(products) {
  return renderProductsView(getProductListRendererContext(), products);
}

function getAccountRendererContext() {
  return {
    accountProfile,
    quotaBalance,
    orderList,
    rechargeBody,
    rechargeOrderList,
    beginnerGuideRewardQuota: BEGINNER_GUIDE_REWARD_QUOTA,
    escapeHtml,
    formatDate,
    formatCashAmount,
    setAccountMessage,
    formatOrderStatus,
    isDrawServiceOrder,
    getDrawServiceMeta,
    getSelectedRechargeAmount: () => selectedRechargeAmount,
    setSelectedRechargeAmount: (value) => {
      selectedRechargeAmount = value;
    },
    getSelectedRechargeOrderType: () => selectedRechargeOrderType,
    setSelectedRechargeOrderType: (value) => {
      selectedRechargeOrderType = value;
    },
    getSelectedRechargePaymentChannel: () => selectedRechargePaymentChannel,
    getPendingDirectPurchaseContext: () => pendingDirectPurchaseContext,
    isPositiveMoneyAmount,
    findPendingSeasonMemberOrder,
    getRechargePaymentMethods,
    ensureRechargePaymentChannel,
    getRechargeQuoteSummary,
    formatRechargeOrderTitle,
    formatRechargeStatus,
    formatRechargeOrderAmountLine,
    formatRechargeReferenceLine,
    isResidualTransferOrder,
    formatRechargeChannelLabel,
    getActivePurchaseView: () => activePurchaseView,
    getPurchasePage,
    getPurchasePageSize: () => 6,
  };
}

function getAccountInteractionRuntimeContext() {
  return {
    pathname: window.location.pathname,
    accountSection,
    accountSecurityTabButton,
    accountTabButtons,
    accountTabPanels,
    setActiveAccountTab: (value) => {
      activeAccountTab = value;
    },
    requestCancelOrder,
    submitEscrowDelivery,
    confirmEscrowReceipt,
    disputeEscrowTrade,
    setActivePurchaseView,
    changePurchasePage,
    logoutCurrentSession,
    saveAccountProfile,
    changeAccountPassword,
    activateAccountTab,
  };
}

function getRechargeInteractionRuntimeContext() {
  return {
    rechargeBody,
    loadSession,
    renderRechargeSection,
    getCurrentRechargeConfig: () => currentRechargeConfig,
    getCurrentRechargeOrders: () => currentRechargeOrders,
    clearPendingDirectPurchaseContext: () => {
      pendingDirectPurchaseContext = null;
    },
    setSelectedRechargePaymentChannel: (value) => {
      selectedRechargePaymentChannel = String(value || "alipay_qr").trim() || "alipay_qr";
    },
    setSelectedRechargeOrderType: (value) => {
      selectedRechargeOrderType = value;
    },
    getSelectedRechargeOrderType: () => selectedRechargeOrderType,
    setSelectedRechargeAmount: (value) => {
      selectedRechargeAmount = value;
    },
    getSelectedRechargeAmount: () => selectedRechargeAmount,
    isPositiveMoneyAmount,
    getRechargeQuoteSummary,
    updateRechargeQuotePreview,
    setAccountMessage,
    submitRechargeOrder,
  };
}

async function submitEscrowDelivery(tradeId) {
  const note = window.prompt("填写发货说明（例如已发给哪个角色、时间、凭证说明）", "");
  if (note === null) return;
  if (!String(note || "").trim()) {
    setNotice("请填写发货说明。", "error");
    return;
  }
  try {
    const trade = await apiFetch(`/orders/consignments/${tradeId}/delivery`, {
      method: "POST",
      body: JSON.stringify({ delivery_note: String(note).trim() }),
    });
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        await Promise.allSettled([loadAccount(), loadHelperInventories()]);
        return;
      }
      const form = new FormData();
      form.append("image", file);
      await apiFetch(`/orders/consignments/${trade.id}/evidence-images`, {
        method: "POST",
        body: form,
      });
      setNotice("发货说明和证据图片已提交。", "success");
      await Promise.allSettled([loadAccount(), loadHelperInventories()]);
    };
    input.click();
  } catch (error) {
    setNotice(`提交发货失败：${pickErrorMessage(error, "提交失败")}`, "error");
  }
}

async function confirmEscrowReceipt(tradeId) {
  if (!window.confirm("确认已经收到卡？确认后平台会结算给卖家。")) return;
  try {
    await apiFetch(`/orders/consignments/${tradeId}/confirm-receipt`, { method: "POST" });
    setNotice("已确认收货。", "success");
    await loadAccount();
  } catch (error) {
    setNotice(`确认失败：${pickErrorMessage(error, "确认失败")}`, "error");
  }
}

async function disputeEscrowTrade(tradeId) {
  const note = window.prompt("请简单说明纠纷原因", "") ?? "";
  try {
    await apiFetch(`/orders/consignments/${tradeId}/dispute`, {
      method: "POST",
      body: JSON.stringify({ dispute_note: note }),
    });
    setNotice("纠纷已提交，等待管理员处理。", "success");
    await loadAccount();
  } catch (error) {
    setNotice(`提交纠纷失败：${pickErrorMessage(error, "提交失败")}`, "error");
  }
}

function formatOrderStatus(status) {
  const mapping = {
    pending: "待处理",
    confirmed: "已完成",
    [ORDER_STATUS.CANCEL_REQUESTED]: "待审核取消",
    cancelled: "已取消",
  };
  return mapping[status] || status || "-";
}

function formatRechargeStatus(status) {
  return formatRechargeStatusRuntime(status);
}

function isDrawServiceOrder(order) {
  return String(order?.order_source || "").trim() === "draw_service";
}

function getDrawServiceMeta(order) {
  if (!order) return null;
  if (order.draw_service && typeof order.draw_service === "object") {
    return order.draw_service;
  }
  const item = Array.isArray(order.items)
    ? order.items.find(
        (entry) => entry?.product_snapshot && String(entry.product_snapshot.service_kind || "") === "draw_service"
      )
    : null;
  return item?.product_snapshot || null;
}

function normalizeDrawServiceAmount(value) {
  return normalizeDrawServiceAmountRuntime(value, {
    minQuota: DRAW_SERVICE_MIN_QUOTA,
    stepQuota: DRAW_SERVICE_STEP_QUOTA,
  });
}

function getDrawServiceConfig() {
  return getEffectiveRechargeConfig()?.draw_service || null;
}

function normalizeDrawServiceWan(value) {
  const config = getDrawServiceConfig();
  return normalizeDrawServiceWanRuntime(value, {
    minDrawWan: Number(config?.min_draw_wan || 1),
    stepDrawWan: Number(config?.step_draw_wan || 1),
  });
}

function getDrawServiceSelectionQuote(drawWanValue = null, tierKeyValue = null) {
  return getDrawServiceSelectionQuoteRuntime(getDrawServiceRuntimeContext(), drawWanValue, tierKeyValue);
}

function setDrawServiceMessage(text, type = "") {
  if (!drawServiceMessage) return;
  drawServiceMessage.textContent = text || "";
  drawServiceMessage.className = type ? `notice ${type}` : "notice";
}

function updateDrawServiceQuote() {
  return updateDrawServiceQuoteRuntime(getDrawServiceRuntimeContext());
}

function getDrawServiceRuntimeContext() {
  return {
    minQuota: DRAW_SERVICE_MIN_QUOTA,
    stepQuota: DRAW_SERVICE_STEP_QUOTA,
    getEffectiveRechargeConfig,
    getDrawServiceConfig,
    getCurrentProfile: () => currentProfile,
    getCurrentQuota: () => currentQuota,
    getSelectedDrawServiceTierKey: () => selectedDrawServiceTierKey,
    setSelectedDrawServiceTierKey: (value) => {
      selectedDrawServiceTierKey = String(value || "").trim();
    },
    getSelectedDrawServiceWan: () => selectedDrawServiceWan,
    setSelectedDrawServiceWan: (value) => {
      selectedDrawServiceWan = Number(value || 0);
    },
    normalizeDrawServiceAmount,
    normalizeDrawServiceWan,
    getDrawServiceSelectionQuote,
    updateDrawServiceQuote,
    renderDrawServiceZone,
    submitDrawServiceOrder,
  };
}

function getDrawServiceRendererContext() {
  const config = getDrawServiceConfig();
  return {
    minQuota: DRAW_SERVICE_MIN_QUOTA,
    stepQuota: DRAW_SERVICE_STEP_QUOTA,
    rechargeConfig: getEffectiveRechargeConfig(),
    drawServiceConfig: config,
    selectedTierKey: selectedDrawServiceTierKey || config?.default_tier_key || "tier_8",
    selectedDrawWan: selectedDrawServiceWan || config?.min_draw_wan || 1,
    presetAmounts: [200, 1000, 2000, 5000, 10000, 50000],
  };
}

function getDrawServiceActionContext(event) {
  return {
    event,
    minQuota: DRAW_SERVICE_MIN_QUOTA,
    apiFetch,
    loadAccount,
    navigateToLoginEntry,
    normalizeDrawServiceAmount,
    normalizeDrawServiceWan,
    getDrawServiceSelectionQuote,
    setDrawServiceMessage,
    getCurrentProfile: () => currentProfile,
    getCurrentQuota: () => currentQuota,
    getSelectedDrawServiceTierKey: () => selectedDrawServiceTierKey,
    setSelectedDrawServiceTierKey: (value) => {
      selectedDrawServiceTierKey = String(value || "").trim();
    },
    getSelectedDrawServiceWan: () => selectedDrawServiceWan,
    setSelectedDrawServiceWan: (value) => {
      selectedDrawServiceWan = Number(value || 0);
    },
  };
}

function renderDrawServiceZone(profile, quota) {
  if (!drawServiceBody) return;
  currentProfile = profile || null;
  currentQuota = quota || null;

  if (!profile) {
    drawServiceBody.innerHTML = renderDrawServiceZoneContent(getDrawServiceRendererContext(), null, null, {
      tierKey: selectedDrawServiceTierKey,
      drawAmountWan: selectedDrawServiceWan,
    });
    setDrawServiceMessage("");
    return;
  }

  const config = getDrawServiceConfig();
  if (!selectedDrawServiceTierKey) {
    selectedDrawServiceTierKey = config?.default_tier_key || "tier_8";
  }
  if (!normalizeDrawServiceWan(selectedDrawServiceWan)) {
    selectedDrawServiceWan = Number(config?.min_draw_wan || 1);
  }

  drawServiceBody.innerHTML = renderDrawServiceZoneContent(
    getDrawServiceRendererContext(),
    profile,
    quota,
    {
      tierKey: selectedDrawServiceTierKey,
      drawAmountWan: selectedDrawServiceWan,
    }
  );
  updateDrawServiceQuote();
  setDrawServiceMessage("");
}

async function submitDrawServiceOrder(event) {
  return submitDrawServiceOrderAction(getDrawServiceActionContext(event));
}

function setAuctionMessage(text, type = "") {
  if (!auctionMessage) return;
  auctionMessage.textContent = text || "";
  auctionMessage.className = type ? `notice ${type}` : "notice";
}

function formatAuctionStatusLabel(status) {
  return formatAuctionStatusLabelView(status);
}

function formatAuctionTimeLabel(auction) {
  const status = String(auction?.status || "").trim();
  if (status === "scheduled") {
    return `开始时间：${formatDate(auction?.starts_at || "")}`;
  }
  if (status === "settled") {
    return `成交时间：${formatDate(auction?.settled_at || auction?.updated_at || "")}`;
  }
  if (status === "cancelled") {
    return `流拍时间：${formatDate(auction?.cancelled_at || auction?.updated_at || "")}`;
  }
  return `截止时间：${formatDate(auction?.ends_at || "")}`;
}

function formatAuctionCountdownDuration(targetTimeMs, nowMs = Date.now()) {
  return formatAuctionCountdownDurationView(targetTimeMs, nowMs);
}

function getAuctionCountdownMeta(auction, nowMs = Date.now()) {
  return getAuctionCountdownMetaView(auction, nowMs);
}

function renderAuctionCountdown(auction) {
  const meta = getAuctionCountdownMeta(auction);
  return `
    <div class="auction-countdown ${escapeHtml(meta.tone)}" data-auction-countdown-id="${auction.id}">
      <span class="auction-countdown-label">${escapeHtml(meta.label)}</span>
      <strong class="auction-countdown-value">${escapeHtml(meta.value)}</strong>
    </div>
  `;
}

function renderAuctionBidQuickChips(nextMinBid) {
  const options = [
    { label: "最低价", amount: nextMinBid },
    { label: "+500", amount: nextMinBid + 500 },
    { label: "+1000", amount: nextMinBid + 1000 },
    { label: "+2000", amount: nextMinBid + 2000 },
    { label: "+5000", amount: nextMinBid + 5000 },
  ];
  return `
    <div class="auction-bid-quick-list">
      ${options
        .map(
          (option) => `
            <button
              class="ghost auction-bid-quick-btn"
              type="button"
              data-auction-bid-target="${Number(option.amount || 0)}"
            >${escapeHtml(option.label)}</button>
          `
        )
        .join("")}
    </div>
  `;
}

function getAuctionBidSummary(auctionId) {
  return (
    currentAuctionBidSummaries.find(
      (item) => Number(item.auction_id || 0) === Number(auctionId || 0)
    ) || null
  );
}

function getAuctionRendererContext() {
  return {
    auctionBody,
    auctionStatusTabs,
    escapeHtml,
    formatDate,
    parseTermBadges,
    getAuctionBidSummary,
    isBundle,
    getTierLabel,
    getSeasonDisplayText,
    renderProductVisual,
    renderStatBlock,
    isAttackFull,
    isHpFull,
    renderTermBadge,
    getQuotaCashText,
    getCurrentAuctions: () => currentAuctions,
    getActiveAuctionStatus: () => activeAuctionStatus,
  };
}

function renderAuctionZone(profile) {
  return renderAuctionZoneView(getAuctionRendererContext(), profile);
}

async function loadAuctions() {
  return loadAuctionsData({
    apiFetch,
    getCurrentProfile: () => currentProfile,
    setCurrentAuctions,
    setCurrentAuctionBidSummaries,
    renderAuctionZone,
    setAuctionMessage,
    pickErrorMessage,
  });
}

async function submitAuctionBid(auctionId, amountQuota) {
  return submitAuctionBidAction({
    auctionId,
    amountQuota,
    apiFetch,
    setAuctionMessage,
    loadAuctions,
    loadAccount,
    pickErrorMessage,
  });
}

function updateAuctionBidPreview(card) {
  return updateAuctionBidPreviewRuntime(getAuctionInteractionRuntimeContext(), card);
}

function updateAuctionCountdowns() {
  return updateAuctionCountdownsRuntime(getAuctionInteractionRuntimeContext());
}

function getAuctionInteractionRuntimeContext() {
  return {
    auctionBody,
    getCurrentAuctions: () => currentAuctions,
    getCurrentProfile: () => currentProfile,
    getQuotaCashText,
    getAuctionCountdownMeta,
    setActiveAuctionStatus: (value) => {
      activeAuctionStatus = value;
    },
    renderAuctionZone,
    setAuctionMessage,
    navigateToLoginEntry,
    submitAuctionBid,
  };
}

function getShopHomeRendererContext() {
  return {
    beginnerGuideSummary,
    beginnerGuideReward,
    beginnerGuideSteps,
    beginnerFlowSection,
    recentSalesList,
    beginnerGuideRewardQuota: BEGINNER_GUIDE_REWARD_QUOTA,
    escapeHtml,
    formatDate,
    isPageSectionEnabled,
  };
}


function setActiveGuidePage(page) {
  activeGuidePage = page === "sales" ? "sales" : "tutorial";
  if (beginnerCarouselTrack) {
    beginnerCarouselTrack.style.transform =
      activeGuidePage === "sales" ? "translateX(-100%)" : "translateX(0)";
  }
  beginnerGuideTabs.forEach((button) => {
    const isActive = button.getAttribute("data-guide-page-target") === activeGuidePage;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  if (beginnerGuidePrevBtn) beginnerGuidePrevBtn.disabled = activeGuidePage === "tutorial";
  if (beginnerGuideNextBtn) beginnerGuideNextBtn.disabled = activeGuidePage === "sales";
}

function renderRecentSales(items = []) {
  return renderRecentSalesSectionView(getShopHomeRendererContext(), items);
}

async function loadRecentSales() {
  return loadRecentSalesData({
    apiFetch,
    setRecentSalesItems,
    renderRecentSales,
  });
}

function renderBeginnerGuide(profile, orders = [], rechargeOrders = []) {
  return renderBeginnerGuideSectionView(
    getShopHomeRendererContext(),
    profile,
    orders,
    rechargeOrders
  );
}

function renderProfile(profile, quota, orders, escrowTrades = []) {
  return renderProfileSectionView(getAccountRendererContext(), profile, quota, orders, escrowTrades);
}

function findPendingSeasonMemberOrder(rechargeOrders, rechargeConfig) {
  return findPendingSeasonMemberOrderRuntime(rechargeOrders, rechargeConfig);
}

function isResidualTransferOrder(order) {
  return isResidualTransferOrderRuntime(order);
}

function formatRechargeOrderTitle(order) {
  return formatRechargeOrderTitleRuntime(order);
}

function formatRechargeOrderAmountLine(order) {
  return formatRechargeOrderAmountLineRuntime(getRechargeBuilderContext(), order);
}

function formatRechargeReferenceLine(order) {
  return formatRechargeReferenceLineRuntime(getRechargeBuilderContext(), order);
}

function getRechargeQuoteSummary(profile, rechargeConfig, amountYuan, orderType = "normal") {
  return getRechargeQuoteSummaryRuntime(
    getRechargeBuilderContext(),
    profile,
    rechargeConfig,
    amountYuan,
    orderType
  );
}

function updateRechargeQuotePreview(profile, rechargeConfig) {
  return updateRechargeQuotePreviewRuntime(
    getRechargeInteractionRuntimeContext(),
    profile,
    rechargeConfig
  );
}

function renderRechargeSection(profile, rechargeConfig, rechargeOrders) {
  return renderRechargeSectionView(
    getAccountRendererContext(),
    profile,
    rechargeConfig,
    rechargeOrders
  );
}

function findProduct(itemId, itemKind) {
  return findProductInList(allProducts, itemId, itemKind);
}

function setActiveProduct(itemId, itemKind = "card") {
  const nextState = buildActiveProductState(itemId, itemKind);
  activeItemId = nextState.activeItemId;
  activeItemKind = nextState.activeItemKind;
}

function isActiveProduct(itemId, itemKind = "card") {
  return isActiveProductState(activeItemId, activeItemKind, itemId, itemKind);
}

function getProductModalRuntimeContext() {
  return createProductModalRuntimeContext({
    productDetailBody,
    productDetailModal,
    escapeHtml,
    formatCashAmount,
    getSelectedGuestTransferPaymentChannel: () => selectedGuestTransferPaymentChannel,
    setSelectedGuestTransferPaymentChannel: (value) => {
      selectedGuestTransferPaymentChannel = String(value || "alipay_qr").trim() || "alipay_qr";
    },
    setActiveProduct,
    isActiveProduct,
    setProductDetailMessage,
    loadSession,
    getEffectiveRechargeConfig,
    buildDirectPurchaseContext,
    getDirectResidualAmount,
    getGuestPurchaseMethods,
    ensureGuestTransferPaymentChannel,
    isAttackFull,
    isHpFull,
    getProductCashPriceText,
    getProductResidualPriceText,
    getOriginalQuotaPrice,
    isDiscountedProduct,
    getQuotaPurchasePolicy,
    getCurrentQuotaValue,
    parseTermBadges,
    isBundle,
    getTierLabel,
    getSeasonDisplayText,
    renderFullStatValue,
    renderTermBadge,
    renderProductVisual,
    bindImageFallbacks,
    renderProductDetailModalContent,
    applyDynamicBundleSelection,
    findProduct,
    openProductModal,
    closeProductModal,
    toggleGuestTransferPanel,
    submitGuestTransferOrder,
    submitConsignmentEscrowOrder,
    startDirectPurchase,
    confirmPurchase,
  });
}

function openProductModal(itemId, itemKind) {
  return openProductModalRuntime(getProductModalRuntimeContext(), itemId, itemKind);
}

function closeProductModal() {
  return closeProductModalRuntime(getProductModalRuntimeContext());
}

function toggleGuestTransferPanel(visible) {
  return toggleGuestTransferPanelRuntime(getProductModalRuntimeContext(), visible);
}

async function submitGuestTransferOrder(event) {
  event.preventDefault();
  return submitGuestTransferOrderAction(
    createSubmitGuestTransferOrderContext({
      findProduct,
      getActiveItemId: () => activeItemId,
      getActiveItemKind: () => activeItemKind,
      setProductDetailMessage,
      getEffectiveRechargeConfig,
      buildDirectPurchaseContext,
      getSelectedGuestTransferPaymentChannel: () => selectedGuestTransferPaymentChannel,
      getDirectResidualAmount,
      apiFetch,
      closeProductModal,
      formatRechargeChannelLabel,
      setNotice,
      loadProducts,
      pickErrorMessage,
      formatCashAmount,
    })
  );
}

async function submitConsignmentEscrowOrder(event) {
  event.preventDefault();
  const session = loadSession();
  if (!session?.token) {
    setProductDetailMessage("请先登录后再购买玩家寄售。", "error");
    navigateToLoginEntry();
    return;
  }
  const product = findProduct(activeItemId, activeItemKind);
  if (!product) {
    setProductDetailMessage("当前寄售商品不存在或已下架。", "error");
    return;
  }
  const method = document.querySelector('input[name="consignment-payment-method"]:checked')?.value || "";
  const paymentReference = String(document.getElementById("consignment-payment-reference")?.value || "").trim();
  const buyerNote = String(document.getElementById("consignment-buyer-note")?.value || "").trim();
  if (method !== "quota" && !paymentReference) {
    setProductDetailMessage("请填写付款或转赠时间/备注。", "error");
    return;
  }
  try {
    const trade = await apiFetch("/orders/consignments", {
      method: "POST",
      body: JSON.stringify({
        listing_id: Number(product.consignment_listing_id || product.item_id),
        payment_method: method,
        payment_reference: paymentReference || (method === "quota" ? "额度支付" : ""),
        buyer_note: buyerNote || undefined,
      }),
    });
    closeProductModal();
    setNotice(`担保订单 #${trade.id} 已提交，商品已锁定。`, "success");
    await Promise.allSettled([loadProducts({ resetPage: false }), loadAccount()]);
  } catch (error) {
    setProductDetailMessage(`担保订单提交失败：${pickErrorMessage(error, "提交失败")}`, "error");
  }
}

function startDirectPurchase(itemId, itemKind = "card") {
  return startDirectPurchaseRuntime(getProductModalRuntimeContext(), itemId, itemKind);
}

async function loadProducts(options = {}) {
  return loadProductsData(
    {
      apiFetch,
      setDebugLine,
      setPublicRechargeConfig,
      setAllProducts,
      applyProductView,
      applyDiscountView,
    },
    options
  );
}

async function loadAccount() {
  return loadAccountData({
    loadSession,
    setDebugLine,
    renderLoggedOutAccountState,
    getSessionProfileFallback,
    applySessionProfileFallback,
    apiFetch,
    saveSession,
    applyLoadedAccountState,
    shouldBootstrap,
    loadHelperBindings,
    loadHelperInventories,
    loadHelperSnapshots,
    loadHelperActionLogs,
    loadAuctions,
    consumePostAuthAccountFocus,
    focusAccountAfterAuth,
    setNotice,
    clearSession,
  });
}

async function submitRechargeOrder(event) {
  event.preventDefault();
  return submitRechargeOrderAction(
    createSubmitRechargeOrderContext({
      loadSession,
      setAccountMessage,
      getSelectedRechargeOrderType: () => selectedRechargeOrderType,
      getCurrentRechargeConfig: () => currentRechargeConfig,
      getCurrentRechargeOrders: () => currentRechargeOrders,
      findPendingSeasonMemberOrder,
      isPositiveMoneyAmount,
      apiFetch,
      getSelectedRechargePaymentChannel: () => selectedRechargePaymentChannel,
      handleRechargeSubmitSuccess,
      loadAccount,
      pickErrorMessage,
    })
  );
}

async function bindAccount(event) {
  event.preventDefault();
  return bindAccountAction(
    createBindAccountContext({
      apiFetch,
      bindRoleIdInput,
      bindServerInput,
      bindRoleNameInput,
      bindTokenIdInput,
      bindNicknameInput,
      saveSession,
      applyImmediateAuthResult,
      loadHelperConfig,
      schedulePostAuthAccountFocus,
      setNotice,
      completePostAuthNavigation,
      pickErrorMessage,
    })
  );
}

async function loginAccount(event) {
  event.preventDefault();
  return loginAccountAction(
    createLoginAccountContext({
      apiFetch,
      loginRoleIdInput,
      loginPasswordInput,
      saveSession,
      applyImmediateAuthResult,
      loadHelperConfig,
      schedulePostAuthAccountFocus,
      setNotice,
      completePostAuthNavigation,
      pickErrorMessage,
    })
  );
}

async function confirmPurchase() {
  return confirmPurchaseAction(
    createConfirmPurchaseContext({
      loadSession,
      setProductDetailMessage,
      setNotice,
      navigateToLoginEntry,
      findProduct,
      getActiveItemId: () => activeItemId,
      getActiveItemKind: () => activeItemKind,
      getCurrentQuotaValue,
      getQuotaPurchasePolicy,
      apiFetch,
      closeProductModal,
      loadProducts,
      loadAccount,
      pickErrorMessage,
    })
  );
}

async function requestCancelOrder(orderId) {
  return requestCancelOrderAction(
    createRequestCancelOrderContext(
      {
        apiFetch,
        setNotice,
        loadAccount,
        pickErrorMessage,
      },
      orderId
    )
  );
}

window.__GONGFA_APP_ACTIONS__ = {
  openProductModal,
  startDirectPurchase,
  closeProductModal,
};

async function saveAccountProfile(event) {
  event.preventDefault();
  return saveAccountProfileAction(
    createSaveAccountProfileContext({
      loadSession,
      setAccountMessage,
      apiFetch,
      accountRoleNameInput,
      accountNicknameInput,
      accountContactInput,
      accountServerInput,
      saveSession,
      loadAccount,
      pickErrorMessage,
    })
  );
}

async function changeAccountPassword(event) {
  event.preventDefault();
  return changeAccountPasswordAction(
    createChangeAccountPasswordContext({
      loadSession,
      setAccountMessage,
      accountCurrentPasswordInput,
      accountNewPasswordInput,
      accountConfirmPasswordInput,
      apiFetch,
      pickErrorMessage,
    })
  );
}

function logoutCurrentSession(options = {}) {
  return logoutCurrentSessionAction(
    createLogoutCurrentSessionContext(
      {
        clearSession,
        loadHelperConfig,
        resetPostLogoutUiState,
        activateAccountTab,
        renderSessionSummary,
        renderProfile,
        renderRechargeSection,
        setNotice,
        setAccountMessage,
        navigateToLoginEntry,
      },
      options
    )
  );
}

function openHelper() {
  return openHelperToolAction({
    getHelperOriginInputValue: () => helperOriginInput.value,
    setNotice,
    setHelperOrigin,
    withHelperCacheBuster,
    openWindow: (...args) => window.open(...args),
  });
}

function applyIncomingPayload(payload) {
  const normalized = normalizeBindPayload(payload);
  if (normalized) fillBindForm(normalized);
}
function syncRegisterPasswordValidation(showMessage = false) {
  if (!registerPasswordInput || !registerPasswordConfirmInput) return true;
  const mismatch = registerPasswordConfirmInput.value.length > 0 && registerPasswordInput.value !== registerPasswordConfirmInput.value;
  registerPasswordConfirmInput.setCustomValidity(mismatch ? "两次输入的密码不一致" : "");
  if (showMessage && mismatch) {
    registerPasswordConfirmInput.reportValidity();
  }
  return !mismatch;
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  return registerAccountAction(
    createRegisterAccountContext({
      apiFetch,
      registerRoleIdInput,
      registerRoleNameInput,
      registerPasswordInput,
      registerPasswordConfirmInput,
      syncRegisterPasswordValidation,
      setNotice,
      saveSession,
      applyImmediateAuthResult,
      loadHelperConfig,
      schedulePostAuthAccountFocus,
      completePostAuthNavigation,
      pickErrorMessage,
    })
  );
}

bindHelperShellEvents(getHelperShellBindingsContext());

bindAuthEntryEvents({
  bindForm,
  registerForm,
  loginForm,
  bindAccount,
  handleRegisterSubmit,
  loginAccount,
  registerPasswordInput,
  registerPasswordConfirmInput,
  registerRoleIdInput,
  syncRegisterPasswordValidation,
  authTabButtons,
  activateAuthTab,
});
bindAccountShellEvents({
  accountTabButtons,
  accountTabLinks,
  handleAccountTabButtonClick: (event) =>
    handleAccountTabButtonClickRuntime(getAccountInteractionRuntimeContext(), event),
  navigateToAccountTabLink,
});
bindBeginnerGuideEvents({
  beginnerGuideTabs,
  beginnerGuidePrevBtn,
  beginnerGuideNextBtn,
  beginnerCarousel,
  setActiveGuidePage,
});
bindPageDockEvents({
  pageDockItems,
  navigateWithDock,
  mobileAdminLink,
});
bindPageInteractionEvents(getPageInteractionBindingsContext());

bindGlobalAppEvents({
  productDetailModal,
  closeProductModal,
  handleHelperBridgeMessage,
  applyIncomingPayload,
  sessionStorageKey: "gongfa_session_v1",
  loadAccount,
  syncAccountTabWithHash,
  syncDockWithViewport,
  setDebugLine,
});

runAppBootSequence({
  currentPageMode,
  getStartupTasksForMode,
  startupContext: getAppStartupContext(),
  safeRun,
  setDebugLine,
  updateAuctionCountdowns,
  auctionCountdownTickMs: AUCTION_COUNTDOWN_TICK_MS,
});
