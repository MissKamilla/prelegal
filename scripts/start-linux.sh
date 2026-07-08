#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${PRELEGAL_IMAGE_NAME:-prelegal-v1}"
CONTAINER_NAME="${PRELEGAL_CONTAINER_NAME:-prelegal-v1}"
PORT="${PRELEGAL_PORT:-8000}"

docker build -t "$IMAGE_NAME" .
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER_NAME" -p "$PORT:8000" "$IMAGE_NAME"

echo "Prelegal is running at http://127.0.0.1:$PORT"
