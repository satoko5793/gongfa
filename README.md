# 功法卡片商城

当前项目是一套网页优先的卡片商城系统，包含：

- 前台商城：商品浏览、注册登录、额度充值、赛季会员、下单、订单查询、取消申请
- 后台管理：商品导入、商品管理、用户额度、订单处理、充值审核、充值配置、额度流水、审计日志
- 后端 API：Node.js + Express 单体服务，同时托管前台静态页和接口

当前主线：

- `frontend/`：网页前台和网页后台
- `backend/`：API、认证、商品、订单、充值
- `infra/`：Docker 部署配置

当前暂停：

- `mp-app/`
- `app/`
- 小程序审核、体验版、云托管正式联调

## 常用入口

本地开发：

- 前台：`http://127.0.0.1:8090/`
- 后台：`http://127.0.0.1:8090/admin.html`
- 健康检查：`http://127.0.0.1:8090/health`

当前公网：

- 前台：`http://101.34.247.186/`
- 后台：`http://101.34.247.186/admin.html`
- 测试服：通过 SSH 隧道访问本机 `http://127.0.0.1:8081/`

## 项目目录

- `backend/src/server.js`：服务入口
- `backend/src/routes/`：API 路由
- `backend/src/services/`：业务逻辑
- `backend/src/config/recharge-config.js`：充值配置默认值
- `backend/src/config/signup-seed-quota.js`：注册赠送额度映射
- `frontend/index.html`：前台入口
- `frontend/admin.html`：后台入口
- `frontend/app.js`：前台交互逻辑
- `frontend/admin.js`：后台交互逻辑
- `frontend/styles.css`：前后台主样式
- `frontend/gongfa/`：功法图片静态资源
- `frontend/guides/`：注册与咨询图片素材
- `frontend/payment/`：支付二维码素材
- `frontend/legacy-json/`：后台导入用的历史数据快照
- `scripts/validate_frontend.py`：发版前端校验脚本
- `infra/docker-compose.app.yml`：线上容器启动文件
- `infra/docker-compose.staging.yml`：测试服容器启动文件

## 本地启动

```bat
start-local.cmd
```

如果你手动启动：

```bash
cd backend
npm install
node src/server.js
```

## 当前功能范围

已完成：

- 商品 JSON 导入
- 商品上架、下架、改价、改库存
- 用户密码注册、登录、资料修改、改密码
- 指定账号注册赠送额度
- 前台商品详情与额度购买
- 后台确认订单、取消订单、取消审核
- 支付宝收款码充值申请
- 后台审核充值并自动加额度
- 充值比例、赛季会员、收款码后台可配，前台明显展示
- 后台可查看额度流水与审计日志

暂未完成：

- 真实自动支付回调
- 自动发货
- 托管数据库正式迁移
- HTTPS、域名、备案接入

## 文档入口

- [文档总索引](docs/README.md)
- [当前状态](docs/08-current-status.md)
- [网页优先说明](docs/12-web-priority.md)
- [网页版上线检查清单](docs/13-web-release-checklist.md)
- [运维手册](docs/14-operations-handbook.md)
- [前端校验说明](docs/15-frontend-validation.md)
- [前端结构说明](frontend/README.md)

## 部署说明

线上当前使用 Docker 单容器部署，映射到服务器 `80 -> 8090`。

常用命令：

```bash
cd /opt/gongfa
docker compose -f infra/docker-compose.app.yml ps
docker compose -f infra/docker-compose.app.yml logs -f
docker compose -f infra/docker-compose.app.yml up -d --build
docker compose -f infra/docker-compose.app.yml restart

# staging
docker compose -f infra/docker-compose.staging.yml ps
docker compose -f infra/docker-compose.staging.yml logs -f
docker compose -f infra/docker-compose.staging.yml up -d --build
```

两套 compose 文件已经写死不同项目名，避免测试服和正式服互相重建。
测试服默认只绑定服务器本机 `127.0.0.1:8081`，建议用 SSH 隧道访问。
