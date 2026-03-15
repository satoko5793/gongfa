# 10 微信云托管部署说明

更新时间：2026-03-15

## 适用范围

这份文档对应当前项目的推荐上线形态：

- 小程序前台：`mp-app/`
- 网页后台：`frontend/admin.html`
- 后端：`backend/`
- 部署方式：微信云托管

当前项目已经具备这些前提：

- 根目录有 [`Dockerfile`](../Dockerfile)
- 根目录有 [`.dockerignore`](../.dockerignore)
- 后端健康检查：`/health`
- 生产环境变量模板：[`.env.production.example`](../.env.production.example)

## 部署目标

最终你会得到一套正式环境：

1. 云托管容器运行 Node/Express 服务
2. PostgreSQL 存正式数据
3. 小程序请求正式 HTTPS API
4. 网页后台可通过正式地址登录和管理

## 部署前准备

### 1. 小程序侧

你需要准备：

- 正式小程序 `AppID`
- 开发者、体验者账号
- 合法请求域名要用的正式 HTTPS 域名

### 2. 后端侧

你需要准备：

- 一套 PostgreSQL 数据库
- 一组生产环境变量
- 正式域名和 HTTPS

### 3. 本项目侧

你需要确认：

- 正式环境不再使用 `USE_FILE_STORE=1`
- 正式环境改用 `DATABASE_URL`
- 小程序 `trial/release` 地址已经改到正式 HTTPS

## 环境变量

以 [`.env.production.example`](../.env.production.example) 为模板：

```env
DATABASE_URL=postgres://gongfa:replace-with-password@replace-with-db-host:5432/gongfa
JWT_SECRET=replace-with-a-long-random-secret
PORT=8090
HELPER_ORIGIN=
```

注意：

- 不要配置 `USE_FILE_STORE=1`
- `JWT_SECRET` 必须换成长随机串
- `DATABASE_URL` 必须指向正式数据库

## 数据库初始化

正式库结构以 [`infra/schema.sql`](../infra/schema.sql) 为准。

部署前至少执行一次：

1. 创建数据库
2. 执行 `infra/schema.sql`
3. 准备管理员账号
4. 登录后台重新导入商品 JSON

## 云托管部署步骤

### 步骤 1：创建云托管服务

在微信后台或对应云托管控制台里：

1. 创建新服务
2. 选择代码源或镜像源
3. 构建目录选择仓库根目录
4. 使用根目录 `Dockerfile`

### 步骤 2：配置启动环境

确认服务监听端口与项目一致：

- `PORT=8090`

当前容器启动命令已经在 [`Dockerfile`](../Dockerfile) 里定义：

```dockerfile
CMD ["node", "backend/src/server.js"]
```

### 步骤 3：配置环境变量

至少填入：

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`

### 步骤 4：部署并验证

部署成功后先验证：

- `https://your-api-host/health`

预期返回：

```json
{"ok":true}
```

### 步骤 5：验证网页后台

后台地址通常是：

- `https://your-api-host/admin.html`

至少测试：

1. 管理员登录
2. 导入 JSON
3. 商品上架
4. 调整额度
5. 审核订单取消

## 小程序联调顺序

当云托管 API 可用后，按下面顺序联调：

1. 先改 `mp-app/utils/config.trial.js`
2. 上传开发版
3. 生成体验版
4. 用真机测试：
   - 商品列表
   - 商品详情
   - 注册
   - 登录
   - 下单
   - 取消申请
5. 后台同时测试管理员审核

## 当前我已经帮你补好的文件

- [`Dockerfile`](../Dockerfile)
- [`.dockerignore`](../.dockerignore)
- [`.env.production.example`](../.env.production.example)
- [`docs/09-miniapp-release.md`](./09-miniapp-release.md)
- [`docs/11-miniapp-env-config.md`](./11-miniapp-env-config.md)

## 我还能继续帮你做的

1. 把生产环境数据库初始化改成更自动化的脚本
2. 增加管理员种子脚本
3. 补一份“上线前检查清单”
4. 继续梳理后台和小程序里提审前容易踩的文案

## 你必须自己做的

1. 创建云托管服务
2. 准备正式数据库
3. 配正式 HTTPS 域名
4. 在微信后台填写合法请求域名
5. 上传体验版和正式提审

## 官方资料

这次对应的官方资料：

- 微信云托管介绍：<https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/introduction.html>
- 微信云托管产品文档：<https://cloud.tencent.com/document/product/876/113602>
- 微信云托管容器服务说明：<https://cloud.tencent.com/document/product/876/121989>
