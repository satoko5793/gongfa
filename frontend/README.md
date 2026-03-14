# Frontend

当前前端是一个无需构建的静态页面框架：

- `index.html`：前台商品页、绑定页、我的账户
- `admin.html`：后台导入、商品管理、用户管理、订单管理
- `app.js` / `admin.js` / `shared.js`：前端脚本
- `cards.html`：旧的截图切卡与本地聚类原型，当前不属于商城主流程

运行方式：
- 直接由静态服务器托管
- 与后端 API 保持同域或通过反向代理转发 `/auth`、`/products`、`/me`、`/orders`、`/admin`
