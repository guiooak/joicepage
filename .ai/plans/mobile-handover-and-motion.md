# Mobile: handover, tablet band, and the motion layer

## Context

`poc/htmlonly-mobile/` is **structurally finished** — all fourteen sections of
the Figma frame `Layouts › Mobile › MOBILE 360px` (`392:8099`) are built, and
the geometry is verified at 360/390/430 with a largest deviation of 0.34px.
"Continue the mobile development work" is therefore not about building
sections. Two real gaps remain, plus two small carry-overs.

**Nothing routes a phone to the mobile page.** `poc/rawhtml/index.html:26`
carries `rel="alternate" media="only screen and (max-width: 640px)"`, which is
an SEO annotation to Google, not a redirect. Combined with
`<meta name="viewport" content="width=1440">` on line 5, a real phone loading
the root gets the 1440 canvas laid out at 1440 CSS px and pinch-scaled by the
browser to roughly a quarter size. The mobile site exists and is unreachable.

**Mobile motion is an empty stub.** `styles/motion.css` is 12 lines
(`/* Filled in per section. */`) and `scripts/motion.js` is 18 lines that only
add a `.js` class, against 401 + 406 lines on the desktop build. Figma's
`Gui › Interactions` section (`293:6393`) specs six behaviours, and every one
of them maps to a section that exists on the mobile page.

**The most visible symptom of that stub is the Sobre deck**, reported as "the
interaction is not working". Nothing is broken — the interaction was never
built, and the section ships in a state that cannot be read. See §3.

Outcome: a phone or tablet visiting the site lands on the mobile page, every
interaction on it animates, and the Sobre deck can actually be read.

### Decisions taken

| Decision | Value |
|---|---|
| Handover boundary | **Hard cut at 1024px, inclusive.** No pointer test, no second tier. |
| Mechanism | Client-side redirect, both directions |
| Tablet | Follows the mobile layout — same page, same structure |
| Canvas scaling at and below 1024 | **Uncapped.** The 360 canvas fills the viewport |
| Rotation | Switching layout on tablet rotate is **acceptable** |

**The boundary is inclusive on purpose.** The goal is to cover every tablet in
portrait, and iPad Pro 12.9" portrait is *exactly* 1024 — so the rule is
`width <= 1024` serves mobile, `width > 1024` serves desktop. Written as
`< 1024` it would miss the one device that motivated moving the number.

What the hard cut buys and costs, at real device widths: **every** iPad in
portrait (744, 810, 820, 834, 1024) and all phone landscape (640–956) get the
mobile layout, at 1.8× to 2.84×; iPad 9.7"/10.2" landscape is also 1024 and
lands there too. Tablet landscape above that — iPad mini 1133, Air 1180,
Pro 11" 1194, Pro 12.9" 1366 — gets the desktop page, along with every laptop
from 1280 up. Desktop never renders below 1025/1440 = 0.71 zoom. The
discontinuity at the boundary is steep — 1024px shows the canvas at 2.84×,
1025px shows desktop at 0.71× — and that is the accepted trade for a rule with
no second variable in it.

---

## 1 · The handover redirect

**`poc/rawhtml/index.html`** — an inline, blocking `<script>` in `<head>`,
before any stylesheet, so no desktop paint happens on a phone.

The critical trap: line 5 pins `<meta name="viewport" content="width=1440">`,
so on a phone `window.innerWidth` **reports 1440**, and every media query
resolves against 1440 too. Neither can be the signal. Use:

```js
Math.min(window.screen.width, window.innerWidth)
```

`screen.width` is unaffected by the viewport pin (390 on an iPhone 14), and the
`innerWidth` half keeps a narrowed desktop window and DevTools honest. On the
mobile page, whose viewport is normal, `innerWidth` alone is correct.

Requirements for both directions:

- Navigate **relative** (`mobile/` from the root, `../` from mobile). The site
  is served from a subpath on the review app (`guiooak.github.io/joicepage/`)
  and from the domain root in production; absolute paths break one of them.
- Preserve `location.search` and `location.hash`.
- **Escape hatch**: honour a `?layout=desktop` / `?layout=mobile` param that
  writes a `sessionStorage` flag and suppresses redirecting for the session.
  A redirect with no override traps anyone who wants the other view.
- **Complementary thresholds** so the two pages cannot ping-pong: mobile serves
  `<= 1024`, desktop serves `> 1024`, with the constant written once in each
  file's script and the two comparisons kept strict complements of each other.
  Getting this wrong in the same direction on both pages is the one bug that
  produces an infinite redirect loop, so assert it at 1024 and 1025 explicitly.
- Re-evaluate on `resize`/`orientationchange` — the user has confirmed a layout
  switch on rotation is fine. Debounce it, and skip it when the session flag is
  set.
- Do **not** redirect when `navigator.webdriver` is true, so
  `tools/measure/measure.mjs` keeps measuring the page it was pointed at.

**Also update the SEO pair to the same number:**

- `poc/rawhtml/index.html:26` — `max-width: 640px` → `max-width: 1024px`.
  `max-width` in CSS is itself inclusive, so this matches the redirect exactly.
  Keep it on one line; `.github/workflows/deploy.yml:234` asserts this tag with
  a single `grep`, and the `[^>]*` in that pattern means the `media` change
  passes unchanged.
- `poc/htmlonly-mobile/index.html:28` — the canonical back to the desktop URL
  stays as is; the deploy step that re-points it for the review app is
  unaffected.

## 2 · Canvas scaling for the tablet band

**`poc/htmlonly-mobile/styles/base.css:132`** — today:

```css
zoom: calc(min(100cqw, 640px) / var(--frame-width));
```

Raise the cap from 640 to 1024. Up to the handover the canvas now fills the
viewport uncapped, which is the decision; the `min()` stays only so that a
direct hit on `/mobile/` from a wide desktop browser — where the redirect may
be suppressed by the session flag — renders at 2.84× rather than 5.3×.

Update the comment block above it (`base.css:117-131`), which currently
explains the 640 cap as "the width below which the desktop page hands over".
That sentence becomes wrong the moment the number changes, and this codebase
treats those comments as the record.

**`poc/rawhtml/styles/base.css:151`** needs no change —
`zoom: min(1, calc(100cqw / var(--frame-width)))` already floors at 0.71 once
nothing at or below 1024 reaches it.

Check while implementing: the two horizontal rails
(`sections.css:262-282`, `445-459`) and the Serviços snap carousel
(`sections.css:517-583`) are `overflow-x: auto` inside a 328-wide mask. At
2.84× they still work, but confirm the snap points land correctly at a
non-integer zoom rather than assuming it.

## 3 · The mobile motion layer

Fill `poc/htmlonly-mobile/styles/motion.css` and `scripts/motion.js`, reusing
the desktop implementation in `poc/rawhtml/styles/motion.css` and
`poc/rawhtml/scripts/motion.js` rather than inventing a second vocabulary.

**The contract, stated at the top of both stub files and load-bearing:** delete
both files and the page is exactly the static build again; nothing here creates
content; the script is deferred; every decoration sits behind
`prefers-reduced-motion: no-preference`. `interpolate-size: allow-keywords` is
already set at `base.css:104`, so height-to-`auto` tweens are available.

Figma's six `Gui › Interactions` specs, mapped to selectors that already exist
in `poc/htmlonly-mobile/index.html`:

| Figma group | Behaviour | Mobile selector | Reuse from desktop |
|---|---|---|---|
| `293:7713` | Title word reveal | `.visao__title` (`:211`) | `ink-in` keyframes + word split, `motion.css:30-60`, `motion.js:22-75` |
| `293:7714` | Serviços card open | `.servicos__rail` (`:306`) | `panel-open`, `motion.css:362-400` — but mobile is a snap carousel, not a hover grid |
| `293:7715` | Testimonial switch | `.depoimento` (`:547`) | `motion.css:241`; mobile is radio-driven, so pure CSS — no JS port |
| `293:7721` | **Card deck stack → spread** | `.sobre__deck` (`:637`) | `motion.css:76-106` sticky + per-card depth — **see below** |
| `293:7722` | Big numbers count | `.numeros dt` (`:496`) | `tick` keyframes + `countUp()`, `motion.css:270`, `motion.js:347-380` |
| `293:7723` | Sobre collage | `.sobre__collage` (`:612`) | `drift`, `motion.css:112-156` |

Plus two the mobile page has and the spec sheet does not separate out: the hero
blobs `.hero__blob--1/--2` (`:136-137`), which the desktop drives with the same
`drift`; and the Processo + FAQ `<details>` panels (`:396`, `:701`), which
should get the `panel-open` animation — note the desktop comment at
`motion.css:362`, that it must be an animation on the open state, not a
transition from a forced-closed one.

**Deliberately not ported:** section 8 of `motion.js:274-345`, the
cursor-repelled CTA pills. It is guarded by `(hover: hover) and (pointer: fine)`
and by `pointerType === "touch"` checks; on a touch page it is dead code.

**Every interaction gets a transition, not just the six specced ones.** The
page has several state changes that currently snap, because a transition was
never written for them. All of them are already-working native elements, so
this is decoration layered on top and nothing here may become load-bearing:

| Interaction | Selector | What to add |
|---|---|---|
| Nav drawer | `<details>` (`:99`), CSS `sections.css:69-118` | Panel height tween + chevron/burger rotate |
| Processo accordion | `<details>` (`:396`) | `panel-open`, one open at a time via `name=` |
| FAQ accordion | `.faq__item` (`:701`) | Same tween, chevron rotate |
| Serviços carousel | `.servicos__rail` (`:306`) | `scroll-behavior: smooth`, active-card emphasis on snap |
| Testimonial switch | `.depoimento__pick` radios (`:548-550`) | Crossfade between quotes — pure CSS, no JS |
| Both rails | `sections.css:262-282`, `445-459` | `scroll-behavior: smooth` |
| Sobre deck | `.sobre__deck` (`:637`) | The stack → spread below |
| To-top control | `assets/img/to-top.svg` | Fade/slide in past a scroll offset |

`<details>` height tweens need `interpolate-size: allow-keywords`, already set
at `base.css:104`, and must be an animation on the open state rather than a
transition from a forced-closed one — the reason is written out at
`poc/rawhtml/styles/motion.css:362`.

### The Sobre deck — the one that is visibly broken

`Gui › Interactions` group `293:7721` draws the deck in **two states**: five
cards overlapping with one line of copy each (`293:6772`, 554×466), and the
same five spread out and fully readable (`293:6799`, 554×956). The mobile
build ships only the collapsed one, so cards 01–04 cannot be read at all — and
because `.sobre__num` is centred in a 204-tall card while only 71px of it
shows, even the numerals fall below the cut.

This resolves item 13 of `.ai/plans/remaining-work.md`, which asked whether the
stack was intended as static. It is not; it is the first keyframe of a
two-state interaction the frame could not express.

Three structural changes are needed before any motion can be attached:

1. **`.sobre__deck` children are `position: absolute`** (`sections.css:1093`)
   at hard offsets 0/71/142/213 inside a fixed `block-size: 466px`. `sticky`
   does not apply to absolutely positioned elements, so the desktop technique
   cannot be dropped in. Rebuild the stack in normal flow with negative
   `margin-block-start` — which reproduces the same drawn offsets, since −133
   is exactly the auto-layout gap Figma specifies — and let the container
   height come from content.
2. **The fifth card is outside the deck.** `.sobre__card--last` (`:665`) sits
   outside `.sobre__content` entirely, pulled up by `margin-block-start:
   -15.67px`. The spec stacks all five together, so it has to join the `<ol>`
   for the interaction to read as one deck. Its −15.67 overlap then becomes
   part of the same negative-margin sequence.
3. **`overflow: clip` on `.sobre__card`** (`sections.css:1113`) is fine
   collapsed but will clip during the spread — check it once the cards move.

Then the motion, reusing `poc/rawhtml/styles/motion.css:76-106`: sticky
offsets rebuild the pile, and a per-card `scale`/`brightness` keyed off an
`--i` custom property gives it depth. Read the comment there before starting —
it records that a `view()` timeline was tried for this and is *wrong*, because
sticky cards leave the scrollport together and all five recede at once, which
reads as the block flinching rather than as a stack. The depth must be
spatial, per card.

**The constraint that makes this delicate:** the drawn frame *is* the
collapsed state, and this build is verified against it to 0.34px. So the
resting state must still measure 466px with cards at 0/71/142/213, and the
spread may only exist as a scroll-driven or reduced-motion-gated layer on top.
Under `prefers-reduced-motion: reduce` the cards must be readable some other
way — a static spread is the honest answer there, since a stack no one can
expand is not an acceptable fallback.

Two mechanical cautions. Scroll-driven work goes behind
`@supports (animation-timeline: view())` exactly as the desktop does at
`motion.css:30` and `:112`. And CSS comments must stay balanced — `deploy.yml`
asserts it, after an unbalanced comment silently swallowed a `flex-basis`
transition once already.

## 4 · The two small carry-overs

Both are items 3 and 4 in `.ai/plans/remaining-work.md`, both unblocked.

- **Serviços arrow.** `poc/rawhtml/index.html:117` and
  `poc/htmlonly-mobile/index.html:73` both carry an invented inline
  `<symbol id="i-arrow">`. Export the real vector from Figma (the `arrow`
  frames inside each Serviços `list-item`, e.g. `293:6454`), commit it to
  `assets/img/` in **both** folders — assets are duplicated on purpose, see
  `poc/htmlonly-mobile/README.md:24-27` — and delete the `<defs>` block.
- **`assets/img/og.jpg`.** Referenced by `poc/rawhtml/index.html:36` and
  `poc/htmlonly-mobile/index.html:38`, and it does not exist, so every
  WhatsApp and LinkedIn preview renders imageless. Matters more than its size
  suggests for a page whose lead capture *is* a WhatsApp link.

## 5 · Record it

- `.ai/plans/remaining-work.md` — strike items 3 and 4; **strike item 13 and
  rewrite §9's third paragraph**, which says the mobile build "reproduces it
  exactly" and asks whether a static stack is intended. `Gui › Interactions`
  `293:7721` answers it: the stack is one of two drawn states, so the doc's
  open question is closed and the desktop's flat-list treatment (§6) should be
  revisited against the same spec. Then add the handover and the motion layer
  with the inclusive 1024px decision and its accepted trade-off — including
  why the boundary is `<=` and not `<`.
- `poc/htmlonly-mobile/README.md:29-38` — the **Scope** section currently says
  "Mobile only. There are no breakpoints" and cites the 640 handover. Rewrite:
  this page now serves phones and tablets through 1024px inclusive, uncapped.
- `poc/rawhtml/index.html:6-8` — the comment "Desktop-only implementation, per
  scope. No mobile styles exist in this build" now sits directly above a
  redirect script and needs to say what that script does.

---

## Verification

Run both sites from their own folders, which is the invariant `poc/` exists to
protect:

```sh
cd poc/rawhtml          && python3 -m http.server 8000
cd poc/htmlonly-mobile  && python3 -m http.server 8001
```

**Geometry — must not regress.** The harness reports offsets unscaled, so the
same table has to come out at every width:

```sh
node tools/measure/measure.mjs poc/htmlonly-mobile 360
node tools/measure/measure.mjs poc/htmlonly-mobile 390
node tools/measure/measure.mjs poc/htmlonly-mobile 430
node tools/measure/measure.mjs poc/htmlonly-mobile 834   # iPad Pro 11 portrait
node tools/measure/measure.mjs poc/htmlonly-mobile 1024  # iPad Pro 12.9 portrait, the cut
```

**The handover**, in Chrome via the browser tools, at each boundary width —
375, 834, 1024, 1025, 1440:

- `<= 1024` on the desktop URL redirects to `mobile/`, once, with no desktop
  paint first
- `> 1024` on the mobile URL redirects to `../`
- **exactly 1024 settles on mobile** — this is the case the number was moved
  for, and the one an off-by-one silently breaks
- exactly 1025 settles on desktop, and neither width ping-pongs
- `?layout=desktop` on a 375px viewport stays on desktop across an internal
  navigation
- rotating a tablet emulation across the boundary switches page and does not
  loop
- the subpath case: serve the assembled layout with `mobile/` nested and
  confirm the relative navigation still resolves

**Motion.** Delete `styles/motion.css` and `scripts/motion.js` and confirm the
page is still complete and readable — the nav drawer, FAQ, Processo accordion
and Serviços carousel are native elements and must all still work. Then run
with `prefers-reduced-motion: reduce` forced and confirm behaviour survives
while decoration does not.

**The Sobre deck specifically**, since it carries a geometry constraint the
rest of the motion work does not:

- at rest, `measure.mjs` still reports the deck at 466px with the cards at
  0/71/142/213 — the drawn collapsed state, unchanged
- scrolling through the section spreads all five cards to fully readable, and
  the numerals 01–05 are visible rather than cut off below the fold
- under `prefers-reduced-motion: reduce` all five are readable without
  scrolling — a stack that cannot be expanded is not an acceptable fallback
- with `styles/motion.css` deleted the section still measures as it does today

**Deploy guards.** They run over both folders and will catch the two things
most likely to go wrong here — a required file missing and an unbalanced CSS
comment. Worth a local dry run of that step before pushing, plus a re-read of
the `rel="alternate"` assertion at `deploy.yml:234` once the `media` value has
changed.

Note: pushing anything under `.github/workflows/` needs a token with the
`workflow` scope, which the `gh` login here does not have — use SSH for that
push or run `gh auth refresh -s workflow`.
