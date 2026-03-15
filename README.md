# 功法卡片商城 MVP

这是一个围绕“卡片 JSON 导入、商品上架、额度下单、后台管理”构建的卡片商城原型。

当前主线：
- 网页前台商城
- 网页后台管理
- 原生微信小程序前台实验线

当前不做：
- 真实支付
- 自动发货
- 完整风控和 BI

## 本地运行

当前默认是本地文件存储模式，不依赖 PostgreSQL。

- 前台商城：`http://127.0.0.1:8090/`
- 后台管理：`http://127.0.0.1:8090/admin.html`
- 健康检查：`http://127.0.0.1:8090/health`

启动命令：

```bat
start-local.cmd
```

## 当前固定管理员

本地文件存储模式下，固定管理员账号为：

- 游戏 ID：`584967604`
- 游戏名称：`繁星✨秋`
- 密码：`159321`

## 目录说明

- `backend/`：Express API、商品、额度、订单、后台接口
- `frontend/`：网页前台与网页后台
- `mp-app/`：当前可导入微信开发者工具的小程序工程
- `miniapp/`：小程序计划与早期工作区
- `app/`：小程序镜像目录
- `infra/`：数据库 schema 与部署配置
- `xyzw_web_helper/`：历史扫码辅助与导入工具

## 文档入口

- [项目概览](docs/00-overview.md)
- [原型说明](docs/01-prototype.md)
- [数据模型](docs/02-data-model.md)
- [接口设计](docs/03-api.md)
- [认证方案](docs/04-auth-sms.md)
- [部署计划](docs/05-deploy-plan.md)
- [定价系统](docs/06-pricing-system.md)
- [小程序计划](docs/07-miniapp-plan.md)
- [当前状态总览](docs/08-current-status.md)
- [小程序上线说明](docs/09-miniapp-release.md)
- [微信云托管部署说明](docs/10-wxcloudrun-deploy.md)
- [小程序环境切换](docs/11-miniapp-env-config.md)
