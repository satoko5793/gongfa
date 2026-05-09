export function getLoginEntryHrefRuntime(currentPageMode) {
  return currentPageMode === "legacy" ? "#bind" : "login.html";
}

export function navigateToLoginEntryRuntime(ctx) {
  const href = getLoginEntryHrefRuntime(ctx.currentPageMode);
  if (href.startsWith("#")) {
    ctx.setLocationHash(href.slice(1));
    return;
  }
  ctx.setLocationHref(href);
}

export function getPostAuthSurfaceUrlRuntime(currentPageMode) {
  if (currentPageMode === "legacy" || currentPageMode === "me" || currentPageMode === "script") {
    return null;
  }
  return "me.html#account";
}

export function navigateToPostAuthSurfaceRuntime(ctx) {
  const targetUrl = getPostAuthSurfaceUrlRuntime(ctx.currentPageMode);
  if (targetUrl) {
    ctx.setLocationHref(targetUrl);
    return true;
  }
  return false;
}

function getDockSections(ctx) {
  return [
    { key: "products", node: ctx.productsSection },
    { key: "discount-products-section", node: ctx.discountProductsSection },
    { key: "account", node: ctx.accountSection },
    { key: "helper-lab", node: ctx.helperLabSection },
    { key: "auction-zone", node: ctx.auctionZoneSection },
    { key: "draw-service-zone", node: ctx.drawServiceZoneSection },
  ].filter((entry) => entry.node && !entry.node.classList.contains("hidden"));
}

function getScrollOffset(ctx) {
  return Number(ctx.getHeaderHeight?.() || 0) + 28;
}

export function setActiveDockTargetRuntime(ctx, target) {
  ctx.setActiveDockTargetValue(target);
  ctx.pageDockItems.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-dock-target") === target);
  });
}

export function scrollSectionIntoViewRuntime(ctx, section) {
  if (!section) return;
  const top = Number(ctx.getScrollY?.() || 0) + section.getBoundingClientRect().top - getScrollOffset(ctx);
  ctx.scrollTo({
    top: Math.max(top, 0),
    behavior: "smooth",
  });
}

export function navigateWithDockRuntime(ctx, target) {
  if (target === "account") {
    ctx.setLocationHash("account");
    ctx.activateAccountTab("overview");
    scrollSectionIntoViewRuntime(ctx, ctx.accountSection);
    setActiveDockTargetRuntime(ctx, target);
    return;
  }

  const section = ctx.getElementById(target);
  if (!section) return;
  if (target === "products" || target === "discount-products-section") {
    ctx.setLocationHash(target);
  } else {
    ctx.setLocationHash(target);
  }
  scrollSectionIntoViewRuntime(ctx, section);
  setActiveDockTargetRuntime(ctx, target);
}

export function syncDiscountDockVisibilityRuntime(ctx, hasDiscounts) {
  if (!ctx.discountDockButton) return;
  ctx.discountDockButton.classList.toggle("hidden", !hasDiscounts);
  if (!hasDiscounts && ctx.getActiveDockTargetValue() === "discount-products-section") {
    setActiveDockTargetRuntime(ctx, "products");
  }
}

export function syncDockWithViewportRuntime(ctx) {
  const sections = getDockSections(ctx);
  if (!sections.length) return;
  const probe =
    Number(ctx.getScrollY?.() || 0) +
    getScrollOffset(ctx) +
    Math.min(Number(ctx.getInnerHeight?.() || 0) * 0.22, 140);
  let nextActive = sections[0].key;
  sections.forEach((entry) => {
    const top = Number(ctx.getScrollY?.() || 0) + entry.node.getBoundingClientRect().top;
    if (top <= probe) {
      nextActive = entry.key;
    }
  });
  if (nextActive !== ctx.getActiveDockTargetValue()) {
    setActiveDockTargetRuntime(ctx, nextActive);
  }
}
