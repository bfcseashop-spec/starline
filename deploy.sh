#!/bin/bash

# Starline – deploy with backup (same pattern as skyline/primepos)

# Usage: ./deploy.sh [--no-deploy]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ "${EUID:-$(id -u)}" -eq 0 ]; then
  echo "Do not run deploy as root."
  echo "Use admin93 user: ./deploy.sh"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%m-%d-%Y-%H-%M)
PREFIX="${TIMESTAMP}-starline"
TAR_FILE="$BACKUP_DIR/${PREFIX}.tar.gz"

echo "=== Starline – Backup & Deploy ==="
echo "Timestamp: $TIMESTAMP"
echo "Backup dir: $BACKUP_DIR"
echo ""

# Load env if exists

if [ -f .env ]; then
set -a
source .env 2>/dev/null || true
set +a
fi

echo "[1/8] Backing up code to $TAR_FILE"
tar -czf "$TAR_FILE" \
  --exclude='node_modules' --exclude='dist' --exclude='.git' --exclude='backups' \
  --exclude='*.zip' --exclude='*.tar.gz' --exclude='*.sql' --exclude='.env' \
  .
echo "  Code backup: $TAR_FILE"

if [ "$1" = "--no-deploy" ]; then
echo ""
echo "Backup complete. (--no-deploy: skipping deployment)"
exit 0
fi

echo ""
echo "[2/8] git pull (uses --autostash for other local edits)"
# VPS should not keep a forked lockfile; stashing it causes "autostash → conflicts" after pull.
if git status --porcelain 2>/dev/null | grep -q 'package-lock.json'; then
  echo "  Note: discarding local package-lock.json changes (use the version from git)."
  git restore package-lock.json 2>/dev/null || git checkout -- package-lock.json
fi
git pull --autostash
# If autostash pop conflicted (common on package-lock.json), leave a clean tree at HEAD.
if [ -n "$(git ls-files -u 2>/dev/null)" ]; then
  echo "  Warning: merge conflicts after pull — resetting to last commit and dropping top stash entry."
  git reset --hard HEAD
  git stash drop 2>/dev/null || true
fi

echo "[3/8] npm install"
npm install

echo "[4/8] npm run build"
npm run build

echo "[5/8] npm run api:build"
npm run api:build

echo "[6-8/8] PM2: recreate starline + starline-api from ecosystem.config.cjs"
echo "       (Ensures cwd is $SCRIPT_DIR — fixes crash loops when PM2 started npm without --cwd)"
export API_PORT="${API_PORT:-4042}"
pm2 delete starline starline-api 2>/dev/null || true
pm2 start "$SCRIPT_DIR/ecosystem.config.cjs" --update-env

echo "[save] Persisting PM2 process list"
pm2 save

echo ""
echo "=== Deploy complete ==="
echo "Backup: $TAR_FILE"
