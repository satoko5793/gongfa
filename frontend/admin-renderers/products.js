export function renderCatalogProductsSection(context, products = context.getAllProducts()) {
  const {
    refs,
    escapeHtml,
    hasAdminWriteAccess,
    getPricingMeta,
    getDiscountLabel,
    formatQuotaCashPair,
    renderAdminProductCover,
    renderPricingSummary,
    normalizeDiscountRate,
    convertQuotaToCash,
    getCurrentRechargeConfig,
    selectedProductIds,
    syncProductSummary,
    getActiveAdminProductCategory,
  } = context;

  const { productsRoot } = refs;
  const canWrite = hasAdminWriteAccess();

  if (!productsRoot) return;
  if (!products.length) {
    productsRoot.innerHTML =
      getActiveAdminProductCategory() === "bundle"
        ? '<div class="stack-item">套餐请在下方“套餐 SKU”模块里管理，这里只展示单卡商品。</div>'
        : '<div class="stack-item">当前筛选条件下没有商品。</div>';
    syncProductSummary(products);
    return;
  }

  productsRoot.innerHTML = products
    .map((product) => {
      const pricingMeta = getPricingMeta(product);
      const pricingLabel = pricingMeta.source === "manual" ? "手动价" : "自动价";
      const dominantLabel = pricingMeta.dominant_reason_label || "-";
      const marketFactor = Number(pricingMeta?.market?.factor || 1).toFixed(2);
      const floorPrice = Number(pricingMeta.floor_price || 0);
      const autoPrice = Number(pricingMeta.auto_price || product.price_quota || 0);
      const manualPrice =
        product.manual_price_quota === null || product.manual_price_quota === undefined
          ? "-"
          : Number(product.manual_price_quota);
      const discountRate = normalizeDiscountRate(product.discount_rate);
      const effectivePrice = Number(product.effective_price_quota || product.price_quota || 0);
      const basePrice = Number(product.price_quota || 0);
      const manualPriceQuota =
        product.manual_price_quota === null || product.manual_price_quota === undefined
          ? ""
          : String(Number(product.manual_price_quota));
      const manualPriceCash =
        manualPriceQuota === ""
          ? ""
          : String(convertQuotaToCash(Number(product.manual_price_quota), getCurrentRechargeConfig()) ?? "");

      return `
        <div class="admin-card" data-product-id="${product.id}">
          <div class="admin-card-head">
            <label class="checkbox-line">
              <input class="product-select" type="checkbox" data-product-id="${product.id}" ${
                selectedProductIds.has(product.id) ? "checked" : ""
              } />
              <span>选中</span>
            </label>
            <span class="chip">${escapeHtml(product.status)}</span>
          </div>
          <div class="admin-product-layout">
            ${renderAdminProductCover(product)}
            <div class="admin-product-main">
              <div class="product-name">${escapeHtml(product.name)}</div>
              <div class="product-meta">
                <div>UID / Legacy: ${escapeHtml(product.uid || "-")} / ${escapeHtml(product.legacy_id || "-")}</div>
                <div>Source: ${escapeHtml(product.source_file_name || "-")}</div>
                <div>Stats: ATK ${Number(product.attack_value || 0)} / HP ${Number(product.hp_value || 0)}</div>
                <div>Terms: ${escapeHtml(product.ext_attrs || "none")}</div>
                <div>Stock: ${Number(product.stock || 0)} / 当前价: ${basePrice}</div>
                <div>Discount: ${escapeHtml(getDiscountLabel(discountRate))} / Final: ${effectivePrice}</div>
                <div>Auction: ${product.auction_id ? `#${Number(product.auction_id)} / ${escapeHtml(product.auction_status || "-")} / ${escapeHtml(context.formatDate(product.auction_ends_at || ""))}` : "none"}</div>
                <div>Pricing: ${pricingLabel} / Reason: ${escapeHtml(dominantLabel)}</div>
                <div>Floor: ${floorPrice} / Auto: ${autoPrice} / Manual: ${manualPrice}</div>
                <div>兑现金额：${escapeHtml(formatQuotaCashPair(effectivePrice))}</div>
                <div>Market factor: ${marketFactor}</div>
              </div>
              ${renderPricingSummary(product, pricingMeta)}
            </div>
          </div>
          ${
            canWrite
              ? `
                  <div class="inline-form">
                    <input data-field="name" value="${escapeHtml(product.name)}" />
                    <input data-field="discount_rate" type="number" min="1" max="100" value="${discountRate}" placeholder="折扣率" />
                    <input data-field="stock" type="number" value="${Number(product.stock || 0)}" />
                    <select data-field="status">
                      ${["draft", "on_sale", "off_sale", "sold"]
                        .map(
                          (status) =>
                            `<option value="${status}" ${product.status === status ? "selected" : ""}>${status}</option>`
                        )
                        .join("")}
                    </select>
                  </div>
                  <div class="inline-form">
                    <input
                      data-field="manual_price_quota"
                      type="number"
                      min="0"
                      step="1"
                      value="${escapeHtml(manualPriceQuota)}"
                      placeholder="单卡手动额度价，留空则保持当前规则"
                    />
                    <input
                      data-field="manual_price_yuan"
                      type="number"
                      min="0"
                      step="0.01"
                      value="${escapeHtml(manualPriceCash)}"
                      placeholder="单卡手动现金价，可只填这一项"
                    />
                  </div>
                  <div class="muted">
                    单卡手动价优先于整套定价。清空这两个输入并点“恢复自动价”可回到自动系统。
                  </div>
                  <div class="inline-form">
                    <input data-field="external-buyer-label" type="text" placeholder="外部交易对象，例如微信直卖 / 熟人代拍" />
                    <input data-field="external-order-remark" type="text" placeholder="外部成交备注，可选" />
                    <button class="danger create-external-order-btn" type="button">记外部成交</button>
                  </div>
                  <div class="actions">
                    <button class="ghost view-product-detail-btn" type="button">查看详情</button>
                    <button class="primary save-product-btn" type="button">保存商品</button>
                    <button class="ghost save-status-btn" type="button">仅更新状态</button>
                    <button class="ghost clear-manual-price-btn" type="button">恢复自动价</button>
                  </div>
                `
              : `
                  <div class="actions">
                    <button class="ghost view-product-detail-btn" type="button">查看详情</button>
                  </div>
                `
          }
        </div>
      `;
    })
    .join("");

  syncProductSummary(products);
}

export function renderBundlesSection(context, bundles = context.getAllBundles()) {
  const { refs, escapeHtml, hasAdminWriteAccess } = context;
  const { bundlesRoot } = refs;
  const canWrite = hasAdminWriteAccess();

  if (!bundlesRoot) return;
  if (!Array.isArray(bundles) || bundles.length === 0) {
    bundlesRoot.innerHTML = '<div class="stack-item">暂无套餐 SKU。</div>';
    return;
  }

  bundlesRoot.innerHTML = bundles
    .map(
      (bundle) => `
        <div class="admin-card" data-bundle-id="${bundle.id}">
          <div class="admin-card-head">
            <div class="product-name">${escapeHtml(bundle.name)}</div>
            <span class="chip">${escapeHtml(bundle.status)}</span>
          </div>
          <div class="product-meta">
            <div>编码：${escapeHtml(bundle.code)}</div>
            <div>说明：${escapeHtml(bundle.description || "-")}</div>
            <div>标签：${escapeHtml((bundle.tags || []).join(" / ") || "-")}</div>
            <div>价格：${Number(bundle.price_quota || 0)} / 库存：${
              bundle.stock === null || bundle.stock === undefined ? "不限" : Number(bundle.stock)
            }</div>
            <div>显示顺序：${Number(bundle.display_rank || 999)}</div>
          </div>
          ${
            canWrite
              ? `
                  <div class="inline-form">
                    <input data-field="name" value="${escapeHtml(bundle.name)}" />
                    <input data-field="description" value="${escapeHtml(bundle.description || "")}" />
                    <input
                      data-field="tags"
                      value="${escapeHtml((bundle.tags || []).join(", "))}"
                      placeholder="标签，逗号分隔"
                    />
                    <input data-field="price_quota" type="number" value="${Number(bundle.price_quota || 0)}" />
                    <input
                      data-field="stock"
                      type="text"
                      value="${bundle.stock === null || bundle.stock === undefined ? "" : Number(bundle.stock)}"
                      placeholder="留空表示不限量"
                    />
                    <input
                      data-field="display_rank"
                      type="number"
                      value="${Number(bundle.display_rank || 999)}"
                      placeholder="排序"
                    />
                    <select data-field="status">
                      ${["on_sale", "off_sale", "sold"]
                        .map(
                          (status) =>
                            `<option value="${status}" ${bundle.status === status ? "selected" : ""}>${status}</option>`
                        )
                        .join("")}
                    </select>
                  </div>
                  <div class="actions">
                    <button class="primary save-bundle-btn" type="button">保存套餐</button>
                    <button class="ghost save-bundle-status-btn" type="button">仅更新状态</button>
                  </div>
                `
              : ""
          }
        </div>
      `
    )
    .join("");
}

export function openProductModalView(context, product) {
  const {
    refs,
    escapeHtml,
    getPricingMeta,
    renderAdminProductCover,
    renderPricingSummary,
  } = context;
  const { adminProductModal, adminProductModalBody } = refs;
  if (!adminProductModal || !adminProductModalBody || !product) return;

  const pricingMeta = getPricingMeta(product);
  const rawSnapshot = {
    id: product.id,
    uid: product.uid,
    legacy_id: product.legacy_id,
    name: product.name,
    image_url: product.image_url,
    attack_value: product.attack_value,
    hp_value: product.hp_value,
    main_attrs: product.main_attrs,
    ext_attrs: product.ext_attrs,
    stock: product.stock,
    status: product.status,
    price_quota: product.price_quota,
    manual_price_quota: product.manual_price_quota,
    pricing_meta: pricingMeta,
  };

  adminProductModalBody.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-cover">
        ${renderAdminProductCover(product)}
      </div>
      <div class="product-detail-main">
        <div class="product-name">${escapeHtml(product.name || "-")}</div>
        <div class="detail-list">
          <div class="detail-row"><strong>UID</strong><span>${escapeHtml(product.uid || "-")}</span></div>
          <div class="detail-row"><strong>Legacy</strong><span>${escapeHtml(product.legacy_id || "-")}</span></div>
          <div class="detail-row"><strong>攻击 / 血量</strong><span>${Number(product.attack_value || 0)} / ${Number(product.hp_value || 0)}</span></div>
          <div class="detail-row"><strong>主词条</strong><span>${escapeHtml(product.main_attrs || "-")}</span></div>
          <div class="detail-row"><strong>额外词条</strong><span>${escapeHtml(product.ext_attrs || "-")}</span></div>
          <div class="detail-row"><strong>库存 / 状态</strong><span>${Number(product.stock || 0)} / ${escapeHtml(product.status || "-")}</span></div>
        </div>
        ${renderPricingSummary(product, pricingMeta)}
      </div>
    </div>
    <div class="detail-list">
      <div class="card-title">原始商品快照</div>
      <pre class="admin-detail-pre">${escapeHtml(JSON.stringify(rawSnapshot, null, 2))}</pre>
    </div>
  `;
  adminProductModal.classList.remove("hidden");
}

export function closeProductModalView(context) {
  const { refs } = context;
  const { adminProductModal, adminProductModalBody } = refs;
  if (!adminProductModal || !adminProductModalBody) return;
  adminProductModal.classList.add("hidden");
  adminProductModalBody.innerHTML = "";
}

export function renderCatalogSection(context) {
  renderCatalogProductsSection(context, context.getFilteredProducts());
}
