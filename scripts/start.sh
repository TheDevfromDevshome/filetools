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

# ---- Warn if the build (dist/) is missing or older than the sources ----
STALE=0
for d in apps/api packages/types packages/config packages/database packages/shared \
         workers/image-worker workers/pdf-worker workers/media-worker workers/archive-worker workers/document-worker; do
  pkg="$PROJECT_DIR/$d"
  [[ -d "$pkg" ]] || continue
  entry="$pkg/dist/index.js"
  if [[ ! -f "$entry" ]]; then
    echo "  [warn] $d has no dist/ — not built yet" >&2
    STALE=1
  elif [[ -n "$(find "$pkg/src" -type f -newer "$entry" 2>/dev/null)" ]]; then
    echo "  [warn] $d sources are newer than dist/ — build is outdated" >&2
    STALE=1
  fi
done
if [[ "$STALE" == "1" ]]; then
  echo "" >&2
  echo "  The installed build is OUTDATED. Run this first:" >&2
  echo "    pnpm build" >&2
  echo "  (or re-run ./scripts/install.sh) and then start again." >&2
  exit 1
fi

cleanup() {
  [[ -n "${CLEANUP_DONE:-}" ]] && return
  CLEANUP_DONE=1
  echo ""
  echo "Stopping all services..."
  for p in api web image-worker pdf-worker media-worker archive-worker document-worker; do
    if [[ -f "$LOG_DIR/$p.pid" ]]; then
      kill "$(cat "$LOG_DIR/$p.pid")" 2>/dev/null || true
    fi
  done
  rm -f "$LOG_DIR"/*.pid
  echo "Stopped."
}

trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM
trap cleanup EXIT

# API
(cd "$PROJECT_DIR" && pnpm --filter @filetools/api start >"$LOG_DIR/api.log" 2>&1 & echo $! > "$LOG_DIR/api.pid")

# Web
(cd "$PROJECT_DIR" && pnpm --filter @filetools/web start >"$LOG_DIR/web.log" 2>&1 & echo $! > "$LOG_DIR/web.pid")

# Workers
for w in image pdf media archive document; do
  (cd "$PROJECT_DIR" && pnpm --filter @filetools/$w-worker start >"$LOG_DIR/$w-worker.log" 2>&1 & echo $! > "$LOG_DIR/$w-worker.pid")
done

echo "All services started. Press Ctrl+C to stop all."
node "$PROJECT_DIR/scripts/print-urls.mjs"

# Keep running
while true; do
  sleep 5
done