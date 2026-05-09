#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SSH_HOST="${GONGFA_PROD_SSH_HOST:-gongfa-prod}"
REMOTE_DATA_PATH="${GONGFA_PROD_DATA_PATH:-/opt/gongfa-data/dev-data.json}"
LOCAL_BACKUP_ROOT="${GONGFA_LOCAL_BACKUP_ROOT:-${REPO_ROOT}/backups/prod}"
TIMESTAMP="${1:-$(date '+%Y%m%d-%H%M%S')}"
TARGET_DIR="${LOCAL_BACKUP_ROOT}/dev-data-${TIMESTAMP}"
TARGET_FILE="${TARGET_DIR}${REMOTE_DATA_PATH}"
LATEST_LINK="${LOCAL_BACKUP_ROOT}/latest"

mkdir -p "${TARGET_DIR}"

echo "[backup] fetching ${SSH_HOST}:${REMOTE_DATA_PATH}"
rsync -azR "${SSH_HOST}:${REMOTE_DATA_PATH}" "${TARGET_DIR}/"

if [[ ! -f "${TARGET_FILE}" ]]; then
  echo "[backup] expected file not found: ${TARGET_FILE}" >&2
  exit 1
fi

FILE_SIZE="$(wc -c < "${TARGET_FILE}" | tr -d ' ')"
SHA256="$(shasum -a 256 "${TARGET_FILE}" | awk '{print $1}')"

cat > "${TARGET_DIR}/backup-meta.txt" <<EOF
timestamp=${TIMESTAMP}
ssh_host=${SSH_HOST}
remote_data_path=${REMOTE_DATA_PATH}
local_file=${TARGET_FILE}
bytes=${FILE_SIZE}
sha256=${SHA256}
EOF

ln -sfn "${TARGET_DIR}" "${LATEST_LINK}"

echo "[backup] saved to ${TARGET_FILE}"
echo "[backup] sha256 ${SHA256}"
