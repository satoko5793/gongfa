# Web 上线准备清单

## 目标

当前前台拆页已经进入可发布状态，这一轮的目标不是继续大拆分，而是把可上线范围、回归步骤、已知风险和发布前确认项收口清楚。

## 当前发布范围

建议本轮按以下前台入口组织发布：

1. `index.html`
   兼容入口，保留旧的组合视图
2. `shop.html`
   商城、新手教学、打折区、最近成交
3. `login.html`
   注册、登录、绑定
4. `script.html`
   helper 阵容能力
5. `auction.html`
   拍卖与代抽
6. `me.html`
   个人账户、充值、订单帮助，以及账号强绑定的 helper 能力

后台继续保留：

1. `admin.html`

## 发布前自动检查

发布前至少执行一次：

1. `python3 scripts/sync_frontend_entries.py`
2. `PYTHONPYCACHEPREFIX=/tmp/gongfa-pyc python3 -m py_compile scripts/sync_frontend_entries.py`
3. `python3 scripts/validate_frontend.py --base-url http://127.0.0.1:8090`

如果需要更严格一点，再补：

1. `node --check frontend/app.js`
2. `node --check frontend/page-runtime/*.js`
3. `node --check frontend/page-renderers/*.js`
4. `node --check frontend/page-actions/*.js`
5. `node --check frontend/page-loaders/*.js`
6. `node --check frontend/page-startups/*.js`

## 发布前人工回归

### 页面入口

至少打开并确认：

1. `/`
2. `/shop.html`
3. `/login.html`
4. `/script.html`
5. `/auction.html`
6. `/me.html`
7. `/admin.html`

### 关键链路

#### 登录与绑定

1. 注册表单可提交
2. 登录表单可提交
3. 绑定表单可回填和提交
4. 登录后跳转和 account focus 正常

#### 商城

1. 商品列表正常加载
2. 搜索、筛选、分页正常
3. 打折区正常显示
4. 商品详情弹窗可打开和关闭
5. 直接购买和锁卡提交链路可用
6. 新手教学和最近成交只在 `shop.html` 显示

#### 个人后台

1. 资料修改可提交
2. 改密码可提交
3. 退出登录可用
4. 充值面板、充值记录、订单列表正常
5. 取消订单入口可用

#### helper

1. helper 地址保存可用
2. bind / auth popup 可打开
3. 当前绑定切换可用
4. 库存同步入口可用
5. 快照保存、预览、还原、改名、置顶、删除可用
6. bridge modal 可打开和关闭
7. `script.html` 和 `me.html` 的 helper 面板都正常

#### 拍卖与代抽

1. 拍卖列表正常显示
2. quick bid、输入预览、提交入口正常
3. 倒计时刷新正常
4. 代抽额度预览、preset、提交正常

#### 移动端

1. 顶部导航 tab 可见
2. 窄屏可左右滑动查看所有 tab
3. 主要弹窗和表单不溢出
4. `shop / login / auction / me / script` 五页都至少看一遍

## 已知当前状态

1. 前台多页面入口已经稳定可用
2. `app.js` 已经从巨型入口下降为共享业务主文件，页面级启动、导航和大部分交互已拆到独立模块
3. 当前仍然保留 `index.html` 作为兼容入口
4. 当前仍是无构建静态页面方案，由后端直接托管

## 发布前建议确认

1. 这次是否继续保留 `index.html` 对外可访问
2. `script.html` 是否直接开放给普通用户
3. `auction.html` 的拍卖和代抽是否全部开放
4. 当前 `debug` 信息是否需要继续保留
5. helper 相关能力是否需要补一版更明确的用户说明

## 回滚建议

如果发布后发现问题，优先按最小范围回滚：

1. 先回退入口页变更和 `app.js`
2. 保留后台数据和接口不动
3. 必要时临时只保留 `index.html` 兼容入口，对外先收口页面数量

## 发布后观察项

上线后优先观察：

1. 页面打不开或白屏
2. 登录失败或登录后跳转异常
3. 商品列表或商品详情加载失败
4. 充值提交或订单取消异常
5. helper bridge 回传失败
6. 拍卖出价或代抽提交异常

## 当前一次回归记录

时间：

- `2026-04-08`

已实际执行：

1. `python3 scripts/sync_frontend_entries.py`
2. `PYTHONPYCACHEPREFIX=/tmp/gongfa-pyc python3 -m py_compile scripts/sync_frontend_entries.py`
3. `python3 scripts/validate_frontend.py --base-url http://127.0.0.1:8090`
4. headless Chrome 检查：
   - `/`
   - `/shop.html`
   - `/login.html`
   - `/script.html`
   - `/auction.html`
   - `/me.html`
   - `/admin.html`

当前结果：

1. `/health` 返回正常
2. `validate_frontend.py` 通过
3. `/products` 当前返回 `206` 条商品
4. 前台 6 个入口的页面模式和关键节点都能正常渲染
5. `admin.html` 返回 `200 OK`，登录表单节点存在

说明：

- `admin-dashboard` 这类后台登录后区域，本轮只确认了后台入口和登录表单存在，没有做管理员登录后的业务回归
- 前台关键表单和业务按钮本轮完成的是结构/入口级确认，真正的人工业务提交流程仍建议在正式上线前再走一遍

## 当前补充接口回归

为了不影响当前 `8090` 展示环境，额外起了一个独立 smoke 服务：

- `http://127.0.0.1:18190`
- 启动参数：
  - `PORT=18190`
  - `USE_FILE_STORE=1`
  - `DEV_STORE_DATA_PATH=/tmp/gongfa-release-smoke.json`
  - `JWT_SECRET=dev-secret`

已实际跑通：

1. `注册 -> 登录 -> 后台加额度 -> 下单 -> 取消申请 -> 后台审核取消`
2. `GET /auth/me`
3. `GET /me/quota`
4. `GET /me/orders`
5. `GET /helper/bindings/current`
6. `GET /helper/config`
7. `POST /me/recharge-orders`
8. `GET /me/recharge-orders`
9. `POST /helper/bindings/current`
10. `DELETE /helper/bindings/current/:id`

当前结果：

1. 管理员登录返回 `200`
2. 新用户注册和登录返回 `200`
3. 购买后额度从 `50000 -> 44000`
4. 取消审核后额度回退到 `50000`
5. 订单状态正确流转：
   - `pending`
   - `cancel_requested`
   - `cancelled`
6. helper 相关接口返回正常；当前 smoke 环境里 `helper_config.enabled=false`、`mode=off`
7. 充值申请创建成功，订单状态为 `pending_review`
8. helper 绑定创建成功，列表可查到，删除后列表恢复为空

## 当前阻断项

当前没有新的功能阻断项。

已经收口完成：

1. `JWT_SECRET` 缺失导致的登录 `500` 已修复
2. `backend/src/server.js` 已改成缺少 `JWT_SECRET` 时启动即失败
3. `start-local.cmd` 已补本地默认值：
   - `JWT_SECRET=dev-secret`
   - `USE_FILE_STORE=1`
4. 本地 `8090` 已重启并验证可用

## 当前补充真实前台回归

为了确认不是“接口能通但页面提交流程有问题”，已在当前本地 `8090` 上实际跑了一轮真实前台登录和下单回归。

前提修正：

1. 先补齐本地运行环境的 `JWT_SECRET`
2. 重启当前本地 `8090` 服务
3. 复核 `POST /auth/login` 在 `8090` 已从 `500` 恢复为 `200`

本轮实际动作：

1. 通过接口创建一个测试密码账号
2. 后台给该账号补额度
3. 用真实前台 `login.html` 提交登录表单
4. 登录成功后进入真实前台 `shop.html`
5. 在商品列表里点击真实购买按钮
6. 在商品详情弹窗里点击真实“确认购买”
7. 再进入真实前台 `me.html` 检查订单列表

当前结果：

1. 登录页会话摘要正常显示测试角色名
2. 商城页成功触发真实购买动作
3. 订单数从 `0` 变为 `1`
4. 最新订单状态为 `pending`
5. `me.html` 的订单列表已能看到订单记录

## 2026-04-08 补充真实 UI / Smoke 回归

这轮继续围绕“上线前关键交易链路”补了真实页面和 smoke 测试，不再只看页面结构。

已实际跑通：

## 2026-04-09 正式发布与性能回归

本轮已按当前 runbook 完成正式发布，并补了发布后的性能与交易链路确认。

已实际执行：

1. `python3 scripts/sync_frontend_entries.py`
2. `PYTHONPYCACHEPREFIX=/tmp/gongfa-pyc python3 -m py_compile scripts/sync_frontend_entries.py`
3. `python3 scripts/validate_frontend.py --base-url http://127.0.0.1:8090`
4. `node scripts/validate_entry_performance.js --base-url http://127.0.0.1:8090`
5. `ssh gongfa-prod 'cp /opt/gongfa/backend/dev-data.json /opt/gongfa/backend/dev-data.json.bak-20260409-174503'`
6. `./scripts/deploy-prod.sh`
7. `python3 scripts/validate_frontend.py --base-url http://101.34.247.186`
8. `node scripts/validate_entry_performance.js --base-url http://101.34.247.186`
9. `GONGFA_BASE_URL=http://101.34.247.186 node scripts/smoke-local-order-cancel.js`

当前结果：

1. 正式容器 `gongfa-web` 已重建完成，状态为 `healthy`
2. 公网 `/`、`/admin.html`、`/health` 均返回正常
3. 公网 `/products` 当前返回 `499` 条商品
4. 公网缓存头符合当前性能策略：
   - `/` 为 `max-age=0, must-revalidate`
   - `styles.css`、`shop-entry.js` 为 `max-age=31536000, immutable`
5. 公网最短交易链路已跑通：
   - 注册
   - 管理员加额度
   - 下单
   - 发起取消申请
   - 后台审核取消
6. 本次 smoke 结果：
   - 测试用户：`smoke_1775728028500`
   - 商品：`#722 运气决`
   - 额度：`50000 -> 48050 -> 50000`
   - 订单状态：`pending -> cancel_requested -> cancelled`

1. 真实前台 `me.html` 充值提交流程
2. 真实前台 `me.html` 订单取消申请
3. 真实后台 `admin.html` 登录后审核充值
4. 真实后台 `admin.html` 登录后通过取消申请
5. `scripts/smoke-local-order-cancel.js`
6. `python3 scripts/validate_frontend.py --base-url http://127.0.0.1:8090`

当前结果：

1. 前台充值真实提交成功：
   - 测试账号：`recharge_1775652481190`
   - 充值单：`#8`
   - 状态：`pending_review`
   - 页面预估到账：`10000 额度`
2. 前台取消申请真实提交成功：
   - 测试账号：`cancel_1775652581885`
   - 订单：`#9`
   - 状态：`pending -> cancel_requested`
3. 后台真实登录并审核成功：
   - 测试账号：`adminui_1775652586637`
   - 充值单：`#9`，状态 `pending_review -> approved`
   - 订单：`#10`，状态 `cancel_requested -> cancelled`
   - 最终额度：`58333`
4. `scripts/smoke-local-order-cancel.js` 通过：
   - 商品：`退堂鼓`
   - 额度：`50000 -> 49000 -> 50000`
   - 订单状态：`pending -> cancel_requested -> cancelled`
5. `validate_frontend.py` 通过，当前 `/products` 返回 `206` 条商品

当前判断：

1. 前台关键链路里，登录、下单、充值申请、订单取消申请都已经覆盖过
2. 后台关键链路里，管理员登录、充值审核、取消审核都已经覆盖过
3. 现在剩下更像“上线前最后人工确认”和“测试数据清理”，不是明显功能阻断

## 2026-04-08 收尾结果

这轮已经把本地回归留下的测试数据清理掉，并重新验证了一次当前 `8090`。

已完成：

1. 清理本地测试账号、测试订单、测试充值单、额度日志
2. 恢复测试期间被扣减的商品库存
3. 重启本地 `8090`
4. 再次执行 `python3 scripts/validate_frontend.py --base-url http://127.0.0.1:8090`

当前结果：

1. 本地 `dev-data.json` 已回到干净状态：
   - `users=2`
   - `orders=2`
   - `rechargeOrders=0`
2. `/health` 返回 `200`
3. `validate_frontend.py` 再次通过
4. `/products` 当前返回 `211` 条商品
5. 回归中卖掉的测试商品库存已恢复：
   - `product#1` 恢复为 `1`
   - `product#2` 恢复为 `1`
   - `product#3` 恢复为 `2`
   - `product#4` 恢复为 `1`
   - `product#5` 恢复为 `36`
   - `product#153` 恢复为 `1`

## 上线建议

现在可以进入发布动作，建议按这个顺序执行：

1. 确认正式环境变量已配置：
   - `JWT_SECRET`
   - 数据存储路径或数据库连接
2. 先备份正式数据
3. 发布后先检查：
   - `/health`
   - 首页 / `shop.html`
   - `login.html`
   - `me.html`
   - `admin.html`
4. 用一个全新测试账号再走一遍最短人工验收：
   - 注册 / 登录
   - 管理员加额度
   - 下单
   - 取消申请
   - 后台审核取消
5. 发布后重点观察：
   - 登录是否有 `500`
   - 下单后额度是否正确扣减
   - 后台审核充值和取消是否正常

## 2026-04-09 正式发布与收尾结果

这轮已经完成正式发布、正式服回归和 smoke 数据清理。

已实际执行：

1. 备份正式数据文件：
   - `/opt/gongfa/backend/dev-data.json.bak-20260409-174503`
2. 执行正式发布脚本：
   - `./scripts/deploy-prod.sh`
3. 执行正式服自动校验：
   - `python3 scripts/validate_frontend.py --base-url http://101.34.247.186`
   - `node scripts/validate_entry_performance.js --base-url http://101.34.247.186`
4. 执行正式服最短交易链路：
   - 注册 / 登录
   - 管理员加额度
   - 下单
   - 取消申请
   - 后台审核取消
5. 清理正式服 smoke 数据并重启服务

当前结果：

1. 正式容器 `gongfa-web` 为 `healthy`
2. `/health` 返回 `{"ok":true}`
3. 公网首页和后台入口返回正常
4. HTML 短缓存、静态资源长缓存已在公网确认生效
5. 正式服 smoke 数据已清理完成：
   - `smoke_users=0`
   - `smoke_orders=0`
   - `smoke_items=0`
   - `smoke_quota_accounts=0`
