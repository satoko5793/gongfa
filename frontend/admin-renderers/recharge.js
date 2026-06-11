import {
  RESIDUAL_ANCHOR_AMOUNT,
  getResidualAnchorCashYuan,
  getResidualPurchaseAnchorCashYuan,
} from "../payment-conversion.js?v=release-20260611-151806";

function formatRechargeReviewStatusLabel(status, RECHARGE_ORDER_STATUS) {
  switch (status) {
    case RECHARGE_ORDER_STATUS.PENDING_REVIEW:
      return "待审核";
    case RECHARGE_ORDER_STATUS.APPROVED:
      return "已通过";
    case RECHARGE_ORDER_STATUS.REJECTED:
      return "已驳回";
    default:
      return status || "-";
  }
}

function isResidualRechargeOrder(order) {
  return String(order?.order_type || "").trim() === "residual_transfer";
}

function formatRechargeOrderTitle(order) {
  if (order?.order_title) return order.order_title;
  if (isResidualRechargeOrder(order)) return "残卷转赠";
  if (order?.order_type === "season_member") return "赛季会员";
  return "普通充值";
}

function renderDrawServiceConfigSection(context, config) {
  const { refs, escapeHtml } = context;
  const { adminDrawServiceConfigRoot } = refs;
  if (!adminDrawServiceConfigRoot) return;
  const drawService = config?.draw_service && typeof config.draw_service === "object"
    ? config.draw_service
    : {};
  const tiers = Array.isArray(drawService.tiers) ? drawService.tiers : [];

  adminDrawServiceConfigRoot.innerHTML = `
    <div class="pricing-global-row">
      <label class="pricing-global-field">
        <span>开启代抽</span>
        <select data-draw-service-field="enabled">
          <option value="true" ${drawService.enabled === false ? "" : "selected"}>开启</option>
          <option value="false" ${drawService.enabled === false ? "selected" : ""}>关闭</option>
        </select>
        <small>关闭后前台仍可看到说明，但不能提交新单。</small>
      </label>
      <label class="pricing-global-field">
        <span>最小抽取数量（w）</span>
        <input data-draw-service-field="min_draw_wan" type="number" min="1" step="1" value="${Number(drawService.min_draw_wan || 1)}" />
        <small>前台输入不足时按这个数量补齐。</small>
      </label>
      <label class="pricing-global-field">
        <span>快捷数量（英文逗号分隔）</span>
        <input data-draw-service-field="preset_draw_wan" type="text" value="${escapeHtml(Array.isArray(drawService.preset_draw_wan) ? drawService.preset_draw_wan.join(",") : "1,3,5,10")}" />
        <small>例如 1,3,5,10。</small>
      </label>
      <label class="pricing-global-field">
        <span>默认档位 key</span>
        <input data-draw-service-field="default_tier_key" type="text" value="${escapeHtml(drawService.default_tier_key || "tier_8")}" />
        <small>用户打开页面时默认选中的档位。</small>
      </label>
    </div>
    <label class="pricing-global-field">
      <span>代抽公共提示</span>
      <textarea data-draw-service-field="rule_notice" rows="2">${escapeHtml(drawService.rule_notice || "")}</textarea>
      <small>会展示在前台提交区域。</small>
    </label>
    <div class="pricing-tier-card-grid">
      ${tiers
        .map(
          (tier) => {
            const isResidualTransferTier =
              String(tier.payment_method || "").trim() === "residual_transfer";
            return `
            <article class="pricing-tier-card" data-draw-service-tier="${escapeHtml(tier.key || "")}">
              <div class="pricing-tier-card-head">
                <div class="pricing-control-tier">
                  <strong>${escapeHtml(tier.label || tier.key || "代抽档位")}</strong>
                  <small>${escapeHtml(tier.key || "")}</small>
                </div>
                <div class="pricing-tier-summary">
                  <span>${Number(tier.price_yuan_per_wan || 0)} 元 / 1w</span>
                </div>
              </div>
              <div class="pricing-tier-grid">
                <label class="pricing-tier-field">
                  <span>档位名称</span>
                  <input data-draw-service-tier-field="label" type="text" value="${escapeHtml(tier.label || "")}" />
                  <small>前台按钮标题。</small>
                </label>
                <label class="pricing-tier-field">
                  <span>价格（元 / 1w）</span>
                  <input data-draw-service-tier-field="price_yuan_per_wan" type="number" min="0.01" step="0.01" value="${Number(tier.price_yuan_per_wan || 0)}" />
                  <small>${isResidualTransferTier ? "用于显示规则档位；前台会要求用户转残卷并提交核对信息。" : "系统会折算为额度扣款。"}</small>
                </label>
                <label class="pricing-tier-field full">
                  <span>返还描述</span>
                  <textarea data-draw-service-tier-field="description" rows="3">${escapeHtml(tier.description || "")}</textarea>
                  <small>用户选择档位时看到的规则。</small>
                </label>
              </div>
            </article>
          `;
          }
        )
        .join("")}
    </div>
  `;
}

export function formatRechargeChannelLabel(channel) {
  if (String(channel || "").trim() === "wechat_qr") return "微信";
  if (String(channel || "").trim() === "game_residual_transfer") return "残卷转赠";
  return "支付宝";
}

export function renderRechargeOrdersSection(
  context,
  orders = context.getCurrentRechargeOrderList()
) {
  const { refs, escapeHtml, formatDate, hasAdminWriteAccess, RECHARGE_ORDER_STATUS } = context;
  const { adminRechargeOrdersRoot } = refs;
  const canWrite = hasAdminWriteAccess();

  if (!adminRechargeOrdersRoot) return;
  if (!Array.isArray(orders) || !orders.length) {
    adminRechargeOrdersRoot.innerHTML = '<div class="stack-item">当前没有符合条件的充值订单。</div>';
    return;
  }

  adminRechargeOrdersRoot.innerHTML = orders
    .map((order) => {
      const amountLine = isResidualRechargeOrder(order)
        ? `转赠数量：${Number(order.transfer_amount || order.amount_yuan || 0)} ${escapeHtml(order.transfer_unit || "残卷")} / 折合 ¥${Number(order.transfer_cash_amount_yuan || 0).toFixed(4)} / 预计额度：${Number(order.quota_amount || 0)}`
        : `充值金额：${Number(order.amount_yuan || 0)} 元 / 固定 8元=10000额度 / 预计额度：${Number(order.quota_amount || 0)} / 支付方式：${formatRechargeChannelLabel(order.channel)}`;
      const referenceLabel = isResidualRechargeOrder(order) ? "转赠时间" : "付款时间";
      const statusHint =
        order.status === RECHARGE_ORDER_STATUS.PENDING_REVIEW
          ? `<div class="muted">${isResidualRechargeOrder(order) ? "审核通过后会自动给用户增加额度，请先核对游戏内转赠记录和凭据。" : "审核通过后会自动给用户增加额度，请先核对付款备注和金额。"}</div>`
          : "";
      return `
        <div class="admin-card" data-recharge-order-id="${order.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(formatRechargeOrderTitle(order))} #${order.id}</div>
            <span class="chip">${escapeHtml(formatRechargeReviewStatusLabel(order.status, RECHARGE_ORDER_STATUS))}</span>
          </div>
          <div class="product-meta">
            <div>用户：${escapeHtml(order.game_role_name || "-")} / ${escapeHtml(order.game_server || "-")} / ${escapeHtml(order.game_role_id || "-")}</div>
            <div>${amountLine}</div>
            <div>${referenceLabel}：${escapeHtml(order.payment_reference || "-")}</div>
            ${isResidualRechargeOrder(order) ? `<div>转赠目标：${escapeHtml(order.transfer_target_role_name || "admin残卷")} / ${escapeHtml(order.transfer_target_role_id || "-")}</div>` : ""}
            <div>提交时间：${formatDate(order.created_at)}</div>
          </div>
          ${order.payer_note ? `<div class="muted">用户备注：${escapeHtml(order.payer_note)}</div>` : ""}
          ${order.admin_remark ? `<div class="muted">管理员备注：${escapeHtml(order.admin_remark)}</div>` : ""}
          ${
            canWrite
              ? `
                  <div class="inline-form order-toolbar">
                    <input
                      data-field="admin_remark"
                      type="text"
                      value="${escapeHtml(order.admin_remark || "")}"
                      placeholder="填写审核备注，例如已核对付款截图"
                    />
                  </div>
                `
              : ""
          }
          ${statusHint}
          ${
            canWrite
              ? `
                  <div class="actions">
                    ${order.status === RECHARGE_ORDER_STATUS.PENDING_REVIEW ? `
                      <button class="primary approve-recharge-order-btn" type="button">审核通过并加额度</button>
                      <button class="danger reject-recharge-order-btn" type="button">驳回申请</button>
                    ` : '<button class="ghost" type="button" disabled>已处理</button>'}
                  </div>
                `
              : ""
          }
        </div>
      `;
    })
    .join("");
}

export function renderRechargeConfigSection(context, config) {
  const {
    refs,
    getNormalizedPricingControls,
    renderPricingControls,
    setDraftPricingControls,
    setCurrentRechargeConfig,
    applyAdminAccessMode,
  } = context;

  const {
    adminRechargeConfigForm,
    adminRechargeEnabled,
    adminRechargeExchangeYuanInput,
    adminRechargeExchangeQuotaInput,
    adminRechargeMinYuanInput,
    adminCurrentSeasonGoldMinDisplayCashYuanInput,
    adminResidualTransferEnabledInput,
    adminResidualAdminRoleIdInput,
    adminResidualAdminRoleNameInput,
    adminResidualAdminGameNameInput,
    adminResidualUnitLabelInput,
    adminResidualQuotaPerUnitInput,
    adminResidualPurchaseAnchorCashYuanInput,
    adminSeasonMemberEnabledInput,
    adminSeasonMemberLabelInput,
    adminSeasonMemberExpiresAtInput,
    adminSeasonMemberPriceInput,
    adminSeasonMemberQuotaInput,
    adminSeasonMemberBonusRateInput,
    adminLineupBaseSlotsInput,
    adminLineupPermanentSlotQuotaInput,
    adminLineupPermanentSlotMaxInput,
    adminLineupSeasonalSlotQuotaInput,
    adminLineupMemberBonusSlotsInput,
    adminRechargePresetsInput,
    adminRechargePayeeNameInput,
    adminRechargePayeeHintInput,
    adminRechargeQrImageUrlInput,
    adminWechatPayeeNameInput,
    adminWechatPayeeHintInput,
    adminWechatQrImageUrlInput,
    adminRechargeInstructionsInput,
    adminResidualInstructionsInput,
    adminRechargeQrPreview,
    adminWechatQrPreview,
  } = refs;

  setCurrentRechargeConfig(config || null);
  if (!config || !adminRechargeConfigForm) return;

  setDraftPricingControls(getNormalizedPricingControls(config.pricing_controls));

  if (adminRechargeEnabled) adminRechargeEnabled.value = String(Boolean(config.enabled));
  if (adminRechargeExchangeYuanInput) {
    adminRechargeExchangeYuanInput.value = Number(config.exchange_yuan || 8);
    adminRechargeExchangeYuanInput.placeholder = String(Number(config.exchange_yuan || 8));
  }
  if (adminRechargeExchangeYuanInput) adminRechargeExchangeYuanInput.readOnly = true;
  if (adminRechargeExchangeQuotaInput) {
    adminRechargeExchangeQuotaInput.value = Number(config.exchange_quota || 10000);
    adminRechargeExchangeQuotaInput.placeholder = String(Number(config.exchange_quota || 10000));
  }
  if (adminRechargeExchangeQuotaInput) adminRechargeExchangeQuotaInput.readOnly = true;
  if (adminRechargeMinYuanInput) {
    adminRechargeMinYuanInput.value = Number(config.min_amount_yuan || 1);
    adminRechargeMinYuanInput.placeholder = String(Number(config.min_amount_yuan || 1));
  }
  if (adminCurrentSeasonGoldMinDisplayCashYuanInput) {
    const minDisplayCash = Number(config.current_season_gold_min_display_cash_yuan || 0);
    adminCurrentSeasonGoldMinDisplayCashYuanInput.value = minDisplayCash;
    adminCurrentSeasonGoldMinDisplayCashYuanInput.placeholder = String(minDisplayCash);
  }
  if (adminResidualTransferEnabledInput) {
    adminResidualTransferEnabledInput.value = String(Boolean(config.residual_transfer_enabled));
  }
  if (adminResidualAdminRoleIdInput) {
    adminResidualAdminRoleIdInput.value = config.residual_admin_role_id || "";
  }
  if (adminResidualAdminRoleNameInput) {
    adminResidualAdminRoleNameInput.value = config.residual_admin_role_name || "";
  }
  if (adminResidualAdminGameNameInput) {
    adminResidualAdminGameNameInput.value = config.residual_admin_game_name || "";
  }
  if (adminResidualUnitLabelInput) {
    adminResidualUnitLabelInput.value = config.residual_unit_label || "";
    adminResidualUnitLabelInput.placeholder = config.residual_unit_label || "残卷";
  }
  if (adminResidualQuotaPerUnitInput) {
    const residualAnchorCashYuan = getResidualAnchorCashYuan(config);
    adminResidualQuotaPerUnitInput.value = residualAnchorCashYuan;
    adminResidualQuotaPerUnitInput.placeholder = String(residualAnchorCashYuan);
  }
  if (adminResidualPurchaseAnchorCashYuanInput) {
    const purchaseAnchorCashYuan = getResidualPurchaseAnchorCashYuan(config);
    adminResidualPurchaseAnchorCashYuanInput.value = purchaseAnchorCashYuan;
    adminResidualPurchaseAnchorCashYuanInput.placeholder = String(purchaseAnchorCashYuan);
  }
  if (adminSeasonMemberEnabledInput) adminSeasonMemberEnabledInput.value = String(Boolean(config.season_member_enabled));
  if (adminSeasonMemberLabelInput) adminSeasonMemberLabelInput.value = config.season_member_season_label || "";
  if (adminSeasonMemberExpiresAtInput) adminSeasonMemberExpiresAtInput.value = config.season_member_expires_at || "";
  if (adminSeasonMemberPriceInput) {
    adminSeasonMemberPriceInput.value = Number(config.season_member_price_yuan || 0);
    adminSeasonMemberPriceInput.placeholder = String(Number(config.season_member_price_yuan || 0));
  }
  if (adminSeasonMemberQuotaInput) {
    adminSeasonMemberQuotaInput.value = Number(config.season_member_quota || 0);
    adminSeasonMemberQuotaInput.placeholder = String(Number(config.season_member_quota || 0));
  }
  if (adminSeasonMemberQuotaInput) adminSeasonMemberQuotaInput.readOnly = true;
  if (adminSeasonMemberBonusRateInput) adminSeasonMemberBonusRateInput.value = Number(config.season_member_bonus_rate || 0);
  if (adminLineupBaseSlotsInput) adminLineupBaseSlotsInput.value = Number(config.lineup_base_slots || 3);
  if (adminLineupPermanentSlotQuotaInput) {
    adminLineupPermanentSlotQuotaInput.value = Number(config.lineup_permanent_slot_quota || 5000);
  }
  if (adminLineupPermanentSlotMaxInput) {
    adminLineupPermanentSlotMaxInput.value = Number(config.lineup_permanent_slot_max || 7);
  }
  if (adminLineupSeasonalSlotQuotaInput) {
    adminLineupSeasonalSlotQuotaInput.value = Number(config.lineup_seasonal_slot_quota || 1000);
  }
  if (adminLineupMemberBonusSlotsInput) {
    adminLineupMemberBonusSlotsInput.value = Number(config.lineup_member_bonus_slots || 3);
  }
  if (adminRechargePresetsInput) {
    adminRechargePresetsInput.value = Array.isArray(config.preset_amounts)
      ? config.preset_amounts.join(",")
      : "";
  }
  if (adminRechargePayeeNameInput) adminRechargePayeeNameInput.value = config.payee_name || "";
  if (adminRechargePayeeHintInput) adminRechargePayeeHintInput.value = config.payee_hint || "";
  if (adminRechargeQrImageUrlInput) adminRechargeQrImageUrlInput.value = config.qr_image_url || "";
  if (adminWechatPayeeNameInput) adminWechatPayeeNameInput.value = config.wechat_payee_name || "";
  if (adminWechatPayeeHintInput) adminWechatPayeeHintInput.value = config.wechat_payee_hint || "";
  if (adminWechatQrImageUrlInput) adminWechatQrImageUrlInput.value = config.wechat_qr_image_url || "";
  if (adminRechargeInstructionsInput) {
    adminRechargeInstructionsInput.value = Array.isArray(config.instructions)
      ? config.instructions.join("\n")
      : "";
  }
  if (adminResidualInstructionsInput) {
    adminResidualInstructionsInput.value = Array.isArray(config.residual_instructions)
      ? config.residual_instructions.join("\n")
      : "";
  }
  if (adminRechargeQrPreview) {
    adminRechargeQrPreview.src = config.qr_image_url || "/payment/alipay-qr.jpg";
  }
  if (adminWechatQrPreview) {
    adminWechatQrPreview.src = config.wechat_qr_image_url || "/payment/wechat-qr.png";
  }

  renderDrawServiceConfigSection(context, config);
  renderPricingControls(context.getDraftPricingControls());
  applyAdminAccessMode();
}

export function renderPricingControlsSection(
  context,
  pricingControls = context.getDraftPricingControls()
) {
  const {
    refs,
    escapeHtml,
    getNormalizedPricingControls,
    getPricingDisplayMode,
    getRechargeConfigDraftForPricing,
    getEmptyPricingControls,
    formatEditablePricingValue,
    formatQuotaCashPair,
    PRICING_TIER_ORDER,
    PRICING_TIER_LABELS,
  } = context;
  const { adminPricingControlsRoot } = refs;
  if (!adminPricingControlsRoot) return;

  const normalizedControls = getNormalizedPricingControls(pricingControls);
  const mode = getPricingDisplayMode();
  const valueUnit = mode === "cash" ? "元" : "额度";
  const conversionConfig = getRechargeConfigDraftForPricing();
  const goldTier = normalizedControls.tiers.gold || getEmptyPricingControls().tiers.gold;

  const renderPriceInput = (field, value) => `
    <input
      type="number"
      ${mode === "cash" ? 'step="0.01" min="0"' : 'step="1" min="0"'}
      data-pricing-field="${field}"
      value="${escapeHtml(formatEditablePricingValue(value, mode, conversionConfig))}"
    />
  `;
  const renderNumberInput = (field, value, { step = "1", min = "0", max = "" } = {}) => `
    <input
      type="number"
      step="${step}"
      min="${min}"
      ${max ? `max="${max}"` : ""}
      data-pricing-field="${field}"
      value="${escapeHtml(String(value))}"
    />
  `;
  const renderField = (label, inputMarkup, hint, extraClass = "") => `
    <div class="pricing-tier-field${extraClass ? ` ${extraClass}` : ""}">
      <span>${label}</span>
      ${inputMarkup}
      <small>${hint}</small>
    </div>
  `;
  const renderTierCard = (tierKey) => {
    const tier = normalizedControls.tiers[tierKey];
    const goldOnly = tierKey === "gold";
    return `
      <article class="pricing-tier-card" data-pricing-tier="${tierKey}">
        <div class="pricing-tier-card-head">
          <div class="pricing-control-tier">
            <strong>${escapeHtml(tier.label || PRICING_TIER_LABELS[tierKey])}</strong>
            <small>${escapeHtml(tierKey)}</small>
          </div>
          <div class="pricing-tier-summary">
            <span>属性 ${escapeHtml(formatQuotaCashPair(tier.atlas_min_quota, conversionConfig))} 到 ${escapeHtml(formatQuotaCashPair(tier.atlas_max_quota, conversionConfig))}</span>
            <span>双满 ${escapeHtml(formatQuotaCashPair(tier.atlas_double_full_quota, conversionConfig))}</span>
            <span>词条 ${escapeHtml(formatQuotaCashPair(tier.term_min_quota, conversionConfig))} 到 ${escapeHtml(formatQuotaCashPair(tier.term_max_quota, conversionConfig))}</span>
          </div>
        </div>

        <div class="pricing-tier-section">
          <div class="pricing-tier-section-head">
            <strong>属性价格</strong>
            <span>先定这个档位的地板价、非双满上限和双满价。</span>
          </div>
          <div class="pricing-tier-grid">
            ${renderField(`属性最低参考价（${valueUnit}）`, renderPriceInput("atlas_min_quota", tier.atlas_min_quota), "这个档位里最差属性卡的地板价。")}
            ${renderField(`非双满最高参考价（${valueUnit}）`, renderPriceInput("atlas_max_quota", tier.atlas_max_quota), "普通满属性但还没双满时的上限。")}
            ${renderField(`双满参考价（${valueUnit}）`, renderPriceInput("atlas_double_full_quota", tier.atlas_double_full_quota), "真正双满时单独抬到这里。")}
            ${renderField("属性降价速度", renderNumberInput("atlas_decay_speed", Number(tier.atlas_decay_speed || 1).toFixed(2), {
              step: "0.05",
              min: "0.2",
              max: "5",
            }), "1 = 当前曲线，越大差卡掉价越快。")}
          </div>
        </div>

        <div class="pricing-tier-section">
          <div class="pricing-tier-section-head">
            <strong>词条价格</strong>
            <span>控制带词条卡从低词条到高词条的补价幅度。</span>
          </div>
          <div class="pricing-tier-grid">
            ${renderField(`词条最低参考价（${valueUnit}）`, renderPriceInput("term_min_quota", tier.term_min_quota), "低词条卡的词条补价起点。")}
            ${renderField(`词条最高参考价（${valueUnit}）`, renderPriceInput("term_max_quota", tier.term_max_quota), "满词条时的词条补价上限。")}
            ${renderField("词条降价速度", renderNumberInput("term_decay_speed", Number(tier.term_decay_speed || 1).toFixed(2), {
              step: "0.05",
              min: "0.2",
              max: "5",
            }), "越大说明低词条会更快掉到底价。")}
          </div>
        </div>

        <div class="pricing-tier-section">
          <div class="pricing-tier-section-head">
            <strong>参考区间</strong>
            <span>定义这个档位里“最低点”和“最高点”到底对应什么数值。</span>
          </div>
          <div class="pricing-tier-grid">
            ${renderField("攻击最低参考值", renderNumberInput("term_attack_reference_min_value", Math.round(Number(tier.term_attack_reference_min_value || 0)), {
              step: "1",
              min: "0",
            }), "低于这里就按最低攻击看。")}
            ${renderField("攻击最高参考值", renderNumberInput("term_attack_reference_max_value", Math.round(Number(tier.term_attack_reference_max_value || 0)), {
              step: "1",
              min: "0",
            }), "高于这里就按满攻击看。")}
            ${renderField("词条最低参考值", renderNumberInput("term_value_reference_min", Number(tier.term_value_reference_min || 0).toFixed(1), {
              step: "0.1",
              min: "0",
            }), "例如金卡可以设成 2.1。")}
            ${renderField("词条最高参考值", renderNumberInput("term_value_reference_max", Number(tier.term_value_reference_max || 0).toFixed(1), {
              step: "0.1",
              min: "0",
            }), "例如金卡可以设成 3.0。")}
          </div>
        </div>

        <div class="pricing-tier-section${goldOnly ? " accent" : ""}">
          <div class="pricing-tier-section-head">
            <strong>攻击乘区</strong>
            <span>${goldOnly ? "只对带词条金卡生效。" : "这个档位不会吃金卡攻击乘区，只是保留同结构显示。"}</span>
          </div>
          <div class="pricing-tier-grid">
            ${renderField("满攻额外加价", renderNumberInput("term_attack_bonus_rate", Number(tier.term_attack_bonus_rate || 0).toFixed(2), {
              step: "0.05",
              min: "0",
              max: "3",
            }), "0.5 = 满攻击最多额外 +50%。", goldOnly ? "" : " is-muted")}
            ${renderField("高攻起点", renderNumberInput("term_attack_bonus_start_rate", Number(tier.term_attack_bonus_start_rate || 0.95).toFixed(2), {
              step: "0.01",
              min: "0.5",
              max: "1",
            }), "从这个攻击比例开始吃正向溢价。", goldOnly ? "" : " is-muted")}
            ${renderField("低攻额外减价", renderNumberInput("term_attack_penalty_rate", Number(tier.term_attack_penalty_rate || 0).toFixed(2), {
              step: "0.05",
              min: "0",
              max: "1",
            }), "0.3 = 最多额外 -30%。", goldOnly ? "" : " is-muted")}
            ${renderField("低攻起点", renderNumberInput("term_attack_penalty_start_rate", Number(tier.term_attack_penalty_start_rate || 0.85).toFixed(2), {
              step: "0.01",
              min: "0.5",
              max: "1",
            }), "低于这个攻击比例开始吃减价。", goldOnly ? "" : " is-muted")}
          </div>
        </div>
      </article>
    `;
  };

  adminPricingControlsRoot.innerHTML = `
    <div class="pricing-overview-card">
      <div class="pricing-overview-head">
        <div>
          <strong>定价调控</strong>
          <small>先调全局规则，再按档位逐张卡地看属性、词条和参考区间。</small>
        </div>
        <div class="pricing-overview-meta">
          <span>当前按${mode === "cash" ? "现金" : "额度"}录入</span>
          <span>攻击乘区只对带词条金卡生效</span>
        </div>
      </div>
    </div>
    <div class="pricing-global-grid">
      <section class="pricing-global-panel">
        <div class="pricing-tier-section-head">
          <strong>全局规则</strong>
          <span>会作用到全站或整个自动定价体系。</span>
        </div>
        <div class="pricing-global-row">
          <label class="pricing-global-field">
            <span>老卡统一折扣（%）</span>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              data-pricing-global-field="legacy_discount_rate"
              value="${escapeHtml(String(Number(normalizedControls.legacy_discount_rate || 100)))}"
            />
            <small>100 = 不打折，80 = 老卡统一 8 折。</small>
          </label>
          <label class="pricing-global-field">
            <span>双词条老卡折扣（%）</span>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              data-pricing-global-field="legacy_double_term_discount_rate"
              value="${escapeHtml(String(Number(normalizedControls.legacy_double_term_discount_rate || 100)))}"
            />
            <small>单独覆盖双词条老卡；100 = 不跟随普通老卡折扣。</small>
          </label>
          <label class="pricing-global-field">
            <span>双词条统一涨幅（%）</span>
            <input
              type="number"
              min="0"
              max="300"
              step="1"
              data-pricing-global-field="double_term_bonus_percent"
              value="${escapeHtml(String(Number(normalizedControls.double_term_bonus_percent || 0)))}"
            />
            <small>20 = 双词条卡统一 +20%。</small>
          </label>
          <label class="pricing-global-field">
            <span>当前编辑模式</span>
            <small>现在按${mode === "cash" ? "现金" : "额度"}录入，保存时会自动换算。</small>
          </label>
        </div>
      </section>
      <section class="pricing-global-panel accent">
        <div class="pricing-tier-section-head">
          <strong>无词条金卡专用</strong>
          <span>这部分只影响无词条金卡，不会串到其他档位。</span>
        </div>
        <div class="pricing-global-row">
          <label class="pricing-global-field">
            <span>无词条金卡最低价（${valueUnit}）</span>
            <input
              type="number"
              ${mode === "cash" ? 'step="0.01" min="0"' : 'step="1" min="0"'}
              data-pricing-gold-no-term-field="no_term_min_quota"
              value="${escapeHtml(formatEditablePricingValue(goldTier.no_term_min_quota, mode, conversionConfig))}"
            />
            <small>无词条金卡的最低基准价。</small>
          </label>
          <label class="pricing-global-field">
            <span>无词条金卡满攻参考价（${valueUnit}）</span>
            <input
              type="number"
              ${mode === "cash" ? 'step="0.01" min="0"' : 'step="1" min="0"'}
              data-pricing-gold-no-term-field="no_term_full_attack_quota"
              value="${escapeHtml(formatEditablePricingValue(goldTier.no_term_full_attack_quota, mode, conversionConfig))}"
            />
            <small>满攻击但还没双满时，大致落在这里。</small>
          </label>
          <label class="pricing-global-field">
            <span>无词条金卡双满参考价（${valueUnit}）</span>
            <input
              type="number"
              ${mode === "cash" ? 'step="0.01" min="0"' : 'step="1" min="0"'}
              data-pricing-gold-no-term-field="no_term_double_full_quota"
              value="${escapeHtml(formatEditablePricingValue(goldTier.no_term_double_full_quota, mode, conversionConfig))}"
            />
            <small>攻击和血量双满时，大致冲到这个价格。</small>
          </label>
          <label class="pricing-global-field">
            <span>无词条金卡满血加价起点</span>
            <input
              type="number"
              step="1"
              min="0"
              data-pricing-gold-no-term-field="no_term_hp_bonus_start_value"
              value="${escapeHtml(String(Math.round(Number(goldTier.no_term_hp_bonus_start_value || 0))))}"
            />
            <small>例如 198000000，表示 1.98e8 以上才开始往双满价抬。</small>
          </label>
        </div>
      </section>
    </div>
    <div class="pricing-scroll-hint">下面每个档位都是独立卡片，按“属性价格 / 词条价格 / 参考区间 / 攻击乘区”分块看。</div>
    <div class="pricing-tier-card-grid">
      ${PRICING_TIER_ORDER.map((tierKey) => renderTierCard(tierKey)).join("")}
    </div>
  `;
}

export function renderRechargeSection(context) {
  if (context.getCurrentRechargeConfig()) {
    renderRechargeConfigSection(context, context.getCurrentRechargeConfig());
  }
  renderRechargeOrdersSection(context);
}
