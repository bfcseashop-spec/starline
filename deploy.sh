#!/bin/bash

# Starline – deploy with backup (same pattern as skyline/primepos)

# Usage: ./deploy.sh [--no-deploy]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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

echo "[1/6] Backing up code to $TAR_FILE"
tar --exclude='node_modules' --exclude='dist' --exclude='.git' --exclude='backups' 
--exclude='*.zip' --exclude='*.tar.gz' --exclude='*.sql' --exclude='.env' 
-czf "$TAR_FILE" .
echo "  Code backup: $TAR_FILE"

if [ "$1" = "--no-deploy" ]; then
echo ""
echo "Backup complete. (--no-deploy: skipping deployment)"
exit 0
fi

echo ""
echo "[2/6] git pull"
git pull

echo "[3/6] npm install"
npm install

echo "[4/6] npm run build"
npm run build

echo "[5/6] Restarting PM2 (starline)"
pm2 restart starline || pm2 start serve --name starline -- -s dist -l 5174

echo "[6/6] Saving PM2 state"
pm2 save

echo ""
echo "=== Deploy complete ==="
echo "Backup: $TAR_FILE"
