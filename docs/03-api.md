# 03 API

## Auth

- `POST /auth/register`
  - 用游戏 ID + 密码注册并直接建立登录态
  - body: `game_role_id`, `password`, `nickname?`
- `POST /auth/login`
  - 用游戏 ID + 密码登录
  - body: `game_role_id`, `password`
- `POST /auth/game/bind`
  - 绑定游戏账号并建立登录态
  - body: `game_role_id`, `game_server`, `game_role_name`, `bind_token_id`, `nickname`
- `GET /auth/me`
  - 获取当前登录用户
- `POST /auth/logout`
  - 当前版本主要由前端清理本地登录态

## Products

- `GET /products`
  - 返回前台可见商品列表
  - 同时包含：
    - 单卡商品 `item_kind='card'`
    - 套餐商品 `item_kind='bundle'`
  - query:
    - `keyword`: 搜索名称、UID、词条、套餐说明、套餐标签
    - `sort`: 后端基础排序键
- `GET /products/:id`
  - 返回商品详情
  - query:
    - `item_kind`: `card / bundle`

返回字段补充：
- `item_kind`
- `item_id`
- `pricing_meta`

## Me

- `GET /me/quota`
  - 当前用户额度余额
- `GET /me/orders`
  - 当前用户订单列表

## Orders

- `POST /orders`
  - 创建订单
  - body:
    - `item_id`
    - `item_kind`: `card / bundle`
  - 兼容旧参数：
    - `product_id`
- `GET /orders/:id`
  - 查看单个订单详情

## Admin Imports

- `POST /admin/imports/cards-json`
  - 导入卡片 JSON
  - body: `source_type`, `source_file_name`, `raw_json`
  - 导入后会自动：
    - 去重合并
    - 默认上架
    - 重算单卡定价

## Admin Products

- `GET /admin/products`
  - 单卡商品列表
- `PATCH /admin/products/bulk-status`
  - 批量更新状态
  - body: `product_ids`, `status`
- `PATCH /admin/products/bulk-update`
  - 批量更新价格或库存
  - body: `product_ids`, `price_quota`, `stock`
  - `price_quota` 会写入手动覆盖价
- `PATCH /admin/products/:id`
  - 更新名称、图片、属性文本、库存、手动价格
- `PATCH /admin/products/:id/status`
  - 更新状态：`draft / on_sale / off_sale / sold`
- `DELETE /admin/products/:id/manual-price`
  - 清除手动覆盖价，恢复自动定价

## Admin Bundles

- `GET /admin/bundles`
  - 套餐 SKU 列表
  - PostgreSQL 模式下会自动补齐缺失的默认套餐种子
- `PATCH /admin/bundles/:id`
  - 更新套餐信息
  - body 可包含：
    - `name`
    - `description`
    - `image_url`
    - `tags`
    - `price_quota`
    - `stock`
    - `display_rank`
- `PATCH /admin/bundles/:id/status`
  - 更新套餐状态：`on_sale / off_sale / sold`

## Admin Pricing

- `POST /admin/pricing/recalculate`
  - 立即重算全部单卡商品自动价格

## Admin Users

- `GET /admin/users`
  - 用户列表和额度信息
- `PATCH /admin/users/:id/quota`
  - 调整额度
  - body: `change_amount`, `remark`
- `PATCH /admin/users/:id/status`
  - 禁用或启用用户

## Admin Orders

- `GET /admin/orders`
  - 订单列表
  - query:
    - `status`: `pending / confirmed / cancelled / all`
    - `keyword`: 支持订单号、角色名、角色 ID、区服、商品名、套餐 ID 搜索
    - `limit`: 返回数量上限，默认 `200`
- `PATCH /admin/orders/:id/status`
  - 更新订单状态：`pending / confirmed / cancelled`
  - body: `status`, `remark`
  - 取消订单时会自动：
    - 退回额度
    - 返还单卡或套餐库存
    - 重算单卡自动价格
- `PATCH /admin/orders/:id/remark`
  - 单独保存履约备注
  - body: `remark`

## Admin Audit

- `GET /admin/audit-logs`
  - 最新操作日志

## 权限规则

- `/products/*` 对游客开放，只返回已上架商品
- `/auth/me`、`/me/*`、`/orders/*` 仅限已登录用户
- `/admin/*` 仅限管理员

## 关键约束

- 创建订单时同时校验：用户状态、商品状态、库存、额度余额
- `item_kind='bundle'` 时走套餐 SKU 库存和固定价
- `item_kind='card'` 时走单卡库存和自动/手动价
- 套餐 SKU 不参与单卡自动定价，但会参与订单和额度流水
