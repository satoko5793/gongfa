# 第二阶段：`dev-store` 与 Repository Adapter 收口计划

## 问题画像

第一期把价格系统的结构和解释模型立住后，当前最明显的第二个结构瓶颈就是 [backend/src/services/dev-store.js](/Users/xyq/Desktop/123/gongfa/backend/src/services/dev-store.js)。

它现在同时承担：

- 文件读写与缓存
- 主数据归一化
- 商品重算触发
- 用户、订单、商品、helper、审计等多个领域动作
- file repository 的统一入口

这会带来几个直接问题：

- file-store 模式的底层细节和业务动作没有分层
- `repositories/file/*.js` 普遍直接耦合 `dev-store.js`
- 后续继续拆后台或补测试时，很难给不同领域单独建稳定入口
- 单个文件过大，改动风险和回归范围都偏高

## 第二阶段目标

这一期只做结构治理，不改正式服业务口径，不扩价格规则，不改前台接口返回。

核心目标：

1. 把 `dev-store` 底层能力拆到 `backend/src/domain/store/`
2. 明确 `file / pg` repository 的 adapter 边界
3. 让 `dev-store.js` 变成兼容式 façade，而不是继续定义底层细节
4. 给后续 Phase 3 的后台拆分留下稳定的 store/domain 落点

## 目标分层

第二期新增目录：

- `backend/src/domain/store/core/`
- `backend/src/domain/store/repositories/`

### `core/`

- `file-store.js`
  管理 `readData / writeData / loadDataFromDisk / cache`
- `data-normalizer.js`
  管理 `normalizeData` 的统一编排
- `reprice-hook.js`
  管理 `repriceDataProducts` 这类公共重算钩子

### `repositories/`

- `products-file-store.js`
  商品、套餐、导入、重算相关入口
- `orders-file-store.js`
  订单、订单项、充值审核、外部订单相关入口
- `users-file-store.js`
  用户、额度、密码、自助资料、充值配置相关入口
- `helper-file-store.js`
  helper 绑定、库存、库存清理、聚合视图相关入口
- `admin-queries-file-store.js`
  后台 overview 和各类查询拼装入口

## 迁移顺序

1. 先补这份第二阶段文档，并更新索引。
2. 新增 `domain/store/core/*`。
3. 把 `dev-store.js` 里的读写缓存、归一化、公共重算钩子迁到 `core/*`。
4. 新增 `domain/store/repositories/*` 作为 file-store 领域入口。
5. 把 `repositories/file/*.js` 改成依赖新的 `domain/store/repositories/*`，不再直接依赖 `dev-store.js`。
6. 把 `modules/admin/imports/service.js` 中 helper 文件态调用切到新的 helper store 入口。
7. 本地验证。
8. 只发测试服。

## 兼容策略

第二期采用兼容式迁移，不一次性改完所有调用点。

约束如下：

- [dev-store.js](/Users/xyq/Desktop/123/gongfa/backend/src/services/dev-store.js) 继续保留
- 它对外仍保持现有方法名，避免 routes 和 services 大面积改引用
- 但它不再直接定义：
  - 文件缓存读写
  - `normalizeData`
  - 公共商品重算钩子

这些统一转到 `domain/store/core/*`

## 验证要求

### 本地

- `node --check` 通过新增和改动文件
- file-store 模式能正常启动
- 修改充值配置后同步重算仍成功
- 商品导入、订单确认、订单取消、额度购买后仍触发重算
- 后台查询页仍能列出商品、用户、订单、充值订单和 overview

### 测试服

固定按下面顺序验：

1. 后台打开正常
2. 商品列表、用户列表、订单列表、overview 都能加载
3. 保存一个充值配置，确认同步重算仍成功
4. 抽一张卡看价格说明，确认 `pricing_meta` 没丢
5. 商城打开正常，商品详情能打开
6. 个人后台打开正常
7. 做一轮最小订单链路冒烟，确认不丢写盘、不丢重算

## 回滚方式

如果测试服验证不通过：

1. 正式服保持不动
2. 测试服回退到上一版稳定版本
3. 保留第二阶段文档
4. 回退 `domain/store/*` 接线和 file repository 切换

## 本期不做

- 不改 pg SQL
- 不改价格公式
- 不改 admin 页结构
- 不改商城接口返回
- 不做 DB mode 的充值配置支持
