# 23 Helper 能力审计与一键还原路线

更新时间：2026-04-04

## 目标

这份文档回答三个问题：

- `xyzw_web_helper` 现在已经能读出哪些有价值的信息
- helper 现在已经能“写回”哪些阵容相关配置
- 功法商城接下来应该怎样把“一键还原”做成可控、可测试、可回退的能力

当前结论先说在前面：

- helper 已经不是只读工具，它内部已经有一条接近“一键还原”的成熟编排
- 这条编排主要在 [Unlimitedlineup.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/components/cards/Unlimitedlineup.vue)
- 这条编排的第一步不是升级，而是按 `attachmentUid` 先把“洗练/附属归属”换回目标武将
- 其中“武将站位、武将等级、鱼灵、鱼珠技能、俱乐部科技、主玩具”都已经有可执行写命令
- “装备洗练”虽然有独立命令和工具页，但还没有并入同一条阵容恢复主链

所以商城的一键还原不应该从零开始重造，而应该优先复用 helper 现有的恢复模型。

## 审计范围

本次重点看了这些文件：

- [Unlimitedlineup.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/components/cards/Unlimitedlineup.vue)
- [RefineHelperCard.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/components/cards/RefineHelperCard.vue)
- [TokenImport/index.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/views/TokenImport/index.vue)
- [helperBridgeSnapshot.js](/Users/xyq/Desktop/123/xyzw_web_helper/src/utils/helperBridgeSnapshot.js)
- [xyzwWebSocket.js](/Users/xyq/Desktop/123/xyzw_web_helper/src/utils/xyzwWebSocket.js)

## 已确认的可读取信息

helper 当前已经稳定读取到的核心数据包括：

- 当前使用的预设阵容号
- 当前阵容 1-6 号槽的阵容结构
- 武将 ID、名称、阵营、头像、等级、战力、星级
- 武将当前持有的 `attachmentUid` 洗练归属标识
- 鱼灵佩戴信息
- 鱼珠技能和鱼珠孔位颜色/属性
- 装备洗练数据
- 单件装备的孔位属性、颜色、锁定状态
- 俱乐部科技 `legionResearch`
- 主玩具 `weaponId`
- 俱乐部名、红淬统计、开孔统计等战力摘要

商城现在已经接到并落库的，主要是：

- 当前阵容武将摘要
- 鱼灵/鱼珠摘要
- 装备洗练摘要
- 红淬/开孔统计
- 原始 `presetTeam` 与 `roleInfo` 原始包

这意味着商城云端快照已经具备继续扩展示意和恢复分析的基础，不需要重新设计一套采集协议。

## 已确认的可写命令

### 阵容与武将

helper 已注册并实际使用这些命令：

- `presetteam_saveteam`
- `hero_gointobattle`
- `hero_gobackbattle`
- `hero_exchange`

这些命令已经在 [Unlimitedlineup.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/components/cards/Unlimitedlineup.vue) 的阵容应用流程里被串起来了，所以“把某份保存阵容还原到当前阵容槽位”这件事不是纸上能力，而是 helper 自己已经在做的事。

这里要特别强调一个业务约束：helper 会先读取全角色的 `attachmentUid -> heroId` 映射。如果目标武将需要的那套洗练归属当前在别的武将身上，它会优先做临时上阵和 `hero_exchange`，先把这套归属换回目标武将，再继续站位、等级和鱼灵步骤。

### 武将等级

helper 已经有完整等级回放逻辑：

- `hero_heroupgradelevel`
- `hero_heroupgradeorder`
- `hero_rebirth`

它会根据目标等级自动判断：

- 当前等级高于目标时先重生
- 需要进阶时自动穿过进阶节点
- 按批次升级直到到达目标等级

这块也已经在 [Unlimitedlineup.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/components/cards/Unlimitedlineup.vue) 内部被封装成 `applyHeroLevel(...)`。

### 鱼灵与鱼珠技能

helper 已经具备：

- `artifact_load`
- `artifact_unload`
- `pearl_replaceskill`
- `pearl_exchangeskill`
- `pearl_unloadskill`

并且 helper 不是简单“覆盖写入”，而是先判断当前持有关系、必要时先卸下、再处理技能交换或替换。这说明它已经考虑过鱼灵/鱼珠之间的占用冲突。

### 俱乐部科技

helper 已经具备：

- `legion_resetresearch`
- `legion_research`

并且 [Unlimitedlineup.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/components/cards/Unlimitedlineup.vue) 中的 `syncLegionResearch(...)` 会：

- 先按科技类型判断是否需要整类重置
- 再逐项升回目标等级
- 对满级项走 `isMax` 快路径

这说明科技不是“只能看”，而是已经有可回放模型。

### 主玩具

helper 已经具备：

- `lordweapon_changedefaultweapon`

并且当前阵容应用流程里已经会对比当前玩具和目标玩具，不一致时再执行切换。

### 装备洗练

helper 已注册并在独立工具页中使用：

- `equipment_confirm`
- `equipment_quench`
- `equipment_updatequenchlock`

这说明协议层面已经具备：

- 查看当前孔位
- 锁孔/解锁
- 进行淬炼
- 基于 `seed` 确认后继续淬炼

但这条能力目前主要用于 [RefineHelperCard.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/components/cards/RefineHelperCard.vue) 的人工/半自动淬炼，不在 [Unlimitedlineup.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/components/cards/Unlimitedlineup.vue) 的阵容恢复主链里。

所以要区分两件事：

- “洗练归属迁移”已经在 [Unlimitedlineup.vue](/Users/xyq/Desktop/123/xyzw_web_helper/src/components/cards/Unlimitedlineup.vue) 主链里，依赖 `attachmentUid`
- “把洗练孔位数值回滚到某个历史快照”还不在主链里，仍然属于高风险实验项

这也是当前“一键还原”里最需要谨慎的部分。

## 能力矩阵

### 已验证可接入商城恢复

- 武将上下阵与站位
- 切换目标预设阵容槽位
- 武将等级
- 洗练归属迁移 `attachmentUid`
- 鱼灵佩戴
- 鱼珠技能
- 俱乐部科技
- 主玩具

### 已记录但暂不建议立刻自动恢复

- 装备洗练孔位属性
- 装备锁孔状态
- 更细的装备淬炼过程参数

原因：

- 洗练存在连续写命令、种子确认、锁孔、安全密码等约束
- 成本高、风险高、耗时更长
- 更容易被网络抖动、中断、资源不足打断

### 已适合先做展示/分析的内容

- 单武将装备 4 部位孔位详情
- 鱼珠孔位颜色和属性
- 科技项数量与科技类型覆盖
- 主玩具差异
- 当前阵容和某份快照的字段差异

## 对商城当前实现的意义

功法商城目前已经具备：

- 扫码绑定真实游戏账号
- 读取并保存阵容快照到云端
- 切换预设阵容 1-4

而 helper 审计结果说明，商城下一步其实不应该直接做“完整一键还原”，而应该拆成两层。

### 第一层：安全恢复

先接 helper 已经成熟、风险较低、可观察性强的能力：

- 武将站位恢复
- 武将等级恢复
- 鱼灵恢复
- 鱼珠技能恢复
- 俱乐部科技恢复
- 主玩具恢复

这条能力已经足够构成一个很有价值的“一键阵容还原 beta”。

### 第二层：高风险补全

后续再单独做：

- 洗练恢复
- 锁孔恢复
- 更细的资源不足/中断补偿

这部分更适合作为“高级实验功能”，并且默认只在测试服打开。

## 推荐的商城落地顺序

### 阶段 A：恢复分析

先在商城快照详情里明确展示：

- 这份快照记录了哪些字段
- 哪些字段 helper 已有恢复能力
- 哪些字段当前只是记录，还没有接执行

这样用户看到的不是一个黑箱按钮，而是一份可解释的恢复清单。

### 阶段 B：干跑模式

新增“恢复预演”：

- 不真正写游戏
- 只分析当前角色和目标快照的差异
- 输出将要执行的步骤列表

例如：

- 需要下阵 2 名武将
- 需要上阵 2 名武将
- 需要提升 3 名武将等级
- 需要切换 4 个鱼灵
- 需要重置并重建 2 类俱乐部科技
- 需要切换主玩具

### 阶段 C：安全恢复 Beta

在测试服开放“一键还原 Beta”，范围限定为：

- 武将
- 等级
- 鱼灵
- 鱼珠技能
- 科技
- 主玩具

并且要求：

- 只对已绑定角色开放
- 执行前展示确认清单
- 执行后写动作日志
- 自动刷新并重新读取一份新快照

### 阶段 D：洗练恢复实验

最后单独评估：

- 是否允许恢复洗练
- 是否要求二级密码
- 是否需要强确认
- 是否要拆成单独按钮而不是合并进“一键还原”

## 当前建议

当前最值得做的不是直接把“完整恢复”按钮怼上去，而是：

1. 先把商城快照详情增强成“helper 同级细节展示”
2. 加一个“恢复分析 / 预演”面板
3. 在测试服接入安全恢复 Beta

这样推进会有三个好处：

- 用户看得明白，不会误以为商城只是随便存了几张卡片
- 我们能先验证恢复编排是否稳定，再决定要不要碰洗练
- 正式服可以长期保持关闭，不影响当前商城交易主流程

## 结论

helper 当前已经具备“一键还原”的核心骨架，只是这条骨架还没被商城正式桥接出来。

更准确地说：

- helper 已经拥有“安全恢复”的主要能力
- helper 还拥有“洗练恢复”的协议基础
- 商城当前要做的，不是重新发明一条恢复链，而是把 helper 现有能力按风险分层接入

因此后续实施建议是：

- 先做恢复分析
- 再做安全恢复 Beta
- 最后再碰洗练恢复
