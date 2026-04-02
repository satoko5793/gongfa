# 20 第一期回归检查清单

## 使用方式

每完成一轮第一期重构，至少按下面清单回归一次。

## 基础

- 本地服务可启动
- `GET /health` 返回 `{"ok":true}`
- 前台首页可打开
- 后台首页可打开
- 推荐使用临时数据副本进行回归
  - 例如：`DEV_STORE_DATA_PATH=/tmp/gongfa-dev-store-iteration1.json`

## 用户与登录

- 用户注册成功
- 用户密码登录成功
- 管理员登录成功

## 订单主链路

- 用户下单成功
- 订单详情可查看
- 用户提交取消申请成功
- 后台能看到取消申请状态
- 后台确认订单成功
- 后台取消订单成功

## 充值主链路

- 用户提交充值申请成功
- 用户提交残卷转赠申请成功
- 后台审核充值成功
- 审核后额度变化正确

## 游客锁卡

- 游客转账锁卡成功
- 游客残卷锁卡成功
- 后台可以看到对应订单

## 风险记录

每次回归都应记录：

- 本轮改动范围
- 通过项
- 未测项
- 发现的问题

## 2026-04-01 已完成项

- 本地服务启动通过
- `GET /health` 通过
- 用户密码登录通过
- 用户下单通过
- 订单详情查看通过
- 用户取消申请通过
- 游客转账锁卡通过
- 代抽服务单通过
- 管理端服务级订单备注修改通过
- 管理端服务级订单取消通过
- 管理端服务级充值审核通过

## 2026-04-01 未完成项

- 前台首页人工打开未复测
- 后台首页人工打开未复测
- 管理员登录未复测
- 后台订单审核未复测
- 后台取消订单未复测
- 充值审核链路未复测
- 游客残卷锁卡未复测

## 2026-04-02 已完成项

- `admin` 查询链路第二轮拆分已落地
- `GET /admin/orders` HTTP 冒烟通过
- `GET /admin/recharge-orders` HTTP 冒烟通过
- `GET /admin/quota-logs` HTTP 冒烟通过
- 返回分页结构未变化

## 2026-04-02 未完成项

- `admin/users` 查询链路未拆
- `admin/products` 查询链路未拆
- `admin/audit-logs` 查询链路未拆
- 数据库模式下的 `admin` 查询冒烟未复测

## 2026-04-02 追加完成项

- `GET /admin/products` HTTP 冒烟通过
- `GET /admin/users` HTTP 冒烟通过
- `GET /admin/audit-logs` HTTP 冒烟通过
- `admin` 六条核心查询接口已迁入模块层

## 2026-04-02 追加未完成项

- `bundles` 查询链路尚未并入 admin query service
- `recharge-config` 查询链路尚未并入 admin query service
- 数据库模式下 `products / users / audit-logs` 未复测

## 2026-04-02 写操作追加完成项

- `admin` 商品写操作第一轮模块化已落地
- `admin` 用户写操作第一轮模块化已落地
- 商品状态修改 HTTP 冒烟通过
- 商品批量更新 HTTP 冒烟通过
- 用户额度调整 HTTP 冒烟通过
- 用户状态修改 HTTP 冒烟通过

## 2026-04-02 写操作追加未完成项

- `products/:id` 单商品完整更新未做 HTTP 级复测
- `products/:id/manual-price` 清除手动价未做 HTTP 级复测
- 数据库模式下商品/用户写操作未做 HTTP 级复测

## 2026-04-02 套餐与充值配置追加完成项

- `admin/bundles` 读写第一轮模块化已落地
- `admin/recharge-config` 读写第一轮模块化已落地
- `GET /admin/bundles` HTTP 冒烟通过
- `PATCH /admin/bundles/:id` HTTP 冒烟通过
- `PATCH /admin/bundles/:id/status` HTTP 冒烟通过
- `GET /admin/recharge-config` HTTP 冒烟通过
- `PATCH /admin/recharge-config` HTTP 冒烟通过

## 2026-04-02 套餐与充值配置追加未完成项

- 数据库模式下 `bundles` 链路未做 HTTP 级复测
- 数据库模式下 `recharge-config` 链路未做 HTTP 级复测

## 2026-04-02 导入与定价追加完成项

- `admin/imports` 第一轮模块化已落地
- `admin/pricing` 第一轮模块化已落地
- `POST /admin/pricing/recalculate` HTTP 冒烟通过
- `POST /admin/imports/cards-json` HTTP 冒烟通过

## 2026-04-02 导入与定价追加未完成项

- 数据库模式下 `imports/pricing` 链路未做 HTTP 级复测
