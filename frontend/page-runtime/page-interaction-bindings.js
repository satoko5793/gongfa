function bindIfPresent(node, type, handler) {
  node?.addEventListener(type, handler);
}

function bindAccountInteractionEvents(ctx) {
  bindIfPresent(ctx.globalLogoutButton, "click", () => ctx.handleAccountLogoutClick());
  bindIfPresent(ctx.accountLogoutBtn, "click", () => ctx.handleAccountLogoutClick());
  bindIfPresent(ctx.accountSwitchLink, "click", (event) => ctx.handleAccountSwitchClick(event));
  bindIfPresent(ctx.accountProfileForm, "submit", (event) => ctx.handleAccountProfileSubmit(event));
  bindIfPresent(ctx.accountPasswordForm, "submit", (event) => ctx.handleAccountPasswordSubmit(event));
  bindIfPresent(ctx.orderList, "click", (event) => ctx.handleOrderListClick(event));
}

function bindShopInteractionEvents(ctx) {
  bindIfPresent(ctx.reloadProductsButton, "click", () => ctx.handleReloadProducts());
  bindIfPresent(ctx.keywordInput, "input", () => ctx.handleProductKeywordInput());
  bindIfPresent(ctx.sortSelect, "change", () => ctx.handleProductSortChange());
  bindIfPresent(ctx.productCategoryTabs, "click", (event) => ctx.handleProductCategoryClick(event));
  bindIfPresent(ctx.productSubcategoryTabs, "click", (event) =>
    ctx.handleProductSubcategoryClick(event)
  );
  bindIfPresent(ctx.productDetailTabs, "click", (event) => ctx.handleProductDetailClick(event));
  bindIfPresent(ctx.productFullnessTabs, "click", (event) =>
    ctx.handleProductFullnessClick(event)
  );
  bindIfPresent(ctx.discountKeywordInput, "input", () => ctx.handleDiscountKeywordInput());
  bindIfPresent(ctx.discountSortSelect, "change", () => ctx.handleDiscountSortChange());
  bindIfPresent(ctx.discountCategoryTabs, "click", (event) =>
    ctx.handleDiscountCategoryClick(event)
  );
  bindIfPresent(ctx.discountSubcategoryTabs, "click", (event) =>
    ctx.handleDiscountSubcategoryClick(event)
  );
  bindIfPresent(ctx.discountDetailTabs, "click", (event) => ctx.handleDiscountDetailClick(event));
  bindIfPresent(ctx.discountFullnessTabs, "click", (event) =>
    ctx.handleDiscountFullnessClick(event)
  );
  bindIfPresent(ctx.productGrid, "click", (event) => ctx.handleProductGridClick(event));
  bindIfPresent(ctx.discountProductGrid, "click", (event) => ctx.handleProductGridClick(event));
  bindIfPresent(ctx.productPagination, "click", (event) => ctx.handleProductPaginationClick(event));
  bindIfPresent(ctx.discountProductPagination, "click", (event) =>
    ctx.handleDiscountPaginationClick(event)
  );
  bindIfPresent(ctx.closeProductDetailButton, "click", ctx.closeProductModal);
}

function bindAuctionInteractionEvents(ctx) {
  bindIfPresent(ctx.auctionStatusTabs, "click", (event) => ctx.handleAuctionStatusTabsClick(event));
  bindIfPresent(ctx.auctionBody, "click", (event) => ctx.handleAuctionBodyClick(event));
  bindIfPresent(ctx.auctionBody, "input", (event) => ctx.handleAuctionBodyInput(event));
}

function bindDrawServiceInteractionEvents(ctx) {
  bindIfPresent(ctx.drawServiceBody, "click", (event) => ctx.handleDrawServiceBodyClick(event));
  bindIfPresent(ctx.drawServiceBody, "input", (event) => ctx.handleDrawServiceBodyInput(event));
  bindIfPresent(ctx.drawServiceBody, "submit", (event) => ctx.handleDrawServiceBodySubmit(event));
}

function bindRechargeInteractionEvents(ctx) {
  bindIfPresent(ctx.rechargeBody, "click", (event) => ctx.handleRechargePanelClick(event));
  bindIfPresent(ctx.rechargeBody, "input", (event) => ctx.handleRechargePanelInput(event));
  bindIfPresent(ctx.rechargeBody, "submit", (event) => ctx.handleRechargePanelSubmit(event));
}

export function bindPageInteractionEvents(ctx) {
  bindAccountInteractionEvents(ctx);
  bindShopInteractionEvents(ctx);
  bindAuctionInteractionEvents(ctx);
  bindDrawServiceInteractionEvents(ctx);
  bindRechargeInteractionEvents(ctx);
}
