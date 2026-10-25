#!/usr/bin/env bash
# Nightly encrypted backup of the Supabase database to this laptop (ADR-0024). Needs Docker Desktop running and
# Git Bash. Settings live outside the repo, in ~/.ai-tutor-backup/config (chmod 600):
#   SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-<n>-ap-south-1.pooler.supabase.com:5432/postgres
#   PG_IMAGE=postgres:17-alpine     # pg_dump must be at least the server's major version
# and the passphrase in ~/.ai-tutor-backup/passphrase (one long random line, also kept in a password manager:
# without it no backup can be read). Scheduled with Windows Task Scheduler (README, "Backups").
set -euo pipefail
HOME_DIR="$HOME/.ai-tutor-backup"
source "$HOME_DIR/config"
: "${SUPABASE_DB_URL:?set SUPABASE_DB_URL in $HOME_DIR/config}"
PASSPHRASE="$HOME_DIR/passphrase"
[ -s "$PASSPHRASE" ] || { echo "Missing $PASSPHRASE"; exit 1; }
DIR="${BACKUP_DIR:-$HOME/ai-tutor-backups}"
KEEP_DAYS=14
FILE="$DIR/ai-tutor-$(date -u +%Y%m%d-%H%M%S).dump.enc"

mkdir -p "$DIR"
trap 'rm -f "$FILE.part"' EXIT # a failed dump leaves nothing behind
# Custom format: compressed, and pg_restore can restore one table if needed. --no-owner: Supabase's roles
# don't exist in a local Postgres used for a restore check.
docker run --rm "${PG_IMAGE:-postgres:17-alpine}" pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass "file:$(cygpath -m "$PASSPHRASE")" -out "$FILE.part"
mv "$FILE.part" "$FILE"
find "$DIR" -name 'ai-tutor-*.dump.enc' -mtime +"$KEEP_DAYS" -delete
echo "$(date -u +%FT%TZ) backed up $(du -h "$FILE" | cut -f1) to $FILE"
