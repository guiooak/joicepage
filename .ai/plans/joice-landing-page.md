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
| JS | Zero. Verified by grep — the only `<script>` is JSON-LD. |
| Scope | **Desktop only.** No breakpoints, no mobile CSS. Body pinned to the 1440px frame. |
| Lead capture | WhatsApp deep link. No form, no backend, no LGPD surface. |
| Fonts | Self-hosted woff2, committed. No CDN. |
| Images | Placeholders at exact mockup footprints until real assets are exported. |
| Hosting | Cloudflare Pages (BR edge). Low-stakes — static files port anywhere. |
| Repo layout | `poc/<approach>/` so alternative builds can be compared as siblings. |

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

**Fonts.** Primary sans **Allomira** (Light/Regular/Medium/Bold/Black);
secondary **TP Sans** (ExtraLight/Light/Regular/Medium); serif **Lora** and
**EB Garamond**. Inter/Manrope appear only in annotation boards, not the page.

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

`poc/rawhtml/` — zero dependencies, zero build, zero JS, all copy transcribed
verbatim from the frame. Ten sections built:

Header · Hero · Credenciais · Visão · Princípios · Serviços · Processo ·
CTA conversa · Histórias + depoimentos · Números

Verified: renders at 1440px; JSON-LD (`Person`, `FinancialService`) parses; all
content present in the raw HTTP response; anchor targets clear the header
(heading lands 139px against a 136px `scroll-margin-top`).

Two deliberate choices worth keeping: the FAQ uses native `<details>` so answers
stay crawlable, and the nav has no hamburger — a `<details>` disclosure cannot be
closed by CSS when a link inside it is followed, so the menu stayed open covering
the page. Testimonial names are placeholders **in the mockup itself**
("Alessandra Sobrenome", "Rafael & [Parceira]") and are reproduced as drawn.

## Missing

**Sections not built:** SOBRE · second LOGOS · faq · footer.

**Accuracy gaps in what is built:**

1. **Fonts are substituted.** Allomira/TP Sans/Lora are not yet exported, so a
   fallback stack is in use. It is wider than the design's face, which is why
   some headlines wrap one line early. Largest remaining visual difference.
2. **Colours are sampled**, not read from Figma variables. Close, not exact.
3. **Geometry was measured by eye** for the built sections and is now known to be
   wrong in places — see the exact numbers above (hero is 1358×750 not 1360×760;
   Serviços cards are 899/437 not 1fr/434; Processo is 553/663; page background
   is `#f4f7f7`).
4. **Images are placeholders.** 265 real bitmaps sit in the `.fig` export.

## Next steps

1. `get_variable_defs` on the token sets → rewrite `tokens.css` with exact values,
   replacing every token currently marked *sampled*.
2. `download_assets` → Allomira, TP Sans, Lora woff2 (subset latin + latin-ext for
   pt-BR diacritics) plus logo, icons and photos.
3. `get_design_context` per section → rebuild all 13 against exact geometry.
4. Resolve the FAQ accordion — `get_design_context` on `331:7305`, or extend the
   recursive symbol walk in `tools/figextract/`. The designer's Figma comments
   also carry real question copy.
5. Add `<link rel="preload">` for the hero portrait and the critical woff2, with
   metric-override fallbacks so the font swap does not shift layout.

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
3. **Font licensing.** Allomira and TP Sans are commercial; confirm a webfont
   licence covers self-hosting. Lora and EB Garamond are open.
4. **Mobile.** Out of scope here by decision; the `Mobile` frame is a separate
   exercise.

## Known ceiling

One URL ranks for one primary intent cluster. "Planejamento financeiro" and
"consultoria em investimentos" are different searches; anchor sections may
surface as sitelinks but will not rank independently. That is a limit of the
single-page decision, not of this build — and the escape hatch is free, since
adding `planejamento-financeiro.html` is a new file rather than a migration.
