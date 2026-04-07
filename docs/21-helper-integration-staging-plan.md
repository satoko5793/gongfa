# 21 Helper 接入实施计划（测试服优先）

更新时间：2026-04-02

## 目标

本期目标不是一次性把 `xyzw_web_helper` 全量并入功法商城，而是先把最有价值、最适合验证的能力，以低风险方式接到商城中，并且全程优先在测试服验证。

本期聚焦两件事：

- 扫码登录并绑定真实游戏账号
- 读取当前账号的阵容快照，保存到商城云端，为后续“一键恢复阵容”打基础

本期不追求一步到位完成：

- 不直接在正式服开放新入口
- 不直接把 helper 全站 UI 搬进商城
- 不在第一阶段就承诺“完整一键恢复武将、鱼灵、洗练、俱乐部科技”

原因很明确：

- 当前 helper 已验证可行的能力，主要是扫码拿 Token、连 WebSocket、读取角色和预设阵容、切换预设阵容
- 但“完整恢复阵容”需要进一步确认游戏协议里是否存在稳定可写的指令
- 如果直接在正式服上线，会把账号绑定、Token、安全、用户误操作风险都放大

## 当前已确认的基础能力

根据当前仓库和线上测试结果，已经确认：

- `helper` 已部署在同一台服务器，入口为宿主机 `8082`
- 正式站的 Caddy 已经转发 helper 相关路径：
  - `/xyzw-helper/*`
  - `/api/weixin/*`
  - `/api/weixin-long/*`
  - `/api/hortor/*`
- `helper` 已经具备微信扫码登录流程，可以拿到该微信下的角色列表
- `helper` 已经具备基于 Token 的游戏 WebSocket 通信能力
- `helper` 已经具备读取角色信息、读取预设阵容、切换预设阵容的能力
- `helper` 已经具备解析部分角色构成数据的能力，包括武将、鱼灵、洗练、部分俱乐部相关统计

当前仍未确认的关键点：

- 是否存在稳定、可重复、可安全回放的“完整阵容恢复”写协议
- 是否能同时恢复：
  - 武将站位
  - 武将上下阵
  - 鱼灵配置
  - 洗练配置
  - 俱乐部科技
- 这些操作是否会带来不可逆副作用或被游戏风控识别

所以本期实施必须分阶段推进。

## 总体策略

采用“三层分离”策略：

### 1. 商城负责

- 商城用户体系
- 商城内的账号绑定关系
- 阵容快照的云端存储
- 阵容快照的展示与管理
- 功能入口、权限控制、审计记录

### 2. Helper 负责

- 微信扫码登录链路
- 与游戏相关的 Token 获取
- 与游戏的 WebSocket 通信
- 游戏内信息读取
- 已验证的轻量操作执行，例如切换预设阵容

### 3. 测试服负责

- 新功能首发环境
- 联调验证环境
- 协议探索环境
- 快照结构试验环境

## 隔离原则

后续所有开发都必须遵守下面几条。

### 环境隔离

- 新功能默认只在测试服启用
- 正式服即使代码存在，也必须默认关闭
- 新功能的前端入口、后端接口、数据读写，都要受环境开关控制

建议使用：

- `.env.staging` 开启
- `.env.production` 默认关闭

建议新增环境变量：

```env
HELPER_BRIDGE_ENABLED=false
HELPER_BRIDGE_MODE=off
HELPER_PUBLIC_BASE=/xyzw-helper
HELPER_API_BASE=/api
HELPER_SCAN_BIND_ENABLED=false
HELPER_TEAM_SNAPSHOT_ENABLED=false
HELPER_TEAM_RESTORE_ENABLED=false
```

说明：

- `HELPER_BRIDGE_ENABLED`：总开关
- `HELPER_SCAN_BIND_ENABLED`：是否显示扫码绑定入口
- `HELPER_TEAM_SNAPSHOT_ENABLED`：是否开放阵容快照
- `HELPER_TEAM_RESTORE_ENABLED`：是否开放恢复能力

正式服初期建议：

```env
HELPER_BRIDGE_ENABLED=false
HELPER_SCAN_BIND_ENABLED=false
HELPER_TEAM_SNAPSHOT_ENABLED=false
HELPER_TEAM_RESTORE_ENABLED=false
```

测试服初期建议：

```env
HELPER_BRIDGE_ENABLED=true
HELPER_SCAN_BIND_ENABLED=true
HELPER_TEAM_SNAPSHOT_ENABLED=true
HELPER_TEAM_RESTORE_ENABLED=false
```

### 路由隔离

不要直接把 helper 入口混进现有商城主流程。

建议新增独立功能区，例如：

- 前台页面中的“游戏工具实验区”
- 或者单独的测试服入口页

建议前端路由/锚点独立：

- `#helper-lab`
- `#helper-bind`
- `#helper-team`

正式服在开关关闭时，这些入口不渲染。

### 数据隔离

不要把 helper 相关数据混进现有核心订单表、充值表、商品表。

建议新增独立数据结构：

- `user_game_bindings`
- `team_snapshots`
- `team_snapshot_items`
- `helper_action_logs`

如果当前仍使用文件存储开发模式，也要独立命名，例如：

- `backend/dev-data.helper.staging.json`
- 或在现有 JSON 中使用独立顶层字段：
  - `helper_bindings`
  - `team_snapshots`
  - `helper_logs`

### 代码隔离

不要把 helper 逻辑直接散落到当前 `frontend/app.js` 各处。

建议新增独立文件或独立模块区：

- `frontend/helper-bridge.js`
- `frontend/helper-bind.js`
- `frontend/helper-team.js`

后端同理：

- `backend/src/routes/helper.js`
- `backend/src/services/helper/`
- `backend/src/services/helper-binding.js`
- `backend/src/services/helper-team-snapshot.js`

这样后面如果要下线、重构或抽离，不会污染商城主链路。

## 分阶段实施

### 阶段 0：准备阶段

目标：

- 建立测试服专用开关
- 明确目录与接口隔离
- 不影响正式服

任务：

- 增加 helper 功能环境变量
- 增加后端 helper 路由占位
- 增加前端 helper 实验区占位
- 在测试服显示入口，正式服隐藏
- 给 helper 相关接口统一加日志前缀

验收标准：

- 测试服可见 helper 入口
- 正式服完全不可见
- 未开启时不影响现有前台和后台功能

### 阶段 1：扫码绑定游戏账号

目标：

- 商城用户可以在测试服中通过微信扫码获取游戏角色列表
- 用户可以选择角色并绑定到自己的商城账号

实现建议：

- 前端复用 helper 的扫码流程，不必先搬运全部 helper UI
- 商城侧只承接：
  - 拉起扫码
  - 轮询扫码状态
  - 展示角色列表
  - 让用户确认绑定哪个角色
- 后端保存绑定关系：
  - 商城用户 ID
  - game_role_id
  - server_id / server_name
  - role_name
  - bind_source=`helper_wx_scan`
  - bind_status=`active`

这一阶段不要做：

- 不把原始 Token 长期明文持久化到商城数据库
- 不开放后台人工修改 Token
- 不开放正式服用户入口

建议优先方案：

- Token 仅在浏览器本地保存，供当前会话使用
- 商城后端只保存“绑定关系”和必要角色信息

如果后续确实需要云端执行能力，再单独评估是否保存短期凭据。

验收标准：

- 测试服用户可扫码
- 能看到微信下角色列表
- 可选择一个角色绑定到当前商城账号
- 绑定后在“我的账户”可看到绑定结果
- 解绑和重新绑定流程可用

### 阶段 2：读取并保存阵容快照

目标：

- 针对已绑定账号，读取当前角色的关键阵容数据
- 将快照保存到商城云端
- 支持查看历史快照

建议快照范围先做“读多写少”：

- 基础角色信息
  - roleId
  - roleName
  - server
  - level
  - power
- 当前预设阵容
  - 当前使用阵容 ID
  - 1-4 阵容英雄位信息
- 武将信息
  - heroId
  - heroName
  - level
  - battleTeamSlot
- 鱼灵信息
  - artifactId
  - 关键属性
- 洗练信息
  - equipment quenches
- 俱乐部相关可读统计
  - red quench
  - 可读的 club / legion 统计字段

说明：

- 这里先做“快照归档”
- 数据结构宁可更宽一点，也不要一开始就追求抽象得太漂亮
- 原始字段建议保留 `raw_payload`，方便后续协议探索

验收标准：

- 测试服可对已绑定角色执行“保存当前阵容快照”
- 快照能列出来
- 快照详情能看到主要字段
- 同一角色可保存多份快照

### 阶段 3：预设阵容切换能力接入

目标：

- 在商城测试服中调用 helper 已有能力，切换到预设阵容 1-4

说明：

- 这是当前最明确、最可控、最容易验证的“执行类”能力
- 它不等于完整恢复阵容
- 但它能尽快形成“商城发起，helper 执行”的闭环

建议入口：

- “切换到阵容 1”
- “切换到阵容 2”
- “切换到阵容 3”
- “切换到阵容 4”

后端建议记录审计日志：

- 谁触发的
- 绑定的是哪个角色
- 目标阵容 ID
- 成功/失败
- 返回时间

验收标准：

- 测试服可切换预设阵容
- 操作结果有反馈
- 有审计日志

### 阶段 4：完整恢复能力协议探索

目标：

- 判断是否能真正做到“一键恢复快照”

这一步不要提前承诺上线时间。

需要逐项验证：

1. 是否存在可设置英雄阵容的协议
2. 是否存在可设置鱼灵的协议
3. 是否存在可设置洗练或替换洗练方案的协议
4. 是否存在可设置俱乐部科技的协议
5. 这些写操作是否需要额外游戏前置状态
6. 这些操作是否会消耗资源、产生副作用或失败不一致

这一阶段可能的结论有三种：

- 可以完整恢复
- 只能部分恢复
- 只能做读取与切换预设阵容，不能安全恢复

在验证完成前：

- `HELPER_TEAM_RESTORE_ENABLED` 必须保持关闭

## 推荐实现路径

## 前端

建议在 [frontend/index.html](/Users/xyq/Desktop/123/gongfa/frontend/index.html) 与 [frontend/app.js](/Users/xyq/Desktop/123/gongfa/frontend/app.js) 之外，增加独立 helper 模块：

- `frontend/helper-bridge.js`
  - 统一封装与 helper 相关的浏览器侧请求
- `frontend/helper-bind.js`
  - 扫码、角色选择、绑定提交
- `frontend/helper-team.js`
  - 快照读取、快照展示、阵容切换

前台页面建议新增一个独立板块：

- 名称可先叫“游戏助手实验区”
- 仅测试服显示
- 明确标注“测试功能，仅供绑定和阵容实验，不影响商城购买链路”

## 后端

建议新增独立 helper 路由：

- `/helper/config`
- `/helper/bindings`
- `/helper/team-snapshots`
- `/helper/actions/switch-team`

建议后端只承担：

- 读取功能开关
- 保存绑定关系
- 保存快照
- 记录操作日志

不要在第一阶段把后端变成“代替浏览器直接连游戏”的执行中心。

## 数据设计建议

### `user_game_bindings`

字段建议：

- `id`
- `user_id`
- `game_role_id`
- `game_role_name`
- `game_server`
- `helper_binding_status`
- `bind_source`
- `created_at`
- `updated_at`

### `team_snapshots`

字段建议：

- `id`
- `user_id`
- `binding_id`
- `snapshot_name`
- `snapshot_type`
- `current_team_id`
- `role_power`
- `role_level`
- `raw_payload`
- `created_at`

### `helper_action_logs`

字段建议：

- `id`
- `user_id`
- `binding_id`
- `action_type`
- `action_payload`
- `result_status`
- `result_payload`
- `created_at`

## 测试服实施规则

这一部分必须严格执行。

### 只在测试服开放入口

- 正式服页面不显示
- 正式服后端即使存在接口，也应返回 `feature_disabled`

### 只绑定测试账号

测试期建议先限定：

- 仅管理员账号
- 或指定白名单账号

避免普通用户提前进入。

### 所有执行型操作都要留日志

至少记录：

- 用户 ID
- 角色 ID
- 操作类型
- 操作参数
- 成功/失败
- 返回摘要

### 所有恢复能力默认关闭

测试前期只允许：

- 绑定
- 读取
- 保存快照
- 切换预设阵容

不允许直接开放“恢复完整阵容”按钮。

### 测试顺序

建议固定顺序：

1. 测试服页面入口显示是否正常
2. 扫码链路是否正常
3. 绑定写库是否正常
4. 快照保存是否正常
5. 阵容切换是否正常
6. 多账号、多角色是否正常
7. 解绑与重新绑定是否正常

通过后再考虑下一阶段。

## 风险与控制

### 风险 1：影响正式服用户

控制方式：

- 正式服默认关闭开关
- 入口隐藏
- 接口拒绝访问

### 风险 2：Token 安全问题

控制方式：

- 第一阶段不长期存商城后端
- 优先本地持有，后端只存绑定关系
- 操作日志里禁止打印完整 Token

### 风险 3：协议探索导致账号状态异常

控制方式：

- 只在测试服验证
- 只使用测试账号
- 写操作逐条试，不批量放开

### 风险 4：helper 逻辑污染商城主流程

控制方式：

- 独立模块
- 独立接口
- 独立数据结构
- 独立开关

## 开发顺序建议

建议按下面顺序开工：

1. 增加环境开关与 helper 配置接口
2. 增加前端测试服入口与占位 UI
3. 打通扫码绑定链路
4. 保存绑定关系
5. 打通阵容快照读取与保存
6. 接入预设阵容切换
7. 再评估完整恢复能力

## 本期完成标准

如果本轮做到下面这些，就算阶段性成功：

- 测试服商城中有独立 helper 实验区
- 用户可以扫码绑定真实游戏账号
- 用户可以保存当前阵容快照到商城云端
- 用户可以查看历史快照
- 用户可以切换预设阵容 1-4
- 正式服没有暴露这些能力

## 下一步开工建议

下一步直接进入阶段 0 和阶段 1。

建议第一批代码改动只碰这些位置：

- [frontend/index.html](/Users/xyq/Desktop/123/gongfa/frontend/index.html)
- [frontend/app.js](/Users/xyq/Desktop/123/gongfa/frontend/app.js)
- 新增 `frontend/helper-*.js`
- [backend/src/server.js](/Users/xyq/Desktop/123/gongfa/backend/src/server.js)
- 新增 `backend/src/routes/helper.js`
- 新增 `backend/src/services/helper/`

并且第一批只做：

- 配置接口
- 测试服入口
- 扫码绑定

先不要在第一批里做恢复能力。
