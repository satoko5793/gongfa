# 03 API 草案

## Auth
- POST /auth/sms/send  发送验证码
- POST /auth/sms/verify  验证并登录
- POST /auth/logout
- GET  /auth/me

## User
- GET  /me/participant
- POST /me/participant
- PATCH /me/participant

## Admin
- GET  /admin/participants
- PATCH /admin/participants/:id/admin-fields
- PATCH /admin/participants/:id/status
- GET  /admin/audit-logs

## Ledger（流水）
- GET  /ledger?participant_id=
- POST /ledger
- PATCH /ledger/:id

权限规则：
- /me/* 仅限本人
- /admin/* 仅限管理员
