import {
  ADMIN_READ_ROLE_VALUES,
  ADMIN_WRITE_ROLE_VALUES,
} from "./roles.js?v=release-20260611-151806";

export const POSTER_EXPORT_LIMIT = 60;
export const POSTER_WEBSITE = "gongfazhushou.cn";
export const PRICING_TIER_ORDER = ["green", "blue", "purple", "orange", "red", "gold"];
export const PRICING_TIER_LABELS = {
  green: "绿卡",
  blue: "蓝卡",
  purple: "紫卡",
  orange: "橙卡",
  red: "红卡",
  gold: "金卡",
};
export const ADMIN_READ_ROLES = new Set(ADMIN_READ_ROLE_VALUES);
export const ADMIN_WRITE_ROLES = new Set(ADMIN_WRITE_ROLE_VALUES);
export const READ_ONLY_WRITE_CONTROL_IDS = [
  "load-sample-json-btn",
  "import-batch-add-btn",
  "import-batch-file-input",
  "import-batch-clear-btn",
  "import-batch-submit-btn",
  "helper-import-file-input",
  "helper-import-clear-btn",
  "helper-import-submit-btn",
  "helper-import-submit-products-btn",
  "import-submit-btn",
  "recalculate-pricing-btn",
  "bulk-on-sale-btn",
  "bulk-off-sale-btn",
  "bulk-price-input",
  "bulk-price-btn",
  "bulk-stock-input",
  "bulk-stock-btn",
  "bulk-discount-rate-input",
  "bulk-discount-btn",
  "bulk-restore-discount-btn",
  "filtered-restore-discount-btn",
  "random-discount-count-input",
  "random-discount-rate-input",
  "random-select-products-btn",
  "random-discount-btn",
  "admin-auction-starting-price-input",
  "admin-auction-min-increment-input",
  "admin-auction-start-at-input",
  "admin-auction-end-at-input",
  "admin-auction-title-input",
  "admin-auction-remark-input",
  "admin-create-auction-btn",
  "save-recharge-config-btn",
];

export function createAdminStore() {
  return {
    selectedProductIds: new Set(),
    allProducts: [],
    allBundles: [],
    allUsers: [],
    currentRechargeConfig: null,
    draftPricingControls: null,
    linkedOrderUser: null,
    activeAdminPage: "imports",
    activeAdminProductCategory: "all",
    activeAdminProductSubcategory: "all",
    activeAdminProductDetail: "all",
    activeAdminProductFullness: "all",
    currentOrderList: [],
    currentRechargeOrderList: [],
    currentAuctionList: [],
    currentPaymentReviewList: [],
    overviewData: {
      products: { total: 0, on_sale: 0, discounted: 0 },
      bundles: { total: 0 },
      users: { total: 0, active: 0, total_quota: 0 },
      alerts: { pending_orders: 0, cancel_reviews: 0, recharge_reviews: 0 },
    },
    currentProductFacets: {
      categories: [],
      subcategories: [],
      details: [],
      fullness: [],
    },
    currentProductSummary: {
      filtered_total: 0,
      discounted_total: 0,
    },
    currentProductAppliedFilters: {
      keyword: "",
      status: "all",
      discount: "all",
      category: "all",
      subcategory: "all",
      detail: "all",
      fullness: "all",
    },
    pendingImportEntries: [],
    pendingHelperInventoryEntries: [],
    loadedAdminPages: new Set(),
    alertPollTimer: null,
    currentAdminProfile: null,
    paginationState: {
      products: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
      bundles: { page: 1, pageSize: 8, total: 0, totalPages: 0 },
      users: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      orders: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      rechargeOrders: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      quotaLogs: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      audits: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    },
  };
}
