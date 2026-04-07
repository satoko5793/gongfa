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
} from "./shared.js?v=20260406-lineup-ui31";

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
const accountPasswordPanel = document.getElementById("account-password-panel");
const accountPasswordForm = document.getElementById("account-password-form");
const accountCurrentPasswordInput = document.getElementById("account-current-password");
const accountNewPasswordInput = document.getElementById("account-new-password");
const accountConfirmPasswordInput = document.getElementById("account-confirm-password");
const rechargeBody = document.getElementById("recharge-body");
const rechargeOrderList = document.getElementById("recharge-order-list");
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
const accountSecurityTabButton = document.querySelector('[data-account-tab="security"]');
const pageDockItems = Array.from(document.querySelectorAll("[data-dock-target]"));
const discountDockButton = document.querySelector('[data-dock-target="discount-products-section"]');
const mobileAdminLink = document.getElementById("mobile-admin-link");

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
let selectedDrawServiceAmount = 200;
let productSearchTimer = null;
let discountSearchTimer = null;
let activeAuthTab = "register";
let activeAccountTab = "overview";
let activeDockTarget = "products";
let activeGuidePage = "tutorial";
let recentSalesItems = [];
let currentAuctions = [];
let currentAuctionBidSummaries = [];
let activeAuctionStatus = "live";
let currentHelperBindings = [];
let currentHelperInventories = [];
let currentHelperMergedItems = [];
let currentHelperSnapshots = [];
let currentHelperActionLogs = [];
let currentHelperRestorePreview = null;
let currentHelperRestoreProgress = null;
let pendingHelperPreviewSnapshotId = null;
let expandedHelperSnapshotIds = new Set();
let showArchivedHelperSnapshots = false;
let helperInventorySyncState = {
  running: false,
  mode: "",
  queue: [],
  total: 0,
  completed: 0,
  failures: [],
  currentBindingId: null,
};
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
  },
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
const DRAW_SERVICE_MILESTONE_QUOTA = 50000;
const DRAW_SERVICE_FIRST_REBATE_QUOTA = 10000;
const DRAW_SERVICE_REPEAT_REBATE_QUOTA = 5000;
const AUCTION_COUNTDOWN_TICK_MS = 1000;
const POST_AUTH_TARGET_KEY = "gongfa_post_auth_target_v1";
const HELPER_CACHE_BUSTER = "20260405-helper-positionfix-1";
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
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function hasSnapshotExactLegionResearch(snapshot) {
  const role = getSnapshotRoleObject(snapshot);
  const legionResearch =
    role?.legionResearch && typeof role.legionResearch === "object" ? role.legionResearch : {};
  return Object.keys(legionResearch).length > 0;
}

function getSnapshotAttachmentOwnershipCount(snapshot) {
  return getSnapshotRawHeroes(snapshot).filter((hero) =>
    Boolean(normalizeHelperAttachmentUid(hero?.attachment_uid))
  ).length;
}

function hasSnapshotRestoreFlags(snapshot) {
  const restoreFlags = snapshot?.summary?.restore_flags;
  return Boolean(restoreFlags && typeof restoreFlags === "object");
}

function isSnapshotSafeRestoreReady(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;
  if (!hasSnapshotRestoreFlags(snapshot)) return false;
  const rawHeroes = getSnapshotRawHeroes(snapshot);
  if (!rawHeroes.length) return false;
  return rawHeroes.some((hero) => Boolean(normalizeHelperAttachmentUid(hero?.attachment_uid)));
}

function getSnapshotSafeRestoreBlockReason(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return "未找到目标快照，请先刷新阵容快照列表。";
  }
  if (!hasSnapshotRestoreFlags(snapshot)) {
    return "这份快照是旧版结构，缺少安全恢复需要的标记，请先重新读取一份新快照。";
  }
  const rawHeroes = getSnapshotRawHeroes(snapshot);
  if (!rawHeroes.length) {
    return "这份快照没有可恢复的武将数据，请重新读取一份新快照。";
  }
  if (!rawHeroes.some((hero) => Boolean(normalizeHelperAttachmentUid(hero?.attachment_uid)))) {
    return "这份快照没有记录洗练归属，无法安全恢复到正确武将，请重新读取一份新快照。";
  }
  const summaryTechCount = Number(snapshot?.summary?.legion_research_count || 0);
  if (summaryTechCount > 0 && !hasSnapshotExactLegionResearch(snapshot)) {
    return "这份快照只记录了科技摘要，没有保存原始科技等级，暂时无法精确恢复科技，请先重新保存当前阵容。";
  }
  return "";
}

function getSnapshotAttachmentOwnershipMap(snapshot) {
  const currentTeamById = new Map();
  getSnapshotRawHeroes(snapshot).forEach((hero) => {
    const heroId = Number(hero?.hero_id || 0);
    if (heroId > 0) currentTeamById.set(heroId, hero);
  });

  const byAttachment = new Map();
  Object.entries(getSnapshotRoleHeroes(snapshot)).forEach(([key, hero]) => {
    const heroId = Number(hero?.heroId || hero?.id || key || 0);
    const attachmentUid = normalizeHelperAttachmentUid(hero?.attachmentUid);
    if (!heroId || !attachmentUid) return;
    const teamHero = currentTeamById.get(heroId);
    byAttachment.set(attachmentUid, {
      attachment_uid: attachmentUid,
      hero_id: heroId,
      hero_name:
        String(teamHero?.hero_name || hero?.heroName || hero?.name || "").trim() ||
        `武将${heroId}`,
      slot: teamHero ? Number(teamHero?.slot ?? 0) : null,
      in_team: Boolean(teamHero),
    });
  });

  return {
    byAttachment,
  };
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
  const summary = snapshot?.summary || {};
  const teamInfo = getSnapshotCurrentTeamInfo(snapshot);
  const pearlMap = getSnapshotPearlMap(snapshot);
  const role = getSnapshotRoleObject(snapshot);
  const weaponInfo = getSnapshotWeaponInfo(snapshot);
  const heroes = getSnapshotRawHeroes(snapshot)
    .map((hero) => {
      const slot = Number(hero?.slot ?? 0);
      const teamHero = teamInfo?.[slot] || teamInfo?.[String(slot)] || {};
      const pearlId = Number(teamHero?.pearlId || 0) || null;
      const pearlData = pearlId ? pearlMap?.[pearlId] || {} : {};
      return {
        position: slot,
        hero_id: Number(hero?.hero_id || 0),
        hero_name: String(hero?.hero_name || "").trim(),
        level: Number(hero?.level || 0) || 0,
        attachment_uid: normalizeHelperAttachmentUid(hero?.attachment_uid),
        pearl_id: pearlId,
        skill_id: Number(pearlData?.skillId || 0) || null,
      };
    })
    .filter((hero) => Number(hero.hero_id || 0) > 0);

  return {
    snapshot_id: Number(snapshot?.id || 0) || null,
    snapshot_name: buildHelperSnapshotName(snapshot),
    team_id: Number(summary?.use_team_id || 0) || 0,
    role_name: String(summary?.role_name || "").trim(),
    server: String(summary?.server || "").trim(),
    weapon_id: Number(weaponInfo?.id || 0) || null,
    legion_research:
      role?.legionResearch && typeof role.legionResearch === "object" ? role.legionResearch : {},
    heroes,
  };
}

function getSnapshotRestoreCapabilities(snapshot) {
  const rawHeroes = getSnapshotRawHeroes(snapshot);
  const summaryFlags = snapshot?.summary?.restore_flags || {};
  const role = getSnapshotRoleObject(snapshot);
  const weaponInfo = getSnapshotWeaponInfo(snapshot);
  const techCount = getSnapshotLegionResearchCount(snapshot);
  const attachmentOwnershipCount = getSnapshotAttachmentOwnershipCount(snapshot);
  const hasHeroes = rawHeroes.length > 0;
  const hasLevels =
    Boolean(summaryFlags.hero_levels) || rawHeroes.some((hero) => Number(hero?.level || 0) > 0);
  const hasAttachmentOwnership =
    Boolean(summaryFlags.attachment_ownership) || attachmentOwnershipCount > 0;
  const hasArtifacts =
    Boolean(summaryFlags.artifacts) ||
    rawHeroes.some((hero) => Boolean(hero?.artifact_id || hero?.fish_name));
  const hasPearlSkills =
    Boolean(summaryFlags.pearl_skills) ||
    rawHeroes.some((hero) => Boolean(hero?.pearl_skill_name || hero?.skillId));
  const hasQuench =
    Boolean(summaryFlags.equipment_quench) ||
    rawHeroes.some((hero) =>
      Array.isArray(hero?.equipment)
        ? hero.equipment.some((part) => Array.isArray(part?.slots) && part.slots.length > 0)
        : false
    );
  const hasResearch =
    Boolean(summaryFlags.legion_research) && hasSnapshotExactLegionResearch(snapshot);
  const techSummaryOnly = techCount > 0 && !hasSnapshotExactLegionResearch(snapshot);
  const hasWeapon = Boolean(summaryFlags.weapon) || Boolean(weaponInfo);

  return [
    {
      key: "heroes",
      label: "武将站位",
      status: hasHeroes ? "ready" : "missing",
      note: hasHeroes ? "helper 已有上下阵、换位和阵容槽切换编排" : "当前快照缺少可用武将数据",
    },
    {
      key: "hero_levels",
      label: "武将等级",
      status: hasLevels ? "ready" : "missing",
      note: hasLevels ? "helper 已有升级、进阶、重生回放逻辑" : "当前快照没有可靠等级数据",
    },
    {
      key: "attachment_ownership",
      label: "洗练归属",
      status: hasAttachmentOwnership ? "ready" : "missing",
      note: hasAttachmentOwnership
        ? `当前快照记录了 ${attachmentOwnershipCount} 个洗练归属标识，helper 会先把对应套装换回目标武将，再继续站位和等级恢复`
        : "当前快照没有洗练归属标识，无法可靠预演“这套洗练该跟谁走”",
    },
    {
      key: "artifacts",
      label: "鱼灵佩戴",
      status: hasArtifacts ? "ready" : "missing",
      note: hasArtifacts ? "helper 已有鱼灵装卸逻辑" : "当前快照没有鱼灵配置",
    },
    {
      key: "pearl_skills",
      label: "鱼珠技能",
      status: hasPearlSkills ? "ready" : "missing",
      note: hasPearlSkills ? "helper 已有替换、交换、卸下技能逻辑" : "当前快照没有鱼珠技能配置",
    },
    {
      key: "legion_research",
      label: "俱乐部科技",
      status: hasResearch ? "ready" : techSummaryOnly ? "recorded" : "missing",
      note: hasResearch
        ? `当前快照记录了 ${techCount} 项科技`
        : techSummaryOnly
          ? `摘要里显示有 ${techCount} 项科技，但这份快照缺少原始科技等级，请重新保存一次阵容`
          : "当前快照没有科技数据",
    },
    {
      key: "weapon",
      label: "主玩具",
      status: hasWeapon ? "ready" : "missing",
      note: hasWeapon ? `当前快照记录了 ${weaponInfo?.name || "主玩具"}` : "当前快照没有主玩具数据",
    },
    {
      key: "equipment_quench",
      label: "装备洗练",
      status: hasQuench ? "recorded" : "missing",
      note: hasQuench ? "已记录孔位与属性，helper 有独立淬炼工具，商城暂未接自动恢复" : "当前快照没有洗练孔位数据",
    },
  ];
}

function buildHelperSnapshotRestoreSummaryText(snapshot) {
  const capabilities = getSnapshotRestoreCapabilities(snapshot);
  const readyLabels = capabilities
    .filter((item) => item.status === "ready")
    .map((item) => item.label);
  const recordedLabels = capabilities
    .filter((item) => item.status === "recorded")
    .map((item) => `${item.label}已记录`);
  return [...readyLabels, ...recordedLabels].join("、") || "仅完成基础记录";
}

function buildHelperSnapshotCapabilityMarkup(snapshot) {
  return getSnapshotRestoreCapabilities(snapshot)
    .map((item) => {
      const statusLabel =
        item.status === "ready" ? "可恢复" : item.status === "recorded" ? "已记录" : "缺数据";
      return `
        <article class="helper-capability-card ${item.status}">
          <div class="helper-capability-head">
            <strong>${escapeHtml(item.label)}</strong>
            <span class="helper-capability-state">${escapeHtml(statusLabel)}</span>
          </div>
          <div class="helper-capability-note">${escapeHtml(item.note)}</div>
        </article>
      `;
    })
    .join("");
}

function normalizePreviewHeroMap(snapshot) {
  const heroes = getSnapshotRawHeroes(snapshot);
  const byId = new Map();
  const bySlot = new Map();
  const byAttachment = new Map();
  heroes.forEach((hero) => {
    const heroId = Number(hero?.hero_id || 0);
    const slot = Number(hero?.slot ?? 0);
    const attachmentUid = normalizeHelperAttachmentUid(hero?.attachment_uid);
    if (heroId > 0) byId.set(heroId, hero);
    bySlot.set(slot, hero);
    if (attachmentUid) byAttachment.set(attachmentUid, hero);
  });
  return { heroes, byId, bySlot, byAttachment };
}

function compareLegionResearch(targetSnapshot, liveSnapshot) {
  const targetRole = getSnapshotRoleObject(targetSnapshot);
  const liveRole = getSnapshotRoleObject(liveSnapshot);
  const targetResearch =
    targetRole?.legionResearch && typeof targetRole.legionResearch === "object"
      ? targetRole.legionResearch
      : {};
  const liveResearch =
    liveRole?.legionResearch && typeof liveRole.legionResearch === "object"
      ? liveRole.legionResearch
      : {};
  const changedIds = new Set(
    [...Object.keys(targetResearch), ...Object.keys(liveResearch)].filter(
      (key) => Number(targetResearch[key] || 0) !== Number(liveResearch[key] || 0)
    )
  );
  return {
    targetCount: Object.keys(targetResearch).length,
    liveCount: Object.keys(liveResearch).length,
    changedCount: changedIds.size,
  };
}

function buildHelperRestorePreview(targetSnapshot, liveSnapshot) {
  const targetSummary = targetSnapshot?.summary || {};
  const liveSummary = liveSnapshot?.summary || {};
  const target = normalizePreviewHeroMap(targetSnapshot);
  const live = normalizePreviewHeroMap(liveSnapshot);
  const liveAttachmentMap = getSnapshotAttachmentOwnershipMap(liveSnapshot);
  const steps = [];
  const warnings = [];
  const safeCounts = {
    hero_slots: 0,
    hero_levels: 0,
    attachment_transfers: 0,
    artifacts: 0,
    pearl_skills: 0,
    weapon: 0,
    legion_research: 0,
  };
  let recordedOnlyCount = 0;

  if (Number(targetSummary?.use_team_id || 0) !== Number(liveSummary?.use_team_id || 0)) {
    steps.push({
      type: "safe",
      label: "阵容槽位",
      description: `当前识别为阵容 ${liveSummary?.use_team_id || "-"}，目标快照记录的是阵容 ${targetSummary?.use_team_id || "-"}`,
    });
    safeCounts.hero_slots += 1;
  }

  live.heroes.forEach((hero) => {
    if (!target.byId.has(Number(hero?.hero_id || 0))) {
      steps.push({
        type: "safe",
        label: "下阵武将",
        description: `当前阵容里多出 ${hero?.hero_name || `武将${hero?.hero_id || "-"}`}，正式恢复时会先将其移出目标阵容。`,
      });
      safeCounts.hero_slots += 1;
    }
  });

  target.heroes.forEach((targetHero) => {
    const heroId = Number(targetHero?.hero_id || 0);
    const targetSlot = Number(targetHero?.slot ?? 0);
    const targetAttachmentUid = normalizeHelperAttachmentUid(targetHero?.attachment_uid);
    const currentHero = live.byId.get(heroId);
    const currentSlotHero = live.bySlot.get(targetSlot);
    const currentAttachmentHolder = targetAttachmentUid
      ? liveAttachmentMap.byAttachment.get(targetAttachmentUid)
      : null;

    if (targetAttachmentUid && currentAttachmentHolder && currentAttachmentHolder.hero_id !== heroId) {
      const holderLocation = currentAttachmentHolder.in_team
        ? `${currentAttachmentHolder.hero_name}（当前阵容位置 ${formatHelperBattleSlot(currentAttachmentHolder.slot)}）`
        : `${currentAttachmentHolder.hero_name}（当前不在上阵位）`;
      steps.push({
        type: "ownership",
        label: "迁移洗练套归属",
        description: `${targetHero?.hero_name || `武将${heroId}`} 目标绑定的是洗练归属 #${targetAttachmentUid}，这套当前在 ${holderLocation} 身上。真实恢复时 helper 会先通过换将/临时上阵把这套洗练归回 ${targetHero?.hero_name || `武将${heroId}`}，再继续站位和等级操作。`,
      });
      safeCounts.attachment_transfers += 1;
    } else if (targetAttachmentUid && !currentAttachmentHolder) {
      recordedOnlyCount += 1;
      warnings.push(
        `${targetHero?.hero_name || `武将${heroId}`} 目标需要洗练归属 #${targetAttachmentUid}，但当前角色列表里没有找到持有者，正式恢复时可能无法把对应洗练套归回。`
      );
    }

    if (!currentHero) {
      steps.push({
        type: "safe",
        label: "上阵武将",
        description: `需要把 ${targetHero?.hero_name || `武将${heroId}`} 上阵到位置 ${formatHelperBattleSlot(targetSlot)}。`,
      });
      safeCounts.hero_slots += 1;
    } else if (Number(currentHero?.slot ?? 0) !== targetSlot) {
      steps.push({
        type: "safe",
        label: "调整站位",
        description: `${targetHero?.hero_name || `武将${heroId}`} 当前在位置 ${formatHelperBattleSlot(currentHero?.slot)}，目标位置是 ${formatHelperBattleSlot(targetSlot)}。`,
      });
      safeCounts.hero_slots += 1;
    } else if (currentSlotHero && Number(currentSlotHero?.hero_id || 0) !== heroId) {
      steps.push({
        type: "safe",
        label: "修正站位",
        description: `位置 ${formatHelperBattleSlot(targetSlot)} 当前是 ${currentSlotHero?.hero_name || `武将${currentSlotHero?.hero_id || "-"}`}，目标应为 ${targetHero?.hero_name || `武将${heroId}`}。`,
      });
      safeCounts.hero_slots += 1;
    }

    const targetLevel = Number(targetHero?.level || 0);
    const liveLevel = Number(currentHero?.level || 0);
    if (targetLevel > 0 && targetLevel !== liveLevel) {
      steps.push({
        type: "safe",
        label: "调整等级",
        description:
          targetLevel > liveLevel
            ? `${targetHero?.hero_name || `武将${heroId}`} 需要从 Lv.${liveLevel || 0} 提升到 Lv.${targetLevel}。`
            : `${targetHero?.hero_name || `武将${heroId}`} 当前 Lv.${liveLevel || 0}，目标快照是 Lv.${targetLevel}，helper 会走重生后再升回的逻辑。`,
      });
      safeCounts.hero_levels += 1;
    }

    const targetFish = String(targetHero?.fish_name || "").trim();
    const liveFish = String(currentHero?.fish_name || "").trim();
    if ((targetFish || liveFish) && targetFish !== liveFish) {
      steps.push({
        type: "safe",
        label: "切换鱼灵",
        description: `${targetHero?.hero_name || `武将${heroId}`} 当前鱼灵是 ${liveFish || "未佩戴"}，目标是 ${targetFish || "未佩戴"}。`,
      });
      safeCounts.artifacts += 1;
    }

    const targetSkill = String(targetHero?.pearl_skill_name || "").trim();
    const liveSkill = String(currentHero?.pearl_skill_name || "").trim();
    if ((targetSkill || liveSkill) && targetSkill !== liveSkill) {
      steps.push({
        type: "safe",
        label: "切换鱼珠技能",
        description: `${targetHero?.hero_name || `武将${heroId}`} 当前鱼珠技能是 ${liveSkill || "未装配"}，目标是 ${targetSkill || "未装配"}。`,
      });
      safeCounts.pearl_skills += 1;
    }

    const targetEquip = JSON.stringify(Array.isArray(targetHero?.equipment) ? targetHero.equipment : []);
    const liveEquip = JSON.stringify(Array.isArray(currentHero?.equipment) ? currentHero.equipment : []);
    if (targetEquip !== liveEquip && targetEquip !== "[]") {
      if (!targetAttachmentUid) {
        recordedOnlyCount += 1;
        warnings.push(
          `${targetHero?.hero_name || `武将${heroId}`} 记录了洗练孔位，但没有洗练归属标识。商城现在无法判断这套洗练该跟着谁走，只能提示人工确认。`
        );
      } else if (!currentAttachmentHolder) {
        recordedOnlyCount += 1;
        warnings.push(
          `${targetHero?.hero_name || `武将${heroId}`} 的洗练孔位已记录，但当前没有找到归属 #${targetAttachmentUid} 的持有者，无法确认是否还能按原套装恢复。`
        );
      } else if (currentAttachmentHolder.hero_id === heroId) {
        recordedOnlyCount += 1;
        warnings.push(
          `${targetHero?.hero_name || `武将${heroId}`} 当前已经持有洗练归属 #${targetAttachmentUid}，但孔位属性和快照仍有差异。这通常表示原套装内容后来被改过，商城暂时不能把洗练数值回滚到快照状态。`
        );
      }
    }
  });

  const targetWeapon = getSnapshotWeaponInfo(targetSnapshot);
  const liveWeapon = getSnapshotWeaponInfo(liveSnapshot);
  if ((targetWeapon?.id || targetWeapon?.name) && (targetWeapon?.id !== liveWeapon?.id || targetWeapon?.name !== liveWeapon?.name)) {
    steps.push({
      type: "safe",
      label: "切换主玩具",
      description: `当前主玩具是 ${liveWeapon?.name || "未识别"}，目标快照是 ${targetWeapon?.name || "未识别"}。`,
    });
    safeCounts.weapon += 1;
  }

  const researchDiff = compareLegionResearch(targetSnapshot, liveSnapshot);
  if (researchDiff.changedCount > 0) {
    steps.push({
      type: "safe",
      label: "同步俱乐部科技",
      description: `检测到 ${researchDiff.changedCount} 项科技等级差异，helper 已有“重置后重建”的同步逻辑。`,
    });
    safeCounts.legion_research = researchDiff.changedCount;
  }

  return {
    target_snapshot_id: Number(targetSnapshot?.id || 0),
    target_snapshot_name: buildHelperSnapshotName(targetSnapshot),
    target_summary: targetSummary,
    live_summary: liveSummary,
    safe_counts: safeCounts,
    safe_step_count: Object.values(safeCounts).reduce((sum, value) => sum + Number(value || 0), 0),
    recorded_only_count: recordedOnlyCount,
    steps,
    warnings: Array.from(new Set(warnings)),
  };
}

function buildHelperFishSlotsMarkup(fishSlots) {
  if (!Array.isArray(fishSlots) || !fishSlots.length) {
    return '<div class="stack-item">鱼珠孔位：-</div>';
  }
  return `
    <div class="helper-inline-chip-row">
      ${fishSlots
        .map((slot) => {
          const colorMeta = getHelperSlotColorMeta(slot?.color_id || slot?.colorId || 0);
          const attrText = `${getHelperAttrName(slot?.attr_id || slot?.attrId || 0)}+${Number(slot?.attr_num || slot?.attrNum || 0)}`;
          return `<span class="helper-slot-chip ${escapeHtml(colorMeta.tone)}">${escapeHtml(colorMeta.label)} · ${escapeHtml(attrText)}</span>`;
        })
        .join("")}
    </div>
  `;
}

function buildHelperEquipmentMarkup(equipment) {
  if (!Array.isArray(equipment) || !equipment.length) {
    return '<div class="stack-item">洗练：当前快照没有更细的装备孔位数据。</div>';
  }
  return equipment
    .map((part) => {
      const slots = Array.isArray(part?.slots) ? part.slots : [];
      const bonusParts = [];
      if (Number(part?.bonus_attack || 0) > 0) bonusParts.push(`攻+${Number(part.bonus_attack)}`);
      if (Number(part?.bonus_defense || 0) > 0) bonusParts.push(`防+${Number(part.bonus_defense)}`);
      if (Number(part?.bonus_hp || 0) > 0) bonusParts.push(`血+${Number(part.bonus_hp)}`);
      return `
        <div class="helper-equip-part">
          <div class="helper-equip-part-head">
            <strong>${escapeHtml(HELPER_EQUIPMENT_PART_NAMES[Number(part?.part_id || 0)] || `部位${Number(part?.part_id || 0)}`)}</strong>
            <span>淬炼 ${escapeHtml(Number(part?.quench_times || 0))} 次</span>
            <span>${escapeHtml(bonusParts.join(" / ") || "暂无额外加成")}</span>
          </div>
          <div class="helper-inline-chip-row">
            ${
              slots.length
                ? slots
                    .map((slot) => {
                      const colorMeta = getHelperSlotColorMeta(slot?.color_id || 0);
                      const attrText = `${getHelperAttrName(slot?.attr_id || 0)}+${Number(slot?.attr_num || 0)}`;
                      const lockText = slot?.is_locked ? " · 锁" : "";
                      return `<span class="helper-slot-chip ${escapeHtml(colorMeta.tone)}">${escapeHtml(colorMeta.label)} · ${escapeHtml(attrText + lockText)}</span>`;
                    })
                    .join("")
                : '<span class="helper-chip">暂无孔位</span>'
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function buildHelperFishSlotsSummary(fishSlots) {
  if (!Array.isArray(fishSlots) || !fishSlots.length) {
    return "鱼珠孔位未记录";
  }
  const colorCounts = new Map();
  fishSlots.forEach((slot) => {
    const colorMeta = getHelperSlotColorMeta(slot?.color_id || slot?.colorId || 0);
    const label = colorMeta.label || "其他";
    colorCounts.set(label, Number(colorCounts.get(label) || 0) + 1);
  });
  const topColors = Array.from(colorCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label]) => label)
    .join(" / ");
  return topColors || "鱼珠孔位未记录";
}

function buildHelperEquipmentSummary(equipment) {
  if (!Array.isArray(equipment) || !equipment.length) {
    return "洗练细节未记录";
  }
  let totalQuench = 0;
  let totalSlots = 0;
  let lockedSlots = 0;
  equipment.forEach((part) => {
    totalQuench += Number(part?.quench_times || 0);
    const slots = Array.isArray(part?.slots) ? part.slots : [];
    totalSlots += slots.length;
    lockedSlots += slots.filter((slot) => Boolean(slot?.is_locked)).length;
  });
  const details = [`淬炼 ${totalQuench}`];
  if (totalSlots > 0) details.push(`孔位 ${totalSlots}`);
  if (lockedSlots > 0) details.push(`锁孔 ${lockedSlots}`);
  return details.join(" · ");
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
  return Boolean(helperConfig?.enabled && helperConfig?.features?.scan_bind);
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
  try {
    window.sessionStorage.setItem(POST_AUTH_TARGET_KEY, "account");
  } catch {
    // Ignore storage write failures in private or restricted contexts.
  }
}

function consumePostAuthAccountFocus() {
  try {
    const target = window.sessionStorage.getItem(POST_AUTH_TARGET_KEY);
    if (target !== "account") return false;
    window.sessionStorage.removeItem(POST_AUTH_TARGET_KEY);
    return true;
  } catch {
    return false;
  }
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
  const allowedTabs = new Set(["overview", "profile", "security", "recharge", "orders"]);
  let nextTab = allowedTabs.has(tab) ? tab : "overview";
  if (nextTab === "security" && accountSecurityTabButton?.classList.contains("hidden")) {
    nextTab = "overview";
  }
  activeAccountTab = nextTab;
  accountTabButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-account-tab") === activeAccountTab);
  });
  accountTabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-account-panel") !== activeAccountTab);
  });
  if (scroll) {
    accountSection?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function syncAccountTabWithHash() {
  const hash = String(window.location.hash || "").replace(/^#/, "");
  const hashMap = {
    account: "overview",
    "recharge-panel": "recharge",
    "help-panel": "orders",
    "order-panel": "orders",
  };
  if (!hashMap[hash]) return;
  activateAccountTab(hashMap[hash]);
}

function getDockSections() {
  return [
    { key: "products", node: productsSection },
    { key: "discount-products-section", node: discountProductsSection },
    { key: "account", node: accountSection },
    { key: "helper-lab", node: helperLabSection },
    { key: "auction-zone", node: auctionZoneSection },
    { key: "draw-service-zone", node: drawServiceZoneSection },
  ].filter((entry) => entry.node && !entry.node.classList.contains("hidden"));
}

function getScrollOffset() {
  const headerHeight = document.querySelector(".app-header")?.offsetHeight || 0;
  return headerHeight + 28;
}

function setActiveDockTarget(target) {
  activeDockTarget = target;
  pageDockItems.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-dock-target") === target);
  });
}

function scrollSectionIntoView(section) {
  if (!section) return;
  const top = window.scrollY + section.getBoundingClientRect().top - getScrollOffset();
  window.scrollTo({
    top: Math.max(top, 0),
    behavior: "smooth",
  });
}

function navigateWithDock(target) {
  if (target === "account") {
    window.location.hash = "account";
    activateAccountTab("overview");
    scrollSectionIntoView(accountSection);
    setActiveDockTarget(target);
    return;
  }
  const section = document.getElementById(target);
  if (!section) return;
  if (target === "products") {
    window.location.hash = "products";
  } else if (target === "discount-products-section") {
    window.location.hash = "discount-products-section";
  } else {
    window.location.hash = target;
  }
  scrollSectionIntoView(section);
  setActiveDockTarget(target);
}

function syncDiscountDockVisibility(hasDiscounts) {
  if (!discountDockButton) return;
  discountDockButton.classList.toggle("hidden", !hasDiscounts);
  if (!hasDiscounts && activeDockTarget === "discount-products-section") {
    setActiveDockTarget("products");
  }
}

function syncDockWithViewport() {
  const sections = getDockSections();
  if (!sections.length) return;
  const probe = window.scrollY + getScrollOffset() + Math.min(window.innerHeight * 0.22, 140);
  let nextActive = sections[0].key;
  sections.forEach((entry) => {
    const top = window.scrollY + entry.node.getBoundingClientRect().top;
    if (top <= probe) {
      nextActive = entry.key;
    }
  });
  if (nextActive !== activeDockTarget) {
    setActiveDockTarget(nextActive);
  }
}

function updateShellVisibility(profile) {
  const loggedIn = Boolean(profile);
  const isAdmin = profile?.role === "admin" || profile?.role === "poster_admin";
  const canChangePassword = loggedIn && profile?.auth_provider === "password";
  navBindLink?.classList.toggle("hidden", loggedIn);
  navAdminLink?.classList.toggle("hidden", !isAdmin);
  mobileAdminLink?.classList.toggle("hidden", !isAdmin);
  bindSection?.classList.toggle("hidden", loggedIn);
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
}

function setProductDetailMessage(text, type = "") {
  productDetailMessage.textContent = text || "";
  productDetailMessage.className = type ? `notice ${type}` : "notice";
}

function pickErrorMessage(error, fallback) {
  const details = error?.payload?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.join(", ");
  }
  return error?.payload?.error || error?.message || fallback;
}

function getCurrentQuotaValue() {
  const value = Number(String(quotaBalance.textContent || "").trim());
  return Number.isFinite(value) ? value : null;
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
  renderHelperTeamSwitchPanel();
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

function setHelperRestoreProgress(progress) {
  currentHelperRestoreProgress = progress && typeof progress === "object" ? { ...progress } : null;
  renderHelperRestoreProgressPanel();
}

function buildHelperRestoreProgressMarkup(progress) {
  if (!progress) return "";
  const percent = Math.max(0, Math.min(100, Number(progress?.percent || 0)));
  const status = String(progress?.status || "running").trim() || "running";
  const label = String(progress?.label || "正在还原").trim() || "正在还原";
  const detail = String(progress?.detail || "").trim();
  return `
    <div class="helper-restore-progress-card ${escapeHtml(status)}">
      <div class="helper-restore-progress-head">
        <div>
          <div class="helper-snapshot-kicker">还原进度</div>
          <strong class="helper-snapshot-title">${escapeHtml(label)}</strong>
        </div>
        <span class="helper-chip">${escapeHtml(`${percent}%`)}</span>
      </div>
      <div class="helper-progress-track" aria-hidden="true">
        <div class="helper-progress-fill" style="width:${percent}%"></div>
      </div>
      <div class="helper-status-meta">${escapeHtml(detail || "系统正在执行阵容恢复，请保持页面打开。")}</div>
    </div>
  `;
}

function renderHelperRestoreProgressPanel() {
  if (!helperRestoreProgressCurrent) return;
  if (!currentHelperRestoreProgress) {
    helperRestoreProgressCurrent.innerHTML = "";
    helperRestoreProgressCurrent.classList.add("hidden");
    return;
  }
  helperRestoreProgressCurrent.innerHTML = buildHelperRestoreProgressMarkup(currentHelperRestoreProgress);
  helperRestoreProgressCurrent.classList.remove("hidden");
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
  if (!helperOpenAuthPopupBtn || !helperAuthNote) return;
  const enabled = isHelperScanAuthEnabled();
  helperOpenAuthPopupBtn.disabled = !enabled;
  helperAuthNote.textContent = enabled
    ? "直接用微信扫码选择角色，商城会自动进入对应账号。之后阵容保存和一键还原也会默认跟着这个角色走。"
    : "当前环境还没有开放扫码进入，请先用密码登录。";
  if (enabled && helperAuthMessage?.classList.contains("error") && helperAuthMessage.textContent.includes("未开启")) {
    setHelperAuthMessage("");
  }
}

function renderHelperBindingPanel() {
  if (!helperBindCurrent) return;
  const bindings = Array.isArray(currentHelperBindings) ? currentHelperBindings : [];
  const activeBinding = syncActiveHelperBindingPreference();
  const draft = pendingHelperBridgePayload;

  if (!draft && !activeBinding) {
    helperBindCurrent.innerHTML = `
      <div class="helper-status-card">
        <div class="helper-status-main">
          <strong>还没有绑定角色</strong>
          <div class="muted">先扫码一次，后面的阵容保存和一键还原都会自动跟着这个角色走。</div>
        </div>
      </div>
    `;
    return;
  }

  const parts = [];
  if (draft) {
    parts.push(`
      <div class="helper-status-card pending">
        <div class="helper-status-main">
          <span class="helper-status-badge">待确认</span>
          <strong>${escapeHtml(normalizeHelperDisplayRoleName(draft.game_role_name, draft.game_role_id) || "-")}</strong>
          <div class="muted">${escapeHtml(draft.game_server || "-")} / 角色 ID ${escapeHtml(draft.game_role_id || "-")}</div>
        </div>
        <div class="helper-status-meta">这一步只是把扫码结果带回商城，点“确认绑定”后才会正式生效。</div>
      </div>
    `);
  }
  if (activeBinding) {
    parts.push(`
      <div class="helper-status-card ready helper-status-card-active">
        <div class="helper-status-main">
          <span class="helper-status-badge">当前使用</span>
          <strong>${escapeHtml(normalizeHelperDisplayRoleName(activeBinding.game_role_name, activeBinding.game_role_id) || "-")}</strong>
          <div class="muted">${escapeHtml(activeBinding.game_server || "-")} / 角色 ID ${escapeHtml(activeBinding.game_role_id || "-")}</div>
        </div>
        <div class="helper-status-meta">最近更新：${escapeHtml(formatDate(activeBinding.updated_at))}</div>
        <div class="actions">
          <button type="button" class="ghost helper-remove-binding-btn" data-helper-binding-id="${Number(activeBinding.id || 0)}">解绑角色</button>
        </div>
      </div>
    `);
  }
  const otherBindings = bindings.filter((item) => Number(item?.id || 0) !== Number(activeBinding?.id || 0));
  if (otherBindings.length) {
    parts.push(`
      <div class="helper-bind-selection">
        <div class="helper-binding-list-title">已绑定的其他角色</div>
        <div class="helper-binding-list">
          ${otherBindings
            .map(
              (binding) => `
                <article class="helper-status-card helper-status-card-compact">
                  <div class="helper-status-main">
                    <span class="helper-status-badge">已绑定</span>
                    <strong>${escapeHtml(normalizeHelperDisplayRoleName(binding.game_role_name, binding.game_role_id) || "-")}</strong>
                    <div class="muted">${escapeHtml(binding.game_server || "-")} / 角色 ID ${escapeHtml(binding.game_role_id || "-")}</div>
                  </div>
                  <div class="helper-status-meta">最近更新：${escapeHtml(formatDate(binding.updated_at))}</div>
                  <div class="actions">
                    <button type="button" class="ghost helper-set-active-binding-btn" data-helper-binding-id="${Number(binding.id || 0)}">设为当前使用</button>
                    <button type="button" class="ghost helper-remove-binding-btn" data-helper-binding-id="${Number(binding.id || 0)}">解绑角色</button>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `);
  }
  helperBindCurrent.innerHTML = parts.join("");
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

function buildHelperInventoryItemMarkup(item, { compact = false } = {}) {
  const name = String(item?.display_name || "功法").trim() || "功法";
  const imageUrl = getHelperInventoryImageUrl(item);
  const subtitle = [`攻 ${Number(item?.attack_value || 0) || "-"}`, `血 ${Number(item?.hp_value || 0) || "-"}`]
    .filter(Boolean)
    .join(" / ");
  const attrSummary = [String(item?.main_attr_text || "").trim(), String(item?.ext_attr_text || "").trim()]
    .filter((value) => value && value !== "无")
    .join(" · ");
  const metaChips = [
    Number(item?.total_count || 0) > 1 ? `×${Number(item.total_count)}` : "",
    item?.has_ext ? "带词条" : "",
    item?.max ? "双满" : "",
  ]
    .filter(Boolean)
    .map((chip) => `<span class="helper-chip">${escapeHtml(chip)}</span>`)
    .join("");
  const sourceMarkup = Array.isArray(item?.source_roles)
    ? `<div class="helper-inventory-sources">${item.source_roles
        .map(
          (role) =>
            `<span class="helper-chip helper-chip-soft">${escapeHtml(role?.role_name || "-")} ×${escapeHtml(role?.count || 1)}</span>`
        )
        .join("")}</div>`
    : "";
  return `
    <article class="helper-inventory-item ${compact ? "compact" : ""}">
      ${
        imageUrl
          ? `<img class="helper-inventory-item-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" loading="lazy" />`
          : `<div class="helper-inventory-item-image placeholder">${escapeHtml(name.slice(0, 2))}</div>`
      }
      <div class="helper-inventory-item-body">
        <div class="helper-inventory-item-name">${escapeHtml(name)}</div>
        <div class="helper-inventory-item-meta">${escapeHtml(subtitle)}</div>
        ${attrSummary ? `<div class="helper-inventory-item-attrs">${escapeHtml(attrSummary)}</div>` : ""}
        ${metaChips ? `<div class="helper-inventory-item-chips">${metaChips}</div>` : ""}
        ${compact ? "" : sourceMarkup}
      </div>
    </article>
  `;
}

function renderHelperInventoryPanel() {
  if (!helperInventoryBindings || !helperInventoryMerged) return;
  const bindings = Array.isArray(currentHelperBindings) ? currentHelperBindings : [];
  const activeBinding = getActiveHelperBinding();
  const inventories = Array.isArray(currentHelperInventories) ? currentHelperInventories : [];
  const mergedItems = Array.isArray(currentHelperMergedItems) ? currentHelperMergedItems : [];

  if (!currentProfile || !isHelperInventoryEnabled()) {
    helperInventoryBindings.innerHTML =
      '<div class="stack-item">绑定多个角色后，就能在这里分别看到每个炉子的功法库存。</div>';
    helperInventoryMerged.innerHTML =
      '<div class="stack-item">同步完成后，这里会展示多个炉子合并后的总仓库。</div>';
    if (helperSyncCurrentInventoryBtn) helperSyncCurrentInventoryBtn.disabled = true;
    if (helperSyncAllInventoryBtn) helperSyncAllInventoryBtn.disabled = true;
    setHelperInventoryMessage("", "");
    return;
  }

  if (helperSyncCurrentInventoryBtn) {
    helperSyncCurrentInventoryBtn.disabled = !activeBinding || helperInventorySyncState.running;
    helperSyncCurrentInventoryBtn.textContent =
      helperInventorySyncState.running && helperInventorySyncState.mode === "current"
        ? "同步中..."
        : "同步当前号功法";
  }
  if (helperSyncAllInventoryBtn) {
    helperSyncAllInventoryBtn.disabled = !bindings.length || helperInventorySyncState.running;
    helperSyncAllInventoryBtn.textContent =
      helperInventorySyncState.running && helperInventorySyncState.mode === "all"
        ? `同步中 ${helperInventorySyncState.completed}/${helperInventorySyncState.total || 0}`
        : "同步全部炉子";
  }

  if (!bindings.length) {
    helperInventoryBindings.innerHTML =
      '<div class="stack-item">先绑定至少一个游戏角色，才能同步各个炉子的功法库存。</div>';
  } else {
    helperInventoryBindings.innerHTML = bindings
      .map((binding) => {
        const inventory = getHelperInventoryBinding(binding?.id);
        const count = Number(inventory?.summary?.legacy_count || (inventory?.items || []).length || 0);
        const fragmentCount = Number(inventory?.summary?.fragment_count || 0);
        const updatedAt = inventory?.updated_at || inventory?.summary?.synced_at || binding?.updated_at;
        const isCurrent = Number(binding?.id || 0) === Number(activeBinding?.id || 0);
        const syncingThisOne =
          helperInventorySyncState.running &&
          Number(helperInventorySyncState.currentBindingId || 0) === Number(binding?.id || 0);
        return `
          <article class="helper-inventory-binding-card ${isCurrent ? "active" : ""}">
            <div class="helper-inventory-binding-head">
              <div>
                <div class="helper-snapshot-kicker">${isCurrent ? "当前使用" : "已绑定角色"}</div>
                <strong>${escapeHtml(normalizeHelperDisplayRoleName(binding?.game_role_name, binding?.game_role_id) || "-")}</strong>
                <div class="muted">${escapeHtml(binding?.game_server || "-")} / 角色 ID ${escapeHtml(binding?.game_role_id || "-")}</div>
              </div>
              <div class="helper-inventory-binding-summary">
                <strong>${count}</strong>
                <span>张功法</span>
              </div>
            </div>
            <div class="helper-hero-meta helper-hero-meta-soft">
              <span class="helper-chip">残卷 ${fragmentCount}</span>
              <span class="helper-chip">${escapeHtml(updatedAt ? `${formatDate(updatedAt)} 同步` : "未同步")}</span>
            </div>
            ${
              inventory?.items?.length
                ? `<div class="helper-inventory-binding-preview">${inventory.items
                    .slice(0, 4)
                    .map((item) => buildHelperInventoryItemMarkup(item, { compact: true }))
                    .join("")}</div>`
                : '<div class="helper-status-meta">还没有同步过这个角色的功法库存。</div>'
            }
            <div class="actions">
              <button type="button" class="ghost helper-sync-binding-inventory-btn" data-helper-binding-id="${Number(binding?.id || 0)}">
                ${syncingThisOne ? "同步中..." : "同步这个炉子"}
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  if (!mergedItems.length) {
    helperInventoryMerged.innerHTML =
      '<div class="stack-item">还没有任何炉子完成同步。先点“同步当前号功法”或“同步全部炉子”，总仓库就会出现在这里。</div>';
    return;
  }

  const totalCardCount = mergedItems.reduce((sum, item) => sum + Number(item?.total_count || 0), 0);
  helperInventoryMerged.innerHTML = `
    <div class="helper-inventory-merged-head">
      <div class="helper-snapshot-kicker">合并总仓库</div>
      <div class="muted">共 ${mergedItems.length} 种功法 / ${totalCardCount} 张，后面自动发货会从这里选对应炉子。</div>
    </div>
    <div class="helper-inventory-grid">
      ${mergedItems.map((item) => buildHelperInventoryItemMarkup(item)).join("")}
    </div>
  `;
}

function buildHelperSnapshotName(snapshot) {
  const explicitName = String(snapshot?.snapshot_name || "").trim();
  if (explicitName) return explicitName;
  const summary = snapshot?.summary || {};
  const roleName = String(summary?.role_name || summary?.roleName || "阵容").trim() || "阵容";
  const teamId = Number(summary?.use_team_id || summary?.useTeamId || 0);
  if (teamId > 0) return `${roleName} · ${teamId}号阵容`;
  return `${roleName} · 云端存档`;
}

function formatRelativeTime(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes <= 0) return "刚刚保存";
  if (diffMinutes < 60) return `${diffMinutes} 分钟前保存`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} 小时前保存`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} 天前保存`;
  return `${formatDate(value)} 保存`;
}

function formatRelativeActionTime(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes <= 0) return "刚刚执行";
  if (diffMinutes < 60) return `${diffMinutes} 分钟前执行`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} 小时前执行`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} 天前执行`;
  return `${formatDate(value)} 执行`;
}

function formatHelperBattleSlot(slot) {
  const numericSlot = Number(slot);
  if (!Number.isInteger(numericSlot) || numericSlot < 0) return "-";
  return String(numericSlot + 1);
}

function sortHelperSnapshotsList(list) {
  return [...(list || [])].sort((left, right) => {
    const pinDiff = Number(Boolean(right?.is_pinned)) - Number(Boolean(left?.is_pinned));
    if (pinDiff !== 0) return pinDiff;
    return String(right?.updated_at || right?.created_at || "").localeCompare(
      String(left?.updated_at || left?.created_at || "")
    );
  });
}

function getHelperSnapshotIdentityKey(snapshot) {
  const summary = snapshot?.summary || {};
  return [
    String(summary?.role_id || summary?.roleId || "").trim(),
    String(summary?.server || "").trim(),
    Number(summary?.use_team_id || summary?.useTeamId || 0) || 0,
  ].join("::");
}

function getHelperSnapshotFreshnessScore(snapshot) {
  const summary = snapshot?.summary || {};
  return (
    Number(summary?.hero_count || 0) * 1000 +
    getSnapshotLegionResearchCount(snapshot) * 10 +
    getSnapshotAttachmentOwnershipCount(snapshot)
  );
}

function partitionHelperSnapshots(list) {
  const ordered = sortHelperSnapshotsList(list);
  const winnerByKey = new Map();

  ordered.forEach((snapshot) => {
    const key = getHelperSnapshotIdentityKey(snapshot);
    const score = getHelperSnapshotFreshnessScore(snapshot);
    const createdAt = String(snapshot?.created_at || snapshot?.updated_at || "");
    const current = winnerByKey.get(key);
    if (!current || score > current.score || (score === current.score && createdAt > current.createdAt)) {
      winnerByKey.set(key, {
        id: Number(snapshot?.id || 0),
        score,
        createdAt,
      });
    }
  });

  const active = [];
  const archived = [];
  ordered.forEach((snapshot) => {
    const key = getHelperSnapshotIdentityKey(snapshot);
    const winner = winnerByKey.get(key);
    if (winner && winner.id === Number(snapshot?.id || 0)) {
      active.push(snapshot);
    } else {
      archived.push(snapshot);
    }
  });

  return { active, archived };
}

function buildHelperSnapshotHeroStripMarkup(snapshot) {
  const heroes = getSnapshotRawHeroes(snapshot).slice(0, 6);
  if (!heroes.length) {
    return '<div class="helper-hero-strip-empty">暂无武将摘要</div>';
  }
  return heroes
    .map((hero) => {
      const avatarUrl = getHeroAvatarUrl(hero);
      const heroName = String(hero?.hero_name || "武将").trim() || "武将";
      const fishName = String(hero?.fish_name || "").trim();
      const pearlSkillName = String(hero?.pearl_skill_name || "").trim();
      const miniMeta = fishName || pearlSkillName ? [fishName, pearlSkillName].filter(Boolean).join(" · ") : `Lv.${hero?.level || 0}`;
      return `
        <article class="helper-hero-mini">
          <span class="helper-hero-mini-slot">${escapeHtml(formatHelperBattleSlot(hero?.slot))}号位</span>
          ${
            avatarUrl
              ? `<img class="helper-hero-mini-avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(heroName)}" loading="lazy" />`
              : `<div class="helper-hero-mini-avatar placeholder">${escapeHtml(heroName.slice(0, 2))}</div>`
          }
          <div class="helper-hero-mini-body">
            <span class="helper-hero-mini-name">${escapeHtml(heroName)}</span>
            <span class="helper-hero-mini-meta">${escapeHtml(miniMeta)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function buildHelperSnapshotDetailMarkup(snapshot) {
  const summary = snapshot?.summary || {};
  const heroes = getSnapshotRawHeroes(snapshot);
  const weaponInfo = getSnapshotWeaponInfo(snapshot);
  const techCount = getSnapshotLegionResearchCount(snapshot);
  const attachmentOwnershipCount = getSnapshotAttachmentOwnershipCount(snapshot);
  if (!heroes.length) {
    return '<div class="stack-item">当前快照没有可展示的武将摘要。</div>';
  }
  const overviewCards = [
    { label: "阵容位", value: `${summary?.use_team_id || 0} 号`, accent: "accent" },
    { label: "武将", value: `${summary?.hero_count || heroes.length || 0} 名` },
    { label: "科技", value: techCount > 0 ? `${techCount} 项` : "未记录" },
    { label: "主玩具", value: weaponInfo?.name || "未记录", accent: weaponInfo ? "success" : "" },
  ]
    .map(
      (item) => `
        <article class="helper-overview-card ${item.accent || ""}">
          <div class="helper-overview-label">${escapeHtml(item.label)}</div>
          <div class="helper-overview-value">${escapeHtml(item.value)}</div>
        </article>
      `
    )
    .join("");
  const heroMarkup = heroes
    .map((hero) => {
      const avatarUrl = getHeroAvatarUrl(hero);
      const attachmentUid = normalizeHelperAttachmentUid(hero?.attachment_uid);
      const topMetaBits = [`Lv.${hero?.level || 0}`, hero?.power ? `${hero.power} 战力` : ""]
        .filter(Boolean)
        .join(" · ");
      const fishAndPearl = [hero?.fish_name || "未佩戴", hero?.pearl_skill_name || "无鱼珠技能"]
        .filter(Boolean)
        .join(" · ");
      const equipSummary = [buildHelperEquipmentSummary(hero?.equipment), `${hero?.red_count || 0} 红淬 / ${hero?.hole_count || 0} 开孔`]
        .filter(Boolean)
        .join(" · ");
      const quickMeta = [
        { label: "鱼灵 / 鱼珠", value: fishAndPearl },
        { label: "洗练归属", value: attachmentUid ? `#${attachmentUid}` : "未记录" },
        { label: "鱼珠孔位", value: buildHelperFishSlotsSummary(hero?.fish_slots) },
        { label: "洗练 / 开孔", value: equipSummary },
      ]
        .map(
          (item) => `
            <div class="helper-hero-quick-meta">
              <span class="helper-hero-quick-label">${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </div>
          `
        )
        .join("");
      return `
        <article class="helper-hero-card">
          <div class="helper-hero-avatar-wrap">
            ${
              avatarUrl
                ? `<img class="helper-hero-avatar" src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(hero.hero_name || "武将")}" loading="lazy" />`
                : `<div class="helper-hero-avatar placeholder">${escapeHtml(String(hero.hero_name || "武将").slice(0, 2))}</div>`
            }
            <span class="helper-hero-slot">#${escapeHtml(formatHelperBattleSlot(hero?.slot))}</span>
          </div>
          <div class="helper-hero-body">
            <div class="helper-hero-head">
              <div class="helper-hero-heading">
                <strong>${escapeHtml(hero.hero_name || "武将")}</strong>
                <span class="helper-hero-headline-meta">${escapeHtml(topMetaBits)}</span>
              </div>
              <span class="helper-hero-type">${escapeHtml(hero.hero_type || "未知阵营")}</span>
            </div>
            <div class="helper-hero-quick-grid">${quickMeta}</div>
          </div>
        </article>
      `;
    })
    .join("");
  return `
    <div class="helper-detail-overview">
      <div class="helper-overview-grid">${overviewCards}</div>
    </div>
    <div class="helper-hero-stack">${heroMarkup}</div>
  `;
}

function buildHelperPreviewMarkup(preview) {
  if (!preview) {
    return '<div class="stack-item">选择某份历史快照后，这里会展示“当前阵容”和“目标快照”之间的恢复步骤预演。</div>';
  }
  const safeSummary = [
    preview?.safe_counts?.hero_slots ? `站位 ${preview.safe_counts.hero_slots}` : "",
    preview?.safe_counts?.hero_levels ? `等级 ${preview.safe_counts.hero_levels}` : "",
    preview?.safe_counts?.attachment_transfers ? `归属 ${preview.safe_counts.attachment_transfers}` : "",
    preview?.safe_counts?.artifacts ? `鱼灵 ${preview.safe_counts.artifacts}` : "",
    preview?.safe_counts?.pearl_skills ? `鱼珠 ${preview.safe_counts.pearl_skills}` : "",
    preview?.safe_counts?.legion_research ? `科技 ${preview.safe_counts.legion_research}` : "",
    preview?.safe_counts?.weapon ? `玩具 ${preview.safe_counts.weapon}` : "",
  ]
    .filter(Boolean)
    .join(" / ");
  const warningMarkup =
    Array.isArray(preview?.warnings) && preview.warnings.length
      ? `<div class="helper-preview-warning-list">${preview.warnings
          .map((item) => `<div class="stack-item">${escapeHtml(item)}</div>`)
          .join("")}</div>`
      : "";
  const stepMarkup =
    Array.isArray(preview?.steps) && preview.steps.length
      ? `<div class="helper-preview-step-list">${preview.steps
          .map(
            (step, index) => `
              <article class="helper-preview-step ${escapeHtml(step.type || "safe")}">
                <div class="helper-preview-step-head">
                  <span class="helper-preview-step-index">步骤 ${index + 1}</span>
                  <strong>${escapeHtml(step.label || "恢复动作")}</strong>
                </div>
                <div class="helper-capability-note">${escapeHtml(step.description || "-")}</div>
              </article>
            `
          )
          .join("")}</div>`
      : '<div class="stack-item">当前阵容和目标快照已经非常接近，没有检测到需要执行的安全恢复步骤。</div>';

  return `
    <div class="helper-snapshot-item">
      <div class="stack-item"><strong>目标快照：</strong>${escapeHtml(preview?.target_snapshot_name || "-")}</div>
      <div class="stack-item">当前实时阵容：阵容 ${escapeHtml(preview?.live_summary?.use_team_id || "-")} / ${escapeHtml(preview?.live_summary?.role_name || "-")} / ${escapeHtml(preview?.live_summary?.server || "-")}</div>
      <div class="stack-item">安全恢复步骤：${escapeHtml(preview?.safe_step_count || 0)} 项${safeSummary ? `（${escapeHtml(safeSummary)}）` : ""}</div>
      <div class="stack-item">执行顺序：若涉及洗练归属，helper 会先迁移对应套装，再继续站位、等级、鱼灵和科技动作。</div>
      <div class="stack-item">仅记录未自动恢复：${escapeHtml(preview?.recorded_only_count || 0)} 项</div>
      ${warningMarkup}
      ${stepMarkup}
    </div>
  `;
}

function renderHelperSnapshotCard(snapshot, { isLatest = false, isArchived = false } = {}) {
  const summary = snapshot?.summary || {};
  const snapshotId = Number(snapshot?.id || 0);
  const teamId = Number(summary?.use_team_id || 0);
  const expanded = expandedHelperSnapshotIds.has(snapshotId);
  const heroes = Array.isArray(summary.heroes) ? summary.heroes : [];
  const weaponInfo = getSnapshotWeaponInfo(snapshot);
  const legionResearchCount = getSnapshotLegionResearchCount(snapshot);
  const safeRestoreBlockReason = getSnapshotSafeRestoreBlockReason(snapshot);
  const safeRestoreReady = !safeRestoreBlockReason;
  const heroStripMarkup = buildHelperSnapshotHeroStripMarkup(snapshot);
  const metaBits = [
    teamId > 0 ? `${teamId}号阵容` : "",
    `${summary.hero_count || heroes.length || 0} 名武将`,
    legionResearchCount > 0 ? `科技 ${legionResearchCount} 项` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const snapshotOverviewMarkup = [
    { label: "阵容", value: teamId > 0 ? `${teamId} 号` : "未识别" },
    { label: "武将", value: `${summary.hero_count || heroes.length || 0} 名` },
    { label: "科技", value: legionResearchCount > 0 ? `${legionResearchCount} 项` : "未记录" },
    { label: "主玩具", value: weaponInfo?.name || "未记录" },
  ]
    .map(
      (item) => `
        <div class="helper-snapshot-stat">
          <span class="helper-snapshot-stat-label">${escapeHtml(item.label)}</span>
          <strong class="helper-snapshot-stat-value">${escapeHtml(item.value)}</strong>
        </div>
      `
    )
    .join("");
  return `
    <article class="helper-snapshot-card ${isLatest ? "latest" : ""} ${isArchived ? "archived" : ""}">
      <div class="helper-snapshot-head">
        <div class="helper-snapshot-title-group">
          <div class="helper-snapshot-kicker">${escapeHtml(snapshot?.is_pinned ? "已置顶" : isLatest ? "当前保存" : isArchived ? "旧版快照" : "云端阵容")}</div>
          <strong class="helper-snapshot-title">${escapeHtml(buildHelperSnapshotName(snapshot))}</strong>
          <div class="helper-snapshot-subtitle">${escapeHtml(summary.role_name || "-")} / ${escapeHtml(summary.server || "-")}</div>
        </div>
        <div class="helper-snapshot-time">
          <div>${escapeHtml(formatRelativeTime(snapshot.created_at || summary.captured_at))}</div>
          <div>${escapeHtml(formatDate(snapshot.created_at || summary.captured_at))}</div>
        </div>
      </div>
      <div class="helper-snapshot-summary">${escapeHtml(metaBits || "阵容信息已保存")}</div>
      <div class="helper-snapshot-stage">
        <div class="helper-hero-mini-strip">${heroStripMarkup}</div>
      </div>
      <div class="helper-snapshot-stat-grid">${snapshotOverviewMarkup}</div>
      <div class="helper-hero-meta helper-hero-meta-soft">
        ${snapshot?.is_pinned ? '<span class="helper-chip helper-chip-accent">已置顶</span>' : ""}
        ${isArchived ? '<span class="helper-chip">检测到更新版</span>' : ""}
        <span class="helper-chip">${escapeHtml(buildHelperSnapshotRestoreSummaryText(snapshot))}</span>
        ${weaponInfo?.name ? `<span class="helper-chip">主玩具 ${escapeHtml(weaponInfo.name)}</span>` : ""}
      </div>
      <div class="actions">
        ${
          helperConfig?.features?.team_restore
            ? `<button type="button" class="primary helper-restore-snapshot-btn" data-helper-snapshot-id="${snapshotId}" ${
                safeRestoreReady ? "" : "disabled"
              } title="${escapeHtml(
                safeRestoreReady ? "按这份阵容执行一键还原" : safeRestoreBlockReason
              )}">一键还原</button>`
            : helperConfig?.features?.team_switch && teamId > 0
              ? `<button type="button" class="primary helper-switch-to-snapshot-btn" data-helper-team-id="${teamId}" data-helper-snapshot-id="${snapshotId}">切回这套阵容</button>`
              : ""
        }
        <button type="button" class="ghost helper-toggle-snapshot-detail-btn" data-helper-snapshot-id="${snapshotId}">
          ${expanded ? "收起详情" : "查看详情"}
        </button>
        <button type="button" class="ghost helper-rename-snapshot-btn" data-helper-snapshot-id="${snapshotId}">
          重命名
        </button>
        <button type="button" class="ghost helper-pin-snapshot-btn" data-helper-snapshot-id="${snapshotId}" data-helper-pin-state="${snapshot?.is_pinned ? "on" : "off"}">
          ${snapshot?.is_pinned ? "取消置顶" : "置顶阵容"}
        </button>
        <button type="button" class="ghost helper-remove-snapshot-btn" data-helper-snapshot-id="${snapshotId}">删除快照</button>
      </div>
      ${
        isArchived
          ? '<div class="helper-capability-note">这份是同一套阵容的较旧版本，系统已自动优先展示更新、更完整的快照。</div>'
          : ""
      }
      ${
        helperConfig?.features?.team_restore && !safeRestoreReady
          ? `<div class="helper-capability-note">${escapeHtml(safeRestoreBlockReason)}</div>`
          : ""
      }
      ${
        expanded
          ? `<div class="helper-snapshot-detail">${buildHelperSnapshotDetailMarkup(snapshot)}</div>`
          : ""
      }
    </article>
  `;
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

function renderHelperSlotSummaryPanel(snapshotCount, snapshotLimit) {
  if (!helperSlotSummary) return;
  const plan = getHelperLineupPlan();
  if (!currentProfile) {
    helperSlotSummary.innerHTML = '<div class="stack-item">登录后可查看阵容槽位，并购买更多保存栏位。</div>';
    if (helperBuyPermanentSlotBtn) helperBuyPermanentSlotBtn.disabled = true;
    if (helperBuySeasonalSlotBtn) helperBuySeasonalSlotBtn.disabled = true;
    setHelperSlotMessage("", "");
    return;
  }

  const baseSlots = Math.max(Number(currentProfile?.lineup_slot_base || plan.base_slots) || plan.base_slots, 1);
  const permanentSlots = Math.max(Number(currentProfile?.lineup_slot_permanent || 0) || 0, 0);
  const seasonalSlots = Math.max(Number(currentProfile?.lineup_slot_seasonal || 0) || 0, 0);
  const memberBonusSlots = Math.max(Number(currentProfile?.lineup_slot_member_bonus || 0) || 0, 0);
  const availableSlots = Math.max(snapshotLimit - snapshotCount, 0);
  const seasonLabel = String(currentProfile?.lineup_slot_season_label || plan.season_label).trim() || plan.season_label;
  const seasonExpiresAt = currentProfile?.lineup_slot_season_expires_at || plan.season_expires_at;

  helperSlotSummary.innerHTML = `
    <div class="helper-slot-summary-card">
      <div class="helper-slot-summary-top">
        <div>
          <div class="helper-snapshot-kicker">阵容槽位</div>
          <div class="helper-slot-summary-value">${snapshotCount} / ${snapshotLimit}</div>
        </div>
        <div class="helper-slot-summary-caption">当前还可再保存 ${availableSlots} 套</div>
      </div>
      <div class="helper-slot-chip-row">
        <span class="helper-slot-mini-chip">基础 ${baseSlots}</span>
        <span class="helper-slot-mini-chip">永久 ${permanentSlots}</span>
        <span class="helper-slot-mini-chip">${escapeHtml(seasonLabel)} ${seasonalSlots}</span>
        <span class="helper-slot-mini-chip">会员赠送 ${memberBonusSlots}</span>
      </div>
      <div class="helper-slot-summary-caption">
        永久槽 ${plan.permanent_slot_quota} 额度 / 个，最多再买 ${Math.max(plan.permanent_slot_max - Number(currentProfile?.lineup_slot_permanent_purchases || permanentSlots || 0), 0)} 个。
        赛季槽 ${plan.seasonal_slot_quota} 额度 / 个，持续到 ${escapeHtml(formatDate(seasonExpiresAt || "")) || "赛季结束"}。
      </div>
    </div>
  `;

  if (helperBuyPermanentSlotBtn) {
    const reachedPermanentCap =
      Number(currentProfile?.lineup_slot_permanent_purchases || permanentSlots || 0) >= plan.permanent_slot_max;
    helperBuyPermanentSlotBtn.disabled = reachedPermanentCap;
    helperBuyPermanentSlotBtn.textContent = reachedPermanentCap
      ? `永久槽已满 ${plan.permanent_slot_max}/${plan.permanent_slot_max}`
      : `+1 永久槽（${plan.permanent_slot_quota}）`;
  }
  if (helperBuySeasonalSlotBtn) {
    helperBuySeasonalSlotBtn.disabled = false;
    helperBuySeasonalSlotBtn.textContent = `+1 ${seasonLabel}槽（${plan.seasonal_slot_quota}）`;
  }
}

function renderHelperSnapshotPanel() {
  const { active, archived } = partitionHelperSnapshots(currentHelperSnapshots);
  const snapshotLimit = Math.max(Number(helperConfig?.limits?.snapshots_per_user || 3) || 3, 1);
  const snapshotCount = Array.isArray(currentHelperSnapshots) ? currentHelperSnapshots.length : 0;
  const snapshotLimitReached = snapshotCount >= snapshotLimit;

  renderHelperSlotSummaryPanel(snapshotCount, snapshotLimit);

  if (helperReadSnapshotBtn) {
    helperReadSnapshotBtn.disabled = false;
    helperReadSnapshotBtn.textContent = snapshotLimitReached
      ? `已满 ${snapshotCount}/${snapshotLimit}`
      : "保存当前阵容";
    helperReadSnapshotBtn.title = snapshotLimitReached
      ? `已达到 ${snapshotLimit} 套阵容上限，请先删除旧阵容`
      : "保存当前阵容";
  }
  if (snapshotLimitReached && helperSnapshotMessage && !String(helperSnapshotMessage.textContent || "").trim()) {
    setHelperSnapshotMessage(`当前最多保存 ${snapshotLimit} 套阵容，请先删除旧阵容再继续保存。`, "success");
  }

  if (helperSnapshotCurrent) {
    const orderedSnapshots = active;
    const latest = Array.isArray(orderedSnapshots) ? orderedSnapshots[0] : null;
    if (!latest) {
      helperSnapshotCurrent.innerHTML = '<div class="stack-item">还没有保存过阵容，点上面的“保存当前阵容”就可以开始。</div>';
    } else {
      helperSnapshotCurrent.innerHTML = renderHelperSnapshotCard(latest, { isLatest: true });
    }
  }

  if (helperSnapshotList) {
    const snapshots = showArchivedHelperSnapshots ? [...active.slice(1), ...archived] : active.slice(1);
    if (!snapshots.length) {
      helperSnapshotList.innerHTML = archived.length
        ? `<div class="stack-item">其余都是旧版快照。<button type="button" class="ghost helper-toggle-archived-snapshots-btn" data-helper-archived-state="${showArchivedHelperSnapshots ? "on" : "off"}">${showArchivedHelperSnapshots ? "收起旧版快照" : `显示旧版快照（${archived.length}）`}</button></div>`
        : "";
      return;
    }
    const archivedIds = new Set(archived.map((snapshot) => Number(snapshot?.id || 0)));
    helperSnapshotList.innerHTML = `
      ${
        archived.length
          ? `<div class="stack-item">系统已自动隐藏 ${archived.length} 份旧版重复快照。<button type="button" class="ghost helper-toggle-archived-snapshots-btn" data-helper-archived-state="${showArchivedHelperSnapshots ? "on" : "off"}">${showArchivedHelperSnapshots ? "收起旧版快照" : `显示旧版快照（${archived.length}）`}</button></div>`
          : ""
      }
      ${snapshots
        .slice(0, 6)
        .map((snapshot) =>
          renderHelperSnapshotCard(snapshot, {
            isArchived: archivedIds.has(Number(snapshot?.id || 0)),
          })
        )
        .join("")}
    `;
  }
}

function renderHelperRestorePreviewPanel() {
  if (!helperPreviewCurrent) return;
  helperPreviewCurrent.innerHTML = buildHelperPreviewMarkup(currentHelperRestorePreview);
}

function getLatestHelperTeamId() {
  const latestAction = Array.isArray(currentHelperActionLogs) ? currentHelperActionLogs[0] : null;
  const latestSnapshot = Array.isArray(currentHelperSnapshots) ? currentHelperSnapshots[0] : null;
  const actionTeamId = Number(
    latestAction?.result_payload?.use_team_id || latestAction?.action_payload?.team_id || 0
  );
  if (Number.isInteger(actionTeamId) && actionTeamId > 0) return actionTeamId;
  const snapshotTeamId = Number(latestSnapshot?.summary?.use_team_id || 0);
  if (Number.isInteger(snapshotTeamId) && snapshotTeamId > 0) return snapshotTeamId;
  return 0;
}

function renderHelperTeamSwitchPanel() {
  const activeBinding = getActiveHelperBinding();
  const latestTeamId = getLatestHelperTeamId();
  const latestAction = Array.isArray(currentHelperActionLogs) ? currentHelperActionLogs[0] : null;

  if (helperTeamSwitchCurrent) {
    if (!activeBinding) {
      helperTeamSwitchCurrent.innerHTML =
        '<div class="stack-item">请先完成 helper 角色绑定，再切换预设阵容。</div>';
    } else {
      helperTeamSwitchCurrent.innerHTML = `
        <div class="helper-snapshot-item">
          <div class="stack-item"><strong>当前绑定：</strong>${escapeHtml(activeBinding.game_role_name || "-")} / ${escapeHtml(activeBinding.game_server || "-")}</div>
          <div class="stack-item">已知当前阵容：${escapeHtml(latestTeamId > 0 ? `阵容 ${latestTeamId}` : "暂未识别")}</div>
          <div class="stack-item">${escapeHtml(latestAction ? "最近一次执行已记录" : "还没有执行记录")}</div>
        </div>
      `;
    }
  }

  if (helperTeamSwitchControls) {
    helperTeamSwitchControls.querySelectorAll("[data-helper-team-id]").forEach((button) => {
      const teamId = Number(button.getAttribute("data-helper-team-id") || 0);
      button.classList.toggle("active", latestTeamId > 0 && teamId === latestTeamId);
      button.toggleAttribute("disabled", !activeBinding || !helperConfig?.features?.team_switch);
    });
  }

  if (helperTeamSwitchLog) {
    const logs = Array.isArray(currentHelperActionLogs) ? currentHelperActionLogs : [];
    if (!logs.length) {
      helperTeamSwitchLog.innerHTML = '<div class="stack-item">执行记录会显示在这里。</div>';
      return;
    }
    helperTeamSwitchLog.innerHTML = logs
      .slice(0, 6)
      .map((log) => {
        const actionType = String(log?.action_type || "").trim();
        const requestedTeamId = Number(log?.action_payload?.team_id || 0);
        const resultTeamId = Number(log?.result_payload?.use_team_id || requestedTeamId || 0);
        const roleText = [log?.result_payload?.role_name, log?.result_payload?.server]
          .filter(Boolean)
          .join(" / ");
        const restoreCounts = log?.result_payload?.restore_counts || {};
        const restoreBits = [
          restoreCounts?.attachment_transfers ? `归属 ${restoreCounts.attachment_transfers}` : "",
          restoreCounts?.hero_adds || restoreCounts?.hero_moves || restoreCounts?.hero_removes
            ? `站位 ${Number(restoreCounts?.hero_adds || 0) + Number(restoreCounts?.hero_moves || 0) + Number(restoreCounts?.hero_removes || 0)}`
            : "",
          restoreCounts?.hero_level_steps || restoreCounts?.hero_rebirths || restoreCounts?.hero_order_steps
            ? `等级 ${Number(restoreCounts?.hero_level_steps || 0) + Number(restoreCounts?.hero_rebirths || 0) + Number(restoreCounts?.hero_order_steps || 0)}`
            : "",
          restoreCounts?.artifact_loads || restoreCounts?.artifact_unloads
            ? `鱼灵 ${Number(restoreCounts?.artifact_loads || 0) + Number(restoreCounts?.artifact_unloads || 0)}`
            : "",
          restoreCounts?.pearl_skill_changes ? `鱼珠 ${restoreCounts.pearl_skill_changes}` : "",
          restoreCounts?.legion_steps || restoreCounts?.legion_resets
            ? `科技 ${Number(restoreCounts?.legion_steps || 0) + Number(restoreCounts?.legion_resets || 0)}`
            : "",
          restoreCounts?.weapon_changes ? `玩具 ${restoreCounts.weapon_changes}` : "",
        ]
          .filter(Boolean)
          .join(" / ");
        const title =
          actionType === "helper_team_restore"
            ? `${log?.result_status === "ok" || log?.result_status === "warning" ? "成功" : "失败"}：安全恢复`
            : `${log?.result_status === "ok" ? "成功" : "失败"}：请求阵容 ${requestedTeamId || "-"} / 当前阵容 ${resultTeamId || "-"}`;
        return `
          <div class="helper-snapshot-item">
            <div class="stack-item"><strong>${escapeHtml(title)}</strong></div>
            <div class="stack-item">角色：${escapeHtml(roleText || "-")}</div>
            ${
              actionType === "helper_team_restore"
                ? `<div class="stack-item">目标快照：${escapeHtml(log?.action_payload?.snapshot_name || log?.action_payload?.snapshot_id || "-")} / 阵容 ${escapeHtml(resultTeamId || log?.action_payload?.team_id || "-")}</div>`
                : ""
            }
            ${
              actionType === "helper_team_restore" && restoreBits
                ? `<div class="stack-item">执行统计：${escapeHtml(restoreBits)}</div>`
                : ""
            }
            <div class="stack-item">时间：${escapeHtml(formatDate(log.created_at))}</div>
            <div class="stack-item">说明：${escapeHtml(log?.result_payload?.message || "-")}</div>
          </div>
        `;
      })
      .join("");
  }
  renderHelperRestoreResultPanel();
}

async function loadHelperBindings() {
  if (!currentProfile || !isHelperLineupEnabled() || !helperConfig?.features?.scan_bind) {
    currentHelperBindings = [];
    syncActiveHelperBindingPreference();
    renderHelperBindingPanel();
    renderHelperInventoryPanel();
    return;
  }

  try {
    currentHelperBindings = await apiFetch("/helper/bindings/current");
    syncActiveHelperBindingPreference();
  } catch (error) {
    currentHelperBindings = [];
    syncActiveHelperBindingPreference();
    setHelperBindMessage(`读取绑定失败：${pickErrorMessage(error, "读取失败")}`, "error");
  } finally {
    renderHelperBindingPanel();
    renderHelperInventoryPanel();
    renderHelperTeamSwitchPanel();
  }
}

async function loadHelperInventories() {
  if (!currentProfile || !isHelperInventoryEnabled()) {
    currentHelperInventories = [];
    currentHelperMergedItems = [];
    renderHelperInventoryPanel();
    return;
  }

  try {
    const payload = await apiFetch("/helper/inventories");
    currentHelperInventories = Array.isArray(payload?.inventories) ? payload.inventories : [];
    currentHelperMergedItems = Array.isArray(payload?.merged_items) ? payload.merged_items : [];
  } catch (error) {
    currentHelperInventories = [];
    currentHelperMergedItems = [];
    setHelperInventoryMessage(`读取功法仓库失败：${pickErrorMessage(error, "读取失败")}`, "error");
  } finally {
    renderHelperInventoryPanel();
  }
}

async function loadHelperSnapshots() {
  if (!currentProfile || !isHelperLineupEnabled() || !helperConfig?.features?.team_snapshot) {
    currentHelperSnapshots = [];
    renderHelperSnapshotPanel();
    currentHelperRestorePreview = null;
    renderHelperRestorePreviewPanel();
    return;
  }

  try {
    currentHelperSnapshots = await apiFetch("/helper/snapshots");
  } catch (error) {
    currentHelperSnapshots = [];
    setHelperSnapshotMessage(`读取快照失败：${pickErrorMessage(error, "读取失败")}`, "error");
  } finally {
    if (
      currentHelperRestorePreview &&
      !(currentHelperSnapshots || []).some(
        (item) => Number(item?.id) === Number(currentHelperRestorePreview?.target_snapshot_id || 0)
      )
    ) {
      currentHelperRestorePreview = null;
    }
    renderHelperSnapshotPanel();
    renderHelperRestorePreviewPanel();
    renderHelperTeamSwitchPanel();
  }
}

function resetHelperInventorySyncState() {
  helperInventorySyncState = {
    running: false,
    mode: "",
    queue: [],
    total: 0,
    completed: 0,
    failures: [],
    currentBindingId: null,
  };
}

function startNextHelperInventorySyncInQueue() {
  const nextBinding = helperInventorySyncState.queue.shift() || null;
  if (!nextBinding) {
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
    return;
  }

  helperInventorySyncState.currentBindingId = Number(nextBinding?.id || 0);
  renderHelperInventoryPanel();
  const opened = runHelperBridgeInBackground(
    buildHelperBridgeLegacyInventoryUrl(nextBinding),
    "legacyInventory"
  );
  if (!opened) {
    helperInventorySyncState.failures.push({
      binding_id: Number(nextBinding?.id || 0),
      role_name: normalizeHelperDisplayRoleName(nextBinding?.game_role_name, nextBinding?.game_role_id),
      message: "当前页面暂时无法启动功法同步",
    });
    startNextHelperInventorySyncInQueue();
    return;
  }
  setHelperInventoryMessage(
    `正在同步 ${normalizeHelperDisplayRoleName(nextBinding?.game_role_name, nextBinding?.game_role_id) || "该角色"} 的功法库存（${helperInventorySyncState.completed + 1}/${helperInventorySyncState.total}）...`,
    "success"
  );
}

function startHelperInventorySync(bindings, mode = "current") {
  const filteredBindings = (bindings || []).filter(Boolean);
  if (!currentProfile) {
    setHelperInventoryMessage("请先登录商城账号，再同步功法仓库。", "error");
    window.location.hash = "bind";
    return;
  }
  if (!isHelperInventoryEnabled()) {
    setHelperInventoryMessage(getHelperLineupDisabledReason("当前环境未开启功法仓库同步。"), "error");
    return;
  }
  if (!filteredBindings.length) {
    setHelperInventoryMessage("请先绑定至少一个游戏角色，再同步功法仓库。", "error");
    return;
  }
  if (helperInventorySyncState.running) {
    setHelperInventoryMessage("上一轮功法同步还在进行中，请稍等。", "error");
    return;
  }
  helperInventorySyncState = {
    running: true,
    mode,
    queue: [...filteredBindings],
    total: filteredBindings.length,
    completed: 0,
    failures: [],
    currentBindingId: null,
  };
  renderHelperInventoryPanel();
  startNextHelperInventorySyncInQueue();
}

function syncCurrentHelperInventory() {
  const activeBinding = getActiveHelperBinding();
  if (!activeBinding) {
    setHelperInventoryMessage("请先选择一个当前使用角色，再同步功法仓库。", "error");
    return;
  }
  startHelperInventorySync([activeBinding], "current");
}

function syncAllHelperInventories() {
  const bindings = Array.isArray(currentHelperBindings) ? currentHelperBindings : [];
  startHelperInventorySync(bindings, "all");
}

async function loadHelperActionLogs() {
  if (
    !currentProfile ||
    !isHelperLineupEnabled() ||
    (!helperConfig?.features?.team_switch && !helperConfig?.features?.team_restore)
  ) {
    currentHelperActionLogs = [];
    renderHelperTeamSwitchPanel();
    return;
  }

  try {
    currentHelperActionLogs = await apiFetch("/helper/action-logs?limit=12");
  } catch (error) {
    currentHelperActionLogs = [];
    setHelperSwitchMessage(`读取切换记录失败：${pickErrorMessage(error, "读取失败")}`, "error");
  } finally {
    renderHelperTeamSwitchPanel();
  }
}

function buildHelperBridgeBindUrl() {
  const publicBase = String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
  return withHelperCacheBuster(`${publicBase.replace(/\/$/, "")}/tokens`, {
    importMethod: "wxQrcode",
    bridge: "1",
    bridgeFlow: getPendingHelperBridgeIntent(),
    targetOrigin: window.location.origin,
  });
}

function getCurrentSessionToken() {
  const session = loadSession();
  return String(session?.token || "").trim();
}

function buildHelperBridgeSnapshotUrl(binding) {
  const publicBase = String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
  return withHelperCacheBuster(`${publicBase.replace(/\/$/, "")}/tokens`, {
    bridge: "1",
    bridgeAction: "teamSnapshot",
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    targetOrigin: window.location.origin,
    mallToken: getCurrentSessionToken(),
  });
}

function buildHelperBridgeLegacyInventoryUrl(binding) {
  const publicBase = String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
  return withHelperCacheBuster(`${publicBase.replace(/\/$/, "")}/tokens`, {
    bridge: "1",
    bridgeAction: "legacyInventory",
    bindingId: binding?.id || "",
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    targetOrigin: window.location.origin,
    mallToken: getCurrentSessionToken(),
  });
}

function buildHelperBridgeTeamSwitchUrl(binding, teamId) {
  const publicBase = String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
  return withHelperCacheBuster(`${publicBase.replace(/\/$/, "")}/tokens`, {
    bridge: "1",
    bridgeAction: "teamSwitch",
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    targetTeamId: teamId,
    targetOrigin: window.location.origin,
    mallToken: getCurrentSessionToken(),
  });
}

function buildHelperBridgeTeamPreviewUrl(binding, snapshotId) {
  const publicBase = String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
  return withHelperCacheBuster(`${publicBase.replace(/\/$/, "")}/tokens`, {
    bridge: "1",
    bridgeAction: "teamPreview",
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    targetSnapshotId: snapshotId,
    targetOrigin: window.location.origin,
    mallToken: getCurrentSessionToken(),
  });
}

function buildHelperBridgeTeamRestoreUrl(binding, snapshotId, restorePlan) {
  const publicBase = String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
  return withHelperCacheBuster(`${publicBase.replace(/\/$/, "")}/tokens`, {
    bridge: "1",
    bridgeAction: "teamRestore",
    bindTokenId: binding?.bind_token_id || "",
    gameRoleId: binding?.game_role_id || "",
    gameServer: binding?.game_server || "",
    gameRoleName: binding?.game_role_name || "",
    targetSnapshotId: snapshotId,
    restorePlan: encodeHelperBridgePayload(restorePlan),
    targetOrigin: window.location.origin,
    mallToken: getCurrentSessionToken(),
  });
}

function resetHelperBridgeFrame(frame) {
  if (!frame) return;
  try {
    frame.src = "about:blank";
  } catch (error) {
    console.warn("resetHelperBridgeFrame failed", error);
  }
}

function closeHelperBridgeModal() {
  if (!helperBridgeModal) return;
  helperBridgeModal.classList.add("hidden");
  helperBridgeModal.setAttribute("aria-hidden", "true");
  helperBridgeSurfaceState = {
    mode: "",
    interactive: false,
  };
  resetHelperBridgeFrame(helperBridgeIframe);
}

function clearHelperBridgeBackgroundFrame() {
  if (helperBridgeBackgroundState.timeoutId) {
    window.clearTimeout(helperBridgeBackgroundState.timeoutId);
  }
  helperBridgeBackgroundState = {
    mode: "",
    url: "",
    timeoutId: null,
  };
  resetHelperBridgeFrame(helperBridgeHiddenFrame);
  if (!helperBridgeSurfaceState.interactive) {
    helperBridgeSurfaceState = {
      mode: "",
      interactive: false,
    };
  }
}

function openHelperBridgeModalSurface(url, options = {}) {
  if (!helperBridgeModal || !helperBridgeIframe) return false;
  helperBridgeSurfaceState = {
    mode: String(options.mode || "").trim(),
    interactive: true,
  };
  if (helperBridgeModalTitle) {
    helperBridgeModalTitle.textContent = options.title || "绑定游戏角色";
  }
  if (helperBridgeModalMessage) {
    helperBridgeModalMessage.textContent =
      options.message || "在当前页面完成角色绑定，选择后会自动带回商城。";
  }
  if (helperBridgeModalHint) {
    helperBridgeModalHint.textContent =
      options.hint || "支持扫码或 BIN 导入，完成后会自动返回商城，不需要手动回跳。";
  }
  helperBridgeModal.classList.remove("hidden");
  helperBridgeModal.setAttribute("aria-hidden", "false");
  resetHelperBridgeFrame(helperBridgeIframe);
  window.setTimeout(() => {
    helperBridgeIframe.src = url;
  }, 20);
  return true;
}

function runHelperBridgeInBackground(url, mode = "") {
  if (!helperBridgeHiddenFrame) return false;
  if (helperBridgeBackgroundState.timeoutId) {
    window.clearTimeout(helperBridgeBackgroundState.timeoutId);
  }
  helperBridgeSurfaceState = {
    mode: String(mode || "").trim(),
    interactive: false,
  };
  helperBridgeBackgroundState = {
    mode: String(mode || "").trim(),
    url: String(url || "").trim(),
    timeoutId: null,
  };
  resetHelperBridgeFrame(helperBridgeHiddenFrame);
  window.setTimeout(() => {
    helperBridgeHiddenFrame.src = url;
  }, 20);
  helperBridgeBackgroundState.timeoutId = window.setTimeout(() => {
    const pendingMode = helperBridgeBackgroundState.mode;
    const pendingUrl = helperBridgeBackgroundState.url;
    clearHelperBridgeBackgroundFrame();
    if (pendingMode === "legacyInventory") {
      setHelperInventoryMessage("后台同步超过 45 秒没有返回，已切换到可见 helper 页面继续执行。", "error");
      openHelperBridgeModalSurface(pendingUrl, {
        mode: "legacyInventory",
        title: "功法仓库同步",
        message: "后台同步超时，已切换到可见 helper 页面。这里会继续自动执行，并把错误直接显示出来。",
        hint: "如果仍然失败，请保留这个页面，我们继续按页面内提示定位。",
      });
      return;
    }
    if (pendingMode === "teamSnapshot") {
      setHelperSnapshotMessage("后台读取超过 45 秒没有返回，已切换到可见 helper 页面继续执行。", "error");
      openHelperBridgeModalSurface(pendingUrl, {
        mode: "teamSnapshot",
        title: "读取当前阵容",
        message: "后台读取超时，已切换到可见 helper 页面。这里会继续自动执行，并把错误直接显示出来。",
        hint: "如果仍然失败，请保留这个页面，我们继续按页面内提示定位。",
      });
    }
  }, 45000);
  return true;
}

function openHelperBindPopup() {
  if (!currentProfile) {
    setHelperBindMessage("请先登录商城账号，再绑定游戏角色。", "error");
    window.location.hash = "bind";
    return;
  }
  if (!isHelperLineupEnabled() || !helperConfig?.features?.scan_bind) {
    setHelperBindMessage(getHelperLineupDisabledReason("当前环境未开启角色绑定。"), "error");
    return;
  }
  rememberHelperBridgeIntent(HELPER_BRIDGE_INTENT_BIND);
  const opened = openHelperBridgeModalSurface(buildHelperBridgeBindUrl(), {
    mode: "bind",
    title: "绑定游戏角色",
    message: "在当前页面完成角色绑定。你可以扫码，也可以在角色列表里直接选择已有角色。",
    hint: "完成后会自动回到商城，不需要手动切回。",
  });
  if (!opened) {
    setHelperBindMessage("当前页面暂时无法打开角色绑定层，请稍后重试。", "error");
    return;
  }
  setHelperBindMessage("角色绑定层已打开，请在当前页面完成扫码或选择角色。", "success");
}

function openHelperAuthPopup() {
  if (!isHelperScanAuthEnabled()) {
    setHelperAuthMessage("当前环境未开启扫码注册 / 登录。", "error");
    return;
  }
  rememberHelperBridgeIntent(HELPER_BRIDGE_INTENT_AUTH);
  const opened = openHelperBridgeModalSurface(buildHelperBridgeBindUrl(), {
    mode: "auth",
    title: "扫码注册 / 登录",
    message: "在当前页面完成扫码或选择游戏角色，系统会自动完成注册 / 登录。",
    hint: "扫码后选中角色即可，不需要再手动回跳。",
  });
  if (!opened) {
    setHelperAuthMessage("当前页面暂时无法打开扫码登录层，请稍后重试。", "error");
    return;
  }
  setHelperAuthMessage("扫码登录层已打开，请在当前页面扫码并选择角色。", "success");
}

async function purchaseHelperSlot(purchaseType) {
  if (!currentProfile) {
    setHelperSlotMessage("请先登录商城账号，再购买阵容槽位。", "error");
    window.location.hash = "bind";
    return;
  }
  if (!isHelperLineupEnabled()) {
    setHelperSlotMessage(getHelperLineupDisabledReason("当前环境未开启阵容中心。"), "error");
    return;
  }

  const plan = getHelperLineupPlan();
  const isPermanent = purchaseType === "permanent";
  const label = isPermanent ? "永久阵容槽" : `${plan.season_label}阵容槽`;
  const quotaCost = isPermanent ? plan.permanent_slot_quota : plan.seasonal_slot_quota;
  const balance = Number(currentQuota?.balance ?? currentProfile?.quota_balance ?? 0);
  if (balance < quotaCost) {
    setHelperSlotMessage(`额度不足，购买 ${label} 需要 ${quotaCost} 额度，当前只有 ${balance}。`, "error");
    return;
  }
  const note = isPermanent
    ? `确认花费 ${quotaCost} 额度购买 1 个永久阵容槽吗？`
    : `确认花费 ${quotaCost} 额度租用 1 个 ${plan.season_label} 阵容槽吗？到 ${formatDate(plan.season_expires_at || "") || "赛季结束"} 自动失效。`;
  if (!window.confirm(note)) {
    return;
  }

  try {
    const result = await apiFetch("/me/lineup-slots/purchase", {
      method: "POST",
      body: JSON.stringify({ purchase_type: purchaseType }),
    });
    const session = loadSession();
    if (session?.token && result?.user) {
      saveSession({ ...session, profile: result.user });
    }
    setHelperSlotMessage(`已购买 ${label}，现在最多可保存 ${Number(result?.user?.lineup_slot_limit || 0)} 套阵容。`, "success");
    await loadAccount();
    await loadHelperConfig();
  } catch (error) {
    const code = error?.payload?.error || error?.message || "";
    const message =
      code === "lineup_slot_permanent_max_reached"
        ? `永久阵容槽最多购买 ${plan.permanent_slot_max} 个。`
        : code === "insufficient_quota"
          ? "额度不足，暂时无法购买阵容槽。"
          : pickErrorMessage(error, "购买失败");
    setHelperSlotMessage(`购买失败：${message}`, "error");
  }
}

function openHelperSnapshotPopup() {
  if (!currentProfile) {
    setHelperSnapshotMessage("请先登录商城账号，再保存阵容。", "error");
    window.location.hash = "bind";
    return;
  }
  if (!isHelperLineupEnabled() || !helperConfig?.features?.team_snapshot) {
    setHelperSnapshotMessage(getHelperLineupDisabledReason("当前环境未开启阵容保存。"), "error");
    return;
  }
  const activeBinding = getActiveHelperBinding();
  if (!activeBinding) {
    setHelperSnapshotMessage("请先完成角色绑定，再保存阵容。", "error");
    return;
  }
  const snapshotLimit = Math.max(Number(helperConfig?.limits?.snapshots_per_user || 3) || 3, 1);
  const snapshotCount = Array.isArray(currentHelperSnapshots) ? currentHelperSnapshots.length : 0;
  if (snapshotCount >= snapshotLimit) {
    const limitMessage = `当前最多保存 ${snapshotLimit} 套阵容，请先删除旧阵容再继续保存。`;
    setHelperSnapshotMessage(limitMessage, "error");
    window.alert(limitMessage);
    return;
  }
  if (!activeBinding.bind_token_id) {
    setHelperSnapshotMessage("当前绑定信息不完整，请重新扫码绑定一次。", "error");
    return;
  }
  const opened = runHelperBridgeInBackground(
    buildHelperBridgeSnapshotUrl(activeBinding),
    "teamSnapshot"
  );
  if (!opened) {
    setHelperSnapshotMessage("当前页面暂时无法启动阵容保存，请稍后重试。", "error");
    return;
  }
  setHelperSnapshotMessage("正在保存当前阵容，完成后会自动出现在下方卡片里。", "success");
}

function openHelperTeamSwitchPopup(teamId) {
  if (!currentProfile) {
    setHelperSwitchMessage("请先登录商城账号，再切换预设阵容。", "error");
    window.location.hash = "bind";
    return;
  }
  if (!isHelperLineupEnabled() || !helperConfig?.features?.team_switch) {
    setHelperSwitchMessage(getHelperLineupDisabledReason("当前环境未开启 helper 预设阵容切换。"), "error");
    return;
  }
  const activeBinding = getActiveHelperBinding();
  if (!activeBinding) {
    setHelperSwitchMessage("请先完成 helper 角色绑定，再切换预设阵容。", "error");
    return;
  }
  const normalizedTeamId = Number(teamId || 0);
  if (!Number.isInteger(normalizedTeamId) || normalizedTeamId < 1 || normalizedTeamId > 4) {
    setHelperSwitchMessage("目标阵容号无效，只支持 1-4 号预设阵容。", "error");
    return;
  }
  const confirmed = window.confirm(
    [
      `将直接切换到阵容 ${normalizedTeamId}。`,
      "这一步会真正写游戏，不是预演。",
      "如果你只是想先看差异，请点“先做恢复预演”。",
    ].join("\n")
  );
  if (!confirmed) {
    setHelperSwitchMessage(`已取消切换到阵容 ${normalizedTeamId}。`, "");
    return;
  }
  const opened = runHelperBridgeInBackground(
    buildHelperBridgeTeamSwitchUrl(activeBinding, normalizedTeamId),
    "teamSwitch"
  );
  if (!opened) {
    setHelperSwitchMessage("当前页面暂时无法执行阵容切换，请稍后重试。", "error");
    return;
  }
  setHelperSwitchMessage(`正在切换到阵容 ${normalizedTeamId}，完成后会自动同步结果。`, "success");
}

function openHelperPreviewPopup(snapshotId) {
  if (!currentProfile) {
    setHelperPreviewMessage("请先登录商城账号，再进行恢复预演。", "error");
    window.location.hash = "bind";
    return;
  }
  if (!isHelperLineupEnabled() || !helperConfig?.features?.team_snapshot) {
    setHelperPreviewMessage(getHelperLineupDisabledReason("当前环境未开启 helper 阵容快照能力。"), "error");
    return;
  }
  const activeBinding = getActiveHelperBinding();
  if (!activeBinding) {
    setHelperPreviewMessage("请先完成 helper 角色绑定，再进行恢复预演。", "error");
    return;
  }
  const targetSnapshot = (currentHelperSnapshots || []).find((item) => Number(item?.id) === Number(snapshotId || 0));
  if (!targetSnapshot) {
    setHelperPreviewMessage("未找到要预演的目标快照，请先刷新快照列表。", "error");
    return;
  }
  pendingHelperPreviewSnapshotId = Number(snapshotId || 0);
  const opened = runHelperBridgeInBackground(
    buildHelperBridgeTeamPreviewUrl(activeBinding, snapshotId),
    "teamPreview"
  );
  if (!opened) {
    setHelperPreviewMessage("当前页面暂时无法执行恢复预演，请稍后重试。", "error");
    return;
  }
  setHelperPreviewMessage(`系统正在核对“${buildHelperSnapshotName(targetSnapshot)}”的还原步骤。`, "success");
}

function openHelperRestorePopup(snapshotId) {
  if (!currentProfile) {
    setHelperSwitchMessage("请先登录商城账号，再执行安全恢复。", "error");
    window.location.hash = "bind";
    return;
  }
  if (!isHelperLineupEnabled() || !helperConfig?.features?.team_restore) {
    setHelperSwitchMessage(getHelperLineupDisabledReason("当前环境未开启 helper 安全恢复 Beta。"), "error");
    return;
  }
  const activeBinding = getActiveHelperBinding();
  if (!activeBinding) {
    setHelperSwitchMessage("请先完成 helper 角色绑定，再执行安全恢复。", "error");
    return;
  }
  const targetSnapshot = (currentHelperSnapshots || []).find(
    (item) => Number(item?.id) === Number(snapshotId || 0)
  );
  if (!targetSnapshot) {
    setHelperSwitchMessage("未找到要恢复的目标快照，请先刷新快照列表。", "error");
    return;
  }
  const restoreBlockReason = getSnapshotSafeRestoreBlockReason(targetSnapshot);
  if (restoreBlockReason) {
    setHelperSwitchMessage(restoreBlockReason, "error");
    return;
  }
  const restorePlan = buildHelperRestorePlanFromSnapshot(targetSnapshot);
  if (!restorePlan.team_id || !Array.isArray(restorePlan.heroes) || !restorePlan.heroes.length) {
    setHelperSwitchMessage("这份快照缺少足够的恢复信息，请先重新读取一份新快照。", "error");
    return;
  }
  const confirmed = window.confirm(
    [
      `确认一键还原到“${buildHelperSnapshotName(targetSnapshot)}”？`,
      "系统会自动校对洗练归属，再恢复阵容、等级、鱼灵、鱼珠、科技和玩具。",
      "不会回滚洗练数值本身。",
    ].join("\n")
  );
  if (!confirmed) {
    setHelperSwitchMessage(`已取消还原“${buildHelperSnapshotName(targetSnapshot)}”。`, "");
    return;
  }
  const opened = runHelperBridgeInBackground(
    buildHelperBridgeTeamRestoreUrl(activeBinding, snapshotId, restorePlan),
    "teamRestore"
  );
  if (!opened) {
    setHelperSwitchMessage("当前页面暂时无法执行一键还原，请稍后重试。", "error");
    return;
  }
  setHelperRestoreProgress({
    status: "running",
    percent: 0,
    label: "准备还原",
    detail: `正在打开“${buildHelperSnapshotName(targetSnapshot)}”的恢复窗口`,
  });
  setHelperSwitchMessage(
    `正在还原“${buildHelperSnapshotName(targetSnapshot)}”，完成后会自动同步最新状态。`,
    "success"
  );
}

async function savePendingHelperBinding() {
  if (!currentProfile) {
    setHelperBindMessage("请先登录商城账号。", "error");
    return;
  }
  if (!pendingHelperBridgePayload) {
    setHelperBindMessage("当前没有待保存的 helper 角色，请先扫码选择角色。", "error");
    return;
  }
  try {
    const result = await apiFetch("/helper/bindings/current", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: pendingHelperBridgePayload.game_role_id,
        game_server: pendingHelperBridgePayload.game_server,
        game_role_name: pendingHelperBridgePayload.game_role_name,
        bind_token_id: pendingHelperBridgePayload.bind_token_id || "",
        nickname: pendingHelperBridgePayload.nickname || "",
        helper_token: pendingHelperBridgePayload.helper_token || "",
        helper_ws_url: pendingHelperBridgePayload.helper_ws_url || "",
        helper_import_method: pendingHelperBridgePayload.helper_import_method || "",
      }),
    });
    await Promise.allSettled([loadHelperBindings(), loadHelperInventories()]);
    setActiveHelperBinding(result?.id);
    setHelperBindMessage("角色已绑定到当前商城账号。", "success");
    renderHelperBindingPanel();
    renderHelperTeamSwitchPanel();
  } catch (error) {
    setHelperBindMessage(`绑定失败：${pickErrorMessage(error, "绑定失败")}`, "error");
  }
}

async function removeHelperBinding(bindingId) {
  try {
    await apiFetch(`/helper/bindings/current/${bindingId}`, {
      method: "DELETE",
    });
    currentHelperBindings = (currentHelperBindings || []).filter(
      (item) => Number(item?.id || 0) !== Number(bindingId || 0)
    );
    syncActiveHelperBindingPreference();
    await loadHelperInventories();
    setHelperBindMessage("helper 绑定已解除。", "success");
    renderHelperBindingPanel();
    renderHelperTeamSwitchPanel();
  } catch (error) {
    setHelperBindMessage(`解绑失败：${pickErrorMessage(error, "解绑失败")}`, "error");
  }
}

function clearPendingHelperSelection() {
  pendingHelperBridgePayload = null;
  clearHelperBridgeSession();
  clearPendingHelperBridgeIntent();
  renderHelperBindingPanel();
  setHelperBindMessage("已清空刚刚扫码带回来的角色。", "success");
}

async function autoBindHelperRoleToCurrentSession(payload) {
  if (!isHelperLineupEnabled() || !helperConfig?.features?.scan_bind) return null;
  try {
    const result = await apiFetch("/helper/bindings/current", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: payload.game_role_id,
        game_server: payload.game_server,
        game_role_name: payload.game_role_name,
        bind_token_id: payload.bind_token_id || "",
        nickname: payload.nickname || "",
        helper_token: payload.helper_token || "",
        helper_ws_url: payload.helper_ws_url || "",
        helper_import_method: payload.helper_import_method || "",
      }),
    });
    await loadHelperBindings();
    setActiveHelperBinding(result?.id);
    renderHelperBindingPanel();
    renderHelperTeamSwitchPanel();
    return result;
  } catch (error) {
    console.warn("auto bind helper role failed", error);
    return null;
  }
}

async function completeHelperScanAuth(payload) {
  setHelperAuthMessage("正在通过扫码进入商城...", "");
  try {
    const result = await apiFetch("/auth/game/bind", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: payload.game_role_id,
        game_server: payload.game_server,
        game_role_name: payload.game_role_name,
        bind_token_id: payload.bind_token_id || "",
        nickname: payload.nickname || "",
      }),
    });
    saveSession(result);
    const immediateProfile = getSessionProfileFallback(result);
    if (immediateProfile) {
      renderSessionSummary(immediateProfile);
      renderProfile(immediateProfile, { balance: Number(immediateProfile.quota_balance ?? 0) }, []);
    }
    await loadHelperConfig();
    pendingHelperBridgePayload = null;
    clearHelperBridgeSession();
    clearPendingHelperBridgeIntent();
    await autoBindHelperRoleToCurrentSession(payload);
    schedulePostAuthAccountFocus();
    const successMessage = `已进入账号 ${payload.game_role_name}，后续阵容会默认绑定这个角色。`;
    closeHelperBridgeModal();
    setHelperAuthMessage(successMessage, "success");
    setNotice(successMessage, "success");
    activateAccountTab("overview");
    window.location.hash = isHelperLineupEnabled() ? "helper-lab" : "account";
    await Promise.allSettled([loadAccount(), loadHelperBindings(), loadHelperSnapshots(), loadHelperActionLogs()]);
  } catch (error) {
    const message = pickErrorMessage(error, "扫码进入失败");
    setHelperAuthMessage(`扫码进入失败：${message}`, "error");
    setNotice(`扫码进入失败：${message}`, "error");
  }
}

function clearHelperRestorePreview() {
  currentHelperRestorePreview = null;
  pendingHelperPreviewSnapshotId = null;
  renderHelperRestorePreviewPanel();
  setHelperPreviewMessage("恢复预演结果已清空。", "success");
}

async function saveHelperInventoryFromBridge(payload) {
  const created = await apiFetch("/helper/inventories", {
    method: "POST",
    body: JSON.stringify({
      binding_id:
        payload?.binding_id === undefined || payload?.binding_id === null
          ? null
          : Number(payload.binding_id),
      source_type: "helper_bridge",
      summary: payload?.summary || {},
      items: Array.isArray(payload?.items) ? payload.items : [],
    }),
  });
  await loadHelperInventories();
  return created;
}

async function saveHelperSnapshotFromBridge(payload) {
  const activeBinding = getActiveHelperBinding();
  const snapshotLimit = Math.max(Number(helperConfig?.limits?.snapshots_per_user || 3) || 3, 1);
  const snapshotCount = Array.isArray(currentHelperSnapshots) ? currentHelperSnapshots.length : 0;
  if (snapshotCount >= snapshotLimit) {
    throw new Error(`每个账号最多保存 ${snapshotLimit} 套阵容，请先删除旧阵容。`);
  }
  const snapshotName =
    String(payload?.summary?.role_name || "").trim()
      ? `${String(payload.summary.role_name).trim()} · 阵容 ${Number(payload?.summary?.use_team_id || 1)}`
      : "阵容快照";
  const created = await apiFetch("/helper/snapshots", {
    method: "POST",
    body: JSON.stringify({
      binding_id: activeBinding?.id ?? null,
      source_type: "helper_bridge",
      snapshot_name: snapshotName,
      summary: payload?.summary || {},
      raw: payload?.raw || {},
    }),
  });
  currentHelperSnapshots = sortHelperSnapshotsList([
    created,
    ...(currentHelperSnapshots || []).filter((item) => Number(item.id) !== Number(created.id)),
  ]);
  renderHelperSnapshotPanel();
  return created;
}

async function saveHelperActionLogFromBridge(payload) {
  const activeBinding = getActiveHelperBinding();
  const created = await apiFetch("/helper/action-logs", {
    method: "POST",
    body: JSON.stringify({
      binding_id: activeBinding?.id ?? null,
      action_type: payload?.action_type || "helper_team_switch",
      action_payload: payload?.action_payload || {},
      result_status: payload?.result_status || "ok",
      result_payload: payload?.result_payload || {},
    }),
  });
  currentHelperActionLogs = [
    created,
    ...(currentHelperActionLogs || []).filter((item) => Number(item.id) !== Number(created.id)),
  ];
  renderHelperTeamSwitchPanel();
  return created;
}

async function removeHelperSnapshot(snapshotId) {
  try {
    await apiFetch(`/helper/snapshots/${snapshotId}`, {
      method: "DELETE",
    });
    expandedHelperSnapshotIds.delete(Number(snapshotId || 0));
    currentHelperSnapshots = (currentHelperSnapshots || []).filter(
      (item) => Number(item.id) !== Number(snapshotId)
    );
    if (Number(currentHelperRestorePreview?.target_snapshot_id || 0) === Number(snapshotId || 0)) {
      currentHelperRestorePreview = null;
      renderHelperRestorePreviewPanel();
    }
    renderHelperSnapshotPanel();
    setHelperSnapshotMessage("阵容快照已删除。", "success");
  } catch (error) {
    setHelperSnapshotMessage(`删除快照失败：${pickErrorMessage(error, "删除失败")}`, "error");
  }
}

async function renameHelperSnapshot(snapshotId) {
  const targetSnapshot = (currentHelperSnapshots || []).find(
    (item) => Number(item?.id) === Number(snapshotId || 0)
  );
  if (!targetSnapshot) {
    setHelperSnapshotMessage("没有找到要重命名的阵容。", "error");
    return;
  }
  const currentName = String(targetSnapshot?.snapshot_name || buildHelperSnapshotName(targetSnapshot)).trim();
  const nextName = window.prompt("给这套阵容起个名字", currentName);
  if (nextName === null) return;
  const normalizedName = String(nextName || "").trim();
  if (!normalizedName) {
    setHelperSnapshotMessage("阵容名不能为空。", "error");
    return;
  }
  if (normalizedName.length > 40) {
    setHelperSnapshotMessage("阵容名最多 40 个字。", "error");
    return;
  }
  try {
    const updated = await updateHelperSnapshotMeta(snapshotId, { snapshot_name: normalizedName });
    if (updated) {
      setHelperSnapshotMessage(`阵容已改名为“${normalizedName}”。`, "success");
    }
  } catch (error) {
    setHelperSnapshotMessage(`重命名失败：${pickErrorMessage(error, "保存失败")}`, "error");
  }
}

async function updateHelperSnapshotMeta(snapshotId, payload) {
  const updated = await apiFetch(`/helper/snapshots/${snapshotId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  currentHelperSnapshots = (currentHelperSnapshots || []).map((item) =>
    Number(item?.id) === Number(snapshotId)
      ? updated
      : payload?.is_pinned
        ? { ...item, is_pinned: false }
        : item
  );
  currentHelperSnapshots = sortHelperSnapshotsList(currentHelperSnapshots);
  if (Number(currentHelperRestorePreview?.target_snapshot_id || 0) === Number(snapshotId || 0)) {
    currentHelperRestorePreview = {
      ...currentHelperRestorePreview,
      target_snapshot_name: updated.snapshot_name,
    };
    renderHelperRestorePreviewPanel();
  }
  renderHelperSnapshotPanel();
  return updated;
}

async function togglePinHelperSnapshot(snapshotId) {
  const targetSnapshot = (currentHelperSnapshots || []).find(
    (item) => Number(item?.id) === Number(snapshotId || 0)
  );
  if (!targetSnapshot) {
    setHelperSnapshotMessage("没有找到要置顶的阵容。", "error");
    return;
  }
  const nextPinned = !Boolean(targetSnapshot?.is_pinned);
  try {
    await updateHelperSnapshotMeta(snapshotId, { is_pinned: nextPinned });
    setHelperSnapshotMessage(
      nextPinned
        ? `已将“${buildHelperSnapshotName(targetSnapshot)}”置顶显示。`
        : `已取消“${buildHelperSnapshotName(targetSnapshot)}”的置顶。`,
      "success"
    );
  } catch (error) {
    setHelperSnapshotMessage(`置顶保存失败：${pickErrorMessage(error, "保存失败")}`, "error");
  }
}

function buildHelperRestoreResultMarkup(log) {
  if (!log) {
    return '<div class="stack-item">还没有执行过一键还原。</div>';
  }
  const resultPayload = log?.result_payload || {};
  const restoreCounts = resultPayload?.restore_counts || {};
  const changedBits = [
    restoreCounts?.attachment_transfers ? `洗练归属 ${restoreCounts.attachment_transfers} 套` : "",
    restoreCounts?.hero_adds || restoreCounts?.hero_moves || restoreCounts?.hero_removes
      ? `武将 ${Number(restoreCounts?.hero_adds || 0) + Number(restoreCounts?.hero_moves || 0) + Number(restoreCounts?.hero_removes || 0)} 名`
      : "",
    restoreCounts?.team_attempts > 1 ? `武将重试 ${restoreCounts.team_attempts} 轮` : "",
    restoreCounts?.hero_verify_mismatches ? `武将待确认 ${restoreCounts.hero_verify_mismatches} 处` : "",
    restoreCounts?.artifact_loads || restoreCounts?.artifact_unloads
      ? `鱼灵 ${Number(restoreCounts?.artifact_loads || 0) + Number(restoreCounts?.artifact_unloads || 0)} 次`
      : "",
    restoreCounts?.pearl_skill_changes ? `鱼珠 ${restoreCounts.pearl_skill_changes} 处` : "",
    restoreCounts?.legion_steps || restoreCounts?.legion_resets
      ? `科技 ${Number(restoreCounts?.legion_steps || 0) + Number(restoreCounts?.legion_resets || 0)} 步`
      : "",
    restoreCounts?.legion_attempts > 1 ? `科技重试 ${restoreCounts.legion_attempts} 轮` : "",
    restoreCounts?.legion_verify_mismatches ? `科技待确认 ${restoreCounts.legion_verify_mismatches} 项` : "",
    restoreCounts?.weapon_changes ? `玩具 ${restoreCounts.weapon_changes} 次` : "",
  ].filter(Boolean);
  const warnings = Array.isArray(resultPayload?.warnings) ? resultPayload.warnings : [];
  const resultCards = [
    { label: "恢复目标", value: log?.action_payload?.snapshot_name || "阵容还原" },
    {
      label: "当前落点",
      value: `${resultPayload?.role_name || "-"} / ${resultPayload?.use_team_id ? `${resultPayload.use_team_id} 号阵容` : "目标阵容"}`,
    },
    {
      label: "本次动作",
      value: changedBits.length ? changedBits.slice(0, 3).join(" · ") : "没有明显变更",
    },
    {
      label: "待确认项",
      value: warnings.length ? `${warnings.length} 条` : "无",
      accent: warnings.length ? "warning" : "success",
    },
  ]
    .map(
      (item) => `
        <article class="helper-restore-stat ${item.accent || ""}">
          <div class="helper-restore-stat-label">${escapeHtml(item.label)}</div>
          <div class="helper-restore-stat-value">${escapeHtml(item.value)}</div>
        </article>
      `
    )
    .join("");
  return `
    <div class="helper-restore-result-card ${escapeHtml(log?.result_status || "ok")}">
      <div class="helper-restore-result-head">
        <div>
          <div class="helper-snapshot-kicker">最近一次还原</div>
          <strong class="helper-snapshot-title">${escapeHtml(log?.action_payload?.snapshot_name || "阵容还原")}</strong>
        </div>
        <div class="helper-snapshot-time">
          <div>${escapeHtml(formatRelativeActionTime(log?.created_at))}</div>
          <div>${escapeHtml(formatDate(log?.created_at))}</div>
        </div>
      </div>
      <div class="helper-snapshot-summary">已恢复到 ${escapeHtml(resultPayload?.role_name || "-")} / ${escapeHtml(resultPayload?.server || "-")} / ${escapeHtml(resultPayload?.use_team_id ? `${resultPayload.use_team_id}号阵容` : "目标阵容")}</div>
      <div class="helper-restore-stat-grid">${resultCards}</div>
      <div class="helper-hero-meta helper-hero-meta-soft">
        ${
          changedBits.length
            ? changedBits.map((item) => `<span class="helper-chip">${escapeHtml(item)}</span>`).join("")
            : '<span class="helper-chip">本次没有检测到明显变更</span>'
        }
      </div>
      <div class="helper-status-meta helper-restore-message">${escapeHtml(resultPayload?.message || "阵容还原已执行。")}</div>
      ${
        warnings.length
          ? `<div class="helper-restore-warning-list">${warnings
              .map((item) => `<div class="helper-restore-warning-item">${escapeHtml(item)}</div>`)
              .join("")}</div>`
          : '<div class="helper-status-meta">仅记录未处理项：无</div>'
      }
    </div>
  `;
}

function renderHelperRestoreResultPanel() {
  if (!helperRestoreResultCurrent) return;
  const latestRestoreLog = (currentHelperActionLogs || []).find(
    (item) => String(item?.action_type || "").trim() === "helper_team_restore"
  );
  helperRestoreResultCurrent.innerHTML = buildHelperRestoreResultMarkup(latestRestoreLog);
}

function handleHelperBridgeMessage(event) {
  const data = event?.data;
  if (!data) {
    return false;
  }
  if (typeof data?.type === "string" && data.type.startsWith("gongfa_helper_")) {
    setDebugLine("helper.message", data.type);
  }
  if (data.type === "gongfa_helper_team_switch_result") {
    clearHelperBridgeBackgroundFrame();
    saveHelperActionLogFromBridge(data.payload || {})
      .then((created) => {
        const fallbackMessage =
          created?.result_status === "ok"
            ? `已切换到阵容 ${created?.result_payload?.use_team_id || created?.action_payload?.team_id || "-"}.`
            : `切换到阵容 ${created?.action_payload?.team_id || "-"} 失败。`;
        setHelperSwitchMessage(created?.result_payload?.message || fallbackMessage, created?.result_status === "ok" ? "success" : "error");
        loadHelperActionLogs();
        window.location.hash = "helper-lab";
      })
      .catch((error) => {
        setHelperSwitchMessage(`切换记录保存失败：${pickErrorMessage(error, "保存失败")}`, "error");
      });
    return true;
  }
  if (data.type === "gongfa_helper_legacy_inventory") {
    clearHelperBridgeBackgroundFrame();
    saveHelperInventoryFromBridge(data.payload || {})
      .then((created) => {
        helperInventorySyncState.completed += 1;
        const bindingRoleName =
          normalizeHelperDisplayRoleName(
            created?.binding?.game_role_name || created?.summary?.role_name,
            created?.binding?.game_role_id || created?.summary?.role_id
          ) || "该角色";
        setHelperInventoryMessage(
          `已同步 ${bindingRoleName} 的功法库存，当前共 ${Number(created?.summary?.legacy_count || created?.items?.length || 0)} 张功法。`,
          "success"
        );
        if (helperInventorySyncState.running) {
          startNextHelperInventorySyncInQueue();
        }
        window.location.hash = "helper-lab";
      })
      .catch((error) => {
        helperInventorySyncState.failures.push({
          binding_id: Number(data?.payload?.binding_id || 0),
          role_name: String(data?.payload?.summary?.role_name || "").trim() || "未命名角色",
          message: pickErrorMessage(error, "保存失败"),
        });
        setHelperInventoryMessage(`功法库存保存失败：${pickErrorMessage(error, "保存失败")}`, "error");
        if (helperInventorySyncState.running) {
          startNextHelperInventorySyncInQueue();
        }
      });
    return true;
  }
  if (data.type === "gongfa_helper_legacy_inventory_error") {
    clearHelperBridgeBackgroundFrame();
    helperInventorySyncState.failures.push({
      binding_id: Number(data?.payload?.binding_id || 0),
      role_name: String(data?.payload?.role_name || "").trim() || "未命名角色",
      message: String(data?.payload?.message || "功法库存同步失败").trim(),
    });
    setHelperInventoryMessage(
      String(data?.payload?.message || "功法库存同步失败").trim() || "功法库存同步失败",
      "error"
    );
    if (helperInventorySyncState.running) {
      startNextHelperInventorySyncInQueue();
    }
    return true;
  }
  if (data.type === "gongfa_helper_team_snapshot") {
    clearHelperBridgeBackgroundFrame();
    saveHelperSnapshotFromBridge(data.payload || {})
      .then((created) => {
        setHelperSnapshotMessage(
          `阵容已保存：${buildHelperSnapshotName(created)}。`,
          "success"
        );
        loadHelperSnapshots();
        window.location.hash = "helper-lab";
      })
      .catch((error) => {
        setHelperSnapshotMessage(`快照保存失败：${pickErrorMessage(error, "保存失败")}`, "error");
      });
    return true;
  }
  if (data.type === "gongfa_helper_team_restore_result") {
    clearHelperBridgeBackgroundFrame();
    saveHelperActionLogFromBridge(data.payload || {})
      .then((created) => {
        const fallbackMessage =
          created?.result_status === "ok" || created?.result_status === "warning"
            ? "阵容还原已执行。"
            : "阵容还原失败。";
        const resultPayload = created?.result_payload || {};
        setHelperRestoreProgress({
          status:
            created?.result_status === "error"
              ? "error"
              : created?.result_status === "warning"
                ? "warning"
                : "success",
          percent: 100,
          label:
            created?.result_status === "error"
              ? "恢复失败"
              : created?.result_status === "warning"
                ? "恢复完成，仍有待确认项"
                : "恢复完成",
          detail: resultPayload?.message || fallbackMessage,
        });
        setHelperSwitchMessage(
          resultPayload?.message || fallbackMessage,
          created?.result_status === "ok" || created?.result_status === "warning" ? "success" : "error"
        );
        currentHelperRestorePreview = null;
        renderHelperRestorePreviewPanel();
        loadHelperSnapshots();
        loadHelperActionLogs();
        window.location.hash = "helper-lab";
      })
      .catch((error) => {
        setHelperSwitchMessage(`恢复记录保存失败：${pickErrorMessage(error, "保存失败")}`, "error");
      });
    return true;
  }
  if (data.type === "gongfa_helper_team_restore_progress") {
    setHelperRestoreProgress(data.payload || null);
    window.location.hash = "helper-lab";
    return true;
  }
  if (data.type === "gongfa_helper_team_preview") {
    clearHelperBridgeBackgroundFrame();
    const snapshotId = Number(data?.payload?.snapshot_id || pendingHelperPreviewSnapshotId || 0);
    const targetSnapshot = (currentHelperSnapshots || []).find((item) => Number(item?.id) === snapshotId);
    if (!targetSnapshot) {
      setHelperPreviewMessage("收到预演结果，但目标快照已不存在或尚未加载。", "error");
      return true;
    }
    currentHelperRestorePreview = buildHelperRestorePreview(targetSnapshot, data?.payload?.live_snapshot || {});
    pendingHelperPreviewSnapshotId = null;
    renderHelperRestorePreviewPanel();
      setHelperPreviewMessage(
      `系统已完成还原核对：${currentHelperRestorePreview.safe_step_count || 0} 项可自动处理，${currentHelperRestorePreview.recorded_only_count || 0} 项仅记录。`,
      "success"
    );
    window.location.hash = "helper-lab";
    return true;
  }
  if (data.type !== "gongfa_helper_bind_role") {
    return false;
  }
  const payload = normalizeBindPayload(data.payload || data);
  if (!payload) {
    const pendingIntent = getPendingHelperBridgeIntent();
    if (pendingIntent === HELPER_BRIDGE_INTENT_AUTH) {
      setHelperAuthMessage("收到的 helper 回传数据不完整，请重新选择角色。", "error");
    } else {
      setHelperBindMessage("收到的 helper 回传数据不完整，请重新选择角色。", "error");
    }
    return true;
  }
  const pendingIntent = getPendingHelperBridgeIntent();
  if (pendingIntent === HELPER_BRIDGE_INTENT_AUTH) {
    completeHelperScanAuth(payload);
    return true;
  }
  closeHelperBridgeModal();
  pendingHelperBridgePayload = {
    ...payload,
    helper_token: data.payload?.helper_token || "",
    helper_ws_url: data.payload?.helper_ws_url || "",
    helper_import_method: data.payload?.helper_import_method || "wxQrcode",
  };
  saveHelperBridgeSession(pendingHelperBridgePayload);
  clearPendingHelperBridgeIntent();
  fillBindForm(payload);
  renderHelperBindingPanel();
  renderHelperRestorePreviewPanel();
  setHelperBindMessage(`已接收角色：${payload.game_role_name}，确认后可绑定到当前商城账号。`, "success");
  window.location.hash = "helper-lab";
  return true;
}

function renderHelperLab() {
  const enabled = isHelperLineupEnabled();
  const features = helperConfig?.features || {};
  const publicBase = String(helperConfig?.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
  const accessReason = getHelperLineupDisabledReason();

  helperLabSection?.classList.toggle("hidden", !enabled);
  helperLabDockItem?.classList.toggle("hidden", !enabled);
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
  renderHelperSnapshotPanel();
  renderHelperRestoreProgressPanel();
  renderHelperRestorePreviewPanel();
  renderHelperTeamSwitchPanel();
}

async function loadHelperConfig() {
  try {
    const result = await apiFetch("/helper/config");
    helperConfig = {
      ...helperConfig,
      ...(result || {}),
      features: {
        ...helperConfig.features,
        ...(result?.features || {}),
      },
      plans: {
        ...helperConfig.plans,
        ...(result?.plans || {}),
      },
      access: {
        ...helperConfig.access,
        ...(result?.access || {}),
      },
    };
    const defaultOrigin = String(helperConfig.public_base || "/xyzw-helper").trim() || "/xyzw-helper";
    const resolvedOrigin = ensureHelperOrigin(defaultOrigin);
    helperOriginInput.value = resolvedOrigin;
  } catch (error) {
    console.warn("helper config load failed", error);
  } finally {
    renderHelperLab();
    loadHelperBindings();
    loadHelperInventories();
    loadHelperSnapshots();
    loadHelperActionLogs();
  }
}

function renderSessionSummary(profile) {
  updateShellVisibility(profile);
  renderHelperAuthEntry();
  if (!profile) {
    sessionSummary.textContent = "未登录";
    sessionRole.textContent = "请先登录账号再充值或下单。";
    fillAccountForms(null);
    return;
  }

  sessionSummary.textContent = profile.game_role_name || "已登录";
  const authLabel = profile.auth_provider === "password" ? "密码登录" : "绑定登录";
  const serverText = profile.game_server || "未填写区服";
  const roleLabel =
    profile.role === "admin"
      ? "管理员"
      : profile.role === "poster_admin"
        ? "海报后台"
        : profile.role || "用户";
  sessionRole.textContent = `${serverText} / ${roleLabel} / ${authLabel}`;
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

function buildCategoryEntries(products) {
  const labels = {
    all: "全部",
    current_season: "本赛季",
    legacy_season: "往赛季",
    bundle: "套餐",
  };
  const counts = { all: Array.isArray(products) ? products.length : 0 };
  for (const product of products || []) {
    const key = getTopCategoryKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderCategoryTabs(container, products, activeKey, dataAttr = "category") {
  if (!container) return activeKey;
  const entries = buildCategoryEntries(products || []);
  const validKeys = new Set(entries.map((item) => item.key));
  const nextActiveKey = validKeys.has(activeKey) ? activeKey : "all";
  container.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="category-tab ${entry.key === nextActiveKey ? "active" : ""}"
          data-${dataAttr}="${entry.key}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="category-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function getGoldSubcategory(product) {
  if (getTierKey(product) !== "gold" || isBundle(product)) return "all";
  const legacyId = Number(product?.legacy_id || 0);
  if (legacyId >= 600) return "rare";
  const extStats = parseExtAttrStats(product?.ext_attrs);
  if (extStats.fire > 0 && extStats.calm > 0) return "double_term";
  if (extStats.fire > 0) return "fire_only";
  if (extStats.calm > 0) return "calm_only";
  return "no_term";
}

function getNameSubcategoryKey(product) {
  const name = String(product?.name || "").trim();
  return name ? `name:${name}` : "all";
}

function buildSubcategoryEntries(products, category) {
  if (category === "bundle") return [];
  const subset = (products || []).filter((product) => !isBundle(product));
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
    const key = getTierKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderSubcategoryTabs(container, products, category, activeKey, dataAttr = "subcategory") {
  if (!container) return activeKey;
  if (!category || category === "bundle") {
    container.classList.add("hidden");
    container.innerHTML = "";
    return "all";
  }

  const entries = buildSubcategoryEntries(products || [], category);
  const validKeys = new Set(entries.map((entry) => entry.key));
  const nextActiveKey = validKeys.has(activeKey) ? activeKey : "all";
  container.classList.toggle("hidden", entries.length <= 1);
  container.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === nextActiveKey ? "active" : ""}"
          data-${dataAttr}="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function buildDetailEntries(products, tier) {
  if (!tier || tier === "all" || tier === "bundle") return [];
  const subset = (products || []).filter((product) => !isBundle(product) && getTierKey(product) === tier);
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
      const key = getGoldSubcategory(product);
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(labels)
      .filter(([key]) => key === "all" || counts[key] > 0)
      .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
  }

  const counts = new Map();
  for (const product of subset) {
    const key = getNameSubcategoryKey(product);
    counts.set(key, {
      key,
      label: String(product?.name || "未命名"),
      count: (counts.get(key)?.count || 0) + 1,
    });
  }

  return [
    { key: "all", label: `全部${getTierLabelByKey(tier)}`, count: subset.length },
    ...Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label), "zh-Hans-CN")
    ),
  ];
}

function renderDetailTabs(container, products, tier, activeKey, dataAttr = "detail") {
  if (!container) return activeKey;
  const entries = buildDetailEntries(products || [], tier);
  if (entries.length <= 1) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return "all";
  }

  const validKeys = new Set(entries.map((entry) => entry.key));
  const nextActiveKey = validKeys.has(activeKey) ? activeKey : "all";
  container.classList.remove("hidden");
  container.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === nextActiveKey ? "active" : ""}"
          data-${dataAttr}="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function getFullnessKey(product) {
  const attackFull = isAttackFull(product);
  const hpFull = isHpFull(product);
  if (attackFull && hpFull) return "double_full";
  if (attackFull) return "attack_full";
  if (hpFull) return "hp_full";
  return "none_full";
}

function buildFullnessEntries(products, enabled) {
  if (!enabled) return [];
  const subset = (products || []).filter((product) => !isBundle(product));
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
    const key = getFullnessKey(product);
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(labels)
    .filter(([key]) => key === "all" || counts[key] > 0)
    .map(([key, label]) => ({ key, label, count: counts[key] || 0 }));
}

function renderFullnessTabs(container, products, enabled, activeKey, dataAttr = "fullness") {
  if (!container) return activeKey;
  const entries = buildFullnessEntries(products || [], enabled);
  if (entries.length <= 1) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return "all";
  }

  const validKeys = new Set(entries.map((entry) => entry.key));
  const nextActiveKey = validKeys.has(activeKey) ? activeKey : "all";
  container.classList.remove("hidden");
  container.innerHTML = entries
    .map(
      (entry) => `
        <button
          type="button"
          class="subcategory-tab ${entry.key === nextActiveKey ? "active" : ""}"
          data-${dataAttr}="${escapeHtml(entry.key)}"
        >
          <span class="tab-label">${escapeHtml(entry.label)}</span>
          <span class="subcategory-count">${entry.count}</span>
        </button>
      `
    )
    .join("");
  return nextActiveKey;
}

function resetProductPagination() {
  productPaginationState.page = 1;
}

function resetDiscountPagination() {
  discountPaginationState.page = 1;
}

function scrollProductsIntoView() {
  productsSection?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function getPagedProducts(products) {
  const total = Array.isArray(products) ? products.length : 0;
  const pageSize = Number(productPaginationState.pageSize || 12);
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const page = Math.min(
    Math.max(Number(productPaginationState.page || 1), 1),
    Math.max(totalPages, 1)
  );

  productPaginationState.page = page;
  productPaginationState.total = total;
  productPaginationState.totalPages = totalPages;

  if (total === 0) {
    return [];
  }

  const start = (page - 1) * pageSize;
  return products.slice(start, start + pageSize);
}

function getPagedDiscountProducts(products) {
  const total = Array.isArray(products) ? products.length : 0;
  const pageSize = Number(discountPaginationState.pageSize || 12);
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const page = Math.min(
    Math.max(Number(discountPaginationState.page || 1), 1),
    Math.max(totalPages, 1)
  );

  discountPaginationState.page = page;
  discountPaginationState.total = total;
  discountPaginationState.totalPages = totalPages;

  if (total === 0) {
    return [];
  }

  const start = (page - 1) * pageSize;
  return products.slice(start, start + pageSize);
}

function renderProductPagination() {
  if (!productPagination) return;

  const total = Number(productPaginationState.total || 0);
  const page = Math.max(Number(productPaginationState.page || 1), 1);
  const totalPages = Math.max(Number(productPaginationState.totalPages || 0), 0);

  if (total === 0) {
    productPagination.innerHTML = '<div class="pagination-meta">当前共 0 件商品。</div>';
    return;
  }

  productPagination.innerHTML = `
    <div class="pagination-meta">第 ${page} / ${Math.max(totalPages, 1)} 页，共 ${total} 件商品</div>
    <div class="pagination-actions">
      <button
        class="ghost"
        type="button"
        data-product-page="${Math.max(page - 1, 1)}"
        ${page <= 1 ? "disabled" : ""}
      >上一页</button>
      <button
        class="ghost"
        type="button"
        data-product-page="${Math.min(page + 1, Math.max(totalPages, 1))}"
        ${totalPages === 0 || page >= totalPages ? "disabled" : ""}
      >下一页</button>
    </div>
  `;
}

function filterProductsByCategory(products, category) {
  if (!category || category === "all") return products || [];
  if (category === "current_season") {
    return (products || []).filter((product) => !isBundle(product) && isCurrentSeasonProduct(product));
  }
  if (category === "legacy_season") {
    return (products || []).filter((product) => !isBundle(product) && !isCurrentSeasonProduct(product));
  }
  return (products || []).filter((product) => getProductCategory(product) === category);
}

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
}

function buildProductSearchText(product) {
  return [
    product?.name,
    product?.legacy_id,
    product?.uid,
    product?.ext_attrs,
    product?.item_id,
    product?.description,
  ]
    .map((item) => String(item || "").trim().toLowerCase())
    .join(" ");
}

function filterProductsByKeyword(products, keyword) {
  const needle = normalizeSearchText(keyword);
  if (!needle) return products || [];
  return (products || []).filter((product) => buildProductSearchText(product).includes(needle));
}

function filterProductsBySubcategory(products, category, subcategory) {
  if (!category || category === "bundle") return products || [];
  if (!subcategory || subcategory === "all") return products || [];
  return (products || []).filter((product) => getTierKey(product) === subcategory);
}

function filterProductsByDetail(products, tier, detail) {
  if (!tier || tier === "all" || tier === "bundle") return products || [];
  if (!detail || detail === "all") return products || [];
  if (tier === "gold") {
    return (products || []).filter((product) => getGoldSubcategory(product) === detail);
  }
  return (products || []).filter((product) => getNameSubcategoryKey(product) === detail);
}

function filterProductsByFullness(products, fullness) {
  if (!fullness || fullness === "all") return products || [];
  return (products || []).filter((product) => getFullnessKey(product) === fullness);
}

function getTierOrder(product) {
  const mapping = {
    gold: 6,
    red: 5,
    orange: 4,
    purple: 3,
    blue: 2,
    green: 1,
    bundle: 0,
  };
  return mapping[getTierKey(product)] || 0;
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

function compareShopDefault(a, b) {
  const aIsBundle = isBundle(a);
  const bIsBundle = isBundle(b);
  if (aIsBundle !== bIsBundle) return aIsBundle ? 1 : -1;

  if (aIsBundle && bIsBundle) {
    const rankDiff = Number(a?.display_rank || 999) - Number(b?.display_rank || 999);
    if (rankDiff !== 0) return rankDiff;
    return Number(b?.item_id || 0) - Number(a?.item_id || 0);
  }

  const tierDiff = getTierOrder(b) - getTierOrder(a);
  if (tierDiff !== 0) return tierDiff;

  const seasonDiff = Number(Boolean(b?.is_current_season)) - Number(Boolean(a?.is_current_season));
  if (seasonDiff !== 0) return seasonDiff;

  const aExt = parseExtAttrStats(a?.ext_attrs);
  const bExt = parseExtAttrStats(b?.ext_attrs);
  const kindDiff = bExt.kindRank - aExt.kindRank;
  if (kindDiff !== 0) return kindDiff;

  const totalDiff = bExt.total - aExt.total;
  if (totalDiff !== 0) return totalDiff;

  const fireDiff = bExt.fire - aExt.fire;
  if (fireDiff !== 0) return fireDiff;

  const calmDiff = bExt.calm - aExt.calm;
  if (calmDiff !== 0) return calmDiff;

  const attackDiff = Number(b?.attack_value || 0) - Number(a?.attack_value || 0);
  if (attackDiff !== 0) return attackDiff;

  const hpDiff = Number(b?.hp_value || 0) - Number(a?.hp_value || 0);
  if (hpDiff !== 0) return hpDiff;

  const priceDiff = Number(b?.price_quota || 0) - Number(a?.price_quota || 0);
  if (priceDiff !== 0) return priceDiff;

  return Number(b?.item_id || 0) - Number(a?.item_id || 0);
}

function sortProducts(products, sortMode) {
  const list = [...(products || [])];
  const sorters = {
    shop_default: compareShopDefault,
    price_asc: (a, b) => Number(a.price_quota || 0) - Number(b.price_quota || 0) || compareShopDefault(a, b),
    price_desc: (a, b) => Number(b.price_quota || 0) - Number(a.price_quota || 0) || compareShopDefault(a, b),
    attack_desc: (a, b) =>
      Number(b.attack_value || 0) - Number(a.attack_value || 0) || compareShopDefault(a, b),
    attack_asc: (a, b) => Number(a.attack_value || 0) - Number(b.attack_value || 0) || compareShopDefault(a, b),
    hp_desc: (a, b) => Number(b.hp_value || 0) - Number(a.hp_value || 0) || compareShopDefault(a, b),
    hp_asc: (a, b) => Number(a.hp_value || 0) - Number(b.hp_value || 0) || compareShopDefault(a, b),
  };
  list.sort(sorters[sortMode] || sorters.shop_default);
  return list;
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
  return currentRechargeConfig || publicRechargeConfig || null;
}

function getQuotaCashAmount(quotaAmount, rechargeConfig = getEffectiveRechargeConfig()) {
  const quota = Number(quotaAmount || 0);
  const exchangeQuota = Number(rechargeConfig?.exchange_quota || 0);
  const exchangeYuan = Number(rechargeConfig?.exchange_yuan || 0);
  if (!Number.isFinite(quota) || quota <= 0 || exchangeQuota <= 0 || exchangeYuan <= 0) {
    return null;
  }
  return (quota * exchangeYuan) / exchangeQuota;
}

function getOriginalQuotaPrice(product) {
  const original = Number(product?.original_price_quota || 0);
  const current = Number(product?.price_quota || 0);
  return original > 0 ? original : current;
}

function isDiscountedProduct(product) {
  return (
    !isBundle(product) &&
    Boolean(product?.is_discounted) &&
    Number(product?.original_price_quota || 0) > Number(product?.price_quota || 0)
  );
}

function getDiscountedProducts(products) {
  return (products || [])
    .filter((product) => isDiscountedProduct(product))
    .sort((a, b) => {
      const rateDiff = Number(a?.discount_rate || 100) - Number(b?.discount_rate || 100);
      if (rateDiff !== 0) return rateDiff;
      const saveDiff =
        Number(b?.discount_saved_quota || 0) - Number(a?.discount_saved_quota || 0);
      if (saveDiff !== 0) return saveDiff;
      return compareShopDefault(a, b);
    });
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
  const amount = getQuotaCashAmount(product?.price_quota, rechargeConfig);
  if (amount === null) return "";
  return formatCashAmount(amount);
}

function getDirectPurchaseAmountYuan(product, rechargeConfig = getEffectiveRechargeConfig()) {
  const cashAmount = getQuotaCashAmount(product?.price_quota, rechargeConfig);
  if (cashAmount === null) return null;
  return Number(cashAmount.toFixed(2));
}

function getQuotaCashText(quotaAmount, rechargeConfig = getEffectiveRechargeConfig()) {
  const cashAmount = getQuotaCashAmount(quotaAmount, rechargeConfig);
  if (cashAmount === null) return "RMB 待定";
  return formatCashAmount(cashAmount);
}

function buildDirectPurchaseContext(product, rechargeConfig = getEffectiveRechargeConfig()) {
  const amountYuan = getDirectPurchaseAmountYuan(product, rechargeConfig);
  if (!product || amountYuan === null) return null;
  return {
    itemId: Number(product.item_id || 0),
    itemKind: String(product.item_kind || "card"),
    productName: String(product.name || "商品"),
    quotaAmount: Number(product.price_quota || 0),
    amountYuan,
  };
}

function getRechargePaymentMethods(rechargeConfig = getEffectiveRechargeConfig()) {
  const methods = [];
  if (String(rechargeConfig?.qr_image_url || "").trim()) {
    methods.push({
      key: "alipay_qr",
      label: "支付宝",
      imageUrl: rechargeConfig.qr_image_url,
      name: rechargeConfig.payee_name || "支付宝收款码",
      hint: rechargeConfig.payee_hint || "扫码转账后再提交审核",
    });
  }
  if (String(rechargeConfig?.wechat_qr_image_url || "").trim()) {
    methods.push({
      key: "wechat_qr",
      label: "微信",
      imageUrl: rechargeConfig.wechat_qr_image_url,
      name: rechargeConfig.wechat_payee_name || "微信收款码",
      hint: rechargeConfig.wechat_payee_hint || "扫码转账后再提交审核",
    });
  }
  return methods;
}

function getGuestPurchaseMethods(rechargeConfig = getEffectiveRechargeConfig()) {
  const methods = [...getRechargePaymentMethods(rechargeConfig)];
  if (rechargeConfig?.residual_transfer_enabled) {
    methods.push({
      key: "game_residual_transfer",
      label: rechargeConfig?.residual_unit_label || "残卷转赠",
    });
  }
  return methods;
}

function ensureRechargePaymentChannel(rechargeConfig = getEffectiveRechargeConfig()) {
  const methods = getRechargePaymentMethods(rechargeConfig);
  if (!methods.length) {
    selectedRechargePaymentChannel = "alipay_qr";
    return null;
  }
  if (!methods.some((item) => item.key === selectedRechargePaymentChannel)) {
    selectedRechargePaymentChannel = methods[0].key;
  }
  return methods.find((item) => item.key === selectedRechargePaymentChannel) || methods[0];
}

function ensureGuestTransferPaymentChannel(rechargeConfig = getEffectiveRechargeConfig()) {
  const methods = getGuestPurchaseMethods(rechargeConfig);
  if (!methods.length) {
    selectedGuestTransferPaymentChannel = "alipay_qr";
    return null;
  }
  if (!methods.some((item) => item.key === selectedGuestTransferPaymentChannel)) {
    selectedGuestTransferPaymentChannel = methods[0].key;
  }
  return (
    methods.find((item) => item.key === selectedGuestTransferPaymentChannel) || methods[0]
  );
}

function getDirectResidualAmount(product, rechargeConfig = getEffectiveRechargeConfig()) {
  const quotaPerUnit = Math.max(Number(rechargeConfig?.residual_quota_per_unit || 0), 0);
  if (!product || quotaPerUnit <= 0) return null;
  return Math.ceil(Number(product?.price_quota || 0) / quotaPerUnit);
}

function formatRechargeChannelLabel(channel) {
  if (String(channel || "").trim() === "wechat_qr") return "微信";
  if (String(channel || "").trim() === "game_residual_transfer") return "残卷转赠";
  return "支付宝";
}

function isPositiveMoneyAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return false;
  return Math.abs(numeric * 100 - Math.round(numeric * 100)) < 0.000001;
}

function formatFullStatValue(value, isFull = false) {
  const compact = formatCompactNumber(value);
  return isFull ? `${compact}（满）` : compact;
}

function renderFullStatValue(value, isFull = false) {
  const className = isFull ? ' class="stat-no-wrap"' : "";
  return `<span${className}>${escapeHtml(formatFullStatValue(value, isFull))}</span>`;
}

function renderStatBlock(label, value, isFull = false, compact = false) {
  const numeric = Number(value || 0);
  const displayValue = isFull
    ? renderFullStatValue(numeric, true)
    : compact
      ? renderFullStatValue(value, false)
      : Number(value || 0);

  return `
    <div class="stat-block ${isFull ? "full" : ""}">
      <span class="stat-label">${escapeHtml(label)}</span>
      <strong class="stat-value">${displayValue}</strong>
    </div>
  `;
}

function formatTermBadgeLabel(label, product) {
  const raw = String(label || "").trim();
  if (!raw) return "";
  if (getTierKey(product) !== "gold") return raw;

  const match = raw.match(/^(走火|气定)\s*([0-9.]+)$/);
  if (!match) return raw;

  const value = Number(match[2] || 0);
  if (!Number.isFinite(value) || value < 3) return raw;
  return `${match[1]} ${match[2]}（满）`;
}

function parseTermBadges(text, product) {
  if (isBundle(product)) {
    const tags = Array.isArray(product?.tags) ? product.tags : [];
    return tags.slice(0, 4).map((item) => ({ label: String(item), kind: "bundle" }));
  }
  const raw = String(text || "").replace(/无/g, "").trim();
  if (!raw) return [];
  return raw
    .split(/[|/、,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((item) => ({ label: formatTermBadgeLabel(item, product), kind: "term" }));
}

function renderTermBadge(badge) {
  return `<span class="term-badge ${escapeHtml(badge.kind || "term")}">${escapeHtml(badge.label || "")}</span>`;
}

function renderProductTermRow(termBadges, limit = 2) {
  if (!termBadges.length) return "";
  const visibleBadges = termBadges.slice(0, limit);
  const overflow = termBadges.length - visibleBadges.length;
  return `
    <div class="term-row compact">
      ${visibleBadges.map((badge) => renderTermBadge(badge)).join("")}
      ${overflow > 0 ? `<span class="term-badge plain term-more">+${overflow}</span>` : ""}
    </div>
  `;
}

function renderProductVisual(product, variant = "grid") {
  if (isBundle(product) && !product?.image_url) {
    return renderBundleCollage(product, variant);
  }

  const payload = getImagePayload(product, product?.item_kind || "card");
  const imageClass = variant === "detail" ? "product-detail-image" : "product-image";
  return `
    <div class="product-image-shell ${variant === "detail" ? "detail" : "grid"}">
      <img
        class="${imageClass}"
        src="${escapeHtml(payload.src)}"
        alt="${escapeHtml(product?.name || "??")}" 
        data-fallbacks="${escapeHtml(payload.fallbacks.join("|"))}"
        data-placeholder="${escapeHtml(payload.placeholder)}"
      />
      <div class="product-badge-row">
        <span class="product-badge">${escapeHtml(getTierLabel(product))}</span>
        <span class="product-badge subtle">${isBundle(product) ? "套餐" : `ID ${escapeHtml(product?.legacy_id || "-")}`}</span>
        ${isBundle(product) ? "" : `<span class="product-badge subtle">${escapeHtml(getSeasonDisplayText(product))}</span>`}
      </div>
    </div>
  `;
}

function renderDiscountPagination() {
  if (!discountProductPagination) return;

  const total = Number(discountPaginationState.total || 0);
  const page = Math.max(Number(discountPaginationState.page || 1), 1);
  const totalPages = Math.max(Number(discountPaginationState.totalPages || 0), 0);

  if (total === 0) {
    discountProductPagination.innerHTML = '<div class="pagination-meta">当前筛选下没有打折商品。</div>';
    return;
  }

  discountProductPagination.innerHTML = `
    <div class="pagination-meta">第 ${page} / ${Math.max(totalPages, 1)} 页，共 ${total} 件商品</div>
    <div class="pagination-actions">
      <button
        class="ghost"
        type="button"
        data-discount-page="${Math.max(page - 1, 1)}"
        ${page <= 1 ? "disabled" : ""}
      >上一页</button>
      <button
        class="ghost"
        type="button"
        data-discount-page="${Math.min(page + 1, Math.max(totalPages, 1))}"
        ${totalPages === 0 || page >= totalPages ? "disabled" : ""}
      >下一页</button>
    </div>
  `;
}

function renderProductCard(product) {
  const termBadges = parseTermBadges(product.ext_attrs, product);
  const cashPriceText = getProductCashPriceText(product);
  const subtitle = isBundle(product)
    ? `${getTierLabel(product)} / 套餐`
    : `${getTierLabel(product)} / ${escapeHtml(getSeasonCompactLabel(product))}`;
  const bodyHtml = isBundle(product)
    ? `<div class="product-meta">${escapeHtml(product.description || product.main_attrs || "套餐商品")}</div>`
    : `
        <div class="product-stats-grid">
          ${renderStatBlock("攻击", product.attack_value, isAttackFull(product), true)}
          ${renderStatBlock("血量", product.hp_value, isHpFull(product), true)}
        </div>
      `;
  const originalPriceQuota = getOriginalQuotaPrice(product);
  const discounted = isDiscountedProduct(product);

  return `
    <article class="product-card ${discounted ? "discounted" : ""}">
      <div class="product-cover">${renderProductVisual(product, "grid")}</div>
      <div class="product-summary">
      <div class="product-headline">
        <div class="discount-title-line">
          <div class="product-name">${escapeHtml(product.name)}</div>
          ${discounted ? `<span class="chip discount">${escapeHtml(product.discount_label || "限时折扣")}</span>` : ""}
        </div>
        <div class="product-type-chip">${subtitle}</div>
      </div>
      ${bodyHtml}
      ${renderProductTermRow(termBadges)}
      </div>
      <div class="chip-row">
        ${discounted ? `<span class="chip original-price">原 ${formatCompactNumber(originalPriceQuota)}</span>` : ""}
        <span class="chip ${discounted ? "accent" : "strong"}">残卷 ${formatCompactNumber(product.price_quota || 0)}</span>
        ${cashPriceText ? `<span class="chip accent soft">${escapeHtml(cashPriceText)}</span>` : ""}
        ${discounted && Number(product.discount_saved_quota || 0) > 0 ? `<span class="chip discount">立省 ${formatCompactNumber(product.discount_saved_quota)}</span>` : ""}
        ${
          product.stock !== null && product.stock !== undefined && Number(product.stock) <= 1
            ? `<span class="chip subtle">余量 ${Number(product.stock || 0)}</span>`
            : ""
        }
      </div>
      <div class="actions">
        <button class="ghost detail-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">详情</button>
        <button class="ghost direct-buy-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">转账锁卡</button>
        <button class="primary buy-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">购买</button>
      </div>
    </article>
  `;
}

function renderDiscountProducts(products) {
  if (!discountProductsSection || !discountProductGrid) return;
  const allDiscountedProducts = getDiscountedProducts(allProducts);
  const discountedProducts = (products || []).filter((product) => isDiscountedProduct(product));
  const hasAnyDiscounts = allDiscountedProducts.length > 0;
  discountProductsSection.classList.toggle("hidden", !hasAnyDiscounts);
  syncDiscountDockVisibility(hasAnyDiscounts);
  if (!hasAnyDiscounts) {
    discountProductGrid.innerHTML = "";
    discountPaginationState.page = 1;
    discountPaginationState.total = 0;
    discountPaginationState.totalPages = 0;
    renderDiscountPagination();
    syncDockWithViewport();
    return;
  }
  if (!discountedProducts.length) {
    discountProductGrid.innerHTML = '<div class="stack-item">当前筛选下没有打折商品。</div>';
    discountPaginationState.page = 1;
    discountPaginationState.total = 0;
    discountPaginationState.totalPages = 0;
    renderDiscountPagination();
    syncDockWithViewport();
    return;
  }
  const pagedDiscountProducts = getPagedDiscountProducts(discountedProducts);
  discountProductGrid.innerHTML = pagedDiscountProducts.map((product) => renderProductCard(product)).join("");
  bindImageFallbacks(discountProductGrid);
  renderDiscountPagination();
  syncDockWithViewport();
}

function applyProductView(options = {}) {
  const { resetPage = false } = options;
  if (resetPage) {
    resetProductPagination();
  }
  const keywordFiltered = filterProductsByKeyword(allProducts, keywordInput?.value || "");
  activeCategory = renderCategoryTabs(productCategoryTabs, keywordFiltered, activeCategory, "category");
  const categoryFiltered = filterProductsByCategory(keywordFiltered, activeCategory);
  activeSubcategory = renderSubcategoryTabs(
    productSubcategoryTabs,
    categoryFiltered,
    activeCategory,
    activeSubcategory,
    "subcategory"
  );
  const subcategoryFiltered = filterProductsBySubcategory(
    categoryFiltered,
    activeCategory,
    activeSubcategory
  );
  activeDetail = renderDetailTabs(
    productDetailTabs,
    categoryFiltered,
    activeSubcategory,
    activeDetail,
    "detail"
  );
  const detailFiltered = filterProductsByDetail(
    subcategoryFiltered,
    activeSubcategory,
    activeDetail
  );
  activeFullness = renderFullnessTabs(
    productFullnessTabs,
    detailFiltered,
    activeCategory !== "bundle" && activeSubcategory !== "all",
    activeFullness,
    "fullness"
  );
  const filtered = filterProductsByFullness(detailFiltered, activeFullness);
  currentProducts = sortProducts(filtered, sortSelect?.value || "shop_default");
  renderProducts(currentProducts);
}

function applyDiscountView(options = {}) {
  const { resetPage = false } = options;
  if (resetPage) {
    resetDiscountPagination();
  }

  const allDiscountedProducts = getDiscountedProducts(allProducts);
  const keywordFiltered = filterProductsByKeyword(allDiscountedProducts, discountKeywordInput?.value || "");
  activeDiscountCategory = renderCategoryTabs(
    discountCategoryTabs,
    keywordFiltered,
    activeDiscountCategory,
    "discount-category"
  );
  const categoryFiltered = filterProductsByCategory(keywordFiltered, activeDiscountCategory);
  activeDiscountSubcategory = renderSubcategoryTabs(
    discountSubcategoryTabs,
    categoryFiltered,
    activeDiscountCategory,
    activeDiscountSubcategory,
    "discount-subcategory"
  );
  const subcategoryFiltered = filterProductsBySubcategory(
    categoryFiltered,
    activeDiscountCategory,
    activeDiscountSubcategory
  );
  activeDiscountDetail = renderDetailTabs(
    discountDetailTabs,
    categoryFiltered,
    activeDiscountSubcategory,
    activeDiscountDetail,
    "discount-detail"
  );
  const detailFiltered = filterProductsByDetail(
    subcategoryFiltered,
    activeDiscountSubcategory,
    activeDiscountDetail
  );
  activeDiscountFullness = renderFullnessTabs(
    discountFullnessTabs,
    detailFiltered,
    activeDiscountCategory !== "bundle" && activeDiscountSubcategory !== "all",
    activeDiscountFullness,
    "discount-fullness"
  );
  const filtered = filterProductsByFullness(detailFiltered, activeDiscountFullness);
  currentDiscountProducts = sortProducts(filtered, discountSortSelect?.value || "shop_default");
  renderDiscountProducts(currentDiscountProducts);
}

function renderProducts(products) {
  const pagedProducts = getPagedProducts(products);

  if (!products || products.length === 0) {
    productGrid.innerHTML = '<div class="stack-item">当前分类下没有已上架商品。</div>';
    renderProductPagination();
    return;
  }

  productGrid.innerHTML = pagedProducts.map((product) => renderProductCard(product)).join("");

  bindImageFallbacks(productGrid);
  renderProductPagination();
}
function formatOrderStatus(status) {
  const mapping = {
    pending: "待处理",
    confirmed: "已完成",
    cancel_requested: "待审核取消",
    cancelled: "已取消",
  };
  return mapping[status] || status || "-";
}

function formatRechargeStatus(status) {
  const mapping = {
    pending_review: "待审核",
    approved: "已通过",
    rejected: "已驳回",
  };
  return mapping[status] || status || "-";
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
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const roundedAmount = Math.ceil(amount / DRAW_SERVICE_STEP_QUOTA) * DRAW_SERVICE_STEP_QUOTA;
  return Math.max(DRAW_SERVICE_MIN_QUOTA, roundedAmount);
}

function setDrawServiceMessage(text, type = "") {
  if (!drawServiceMessage) return;
  drawServiceMessage.textContent = text || "";
  drawServiceMessage.className = type ? `notice ${type}` : "notice";
}

function updateDrawServiceQuote() {
  const amountInput = document.getElementById("draw-service-amount-input");
  const valueNode = document.getElementById("draw-service-quote-value");
  const detailNode = document.getElementById("draw-service-quote-detail");
  if (!amountInput || !valueNode || !detailNode) return;

  const normalizedAmount = normalizeDrawServiceAmount(amountInput.value);
  const balance = Number(currentQuota?.balance ?? currentProfile?.quota_balance ?? 0);

  if (!normalizedAmount) {
    valueNode.textContent = "请输入代抽额度";
    detailNode.textContent = "最低 200，不是 200 的倍数会在提交时自动补齐。";
    return;
  }

  const milestoneCount = Math.floor(normalizedAmount / DRAW_SERVICE_MILESTONE_QUOTA);
  const rawAmount = Number(amountInput.value || 0);
  const autoAdjusted = Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== normalizedAmount;
  valueNode.textContent = `本次代抽 ${normalizedAmount} 额度`;
  detailNode.textContent =
    milestoneCount > 0
      ? `${autoAdjusted ? `输入值会自动补齐到 ${normalizedAmount}；` : ""}本单已覆盖 ${milestoneCount} 个 5w 档位；当前可用额度 ${balance}`
      : `${autoAdjusted ? `输入值会自动补齐到 ${normalizedAmount}；` : ""}当前可用额度 ${balance}，累计满 5w 才会触发赛季返利。`;
}

function renderDrawServiceZone(profile, quota) {
  if (!drawServiceBody) return;
  currentProfile = profile || null;
  currentQuota = quota || null;

  if (!profile) {
    drawServiceBody.innerHTML = `
      <div class="stack-item">登录后才能提交代抽订单，系统会直接从你的额度里扣除。</div>
      <div class="actions">
        <a class="ghost-link" href="#bind">去登录</a>
      </div>
    `;
    setDrawServiceMessage("");
    return;
  }

  const balance = Number(quota?.balance ?? profile?.quota_balance ?? 0);
  if (!normalizeDrawServiceAmount(selectedDrawServiceAmount)) {
    selectedDrawServiceAmount = DRAW_SERVICE_MIN_QUOTA;
  }

  drawServiceBody.innerHTML = `
    <form id="draw-service-form" class="form-grid" novalidate>
      <div class="draw-service-balance-card">
        <strong>当前可用额度 ${balance}</strong>
        <span class="muted">代抽单提交后会立即扣额度，管理员确认完成后按规则返还卡和阶段奖励。</span>
      </div>
      <label>
        代抽额度
        <input
          id="draw-service-amount-input"
          type="number"
          min="${DRAW_SERVICE_MIN_QUOTA}"
          step="${DRAW_SERVICE_STEP_QUOTA}"
          value="${selectedDrawServiceAmount}"
          required
        />
      </label>
      <div class="preset-list">
        ${[200, 1000, 2000, 5000, 10000, 50000]
          .map(
            (amount) => `
              <button
                class="preset-chip ${Number(selectedDrawServiceAmount) === Number(amount) ? "active" : ""}"
                type="button"
                data-draw-service-amount="${amount}"
              >${amount} 额度</button>
            `
          )
          .join("")}
      </div>
      <div class="recharge-quote">
        <span class="muted">本次代抽预览</span>
        <strong id="draw-service-quote-value"></strong>
        <span id="draw-service-quote-detail" class="muted"></span>
      </div>
      <div class="stack-item muted">
        返还卡由管理员代抽后人工录入；如需代抽视频确认真实性，请在“我的信息”里的“订单帮助”中，通过微信群联系管理员索取。
      </div>
      <div class="actions">
        <button class="primary" type="submit">提交代抽订单</button>
      </div>
    </form>
  `;

  const amountInput = document.getElementById("draw-service-amount-input");
  amountInput?.addEventListener("input", () => {
    const nextValue = Number(amountInput.value || 0);
    if (Number.isFinite(nextValue)) {
      selectedDrawServiceAmount = nextValue;
    }
    updateDrawServiceQuote();
  });

  drawServiceBody.querySelectorAll("[data-draw-service-amount]").forEach((button) => {
    button.addEventListener("click", () => {
      const amount = Number(button.getAttribute("data-draw-service-amount") || 0);
      selectedDrawServiceAmount = amount;
      if (amountInput) amountInput.value = String(amount);
      renderDrawServiceZone(currentProfile, currentQuota);
    });
  });

  document.getElementById("draw-service-form")?.addEventListener("submit", submitDrawServiceOrder);
  updateDrawServiceQuote();
  setDrawServiceMessage("");
}

async function submitDrawServiceOrder(event) {
  event.preventDefault();
  const amountInput = document.getElementById("draw-service-amount-input");
  const normalizedAmount = normalizeDrawServiceAmount(amountInput?.value || selectedDrawServiceAmount);
  const balance = Number(currentQuota?.balance ?? currentProfile?.quota_balance ?? 0);

  if (!currentProfile) {
    setDrawServiceMessage("请先登录后再提交代抽订单。", "error");
    window.location.hash = "bind";
    return;
  }
  if (!normalizedAmount) {
    setDrawServiceMessage("代抽额度最低 200。", "error");
    return;
  }
  const rawAmount = Number(amountInput?.value || selectedDrawServiceAmount);
  if (amountInput) {
    amountInput.value = String(normalizedAmount);
  }
  selectedDrawServiceAmount = normalizedAmount;
  if (normalizedAmount > balance) {
    const adjustedText =
      Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== normalizedAmount
        ? `已按 ${normalizedAmount} 额度补齐；`
        : "";
    setDrawServiceMessage(`${adjustedText}当前额度不足，先去获取额度再来提交。`, "error");
    return;
  }

  try {
    const order = await apiFetch("/orders/draw-service", {
      method: "POST",
      body: JSON.stringify({ amount_quota: normalizedAmount }),
    });
    const adjustedText =
      Number.isFinite(rawAmount) && rawAmount > 0 && rawAmount !== normalizedAmount
        ? `已自动补齐到 ${normalizedAmount} 额度。`
        : "";
    setDrawServiceMessage(
      `${adjustedText}代抽单 #${order.id} 已提交，管理员代抽后会返还符合规则的卡，并在确认时录入返还结果。`,
      "success"
    );
    await loadAccount();
  } catch (error) {
    setDrawServiceMessage(`代抽提交失败：${error.message}`, "error");
  }
}

function setAuctionMessage(text, type = "") {
  if (!auctionMessage) return;
  auctionMessage.textContent = text || "";
  auctionMessage.className = type ? `notice ${type}` : "notice";
}

function formatAuctionStatusLabel(status) {
  switch (String(status || "").trim()) {
    case "live":
      return "进行中";
    case "scheduled":
      return "即将开始";
    case "ended":
      return "等待结算";
    case "settled":
      return "已成交";
    case "cancelled":
      return "已流拍";
    default:
      return status || "-";
  }
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
  const diff = Math.max(0, Number(targetTimeMs || 0) - Number(nowMs || 0));
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}天 ${String(hours).padStart(2, "0")}时`;
  if (hours > 0) return `${hours}时 ${String(minutes).padStart(2, "0")}分`;
  if (minutes > 0) return `${minutes}分 ${String(seconds).padStart(2, "0")}秒`;
  return `${seconds}秒`;
}

function getAuctionCountdownMeta(auction, nowMs = Date.now()) {
  const status = String(auction?.status || "").trim();
  const startMs = new Date(auction?.starts_at || "").getTime();
  const endMs = new Date(auction?.ends_at || "").getTime();
  if (status === "scheduled") {
    if (Number.isFinite(startMs) && startMs > nowMs) {
      return {
        tone: "scheduled",
        label: "距开始",
        value: formatAuctionCountdownDuration(startMs, nowMs),
      };
    }
    return { tone: "scheduled", label: "即将开始", value: "请稍后刷新" };
  }
  if (status === "live") {
    if (Number.isFinite(endMs) && endMs > nowMs) {
      const remaining = endMs - nowMs;
      return {
        tone: remaining <= 10 * 60 * 1000 ? "urgent" : remaining <= 60 * 60 * 1000 ? "soon" : "live",
        label: "距结束",
        value: formatAuctionCountdownDuration(endMs, nowMs),
      };
    }
    return { tone: "ended", label: "已结束", value: "等待管理员结算" };
  }
  if (status === "ended") return { tone: "ended", label: "已结束", value: "等待管理员结算" };
  if (status === "settled") return { tone: "settled", label: "拍卖结果", value: "已成交" };
  if (status === "cancelled") return { tone: "cancelled", label: "拍卖结果", value: "已流拍" };
  return { tone: "default", label: "拍卖状态", value: formatAuctionStatusLabel(status) };
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

function renderAuctionZone(profile) {
  if (!auctionBody) return;

  if (auctionStatusTabs) {
    auctionStatusTabs.querySelectorAll("[data-auction-status]").forEach((button) => {
      button.classList.toggle(
        "active",
        String(button.getAttribute("data-auction-status") || "") === activeAuctionStatus
      );
    });
  }

  const filteredAuctions = currentAuctions.filter(
    (auction) => String(auction?.status || "").trim() === activeAuctionStatus
  );

  if (!filteredAuctions.length) {
    auctionBody.innerHTML = `<div class="stack-item">当前这个分组里还没有拍卖商品。</div>`;
    return;
  }

  auctionBody.innerHTML = filteredAuctions
    .map((auction) => {
      const item = auction?.item || {};
      const termBadges = parseTermBadges(item?.ext_attrs, item);
      const myBid = getAuctionBidSummary(auction.id);
      const canBid = profile && String(auction?.status || "").trim() === "live";
      const suggestedBid = Number(auction?.next_min_bid_quota || auction?.starting_price_quota || 0);
      const currentPrice = Number(auction.current_price_quota || 0);
      const startingPrice = Number(auction.starting_price_quota || 0);
      const minIncrement = Number(auction.min_increment_quota || 0);
      const itemSubtitle = isBundle(item)
        ? `${getTierLabel(item)} / ${escapeHtml(item.uid || "")}`
        : `${getTierLabel(item)} / ID ${item.legacy_id || "-"} / ${escapeHtml(getSeasonDisplayText(item))}`;
      const recommendedBid =
        myBid && !myBid.is_leading
          ? Math.max(suggestedBid, Number(myBid.highest_bid_amount || 0) + minIncrement)
          : suggestedBid;
      const myStatus = myBid
        ? myBid.is_leading
          ? "你当前领先"
          : `你出过价，最高 ${Number(myBid.highest_bid_amount || 0)}`
        : profile
          ? "你还没有出价"
          : "登录后才能出价";

      return `
        <article class="admin-card auction-card" data-auction-id="${auction.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(auction.title || item.name || `拍卖 #${auction.id}`)}</div>
            <span class="chip">${escapeHtml(formatAuctionStatusLabel(auction.status))}</span>
          </div>
          ${renderAuctionCountdown(auction)}
          <div class="auction-card-layout">
            <div class="auction-card-visual">
              ${item && item.name ? renderProductVisual(item, "grid") : '<div class="product-visual fallback">拍卖商品</div>'}
            </div>
            <div class="auction-card-main">
              <div class="auction-card-headline">
                <div class="product-name">${escapeHtml(item.name || "-")}</div>
                <div class="product-type-chip">${itemSubtitle}</div>
              </div>
              ${
                isBundle(item)
                  ? `<div class="product-meta">${escapeHtml(item.description || item.main_attrs || "套餐商品")}</div>`
                  : `
                    <div class="product-stats-grid compact">
                      ${renderStatBlock("攻击", item.attack_value, isAttackFull(item), true)}
                      ${renderStatBlock("血量", item.hp_value, isHpFull(item), true)}
                    </div>
                    <div class="term-row compact">
                      ${
                        termBadges.length > 0
                          ? termBadges.map((badge) => renderTermBadge(badge)).join("")
                          : '<span class="term-empty">无词条</span>'
                      }
                    </div>
                  `
              }
              <div class="auction-summary-grid">
                <div class="auction-summary-card primary">
                  <span class="label">当前最高价</span>
                  <strong>${currentPrice}</strong>
                  <span class="cash">${escapeHtml(getQuotaCashText(currentPrice))}</span>
                </div>
                <div class="auction-summary-card">
                  <span class="label">出价人</span>
                  <strong>${escapeHtml(auction.leading_bidder_label || "无")}</strong>
                  <span class="muted">共 ${Number(auction.bid_count || 0)} 次出价</span>
                </div>
              </div>
              <div class="auction-meta-row">
                <span>起拍 ${startingPrice}</span>
                <span>最低加价 ${minIncrement}</span>
                <span>下次最低 ${suggestedBid}</span>
              </div>
              <div class="auction-meta-note">${escapeHtml(myStatus)}</div>
            </div>
          </div>
          ${
            canBid
              ? `
                <div class="auction-bid-box">
                  ${renderAuctionBidQuickChips(suggestedBid)}
                  <div class="inline-form auction-bid-form">
                    <div class="auction-bid-input-wrap">
                      <div class="auction-bid-input-row">
                        <input
                          data-field="auction-bid-amount"
                          type="number"
                          min="${suggestedBid}"
                          step="1"
                          inputmode="numeric"
                          value="${recommendedBid}"
                        />
                        <button class="primary submit-auction-bid-btn" type="button">提交出价</button>
                      </div>
                      <div class="auction-bid-hint">
                        你可以直接输入更高价格，不必只加最低档；拍卖成功后请加管理员微信 18930468426 沟通支付。
                      </div>
                      <div class="auction-bid-preview muted" data-field="auction-bid-preview">
                        本次出价约 ${escapeHtml(getQuotaCashText(recommendedBid))}
                      </div>
                    </div>
                  </div>
                </div>
              `
              : `<div class="stack-item muted">${
                  profile
                    ? "这个拍卖当前不能继续出价，可以等管理员结算或切到其它分组。"
                    : "登录后可参与拍卖出价。"
                }</div>`
          }
        </article>
      `;
    })
    .join("");
}

async function loadAuctions() {
  try {
    const [auctionResult, myBidResult] = await Promise.all([
      apiFetch("/products/auctions"),
      currentProfile ? apiFetch("/orders/auctions/mine").catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
    ]);
    currentAuctions = Array.isArray(auctionResult?.items) ? auctionResult.items : [];
    currentAuctionBidSummaries = Array.isArray(myBidResult?.items) ? myBidResult.items : [];
    renderAuctionZone(currentProfile);
  } catch (error) {
    currentAuctions = [];
    currentAuctionBidSummaries = [];
    renderAuctionZone(currentProfile);
    setAuctionMessage(`拍卖列表加载失败：${pickErrorMessage(error, "加载失败")}`, "error");
  }
}

async function submitAuctionBid(auctionId, amountQuota) {
  try {
    const result = await apiFetch(`/orders/auctions/${auctionId}/bids`, {
      method: "POST",
      body: JSON.stringify({ amount_quota: Number(amountQuota) }),
    });
    setAuctionMessage(
      `拍卖 #${auctionId} 出价成功，当前价格 ${Number(result.current_price_quota || 0)} 额度。`,
      "success"
    );
    await Promise.all([loadAuctions(), loadAccount()]);
  } catch (error) {
    setAuctionMessage(`出价失败：${pickErrorMessage(error, "出价失败")}`, "error");
  }
}

function updateAuctionBidPreview(card) {
  if (!card) return;
  const amountInput = card.querySelector('[data-field="auction-bid-amount"]');
  const previewNode = card.querySelector('[data-field="auction-bid-preview"]');
  if (!amountInput || !previewNode) return;
  const auctionId = Number(card.getAttribute("data-auction-id") || 0);
  const auction = currentAuctions.find((item) => Number(item?.id || 0) === auctionId) || null;
  const nextMinBid = Number(auction?.next_min_bid_quota || auction?.starting_price_quota || 0);
  const enteredAmount = Number(amountInput.value || 0);
  if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
    previewNode.textContent = `最低可出 ${nextMinBid} 额度，约 ${getQuotaCashText(nextMinBid)}。`;
    return;
  }
  if (enteredAmount < nextMinBid) {
    previewNode.textContent = `当前输入 ${enteredAmount} 额度，低于最低可出 ${nextMinBid} 额度。`;
    return;
  }
  previewNode.textContent = `本次出价 ${enteredAmount} 额度，约 ${getQuotaCashText(enteredAmount)}。`;
}

function updateAuctionCountdowns() {
  if (!auctionBody) return;
  const nodes = auctionBody.querySelectorAll("[data-auction-countdown-id]");
  if (!nodes.length) return;
  const nowMs = Date.now();
  nodes.forEach((node) => {
    const auctionId = Number(node.getAttribute("data-auction-countdown-id") || 0);
    const auction = currentAuctions.find((item) => Number(item?.id || 0) === auctionId);
    if (!auction) return;
    const meta = getAuctionCountdownMeta(auction, nowMs);
    node.className = `auction-countdown ${meta.tone}`;
    const labelNode = node.querySelector(".auction-countdown-label");
    const valueNode = node.querySelector(".auction-countdown-value");
    if (labelNode) labelNode.textContent = meta.label;
    if (valueNode) valueNode.textContent = meta.value;
  });
}


function renderGuideGlyph(type) {
  if (type === "account") {
    return `
      <svg viewBox="0 0 48 48" class="guide-glyph" aria-hidden="true">
        <circle cx="24" cy="16" r="8" fill="currentColor" opacity="0.22"></circle>
        <path d="M24 9a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 20c8.6 0 15 4.4 15 10v2H9v-2c0-5.6 6.4-10 15-10Z" fill="currentColor"></path>
      </svg>
    `;
  }
  if (type === "recharge") {
    return `
      <svg viewBox="0 0 48 48" class="guide-glyph" aria-hidden="true">
        <rect x="8" y="12" width="32" height="24" rx="8" fill="currentColor" opacity="0.18"></rect>
        <path d="M14 20h20M14 28h9" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path>
        <circle cx="33" cy="28" r="5" fill="currentColor"></circle>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 48 48" class="guide-glyph" aria-hidden="true">
      <path d="M10 15h18l10 9-10 9H10a4 4 0 0 1-4-4V19a4 4 0 0 1 4-4Z" fill="currentColor" opacity="0.18"></path>
      <path d="M12 18h14l7 6-7 6H12Z" fill="currentColor"></path>
      <circle cx="35" cy="24" r="4" fill="#fff6e8"></circle>
    </svg>
  `;
}

function formatRecentSaleTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60 * 1000) return "刚刚";
  if (diff < 60 * 60 * 1000) return `${Math.max(Math.floor(diff / (60 * 1000)), 1)} 分钟前`;
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.max(Math.floor(diff / (60 * 60 * 1000)), 1)} 小时前`;
  }
  if (diff < 3 * 24 * 60 * 60 * 1000) {
    return `${Math.max(Math.floor(diff / (24 * 60 * 60 * 1000)), 1)} 天前`;
  }
  return formatDate(value);
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
  if (!recentSalesList) return;
  if (!Array.isArray(items) || items.length === 0) {
    recentSalesList.innerHTML = `
      <div class="recent-sales-empty">
        <div class="panel-title">最近成交正在准备中</div>
        <div class="muted">等第一批成交确认后，这里会自动展示匿名成交摘要。</div>
      </div>
    `;
    return;
  }

  recentSalesList.innerHTML = items
    .map(
      (item) => `
        <article class="recent-sale-item">
          <div class="recent-sale-top">
            <span class="chip subtle-chip">${escapeHtml(item.order_source_label || "商城成交")}</span>
            <span class="recent-sale-time">${escapeHtml(formatRecentSaleTime(item.created_at))}</span>
          </div>
          <div class="recent-sale-title">${escapeHtml(item.buyer_label || "匿名用户")} 买下 ${escapeHtml(item.item_title || "已成交商品")}</div>
          <div class="recent-sale-meta">
            <span>${escapeHtml(item.item_kind_label || "商品")} / ${Number(item.item_count || 1)} 项</span>
            <span>${Number(item.total_quota || 0)} 额度</span>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadRecentSales() {
  try {
    const result = await apiFetch("/products/recent-sales?limit=8");
    recentSalesItems = Array.isArray(result?.items) ? result.items : [];
    renderRecentSales(recentSalesItems);
  } catch (error) {
    console.error(error);
    renderRecentSales([]);
  }
}

function renderBeginnerGuide(profile, orders = [], rechargeOrders = []) {
  if (!beginnerGuideSteps || !beginnerGuideSummary || !beginnerGuideReward) return;

  const rewardQuota = Number(profile?.beginner_guide_reward_quota || BEGINNER_GUIDE_REWARD_QUOTA);
  const hasAccount = Boolean(profile);
  const hasApprovedRecharge = rechargeOrders.some((order) => order.status === "approved");
  const hasPendingRecharge = rechargeOrders.some((order) => order.status === "pending_review");
  const hasConfirmedOrder = orders.some((order) => order.status === "confirmed");
  const hasPendingOrder = orders.some((order) =>
    ["pending", "cancel_requested"].includes(String(order.status || ""))
  );
  const rewardEarned = Boolean(profile?.beginner_guide_reward_earned);

  if (beginnerFlowSection) {
    beginnerFlowSection.classList.remove("hidden");
  }

  const steps = [
    {
      index: "01",
      type: "account",
      title: "注册并登录",
      done: hasAccount,
      current: !hasAccount,
      description: hasAccount
        ? `当前账号：${escapeHtml(profile.game_role_name || profile.game_role_id || "已登录")}`
        : "先进入注册或登录，后续充值和下单都会绑定在这个账号下。",
      actionLabel: hasAccount ? "已完成" : "去注册登录",
      actionHref: "#bind",
      actionTarget: "",
    },
    {
      index: "02",
      type: "recharge",
      title: "获取一次额度",
      done: hasApprovedRecharge,
      current: hasAccount && !hasApprovedRecharge,
      description: hasApprovedRecharge
        ? "通过残卷赠送或充值获取额度，额度已经到账。"
        : hasPendingRecharge
          ? "你已经提交过残卷赠送或充值申请，等待管理员审核通过后就算完成这一步。"
          : "去“我的”里通过残卷赠送或充值获取额度，审核通过后会自动到账。",
      actionLabel: hasApprovedRecharge ? "已完成" : hasPendingRecharge ? "查看进度" : "去获取额度",
      actionHref: "#account",
      actionTarget: "recharge",
    },
    {
      index: "03",
      type: "order",
      title: "完成首单消费",
      done: hasConfirmedOrder,
      current: hasAccount && hasApprovedRecharge && !hasConfirmedOrder,
      description: hasConfirmedOrder
        ? rewardEarned
          ? `首单已完成，奖励 ${rewardQuota} 额度已经发放。`
          : "首单已完成，奖励会自动到账。"
        : hasPendingOrder
          ? "你已经提交过订单，等管理员确认后就算完成首单。"
          : "从商城挑一件合适的商品下单，管理员确认后就能完成首单。",
      actionLabel: hasConfirmedOrder ? "已完成" : hasPendingOrder ? "查看订单" : "去选商品",
      actionHref: hasConfirmedOrder || hasPendingOrder ? "#account" : "#products",
      actionTarget: hasConfirmedOrder || hasPendingOrder ? "orders" : "",
    },
  ];

  beginnerGuideSummary.textContent = rewardEarned
    ? `新手教学奖励已到账 ${rewardQuota} 额度，你可以继续直接下单，也可以切到最近成交查看公开流水。`
    : hasConfirmedOrder && hasApprovedRecharge
      ? `三步已完成，系统会自动发放 ${rewardQuota} 额度奖励。`
      : `完成注册、获取一次额度、完成首单后，额外奖励 ${rewardQuota} 额度。`;
  beginnerGuideReward.textContent = rewardEarned
    ? `奖励已发放 +${rewardQuota}`
    : `完成三步奖励 ${rewardQuota} 额度`;
  beginnerGuideReward.classList.toggle("claimed", rewardEarned);

  beginnerGuideSteps.innerHTML = rewardEarned
    ? `
      <article class="tutorial-complete-card">
        <div class="tutorial-step-icon">${renderGuideGlyph("order")}</div>
        <div class="flow-step-index">GUIDE COMPLETE</div>
        <div class="flow-step-title">新手奖励已经到账</div>
        <div class="muted">你已经完成注册、获取额度和首单消费，后面可以直接逛商城，也可以切到“最近成交”查看公开成交摘要。</div>
        <div class="actions">
          <a class="ghost-link tutorial-link" href="#products">继续逛商城</a>
          <a class="ghost-link tutorial-link" href="#account">查看我的信息</a>
        </div>
      </article>
    `
    : steps
        .map((step) => {
          const statusLabel = step.done ? "已完成" : step.current ? "当前推荐" : "未完成";
          const statusClass = step.done ? "done" : step.current ? "current" : "pending";
          const actionAttrs = step.actionTarget ? ` data-account-tab-target="${step.actionTarget}"` : "";
          return `
            <article class="flow-step tutorial-step ${statusClass}">
              <div class="tutorial-step-top">
                <div class="tutorial-step-icon">${renderGuideGlyph(step.type)}</div>
                <span class="tutorial-status ${statusClass}">${statusLabel}</span>
              </div>
              <div class="flow-step-index">${step.index}</div>
              <div class="flow-step-title">${step.title}</div>
              <div class="muted">${step.description}</div>
              <a class="ghost-link tutorial-link" href="${step.actionHref}"${actionAttrs}>${step.actionLabel}</a>
            </article>
          `;
        })
        .join("");
}

function renderProfile(profile, quota, orders) {
  if (!profile) {
    accountProfile.innerHTML = '<div class="stack-item">请先登录后查看账号信息。</div>';
    quotaBalance.textContent = "-";
    orderList.innerHTML = '<div class="stack-item">登录后可查看最近订单。</div>';
    setAccountMessage("");
    return;
  }

  const memberStatus = profile.season_member_active
    ? `本赛季会员，权益截止 ${escapeHtml(formatDate(profile.season_member_expires_at || ""))}`
    : "当前未开通";
  const memberBenefit = profile.season_member_active
    ? `后续获得额度额外 +${Number(profile.season_member_bonus_percent || 0)}%`
    : `开通后获得额度额外 +${Number(profile.season_member_bonus_percent || 0)}%`;
  const beginnerRewardStatus = profile.beginner_guide_reward_earned
    ? `已领取 ${Number(profile.beginner_guide_reward_quota || BEGINNER_GUIDE_REWARD_QUOTA)} 额度`
    : `完成教学三步后可领取 ${Number(profile.beginner_guide_reward_quota || BEGINNER_GUIDE_REWARD_QUOTA)} 额度`;

  accountProfile.innerHTML = [
    `角色名称：${escapeHtml(profile.game_role_name || "-")}`,
    `游戏 ID：${escapeHtml(profile.game_role_id || "-")}`,
    `区服：${escapeHtml(profile.game_server || "-")}`,
    `账号角色：${escapeHtml(profile.role || "-")}`,
    `登录方式：${escapeHtml(profile.auth_provider === "password" ? "密码登录" : "绑定登录")}`,
    `昵称：${escapeHtml(profile.nickname || "-")}`,
    `会员状态：${memberStatus}`,
    `会员权益：${memberBenefit}`,
    `新手奖励：${beginnerRewardStatus}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  quotaBalance.textContent = String(quota?.balance ?? profile.quota_balance ?? 0);

  if (!orders || orders.length === 0) {
    orderList.innerHTML = '<div class="stack-item">暂时没有订单。</div>';
    return;
  }

  orderList.innerHTML = orders
    .map((order) => {
      const itemNames = (order.items || []).map((item) => item.product_name).join(" / ");
      const drawMeta = getDrawServiceMeta(order);
      const remark = order.remark ? `<div class="muted">备注：${escapeHtml(order.remark)}</div>` : "";
      const drawLines =
        isDrawServiceOrder(order) && drawMeta
          ? `
              <div class="muted">代抽额度：${Number(drawMeta.amount_quota || order.total_quota || 0)} / 赛季：${escapeHtml(drawMeta.season_label || "-")}</div>
              ${drawMeta.returned_cards_text ? `<div class="muted">返还卡：${escapeHtml(drawMeta.returned_cards_text)}</div>` : ""}
              ${drawMeta.reward_summary ? `<div class="muted">阶段奖励：${escapeHtml(drawMeta.reward_summary)}</div>` : ""}
              ${drawMeta.best_gold_card ? `<div class="muted">图鉴金卡：${escapeHtml(drawMeta.best_gold_card)}</div>` : ""}
            `
          : "";
      const actions =
        order.status === "pending"
          ? `<div class="actions"><button class="ghost request-cancel-btn" type="button" data-order-id="${order.id}">申请取消</button></div>`
          : order.status === "cancel_requested"
            ? '<div class="muted">已提交取消申请，等待管理员审核。</div>'
            : "";

      return `
        <div class="stack-item">
          <div>订单 #${order.id} / ${escapeHtml(formatOrderStatus(order.status))}</div>
          <div class="muted">${escapeHtml(isDrawServiceOrder(order) ? "代抽项目" : "商品")}：${escapeHtml(itemNames || "-")}</div>
          <div class="muted">消耗：${Number(order.total_quota || 0)} / 下单时间：${formatDate(order.created_at)}</div>
          ${drawLines}
          ${remark}
          ${actions}
        </div>
      `;
    })
    .join("");
}

function findPendingSeasonMemberOrder(rechargeOrders, rechargeConfig) {
  return (rechargeOrders || []).find(
    (order) =>
      order.order_type === "season_member" &&
      order.status === "pending_review" &&
      String(order.season_label || "") === String(rechargeConfig?.season_member_season_label || "")
  ) || null;
}

function isResidualTransferOrder(order) {
  return String(order?.order_type || "").trim() === "residual_transfer";
}

function formatRechargeOrderTitle(order) {
  if (order?.order_title) return order.order_title;
  if (isResidualTransferOrder(order)) return "残卷转赠";
  if (order?.order_type === "season_member") return "赛季会员";
  return "普通充值";
}

function formatRechargeOrderAmountLine(order) {
  const quotaLine =
    Number(order?.bonus_quota_amount || 0) > 0
      ? `到账：${Number(order?.base_quota_amount || 0)} 基础 + ${Number(order?.bonus_quota_amount || 0)} 加成 = ${Number(order?.quota_amount || 0)} 额度`
      : `到账：${Number(order?.quota_amount || 0)} 额度`;

  if (isResidualTransferOrder(order)) {
    return `转赠：${Number(order?.transfer_amount || order?.amount_yuan || 0)} ${escapeHtml(order?.transfer_unit || "残卷")} / ${quotaLine}`;
  }

  return `金额：${formatCashAmount(order?.amount_yuan || 0)} / ${quotaLine} / 支付方式：${escapeHtml(formatRechargeChannelLabel(order?.channel))}`;
}

function formatRechargeReferenceLine(order) {
  const label = isResidualTransferOrder(order) ? "转赠时间" : "付款时间";
  return `${label}：${escapeHtml(order?.payment_reference || "-")}`;
}

function getRechargeQuoteSummary(profile, rechargeConfig, amountYuan, orderType = "normal") {
  const normalizedType =
    orderType === "season_member"
      ? "season_member"
      : orderType === "residual_transfer"
        ? "residual_transfer"
        : "normal";
  const seasonLabel = rechargeConfig?.season_member_season_label || "当前赛季";
  const seasonExpiresText = rechargeConfig?.season_member_expires_at
    ? formatDate(rechargeConfig.season_member_expires_at)
    : "-";
  const bonusPercent = Number(rechargeConfig?.season_member_bonus_percent || 0);

  if (normalizedType === "season_member") {
    const memberQuota = Number(rechargeConfig?.season_member_quota || 0);
    const memberAmount = Number(rechargeConfig?.season_member_price_yuan || 0);
    return {
      orderType: normalizedType,
      amountYuan: memberAmount,
      baseQuota: memberQuota,
      bonusQuota: 0,
      totalQuota: memberQuota,
      amountLabel: `${memberAmount} 元开通 ${seasonLabel} 会员`,
      detailLabel: `会员截止 ${seasonExpiresText}，后续每次获得额度额外 +${bonusPercent}%`,
      submitLabel: "已付款，申请开通会员",
      lockedAmount: true,
      amountInputLabel: "充值金额（元）",
      amountInputMin: memberAmount,
      amountInputStep: 1,
      referenceLabel: "付款时间",
      referencePlaceholder: "建议填写付款时间，例如 19:42",
      notePlaceholder: "例如：已付款，如需补充可写角色名或付款方式",
    };
  }

  if (normalizedType === "residual_transfer") {
    const normalizedAmount = Math.max(Number(amountYuan) || 0, 0);
    const quotaPerUnit = Math.max(Number(rechargeConfig?.residual_quota_per_unit || 1), 1);
    const unitLabel = rechargeConfig?.residual_unit_label || "残卷";
    const targetRoleId = rechargeConfig?.residual_admin_role_id || "584967604";
    const baseQuota = normalizedAmount * quotaPerUnit;
    const bonusQuota = profile?.season_member_active
      ? Math.floor(baseQuota * Number(rechargeConfig?.season_member_bonus_rate || 0))
      : 0;
    return {
      orderType: normalizedType,
      amountYuan: normalizedAmount,
      baseQuota,
      bonusQuota,
      totalQuota: baseQuota + bonusQuota,
      amountLabel: `1 ${unitLabel} = ${quotaPerUnit} 额度`,
      detailLabel: profile?.season_member_active
        ? `游戏内直接转给管理员 ${targetRoleId}，会员加成已生效，本次额外赠送 ${bonusQuota} 额度。`
        : `游戏内直接转给管理员 ${targetRoleId}，管理员审核后到账。`,
      submitLabel: "已转赠，提交审核",
      lockedAmount: false,
      amountInputLabel: `${unitLabel}数量`,
      amountInputMin: 1,
      amountInputStep: 1,
      referenceLabel: "转赠时间",
      referencePlaceholder: "建议填写转赠时间，例如 19:42",
      notePlaceholder: "例如：19:42 转给 584967604 共 300 残卷",
    };
  }

  const normalizedAmount = Math.max(Number(amountYuan) || 0, 0);
  const baseQuota = Math.round(
    (normalizedAmount * Number(rechargeConfig?.exchange_quota || 0)) /
      Math.max(Number(rechargeConfig?.exchange_yuan || 1), 0.01)
  );
  const bonusQuota = profile?.season_member_active
    ? Math.floor(baseQuota * Number(rechargeConfig?.season_member_bonus_rate || 0))
    : 0;
  const totalQuota = baseQuota + bonusQuota;
  const detailLabel = profile?.season_member_active
    ? `会员加成已生效，本次额外赠送 ${bonusQuota} 额度。`
    : "支持任意金额转账，系统会按当前比例实时折算到账。";

  return {
    orderType: normalizedType,
    amountYuan: normalizedAmount,
    baseQuota,
    bonusQuota,
    totalQuota,
    amountLabel: `当前兑换比例：${Number(rechargeConfig?.exchange_yuan || 1)} 元 = ${Number(rechargeConfig?.exchange_quota || 0)} 额度`,
    detailLabel,
    submitLabel: "已付款，提交审核",
    lockedAmount: false,
    amountInputLabel: "充值金额（元）",
    amountInputMin: 0.01,
    amountInputStep: 0.01,
    referenceLabel: "付款时间",
    referencePlaceholder: "建议填写付款时间，例如 19:42",
    notePlaceholder: "例如：已付款，如需补充可写角色名或付款方式",
  };
}

function updateRechargeQuotePreview(profile, rechargeConfig) {
  const quoteNode = document.getElementById("recharge-quote-value");
  const detailNode = document.getElementById("recharge-quote-detail");
  if (!quoteNode || !detailNode || !rechargeConfig) return;

  const amountInput = document.getElementById("recharge-amount-input");
  const amountValue =
    selectedRechargeOrderType === "season_member"
      ? Number(rechargeConfig?.season_member_price_yuan || 0)
      : Number(amountInput?.value || selectedRechargeAmount || 0);
  const quoteSummary = getRechargeQuoteSummary(
    profile,
    rechargeConfig,
    amountValue,
    selectedRechargeOrderType
  );

  quoteNode.textContent = `${quoteSummary.totalQuota} 额度`;
  detailNode.textContent =
    quoteSummary.bonusQuota > 0
      ? `${quoteSummary.baseQuota} 基础额度 + ${quoteSummary.bonusQuota} 会员加成`
      : `${quoteSummary.baseQuota} 基础额度`;
}

function renderRechargeSection(profile, rechargeConfig, rechargeOrders) {
  if (!rechargeBody || !rechargeOrderList) return;

  if (!profile) {
    rechargeBody.innerHTML = '<div class="stack-item">登录后可发起额度充值申请。</div>';
    rechargeOrderList.innerHTML = '<div class="stack-item">登录后可查看充值记录。</div>';
    return;
  }

  if (!rechargeConfig?.enabled) {
    rechargeBody.innerHTML = '<div class="stack-item">当前暂未开放充值。</div>';
    rechargeOrderList.innerHTML = '<div class="stack-item">暂无充值记录。</div>';
    return;
  }

  const presets = Array.isArray(rechargeConfig.preset_amounts) && rechargeConfig.preset_amounts.length
    ? rechargeConfig.preset_amounts
    : [rechargeConfig.min_amount_yuan || rechargeConfig.exchange_yuan || 10];
  if (!isPositiveMoneyAmount(selectedRechargeAmount)) {
    selectedRechargeAmount = Number(presets[0]);
  }
  const availableRechargeTypes = ["normal", "season_member"];
  if (rechargeConfig?.residual_transfer_enabled) {
    availableRechargeTypes.push("residual_transfer");
  }
  if (!availableRechargeTypes.includes(selectedRechargeOrderType)) {
    selectedRechargeOrderType = "normal";
  }

  const pendingSeasonOrder = findPendingSeasonMemberOrder(rechargeOrders, rechargeConfig);
  const paymentMethods = getRechargePaymentMethods(rechargeConfig);
  const activePaymentMethod = ensureRechargePaymentChannel(rechargeConfig);
  const directPurchaseContext =
    selectedRechargeOrderType === "normal" && pendingDirectPurchaseContext
      ? pendingDirectPurchaseContext
      : null;
  if (directPurchaseContext && Number(selectedRechargeAmount) !== Number(directPurchaseContext.amountYuan)) {
    selectedRechargeAmount = Number(directPurchaseContext.amountYuan);
  }
  const quoteSummary = getRechargeQuoteSummary(
    profile,
    rechargeConfig,
    selectedRechargeOrderType === "season_member" ? rechargeConfig.season_member_price_yuan : selectedRechargeAmount,
    selectedRechargeOrderType
  );
  const memberStatusText = profile.season_member_active
    ? `你已开通 ${escapeHtml(profile.season_member_season_label || rechargeConfig.season_member_season_label || "当前赛季")} 会员，权益截止 ${escapeHtml(formatDate(profile.season_member_expires_at || rechargeConfig.season_member_expires_at || ""))}`
    : pendingSeasonOrder
      ? `你的 ${escapeHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员申请正在审核中。`
      : `${escapeHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员：${Number(rechargeConfig.season_member_price_yuan || 0)} 元得 ${Number(rechargeConfig.season_member_quota || 0)} 额度，后续获得额度额外 +${Number(rechargeConfig.season_member_bonus_percent || 0)}%。`;
  const seasonMemberDisabled = Boolean(profile.season_member_active || pendingSeasonOrder);
  const isResidualTransfer = selectedRechargeOrderType === "residual_transfer";
  const transferTargetRoleId = rechargeConfig?.residual_admin_role_id || "584967604";
  const transferTargetRoleName = rechargeConfig?.residual_admin_role_name || "admin残卷";
  const transferTargetGameName = rechargeConfig?.residual_admin_game_name || "繁星✨秋";
  const transferUnitLabel = rechargeConfig?.residual_unit_label || "残卷";
  const paymentMethodTabsHtml =
    !isResidualTransfer && paymentMethods.length > 1
      ? `
          <div class="preset-list">
            ${paymentMethods
              .map(
                (method) =>
                  `<button class="preset-chip ${selectedRechargePaymentChannel === method.key ? "active" : ""}" type="button" data-payment-channel="${method.key}">${escapeHtml(method.label)}</button>`
              )
              .join("")}
          </div>
        `
      : "";
  const submitLabel = directPurchaseContext ? "已转账，提交购买审核" : quoteSummary.submitLabel;
  const directPurchaseBannerHtml = directPurchaseContext
    ? `
        <div class="recharge-direct-banner">
          <div>
            <strong>当前是转账购买</strong>
            <div class="muted">${escapeHtml(directPurchaseContext.productName)} / ${directPurchaseContext.quotaAmount} 额度 / ${escapeHtml(formatCashAmount(directPurchaseContext.amountYuan))}</div>
            <div class="muted">这笔金额按商品精确价格预填，和普通充值分开显示。</div>
          </div>
          <button class="ghost" type="button" data-direct-purchase-clear="1">切回普通充值</button>
        </div>
      `
    : "";
  const sideCardHtml = isResidualTransfer
    ? `
        <div class="recharge-qr-card">
          <div><strong>${escapeHtml(transferTargetRoleName)}</strong></div>
          <div class="muted">游戏名称：${escapeHtml(transferTargetGameName)}</div>
          <div class="muted">游戏 ID：${escapeHtml(transferTargetRoleId)}</div>
          <div class="muted">兑换比例：1 ${escapeHtml(transferUnitLabel)} = ${Number(rechargeConfig?.residual_quota_per_unit || 1)} 额度</div>
          <div class="stack-list">
            ${(rechargeConfig.residual_instructions || []).map((line) => `<div class="stack-item">${escapeHtml(line)}</div>`).join("")}
          </div>
        </div>
      `
    : `
        <div class="recharge-qr-card">
          ${paymentMethodTabsHtml}
          <img class="recharge-qr-image" src="${escapeHtml(activePaymentMethod?.imageUrl || rechargeConfig.qr_image_url)}" alt="${escapeHtml(activePaymentMethod?.name || "收款码")}" />
          <div><strong>${escapeHtml(activePaymentMethod?.name || rechargeConfig.payee_name || "收款码")}</strong></div>
          <div class="muted">${escapeHtml(activePaymentMethod?.hint || rechargeConfig.payee_hint || "扫码转账后再提交审核")}</div>
          <div class="stack-list">
            ${(rechargeConfig.instructions || []).map((line) => `<div class="stack-item">${escapeHtml(line)}</div>`).join("")}
          </div>
        </div>
      `;

  rechargeBody.innerHTML = `
    <div class="recharge-layout">
      <div class="recharge-rate-banner">
        <strong>赛季会员</strong>
        <span>${memberStatusText}</span>
        <span class="muted">本赛季截止 ${escapeHtml(formatDate(rechargeConfig.season_member_expires_at || ""))}</span>
      </div>
      <div class="recharge-layout-split">
        ${sideCardHtml}
        <form id="recharge-form" class="form-grid">
          ${directPurchaseBannerHtml}
          <div class="preset-list">
            <button class="preset-chip ${selectedRechargeOrderType === "normal" ? "active" : ""}" type="button" data-recharge-order-type="normal">普通充值</button>
            <button class="preset-chip ${selectedRechargeOrderType === "season_member" ? "active" : ""}" type="button" data-recharge-order-type="season_member">赛季会员</button>
            ${rechargeConfig?.residual_transfer_enabled ? `<button class="preset-chip ${selectedRechargeOrderType === "residual_transfer" ? "active" : ""}" type="button" data-recharge-order-type="residual_transfer">残卷转赠</button>` : ""}
          </div>
          <div class="recharge-rate-banner">
            <strong>${escapeHtml(quoteSummary.amountLabel)}</strong>
            <span class="muted">${escapeHtml(quoteSummary.detailLabel)}</span>
          </div>
          <label>${escapeHtml(quoteSummary.amountInputLabel)}
            <input id="recharge-amount-input" type="number" min="${Number(quoteSummary.amountInputMin || 1)}" step="${Number(quoteSummary.amountInputStep || 1)}" value="${quoteSummary.amountYuan}" ${(quoteSummary.lockedAmount || directPurchaseContext) ? "readonly" : ""} />
          </label>
          ${selectedRechargeOrderType === "normal" && !directPurchaseContext ? `
            <div class="preset-list">
              ${presets
                .map((amount) => `<button class="preset-chip ${Number(amount) === Number(selectedRechargeAmount) ? "active" : ""}" type="button" data-recharge-amount="${amount}">${amount} 元</button>`)
                .join("")}
            </div>
          ` : ""}
          <div class="recharge-quote">
            <span class="muted">本次预计到账</span>
            <strong id="recharge-quote-value">${quoteSummary.totalQuota} 额度</strong>
            <span id="recharge-quote-detail" class="muted">${quoteSummary.baseQuota} 基础额度${quoteSummary.bonusQuota > 0 ? ` + ${quoteSummary.bonusQuota} 会员加成` : ""}</span>
          </div>
          <label>${escapeHtml(quoteSummary.referenceLabel)}
            <input id="recharge-payment-reference" type="text" maxlength="100" placeholder="${escapeHtml(quoteSummary.referencePlaceholder)}" required />
          </label>
          <label>补充说明（可选）
            <textarea id="recharge-note" rows="3" placeholder="${escapeHtml(quoteSummary.notePlaceholder)}"></textarea>
          </label>
          <div class="actions">
            <button id="recharge-submit-btn" class="primary" type="submit" ${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? "disabled" : ""}>${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? (profile.season_member_active ? "本赛季已开通" : "会员申请审核中") : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (!rechargeOrders || rechargeOrders.length === 0) {
    rechargeOrderList.innerHTML = '<div class="stack-item">暂无充值记录。</div>';
    return;
  }

  rechargeOrderList.innerHTML = rechargeOrders
    .map((order) => {
      const adminRemark = order.admin_remark ? `<div class="muted">审核备注：${escapeHtml(order.admin_remark)}</div>` : "";
      const payerNote = order.payer_note ? `<div class="muted">补充说明：${escapeHtml(order.payer_note)}</div>` : "";
      return `
        <div class="stack-item">
          <div>${escapeHtml(formatRechargeOrderTitle(order))} #${order.id} / ${escapeHtml(formatRechargeStatus(order.status))}</div>
          <div class="muted">${formatRechargeOrderAmountLine(order)}</div>
          <div class="muted">${formatRechargeReferenceLine(order)}</div>
          <div class="muted">提交时间：${formatDate(order.created_at)}</div>
          ${isResidualTransferOrder(order) ? `<div class="muted">转赠目标：${escapeHtml(order.transfer_target_role_name || "admin残卷")} / ${escapeHtml(order.transfer_target_role_id || "-")}</div>` : ""}
          ${order.season_label ? `<div class="muted">赛季：${escapeHtml(order.season_label)}</div>` : ""}
          ${payerNote}
          ${adminRemark}
        </div>
      `;
    })
    .join("");
}

function findProduct(itemId, itemKind) {
  return (
    allProducts.find(
      (item) =>
        Number(item.item_id) === Number(itemId) && String(item.item_kind) === String(itemKind)
    ) || null
  );
}

function openProductModal(itemId, itemKind) {
  const product = findProduct(itemId, itemKind);
  if (!product) return;

  activeItemId = Number(product.item_id);
  activeItemKind = product.item_kind || "card";
  setProductDetailMessage("");

  const termBadges = parseTermBadges(product.ext_attrs, product);
  const session = loadSession();
  const sessionProfile = session?.profile || null;
  const rechargeConfig = getEffectiveRechargeConfig();
  const directPurchaseContext = buildDirectPurchaseContext(product, rechargeConfig);
  const directResidualAmount = getDirectResidualAmount(product, rechargeConfig);
  const guestPaymentMethods = getGuestPurchaseMethods(rechargeConfig);
  const activeGuestPaymentMethod = ensureGuestTransferPaymentChannel(rechargeConfig);
  const isResidualGuestPurchase =
    String(activeGuestPaymentMethod?.key || "") === "game_residual_transfer";
  const stockLabel = product.stock === null || product.stock === undefined ? "不限量" : `${Number(product.stock)} 件`;
  const attackIsFull = isAttackFull(product);
  const hpIsFull = isHpFull(product);
  const cashPriceText = getProductCashPriceText(product);
  const originalPriceQuota = getOriginalQuotaPrice(product);
  const discounted = isDiscountedProduct(product);
  const detailRows = isBundle(product)
    ? `
        <div class="detail-row"><strong>类型</strong><span>套餐 SKU</span></div>
        <div class="detail-row"><strong>编码</strong><span>${escapeHtml(product.uid || "-")}</span></div>
        <div class="detail-row"><strong>库存</strong><span>${escapeHtml(stockLabel)}</span></div>
      `
    : `
        <div class="detail-row"><strong>攻击</strong><span>${renderFullStatValue(product.attack_value || 0, attackIsFull)}</span></div>
        <div class="detail-row"><strong>血量</strong><span>${renderFullStatValue(product.hp_value || 0, hpIsFull)}</span></div>
        <div class="detail-row"><strong>赛季</strong><span>${escapeHtml(getSeasonDisplayText(product))}</span></div>
        <div class="detail-row"><strong>库存</strong><span>${escapeHtml(stockLabel)}</span></div>
      `;

  productDetailBody.innerHTML = `
    <div class="product-detail-shell">
      <div class="product-detail-layout">
        <div class="product-detail-cover">${renderProductVisual(product, "detail")}</div>
        <div class="product-detail-main">
          <div class="product-headline">
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-type-chip">${escapeHtml(getTierLabel(product))} / ${escapeHtml(product.uid || "-")}</div>
          </div>
          ${isBundle(product) ? `<div class="product-meta">${escapeHtml(product.description || product.main_attrs || "套餐商品")}</div>` : ""}
          <div class="term-row">${termBadges.length > 0 ? termBadges.map((badge) => renderTermBadge(badge)).join("") : '<span class="term-empty">无额外词条</span>'}</div>
          <div class="detail-list">
            <div class="detail-row"><strong>价格</strong><span>${discounted ? `原价 ${originalPriceQuota} / ` : ""}${Number(product.price_quota || 0)} 额度${cashPriceText ? ` / ${escapeHtml(cashPriceText)}` : ""}${discounted ? ` / ${escapeHtml(product.discount_label || "折扣")}` : ""}</span></div>
            ${detailRows}
            <div class="detail-row"><strong>额度购买账号</strong><span>${escapeHtml(sessionProfile?.game_role_name || "未登录")}</span></div>
          </div>
          <div class="product-detail-actions">
            <button class="ghost" type="button" id="modal-close-btn">返回</button>
            <button class="ghost" type="button" id="direct-buy-btn">转账锁卡</button>
            <button class="primary" type="button" id="confirm-buy-btn">确认购买</button>
          </div>
        </div>
      </div>
      <div id="guest-transfer-panel" class="guest-transfer-panel hidden">
        ${
          directPurchaseContext && activeGuestPaymentMethod
            ? `
                <div class="guest-transfer-grid">
                  <div class="recharge-qr-card guest-transfer-card">
                    ${
                      guestPaymentMethods.length > 1
                        ? `
                            <div class="preset-list guest-transfer-methods">
                              ${guestPaymentMethods
                                .map(
                                  (method) => `
                                    <button
                                      class="preset-chip ${selectedGuestTransferPaymentChannel === method.key ? "active" : ""}"
                                      type="button"
                                      data-guest-payment-channel="${method.key}"
                                    >${escapeHtml(method.label)}</button>
                                  `
                                )
                                .join("")}
                            </div>
                          `
                        : ""
                    }
                    ${
                      isResidualGuestPurchase
                        ? `
                            <div class="guest-transfer-card-title"><strong>${escapeHtml(rechargeConfig?.residual_admin_role_name || "admin残卷")}</strong></div>
                            <div class="muted">游戏名称：${escapeHtml(rechargeConfig?.residual_admin_game_name || "-")}</div>
                            <div class="muted">游戏 ID：${escapeHtml(rechargeConfig?.residual_admin_role_id || "-")}</div>
                            <div class="muted">兑换比例：1 ${escapeHtml(rechargeConfig?.residual_unit_label || "残卷")} = ${Number(rechargeConfig?.residual_quota_per_unit || 1)} 额度</div>
                          `
                        : `
                            <img class="recharge-qr-image" src="${escapeHtml(activeGuestPaymentMethod.imageUrl || "")}" alt="${escapeHtml(activeGuestPaymentMethod.name || "收款码")}" />
                            <div class="guest-transfer-card-title"><strong>${escapeHtml(activeGuestPaymentMethod.name || "收款码")}</strong></div>
                            <div class="muted">${escapeHtml(activeGuestPaymentMethod.hint || "转账后填写付款时间提交")}</div>
                          `
                    }
                    <div class="stack-list">
                      ${(
                        isResidualGuestPurchase
                          ? Array.isArray(rechargeConfig?.residual_instructions)
                            ? rechargeConfig.residual_instructions
                            : []
                          : Array.isArray(rechargeConfig?.instructions)
                            ? rechargeConfig.instructions
                            : []
                      )
                        .map((line) => `<div class="stack-item">${escapeHtml(line)}</div>`)
                        .join("")}
                    </div>
                  </div>
                  <form id="guest-transfer-form" class="guest-transfer-form" novalidate>
                    <div class="guest-transfer-summary">
                      <div class="recharge-rate-banner">
                        <strong>${isResidualGuestPurchase ? "残卷锁卡" : "转账锁卡"}</strong>
                        <span>订单提交后会先锁定这张卡，等待管理员核对${isResidualGuestPurchase ? "转赠" : "收款"}后确认。</span>
                      </div>
                      <div class="recharge-quote">
                        <span class="muted">${isResidualGuestPurchase ? "本单需要转赠" : "本单金额"}</span>
                        <strong>${escapeHtml(
                          isResidualGuestPurchase
                            ? `${Number(directResidualAmount || 0)} ${rechargeConfig?.residual_unit_label || "残卷"}`
                            : formatCashAmount(directPurchaseContext.amountYuan)
                        )}</strong>
                        <span class="muted">${Number(directPurchaseContext.quotaAmount)} 额度，商品会先锁定</span>
                      </div>
                    </div>
                    <div class="guest-transfer-fields">
                      <label>游戏 ID
                        <input id="guest-transfer-role-id" type="text" maxlength="60" value="${escapeHtml(sessionProfile?.game_role_id || "")}" placeholder="例如 584967604" required />
                      </label>
                      <label>角色名
                        <input id="guest-transfer-role-name" type="text" maxlength="60" value="${escapeHtml(sessionProfile?.game_role_name || "")}" placeholder="例如 繁星秋" required />
                      </label>
                      <label>昵称（可选）
                        <input id="guest-transfer-nickname" type="text" maxlength="60" value="${escapeHtml(sessionProfile?.nickname || "")}" placeholder="方便你这边识别即可" />
                      </label>
                      <label>${isResidualGuestPurchase ? "转赠时间" : "付款时间"}
                        <input id="guest-transfer-reference" type="text" maxlength="100" placeholder="${escapeHtml(isResidualGuestPurchase ? "例如 19:42 已转残卷" : "例如 19:42 支付宝已转")}" required />
                      </label>
                      <label class="guest-transfer-field-span">补充说明（可选）
                        <textarea id="guest-transfer-note" rows="3" placeholder="${escapeHtml(
                          isResidualGuestPurchase
                            ? `例如：已向 ${rechargeConfig?.residual_admin_role_id || "584967604"} 转了 ${Number(directResidualAmount || 0)} ${rechargeConfig?.residual_unit_label || "残卷"}`
                            : "例如：尾号 5218，已按订单金额转账"
                        )}"></textarea>
                      </label>
                    </div>
                    <div class="guest-transfer-form-actions">
                      <button class="ghost" type="button" data-guest-transfer-cancel="1">收起</button>
                      <button class="primary" type="submit">${isResidualGuestPurchase ? "已转赠，提交锁卡订单" : "已转账，提交锁卡订单"}</button>
                    </div>
                  </form>
                </div>
              `
            : `
                <div class="stack-item">
                  当前还没拿到收款配置，请稍后刷新页面再试，或先联系管理员手动处理。
                </div>
              `
        }
      </div>
    </div>
  `;

  productDetailModal.classList.remove("hidden");
  productDetailModal.setAttribute("aria-hidden", "false");
  bindImageFallbacks(productDetailBody);
  document.getElementById("modal-close-btn").addEventListener("click", closeProductModal);
  document
    .getElementById("direct-buy-btn")
    .addEventListener("click", () => startDirectPurchase(product.item_id, product.item_kind || "card"));
  document.getElementById("confirm-buy-btn").addEventListener("click", confirmPurchase);
  document.getElementById("guest-transfer-form")?.addEventListener("submit", submitGuestTransferOrder);
  productDetailBody.querySelectorAll("[data-guest-payment-channel]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedGuestTransferPaymentChannel =
        button.getAttribute("data-guest-payment-channel") || "alipay_qr";
      openProductModal(product.item_id, product.item_kind || "card");
      toggleGuestTransferPanel(true);
    });
  });
  productDetailBody
    .querySelector('[data-guest-transfer-cancel="1"]')
    ?.addEventListener("click", () => toggleGuestTransferPanel(false));
}

function closeProductModal() {
  activeItemId = null;
  activeItemKind = "card";
  productDetailModal.classList.add("hidden");
  productDetailModal.setAttribute("aria-hidden", "true");
  productDetailBody.innerHTML = "";
  setProductDetailMessage("");
}

function toggleGuestTransferPanel(visible) {
  const panel = document.getElementById("guest-transfer-panel");
  if (!panel) return;
  panel.classList.toggle("hidden", !visible);
  if (visible) {
    window.requestAnimationFrame(() => {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

async function submitGuestTransferOrder(event) {
  event.preventDefault();
  const product = findProduct(activeItemId, activeItemKind);
  if (!product) {
    setProductDetailMessage("当前商品不存在或已下架。", "error");
    return;
  }

  const directPurchaseContext = buildDirectPurchaseContext(product, getEffectiveRechargeConfig());
  if (!directPurchaseContext) {
    setProductDetailMessage("当前还没拿到金额换算配置，请稍后再试。", "error");
    return;
  }
  const isResidualGuestPurchase = selectedGuestTransferPaymentChannel === "game_residual_transfer";
  const directResidualAmount = getDirectResidualAmount(product, getEffectiveRechargeConfig());

  const roleId = document.getElementById("guest-transfer-role-id")?.value.trim() || "";
  const roleName = document.getElementById("guest-transfer-role-name")?.value.trim() || "";
  const nickname = document.getElementById("guest-transfer-nickname")?.value.trim() || "";
  const paymentReference =
    document.getElementById("guest-transfer-reference")?.value.trim() || "";
  const payerNote = document.getElementById("guest-transfer-note")?.value.trim() || "";

  if (!roleId) {
    setProductDetailMessage("请填写游戏 ID。", "error");
    return;
  }
  if (!roleName) {
    setProductDetailMessage("请填写角色名。", "error");
    return;
  }
  if (!paymentReference) {
    setProductDetailMessage("请填写付款时间或付款备注。", "error");
    return;
  }

  try {
    const order = await apiFetch("/orders/guest-transfer", {
      method: "POST",
      body: JSON.stringify({
        item_id: Number(product.item_id),
        item_kind: product.item_kind || "card",
        game_role_id: roleId,
        game_role_name: roleName,
        nickname: nickname || undefined,
        amount_yuan: isResidualGuestPurchase ? undefined : directPurchaseContext.amountYuan,
        transfer_amount: isResidualGuestPurchase ? Number(directResidualAmount || 0) : undefined,
        payment_channel: selectedGuestTransferPaymentChannel,
        payment_reference: paymentReference,
        payer_note: payerNote || undefined,
      }),
    });
    closeProductModal();
    const paymentLabel = isResidualGuestPurchase
      ? "残卷转赠"
      : formatRechargeChannelLabel(selectedGuestTransferPaymentChannel);
    setNotice(
      `锁卡订单 #${order.id} 已提交，${product.name} 已先为你保留，等待管理员核对${paymentLabel}${isResidualGuestPurchase ? "" : "收款"}。`,
      "success"
    );
    await loadProducts({ resetPage: false });
  } catch (error) {
    const expectedAmount = Number(error?.payload?.expected_amount_yuan || 0);
    const expectedTransferAmount = Number(error?.payload?.expected_transfer_amount || 0);
    const transferUnit = String(error?.payload?.transfer_unit || "残卷");
    const customMessage =
      pickErrorMessage(error, "提交失败") === "amount_yuan_mismatch" && expectedAmount > 0
        ? `订单金额已变化，请按最新金额 ${formatCashAmount(expectedAmount)} 重新提交。`
        : pickErrorMessage(error, "提交失败") === "transfer_amount_mismatch" &&
            expectedTransferAmount > 0
          ? `订单所需转赠数量已变化，请按最新数量 ${expectedTransferAmount} ${transferUnit} 重新提交。`
        : pickErrorMessage(error, "提交失败");
    setProductDetailMessage(`锁卡提交失败：${customMessage}`, "error");
  }
}

function startDirectPurchase(itemId, itemKind = "card") {
  const product = findProduct(itemId, itemKind);
  if (!product) return;
  if (Number(activeItemId) !== Number(product.item_id) || String(activeItemKind) !== String(product.item_kind || "card")) {
    openProductModal(product.item_id, product.item_kind || "card");
  }
  toggleGuestTransferPanel(true);
}

async function loadProducts(options = {}) {
  const { resetPage = false } = options;
  setDebugLine("products.load", "requesting");
  try {
    const meta = await apiFetch("/products/meta");
    publicRechargeConfig = meta?.recharge_config || publicRechargeConfig;
    setDebugLine("products.meta", "ok");
  } catch (error) {
    // Keep product list usable even if the public pricing meta is temporarily unavailable.
    setDebugLine("products.meta", `error: ${error?.message || error}`);
  }
  const products = await apiFetch("/products");
  allProducts = products;
  setDebugLine("products.count", String(Array.isArray(products) ? products.length : 0));
  applyProductView({ resetPage });
  applyDiscountView({ resetPage });
}

async function loadAccount() {
  const session = loadSession();
  if (!session?.token) {
    setDebugLine("account.session", "missing");
    currentRechargeConfig = null;
    currentRechargeOrders = [];
    currentProfile = null;
    currentQuota = null;
    selectedRechargePaymentChannel = "alipay_qr";
    pendingDirectPurchaseContext = null;
    renderSessionSummary(null);
    renderProfile(null, null, []);
    renderBeginnerGuide(null, [], []);
    renderRechargeSection(null, null, []);
    renderDrawServiceZone(null, null);
    currentAuctionBidSummaries = [];
    renderAuctionZone(null);
    currentHelperBindings = [];
    currentHelperInventories = [];
    currentHelperMergedItems = [];
    currentHelperSnapshots = [];
    currentHelperActionLogs = [];
    currentHelperRestoreProgress = null;
    resetHelperInventorySyncState();
    renderHelperBindingPanel();
    renderHelperInventoryPanel();
    renderHelperSnapshotPanel();
    renderHelperRestoreProgressPanel();
    renderHelperTeamSwitchPanel();
    return;
  }

  const sessionProfileFallback = getSessionProfileFallback(session);
  if (sessionProfileFallback) {
    setDebugLine(
      "account.session",
      `${sessionProfileFallback.game_role_id || "-"} / ${sessionProfileFallback.game_role_name || "-"}`
    );
    currentProfile = sessionProfileFallback;
    currentQuota = {
      balance: Number(sessionProfileFallback.quota_balance ?? 0),
    };
    renderSessionSummary(sessionProfileFallback);
    renderProfile(sessionProfileFallback, currentQuota, []);
  }

  try {
    const [profile, quota, orders, rechargeConfig, rechargeOrders] = await Promise.all([
      apiFetch("/auth/me"),
      apiFetch("/me/quota"),
      apiFetch("/me/orders"),
      apiFetch("/me/recharge-config"),
      apiFetch("/me/recharge-orders"),
    ]);
    saveSession({ ...session, profile });
    currentRechargeConfig = rechargeConfig;
    publicRechargeConfig = rechargeConfig;
    currentRechargeOrders = rechargeOrders || [];
    currentProfile = profile;
    currentQuota = quota;
    renderSessionSummary(profile);
    renderProfile(profile, quota, orders || []);
    setDebugLine("account.profile", `${profile?.game_role_id || "-"} / ${profile?.game_role_name || "-"}`);
    setDebugLine("account.quota", String(quota?.balance ?? profile?.quota_balance ?? 0));
    setDebugLine("account.orders", String(Array.isArray(orders) ? orders.length : 0));
    renderBeginnerGuide(profile, orders || [], rechargeOrders || []);
    renderRechargeSection(profile, rechargeConfig, rechargeOrders || []);
    renderDrawServiceZone(profile, quota);
    loadHelperBindings();
    loadHelperInventories();
    loadHelperSnapshots();
    loadHelperActionLogs();
    await loadAuctions();
    if (consumePostAuthAccountFocus()) {
      window.location.hash = "account";
      activateAccountTab("overview");
      scrollSectionIntoView(accountSection);
      setActiveDockTarget("account");
    }
    setNotice("");
  } catch (error) {
    setDebugLine("account.error", error?.message || String(error));
    if (error.status === 401 || error.status === 403) {
      clearSession();
      currentRechargeConfig = null;
      currentRechargeOrders = [];
      currentProfile = null;
      currentQuota = null;
      selectedRechargePaymentChannel = "alipay_qr";
      pendingDirectPurchaseContext = null;
      renderSessionSummary(null);
      renderProfile(null, null, []);
      renderBeginnerGuide(null, [], []);
      renderRechargeSection(null, null, []);
      renderDrawServiceZone(null, null);
      currentAuctionBidSummaries = [];
      renderAuctionZone(null);
      currentHelperBindings = [];
      currentHelperInventories = [];
      currentHelperMergedItems = [];
      currentHelperSnapshots = [];
      currentHelperActionLogs = [];
      currentHelperRestoreProgress = null;
      resetHelperInventorySyncState();
      renderHelperBindingPanel();
      renderHelperInventoryPanel();
      renderHelperSnapshotPanel();
      renderHelperRestoreProgressPanel();
      setNotice("登录状态已失效，请重新登录。", "error");
      return;
    }
    setNotice(`账户信息加载失败：${error.message}`, "error");
  }
}

async function submitRechargeOrder(event) {
  event.preventDefault();
  const session = loadSession();
  if (!session?.token) {
    setAccountMessage("请先登录后再提交充值申请。", "error");
    return;
  }

  const amountInput = document.getElementById("recharge-amount-input");
  const referenceInput = document.getElementById("recharge-payment-reference");
  const noteInput = document.getElementById("recharge-note");
  const orderType =
    selectedRechargeOrderType === "season_member"
      ? "season_member"
      : selectedRechargeOrderType === "residual_transfer"
        ? "residual_transfer"
        : "normal";
  const amountYuan =
    orderType === "season_member"
      ? Number(currentRechargeConfig?.season_member_price_yuan || 0)
      : Number(amountInput?.value);
  const paymentReference = referenceInput?.value?.trim() || "";
  const payerNote = noteInput?.value?.trim() || "";
  const sessionProfile = session.profile || null;
  const pendingSeasonOrder = findPendingSeasonMemberOrder(currentRechargeOrders, currentRechargeConfig);

  if (orderType === "normal") {
    if (!isPositiveMoneyAmount(amountYuan)) {
      setAccountMessage("充值金额必须大于 0，且最多保留两位小数。", "error");
      return;
    }
  } else if (orderType === "residual_transfer") {
    if (!Number.isInteger(amountYuan) || amountYuan <= 0) {
      setAccountMessage(`转赠${currentRechargeConfig?.residual_unit_label || "残卷"}数量必须是大于 0 的整数。`, "error");
      return;
    }
  } else {
    if (sessionProfile?.season_member_active) {
      setAccountMessage("你本赛季已经是会员了，无需重复开通。", "error");
      return;
    }
    if (pendingSeasonOrder) {
      setAccountMessage("你的赛季会员申请正在审核中，请勿重复提交。", "error");
      return;
    }
  }
  if (!paymentReference) {
    setAccountMessage("请填写付款备注、付款单号或转账尾号。", "error");
    return;
  }

  try {
    const result = await apiFetch("/me/recharge-orders", {
      method: "POST",
      body: JSON.stringify({
        order_type: orderType,
        amount_yuan: amountYuan,
        payment_channel: orderType === "residual_transfer" ? undefined : selectedRechargePaymentChannel,
        payment_reference: paymentReference,
        payer_note: payerNote,
      }),
    });
    selectedRechargeAmount = amountYuan;
    selectedRechargeOrderType = "normal";
    pendingDirectPurchaseContext = null;
    setAccountMessage(
      orderType === "season_member"
        ? `赛季会员申请已提交，订单 #${result.id} 等待管理员审核。`
        : orderType === "residual_transfer"
          ? `残卷转赠申请已提交，订单 #${result.id} 等待管理员审核。`
        : `充值申请已提交，订单 #${result.id} 等待管理员审核。`,
      "success"
    );
    await loadAccount();
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
            : pickErrorMessage(error, "提交失败");
    setAccountMessage(`充值申请提交失败：${customMessage}`, "error");
  }
}

async function bindAccount(event) {
  event.preventDefault();
  setNotice("正在绑定...", "");
  try {
    const result = await apiFetch("/auth/game/bind", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: bindRoleIdInput.value.trim(),
        game_server: bindServerInput.value.trim(),
        game_role_name: bindRoleNameInput.value.trim(),
        bind_token_id: bindTokenIdInput.value.trim(),
        nickname: bindNicknameInput.value.trim(),
      }),
    });
    saveSession(result);
    const immediateProfile = getSessionProfileFallback(result);
    if (immediateProfile) {
      renderSessionSummary(immediateProfile);
      renderProfile(immediateProfile, { balance: Number(immediateProfile.quota_balance ?? 0) }, []);
    }
    await loadHelperConfig();
    schedulePostAuthAccountFocus();
    setNotice("绑定成功，已保存登录状态。", "success");
    activateAccountTab("overview");
    window.location.hash = "account";
    await loadAccount();
  } catch (error) {
    setNotice(`绑定失败：${pickErrorMessage(error, "绑定失败")}`, "error");
  }
}

async function loginAccount(event) {
  event.preventDefault();
  setNotice("正在登录...", "");
  try {
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: loginRoleIdInput.value.trim(),
        password: loginPasswordInput.value,
      }),
    });
    saveSession(result);
    const immediateProfile = getSessionProfileFallback(result);
    if (immediateProfile) {
      renderSessionSummary(immediateProfile);
      renderProfile(immediateProfile, { balance: Number(immediateProfile.quota_balance ?? 0) }, []);
    }
    await loadHelperConfig();
    schedulePostAuthAccountFocus();
    setNotice("登录成功。", "success");
    loginPasswordInput.value = "";
    activateAccountTab("overview");
    window.location.hash = "account";
    await loadAccount();
  } catch (error) {
    setNotice(`登录失败：${pickErrorMessage(error, "登录失败")}`, "error");
  }
}

async function confirmPurchase() {
  const session = loadSession();
  if (!session?.token) {
    setProductDetailMessage("请先登录后再购买。", "error");
    setNotice("请先登录后再购买。", "error");
    window.location.hash = "bind";
    return;
  }

  const product = findProduct(activeItemId, activeItemKind);
  if (!product) {
    setProductDetailMessage("当前商品不存在或已下架。", "error");
    return;
  }

  const currentQuota = getCurrentQuotaValue();
  const price = Number(product.price_quota || 0);
  if (currentQuota !== null && currentQuota < price) {
    setProductDetailMessage(`当前额度不足，还差 ${price - currentQuota}。`, "error");
    return;
  }

  const remaining = currentQuota === null ? null : currentQuota - price;
  const confirmed = window.confirm([
    `确认购买：${product.name}`,
    `消耗额度：${price}`,
    remaining === null ? "购买后余额将重新从服务端读取。" : `购买后剩余：${remaining}`,
  ].join("\n"));

  if (!confirmed) {
    setProductDetailMessage("已取消购买。");
    return;
  }

  try {
    const order = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ item_id: Number(activeItemId), item_kind: activeItemKind }),
    });
    const latestQuota = await apiFetch("/me/quota");
    const nextBalance = Number(latestQuota?.balance ?? remaining ?? 0);
    setNotice(`下单成功，订单 #${order.id} 已创建。`, "success");
    setProductDetailMessage(`已扣除 ${price} 额度，剩余 ${nextBalance}。`, "success");
    closeProductModal();
    await Promise.all([loadProducts(), loadAccount()]);
  } catch (error) {
    const message = pickErrorMessage(error, "下单失败");
    setProductDetailMessage(`下单失败：${message}`, "error");
    setNotice(`下单失败：${message}`, "error");
  }
}

async function requestCancelOrder(orderId) {
  const confirmed = window.confirm("确认提交取消申请？管理员审核通过后会退回额度并恢复库存。");
  if (!confirmed) return;

  try {
    await apiFetch(`/orders/${orderId}/cancel-request`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setNotice(`订单 #${orderId} 已提交取消申请。`, "success");
    await loadAccount();
  } catch (error) {
    setNotice(`提交取消申请失败：${pickErrorMessage(error, "提交失败")}`, "error");
  }
}

async function saveAccountProfile(event) {
  event.preventDefault();
  const session = loadSession();
  if (!session?.token) {
    setAccountMessage("请先登录后再修改资料。", "error");
    return;
  }

  try {
    const profile = await apiFetch("/me/profile", {
      method: "PATCH",
      body: JSON.stringify({
        game_role_name: accountRoleNameInput.value.trim(),
        nickname: accountNicknameInput.value.trim(),
        game_server: accountServerInput.value.trim(),
      }),
    });
    saveSession({ ...session, profile });
    setAccountMessage("资料已更新。", "success");
    await loadAccount();
  } catch (error) {
    setAccountMessage(`资料更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
}

async function changeAccountPassword(event) {
  event.preventDefault();
  const session = loadSession();
  if (!session?.token) {
    setAccountMessage("请先登录后再修改密码。", "error");
    return;
  }

  const currentPassword = accountCurrentPasswordInput.value;
  const newPassword = accountNewPasswordInput.value;
  const confirmPassword = accountConfirmPasswordInput.value;

  if (!currentPassword || !newPassword) {
    setAccountMessage("请填写完整密码信息。", "error");
    return;
  }
  if (newPassword.length < 6) {
    setAccountMessage("新密码至少需要 6 位。", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    setAccountMessage("两次输入的新密码不一致。", "error");
    return;
  }

  try {
    await apiFetch("/me/password", {
      method: "PATCH",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    accountCurrentPasswordInput.value = "";
    accountNewPasswordInput.value = "";
    accountConfirmPasswordInput.value = "";
    setAccountMessage("密码已更新。", "success");
  } catch (error) {
    setAccountMessage(`密码更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
  }
}

function logoutCurrentSession(options = {}) {
  clearSession();
  loadHelperConfig().catch(() => {});
  currentRechargeConfig = null;
  currentRechargeOrders = [];
  selectedRechargePaymentChannel = "alipay_qr";
  pendingDirectPurchaseContext = null;
  activateAccountTab("overview");
  renderSessionSummary(null);
  renderProfile(null, null, []);
  renderRechargeSection(null, null, []);
  setNotice("已退出登录。", "success");
  setAccountMessage("");
  if (options.toBind) {
    window.location.hash = "bind";
  }
}

function openHelper() {
  const origin = helperOriginInput.value.trim();
  if (!origin) {
    setNotice("请先填写 helper 地址。", "error");
    return;
  }
  setHelperOrigin(origin);
  window.open(withHelperCacheBuster(origin), "_blank");
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
  registerRoleIdInput.setCustomValidity("");
  if (!syncRegisterPasswordValidation(true)) {
    setNotice("两次输入的密码不一致，请重新确认。", "error");
    registerPasswordConfirmInput.focus();
    return;
  }

  setNotice("正在注册...", "");
  try {
    const result = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        game_role_id: registerRoleIdInput.value.trim(),
        game_role_name: registerRoleNameInput.value.trim(),
        password: registerPasswordInput.value,
      }),
    });
    saveSession(result);
    const immediateProfile = getSessionProfileFallback(result);
    if (immediateProfile) {
      renderSessionSummary(immediateProfile);
      renderProfile(immediateProfile, { balance: Number(immediateProfile.quota_balance ?? 0) }, []);
    }
    await loadHelperConfig();
    schedulePostAuthAccountFocus();
    setNotice("注册成功，已自动登录。", "success");
    registerPasswordInput.value = "";
    registerPasswordConfirmInput.value = "";
    syncRegisterPasswordValidation(false);
    activateAccountTab("overview");
    window.location.hash = "account";
    await loadAccount();
  } catch (error) {
    const isRoleIdTaken = error?.payload?.error === "game_role_id_taken";
    const message = isRoleIdTaken ? "这个游戏 ID 已经注册过账号了，请直接登录。" : pickErrorMessage(error, "注册失败");
    if (isRoleIdTaken) {
      registerRoleIdInput.setCustomValidity(message);
      registerRoleIdInput.reportValidity();
      registerRoleIdInput.focus();
    }
    setNotice(`注册失败：${message}`, "error");
  }
}

document.getElementById("reload-products-btn").addEventListener("click", () => {
  loadProducts().catch((error) => setNotice(`商品刷新失败：${error.message}`, "error"));
});

auctionStatusTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-auction-status]");
  if (!button) return;
  activeAuctionStatus = String(button.getAttribute("data-auction-status") || "live").trim() || "live";
  renderAuctionZone(currentProfile);
});

auctionBody?.addEventListener("click", (event) => {
  const quickButton = event.target.closest("[data-auction-bid-target]");
  if (quickButton) {
    const card = event.target.closest("[data-auction-id]");
    const amountInput = card?.querySelector('[data-field="auction-bid-amount"]');
    if (card && amountInput) {
      amountInput.value = String(Number(quickButton.getAttribute("data-auction-bid-target") || 0));
      updateAuctionBidPreview(card);
      amountInput.focus();
      amountInput.select?.();
    }
    return;
  }
  const button = event.target.closest(".submit-auction-bid-btn");
  if (!button) return;
  const card = event.target.closest("[data-auction-id]");
  if (!card) return;
  if (!currentProfile) {
    setAuctionMessage("请先登录后再参与拍卖。", "error");
    window.location.hash = "bind";
    return;
  }
  const auctionId = Number(card.getAttribute("data-auction-id") || 0);
  const amountInput = card.querySelector('[data-field="auction-bid-amount"]');
  submitAuctionBid(auctionId, Number(amountInput?.value || 0));
});
auctionBody?.addEventListener("input", (event) => {
  if (event.target?.getAttribute("data-field") !== "auction-bid-amount") return;
  const card = event.target.closest("[data-auction-id]");
  updateAuctionBidPreview(card);
});

document.getElementById("save-helper-origin-btn").addEventListener("click", () => {
  setHelperOrigin(helperOriginInput.value.trim());
  setNotice("helper 地址已保存。", "success");
});
document.getElementById("open-helper-btn").addEventListener("click", openHelper);
helperOpenBindPopupBtn?.addEventListener("click", openHelperBindPopup);
helperOpenAuthPopupBtn?.addEventListener("click", openHelperAuthPopup);
helperSaveBindBtn?.addEventListener("click", savePendingHelperBinding);
helperClearBindBtn?.addEventListener("click", clearPendingHelperSelection);
helperSyncCurrentInventoryBtn?.addEventListener("click", syncCurrentHelperInventory);
helperSyncAllInventoryBtn?.addEventListener("click", syncAllHelperInventories);
helperBuyPermanentSlotBtn?.addEventListener("click", () => purchaseHelperSlot("permanent"));
helperBuySeasonalSlotBtn?.addEventListener("click", () => purchaseHelperSlot("seasonal"));
helperReadSnapshotBtn?.addEventListener("click", openHelperSnapshotPopup);
helperClearPreviewBtn?.addEventListener("click", clearHelperRestorePreview);
helperTeamSwitchControls?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-helper-team-id]");
  if (!button) return;
  openHelperTeamSwitchPopup(button.getAttribute("data-helper-team-id"));
});
helperBindCurrent?.addEventListener("click", (event) => {
  const activateButton = event.target.closest(".helper-set-active-binding-btn");
  if (activateButton) {
    setActiveHelperBinding(activateButton.getAttribute("data-helper-binding-id"));
    setHelperBindMessage("已切换当前使用角色，后续保存阵容和一键还原都会跟着这个角色走。", "success");
    return;
  }
  const button = event.target.closest(".helper-remove-binding-btn");
  if (!button) return;
  removeHelperBinding(button.getAttribute("data-helper-binding-id"));
});
helperInventoryBindings?.addEventListener("click", (event) => {
  const button = event.target.closest(".helper-sync-binding-inventory-btn");
  if (!button) return;
  const bindingId = Number(button.getAttribute("data-helper-binding-id") || 0);
  const binding = (currentHelperBindings || []).find((item) => Number(item?.id || 0) === bindingId);
  if (!binding) {
    setHelperInventoryMessage("没有找到要同步的炉子角色。", "error");
    return;
  }
  startHelperInventorySync([binding], "single");
});
helperBridgeHiddenFrame?.addEventListener("load", () => {
  setDebugLine("helper.hiddenFrame", helperBridgeHiddenFrame.getAttribute("src") || "loaded");
});
helperSnapshotCurrent?.addEventListener("click", (event) => {
  const archivedToggleButton = event.target.closest(".helper-toggle-archived-snapshots-btn");
  if (archivedToggleButton) {
    showArchivedHelperSnapshots = !showArchivedHelperSnapshots;
    renderHelperSnapshotPanel();
    return;
  }
  const toggleButton = event.target.closest(".helper-toggle-snapshot-detail-btn");
  if (toggleButton) {
    const snapshotId = Number(toggleButton.getAttribute("data-helper-snapshot-id") || 0);
    if (expandedHelperSnapshotIds.has(snapshotId)) {
      expandedHelperSnapshotIds.delete(snapshotId);
    } else {
      expandedHelperSnapshotIds.add(snapshotId);
    }
    renderHelperSnapshotPanel();
    return;
  }
  const switchButton = event.target.closest(".helper-switch-to-snapshot-btn");
  if (switchButton) {
    openHelperTeamSwitchPopup(switchButton.getAttribute("data-helper-team-id"));
    return;
  }
  const restoreButton = event.target.closest(".helper-restore-snapshot-btn");
  if (restoreButton) {
    openHelperRestorePopup(restoreButton.getAttribute("data-helper-snapshot-id"));
    return;
  }
  const previewButton = event.target.closest(".helper-preview-snapshot-btn");
  if (previewButton) {
    openHelperPreviewPopup(previewButton.getAttribute("data-helper-snapshot-id"));
    return;
  }
  const renameButton = event.target.closest(".helper-rename-snapshot-btn");
  if (renameButton) {
    renameHelperSnapshot(renameButton.getAttribute("data-helper-snapshot-id"));
    return;
  }
  const pinButton = event.target.closest(".helper-pin-snapshot-btn");
  if (pinButton) {
    togglePinHelperSnapshot(pinButton.getAttribute("data-helper-snapshot-id"));
    return;
  }
  const removeButton = event.target.closest(".helper-remove-snapshot-btn");
  if (removeButton) {
    removeHelperSnapshot(removeButton.getAttribute("data-helper-snapshot-id"));
  }
});
helperSnapshotList?.addEventListener("click", (event) => {
  const archivedToggleButton = event.target.closest(".helper-toggle-archived-snapshots-btn");
  if (archivedToggleButton) {
    showArchivedHelperSnapshots = !showArchivedHelperSnapshots;
    renderHelperSnapshotPanel();
    return;
  }
  const toggleButton = event.target.closest(".helper-toggle-snapshot-detail-btn");
  if (toggleButton) {
    const snapshotId = Number(toggleButton.getAttribute("data-helper-snapshot-id") || 0);
    if (expandedHelperSnapshotIds.has(snapshotId)) {
      expandedHelperSnapshotIds.delete(snapshotId);
    } else {
      expandedHelperSnapshotIds.add(snapshotId);
    }
    renderHelperSnapshotPanel();
    return;
  }
  const switchButton = event.target.closest(".helper-switch-to-snapshot-btn");
  if (switchButton) {
    openHelperTeamSwitchPopup(switchButton.getAttribute("data-helper-team-id"));
    return;
  }
  const restoreButton = event.target.closest(".helper-restore-snapshot-btn");
  if (restoreButton) {
    openHelperRestorePopup(restoreButton.getAttribute("data-helper-snapshot-id"));
    return;
  }
  const previewButton = event.target.closest(".helper-preview-snapshot-btn");
  if (previewButton) {
    openHelperPreviewPopup(previewButton.getAttribute("data-helper-snapshot-id"));
    return;
  }
  const renameButton = event.target.closest(".helper-rename-snapshot-btn");
  if (renameButton) {
    renameHelperSnapshot(renameButton.getAttribute("data-helper-snapshot-id"));
    return;
  }
  const pinButton = event.target.closest(".helper-pin-snapshot-btn");
  if (pinButton) {
    togglePinHelperSnapshot(pinButton.getAttribute("data-helper-snapshot-id"));
    return;
  }
  const button = event.target.closest(".helper-remove-snapshot-btn");
  if (!button) return;
  removeHelperSnapshot(button.getAttribute("data-helper-snapshot-id"));
});
document.getElementById("logout-btn").addEventListener("click", () => logoutCurrentSession());
accountLogoutBtn?.addEventListener("click", () => logoutCurrentSession());
accountSwitchLink?.addEventListener("click", (event) => {
  event.preventDefault();
  logoutCurrentSession({ toBind: true });
});
document.getElementById("close-product-detail-btn").addEventListener("click", closeProductModal);
closeHelperBridgeModalBtn?.addEventListener("click", closeHelperBridgeModal);
helperBridgeModal?.addEventListener("click", (event) => {
  if (event.target === helperBridgeModal) {
    closeHelperBridgeModal();
  }
});

bindForm.addEventListener("submit", bindAccount);
registerForm.addEventListener("submit", handleRegisterSubmit);
loginForm.addEventListener("submit", loginAccount);
accountProfileForm?.addEventListener("submit", saveAccountProfile);
accountPasswordForm?.addEventListener("submit", changeAccountPassword);
registerPasswordInput?.addEventListener("input", () => syncRegisterPasswordValidation(false));
registerPasswordConfirmInput?.addEventListener("input", () => syncRegisterPasswordValidation(false));
registerPasswordConfirmInput?.addEventListener("blur", () => syncRegisterPasswordValidation(true));
registerRoleIdInput?.addEventListener("input", () => registerRoleIdInput.setCustomValidity(""));
authTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateAuthTab(button.getAttribute("data-auth-tab"));
  });
});
window.__gongfaAuthBound = true;
accountTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateAccountTab(button.getAttribute("data-account-tab"));
  });
});
accountTabLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetTab = link.getAttribute("data-account-tab-target") || "overview";
    event.preventDefault();
    window.location.hash =
      targetTab === "recharge" ? "recharge-panel" : targetTab === "orders" ? "help-panel" : "account";
    activateAccountTab(targetTab, { scroll: true });
  });
});
beginnerGuideTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveGuidePage(button.getAttribute("data-guide-page-target") || "tutorial");
  });
});
beginnerGuidePrevBtn?.addEventListener("click", () => setActiveGuidePage("tutorial"));
beginnerGuideNextBtn?.addEventListener("click", () => setActiveGuidePage("sales"));
if (beginnerCarousel) {
  let touchStartX = 0;
  let touchDeltaX = 0;
  beginnerCarousel.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.touches[0]?.clientX || 0;
      touchDeltaX = 0;
    },
    { passive: true }
  );
  beginnerCarousel.addEventListener(
    "touchmove",
    (event) => {
      const currentX = event.touches[0]?.clientX || touchStartX;
      touchDeltaX = currentX - touchStartX;
    },
    { passive: true }
  );
  beginnerCarousel.addEventListener("touchend", () => {
    if (Math.abs(touchDeltaX) < 48) return;
    setActiveGuidePage(touchDeltaX < 0 ? "sales" : "tutorial");
  });
}
pageDockItems.forEach((button) => {
  button.addEventListener("click", () => {
    navigateWithDock(button.getAttribute("data-dock-target") || "products");
  });
});
mobileAdminLink?.addEventListener("click", () => {
  window.location.href = "admin.html";
});
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-account-tab-target]");
  if (!link || accountTabLinks.includes(link)) return;
  const targetTab = link.getAttribute("data-account-tab-target") || "overview";
  event.preventDefault();
  window.location.hash =
    targetTab === "recharge" ? "recharge-panel" : targetTab === "orders" ? "help-panel" : "account";
  activateAccountTab(targetTab, { scroll: true });
});
keywordInput.addEventListener("input", () => {
  resetProductPagination();
  if (productSearchTimer) {
    window.clearTimeout(productSearchTimer);
  }
  productSearchTimer = window.setTimeout(() => {
    applyProductView({ resetPage: true });
  }, 120);
});
sortSelect.addEventListener("change", () => applyProductView({ resetPage: true }));
productCategoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.getAttribute("data-category") || "all";
  activeSubcategory = "all";
  activeDetail = "all";
  activeFullness = "all";
  applyProductView({ resetPage: true });
});
productSubcategoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-subcategory]");
  if (!button) return;
  activeSubcategory = button.getAttribute("data-subcategory") || "all";
  activeDetail = "all";
  activeFullness = "all";
  applyProductView({ resetPage: true });
});
productDetailTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-detail]");
  if (!button) return;
  activeDetail = button.getAttribute("data-detail") || "all";
  activeFullness = "all";
  applyProductView({ resetPage: true });
});
productFullnessTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-fullness]");
  if (!button) return;
  activeFullness = button.getAttribute("data-fullness") || "all";
  applyProductView({ resetPage: true });
});
discountKeywordInput?.addEventListener("input", () => {
  resetDiscountPagination();
  if (discountSearchTimer) {
    window.clearTimeout(discountSearchTimer);
  }
  discountSearchTimer = window.setTimeout(() => {
    applyDiscountView({ resetPage: true });
  }, 120);
});
discountSortSelect?.addEventListener("change", () => applyDiscountView({ resetPage: true }));
discountCategoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-category]");
  if (!button) return;
  activeDiscountCategory = button.getAttribute("data-discount-category") || "all";
  activeDiscountSubcategory = "all";
  activeDiscountDetail = "all";
  activeDiscountFullness = "all";
  applyDiscountView({ resetPage: true });
});
discountSubcategoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-subcategory]");
  if (!button) return;
  activeDiscountSubcategory = button.getAttribute("data-discount-subcategory") || "all";
  activeDiscountDetail = "all";
  activeDiscountFullness = "all";
  applyDiscountView({ resetPage: true });
});
discountDetailTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-detail]");
  if (!button) return;
  activeDiscountDetail = button.getAttribute("data-discount-detail") || "all";
  activeDiscountFullness = "all";
  applyDiscountView({ resetPage: true });
});
discountFullnessTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-fullness]");
  if (!button) return;
  activeDiscountFullness = button.getAttribute("data-discount-fullness") || "all";
  applyDiscountView({ resetPage: true });
});
function handleProductGridClick(event) {
  const directBuyButton = event.target.closest(".direct-buy-btn");
  if (directBuyButton) {
    startDirectPurchase(
      directBuyButton.getAttribute("data-item-id"),
      directBuyButton.getAttribute("data-item-kind")
    );
    return;
  }

  const button = event.target.closest(".detail-btn, .buy-btn");
  if (!button) return;
  openProductModal(button.getAttribute("data-item-id"), button.getAttribute("data-item-kind"));
}

productGrid.addEventListener("click", handleProductGridClick);
discountProductGrid?.addEventListener("click", handleProductGridClick);
productPagination?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-page]");
  if (!button) return;
  const page = Number(button.getAttribute("data-product-page"));
  if (!Number.isInteger(page) || page < 1) return;
  productPaginationState.page = page;
  renderProducts(currentProducts);
  scrollProductsIntoView();
});
discountProductPagination?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-discount-page]");
  if (!button) return;
  const page = Number(button.getAttribute("data-discount-page"));
  if (!Number.isInteger(page) || page < 1) return;
  discountPaginationState.page = page;
  renderDiscountProducts(currentDiscountProducts);
  discountProductsSection?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});
rechargeBody?.addEventListener("click", (event) => {
  const clearDirectPurchaseButton = event.target.closest("[data-direct-purchase-clear]");
  if (clearDirectPurchaseButton) {
    pendingDirectPurchaseContext = null;
    const session = loadSession();
    renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
    setAccountMessage("已切回普通充值。", "success");
    return;
  }

  const paymentChannelButton = event.target.closest("[data-payment-channel]");
  if (paymentChannelButton) {
    selectedRechargePaymentChannel = String(paymentChannelButton.getAttribute("data-payment-channel") || "alipay_qr").trim() || "alipay_qr";
    const session = loadSession();
    renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
    return;
  }

  const typeButton = event.target.closest("[data-recharge-order-type]");
  if (typeButton) {
    const nextType = String(typeButton.getAttribute("data-recharge-order-type") || "").trim();
    selectedRechargeOrderType =
      nextType === "season_member" || nextType === "residual_transfer" ? nextType : "normal";
    if (selectedRechargeOrderType !== "normal") {
      pendingDirectPurchaseContext = null;
    }
    const session = loadSession();
    renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
    return;
  }

  const amountButton = event.target.closest("[data-recharge-amount]");
  if (!amountButton) return;
  selectedRechargeAmount = Number(amountButton.getAttribute("data-recharge-amount") || 0);
  const amountInput = document.getElementById("recharge-amount-input");
  if (amountInput && isPositiveMoneyAmount(selectedRechargeAmount)) {
    amountInput.value = String(selectedRechargeAmount);
  }
  const session = loadSession();
  renderRechargeSection(session?.profile || null, currentRechargeConfig, currentRechargeOrders);
});
rechargeBody?.addEventListener("input", (event) => {
  if (event.target?.id !== "recharge-amount-input") return;
  selectedRechargeAmount = Number(event.target.value || 0);
  const session = loadSession();
  updateRechargeQuotePreview(session?.profile || null, currentRechargeConfig);
  rechargeBody.querySelectorAll("[data-recharge-amount]").forEach((node) => {
    node.classList.toggle("active", Number(node.getAttribute("data-recharge-amount")) === Number(selectedRechargeAmount));
  });
});
rechargeBody?.addEventListener("submit", (event) => {
  if (event.target?.id !== "recharge-form") return;
  submitRechargeOrder(event);
});
orderList.addEventListener("click", (event) => {
  const button = event.target.closest(".request-cancel-btn");
  if (!button) return;
  requestCancelOrder(button.getAttribute("data-order-id"));
});
productDetailModal.addEventListener("click", (event) => {
  if (event.target === productDetailModal) closeProductModal();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !productDetailModal.classList.contains("hidden")) {
    closeProductModal();
  }
});
window.addEventListener("message", (event) => {
  if (handleHelperBridgeMessage(event)) return;
  applyIncomingPayload(event.data);
});
window.addEventListener("storage", (event) => {
  if (event.key === "gongfa_session_v1") loadAccount();
});
window.addEventListener("hashchange", syncAccountTabWithHash);
window.addEventListener("scroll", syncDockWithViewport, { passive: true });
window.addEventListener("resize", syncDockWithViewport);
window.addEventListener("error", (event) => {
  setDebugLine("window.error", event?.message || "unknown");
});
window.addEventListener("unhandledrejection", (event) => {
  setDebugLine("window.rejection", event?.reason?.message || String(event?.reason || "unknown"));
});

setDebugLine("boot", "module_loaded");
safeRun("startup.activateAuthTab", () => activateAuthTab(activeAuthTab));
safeRun("startup.activateAccountTab", () => activateAccountTab(activeAccountTab));
safeRun("startup.syncHash", () => syncAccountTabWithHash());
safeRun("startup.syncDock", () => syncDockWithViewport());
safeRun("startup.guidePage", () => setActiveGuidePage("tutorial"));
safeRun("startup.helperOrigin", () => {
  if (helperOriginInput) helperOriginInput.value = getHelperOrigin();
});
safeRun("startup.helperConfig", () => loadHelperConfig());
safeRun("startup.helperPanel", () => renderHelperBindingPanel());
safeRun("startup.helperInventory", () => renderHelperInventoryPanel());
safeRun("startup.helperSnapshots", () => renderHelperSnapshotPanel());
safeRun("startup.helperPreview", () => renderHelperRestorePreviewPanel());
safeRun("startup.beginnerGuide", () => renderBeginnerGuide(null, [], []));
safeRun("startup.recentSalesRender", () => renderRecentSales([]));
safeRun("startup.products", () =>
  loadProducts().catch((error) => {
    setNotice(`商品加载失败：${error.message}`, "error");
    throw error;
  })
);
safeRun("startup.auctions", () => loadAuctions());
safeRun("startup.recentSales", () => loadRecentSales());
safeRun("startup.account", () => loadAccount());
window.setInterval(updateAuctionCountdowns, AUCTION_COUNTDOWN_TICK_MS);
