#!/usr/bin/env bash
# Nightly encrypted database dump (ADR-0010). Run from cron on the server, e.g.
#   15 2 * * * /home/ubuntu/ai-tutor-platform/deploy/backup.sh >> /var/log/ai-tutor-backup.log 2>&1
# The dump is encrypted to BACKUP_GPG_RECIPIENT, whose private key is kept off this server, so a stolen
# server can't read old backups. The staging laptop pulls the files (README, "Backups").
set -euo pipefail
cd "$(dirname "$0")"
set -a && source .env && set +a

: "${BACKUP_GPG_RECIPIENT:?set BACKUP_GPG_RECIPIENT in deploy/.env}"
DIR="${BACKUP_DIR:-/var/backups/ai-tutor}"
KEEP_DAYS=14
FILE="$DIR/ai-tutor-$(date -u +%Y%m%d-%H%M%S).dump.gpg"

mkdir -p "$DIR"
trap 'rm -f "$FILE.part"' EXIT # a failed dump leaves nothing behind
# Custom format: compressed, and pg_restore can restore one table if needed.
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom \
  | gpg --batch --yes --trust-model always --encrypt --recipient "$BACKUP_GPG_RECIPIENT" --output "$FILE.part"
mv "$FILE.part" "$FILE" # only a finished dump gets the real name
find "$DIR" -name 'ai-tutor-*.dump.gpg' -mtime +"$KEEP_DAYS" -delete
echo "$(date -u +%FT%TZ) backed up $(du -h "$FILE" | cut -f1) to $FILE"
