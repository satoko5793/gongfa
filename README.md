# 功法卡片商城（MVP）

这是一个面向“功法卡片导入、上架、额度下单”的商城原型，当前目标是先跑通基础闭环：
- 管理员上传自己的卡片 JSON
- 后台管理卡片上下架、价格、库存与展示信息
- 用户可直接用游戏 ID + 密码注册登录，helper 扫码绑定保留为高级入口
- 用户使用站内额度提交订单
- 暂不接入真实支付，先完成商品页与后台管理基础框架

文档入口：
- docs/00-overview.md
- docs/01-prototype.md
- docs/02-data-model.md
- docs/03-api.md
- docs/04-auth-sms.md
- docs/05-deploy-plan.md
- docs/06-pricing-system.md
- docs/07-miniapp-plan.md

项目结构：
- backend/  Node.js + PostgreSQL 后端服务
- frontend/ 静态前端原型与商城页面
- infra/    数据库与部署配置
- xyzw_web_helper/  扫码登录、角色读取与桥接导入工具
