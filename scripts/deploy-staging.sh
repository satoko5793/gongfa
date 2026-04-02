#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${SCRIPT_DIR}/deploy-common.sh" \
  "gongfa-staging" \
  "/opt/gongfa-staging" \
  "infra/docker-compose.staging.yml" \
  "http://127.0.0.1:8081/health" \
  "gongfa-staging"
