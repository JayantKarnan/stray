#!/usr/bin/env bash
# Rebuilds the curated public/ folder from the source files and deploys it to Cloudflare Pages.
# Run this any time index.html (or any other game file) changes and you want the live site updated.
# One-time setup before this works: `npx wrangler login` (see DEPLOY.md).
set -euo pipefail
cd "$(dirname "$0")"

PROJECT_NAME="${1:-stray}"

echo "==> Rebuilding public/ from source files"
rm -rf public
mkdir -p public
cp index.html three.module.js cannon-es.js audio-assets.js dog.glb manifest.json public/
cp -r jsm public/
cp -r icons public/

# stamp a unique cache name into sw.js on every deploy — this is what makes the service worker
# actually pick up new files instead of serving a stale cached index.html forever (a real bug we
# hit: CACHE_NAME sat unchanged across 4 deploys, so returning visitors never saw any update)
BUILD_ID=$(date +%s)
sed "s/__BUILD__/$BUILD_ID/" sw.js > public/sw.js
echo "==> sw.js cache-busted to build $BUILD_ID"

echo "==> Deploying public/ to Cloudflare Pages (project: $PROJECT_NAME)"
npx wrangler pages deploy public --project-name "$PROJECT_NAME"

echo "==> Done. See the URL printed above."
