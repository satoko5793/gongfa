# 19 第一期开发进度日志

更新时间：2026-04-01

## 目标

这份日志用于记录第一期重构的实时推进情况，避免“改了很多，但不知道当前做到哪、测到哪”。

当前主线对应文档：

- [17-claude-code-reference-optimization.md](17-claude-code-reference-optimization.md)
- [18-iteration-1-execution-plan.md](18-iteration-1-execution-plan.md)

## 当前迭代范围

先处理 `orders` 主链路，不同时大改前端和 `admin`。

本轮计划：

1. 建立 `orders` 模块骨架
2. 迁移下单 / 取消申请 / 订单详情
3. 建立第一版回归清单

## 进度记录

### 2026-04-01 订单模块第一轮拆分

已完成：

- 新增 `backend/src/modules/orders/`
- 新增 `orders/service.js`
- 新增 `orders/repository.js`
- 新增 `orders/policy.js`
- 新增 `orders/mapper.js`
- 新增 `orders/validators.js`
- 新增 `backend/src/repositories/file/orders-repository.js`
- 新增 `backend/src/repositories/pg/orders-repository.js`
- 新增 `backend/src/domain/order-status.js`
- `routes/orders.js` 开始改为调用模块 service

本轮目标：

- 不改接口路径
- 不改前端调用方式
- 先把主链路从路由里搬出去

待做：

- 继续处理 `admin` 中的订单处理和充值审核
- 抽订单相关校验的剩余过渡引用
- 收敛 `useFileStore()` 到更明确的 adapter 装配点

### 2026-04-01 admin 订单写操作第一轮拆分

已完成：

- 新增 `backend/src/modules/admin/orders/`
- 新增 `backend/src/modules/admin/orders/service.js`
- 新增 `backend/src/modules/admin/orders/repository.js`
- 新增 `backend/src/repositories/file/admin-orders-repository.js`
- 新增 `backend/src/repositories/pg/admin-orders-repository.js`
- `routes/admin.js` 中以下写操作改为调用模块 service
  - `PATCH /admin/recharge-orders/:id/review`
  - `PATCH /admin/orders/:id/status`
  - `PATCH /admin/orders/:id/remark`

本轮目标：

- 先把高风险的后台订单写操作从超长路由文件里拆出去
- 保持接口路径和响应格式尽量稳定
- 保留 file-store / pg 双模式切换

## 测试记录

本轮要求至少记录：

- 语法检查是否通过
- 本地接口冒烟是否通过
- 是否影响正式服 / 测试服

当前状态：

- 已完成首轮本地真实冒烟，结果如下

### 2026-04-01 本地冒烟实测（临时 file-store 数据）

测试方式：

- 基于 `backend/dev-data.json` 复制一份临时数据到 `/tmp/gongfa-dev-store-iteration1.json`
- 使用 `USE_FILE_STORE=1 DEV_STORE_DATA_PATH=/tmp/gongfa-dev-store-iteration1.json JWT_SECRET=dev-secret`
- 本轮测试只污染临时数据，不作为正式本地演示数据

已通过：

- `node --check` 通过
  - `backend/src/routes/orders.js`
  - `backend/src/services/validate.js`
  - `backend/src/modules/orders/*.js`
  - `backend/src/repositories/file/orders-repository.js`
  - `backend/src/repositories/pg/orders-repository.js`
  - `backend/src/domain/order-status.js`
- `git diff --check` 通过
- `GET /health` 返回 `{"ok":true}`
- 用户密码登录成功
  - 测试账号：`900000001 / test123456`
- `POST /orders` 下单成功
  - 测试商品：`product_id=156`
  - 返回订单 `id=4`
- `GET /orders/:id` 订单详情成功
  - 验证订单 `id=4`
- `POST /orders/:id/cancel-request` 取消申请成功
  - 订单状态从 `pending` 变为 `cancel_requested`
- `POST /orders/draw-service` 代抽服务单成功
  - 测试额度：`200`
  - 返回订单 `id=5`
- `POST /orders/guest-transfer` 游客转账锁卡成功
  - 测试商品：`product_id=156`
  - 支付渠道：`alipay_qr`
  - 校验通过金额：`0.14`
  - 返回订单 `id=6`
- `admin orders service` 服务级冒烟通过（临时 file-store 数据）
  - `updateOrderRemark()` 成功
  - `updateOrderStatus()` 成功将订单改为 `cancelled`
  - `reviewRechargeOrder()` 成功将充值单改为 `approved`

本轮发现：

- 直接拿已售或不可售商品做下单测试时，会返回 `product_not_on_sale`
  - 这次不是拆分引入的问题，是测试脚本第一次选到的低价商品已经不在售
- 游客锁卡对 `amount_yuan` 有严格匹配
  - 金额不对会返回 `amount_yuan_mismatch`
  - 这是现有业务规则，拆分后行为保持一致
- 管理端当前只完成第一轮服务抽离
  - 路由层校验和部分列表查询还在 `routes/admin.js`
  - 下一轮需要继续把查询和更多审核逻辑拆开

未测：

- `admin` 端订单审核 / 取消审核
- `admin` 端 HTTP 级真实登录冒烟
- 充值审核链路
- 数据库模式下的 `orders` 主链路
- 数据库模式下的 `admin` 订单写操作

下一步：

- 继续拆 `admin` 中订单列表 / 充值列表等查询逻辑
- 补一轮 `admin` HTTP 级冒烟
- 继续把 `orders` 周边的过渡依赖收拢到模块边界内

### 2026-04-02 admin 查询链路第二轮拆分

已完成：

- 新增 `backend/src/modules/admin/queries/`
- 新增 `queries/service.js`
- 新增 `queries/repository.js`
- 新增 `backend/src/repositories/file/admin-queries-repository.js`
- 新增 `backend/src/repositories/pg/admin-queries-repository.js`
- `routes/admin.js` 中以下读接口改为调用模块 service
  - `GET /admin/orders`
  - `GET /admin/recharge-orders`
  - `GET /admin/quota-logs`

本轮目标：

- 把后台最常用的列表查询从超长路由文件里迁出去
- 保持接口路径、分页结构、响应字段不变
- 继续保留 file-store / pg 双模式切换

待做：

- 继续拆 `admin` 的 `users / products / audit-logs` 查询链路
- 视情况把 `recharge-config` 读取也并入 admin query service
- 开始补数据库模式下的查询冒烟

### 2026-04-02 admin 查询接口 HTTP 冒烟

测试方式：

- 基于 `backend/dev-data.json` 复制一份临时数据到 `/tmp/gongfa-dev-store-iteration1-admin-queries.json`
- 使用 `PORT=18180 USE_FILE_STORE=1 DEV_STORE_DATA_PATH=/tmp/gongfa-dev-store-iteration1-admin-queries.json JWT_SECRET=dev-secret`
- 使用临时签发的管理员 token 调用 `admin` 读接口

已通过：

- `node --check` 通过
  - `backend/src/routes/admin.js`
  - `backend/src/modules/admin/queries/*.js`
  - `backend/src/repositories/file/admin-queries-repository.js`
  - `backend/src/repositories/pg/admin-queries-repository.js`
- `git diff --check` 通过
- `GET /admin/orders?page=1&page_size=2` 返回 `200`
- `GET /admin/recharge-orders?page=1&page_size=2` 返回 `200`
- `GET /admin/quota-logs?page=1&page_size=2` 返回 `200`
- 三个接口的分页结构保持一致
  - `items / total / page / page_size / total_pages / has_more`

本轮发现：

- 临时 file-store 数据里 `recharge_orders` 和 `quota_logs` 当前为空
  - 所以本轮验证的是接口连通性和返回结构
  - 不是对丰富数据场景的完整人工核对

未测：

- 数据库模式下 `GET /admin/orders`
- 数据库模式下 `GET /admin/quota-logs`
- 数据库模式下 `GET /admin/recharge-orders` 仍按现状返回 `501`

### 2026-04-02 admin 查询链路第三轮拆分

已完成：

- `backend/src/modules/admin/queries/` 继续扩展
- `backend/src/repositories/file/admin-queries-repository.js` 补充用户 / 商品 / 审计日志读取
- `backend/src/repositories/pg/admin-queries-repository.js` 补充用户 / 商品 / 审计日志读取
- `routes/admin.js` 中以下读接口改为调用模块 service
  - `GET /admin/products`
  - `GET /admin/users`
  - `GET /admin/audit-logs`
- `routes/admin.js` 中已不再保留本轮查询链路专用分页 helper

本轮目标：

- 继续把后台常用读接口从超长路由文件里移出
- 保持已有响应结构稳定
- 让 `admin` 查询逻辑开始集中到单独模块中

待做：

- 继续评估 `bundles / recharge-config` 是否并入 admin query service
- 继续拆分 `products / users` 的后台写操作
- 开始考虑为 admin 查询模块补专门的单元测试或脚本化回归

### 2026-04-02 admin 产品/用户/审计接口 HTTP 冒烟

测试方式：

- 基于 `backend/dev-data.json` 复制一份临时数据到 `/tmp/gongfa-dev-store-iteration1-admin-queries-v2.json`
- 使用 `PORT=18181 USE_FILE_STORE=1 DEV_STORE_DATA_PATH=/tmp/gongfa-dev-store-iteration1-admin-queries-v2.json JWT_SECRET=dev-secret`
- 使用临时签发的管理员 token 调用 `admin` 读接口

已通过：

- `GET /admin/products` 返回 `200`
- `GET /admin/users` 返回 `200`
- `GET /admin/audit-logs?page=1&page_size=2` 返回 `200`
- `admin/audit-logs` 分页结构保持一致
- `admin/products` 与 `admin/users` 继续保持数组返回

本轮发现：

- 当前临时数据里 `products / users / audit-logs` 都有真实内容
  - 因此本轮不仅验证了接口连通性，也验证了基本字段返回

未测：

- 数据库模式下 `GET /admin/products`
- 数据库模式下 `GET /admin/users`
- 数据库模式下 `GET /admin/audit-logs`

### 2026-04-02 admin 商品与用户写操作第三轮拆分

已完成：

- 新增 `backend/src/modules/admin/catalog/`
- 新增 `catalog/service.js`
- 新增 `catalog/repository.js`
- 新增 `backend/src/repositories/file/admin-catalog-repository.js`
- 新增 `backend/src/repositories/pg/admin-catalog-repository.js`
- 新增 `backend/src/modules/admin/users/`
- 新增 `users/service.js`
- 新增 `users/repository.js`
- 新增 `backend/src/repositories/file/admin-users-repository.js`
- 新增 `backend/src/repositories/pg/admin-users-repository.js`
- `routes/admin.js` 中以下写接口改为调用模块 service
  - `PATCH /admin/products/bulk-status`
  - `PATCH /admin/products/bulk-update`
  - `PATCH /admin/products/:id`
  - `DELETE /admin/products/:id/manual-price`
  - `PATCH /admin/products/:id/status`
  - `PATCH /admin/users/:id/quota`
  - `PATCH /admin/users/:id/status`

本轮目标：

- 把后台最常改、最容易引入回归的商品/用户写操作从路由里抽出
- 保持接口路径、返回结构、错误码尽量稳定
- 继续保留 file-store / pg 双模式切换

待做：

- 继续拆 `bundles` 相关写操作
- 继续拆 `recharge-config` 写操作
- 评估是否把导入卡包链路也做同样模块化

### 2026-04-02 admin 商品/用户写接口 HTTP 冒烟

测试方式：

- 基于 `backend/dev-data.json` 复制一份临时数据到 `/tmp/gongfa-dev-store-iteration1-admin-writes.json`
- 使用 `PORT=18182 USE_FILE_STORE=1 DEV_STORE_DATA_PATH=/tmp/gongfa-dev-store-iteration1-admin-writes.json JWT_SECRET=dev-secret`
- 使用临时签发的管理员 token 调用写接口

已通过：

- `PATCH /admin/products/:id/status` 返回 `200`
- `PATCH /admin/products/bulk-update` 返回 `200`
- `PATCH /admin/users/:id/quota` 返回 `200`
- `PATCH /admin/users/:id/status` 返回 `200`
- 商品状态修改后仍返回完整商品结构
- 用户状态修改后仍返回带额度信息的用户结构

本轮发现：

- 当前 `bulk-update` 路由仍保留“空 patch 拦截”和输入校验在路由层
  - 这是有意保留的过渡状态
  - 目的是先把写操作搬出路由，再决定哪些校验下沉到模块层

未测：

- 数据库模式下商品写操作 HTTP 冒烟
- 数据库模式下用户写操作 HTTP 冒烟
- `DELETE /admin/products/:id/manual-price` HTTP 级真实回归
- `PATCH /admin/products/:id` HTTP 级真实回归

### 2026-04-02 admin 套餐与充值配置链路拆分

已完成：

- 新增 `backend/src/modules/admin/bundles/`
- 新增 `bundles/service.js`
- 新增 `bundles/repository.js`
- 新增 `backend/src/repositories/file/admin-bundles-repository.js`
- 新增 `backend/src/repositories/pg/admin-bundles-repository.js`
- 新增 `backend/src/modules/admin/recharge-config/`
- 新增 `recharge-config/service.js`
- 新增 `recharge-config/repository.js`
- 新增 `backend/src/repositories/file/admin-recharge-config-repository.js`
- 新增 `backend/src/repositories/pg/admin-recharge-config-repository.js`
- `routes/admin.js` 中以下接口改为调用模块 service
  - `GET /admin/bundles`
  - `PATCH /admin/bundles/:id`
  - `PATCH /admin/bundles/:id/status`
  - `GET /admin/recharge-config`
  - `PATCH /admin/recharge-config`

本轮目标：

- 把套餐与充值配置从 `admin.js` 继续抽离
- 保持 file-store / pg 双模式兼容
- 让后台主要“读 + 写”链路都开始沉淀到模块层

待做：

- 继续评估 `imports/cards-json` 是否纳入同样分层
- 继续考虑 `pricing/recalculate` 是否也应下沉到 admin service
- 进入本期收尾前，补一次更系统的回归

### 2026-04-02 admin 套餐/充值配置 HTTP 冒烟

测试方式：

- 基于 `backend/dev-data.json` 复制一份临时数据到 `/tmp/gongfa-dev-store-iteration1-admin-bundles-recharge.json`
- 使用 `PORT=18183 USE_FILE_STORE=1 DEV_STORE_DATA_PATH=/tmp/gongfa-dev-store-iteration1-admin-bundles-recharge.json JWT_SECRET=dev-secret`
- 使用临时签发的管理员 token 调用套餐与充值配置接口

已通过：

- `GET /admin/bundles` 返回 `200`
- `PATCH /admin/bundles/:id` 返回 `200`
- `PATCH /admin/bundles/:id/status` 返回 `200`
- `GET /admin/recharge-config` 返回 `200`
- `PATCH /admin/recharge-config` 返回 `200`

本轮发现：

- `recharge-config` 在 file-store 模式下更新后会立即重新触发商品重定价
  - 这是现有行为
  - 这轮拆分保持不变

未测：

- 数据库模式下 `GET /admin/bundles`
- 数据库模式下 `PATCH /admin/bundles/:id`
- 数据库模式下 `PATCH /admin/bundles/:id/status`
- 数据库模式下 `GET /admin/recharge-config`
- 数据库模式下 `PATCH /admin/recharge-config` 仍按现状返回 `501`

### 2026-04-02 admin 导入与价格重算链路拆分

已完成：

- 新增 `backend/src/modules/admin/imports/`
- 新增 `imports/service.js`
- 新增 `imports/repository.js`
- 新增 `backend/src/repositories/file/admin-imports-repository.js`
- 新增 `backend/src/repositories/pg/admin-imports-repository.js`
- 新增 `backend/src/modules/admin/pricing/`
- 新增 `pricing/service.js`
- 新增 `pricing/repository.js`
- 新增 `backend/src/repositories/file/admin-pricing-repository.js`
- 新增 `backend/src/repositories/pg/admin-pricing-repository.js`
- `routes/admin.js` 中以下接口改为调用模块 service
  - `POST /admin/imports/cards-json`
  - `POST /admin/pricing/recalculate`

本轮目标：

- 收掉 `admin` 剩余的核心高风险写链路
- 让第一期后端 admin 主链路基本完成模块化
- 保持现有接口协议和行为尽量稳定

待做：

- 继续整理 `admin.js` 残余逻辑，评估拍卖模块是否进入下一期
- 开始准备把本期重构切成干净提交
- 视需要把数据库模式回归补全

### 2026-04-02 admin 导入/价格重算 HTTP 冒烟

测试方式：

- 基于 `backend/dev-data.json` 复制一份临时数据到 `/tmp/gongfa-dev-store-iteration1-admin-imports-pricing.json`
- 使用 `PORT=18184 USE_FILE_STORE=1 DEV_STORE_DATA_PATH=/tmp/gongfa-dev-store-iteration1-admin-imports-pricing.json JWT_SECRET=dev-secret`
- 使用临时签发的管理员 token 调用导入与重算接口
- 导入样本直接复用临时数据里已有 `productImports[0].raw_json`

已通过：

- `POST /admin/pricing/recalculate` 返回 `200`
- `POST /admin/imports/cards-json` 返回 `200`
- 导入返回 `import + parsed_count` 结构保持不变

本轮发现：

- 导入链路对 `source_type` 仍有严格校验
  - 当前只接受 `upload / helper_bridge`
  - 这轮先保持原行为不变

未测：

- 数据库模式下 `POST /admin/imports/cards-json`
- 数据库模式下 `POST /admin/pricing/recalculate`

### 2026-04-02 admin 路由统一收尾

已完成：

- 新增 `backend/src/modules/admin/external-orders/`
- 新增 `backend/src/modules/admin/auctions/`
- 新增 `backend/src/repositories/file/admin-external-orders-repository.js`
- 新增 `backend/src/repositories/pg/admin-external-orders-repository.js`
- 新增 `backend/src/repositories/file/admin-auctions-repository.js`
- 新增 `backend/src/repositories/pg/admin-auctions-repository.js`
- `routes/admin.js` 中以下接口改为调用模块 service
  - `POST /admin/orders/external`
  - `GET /admin/auctions`
  - `POST /admin/auctions`
  - `POST /admin/auctions/:id/settle`
  - `POST /admin/auctions/:id/cancel`
- 清理了 `admin.js` 中已不再需要的旧依赖

本轮结果：

- `backend/src/routes/admin.js` 已从重构前的超长实现继续压缩
- 当前文件行数已降到约 `418` 行
- 目前主要承担路由绑定、参数校验和调用模块 service

### 2026-04-02 admin 收尾冒烟

测试方式：

- 基于 `backend/dev-data.json` 复制一份临时数据到 `/tmp/gongfa-dev-store-iteration1-admin-finalize.json`
- 使用 `PORT=18185 USE_FILE_STORE=1 DEV_STORE_DATA_PATH=/tmp/gongfa-dev-store-iteration1-admin-finalize.json JWT_SECRET=dev-secret`
- 使用临时签发的管理员 token 调用剩余收尾链路

已通过：

- `GET /admin/auctions?status=all` 返回 `200`
- `POST /admin/orders/external` 返回 `200`

本轮发现：

- file-store 测试数据里当前没有活跃拍卖
  - 因此 `admin/auctions` 返回空数组
  - 这次主要验证的是链路和响应结构
