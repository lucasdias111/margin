#!/bin/sh
# Stages the deploy bundle a `v*` release carries, flat, with install.sh
# stamped so it installs its own release:
#
#   .github/scripts/release-assets.sh 1.0.0 dist/
#
# install.sh fetches the other files from the same release by these names.
set -eu

version="${1:?usage: $0 X.Y.Z OUTDIR}"
out="${2:?usage: $0 X.Y.Z OUTDIR}"
deploy="$(cd "$(dirname "$0")/../../deploy" && pwd)"

printf '%s' "$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$' \
	|| { echo "error: '$version' isn't a version like 1.2.3" >&2; exit 1; }

mkdir -p "$out"
cp "$deploy/compose.yml" "$out/compose.yml"
cp "$deploy/coturn/turnserver.conf.template" "$out/turnserver.conf.template"
cp "$deploy/backup.sh" "$out/backup.sh"
cp "$deploy/restore.sh" "$out/restore.sh"

[ "$(grep -c '^VERSION="__MARGIN_VERSION__"$' "$deploy/install.sh")" = 1 ] \
	|| { echo "error: deploy/install.sh has no single VERSION=\"__MARGIN_VERSION__\" line to stamp" >&2; exit 1; }
sed "s/^VERSION=\"__MARGIN_VERSION__\"\$/VERSION=\"$version\"/" "$deploy/install.sh" >"$out/install.sh"
if grep -q '__MARGIN_VERSION__' "$out/install.sh"; then
	echo "error: install.sh still holds __MARGIN_VERSION__ after stamping" >&2
	exit 1
fi
chmod 755 "$out/install.sh" "$out/backup.sh" "$out/restore.sh"

ls -l "$out"
