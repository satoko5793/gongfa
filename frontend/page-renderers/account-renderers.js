import { ORDER_STATUS } from "../app-constants.js?v=release-20260611-151806";
import {
  RESIDUAL_ANCHOR_AMOUNT,
  getResidualAnchorCashYuan,
} from "../payment-conversion.js?v=release-20260611-151806";
import {
  formatEscrowPayment,
  formatEscrowSettlement,
  formatEscrowStatus,
  getEscrowBuyerNextStep,
  getEscrowSellerNextStep,
} from "../escrow-formatters.js?v=release-20260611-151806";

function renderEscrowEvidenceLinks(ctx, trade) {
  const evidence = Array.isArray(trade?.evidence) ? trade.evidence : [];
  if (!evidence.length) return "";
  return `<div class="purchase-detail-line"><span>证据图片</span><strong>${evidence
    .map((item, index) => `<a href="${ctx.escapeHtml(item.url)}" target="_blank" rel="noreferrer">图片 ${index + 1}</a>`)
    .join(" / ")}</strong></div>`;
}

function renderPurchaseCover(ctx, imageUrl, name) {
  const title = String(name || "功法").trim() || "功法";
  return `
    <div class="purchase-cover">
      ${
        imageUrl
          ? `<img src="${ctx.escapeHtml(imageUrl)}" alt="${ctx.escapeHtml(title)}" loading="lazy" />`
          : `<span>${ctx.escapeHtml(title.slice(0, 2))}</span>`
      }
    </div>
  `;
}

function renderPurchaseMetric(ctx, label, value, tone = "") {
  return `
    <div class="purchase-metric ${tone}">
      <span>${ctx.escapeHtml(label)}</span>
      <strong>${ctx.escapeHtml(value || "-")}</strong>
    </div>
  `;
}

function renderDetailLine(ctx, label, value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return `<div class="purchase-detail-line"><span>${ctx.escapeHtml(label)}</span><strong>${ctx.escapeHtml(normalized)}</strong></div>`;
}

function getOrderKindLabel(order) {
  const source = String(order?.order_source || "").trim();
  if (source === "draw_service") return "代抽";
  if (source === "guest_transfer") return "转账购买";
  if (source === "external") return "站外订单";
  return "商城购买";
}

function getOrderPrimaryItem(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items[0] || null;
}

function getOrderPrimarySnapshot(order) {
  const item = getOrderPrimaryItem(order);
  return item?.product_snapshot && typeof item.product_snapshot === "object" ? item.product_snapshot : {};
}

function getOrderTitle(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return getOrderKindLabel(order);
  const firstName = String(items[0]?.product_name || "商品").trim() || "商品";
  return items.length > 1 ? `${firstName} 等 ${items.length} 项` : firstName;
}

function getOrderImageUrl(order) {
  const snapshot = getOrderPrimarySnapshot(order);
  return String(snapshot?.image_url || "").trim();
}

function getOrderAttrSummary(order) {
  const snapshot = getOrderPrimarySnapshot(order);
  return [snapshot?.main_attrs, snapshot?.ext_attrs].filter(Boolean).join(" · ");
}

function getEscrowItemAttrSummary(item) {
  return [item?.main_attr_text, item?.ext_attr_text].filter(Boolean).join(" · ");
}

function renderAccountEscrowCard(ctx, trade, profile, role) {
  const item = trade?.item_snapshot || {};
  const isBuyer = role === "buyer";
  const other = isBuyer ? trade?.seller : trade?.buyer;
  const otherLabel = isBuyer ? "卖家" : "买家";
  const nextStep = isBuyer ? getEscrowBuyerNextStep(trade) : getEscrowSellerNextStep(trade);
  const status = String(trade?.status || "").trim();
  const itemName = item.display_name || item.name || "功法";
  const attrSummary = getEscrowItemAttrSummary(item);
  const actions = [
    !isBuyer && status === "escrowed"
      ? `<button class="ghost escrow-delivery-btn" type="button" data-escrow-id="${Number(trade.id || 0)}">提交发货证据</button>`
      : "",
    isBuyer && status === "delivered"
      ? `<button class="primary escrow-confirm-btn" type="button" data-escrow-id="${Number(trade.id || 0)}">确认收货</button>`
      : "",
    isBuyer && ["escrowed", "delivered"].includes(status)
      ? `<button class="ghost escrow-dispute-btn" type="button" data-escrow-id="${Number(trade.id || 0)}">发起纠纷</button>`
      : "",
  ].filter(Boolean).join("");

  return `
    <article class="purchase-card">
      ${renderPurchaseCover(ctx, item.image_url, itemName)}
      <div class="purchase-card-main">
        <div class="purchase-card-head">
          <div>
            <div class="purchase-kicker">${ctx.escapeHtml(isBuyer ? "担保买入" : "担保卖出")} #${Number(trade?.id || 0)}</div>
            <strong class="purchase-title">${ctx.escapeHtml(itemName)}</strong>
            ${attrSummary ? `<div class="purchase-subtitle">${ctx.escapeHtml(attrSummary)}</div>` : ""}
          </div>
          <span class="purchase-status">${ctx.escapeHtml(formatEscrowStatus(status))}</span>
        </div>
        <div class="purchase-metrics">
          ${renderPurchaseMetric(ctx, "支付", formatEscrowPayment(trade), "accent")}
          ${renderPurchaseMetric(ctx, otherLabel, other?.game_role_name || other?.nickname || "-")}
          ${renderPurchaseMetric(ctx, "结算", formatEscrowSettlement(trade?.settlement_status))}
        </div>
        <div class="purchase-next">${ctx.escapeHtml(nextStep)}</div>
        <details class="purchase-detail">
          <summary>查看详情</summary>
          <div class="purchase-detail-grid">
            ${renderDetailLine(ctx, "订单编号", `担保 #${Number(trade?.id || 0)}`)}
            ${renderDetailLine(ctx, "创建时间", ctx.formatDate(trade?.created_at))}
            ${renderDetailLine(ctx, "更新时间", ctx.formatDate(trade?.updated_at))}
            ${isBuyer ? renderDetailLine(ctx, "卖家联系方式", other?.contact_info || "未登记，请通过平台联系") : ""}
            ${renderDetailLine(ctx, "卡片来源", [item.source_role_name, item.source_server].filter(Boolean).join(" / "))}
            ${renderDetailLine(ctx, "攻击", Number(item.attack_value || 0) ? String(Number(item.attack_value)) : "")}
            ${renderDetailLine(ctx, "血量", Number(item.hp_value || 0) ? String(Number(item.hp_value)) : "")}
            ${renderDetailLine(ctx, "赛季", item.season_display)}
            ${renderDetailLine(ctx, "付款/转赠说明", trade?.payment_reference)}
            ${renderDetailLine(ctx, "买家备注", trade?.buyer_note)}
            ${renderDetailLine(ctx, "发货说明", trade?.delivery_note)}
            ${renderEscrowEvidenceLinks(ctx, trade)}
          </div>
        </details>
        ${actions ? `<div class="actions">${actions}</div>` : ""}
      </div>
    </article>
  `;
}

function getPurchasePageSize(ctx) {
  return Math.max(Number(ctx.getPurchasePageSize?.() || 6) || 6, 1);
}

function getPurchasePage(ctx, key) {
  return Math.max(Number(ctx.getPurchasePage?.(key) || 1) || 1, 1);
}

function paginatePurchaseItems(ctx, key, items) {
  const safeItems = Array.isArray(items) ? items : [];
  const pageSize = getPurchasePageSize(ctx);
  const totalPages = Math.max(Math.ceil(safeItems.length / pageSize), 1);
  const page = Math.min(getPurchasePage(ctx, key), totalPages);
  const offset = (page - 1) * pageSize;
  return {
    items: safeItems.slice(offset, offset + pageSize),
    page,
    pageSize,
    total: safeItems.length,
    totalPages,
  };
}

function renderPurchasePagination(ctx, key, page) {
  if (!page || page.totalPages <= 1) return "";
  return `
    <div class="pagination-bar purchase-pagination">
      <button type="button" class="ghost purchase-page-btn" data-purchase-view="${ctx.escapeHtml(key)}" data-purchase-page="${Math.max(page.page - 1, 1)}" ${page.page <= 1 ? "disabled" : ""}>上一页</button>
      <span class="chip">第 ${page.page} / ${page.totalPages} 页，共 ${page.total} 笔</span>
      <button type="button" class="ghost purchase-page-btn" data-purchase-view="${ctx.escapeHtml(key)}" data-purchase-page="${Math.min(page.page + 1, page.totalPages)}" ${page.page >= page.totalPages ? "disabled" : ""}>下一页</button>
    </div>
  `;
}

function renderPurchaseTabs(ctx, activeView, counts) {
  const tabs = [
    { key: "mall", label: "商城/代抽", count: counts.mall },
    { key: "escrow_buy", label: "担保买入", count: counts.escrow_buy },
    { key: "escrow_sell", label: "担保卖出", count: counts.escrow_sell },
  ];
  return `
    <div class="purchase-view-tabs">
      ${tabs
        .map(
          (tab) => `
            <button type="button" class="purchase-view-tab ${activeView === tab.key ? "active" : ""}" data-purchase-view="${ctx.escapeHtml(tab.key)}">
              <span>${ctx.escapeHtml(tab.label)}</span>
              <strong>${Number(tab.count || 0)}</strong>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderEscrowWorkspace(ctx, profile, trades = [], role = "buyer") {
  const isBuyer = role === "buyer";
  const key = isBuyer ? "escrow_buy" : "escrow_sell";
  const page = paginatePurchaseItems(ctx, key, trades);
  return `
    <div class="purchase-section-head">
      <div>
        <strong>${ctx.escapeHtml(isBuyer ? "我的担保买入" : "我的担保卖出")}</strong>
        <div class="muted">${ctx.escapeHtml(isBuyer ? "寄售卡购买、确认收货和纠纷都在这里处理。" : "买家下单、平台托管、发卡和结算状态都会显示。")}</div>
      </div>
      <span class="chip">${trades.length} 笔</span>
    </div>
    <div class="stack-list">
      ${
        page.items.length
          ? page.items.map((trade) => renderAccountEscrowCard(ctx, trade, profile, isBuyer ? "buyer" : "seller")).join("")
          : `<div class="purchase-empty">暂时没有${ctx.escapeHtml(isBuyer ? "买入" : "卖出")}的担保交易。</div>`
      }
    </div>
    ${renderPurchasePagination(ctx, key, page)}
  `;
}

function formatOrderItemLines(ctx, order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return '<div class="purchase-detail-line"><span>商品</span><strong>-</strong></div>';
  return items
    .map((item) => {
      const quantity = Number(item?.quantity || item?.count || 1);
      const quantityText = quantity > 1 ? ` ×${quantity}` : "";
      const kind = String(item?.item_kind || "").trim() === "bundle" ? "套餐" : "功法";
      const price = Number(item?.price_quota ?? item?.unit_price_quota ?? 0);
      const priceText = price > 0 ? ` / ${price} 额度` : "";
      return `<div class="purchase-detail-line"><span>${ctx.escapeHtml(kind)}</span><strong>${ctx.escapeHtml(item?.product_name || "商品")}${ctx.escapeHtml(quantityText)}${ctx.escapeHtml(priceText)}</strong></div>`;
    })
    .join("");
}

function renderMallOrderCard(ctx, order) {
  const drawMeta = ctx.getDrawServiceMeta(order);
  const isDrawOrder = ctx.isDrawServiceOrder(order);
  const remark = order.remark ? `<div class="muted">备注：${ctx.escapeHtml(order.remark)}</div>` : "";
  const drawLines =
    isDrawOrder && drawMeta
      ? `
          <div class="muted">代抽：${ctx.escapeHtml(drawMeta.tier_label || "旧版代抽")}${drawMeta.draw_amount_wan ? ` / ${Number(drawMeta.draw_amount_wan)}w` : ""} / ${
            drawMeta.payment_method === "residual_transfer"
              ? `转赠 ${Number(drawMeta.transfer_amount || order.transfer_amount || 0)} ${ctx.escapeHtml(drawMeta.transfer_unit || order.transfer_unit || "残卷")}`
              : `扣 ${Number(drawMeta.amount_quota || order.total_quota || 0)} 额度`
          } / 赛季：${ctx.escapeHtml(drawMeta.season_label || "-")}</div>
          ${
            drawMeta.payment_method === "residual_transfer"
              ? `<div class="muted">转赠时间：${ctx.escapeHtml(drawMeta.transfer_reference || order.payment_reference || "-")} / 目标：${ctx.escapeHtml(drawMeta.transfer_target_role_id || order.transfer_target_role_id || "-")}</div>`
              : ""
          }
          ${drawMeta.returned_cards_text ? `<div class="muted">返还卡：${ctx.escapeHtml(drawMeta.returned_cards_text)}</div>` : ""}
          ${drawMeta.reward_summary ? `<div class="muted">阶段奖励：${ctx.escapeHtml(drawMeta.reward_summary)}</div>` : ""}
          ${drawMeta.best_gold_card ? `<div class="muted">图鉴金卡：${ctx.escapeHtml(drawMeta.best_gold_card)}</div>` : ""}
        `
      : "";
  const spendLine =
    isDrawOrder && drawMeta?.payment_method === "residual_transfer"
      ? `等值：${Number(drawMeta.amount_quota || order.total_quota || 0)} 额度 / 下单时间：${ctx.formatDate(order.created_at)}`
      : `消耗：${Number(order.total_quota || 0)} 额度 / 下单时间：${ctx.formatDate(order.created_at)}`;
  const actions =
    order.status === ORDER_STATUS.PENDING
      ? `<div class="actions"><button class="ghost request-cancel-btn" type="button" data-order-id="${order.id}">申请取消</button></div>`
      : order.status === ORDER_STATUS.CANCEL_REQUESTED
        ? '<div class="muted">已提交取消申请，等待管理员审核。</div>'
        : "";

  return `
    <article class="purchase-card">
      ${renderPurchaseCover(ctx, getOrderImageUrl(order), getOrderTitle(order))}
      <div class="purchase-card-main">
        <div class="purchase-card-head">
          <div>
            <div class="purchase-kicker">${ctx.escapeHtml(getOrderKindLabel(order))} #${Number(order?.id || 0)}</div>
            <strong class="purchase-title">${ctx.escapeHtml(getOrderTitle(order))}</strong>
            ${getOrderAttrSummary(order) ? `<div class="purchase-subtitle">${ctx.escapeHtml(getOrderAttrSummary(order))}</div>` : ""}
          </div>
          <span class="purchase-status">${ctx.escapeHtml(ctx.formatOrderStatus(order.status))}</span>
        </div>
        <div class="purchase-metrics">
          ${renderPurchaseMetric(ctx, "消耗", `${Number(order.total_quota || 0)} 额度`, "accent")}
          ${renderPurchaseMetric(ctx, "时间", ctx.formatDate(order.created_at))}
          ${renderPurchaseMetric(ctx, "商品数", `${Array.isArray(order.items) ? order.items.length : 0} 项`)}
        </div>
        <details class="purchase-detail">
          <summary>查看详情</summary>
          <div class="purchase-detail-grid">
            ${formatOrderItemLines(ctx, order)}
            ${renderDetailLine(ctx, "订单类型", getOrderKindLabel(order))}
            ${renderDetailLine(ctx, "订单状态", ctx.formatOrderStatus(order.status))}
            ${renderDetailLine(ctx, "下单时间", ctx.formatDate(order.created_at))}
            ${renderDetailLine(ctx, "更新时间", ctx.formatDate(order.updated_at))}
            ${renderDetailLine(ctx, "额度消耗", `${Number(order.total_quota || 0)} 额度`)}
            ${renderDetailLine(ctx, "付款方式", order.payment_channel)}
            ${renderDetailLine(ctx, "付款/转赠说明", order.payment_reference)}
            ${renderDetailLine(ctx, "买家角色", [order.game_role_name || order.guest_game_role_name, order.game_role_id || order.guest_game_role_id].filter(Boolean).join(" / "))}
            ${remark}
            ${drawLines}
          </div>
        </details>
        ${actions}
      </div>
    </article>
  `;
}

function renderMallOrdersWorkspace(ctx, orders = []) {
  const list = Array.isArray(orders) ? orders : [];
  const page = paginatePurchaseItems(ctx, "mall", list);
  return `
    <div class="purchase-section-head">
      <div>
        <strong>商城购买与代抽订单</strong>
        <div class="muted">普通商城买卡、套餐、代抽都会在这里留痕。</div>
      </div>
      <span class="chip">${list.length} 笔</span>
    </div>
    <div class="stack-list">
      ${
        page.items.length
          ? page.items.map((order) => renderMallOrderCard(ctx, order)).join("")
          : '<div class="purchase-empty">暂时没有普通商城或代抽订单。</div>'
      }
    </div>
    ${renderPurchasePagination(ctx, "mall", page)}
  `;
}

function renderPurchaseWorkspace(ctx, profile, orders = [], escrowTrades = []) {
  const trades = Array.isArray(escrowTrades) ? escrowTrades : [];
  const buyerTrades = trades.filter((trade) => Number(trade?.buyer_user_id || 0) === Number(profile?.id || 0));
  const sellerTrades = trades.filter((trade) => Number(trade?.seller_user_id || 0) === Number(profile?.id || 0));
  const counts = {
    mall: Array.isArray(orders) ? orders.length : 0,
    escrow_buy: buyerTrades.length,
    escrow_sell: sellerTrades.length,
  };
  const activeView = ["mall", "escrow_buy", "escrow_sell"].includes(String(ctx.getActivePurchaseView?.() || ""))
    ? String(ctx.getActivePurchaseView())
    : "mall";
  const content =
    activeView === "escrow_buy"
      ? renderEscrowWorkspace(ctx, profile, buyerTrades, "buyer")
      : activeView === "escrow_sell"
        ? renderEscrowWorkspace(ctx, profile, sellerTrades, "seller")
        : renderMallOrdersWorkspace(ctx, orders);
  return `
    ${renderPurchaseTabs(ctx, activeView, counts)}
    ${content}
  `;
}

export function renderProfileSection(ctx, profile, quota, orders, escrowTrades = []) {
  if (!ctx.accountProfile || !ctx.quotaBalance || !ctx.orderList) return;

  if (!profile) {
    ctx.accountProfile.innerHTML = '<div class="stack-item">请先登录后查看账号信息。</div>';
    ctx.quotaBalance.textContent = "-";
    ctx.orderList.innerHTML = '<div class="stack-item">登录后可查看购买记录和担保交易。</div>';
    ctx.setAccountMessage("");
    return;
  }

  const memberStatus = profile.season_member_active
    ? `本赛季会员，权益截止 ${ctx.escapeHtml(ctx.formatDate(profile.season_member_expires_at || ""))}`
    : "当前未开通";
  const memberBenefit = profile.season_member_active
    ? `后续获得额度额外 +${Number(profile.season_member_bonus_percent || 0)}%，并可使用每赛季一次、最多 5w 的 6.5 元 / 1w 代抽福利档`
    : `开通后获得额度额外 +${Number(profile.season_member_bonus_percent || 0)}%，并可使用每赛季一次、最多 5w 的 6.5 元 / 1w 代抽福利档`;
  const beginnerRewardStatus = profile.beginner_guide_reward_earned
    ? `已领取 ${Number(profile.beginner_guide_reward_quota || ctx.beginnerGuideRewardQuota)} 额度`
    : `完成教学三步后可领取 ${Number(profile.beginner_guide_reward_quota || ctx.beginnerGuideRewardQuota)} 额度`;

  ctx.accountProfile.innerHTML = [
    `角色名称：${ctx.escapeHtml(profile.game_role_name || "-")}`,
    `游戏 ID：${ctx.escapeHtml(profile.game_role_id || "-")}`,
    `区服：${ctx.escapeHtml(profile.game_server || "-")}`,
    `账号角色：${ctx.escapeHtml(profile.role || "-")}`,
    `登录方式：${ctx.escapeHtml(profile.auth_provider === "password" ? "密码登录" : "绑定登录")}`,
    `昵称：${ctx.escapeHtml(profile.nickname || "-")}`,
    `联系方式：${ctx.escapeHtml(profile.contact_info || "未填写")}`,
    `会员状态：${memberStatus}`,
    `会员权益：${memberBenefit}`,
    `新手奖励：${beginnerRewardStatus}`,
  ]
    .map((line) => `<div class="stack-item">${line}</div>`)
    .join("");

  ctx.quotaBalance.textContent = String(quota?.balance ?? profile.quota_balance ?? 0);

  ctx.orderList.innerHTML = renderPurchaseWorkspace(ctx, profile, orders, escrowTrades);
}

export function renderRechargeSection(ctx, profile, rechargeConfig, rechargeOrders) {
  if (!ctx.rechargeBody || !ctx.rechargeOrderList) return;

  if (!profile) {
    ctx.rechargeBody.innerHTML = '<div class="stack-item">登录后可发起额度充值申请。</div>';
    ctx.rechargeOrderList.innerHTML = '<div class="stack-item">登录后可查看充值记录。</div>';
    return;
  }

  if (!rechargeConfig?.enabled) {
    ctx.rechargeBody.innerHTML = '<div class="stack-item">当前暂未开放充值。</div>';
    ctx.rechargeOrderList.innerHTML = '<div class="stack-item">暂无充值记录。</div>';
    return;
  }

  const presets =
    Array.isArray(rechargeConfig.preset_amounts) && rechargeConfig.preset_amounts.length
      ? rechargeConfig.preset_amounts
      : [rechargeConfig.min_amount_yuan || rechargeConfig.exchange_yuan || 10];
  if (!ctx.isPositiveMoneyAmount(ctx.getSelectedRechargeAmount())) {
    ctx.setSelectedRechargeAmount(Number(presets[0]));
  }

  const availableRechargeTypes = ["normal", "season_member"];
  if (rechargeConfig?.residual_transfer_enabled) {
    availableRechargeTypes.push("residual_transfer");
  }

  let selectedRechargeOrderType = ctx.getSelectedRechargeOrderType();
  if (!availableRechargeTypes.includes(selectedRechargeOrderType)) {
    ctx.setSelectedRechargeOrderType("normal");
    selectedRechargeOrderType = "normal";
  }

  const pendingSeasonOrder = ctx.findPendingSeasonMemberOrder(rechargeOrders, rechargeConfig);
  const paymentMethods = ctx.getRechargePaymentMethods(rechargeConfig);
  const activePaymentMethod = ctx.ensureRechargePaymentChannel(rechargeConfig);
  const pendingDirectPurchaseContext = ctx.getPendingDirectPurchaseContext();
  const directPurchaseContext =
    selectedRechargeOrderType === "normal" && pendingDirectPurchaseContext
      ? pendingDirectPurchaseContext
      : null;

  if (
    directPurchaseContext &&
    Number(ctx.getSelectedRechargeAmount()) !== Number(directPurchaseContext.amountYuan)
  ) {
    ctx.setSelectedRechargeAmount(Number(directPurchaseContext.amountYuan));
  }

  const quoteSummary = ctx.getRechargeQuoteSummary(
    profile,
    rechargeConfig,
    selectedRechargeOrderType === "season_member"
      ? rechargeConfig.season_member_price_yuan
      : ctx.getSelectedRechargeAmount(),
    selectedRechargeOrderType
  );
  const memberStatusText = profile.season_member_active
    ? `你已开通 ${ctx.escapeHtml(profile.season_member_season_label || rechargeConfig.season_member_season_label || "当前赛季")} 会员，权益截止 ${ctx.escapeHtml(ctx.formatDate(profile.season_member_expires_at || rechargeConfig.season_member_expires_at || ""))}`
    : pendingSeasonOrder
      ? `你的 ${ctx.escapeHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员申请正在审核中。`
      : `${ctx.escapeHtml(rechargeConfig.season_member_season_label || "当前赛季")} 会员：${Number(rechargeConfig.season_member_price_yuan || 0)} 元得 ${Number(rechargeConfig.season_member_quota || 0)} 额度，后续获得额度额外 +${Number(rechargeConfig.season_member_bonus_percent || 0)}%。`;
  const memberDrawBenefitText = "会员可使用 6.5 元 / 1w 代抽福利档，每赛季一次，最多 5w，系统会校验本赛季会员状态。";
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
                  `<button class="preset-chip ${ctx.getSelectedRechargePaymentChannel() === method.key ? "active" : ""}" type="button" data-payment-channel="${method.key}">${ctx.escapeHtml(method.label)}</button>`
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
            <div class="muted">${ctx.escapeHtml(directPurchaseContext.productName)} / ${directPurchaseContext.quotaAmount} 额度 / ${ctx.escapeHtml(ctx.formatCashAmount(directPurchaseContext.amountYuan))}</div>
            <div class="muted">这笔金额按商品精确价格预填，和普通充值分开显示。</div>
          </div>
          <button class="ghost" type="button" data-direct-purchase-clear="1">切回普通充值</button>
        </div>
      `
    : "";
  const sideCardHtml = isResidualTransfer
    ? `
        <div class="recharge-qr-card">
          <div><strong>${ctx.escapeHtml(transferTargetRoleName)}</strong></div>
          <div class="muted">游戏名称：${ctx.escapeHtml(transferTargetGameName)}</div>
          <div class="muted">游戏 ID：${ctx.escapeHtml(transferTargetRoleId)}</div>
          <div class="muted">充值残卷比例：${getResidualAnchorCashYuan(rechargeConfig)} 元 = ${RESIDUAL_ANCHOR_AMOUNT} ${ctx.escapeHtml(transferUnitLabel)}；额度固定按 8 元 = 10000 额度。</div>
          <div class="stack-list">
            ${(rechargeConfig.residual_instructions || []).map((line) => `<div class="stack-item">${ctx.escapeHtml(line)}</div>`).join("")}
          </div>
        </div>
      `
    : `
        <div class="recharge-qr-card">
          ${paymentMethodTabsHtml}
          <img class="recharge-qr-image" src="${ctx.escapeHtml(activePaymentMethod?.imageUrl || rechargeConfig.qr_image_url)}" alt="${ctx.escapeHtml(activePaymentMethod?.name || "收款码")}" />
          <div><strong>${ctx.escapeHtml(activePaymentMethod?.name || rechargeConfig.payee_name || "收款码")}</strong></div>
          <div class="muted">${ctx.escapeHtml(activePaymentMethod?.hint || rechargeConfig.payee_hint || "扫码转账后再提交审核")}</div>
          <div class="stack-list">
            ${(rechargeConfig.instructions || []).map((line) => `<div class="stack-item">${ctx.escapeHtml(line)}</div>`).join("")}
          </div>
        </div>
      `;

  ctx.rechargeBody.innerHTML = `
    <div class="recharge-layout">
      <div class="recharge-rate-banner">
        <strong>赛季会员</strong>
        <span>${memberStatusText}</span>
        <span class="muted">${ctx.escapeHtml(memberDrawBenefitText)}</span>
        <span class="muted">本赛季截止 ${ctx.escapeHtml(ctx.formatDate(rechargeConfig.season_member_expires_at || ""))}</span>
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
            <strong>${ctx.escapeHtml(quoteSummary.amountLabel)}</strong>
            <span class="muted">${ctx.escapeHtml(quoteSummary.detailLabel)}</span>
          </div>
          <label>${ctx.escapeHtml(quoteSummary.amountInputLabel)}
            <input id="recharge-amount-input" type="number" min="${Number(quoteSummary.amountInputMin || 1)}" step="${Number(quoteSummary.amountInputStep || 1)}" value="${quoteSummary.amountYuan}" ${(quoteSummary.lockedAmount || directPurchaseContext) ? "readonly" : ""} />
          </label>
          ${selectedRechargeOrderType === "normal" && !directPurchaseContext ? `
            <div class="preset-list">
              ${presets
                .map((amount) => `<button class="preset-chip ${Number(amount) === Number(ctx.getSelectedRechargeAmount()) ? "active" : ""}" type="button" data-recharge-amount="${amount}">${amount} 元</button>`)
                .join("")}
            </div>
          ` : ""}
          <div class="recharge-quote">
            <span class="muted">本次预计到账</span>
            <strong id="recharge-quote-value">${quoteSummary.totalQuota} 额度</strong>
            <span id="recharge-quote-detail" class="muted">${quoteSummary.baseQuota} 基础额度${quoteSummary.bonusQuota > 0 ? ` + ${quoteSummary.bonusQuota} 会员加成` : ""}</span>
          </div>
          <label>${ctx.escapeHtml(quoteSummary.referenceLabel)}
            <input id="recharge-payment-reference" type="text" maxlength="100" placeholder="${ctx.escapeHtml(quoteSummary.referencePlaceholder)}" required />
          </label>
          <label>补充说明（可选）
            <textarea id="recharge-note" rows="3" placeholder="${ctx.escapeHtml(quoteSummary.notePlaceholder)}"></textarea>
          </label>
          <div class="actions">
            <button id="recharge-submit-btn" class="primary" type="submit" ${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? "disabled" : ""}>${seasonMemberDisabled && selectedRechargeOrderType === "season_member" ? (profile.season_member_active ? "本赛季已开通" : "会员申请审核中") : submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (!rechargeOrders || rechargeOrders.length === 0) {
    ctx.rechargeOrderList.innerHTML = '<div class="stack-item">暂无充值记录。</div>';
    return;
  }

  ctx.rechargeOrderList.innerHTML = rechargeOrders
    .map((order) => {
      const adminRemark = order.admin_remark ? `<div class="muted">审核备注：${ctx.escapeHtml(order.admin_remark)}</div>` : "";
      const payerNote = order.payer_note ? `<div class="muted">补充说明：${ctx.escapeHtml(order.payer_note)}</div>` : "";
      return `
        <div class="stack-item">
          <div>${ctx.escapeHtml(ctx.formatRechargeOrderTitle(order))} #${order.id} / ${ctx.escapeHtml(ctx.formatRechargeStatus(order.status))}</div>
          <div class="muted">${ctx.formatRechargeOrderAmountLine(order)}</div>
          <div class="muted">${ctx.formatRechargeReferenceLine(order)}</div>
          <div class="muted">提交时间：${ctx.formatDate(order.created_at)}</div>
          ${ctx.isResidualTransferOrder(order) ? `<div class="muted">转赠目标：${ctx.escapeHtml(order.transfer_target_role_name || "admin残卷")} / ${ctx.escapeHtml(order.transfer_target_role_id || "-")}</div>` : ""}
          ${order.season_label ? `<div class="muted">赛季：${ctx.escapeHtml(order.season_label)}</div>` : ""}
          ${payerNote}
          ${adminRemark}
        </div>
      `;
    })
    .join("");
}
