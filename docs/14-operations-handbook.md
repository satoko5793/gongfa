# 14 运维手册

这份文档只写当前网页版本的实际运维信息。

## 服务器

当前服务器：

- IP：`101.34.247.186`
- 当前访问：
  - 前台：`http://101.34.247.186/`
  - 后台：`http://101.34.247.186/admin.html`
  - 测试服：`http://101.34.247.186:8081/`

项目部署目录：

- `/opt/gongfa`

## 服务结构

核心结构：

- [backend/src/server.js](/c:/Users/Administrator/Desktop/内包/gongfa/backend/src/server.js)
  Express 服务入口

- [frontend/index.html](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/index.html)
  前台页面入口

- [frontend/admin.html](/c:/Users/Administrator/Desktop/内包/gongfa/frontend/admin.html)
  后台页面入口

- [infra/docker-compose.app.yml](/c:/Users/Administrator/Desktop/内包/gongfa/infra/docker-compose.app.yml)
  线上启动方式

## 常用部署命令

```bash
cd /opt/gongfa
docker compose -f infra/docker-compose.app.yml ps
docker compose -f infra/docker-compose.app.yml logs -f
docker compose -f infra/docker-compose.app.yml up -d --build
docker compose -f infra/docker-compose.app.yml restart
```

测试服命令：

```bash
cd /opt/gongfa-staging
docker compose -f infra/docker-compose.staging.yml ps
docker compose -f infra/docker-compose.staging.yml logs -f
docker compose -f infra/docker-compose.staging.yml up -d --build
docker compose -f infra/docker-compose.staging.yml restart
```

## 常用检查命令

健康检查：

```bash
curl http://127.0.0.1:8090/health
curl http://101.34.247.186/health
curl http://101.34.247.186:8081/health
```

查看容器状态：

```bash
docker ps
docker inspect gongfa-web
```

查看最近日志：

```bash
cd /opt/gongfa
docker compose -f infra/docker-compose.app.yml logs --tail=200
```

## 当前数据模式

当前线上仍使用文件存储：

- `/opt/gongfa/backend/dev-data.json`
- `/opt/gongfa-staging/backend/dev-data.staging.json`

这意味着：

- 数据备份靠文件
- 不适合长期正式运营
- 改容器前要注意保留挂载数据

## 前后台常见排障

### 1. 商品不显示

先查：

1. `/health` 是否正常
2. `/products` 是否有返回
3. 前台是否加载了新版本 `app.js`
4. 商品是否被下架或库存为 0

### 2. 登录失效

先查：

1. 浏览器是否还在用旧缓存
2. 前台 JS 是否有语法错误
3. `/auth/login` 是否返回 200

### 3. 后台页面空白或按钮不生效

先查：

1. `admin.js` 是否是最新版本
2. 浏览器是否缓存旧页面
3. 后台 API 是否正常

### 4. 充值申请无效

先查：

1. 前台是否已登录
2. 后台充值配置是否启用
3. 当前比例是否配置正确
4. 后台充值审核是否执行成功

## 当前手工发布流程

1. 先发布到测试服目录 `/opt/gongfa-staging`
2. 执行：

```bash
cd /opt/gongfa-staging
docker compose -f infra/docker-compose.staging.yml up -d --build
```

3. 检查：

- `http://101.34.247.186:8081/`
- `http://101.34.247.186:8081/admin.html`
- `http://101.34.247.186:8081/health`

4. 验证通过后，再把相同版本发布到正式目录 `/opt/gongfa`
5. 执行：

```bash
cd /opt/gongfa
docker compose -f infra/docker-compose.app.yml up -d --build
```

6. 检查：

- `http://101.34.247.186/`
- `http://101.34.247.186/admin.html`
- `http://101.34.247.186/health`

## 当前测试服约定

- 使用独立目录：`/opt/gongfa-staging`
- 使用独立环境变量：`/opt/gongfa-staging/.env.staging`
- 使用独立文件数据：`/opt/gongfa-staging/backend/dev-data.staging.json`
- 端口：`8081 -> 8090`
- 容器名：`gongfa-web-staging`

不要让测试服和正式服共用数据文件，否则测试操作会污染正式数据。

## 下一步正式化建议

1. 配域名
2. 上 HTTPS
3. 从文件存储迁移到 PostgreSQL
4. 给后台加额外访问保护
5. 再决定是否接自动支付
