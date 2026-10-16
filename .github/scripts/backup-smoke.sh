#!/bin/sh
# Backup smoke test: install an instance, seed it, back it up, wipe it, install
# a fresh one (new secrets) over the same directory, restore, and check the
# data and sessions came back.
#
#   MARGIN_VERSION=0.0.0-ci .github/scripts/backup-smoke.sh [WORKDIR]
#
# The ghcr.io/lucasdias111/margin-{server,sfu,web}:$MARGIN_VERSION images must
# already exist locally. HTTPS_PORT (default 443) is honoured by compose, for
# hosts that can't bind 443 (rootless Podman). Needs curl and jq.
set -eu

: "${MARGIN_VERSION:?set MARGIN_VERSION to the tag of locally built images}"
repo="$(cd "$(dirname "$0")/../.." && pwd)"
work="${1:-$(mktemp -d "${TMPDIR:-/tmp}/margin-smoke-XXXXXX")}"
mkdir -p "$work"
work="$(cd "$work" && pwd)"
install_dir="$work/margin"
domain="margin.localhost"
base="https://$domain:${HTTPS_PORT:-443}"
admin_email="admin@example.com"
admin_password="smoke-$(od -An -N8 -tx1 /dev/urandom | tr -d ' \n')"

step() { printf '\n== %s\n' "$*"; }
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

cleanup() {
	status=$?
	if [ -f "$install_dir/compose.yml" ]; then
		if [ "$status" != 0 ]; then
			(cd "$install_dir" && docker compose ps -a && docker compose logs --no-color --tail=200) || true
		fi
		(cd "$install_dir" && docker compose down -v --remove-orphans) >/dev/null 2>&1 || true
	fi
	[ -n "${KEEP_WORKDIR:-}" ] || rm -rf "$work"
	exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

# curl against the instance; Caddy serves margin.localhost from its local CA.
api() { curl -ksS --fail-with-body "$@"; }

wait_for_api() {
	tries=0
	until curl -ksf -o /dev/null "$base/api/instance"; do
		tries=$((tries + 1))
		[ "$tries" -lt 60 ] || fail "$base/api/instance never answered"
		sleep 3
	done
}

install() {
	sh "$work/bundle/install.sh" --dir "$install_dir" --domain "$domain" --public-ip 127.0.0.1 --yes "$@"
	wait_for_api
}

login() {
	api -H 'Content-Type: application/json' \
		-d "$(jq -n --arg e "$admin_email" --arg p "$admin_password" '{email: $e, password: $p}')" \
		"$base/api/auth/login"
}

step "Staging the release bundle"
MARGIN_BUNDLE_URL="file://$work/bundle"
export MARGIN_BUNDLE_URL
"$repo/.github/scripts/release-assets.sh" "$MARGIN_VERSION" "$work/bundle" >/dev/null

step "Installing"
install --admin-email "$admin_email" --admin-password "$admin_password"

step "Seeding"
auth="$(login)"
token="$(printf '%s' "$auth" | jq -er .token)" || fail "login failed: $auth"
refresh_token="$(printf '%s' "$auth" | jq -er .refreshToken)"
margin_id="$(api -H "Authorization: Bearer $token" \
	-F 'data={"marginName":"Backup smoke","marginDescription":"seeded before backup","visibility":"PUBLIC"};type=application/json' \
	"$base/api/margins/create_new_margin" | jq -er .marginId)"
head -c 262144 /dev/urandom >"$work/upload.bin"
file_url="$(api -H "Authorization: Bearer $token" -F "file=@$work/upload.bin" \
	"$base/api/files/margins/$margin_id/stored-files" | jq -er .url)"
file_path="/${file_url#*://*/}"
sha() { (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1; }
uploaded_sha="$(sha <"$work/upload.bin")"
[ "$(api -H "Authorization: Bearer $token" "$base$file_path" | sha)" = "$uploaded_sha" ] \
	|| fail "the uploaded file doesn't read back"
jwt_secret="$(sed -n 's/^JWT_SECRET=//p' "$install_dir/.env")"
echo "margin $margin_id, file $file_path"

step "Backing up"
"$install_dir/backup.sh"
archive="$(ls "$install_dir"/backups/margin-*.tar)"
[ "$(echo "$archive" | wc -l)" -eq 1 ] || fail "expected one archive, got: $archive"
[ -n "$(find "$archive" -perm 600)" ] || fail "the archive's mode isn't 600"
mv "$archive" "$work/backup.tar"

step "Wiping"
(cd "$install_dir" && docker compose down -v)
rm -rf "$install_dir"
if docker volume ls -q | grep -q '^margin_'; then
	fail "volumes survived the wipe: $(docker volume ls -q | grep '^margin_' | tr '\n' ' ')"
fi

step "Installing a fresh instance"
install
[ "$(sed -n 's/^JWT_SECRET=//p' "$install_dir/.env")" != "$jwt_secret" ] || fail "the fresh install reused the old JWT secret"
code="$(curl -ks -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" "$base/api/margins/get_margins")"
[ "$code" = 401 ] || [ "$code" = 403 ] || fail "the old token still works before the restore (HTTP $code)"

step "Restoring"
"$install_dir/restore.sh" "$work/backup.tar" --yes
wait_for_api

step "Checking"
[ "$(sed -n 's/^JWT_SECRET=//p' "$install_dir/.env")" = "$jwt_secret" ] || fail ".env wasn't restored"
api -H "Authorization: Bearer $token" "$base/api/margins/get_margins" \
	| jq -e --argjson id "$margin_id" 'any(.[]; .marginId == $id and .marginName == "Backup smoke")' >/dev/null \
	|| fail "the old session doesn't see the seeded margin"
[ "$(api -H "Authorization: Bearer $token" "$base$file_path" | sha)" = "$uploaded_sha" ] \
	|| fail "the uploaded file didn't come back intact"
api -H 'Content-Type: application/json' -d "$(jq -n --arg t "$refresh_token" '{refreshToken: $t}')" \
	"$base/api/auth/refresh" | jq -e '.success and (.token | length > 0)' >/dev/null \
	|| fail "the old refresh token was rejected"
login | jq -e '.success' >/dev/null || fail "the admin can't sign in with their password"

step "Backup smoke test passed"
