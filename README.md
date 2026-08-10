# Joice Sperandio — Landing Page

Single-page landing site for Joice Sperandio, financial planner.

**Review app:** <https://guiooak.github.io/joicepage/> — redeployed on every
push to `main`.

That URL is for review only. It is served `noindex` and its canonical points at
itself, deliberately, so it cannot compete with the real domain — see
[Deploying](#deploying). The production home will be
`joicesperandio.com.br`, which today still serves a different site.

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

Then open <http://localhost:8000>. Use the server rather than opening
`index.html` directly — browsers treat `file://` fonts as cross-origin and
block them, so the type would silently fall back.

## Deploying

`.github/workflows/deploy.yml` publishes `poc/rawhtml/` to
<https://guiooak.github.io/joicepage/> on every push to `main`, plus a manual
`workflow_dispatch` for redeploying the current `main` without an empty
commit. Only that folder is uploaded, so the plan docs and the `.fig` tooling
never reach the public site.

Pages had to be enabled once by hand. `configure-pages` is set to
`enablement: true`, but the workflow's `GITHUB_TOKEN` can deploy to Pages
without being able to create the site, so the first run failed with
`Resource not accessible by integration`. The fix, needed only once per repo:

```sh
gh api -X POST repos/guiooak/joicepage/pages -f build_type=workflow
```

There is still no build step: the artifact is the source directory copied
verbatim. Delete the workflow and the page is unchanged and still deployable
by hand.

Two guards, because this is outward facing. Before upload, the run fails if an
expected file is missing or if `index.html` references a relative asset that
does not exist. After deploy, it fetches the live URL and greps for copy that
has to be in the HTML rather than waiting on JS.

### The github.io deployment is a review app

It is **not** production and must not compete with `joicesperandio.com.br`,
which is a live site on other hosting. The deploy neutralises the artifact
three ways. The reasoning matters more than the code, so it is spelled out:

1. **`noindex`, with crawling left open.** The instinct is to add a
   disallow-all `robots.txt`; that is counterproductive. Google cannot read a
   `noindex` it is not allowed to fetch, and a blocked URL can still be
   indexed URL-only from links. To keep a page out of the index you let it be
   crawled and serve `noindex`.
2. **Production URLs rewritten to the deployment URL.** The page is authored
   with `canonical → joicesperandio.com.br`. Serving that here would put a
   cross-domain canonical on a `noindex` page — a combination Google warns
   against, because the `noindex` can end up attributed to the canonical
   target, which is the real site. Rewriting makes the canonical
   self-referential, which is safe next to `noindex`, and keeps `og:url` and
   the JSON-LD `@id`s consistent. The `mailto:` address is deliberately not
   rewritten, and there is an assertion for that.
3. **`sitemap.xml` dropped.** It lists the production URL, and a review app
   should not advertise a sitemap at all.

Every one of those is asserted after the fact, so a silent `sed` failure fails
the run instead of publishing something that leaks.

Gated on a `CNAME` file. To go live for real: add `poc/rawhtml/CNAME` with the
domain, point DNS at Pages, and the step no-ops — the deployment is then
production and the authored canonical, `robots.txt` and `sitemap.xml` are
already correct.

Two habits that matter more than the config: **don't verify the review app in
Search Console**, and **don't link to it from anywhere public** — inbound
links are how Google finds a URL in the first place.

### Before the real cutover

- **`assets/img/og.jpg` does not exist**, so `og:image` 404s and link previews
  (WhatsApp, LinkedIn) will render without an image. Pre-existing, unrelated to
  hosting, but it is on the verification list and should be fixed before the
  domain switch.
- The footer links `/politica-de-cookies` and `/politica-de-privacidade` are
  site-absolute — correct for a root domain, but they resolve outside the
  project path on `guiooak.github.io/joicepage/`. Neither page exists yet.
- The domain currently serves a **different site**. Replacing it means its
  existing URLs start 404ing, so plan redirects for anything already indexed.
- Pushing changes to `.github/workflows/` needs a token with the `workflow`
  scope. The `gh` login here does not have it, so use SSH for those pushes or
  run `gh auth refresh -s workflow`.

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

**Fonts are done.** Both families are real, self-hosted and committed in
`assets/fonts/` (64 KB total) — no CDN, no metric-override fallback left.

- **Allomira** — the licensed commercial face. One variable woff2 covers the
  whole range the design uses (Regular 400, Medium 500, Bold 700, Black 900) in
  26 KB, against 64 KB for the four statics. Verified before choosing:
  instancing the variable font at each weight matches the corresponding static
  to within 0.1% advance width, exact at 400 and 900.
- **Lora** — open (SIL OFL), latin + latin-ext subsets. Sets every numeral.

Neither could come from Figma: `download_assets` returns renders, bitmaps and
vector SVGs, and the `.fig` stores font *names*, not binaries. They were
supplied separately.

With the real face in, every text block lands on its drawn geometry: the hero
headline is 4 lines in its 577px column, the hero caption box is 86px against a
drawn 87, the CTA headline is 2 lines, and Visão is 4. Section heights match
the file to within 1px, except Serviços at +36 — which is the file's own stale
metadata, not the build (that headline's stored box is 156px from when it was
56px; it is 72px now and correctly renders 199).

The Metrisch family is **not used** by the desktop page — the only faces the
`Site desktop` frame references are Allomira and Lora.

There is now one small script, `scripts/motion.js`, implementing the designer's
interaction spec. The page is complete and readable without it — that is a
hard constraint, not a nicety, and it is worth re-checking with JS disabled
after any change.
