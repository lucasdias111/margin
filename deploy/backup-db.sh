#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env not found at $ENV_FILE" >&2
  exit 1
fi

# shellcheck source=.env
set -a; source "$ENV_FILE"; set +a

: "${POSTGRES_DB:?}" "${POSTGRES_USER:?}" "${POSTGRES_PASSWORD:?}"
: "${S3_ACCESS_KEY:?}" "${S3_SECRET_KEY:?}" "${HETZNER_S3_ENDPOINT:?}"
: "${BACKUP_BUCKET:?Need to set BACKUP_BUCKET in .env}"

TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

dump_and_upload() {
  local container="$1"
  local db_user="$2"
  local db_name="$3"
  local label="$4"

  local filename="${label}_${TIMESTAMP}.sql.gz"
  local local_path="$TMPDIR/$filename"
  local s3_key="db-backups/$label/$filename"

  echo "[$(date -u +%H:%M:%S)] Dumping $label..."
  docker exec "$container" \
    pg_dump -U "$db_user" "$db_name" \
    | gzip > "$local_path"

  echo "[$(date -u +%H:%M:%S)] Uploading $filename to s3://$BACKUP_BUCKET/$s3_key ..."
  AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
  AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
  aws s3 cp "$local_path" "s3://$BACKUP_BUCKET/$s3_key" \
    --endpoint-url "$HETZNER_S3_ENDPOINT" \
    --region eu-central-1 \
    --no-progress

  echo "[$(date -u +%H:%M:%S)] Done: $label"
}

dump_and_upload "margindb"  "$POSTGRES_USER" "$POSTGRES_DB"   "margindb"
dump_and_upload "umami-db"  "umami"          "umami"           "umami"

echo "[$(date -u +%H:%M:%S)] All backups complete."
