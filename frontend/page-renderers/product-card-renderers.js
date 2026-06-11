export function formatFullStatValue(ctx, value, isFull = false) {
  const compact = ctx.formatCompactNumber(value);
  return isFull ? `${compact}（满）` : compact;
}

export function renderFullStatValue(ctx, value, isFull = false) {
  const className = isFull ? ' class="stat-no-wrap"' : "";
  return `<span${className}>${ctx.escapeHtml(formatFullStatValue(ctx, value, isFull))}</span>`;
}

export function renderStatBlock(ctx, label, value, isFull = false, compact = false) {
  const numeric = Number(value || 0);
  const displayValue = isFull
    ? renderFullStatValue(ctx, numeric, true)
    : compact
      ? renderFullStatValue(ctx, value, false)
      : Number(value || 0);

  return `
    <div class="stat-block ${isFull ? "full" : ""}">
      <span class="stat-label">${ctx.escapeHtml(label)}</span>
      <strong class="stat-value">${displayValue}</strong>
    </div>
  `;
}

export function formatTermBadgeLabel(ctx, label, product) {
  const raw = String(label || "").trim();
  if (!raw) return "";
  if (ctx.getTierKey(product) !== "gold") return raw;

  const match = raw.match(/^(走火|气定)\s*([0-9.]+)$/);
  if (!match) return raw;

  const value = Number(match[2] || 0);
  if (!Number.isFinite(value) || value < 3) return raw;
  return `${match[1]} ${match[2]}（满）`;
}

export function parseTermBadges(ctx, text, product) {
  if (ctx.isBundle(product)) {
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
    .map((item) => ({ label: formatTermBadgeLabel(ctx, item, product), kind: "term" }));
}

export function renderTermBadge(ctx, badge) {
  return `<span class="term-badge ${ctx.escapeHtml(badge.kind || "term")}">${ctx.escapeHtml(badge.label || "")}</span>`;
}

export function renderProductTermRow(ctx, termBadges, limit = 2) {
  if (!termBadges.length) return "";
  const visibleBadges = termBadges.slice(0, limit);
  const overflow = termBadges.length - visibleBadges.length;
  return `
    <div class="term-row compact">
      ${visibleBadges.map((badge) => renderTermBadge(ctx, badge)).join("")}
      ${overflow > 0 ? `<span class="term-badge plain term-more">+${overflow}</span>` : ""}
    </div>
  `;
}

function formatConsignmentPriceYuan(product) {
  const price = Number(product?.price_yuan ?? product?.price_quota ?? 0);
  if (!Number.isFinite(price) || price <= 0) return "价格待确认";
  return `${Number.isInteger(price) ? String(price) : price.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} 元`;
}

function renderConsignmentPriceChips(ctx, product) {
  const options = Array.isArray(product?.payment_options) ? product.payment_options : [];
  if (!options.length) {
    return `<span class="chip strong">人民币 ${ctx.escapeHtml(formatConsignmentPriceYuan(product))}</span>`;
  }
  return options
    .map((option) => {
      const method = String(option?.method || "").trim();
      if (method === "cash") return `<span class="chip strong">人民币 ${Number(option.price_yuan || 0)} 元</span>`;
      if (method === "quota") return `<span class="chip accent soft">额度 ${Number(option.price_quota || 0)}</span>`;
      if (method === "residual") return `<span class="chip subtle">残卷 ${Number(option.transfer_amount || 0)} ${ctx.escapeHtml(option.transfer_unit || "残卷")}</span>`;
      return "";
    })
    .filter(Boolean)
    .join("");
}

export function renderProductVisual(ctx, product, variant = "grid") {
  if (ctx.isBundle(product) && !product?.image_url) {
    return ctx.renderBundleCollage(product, variant);
  }

  const payload = ctx.getImagePayload(product, product?.item_kind || "card");
  const imageClass = variant === "detail" ? "product-detail-image" : "product-image";
  return `
    <div class="product-image-shell ${variant === "detail" ? "detail" : "grid"}">
      <img
        class="${imageClass}"
        src="${ctx.escapeHtml(payload.src)}"
        alt="${ctx.escapeHtml(product?.name || "??")}" 
        data-fallbacks="${ctx.escapeHtml(payload.fallbacks.join("|"))}"
        data-placeholder="${ctx.escapeHtml(payload.placeholder)}"
      />
      <div class="product-badge-row">
        <span class="product-badge">${ctx.escapeHtml(ctx.getTierLabel(product))}</span>
        <span class="product-badge subtle">${ctx.isBundle(product) ? "套餐" : `ID ${ctx.escapeHtml(product?.legacy_id || "-")}`}</span>
        ${ctx.isBundle(product) ? "" : `<span class="product-badge subtle">${ctx.escapeHtml(ctx.getSeasonDisplayText(product))}</span>`}
      </div>
    </div>
  `;
}

export function renderProductCard(ctx, product) {
  const isConsignment = String(product?.item_kind || "") === "consignment" || Boolean(product?.is_consignment);
  const termBadges = parseTermBadges(ctx, product.ext_attrs, product);
  const cashPriceText = isConsignment ? "" : ctx.getProductCashPriceText(product);
  const residualPriceText = !isConsignment && ctx.getProductResidualPriceText
    ? ctx.getProductResidualPriceText(product)
    : "";
  const subtitle = ctx.isBundle(product)
    ? `${ctx.getTierLabel(product)} / 套餐`
    : isConsignment
      ? `玩家寄售 / ${ctx.escapeHtml(ctx.getSeasonCompactLabel(product))}`
      : `${ctx.getTierLabel(product)} / ${ctx.escapeHtml(ctx.getSeasonCompactLabel(product))}`;
  const bodyHtml = ctx.isBundle(product)
    ? `<div class="product-meta">${ctx.escapeHtml(product.description || product.main_attrs || "套餐商品")}</div>`
    : `
        <div class="product-stats-grid">
          ${renderStatBlock(ctx, "攻击", product.attack_value, ctx.isAttackFull(product), true)}
          ${renderStatBlock(ctx, "血量", product.hp_value, ctx.isHpFull(product), true)}
        </div>
      `;
  const originalPriceQuota = ctx.getOriginalQuotaPrice(product);
  const discounted = ctx.isDiscountedProduct(product);
  const quotaPolicy = ctx.getQuotaPurchasePolicy ? ctx.getQuotaPurchasePolicy(product) : null;
  const quotaPurchaseDisabled = Boolean(quotaPolicy?.quota_purchase_disabled);
  const quotaDisabledReason = quotaPolicy?.quota_purchase_disabled_reason || "";

  return `
    <article class="product-card ${discounted ? "discounted" : ""} ${isConsignment ? "consignment" : ""}">
      <div class="product-cover">${renderProductVisual(ctx, product, "grid")}</div>
      <div class="product-summary">
      <div class="product-headline">
        <div class="discount-title-line">
          <div class="product-name">${ctx.escapeHtml(product.name)}</div>
          ${isConsignment ? `<span class="chip accent soft">玩家寄售</span>` : ""}
          ${discounted ? `<span class="chip discount">${ctx.escapeHtml(product.discount_label || "限时折扣")}</span>` : ""}
        </div>
        <div class="product-type-chip">${subtitle}</div>
      </div>
      ${bodyHtml}
      ${renderProductTermRow(ctx, termBadges)}
      </div>
      <div class="chip-row">
        ${
          isConsignment
            ? renderConsignmentPriceChips(ctx, product)
            : `
              ${discounted ? `<span class="chip original-price">原 ${ctx.formatCompactNumber(originalPriceQuota)}</span>` : ""}
              <span class="chip ${discounted ? "accent" : "strong"}">额度 ${ctx.formatCompactNumber(product.price_quota || 0)}</span>
              ${cashPriceText ? `<span class="chip accent soft">${ctx.escapeHtml(cashPriceText)}</span>` : ""}
              ${residualPriceText ? `<span class="chip subtle">${ctx.escapeHtml(residualPriceText)}</span>` : ""}
              ${discounted && Number(product.discount_saved_quota || 0) > 0 ? `<span class="chip discount">立省 ${ctx.formatCompactNumber(product.discount_saved_quota)}</span>` : ""}
            `
        }
        ${
          product.stock !== null && product.stock !== undefined && Number(product.stock) <= 1
            ? `<span class="chip subtle">余量 ${Number(product.stock || 0)}</span>`
            : ""
        }
      </div>
      <div class="actions">
        ${
          isConsignment
            ? `<button class="primary consignment-buy-btn" type="button" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">担保购买</button>`
            : `
              <button class="ghost detail-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">详情</button>
              <button class="ghost direct-buy-btn" data-item-id="${product.item_id}" data-item-kind="${product.item_kind}">转账锁卡</button>
              <button
                class="primary buy-btn"
                data-item-id="${product.item_id}"
                data-item-kind="${product.item_kind}"
                ${quotaPurchaseDisabled ? `disabled title="${ctx.escapeHtml(quotaDisabledReason)}"` : ""}
              >${quotaPurchaseDisabled ? "首周禁额度" : "购买"}</button>
            `
        }
      </div>
    </article>
  `;
}
