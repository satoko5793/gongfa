# 12 Web Priority Note

Updated: 2026-03-16

## Current decision

The project is returning to a web-first path.

- Keep the web storefront and web admin as the active delivery path
- Pause the WeChat mini program path for now
- Do not spend more time or money on mini program review, custom domain, or cloud request-domain setup until the business qualification path is clear

## Why the mini program is paused

The current mini program review direction is blocked by platform compliance requirements for personal主体 in a game-item / transaction scenario.

This means the current blocker is not a code bug. It is a product-and-compliance constraint.

## What stays active

- `frontend/`: active web storefront and admin entry
- `backend/`: active API and admin support
- `docs/06-pricing-system.md`: active pricing reference
- `docs/08-current-status.md`: current implementation snapshot

## What is parked

- `mp-app/`: parked mini program worktree
- `app/`: parked mirror directory for mini program
- `docs/09-miniapp-release.md`: keep as archive/reference, not current execution plan
- `docs/10-wxcloudrun-deploy.md`: keep as archive/reference, not current execution plan
- `docs/11-miniapp-env-config.md`: keep as archive/reference, not current execution plan

## Re-entry condition

Only resume the mini program path after all of the following are true:

1. A compliant主体 path is confirmed
2. The allowed business scope and category path are confirmed
3. A production custom HTTPS domain is ready
4. The team explicitly decides to restart mini program delivery

## Practical next step

Continue shipping and refining the web version first.
