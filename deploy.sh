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
cp index.html three.module.js cannon-es.js audio-assets.js dog.glb manifest.json sw.js public/
cp -r jsm public/
cp -r icons public/

echo "==> Deploying public/ to Cloudflare Pages (project: $PROJECT_NAME)"
npx wrangler pages deploy public --project-name "$PROJECT_NAME"

echo "==> Done. See the URL printed above."
