# 2026-05-09 正式服阶段摘要

这份记录用于接手当前正式服代码时快速了解最近一轮已经上线的能力、关键规则和验证方式。

## 当前线上版本

- 正式服地址：`http://101.34.247.186/`
- 测试服地址：`http://101.34.247.186:8081/`
- 最近一次正式服前端版本：`release-20260509-160631`
- 当前赛季：`S5 朱明赛季`
- 赛季结束时间：`2026-06-04 23:59`

正式服继续使用 Docker 单容器部署，测试服和正式服由不同 compose project 隔离。发版脚本会自动同步拆页入口、统一 ES module 版本号、执行前端校验、同步 helper 静态资源并重建容器。

## 最近完成的主线能力

### 前端拆页和发布校验

- 商城、个人中心、登录、脚本、拍卖页已经从单一 `index.html/app.js` 拆成独立入口。
- `scripts/sync_frontend_entries.py` 负责从主入口同步拆页 HTML。
- `scripts/version_frontend_modules.py` 负责统一所有前端模块 import 的 `?v=` 版本。
- `scripts/validate_frontend.py` 会检查语法、HTML 引用、模块版本链和公网资源。
- `scripts/validate_entry_performance.js` 会拦住入口文件过大或误回到大单页模式。

### Helper 和扫码登录

- Helper 已接入测试服和正式服页面入口。
- 登录页支持“扫码登录商城账号”，复用 helper 微信扫码导入 token 流程。
- 扫码成功后会通过 `/auth/game/bind` 绑定或创建商城账号，并保存商城 JWT。
- 个人中心和 helper 绑定使用 `game_role_id + game_server` 作为游戏角色关联键。
- 功法仓库读取默认收起明细，避免同步后一次性渲染大量卡片和图片。

### 后台和业务拆分

- 后台前端已经拆分为 `admin-pages/`、`admin-renderers/`、`admin-runtime/`、`admin-services/`、`admin-state/`。
- 后端新增了 `modules/`、`domain/`、`repositories/` 分层，逐步从旧 `dev-store` 和大 service 文件迁移。
- 管理员角色、审计动作、错误 envelope、充值状态、额度流水类型等常量已经集中到 domain/config 模块。
- 关键写操作带 request id 和审计日志，方便正式服排查。

### S5 首周购买策略

赛季首周限制只影响额度购买，不影响转账锁卡和残卷转赠：

- 当赛季金卡双词条：首周不能用额度买。
- 当赛季金卡单词条且词条值 `>= 2.5`：首周不能用额度买。
- 当赛季金卡单词条且词条值 `< 2.5`：仍可用额度买。
- 页面顶部有统一说明，卡片按钮只显示简短状态，不在每张卡重复长文案。

规则实现入口：

- `backend/src/domain/purchase-policy.js`
- `frontend/page-renderers/product-list-renderers.js`
- `frontend/page-renderers/product-detail-renderers.js`

### 图鉴动态套餐

商城新增动态图鉴套：

- 红卡图鉴套：`401/402/403` 三张一套。
- 橙、紫、蓝、绿图鉴套按各品质配置的卡种成套。
- 用户在详情弹窗选择攻击档和血量档。
- 只有同攻击、同血量，并且每个必需卡种都有在售库存时，才算“可凑”。
- 下拉选项会标记 `可凑` 或 `无整套`，无整套选项禁用。
- 价格按当前选中组合中每个卡种最便宜的一张卡相加。
- 下单时后端会重新按同一规则计算和扣减组件库存，前端显示不能作为最终信任来源。

实现入口：

- `backend/src/domain/dynamic-bundles.js`
- `backend/src/routes/products.js`
- `backend/src/repositories/pg/orders-repository.js`
- `backend/src/repositories/file/orders-repository.js`
- `frontend/page-renderers/product-detail-renderers.js`
- `frontend/page-runtime/product-modal-runtime.js`
- `frontend/page-actions/commerce-actions.js`

## 常用验证命令

本地发版前：

```bash
node --check backend/src/domain/dynamic-bundles.js
node --check frontend/app.js
node --check frontend/page-renderers/product-detail-renderers.js
node --check frontend/page-runtime/product-modal-runtime.js
python3 scripts/validate_frontend.py
node scripts/validate_backend_contracts.js
node scripts/validate_entry_performance.js
```

正式服发版后：

```bash
python3 scripts/validate_frontend.py --base-url http://101.34.247.186
curl -fsS http://101.34.247.186/shop.html | rg "shop-entry|release-"
curl -fsS "http://101.34.247.186/products/-9100?item_kind=bundle"
```

测试服发版后：

```bash
python3 scripts/validate_frontend.py --base-url http://101.34.247.186:8081
curl -fsS http://101.34.247.186:8081/script.html | rg "script-entry|release-"
```

## 排查提醒

- 如果页面按钮突然不响应，优先检查 HTML 入口、entry script、`app.js` 和 inner import 是否全部是同一个 release 版本。
- 如果用户说“套餐明明没有一套却显示可凑”，检查 `bundle_variants`，必须按同攻击、同血量、全卡种齐备判断。
- 如果用户说“功法读取很卡”，确认 helper inventory 是否默认收起，避免一次渲染全部卡片 DOM。
- 正式服和测试服 helper 静态资源都由部署脚本同步，确认 helper 页面时要同时看商城入口版本和 helper 资源版本。
- 工作区长期存在大量历史改动，发布或提交前不要使用 `git reset --hard` 或全量回退。
