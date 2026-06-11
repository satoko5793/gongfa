function normalizeStoreData(data, deps = {}) {
  const {
    defaultData,
    seedBundleSkus,
    ensureFixedAdminUser,
    removeLegacySeedJunk,
    normalizeLegacyCardNames,
    normalizeDiscountRate,
    normalizeRechargeConfig,
    getConfiguredCurrentSeasonScheduleId,
    buildCardSeasonMeta,
    parseSeasonScheduleId,
    now,
    normalizeAuctionStatus,
    refreshAuctionStatuses,
    backfillBeginnerGuideRewards,
    repriceStoreProducts,
    persistStoreData,
    priceConfig,
    normalizeHelperCapabilities,
  } = deps;

  const next = {
    ...defaultData(),
    ...data,
  };

  let changed = seedBundleSkus(next);
  if (ensureFixedAdminUser(next)) {
    changed = true;
  }
  if (removeLegacySeedJunk(next)) {
    changed = true;
  }
  if (normalizeLegacyCardNames(next)) {
    changed = true;
  }
  next.products = (next.products || []).map((product) => {
    const normalizedDiscountRate = normalizeDiscountRate(product?.discount_rate);
    const normalizedManualPrice =
      product?.manual_price_quota === undefined ? null : product.manual_price_quota;
    const normalized = {
      ...product,
      manual_price_quota: normalizedManualPrice,
      discount_rate: normalizedDiscountRate,
      pricing_meta:
        product?.pricing_meta && typeof product.pricing_meta === "object"
          ? product.pricing_meta
          : {},
    };
    if (product && product.status === "draft") {
      changed = true;
      normalized.status = "on_sale";
    }
    if (
      product?.manual_price_quota === undefined ||
      product?.discount_rate === undefined ||
      Number(product?.discount_rate) !== normalizedDiscountRate ||
      !product?.pricing_meta
    ) {
      changed = true;
    }
    if (
      normalizedManualPrice !== null &&
      normalizedManualPrice !== "" &&
      Number.isInteger(Number(normalizedManualPrice)) &&
      Number(product?.price_quota || 0) !== Number(normalizedManualPrice)
    ) {
      changed = true;
    }
    if (normalized.pricing_meta?.version !== priceConfig.version) {
      changed = true;
    }
    return normalized;
  });
  next.rechargeConfig = normalizeRechargeConfig(next.rechargeConfig || {});
  const currentSeasonScheduleId = getConfiguredCurrentSeasonScheduleId(next.rechargeConfig);
  next.products = (next.products || []).map((product) => {
    const seasonMeta = buildCardSeasonMeta({
      scheduleId: product?.schedule_id,
      currentScheduleId: currentSeasonScheduleId,
    });
    if (
      Number(product?.current_schedule_id || 0) !== Number(seasonMeta.current_schedule_id || 0) ||
      Boolean(product?.is_current_season) !== Boolean(seasonMeta.is_current_season) ||
      String(product?.season_tag || "") !== String(seasonMeta.season_tag || "") ||
      String(product?.season_label || "") !== String(seasonMeta.season_label || "") ||
      String(product?.season_display || "") !== String(seasonMeta.season_display || "")
    ) {
      changed = true;
    }
    return {
      ...product,
      ...seasonMeta,
    };
  });
  next.orderItems = (next.orderItems || []).map((item) => {
    if (item?.item_kind === undefined || item?.bundle_sku_id === undefined) {
      changed = true;
    }
    return {
      ...item,
      item_kind: item?.item_kind || "card",
      product_id: item?.product_id === undefined ? null : item.product_id,
      bundle_sku_id: item?.bundle_sku_id === undefined ? null : item.bundle_sku_id,
    };
  });
  next.users = (next.users || []).map((user) => {
    const normalized = {
      ...user,
      auth_provider: user?.auth_provider || "bind",
      password_hash: user?.password_hash || null,
      contact_info:
        user?.contact_info === undefined || user?.contact_info === null
          ? ""
          : String(user.contact_info).trim(),
      helper_capabilities: normalizeHelperCapabilities
        ? normalizeHelperCapabilities(user?.helper_capabilities)
        : Array.isArray(user?.helper_capabilities)
          ? user.helper_capabilities
          : [],
      beginner_guide_reward:
        user?.beginner_guide_reward && typeof user.beginner_guide_reward === "object"
          ? user.beginner_guide_reward
          : null,
    };
    if (
      !user?.auth_provider ||
      user?.password_hash === undefined ||
      user?.contact_info === undefined ||
      user?.helper_capabilities === undefined ||
      String((user?.helper_capabilities || []).join("|")) !== String((normalized.helper_capabilities || []).join("|")) ||
      user?.beginner_guide_reward === undefined
    ) {
      changed = true;
    }
    return normalized;
  });
  next.helperBindings = (next.helperBindings || []).map((binding) => ({
    id: Number(binding?.id || 0),
    user_id: Number(binding?.user_id || 0),
    game_role_id: String(binding?.game_role_id || "").trim(),
    game_server: String(binding?.game_server || "").trim(),
    game_role_name: String(binding?.game_role_name || "").trim(),
    bind_token_id:
      binding?.bind_token_id === undefined || binding?.bind_token_id === null
        ? null
        : String(binding.bind_token_id).trim() || null,
    nickname:
      binding?.nickname === undefined || binding?.nickname === null
        ? null
        : String(binding.nickname).trim() || null,
    helper_token:
      binding?.helper_token === undefined || binding?.helper_token === null
        ? null
        : String(binding.helper_token).trim() || null,
    helper_ws_url:
      binding?.helper_ws_url === undefined || binding?.helper_ws_url === null
        ? null
        : String(binding.helper_ws_url).trim() || null,
    helper_import_method:
      binding?.helper_import_method === undefined || binding?.helper_import_method === null
        ? null
        : String(binding.helper_import_method).trim() || null,
    bind_source: String(binding?.bind_source || "helper_wx_scan").trim() || "helper_wx_scan",
    bind_status: String(binding?.bind_status || "active").trim() || "active",
    created_at: binding?.created_at || now(),
    updated_at: binding?.updated_at || now(),
  }));
  next.helperInventories = (next.helperInventories || []).map((inventory) => ({
    id: Number(inventory?.id || 0),
    user_id: Number(inventory?.user_id || 0),
    binding_id:
      inventory?.binding_id === undefined || inventory?.binding_id === null
        ? null
        : Number(inventory.binding_id),
    source_type: String(inventory?.source_type || "helper_bridge").trim() || "helper_bridge",
    summary:
      inventory?.summary && typeof inventory.summary === "object" && !Array.isArray(inventory.summary)
        ? inventory.summary
        : {},
    items: Array.isArray(inventory?.items)
      ? inventory.items.map((item) => ({
          row_key:
            item?.row_key === undefined || item?.row_key === null
              ? ""
              : String(item.row_key).trim(),
          uid:
            item?.uid === undefined || item?.uid === null ? "" : String(item.uid).trim(),
          legacy_id: Number(item?.legacy_id || 0),
          display_name:
            item?.display_name === undefined || item?.display_name === null
              ? ""
              : String(item.display_name).trim(),
          attack_value: Number(item?.attack_value || 0),
          hp_value: Number(item?.hp_value || 0),
          main_attr_text:
            item?.main_attr_text === undefined || item?.main_attr_text === null
              ? ""
              : String(item.main_attr_text).trim(),
          ext_attr_text:
            item?.ext_attr_text === undefined || item?.ext_attr_text === null
              ? ""
              : String(item.ext_attr_text).trim(),
          has_ext: Boolean(item?.has_ext),
          is_locked: Boolean(item?.is_locked),
          max: Boolean(item?.max),
          image_url:
            item?.image_url === undefined || item?.image_url === null
              ? ""
              : String(item.image_url).trim(),
          schedule_id:
            item?.schedule_id === undefined || item?.schedule_id === null
              ? null
              : parseSeasonScheduleId(item.schedule_id),
          current_schedule_id:
            item?.current_schedule_id === undefined || item?.current_schedule_id === null
              ? null
              : parseSeasonScheduleId(item.current_schedule_id),
          is_current_season: Boolean(item?.is_current_season),
          season_label:
            item?.season_label === undefined || item?.season_label === null
              ? ""
              : String(item.season_label).trim(),
          season_display:
            item?.season_display === undefined || item?.season_display === null
              ? ""
              : String(item.season_display).trim(),
        }))
      : [],
    created_at: inventory?.created_at || now(),
    updated_at: inventory?.updated_at || now(),
  }));
  next.helperSnapshots = (next.helperSnapshots || []).map((snapshot) => ({
    id: Number(snapshot?.id || 0),
    user_id: Number(snapshot?.user_id || 0),
    binding_id:
      snapshot?.binding_id === undefined || snapshot?.binding_id === null
        ? null
        : Number(snapshot.binding_id),
    source_type: String(snapshot?.source_type || "helper_bridge").trim() || "helper_bridge",
    snapshot_name:
      snapshot?.snapshot_name === undefined || snapshot?.snapshot_name === null
        ? null
        : String(snapshot.snapshot_name).trim() || null,
    is_pinned: Boolean(snapshot?.is_pinned),
    summary:
      snapshot?.summary && typeof snapshot.summary === "object" && !Array.isArray(snapshot.summary)
        ? snapshot.summary
        : {},
    raw:
      snapshot?.raw && typeof snapshot.raw === "object" && !Array.isArray(snapshot.raw)
        ? snapshot.raw
        : {},
    created_at: snapshot?.created_at || now(),
    updated_at: snapshot?.updated_at || now(),
  }));
  next.helperActionLogs = (next.helperActionLogs || []).map((log) => ({
    id: Number(log?.id || 0),
    user_id: log?.user_id === undefined || log?.user_id === null ? null : Number(log.user_id),
    binding_id:
      log?.binding_id === undefined || log?.binding_id === null ? null : Number(log.binding_id),
    action_type: String(log?.action_type || "").trim(),
    action_payload:
      log?.action_payload && typeof log.action_payload === "object" ? log.action_payload : {},
    result_status: String(log?.result_status || "").trim() || "ok",
    result_payload:
      log?.result_payload && typeof log.result_payload === "object" ? log.result_payload : {},
    created_at: log?.created_at || now(),
  }));
  next.consignmentListings = (next.consignmentListings || []).map((listing) => ({
    id: Number(listing?.id || 0),
    seller_user_id: Number(listing?.seller_user_id || 0),
    seller_binding_id:
      listing?.seller_binding_id === undefined || listing?.seller_binding_id === null
        ? null
        : Number(listing.seller_binding_id),
    seller_display_name:
      listing?.seller_display_name === undefined || listing?.seller_display_name === null
        ? ""
        : String(listing.seller_display_name).trim(),
    seller_contact_info:
      listing?.seller_contact_info === undefined || listing?.seller_contact_info === null
        ? ""
        : String(listing.seller_contact_info).trim(),
    inventory_id: Number(listing?.inventory_id || 0),
    inventory_item_key: String(listing?.inventory_item_key || "").trim(),
    item_snapshot:
      listing?.item_snapshot && typeof listing.item_snapshot === "object" && !Array.isArray(listing.item_snapshot)
        ? listing.item_snapshot
        : {},
    price_yuan: Math.max(Number(listing?.price_yuan ?? listing?.price_quota ?? 0) || 0, 0),
    price_quota: Math.max(Number(listing?.price_quota ?? listing?.price_yuan ?? 0) || 0, 0),
    residual_price:
      listing?.residual_price === undefined || listing?.residual_price === null
        ? null
        : Math.max(Number(listing.residual_price) || 0, 0),
    payment_options: Array.isArray(listing?.payment_options) ? listing.payment_options : [],
    pricing_snapshot:
      listing?.pricing_snapshot && typeof listing.pricing_snapshot === "object" && !Array.isArray(listing.pricing_snapshot)
        ? listing.pricing_snapshot
        : {},
    reserved_trade_id:
      listing?.reserved_trade_id === undefined || listing?.reserved_trade_id === null
        ? null
        : Number(listing.reserved_trade_id),
    seller_remark:
      listing?.seller_remark === undefined || listing?.seller_remark === null
        ? ""
        : String(listing.seller_remark).trim(),
    status: String(listing?.status || "submitted").trim() || "submitted",
    reviewed_by:
      listing?.reviewed_by === undefined || listing?.reviewed_by === null ? null : Number(listing.reviewed_by),
    reviewed_at: listing?.reviewed_at || null,
    review_note:
      listing?.review_note === undefined || listing?.review_note === null ? "" : String(listing.review_note).trim(),
    created_at: listing?.created_at || now(),
    updated_at: listing?.updated_at || now(),
  }));
  next.escrowTrades = (next.escrowTrades || []).map((trade) => ({
    ...trade,
    id: Number(trade?.id || 0),
    consignment_listing_id: Number(trade?.consignment_listing_id || 0),
    buyer_user_id: Number(trade?.buyer_user_id || 0),
    seller_user_id: Number(trade?.seller_user_id || 0),
    payment_method: String(trade?.payment_method || "cash").trim() || "cash",
    amount: Number(trade?.amount || 0),
    payment_review_status:
      String(trade?.payment_review_status || "").trim() ||
      (String(trade?.payment_method || "").trim() === "quota" ? "auto_confirmed" : "manual_pending"),
    payment_review_source:
      String(trade?.payment_review_source || "").trim() ||
      (String(trade?.payment_method || "").trim() === "quota" ? "internal_quota" : "manual_admin"),
    payment_reviewed_by:
      trade?.payment_reviewed_by === undefined || trade?.payment_reviewed_by === null
        ? null
        : Number(trade.payment_reviewed_by),
    payment_reviewed_at: trade?.payment_reviewed_at || null,
    admin_note:
      trade?.admin_note === undefined || trade?.admin_note === null ? "" : String(trade.admin_note).trim(),
    status: String(trade?.status || "awaiting_payment_review").trim() || "awaiting_payment_review",
    settlement_status: String(trade?.settlement_status || "").trim(),
    created_at: trade?.created_at || now(),
    updated_at: trade?.updated_at || now(),
  }));
  next.escrowEvidence = (next.escrowEvidence || []).map((item) => ({
    ...item,
    id: Number(item?.id || 0),
    trade_id: Number(item?.trade_id || 0),
    user_id: Number(item?.user_id || 0),
    evidence_type: String(item?.evidence_type || "image").trim() || "image",
    url: String(item?.url || "").trim(),
    created_at: item?.created_at || now(),
  }));
  next.escrowLedger = (next.escrowLedger || []).map((entry) => ({
    ...entry,
    id: Number(entry?.id || 0),
    trade_id: Number(entry?.trade_id || 0),
    actor_user_id:
      entry?.actor_user_id === undefined || entry?.actor_user_id === null
        ? null
        : Number(entry.actor_user_id),
    action: String(entry?.action || "").trim(),
    detail: entry?.detail && typeof entry.detail === "object" ? entry.detail : {},
    created_at: entry?.created_at || now(),
  }));
  next.auctions = (next.auctions || []).map((auction) => {
    const normalizedStatus = normalizeAuctionStatus(auction?.status);
    const normalized = {
      ...auction,
      item_kind: "card",
      title: String(auction?.title || "").trim() || null,
      current_price_quota: Number(
        auction?.current_price_quota || auction?.starting_price_quota || 0
      ),
      current_bid_user_id:
        auction?.current_bid_user_id === undefined || auction?.current_bid_user_id === null
          ? null
          : Number(auction.current_bid_user_id),
      current_bid_at: auction?.current_bid_at || null,
      settled_order_id:
        auction?.settled_order_id === undefined || auction?.settled_order_id === null
          ? null
          : Number(auction.settled_order_id),
      settled_at: auction?.settled_at || null,
      cancelled_at: auction?.cancelled_at || null,
      cancelled_reason: auction?.cancelled_reason || null,
      winning_bid_amount:
        auction?.winning_bid_amount === undefined || auction?.winning_bid_amount === null
          ? null
          : Number(auction.winning_bid_amount),
      winning_bid_user_id:
        auction?.winning_bid_user_id === undefined || auction?.winning_bid_user_id === null
          ? null
          : Number(auction.winning_bid_user_id),
      product_snapshot:
        auction?.product_snapshot && typeof auction.product_snapshot === "object"
          ? auction.product_snapshot
          : null,
      status: normalizedStatus,
    };
    if (
      auction?.status !== normalizedStatus ||
      auction?.item_kind !== "card" ||
      auction?.product_snapshot === undefined
    ) {
      changed = true;
    }
    return normalized;
  });
  next.auctionBids = (next.auctionBids || []).map((bid) => {
    const normalized = {
      ...bid,
      amount_quota: Number(bid?.amount_quota || 0),
      auction_id: Number(bid?.auction_id || 0),
      user_id: Number(bid?.user_id || 0),
    };
    if (
      Number(bid?.amount_quota || 0) !== normalized.amount_quota ||
      Number(bid?.auction_id || 0) !== normalized.auction_id ||
      Number(bid?.user_id || 0) !== normalized.user_id
    ) {
      changed = true;
    }
    return normalized;
  });
  if (refreshAuctionStatuses(next)) {
    changed = true;
  }
  if (backfillBeginnerGuideRewards(next)) {
    changed = true;
  }

  if (changed) {
    repriceStoreProducts(next);
    persistStoreData(next);
  }

  return next;
}

module.exports = {
  normalizeStoreData,
};
