#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8899}"
PID_FILE="/tmp/astronomy-site.pid"

if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
  echo "Astronomy site already running on port ${PORT}"
  exit 0
fi

if [ -f "$PID_FILE" ]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
    kill "$old_pid" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
fi

cd /workspace
nohup npm start > /tmp/astronomy-site.log 2>&1 &
echo $! > "$PID_FILE"

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    echo "Astronomy site ready on port ${PORT}"
    exit 0
  fi
  sleep 1
done

echo "Astronomy site failed to start within 30s" >&2
tail -20 /tmp/astronomy-site.log >&2 || true
exit 1
