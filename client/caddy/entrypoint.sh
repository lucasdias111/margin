#!/bin/sh
# Turns the instance's .env into the values the Caddyfile reads, then runs Caddy.
set -eu

if [ -z "${DOMAIN:-}" ]; then
	echo "margin-web: DOMAIN is required" >&2
	exit 1
fi

case "${BEHIND_PROXY:-false}" in
true)
	# Your own proxy terminates TLS and forwards plain HTTP here. Trust its
	# X-Forwarded-* headers when it connects from a private address.
	MARGIN_SITE_ADDRESS="http://:80"
	MARGIN_GLOBAL_OPTIONS="auto_https off"
	MARGIN_TRUSTED_PROXIES="trusted_proxies static private_ranges"
	;;
*)
	MARGIN_SITE_ADDRESS="$DOMAIN"
	MARGIN_GLOBAL_OPTIONS=""
	MARGIN_TRUSTED_PROXIES=""
	;;
esac

# MAX_UPLOAD_SIZE uses Spring's units, where 50MB means 50 MiB. Caddy reads
# MB as 10^6 bytes, so translate to the binary units it also understands.
size="${MAX_UPLOAD_SIZE:-50MB}"
case "$size" in
*[Kk][Bb]) MARGIN_MAX_BODY="${size%??}KiB" ;;
*[Mm][Bb]) MARGIN_MAX_BODY="${size%??}MiB" ;;
*[Gg][Bb]) MARGIN_MAX_BODY="${size%??}GiB" ;;
*[0-9]) MARGIN_MAX_BODY="$size" ;;
*)
	echo "margin-web: MAX_UPLOAD_SIZE must look like 50MB, got '$size'" >&2
	exit 1
	;;
esac

# Origins of a URL, plus a wildcard for virtual-hosted S3 buckets.
origin() {
	printf '%s\n' "$1" | sed -E 's#^(https?://[^/]+).*#\1#'
}

media=""
if [ -n "${GIFS_ENABLED:-}" ]; then
	media="$media https://static.klipy.com"
fi
if [ "${STORAGE_TYPE:-local}" = "s3" ]; then
	if [ -n "${S3_ENDPOINT:-}" ]; then
		endpoint="$(origin "$S3_ENDPOINT")"
		media="$media $endpoint $(printf '%s' "$endpoint" | sed -E 's#^(https?://)#\1*.#')"
	fi
	if [ -n "${S3_CDN_BASE_URL:-}" ]; then
		media="$media $(origin "$S3_CDN_BASE_URL")"
	fi
fi

MARGIN_CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:$media; media-src 'self' blob:$media; font-src 'self' data:; connect-src 'self' wss://$DOMAIN ws://$DOMAIN$media; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

export MARGIN_SITE_ADDRESS MARGIN_GLOBAL_OPTIONS MARGIN_TRUSTED_PROXIES MARGIN_MAX_BODY MARGIN_CSP

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
