import {
  renderCatalogSection,
  renderCatalogProductsSection,
} from "../admin-renderers/products.js?v=release-20260509-160631";

export async function loadCatalogPage(context) {
  await Promise.all([
    context.loadProducts({ page: context.paginationState.products.page }),
    context.loadBundles({ page: context.paginationState.bundles.page }),
    context.loadAuctions(),
  ]);
  context.markPageLoaded("catalog");
}

export function bindCatalogPageEvents(context) {
  const {
    refs,
    selectedProductIds,
    apiFetch,
    setMessage,
    pickErrorMessage,
    guardAdminWriteAccess,
    openProductModal,
    reloadAll,
    parseNonNegativeMoneyValue,
    parseNonNegativeIntegerValue,
    convertCashToQuota,
    convertQuotaToCash,
    syncProductSummary,
    bulkUpdateSelectedProducts,
    bulkPatchSelectedProducts,
    restoreDiscountForProducts,
    applyRandomSelection,
    applyRandomDiscount,
    autoSelectPosterProducts,
    autoSelectMixedPosterProducts,
    exportSelectedProductsPoster,
    getSelectedAuctionProduct,
    loadAuctions,
    getAllProducts,
    getCurrentRechargeConfig,
    getActiveAdminProductCategory,
    setActiveAdminProductCategory,
    setActiveAdminProductSubcategory,
    setActiveAdminProductDetail,
    setActiveAdminProductFullness,
    resetPagedState,
    loadProducts,
    getDraftPricingControls,
    getNormalizedPricingControls,
    getPricingDisplayMode,
    getRechargeConfigDraftForPricing,
    parsePricingDecaySpeedValue,
    parsePricingBonusRateValue,
    parsePricingThresholdRateValue,
    parsePricingPenaltyRateValue,
    parsePricingPercentValue,
    renderPricingControls,
    setDraftPricingControls,
  } = context;

  refs.productsRoot?.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-product-id]");
    if (!card) return;
    if (event.target.closest(".product-select")) return;

    const productId = Number(card.getAttribute("data-product-id"));
    const product = getAllProducts().find((item) => Number(item.id) === productId) || null;

    try {
      if (event.target.closest(".view-product-detail-btn")) {
        openProductModal(product);
        return;
      }
      if (!guardAdminWriteAccess()) return;

      if (event.target.closest(".save-product-btn")) {
        const manualQuotaRaw = card.querySelector('[data-field="manual_price_quota"]').value.trim();
        const manualCashRaw = card.querySelector('[data-field="manual_price_yuan"]').value.trim();
        let manualPriceQuota;

        if (manualCashRaw) {
          const cashValue = parseNonNegativeMoneyValue(manualCashRaw);
          if (cashValue === null) {
            setMessage("单卡现金价必须是大于等于 0 的金额。", "error");
            return;
          }
          manualPriceQuota = convertCashToQuota(cashValue, getCurrentRechargeConfig());
        } else if (manualQuotaRaw) {
          manualPriceQuota = parseNonNegativeIntegerValue(manualQuotaRaw);
          if (manualPriceQuota === null) {
            setMessage("单卡额度价必须是大于等于 0 的整数。", "error");
            return;
          }
        }

        await apiFetch(`/admin/products/${productId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: card.querySelector('[data-field="name"]').value.trim(),
            ...(manualPriceQuota !== undefined ? { manual_price_quota: manualPriceQuota } : {}),
            discount_rate: Number(card.querySelector('[data-field="discount_rate"]').value),
            stock: Number(card.querySelector('[data-field="stock"]').value),
          }),
        });
        setMessage(`商品 #${productId} 已保存。`, "success");
        await reloadAll();
        return;
      }

      if (event.target.closest(".save-status-btn")) {
        await apiFetch(`/admin/products/${productId}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            status: card.querySelector('[data-field="status"]').value,
          }),
        });
        setMessage(`商品 #${productId} 状态已更新。`, "success");
        await reloadAll();
        return;
      }

      if (event.target.closest(".clear-manual-price-btn")) {
        await apiFetch(`/admin/products/${productId}/manual-price`, {
          method: "DELETE",
        });
        setMessage(`商品 #${productId} 已恢复自动价。`, "success");
        await reloadAll();
        return;
      }

      if (event.target.closest(".create-external-order-btn")) {
        const buyerLabel = card.querySelector('[data-field="external-buyer-label"]').value.trim();
        const remark = card.querySelector('[data-field="external-order-remark"]').value.trim();
        if (!buyerLabel) {
          setMessage("请先填写外部交易对象。", "error");
          return;
        }
        await apiFetch("/admin/orders/external", {
          method: "POST",
          body: JSON.stringify({
            item_id: productId,
            item_kind: "card",
            buyer_label: buyerLabel,
            remark: remark || null,
          }),
        });
        setMessage(`商品 #${productId} 已记录为外部成交。`, "success");
        await reloadAll();
      }
    } catch (error) {
      setMessage(`商品更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
    }
  });

  refs.productsRoot?.addEventListener("change", (event) => {
    const quotaInput = event.target.closest('[data-field="manual_price_quota"]');
    if (quotaInput) {
      const card = quotaInput.closest("[data-product-id]");
      const cashInput = card?.querySelector('[data-field="manual_price_yuan"]');
      const quotaValue = parseNonNegativeIntegerValue(quotaInput.value);
      if (cashInput) {
        cashInput.value =
          quotaValue === null ? "" : String(convertQuotaToCash(quotaValue, getCurrentRechargeConfig()) ?? "");
      }
      return;
    }

    const cashInput = event.target.closest('[data-field="manual_price_yuan"]');
    if (cashInput) {
      const card = cashInput.closest("[data-product-id]");
      const quotaInputField = card?.querySelector('[data-field="manual_price_quota"]');
      const cashValue = parseNonNegativeMoneyValue(cashInput.value);
      if (quotaInputField) {
        quotaInputField.value =
          cashValue === null ? "" : String(convertCashToQuota(cashValue, getCurrentRechargeConfig()) ?? "");
      }
      return;
    }

    const checkbox = event.target.closest(".product-select");
    if (!checkbox) return;
    const productId = Number(checkbox.getAttribute("data-product-id"));
    if (checkbox.checked) selectedProductIds.add(productId);
    else selectedProductIds.delete(productId);
    syncProductSummary();
  });

  refs.auctionsRoot?.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-auction-id]");
    if (!card) return;
    if (!guardAdminWriteAccess()) return;
    const auctionId = Number(card.getAttribute("data-auction-id") || 0);
    const remark = card.querySelector('[data-field="auction-remark"]')?.value?.trim() || "";
    const reason = card.querySelector('[data-field="auction-reason"]')?.value?.trim() || "";

    try {
      if (event.target.closest(".reload-single-auction-btn")) {
        await loadAuctions();
        setMessage(`拍卖 #${auctionId} 已刷新。`, "success");
        return;
      }

      if (event.target.closest(".settle-auction-direct-btn")) {
        await apiFetch(`/admin/auctions/${auctionId}/settle`, {
          method: "POST",
          body: JSON.stringify({ remark: remark || null, settlement_mode: "direct_quota" }),
        });
        setMessage(`拍卖 #${auctionId} 已扣额度并结算。`, "success");
        await reloadAll();
        return;
      }

      if (event.target.closest(".settle-auction-offline-btn")) {
        await apiFetch(`/admin/auctions/${auctionId}/settle`, {
          method: "POST",
          body: JSON.stringify({ remark: remark || null, settlement_mode: "offline" }),
        });
        setMessage(`拍卖 #${auctionId} 已按线下支付方式结算。`, "success");
        await reloadAll();
        return;
      }

      if (event.target.closest(".cancel-auction-btn")) {
        await apiFetch(`/admin/auctions/${auctionId}/cancel`, {
          method: "POST",
          body: JSON.stringify({
            reason: reason || null,
            remark: remark || null,
          }),
        });
        setMessage(`拍卖 #${auctionId} 已流拍。`, "success");
        await reloadAll();
      }
    } catch (error) {
      setMessage(`拍卖操作失败：${pickErrorMessage(error, "操作失败")}`, "error");
    }
  });

  refs.bundlesRoot?.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-bundle-id]");
    if (!card) return;
    if (!guardAdminWriteAccess()) return;
    const bundleId = Number(card.getAttribute("data-bundle-id"));

    try {
      if (event.target.closest(".save-bundle-btn")) {
        const stockRaw = card.querySelector('[data-field="stock"]').value.trim();
        const tagsRaw = card.querySelector('[data-field="tags"]').value.trim();
        await apiFetch(`/admin/bundles/${bundleId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: card.querySelector('[data-field="name"]').value.trim(),
            description: card.querySelector('[data-field="description"]').value.trim(),
            tags: tagsRaw
              ? tagsRaw
                  .split(/[,锛寍]/)
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],
            price_quota: Number(card.querySelector('[data-field="price_quota"]').value),
            stock: stockRaw === "" ? null : Number(stockRaw),
            display_rank: Number(card.querySelector('[data-field="display_rank"]').value),
          }),
        });
        setMessage(`套餐 #${bundleId} 已保存。`, "success");
        await reloadAll();
        return;
      }

      if (event.target.closest(".save-bundle-status-btn")) {
        await apiFetch(`/admin/bundles/${bundleId}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            status: card.querySelector('[data-field="status"]').value,
          }),
        });
        setMessage(`套餐 #${bundleId} 状态已更新。`, "success");
        await reloadAll();
      }
    } catch (error) {
      setMessage(`套餐更新失败：${pickErrorMessage(error, "更新失败")}`, "error");
    }
  });

  refs.recalculatePricingBtn?.addEventListener("click", async () => {
    if (!guardAdminWriteAccess()) return;
    try {
      const result = await apiFetch("/admin/pricing/recalculate", { method: "POST" });
      setMessage(`定价已重算，共处理 ${result.product_count} 个商品。`, "success");
      await reloadAll();
    } catch (error) {
      setMessage(`重算定价失败：${pickErrorMessage(error, "重算失败")}`, "error");
    }
  });

  refs.adminProductKeywordInput?.addEventListener("input", () => {
    resetPagedState("products");
    loadProducts({ page: 1 }).catch((error) =>
      setMessage(`商品加载失败：${pickErrorMessage(error, "加载失败")}`, "error")
    );
  });
  refs.adminProductStatusFilter?.addEventListener("change", () => {
    resetPagedState("products");
    loadProducts({ page: 1 }).catch((error) =>
      setMessage(`商品加载失败：${pickErrorMessage(error, "加载失败")}`, "error")
    );
  });
  refs.adminProductDiscountFilter?.addEventListener("change", () => {
    resetPagedState("products");
    loadProducts({ page: 1 }).catch((error) =>
      setMessage(`商品加载失败：${pickErrorMessage(error, "加载失败")}`, "error")
    );
  });
  refs.adminProductCategoryTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-product-category]");
    if (!button) return;
    setActiveAdminProductCategory(button.getAttribute("data-admin-product-category") || "all");
    setActiveAdminProductSubcategory("all");
    setActiveAdminProductDetail("all");
    setActiveAdminProductFullness("all");
    resetPagedState("products");
    loadProducts({ page: 1 })
      .then(() => {
        if (getActiveAdminProductCategory() === "bundle") {
          document.getElementById("bundles")?.scrollIntoView({ behavior: "smooth", block: "start" });
          setMessage("套餐入口在下方的套餐 SKU 模块。", "success");
        }
      })
      .catch((error) => setMessage(`商品加载失败：${pickErrorMessage(error, "加载失败")}`, "error"));
  });
  refs.adminProductSubcategoryTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-product-subcategory]");
    if (!button) return;
    setActiveAdminProductSubcategory(button.getAttribute("data-admin-product-subcategory") || "all");
    setActiveAdminProductDetail("all");
    setActiveAdminProductFullness("all");
    resetPagedState("products");
    loadProducts({ page: 1 }).catch((error) =>
      setMessage(`商品加载失败：${pickErrorMessage(error, "加载失败")}`, "error")
    );
  });
  refs.adminProductDetailTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-product-detail]");
    if (!button) return;
    setActiveAdminProductDetail(button.getAttribute("data-admin-product-detail") || "all");
    setActiveAdminProductFullness("all");
    resetPagedState("products");
    loadProducts({ page: 1 }).catch((error) =>
      setMessage(`商品加载失败：${pickErrorMessage(error, "加载失败")}`, "error")
    );
  });
  refs.adminProductFullnessTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-product-fullness]");
    if (!button) return;
    setActiveAdminProductFullness(button.getAttribute("data-admin-product-fullness") || "all");
    resetPagedState("products");
    loadProducts({ page: 1 }).catch((error) =>
      setMessage(`商品加载失败：${pickErrorMessage(error, "加载失败")}`, "error")
    );
  });
  document.getElementById("select-all-products-btn")?.addEventListener("click", () => {
    selectedProductIds.clear();
    context.getFilteredProducts().forEach((product) => selectedProductIds.add(product.id));
    renderCatalogProductsSection(context, context.getFilteredProducts());
  });
  document.getElementById("select-discounted-products-btn")?.addEventListener("click", () => {
    selectedProductIds.clear();
    context.getDiscountedFilteredProducts().forEach((product) => selectedProductIds.add(product.id));
    renderCatalogProductsSection(context, context.getFilteredProducts());
  });
  document.getElementById("clear-selected-products-btn")?.addEventListener("click", () => {
    selectedProductIds.clear();
    refs.productsRoot?.querySelectorAll(".product-select").forEach((checkbox) => {
      checkbox.checked = false;
    });
    syncProductSummary(context.getFilteredProducts());
  });
  document.getElementById("bulk-on-sale-btn")?.addEventListener("click", () => {
    bulkUpdateSelectedProducts("on_sale");
  });
  document.getElementById("bulk-off-sale-btn")?.addEventListener("click", () => {
    bulkUpdateSelectedProducts("off_sale");
  });
  document.getElementById("bulk-price-btn")?.addEventListener("click", () => {
    const price = Number(refs.bulkPriceInput?.value);
    if (!Number.isInteger(price) || price < 0) {
      setMessage("批量价格必须是大于等于 0 的整数。", "error");
      return;
    }
    bulkPatchSelectedProducts({ price_quota: price });
  });
  document.getElementById("bulk-stock-btn")?.addEventListener("click", () => {
    const stock = Number(refs.bulkStockInput?.value);
    if (!Number.isInteger(stock) || stock < 0) {
      setMessage("批量库存必须是大于等于 0 的整数。", "error");
      return;
    }
    bulkPatchSelectedProducts({ stock });
  });
  document.getElementById("bulk-discount-btn")?.addEventListener("click", () => {
    const discountRate = context.parseDiscountRateInputValue(refs.bulkDiscountRateInput?.value);
    if (!discountRate) {
      setMessage("批量折扣率必须是 1 到 100 之间的整数。", "error");
      return;
    }
    bulkPatchSelectedProducts({ discount_rate: discountRate });
  });
  document.getElementById("bulk-restore-discount-btn")?.addEventListener("click", () => {
    restoreDiscountForProducts(
      getAllProducts().filter((product) => selectedProductIds.has(Number(product.id)) && context.isDiscountedProduct(product))
    );
  });
  document.getElementById("filtered-restore-discount-btn")?.addEventListener("click", () => {
    restoreDiscountForProducts(context.getDiscountedFilteredProducts());
  });
  document.getElementById("random-select-products-btn")?.addEventListener("click", () => {
    applyRandomSelection();
  });
  document.getElementById("random-discount-btn")?.addEventListener("click", () => {
    applyRandomDiscount();
  });
  refs.smartSelectHotProductsBtn?.addEventListener("click", () => {
    autoSelectPosterProducts("hot");
  });
  refs.smartSelectBudgetProductsBtn?.addEventListener("click", () => {
    autoSelectPosterProducts("budget");
  });
  refs.smartSelectMixedProductsBtn?.addEventListener("click", () => {
    autoSelectMixedPosterProducts();
  });
  refs.exportProductPosterBtn?.addEventListener("click", () => {
    exportSelectedProductsPoster();
  });
  document.getElementById("reload-auctions-btn")?.addEventListener("click", () => {
    loadAuctions().catch((error) => setMessage(`拍卖加载失败：${pickErrorMessage(error)}`, "error"));
  });
  document.getElementById("admin-create-auction-btn")?.addEventListener("click", async () => {
    if (!guardAdminWriteAccess()) return;
    const product = getSelectedAuctionProduct();
    if (!product) {
      setMessage("开拍前请先只选中一张商品。", "error");
      return;
    }
    if (product.auction_id) {
      setMessage("这张卡已经在拍卖流程里了。", "error");
      return;
    }

    try {
      await apiFetch("/admin/auctions", {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(product.id),
          title: refs.adminAuctionTitleInput?.value?.trim() || null,
          starting_price_quota: Number(refs.adminAuctionStartingPriceInput?.value),
          min_increment_quota: Number(refs.adminAuctionMinIncrementInput?.value),
          starts_at: refs.adminAuctionStartAtInput?.value
            ? new Date(refs.adminAuctionStartAtInput.value).toISOString()
            : null,
          ends_at: refs.adminAuctionEndAtInput?.value
            ? new Date(refs.adminAuctionEndAtInput.value).toISOString()
            : null,
          remark: refs.adminAuctionRemarkInput?.value?.trim() || null,
        }),
      });
      setMessage(`商品 #${product.id} 已开拍。`, "success");
      await reloadAll();
    } catch (error) {
      setMessage(`开拍失败：${pickErrorMessage(error, "开拍失败")}`, "error");
    }
  });
}

export function renderCatalogPage(context) {
  renderCatalogSection(context);
}
