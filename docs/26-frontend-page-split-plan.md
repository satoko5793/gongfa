# 前端拆页计划

## 背景

当前 `frontend/index.html` 同时承载了这些职责：

- 商城首页与新手引导
- 登录与注册
- helper 阵容中心
- 个人账户、充值、订单帮助
- 拍卖与代抽

这导致两个问题：

1. 单页心智过重，普通用户打开后很难快速定位目标功能。
2. 前端入口虽然只有一个，但实际已经演化成多业务面板，后续继续堆功能会越来越难维护。

## 目标拆分

第一阶段按业务入口拆成 5 个前台页面：

- `shop.html`
  只承载商城、新手引导、打折区。
- `login.html`
  只承载注册、登录、扫码/BIN 登录。
- `script.html`
  先只承载 helper 阵容能力。
- `auction.html`
  承载拍卖与代抽。
- `me.html`
  承载个人账户、充值、订单帮助，以及与个人账号强绑定的 helper 仓库/阵容能力。

后台继续保留：

- `admin.html`

## 本轮落地

本轮先做“入口拆分 + 页面模式收口”，不马上把 JS 完全拆包：

1. 保留现有 `index.html` 作为兼容入口。
2. 新增 `shop/login/script/auction/me` 五个页面入口。
3. 在 `app.js` 增加页面模式识别，根据当前入口隐藏无关板块。
4. 只在当前页面需要时才启动对应数据加载：
   - 商城页加载商品与最近成交
   - 脚本页/个人页加载 helper
   - 拍卖页加载拍卖
   - 登录页不主动拉这些业务数据
5. 页面入口改成真实 HTML 文件，不再依赖软链；后续可通过 `scripts/sync_frontend_entries.py` 从 `index.html` 重新同步生成。
6. 页面入口脚本独立成 `shop-entry/login-entry/script-entry/auction-entry/me-entry`，启动编排拆到 `frontend/page-startups/`，页面模式配置拆到 `frontend/page-mode.js`。
7. 首批业务加载器已拆到 `frontend/page-loaders/`，目前包括 `products / recent-sales / auctions / account`。
8. 首批表单动作已拆到 `frontend/page-actions/`，目前已覆盖 `bind / login / register` 认证主链路、`purchase / recharge / cancel-order / profile / password / logout` 这些前台主动作，以及 helper 的 `inventory-sync / slot-purchase / snapshot / preview / restore / team-switch / binding-management / scan-auth-complete` 主动作。
9. helper 的桥接回传与快照编辑逻辑已继续拆到独立模块，当前已把 `bridge-message / snapshot-rename / snapshot-pin / snapshot-delete / bridge-save-*` 这批重逻辑从 `app.js` 外提。

## 下一阶段

页面入口稳定后，再继续做真正的前端拆分：

1. 把 `app.js` 按页面拆成：
   - `shop-page.js`
   - `auth-page.js`
   - `helper-page.js`
   - `auction-page.js`
   - `me-page.js`
2. 把共享状态和工具函数抽到独立模块。
3. 逐步把 `index.html` 降级为跳转页或兼容页。

当前判断：

- 第一阶段“多入口拆页 + 页面模式收口”已完成。
- 第二阶段“按业务和页面壳层逐步掏空 `app.js`”已基本完成，可作为当前一个阶段节点。
- 后面如果继续推进，就进入更偏“长期维护和上线准备”的阶段，而不是继续抢大拆分。

当前已经先完成了：

- 页面模式配置外提
- 启动编排按页面拆成独立模块
- 多页面入口脚本独立
- 首批异步加载逻辑外提到 `page-loaders`
- 首批认证、交易与 helper 主动作外提到 `page-actions`
- 商品锁卡提交继续外提到 `page-actions`
- 拍卖出价提交继续外提到 `page-actions`
- 代抽提交继续外提到 `page-actions`
- helper 桥接消息处理与快照编辑动作继续外提到独立 action 模块
- helper 面板渲染继续外提到 `page-renderers`
- 商城商品列表的筛选 / tab / 分页 / 列表渲染继续外提到 `page-renderers`
- 商城商品卡与词条 / 属性 / 图片渲染辅助继续外提到 `page-renderers`
- 商城商品详情弹窗渲染继续外提到 `page-renderers`
- 商城首页的新手教学 / 最近成交渲染继续外提到 `page-renderers`
- 个人资料 / 订单列表 / 充值面板渲染继续外提到 `page-renderers`
- 拍卖区卡片渲染 / quick chips / 倒计时展示继续外提到 `page-renderers`
- 代抽区渲染继续外提到 `page-renderers`
- helper iframe / bridge URL / 后台超时兜底继续外提到 `page-runtime`
- helper 的 safe-restore / preview / snapshot 能力摘要 builder 继续外提到 `page-runtime`
- 商城 / 充值共用的金额换算 / 支付方式 / 锁卡上下文 builder 继续外提到 `page-runtime`
- 充值报价摘要 / 充值记录文案 / 会员待审核判断 builder 继续外提到 `page-runtime`
- 商城商品详情弹窗的开关 / 监听绑定 / grid 点击分发继续外提到 `page-runtime`
- 商品详情弹窗的 active-item 状态辅助和 modal context 组装继续外提到 `page-runtime`
- 商城购买 / 锁卡 / 充值 / 取消订单这些动作的 context 组装继续外提到 `page-runtime`
- 登录 / 注册 / 资料 / 改密码 / 退出登录这些动作的 context 组装继续外提到 `page-runtime`
- 登录后的即时回填 / post-auth 跳转 / account focus 记忆继续外提到 `page-runtime`
- auth/account/beginner/dock 这些 page-shell 监听绑定继续外提到 `page-runtime`
- helper 面板入口 / 快照面板 / bridge modal 这些 shell 监听绑定继续外提到 `page-runtime`
- 商城商品列表的搜索 / 筛选 / tab / 分页入口继续外提到 `page-runtime`
- 个人页账户 tab / hash 切换、充值区 click/input/submit、订单取消入口继续外提到 `page-runtime`
- 个人页资料保存 / 改密码 / 退出登录 / 切回绑定这些入口绑定继续外提到 `page-runtime`
- 拍卖区状态切换 / quick bid / 输入预览 / 提交入口 / 倒计时刷新继续外提到 `page-runtime`
- 代抽区输入 / preset / submit 入口继续外提到 `page-runtime`
- 全局 boot 启动任务执行和窗口级事件监听继续外提到 `page-runtime`
- boot 启动 `startupContext` 的页面级组装继续外提到 `page-runtime`
- `shop / auction / me` 底部交互监听继续收口到统一的 page interaction bindings
- 登录入口跳转 / post-auth 跳转 / dock 导航 / viewport 同步这些页面导航 runtime 继续外提
- helper 的 bind/auth/tool 入口动作继续外提到 `page-actions`
- helper 的 snapshot / switch / preview / restore popup 入口继续外提到 `page-actions`

还没完成的部分主要是：

- 商品、账户、helper、拍卖渲染与提交流程从 `app.js` 继续外提
- 让页面入口逐步只加载自己需要的业务模块，而不是都回到 `app.js`

## 后续阶段计划

### 第三阶段：Page-First 收口

目标是让各页面入口更像真正的 page 主文件，而不是最终仍然绕回统一主文件。

- 强化 `shop-entry / login-entry / script-entry / auction-entry / me-entry` 的页面主入口职责
- 继续把 `app.js` 中剩余页面专属 glue 往 `page-runtime / page-actions / page-renderers` 收
- 让 `app.js` 更明确地退化成共享业务层
- 评估 `index.html` 是否继续保留兼容单页，还是改成更轻量的跳转入口

### 第四阶段：共享状态与边界整理

目标是减少全局状态散落，提高长期维护性。

- 统一共享状态访问方式，减少直接读写全局变量
- 把 `helper / commerce / account / auction` 剩余共享状态和 helper 再做一次归类
- 清理重复 wrapper、重复 builder、重复 UI helper
- 按模块边界补一轮说明文档，降低后续接手成本

### 第五阶段：上线前收口

目标是让当前拆分结果更适合稳定发布，而不是继续扩功能。

- 做一轮完整真页面回归，至少覆盖 `shop / login / script / auction / me`
- 对关键链路做一次人工检查：
  - 登录 / 注册 / 绑定
  - 商城浏览 / 购买 / 锁卡
  - 充值 / 充值记录 / 取消订单
  - helper 绑定 / 快照 / 预演 / 还原
  - 拍卖出价 / 代抽提交
- 清理确认当前不打算上线的实验入口、调试输出和低价值兼容逻辑
- 再确认移动端导航、顶部 tab、弹窗和主要表单在窄屏下都可用
- 补一份发布说明，至少记录：
  - 当前多页面入口地址
  - 页面职责边界
  - 已知限制和暂缓项
  - 回滚方式

### 第六阶段：前端性能收口

目标是优先改善“页面打开慢”的体感，而不是继续只做结构拆分。

- 真正让 `shop/login/me/script/auction` 入口只加载自己需要的业务模块，不再统一 `import("./app.js")`
- 继续减少每个页面里无关板块的 DOM 骨架，避免“虽然隐藏但还是一起下发”
- 给带版本号的静态资源启用更积极的长缓存策略
- 结合正式服真实响应结果，再决定要不要补 bundler / minify / 更细粒度的 chunk

当前按优先级执行的详细计划：

1. P0：压掉不必要的重模块自动加载
   - 让 `login` 继续保持纯轻入口
   - 让 `script / auction / me(未登录)` 在轻壳已经够用时，不再默认空闲就拉起 `app.js`
   - 让 `shop` 的重模块唤醒尽量只发生在商城相关交互之后
2. P1：把轻壳推进到轻数据
   - `shop` 先展示轻量商品预览和最近成交
   - `auction` 先展示轻量拍卖列表和代抽提示
   - `me` 先展示账户概览、额度摘要和占位内容
   - `script` 先展示 helper 主区和操作提示
3. P2：继续把轻数据沉淀成 page 级模块
   - `page-entry-shop-lite.js`
   - `page-entry-auction-lite.js`
   - `page-entry-account-lite.js`
   - `page-entry-helper-lite.js`
   - 后面继续补 `page-entry-login-lite.js` 或更细的 page data 模块
4. P3：继续缩小重模块接管范围
   - 能在轻入口完成的 tab、提示、简单表单和局部预览，先不急着拉重模块
   - 只有详情、筛选、购买、helper bridge、拍卖出价、充值提交这类深交互才唤醒完整模块
5. P4：最后再收真正按页业务加载
   - 让 page entry 逐步直接接自己的业务模块
   - 再继续压 `app.js` 到共享层

当前本地已完成的快速优化：

- 静态资源缓存策略已经区分为：
  - HTML 短缓存
  - 带版本号的 `JS / CSS / 图片 / 字体` 长缓存
- 根路径 `/` 已直接返回轻量化后的 `shop.html`，不再默认落回旧 `index.html`
- `shop/login` 启动链已经先做了 session fallback，`shop` 的完整账号加载改成空闲时补跑
- 生成页已经去掉历史 inline auth fallback 脚本，避免每个入口页额外再跑一遍旧认证兜底
- `login.html` 已经从“复制整套商城骨架”收成真正的登录页骨架，只保留登录注册、手动绑定、helper bridge modal 等必需节点
- `login-entry.js` 已改成轻量入口：
  - 密码登录 / 注册 / 手动绑定直接走轻脚本
  - helper 扫码登录才按需懒加载 `app.js`
- `shop-entry.js` 已改成首屏轻入口：
  - 先渲染导航高亮、本地 session 摘要、首屏卡图轮播
  - `app.js` 改成空闲或用户交互时再懒加载
- `shop` 的轻首屏逻辑已开始沉淀为独立模块：
  - `page-entry-shop-lite.js`
  - 首屏先渲染商品预览和最近成交，再在需要时唤醒完整商城
  - 新手教学 / 最近成交切换也已由轻入口先承接，不再依赖完整模块才可用
- `shop` 的默认接管时机也继续往后压：
  - 已经不再依赖空闲自动加载 `app.js`
  - 现在统一改成滚到商品区附近或真正进入商城交互时再接管完整模块
- `me-entry.js / script-entry.js / auction-entry.js` 已改成延后加载入口：
  - 先完成页面导航高亮
  - `app.js` 改成在空闲时或首次交互时再加载
- 页面入口的 session 壳层已经开始前置：
  - `shop` 先渲染本地登录摘要
- `me / script / auction` 先按本地 session 修正顶部登录 / 后台入口显隐
- `me / script` 在未登录时会更激进地延后重模块加载
- `script / auction / me(未登录)` 现在已经进一步收口：
  - 轻壳可用时不再默认空闲自动加载 `app.js`
  - 只在真正进入深交互时才唤醒完整模块
- 通用入口壳现在也开始支持按页面收窄唤醒范围：
  - 不再默认所有页面都用 `window` 任意交互唤醒重模块
  - `script / auction / me` 已开始按实际业务区块绑定唤醒目标
- `shop / auction` 这两条仍然最影响体感的入口也继续往下压：
  - `shop` 不再因为点到商品区任意位置就立刻接管
  - `auction` 不再因为切拍卖状态 tab 就接管，改成代抽表单深交互时再拉重模块
- `auction-entry.js` 已经开始承接轻量业务首屏：
  - 未登录或重模块未就绪前，先拉轻量拍卖列表
  - 代抽区先渲染轻量提示，再等待完整交互模块接管
- `auction` 这条线继续往性能方向推进：
  - 登录态下也不再默认空闲自动加载 `app.js`
  - 轻入口会补拉 `me/quota`，让代抽区先展示可用额度和基础表单
  - 轻量拍卖卡片也会给出“进入完整出价面板”入口，避免压缩接管范围后丢掉拍卖操作路径
- `auction` 的轻首屏逻辑已开始沉淀为独立模块：
  - `page-entry-auction-lite.js`
  这意味着拍卖页入口也不再只是“延后 import”，而是在形成 page-first 的轻业务层
- `script-entry.js` 已经开始承接 helper 轻壳首屏：
  - 首屏直接展开 helper 主区，不再空白等待
  - 首次点绑定 / 快照 / 库存按钮时会主动唤醒重模块
- `me-entry.js` 已经开始承接账户轻壳首屏：
  - 首屏直接渲染账户概览、额度摘要、充值 / 订单占位内容
  - 账户 tab 切换和 helper 区加载提示先由轻入口承接
- `me` 页轻后台首页继续推进：
  - 轻入口现在会直接拉 `auth/me + me/quota + me/orders` 做账户概览
  - `overview` 面板可先独立工作，只有进入充值 / 订单 / helper 深交互时才唤醒完整模块
  - 账户 tab 切到 `充值 / 订单` 也不再立刻接管，先展示轻占位，真正交互时再拉完整模块
  - 轻入口现在还会补拉 `me/recharge-orders`，让充值 tab 先看到最近充值记录和轻量说明
- `me / script` 的轻壳已开始沉淀为独立模块：
  - `page-entry-account-lite.js`
  - `page-entry-helper-lite.js`
  这意味着入口页已经不只是“延后 import”，而是在形成 page-first 的轻业务层

当前这轮本地体积变化：

- `login.html`：约 `38985 -> 8570` bytes
- `shop.html`：约 `38983 -> 13356` bytes
- `me.html`：约 `38985 -> 12760` bytes
- `script.html`：约 `38987 -> 8038` bytes
- `auction.html`：约 `38995 -> 5667` bytes

当前这批入口性能约束也已经有了本地校验脚本：

- `scripts/validate_entry_performance.js`
  - 校验 5 个入口页不再直接挂 `app.js`
  - 校验入口 HTML 体积阈值
  - 校验 `shop / me / script / auction` 的自动加载和唤醒范围约束
  - 校验轻首屏模块是否仍然接在入口链路上
  - 传 `--base-url` 时还会校验线上或本地运行中的缓存头是否符合性能策略

当前对正式服的判断：

- 后端首字节不是主要瓶颈，`TTFB` 已经比较快
- 当前慢感更像是前端静态资源仍然偏重
- 主要问题在：
  - 每个页面还会回到整份 `app.js`
  - 页面 HTML 仍然保留了较完整的大骨架
  - 带版本号的 JS / CSS 还没有吃到足够激进的缓存收益

## 可快速做的修复

如果后面想先拿一轮“马上能见效”的提速，不一定要等大拆分全部完成，可以优先做这几项：

1. 静态资源缓存优化
   - 对带版本号的 `app.js / admin.js / styles.css / *-entry.js` 开长缓存
   - 目标是 `max-age=31536000, immutable`
   - 这项收益直接，改动也最小

2. 入口页进一步轻量化
   - 先把 `index.html` 做成更轻的入口，或者更明确地引导到 `shop.html`
   - 避免首页承担过多无关首屏内容

3. 页面 DOM 瘦身
   - 先从 `shop.html / login.html / me.html` 下手
   - 删掉明显不属于本页的整块骨架，而不是只靠页面模式隐藏

4. 再做真正按页拆包
   - 这是收益最大的长期项
   - 但改动面也最大，适合放在缓存优化之后推进

## 当前如果准备上线，建议先做的事情

如果现在优先级从“继续拆分”切到“准备上线”，建议按这个顺序收：

1. 冻结大拆分，只做稳定性修正和小范围收口。
2. 把 5 个入口页和关键业务链路再跑一轮真机/真浏览器检查。
3. 梳理一份最小上线清单：
   - 哪些页面开放给用户
   - `index.html` 是否继续保留
   - helper / 拍卖 / 代抽 是否全部开放
4. 补一份已知问题清单，把不影响上线但还没彻底重构完的点明确记下来。
5. 确认上线后第一轮观察指标：
   - 页面打不开
   - 登录失败
   - 商品接口异常
   - 充值提交流程异常
   - helper bridge 弹窗或回传失败
   - 拍卖 / 代抽提交异常

## 备注

这一版的重点是先把“用户访问路径”和“后续代码拆分边界”立住，避免继续在一个超级入口里叠功能。
