#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${SCRIPT_DIR}/deploy-common.sh" \
  "gongfa-prod" \
  "/opt/gongfa" \
  "infra/docker-compose.app.yml" \
  "http://127.0.0.1/health" \
  "gongfa-prod"
