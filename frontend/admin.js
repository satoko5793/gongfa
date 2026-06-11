import { createAdminApi } from "./admin-services/api.js?v=release-20260611-151806";
import {
  escapeHtml as sharedEscapeHtml,
  pickErrorMessage as sharedPickErrorMessage,
} from "./shared.js?v=release-20260611-151806";
import { loadAdminPageData, bindAdminPageEvents, renderAdminPage } from "./admin-pages/index.js?v=release-20260611-151806";
import { renderPendingImportEntriesView, renderPendingHelperInventoryEntriesView } from "./admin-renderers/imports.js?v=release-20260611-151806";
import { renderSessionView, renderOverviewSection, renderAdminAlertsSection, clearAdminAlertsSection } from "./admin-renderers/overview.js?v=release-20260611-151806";
import { renderPricingSummaryView } from "./admin-renderers/pricing.js?v=release-20260611-151806";
import {
  renderCatalogProductsSection,
  renderBundlesSection,
  openProductModalView,
  closeProductModalView,
} from "./admin-renderers/products.js?v=release-20260611-151806";
import { renderOrdersListSection, renderLinkedOrderUserState as renderLinkedOrderUserStateSection } from "./admin-renderers/orders.js?v=release-20260611-151806";
import {
  renderRechargeOrdersSection,
  renderRechargeConfigSection,
  renderPricingControlsSection,
  formatRechargeChannelLabel,
} from "./admin-renderers/recharge.js?v=release-20260611-151806";
import { renderUsersSection } from "./admin-renderers/users.js?v=release-20260611-151806";
import { renderAuditsSection, renderQuotaLogsSection } from "./admin-renderers/logs.js?v=release-20260611-151806";
import { renderAuctionsSection } from "./admin-renderers/auctions.js?v=release-20260611-151806";
import { getAdminDomRefs } from "./admin-runtime/dom.js?v=release-20260611-151806";
import { activateAdminPageShell, renderPagination, setDebugLine } from "./admin-runtime/page-shell.js?v=release-20260611-151806";
import {
  createAdminStore,
  POSTER_EXPORT_LIMIT,
  POSTER_WEBSITE,
  PRICING_TIER_ORDER,
  PRICING_TIER_LABELS,
  ADMIN_READ_ROLES,
  ADMIN_WRITE_ROLES,
  READ_ONLY_WRITE_CONTROL_IDS,
} from "./admin-state/store.js?v=release-20260611-151806";
import {
  ADMIN_ROLES,
  ORDER_STATUS,
  RECHARGE_ORDER_STATUS,
  isAdminRole,
} from "./app-constants.js?v=release-20260611-151806";
import {
  cashToQuota,
  quotaToCash,
} from "./payment-conversion.js?v=release-20260611-151806";

const { apiFetch, clearSession, formatDate, loadSession, saveSession } = createAdminApi();
const refs = getAdminDomRefs(document);
const {
  adminSession,
  adminMessage,
  adminOverview,
  adminAlerts,
  adminAlertSummary,
  adminAlertActions,
  adminAlertTimestamp,
  adminProductModal,
  adminProductModalBody,
  closeAdminProductModalBtn,
  adminLoginForm,
  adminLoginRoleIdInput,
  adminLoginPasswordInput,
  adminLoginBtn,
  adminLogoutBtn,
  importJsonInput,
  importFileNameInput,
  importBatchAddBtn,
  importBatchFileInput,
  importBatchClearBtn,
  importBatchSubmitBtn,
  importBatchList,
  importBatchCountChip,
  helperImportFileInput,
  helperImportClearBtn,
  helperImportSubmitBtn,
  helperImportSubmitProductsBtn,
  helperImportList,
  helperImportCountChip,
  productsRoot,
  auctionsRoot,
  bundlesRoot,
  usersRoot,
  ordersRoot,
  quotaLogsRoot,
  auditsRoot,
  consignmentsRoot,
  adminConsignmentStatusFilter,
  reloadConsignmentsBtn,
  selectedProductsChip,
  filteredProductsChip,
  discountedProductsChip,
  adminProductKeywordInput,
  adminProductStatusFilter,
  adminProductDiscountFilter,
  adminProductCategoryTabs,
  adminProductSubcategoryTabs,
  adminProductDetailTabs,
  adminProductFullnessTabs,
  adminUserKeywordInput,
  adminRechargeKeywordInput,
  adminRechargeStatusFilter,
  adminRechargeOrdersRoot,
  adminRechargeConfigForm,
  adminRechargeEnabled,
  adminRechargeExchangeYuanInput,
  adminRechargeExchangeQuotaInput,
  adminRechargeMinYuanInput,
  adminCurrentSeasonGoldMinDisplayCashYuanInput,
  adminResidualTransferEnabledInput,
  adminResidualAdminRoleIdInput,
  adminResidualAdminRoleNameInput,
  adminResidualAdminGameNameInput,
  adminResidualUnitLabelInput,
  adminResidualQuotaPerUnitInput,
  adminResidualPurchaseAnchorCashYuanInput,
  adminSeasonMemberEnabledInput,
  adminSeasonMemberLabelInput,
  adminSeasonMemberExpiresAtInput,
  adminSeasonMemberPriceInput,
  adminSeasonMemberQuotaInput,
  adminSeasonMemberBonusRateInput,
  adminLineupBaseSlotsInput,
  adminLineupPermanentSlotQuotaInput,
  adminLineupPermanentSlotMaxInput,
  adminLineupSeasonalSlotQuotaInput,
  adminLineupMemberBonusSlotsInput,
  adminRechargePresetsInput,
  adminRechargePayeeNameInput,
  adminRechargePayeeHintInput,
  adminRechargeQrImageUrlInput,
  adminWechatPayeeNameInput,
  adminWechatPayeeHintInput,
  adminWechatQrImageUrlInput,
  adminRechargeInstructionsInput,
  adminResidualInstructionsInput,
  adminRechargeQrPreview,
  adminWechatQrPreview,
  adminDrawServiceConfigRoot,
  adminPricingDisplayModeSelect,
  adminPricingControlsRoot,
  adminOrderKeywordInput,
  adminOrderStatusFilter,
  adminQuotaLogKeywordInput,
  adminQuotaLogTypeFilter,
  adminAuditKeywordInput,
  adminAuditActionInput,
  linkedOrderUserState,
  bulkPriceInput,
  bulkStockInput,
  bulkDiscountRateInput,
  randomDiscountCountInput,
  randomDiscountRateInput,
  exportPosterAutoCountInput,
  smartSelectHotProductsBtn,
  smartSelectBudgetProductsBtn,
  smartSelectMixedProductsBtn,
  exportPosterTitleInput,
  exportPosterSubtitleInput,
  exportPosterFootnoteInput,
  exportProductPosterBtn,
  selectedAuctionProductChip,
  adminAuctionStartingPriceInput,
  adminAuctionMinIncrementInput,
  adminAuctionStartAtInput,
  adminAuctionEndAtInput,
  adminAuctionTitleInput,
  adminAuctionRemarkInput,
  adminAuctionStatusFilter,
  recalculatePricingBtn,
  importForm,
  importSubmitBtn,
  adminDebugAction,
  adminDebugSession,
  adminDebugError,
  adminPageButtons,
  adminPagePanels,
  ordersPaginationRoot,
  rechargeOrdersPaginationRoot,
  quotaLogsPaginationRoot,
  auditsPaginationRoot,
  productsPaginationRoot,
  bundlesPaginationRoot,
  usersPaginationRoot,
} = refs;

const adminStore = createAdminStore();
const { selectedProductIds, loadedAdminPages, paginationState } = adminStore;
let allProducts = adminStore.allProducts;
let allBundles = adminStore.allBundles;
let allUsers = adminStore.allUsers;
let currentRechargeConfig = adminStore.currentRechargeConfig;
let draftPricingControls = adminStore.draftPricingControls;
let linkedOrderUser = adminStore.linkedOrderUser;
let activeAdminPage = adminStore.activeAdminPage;
let activeAdminProductCategory = adminStore.activeAdminProductCategory;
let activeAdminProductSubcategory = adminStore.activeAdminProductSubcategory;
let activeAdminProductDetail = adminStore.activeAdminProductDetail;
let activeAdminProductFullness = adminStore.activeAdminProductFullness;
let currentOrderList = adminStore.currentOrderList;
let currentRechargeOrderList = adminStore.currentRechargeOrderList;
let currentAuctionList = adminStore.currentAuctionList;
let currentPaymentReviewList = adminStore.currentPaymentReviewList;
let currentQuotaLogList = [];
let currentAuditList = [];
let currentConsignmentList = [];
let currentEscrowTradeList = [];
let overviewData = adminStore.overviewData;
let currentProductFacets = adminStore.currentProductFacets;
let currentProductSummary = adminStore.currentProductSummary;
let currentProductAppliedFilters = adminStore.currentProductAppliedFilters;
let pendingImportEntries = adminStore.pendingImportEntries;
let pendingHelperInventoryEntries = adminStore.pendingHelperInventoryEntries;
let alertPollTimer = adminStore.alertPollTimer;
let currentAdminProfile = adminStore.currentAdminProfile;

function markDebugAction(action) {
  setDebugLine(adminDebugAction, "action", action);
}

function markDebugSession(sessionState) {
  setDebugLine(adminDebugSession, "session", sessionState);
}

function markDebugError(errorText) {
  setDebugLine(adminDebugError, "error", errorText || "none");
}

function buildPendingImportEntry(sourceFileName, rawJson) {
  const trimmedName = String(sourceFileName || "").trim() || `legacy_getinfo-${Date.now()}.json`;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source_file_name: trimmedName,
    raw_json: String(rawJson || "").trim(),
  };
}

function inferRoleIdFromUid(uid) {
  const normalizedUid = String(uid || "").trim();
  if (!normalizedUid) return "";
  const [roleId] = normalizedUid.split("-");
  return String(roleId || "").trim();
}

function describeHelperInventorySource(rawJson) {
  try {
    const parsed = JSON.parse(String(rawJson || ""));
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      parsed.summary &&
      typeof parsed.summary === "object" &&
      Array.isArray(parsed.items)
    ) {
      const roleId =
        String(parsed.summary?.role_id || parsed.summary?.roleId || "").trim() ||
        inferRoleIdFromUid(parsed.items?.[0]?.uid || parsed.items?.[0]?.uId || "");
      return {
        format: "helper_payload",
        roleId,
        roleName: String(parsed.summary?.role_name || parsed.summary?.roleName || "").trim(),
        server: String(parsed.summary?.server || "").trim(),
        currentScheduleId:
          Number(
            parsed.summary?.current_schedule_id ??
              parsed.summary?.currentScheduleId ??
              parsed.summary?.role_schedule_id ??
              parsed.summary?.roleScheduleId ??
              0
          ) || null,
        itemCount: Array.isArray(parsed.items) ? parsed.items.length : 0,
      };
    }

    const storage = parsed?.roleLegacy?.legacyStorage;
    if (storage && typeof storage === "object" && !Array.isArray(storage)) {
      const entries = Object.values(storage);
      return {
        format: "legacy_getinfo",
        roleId:
          inferRoleIdFromUid(entries?.[0]?.uId || entries?.[0]?.uid || "") ||
          inferRoleIdFromUid(Object.keys(storage)[0] || ""),
        roleName: String(parsed?.roleName || parsed?.gameRoleName || "").trim(),
        server: String(parsed?.server || parsed?.gameServer || "").trim(),
        currentScheduleId: Number(parsed?.roleLegacy?.scheduleId || parsed?.scheduleId || 0) || null,
        itemCount: entries.length,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function buildPendingHelperInventoryEntry(sourceFileName, rawJson) {
  const trimmedName =
    String(sourceFileName || "").trim() || `helper-inventory-${Date.now()}.json`;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source_file_name: trimmedName,
    raw_json: String(rawJson || "").trim(),
    meta: describeHelperInventorySource(rawJson),
  };
}

function renderPendingImportEntries() {
  renderPendingImportEntriesView(
    { importBatchCountChip, importBatchList },
    pendingImportEntries,
    { escapeHtml }
  );
}

function renderPendingHelperInventoryEntries() {
  renderPendingHelperInventoryEntriesView(
    { helperImportCountChip, helperImportList },
    pendingHelperInventoryEntries,
    { escapeHtml }
  );
}

function escapeHtml(value) {
  return sharedEscapeHtml(value);
}

function pickErrorMessage(error, fallback = "请求失败") {
  return sharedPickErrorMessage(error, fallback);
}

function parsePositiveMoneyValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const normalized = Number(numeric.toFixed(2));
  if (normalized <= 0) return null;
  if (Math.abs(normalized * 100 - Math.round(normalized * 100)) > 0.000001) {
    return null;
  }
  return normalized;
}

function parseNonNegativeMoneyValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numeric = Number(text);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  const normalized = Number(numeric.toFixed(2));
  if (Math.abs(normalized * 100 - Math.round(normalized * 100)) > 0.000001) {
    return null;
  }
  return normalized;
}

function parseNonNegativeIntegerValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numeric = Number(text);
  if (!Number.isInteger(numeric) || numeric < 0) return null;
  return numeric;
}

function parsePricingDecaySpeedValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numeric = Number(text);
  if (!Number.isFinite(numeric) || numeric < 0.2 || numeric > 5) return null;
  return Number(numeric.toFixed(2));
}

function parsePricingBonusRateValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numeric = Number(text);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 3) return null;
  return Number(numeric.toFixed(4));
}

function parsePricingThresholdRateValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numeric = Number(text);
  if (!Number.isFinite(numeric) || numeric < 0.5 || numeric > 1) return null;
  return Number(numeric.toFixed(4));
}

function parsePricingPenaltyRateValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numeric = Number(text);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) return null;
  return Number(numeric.toFixed(4));
}

function parsePricingPercentValue(value, { min = 0, max = 300 } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numeric = Number(text);
  if (!Number.isInteger(numeric) || numeric < min || numeric > max) return null;
  return numeric;
}

function cloneValue(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function getQuotaPerYuan(config = currentRechargeConfig) {
  return 1250;
}

function getRechargeConfigDraftForPricing() {
  return {
    ...(currentRechargeConfig || {}),
    exchange_yuan: 8,
    exchange_quota: 10000,
    quota_per_yuan: 1250,
  };
}

function convertQuotaToCash(quotaAmount, config = currentRechargeConfig) {
  return quotaToCash(quotaAmount);
}

function convertCashToQuota(yuanAmount, config = currentRechargeConfig) {
  return cashToQuota(yuanAmount);
}

function getEmptyPricingControls() {
  return {
    enabled: true,
    legacy_discount_rate: 100,
    legacy_double_term_discount_rate: 100,
    double_term_bonus_percent: 0,
    tiers: Object.fromEntries(
      PRICING_TIER_ORDER.map((tierKey) => [
        tierKey,
        {
          key: tierKey,
          label: PRICING_TIER_LABELS[tierKey],
          atlas_min_quota: 0,
          atlas_max_quota: 0,
          atlas_double_full_quota: 0,
          atlas_decay_speed: 1,
          term_min_quota: 0,
          term_max_quota: 0,
          term_decay_speed: 1,
          term_attack_bonus_rate: 0,
          term_attack_bonus_start_rate: 0.95,
          term_attack_penalty_rate: 0,
          term_attack_penalty_start_rate: 0.85,
          term_attack_reference_min_value: tierKey === "gold" ? 8100000 : 0,
          term_attack_reference_max_value: tierKey === "gold" ? 10000000 : 0,
          term_value_reference_min: tierKey === "gold" ? 2.1 : 0,
          term_value_reference_max: tierKey === "gold" ? 3.0 : 0,
          no_term_min_quota: tierKey === "gold" ? 500 : 0,
          no_term_full_attack_quota: tierKey === "gold" ? 20000 : 0,
          no_term_double_full_quota: tierKey === "gold" ? 35000 : 0,
          no_term_hp_bonus_start_value: tierKey === "gold" ? 198000000 : 0,
        },
      ])
    ),
  };
}

function getNormalizedPricingControls(pricingControls) {
  const source =
    pricingControls && typeof pricingControls === "object" ? cloneValue(pricingControls) : getEmptyPricingControls();
  const tiers = source.tiers && typeof source.tiers === "object" ? source.tiers : {};
  return {
    enabled: source.enabled === undefined ? true : Boolean(source.enabled),
    legacy_discount_rate: parsePricingPercentValue(source.legacy_discount_rate, {
      min: 1,
      max: 100,
    }) ?? 100,
    legacy_double_term_discount_rate:
      parsePricingPercentValue(source.legacy_double_term_discount_rate, {
        min: 1,
        max: 100,
      }) ?? 100,
    double_term_bonus_percent:
      parsePricingPercentValue(source.double_term_bonus_percent, {
        min: 0,
        max: 300,
      }) ?? 0,
    tiers: Object.fromEntries(
      PRICING_TIER_ORDER.map((tierKey) => {
        const tier = tiers[tierKey] || {};
        const atlasMin = Math.max(0, Number(tier.atlas_min_quota || 0));
        const atlasMax = Math.max(atlasMin, Number(tier.atlas_max_quota || 0));
        const atlasDoubleFull = Math.max(
          atlasMax,
          Number(tier.atlas_double_full_quota || atlasMax)
        );
        const atlasDecaySpeed = parsePricingDecaySpeedValue(tier.atlas_decay_speed) ?? 1;
        const termMin = Math.max(0, Number(tier.term_min_quota || 0));
        const termMax = Math.max(termMin, Number(tier.term_max_quota || 0));
        const termDecaySpeed = parsePricingDecaySpeedValue(tier.term_decay_speed) ?? 1;
        const termAttackBonusRate = parsePricingBonusRateValue(tier.term_attack_bonus_rate) ?? 0;
        const termAttackBonusStartRate =
          parsePricingThresholdRateValue(tier.term_attack_bonus_start_rate) ?? 0.95;
        const termAttackPenaltyRate =
          parsePricingPenaltyRateValue(tier.term_attack_penalty_rate) ?? 0;
        const termAttackPenaltyStartRate =
          parsePricingThresholdRateValue(tier.term_attack_penalty_start_rate) ?? 0.85;
        const termAttackReferenceMinValue = Math.max(
          0,
          Number(tier.term_attack_reference_min_value || (tierKey === "gold" ? 8100000 : 0))
        );
        const termAttackReferenceMaxValue = Math.max(
          termAttackReferenceMinValue,
          Number(tier.term_attack_reference_max_value || (tierKey === "gold" ? 10000000 : 0))
        );
        const termValueReferenceMin = Math.max(
          0,
          Number(tier.term_value_reference_min || (tierKey === "gold" ? 2.1 : 0))
        );
        const termValueReferenceMax = Math.max(
          termValueReferenceMin,
          Number(tier.term_value_reference_max || (tierKey === "gold" ? 3.0 : 0))
        );
        const noTermMinQuota = Math.max(
          0,
          Number(tier.no_term_min_quota || (tierKey === "gold" ? 500 : 0))
        );
        const noTermFullAttackQuota = Math.max(
          noTermMinQuota,
          Number(tier.no_term_full_attack_quota || (tierKey === "gold" ? 20000 : 0))
        );
        const noTermDoubleFullQuota = Math.max(
          noTermFullAttackQuota,
          Number(tier.no_term_double_full_quota || (tierKey === "gold" ? 35000 : 0))
        );
        const noTermHpBonusStartValue = Math.max(
          0,
          Number(tier.no_term_hp_bonus_start_value || (tierKey === "gold" ? 198000000 : 0))
        );
        return [
          tierKey,
          {
            key: tierKey,
            label: tier.label || PRICING_TIER_LABELS[tierKey],
            atlas_min_quota: atlasMin,
            atlas_max_quota: atlasMax,
            atlas_double_full_quota: atlasDoubleFull,
            atlas_decay_speed: atlasDecaySpeed,
            term_min_quota: termMin,
            term_max_quota: termMax,
            term_decay_speed: termDecaySpeed,
            term_attack_bonus_rate: termAttackBonusRate,
            term_attack_bonus_start_rate: termAttackBonusStartRate,
            term_attack_penalty_rate: termAttackPenaltyRate,
            term_attack_penalty_start_rate: termAttackPenaltyStartRate,
            term_attack_reference_min_value: termAttackReferenceMinValue,
            term_attack_reference_max_value: termAttackReferenceMaxValue,
            term_value_reference_min: termValueReferenceMin,
            term_value_reference_max: termValueReferenceMax,
            no_term_min_quota: noTermMinQuota,
            no_term_full_attack_quota: noTermFullAttackQuota,
            no_term_double_full_quota: noTermDoubleFullQuota,
            no_term_hp_bonus_start_value: noTermHpBonusStartValue,
          },
        ];
      })
    ),
  };
}

function getPricingDisplayMode() {
  return adminPricingDisplayModeSelect?.value === "cash" ? "cash" : "quota";
}

function formatEditablePricingValue(
  quotaAmount,
  mode = getPricingDisplayMode(),
  config = getRechargeConfigDraftForPricing()
) {
  const quota = Math.max(0, Number(quotaAmount || 0));
  if (mode === "cash") {
    const cashAmount = convertQuotaToCash(quota, config);
    return cashAmount === null ? "" : String(cashAmount);
  }
  return String(Math.round(quota));
}

function formatQuotaCashPair(quotaAmount, config = currentRechargeConfig) {
  const quota = Number(quotaAmount || 0);
  if (!Number.isFinite(quota) || quota < 0) return "-";
  const cashAmount = convertQuotaToCash(quota, config);
  if (cashAmount === null) return `${Math.round(quota)} 额度`;
  return `${Math.round(quota)} 额度 / ¥${cashAmount.toFixed(2)}`;
}

function setMessage(text, type = "") {
  adminMessage.textContent = text || "";
  adminMessage.className = type ? `notice ${type}` : "notice";
  if (type === "error") {
    markDebugError(text || "unknown_error");
  } else if (text) {
    markDebugError("none");
  }
}

function getAdminRoleValue(profile = currentAdminProfile) {
  return String(profile?.role || "").trim();
}

function hasAdminReadAccess(profile = currentAdminProfile) {
  return ADMIN_READ_ROLES.has(getAdminRoleValue(profile));
}

function hasAdminWriteAccess(profile = currentAdminProfile) {
  return ADMIN_WRITE_ROLES.has(getAdminRoleValue(profile));
}

function canConfirmOrders(profile = currentAdminProfile) {
  return isAdminRole(getAdminRoleValue(profile));
}

function isAdminReadOnlyMode(profile = currentAdminProfile) {
  return hasAdminReadAccess(profile) && !hasAdminWriteAccess(profile);
}

function getAdminRoleLabel(role) {
  switch (String(role || "").trim()) {
    case ADMIN_ROLES.ADMIN:
      return "管理员";
    case ADMIN_ROLES.POSTER_ADMIN:
      return "海报只读";
    case "user":
      return "普通用户";
    default:
      return role || "-";
  }
}

function guardAdminWriteAccess(message = "当前账号是只读海报权限，不能修改后台数据。") {
  if (hasAdminWriteAccess()) return true;
  setMessage(message, "error");
  return false;
}

function setElementDisabled(element, disabled) {
  if (!element || typeof element.disabled === "undefined") return;
  element.disabled = Boolean(disabled);
}

function applyAdminAccessMode() {
  const readOnly = isAdminReadOnlyMode();
  document.body.classList.toggle("admin-readonly-mode", readOnly);

  READ_ONLY_WRITE_CONTROL_IDS.forEach((id) => {
    setElementDisabled(document.getElementById(id), readOnly);
  });

  const importControls = importForm?.querySelectorAll("input, textarea, button") || [];
  importControls.forEach((element) => setElementDisabled(element, readOnly));

  const rechargeConfigControls =
    adminRechargeConfigForm?.querySelectorAll("input, select, textarea, button") || [];
  rechargeConfigControls.forEach((element) => setElementDisabled(element, readOnly));
}

function formatOrderStatusLabel(status) {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return "待处理";
    case ORDER_STATUS.CANCEL_REQUESTED:
      return "待审核取消";
    case ORDER_STATUS.CONFIRMED:
      return "已确认";
    case ORDER_STATUS.CANCELLED:
      return "已取消";
    default:
      return status || "-";
  }
}

function normalizePaginatedResponse(response, fallbackPageSize = 20) {
  if (Array.isArray(response)) {
    return {
      items: response,
      total: response.length,
      page: 1,
      page_size: fallbackPageSize,
      total_pages: response.length > 0 ? 1 : 0,
      has_more: false,
      facets: null,
      summary: null,
      applied_filters: null,
    };
  }

  return {
    items: Array.isArray(response?.items) ? response.items : [],
    total: Number(response?.total || 0),
    page: Number(response?.page || 1),
    page_size: Number(response?.page_size || fallbackPageSize),
    total_pages: Number(response?.total_pages || 0),
    has_more: Boolean(response?.has_more),
    facets: response?.facets || null,
    summary: response?.summary || null,
    applied_filters: response?.applied_filters || null,
  };
}

function resetPagedState(target) {
  if (!paginationState[target]) return;
  paginationState[target].page = 1;
}

function markPageLoaded(page, loaded = true) {
  if (loaded) {
    loadedAdminPages.add(page);
    return;
  }
  loadedAdminPages.delete(page);
}

function sliceLocalPage(items, stateKey) {
  const state = paginationState[stateKey];
  const total = items.length;
  const pageSize = Number(state?.pageSize || 10);
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const nextPage = Math.min(Math.max(Number(state?.page || 1), 1), Math.max(totalPages, 1));
  paginationState[stateKey] = {
    ...state,
    page: nextPage,
    total,
    totalPages,
  };
  const start = (nextPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function formatOrderItemSnapshot(item) {
  const snapshot =
    item?.product_snapshot && typeof item.product_snapshot === "object" ? item.product_snapshot : {};
  const lines = [];

  if (String(snapshot.service_kind || "") === "draw_service") {
    if (snapshot.amount_quota) {
      lines.push(`代抽额度：${Number(snapshot.amount_quota)}`);
    }
    if (snapshot.payment_method === "residual_transfer") {
      lines.push(`残卷转赠：${Number(snapshot.transfer_amount || 0)} ${snapshot.transfer_unit || "残卷"}`);
    }
    if (snapshot.season_label) {
      lines.push(`赛季：${snapshot.season_label}`);
    }
    if (snapshot.rule_summary) {
      lines.push(snapshot.rule_summary);
    }
    return lines;
  }

  if (snapshot.legacy_id) {
    lines.push(`Legacy ID：${snapshot.legacy_id}`);
  }

  const attackValue = Number(snapshot.attack_value || 0);
  const hpValue = Number(snapshot.hp_value || 0);
  if (attackValue > 0 || hpValue > 0) {
    lines.push(`攻击 / 血量：${attackValue} / ${hpValue}`);
  }

  if (snapshot.ext_attrs) {
    lines.push(`额外词条：${snapshot.ext_attrs}`);
  }

  if (snapshot.main_attrs) {
    lines.push(`主词条：${snapshot.main_attrs}`);
  }

  if (snapshot.season_display) {
    lines.push(`赛季：${snapshot.season_display}`);
  }

  return lines;
}

function isDrawServiceOrder(order) {
  return String(order?.order_source || "").trim() === "draw_service";
}

function getDrawServiceMeta(order) {
  if (order?.draw_service && typeof order.draw_service === "object") {
    return order.draw_service;
  }
  const item = Array.isArray(order?.items)
    ? order.items.find(
        (entry) =>
          entry?.product_snapshot &&
          String(entry.product_snapshot.service_kind || "").trim() === "draw_service"
      )
    : null;
  return item?.product_snapshot || null;
}

function getOrderSourceLabel(order) {
  if (isDrawServiceOrder(order)) return "代抽专区";
  if (order?.order_source === "guest_transfer") return "转账锁卡";
  if (order?.order_source === "external") return "外部交易";
  if (order?.order_source === "auction") return "拍卖成交";
  return "商城下单";
}

function renderSession(profile) {
  const session = loadSession();
  currentAdminProfile = profile || null;
  return renderSessionView(
    { adminSession },
    {
      session,
      profile,
      markDebugSession,
      getAdminRoleLabel,
      applyAdminAccessMode,
      hasAdminReadAccess,
      hasAdminWriteAccess,
      escapeHtml,
    }
  );
}

function renderOverview() {
  renderOverviewSection({ adminOverview }, overviewData, { escapeHtml });
}

function renderAdminAlerts() {
  renderAdminAlertsSection(
    { adminAlerts, adminAlertSummary, adminAlertActions, adminAlertTimestamp },
    overviewData,
    { formatDate }
  );
}

function clearAdminAlerts() {
  if (alertPollTimer) {
    window.clearInterval(alertPollTimer);
    alertPollTimer = null;
  }
  clearAdminAlertsSection({ adminAlerts, adminAlertSummary, adminAlertActions, adminAlertTimestamp });
}

function startAlertPolling() {
  if (alertPollTimer) {
    window.clearInterval(alertPollTimer);
  }
  alertPollTimer = window.setInterval(() => {
    loadOverviewCounts().catch(() => {});
  }, 60000);
}

function renderPricingControls(pricingControls = draftPricingControls) {
  renderPricingControlsSection(buildAdminPageContext(), pricingControls);
}

function activateAdminPage(page, { force = false } = {}) {
  return activateAdminPageShell(page, {
    refs: { adminPageButtons, adminPagePanels },
    setActivePage(nextPage) {
      activeAdminPage = nextPage;
    },
    renderPage(nextPage) {
      renderAdminPage(nextPage, buildAdminPageContext());
    },
    loadPage: (nextPage, options) => loadAdminPage(nextPage, options),
    force,
  });
}

function setLinkedOrderUser(user) {
  linkedOrderUser = user
    ? {
        id: user.id,
        game_role_id: user.game_role_id,
        game_role_name: user.game_role_name,
      }
    : null;

  if (linkedOrderUser?.game_role_id) {
    adminOrderKeywordInput.value = String(linkedOrderUser.game_role_id);
  }

  renderLinkedOrderUserStateSection(buildAdminPageContext());
}

function syncSelectedProducts() {
  selectedProductsChip.textContent = `已选 ${selectedProductIds.size}`;
  renderSelectedAuctionProduct();
}

function isDiscountedProduct(product) {
  return normalizeDiscountRate(product?.discount_rate) < 100;
}

function syncProductSummary(products = getFilteredProducts()) {
  syncSelectedProducts();
  if (filteredProductsChip) {
    filteredProductsChip.textContent = `当前筛选 ${Number(currentProductSummary.filtered_total || products.length)}`;
  }
  if (discountedProductsChip) {
    discountedProductsChip.textContent = `打折中 ${Number(currentProductSummary.discounted_total || products.filter(isDiscountedProduct).length)}`;
  }
}

function getSelectedAuctionProduct() {
  const selectedIds = [...selectedProductIds];
  if (selectedIds.length !== 1) return null;
  return allProducts.find((product) => Number(product.id) === Number(selectedIds[0])) || null;
}

function renderSelectedAuctionProduct() {
  if (!selectedAuctionProductChip) return;
  const product = getSelectedAuctionProduct();
  if (!product) {
    selectedAuctionProductChip.textContent = "当前未选择拍卖商品";
    return;
  }
  const auctionHint =
    product.auction_id && product.auction_status
      ? ` / 当前拍卖 ${product.auction_status} #${product.auction_id}`
      : "";
  selectedAuctionProductChip.textContent = `当前拍卖商品：#${product.id} ${product.name}${auctionHint}`;
}

function parseDiscountRateInputValue(value, fallback = null) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 100) {
    return fallback;
  }
  return numeric;
}

function parsePositiveCountInputValue(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
}

function sampleProducts(list, count) {
  const items = [...list];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items.slice(0, count);
}

function getPricingMeta(product) {
  return product && product.pricing_meta && typeof product.pricing_meta === "object"
    ? product.pricing_meta
    : {};
}

function normalizeDiscountRate(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 100;
  const normalized = Math.round(numeric);
  if (normalized <= 0 || normalized > 100) return 100;
  return normalized;
}

function getDiscountLabel(discountRate) {
  const normalized = normalizeDiscountRate(discountRate);
  if (normalized >= 100) return "无折扣";
  const fold = normalized / 10;
  return Number.isInteger(fold) ? `${fold}折` : `${fold.toFixed(1)}折`;
}

function formatRate(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return `${(numeric * 100).toFixed(1)}%`;
}

function renderAdminProductCover(product) {
  const imageUrl = product?.image_url ? escapeHtml(product.image_url) : "";
  if (imageUrl) {
    return `
      <div class="admin-product-cover">
        <img
          src="${imageUrl}"
          alt="${escapeHtml(product.name || "product")}"
          loading="lazy"
          onerror="this.style.display='none'; this.parentElement.classList.add('fallback')"
        />
        <div class="admin-product-fallback">${escapeHtml(String(product.name || "?").slice(0, 1))}</div>
      </div>
    `;
  }

  return `
    <div class="admin-product-cover fallback">
      <div class="admin-product-fallback">${escapeHtml(String(product.name || "?").slice(0, 1))}</div>
    </div>
  `;
}

function renderPricingSummary(product, pricingMeta) {
  return renderPricingSummaryView(product, pricingMeta, { escapeHtml, formatQuotaCashPair });
}

function getAdminProductTierKey(product) {
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 500) return "gold";
  if (legacyId >= 400) return "red";
  if (legacyId >= 300) return "orange";
  if (legacyId >= 200) return "purple";
  if (legacyId >= 100) return "blue";
  return "green";
}

function getAdminProductTierLabelByKey(key) {
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

function isAdminCurrentSeasonProduct(product) {
  return Boolean(product?.is_current_season);
}

function isAdminSeasonCategory(category) {
  return category === "current_season" || category === "legacy_season";
}

function getAdminTopCategoryKey(product) {
  return isAdminCurrentSeasonProduct(product) ? "current_season" : "legacy_season";
}

function buildAdminProductCategoryEntries(products) {
  const labels = {
    all: "全部",
    current_season: "本赛季",
    legacy_season: "往赛季",
    bundle: "套餐",
  };
  const counts = { all: Array.isArray(products) ? products.length : 0 };
  for (const product of products || []) {
    const key = getAdminTopCategoryKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  counts.bundle = Array.isArray(allBundles) ? allBundles.length : 0;
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderAdminProductCategoryTabs() {
  if (!adminProductCategoryTabs) return;
  const entries = Array.isArray(currentProductFacets?.categories) ? currentProductFacets.categories : [];
  const validKeys = new Set(entries.map((entry) => entry.key));
  if (!validKeys.has(activeAdminProductCategory)) {
    activeAdminProductCategory = "all";
  }
  adminProductCategoryTabs.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="category-tab ${entry.key === activeAdminProductCategory ? "active" : ""}"
          data-admin-product-category="${entry.key}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="category-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
}

function parseAdminExtAttrStats(extAttrs) {
  const raw = String(extAttrs || "").trim();
  if (!raw || raw === "无") {
    return { fire: 0, calm: 0 };
  }
  const fireMatch = raw.match(/走火\s*([0-9.]+)/);
  const calmMatch = raw.match(/气定\s*([0-9.]+)/);
  return {
    fire: fireMatch ? Number(fireMatch[1]) || 0 : 0,
    calm: calmMatch ? Number(calmMatch[1]) || 0 : 0,
  };
}

function getAdminGoldSubcategory(product) {
  if (getAdminProductTierKey(product) !== "gold") return "all";
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 600) return "rare";
  const extStats = parseAdminExtAttrStats(product?.ext_attrs);
  if (extStats.fire > 0 && extStats.calm > 0) return "double_term";
  if (extStats.fire > 0) return "fire_only";
  if (extStats.calm > 0) return "calm_only";
  return "no_term";
}

function getAdminNameSubcategoryKey(product) {
  const name = String(product?.name || "").trim();
  return name ? `name:${name}` : "all";
}

function buildAdminProductSubcategoryEntries(products, category) {
  if (!category || category === "bundle") return [];
  const subset = products || [];
  if (!subset.length) return [];

  const labels = {
    all:
      category === "current_season"
        ? "全部本赛季"
        : category === "legacy_season"
          ? "全部往赛季"
          : "全部卡阶",
    gold: "金卡",
    red: "红卡",
    orange: "橙卡",
    purple: "紫卡",
    blue: "蓝卡",
    green: "绿卡",
  };
  const counts = { all: subset.length };
  for (const product of subset) {
    const key = getAdminProductTierKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderAdminProductSubcategoryTabs() {
  if (!adminProductSubcategoryTabs) return;
  const entries = Array.isArray(currentProductFacets?.subcategories)
    ? currentProductFacets.subcategories
    : [];
  if (!activeAdminProductCategory || activeAdminProductCategory === "bundle" || !entries.length) {
    adminProductSubcategoryTabs.classList.add("hidden");
    adminProductSubcategoryTabs.innerHTML = "";
    activeAdminProductSubcategory = "all";
    return;
  }
  const validKeys = new Set(entries.map((entry) => entry.key));
  if (!validKeys.has(activeAdminProductSubcategory)) {
    activeAdminProductSubcategory = "all";
  }

  adminProductSubcategoryTabs.classList.toggle("hidden", entries.length <= 1);
  adminProductSubcategoryTabs.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === activeAdminProductSubcategory ? "active" : ""}"
          data-admin-product-subcategory="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
}

function buildAdminProductDetailEntries(products, tier) {
  if (!tier || tier === "all" || tier === "bundle") return [];
  const subset = (products || []).filter((product) => getAdminProductTierKey(product) === tier);
  if (!subset.length) return [];

  if (tier === "gold") {
    const labels = {
      all: "全部金卡",
      rare: "珍卡",
      double_term: "双词条",
      fire_only: "走火",
      calm_only: "气定",
      no_term: "无词条",
    };
    const counts = { all: subset.length };
    for (const product of subset) {
      const key = getAdminGoldSubcategory(product);
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(labels)
      .filter(([key]) => key === "all" || counts[key] > 0)
      .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
  }

  const counts = new Map();
  for (const product of subset) {
    const key = getAdminNameSubcategoryKey(product);
    counts.set(key, {
      key,
      label: String(product?.name || "未命名"),
      count: (counts.get(key)?.count || 0) + 1,
    });
  }

  return [
    { key: "all", label: `全部${getAdminProductTierLabelByKey(tier)}`, count: subset.length },
    ...Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label), "zh-Hans-CN")
    ),
  ];
}

function renderAdminProductDetailTabs() {
  if (!adminProductDetailTabs) return;
  const entries = Array.isArray(currentProductFacets?.details) ? currentProductFacets.details : [];
  if (entries.length <= 1) {
    adminProductDetailTabs.classList.add("hidden");
    adminProductDetailTabs.innerHTML = "";
    activeAdminProductDetail = "all";
    return;
  }

  const validKeys = new Set(entries.map((entry) => entry.key));
  if (!validKeys.has(activeAdminProductDetail)) {
    activeAdminProductDetail = "all";
  }

  adminProductDetailTabs.classList.remove("hidden");
  adminProductDetailTabs.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === activeAdminProductDetail ? "active" : ""}"
          data-admin-product-detail="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
}

function getAdminProductFullnessKey(product) {
  const attack = Number(product?.attack_value || 0);
  const hp = Number(product?.hp_value || 0);
  const caps = {
    gold: { attack: 10000000, hp: 200000000 },
    red: { attack: 8000000, hp: 160000000 },
    orange: { attack: 5000000, hp: 100000000 },
    purple: { attack: 2000000, hp: 40000000 },
    blue: { attack: 1000000, hp: 20000000 },
  };
  const tierCaps = caps[getAdminProductTierKey(product)] || { attack: Number.MAX_SAFE_INTEGER, hp: Number.MAX_SAFE_INTEGER };
  const attackFull = attack > 0 && attack >= tierCaps.attack;
  const hpFull = hp > 0 && hp >= tierCaps.hp;
  if (attackFull && hpFull) return "double_full";
  if (attackFull) return "attack_full";
  if (hpFull) return "hp_full";
  return "none_full";
}

function buildAdminProductFullnessEntries(products, enabled) {
  if (!enabled) return [];
  const subset = products || [];
  if (!subset.length) return [];

  const labels = {
    all: "全部",
    double_full: "双满",
    attack_full: "攻击满",
    hp_full: "血量满",
    none_full: "都不满",
  };
  const counts = { all: subset.length };
  for (const product of subset) {
    const key = getAdminProductFullnessKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderAdminProductFullnessTabs() {
  if (!adminProductFullnessTabs) return;
  const entries = Array.isArray(currentProductFacets?.fullness) ? currentProductFacets.fullness : [];
  if (entries.length <= 1) {
    adminProductFullnessTabs.classList.add("hidden");
    adminProductFullnessTabs.innerHTML = "";
    activeAdminProductFullness = "all";
    return;
  }

  const validKeys = new Set(entries.map((entry) => entry.key));
  if (!validKeys.has(activeAdminProductFullness)) {
    activeAdminProductFullness = "all";
  }

  adminProductFullnessTabs.classList.remove("hidden");
  adminProductFullnessTabs.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === activeAdminProductFullness ? "active" : ""}"
          data-admin-product-fullness="${entry.key}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
}

function filterAdminProductsByCategory(products, category) {
  if (!category || category === "all") return products || [];
  if (category === "current_season") {
    return (products || []).filter((product) => isAdminCurrentSeasonProduct(product));
  }
  if (category === "legacy_season") {
    return (products || []).filter((product) => !isAdminCurrentSeasonProduct(product));
  }
  if (category === "bundle") {
    return [];
  }
  return (products || []).filter((product) => getAdminProductTierKey(product) === category);
}

function filterAdminProductsBySubcategory(products, category, subcategory) {
  if (!category || category === "bundle") return products || [];
  if (!subcategory || subcategory === "all") return products || [];
  return (products || []).filter((product) => getAdminProductTierKey(product) === subcategory);
}

function filterAdminProductsByDetail(products, tier, detail) {
  if (!tier || tier === "all" || tier === "bundle") return products || [];
  if (!detail || detail === "all") return products || [];
  if (tier === "gold") {
    return (products || []).filter((product) => getAdminGoldSubcategory(product) === detail);
  }
  return (products || []).filter((product) => getAdminNameSubcategoryKey(product) === detail);
}

function filterAdminProductsByFullness(products, fullness) {
  if (!fullness || fullness === "all") return products || [];
  return (products || []).filter((product) => getAdminProductFullnessKey(product) === fullness);
}

function syncAdminProductFilters() {
  renderAdminProductCategoryTabs();
  renderAdminProductSubcategoryTabs();
  renderAdminProductDetailTabs();
  renderAdminProductFullnessTabs();
}

function getFilteredProducts() {
  return Array.isArray(allProducts) ? allProducts : [];
}

function getDiscountedFilteredProducts() {
  return getFilteredProducts().filter(isDiscountedProduct);
}

function getRandomDiscountCandidates() {
  return getFilteredProducts().filter(
    (product) => product.status === "on_sale" && Number(product.stock || 0) > 0
  );
}

function formatPosterCompactNumber(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0";
  const abs = Math.abs(numeric);

  if (abs >= 100000000) {
    const unitValue = abs / 100000000;
    const digits = unitValue >= 100 ? 0 : unitValue >= 10 ? 1 : 2;
    return `${numeric < 0 ? "-" : ""}${Number(unitValue.toFixed(digits))}亿`;
  }

  if (abs >= 10000) {
    const unitValue = abs / 10000;
    const digits = unitValue >= 100 ? 0 : unitValue >= 10 ? 1 : 2;
    return `${numeric < 0 ? "-" : ""}${Number(unitValue.toFixed(digits))}万`;
  }

  return String(numeric);
}

function getPosterCashAmount(quotaAmount, rechargeConfig = currentRechargeConfig) {
  return quotaToCash(quotaAmount);
}

function formatPosterCashAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "RMB 待定";
  if (Math.abs(numeric - Math.round(numeric)) < 0.001) {
    return `¥${Math.round(numeric)}`;
  }
  return `¥${numeric.toFixed(2)}`;
}

function getPosterSeasonLabel(product) {
  const explicit = String(product?.season_display || "").trim();
  if (explicit) return explicit;
  const scheduleId = Number(product?.schedule_id || 0);
  if (!scheduleId) return isAdminCurrentSeasonProduct(product) ? "当前赛季" : "往赛季";
  return `${isAdminCurrentSeasonProduct(product) ? "S" + scheduleId + " 当前赛季" : "S" + scheduleId + " 老卡"}`;
}

function getPosterTermLabel(product) {
  const extAttrs = String(product?.ext_attrs || "").trim();
  if (extAttrs && extAttrs !== "无") {
    return extAttrs.replace(/\s+/g, " ");
  }
  const mainAttrs = String(product?.main_attrs || "").trim();
  return mainAttrs || "无额外词条";
}

function isPosterSoldProduct(product) {
  return String(product?.status || "").trim() === "sold";
}

function getPosterExportProducts() {
  const selected = allProducts.filter((product) => selectedProductIds.has(Number(product.id)));
  const fallbackCount = getPosterAutoPickCount();
  const source = selected.length > 0 ? selected : getFilteredProducts().slice(0, fallbackCount);
  return [...source]
    .sort(
      (a, b) =>
        Number(b?.effective_price_quota || b?.price_quota || 0) -
        Number(a?.effective_price_quota || a?.price_quota || 0)
    )
    .slice(0, selected.length > 0 ? POSTER_EXPORT_LIMIT : fallbackCount);
}

function getPosterAutoPickCount() {
  const raw = Number(exportPosterAutoCountInput?.value || 12);
  if (!Number.isInteger(raw)) return 12;
  return Math.min(Math.max(raw, 4), POSTER_EXPORT_LIMIT);
}

async function fetchRecentConfirmedProductStats() {
  const maxPages = 3;
  const pageSize = 100;
  const stats = new Map();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = normalizePaginatedResponse(
      await apiFetch(`/admin/orders?status=confirmed&page=${page}&page_size=${pageSize}`)
    );
    const orders = Array.isArray(response.items) ? response.items : [];

    orders.forEach((order) => {
      const createdAt = String(order?.created_at || "");
      const items = Array.isArray(order?.items) ? order.items : [];
      items.forEach((item) => {
        if (String(item?.item_kind || "card") !== "card") return;
        const productId = Number(item?.product_id || 0);
        if (!productId) return;
        const current = stats.get(productId) || {
          count: 0,
          lastSoldAt: "",
        };
        current.count += 1;
        if (!current.lastSoldAt || createdAt.localeCompare(current.lastSoldAt) > 0) {
          current.lastSoldAt = createdAt;
        }
        stats.set(productId, current);
      });
    });

    if (!response.has_more) break;
  }

  return stats;
}

function rankPosterCandidates(candidates, stats, mode) {
  return [...candidates].sort((a, b) => {
    const aStats = stats.get(Number(a.id)) || { count: 0, lastSoldAt: "" };
    const bStats = stats.get(Number(b.id)) || { count: 0, lastSoldAt: "" };

    if (mode === "hot") {
      const countDiff = bStats.count - aStats.count;
      if (countDiff !== 0) return countDiff;
      const soldDiff = String(bStats.lastSoldAt || "").localeCompare(String(aStats.lastSoldAt || ""));
      if (soldDiff !== 0) return soldDiff;
      return (
        Number(b.effective_price_quota || b.price_quota || 0) -
        Number(a.effective_price_quota || a.price_quota || 0)
      );
    }

    const aUnsold = aStats.count === 0 ? 1 : 0;
    const bUnsold = bStats.count === 0 ? 1 : 0;
    if (bUnsold !== aUnsold) return bUnsold - aUnsold;
    const staleDiff = String(aStats.lastSoldAt || "").localeCompare(String(bStats.lastSoldAt || ""));
    if (staleDiff !== 0) return staleDiff;
    const priceDiff =
      Number(a.effective_price_quota || a.price_quota || 0) -
      Number(b.effective_price_quota || b.price_quota || 0);
    if (priceDiff !== 0) return priceDiff;
    return Number(b.stock || 0) - Number(a.stock || 0);
  });
}

function applyPosterSelection(products) {
  selectedProductIds.clear();
  products.forEach((product) => selectedProductIds.add(Number(product.id)));
  renderCatalogProductsSection(buildAdminPageContext(), getFilteredProducts());
}

async function autoSelectPosterProducts(mode) {
  const candidates = getFilteredProducts().filter(
    (product) => product.status === "on_sale" && Number(product.stock || 0) > 0
  );
  if (!candidates.length) {
    setMessage("当前筛选下没有可自动挑选的在售商品。", "error");
    return;
  }

  const pickCount = Math.min(getPosterAutoPickCount(), candidates.length);
  setMessage(mode === "hot" ? "正在分析最近热卖商品..." : "正在筛选冷门低价商品...");

  try {
    const stats = await fetchRecentConfirmedProductStats();
    const ranked = rankPosterCandidates(candidates, stats, mode);

    const picked = ranked.slice(0, pickCount);
    applyPosterSelection(picked);
    setMessage(
      mode === "hot"
        ? `已按最近已确认订单自动选中 ${picked.length} 件热卖商品。`
        : `已按近期少成交且价格较低的规则自动选中 ${picked.length} 件商品。`,
      "success"
    );
  } catch (error) {
    setMessage(`自动选品失败：${pickErrorMessage(error, "请稍后再试")}`, "error");
  }
}

async function autoSelectMixedPosterProducts() {
  const candidates = getFilteredProducts().filter(
    (product) => product.status === "on_sale" && Number(product.stock || 0) > 0
  );
  if (!candidates.length) {
    setMessage("当前筛选下没有可自动挑选的在售商品。", "error");
    return;
  }

  setMessage("正在组合热卖和冷门商品...");

  try {
    const pickCount = Math.min(getPosterAutoPickCount(), candidates.length);
    const hotCount = Math.ceil(pickCount / 2);
    const budgetCount = Math.floor(pickCount / 2);
    const stats = await fetchRecentConfirmedProductStats();
    const hotRanked = rankPosterCandidates(candidates, stats, "hot");
    const budgetRanked = rankPosterCandidates(candidates, stats, "budget");
    const picked = [];
    const used = new Set();

    hotRanked.forEach((product) => {
      if (picked.length >= hotCount) return;
      if (used.has(Number(product.id))) return;
      used.add(Number(product.id));
      picked.push(product);
    });

    budgetRanked.forEach((product) => {
      if (picked.length >= hotCount + budgetCount) return;
      if (used.has(Number(product.id))) return;
      used.add(Number(product.id));
      picked.push(product);
    });

    const fallbackRanked = hotRanked.concat(budgetRanked);
    fallbackRanked.forEach((product) => {
      if (picked.length >= pickCount) return;
      if (used.has(Number(product.id))) return;
      used.add(Number(product.id));
      picked.push(product);
    });

    applyPosterSelection(picked);
    setMessage(
      `已自动选中 ${picked.length} 件商品，按半热卖半冷门混合推荐。`,
      "success"
    );
  } catch (error) {
    setMessage(`混合选品失败：${pickErrorMessage(error, "请稍后再试")}`, "error");
  }
}

function createRoundedRectPath(ctx, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function fillRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundedRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function clipRoundedRect(ctx, x, y, width, height, radius) {
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.clip();
}

function fitTextToWidth(ctx, text, maxWidth) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let output = raw;
  while (output.length > 1 && ctx.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
}

function drawTextLine(ctx, text, x, y, maxWidth) {
  ctx.fillText(fitTextToWidth(ctx, text, maxWidth), x, y);
}

function measurePillWidth(ctx, text, horizontalPadding, minWidth, maxWidth) {
  const safeMaxWidth = Number.isFinite(maxWidth) ? Math.max(minWidth, maxWidth) : maxWidth;
  const fittedText = fitTextToWidth(ctx, text, safeMaxWidth - horizontalPadding * 2);
  const measuredWidth = Math.ceil(ctx.measureText(fittedText).width + horizontalPadding * 2);
  if (!Number.isFinite(safeMaxWidth)) return Math.max(minWidth, measuredWidth);
  return Math.max(minWidth, Math.min(safeMaxWidth, measuredWidth));
}

function drawShadowCard(ctx, x, y, width, height, radius, fillStyle, shadow = {}) {
  ctx.save();
  ctx.shadowColor = shadow.color || "rgba(84, 55, 28, 0.12)";
  ctx.shadowBlur = shadow.blur ?? 22;
  ctx.shadowOffsetX = shadow.offsetX ?? 0;
  ctx.shadowOffsetY = shadow.offsetY ?? 8;
  fillRoundedRect(ctx, x, y, width, height, radius, fillStyle);
  ctx.restore();
}

function setPosterFont(ctx, weight, size) {
  ctx.font = `${weight} ${size}px 'IBM Plex Sans', 'Segoe UI', sans-serif`;
}

function drawFittedText(ctx, text, x, y, maxWidth, options = {}) {
  const {
    weight = 700,
    size = 32,
    minSize = 18,
  } = options;
  let currentSize = size;
  while (currentSize > minSize) {
    setPosterFont(ctx, weight, currentSize);
    if (ctx.measureText(String(text || "").trim()).width <= maxWidth) break;
    currentSize -= 1;
  }
  drawTextLine(ctx, text, x, y, maxWidth);
  return currentSize;
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const sourceWidth = Number(image?.naturalWidth || image?.width || 0);
  const sourceHeight = Number(image?.naturalHeight || image?.height || 0);
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawPosterSoldOverlay(ctx, x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const overlayWidth = Math.min(width - 24, 224);
  const overlayHeight = 72;

  ctx.save();
  clipRoundedRect(ctx, x, y, width, height, 22);
  ctx.fillStyle = "rgba(20, 12, 10, 0.18)";
  ctx.fillRect(x, y, width, height);
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.16);
  drawShadowCard(
    ctx,
    -overlayWidth / 2,
    -overlayHeight / 2,
    overlayWidth,
    overlayHeight,
    24,
    "rgba(168, 44, 36, 0.92)",
    {
      color: "rgba(102, 20, 18, 0.3)",
      blur: 18,
      offsetY: 8,
    }
  );
  strokeRoundedRect(
    ctx,
    -overlayWidth / 2,
    -overlayHeight / 2,
    overlayWidth,
    overlayHeight,
    24,
    "rgba(255, 236, 228, 0.68)",
    2
  );
  ctx.fillStyle = "#fff8f0";
  drawFittedText(ctx, "已售出", -overlayWidth / 2 + 18, 13, overlayWidth - 36, {
    weight: 800,
    size: 38,
    minSize: 28,
  });
  ctx.restore();
}

function loadPosterImage(src) {
  const url = String(src || "").trim();
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function exportSelectedProductsPoster() {
  const products = getPosterExportProducts();
  if (!products.length) {
    setMessage("请先勾选想导出的特色商品，或先筛出一批商品。", "error");
    return;
  }

  if (exportProductPosterBtn) exportProductPosterBtn.disabled = true;
  setMessage("正在生成报价图，请稍候...");

  try {
    const title = String(exportPosterTitleInput?.value || "").trim() || "繁星功法商城 精选报价";
    const subtitle =
      String(exportPosterSubtitleInput?.value || "").trim() ||
      "热门好卡一图看清 | 残卷在上 RMB 在下";
    const footnote =
      String(exportPosterFootnoteInput?.value || "").trim() ||
      "更多商品都在繁星功法商城中，购买请进商城下单";

    const images = await Promise.all(products.map((product) => loadPosterImage(product.image_url)));
    const columns =
      products.length >= 36 ? 5 : products.length >= 16 ? 4 : products.length >= 7 ? 3 : 2;
    const canvasWidth = columns >= 5 ? 1600 : columns === 4 ? 1440 : columns === 3 ? 1280 : 1080;
    const outerPadding = 38;
    const gap = 20;
    const headerHeight = 266;
    const footerHeight = 116;
    const cardWidth = Math.floor(
      (canvasWidth - outerPadding * 2 - gap * (columns - 1)) / columns
    );
    const imageHeight = Math.round(cardWidth * 1.03);
    const contentHeight = 132;
    const priceHeight = 108;
    const cardHeight = imageHeight + contentHeight + priceHeight + 28;
    const rows = Math.ceil(products.length / columns);
    const canvasHeight =
      headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gap + footerHeight;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器不支持 canvas");

    const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    bgGradient.addColorStop(0, "#fff7ef");
    bgGradient.addColorStop(0.5, "#f7ebdc");
    bgGradient.addColorStop(1, "#efe3d1");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = "rgba(134, 105, 79, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvasWidth; x += 72) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(196, 85, 45, 0.08)";
    ctx.beginPath();
    ctx.arc(canvasWidth - 140, 88, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(114, canvasHeight - 96, 132, 0, Math.PI * 2);
    ctx.fill();

    const headerPanelX = outerPadding;
    const headerPanelY = 26;
    const headerPanelWidth = canvasWidth - outerPadding * 2;
    const headerPanelHeight = 194;
    drawShadowCard(ctx, headerPanelX, headerPanelY, headerPanelWidth, headerPanelHeight, 32, "rgba(255, 251, 246, 0.9)");
    strokeRoundedRect(ctx, headerPanelX, headerPanelY, headerPanelWidth, headerPanelHeight, 32, "rgba(125, 93, 67, 0.14)");

    const brandIconX = headerPanelX + 26;
    const brandIconY = headerPanelY + 24;
    const brandIconSize = 48;
    const brandIconGradient = ctx.createLinearGradient(
      brandIconX,
      brandIconY,
      brandIconX + brandIconSize,
      brandIconY + brandIconSize
    );
    brandIconGradient.addColorStop(0, "#1f3235");
    brandIconGradient.addColorStop(1, "#2f666d");
    drawShadowCard(ctx, brandIconX, brandIconY, brandIconSize, brandIconSize, 18, brandIconGradient, {
      color: "rgba(22, 45, 48, 0.18)",
      blur: 18,
      offsetY: 6,
    });
    ctx.strokeStyle = "rgba(255, 240, 229, 0.18)";
    ctx.lineWidth = 1;
    createRoundedRectPath(ctx, brandIconX + 3, brandIconY + 3, brandIconSize - 6, brandIconSize - 6, 15);
    ctx.stroke();
    ctx.fillStyle = "#fff3e6";
    ctx.beginPath();
    ctx.moveTo(brandIconX + 24, brandIconY + 11);
    ctx.lineTo(brandIconX + 29, brandIconY + 21);
    ctx.lineTo(brandIconX + 39, brandIconY + 24);
    ctx.lineTo(brandIconX + 29, brandIconY + 27);
    ctx.lineTo(brandIconX + 24, brandIconY + 37);
    ctx.lineTo(brandIconX + 19, brandIconY + 27);
    ctx.lineTo(brandIconX + 9, brandIconY + 24);
    ctx.lineTo(brandIconX + 19, brandIconY + 21);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd6b8";
    ctx.beginPath();
    ctx.arc(brandIconX + 33, brandIconY + 15, 4, 0, Math.PI * 2);
    ctx.fill();

    const promoWidth = 316;
    const promoHeight = 126;
    const promoX = headerPanelX + headerPanelWidth - promoWidth - 24;
    const promoY = headerPanelY + 26;
    const headerTextX = brandIconX + brandIconSize + 16;
    const headerTextWidth = promoX - headerTextX - 24;
    ctx.fillStyle = "#1f1a16";
    drawFittedText(ctx, title, headerTextX, headerPanelY + 104, headerTextWidth, {
      weight: 700,
      size: 58,
      minSize: 42,
    });
    ctx.fillStyle = "#6b5d51";
    drawFittedText(ctx, subtitle, headerTextX, headerPanelY + 144, headerTextWidth, {
      weight: 500,
      size: 25,
      minSize: 20,
    });
    setPosterFont(ctx, 600, 20);
    drawTextLine(
      ctx,
      `导出 ${products.length} 件${selectedProductIds.size > 0 ? "已选商品" : "当前筛选商品"} | ${new Date().toLocaleString("zh-CN")}`,
      headerTextX,
      headerPanelY + 176,
      headerTextWidth
    );
    const promoGradient = ctx.createLinearGradient(promoX, promoY, promoX + promoWidth, promoY + promoHeight);
    promoGradient.addColorStop(0, "#1f3235");
    promoGradient.addColorStop(1, "#2f666d");
    drawShadowCard(ctx, promoX, promoY, promoWidth, promoHeight, 28, promoGradient, {
      color: "rgba(22, 45, 48, 0.22)",
      blur: 28,
      offsetY: 10,
    });
    fillRoundedRect(ctx, promoX + 18, promoY + 18, 108, 30, 15, "rgba(255, 255, 255, 0.12)");
    ctx.fillStyle = "#fff8ef";
    ctx.font = "700 17px 'IBM Plex Sans', 'Segoe UI', sans-serif";
    ctx.fillText("购买请进商城下单", promoX + 28, promoY + 39);
    ctx.fillStyle = "#fff8ef";
    drawFittedText(ctx, POSTER_WEBSITE, promoX + 24, promoY + 82, promoWidth - 48, {
      weight: 700,
      size: 30,
      minSize: 22,
    });
    ctx.fillStyle = "rgba(255, 240, 229, 0.88)";
    setPosterFont(ctx, 600, 18);
    ctx.fillText("支持转账锁卡 / 残卷下单", promoX + 24, promoY + 110);

    for (const [index, product] of products.entries()) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const cardX = outerPadding + column * (cardWidth + gap);
      const cardY = headerHeight + row * (cardHeight + gap);
      const image = images[index];
      const tierLabel = getAdminProductTierLabelByKey(getAdminProductTierKey(product));
      const seasonLabel = getPosterSeasonLabel(product);
      const attackLabel = formatPosterCompactNumber(product.attack_value || 0);
      const hpLabel = formatPosterCompactNumber(product.hp_value || 0);
      const priceQuota = Number(product.effective_price_quota || product.price_quota || 0);
      const cashLabel = formatPosterCashAmount(getPosterCashAmount(priceQuota));
      const termLabel = getPosterTermLabel(product);
      const soldOut = isPosterSoldProduct(product);

      drawShadowCard(ctx, cardX, cardY, cardWidth, cardHeight, 28, "rgba(255, 255, 255, 0.92)");
      strokeRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 28, "rgba(125, 93, 67, 0.14)");

      const imageX = cardX + 14;
      const imageY = cardY + 14;
      const imageWidth = cardWidth - 28;
      fillRoundedRect(ctx, imageX, imageY, imageWidth, imageHeight, 22, "#f2e3cd");

      if (image) {
        ctx.save();
        clipRoundedRect(ctx, imageX, imageY, imageWidth, imageHeight, 22);
        drawCoverImage(ctx, image, imageX, imageY, imageWidth, imageHeight);
        ctx.restore();
      } else {
        const placeholderGradient = ctx.createLinearGradient(
          imageX,
          imageY,
          imageX + imageWidth,
          imageY + imageHeight
        );
        placeholderGradient.addColorStop(0, "#d8b178");
        placeholderGradient.addColorStop(1, "#596c6c");
        fillRoundedRect(ctx, imageX, imageY, imageWidth, imageHeight, 22, placeholderGradient);
        ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
        ctx.font = "700 54px 'IBM Plex Sans', 'Segoe UI', sans-serif";
        ctx.fillText(String(product.name || "?").slice(0, 1), imageX + 22, imageY + 72);
      }

      if (soldOut) {
        drawPosterSoldOverlay(ctx, imageX, imageY, imageWidth, imageHeight);
      }

      const topInset = 12;
      const topGap = 8;
      const topPillY = imageY + topInset;
      const hasDiscount = Number(product.discount_rate || 100) < 100;
      const discountPillWidth = hasDiscount ? 106 : 0;

      ctx.font = "700 20px 'IBM Plex Sans', 'Segoe UI', sans-serif";
      const tierPillWidth = measurePillWidth(ctx, tierLabel, 18, 92);
      const tierPillX = imageX + topInset;

      ctx.font = "700 18px 'IBM Plex Sans', 'Segoe UI', sans-serif";
      const seasonPillX = tierPillX + tierPillWidth + topGap;
      const seasonAvailableWidth =
        imageWidth - topInset * 2 - tierPillWidth - topGap - (hasDiscount ? discountPillWidth + topGap : 0);
      const seasonPillWidth = measurePillWidth(ctx, seasonLabel, 18, 112, seasonAvailableWidth);

      fillRoundedRect(ctx, tierPillX, topPillY, tierPillWidth, 36, 18, "rgba(31, 26, 22, 0.78)");
      fillRoundedRect(ctx, seasonPillX, topPillY, seasonPillWidth, 36, 18, "rgba(255, 247, 239, 0.88)");
      ctx.fillStyle = "#fff";
      ctx.font = "700 20px 'IBM Plex Sans', 'Segoe UI', sans-serif";
      ctx.fillText(tierLabel, tierPillX + 16, imageY + 36);
      ctx.fillStyle = "#224e52";
      ctx.font = "700 18px 'IBM Plex Sans', 'Segoe UI', sans-serif";
      drawTextLine(ctx, seasonLabel, seasonPillX + 16, imageY + 35, seasonPillWidth - 32);

      if (hasDiscount) {
        fillRoundedRect(
          ctx,
          imageX + imageWidth - 118,
          imageY + 12,
          106,
          36,
          18,
          "rgba(196, 85, 45, 0.88)"
        );
        ctx.fillStyle = "#fff";
        ctx.font = "700 18px 'IBM Plex Sans', 'Segoe UI', sans-serif";
        ctx.fillText(getDiscountLabel(product.discount_rate), imageX + imageWidth - 92, imageY + 36);
      }

      const contentX = cardX + 18;
      const contentY = imageY + imageHeight + 32;
      ctx.fillStyle = "#1f1a16";
      drawFittedText(ctx, product.name || "-", contentX, contentY, cardWidth - 36, {
        weight: 700,
        size: 32,
        minSize: 24,
      });
      ctx.fillStyle = "#6b5d51";
      setPosterFont(ctx, 600, 21);
      drawTextLine(
        ctx,
        `攻击 ${attackLabel} | 血量 ${hpLabel}`,
        contentX,
        contentY + 38,
        cardWidth - 36
      );
      fillRoundedRect(ctx, contentX, contentY + 48, Math.min(cardWidth - 36, 180), 34, 17, "rgba(239, 232, 221, 0.92)");
      ctx.fillStyle = "#5f5549";
      setPosterFont(ctx, 600, 18);
      drawTextLine(ctx, termLabel, contentX + 14, contentY + 71, cardWidth - 66);

      const priceBoxY = cardY + cardHeight - priceHeight - 14;
      fillRoundedRect(ctx, cardX + 14, priceBoxY, cardWidth - 28, priceHeight, 24, "#204246");
      fillRoundedRect(ctx, cardX + 18, priceBoxY + 52, cardWidth - 36, 42, 18, "rgba(255, 255, 255, 0.08)");

      ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
      setPosterFont(ctx, 700, 16);
      ctx.fillText("额度价", cardX + 28, priceBoxY + 26);
      ctx.fillText("RMB", cardX + 28, priceBoxY + 80);
      ctx.fillStyle = "#fff8ef";
      drawFittedText(
        ctx,
        `${formatPosterCompactNumber(priceQuota)} 额度`,
        cardX + 102,
        priceBoxY + 34,
        cardWidth - 144,
        {
          weight: 700,
          size: 34,
          minSize: 24,
        }
      );
      ctx.fillStyle = "#ffd1b8";
      drawFittedText(ctx, cashLabel, cardX + 102, priceBoxY + 83, cardWidth - 144, {
        weight: 700,
        size: 32,
        minSize: 24,
      });
    }

    const footerBarY = canvasHeight - 84;
    const footerBarHeight = 52;
    drawShadowCard(ctx, outerPadding, footerBarY, canvasWidth - outerPadding * 2, footerBarHeight, 26, "rgba(255, 250, 244, 0.92)", {
      color: "rgba(84, 55, 28, 0.08)",
      blur: 20,
      offsetY: 6,
    });
    strokeRoundedRect(ctx, outerPadding, footerBarY, canvasWidth - outerPadding * 2, footerBarHeight, 26, "rgba(125, 93, 67, 0.12)");
    ctx.fillStyle = "#6b5d51";
    setPosterFont(ctx, 500, 20);
    drawTextLine(ctx, footnote, outerPadding + 24, footerBarY + 33, canvasWidth - outerPadding * 2 - 400);
    const footerWebsiteText = `商城网址：${POSTER_WEBSITE}`;
    setPosterFont(ctx, 700, 20);
    const websiteBadgeWidth = Math.max(314, Math.ceil(ctx.measureText(footerWebsiteText).width + 44));
    const websiteBadgeX = canvasWidth - outerPadding - websiteBadgeWidth - 12;
    fillRoundedRect(ctx, websiteBadgeX, footerBarY + 8, websiteBadgeWidth, 36, 18, "#1f3235");
    ctx.fillStyle = "#fff6eb";
    drawFittedText(ctx, footerWebsiteText, websiteBadgeX + 20, footerBarY + 32, websiteBadgeWidth - 40, {
      weight: 700,
      size: 20,
      minSize: 16,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `gongfa-poster-${Date.now()}.png`;
    link.click();
    const selectedCount = allProducts.filter((product) => selectedProductIds.has(Number(product.id))).length;
    const suffix =
      selectedCount > POSTER_EXPORT_LIMIT
        ? `，已按上限导出前 ${POSTER_EXPORT_LIMIT} 件`
        : "";
    setMessage(`报价图已导出，共 ${products.length} 件商品${suffix}。`, "success");
  } catch (error) {
    setMessage(`报价图导出失败：${pickErrorMessage(error, "请稍后再试")}`, "error");
  } finally {
    if (exportProductPosterBtn) exportProductPosterBtn.disabled = false;
  }
}

async function loadQuotaLogs(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.quotaLogs.page || 1), 1);
  const query = new URLSearchParams();
  const keyword =
    options.keyword !== undefined ? options.keyword : adminQuotaLogKeywordInput?.value?.trim();
  const type =
    options.type !== undefined ? options.type : adminQuotaLogTypeFilter?.value || "all";
  const userId =
    options.userId !== undefined
      ? options.userId
      : linkedOrderUser?.id || null;

  if (keyword) query.set("keyword", keyword);
  if (type && type !== "all") query.set("type", type);
  if (userId) query.set("user_id", userId);
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.quotaLogs.pageSize));

  const response = normalizePaginatedResponse(await apiFetch(`/admin/quota-logs?${query.toString()}`));
  currentQuotaLogList = response.items;
  paginationState.quotaLogs = {
    ...paginationState.quotaLogs,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  renderQuotaLogsSection(buildAdminPageContext(), response.items);
  renderPagination(quotaLogsPaginationRoot, "quotaLogs", paginationState.quotaLogs);
}

async function loadAudits(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.audits.page || 1), 1);
  const query = new URLSearchParams();
  const keyword =
    options.keyword !== undefined ? options.keyword : adminAuditKeywordInput?.value?.trim();
  const action =
    options.action !== undefined ? options.action : adminAuditActionInput?.value?.trim();

  if (keyword) query.set("keyword", keyword);
  if (action) query.set("action", action);
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.audits.pageSize));

  const response = normalizePaginatedResponse(await apiFetch(`/admin/audit-logs?${query.toString()}`));
  currentAuditList = response.items;
  paginationState.audits = {
    ...paginationState.audits,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  renderAuditsSection(buildAdminPageContext(), response.items);
  renderPagination(auditsPaginationRoot, "audits", paginationState.audits);
}

async function loadOrders(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.orders.page || 1), 1);
  const query = new URLSearchParams();
  if (adminOrderStatusFilter.value && adminOrderStatusFilter.value !== "all") {
    query.set("status", adminOrderStatusFilter.value);
  }
  if (adminOrderKeywordInput.value.trim()) {
    query.set("keyword", adminOrderKeywordInput.value.trim());
  }
  if (linkedOrderUser?.id) {
    query.set("user_id", String(linkedOrderUser.id));
  }
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.orders.pageSize));

  const suffix = query.toString();
  const response = normalizePaginatedResponse(await apiFetch(`/admin/orders${suffix ? `?${suffix}` : ""}`));
  paginationState.orders = {
    ...paginationState.orders,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  currentOrderList = Array.isArray(response.items) ? response.items : [];
  renderOverview();
  renderOrdersListSection(buildAdminPageContext(), currentOrderList);
  renderPagination(ordersPaginationRoot, "orders", paginationState.orders);
  renderLinkedOrderUserStateSection(buildAdminPageContext());
}

async function loadRechargeOrders(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.rechargeOrders.page || 1), 1);
  const query = new URLSearchParams();
  if (adminRechargeStatusFilter?.value && adminRechargeStatusFilter.value !== "all") {
    query.set("status", adminRechargeStatusFilter.value);
  }
  if (adminRechargeKeywordInput?.value.trim()) {
    query.set("keyword", adminRechargeKeywordInput.value.trim());
  }
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.rechargeOrders.pageSize));

  const suffix = query.toString();
  const response = normalizePaginatedResponse(
    await apiFetch(`/admin/recharge-orders${suffix ? `?${suffix}` : ""}`)
  );
  paginationState.rechargeOrders = {
    ...paginationState.rechargeOrders,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  currentRechargeOrderList = Array.isArray(response.items) ? response.items : [];
  renderOverview();
  renderRechargeOrdersSection(buildAdminPageContext(), currentRechargeOrderList);
  renderPagination(
    rechargeOrdersPaginationRoot,
    "rechargeOrders",
    paginationState.rechargeOrders
  );
}

async function loadRechargeConfig() {
  const config = await apiFetch("/admin/recharge-config");
  currentRechargeConfig = config;
  renderRechargeConfigSection(buildAdminPageContext(), config);
}

async function loadAuctions() {
  const status = adminAuctionStatusFilter?.value || "all";
  const query = new URLSearchParams();
  if (status && status !== "all") {
    query.set("status", status);
  }
  const suffix = query.toString();
  try {
    const auctions = await apiFetch(`/admin/auctions${suffix ? `?${suffix}` : ""}`);
    currentAuctionList = Array.isArray(auctions) ? auctions : [];
    renderAuctionsSection(buildAdminPageContext(), currentAuctionList);
  } catch (error) {
    if (pickErrorMessage(error) === "Not Found") {
      currentAuctionList = [];
      renderAuctionsSection(buildAdminPageContext(), []);
      return;
    }
    throw error;
  }
}

function applyProductResponseState(response) {
  allProducts = Array.isArray(response?.items) ? response.items : [];
  currentProductFacets = response?.facets || {
    categories: [],
    subcategories: [],
    details: [],
    fullness: [],
  };
  currentProductSummary = response?.summary || {
    filtered_total: Number(response?.total || 0),
    discounted_total: 0,
  };
  currentProductAppliedFilters = response?.applied_filters || currentProductAppliedFilters;
  activeAdminProductCategory = currentProductAppliedFilters.category || "all";
  activeAdminProductSubcategory = currentProductAppliedFilters.subcategory || "all";
  activeAdminProductDetail = currentProductAppliedFilters.detail || "all";
  activeAdminProductFullness = currentProductAppliedFilters.fullness || "all";

  const visibleIds = new Set(allProducts.map((product) => Number(product.id)));
  [...selectedProductIds].forEach((productId) => {
    if (!visibleIds.has(Number(productId))) {
      selectedProductIds.delete(Number(productId));
    }
  });
}

async function loadProducts(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.products.page || 1), 1);
  const query = new URLSearchParams();
  const keyword =
    options.keyword !== undefined ? String(options.keyword || "").trim() : adminProductKeywordInput?.value?.trim() || "";
  const status =
    options.status !== undefined ? String(options.status || "all") : adminProductStatusFilter?.value || "all";
  const discount =
    options.discount !== undefined ? String(options.discount || "all") : adminProductDiscountFilter?.value || "all";
  const category = options.category !== undefined ? options.category : activeAdminProductCategory;
  const subcategory =
    options.subcategory !== undefined ? options.subcategory : activeAdminProductSubcategory;
  const detail = options.detail !== undefined ? options.detail : activeAdminProductDetail;
  const fullness = options.fullness !== undefined ? options.fullness : activeAdminProductFullness;

  if (keyword) query.set("keyword", keyword);
  if (status) query.set("status", status);
  if (discount) query.set("discount", discount);
  if (category) query.set("category", category);
  if (subcategory) query.set("subcategory", subcategory);
  if (detail) query.set("detail", detail);
  if (fullness) query.set("fullness", fullness);
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.products.pageSize));

  const response = normalizePaginatedResponse(await apiFetch(`/admin/products?${query.toString()}`));
  applyProductResponseState(response);
  paginationState.products = {
    ...paginationState.products,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  syncAdminProductFilters();
  renderCatalogProductsSection(buildAdminPageContext(), allProducts);
  renderPagination(productsPaginationRoot, "products", paginationState.products);
}

async function loadBundles(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.bundles.page || 1), 1);
  const query = new URLSearchParams();
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.bundles.pageSize));
  const response = normalizePaginatedResponse(await apiFetch(`/admin/bundles?${query.toString()}`));
  allBundles = response.items;
  paginationState.bundles = {
    ...paginationState.bundles,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  renderBundlesSection(buildAdminPageContext(), allBundles);
  renderPagination(bundlesPaginationRoot, "bundles", paginationState.bundles);
}

async function loadUsers(options = {}) {
  const nextPage = Math.max(Number(options.page || paginationState.users.page || 1), 1);
  const query = new URLSearchParams();
  const keyword =
    options.keyword !== undefined ? String(options.keyword || "").trim() : adminUserKeywordInput?.value?.trim() || "";
  if (keyword) query.set("keyword", keyword);
  query.set("page", String(nextPage));
  query.set("page_size", String(paginationState.users.pageSize));
  const response = normalizePaginatedResponse(await apiFetch(`/admin/users?${query.toString()}`));
  allUsers = response.items;
  paginationState.users = {
    ...paginationState.users,
    page: response.page,
    pageSize: response.page_size,
    total: response.total,
    totalPages: response.total_pages,
  };
  renderUsersSection(buildAdminPageContext(), allUsers);
  renderPagination(usersPaginationRoot, "users", paginationState.users);
}

async function loadOverviewCounts() {
  try {
    overviewData = await apiFetch("/admin/overview");
  } catch (error) {
    overviewData = {
      products: overviewData?.products || { total: 0, on_sale: 0, discounted: 0 },
      bundles: overviewData?.bundles || { total: 0 },
      users: overviewData?.users || { total: 0, active: 0, total_quota: 0 },
      alerts: {
        pending_orders: currentOrderList.filter((order) => order.status === ORDER_STATUS.PENDING).length,
        cancel_reviews: currentOrderList.filter((order) => order.status === ORDER_STATUS.CANCEL_REQUESTED).length,
        recharge_reviews: currentRechargeOrderList.filter((order) => order.status === RECHARGE_ORDER_STATUS.PENDING_REVIEW).length,
      },
    };
  }
  renderOverview();
  renderAdminAlerts();
}

async function loadBaseAdminData() {
  const profile = await apiFetch("/auth/me");
  const access = renderSession(profile);
  if (!access.canRead) {
    clearAdminAlerts();
    setMessage("当前账号没有后台查看权限。", "error");
    adminOverview.innerHTML = "";
    return false;
  }

  const [overview, rechargeConfig] = await Promise.all([
    apiFetch("/admin/overview"),
    apiFetch("/admin/recharge-config"),
  ]);

  overviewData = overview;
  allProducts = [];
  allBundles = [];
  allUsers = [];
  currentProductFacets = {
    categories: [],
    subcategories: [],
    details: [],
    fullness: [],
  };
  currentProductSummary = {
    filtered_total: 0,
    discounted_total: 0,
  };
  currentRechargeConfig = rechargeConfig;

  renderRechargeConfigSection(buildAdminPageContext(), rechargeConfig);
  renderOverview();
  renderAdminAlerts();
  startAlertPolling();
  markPageLoaded("imports");
  if (isAdminReadOnlyMode(profile)) {
    setMessage("当前账号为只读海报权限，可查看后台信息并导出广告图。", "success");
  }
  return true;
}

function buildAdminPageContext() {
  return {
    refs: {
      productsRoot,
      auctionsRoot,
      bundlesRoot,
      usersRoot,
      ordersRoot,
      quotaLogsRoot,
      auditsRoot,
      consignmentsRoot,
      adminConsignmentStatusFilter,
      reloadConsignmentsBtn,
      adminRechargeOrdersRoot,
      linkedOrderUserState,
      adminPricingControlsRoot,
      adminRechargeConfigForm,
      adminProductModal,
      adminProductModalBody,
      adminProductKeywordInput,
      adminProductStatusFilter,
      adminProductDiscountFilter,
      adminProductCategoryTabs,
      adminProductSubcategoryTabs,
      adminProductDetailTabs,
      adminProductFullnessTabs,
      adminRechargeStatusFilter,
      adminRechargeKeywordInput,
      adminUserKeywordInput,
      adminOrderStatusFilter,
      adminOrderKeywordInput,
      adminRechargeQrImageUrlInput,
      adminRechargeQrPreview,
      adminWechatQrImageUrlInput,
      adminWechatQrPreview,
      adminPricingDisplayModeSelect,
      adminRechargeEnabled,
      adminDrawServiceConfigRoot,
      adminRechargeExchangeYuanInput,
      adminRechargeExchangeQuotaInput,
      adminRechargeMinYuanInput,
      adminCurrentSeasonGoldMinDisplayCashYuanInput,
      adminResidualTransferEnabledInput,
      adminResidualAdminRoleIdInput,
      adminResidualAdminRoleNameInput,
      adminResidualAdminGameNameInput,
      adminResidualUnitLabelInput,
      adminResidualQuotaPerUnitInput,
      adminResidualPurchaseAnchorCashYuanInput,
      adminSeasonMemberEnabledInput,
      adminSeasonMemberLabelInput,
      adminSeasonMemberExpiresAtInput,
      adminSeasonMemberPriceInput,
      adminSeasonMemberQuotaInput,
      adminSeasonMemberBonusRateInput,
      adminLineupBaseSlotsInput,
      adminLineupPermanentSlotQuotaInput,
      adminLineupPermanentSlotMaxInput,
      adminLineupSeasonalSlotQuotaInput,
      adminLineupMemberBonusSlotsInput,
      adminRechargePresetsInput,
      adminRechargePayeeNameInput,
      adminRechargePayeeHintInput,
      adminWechatPayeeNameInput,
      adminWechatPayeeHintInput,
      adminRechargeInstructionsInput,
      adminResidualInstructionsInput,
      closeAdminProductModalBtn,
      adminProductModal,
      recalculatePricingBtn,
      bulkPriceInput,
      bulkStockInput,
      bulkDiscountRateInput,
      randomDiscountCountInput,
      randomDiscountRateInput,
      smartSelectHotProductsBtn,
      smartSelectBudgetProductsBtn,
      smartSelectMixedProductsBtn,
      exportProductPosterBtn,
      adminAuctionTitleInput,
      adminAuctionStartingPriceInput,
      adminAuctionMinIncrementInput,
      adminAuctionStartAtInput,
      adminAuctionEndAtInput,
      adminAuctionRemarkInput,
      adminQuotaLogTypeFilter,
      adminQuotaLogKeywordInput,
      adminAuditKeywordInput,
      adminAuditActionInput,
    },
    selectedProductIds,
    paginationState,
    markPageLoaded,
    loadProducts,
    loadBundles,
    loadAuctions,
    loadUsers,
    loadRechargeOrders,
    loadOrders,
    loadQuotaLogs,
    loadAudits,
    loadOverviewCounts,
    loadUsers,
    reloadAll,
    apiFetch,
    setMessage,
    pickErrorMessage,
    guardAdminWriteAccess,
    canConfirmOrders,
    parseNonNegativeMoneyValue,
    parseNonNegativeIntegerValue,
    parsePricingDecaySpeedValue,
    parsePricingBonusRateValue,
    parsePricingThresholdRateValue,
    parsePricingPenaltyRateValue,
    parsePricingPercentValue,
    parseDiscountRateInputValue,
    convertCashToQuota,
    convertQuotaToCash,
    getRechargeConfigDraftForPricing,
    getNormalizedPricingControls,
    getPricingDisplayMode,
    getEmptyPricingControls,
    formatEditablePricingValue,
    renderPricingControls,
    syncProductSummary,
    bulkUpdateSelectedProducts,
    bulkPatchSelectedProducts,
    restoreDiscountForProducts,
    applyRandomSelection,
    applyRandomDiscount,
    autoSelectPosterProducts,
    autoSelectMixedPosterProducts,
    exportSelectedProductsPoster,
    getSelectedAuctionProduct,
    setLinkedOrderUser,
    resetPagedState,
    activateAdminPage,
    getFilteredProducts,
    getDiscountedFilteredProducts,
    getAllProducts: () => allProducts,
    getAllBundles: () => allBundles,
    getAllUsers: () => allUsers,
    getCurrentOrderList: () => currentOrderList,
    getCurrentRechargeOrderList: () => currentRechargeOrderList,
    getCurrentAuctionList: () => currentAuctionList,
    getCurrentQuotaLogList: () => currentQuotaLogList,
    getCurrentAuditList: () => currentAuditList,
    getCurrentConsignmentList: () => currentConsignmentList,
    setCurrentConsignmentList(items) {
      currentConsignmentList = Array.isArray(items) ? items : [];
    },
    getCurrentEscrowTradeList: () => currentEscrowTradeList,
    setCurrentEscrowTradeList(items) {
      currentEscrowTradeList = Array.isArray(items) ? items : [];
    },
    getCurrentPaymentReviewList: () => currentPaymentReviewList,
    setCurrentPaymentReviewList(items) {
      currentPaymentReviewList = Array.isArray(items) ? items : [];
    },
    getCurrentRechargeConfig: () => currentRechargeConfig,
    setCurrentRechargeConfig(nextConfig) {
      currentRechargeConfig = nextConfig || null;
    },
    getDraftPricingControls: () => draftPricingControls,
    setDraftPricingControls(nextControls) {
      draftPricingControls = nextControls;
    },
    getActiveAdminProductCategory: () => activeAdminProductCategory,
    setActiveAdminProductCategory(value) {
      activeAdminProductCategory = value;
    },
    getActiveAdminProductSubcategory: () => activeAdminProductSubcategory,
    setActiveAdminProductSubcategory(value) {
      activeAdminProductSubcategory = value;
    },
    getActiveAdminProductDetail: () => activeAdminProductDetail,
    setActiveAdminProductDetail(value) {
      activeAdminProductDetail = value;
    },
    getActiveAdminProductFullness: () => activeAdminProductFullness,
    setActiveAdminProductFullness(value) {
      activeAdminProductFullness = value;
    },
    getLinkedOrderUser: () => linkedOrderUser,
    getActiveAdminPage: () => activeAdminPage,
    applyAdminAccessMode,
    isDiscountedProduct,
    normalizeDiscountRate,
    escapeHtml,
    formatDate,
    hasAdminWriteAccess,
    ORDER_STATUS,
    RECHARGE_ORDER_STATUS,
    getPricingMeta,
    renderAdminProductCover,
    renderPricingSummary,
    getDiscountLabel,
    formatQuotaCashPair,
    formatOrderStatusLabel,
    getOrderSourceLabel,
    isDrawServiceOrder,
    getDrawServiceMeta,
    formatOrderItemSnapshot,
    formatRechargeChannelLabel,
    PRICING_TIER_ORDER,
    PRICING_TIER_LABELS,
    renderLinkedOrderUserState() {
      renderLinkedOrderUserStateSection(buildAdminPageContext());
    },
    renderRechargeConfig(config) {
      renderRechargeConfigSection(buildAdminPageContext(), config);
    },
    openProductModal(product) {
      openProductModalView(buildAdminPageContext(), product);
    },
    closeProductModal() {
      closeProductModalView(buildAdminPageContext());
    },
  };
}

async function loadAdminPage(page, { force = false } = {}) {
  if (!force && loadedAdminPages.has(page)) return;
  bindAdminPageEvents(page, buildAdminPageContext());
  await loadAdminPageData(page, buildAdminPageContext());
}

async function reloadAll() {
  try {
    loadedAdminPages.clear();
    const canRead = await loadBaseAdminData();
    if (!canRead) return;
    await activateAdminPage(activeAdminPage, { force: true });
    setMessage(
      isAdminReadOnlyMode()
        ? "后台数据已刷新。当前账号为只读海报权限。"
        : "后台数据已刷新。",
      "success"
    );
  } catch (error) {
    if (pickErrorMessage(error) === "missing_token") {
      renderSession(null);
      adminOverview.innerHTML = "";
      setMessage("", "");
      return;
    }
    renderSession(null);
    adminOverview.innerHTML = "";
    setMessage(`后台加载失败：${pickErrorMessage(error, "加载失败")}`, "error");
  }
}

async function submitAdminLogin(event) {
  event.preventDefault();
  markDebugAction("login_click");
  try {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: adminLoginRoleIdInput.value.trim(),
        password: adminLoginPasswordInput.value,
      }),
    });

    saveSession({
      token: result.token,
      profile: result.user,
    });
    markDebugSession(`login_ok role=${result.user?.role || "-"}`);
    adminLoginPasswordInput.value = "";
    setMessage("后台登录成功。", "success");
    await reloadAll();
  } catch (error) {
    markDebugError(`login_failed ${pickErrorMessage(error, "login_failed")}`);
    setMessage(`后台登录失败：${pickErrorMessage(error, "登录失败")}`, "error");
  }
}

function logoutAdmin() {
  clearAdminAlerts();
  clearSession();
  adminLoginPasswordInput.value = "";
  renderSession(null);
  adminOverview.innerHTML = "";
  setMessage("已退出后台登录。", "success");
}

async function submitImport(event) {
  event.preventDefault();
  if (!guardAdminWriteAccess()) return;
  markDebugAction("import_click");
  if (importSubmitBtn) {
    importSubmitBtn.disabled = true;
    importSubmitBtn.textContent = "导入中...";
  }
  setMessage("正在导入商品，请稍等...", "success");
  try {
    const result = await apiFetch("/admin/imports/cards-json", {
      method: "POST",
      body: JSON.stringify({
        source_type: "upload",
        source_file_name: importFileNameInput.value.trim() || null,
        raw_json: importJsonInput.value,
      }),
    });
    markDebugAction(`import_ok count=${result.parsed_count}`);
    setMessage(`导入完成，共解析 ${result.parsed_count} 个商品。`, "success");
    await reloadAll();
  } catch (error) {
    markDebugError(`import_failed ${pickErrorMessage(error, "import_failed")}`);
    setMessage(`导入失败：${pickErrorMessage(error, "导入失败")}`, "error");
  } finally {
    if (importSubmitBtn) {
      importSubmitBtn.disabled = false;
      importSubmitBtn.textContent = "导入并生成商品";
    }
  }
}

function addCurrentImportToBatch() {
  if (!guardAdminWriteAccess()) return;
  const rawJson = String(importJsonInput?.value || "").trim();
  if (!rawJson) {
    setMessage("请先粘贴一份 JSON，再加入批量导入。", "error");
    return;
  }
  const entry = buildPendingImportEntry(importFileNameInput?.value, rawJson);
  pendingImportEntries.push(entry);
  renderPendingImportEntries();
  setMessage(`已加入批量导入：${entry.source_file_name}`, "success");
}

async function appendImportFiles(files) {
  const inputFiles = Array.from(files || []);
  if (inputFiles.length === 0) return;
  const loadedEntries = [];
  for (const file of inputFiles) {
    const rawJson = await file.text();
    loadedEntries.push(buildPendingImportEntry(file.name, rawJson));
  }
  pendingImportEntries.push(...loadedEntries);
  renderPendingImportEntries();
  setMessage(`已加入 ${loadedEntries.length} 份 JSON 到批量导入。`, "success");
  if (importBatchFileInput) {
    importBatchFileInput.value = "";
  }
}

function clearPendingImportEntries() {
  pendingImportEntries = [];
  renderPendingImportEntries();
  if (importBatchFileInput) {
    importBatchFileInput.value = "";
  }
  setMessage("已清空批量导入队列。", "success");
}

async function appendHelperInventoryImportFiles(files) {
  const inputFiles = Array.from(files || []);
  if (inputFiles.length === 0) return;
  const loadedEntries = [];
  for (const file of inputFiles) {
    const rawJson = await file.text();
    loadedEntries.push(buildPendingHelperInventoryEntry(file.name, rawJson));
  }
  pendingHelperInventoryEntries.push(...loadedEntries);
  renderPendingHelperInventoryEntries();
  setMessage(`已加入 ${loadedEntries.length} 份功法 JSON 到双炉子导入队列。`, "success");
  if (helperImportFileInput) {
    helperImportFileInput.value = "";
  }
}

function clearPendingHelperInventoryEntries() {
  pendingHelperInventoryEntries = [];
  renderPendingHelperInventoryEntries();
  if (helperImportFileInput) {
    helperImportFileInput.value = "";
  }
  setMessage("已清空功法仓库导入队列。", "success");
}

async function submitImportBatch() {
  if (!guardAdminWriteAccess()) return;
  if (pendingImportEntries.length === 0) {
    setMessage("请先加入至少一份 JSON 到批量导入。", "error");
    return;
  }
  if (importBatchSubmitBtn) {
    importBatchSubmitBtn.disabled = true;
    importBatchSubmitBtn.textContent = "批量导入中...";
  }
  setMessage(`正在批量导入 ${pendingImportEntries.length} 份 JSON，请稍等...`, "success");
  try {
    const result = await apiFetch("/admin/imports/cards-json-batch", {
      method: "POST",
      body: JSON.stringify({
        imports: pendingImportEntries.map((entry) => ({
          source_type: "upload",
          source_file_name: entry.source_file_name,
          raw_json: entry.raw_json,
        })),
      }),
    });
    markDebugAction(`import_batch_ok count=${result.parsed_count}`);
    setMessage(
      `批量导入完成，共合并 ${result.batch_file_count || pendingImportEntries.length} 份 JSON，解析 ${result.parsed_count} 个商品。`,
      "success"
    );
    pendingImportEntries = [];
    renderPendingImportEntries();
    await reloadAll();
  } catch (error) {
    markDebugError(`import_batch_failed ${pickErrorMessage(error, "import_batch_failed")}`);
    setMessage(`批量导入失败：${pickErrorMessage(error, "导入失败")}`, "error");
  } finally {
    if (importBatchSubmitBtn) {
      importBatchSubmitBtn.disabled = false;
      importBatchSubmitBtn.textContent = "批量合并导入";
    }
  }
}

async function submitHelperInventoryImportBatch(importProducts = false) {
  if (!guardAdminWriteAccess()) return;
  if (pendingHelperInventoryEntries.length === 0) {
    setMessage("请先加入至少一份功法 JSON 到双炉子导入队列。", "error");
    return;
  }
  if (helperImportSubmitBtn) {
    helperImportSubmitBtn.disabled = true;
    helperImportSubmitBtn.textContent = importProducts ? "导入中..." : "导入中...";
  }
  if (helperImportSubmitProductsBtn) {
    helperImportSubmitProductsBtn.disabled = true;
    helperImportSubmitProductsBtn.textContent = importProducts ? "生成中..." : "导入并生成商品";
  }
  setMessage(
    importProducts
      ? `正在导入 ${pendingHelperInventoryEntries.length} 份功法 JSON，并生成商城商品，请稍等...`
      : `正在导入 ${pendingHelperInventoryEntries.length} 份功法 JSON 到功法仓库，请稍等...`,
    "success"
  );
  try {
    const result = await apiFetch("/admin/imports/helper-inventories-json-batch", {
      method: "POST",
      body: JSON.stringify({
        imports: pendingHelperInventoryEntries.map((entry) => ({
          source_file_name: entry.source_file_name,
          raw_json: entry.raw_json,
        })),
        import_products: Boolean(importProducts),
      }),
    });
    const importedInventoryCount = Number(
      result?.imported_inventory_count || pendingHelperInventoryEntries.length || 0
    );
    const removedInventoryCount = Number(result?.removed_inventory_count || 0);
    const mergedItemCount = Number(result?.merged_item_count || 0);
    const productParsedCount = Number(result?.product_import?.parsed_count || 0);
    markDebugAction(
      importProducts
        ? `helper_inventory_batch_ok inventories=${importedInventoryCount} products=${productParsedCount}`
        : `helper_inventory_batch_ok inventories=${importedInventoryCount}`
    );
    setMessage(
      importProducts
        ? `功法仓库导入完成，共写入 ${importedInventoryCount} 个炉子库存，清掉 ${removedInventoryCount} 个旧炉子库存，合并后 ${mergedItemCount} 个功法分组，并生成 ${productParsedCount} 个商品分组。`
        : `功法仓库导入完成，共写入 ${importedInventoryCount} 个炉子库存，清掉 ${removedInventoryCount} 个旧炉子库存，合并后 ${mergedItemCount} 个功法分组。`,
      "success"
    );
    pendingHelperInventoryEntries = [];
    renderPendingHelperInventoryEntries();
    await reloadAll();
  } catch (error) {
    markDebugError(`helper_inventory_batch_failed ${pickErrorMessage(error, "helper_inventory_batch_failed")}`);
    setMessage(`功法仓库导入失败：${pickErrorMessage(error, "导入失败")}`, "error");
  } finally {
    if (helperImportSubmitBtn) {
      helperImportSubmitBtn.disabled = false;
      helperImportSubmitBtn.textContent = "导入到功法仓库";
    }
    if (helperImportSubmitProductsBtn) {
      helperImportSubmitProductsBtn.disabled = false;
      helperImportSubmitProductsBtn.textContent = "导入并生成商品";
    }
  }
}

async function loadSampleJson() {
  try {
    const response = await fetch("./legacy-json/legacy_getinfo-2026-03-16T14-58-06.json");
    if (!response.ok) {
      throw new Error(`load_sample_failed_${response.status}`);
    }
    importJsonInput.value = await response.text();
    importFileNameInput.value = "legacy_getinfo-2026-03-16T14-58-06.json";
    setMessage("已载入示例 JSON。", "success");
  } catch (error) {
    setMessage(`载入示例失败：${pickErrorMessage(error, "载入失败")}`, "error");
  }
}

async function bulkUpdateSelectedProducts(status) {
  if (!guardAdminWriteAccess()) return;
  const productIds = [...selectedProductIds];
  if (productIds.length === 0) {
    setMessage("请先选择商品。", "error");
    return;
  }

  try {
    const result = await apiFetch("/admin/products/bulk-status", {
      method: "PATCH",
      body: JSON.stringify({
        product_ids: productIds,
        status,
      }),
    });
    setMessage(`批量操作完成，已更新 ${result.updated_count} 个商品。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`批量操作失败：${pickErrorMessage(error, "操作失败")}`, "error");
  }
}

async function bulkPatchSelectedProducts(patch) {
  if (!guardAdminWriteAccess()) return;
  const productIds = [...selectedProductIds];
  if (productIds.length === 0) {
    setMessage("请先选择商品。", "error");
    return;
  }

  try {
    const result = await apiFetch("/admin/products/bulk-update", {
      method: "PATCH",
      body: JSON.stringify({
        product_ids: productIds,
        ...patch,
      }),
    });
    setMessage(`批量更新完成，已更新 ${result.updated_count} 个商品。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`批量更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
}

async function restoreDiscountForProducts(products) {
  if (!guardAdminWriteAccess()) return;
  const productIds = [...new Set((products || []).map((product) => Number(product.id)).filter(Boolean))];
  if (productIds.length === 0) {
    setMessage("当前没有可恢复原价的商品。", "error");
    return;
  }

  try {
    const result = await apiFetch("/admin/products/bulk-update", {
      method: "PATCH",
      body: JSON.stringify({
        product_ids: productIds,
        discount_rate: 100,
      }),
    });
    setMessage(`已恢复 ${result.updated_count} 个商品的原价。`, "success");
    await reloadAll();
  } catch (error) {
    setMessage(`恢复原价失败：${pickErrorMessage(error, "恢复失败")}`, "error");
  }
}

function applyRandomSelection() {
  const count = parsePositiveCountInputValue(randomDiscountCountInput?.value);
  if (!count) {
    setMessage("随机件数必须是大于 0 的整数。", "error");
    return [];
  }

  const candidates = getRandomDiscountCandidates();
  if (!candidates.length) {
    setMessage("当前筛选下没有可随机打折的在售商品。", "error");
    return [];
  }

  const picked = sampleProducts(candidates, Math.min(count, candidates.length));
  selectedProductIds.clear();
  picked.forEach((product) => selectedProductIds.add(product.id));
  renderCatalogProductsSection(buildAdminPageContext(), getFilteredProducts());
  setMessage(`已随机选中 ${picked.length} 个商品。`, "success");
  return picked;
}

async function applyRandomDiscount() {
  if (!guardAdminWriteAccess()) return;
  const discountRate = parseDiscountRateInputValue(randomDiscountRateInput?.value);
  if (!discountRate) {
    setMessage("随机折扣率必须是 1 到 100 之间的整数。", "error");
    return;
  }

  const picked = applyRandomSelection();
  if (!picked.length) return;

  await bulkPatchSelectedProducts({ discount_rate: discountRate });
}

adminLoginForm?.addEventListener("submit", submitAdminLogin);
adminLoginBtn?.addEventListener("click", () => {
  submitAdminLogin({
    preventDefault() {},
  });
});
adminLogoutBtn?.addEventListener("click", logoutAdmin);
importForm?.addEventListener("submit", submitImport);
importSubmitBtn?.addEventListener("click", () => {
  submitImport({
    preventDefault() {},
  });
});
document.getElementById("load-sample-json-btn")?.addEventListener("click", loadSampleJson);
importBatchAddBtn?.addEventListener("click", addCurrentImportToBatch);
importBatchClearBtn?.addEventListener("click", clearPendingImportEntries);
importBatchSubmitBtn?.addEventListener("click", submitImportBatch);
importBatchFileInput?.addEventListener("change", async (event) => {
  try {
    await appendImportFiles(event.target?.files || []);
  } catch (error) {
    setMessage(`读取 JSON 文件失败：${pickErrorMessage(error, "读取失败")}`, "error");
  }
});
importBatchList?.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-import-entry-btn");
  if (!button) return;
  const entryId = button.getAttribute("data-import-entry-id");
  if (!entryId) return;
  pendingImportEntries = pendingImportEntries.filter((entry) => entry.id !== entryId);
  renderPendingImportEntries();
  setMessage("已移除这份 JSON。", "success");
});
helperImportClearBtn?.addEventListener("click", clearPendingHelperInventoryEntries);
helperImportSubmitBtn?.addEventListener("click", () => {
  submitHelperInventoryImportBatch(false);
});
helperImportSubmitProductsBtn?.addEventListener("click", () => {
  submitHelperInventoryImportBatch(true);
});
helperImportFileInput?.addEventListener("change", async (event) => {
  try {
    await appendHelperInventoryImportFiles(event.target?.files || []);
  } catch (error) {
    setMessage(`读取功法 JSON 文件失败：${pickErrorMessage(error, "读取失败")}`, "error");
  }
});
helperImportList?.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-helper-import-entry-btn");
  if (!button) return;
  const entryId = button.getAttribute("data-helper-import-entry-id");
  if (!entryId) return;
  pendingHelperInventoryEntries = pendingHelperInventoryEntries.filter((entry) => entry.id !== entryId);
  renderPendingHelperInventoryEntries();
  setMessage("已移除这份功法 JSON。", "success");
});
document.getElementById("reload-admin-btn")?.addEventListener("click", reloadAll);
adminPageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextPage = button.getAttribute("data-admin-page-tab");
    if (!nextPage) return;
    activateAdminPage(nextPage).catch((error) => {
      setMessage(`页面加载失败：${pickErrorMessage(error, "加载失败")}`, "error");
    });
  });
});
closeAdminProductModalBtn?.addEventListener("click", () => {
  closeProductModalView(buildAdminPageContext());
});
adminProductModal?.addEventListener("click", (event) => {
  if (event.target === adminProductModal) {
    closeProductModalView(buildAdminPageContext());
  }
});
document.addEventListener("click", (event) => {
  const alertButton = event.target.closest("[data-alert-target]");
  if (alertButton) {
    const target = alertButton.getAttribute("data-alert-target");
    const status = alertButton.getAttribute("data-alert-status") || "all";

    if (target === "orders") {
      if (adminOrderStatusFilter) {
        adminOrderStatusFilter.value = status;
      }
      resetPagedState("orders");
      activateAdminPage("orders", { force: true })
        .then(() => {
          document.querySelector('[data-admin-page-panel="orders"]')?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          setMessage(`已跳转到${status === ORDER_STATUS.CANCEL_REQUESTED ? "取消审核" : "待处理"}订单。`, "success");
        })
        .catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
      return;
    }

    if (target === "recharge") {
      if (adminRechargeStatusFilter) {
        adminRechargeStatusFilter.value = status;
      }
      resetPagedState("rechargeOrders");
      activateAdminPage("recharge", { force: true })
        .then(() => {
          document.querySelector('[data-recharge-subpage="orders"]')?.click();
          document.querySelector('[data-admin-page-panel="recharge"]')?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          setMessage("已跳转到待审核充值。", "success");
        })
        .catch((error) => setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error"));
      return;
    }
  }

  if (event.target.closest("#refresh-alert-counts-btn")) {
    loadOverviewCounts().catch((error) =>
      setMessage(`提醒刷新失败：${pickErrorMessage(error, "刷新失败")}`, "error")
    );
    return;
  }

  const button = event.target.closest("[data-pagination-target][data-pagination-page]");
  if (!button) return;

  const target = button.getAttribute("data-pagination-target");
  const page = Number(button.getAttribute("data-pagination-page"));
  if (!target || !Number.isInteger(page) || page < 1) return;

  if (target === "orders") {
    loadOrders({ page }).catch((error) => setMessage(`订单加载失败：${pickErrorMessage(error)}`, "error"));
    return;
  }
  if (target === "products") {
    loadProducts({ page }).catch((error) => setMessage(`商品加载失败：${pickErrorMessage(error)}`, "error"));
    return;
  }
  if (target === "users") {
    loadUsers({ page }).catch((error) => setMessage(`用户加载失败：${pickErrorMessage(error)}`, "error"));
    return;
  }
  if (target === "bundles") {
    loadBundles({ page }).catch((error) => setMessage(`套餐加载失败：${pickErrorMessage(error)}`, "error"));
    return;
  }
  if (target === "rechargeOrders") {
    loadRechargeOrders({ page }).catch((error) =>
      setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error")
    );
    return;
  }
  if (target === "quotaLogs") {
    loadQuotaLogs({ page }).catch((error) => setMessage(`额度流水加载失败：${pickErrorMessage(error)}`, "error"));
    return;
  }
  if (target === "audits") {
    loadAudits({ page }).catch((error) => setMessage(`审计日志加载失败：${pickErrorMessage(error)}`, "error"));
  }
});

markDebugAction("page_loaded_v20260320a");
markDebugSession(loadSession()?.token ? "token_present" : "no_token");
markDebugError("none");
renderPendingImportEntries();
renderPendingHelperInventoryEntries();
window.__adminModuleReady = true;
reloadAll();
