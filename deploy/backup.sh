#!/bin/sh
# Backs up a running margin instance, without downtime, to
# ./backups/margin-<timestamp>.tar: the database, the uploads volume and .env.
#
# The archive holds every secret in .env. Keep it as safe as the server, and
# copy it off the host (rsync, rclone, restic) on your own schedule, e.g.:
#   0 3 * * * cd /opt/margin && ./backup.sh >/dev/null
# Not included: caddy_data (certificates are re-issued) and files in S3 when
# STORAGE_TYPE=s3 (use your provider's versioning or replication).
set -eu

cd "$(dirname "$0")"
[ -f .env ] || { echo "error: no .env here; run this from the install directory" >&2; exit 1; }

umask 077
mkdir -p backups
work="$(mktemp -d backups/.partial-XXXXXX)"
trap 'rm -rf "$work"' EXIT INT TERM

echo "Dumping the database..."
docker compose exec -T postgres pg_dump -U margin -d margin --format=custom >"$work/db.dump"

echo "Archiving uploads..."
docker compose exec -T margin-server tar -C /var/margin/uploads -cf - . >"$work/uploads.tar"

cp .env "$work/env"
sed -n 's/^MARGIN_VERSION=//p' .env >"$work/version"

archive="backups/margin-$(date -u +%Y%m%d-%H%M%S).tar"
tar -C "$work" -cf "$archive.partial" version db.dump uploads.tar env
mv "$archive.partial" "$archive"
chmod 600 "$archive"

echo "Wrote $(pwd)/$archive"
