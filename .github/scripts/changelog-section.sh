#!/bin/sh
# Prints one release's section of the root CHANGELOG.md, for the release notes:
#
#   .github/scripts/changelog-section.sh 1.0.0 [CHANGELOG.md]
#
# Sections are headed `## [X.Y.Z] - YYYY-MM-DD` and end at the next `## `
# heading. Fails when the version has no section, or the section is empty.
set -eu

version="${1:?usage: $0 X.Y.Z [CHANGELOG.md]}"
changelog="${2:-CHANGELOG.md}"

[ -f "$changelog" ] || { echo "error: $changelog not found" >&2; exit 1; }

# Body lines of the matching section, with leading and trailing blank lines
# trimmed. The heading may also be written `## X.Y.Z` or `## vX.Y.Z`.
section="$(awk -v v="$version" '
	/^## / {
		h = $0
		sub(/^## +\[?v?/, "", h)
		p = (index(h, v) == 1 && substr(h, length(v) + 1) ~ /^($|[] ])/)
		next
	}
	p
' "$changelog" | awk '
	NF { started = 1; for (; blank > 0; blank--) print ""; print; next }
	started { blank++ }
')"

if [ -z "$section" ]; then
	echo "error: $changelog has no section for $version (expected a heading like '## [$version] - YYYY-MM-DD')" >&2
	exit 1
fi
printf '%s\n' "$section"
