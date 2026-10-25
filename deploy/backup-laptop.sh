#!/usr/bin/env bash
# Nightly encrypted backup of the Supabase database to a laptop we own (ADR-0024): the home server (Ubuntu,
# cron) or a Windows laptop (Git Bash + Docker Desktop, Task Scheduler). Settings live outside the repo, in
# ~/.ai-tutor-backup/config (chmod 600):
#   SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-<n>-ap-south-1.pooler.supabase.com:5432/postgres
#   PG_DUMP=/usr/lib/postgresql/17/bin/pg_dump   # a local pg_dump; without it Docker runs PG_IMAGE
#   PG_IMAGE=postgres:17-alpine                  # either way, at least the server's major version
# and the passphrase in ~/.ai-tutor-backup/passphrase (one long random line, also kept in a password manager:
# without it no backup can be read). README, "Backups".
set -euo pipefail
HOME_DIR="$HOME/.ai-tutor-backup"
source "$HOME_DIR/config"
: "${SUPABASE_DB_URL:?set SUPABASE_DB_URL in $HOME_DIR/config}"
PASSPHRASE="$HOME_DIR/passphrase"
[ -s "$PASSPHRASE" ] || { echo "Missing $PASSPHRASE"; exit 1; }
command -v cygpath >/dev/null && PASSPHRASE="$(cygpath -m "$PASSPHRASE")" # Git Bash: openssl wants a Windows path
DIR="${BACKUP_DIR:-$HOME/ai-tutor-backups}"
KEEP_DAYS=14
FILE="$DIR/ai-tutor-$(date -u +%Y%m%d-%H%M%S).dump.enc"
if [ -n "${PG_DUMP:-}" ]; then DUMP=("$PG_DUMP"); else DUMP=(docker run --rm "${PG_IMAGE:-postgres:17-alpine}" pg_dump); fi

mkdir -p "$DIR"
trap 'rm -f "$FILE.part"' EXIT # a failed dump leaves nothing behind
# Custom format: compressed, and pg_restore can restore one table if needed. --no-owner: Supabase's roles
# don't exist in a local Postgres used for a restore check.
"${DUMP[@]}" "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass "file:$PASSPHRASE" -out "$FILE.part"
mv "$FILE.part" "$FILE"
find "$DIR" -name 'ai-tutor-*.dump.enc' -mtime +"$KEEP_DAYS" -delete
echo "$(date -u +%FT%TZ) backed up $(du -h "$FILE" | cut -f1) to $FILE"
