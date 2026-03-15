# 11 小程序开发 / 体验 / 生产环境切换

更新时间：2026-03-15

## 目标

当前小程序已经改成自动按环境版本切换接口地址，不需要每次上线前手工改同一个文件。

适用目录：

- `mp-app/`
- `app/`

主配置入口：

- [`mp-app/utils/config.js`](../mp-app/utils/config.js)

## 当前配置结构

### 本地开发

- [`mp-app/utils/config.local.js`](../mp-app/utils/config.local.js)

默认值：

```js
API_BASE_URL = "http://127.0.0.1:8090"
```

### 体验版

- [`mp-app/utils/config.trial.js`](../mp-app/utils/config.trial.js)

你上线体验版前，要把这里改成真实 HTTPS 地址，例如：

```js
API_BASE_URL = "https://trial-api.example.com"
```

### 正式版

- [`mp-app/utils/config.prod.js`](../mp-app/utils/config.prod.js)

正式发布前，把这里改成正式 HTTPS 地址，例如：

```js
API_BASE_URL = "https://api.example.com"
```

## 自动切换规则

配置入口会读取：

- `wx.getAccountInfoSync().miniProgram.envVersion`

当前规则是：

- `develop` -> `config.local.js`
- `trial` -> `config.trial.js`
- `release` -> `config.prod.js`

也就是说：

1. 开发者工具本地调试，默认走本地 API
2. 上传体验版，默认走体验环境 API
3. 正式发布，默认走正式环境 API

## 手工强制切换

在 [`mp-app/utils/config.js`](../mp-app/utils/config.js) 里有：

```js
const FORCE_RUNTIME_ENV = "";
```

可选值：

- `local`
- `trial`
- `prod`

默认留空，表示自动判断。

只有在排查问题时才建议临时改这个值。

## 推荐使用方式

### 日常开发

保持：

- `config.local.js` 指向本地 `127.0.0.1:8090`
- `FORCE_RUNTIME_ENV = ""`

### 体验版联调

部署好测试 API 后：

1. 修改 `config.trial.js`
2. 上传开发版
3. 生成体验版真机测试

### 正式发布

准备上线时：

1. 修改 `config.prod.js`
2. 在微信后台配置合法请求域名
3. 重新上传代码
4. 提交审核和发布

## 你现在最该改的两个文件

当你准备上线测试时：

1. [`mp-app/utils/config.trial.js`](../mp-app/utils/config.trial.js)
2. [`mp-app/utils/config.prod.js`](../mp-app/utils/config.prod.js)

如果你还保留 `app/` 镜像目录，也同步改：

1. [`app/utils/config.trial.js`](../app/utils/config.trial.js)
2. [`app/utils/config.prod.js`](../app/utils/config.prod.js)

## 注意事项

1. 小程序正式环境只能请求合法 HTTPS 域名
2. `127.0.0.1` 只能用于本地开发
3. 体验版和正式版都不要再连本地地址
4. 如果接口域名变了，要同时更新微信后台合法域名配置

## 我已经帮你改好的部分

现在这套切换逻辑已经落地到：

- [`mp-app/utils/config.js`](../mp-app/utils/config.js)
- [`app/utils/config.js`](../app/utils/config.js)

并拆分为：

- `config.local.js`
- `config.trial.js`
- `config.prod.js`

## 官方资料

环境版本判断和部署入口可参考微信开发相关资料：

- 微信开发者文档（云托管总入口）：<https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/introduction.html>
