# Frontend

前端当前是无构建的静态页面方案，直接由后端 Express 托管。

## 文件说明

- [index.html](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/index.html)
  前台入口，包含商品、注册登录、个人中心、充值、订单

- [admin.html](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/admin.html)
  后台入口，管理员登录、商品、用户、订单、充值审核

- [app.js](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/app.js)
  前台交互逻辑

- [admin.js](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/admin.js)
  后台交互逻辑

- [shared.js](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/shared.js)
  前后台共享工具

- [styles.css](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/styles.css)
  前后台主样式

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
  游戏内直接转给管理员 `584967604`，`1 残卷 = 1 额度`，由后台审核到账
