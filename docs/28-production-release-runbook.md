# 28 正式发布 Runbook

更新时间：2026-04-11

这份 runbook 只面向当前网页版本的正式发布，默认目标环境为：

- 服务器：`101.34.247.186`
- 正式目录：`/opt/gongfa`
- compose 项目：`gongfa-prod`
- 入口：
  - 前台：`http://101.34.247.186/`
  - 后台：`http://101.34.247.186/admin.html`

## 发布前必须确认

1. 本地当前版本已经完成回归
2. 正式环境 `.env.production` 已存在，且至少包含：
   - `JWT_SECRET`
   - `PORT=8090`
3. 如果正式服继续使用文件存储，确认会保留：
   - `/opt/gongfa-data/dev-data.json`
4. 本机 SSH 别名可用：
   - `gongfa-prod`
5. 当前仓库需要发布的改动已经确认完毕

## 最短发布步骤

### 1. 先看本地状态

```bash
cd /Users/xyq/Desktop/123/gongfa
git status --short
python3 scripts/validate_frontend.py --base-url http://127.0.0.1:8090
```

如果你要手动指定这次发布的前端版本号，可以先执行：

```bash
python3 scripts/sync_frontend_entries.py --version release-20260411-170000
python3 scripts/version_frontend_modules.py --version release-20260411-170000
```

正常情况下不需要手动做这一步，因为部署脚本已经会自动生成版本号并执行。

### 2. 备份正式数据

如果正式服当前仍使用文件存储，先执行：

```bash
ssh gongfa-prod 'cp /opt/gongfa-data/dev-data.json /opt/gongfa-data/dev-data.json.bak-$(date +%Y%m%d-%H%M%S)'
```

如果正式服已经切数据库，则改成备份数据库，不要跳过。

### 3. 确认正式环境变量

```bash
ssh gongfa-prod 'cd /opt/gongfa && ls -l .env.production && sed -n "1,40p" .env.production'
```

至少确认：

1. `JWT_SECRET` 已配置
2. 不要误带 `USE_FILE_STORE=1`，除非你就是明确要继续用文件存储
3. 端口为 `8090`

### 4. 执行正式发布

仓库根目录执行：

```bash
cd /Users/xyq/Desktop/123/gongfa
./scripts/deploy-prod.sh
```

这个脚本会自动做这些事：

1. 生成新的前端模块版本号
2. 执行 `scripts/sync_frontend_entries.py`
3. 执行 `scripts/version_frontend_modules.py`
4. 执行 `scripts/validate_frontend.py`
5. `rsync` 同步代码到 `/opt/gongfa`
6. 排除本地 `.git`、`node_modules`、本地环境文件和本地数据文件
7. 正式服文件存储始终挂在独立目录 `/opt/gongfa-data`，代码发布不会碰这份数据
8. 如果存在 helper 静态资源目录，自动同步
9. 执行：
   - `docker compose -p gongfa-prod -f infra/docker-compose.app.yml up -d --build web`
10. 输出容器状态
11. 执行正式服健康检查

### 5. 发布后立即检查

先看服务状态：

```bash
ssh gongfa-prod 'cd /opt/gongfa && docker compose -p gongfa-prod -f infra/docker-compose.app.yml ps'
ssh gongfa-prod 'cd /opt/gongfa && docker compose -p gongfa-prod -f infra/docker-compose.app.yml logs --tail=200'
```

再看公网：

```bash
curl -I http://101.34.247.186/
curl -I http://101.34.247.186/shop.html
curl -I http://101.34.247.186/admin.html
curl http://101.34.247.186/health
```

至少确认：

1. `/` 和 `/shop.html` 的 `Cache-Control` 为 `no-store`
2. 商城入口脚本和 `app.js` 也为 `no-store`
3. 页面里引用的入口脚本带新的 `?v=...`

### 6. 发布后最短人工验收

建议用一个全新测试账号走这 5 步：

1. 注册并登录
2. 管理员加额度
3. 前台下单
4. 前台申请取消
5. 后台审核取消

如果这 5 步都正常，当前版本就可以认为发布完成。

## 回滚思路

如果发布后发现明显故障，先不要继续人工写数据。

优先处理顺序：

1. 看容器日志，确认是不是环境变量或启动失败
2. 如果是代码版本问题，回滚到上一版代码再重新 `docker compose ... up -d --build web`
3. 如果涉及文件存储数据误改，用刚刚备份的 `dev-data.json` 恢复

文件存储回滚示例：

```bash
ssh gongfa-prod 'cp /opt/gongfa-data/dev-data.json.bak-YYYYMMDD-HHMMSS /opt/gongfa-data/dev-data.json'
ssh gongfa-prod 'cd /opt/gongfa && docker compose -p gongfa-prod -f infra/docker-compose.app.yml up -d --force-recreate web'
```

## 当前版本发布判断

按 2026-04-08 这轮本地结果：

1. 前台拆页已完成到可发布状态
2. 登录、下单、充值申请、取消申请已覆盖
3. 后台登录、充值审核、取消审核已覆盖
4. 本地测试数据已清理
5. 当前剩余风险主要在正式环境变量和发布后人工验收，不在已知功能阻断

按 2026-04-09 这轮正式发布结果补充：

1. 正式服已完成一轮带性能优化的发布
2. 正式服 `/` 已切到轻量 `shop.html`
3. 公网缓存头已确认生效：
   - HTML、JS、CSS 为 `no-store`
   - 图片和字体保持长缓存
4. 公网最短交易链路已跑通：
   - 注册 / 登录
   - 管理员加额度
   - 下单
   - 取消申请
   - 后台审核取消
5. 正式服 smoke 数据已清理完成，服务重启后仍保持 `healthy`
