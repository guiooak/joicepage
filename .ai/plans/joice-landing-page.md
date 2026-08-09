# Joice Sperandio — Landing Page

## Context

Joice Sperandio is a financial planner. She needs a single-page landing site,
designed in Figma (`35gFTPRFgD9FZ0pwIxO3GL`, frame `318:7275` — "Site desktop").

Two constraints drive every decision:

- **Longevity.** Toolchains rot; the web platform does not. The page is expected
  to live for years with infrequent edits, so it must not depend on a build step
  that can break while nobody is looking. Tailwind replaced its entire config
  model in under two years — exactly the churn being avoided.
- **SEO.** Organic search is a primary acquisition channel. Hand-authored static
  HTML puts every word in the initial response, with nothing waiting on JS.

The deliverable is a standalone `index.html` plus CSS and assets — deployable by
copying files, editable by anyone who knows HTML.

## Locked decisions

| Decision | Choice |
|---|---|
| Framework | None. Hand-authored HTML. |
| Build step | None. |
| CSS | Pure modern CSS, `@layer`, custom properties. No preprocessor, no utility framework. |
| Markup reuse | Accepted duplication. CSS classes are the reuse layer. |
| JS | **One file, additive only** (`scripts/motion.js`, deferred). Changed from "zero" — see below. |
| Scope | **Desktop only.** No breakpoints, no mobile CSS. Body pinned to the 1440px frame. |
| Lead capture | WhatsApp deep link. No form, no backend, no LGPD surface. |
| Fonts | Self-hosted woff2, committed. No CDN. |
| Images | Real, exported from the `.fig` and committed to `assets/img/`. |
| Hosting | Cloudflare Pages (BR edge). Low-stakes — static files port anywhere. |
| Repo layout | `poc/<approach>/` so alternative builds can be compared as siblings. |

## The JS decision, reversed

"Zero JS" was locked before the designer added an **Interactions** board to the
file — canvas section `293:6393`, a section literally named "Gui", specifying
six scroll-driven behaviours with reference sites:

| Behaviour | Node | Reference |
|---|---|---|
| Text scroll | `293:7705` | reveal-text-on-scroll.framer.website |
| Cards (Serviços 899/437) | `293:6685` | biggest-delivers-516518.framer.app |
| Testimonial | `293:6690` | minimal-testimonials.framer.website |
| Stack (Sobre 01–05) | `293:6695` | zupstudio.framer.website · scroll-stack-component.framer.website |
| Counter (Números) | `293:6711` | final-intend-665098.framer.app |
| Parallax | `293:6762` | none — "nao achei nenhuma ref" |

None of this is reachable with zero JS. The decision taken was **one small
vanilla file, progressive enhancement**, on these terms:

- Text scroll, stack and parallax are CSS (`animation-timeline: view()`,
  sticky offsets) and live in `styles/motion.css`.
- Serviços expand, the testimonial carousel and the counter are in
  `scripts/motion.js`.
- The counter is deliberately JS rather than a CSS counter: `content:` would
  move "+130" out of the document text and out of the crawlable response,
  which is the one thing this build exists to protect.
- The file creates no content. Every string it touches is already in the HTML.

The longevity constraint survives: delete both files and the page is exactly
the static build again.

Two things worth knowing for anyone editing the motion:

- Chrome will not run a `grid-template-columns` transition to completion — it
  parks on the start value, so the Serviços columns silently never swap. The
  card widths animate via `flex-basis` instead.
- A `@font-face` with no `font-weight` descriptor only matches weight 400, so
  every 500/700/900 run falls straight past it and loses the metric override.

## Design access — solved twice

The Figma MCP tools need **edit** rights. For most of this work only view access
existed, so two routes were built. Both now work and cross-check each other:

1. **`.fig` export → `tools/figextract/`** (preferred fallback). A `.fig` is a
   ZIP holding a `fig-kiwi` container whose Kiwi schema is embedded, so it
   decodes offline with **no Figma subscription, no API token, no account**.
   Verified clean: 10,287,412 of 10,287,412 bytes consumed, 7,781 nodes.
   Two traps are documented in that tool's README — the schema chunk is deflate
   while the document chunk is **zstd** (a deflate-only reader yields garbage
   rather than an error), and Kiwi's 64-bit varints use a ninth byte at shift 56
   rather than plain LEB128.
   Tradeoff: a snapshot. Re-export when the design changes.
2. **Figma MCP** — edit access was granted late and is now confirmed working.
   Gives `get_variable_defs`, `download_assets`, `get_design_context`.

Keep both. The `.fig` route costs nothing and survives access lapsing again.

## Facts extracted from the file (exact)

**Frame.** `Site desktop` 1440 × 9928.33 · content 1360 · gutters 40 ·
page padding-block 24 · gap 24 · **background `#f4f7f7`** (not white).

**Fonts.** The `Site desktop` frame uses exactly two: **Allomira**
(Regular/Medium/Bold/Black) and **Lora** Regular for the numerals. Both are
now self-hosted. **TP Sans / Metrisch and EB Garamond appear in the font notes
but are not referenced by this page**; Inter/Manrope only in annotation
boards.

**Type scale** (size / line-height %):
Display 72/92 · H1 56/92 · H2 48/100 · H3 32/100 · H4 28/120 · H5 24/120 ·
Paragrafo 20/140 · Paragrafo bold 20/100 · Caption 16/150 · Tag 16/100

**Section stack** (y-offset, size, padding):

```
Menu          1360x84    @40,24      r=24  padX 24  padY 16  fill #fff
content(hero) 1358x750   @40,132     inner content inset 48,32 · text col 577
LOGOS         1360x279   @40,906     padX 24  padY 96 · icons 64x64 · text x=80
VISAO         1360x1214  @40,1209    gap 56 · title 664 · paragraph 438 @x922
                                     card 1360x710 · 4 cards 309.5x313 gap 24
SERVICOS      1360x1402  @40,2447    padY 140 · title 668 · paragraph 548 @x812
                                     cards 899x874 + 437x874 gap 24 · pad 48
PROCESSO      1360x810   @40,3873    padY 160 gap 72 · left 553 · accordion 663 @x697
                                     items 663x77 collapsed, 193 open
paragrafo(CTA)1360x550   @40,4707    r=24 fill #e5eef4 · avatar 141x141 · text 1232 @64,295.5
HISTORIAS     1360x1190  @40,5281    padY 140 · left 553 · image 767x511.33 @x593
big-numbers   1360x580   @40,6495    3 cols 437.33x420
SOBRE         1360x1055  @40,7099    left 554 · image 782x700 @x602
                                     5 cards 554x158 · divider x=74 · text x=98
LOGOS         1360x279   @40,8178
faq           1360x987   @40,8481    padY 100 · left 553 · FAQ inst 783x820 @x577
footer        1360x396   @40,9492    r=24 fill #28445e  padX/padY 40  gap 40
```

Buttons are 217×52 / 218×52 with a 24px gap.

**Contact details** (resolved from the footer symbol):

- Domain **joicesperandio.com.br** — confirmed via `oi@joicesperandio.com.br`
- Phone as drawn: **+55 47 9193-9397**
- **CVM Consultora de Valores Mobiliários 002276-4**, **CEA**, **CFP®**
- Footer links: Política de Cookies · Política de Privacidade · © 2026

## Done

`poc/rawhtml/` — zero dependencies, zero build, one small additive script.
All thirteen sections built, copy transcribed verbatim from the frame:

Header · Hero · Credenciais · Visão · Princípios · Serviços · Processo ·
CTA conversa · Histórias + depoimentos · Números · Sobre · Credenciais (2) ·
Dúvidas · Footer

With the real Allomira in, every text block lands on its drawn geometry — hero
headline 4 lines in 577px, hero caption 86px against a drawn 87, CTA headline
2 lines, Visão 4. Section heights match the file to within 1px except Serviços
at +36, which is the file's own stale text box (stored 156px from when that
headline was 56px; it is 72px now and correctly renders 199).

Verified: renders at 1440px; JSON-LD (`Person`, `FinancialService`) parses; all
content present in the raw HTTP response; anchor targets clear the header
(heading lands 139px against a 136px `scroll-margin-top`).

Two deliberate choices worth keeping: the FAQ uses native `<details>` so answers
stay crawlable, and the nav has no hamburger — a `<details>` disclosure cannot be
closed by CSS when a link inside it is followed, so the menu stayed open covering
the page. Testimonial names are placeholders **in the mockup itself**
("Alessandra Sobrenome", "Rafael & [Parceira]") and are reproduced as drawn.

## Missing

All thirteen sections are now built. What remains is blocked, not unfinished.

1. **FAQ copy does not exist in the file.** Not an extraction limit — verified:
   `SYMBOL FAQ` (`115:2224`) and every instance of it contain **zero** text
   nodes. The eight cards are drawn empty. Three of the six Processo panels are
   likewise unwritten (the other three were recovered — see below). 11 spots
   marked `A capturar`. This is a writing task for Joice.
2. **Sobre card deck.** The file draws the five cards as an overlapping deck
   (auto-layout gap −65). Rendered as a readable list plus a sticky stack;
   the exact drawn offsets are not reproduced.
3. **Serviços list arrow** is still the one hand-drawn vector in the build —
   it is a VECTOR node, not an image fill, so it did not come out with the
   bitmaps. Export it and delete the inline `<symbol>`.
4. ~~**Fonts.**~~ **Done.** Allomira was supplied and is self-hosted as a single
   variable woff2 (26KB, wght 100–900); Lora as latin + latin-ext subsets.
   64KB total. The metric-override fallback is deleted.

   The variable file was chosen over four statics after checking it, not on
   faith: instanced at 400/500/700/900 it matches the corresponding static
   font's advance widths to within 0.1%, exact at 400 and 900 — so it
   reproduces the designer's instances rather than approximating them.

   **Metrisch (the "TP Sans" in the font notes) is not used by this page.**
   The only families `Site desktop` references are Allomira and Lora.

**Images are all resolved.** The MCP Starter plan ran out of tool calls
mid-build, so they came from the `.fig` route instead — which is exactly what
it was built for. All committed under `assets/img/`, 1.2 MB total.

**`Site desktop` is stale in one place.** It draws service card 02 with card
01's list duplicated. The intended copy exists in the same file, in the
detached `Card` (`392:8746`) and in `MOBILE 360px`, and is what the build uses.
`MOBILE 360px` also carries expanded states the desktop frame draws collapsed —
it is where three Processo panel texts and the full footer content came from.
**Treat the mobile frame as the more current content source.**

Note for the tool: `figkiwi.py` takes the **inner `canvas.fig`**, not the outer
`.fig` ZIP — unzip first. The decode verifies at 10,287,412/10,287,412 bytes.

**Fonts cannot come from Figma.** This was recorded as a next step and is not
achievable: `download_assets` returns exported renders, raw bitmap fills and
vector SVGs only, and the `.fig` container stores font *names* — grepping the
spec dump finds 64 `Allomira` and 5 `Lora` references and zero `woff/ttf/otf`.
Allomira and TP Sans must be licensed. **Lora is open (SIL OFL)** and can be
self-hosted immediately — it sets the 01/02 card numerals and the big numbers.

Meanwhile `base.css` carries a measured metric-override fallback. Sweeping
`size-adjust` against the resolved face gives a 72–83% window where the hero
headline is 4 lines (its drawn 577×264 box) and the hero caption lands on its
drawn 87px; 83% is used. Calibrated on macOS, where the `local()` list resolves
to Avenir Next — **recheck on Windows**, where it resolves to Segoe UI.

## Next steps

1. **Get the FAQ copy from Joice** — eight questions and answers, plus three
   Processo panel texts. Nothing technical unblocks this; it is unwritten.
2. Export the Serviços list arrow vector and drop the last inline `<symbol>`.
3. Confirm the WhatsApp number before deploy (open question 1) — it is wired
   into both the footer link and the JSON-LD `telephone`. The mobile frame
   draws the same eight-digit number, so the file does not settle it.
4. Optional: extend `tools/figextract/` to expand INSTANCE nodes via
   `symbolData` / `overrides`. Less urgent now that the mobile frame turned out
   to carry the expanded content, but it would make the dump self-sufficient.

## Verification

1. `cd poc/rawhtml && python3 -m http.server` — confirm it works with JS disabled.
2. `curl` the deployed URL — every word must be in the initial response.
3. Lighthouse, mobile emulation, throttled. Target 100 SEO / 100 A11y, LCP < 2.5s.
4. Google Rich Results Test — `Person` and `FinancialService` parse.
5. Paste the URL into WhatsApp; confirm the OG card renders.
6. Compare against the Figma frame at 1440px.

## Open questions

1. **Confirm the WhatsApp number.** The design shows `+55 47 9193-9397` — eight
   digits after the DDD. Brazilian mobiles have been nine since the national
   rollout (`9XXXX-XXXX`), so this is likely `+55 47 99193-9397`. Her Google
   Business Profile lists the same number, so reading it there settles it. Test
   the final `wa.me` link on a real phone — a wrong number fails silently.
2. **Read five fields off her Google Business Profile:** exact business name,
   phone, website URL (www vs non-www — must match the canonical), whether the
   address is public or the listing is service-area, and the Maps short link for
   `sameAs`. NAP mismatch costs the local-pack association.
3. **Font licensing — still worth confirming.** The Allomira files are in hand
   and self-hosted, which is a *webfont* use; check the licence purchased
   covers web embedding, not only desktop. Lora and EB Garamond are open.
4. **Mobile.** Still out of scope by decision. Note that the frame now exists
   and is complete: `392:8099`, "MOBILE 360px", 360×11477.7, in canvas section
   `393:9365`, with five annotated section callouts. So the separate exercise
   is ready to start whenever it is wanted.

## Known ceiling

One URL ranks for one primary intent cluster. "Planejamento financeiro" and
"consultoria em investimentos" are different searches; anchor sections may
surface as sitelinks but will not rank independently. That is a limit of the
single-page decision, not of this build — and the escape hatch is free, since
adding `planejamento-financeiro.html` is a new file rather than a migration.
