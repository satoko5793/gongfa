# 15. 前端校验

这份文档只解决一个问题：

- 接口本身有数据，但前端脚本坏了，结果商品整页不显示。

## 什么时候跑

每次准备发版前都跑一次：

```bash
python scripts/validate_frontend.py --base-url http://101.34.247.186
```

如果你只想检查本地文件语法，不检查公网：

```bash
python scripts/validate_frontend.py
```

## 它会检查什么

本地检查：

- `frontend/app.js`
- `frontend/admin.js`
- `frontend/shared.js`
- `frontend/index.html` 是否带了 `app.js?v=...`
- `frontend/index.html` 是否带了 `styles.css?v=...`
- `frontend/admin.html` 是否带了 `admin.js?v=...`

公网检查：

- `/health` 是否正常
- `/products` 是否有商品
- 公网页面引用的 `app.js`、`shared.js`、`admin.js` 是否还能通过 `node --check`

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
   - HTML 没更新版本号
   - 文件没传到服务器
   - 容器没重新构建

## 当前线上地址

- 前台：`http://101.34.247.186/`
- 后台：`http://101.34.247.186/admin.html`
