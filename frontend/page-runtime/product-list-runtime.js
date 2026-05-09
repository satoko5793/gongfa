function scheduleSearchApply(ctx, timerKey) {
  const getTimer =
    timerKey === "discount" ? ctx.getDiscountSearchTimer : ctx.getProductSearchTimer;
  const setTimer =
    timerKey === "discount" ? ctx.setDiscountSearchTimer : ctx.setProductSearchTimer;
  const resetPagination =
    timerKey === "discount" ? ctx.resetDiscountPagination : ctx.resetProductPagination;
  const applyView = timerKey === "discount" ? ctx.applyDiscountView : ctx.applyProductView;

  resetPagination();
  const currentTimer = getTimer();
  if (currentTimer) {
    window.clearTimeout(currentTimer);
  }
  const nextTimer = window.setTimeout(() => {
    setTimer(null);
    applyView({ resetPage: true });
  }, Number(ctx.searchDelayMs || 120));
  setTimer(nextTimer);
}

function activateCategoryFilter(event, selector, readValue) {
  const button = event.target.closest(selector);
  if (!button) return null;
  return String(readValue(button) || "all").trim() || "all";
}

function handlePaginationClick(event, selector) {
  const button = event.target.closest(selector);
  if (!button) return null;
  return button;
}

export function handleProductKeywordInputRuntime(ctx) {
  scheduleSearchApply(ctx, "product");
  return true;
}

export function handleProductSortChangeRuntime(ctx) {
  ctx.applyProductView({ resetPage: true });
  return true;
}

export function handleProductCategoryClickRuntime(ctx, event) {
  const nextCategory = activateCategoryFilter(
    event,
    "[data-category]",
    (button) => button.getAttribute("data-category")
  );
  if (!nextCategory) return false;
  ctx.setActiveCategory(nextCategory);
  ctx.setActiveSubcategory("all");
  ctx.setActiveDetail("all");
  ctx.setActiveFullness("all");
  ctx.applyProductView({ resetPage: true });
  return true;
}

export function handleProductSubcategoryClickRuntime(ctx, event) {
  const nextSubcategory = activateCategoryFilter(
    event,
    "[data-subcategory]",
    (button) => button.getAttribute("data-subcategory")
  );
  if (!nextSubcategory) return false;
  ctx.setActiveSubcategory(nextSubcategory);
  ctx.setActiveDetail("all");
  ctx.setActiveFullness("all");
  ctx.applyProductView({ resetPage: true });
  return true;
}

export function handleProductDetailClickRuntime(ctx, event) {
  const nextDetail = activateCategoryFilter(
    event,
    "[data-detail]",
    (button) => button.getAttribute("data-detail")
  );
  if (!nextDetail) return false;
  ctx.setActiveDetail(nextDetail);
  ctx.setActiveFullness("all");
  ctx.applyProductView({ resetPage: true });
  return true;
}

export function handleProductFullnessClickRuntime(ctx, event) {
  const nextFullness = activateCategoryFilter(
    event,
    "[data-fullness]",
    (button) => button.getAttribute("data-fullness")
  );
  if (!nextFullness) return false;
  ctx.setActiveFullness(nextFullness);
  ctx.applyProductView({ resetPage: true });
  return true;
}

export function handleDiscountKeywordInputRuntime(ctx) {
  scheduleSearchApply(ctx, "discount");
  return true;
}

export function handleDiscountSortChangeRuntime(ctx) {
  ctx.applyDiscountView({ resetPage: true });
  return true;
}

export function handleDiscountCategoryClickRuntime(ctx, event) {
  const nextCategory = activateCategoryFilter(
    event,
    "[data-discount-category]",
    (button) => button.getAttribute("data-discount-category")
  );
  if (!nextCategory) return false;
  ctx.setActiveDiscountCategory(nextCategory);
  ctx.setActiveDiscountSubcategory("all");
  ctx.setActiveDiscountDetail("all");
  ctx.setActiveDiscountFullness("all");
  ctx.applyDiscountView({ resetPage: true });
  return true;
}

export function handleDiscountSubcategoryClickRuntime(ctx, event) {
  const nextSubcategory = activateCategoryFilter(
    event,
    "[data-discount-subcategory]",
    (button) => button.getAttribute("data-discount-subcategory")
  );
  if (!nextSubcategory) return false;
  ctx.setActiveDiscountSubcategory(nextSubcategory);
  ctx.setActiveDiscountDetail("all");
  ctx.setActiveDiscountFullness("all");
  ctx.applyDiscountView({ resetPage: true });
  return true;
}

export function handleDiscountDetailClickRuntime(ctx, event) {
  const nextDetail = activateCategoryFilter(
    event,
    "[data-discount-detail]",
    (button) => button.getAttribute("data-discount-detail")
  );
  if (!nextDetail) return false;
  ctx.setActiveDiscountDetail(nextDetail);
  ctx.setActiveDiscountFullness("all");
  ctx.applyDiscountView({ resetPage: true });
  return true;
}

export function handleDiscountFullnessClickRuntime(ctx, event) {
  const nextFullness = activateCategoryFilter(
    event,
    "[data-discount-fullness]",
    (button) => button.getAttribute("data-discount-fullness")
  );
  if (!nextFullness) return false;
  ctx.setActiveDiscountFullness(nextFullness);
  ctx.applyDiscountView({ resetPage: true });
  return true;
}

export function handleProductPaginationClickRuntime(ctx, event) {
  const button = handlePaginationClick(event, "[data-product-page]");
  if (!button) return false;
  const page = Number(button.getAttribute("data-product-page"));
  if (!Number.isInteger(page) || page < 1) return false;
  ctx.getProductPaginationState().page = page;
  ctx.renderProducts(ctx.getCurrentProducts());
  ctx.scrollProductsIntoView();
  return true;
}

export function handleDiscountPaginationClickRuntime(ctx, event) {
  const button = handlePaginationClick(event, "[data-discount-page]");
  if (!button) return false;
  const page = Number(button.getAttribute("data-discount-page"));
  if (!Number.isInteger(page) || page < 1) return false;
  ctx.getDiscountPaginationState().page = page;
  ctx.renderDiscountProducts(ctx.getCurrentDiscountProducts());
  ctx.scrollDiscountProductsIntoView();
  return true;
}
