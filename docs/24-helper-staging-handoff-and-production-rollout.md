# 24 Helper 测试服交接与正式服处理建议

更新时间：2026-04-04

## 目的

这份文档用于回答三个实际问题：

- helper 接入在测试服当前到底已经做到哪一步
- 哪些能力已经真实验证通过，哪些仍然有边界
- 正式服如果要处理，应该按什么顺序灰度，避免误伤商城主流程

这份文档不是路线规划，而是当前阶段的交接和发版依据。

## 当前结论

测试服已经完成并验证通过的能力有：

- 商城账号登录、商品列表、账户区、helper 实验区可正常使用
- helper 扫码绑定到当前商城账号
- 从 helper 读取当前阵容并保存为商城云端快照
- 直接切换预设阵容 `1 / 2 / 3 / 4`
- 恢复预演
- 安全恢复 Beta

其中“安全恢复 Beta”当前已经是真执行，不是演示。

当前安全恢复会做这些事：

- 先按 `attachmentUid` 归位洗练归属
- 再恢复站位
- 再恢复等级
- 再恢复鱼灵
- 再恢复鱼珠技能
- 再恢复俱乐部科技
- 再恢复主玩具

当前安全恢复明确不会做的事：

- 不回滚洗练数值本身
- 不把装备词条恢复成历史快照里的旧状态
- 不保证玩家后来手动改过的洗练内容会回到过去

也就是说，当前能力更准确的定义是：

- 已支持“安全项的一键阵容恢复”
- 仍未支持“完整洗练回档”

## 已验证通过的测试服链路

### 1. 扫码绑定

用户在商城测试服登录后，可以通过 helper 扫码并选择角色，再把当前角色绑定到商城账号。

关键结果：

- 商城后端会保存 `helperBindings`
- 绑定记录包含：
  - `game_role_id`
  - `game_server`
  - `game_role_name`
  - `bind_token_id`

### 2. 阵容快照

商城可以通过 helper 读取当前角色的实时阵容，并保存到云端快照。

当前快照已包含：

- 当前使用阵容号
- 武将列表
- 武将等级
- 武将头像
- 鱼灵与鱼珠技能摘要
- 装备洗练摘要
- 红淬 / 开孔统计
- `attachmentUid` 洗练归属
- 原始 `presetTeam` 包
- 原始 `roleInfo` 包

注意：

- 只有新结构快照才包含安全恢复需要的 `restore_flags` 和 `attachmentUid`
- 旧快照现在会被明确拦住，不允许点“安全恢复 Beta”

### 3. 直接切阵容

测试服已验证：

- 可直接切换到预设阵容 `1 / 2 / 3 / 4`
- helper 会真实调用 `presetteam_saveteam`
- 商城会记录 `helper_team_switch` 动作日志

### 4. 恢复预演

测试服已验证：

- 可读取当前实时阵容
- 可与某份历史快照做差异分析
- 预演结果会展示安全恢复步骤
- 不会真正写游戏

当前预演会重点展示：

- 洗练归属是否需要迁移
- 站位差异
- 等级差异
- 鱼灵 / 鱼珠差异
- 科技差异
- 主玩具差异
- 仅记录但不自动恢复的项目

### 5. 安全恢复 Beta

测试服已验证：

- 能对新结构快照执行真实恢复
- 执行顺序是：
  1. 洗练归属迁移
  2. 武将上下阵与站位
  3. 武将等级
  4. 鱼灵
  5. 鱼珠技能
  6. 科技
  7. 主玩具

执行后商城会：

- 记录 `helper_team_restore` 动作日志
- 保存恢复后的最新快照
- 在实验区展示执行结果

## 当前实现边界

### 必须使用新快照

当前安全恢复依赖这些字段：

- `summary.restore_flags`
- `raw.heroes[*].attachment_uid`

如果是老快照，商城现在会直接提示：

- 这份快照是旧版结构，请先重新读取一份新快照
- 或这份快照没有记录洗练归属，无法安全恢复到正确武将

### 洗练只归属，不回档

这一点是当前版本最重要的边界：

- 我们会把“原本属于这个武将的那套洗练”归回去
- 不会把这套洗练的具体词条数值回滚成历史快照内容

这和真实游戏约束是一致的，也符合当前 helper 主链能力。

### 不建议立即对正式服开放完整恢复

即便测试服已经通了，正式服也不应该第一时间把全部 helper 能力一起打开。

原因：

- helper 执行类能力会真实写游戏
- 用户侧如果拿旧快照、缓存页、断线角色去操作，风险更高
- 正式服更需要先稳住扫码绑定、快照读取、预演，再逐步开放恢复

## 代码与配置现状

### 商城后端配置开关

后端 helper 配置入口在：

- [helper.js](/Users/xyq/Desktop/123/gongfa/backend/src/routes/helper.js)

当前支持的环境变量：

- `HELPER_BRIDGE_ENABLED`
- `HELPER_BRIDGE_MODE`
- `HELPER_PUBLIC_BASE`
- `HELPER_API_BASE`
- `HELPER_SCAN_BIND_ENABLED`
- `HELPER_TEAM_SNAPSHOT_ENABLED`
- `HELPER_TEAM_SWITCH_ENABLED`
- `HELPER_TEAM_RESTORE_ENABLED`

### 环境样例

测试服样例在：

- [.env.staging.example](/Users/xyq/Desktop/123/gongfa/.env.staging.example)

正式服样例在：

- [.env.production.example](/Users/xyq/Desktop/123/gongfa/.env.production.example)

当前默认策略是：

- 测试服 helper bridge 开启
- 正式服 helper bridge 关闭

### 反向代理现状

当前 Caddy 已经同时配置了正式 helper 和测试 helper：

- 正式 helper：`/xyzw-helper/* -> 172.17.0.1:8082`
- 测试 helper：`/xyzw-helper-staging/* -> 172.17.0.1:8083`

见：

- [Caddyfile](/Users/xyq/Desktop/123/gongfa/infra/Caddyfile)

这意味着：

- 正式 helper 和测试 helper 已经物理隔离
- 商城是否显示 helper 能力，主要由环境变量开关控制

## 正式服处理建议

### 建议原则

- 正式服优先保证商城购买、充值、订单主流程不受影响
- helper 入口默认隐藏
- 执行类能力必须最后开放
- 正式服所有执行类能力都应该建立在“新快照”和“恢复预演”之后

### 推荐灰度顺序

#### 第 0 步：保持正式服默认关闭

正式服环境变量建议先保持：

- `HELPER_BRIDGE_ENABLED=0`
- `HELPER_SCAN_BIND_ENABLED=0`
- `HELPER_TEAM_SNAPSHOT_ENABLED=0`
- `HELPER_TEAM_SWITCH_ENABLED=0`
- `HELPER_TEAM_RESTORE_ENABLED=0`

这样当前正式服不会暴露 helper 实验区。

#### 第 1 步：先开扫码绑定与快照

如果要开始灰度，建议第一阶段只开：

- `HELPER_BRIDGE_ENABLED=1`
- `HELPER_BRIDGE_MODE=production`
- `HELPER_SCAN_BIND_ENABLED=1`
- `HELPER_TEAM_SNAPSHOT_ENABLED=1`
- `HELPER_TEAM_SWITCH_ENABLED=0`
- `HELPER_TEAM_RESTORE_ENABLED=0`

目标：

- 先验证正式服用户是否能稳定绑定角色
- 先验证正式服快照是否能稳定读回
- 暂时不允许真实写游戏

#### 第 2 步：再开直接切预设阵容

第二阶段可考虑开启：

- `HELPER_TEAM_SWITCH_ENABLED=1`

但仍建议：

- `HELPER_TEAM_RESTORE_ENABLED=0`

目标：

- 先让正式服只做“切预设阵容”
- 这是最窄、最明确、最容易回滚的执行动作

#### 第 3 步：最后再评估安全恢复 Beta

只有在这些条件都满足后，才建议考虑：

- `HELPER_TEAM_RESTORE_ENABLED=1`

建议前置条件：

- 正式服已有一轮真实用户的扫码绑定和快照读取反馈
- 新快照结构稳定
- 旧快照拦截逻辑已验证
- 切预设阵容链路无异常
- 明确对外文案：只归位洗练套，不回滚洗练数值

## 正式服上线前检查项

### 配置检查

- 正式服 `.env` 是否按预期开启或关闭 helper 开关
- `HELPER_PUBLIC_BASE` 是否指向正式 helper 入口
- `HELPER_BRIDGE_MODE` 是否不是 `staging`

### 页面检查

- 商城首页是否按预期开启或隐藏 helper 区域
- 如果开启 helper，文案是否明确写了当前范围和边界
- 旧快照是否被正确拦截

### 行为检查

- 扫码绑定是否能成功落库
- 阵容快照是否能成功保存
- 动作日志是否能记录
- 直接切阵容是否能记录成功或失败
- 安全恢复如果未开启，按钮是否完全不可见

### 回滚检查

正式服如果需要快速回滚，最直接的做法不是改代码，而是先关环境变量：

- `HELPER_BRIDGE_ENABLED=0`

如果只想停执行类能力，可保留读取能力，只关闭：

- `HELPER_TEAM_SWITCH_ENABLED=0`
- `HELPER_TEAM_RESTORE_ENABLED=0`

## 当前建议

如果你接下来要处理正式服，我建议按下面这个顺序：

1. 先不要开正式服安全恢复
2. 先决定是否只灰度“扫码绑定 + 快照”
3. 如果要灰度，再单独走一轮正式服验收
4. 验收通过后，再考虑是否开放“直接切预设阵容”
5. `安全恢复 Beta` 放到最后

当前最稳的正式服方案是：

- 正式服先只开读，不开写

如果你确认要继续，我下一步建议直接补一份：

- 正式服 helper 灰度上线检查清单

这样你处理正式服时就能直接照表执行。
