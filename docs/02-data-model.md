# 02 数据模型

## users

- `id`
- `role`: `user / admin`
- `status`: `active / disabled`
- `auth_provider`: `bind / password`
- `game_role_id`
- `game_server`
- `game_role_name`
- `bind_token_id`
- `nickname`
- `password_hash`
- `created_at`
- `updated_at`

说明：
- 登录唯一键是 `game_role_id + game_server`
- `bind_token_id` 只保存 helper 侧关联标识，不保存完整原始 token
- 密码登录用户当前固定使用 `game_server='direct'`
- `password_hash` 只保存哈希，不回传前端

## product_imports

- `id`
- `source_type`: `upload / helper_bridge`
- `source_file_name`
- `raw_json`
- `imported_by`
- `created_at`

说明：
- 保存导入来源，便于追溯某批卡片来自哪次导入

## products

- `id`
- `import_id`
- `legacy_id`
- `uid`
- `name`
- `image_url`
- `attack_value`
- `hp_value`
- `main_attrs`
- `ext_attrs`
- `price_quota`
- `manual_price_quota`
- `pricing_meta`
- `stock`
- `status`: `draft / on_sale / off_sale / sold`
- `created_at`
- `updated_at`

说明：
- `products` 只表示单卡商品
- `price_quota` 是最终售卖价
- `manual_price_quota` 为人工覆盖价，`null` 时使用自动价
- `pricing_meta` 保存自动定价解释，至少包含：
  - `version`
  - `source`: `auto / manual`
  - `tier`
  - `floor_price`
  - `reference_caps`
  - `reference_source`: `catalog_config / observed_fallback`
  - `atlas`
  - `wear`
  - `market`
  - `auto_base_price`
  - `auto_price`
  - `manual_price`
  - `dominant_reason`
  - `dominant_reason_label`

## bundle_skus

- `id`
- `code`
- `name`
- `description`
- `image_url`
- `tags`
- `price_quota`
- `stock`
- `status`: `on_sale / off_sale / sold`
- `display_rank`
- `created_at`
- `updated_at`

说明：
- `bundle_skus` 用于全图鉴、双词条包、珍至尊这类套餐商品
- 套餐不参与单卡自动定价
- `stock = null` 表示不限量

## user_quota_accounts

- `user_id`
- `balance`
- `updated_at`

说明：
- 这里只记录当前余额
- 历史变更放在 `quota_logs`

## quota_logs

- `id`
- `user_id`
- `change_amount`
- `type`: `admin_add / admin_subtract / order_deduct / order_refund`
- `order_id`
- `remark`
- `created_at`

## orders

- `id`
- `user_id`
- `total_quota`
- `status`: `pending / confirmed / cancelled`
- `remark`
- `created_at`
- `updated_at`

说明：
- 当前订单允许购买单卡或套餐
- `total_quota` 先按单商品 MVP 设计，后续再扩展购物车

## order_items

- `id`
- `order_id`
- `item_kind`: `card / bundle`
- `product_id`
- `bundle_sku_id`
- `product_name`
- `product_snapshot`
- `price_quota`
- `created_at`

说明：
- `item_kind='card'` 时使用 `product_id`
- `item_kind='bundle'` 时使用 `bundle_sku_id`
- 订单始终保存下单时的商品快照和成交价，避免后续改价影响历史订单

## audit_logs

- `id`
- `actor_user_id`
- `target_type`: `product / user / order / import`
- `target_id`
- `action`
- `detail`
- `created_at`

## 官方参考配置

配置文件：`backend/src/config/catalog-config.js`

当前包含两类业务配置：
- `LEGACY_CAPS`
  - 每个 `legacy_id` 的理论满攻击、满血量、满走火总值、满气定总值
  - 自动定价优先使用该表，不再以“当前导入数据里的最大值”作为主参考
- `BUNDLE_SKU_SEEDS`
  - 套餐 SKU 的初始编码、名称、标签、价格、库存和展示顺序

## 关系

- 一个 `product_imports` 可导入多个 `products`
- 一个 `users` 对应一个 `user_quota_accounts`
- 一个 `orders` 包含多个 `order_items`
- 一个 `orders` 可对应多条 `quota_logs`
- 一个 `bundle_skus` 可被多个 `order_items` 引用

## 定价约束

- 单卡自动定价始终不能低于分解底价
- 套餐 SKU 使用固定价，不进入单卡自动定价公式
- 人工价优先于自动价，但自动价解释仍保留在 `pricing_meta`
- 卡片导入、订单创建、订单取消后都需要重算单卡自动价
