# poc/rawhtml

Zero-dependency build of the Joice Sperandio landing page. Hand-authored HTML,
pure modern CSS, no JavaScript, no build step, no `node_modules`.

## Run

```sh
python3 -m http.server 8000
```

There is nothing to install and nothing to compile. What is in this folder is
exactly what ships.

## What is here

```
index.html          the whole page
styles/
  tokens.css        @layer declaration + primitives + semantic aliases
  base.css          reset, base typography, utilities
  sections.css      components — header, hero, cards, faq, cta, footer
assets/fonts/       (empty) self-hosted woff2, once exported
assets/img/         (empty) portrait + OG image, once exported
robots.txt
sitemap.xml
```

## How the CSS is organised

Cascade order is declared once, at the top of `tokens.css`:

```css
@layer reset, tokens, base, components, utilities;
```

Everything else slots into a named layer, so specificity never has to be
argued about and load order stops mattering.

Tokens come in two levels, mirroring the Figma file: primitives hold raw
values, semantic aliases give them roles. Components may only reference the
semantic level. A renamed Figma token should land as a one-line diff in
`tokens.css` rather than a hunt through component CSS.

Hover and active states derive with `color-mix()` instead of getting their own
tokens, which keeps the token surface small and the states automatically in
sync with their base colour.

## Platform features doing real work here

| Feature | Replaces |
|---|---|
| `scroll-behavior` + `scroll-margin-top` | the entire anchor-nav JS |
| `@layer` | CSS-in-JS scoping discipline |
| CSS nesting | Sass |
| `clamp()` | a separate mobile type scale |
| `color-mix()` | one token per interaction state |
| container queries | viewport-width breakpoints on cards |
| `<details>` | a JS accordion, and an SEO problem |
| `animation-timeline: view()` | a scroll-reveal library |
| inline SVG sprite + `<use>` | an icon component |

## Verified

- Renders correctly at 390px and 1512px
- Zero `<script>` tags other than JSON-LD; zero inline event handlers
- All three JSON-LD entities (`Person`, `FinancialService`, `FAQPage`) parse
- Every word of content present in the raw HTTP response — nothing injected
- Anchor targets clear the sticky header exactly: heading lands 139px from the
  viewport top against a 136px `scroll-margin-top`
- Mobile header stacks to two rows and `--header-height` moves with it

## Not yet done

Blocked on **Figma edit access** (the MCP tools need edit rights, not view):

- Token values in `tokens.css` are sampled from screenshots, not extracted.
  Replace from source — the semantic aliases should absorb it without any
  component CSS moving.
- Fonts. `@font-face` blocks are written and commented out in `base.css`,
  including the metric-override fallback that prevents layout shift on swap.
  Needs the woff2 files, subset to latin + latin-ext for pt-BR diacritics.
- Portrait and OG image. The hero has a placeholder box; the real `<picture>`
  markup with AVIF/WebP sources and `fetchpriority="high"` is written out in a
  comment next to it, along with the `<link rel="preload">` to add.
- Logo. Currently a stand-in mark.

Blocked on **Joice**:

- All body copy is draft and needs her review.
- Four FAQ answers are placeholders — they involve commercial claims
  (remuneration, products, timelines) that only she can make.
- Testimonials are empty slots by design. Real quotes, collected with
  permission, or the section gets deleted.
- Credential tags in the hero need confirming before publishing; professional
  certifications are regulated claims.

Blocked on **decisions**:

- Domain. `joicesperandio.com.br` is a candidate throughout, not confirmed. It
  must match the website field on her Google Business Profile exactly, www vs
  non-www included, or the NAP match fails.
- WhatsApp number. `5547991939397` assumes the 9th digit; the number given was
  `+55 47 9193-9397`, which is 8 digits after the DDD. Her GBP lists the same
  number, so reading the phone field off the listing settles it. Test the final
  link on a real phone — a wrong number fails silently.
- `areaServed` city in the JSON-LD.

## Known ceiling

One URL ranks for one primary intent cluster. "Planejamento financeiro" and
"consultoria em investimentos" are different searches; the anchor sections may
surface as sitelinks but will not rank independently. That is a limit of the
single-page decision, not of this build — and the escape hatch is free, since
adding `planejamento-financeiro.html` here is a new file rather than a
migration.
