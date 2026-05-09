# 第四阶段：统一枚举、错误信封、日志与发布检查计划

## 背景

前三阶段已经把价格系统、`dev-store` 和后台前端结构立出了边界，下一阶段的重点不再是继续拆页面，而是把“后端契约层”收口。

当前最明显的分散点有四类：

- 角色、充值状态、额度流水类型、审计 action 还存在多处字面量
- 错误返回虽然大体统一成 `{ error }`，但没有稳定 envelope，也没有 request id
- 写操作和同步重算虽然已经会写日志，但还缺少统一 request id 追踪
- 发版前脚本主要覆盖前端，缺少后端契约检查

## 这一期目标

第四阶段固定只做这些：

1. 建立后端常量注册中心
2. 建立 request id 与统一错误 envelope
3. 让关键写操作和重算链路带统一 request id
4. 增加后端契约校验脚本，并接入测试服部署前检查

## 这一期新增的内部接口

- `backend/src/domain/admin-roles.js`
- `backend/src/domain/recharge-order-status.js`
- `backend/src/domain/quota-log-types.js`
- `backend/src/domain/audit-actions.js`
- `backend/src/domain/errors/http.js`
- `scripts/validate_backend_contracts.js`

前端配套新增：

- `frontend/admin-state/roles.js`

## 迁移范围

这一期只改后端契约层和少量前端兼容点：

- `server.js`
- `middlewares/auth.js`
- `frontend/shared.js`
- `dev-store.js`
- 关键 admin route / service / repository
- PG repository 中重复 action / type 字面量较多的文件
- 部署脚本

这期不做：

- 不重写成功响应 shape
- 不继续扩 pricing 规则
- 不继续拆后台 UI
- 不引入新的测试框架

## 兼容策略

- 现有 `error` 短码保留
- `message` 默认以 `error` 为兜底
- `request_id` 通过统一中间件补进错误响应，并对对象型成功响应附加
- 旧前端只要继续读 `error` 就不会坏；新前端可以额外读取 `message` 和 `request_id`

## 后端检查脚本

`scripts/validate_backend_contracts.js` 分两段执行：

1. 静态检查
   - 常量模块存在
   - `server.js` 已挂 request id 和统一错误出口
   - 关键文件不再继续写分散的高频 action / quota type / recharge status 字面量

2. 可选 HTTP 检查
   - `/health`
   - `/products`
   - 未登录访问 `/auth/me`
   - 未登录访问 `/admin/overview`
   - 未登录访问 `/admin/recharge-config`

这些错误接口都必须返回：

- `error`
- `message`
- `request_id`

## 本地验证

- `node --check` 通过新增和改动文件
- 本地启动后，`validate_backend_contracts.js --base-url http://127.0.0.1:8080` 通过
- `validate_frontend.py --base-url http://127.0.0.1:8080` 继续通过
- 保存充值配置后，仍保留同步重算状态

## 测试服验证

1. 后台和前台都能正常打开
2. 未登录访问后台接口返回统一错误 envelope
3. `GET /admin/recharge-config` 去掉 `request_id` 后可原样 `PATCH` 回去
4. 保存一次充值配置，返回里有 `request_id` 和 `pricing_reprice_status`
5. 触发一次非破坏性错误请求，确认 `request_id` 和 `message` 存在
6. 测试服运行 `validate_backend_contracts.js --base-url http://101.34.247.186:8081`

推荐验收命令：

```bash
node scripts/validate_backend_contracts.js \
  --base-url http://101.34.247.186:8081 \
  --admin-jwt-secret '<staging-jwt-secret>'
```

如果已经有现成后台 token，也可以改用：

```bash
node scripts/validate_backend_contracts.js \
  --base-url http://101.34.247.186:8081 \
  --admin-token '<bearer-token-without-prefix>'
```

## 回滚方式

如果测试服出现错误响应异常、后台主流程回归或部署脚本误拦：

1. 回滚 `backend/src/domain/errors/http.js`
2. 回滚 `server.js`、`middlewares/auth.js`、`frontend/shared.js`
3. 回滚 `scripts/validate_backend_contracts.js` 和 `deploy-common.sh`
4. 保留文档，不回滚路线说明
