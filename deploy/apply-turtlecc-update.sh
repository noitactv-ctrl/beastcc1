#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${1:-}"
STAGING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_DIR="/root/turtlecc-backups/$STAMP"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required on the VPS." >&2
  exit 1
fi

if [ -z "$APP_DIR" ]; then
  for candidate in \
    /opt/turtlecc \
    /opt/beastcc \
    /var/www/turtlecc \
    /var/www/beastcc \
    /root/turtlecc \
    /root/beastcc
  do
    if [ -f "$candidate/docker-compose.yml" ]; then
      APP_DIR="$candidate"
      break
    fi
  done
fi

if [ -z "$APP_DIR" ] || [ ! -f "$APP_DIR/docker-compose.yml" ]; then
  echo "Could not find the existing TurtleCC/BEASTCC app directory." >&2
  echo "Run this script with the app directory as its first argument." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Using app directory: $APP_DIR"
echo "Saving rollback files in: $BACKUP_DIR"

if [ -f "$APP_DIR/.env" ]; then
  install -m 600 "$APP_DIR/.env" "$BACKUP_DIR/.env"
fi

if [ -f "$APP_DIR/deploy/nginx.conf" ]; then
  cp -a "$APP_DIR/deploy/nginx.conf" "$BACKUP_DIR/nginx.conf"
fi

echo "Backing up the current PostgreSQL database..."
(
  cd "$APP_DIR"
  docker compose exec -T db sh -lc \
    'pg_dump --format=custom --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
    > "$BACKUP_DIR/database.dump"
)
chmod 600 "$BACKUP_DIR/database.dump"

echo "Copying the TurtleCC update while preserving .env and existing assets..."
tar \
  --exclude="./.env" \
  --exclude="./node_modules" \
  --exclude="./dist" \
  --exclude="./attached_assets" \
  -C "$STAGING_DIR" \
  -cf - . | tar -C "$APP_DIR" -xf -

if [ -f "$APP_DIR/.env" ]; then
  chmod 600 "$APP_DIR/.env"
fi

echo "Checking the source and rebuilding the application..."
(
  cd "$APP_DIR"
  docker compose run --rm migrate
  docker compose up -d --build
)

echo "Waiting for the health endpoint..."
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:5000/api/health >/dev/null; then
    echo "TurtleCC is healthy."
    echo "Database backup: $BACKUP_DIR/database.dump"
    exit 0
  fi
  sleep 2
done

echo "The app did not become healthy. Recent app logs:" >&2
(
  cd "$APP_DIR"
  docker compose logs --tail=100 app
)
exit 1