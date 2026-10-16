#!/bin/sh
# Restores a backup.sh archive into this install: stops the stack, replaces
# the database, the uploads volume and .env, then starts it again.
#
#   ./restore.sh backups/margin-20261016-030000.tar [--yes]
#
# Works on a fresh install too: install, then restore the old archive over it.
# The archive's .env comes back with it, including MARGIN_VERSION, so the
# instance runs the release the backup was taken on.
set -eu

usage() { echo "usage: $0 <archive> [--yes]" >&2; exit 1; }

archive=""
assume_yes=false
for arg in "$@"; do
	case "$arg" in
	--yes|-y) assume_yes=true ;;
	-*) usage ;;
	*) [ -z "$archive" ] || usage; archive="$arg" ;;
	esac
done
[ -n "$archive" ] || usage
[ -f "$archive" ] || { echo "error: no such file: $archive" >&2; exit 1; }
archive="$(cd "$(dirname "$archive")" && pwd)/$(basename "$archive")"

cd "$(dirname "$0")"
[ -f compose.yml ] || { echo "error: run this from the install directory" >&2; exit 1; }

umask 077
work="$(mktemp -d "${TMPDIR:-/tmp}/margin-restore-XXXXXX")"
trap 'rm -rf "$work"' EXIT INT TERM

tar -C "$work" -xf "$archive"
for f in db.dump uploads.tar env; do
	[ -f "$work/$f" ] || { echo "error: $archive isn't a margin backup (no $f)" >&2; exit 1; }
done

echo "This replaces this instance's database, uploads and .env with the backup"
echo "from $(basename "$archive") (margin $(cat "$work/version" 2>/dev/null || echo unknown))."
if [ "$assume_yes" = false ]; then
	if ! (: </dev/tty) 2>/dev/null; then
		echo "error: pass --yes to restore without a terminal" >&2
		exit 1
	fi
	printf 'Continue? [y/N]: ' >/dev/tty
	read -r answer </dev/tty || answer=""
	case "$answer" in [yY]*) ;; *) echo "Cancelled."; exit 1 ;; esac
fi

echo "Stopping the stack..."
docker compose down

cp "$work/env" .env
chmod 600 .env

echo "Restoring the database..."
docker compose up -d --wait postgres
pg() { docker compose exec -T postgres "$@"; }
pg psql -q -U margin -d postgres -v ON_ERROR_STOP=1 \
	-c 'DROP DATABASE IF EXISTS margin WITH (FORCE)' \
	-c 'CREATE DATABASE margin OWNER margin'
# The data volume keeps the password it was created with; match the restored .env.
password="$(sed -n "s/^POSTGRES_PASSWORD=//p" .env | sed "s/^'\(.*\)'\$/\1/")"
printf "ALTER ROLE margin PASSWORD :'pw';\n" | pg psql -q -U margin -d postgres -v ON_ERROR_STOP=1 -v pw="$password"
pg pg_restore -U margin -d margin --no-owner --exit-on-error <"$work/db.dump"

echo "Restoring uploads..."
docker compose run --rm -T --no-deps --entrypoint sh margin-server \
	-c 'find /var/margin/uploads -mindepth 1 -delete && tar -xf - -C /var/margin/uploads' <"$work/uploads.tar"

echo "Starting the stack..."
docker compose up -d

echo "Restored $(basename "$archive")."
