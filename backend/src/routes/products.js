const express = require("express");
const { pool } = require("../db/pool");
const { useFileStore } = require("../services/runtime");
const { ensureBundleSeeds } = require("../services/bundle-catalog");
const devStore = require("../services/dev-store");
const { getRechargeConfig } = require("../config/recharge-config");

const productsRouter = express.Router();

function normalizeRecentSalesLimit(value) {
  const limit = Number(value);
  if (!Number.isFinite(limit)) return 8;
  return Math.min(Math.max(Math.floor(limit), 1), 20);
}

function maskPublicBuyerLabel(order) {
  const nickname = String(order?.nickname || "").trim();
  const gameRoleName = String(order?.game_role_name || "").trim();
  const gameRoleId = String(order?.game_role_id || "").trim();
  const source = String(order?.order_source || "").trim();

  const maskName = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    if (/^\d+$/.test(trimmed)) {
      if (trimmed.length <= 4) return `${trimmed.slice(0, 1)}***`;
      return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
    }
    if (trimmed.length === 1) return `${trimmed}***`;
    if (trimmed.length === 2) return `${trimmed.slice(0, 1)}***`;
    return `${trimmed.slice(0, 2)}***`;
  };

  if (nickname) return maskName(nickname);
  if (gameRoleName) return maskName(gameRoleName);
  if (gameRoleId) return maskName(gameRoleId);
  if (source === "external") return "站外买家";
  return "匿名用户";
}

function getPublicOrderSourceLabel(order) {
  const source = String(order?.order_source || "mall").trim();
  if (source === "external") return "站外成交";
  if (source === "draw_service") return "代抽成交";
  return "商城成交";
}

function buildRecentSalesSummary(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length === 0) {
    return {
      item_title: String(order?.order_source || "").trim() === "draw_service" ? "代抽服务" : "已成交订单",
      item_kind_label: String(order?.order_source || "").trim() === "draw_service" ? "代抽" : "商品",
      item_count: 0,
    };
  }

  const firstItem = items[0];
  const firstName = String(firstItem?.product_name || "已成交商品").trim() || "已成交商品";
  const isDrawService = String(order?.order_source || "").trim() === "draw_service";
  const itemKindLabel =
    isDrawService
      ? "代抽"
      : String(firstItem?.item_kind || "").trim() === "bundle"
        ? "套餐"
        : "商品";

  return {
    item_title: items.length === 1 ? firstName : `${firstName} 等 ${items.length} 项`,
    item_kind_label: itemKindLabel,
    item_count: items.length,
  };
}

function getRecentSaleBuyerKey(order) {
  if (order?.user_id !== null && order?.user_id !== undefined && order?.user_id !== "") {
    return `user:${order.user_id}`;
  }
  const nickname = String(order?.nickname || "").trim();
  if (nickname) return `nickname:${nickname.toLowerCase()}`;
  const roleName = String(order?.game_role_name || "").trim();
  if (roleName) return `role:${roleName.toLowerCase()}`;
  const roleId = String(order?.game_role_id || "").trim();
  if (roleId) return `id:${roleId}`;
  const buyerLabel = String(order?.buyer_label || "").trim();
  if (buyerLabel) return `external:${buyerLabel.toLowerCase()}`;
  return `order:${order?.id || Math.random()}`;
}

function diversifyRecentSales(orders, limit) {
  const pool = Array.isArray(orders) ? orders.slice() : [];
  const selected = [];
  const buyerCounts = new Map();

  while (pool.length > 0 && selected.length < limit) {
    const previousKey =
      selected.length > 0 ? getRecentSaleBuyerKey(selected[selected.length - 1]) : null;
    let pickIndex = pool.findIndex((order) => {
      const key = getRecentSaleBuyerKey(order);
      return key !== previousKey && Number(buyerCounts.get(key) || 0) < 2;
    });
    if (pickIndex === -1) {
      pickIndex = pool.findIndex((order) => getRecentSaleBuyerKey(order) !== previousKey);
    }
    if (pickIndex === -1) {
      pickIndex = 0;
    }

    const [picked] = pool.splice(pickIndex, 1);
    const buyerKey = getRecentSaleBuyerKey(picked);
    buyerCounts.set(buyerKey, Number(buyerCounts.get(buyerKey) || 0) + 1);
    selected.push(picked);
  }

  return selected;
}

function mapPublicRecentSale(order) {
  const summary = buildRecentSalesSummary(order);
  return {
    id: Number(order.id),
    created_at: order.created_at,
    total_quota: Number(order.total_quota || 0),
    order_source: String(order?.order_source || "mall").trim() || "mall",
    order_source_label: getPublicOrderSourceLabel(order),
    buyer_label: maskPublicBuyerLabel(order),
    item_title: summary.item_title,
    item_kind_label: summary.item_kind_label,
    item_count: summary.item_count,
  };
}

productsRouter.get("/meta", async (req, res, next) => {
  try {
    const rechargeConfig = useFileStore()
      ? getRechargeConfig(devStore.getRechargeConfig())
      : getRechargeConfig();

    return res.json({
      recharge_config: {
        enabled: Boolean(rechargeConfig.enabled),
        exchange_yuan: Number(rechargeConfig.exchange_yuan || 0),
        exchange_quota: Number(rechargeConfig.exchange_quota || 0),
        quota_per_yuan: Number(rechargeConfig.quota_per_yuan || 0),
        min_amount_yuan: Number(rechargeConfig.min_amount_yuan || 0),
      },
    });
  } catch (error) {
    return next(error);
  }
});

productsRouter.get("/", async (req, res, next) => {
  try {
    if (useFileStore()) {
      return res.json(
        devStore.listProducts({
          keyword: req.query.keyword,
          sort: req.query.sort,
          publicOnly: true,
        })
      );
    }

    await ensureBundleSeeds(pool);
    const values = ["on_sale"];
    const cardWhere = ["p.status=$1"];
    const bundleWhere = ["b.status=$1"];

    if (req.query.keyword) {
      values.push(`%${String(req.query.keyword).trim()}%`);
      cardWhere.push(
        `(name ILIKE $${values.length} OR uid ILIKE $${values.length} OR main_attrs ILIKE $${values.length} OR ext_attrs ILIKE $${values.length})`
      );
      bundleWhere.push(
        `(b.name ILIKE $${values.length} OR COALESCE(b.description, '') ILIKE $${values.length} OR COALESCE(array_to_string(b.tags, ' '), '') ILIKE $${values.length})`
      );
    }

    const sortMap = {
      created_desc: "created_at DESC",
      price_asc: "price_quota ASC, created_at DESC",
      price_desc: "price_quota DESC, created_at DESC",
      attack_desc: "attack_value DESC, created_at DESC",
      hp_desc: "hp_value DESC, created_at DESC",
    };
    const sort = sortMap[req.query.sort] || sortMap.created_desc;

    const result = await pool.query(
      `SELECT *
       FROM (
         SELECT
          p.id,
          'card'::text AS item_kind,
          p.id AS item_id,
          p.legacy_id,
          p.uid,
          p.name,
          p.image_url,
          p.schedule_id,
          p.current_schedule_id,
          p.is_current_season,
          p.season_tag,
          p.season_label,
          p.season_display,
          p.attack_value,
          p.hp_value,
          p.main_attrs,
          p.ext_attrs,
          p.price_quota,
          p.stock,
          p.status,
          p.created_at,
          p.updated_at,
          p.pricing_meta,
          NULL::text AS description,
          NULL::text[] AS tags,
          NULL::text AS code,
          NULL::int AS display_rank
         FROM products p
         WHERE ${cardWhere.join(" AND ")}
         UNION ALL
         SELECT
          b.id,
          'bundle'::text AS item_kind,
          b.id AS item_id,
          0 AS legacy_id,
          b.code AS uid,
          b.name,
          b.image_url,
          NULL::int AS schedule_id,
          NULL::int AS current_schedule_id,
          FALSE AS is_current_season,
          'bundle'::text AS season_tag,
          '-'::text AS season_label,
          '套餐'::text AS season_display,
          0 AS attack_value,
          0 AS hp_value,
          COALESCE(b.description, '') AS main_attrs,
          COALESCE(array_to_string(b.tags, ' | '), '') AS ext_attrs,
          b.price_quota,
          b.stock,
          b.status,
          b.created_at,
          b.updated_at,
          jsonb_build_object('source', 'bundle', 'dominant_reason_label', '套餐固定价') AS pricing_meta,
          b.description,
          b.tags,
          b.code,
          b.display_rank
         FROM bundle_skus b
         WHERE ${bundleWhere.join(" AND ")}
       ) items
       ORDER BY ${sort}`,
      values
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

productsRouter.get("/recent-sales", async (req, res, next) => {
  try {
    const limit = normalizeRecentSalesLimit(req.query.limit);
    const fetchLimit = Math.max(limit * 4, 16);

    if (useFileStore()) {
      const items = diversifyRecentSales(
        devStore
          .listOrders({ status: "confirmed", limit: fetchLimit })
          .filter((order) => Array.isArray(order.items) && order.items.length > 0),
        limit
      ).map(mapPublicRecentSale);
      return res.json({ items, total: items.length });
    }

    const result = await pool.query(
      `SELECT
        o.id,
        o.user_id,
        o.total_quota,
        o.status,
        COALESCE(o.order_source, 'mall') AS order_source,
        COALESCE(o.buyer_label, '') AS buyer_label,
        o.created_at,
        u.game_role_id,
        COALESCE(u.game_role_name, '') AS game_role_name,
        COALESCE(u.nickname, '') AS nickname,
        json_agg(
          json_build_object(
            'item_kind', oi.item_kind,
            'product_name', oi.product_name,
            'price_quota', oi.price_quota
          )
          ORDER BY oi.id ASC
        ) FILTER (WHERE oi.id IS NOT NULL) AS items
       FROM orders o
       LEFT JOIN users u ON u.id=o.user_id
       LEFT JOIN order_items oi ON oi.order_id=o.id
       WHERE o.status='confirmed'
       GROUP BY o.id, o.user_id, o.buyer_label, u.game_role_id, u.game_role_name, u.nickname
       ORDER BY o.created_at DESC
       LIMIT $1`,
      [fetchLimit]
    );

    const items = diversifyRecentSales(result.rows, limit)
      .map((row) => mapPublicRecentSale(row))
      .filter((row) => row.item_count > 0);
    return res.json({ items, total: items.length });
  } catch (error) {
    return next(error);
  }
});

productsRouter.get("/:id", async (req, res, next) => {
  try {
    const itemKind = req.query.item_kind === "bundle" ? "bundle" : "card";
    if (useFileStore()) {
      const product = devStore.getProductById(req.params.id, { publicOnly: true, itemKind });
      if (!product) {
        return res.status(404).json({ error: "product_not_found" });
      }
      return res.json(product);
    }
    await ensureBundleSeeds(pool);
    if (itemKind === "bundle") {
      const result = await pool.query(
        `SELECT
          id,
          'bundle'::text AS item_kind,
          id AS item_id,
          0 AS legacy_id,
          code AS uid,
          name,
          image_url,
          NULL::int AS schedule_id,
          NULL::int AS current_schedule_id,
          FALSE AS is_current_season,
          'bundle'::text AS season_tag,
          '-'::text AS season_label,
          '套餐'::text AS season_display,
          0 AS attack_value,
          0 AS hp_value,
          COALESCE(description, '') AS main_attrs,
          COALESCE(array_to_string(tags, ' | '), '') AS ext_attrs,
          price_quota,
          stock,
          status,
          created_at,
          updated_at,
          jsonb_build_object('source', 'bundle', 'dominant_reason_label', '套餐固定价') AS pricing_meta,
          description,
          tags,
          code,
          display_rank
         FROM bundle_skus
         WHERE id=$1 AND status='on_sale'`,
        [req.params.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "product_not_found" });
      }

      return res.json(result.rows[0]);
    }
    const result = await pool.query(
      `SELECT
        id,
        'card'::text AS item_kind,
        id AS item_id,
        legacy_id,
        uid,
        name,
        image_url,
        schedule_id,
        current_schedule_id,
        is_current_season,
        season_tag,
        season_label,
        season_display,
        attack_value,
        hp_value,
        main_attrs,
        ext_attrs,
        price_quota,
        stock,
        status,
        created_at,
        updated_at,
        pricing_meta
       FROM products
       WHERE id=$1 AND status='on_sale'`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "product_not_found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

module.exports = { productsRouter };
