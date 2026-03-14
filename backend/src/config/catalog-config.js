const LEGACY_CAPS = {
  1: { attack_max: 500000, hp_max: 10000000, fire_total_max: 0, calm_total_max: 0 },
  2: { attack_max: 500000, hp_max: 10000000, fire_total_max: 0, calm_total_max: 0 },
  101: { attack_max: 1000000, hp_max: 20000000, fire_total_max: 0, calm_total_max: 0 },
  102: { attack_max: 1000000, hp_max: 20000000, fire_total_max: 0, calm_total_max: 0 },
  201: { attack_max: 2000000, hp_max: 40000000, fire_total_max: 0, calm_total_max: 0 },
  202: { attack_max: 2000000, hp_max: 40000000, fire_total_max: 0, calm_total_max: 0 },
  301: { attack_max: 5000000, hp_max: 100000000, fire_total_max: 0.5, calm_total_max: 0.5 },
  302: { attack_max: 5000000, hp_max: 100000000, fire_total_max: 0.5, calm_total_max: 0.5 },
  401: { attack_max: 8000000, hp_max: 160000000, fire_total_max: 1.8, calm_total_max: 1.8 },
  402: { attack_max: 8000000, hp_max: 160000000, fire_total_max: 1.8, calm_total_max: 1.8 },
  403: { attack_max: 8000000, hp_max: 160000000, fire_total_max: 1.8, calm_total_max: 1.8 },
  501: { attack_max: 10000000, hp_max: 200000000, fire_total_max: 3.0, calm_total_max: 3.0 },
};

const BUNDLE_SKU_SEEDS = [
  {
    code: "atlas_orange_and_below",
    name: "橙卡及以下图鉴",
    description: "用于补齐橙卡及以下图鉴，词条不计入套餐价值。",
    tags: ["图鉴", "橙卡及以下", "固定价"],
    price_quota: 1000,
    stock: null,
    status: "on_sale",
    display_rank: 10,
  },
  {
    code: "atlas_red_and_below",
    name: "红及以下图鉴",
    description: "用于补齐红卡及以下图鉴，优先满足图鉴需求。",
    tags: ["图鉴", "红及以下", "固定价"],
    price_quota: 3000,
    stock: null,
    status: "on_sale",
    display_rank: 20,
  },
  {
    code: "atlas_full_attack_set",
    name: "满攻击全套图鉴",
    description: "按满攻击标准提供整套图鉴，不强调词条。",
    tags: ["图鉴", "满攻击", "全套"],
    price_quota: 15000,
    stock: null,
    status: "on_sale",
    display_rank: 30,
  },
  {
    code: "atlas_high_attack_full_dex",
    name: "高攻全图鉴",
    description: "按高攻击目标提供整套图鉴，优先图鉴价值。",
    tags: ["图鉴", "高攻", "全图鉴"],
    price_quota: 80000,
    stock: null,
    status: "on_sale",
    display_rank: 40,
  },
];

const RETIRED_BUNDLE_CODES = ["double_term_bundle", "rare_supreme_single"];

module.exports = {
  LEGACY_CAPS,
  BUNDLE_SKU_SEEDS,
  RETIRED_BUNDLE_CODES,
};
