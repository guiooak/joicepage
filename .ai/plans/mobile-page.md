# Mobile page — a second deployable site

Companion to [`joice-landing-page.md`](joice-landing-page.md), which stays the
architecture and decision record for the desktop build, and to
[`remaining-work.md`](remaining-work.md), which tracks what is left on it.
This file is the plan for the mobile page, written against `main` at `317fd43`.

## Context

`poc/rawhtml/` is a finished, desktop-only landing page: a fixed 1440 canvas,
hand-authored HTML and modern CSS, zero dependencies and zero build step,
published to <https://guiooak.github.io/joicepage/> on every push to `main`.

The Figma file also holds a complete, separately-designed mobile layout —
`MOBILE 360px` (`392:8099`), 360 × 11477.67, fourteen sections. It is **not a
responsive variant of the desktop page**: the structure differs (hamburger nav,
horizontal rails, a carousel) and so does the copy in at least five places.
A responsive layer was attempted earlier in this repo and reverted in `d750c35`
precisely because it fought the desktop build.

So this is a second page, built the same way, living beside the first as a
sibling `poc/` folder — which is what `poc/` is for: "one folder per build
approach — siblings, independently runnable".

Outcome: two hand-authored pages, two public URLs, both redeployed on every
push to `main`, both linked from the README.

## Decisions taken

- **Second URL**: a subpath of the same Pages site. GitHub Pages allows one
  site per repo, so one workflow uploads a single artifact with the mobile
  build nested: `/joicepage/` and `/joicepage/mobile/`.
- **Design source**: the Figma file over MCP — `kj4nWRhUjFSFcTXPS1v7dQ`, frame
  `MOBILE 360px` (`392:8099`). This replaces a `.fig` re-export as the primary
  source: the export and `canvas.json` are both gone from the build machine,
  and MCP resolves instances, which the `.fig` decoder cannot. See the call
  budget below, which is the one real risk.
- **Viewport**: hold the drawn 360 canvas and scale it, the same technique
  `poc/rawhtml/styles/base.css` uses at 1440 — every drawn proportion survives
  at any width.
- **Assets**: duplicated into the mobile folder, not shared. Preserves the
  invariant that each `poc/` folder is independently runnable and deployable on
  its own. Costs ~1.3 MB of duplication; the alternative (assembling shared
  assets at deploy time) trades that for a folder that no longer runs from
  `python3 -m http.server`.

## Nothing blocking — but there is a call budget

Three sources, used in this order, cheapest first:

1. **`tools/figextract/figma-mcp-layouts-tree.xml`**, already committed. Holds
   the entire `MOBILE 360px` subtree: every node's id, name, position, size
   and `hidden` flag. Text nodes carry their copy in the `name` attribute, so
   most of the wording is already in hand, free. This is the backbone.
2. **`poc/rawhtml/styles/tokens.css`**, already exact. Both layouts read the
   same Figma variables, so colour, family and weight transfer directly.
3. **`get_design_context` on the Figma file**, for what only it can give:
   per-section typography, fills, radii and auto-layout gaps, plus the
   instance contents the `.fig` decoder cannot expand (FAQ answers,
   testimonials, buttons).

Budget: roughly **one call per section, ~14 total**, taken section by section
immediately before building that section, so a call is never spent on work that
gets cut. `excludeScreenshot: true` keeps each response small.

If the quota runs out partway, the fallback is a fresh `.fig` export
(File → Export as .fig), after which `figextract` regenerates the rest offline
with no quota at all. Say so the moment it happens rather than quietly
inferring the remaining sections.

## Phase 0 — Record the plan in the repo

This file, committed and pushed to `main` before any build work.

It stays a living document from here on, the way `remaining-work.md` already
is — decisions that change during the build get amended here rather than lost
in the commit log.

## Phase 1 — Tooling and scaffold

**`tools/figextract/extract.py`** — two changes, both of which the desktop work
already wanted, so the `.fig` fallback is ready before it is needed:

- Take the root frame as an argument instead of the hardcoded
  `ROOT = ... "Site desktop"`, so it can dump `MOBILE 360px`.
- Emit node visibility. This is a known gap logged in `remaining-work.md` and
  it matters more on mobile: the mobile frame draws `Menu-links`, the desktop
  `Button`, an `Ellipse` and a whole footer column as `hidden="true"`. Without
  it the dump describes a page nobody sees.

**Scaffold `poc/htmlonly-mobile/`** mirroring `poc/rawhtml/`:

```
index.html
styles/tokens.css base.css sections.css motion.css
scripts/motion.js
assets/fonts/   (3 woff2, copied)
assets/img/     (copied; re-crop only where the mobile frame differs)
favicon.svg favicon.png apple-touch-icon.png
README.md
```

`tokens.css` starts as a copy of the desktop's — the two layouts read the same
Figma variables — with mobile overrides added as the design context reveals
them. The designer left a note in the file (`413:20597`) that at least one
mobile size is deliberately off-token: 48px reduced to 40px.

## Phase 2 — Build the fourteen sections

Drawn backbone, from the node tree. Section tops are the verification target:

| section | node | box | top |
|---|---|---|---|
| Menu | 392:8100 | 328×88 | 16 |
| hero (`content`) | 392:8110 | 328×724 | 120 |
| LOGOS | 392:8126 | 720×228 | 860 |
| VISAO | 392:8140 | 328×1092 | 1104 |
| SERVICOS | 392:8176 | 328×1226 | 2212 |
| PROCESSO | 392:8219 | 328×868 | 3454 |
| Processo extras | 393:9244 | 328×360 | 4338 |
| CTA (`paragrafo`) | 392:8237 | 328×641 | 4714 |
| big-numbers | 392:8298 | 328×622 | 5371 |
| HISTORIAS | 392:8248 | 328×1346.67 | 6009 |
| SOBRE | 392:8308 | 328×1733 | 7371.67 |
| LOGOS | 392:8370 | 720×228 | 9120.67 |
| faq | 392:8384 | 328×1476 | 9364.67 |
| footer | 392:8392 | 328×605 | 10856.67 |

Page frame 360 wide, `padX` 16, so every section is 328 — except the two LOGOS
rails at 720, which overflow deliberately.

Five structures have no desktop counterpart and carry the risk:

1. **Hamburger nav.** `Menu-links` (392:8102) and the header `Button`
   (392:8103) are hidden; a `List` icon (392:8108) is visible in a 56×56 tap
   target. Needs a drawer. Build it as a native `<details>`/`popover` so it
   works without JS, the same contract `poc/rawhtml` holds.
2. **Credenciais rail.** A 720-wide frame in a 360 page — a horizontally
   scrolling rail, twice.
3. **Princípios rail.** `Card` (392:8154) is 1120 wide inside a 328 mask.
4. **Serviços carousel.** `Card-open` 329.5 wide with four detached state
   frames beside the page (393:8822, 393:8939, 393:9046, 393:9153) — one per
   active card, which is how the per-card copy is recovered.
5. **Stacked FAQ / testimonials.** `FAQ` (392:8391) is a 328×1100 instance;
   its answers live in seven detached state frames (393:10613 … 393:11202).
   Testimonials likewise: 393:10521 and 393:10569.

**The copy is not the desktop's.** Confirmed differences already visible in the
node tree — the Visão headline ("Patrimônio vai muito além da conta bancária"),
the Serviços intro, the Serviços list labels (shortened), the two Processo
blocks in 393:9244, and the hero lead. Take every string from the mobile frame.

Commit per section, as the desktop build did.

## Phase 3 — Publish both

**`.github/workflows/deploy.yml`** — currently single-site, keyed on
`env.SITE_DIR: poc/rawhtml` across three steps. Restructure to:

- Assemble one artifact: `poc/rawhtml/` at the root, `poc/htmlonly-mobile/`
  into `mobile/`.
- Run the existing integrity guards (required-file manifest, relative-asset
  existence, CSS comment balance) over **both** directories. These guards
  caught a real silently-swallowed rule during the desktop build; they are
  worth extending, not bypassing.
- Run the review-app neutralisation over both `index.html` files: `noindex`,
  production URLs rewritten to the deployment, `sitemap.xml` dropped. The
  mobile canonical must resolve to `<base>/mobile/`, self-referential, for the
  reason spelled out in the README — a cross-domain canonical on a `noindex`
  page can attribute the `noindex` to the real site.
- Extend the post-deploy smoke test to fetch both URLs and grep each for copy
  that must be in the HTML rather than waiting on JS.

Two things not to trip over:

- **No `robots.txt` in the mobile folder.** It is only honoured at the origin
  root, so `/joicepage/mobile/robots.txt` would be dead weight that reads as
  policy. The root one already covers the whole site.
- **Pushing workflow changes needs a token with `workflow` scope.** This repo's
  `gh` login lacks it — use SSH for that push or `gh auth refresh -s workflow`.

**Duplicate content**, worth deciding now rather than at cutover: two URLs
serving the same content compete. Harmless while both are `noindex` review
apps, but at production the pair wants the standard mobile/desktop annotation —
desktop `rel="alternate" media="only screen and (max-width: 640px)"` → mobile,
mobile `rel="canonical"` → desktop. Wire both now so the cutover is a DNS
change, not an SEO project.

**`README.md`** — add the mobile URL beside the review-app URL, add
`poc/htmlonly-mobile/` to the repository layout, and document the two-into-one
artifact. While in there, two claims are now false and should go: "FAQ copy
does not exist in the Figma file" (it exists, in per-instance overrides — the
whole FAQ is built) and the related "11 spots" `A capturar` count (zero remain).

## Verification

- **Geometry.** Reuse the headless-Chrome harness built for the desktop review:
  measure every section's top and height at 360 and compare against the drawn
  table above, which comes straight from the committed node tree. Desktop holds
  ±1px on most sections; hold the mobile build to the same bar, and put the
  measurements in each commit message as the desktop build did.
- **Scaling.** Measure at 360, 390 and 430 wide. Section tops must be identical
  multiples of the zoom factor, and there must be **no horizontal scrollbar** —
  the desktop page hit exactly this bug and the fix was `cqw`, not `vw`,
  because `vw` includes the classic scrollbar gutter.
- **No-JS.** Load with JavaScript disabled. Every section, every FAQ answer,
  every testimonial and the nav must still be reachable. This is a hard
  constraint carried over from `poc/rawhtml`, not a nicety.
- **Both sites deploy.** After the workflow change, confirm the run uploads one
  artifact, both URLs return 200, and the smoke test greps pass on each.
- **Desktop untouched.** Re-run the section-offset comparison against
  `poc/rawhtml` and confirm zero delta — the workflow restructure must not
  change what the desktop site serves.

## What actually happened

Amended after the build, as this file promised it would be.

**The call budget was not the risk.** The plan assumed ~6 calls a month and
budgeted 14 against it. The file had already been duplicated into a Pro team
(200/day, noted at the end of `remaining-work.md`), so the constraint was
never real. Seventeen calls went in, and the last five were cheap because
`get_design_context` accepts an instance-scoped id — `I393:10915;115:2522`
returns one FAQ block rather than all eight. Use that form when chasing a
single override; it is roughly a tenth of the response.

Two calls were wasted and are worth naming: `get_design_context` on a
**section** node returns sparse metadata and tells you to call its children
individually, so `393:10516` bought nothing the committed tree did not
already have.

**The `.fig` fallback was never needed**, but the two `extract.py` changes
shipped anyway, so it is ready.

**Type had to be measured, not read.** Sizes came from rendering each string
at the drawn measure in headless Chrome and comparing against the drawn box —
that is what settled 32/32 for four of the five section headlines, 48/48 for
Sobre, 24/29 for the testimonial and Lora 72 for both numerals.

**Figma rounds line height to the nearest whole pixel, and it compounds.**
This was the one systemic bug. Expressed as ratios, 56/0.92 renders 51.52
against Figma's 52 and 24/1.2 renders 28.8 against Figma's 29 — a pixel and a
half per H1 block and a fifth of a pixel per accordion row, which walks every
section below it up the page. `tokens.css` therefore holds px leading wherever
the frame gives a whole number, and the whole page lands within 0.34px.

**One answer is not from the mobile frame.** FAQ question 2's override
duplicates question 1's answer in the only state that draws it open. The
desktop's answer is in its place, marked in the markup and logged as item 12
in `remaining-work.md`.

**`tools/measure/measure.mjs`** is the harness the plan assumed already
existed. It did not, so it was written: no dependencies, drives Chrome over
the DevTools protocol, and divides every offset back through the page's own
zoom so one table compares across widths.

## Out of scope

Unrelated items already logged in `remaining-work.md` stay there: the two
policy pages, confirming the WhatsApp number, and the TikTok/YouTube handles.
(`assets/img/og.jpg` was on this list and has since been created — see
`remaining-work.md` §6.)
