#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${PRELEGAL_CONTAINER_NAME:-prelegal-v1}"

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
echo "Prelegal container stopped."
