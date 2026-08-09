# Joice Sperandio — Landing Page

Single-page landing site for Joice Sperandio, financial planner.

## Repository layout

```
.ai/plans/          architecture plan and decision record
poc/                one folder per build approach — siblings, independently runnable
  rawhtml/          zero-dependency: hand-authored HTML + modern CSS  <- current
```

`poc/` exists so alternative build approaches can be evaluated side by side
against the same design. Each folder is self-contained and deployable on its
own; none of them depend on anything at the repo root.

## Why `rawhtml` first

Two constraints drove the approach, both recorded in
[`.ai/plans/joice-landing-page.md`](.ai/plans/joice-landing-page.md):

1. **Longevity.** Toolchains rot; the web platform does not. HTML and CSS from a
   decade ago still render, while a Node build from a few years back often won't
   install on a current runtime. A page expected to live for years with
   infrequent edits should not depend on a build step that can break while
   nobody is looking.
2. **SEO.** Organic search is a primary acquisition channel. Hand-authored
   static HTML puts every word of content in the initial response, with nothing
   waiting on JavaScript.

The design system lives in Figma
(`35gFTPRFgD9FZ0pwIxO3GL`) and has real token layers, so the CSS mirrors that
structure rather than inventing its own.

## Running it

No install, no build:

```sh
cd poc/rawhtml && python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Status

All thirteen sections are built. `styles/tokens.css` now holds **exact** values
pulled from the Figma variables, cross-checked against the decoded `.fig`
export — the earlier provisional/sampled tokens are gone, and so is the note
here that said Figma access was pending. It isn't.

**Images are all real.** Every asset is exported from the `.fig` and committed
under `assets/img/` (1.2 MB total). There are no placeholders left — the Figma
MCP plan ran out of tool calls partway through, so the images came from the
`.fig` route instead, which needs no subscription and no quota. That route is
the reason it kept working; keep it.

One thing is genuinely outstanding, and it is a **writing** task, not an
extraction one:

- **FAQ copy does not exist in the Figma file.** Checked rather than assumed:
  `SYMBOL FAQ` (115:2224) and every one of its instances contain zero text
  nodes. The eight cards are drawn empty. Three of the six Processo accordion
  panels are likewise unwritten. `grep -n "A capturar" index.html` — 11 spots.
  This copy has to come from Joice.

Worth knowing: the `Site desktop` frame is **stale in one place**. It draws
service card 02 with card 01's list duplicated. The intended copy exists
elsewhere in the same file (the detached `Card` 392:8746 and `MOBILE 360px`)
and is what the build uses. If you re-derive anything from `Site desktop`,
check it against those two.

**Fonts, split two ways.** **Lora is done** — it is open (SIL OFL), so it is
self-hosted and committed in `assets/fonts/` as latin + latin-ext woff2 (33 KB
together). It sets every numeral on the page. **Allomira and TP Sans cannot
arrive from Figma at all**: `download_assets` returns renders, bitmaps and
vector SVGs, and the `.fig` stores font *names*, not binaries. They have to be
licensed. Until then `styles/base.css` carries a measured metric-override
fallback; the calibration and its limits are documented in that file.

There is now one small script, `scripts/motion.js`, implementing the designer's
interaction spec. The page is complete and readable without it — that is a
hard constraint, not a nicety, and it is worth re-checking with JS disabled
after any change.
