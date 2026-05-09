# 29 2026-04-09 发布摘要

## 本次发布范围

本次正式发布聚焦网页主线，不再继续插入新的结构性改造，实际发布入口包括：

1. `/`
2. `/shop.html`
3. `/login.html`
4. `/script.html`
5. `/auction.html`
6. `/me.html`
7. `/admin.html`

## 本次发布重点

1. 前台多入口拆页已稳定落地，五个前台入口和后台入口都可独立访问。
2. 首页根路径 `/` 已切到轻量 `shop.html` 方案，减少首屏负担。
3. 前端入口已补性能收口：
   - 默认轻首屏
   - 深交互再接管完整模块
   - 页面入口不再直接同步吃整份 `app.js`
4. 静态资源缓存策略已生效：
   - HTML 短缓存
   - 带版本号的 JS/CSS 长缓存

## 发布前本地检查

已实际执行并通过：

1. `python3 scripts/sync_frontend_entries.py`
2. `PYTHONPYCACHEPREFIX=/tmp/gongfa-pyc python3 -m py_compile scripts/sync_frontend_entries.py`
3. `python3 scripts/validate_frontend.py --base-url http://127.0.0.1:8090`
4. `node scripts/validate_entry_performance.js --base-url http://127.0.0.1:8090`

## 正式发布动作

已实际执行：

1. 备份正式数据文件：
   - `/opt/gongfa/backend/dev-data.json.bak-20260409-174503`
2. 检查正式环境 `.env.production`
3. 执行发布脚本：
   - `./scripts/deploy-prod.sh`
4. 发布后检查容器、健康检查和公网入口

## 正式服验证结果

当前正式服结果：

1. 容器 `gongfa-web` 已恢复为 `healthy`
2. `/health` 返回 `{"ok":true}`
3. 前台首页和后台入口均返回 `200`
4. 公网自动校验通过：
   - `python3 scripts/validate_frontend.py --base-url http://101.34.247.186`
   - `node scripts/validate_entry_performance.js --base-url http://101.34.247.186`
5. 公网缓存头符合预期：
   - `/` 为 `Cache-Control: public, max-age=0, must-revalidate`
   - `shop-entry.js` 为 `Cache-Control: public, max-age=31536000, immutable`

## 正式服最短交易链路

已实际跑通：

1. 注册并登录
2. 管理员加额度
3. 前台下单
4. 前台申请取消
5. 后台审核取消

本次 smoke 结果：

1. 测试用户：`smoke_1775728028500`
2. 商品：`#722 运气决`
3. 额度变化：`50000 -> 48050 -> 50000`
4. 订单状态：`pending -> cancel_requested -> cancelled`

## 发布后清理

本次正式服 smoke 数据已清理完成，已确认以下残留为 `0`：

1. smoke 用户
2. smoke 订单
3. smoke 订单明细
4. smoke 额度账户

## 当前判断

这次发布已经完成，正式服处于可用状态。

后续如果继续推进，建议进入两条线之一：

1. 继续做 page-first 和性能优化的下一阶段
2. 转入业务功能迭代，不再继续大改页面结构
