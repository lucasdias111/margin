#!/bin/sh
# Installs a margin instance on this host:
#
#   curl -fsSL https://github.com/lucasdias111/margin/releases/latest/download/install.sh | sh
#
# Every prompt can be answered up front with a flag or environment variable
# (see --help), which makes the install non-interactive. The script never
# touches the firewall, refuses to overwrite an existing install, and doesn't
# upgrade: for that, change MARGIN_VERSION in .env and run
# `docker compose pull && docker compose up -d`.
set -eu

# Stamped by the release workflow, so the script installs its own release.
VERSION="__MARGIN_VERSION__"
REPO="lucasdias111/margin"

usage() {
	cat <<EOF
Usage: install.sh [options]

  --dir DIR               install directory (default /opt/margin)
  --domain NAME           domain users reach the instance at     [DOMAIN]
  --public-ip IP          the host's public IPv4 address          [PUBLIC_IP]
  --admin-email EMAIL     seed the first admin                    [MARGIN_ADMIN_EMAIL]
  --admin-password PASS                                           [MARGIN_ADMIN_PASSWORD]
  --smtp-host HOST        optional mail server                    [SMTP_HOST]
  --smtp-port PORT        (default 587)                           [SMTP_PORT]
  --smtp-username USER                                            [SMTP_USERNAME]
  --smtp-password PASS                                            [SMTP_PASSWORD]
  --smtp-from ADDRESS     (default noreply@DOMAIN)                [SMTP_FROM]
  --yes                   don't prompt; use flags, env and defaults
  --version X.Y.Z         install another release than this script's
EOF
}

say() { printf '%s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

INSTALL_DIR="${MARGIN_DIR:-/opt/margin}"
DOMAIN="${DOMAIN:-}"
PUBLIC_IP="${PUBLIC_IP:-}"
ADMIN_EMAIL="${MARGIN_ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${MARGIN_ADMIN_PASSWORD:-}"
SMTP_HOST="${SMTP_HOST:-}"
SMTP_PORT="${SMTP_PORT:-}"
SMTP_USERNAME="${SMTP_USERNAME:-}"
SMTP_PASSWORD="${SMTP_PASSWORD:-}"
SMTP_FROM="${SMTP_FROM:-}"
ASSUME_YES=false
# Where the release's bundle files are fetched from; overridable for testing
# (curl also reads file:// URLs).
BUNDLE_URL="${MARGIN_BUNDLE_URL:-}"

need_arg() { [ $# -ge 2 ] || die "$1 needs a value"; }
while [ $# -gt 0 ]; do
	case "$1" in
	--dir) need_arg "$@"; INSTALL_DIR="$2"; shift ;;
	--domain) need_arg "$@"; DOMAIN="$2"; shift ;;
	--public-ip) need_arg "$@"; PUBLIC_IP="$2"; shift ;;
	--admin-email) need_arg "$@"; ADMIN_EMAIL="$2"; shift ;;
	--admin-password) need_arg "$@"; ADMIN_PASSWORD="$2"; shift ;;
	--smtp-host) need_arg "$@"; SMTP_HOST="$2"; shift ;;
	--smtp-port) need_arg "$@"; SMTP_PORT="$2"; shift ;;
	--smtp-username) need_arg "$@"; SMTP_USERNAME="$2"; shift ;;
	--smtp-password) need_arg "$@"; SMTP_PASSWORD="$2"; shift ;;
	--smtp-from) need_arg "$@"; SMTP_FROM="$2"; shift ;;
	--version) need_arg "$@"; VERSION="${2#v}"; shift ;;
	--yes|-y) ASSUME_YES=true ;;
	--help|-h) usage; exit 0 ;;
	*) usage >&2; die "unknown option: $1" ;;
	esac
	shift
done

case "$VERSION" in
__*) die "this copy of install.sh isn't from a release; pass --version X.Y.Z" ;;
esac
[ -n "$BUNDLE_URL" ] || BUNDLE_URL="https://github.com/$REPO/releases/download/v$VERSION"

# ── Prompts ─────────────────────────────────────────────────
# The script itself arrives on stdin, so prompts read the terminal directly.
interactive=false
if [ "$ASSUME_YES" = false ] && (: </dev/tty) 2>/dev/null; then
	interactive=true
fi

# ask VAR "Question" [default]
ask() {
	eval "current=\${$1}"
	[ -n "$current" ] && return 0
	[ "$interactive" = true ] || { eval "$1=\${3:-}"; return 0; }
	if [ -n "${3:-}" ]; then
		printf '%s [%s]: ' "$2" "$3" >/dev/tty
	else
		printf '%s: ' "$2" >/dev/tty
	fi
	read -r answer </dev/tty || answer=""
	eval "$1=\${answer:-\${3:-}}"
}

ask_secret() {
	eval "current=\${$1}"
	[ -n "$current" ] && return 0
	[ "$interactive" = true ] || return 0
	printf '%s: ' "$2" >/dev/tty
	stty -echo </dev/tty 2>/dev/null || true
	read -r answer </dev/tty || answer=""
	stty echo </dev/tty 2>/dev/null || true
	printf '\n' >/dev/tty
	eval "$1=\$answer"
}

ask_yes_no() {
	[ "$interactive" = true ] || return 1
	printf '%s [y/N]: ' "$1" >/dev/tty
	read -r answer </dev/tty || answer=""
	case "$answer" in [yY]*) return 0 ;; *) return 1 ;; esac
}

is_private_ip() {
	case "$1" in
	10.*|127.*|192.168.*|169.254.*|172.1[6-9].*|172.2[0-9].*|172.3[01].*|100.6[4-9].*|100.[7-9][0-9].*|100.1[01][0-9].*|100.12[0-7].*) return 0 ;;
	*) return 1 ;;
	esac
}

is_ipv4() {
	printf '%s' "$1" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}$'
}

# The address this host routes out of, or, behind NAT, what the internet sees.
suggest_public_ip() {
	ip=""
	if command -v ip >/dev/null 2>&1; then
		ip="$(ip -4 route get 1.1.1.1 2>/dev/null | sed -n 's/.* src \([0-9.]*\).*/\1/p' | head -n 1)"
	fi
	if [ -z "$ip" ] || is_private_ip "$ip"; then
		ip="$(curl -4 -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"
	fi
	is_ipv4 "$ip" && printf '%s' "$ip"
}

# ── Checks ──────────────────────────────────────────────────
say "Installing margin $VERSION into $INSTALL_DIR"

command -v curl >/dev/null 2>&1 || die "curl is required"
command -v docker >/dev/null 2>&1 || die "Docker is required: https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || die "the Docker Compose plugin is required (docker compose): https://docs.docker.com/compose/install/linux/"
docker info >/dev/null 2>&1 || die "can't reach the Docker daemon; is it running, and may this user use it? (try sudo)"

if [ -e "$INSTALL_DIR/.env" ] || [ -e "$INSTALL_DIR/compose.yml" ]; then
	die "$INSTALL_DIR already holds an install. This script doesn't upgrade or reinstall; see the upgrade docs, or remove that install first."
fi

ask DOMAIN "Domain for this instance (e.g. chat.example.com)"
DOMAIN="$(printf '%s' "$DOMAIN" | tr 'A-Z' 'a-z')"
printf '%s' "$DOMAIN" | grep -Eq '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$' \
	|| die "DOMAIN must be a domain name like chat.example.com, got '$DOMAIN'"

ask PUBLIC_IP "Public IPv4 address of this host" "$(suggest_public_ip || true)"
is_ipv4 "$PUBLIC_IP" || die "PUBLIC_IP must be an IPv4 address, got '$PUBLIC_IP'"
if is_private_ip "$PUBLIC_IP"; then
	say "warning: $PUBLIC_IP is a private address; calls from outside this network won't connect."
fi

resolved="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR == 1 { print $1 }' || true)"
if [ -z "$resolved" ]; then
	say "warning: $DOMAIN doesn't resolve yet. Point its A record at $PUBLIC_IP; HTTPS certificates are issued once it does."
elif [ "$resolved" != "$PUBLIC_IP" ]; then
	say "warning: $DOMAIN resolves to $resolved, not $PUBLIC_IP."
fi

if [ -z "$ADMIN_EMAIL" ] && [ "$interactive" = true ]; then
	say ""
	say "You can create the first admin now, or later from a one-time setup link."
	if ask_yes_no "Create the admin account now?"; then
		ask ADMIN_EMAIL "Admin email"
		ask_secret ADMIN_PASSWORD "Admin password"
	fi
fi
if [ -n "$ADMIN_EMAIL" ] && [ -z "$ADMIN_PASSWORD" ]; then
	die "an admin email needs a password too"
fi

if [ -z "$SMTP_HOST" ] && [ "$interactive" = true ]; then
	say ""
	say "Mail is optional. Without it, admins hand out password-reset links themselves."
	if ask_yes_no "Configure an SMTP server now?"; then
		ask SMTP_HOST "SMTP host"
	fi
fi
if [ -n "$SMTP_HOST" ]; then
	ask SMTP_PORT "SMTP port" "587"
	ask SMTP_USERNAME "SMTP username"
	ask_secret SMTP_PASSWORD "SMTP password"
	ask SMTP_FROM "Send mail from" "noreply@$DOMAIN"
fi

# .env values are written single-quoted (literal), which can't hold a quote.
for value in "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$SMTP_HOST" "$SMTP_PORT" "$SMTP_USERNAME" "$SMTP_PASSWORD" "$SMTP_FROM"; do
	case "$value" in
	*"'"*) die "values can't contain a single quote (')" ;;
	esac
done

# ── Files ───────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR" 2>/dev/null || die "can't create $INSTALL_DIR; run as root (curl ... | sudo sh) or pass --dir"
mkdir -p "$INSTALL_DIR/coturn" "$INSTALL_DIR/secrets"
mkdir -m 700 -p "$INSTALL_DIR/backups"
cd "$INSTALL_DIR"

fetch() {
	curl -fsSL "$BUNDLE_URL/$1" -o "$2" || die "couldn't download $BUNDLE_URL/$1"
}
fetch compose.yml compose.yml
fetch turnserver.conf.template coturn/turnserver.conf.template
fetch backup.sh backup.sh
fetch restore.sh restore.sh
chmod 755 backup.sh restore.sh

secret() {
	od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
}

quoted() {
	printf "'%s'" "$1"
}

umask 077
{
	say "# Written by install.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ). See .env.example in the"
	say "# repository for every setting. Back this file up: it holds the instance's secrets."
	say "DOMAIN=$DOMAIN"
	say "PUBLIC_IP=$PUBLIC_IP"
	say "MARGIN_VERSION=$VERSION"
	say ""
	say "POSTGRES_PASSWORD=$(secret)"
	say "JWT_SECRET=$(secret)"
	say "MEETING_GUEST_TOKEN_SECRET=$(secret)"
	say "SFU_SECRET=$(secret)"
	say "INTERNAL_API_KEY=$(secret)"
	say "TURN_SECRET=$(secret)"
	if [ -n "$ADMIN_EMAIL" ]; then
		say ""
		say "MARGIN_ADMIN_EMAIL=$(quoted "$ADMIN_EMAIL")"
		say "MARGIN_ADMIN_PASSWORD=$(quoted "$ADMIN_PASSWORD")"
	fi
	if [ -n "$SMTP_HOST" ]; then
		say ""
		say "SMTP_HOST=$(quoted "$SMTP_HOST")"
		say "SMTP_PORT=$(quoted "$SMTP_PORT")"
		say "SMTP_USERNAME=$(quoted "$SMTP_USERNAME")"
		say "SMTP_PASSWORD=$(quoted "$SMTP_PASSWORD")"
		say "SMTP_FROM=$(quoted "$SMTP_FROM")"
	fi
} >.env
umask 022

# ── Start ───────────────────────────────────────────────────
say ""
say "Starting margin (the first pull takes a few minutes)..."
docker compose up -d --quiet-pull \
	|| die "the stack didn't start; fix the error above, then run \`docker compose up -d\` in $INSTALL_DIR"

say "Waiting for the server to come up..."
tries=0
until docker compose exec -T margin-server bash -c \
	"exec 3<>/dev/tcp/127.0.0.1/9090 && printf 'GET /actuator/health HTTP/1.0\r\n\r\n' >&3 && grep -q '\"UP\"' <&3" \
	>/dev/null 2>&1; do
	tries=$((tries + 1))
	[ "$tries" -lt 60 ] || die "the server didn't become healthy; check \`docker compose logs margin-server\` in $INSTALL_DIR"
	sleep 5
done

say ""
say "margin $VERSION is running in $INSTALL_DIR."
say ""
if [ -n "$ADMIN_EMAIL" ]; then
	say "Sign in at https://$DOMAIN as $ADMIN_EMAIL."
	say "You can remove MARGIN_ADMIN_PASSWORD from .env now; it's only used once."
else
	link="$(docker compose exec -T margin-server margin setup-link 2>/dev/null || true)"
	if [ -n "$link" ]; then
		say "Create the first admin account here (the link works once):"
		say ""
		say "  $link"
	else
		say "Print the one-time admin setup link with:"
		say "  cd $INSTALL_DIR && docker compose exec margin-server margin setup-link"
	fi
fi
say ""
say "Open these ports in your firewall if they aren't already:"
say "  80/tcp, 443/tcp              web (and HTTPS certificates)"
say "  40000/udp, 40000/tcp         calls (SFU)"
say "  3478/udp, 3478/tcp           TURN/STUN"
say "  49160-49200/udp              TURN relay"
say ""
say "Back up with ./backup.sh. Upgrade by changing MARGIN_VERSION in .env, then"
say "  docker compose pull && docker compose up -d"
