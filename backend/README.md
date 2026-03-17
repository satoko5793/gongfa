# Backend

## Quick start

1. 复制 `.env.example` -> `.env`
2. 填写 `DATABASE_URL` 和 `JWT_SECRET`
3. 执行 `infra/schema.sql`
4. 安装依赖：`npm install`
5. 启动：`npm run dev`

如果本地不接 PostgreSQL，当前也支持使用 `backend/dev-data.json` 的文件存储开发模式。

## 当前能力

- 游戏账号绑定登录
- 用户密码注册、登录、资料维护
- 指定账号注册赠送额度
- 商品导入与商品管理
- 用户额度
- 普通充值与赛季会员充值申请
- 单商品下单
- 后台订单处理、充值审核
- 充值配置、额度流水、审计日志

## Schema

- 数据库结构在 `infra/schema.sql`
