#!/usr/bin/env bash
# Serve the app on a throwaway port, run the headless UI smoke test, then stop
# the server and exit with the test's status.
set -u
PORT="${PORT:-8077}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

python3 -m http.server "$PORT" --directory "$ROOT" >/tmp/egpoc-smoke-srv.log 2>&1 &
SRV=$!
trap 'kill "$SRV" 2>/dev/null' EXIT
sleep 1

node "$ROOT/tests/smoke.mjs" "http://localhost:$PORT"
exit $?
