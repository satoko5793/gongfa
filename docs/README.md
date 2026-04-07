# 文档索引

这份索引只列当前仍然有效、后续排查时最值得优先看的文档。

## 当前优先阅读

- [00-overview.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/00-overview.md)
  项目目标、业务边界、当前方向。

- [08-current-status.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/08-current-status.md)
  当前已经完成什么、线上是什么状态、哪些功能可直接测试。

- [12-web-priority.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/12-web-priority.md)
  为什么现在以网页为主，小程序为什么暂停。

- [13-web-release-checklist.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/13-web-release-checklist.md)
  上线前核对项。

- [14-operations-handbook.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/14-operations-handbook.md)
  服务器、部署、常用命令、排障入口。

- [15-frontend-validation.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/15-frontend-validation.md)
  发版前检查前端脚本、资源版本号和公网可用性。

- [16-staging-test-flow.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/16-staging-test-flow.md)
  测试服固定的小测试和大测试流程。

- [17-claude-code-reference-optimization.md](17-claude-code-reference-optimization.md)
  结合 Claude Code 源码和深度分析后的正式优化路线图。

- [18-iteration-1-execution-plan.md](18-iteration-1-execution-plan.md)
  第一期可直接执行的改造任务清单。

- [21-helper-integration-staging-plan.md](21-helper-integration-staging-plan.md)
  Helper 接入方案，强调测试服优先、正式服隔离、扫码绑定与阵容快照分阶段落地。

- [22-staging-auth-helper-smoke-tests.md](22-staging-auth-helper-smoke-tests.md)
  测试服登录、商品列表、按钮交互、账号展示、helper 入口的标准冒烟流程。

- [23-helper-capability-audit-and-restore-roadmap.md](23-helper-capability-audit-and-restore-roadmap.md)
  Helper 现有读写能力审计，一键还原可以先做到哪一步，哪些字段适合先展示、再恢复。

- [24-helper-staging-handoff-and-production-rollout.md](24-helper-staging-handoff-and-production-rollout.md)
  Helper 联调在测试服当前已经做到哪一步，正式服建议先开什么、后开什么，以及快速回滚方式。

- [25-multi-furnace-inventory-and-auto-fulfillment-plan.md](25-multi-furnace-inventory-and-auto-fulfillment-plan.md)
  多炉子仓库、残卷流水识别、自动发货的分阶段方案，强调先做多绑定和库存展示，再做自动发货。

## 按问题查文档

- 价格规则：
  [06-pricing-system.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/06-pricing-system.md)

- API 和接口返回：
  [03-api.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/03-api.md)

- 数据结构：
  [02-data-model.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/02-data-model.md)

- 架构优化路线：
  [17-claude-code-reference-optimization.md](17-claude-code-reference-optimization.md)

- 第一期实施清单：
  [18-iteration-1-execution-plan.md](18-iteration-1-execution-plan.md)

- Helper 接入方案：
  [21-helper-integration-staging-plan.md](21-helper-integration-staging-plan.md)

- 测试服登录与 helper 冒烟：
  包含接口冒烟和前端按钮交互冒烟。
  [22-staging-auth-helper-smoke-tests.md](22-staging-auth-helper-smoke-tests.md)

- Helper 能力审计与一键还原路线：
  [23-helper-capability-audit-and-restore-roadmap.md](23-helper-capability-audit-and-restore-roadmap.md)

- Helper 测试服交接与正式服处理建议：
  [24-helper-staging-handoff-and-production-rollout.md](24-helper-staging-handoff-and-production-rollout.md)

- 多炉子仓库与自动发货路线：
  [25-multi-furnace-inventory-and-auto-fulfillment-plan.md](25-multi-furnace-inventory-and-auto-fulfillment-plan.md)

- 旧小程序路径和归档：
  [07-miniapp-plan.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/07-miniapp-plan.md)
  [09-miniapp-release.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/09-miniapp-release.md)
  [10-wxcloudrun-deploy.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/10-wxcloudrun-deploy.md)
  [11-miniapp-env-config.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/11-miniapp-env-config.md)

## 排查顺序建议

1. 先看 [08-current-status.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/08-current-status.md)，确认目标功能是否本来就支持。
2. 再看 [14-operations-handbook.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/14-operations-handbook.md)，确认环境、部署、日志和命令。
3. 如果是价格或业务计算问题，再看 [06-pricing-system.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/06-pricing-system.md)。
4. 如果是接口或前后端联调问题，再看 [03-api.md](/c:/Users/Administrator/Desktop/内包/gongfa/docs/03-api.md)。
