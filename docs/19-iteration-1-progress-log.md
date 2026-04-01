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
