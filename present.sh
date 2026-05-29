#!/usr/bin/env bash
# Live talk with presenter-driven sync: runs the Slidev server and a public tunnel.
# Everyone who opens the tunnel URL follows your navigation in real time.
#
# Usage:
#   ./present.sh                 # no presenter password (anyone can use /presenter)
#   PRESENT_PASS=secret ./present.sh   # lock /presenter behind a password
#
# Requirements: node deps installed (npm ci), and cloudflared for the public URL:
#   brew install cloudflared        (macOS)
set -euo pipefail
cd "$(dirname "$0")"

PORT=3030
REMOTE_ARG="--remote"
[ -n "${PRESENT_PASS:-}" ] && REMOTE_ARG="--remote=${PRESENT_PASS}"

echo "Starting Slidev server on :${PORT} ..."
npx slidev --port "$PORT" $REMOTE_ARG &
SLIDEV_PID=$!
trap 'kill $SLIDEV_PID 2>/dev/null || true' EXIT

# wait for the server
until curl -s -o /dev/null "http://localhost:${PORT}/"; do sleep 1; done

if command -v cloudflared >/dev/null 2>&1; then
  echo
  echo "Opening public tunnel (share the https URL below with the audience):"
  echo "  presenter -> <tunnel-url>/presenter   audience -> <tunnel-url>/"
  echo
  cloudflared tunnel --url "http://localhost:${PORT}"
else
  echo
  echo "cloudflared not found. Locally:"
  echo "  presenter -> http://localhost:${PORT}/presenter"
  echo "  audience  -> http://localhost:${PORT}/  (same Wi-Fi: use your LAN IP)"
  echo "Install cloudflared for a public URL: brew install cloudflared"
  wait $SLIDEV_PID
fi
