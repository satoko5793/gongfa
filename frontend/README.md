# Frontend

前端当前是无构建的静态页面方案，直接由后端 Express 托管。

## 文件说明

- [index.html](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/index.html)
  前台入口，包含商品、注册登录、个人中心、充值、订单

- [admin.html](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/admin.html)
  后台入口，管理员登录、商品、用户、订单、充值审核

- [app.js](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/app.js)
  前台主交互逻辑，当前仍是主要业务文件

- [admin.js](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/admin.js)
  后台兼容入口，当前继续负责装配和保留高交互逻辑

- `admin-runtime/`
  后台 DOM 引用、page shell 和分页壳层能力

- `admin-state/`
  后台状态初始化与共享常量

- `admin-services/`
  后台 API helper 和 shared.js 收口

- `admin-renderers/`
  后台纯展示渲染能力，当前先承接 imports queue、session / overview / alerts、pricing summary

- `admin-pages/`
  后台 page panel 注册表和页面加载入口，当前对应 `imports / catalog / users / orders / recharge / logs`

- [shared.js](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/shared.js)
  前后台共享工具

- `page-mode.js`
  前台多页面模式配置与页面运行时识别

- `page-startups/`
  前台按页面拆开的启动编排模块，负责决定每个入口先启动哪些板块

- `page-loaders/`
  前台按业务拆开的异步加载模块，当前先承接商品、最近成交、拍卖、账户加载流程

- `page-actions/`
  前台按业务拆开的提交与动作模块，当前已承接认证、购买、充值、订单取消、拍卖出价、代抽提交、资料修改、改密码、退出登录，以及商品锁卡提交，外加 helper 的主要用户动作、桥接消息处理、快照编辑动作和 bind/auth/tool/popup 入口动作

- `page-renderers/`
  前台按业务拆开的渲染模块，当前已承接 helper 面板相关的 UI 渲染，以及商城商品列表、商品卡 / 详情弹窗、商城首页的新手教学 / 最近成交、个人资料 / 订单 / 充值面板、拍卖区卡片与倒计时、代抽提交区这些前台渲染链路

- `page-runtime/`
  前台按业务拆开的运行时模块，当前先承接 helper iframe bridge、URL 拼装和后台超时兜底、safe-restore / preview / snapshot 能力摘要这类纯 builder 逻辑，以及商城 / 充值共用的金额换算与支付方式 builder、充值报价与充值记录文案 builder、交易动作 context 组装、登录后即时回填 / post-auth 跳转 / focus 记忆、登录 / 注册 / 账户表单动作 context 组装、auth/account/beginner/dock 这些 page-shell 监听绑定、helper 面板入口 / 快照面板 / bridge modal 这些 helper shell 监听绑定、全局 boot 启动任务与窗口级事件监听、boot 的页面级 `startupContext` 组装、`shop / auction / me` 底部交互监听收口的 page interaction bindings、登录入口跳转 / post-auth 跳转 / dock 导航 / viewport 同步这些页面导航 runtime、商品详情弹窗的上下文 / 激活态辅助、商城商品详情弹窗、商品列表的搜索 / 筛选 / 分页交互、个人页账户 tab / hash / 充值区交互 / 充值预览 / 表单入口 / 退出入口、拍卖区交互和倒计时刷新、代抽区输入 / preset / 提交这些前台运行时

- `shop-entry.js` / `login-entry.js` / `script-entry.js` / `auction-entry.js` / `me-entry.js`
  各前台入口页面对应的模块入口脚本

- [styles.css](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/styles.css)
  前后台历史主样式，当前仍作为兼容兜底

- `styles/`
  后台样式分片入口，当前先按 `base / admin / admin-products / admin-recharge / admin-logs / helper` 建立落点

- `gongfa/`
  功法图片静态资源

- `guides/`
  注册指导图、微信群二维码

- `payment/`
  支付宝收款码

- `legacy-json/`
  后台 JSON 导入时使用的历史数据快照

## 当前前台结构

前台主要分区：

1. Hero 区
2. 商品列表
3. 注册登录与手动绑定
4. 我的账户
5. 额度充值
6. 充值记录
7. 最近订单
8. 加群咨询

当前拆页后的入口关系：

1. `index.html`：兼容入口，继续承载旧的单页组合视图
2. `shop.html`：商城、新手引导、打折区
3. `login.html`：注册、登录、扫码/BIN 登录
4. `script.html`：helper 阵容能力
5. `auction.html`：拍卖与代抽
6. `me.html`：个人账户、充值、订单帮助，以及账号强绑定的 helper 能力

## 当前阶段判断

- 第一阶段：多入口拆页 + 页面模式收口，已完成
- 第二阶段：按业务和页面壳层逐步掏空 `app.js`，已基本完成，可作为当前阶段节点
- 如果接下来优先准备上线，建议先收稳定性和回归，不急着继续做大拆分

## 上线前建议

- 先冻结结构性大改，只修影响上线的问题
- 至少再人工回归这 5 个入口：
  - `shop.html`
  - `login.html`
  - `script.html`
  - `auction.html`
  - `me.html`
- 重点确认：
  - 登录 / 注册 / 绑定
  - 商城浏览 / 购买 / 锁卡
  - 充值 / 充值记录 / 取消订单
  - helper 绑定 / 快照 / 预演 / 还原
  - 拍卖 / 代抽
- 上线说明里建议明确：
  - 各页面用途
  - `index.html` 是否继续作为兼容入口
  - 已知限制
  - 回滚方式

## 当前后台结构

后台主要分区：

1. 管理员登录
2. 运营概览
3. JSON 导入
4. 商品管理
5. 用户管理
6. 订单管理
7. 充值订单
8. 充值配置
9. 审计日志
10. 额度流水

## 当前后台拆分阶段

- 第三阶段：后台前端拆分，已进入“兼容入口 + 新模块骨架”的阶段
- `admin.js` 现在不再继续承担全部结构责任，后续应优先往 `admin-runtime / admin-state / admin-services / admin-renderers / admin-pages` 迁移
- `styles.css` 继续保留，但后台页已经开始显式挂载 `styles/*.css` 作为后续迁移落点

## 调样式时优先注意

- 桌面端和移动端都要看
- `styles.css` 里已经有 `900px` 和 `720px` 两级响应式断点
- 前台和后台共用一套色系，不要随手改成完全不同的视觉
- 页面里大量锚点跳转依赖固定 `id`，改结构时别删掉：
  - `products`
  - `bind`
  - `account`
  - `recharge-panel`
  - `help-panel`

## 当前资源依赖

- 注册指导图：
  [frontend/guides/id-guide.jpg](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/guides/id-guide.jpg)

- 微信群二维码：
  [frontend/guides/wechat-group.png](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/guides/wechat-group.png)

- 支付宝收款码：
  [frontend/payment/alipay-qr.jpg](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/payment/alipay-qr.jpg)
- 残卷转赠：
  游戏内直接转给管理员 `584967604`，后台配置现金到残卷比例（例如 `X 元 = 10000 残卷`），再按固定 `8 元 = 10000 额度` 折算到账
