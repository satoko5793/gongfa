# 17 基于 Claude Code 的工程优化方案

更新时间：2026-04-01

## 文档目标

这份文档用于回答一个具体问题：

- 如果参考 `claude-code` 源码快照和 `claude-code-deep-dive` 的分析结论，`gongfa` 这个项目最值得优化什么
- 哪些能力适合借鉴，哪些能力暂时不适合照搬
- 后续应该按什么顺序改，先动哪些文件，预期收益是什么

这不是一份“重写项目”的方案，而是一份以当前网页商城主线为前提的结构化升级路线图。

如果要直接进入执行层，请继续看：

- [18-iteration-1-execution-plan.md](18-iteration-1-execution-plan.md)

## 参考对象

本次判断主要参考三类材料：

- `gongfa` 当前代码和文档
- `claude-code` 源码快照
- `claude-code-deep-dive` 研究文档

其中，最有价值的不是 Claude Code 的多 agent 或 MCP 能力，而是它的工程组织方式：

- 能力元信息集中管理
- 执行链分层
- 权限和风险控制
- 运行时可观测性
- 扩展点治理
- 大型运行时的状态和上下文管理

## 当前结论

`gongfa` 当前已经是一个可运行、可部署、具备完整业务闭环的单体商城系统。它的主要问题不是“功能不够”，而是“已有功能正在向少数超大文件持续堆积”。

当前最明显的结构信号：

- `backend/src/routes/admin.js` 已有 1398 行
- `backend/src/routes/orders.js` 已有 434 行
- `backend/src/services/dev-store.js` 已有 3243 行
- `frontend/app.js` 已有 3780 行
- `frontend/admin.js` 已有 3927 行

这些文件还在继续承担路由、业务规则、数据访问、状态处理、显示转换、模式分支等多种职责。继续在这些文件上堆功能，短期还可以推进，但中期会明显拉高改动成本和回归风险。

## 当前优势

在做结构优化之前，先明确当前项目的优势，避免误判：

- 业务主线已经跑通，前台、后台、订单、充值、审核都有闭环
- 文档意识比较强，已有状态文档、部署文档、发版检查和测试服流程
- 部署方式简单直接，当前阶段维护成本可控
- 网页优先路线清晰，没有一边做 Web 一边做小程序造成目标漂移
- 当前项目仍是单体结构，重构窗口还在，技术债尚未演变成多服务耦合问题

这意味着后续最合适的策略不是“大改技术栈”，而是“在现有 Express 单体上做有边界的分层和治理”。

## 不建议直接照搬的部分

Claude Code 很强，但它有大量能力并不适合 `gongfa` 现在直接引入：

- 不建议现在引入多 agent 编排
- 不建议现在引入 MCP 生态
- 不建议现在围绕 prompt runtime 做复杂抽象
- 不建议为了“现代化”而立刻重写成前后端分离大工程
- 不建议为了拆分而直接上微服务

原因很简单：`gongfa` 当前是偏运营型商城，不是 AI agent 平台。最需要借的是“工程治理能力”，不是“AI 产品形态”。

## 最值得借鉴的六类能力

### 1. 能力和规则的集中注册

Claude Code 的很多能力不是散落在各处，而是有统一元信息和注册点。`gongfa` 对应要借鉴的是：

- 状态值集中定义
- 角色权限集中定义
- 充值规则集中定义
- 商品种类和业务类型集中定义
- 关键操作的元信息集中定义

这能减少字符串散落、规则漏改、前后端不一致的问题。

### 2. 执行链分层

Claude Code 的工具执行不是“一把梭”，而是经过统一链路。`gongfa` 当前很多写操作还混合了：

- 请求解析
- 参数校验
- 权限判断
- 业务决策
- 数据访问
- 审计记录
- 响应组装

后续应统一收敛为：

- `route`
- `validator`
- `policy`
- `service`
- `repository`
- `audit`
- `mapper`

### 3. 权限和风险控制

Claude Code 的一个强点是权限判断不仅有“能不能”，还有“为什么”。`gongfa` 也应从简单角色校验升级到动作级 policy：

- 谁可以看什么
- 谁可以改什么
- 某个状态下是否允许执行某种操作
- 某些后台配置是否只能由更高权限角色修改

### 4. 运行时可观测性

Claude Code 很重视执行轨迹、上下文和错误可追踪性。`gongfa` 当前也需要补：

- request id
- 结构化日志
- 统一错误格式
- 关键动作耗时
- 可回放的审计信息

### 5. 状态和上下文治理

Claude Code 对上下文非常敏感。对应到 `gongfa`，最接近的问题不是 prompt，而是：

- 前端超大页面脚本中的全局状态污染
- 前后端数据模型混用
- 原始 API 响应直接进入渲染流程

后续要把“后端模型”和“前端展示模型”分开。

### 6. 扩展点前置设计

Claude Code 的 Skills、Plugins、Hooks 说明它在设计时留了扩展入口。`gongfa` 当前不需要完整插件系统，但应预留这几类扩展点：

- 后台导入规则
- 价格策略
- 充值类型
- 审计事件
- 发布前校验脚本

## 当前最需要解决的结构问题

### 问题 1：路由文件承担了过多业务逻辑

当前主要体现在：

- `backend/src/routes/admin.js`
- `backend/src/routes/orders.js`

这些文件里同时存在参数读取、鉴权、业务规则、状态变更、数据读写和响应整理，后续会越来越难测试，也越来越难定位问题。

### 问题 2：开发数据模式渗透到了业务代码

当前 `useFileStore()` 的存在本身不是问题，问题是它的判断散落进了业务流程。最终结果是：

- 路由知道太多运行模式细节
- 业务 service 无法保持统一接口
- file store 和数据库逻辑容易长期分叉

### 问题 3：校验、状态、枚举散落在多个层次

目前商品种类、订单状态、充值类型、角色判断和价格规则在多个文件中都有体现，这会带来：

- 改一个规则要找多处
- 前后台可能出现不一致
- 新功能插入时容易走偏

### 问题 4：前端两个大脚本混合了太多职责

`frontend/app.js` 和 `frontend/admin.js` 当前是典型的“页面越做越大，状态越聚越乱”的结构。常见风险包括：

- 相互影响的全局状态
- 一个功能改动牵动多个 UI 分支
- API 响应格式变化后影响范围过大

### 问题 5：运行时治理能力还偏弱

项目已经有健康检查、审计日志和校验脚本，但还缺少更系统的运行时基础设施：

- request id
- 统一错误信封
- `ready` 检查
- 写操作耗时统计
- 审计事件上下文补全

## 总体改造原则

后续改造建议遵守下面这些原则：

- 保持 Express 单体，不先换技术栈
- 先拆职责，再补能力
- 先动写操作最复杂的模块，再动展示层
- 不一次性重写前端，先做 ES Modules 化
- 数据访问统一走 repository，路由不再关心底层存储
- 每完成一轮重构，都要保留当前功能路径可回归验证

## 分阶段改造路线

## Phase 0：做一次结构基线梳理

目标：

- 明确哪些代码属于 route、service、repository、policy、mapper
- 明确哪些文件是本轮改造的高优先级入口

优先阅读文件：

- `backend/src/server.js`
- `backend/src/routes/orders.js`
- `backend/src/routes/admin.js`
- `backend/src/services/dev-store.js`
- `backend/src/services/validate.js`
- `frontend/app.js`
- `frontend/admin.js`

产出：

- 一张职责边界图
- 一份高风险文件清单
- 一份后续拆分命名约定

这一步不要求改逻辑，目标是统一“之后怎么拆”。

## Phase 1：先拆后端写操作主链路

这是优先级最高的一步，也是最值得借鉴 Claude Code 执行链分层思想的地方。

### 1. 拆 `orders` 模块

建议新增目录：

- `backend/src/modules/orders/service.js`
- `backend/src/modules/orders/repository.js`
- `backend/src/modules/orders/policy.js`
- `backend/src/modules/orders/mapper.js`
- `backend/src/modules/orders/validators.js`

建议调整：

- `routes/orders.js` 只保留 HTTP 边界逻辑
- 下单、取消、查询、状态变更进入 `service.js`
- 数据访问进入 `repository.js`
- 状态迁移和角色判断进入 `policy.js`
- 输出结构整理进入 `mapper.js`

验收标准：

- 路由文件显著缩短
- 下单和取消链路不再直接散落 SQL 或 file store 分支
- 订单写操作可以单独补单元测试

### 2. 拆 `admin` 模块

建议新增目录：

- `backend/src/modules/admin/service.js`
- `backend/src/modules/admin/repository.js`
- `backend/src/modules/admin/policy.js`
- `backend/src/modules/admin/mapper.js`
- `backend/src/modules/admin/validators.js`

建议先按业务聚合，而不是按接口拆散：

- 商品管理
- 订单处理
- 充值审核
- 配置修改
- 导入和批处理
- 审计查询

验收标准：

- `routes/admin.js` 只剩接口装配和返回
- 后台各子域有独立 service
- 审计记录在 service 层统一触发

### 3. 拆分 `validate.js`

建议拆成：

- `backend/src/modules/auth/validators.js`
- `backend/src/modules/orders/validators.js`
- `backend/src/modules/admin/validators.js`
- `backend/src/modules/recharge/validators.js`

验收标准：

- 校验逻辑和领域模块保持一致
- 新增字段时不再必须改一个万能校验文件

## Phase 2：建立领域注册表和状态机

这一步对应 Claude Code 的 registry 思路。

建议新增：

- `backend/src/domain/order-status.js`
- `backend/src/domain/recharge-status.js`
- `backend/src/domain/item-kind.js`
- `backend/src/domain/recharge-policy.js`
- `backend/src/domain/role-policy.js`

建议集中管理的内容：

- 订单状态定义
- 状态迁移规则
- 充值类型
- 商品分类或种类
- 角色到动作的映射
- 特殊业务规则，比如会员加成和最低充值限制

验收标准：

- 不再在路由、前端页面、校验逻辑里重复硬编码状态字符串
- 状态迁移规则有唯一来源
- 权限判断可以按 action 复用

## Phase 3：把 file store 和数据库模式隔离到 repository 层

重点不是删除 file store，而是限制它的影响范围。

建议新增接口抽象：

- `UserRepo`
- `ProductRepo`
- `OrderRepo`
- `RechargeRepo`

建议实现：

- `backend/src/repositories/pg/*.js`
- `backend/src/repositories/file/*.js`

建议调整：

- 启动时根据运行模式装配 repository
- `service` 只面向统一仓储接口
- `route` 和 `policy` 不再出现 `useFileStore()` 判断

验收标准：

- file store 切换不再影响路由层代码
- repository 成为唯一数据读写入口
- 数据访问模式替换成本下降

## Phase 4：升级权限模型为动作级 policy

当前基于角色的鉴权可以继续保留，但应补一层动作级 policy。

建议新增：

- `backend/src/policies/admin-policy.js`
- `backend/src/policies/order-policy.js`
- `backend/src/policies/recharge-policy.js`

建议沉淀为显式规则的问题：

- `poster_admin` 能看哪些后台数据
- `poster_admin` 能修改哪些配置
- 谁能取消订单
- 谁能审核充值
- 哪些高风险操作必须超管执行

验收标准：

- 权限判断不再散落在路由 if 分支和前端按钮禁用逻辑里
- 每类高风险操作都能找到唯一 policy 来源

## Phase 5：补运行时治理和可观测性

建议优先补这几项：

- request id
- 结构化日志
- 统一错误响应格式
- `/ready`
- 关键写操作耗时
- 审计日志中的操作上下文

建议涉及文件：

- `backend/src/server.js`
- `backend/src/services/audit.js`
- `backend/src/middlewares/*`

建议统一日志字段：

- request id
- user id
- role
- action
- resource id
- latency
- result

验收标准：

- 线上错误可以按 request id 串起来
- 关键写操作的失败原因更容易排查
- 审计记录可用于操作回放

## Phase 6：前端先模块化，不急着换框架

当前前后台页面仍适合继续维持静态页方案，但需要降低超大脚本维护成本。

建议先拆成 ES Modules：

- `frontend/state/session.js`
- `frontend/state/cart.js`
- `frontend/api/client.js`
- `frontend/api/orders.js`
- `frontend/api/recharge.js`
- `frontend/features/products/index.js`
- `frontend/features/orders/index.js`
- `frontend/features/account/index.js`
- `frontend/features/recharge/index.js`
- `frontend/features/admin-products/index.js`
- `frontend/features/admin-orders/index.js`

建议同步引入：

- API client 统一错误处理
- view-model mapper
- 页面级状态拆分
- DOM 绑定和业务逻辑分离

验收标准：

- `frontend/app.js` 和 `frontend/admin.js` 不再继续膨胀
- API 响应改动时影响范围可控
- 前后台页面更容易做分模块回归

## Phase 7：把文档流程进一步脚本化

这一步很适合当前项目，因为已有较好的文档基础。

现有基础：

- `docs/13-web-release-checklist.md`
- `docs/15-frontend-validation.md`
- `docs/16-staging-test-flow.md`
- `scripts/validate_frontend.py`

建议新增：

- `scripts/smoke_auth.py`
- `scripts/smoke_orders.py`
- `scripts/smoke_recharge.py`
- `scripts/smoke_admin.py`

目标：

- 把发版前最关键的链路固定成脚本
- 降低“凭记忆检查”的风险
- 让测试服回归流程更稳定

验收标准：

- 发版前至少能脚本化验证登录、下单、充值申请、后台审核这些主链路

## Phase 8：建立数据库演进机制

当前已有 `infra/schema.sql`，但后续要支持持续演进，需要补 migration 流程。

建议新增：

- `infra/migrations/`
- 迁移命名规范
- migration runner

建议目标：

- schema 变更不再靠人工维护一份大 SQL
- 测试服和正式服的结构升级路径一致

验收标准：

- 每次结构变更都有对应 migration
- 测试服验证过的 migration 能稳定进入正式服

## 推荐实施顺序

如果按收益和风险排序，建议按下面顺序推进：

1. 拆 `orders` 和 `admin` 的 service、repository、policy、mapper
2. 拆分 `validate.js`
3. 收敛 `useFileStore()` 到 repository 层
4. 建立 `order-status`、`recharge-status`、`role-policy` 注册表
5. 给 `server.js` 增加 request id、统一错误格式和 `/ready`
6. 拆 `frontend/app.js` 和 `frontend/admin.js`
7. 补主链路 smoke 脚本
8. 建立 migration 机制

## 三个迭代批次建议

### Iteration 1：后端解耦

目标：

- 把最复杂的业务逻辑从路由里拿出来

范围：

- `orders`
- `admin`
- 校验拆分
- repository 抽象

完成标志：

- 路由文件明显收缩
- 写操作主链路有统一结构

第一期的可执行任务清单见：

- [18-iteration-1-execution-plan.md](18-iteration-1-execution-plan.md)

### Iteration 2：运行时治理

目标：

- 提升可控性、可排查性和权限边界清晰度

范围：

- policy
- 状态注册表
- request id
- 统一错误
- 审计增强

完成标志：

- 高风险动作有明确规则来源
- 线上排障更依赖结构化信息而不是人工猜测

### Iteration 3：前端和交付能力

目标：

- 降低前端维护成本，补齐发布回归能力

范围：

- 前端模块化
- API client 统一化
- smoke 脚本
- migration

完成标志：

- 页面继续迭代时不再默认往两个大文件上堆
- 发布前检查更标准化

## 当前最值得先做的一件事

如果当前只能做一件事，优先建议：

- 先拆 `backend/src/routes/admin.js`
- 然后拆 `backend/src/routes/orders.js`

原因：

- 这两处最容易继续堆复杂度
- 它们同时连接后台高风险操作和核心交易流程
- 一旦结构清晰，后续权限、审计、日志、测试都会更容易补

## 与 Claude Code 的关系总结

对 `gongfa` 来说，Claude Code 最值得借鉴的不是 AI agent 形态，而是下面这套“功法”：

- 把能力和规则从散落代码里抽出来
- 把执行链做成有层次的管线
- 把权限和高风险操作做成显式治理
- 把运行时信息变成可观测、可排查、可回放
- 在还没有失控之前，先把扩展点和边界立起来

这套方法更适合 `gongfa` 当前阶段，也更容易在不推翻现有业务的前提下逐步落地。
