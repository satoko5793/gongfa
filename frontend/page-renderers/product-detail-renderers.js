import {
  RESIDUAL_ANCHOR_AMOUNT,
  getResidualPurchaseAnchorCashYuan,
} from "../payment-conversion.js?v=release-20260611-151806";

function hasBundleVariant(product, patch = {}) {
  const variants = Array.isArray(product?.bundle_variants) ? product.bundle_variants : [];
  const selected = product?.selected_bundle_options || {};
  const attackMin = Number(
    patch.attack_min === undefined ? selected.attack_min || 0 : patch.attack_min
  );
  const hpMin = Number(patch.hp_min === undefined ? selected.hp_min || 0 : patch.hp_min);
  return variants.some(
    (variant) =>
      Number(variant.attack_min || 0) === attackMin && Number(variant.hp_min || 0) === hpMin
  );
}

function renderDynamicBundleOption(ctx, product, option, field, selectedValue) {
  const value = Number(option.value || 0);
  const available =
    field === "attack_min"
      ? hasBundleVariant(product, { attack_min: value })
      : hasBundleVariant(product, { hp_min: value });
  const suffix = available ? "可凑" : "无整套";
  return `
    <option value="${value}" ${value === Number(selectedValue || 0) ? "selected" : ""} ${
      available ? "" : "disabled"
    }>${ctx.escapeHtml(`${option.label || value}（${suffix}）`)}</option>
  `;
}

function formatConsignmentOption(ctx, option, rechargeConfig) {
  const method = String(option?.method || "").trim();
  if (method === "cash") return `${Number(option.price_yuan || 0)} 元`;
  if (method === "quota") return `${Number(option.price_quota || 0)} 额度`;
  if (method === "residual") return `${Number(option.transfer_amount || 0)} ${option.transfer_unit || rechargeConfig?.residual_unit_label || "残卷"}`;
  return "-";
}

export function renderProductDetailModalContent(ctx, model) {
  const {
    product,
    sessionProfile,
    directPurchaseContext,
    directResidualAmount,
    guestPaymentMethods,
    activeGuestPaymentMethod,
    isResidualGuestPurchase,
    stockLabel,
    attackIsFull,
    hpIsFull,
    cashPriceText,
    residualPriceText,
    originalPriceQuota,
    discounted,
    termBadges,
    rechargeConfig,
    quotaPolicy,
  } = model;
  const isConsignment = String(product?.item_kind || "") === "consignment" || Boolean(product?.is_consignment);
  if (isConsignment) {
    const paymentOptions =
      Array.isArray(product?.payment_options) && product.payment_options.length
        ? product.payment_options
        : [{ method: "cash", label: "人民币", price_yuan: Number(product?.price_yuan || product?.price_quota || 0) }];
    const sellerName = String(product?.seller_display_name || product?.seller_role_name || "").trim() || "寄售卖家";
    const sellerContact = String(product?.seller_contact_info || "").trim();
    const priceSummary = paymentOptions.map((option) => formatConsignmentOption(ctx, option, rechargeConfig)).join(" / ");
    return `
      <div class="product-detail-shell">
        <div class="product-detail-layout">
          <div class="product-detail-cover">${ctx.renderProductVisual(product, "detail")}</div>
          <div class="product-detail-main">
            <div class="product-headline">
              <div class="product-name">${ctx.escapeHtml(product.name || "功法")}</div>
              <div class="product-type-chip">${ctx.escapeHtml(ctx.getTierLabel(product))} / ${ctx.escapeHtml(product.uid || "-")}</div>
            </div>
            <div class="product-meta">玩家寄售 / ${ctx.escapeHtml(ctx.getSeasonDisplayText(product))}</div>
            <div class="term-row">${termBadges.length ? termBadges.map((badge) => ctx.renderTermBadge(badge)).join("") : '<span class="term-empty">无额外词条</span>'}</div>
            <div class="detail-list">
              <div class="detail-row"><strong>价格</strong><span>${ctx.escapeHtml(priceSummary || "-")}</span></div>
              <div class="detail-row"><strong>攻击</strong><span>${ctx.renderFullStatValue(product.attack_value || 0, attackIsFull)}</span></div>
              <div class="detail-row"><strong>血量</strong><span>${ctx.renderFullStatValue(product.hp_value || 0, hpIsFull)}</span></div>
              <div class="detail-row"><strong>赛季</strong><span>${ctx.escapeHtml(ctx.getSeasonDisplayText(product))}</span></div>
              <div class="detail-row"><strong>库存</strong><span>寄售 1 张</span></div>
              <div class="detail-row"><strong>卖家</strong><span>${ctx.escapeHtml(sellerName)}</span></div>
              <div class="detail-row"><strong>联系方式</strong><span>${ctx.escapeHtml(sellerContact || "未登记，请通过平台联系")}</span></div>
            </div>
            <div class="direct-purchase-panel">
              <div class="direct-purchase-panel-head">
                <strong>平台担保购买</strong>
                <span>转账、额度或残卷都会先交给平台托管；卖家发卡后确认收货，再结算给卖家。</span>
              </div>
              <form id="consignment-escrow-form" class="guest-transfer-form" novalidate>
                <div class="preset-list guest-transfer-methods">
                  ${paymentOptions
                    .map(
                      (option, index) => `
                        <label class="preset-chip ${index === 0 ? "active" : ""}">
                          <input type="radio" name="consignment-payment-method" value="${ctx.escapeHtml(option.method)}" ${index === 0 ? "checked" : ""} />
                          ${ctx.escapeHtml(option.label || option.method)} ${ctx.escapeHtml(formatConsignmentOption(ctx, option, rechargeConfig))}
                        </label>
                      `
                    )
                    .join("")}
                </div>
                <label class="guest-transfer-field-span">付款/转赠备注
                  <input id="consignment-payment-reference" type="text" maxlength="100" placeholder="额度支付可填：额度支付；转账/残卷请填时间或说明" />
                </label>
                <label class="guest-transfer-field-span">补充说明（可选）
                  <textarea id="consignment-buyer-note" rows="3" placeholder="例如：收卡角色、联系方式、付款截图说明"></textarea>
                </label>
                <div class="guest-transfer-form-actions">
                  <button class="ghost" type="button" id="modal-close-btn">返回</button>
                  <button class="primary" type="submit">提交担保订单</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const detailRows = ctx.isBundle(product)
    ? `
        <div class="detail-row"><strong>类型</strong><span>套餐 SKU</span></div>
        <div class="detail-row"><strong>编码</strong><span>${ctx.escapeHtml(product.uid || "-")}</span></div>
        <div class="detail-row"><strong>库存</strong><span>${ctx.escapeHtml(stockLabel)}</span></div>
      `
    : `
        <div class="detail-row"><strong>攻击</strong><span>${ctx.renderFullStatValue(product.attack_value || 0, attackIsFull)}</span></div>
        <div class="detail-row"><strong>血量</strong><span>${ctx.renderFullStatValue(product.hp_value || 0, hpIsFull)}</span></div>
        <div class="detail-row"><strong>赛季</strong><span>${ctx.escapeHtml(ctx.getSeasonDisplayText(product))}</span></div>
        <div class="detail-row"><strong>库存</strong><span>${ctx.escapeHtml(stockLabel)}</span></div>
      `;
  const bundleComponents = Array.isArray(product?.bundle_components) ? product.bundle_components : [];
  const bundleOptions = product?.configurable_bundle ? product.bundle_options || {} : null;
  const selectedBundleOptions = product?.selected_bundle_options || {};
  const bundleOptionControlsHtml =
    ctx.isBundle(product) && bundleOptions
      ? `
          <div class="dynamic-bundle-controls">
            <label>攻击档
              <select data-dynamic-bundle-field="attack_min">
                ${(Array.isArray(bundleOptions.attack) ? bundleOptions.attack : [])
                  .map((option) =>
                    renderDynamicBundleOption(
                      ctx,
                      product,
                      option,
                      "attack_min",
                      selectedBundleOptions.attack_min
                    )
                  )
                  .join("")}
              </select>
            </label>
            <label>血量档
              <select data-dynamic-bundle-field="hp_min">
                ${(Array.isArray(bundleOptions.hp) ? bundleOptions.hp : [])
                  .map((option) =>
                    renderDynamicBundleOption(
                      ctx,
                      product,
                      option,
                      "hp_min",
                      selectedBundleOptions.hp_min
                    )
                  )
                  .join("")}
              </select>
            </label>
            <div class="muted dynamic-bundle-help">标记“无整套”的档位当前凑不齐全部卡种，暂不能选择。</div>
          </div>
        `
      : "";
  const bundleComponentHtml =
    ctx.isBundle(product) && bundleComponents.length > 0
      ? `
          <div class="detail-list bundle-component-list" data-bundle-component-list="1">
            ${bundleComponents
              .map(
                (component) => `
                  <div class="detail-row">
                    <strong>${ctx.escapeHtml(component.role || "组件")}</strong>
                    <span>${ctx.escapeHtml(component.name || "-")} / ${Number(component.price_quota || 0)} 额度</span>
                  </div>
                `
              )
              .join("")}
          </div>
        `
      : "";
  const currentQuota = Number(model.currentQuota);
  const hasQuota = Number.isFinite(currentQuota);
  const priceQuota = Number(product.price_quota || 0);
  const quotaPurchaseDisabled = Boolean(quotaPolicy?.quota_purchase_disabled);
  const quotaDisabledReason = quotaPolicy?.quota_purchase_disabled_reason || "";
  const remainingQuota = hasQuota ? currentQuota - priceQuota : null;
  const afterQuotaText =
    remainingQuota === null
      ? "待刷新"
      : remainingQuota >= 0
        ? `${remainingQuota} 额度`
        : `不足 ${Math.abs(remainingQuota)} 额度`;
  const quotaHint = quotaPurchaseDisabled
    ? quotaDisabledReason
    : !sessionProfile
    ? "登录后可显示当前额度和购买后的剩余额度。"
    : !hasQuota
      ? "当前额度稍后会在提交购买时自动刷新。"
      : remainingQuota >= 0
        ? `当前 ${currentQuota} 额度，购买后预计剩余 ${remainingQuota} 额度。`
        : `当前 ${currentQuota} 额度，购买后仍差 ${Math.abs(remainingQuota)} 额度。`;

  return `
    <div class="product-detail-shell">
      <div class="product-detail-layout">
        <div class="product-detail-cover">${ctx.renderProductVisual(product, "detail")}</div>
        <div class="product-detail-main">
          <div class="product-headline">
            <div class="product-name">${ctx.escapeHtml(product.name)}</div>
            <div class="product-type-chip">${ctx.escapeHtml(ctx.getTierLabel(product))} / ${ctx.escapeHtml(product.uid || "-")}</div>
          </div>
          ${ctx.isBundle(product) ? `<div class="product-meta">${ctx.escapeHtml(product.description || product.main_attrs || "套餐商品")}</div>` : ""}
          <div class="term-row">${termBadges.length > 0 ? termBadges.map((badge) => ctx.renderTermBadge(badge)).join("") : '<span class="term-empty">无额外词条</span>'}</div>
          <div class="detail-list">
            <div class="detail-row"><strong>价格</strong><span data-product-price-text="1">${discounted ? `原价 ${originalPriceQuota} / ` : ""}${Number(product.price_quota || 0)} 额度${cashPriceText ? ` / ${ctx.escapeHtml(cashPriceText)}` : ""}${residualPriceText ? ` / ${ctx.escapeHtml(residualPriceText)}` : ""}${discounted ? ` / ${ctx.escapeHtml(product.discount_label || "折扣")}` : ""}</span></div>
            ${detailRows}
            <div class="detail-row"><strong>额度购买账号</strong><span>${ctx.escapeHtml(sessionProfile?.game_role_name || "未登录")}</span></div>
          </div>
          ${bundleOptionControlsHtml}
          ${bundleComponentHtml}
          <div class="direct-purchase-panel">
            <div class="direct-purchase-panel-head">
              <strong>${quotaPurchaseDisabled ? "额度购买已暂停" : "额度直购备注"}</strong>
              <span>${
                quotaPurchaseDisabled
                  ? "当前商品仍可使用转账锁卡或残卷转赠提交订单。"
                  : "只在点击“确认购买”时提交，转账锁卡不受影响。"
              }</span>
            </div>
            ${
              quotaPurchaseDisabled
                ? `<div class="purchase-policy-callout">${ctx.escapeHtml(quotaDisabledReason)}</div>`
                : ""
            }
            <div class="direct-purchase-balance">
              <div class="direct-purchase-balance-card">
                <span>购买前</span>
                <strong>${ctx.escapeHtml(hasQuota ? `${currentQuota} 额度` : "待刷新")}</strong>
              </div>
              <div class="direct-purchase-balance-card">
                <span>购买后</span>
                <strong>${ctx.escapeHtml(afterQuotaText)}</strong>
              </div>
            </div>
            <label class="direct-purchase-remark-field">补充备注（可选）
              <textarea id="purchase-remark" rows="3" placeholder="${ctx.escapeHtml("例如：收卡账号是 123456789，当前登录号只负责付款")}"></textarea>
            </label>
            <div class="muted">${ctx.escapeHtml(quotaHint)}</div>
          </div>
          <div class="product-detail-actions">
            <button class="ghost" type="button" id="modal-close-btn">返回</button>
            <button class="ghost" type="button" id="direct-buy-btn">转账锁卡</button>
            <button class="primary" type="button" id="confirm-buy-btn" ${
              quotaPurchaseDisabled ? "disabled" : ""
            }>${quotaPurchaseDisabled ? "首周暂停额度购买" : "确认购买"}</button>
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
                                      class="preset-chip ${ctx.selectedGuestTransferPaymentChannel === method.key ? "active" : ""}"
                                      type="button"
                                      data-guest-payment-channel="${method.key}"
                                    >${ctx.escapeHtml(method.label)}</button>
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
                            <div class="guest-transfer-card-title"><strong>${ctx.escapeHtml(rechargeConfig?.residual_admin_role_name || "admin残卷")}</strong></div>
                            <div class="muted">游戏名称：${ctx.escapeHtml(rechargeConfig?.residual_admin_game_name || "-")}</div>
                            <div class="muted">游戏 ID：${ctx.escapeHtml(rechargeConfig?.residual_admin_role_id || "-")}</div>
                            <div class="muted">购卡残卷比例：${getResidualPurchaseAnchorCashYuan(rechargeConfig)} 元 = ${RESIDUAL_ANCHOR_AMOUNT} ${ctx.escapeHtml(rechargeConfig?.residual_unit_label || "残卷")}</div>
                          `
                        : `
                            <img class="recharge-qr-image" src="${ctx.escapeHtml(activeGuestPaymentMethod.imageUrl || "")}" alt="${ctx.escapeHtml(activeGuestPaymentMethod.name || "收款码")}" />
                            <div class="guest-transfer-card-title"><strong>${ctx.escapeHtml(activeGuestPaymentMethod.name || "收款码")}</strong></div>
                            <div class="muted">${ctx.escapeHtml(activeGuestPaymentMethod.hint || "转账后填写付款时间提交")}</div>
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
                        .map((line) => `<div class="stack-item">${ctx.escapeHtml(line)}</div>`)
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
                        <strong>${ctx.escapeHtml(
                          isResidualGuestPurchase
                            ? `${Number(directResidualAmount || 0)} ${rechargeConfig?.residual_unit_label || "残卷"}`
                            : ctx.formatCashAmount(directPurchaseContext.amountYuan)
                        )}</strong>
                        <span class="muted">${Number(directPurchaseContext.quotaAmount)} 额度 / ${ctx.escapeHtml(ctx.formatCashAmount(directPurchaseContext.amountYuan))}，商品会先锁定</span>
                      </div>
                    </div>
                    <div class="guest-transfer-fields">
                      <label>游戏 ID
                        <input id="guest-transfer-role-id" type="text" maxlength="60" value="${ctx.escapeHtml(sessionProfile?.game_role_id || "")}" placeholder="例如 584967604" required />
                      </label>
                      <label>角色名
                        <input id="guest-transfer-role-name" type="text" maxlength="60" value="${ctx.escapeHtml(sessionProfile?.game_role_name || "")}" placeholder="例如 繁星秋" required />
                      </label>
                      <label>昵称（可选）
                        <input id="guest-transfer-nickname" type="text" maxlength="60" value="${ctx.escapeHtml(sessionProfile?.nickname || "")}" placeholder="方便你这边识别即可" />
                      </label>
                      <label>${isResidualGuestPurchase ? "转赠时间" : "付款时间"}
                        <input id="guest-transfer-reference" type="text" maxlength="100" placeholder="${ctx.escapeHtml(isResidualGuestPurchase ? "例如 19:42 已转残卷" : "例如 19:42 支付宝已转")}" required />
                      </label>
                      <label class="guest-transfer-field-span">补充说明（可选）
                        <textarea id="guest-transfer-note" rows="3" placeholder="${ctx.escapeHtml(
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
}
