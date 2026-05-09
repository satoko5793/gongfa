export function updateAuctionBidPreviewRuntime(ctx, card) {
  if (!card) return;
  const amountInput = card.querySelector('[data-field="auction-bid-amount"]');
  const previewNode = card.querySelector('[data-field="auction-bid-preview"]');
  if (!amountInput || !previewNode) return;
  const auctionId = Number(card.getAttribute("data-auction-id") || 0);
  const auction = ctx
    .getCurrentAuctions()
    .find((item) => Number(item?.id || 0) === auctionId) || null;
  const nextMinBid = Number(auction?.next_min_bid_quota || auction?.starting_price_quota || 0);
  const enteredAmount = Number(amountInput.value || 0);
  if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
    previewNode.textContent = `最低可出 ${nextMinBid} 额度，约 ${ctx.getQuotaCashText(nextMinBid)}。`;
    return;
  }
  if (enteredAmount < nextMinBid) {
    previewNode.textContent = `当前输入 ${enteredAmount} 额度，低于最低可出 ${nextMinBid} 额度。`;
    return;
  }
  previewNode.textContent = `本次出价 ${enteredAmount} 额度，约 ${ctx.getQuotaCashText(enteredAmount)}。`;
}

export function handleAuctionStatusTabsClickRuntime(ctx, event) {
  const button = event.target.closest("[data-auction-status]");
  if (!button) return false;
  ctx.setActiveAuctionStatus(
    String(button.getAttribute("data-auction-status") || "live").trim() || "live"
  );
  ctx.renderAuctionZone(ctx.getCurrentProfile());
  return true;
}

export function handleAuctionBodyClickRuntime(ctx, event) {
  const quickButton = event.target.closest("[data-auction-bid-target]");
  if (quickButton) {
    const card = event.target.closest("[data-auction-id]");
    const amountInput = card?.querySelector('[data-field="auction-bid-amount"]');
    if (card && amountInput) {
      amountInput.value = String(Number(quickButton.getAttribute("data-auction-bid-target") || 0));
      updateAuctionBidPreviewRuntime(ctx, card);
      amountInput.focus();
      amountInput.select?.();
    }
    return true;
  }

  const button = event.target.closest(".submit-auction-bid-btn");
  if (!button) return false;
  const card = event.target.closest("[data-auction-id]");
  if (!card) return false;
  if (!ctx.getCurrentProfile()) {
    ctx.setAuctionMessage("请先登录后再参与拍卖。", "error");
    ctx.navigateToLoginEntry();
    return true;
  }
  const auctionId = Number(card.getAttribute("data-auction-id") || 0);
  const amountInput = card.querySelector('[data-field="auction-bid-amount"]');
  ctx.submitAuctionBid(auctionId, Number(amountInput?.value || 0));
  return true;
}

export function handleAuctionBodyInputRuntime(ctx, event) {
  if (event.target?.getAttribute("data-field") !== "auction-bid-amount") return false;
  const card = event.target.closest("[data-auction-id]");
  updateAuctionBidPreviewRuntime(ctx, card);
  return true;
}

export function updateAuctionCountdownsRuntime(ctx) {
  if (!ctx.auctionBody) return;
  const nodes = ctx.auctionBody.querySelectorAll("[data-auction-countdown-id]");
  if (!nodes.length) return;
  const nowMs = Date.now();
  nodes.forEach((node) => {
    const auctionId = Number(node.getAttribute("data-auction-countdown-id") || 0);
    const auction = ctx
      .getCurrentAuctions()
      .find((item) => Number(item?.id || 0) === auctionId);
    if (!auction) return;
    const meta = ctx.getAuctionCountdownMeta(auction, nowMs);
    node.className = `auction-countdown ${meta.tone}`;
    const labelNode = node.querySelector(".auction-countdown-label");
    const valueNode = node.querySelector(".auction-countdown-value");
    if (labelNode) labelNode.textContent = meta.label;
    if (valueNode) valueNode.textContent = meta.value;
  });
}
