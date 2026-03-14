const express = require("express");
const { pool } = require("../db/pool");
const { useFileStore } = require("../services/runtime");
const { ensureBundleSeeds } = require("../services/bundle-catalog");
const devStore = require("../services/dev-store");

const productsRouter = express.Router();

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
