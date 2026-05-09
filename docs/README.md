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
  发版前检查前端脚本、模块链版本一致性和公网可用性。

- [27-web-release-readiness.md](27-web-release-readiness.md)
  当前这一轮实际上线准备、真实回归结果、已知风险和发布判断。

- [28-production-release-runbook.md](28-production-release-runbook.md)
  正式发布的最短执行步骤、回滚方式和发布后验收顺序。

- [29-release-summary-2026-04-09.md](29-release-summary-2026-04-09.md)
  这次正式发布的结果摘要、正式服校验结论和 smoke 清理结果。

- [30-compensation-plan-2026-04-09.md](30-compensation-plan-2026-04-09.md)
  数据事故后的补偿口径、对外公告模板、用户申报字段和后台执行名单模板。

- [31-incident-announcement-2026-04-09.md](31-incident-announcement-2026-04-09.md)
  本次数据异常对外公告成稿，可直接用于群公告或首页公告。

- [32-project-refactor-roadmap.md](32-project-refactor-roadmap.md)
  当前项目的正式重构路线，固定分期、固定节奏，强调文档先行、本地改、测试服验证。

- [33-phase-1-pricing-refactor-plan.md](33-phase-1-pricing-refactor-plan.md)
  第一期只拆价格系统的执行计划、代码落点、测试清单和回滚方式。

- [34-phase-2-dev-store-and-repository-plan.md](34-phase-2-dev-store-and-repository-plan.md)
  第二期聚焦 `dev-store` 和 file repository 分层，目标是把文件读写、归一化和公共重算钩子移出超大入口。

- [35-phase-3-admin-frontend-split-plan.md](35-phase-3-admin-frontend-split-plan.md)
  第三期聚焦后台前端，把 `admin.js` 和后台样式拆成 runtime/state/services/renderers/pages 与样式分片的兼容结构。

- [36-phase-4-enums-errors-logs-release-checks-plan.md](36-phase-4-enums-errors-logs-release-checks-plan.md)
  第四期聚焦后端契约层，统一常量来源、错误 envelope、request id、写操作日志和发版前检查脚本。

- [37-release-summary-2026-05-09.md](37-release-summary-2026-05-09.md)
  2026-05-09 正式服阶段摘要，覆盖 S5 策略、helper 扫码登录、图鉴动态套餐、拆页发版和验证命令。

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

- 当前项目重构路线：
  [32-project-refactor-roadmap.md](32-project-refactor-roadmap.md)

- 当前价格系统拆分计划：
  [33-phase-1-pricing-refactor-plan.md](33-phase-1-pricing-refactor-plan.md)

- 当前 `dev-store` 收口计划：
  [34-phase-2-dev-store-and-repository-plan.md](34-phase-2-dev-store-and-repository-plan.md)

- 当前后台前端拆分计划：
  [35-phase-3-admin-frontend-split-plan.md](35-phase-3-admin-frontend-split-plan.md)

- 当前后端契约统一计划：
  [36-phase-4-enums-errors-logs-release-checks-plan.md](36-phase-4-enums-errors-logs-release-checks-plan.md)

- 最新正式服阶段摘要：
  [37-release-summary-2026-05-09.md](37-release-summary-2026-05-09.md)

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

- 正式发布步骤：
  [28-production-release-runbook.md](28-production-release-runbook.md)

- 数据事故补偿方案：
  [30-compensation-plan-2026-04-09.md](30-compensation-plan-2026-04-09.md)

- 数据异常公告成稿：
  [31-incident-announcement-2026-04-09.md](31-incident-announcement-2026-04-09.md)

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
