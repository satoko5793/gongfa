# 18 第一期实施任务清单

更新时间：2026-04-01

## 文档目标

这份文档是 [17-claude-code-reference-optimization.md](17-claude-code-reference-optimization.md) 的继续，用于把“优化方向”进一步落成“第一期可以直接执行的任务清单”。

适用范围：

- 当前 `gongfa` 网页主线
- 当前 Node.js + Express 单体结构
- 当前前后台静态页面 + REST API 方案

这份清单默认不做大换栈，不引入多服务，不重写前端框架。

## 第一期的技术决策

结合当前项目现状，第一期先固定下面这些决策，不在本轮反复摇摆：

- 项目结构：后端采用 feature-first，按 `modules/<domain>` 拆；前端先按 `features/` 和 `state/` 拆
- 服务形态：继续保持 full-stack monolith，不拆微服务
- 数据访问：继续支持 file store 和 PostgreSQL，但统一收敛到 repository adapter
- 接口协议：继续使用 REST，不引入 GraphQL 或 tRPC
- 实时能力：本轮不做 SSE 或 WebSocket
- 认证策略：保留当前 JWT 方案，本轮只做边界收口，不改登录主流程

## 第一期目标

第一期只追求三件事：

1. 把最复杂的后端写操作从路由里拆出来
2. 把当前运行模式差异收敛到 repository 层
3. 为第二期的权限、可观测性和前端模块化打底

如果第一期做完，项目应该达到的状态是：

- `orders` 和 `admin` 不再继续向超大路由文件堆逻辑
- 新增业务规则时，知道应该写到 `policy / service / repository` 哪一层
- file store 和数据库模式切换不再影响大部分业务代码

## 第一期不做的事

为了保证范围收敛，本期明确不做：

- 不重写前端为 React / Vue
- 不重写认证体系
- 不接入自动支付
- 不做数据库正式迁移
- 不做 MCP、插件系统、AI agent 能力
- 不在本期内全面拆完所有路由

## 第一期交付物

本期建议交付以下结果：

- `orders` 模块第一版分层骨架
- `admin` 模块第一版分层骨架
- `validate.js` 的领域拆分
- repository adapter 入口
- 统一的领域命名和状态常量入口
- 一份可执行的回归检查清单

## 建议目录结构

后端建议在本期新增下面这些目录：

```text
backend/src/
  modules/
    orders/
      service.js
      repository.js
      policy.js
      mapper.js
      validators.js
    admin/
      service.js
      repository.js
      policy.js
      mapper.js
      validators.js
    recharge/
      validators.js
    auth/
      validators.js
  domain/
    order-status.js
    recharge-status.js
    role-policy.js
  repositories/
    file/
    pg/
```

前端本期不要求全部落地，但建议预留下面这个方向：

```text
frontend/
  api/
  state/
  features/
```

## 实施顺序

第一期建议拆成 8 个任务包，按顺序推进。

## Task 1：建立命名约定和分层边界

目标：

- 统一后续新增文件的职责定义

建议动作：

- 在 `backend/src/` 下新建 `modules/`、`domain/`、`repositories/`
- 约定每个领域模块默认包含 `service / repository / policy / mapper / validators`
- 约定 `route` 只做 HTTP 相关逻辑
- 约定 `service` 负责业务编排
- 约定 `repository` 负责数据访问
- 约定 `policy` 负责权限和状态规则
- 约定 `mapper` 负责返回结构转换

涉及文件：

- `backend/src/server.js`
- `backend/src/routes/*.js`

完成标准：

- 仓库中已经有新目录骨架
- 团队后续新增代码有统一落点

## Task 2：提取 `orders` 模块骨架

目标：

- 先从交易主链路入手，建立第一套可复用分层模式

建议新增文件：

- `backend/src/modules/orders/service.js`
- `backend/src/modules/orders/repository.js`
- `backend/src/modules/orders/policy.js`
- `backend/src/modules/orders/mapper.js`
- `backend/src/modules/orders/validators.js`

建议迁移动作：

- 从 `backend/src/routes/orders.js` 提取下单逻辑到 `service.js`
- 从 `backend/src/routes/orders.js` 提取取消申请和取消审核相关逻辑到 `service.js`
- 把订单读取和写入动作统一收敛到 `repository.js`
- 把“谁能取消、什么状态允许取消、取消后是否退额度”收敛到 `policy.js`
- 把订单响应格式和前端需要的字段整理收敛到 `mapper.js`

完成标准：

- `routes/orders.js` 中不再直接承载大段业务逻辑
- `orders/service.js` 能覆盖下单、取消申请、取消审核三条主链路
- 订单模块的核心规则有独立文件承接

## Task 3：提取 `admin` 模块骨架

目标：

- 把后台高风险操作从大路由文件中抽离

建议新增文件：

- `backend/src/modules/admin/service.js`
- `backend/src/modules/admin/repository.js`
- `backend/src/modules/admin/policy.js`
- `backend/src/modules/admin/mapper.js`
- `backend/src/modules/admin/validators.js`

建议拆分优先级：

1. 充值审核
2. 订单处理
3. 商品管理
4. 配置修改
5. 审计查询
6. 批量导入

建议原因：

- 充值审核和订单处理的风险最高，最值得先脱离超大路由文件
- 商品管理和配置修改规则较多，拆完后复用价值最高

完成标准：

- `backend/src/routes/admin.js` 至少完成第一轮主链路抽离
- 高风险写操作已有明确 service 和 policy 承接点

## Task 4：拆分校验层

目标：

- 让校验逻辑和领域模块保持一致

建议新增文件：

- `backend/src/modules/auth/validators.js`
- `backend/src/modules/orders/validators.js`
- `backend/src/modules/admin/validators.js`
- `backend/src/modules/recharge/validators.js`

建议迁移动作：

- 从 `backend/src/services/validate.js` 按领域迁出 schema 和字段规则
- 先迁移写操作相关校验，再迁查询类校验
- 保留一个过渡期导出入口，避免一次性大量改引用

完成标准：

- `validate.js` 不再继续膨胀
- 新增字段时优先改领域 validator，而不是万能校验文件

## Task 5：建立领域常量和状态入口

目标：

- 消灭状态和角色字符串散落

建议新增文件：

- `backend/src/domain/order-status.js`
- `backend/src/domain/recharge-status.js`
- `backend/src/domain/role-policy.js`

建议收敛内容：

- 订单状态枚举
- 合法状态迁移
- 充值审核状态
- 管理角色可执行动作
- 关键业务错误文案常量

完成标准：

- 订单状态和角色判断有唯一来源
- 新增规则不再需要同时改多处字符串

## Task 6：建立 repository adapter 入口

目标：

- 把 file store 和数据库差异隔离到数据层

建议新增目录：

- `backend/src/repositories/file/`
- `backend/src/repositories/pg/`

建议第一步只先落订单和后台相关仓储：

- `backend/src/repositories/file/order-repository.js`
- `backend/src/repositories/file/admin-repository.js`
- `backend/src/repositories/pg/order-repository.js`
- `backend/src/repositories/pg/admin-repository.js`

建议迁移动作：

- 把 `useFileStore()` 判断从路由和 service 中移出去
- 在启动阶段决定注入 file 还是 pg repository
- 让 `orders/service.js` 和 `admin/service.js` 只依赖统一接口

完成标准：

- route 和 service 层不再主动判断运行模式
- file / pg 切换只影响 repository 装配层

## Task 7：给主链路补回归检查清单

目标：

- 保证第一期重构不破坏当前业务闭环

建议新增文档或脚本：

- `docs/19-iteration-1-regression-checklist.md`
- 或者新增 `scripts/smoke_orders.py`
- 或者新增 `scripts/smoke_admin.py`

本期最少要覆盖的链路：

- 用户注册和登录
- 管理员登录
- 下单
- 取消申请
- 后台审核取消
- 提交充值申请
- 后台审核充值

完成标准：

- 每完成一大步重构，都能按同一套清单做回归

## Task 8：建立第二期前置接口

目标：

- 为下一期权限、日志、前端模块化预留挂点

建议新增但本期不必做深：

- `backend/src/policies/`
- `backend/src/lib/logger.js`
- `frontend/api/client.js`

建议动作：

- 后端 service 在关键写操作里预留 `audit` 调用点
- 后端错误处理尽量统一到公共出口
- 前端逐步把直接 `fetch` 收口到 `api/client.js`

完成标准：

- 第二期做 request id、结构化日志、前端模块化时不需要推翻本期结构

## 建议的实际推进顺序

如果按最稳妥的方式推进，建议按下面顺序操作：

1. 建立目录骨架和命名约定
2. 抽 `orders` 模块
3. 拆订单相关校验
4. 抽订单 repository adapter
5. 抽 `admin` 模块中的充值审核和订单处理
6. 建立状态常量入口
7. 写第一版回归清单
8. 再继续处理商品管理、配置修改和前端模块化入口

## 每个任务包的验收方式

### 结构验收

- 超大文件行数开始下降
- 新增功能不再默认写回原大文件
- 新目录和职责边界被稳定使用

### 行为验收

- 用户侧购买链路不变
- 管理侧审核链路不变
- 充值和额度回退逻辑不变

### 运维验收

- 本地启动流程不变
- 测试服部署流程不变
- 线上现有接口路径不变

## 风险和控制方式

### 风险 1：一边拆一边改行为

控制方式：

- 本期优先做“搬家”和“分层”，尽量不同时改业务规则

### 风险 2：抽象过度

控制方式：

- 先只抽订单和后台高风险操作
- 不把每个小接口都过度包装成复杂框架

### 风险 3：新旧结构并存过久

控制方式：

- 每完成一个领域，就及时把主调用链切过去
- 避免长期双写双读

### 风险 4：前端和后端同时大改

控制方式：

- 本期以后端解耦为主
- 前端只做最小入口预留，不做大规模重排

## 本期完成后的理想状态

如果第一期按计划完成，项目应进入下面这个状态：

- 后端已经从“以路由为中心”转向“以领域模块为中心”
- 订单和后台高风险操作不再继续沉积在单一文件
- file store 与数据库差异被压缩到更小范围
- 第二期可以直接接着做权限治理、日志和前端模块化

## 下一步建议

第一期文档落定之后，最适合马上开工的第一件事是：

1. 先创建 `backend/src/modules/orders/`
2. 把 `routes/orders.js` 的下单和取消链路迁出
3. 同时建立 `orders/policy.js` 和 `orders/repository.js`

原因：

- 订单链路是当前最清晰、最容易形成分层模板的模块
- 一旦订单模块拆顺了，`admin` 模块也更容易沿用同样结构
