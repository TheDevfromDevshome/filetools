#!/usr/bin/env bash
# FileTools — start API, web and all workers
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found — run ./scripts/install.sh first." >&2
  exit 1
fi

echo "Starting FileTools..."
echo "  logs -> $LOG_DIR"

cleanup() {
  echo "Stopping all services..."
  kill "$(cat "$LOG_DIR/api.pid")" 2>/dev/null || true
  kill "$(cat "$LOG_DIR/web.pid")" 2>/dev/null || true
  for w in image pdf media archive document; do
    kill "$(cat "$LOG_DIR/$w-worker.pid")" 2>/dev/null || true
  done
  rm -f "$LOG_DIR"/*.pid
  echo "Stopped."
}

trap cleanup EXIT INT TERM

# API
(cd "$PROJECT_DIR" && pnpm --filter @filetools/api start >"$LOG_DIR/api.log" 2>&1 & echo $! > "$LOG_DIR/api.pid")

# Web
(cd "$PROJECT_DIR" && pnpm --filter @filetools/web start >"$LOG_DIR/web.log" 2>&1 & echo $! > "$LOG_DIR/web.pid")

# Workers
for w in image pdf media archive document; do
  (cd "$PROJECT_DIR" && pnpm --filter @filetools/$w-worker start >"$LOG_DIR/$w-worker.log" 2>&1 & echo $! > "$LOG_DIR/$w-worker.pid")
done

echo "All services started. Press Ctrl+C to stop all."

# Keep running
while true; do
  sleep 5
done