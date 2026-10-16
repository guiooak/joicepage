#!/usr/bin/env bash
# Check, assemble and (unless production) neutralise aconsultorafinanceira.
#
#   bash aconsultorafinanceira/build.sh <out-dir> <base-url> [production]
#
#   mobile/  →  <out-dir>/          the 360 page
#   web/     →  <out-dir>/inicio/   the 1440 page
#
# Called by .github/workflows/deploy.yml, which publishes this app inside the
# joicepage GitHub Pages site at /aconsultorafinanceira/. Runs the same way
# locally. Perl rather than `sed -i` for the rewrites, so the script behaves
# the same on macOS and on the Ubuntu runner.
#
# A REVIEW APP unless the third argument is "production":
# aconsultorafinanceira.com.br is still the old WordPress site, so the copy
# gets noindex with crawling left open, every production URL rewritten to
# <base-url> so the canonical is self-referential, and no sitemap — the
# reasoning is joicepage's, in .github/actions/site-build/action.yml.
set -euo pipefail

out="${1:?usage: build.sh <out-dir> <base-url> [production]}"
base="${2:?usage: build.sh <out-dir> <base-url> [production]}"
base="${base%/}"
production="${3:-}"
src="$(cd "$(dirname "$0")" && pwd)"

# ---- 1 · Check both folders ------------------------------------------------
common="index.html favicon.svg favicon.png apple-touch-icon.png
        styles/tokens.css styles/base.css styles/sections.css
        styles/motion.css scripts/motion.js
        assets/fonts/allomira-variable.woff2
        assets/fonts/lora-latin.woff2"

rc=0
check_dir() {
  local dir="$1" extra="$2" bad=0
  ( cd "$src/$dir"
    for f in $common $extra; do
      [ -f "$f" ] || { echo "::error::aconsultorafinanceira/$dir is missing $f"; bad=1; }
    done

    # Every relative asset the HTML references must exist.
    while read -r ref; do
      [ -e "$ref" ] || { echo "::error::aconsultorafinanceira/$dir/index.html references missing $ref"; bad=1; }
    done < <(grep -oE '(src|href)="[^":#]+"' index.html \
               | sed -E 's/^(src|href)="//; s/"$//' \
               | grep -vE '^(https?:|mailto:|//|/)' | sort -u)

    # And every asset reached from CSS.
    while read -r ref; do
      [ -n "$ref" ] || continue
      [ -e "styles/$ref" ] || { echo "::error::aconsultorafinanceira/$dir/styles references missing $ref"; bad=1; }
    done < <(grep -ohE 'url\("[^"]+"\)' styles/*.css \
               | sed -E 's/^url\("//; s/"\)$//' \
               | grep -vE '^(https?:|data:|//)' | sort -u)

    # An unbalanced comment silently swallows the next rule.
    for f in styles/*.css; do
      o=$(grep -o '/\*' "$f" | wc -l | tr -d ' ')
      c=$(grep -o '\*/' "$f" | wc -l | tr -d ' ')
      [ "$o" = "$c" ] || { echo "::error::aconsultorafinanceira/$dir/$f has $o '/*' against $c '*/'"; bad=1; }
    done
    [ "$bad" -eq 0 ]
  ) || rc=1
}

check_dir mobile "robots.txt sitemap.xml 404.html"
check_dir web ""
[ "$rc" -eq 0 ] || exit 1
echo "aconsultorafinanceira: both folders intact"

# ---- 2 · Assemble ------------------------------------------------------------
[ -e "$out" ] && { echo "::error::$out already exists — it would be overwritten"; exit 1; }
mkdir -p "$out/inicio"
cp -R "$src/mobile/." "$out/"
cp -R "$src/web/." "$out/inicio/"

[ "$production" = "production" ] && { echo "aconsultorafinanceira: production, files left as authored"; exit 0; }

# ---- 3 · Neutralise ----------------------------------------------------------
# Served from a subpath, robots.txt, the sitemap and the 404 page mean nothing:
# only the origin root's are ever read.
rm -f "$out/robots.txt" "$out/sitemap.xml" "$out/404.html"

neutralise() {
  local file="$1" self="$2"
  BASE="$base" SELF="$self" perl -0pi -e '
    s|</head>|  <meta name="robots" content="noindex, nofollow" />\n  </head>|;
    s|https://aconsultorafinanceira\.com\.br|$ENV{BASE}|g;
    s|rel="canonical" href="[^"]*"|rel="canonical" href="$ENV{SELF}"|;
    s|property="og:url" content="[^"]*"|property="og:url" content="$ENV{SELF}"|;
  ' "$file"

  # Assert the outcome rather than trusting the rewrite.
  grep -q 'name="robots" content="noindex' "$file" \
    || { echo "::error::$file: noindex meta missing"; exit 1; }
  if grep -q 'https://aconsultorafinanceira\.com\.br' "$file"; then
    echo "::error::$file: a production URL survived the rewrite"; exit 1
  fi
  grep -q "rel=\"canonical\" href=\"${self}\"" "$file" \
    || { echo "::error::$file: canonical is not ${self}"; exit 1; }
  grep -q 'oi@joicesperandio.com.br' "$file" \
    || { echo "::error::$file: the mailto address was clobbered"; exit 1; }
  echo "neutralised $file — noindex, canonical → ${self}"
}

neutralise "$out/index.html"        "${base}/"
neutralise "$out/inicio/index.html" "${base}/inicio/"
