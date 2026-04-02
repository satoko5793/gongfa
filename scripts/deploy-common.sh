#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 5 ]]; then
  echo "usage: $0 <ssh-host> <remote-dir> <compose-file> <health-url> <project-name>" >&2
  exit 1
fi

SSH_HOST="$1"
REMOTE_DIR="$2"
COMPOSE_FILE="$3"
HEALTH_URL="$4"
PROJECT_NAME="$5"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
HELPER_PUBLIC_SOURCE="${REPO_ROOT}/../xyzw_web_helper/public"
REMOTE_HELPER_DIR="${REMOTE_DIR}/xyzw_web_helper/public"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required" >&2
  exit 1
fi

echo "[deploy] syncing repo to ${SSH_HOST}:${REMOTE_DIR}"
rsync -az --delete \
  --exclude ".git" \
  --exclude ".DS_Store" \
  --exclude "node_modules" \
  --exclude "backend/node_modules" \
  --exclude ".env.production" \
  --exclude ".env.staging" \
  --exclude "backend/dev-data.json" \
  --exclude "backend/dev-data.staging.json" \
  "${REPO_ROOT}/" "${SSH_HOST}:${REMOTE_DIR}/"

if [[ -d "${HELPER_PUBLIC_SOURCE}" ]]; then
  echo "[deploy] syncing helper public assets"
  ssh "${SSH_HOST}" "mkdir -p '${REMOTE_HELPER_DIR}'"
  rsync -az --delete \
    --exclude ".DS_Store" \
    "${HELPER_PUBLIC_SOURCE}/" "${SSH_HOST}:${REMOTE_HELPER_DIR}/"
else
  echo "[deploy] helper public assets not found at ${HELPER_PUBLIC_SOURCE}, skipping"
fi

echo "[deploy] rebuilding ${PROJECT_NAME}"
ssh "${SSH_HOST}" "cd '${REMOTE_DIR}' && docker compose -p '${PROJECT_NAME}' -f '${COMPOSE_FILE}' up -d --build web"

echo "[deploy] container status"
ssh "${SSH_HOST}" "cd '${REMOTE_DIR}' && docker compose -p '${PROJECT_NAME}' -f '${COMPOSE_FILE}' ps"

echo "[deploy] health check ${HEALTH_URL}"
ssh "${SSH_HOST}" "curl -fsS '${HEALTH_URL}'"
