# 15. 前端校验

这份文档只解决一个问题：

- 接口本身有数据，但前端脚本坏了，结果商品整页不显示。
- 入口页已经更新，但内部 ES module 还在吃旧缓存，结果页面一直停在轻量壳。

## 什么时候跑

每次准备发版前都跑一次：

```bash
python scripts/validate_frontend.py --base-url http://101.34.247.186
```

如果你只想检查本地文件语法，不检查公网：

```bash
python scripts/validate_frontend.py
```

如果你是手动准备一版新的前端发布号，先执行：

```bash
python3 scripts/sync_frontend_entries.py --version release-20260411-170000
python3 scripts/version_frontend_modules.py --version release-20260411-170000
```

正常情况下不用手动跑，因为 `./scripts/deploy-staging.sh` 和 `./scripts/deploy-prod.sh` 已经会自动执行这两步。

## 它会检查什么

本地检查：

- `frontend/**/*.js` 全量语法
- `frontend/index.html` 是否带了 `app.js?v=...`
- `frontend/index.html` 是否带了 `styles.css?v=...`
- `frontend/admin.html` 是否带了 `admin.js?v=...`
- 所有相对 `*.js` 引用是否都带 `?v=...`
- 整条前端 ES module 依赖链是否只存在一个版本号

公网检查：

- `/health` 是否正常
- `/products` 是否有商品
- 公网页面入口引用的模块链是否还是同一版
- 公网页面引用的入口脚本、主模块、后台脚本是否还能通过 `node --check`

## 推荐发布顺序

1. 本地改完文件。
2. 先跑：

```bash
python scripts/validate_frontend.py
```

3. 传到服务器并重新构建容器。
4. 再跑：

```bash
python scripts/validate_frontend.py --base-url http://101.34.247.186
```

5. 最后人工打开：

- 前台首页
- 后台页面
- 商品列表
- 登录
- 个人页

## 失败时怎么查

如果脚本失败，优先看两类问题：

1. 语法错误
   常见是字符串没闭合、模板字符串坏了、重复声明同名常量或函数。

2. 发布遗漏
   常见是：
   - 只更新了入口版本号，内部模块链还在旧版本
   - HTML 或入口页没更新版本号
   - 文件没传到服务器
   - 容器没重新构建

## 当前线上地址

- 前台：`http://101.34.247.186/`
- 后台：`http://101.34.247.186/admin.html`
