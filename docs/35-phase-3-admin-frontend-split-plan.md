# 第三阶段：后台前端拆分计划

## 背景

这一阶段固定只做后台前端拆分，不改价格口径、不改后台 API 语义、不改 `admin.html` 的现有 DOM 结构和 page panel 信息架构。

当前痛点很集中：

- `frontend/admin.js` 仍然是超大入口文件，DOM 查询、状态、接口调用、渲染、交互绑定都堆在一起
- `frontend/styles.css` 同时承担前台、后台和 helper 大量样式，后续继续改后台时很难收边界
- 后台已经天然按 `imports / catalog / users / orders / recharge / logs` 分页，但前端代码还没有跟着按 page shell 和 page module 拆开

第三阶段的目标不是做后台改版，而是把当前后台整理成“兼容入口 + 可继续演进的模块结构”。

## 这一期要达到什么状态

这一期完成后，后台前端至少具备下面这些稳定边界：

- `admin.js` 保留为兼容入口，只负责装配和保留暂时还没迁走的高交互逻辑
- DOM 引用集中到 `frontend/admin-runtime/dom.js`
- 后台初始状态集中到 `frontend/admin-state/store.js`
- 后台 API helper 集中到 `frontend/admin-services/api.js`
- page shell 能力集中到 `frontend/admin-runtime/page-shell.js`
- 已经抽出的纯展示 renderer 落到 `frontend/admin-renderers/`
- page panel 的加载入口落到 `frontend/admin-pages/`
- 后台样式开始进入 `frontend/styles/` 下的分片文件，`admin.html` 显式引入

## 这期不做什么

- 不继续扩价格系统规则
- 不继续拆 `dev-store`
- 不改 `/admin/*`、`/orders/*` 等后端接口结构
- 不改 `admin.html` 的 `id`、`data-admin-page-tab`、`data-admin-page-panel`
- 不引入 bundler、前端框架或新的构建链
- 不做后台改版，只做等价拆分

## 目标目录

第三阶段落地后的目标目录如下：

- `frontend/admin-runtime/`
  - `dom.js`
  - `page-shell.js`
- `frontend/admin-state/`
  - `store.js`
- `frontend/admin-services/`
  - `api.js`
- `frontend/admin-renderers/`
  - `overview.js`
  - `pricing.js`
  - `imports.js`
  - `products.js`
  - `users.js`
  - `orders.js`
  - `recharge.js`
  - `logs.js`
  - `auctions.js`
- `frontend/admin-pages/`
  - `imports.js`
  - `catalog.js`
  - `users.js`
  - `orders.js`
  - `recharge.js`
  - `logs.js`
  - `index.js`
- `frontend/styles/`
  - `base.css`
  - `admin.css`
  - `admin-products.css`
  - `admin-recharge.css`
  - `admin-logs.css`
  - `helper.css`

## 拆分顺序

第三阶段固定按这个顺序做，避免一上来碰最复杂的商品和订单交互：

1. 先抽 `admin-runtime/dom.js`、`admin-state/store.js`、`admin-services/api.js`
2. 再抽 `admin-runtime/page-shell.js`
3. 先抽纯展示更强的 renderer
   - imports pending queue
   - session / overview / alerts
   - pricing summary
4. 再补 page registry，把现有 `loadAdminPage` 收成稳定入口
5. 最后让 `admin.html` 开始显式引入后台样式分片

## 迁移策略

这一期继续沿用前两期的兼容式迁移策略：

- 先建新模块
- 再把 `admin.js` 里的稳定函数替换成对新模块的调用
- 高风险的事件绑定和复杂动作先保留在 `admin.js`
- page module 先负责统一页面加载入口，暂不强拆所有交互监听

也就是说，这一阶段的重点是把“顶部粘连区”和“纯展示区”掏空，而不是一次性把全部后台逻辑重写掉。

## 验收标准

达到下面这些标准，才算第三阶段完成：

- `admin.js` 成功接入新的 runtime/state/services/renderers/pages 结构
- `admin.html` 不需要改 DOM 就能继续工作
- 6 个 page panel 的加载入口仍然正常
- 商品详情弹窗、充值配置保存、订单和用户查询不回归
- 样式分片接入后，后台没有出现明显布局错乱
- 测试服验证通过，正式服保持不动

## 本地验证

本地固定要做这些检查：

- `node --check` 通过新增和改动的后台前端文件
- 本地后台能打开
- page tab 切换正常
- `reloadAll()` 仍能按当前 page 加载
- 商品、用户、订单、充值、日志、导入页都至少成功加载一次
- `python3 scripts/validate_frontend.py --base-url http://127.0.0.1:8080`

## 测试服验证

测试服固定按这个顺序验：

1. 打开后台并登录
2. 逐个切换 6 个 page tab
3. 商品页搜索、筛选、分页、详情弹窗
4. 充值页配置加载、定价调控显示、保存配置提示
5. 订单页查询和状态按钮
6. 用户页搜索和快捷额度
7. 日志页审计日志和额度流水
8. imports 页批量导入和双炉子导入区
9. 商城和个人后台的冒烟确认

## 回滚方式

如果测试服出现后台按钮失效、panel 空白或布局大面积错乱，这一阶段的回滚优先级如下：

1. 回滚 `frontend/admin.js`
2. 回滚 `frontend/admin.html`
3. 回滚 `frontend/styles/` 新增分片
4. 保留文档，不回滚路线说明

## 与下一阶段的关系

第三阶段完成后，下一阶段才能更稳地继续：

- 继续拆 `admin.js` 的高交互页
- 继续拆 `styles.css`
- 或进入 Phase 4 的枚举、错误信封、日志和发布检查统一化

这也是为什么第三阶段必须先把后台前端的基本骨架立起来，而不是继续在超大入口文件上叠功能。
