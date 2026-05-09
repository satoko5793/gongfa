import { renderRechargeSection } from "../admin-renderers/recharge.js?v=release-20260509-160631";

export async function loadRechargePage(context) {
  await context.loadRechargeOrders({ page: context.paginationState.rechargeOrders.page });
  context.markPageLoaded("recharge");
}

export function bindRechargePageEvents(context) {
  const {
    refs,
    apiFetch,
    setMessage,
    pickErrorMessage,
    guardAdminWriteAccess,
    loadOverviewCounts,
    loadRechargeOrders,
    reloadAll,
    resetPagedState,
    renderPricingControls,
    renderRechargeConfig,
    getCurrentRechargeConfig,
    getDraftPricingControls,
    getNormalizedPricingControls,
    getPricingDisplayMode,
    getRechargeConfigDraftForPricing,
    parsePricingPercentValue,
    parsePricingDecaySpeedValue,
    parsePricingBonusRateValue,
    parsePricingThresholdRateValue,
    parsePricingPenaltyRateValue,
    parseNonNegativeIntegerValue,
    parseNonNegativeMoneyValue,
    convertCashToQuota,
    setDraftPricingControls,
  } = context;

  const sanitizePricingControlsForSubmit = (pricingControls) => {
    if (!pricingControls || typeof pricingControls !== "object" || Array.isArray(pricingControls)) {
      return pricingControls;
    }
    const nextControls = {
      ...pricingControls,
      tiers:
        pricingControls.tiers && typeof pricingControls.tiers === "object"
          ? { ...pricingControls.tiers }
          : pricingControls.tiers,
    };
    for (const tierKey of ["green", "blue", "purple", "orange", "red"]) {
      const tier = nextControls.tiers?.[tierKey];
      if (!tier || typeof tier !== "object" || Array.isArray(tier)) continue;
      const nextTier = { ...tier };
      delete nextTier.no_term_min_quota;
      delete nextTier.no_term_full_attack_quota;
      delete nextTier.no_term_double_full_quota;
      delete nextTier.no_term_hp_bonus_start_value;
      nextControls.tiers[tierKey] = nextTier;
    }
    return nextControls;
  };

  refs.adminRechargeOrdersRoot?.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-recharge-order-id]");
    if (!card) return;
    if (!guardAdminWriteAccess()) return;
    const rechargeOrderId = Number(card.getAttribute("data-recharge-order-id"));
    const adminRemark = card.querySelector('[data-field="admin_remark"]')?.value?.trim() || "";

    try {
      if (event.target.closest(".approve-recharge-order-btn")) {
        await apiFetch(`/admin/recharge-orders/${rechargeOrderId}/review`, {
          method: "PATCH",
          body: JSON.stringify({ status: "approved", admin_remark: adminRemark }),
        });
        await reloadAll();
        setMessage(`充值单 #${rechargeOrderId} 已审核通过并加额度。`, "success");
        return;
      }

      if (event.target.closest(".reject-recharge-order-btn")) {
        await apiFetch(`/admin/recharge-orders/${rechargeOrderId}/review`, {
          method: "PATCH",
          body: JSON.stringify({ status: "rejected", admin_remark: adminRemark }),
        });
        await loadOverviewCounts();
        await loadRechargeOrders();
        setMessage(`充值单 #${rechargeOrderId} 已驳回。`, "success");
      }
    } catch (error) {
      setMessage(`充值订单处理失败：${pickErrorMessage(error, "处理失败")}`, "error");
    }
  });

  refs.adminRechargeQrImageUrlInput?.addEventListener("input", () => {
    if (!refs.adminRechargeQrPreview) return;
    refs.adminRechargeQrPreview.src =
      refs.adminRechargeQrImageUrlInput.value.trim() || "/payment/alipay-qr.jpg";
  });

  refs.adminWechatQrImageUrlInput?.addEventListener("input", () => {
    if (!refs.adminWechatQrPreview) return;
    refs.adminWechatQrPreview.src =
      refs.adminWechatQrImageUrlInput.value.trim() || "/payment/wechat-qr.png";
  });

  refs.adminPricingDisplayModeSelect?.addEventListener("change", () => {
    renderPricingControls(getDraftPricingControls());
  });

  refs.adminPricingControlsRoot?.addEventListener("change", (event) => {
    const globalInput = event.target.closest("[data-pricing-global-field]");
    if (globalInput) {
      const field = globalInput.getAttribute("data-pricing-global-field");
      if (!field) return;

      const nextControls = getNormalizedPricingControls(getDraftPricingControls());
      const parsedValue =
        field === "legacy_discount_rate"
          ? parsePricingPercentValue(globalInput.value, { min: 1, max: 100 })
          : field === "legacy_double_term_discount_rate"
            ? parsePricingPercentValue(globalInput.value, { min: 1, max: 100 })
          : field === "double_term_bonus_percent"
            ? parsePricingPercentValue(globalInput.value, { min: 0, max: 300 })
            : null;
      if (parsedValue === null) return;

      nextControls[field] = parsedValue;
      setDraftPricingControls(nextControls);
      renderPricingControls(getDraftPricingControls());
      return;
    }

    const goldNoTermInput = event.target.closest("[data-pricing-gold-no-term-field]");
    if (goldNoTermInput) {
      const field = goldNoTermInput.getAttribute("data-pricing-gold-no-term-field");
      if (!field) return;

      const nextControls = getNormalizedPricingControls(getDraftPricingControls());
      const mode = getPricingDisplayMode();
      const parsedValue =
        field === "no_term_hp_bonus_start_value"
          ? parseNonNegativeIntegerValue(goldNoTermInput.value)
          : mode === "cash"
            ? parseNonNegativeMoneyValue(goldNoTermInput.value)
            : parseNonNegativeIntegerValue(goldNoTermInput.value);
      if (parsedValue === null) return;

      const quotaValue =
        field === "no_term_hp_bonus_start_value"
          ? parsedValue
          : mode === "cash"
            ? convertCashToQuota(parsedValue, getRechargeConfigDraftForPricing())
            : parsedValue;
      if (quotaValue === null) return;

      nextControls.tiers.gold[field] = quotaValue;
      nextControls.tiers.gold.no_term_full_attack_quota = Math.max(
        nextControls.tiers.gold.no_term_min_quota,
        nextControls.tiers.gold.no_term_full_attack_quota
      );
      nextControls.tiers.gold.no_term_double_full_quota = Math.max(
        nextControls.tiers.gold.no_term_full_attack_quota,
        nextControls.tiers.gold.no_term_double_full_quota
      );
      setDraftPricingControls(nextControls);
      renderPricingControls(getDraftPricingControls());
      return;
    }

    const input = event.target.closest("[data-pricing-field]");
    const row = event.target.closest("[data-pricing-tier]");
    if (!input || !row) return;

    const tierKey = row.getAttribute("data-pricing-tier");
    const field = input.getAttribute("data-pricing-field");
    if (!tierKey || !field) return;

    const nextControls = getNormalizedPricingControls(getDraftPricingControls());
    const mode = getPricingDisplayMode();
    const isSpeedField = field === "atlas_decay_speed" || field === "term_decay_speed";
    const isAttackReferenceField =
      field === "term_attack_reference_min_value" || field === "term_attack_reference_max_value";
    const isTermValueReferenceField = field === "term_value_reference_min" || field === "term_value_reference_max";
    const parsedValue = isSpeedField
      ? parsePricingDecaySpeedValue(input.value)
      : field === "term_attack_bonus_rate"
        ? parsePricingBonusRateValue(input.value)
      : field === "term_attack_bonus_start_rate"
        ? parsePricingThresholdRateValue(input.value)
      : field === "term_attack_penalty_rate"
        ? parsePricingPenaltyRateValue(input.value)
      : field === "term_attack_penalty_start_rate"
        ? parsePricingThresholdRateValue(input.value)
      : isTermValueReferenceField
        ? parseNonNegativeMoneyValue(input.value)
      : isAttackReferenceField
        ? parseNonNegativeIntegerValue(input.value)
      : mode === "cash"
        ? parseNonNegativeMoneyValue(input.value)
        : parseNonNegativeIntegerValue(input.value);
    if (parsedValue === null) return;

    const quotaValue =
      isSpeedField || isAttackReferenceField || isTermValueReferenceField
        ? parsedValue
        : field === "term_attack_bonus_rate" ||
            field === "term_attack_bonus_start_rate" ||
            field === "term_attack_penalty_rate" ||
            field === "term_attack_penalty_start_rate"
          ? parsedValue
          : mode === "cash"
            ? convertCashToQuota(parsedValue, getRechargeConfigDraftForPricing())
            : parsedValue;
    if (quotaValue === null) return;

    nextControls.tiers[tierKey][field] = quotaValue;
    const tier = nextControls.tiers[tierKey];
    tier.atlas_max_quota = Math.max(tier.atlas_min_quota, tier.atlas_max_quota);
    tier.atlas_double_full_quota = Math.max(tier.atlas_max_quota, tier.atlas_double_full_quota);
    tier.term_max_quota = Math.max(tier.term_min_quota, tier.term_max_quota);
    tier.term_attack_reference_max_value = Math.max(
      tier.term_attack_reference_min_value,
      tier.term_attack_reference_max_value
    );
    tier.term_value_reference_max = Math.max(tier.term_value_reference_min, tier.term_value_reference_max);
    setDraftPricingControls(nextControls);
    renderPricingControls(getDraftPricingControls());
  });

  [refs.adminRechargeExchangeYuanInput, refs.adminRechargeExchangeQuotaInput].forEach((input) => {
    input?.addEventListener("input", () => {
      if (getPricingDisplayMode() === "cash") {
        renderPricingControls(getDraftPricingControls());
      }
    });
  });

  refs.adminRechargeConfigForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!guardAdminWriteAccess()) return;

    const currentConfig = getCurrentRechargeConfig() || {};
    const numberValue = (input, fallback) => {
      const parsed = Number(input?.value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const textValue = (input, fallback = "") => {
      const text = String(input?.value || "").trim();
      return text || String(fallback || "");
    };
    const booleanValue = (input, fallback = false) => {
      if (!input) return Boolean(fallback);
      if (input.value === "true") return true;
      if (input.value === "false") return false;
      return Boolean(fallback);
    };

    const presetAmounts = String(refs.adminRechargePresetsInput?.value || "")
      .split(",")
      .map((item) => {
        const trimmed = item.trim();
        if (!trimmed) return null;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      })
      .filter((item) => item !== null);
    const instructions = String(refs.adminRechargeInstructionsInput?.value || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    const residualInstructions = String(refs.adminResidualInstructionsInput?.value || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const nextConfig = await apiFetch("/admin/recharge-config", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: booleanValue(refs.adminRechargeEnabled, currentConfig.enabled),
          exchange_yuan: numberValue(refs.adminRechargeExchangeYuanInput, currentConfig.exchange_yuan),
          exchange_quota: numberValue(refs.adminRechargeExchangeQuotaInput, currentConfig.exchange_quota),
          min_amount_yuan: numberValue(refs.adminRechargeMinYuanInput, currentConfig.min_amount_yuan),
          residual_transfer_enabled: booleanValue(
            refs.adminResidualTransferEnabledInput,
            currentConfig.residual_transfer_enabled
          ),
          residual_admin_role_id: textValue(refs.adminResidualAdminRoleIdInput, currentConfig.residual_admin_role_id),
          residual_admin_role_name: textValue(refs.adminResidualAdminRoleNameInput, currentConfig.residual_admin_role_name),
          residual_admin_game_name: textValue(refs.adminResidualAdminGameNameInput, currentConfig.residual_admin_game_name),
          residual_unit_label: textValue(refs.adminResidualUnitLabelInput, currentConfig.residual_unit_label),
          residual_quota_per_unit: numberValue(refs.adminResidualQuotaPerUnitInput, currentConfig.residual_quota_per_unit),
          season_member_enabled: booleanValue(
            refs.adminSeasonMemberEnabledInput,
            currentConfig.season_member_enabled
          ),
          season_member_season_label: textValue(refs.adminSeasonMemberLabelInput, currentConfig.season_member_season_label),
          season_member_expires_at: textValue(refs.adminSeasonMemberExpiresAtInput, currentConfig.season_member_expires_at),
          season_member_price_yuan: numberValue(refs.adminSeasonMemberPriceInput, currentConfig.season_member_price_yuan),
          season_member_quota: numberValue(refs.adminSeasonMemberQuotaInput, currentConfig.season_member_quota),
          season_member_bonus_rate: numberValue(refs.adminSeasonMemberBonusRateInput, currentConfig.season_member_bonus_rate),
          lineup_base_slots: numberValue(refs.adminLineupBaseSlotsInput, currentConfig.lineup_base_slots),
          lineup_permanent_slot_quota: numberValue(
            refs.adminLineupPermanentSlotQuotaInput,
            currentConfig.lineup_permanent_slot_quota
          ),
          lineup_permanent_slot_max: numberValue(refs.adminLineupPermanentSlotMaxInput, currentConfig.lineup_permanent_slot_max),
          lineup_seasonal_slot_quota: numberValue(
            refs.adminLineupSeasonalSlotQuotaInput,
            currentConfig.lineup_seasonal_slot_quota
          ),
          lineup_member_bonus_slots: numberValue(refs.adminLineupMemberBonusSlotsInput, currentConfig.lineup_member_bonus_slots),
          preset_amounts: presetAmounts,
          qr_image_url: textValue(refs.adminRechargeQrImageUrlInput, currentConfig.qr_image_url),
          payee_name: textValue(refs.adminRechargePayeeNameInput, currentConfig.payee_name),
          payee_hint: textValue(refs.adminRechargePayeeHintInput, currentConfig.payee_hint),
          wechat_qr_image_url: textValue(refs.adminWechatQrImageUrlInput, currentConfig.wechat_qr_image_url),
          wechat_payee_name: textValue(refs.adminWechatPayeeNameInput, currentConfig.wechat_payee_name),
          wechat_payee_hint: textValue(refs.adminWechatPayeeHintInput, currentConfig.wechat_payee_hint),
          instructions,
          residual_instructions: residualInstructions,
          pricing_controls: sanitizePricingControlsForSubmit(
            getNormalizedPricingControls(getDraftPricingControls())
          ),
        }),
      });
      renderRechargeConfig(nextConfig);
      const repriceStatus = nextConfig?.pricing_reprice_status || null;
      setMessage(
        `充值配置已保存，当前比例 ${Number(nextConfig.exchange_yuan || 1)} 元 = ${Number(nextConfig.exchange_quota || 0)} 额度。${
          repriceStatus?.status === "success"
            ? ` 已同步重算 ${Number(repriceStatus.product_count || 0)} 张商品。`
            : ""
        }`,
        "success"
      );
    } catch (error) {
      setMessage(`充值配置保存失败：${pickErrorMessage(error, "保存失败")}`, "error");
    }
  });

  refs.adminRechargeStatusFilter?.addEventListener("change", () => {
    resetPagedState("rechargeOrders");
    loadRechargeOrders({ page: 1 }).catch((error) =>
      setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error")
    );
  });

  refs.adminRechargeKeywordInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resetPagedState("rechargeOrders");
    loadRechargeOrders({ page: 1 }).catch((error) =>
      setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error")
    );
  });

  document.getElementById("reload-recharge-orders-btn")?.addEventListener("click", () => {
    resetPagedState("rechargeOrders");
    loadRechargeOrders({ page: 1 }).catch((error) =>
      setMessage(`充值订单加载失败：${pickErrorMessage(error)}`, "error")
    );
  });
}

export function renderRechargePage(context) {
  renderRechargeSection(context);
}
