#!/usr/bin/env bash
# Start Level Up on the latest version: used by GitHub Codespaces automatically,
# or run it yourself with `npm run live` after an update.
cd "$(dirname "$0")/.."

echo "▶ Getting the latest version…"
git checkout -- package-lock.json 2>/dev/null   # npm sometimes rewrites this; it's safe to reset
if ! git pull --ff-only --quiet 2>/dev/null; then
  echo "  (Couldn't update automatically — carrying on with the version you have.)"
fi

# Install packages only when they've changed since last time.
STAMP=node_modules/.levelup-lock
if [ ! -f "$STAMP" ] || ! cmp -s package-lock.json "$STAMP"; then
  echo "▶ Installing packages…"
  npm ci --no-audit --no-fund --loglevel=error && cp package-lock.json "$STAMP"
fi

# Demo accounts the first time only (your own accounts are kept after that).
if [ ! -f data/levelup.db ]; then
  echo "▶ Adding demo accounts…"
  npm run --silent seed
fi

# Stop any copy that's already running, then start.
pkill -f "node .*server.js" 2>/dev/null && sleep 1
echo "▶ Starting Level Up (the link opens automatically; or use the Ports tab → port 3000)…"
exec npm start
