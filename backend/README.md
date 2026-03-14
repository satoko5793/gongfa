# Backend

## Quick start

1. 复制 `.env.example` -> `.env`
2. 填写 `DATABASE_URL` 和 `JWT_SECRET`
3. 执行 `infra/schema.sql`
4. 安装依赖：`npm install`
5. 启动：`npm run dev`

## 当前能力

- 游戏账号绑定登录
- 商品导入与商品管理
- 用户额度
- 单商品下单
- 后台订单处理

## Schema

- 数据库结构在 `infra/schema.sql`
