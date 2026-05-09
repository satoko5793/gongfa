export function renderOrdersListSection(context, orders = context.getCurrentOrderList()) {
  const {
    refs,
    escapeHtml,
    formatDate,
    hasAdminWriteAccess,
    formatOrderStatusLabel,
    getOrderSourceLabel,
    isDrawServiceOrder,
    getDrawServiceMeta,
    formatOrderItemSnapshot,
    formatRechargeChannelLabel,
    ORDER_STATUS,
  } = context;
  const { ordersRoot } = refs;
  const canWrite = hasAdminWriteAccess();

  if (!ordersRoot) return;
  if (!Array.isArray(orders) || !orders.length) {
    ordersRoot.innerHTML = '<div class="stack-item">当前没有符合条件的订单。</div>';
    return;
  }

  ordersRoot.innerHTML = orders
    .map((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const drawMeta = getDrawServiceMeta(order);
      const itemLines = items.length
        ? items
            .map(
              (item) => `
                <div class="order-item-line">
                  <div><strong>${escapeHtml(item.product_name || item.bundle_name || "-")}</strong> / ${Number(item.price_quota || 0)} 额度</div>
                  ${
                    formatOrderItemSnapshot(item).length
                      ? `<div class="muted">${formatOrderItemSnapshot(item)
                          .map((line) => escapeHtml(line))
                          .join(" / ")}</div>`
                      : ""
                  }
                </div>
              `
            )
            .join("")
        : '<div class="order-item-line">没有订单明细</div>';

      const drawFields =
        isDrawServiceOrder(order) && drawMeta
          ? `
              ${
                order.status === "pending" && canWrite
                  ? `
                      <div class="inline-form order-toolbar">
                        <textarea
                          data-field="draw-returned-cards"
                          rows="3"
                          placeholder="确认代抽时填写返还了哪些卡"
                        >${escapeHtml(drawMeta.returned_cards_text || "")}</textarea>
                        <input
                          data-field="draw-best-gold"
                          type="text"
                          value="${escapeHtml(drawMeta.best_gold_card || "")}"
                          placeholder="如果触发 5w 首档奖励，填写本次选中的最佳金卡"
                        />
                      </div>
                    `
                  : `
                      <div class="muted">返还卡：${escapeHtml(drawMeta.returned_cards_text || "-")}</div>
                      <div class="muted">图鉴金卡：${escapeHtml(drawMeta.best_gold_card || "-")}</div>
                    `
              }
              <div class="muted">规则：返还所有双满紫 / 橙 / 红 / 金卡、>=2.5 单词条、双词条、珍；视频如需查看请让用户去咨询群联系管理员。</div>
              ${
                drawMeta.reward_summary
                  ? `<div class="muted">已结算奖励：${escapeHtml(drawMeta.reward_summary)}</div>`
                  : ""
              }
            `
          : "";

      const actionButtons =
        order.order_source === "external"
          ? `
              <button class="ghost save-order-remark-btn" type="button">保存备注</button>
            `
          : isDrawServiceOrder(order) && order.status === "pending"
            ? `
                <button class="ghost save-order-remark-btn" type="button">保存备注</button>
                <button class="primary confirm-order-btn" type="button">确认代抽</button>
                <button class="danger cancel-order-btn" type="button">取消订单</button>
              `
            : order.status === ORDER_STATUS.CANCEL_REQUESTED
              ? `
                  <button class="ghost save-order-remark-btn" type="button">保存备注</button>
                  <button class="danger approve-cancel-order-btn" type="button">通过取消</button>
                  <button class="primary reject-cancel-order-btn" type="button">驳回取消</button>
                `
              : order.status === "pending"
                ? `
                    <button class="ghost save-order-remark-btn" type="button">保存备注</button>
                    <button class="primary confirm-order-btn" type="button">确认订单</button>
                    <button class="danger cancel-order-btn" type="button">取消订单</button>
                  `
                : `
                    <button class="ghost save-order-remark-btn" type="button">保存备注</button>
                  `;

      return `
        <div class="admin-card" data-order-id="${order.id}">
          <div class="admin-card-head">
            <div class="product-name">订单 #${order.id}</div>
            <span class="chip">${escapeHtml(formatOrderStatusLabel(order.status))}</span>
          </div>
          <div class="product-meta">
            <div>用户：${escapeHtml(order.game_role_name || "-")} / ${escapeHtml(order.game_server || "-")} / ${escapeHtml(order.game_role_id || "-")}</div>
            <div>来源：${escapeHtml(getOrderSourceLabel(order))}${order.buyer_label ? ` / 对象：${escapeHtml(order.buyer_label)}` : ""}</div>
            <div>订单总额：${Number(order.total_quota || 0)} 额度</div>
            ${
              order.order_source === "guest_transfer"
                ? String(order.payment_channel || "") === "game_residual_transfer"
                  ? `<div>转赠数量：${Number(order.transfer_amount || 0)} ${escapeHtml(order.transfer_unit || "残卷")} / 目标：${escapeHtml(order.transfer_target_role_name || "admin残卷")} / ${escapeHtml(order.transfer_target_role_id || "-")} / 转赠时间：${escapeHtml(order.payment_reference || "-")}</div>`
                  : `<div>转账金额：${Number(order.payment_amount_yuan || 0)} 元 / 方式：${escapeHtml(formatRechargeChannelLabel(order.payment_channel || "alipay_qr"))} / 付款时间：${escapeHtml(order.payment_reference || "-")}</div>`
                : ""
            }
            <div>创建时间：${formatDate(order.created_at)}</div>
            ${
              isDrawServiceOrder(order) && drawMeta
                ? `<div>代抽赛季：${escapeHtml(drawMeta.season_label || "-")} / 返利：${Number(drawMeta.rebate_quota || 0)}</div>`
                : ""
            }
          </div>
          ${order.cancel_reason ? `<div class="muted">取消原因：${escapeHtml(order.cancel_reason)}</div>` : ""}
          <div class="order-item-list">${itemLines}</div>
          ${
            canWrite
              ? `
                  <div class="inline-form order-toolbar">
                    <input
                      data-field="remark"
                      type="text"
                      value="${escapeHtml(order.remark || "")}"
                      placeholder="填写后台备注或处理说明"
                    />
                  </div>
                `
              : `<div class="muted">后台备注：${escapeHtml(order.remark || "-")}</div>`
          }
          ${drawFields}
          ${canWrite ? `<div class="actions">${actionButtons}</div>` : ""}
        </div>
      `;
    })
    .join("");
}

export function renderLinkedOrderUserState(context) {
  const { refs, escapeHtml, getLinkedOrderUser } = context;
  const linkedOrderUser = getLinkedOrderUser();
  if (!refs.linkedOrderUserState) return;
  if (!linkedOrderUser) {
    refs.linkedOrderUserState.innerHTML = "";
    return;
  }

  refs.linkedOrderUserState.innerHTML = `
    <span class="chip">订单关联用户：${escapeHtml(linkedOrderUser.game_role_name || "-")}</span>
    <span class="chip">游戏 ID：${escapeHtml(linkedOrderUser.game_role_id || "-")}</span>
    <button id="clear-linked-order-user-btn" class="ghost" type="button">清除联动</button>
  `;
}

export function renderOrdersSection(context) {
  renderOrdersListSection(context);
  renderLinkedOrderUserState(context);
}
