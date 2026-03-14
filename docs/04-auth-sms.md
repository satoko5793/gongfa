# 04 登录方案

本文件保留原路径，但内容已从“短信登录方案”切换为商城当前使用的两套登录方案：

- 普通用户优先使用 `游戏 ID + 密码`
- helper 扫码绑定保留为高级入口

## 当前推荐方案：游戏 ID + 密码

### 目标

让普通买家不依赖 helper，也能直接注册、登录、购买。

### 流程

1. 用户在商城前台输入 `游戏 ID`
2. 首次使用时设置密码并注册
3. 服务端创建 `auth_provider='password'` 的商城用户
4. 服务端签发 JWT
5. 前端保存 JWT，后续直接访问 `/auth/me`、`/me/*`、`/orders/*`

### 约束

- 当前密码登录用户固定使用 `game_server='direct'`
- `game_role_name` 默认回填为昵称或游戏 ID
- 只保存密码哈希，不保存明文密码

## 辅助方案：helper 扫码绑定

用户通过 `xyzw_web_helper` 完成扫码登录并选择角色，商城服务端保存绑定关系并签发业务登录态。

## 流程

1. 在 helper 使用微信扫码登录
2. helper 获取角色 token 列表
3. 用户选择目标角色
4. helper 向商城页面桥接返回：
   - `game_role_id`
   - `game_server`
   - `game_role_name`
   - `bind_token_id`
   - 可选昵称
5. 商城调用 `POST /auth/game/bind`
6. 服务端创建或更新用户并签发 JWT
7. 前端保存 JWT，后续使用 `Authorization: Bearer <token>` 访问接口

## 服务端保存内容

允许保存：
- roleId
- server
- roleName
- helper 内部 token 标识
- 脱敏展示信息

不保存：
- 完整原始 token
- 微信登录态原始数据

## 绑定规则

- 同一个 `game_role_id + game_server` 只允许绑定到一个商城用户
- 重复绑定时更新角色名和 token 关联信息
- 已禁用用户不可完成绑定登录

## MVP 阶段约束

- 暂不做 token 有效性实时探测
- 暂不做多角色切换
- 暂不做扫码过期后的自动刷新

## 后续增强

- 支持管理员发起重绑
- 支持用户切换绑定角色
- 支持 helper 直接唤起商城绑定回调
