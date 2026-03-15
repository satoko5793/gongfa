# 09 小程序上线说明

更新时间：2026-03-15

## 目标

当前推荐的正式形态是：

- 小程序前台：`mp-app/`
- 网页后台：`frontend/admin.html`
- Node/Express 后端：`backend/`
- PostgreSQL：正式数据存储
- 部署方式：优先微信云托管

当前本地联调模式使用的是文件存储：

- `.env` 中为 `USE_FILE_STORE=1`
- 数据文件为 `backend/dev-data.json`

这个模式只适合本地调试，不适合正式上线。

## 上线前必须完成的技术切换

### 1. 切到正式环境变量

使用根目录的 [`.env.production.example`](../.env.production.example) 作为模板，至少准备：

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`

正式环境不要再设置：

- `USE_FILE_STORE=1`

### 2. 初始化 PostgreSQL

正式数据库结构以 [`infra/schema.sql`](../infra/schema.sql) 为准。

上线前至少要完成：

1. 新建 PostgreSQL 数据库
2. 执行 `infra/schema.sql`
3. 创建或修正管理员账号
4. 用后台重新导入一次商品 JSON

### 3. 部署后端服务

仓库根目录已经补了：

- [`Dockerfile`](../Dockerfile)
- [`.dockerignore`](../.dockerignore)

当前镜像会启动：

- `backend/src/server.js`
- 同时托管 `frontend/` 静态页面
- 同时暴露 `http://<host>:8090/health`

### 4. 修改小程序接口地址

当前小程序本地配置在：

- [`mp-app/utils/config.js`](../mp-app/utils/config.js)

本地值还是：

- `http://127.0.0.1:8090`

上线前必须改成正式 HTTPS 地址，例如：

```js
const API_BASE_URL = "https://api.example.com";
```

如果你同时保留 `app/` 镜像目录，也要同步修改：

- [`app/utils/config.js`](../app/utils/config.js)

## 推荐上线顺序

### 路线 A：微信云托管

适合当前项目，原因是：

- 现有 Node/Express 后端可以直接复用
- 不用自己长期维护 VPS
- 后台网页和 API 可以一起部署

建议顺序：

1. 在微信云托管创建服务
2. 以仓库根目录作为构建目录
3. 使用根目录 `Dockerfile`
4. 配置生产环境变量
5. 绑定数据库
6. 部署成功后验证 `/health`
7. 再修改小程序接口地址并上传体验版

### 路线 B：自有云服务器

如果你后面不用微信云托管，也可以：

1. 在 Linux 服务器上安装 Docker
2. 使用根目录 `Dockerfile` 构建镜像
3. 配 PostgreSQL
4. 通过 Nginx 反代成 HTTPS

## 小程序正式发布流程

### 第一步：体验版联调

先不要直接提审，先走体验版。

联调至少验证：

1. 商品列表加载
2. 商品详情加载
3. 注册
4. 登录
5. 下单确认
6. 取消申请
7. 后台审核取消

### 第二步：后台网页联调

正式环境后台地址通常会是：

- `https://your-admin-host/admin.html`

至少验证：

1. 管理员登录
2. JSON 导入
3. 商品上架
4. 用户额度调整
5. 订单列表和取消审核

### 第三步：上传和提审

小程序代码目录以：

- `mp-app/`

为准。

建议流程：

1. 微信开发者工具导入 `mp-app/`
2. 把 `utils/config.js` 改成正式 HTTPS
3. 上传开发版
4. 生成体验版做一轮真机验证
5. 通过后再提交审核

## 我可以直接帮你做的

这些工作我可以继续直接在仓库里完成：

1. 调整后端为生产环境配置方式
2. 继续完善 Docker 部署文件
3. 补数据库初始化/管理员种子脚本
4. 把小程序和网页端的线上地址切换做成更清晰的配置
5. 帮你检查提审前的代码和文案风险
6. 写正式部署文档和操作脚本

## 必须你自己做的

这些事情需要你在外部平台或正式环境里操作：

1. 申请和管理正式小程序 `AppID`
2. 配置微信后台类目、成员、发布权限
3. 在微信云托管或云平台上创建正式服务
4. 准备正式 PostgreSQL 实例
5. 配置正式域名和 HTTPS
6. 在微信后台填写合法请求域名
7. 上传体验版、提交审核、正式发布
8. 处理备案、主体信息、审核沟通

## 我建议你下一步马上做什么

最稳的下一步是：

1. 先决定是否走微信云托管
2. 如果走云托管，我继续给你补：
   - 云托管部署文档
   - 环境变量清单
   - 数据库初始化步骤
3. 你去准备：
   - 正式小程序 `AppID`
   - PostgreSQL
   - 微信后台配置权限

## 参考资料

以下是我本次用于判断的官方资料：

- 微信云托管介绍：<https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/introduction.html>
- 微信云托管产品文档：<https://cloud.tencent.com/document/product/876/113602>
- 微信云托管容器服务说明：<https://cloud.tencent.com/document/product/876/121989>
- 腾讯云小程序解决方案：<https://cloud.tencent.com/solution/la>
