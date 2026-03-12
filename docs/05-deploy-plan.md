# 05 部署计划（草案）

## 目标
- 单台云服务器即可跑通 MVP
- Nginx 反向代理
- 后端 + 数据库 使用 Docker Compose

## 目录规划
- /infra/docker-compose.yml
- /backend  后端服务
- /frontend 前端服务

## 步骤概览
1) 购买云服务器（2核4G，Ubuntu）
2) 安装 Docker 与 Docker Compose
3) 配置 Nginx（80/443）
4) 使用域名 + HTTPS
5) 启动后端与数据库
