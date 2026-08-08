# Joice Sperandio — Landing Page

## Context

Joice Sperandio is a financial planner. She needs a single-page landing site,
designed in Figma (`35gFTPRFgD9FZ0pwIxO3GL`). The repo is currently empty — no
commits yet.

Organic search is a primary acquisition channel, and the page is expected to
live for years with infrequent edits. Those two facts drive every decision here:

- **No runtime dependencies, no required build step.** Toolchains rot; the web
  platform does not. HTML/CSS from a decade ago still renders, while a Node
  build from 2019 often won't `npm install` today. Tailwind v3→v4 replaced its
  entire config model in under two years — exactly the churn we're avoiding.
- **Nothing may compromise SEO.** Static hand-authored HTML is the strongest
  possible position: all content is in the initial response, nothing waits on
  JavaScript.

The outcome is a site that is a single standalone `index.html` plus CSS and
assets — deployable by copying files, editable by anyone who knows HTML, with
no step between the source and what ships.

## Locked decisions

| Decision | Choice |
|---|---|
| Framework | None. Hand-authored HTML. |
| Build step | None. |
| CSS | Pure modern CSS, no preprocessor, no utility framework. |
| Markup reuse | Accepted duplication. CSS classes are the reuse layer. |
| JS | Target zero. Nav is CSS-only. |
| Lead capture | WhatsApp deep link. No form, no backend, no LGPD surface. |
| WhatsApp | `+55 47 9193-9397` — **verify, see below** |
| Fonts | Self-hosted `.woff2`, committed. No Google Fonts CDN. |
| Images | Pre-optimized AVIF/WebP, committed. Generated locally, once. |
| Hosting | Cloudflare Pages (BR edge presence). Low-stakes — files port anywhere. |

## File layout

```
index.html            all sections, hand-authored
styles/
  tokens.css          @layer tokens  — primitives + semantic aliases
  base.css            @layer reset, base — reset, type scale, landmarks
  sections.css        @layer components — .hero, .card, .faq, .testimonial
assets/
  fonts/*.woff2       subset to latin + latin-ext (pt-BR diacritics)
  img/*.avif|.webp    hero portrait, logo
robots.txt
sitemap.xml
```

Three CSS files, linked separately. No inlining initially — measure first
(see Verification).

## Phase 1 — Extract the design system from Figma

Blocked on edit access to the Figma file. The MCP tools require **edit**
rights; view-only returns "you don't have edit access". Once granted to
`guibrancopc@gmail.com`:

1. **Resolve canonical frames first.** The `Layouts` page contains `Mobile`,
   `Finais`, and `Gui` frames plus loose `Cards` / `Testimonial` boards.
   `Finais` is a handoff/scratch board (8 FAQ instances, arrows, measurement
   annotations) — *not* the page layout. Ask the designer which frames are
   canonical for desktop and mobile before building anything.
2. `get_metadata` on the canonical desktop frame → section tree, exact sizes.
3. `get_variable_defs` on the `Styles e components` page → the token layers
   (`Tokens — Colors`, `— Background`, `— Dimension`, `— Typography`) and the
   `Primitivies` → `Joice Webkit` chain.
4. `download_assets` → logo and arrow icons as SVG; portrait as source image.

Known from the file already:
- Type scale: Display 72/92, H1 56/92, H2 48/100, H3 32/100, H4 28/120,
  H5 24/120, Paragrafo 20/140, Paragrafo bold 20/100, Caption 16/150, Tag 16/100
- Components: numbered service Card (01 Planejamento Financeiro,
  02 Consultoria em Investimentos), Testimonial, FAQ (~8 items), Logo

**Open question for the designer:** there is only *one* text-style set — no
`H1 Mobile` variants. Either the mobile frames override sizes locally, or a
72px Display is meant to ship on a 375px screen. Confirm before writing type
CSS. Default to `clamp()` regardless.

## Phase 2 — CSS foundation

`tokens.css` mirrors the Figma structure in two layers, so token renames arrive
as readable diffs:

```css
@layer tokens {
  :root {
    /* primitives — straight from Figma Primitivies */
    --blue-500: #...;
    --space-4: 1rem;
    /* semantic aliases — from Tokens — Colors / Background / Dimension */
    --color-surface: var(--blue-50);
    --color-text-strong: var(--blue-900);
  }
}
```

Use `color-mix()` to derive hover/active states from base tokens rather than
defining a token per state — meaningfully smaller token surface.

`base.css` establishes `@layer reset, tokens, base, components` up front so
cascade order is explicit and specificity fights never start.

Fluid type via `clamp()` on the scale above — this is what solves 72px Display
on a 375px viewport without a second set of styles.

## Phase 3 — Sections

Build mobile-first from the canonical mobile frames, with one breakpoint where
the desktop layout takes over. Intermediate widths scale the desktop layout
fluidly rather than getting a third design.

- Container queries for cards that adapt to their column, not the viewport
- `:has()` for section/nav state
- `text-wrap: balance` on headlines, `pretty` on body copy
- `animation-timeline: view()` for scroll reveals, behind `@supports`
- Anchor nav is entirely CSS: `scroll-behavior: smooth` on `:root` plus
  `scroll-margin-top` on each `<section id>` to clear the sticky header

Semantic structure is non-negotiable for SEO: `lang="pt-BR"`, exactly one
`<h1>`, an `<h2>` opening each section, real `<header>`/`<nav>`/`<main>`/
`<section>`/`<footer>` landmarks.

## Phase 4 — SEO

**Head essentials**
- `<title>` ~55–60 chars: name + specialty + location
- `meta description` ~155 chars
- `<link rel="canonical">`, consistent www/non-www and trailing-slash handling
- Open Graph + Twitter Card — the link preview when she shares on WhatsApp and
  Instagram drives real click-through in this market. Treat the OG image as a
  deliverable, not an afterthought.

**JSON-LD** (hand-written, in `<script type="application/ld+json">`)
- `Person` for Joice: `jobTitle`, `knowsAbout`, `sameAs` → LinkedIn/Instagram
- `FinancialService` (a `LocalBusiness` subtype) — see NAP section below. This
  is the highest-leverage schema for a financial planner and the one that feeds
  local results.
- `FAQPage` for the FAQ section: include it for semantic clarity, but do **not**
  expect rich snippets — Google restricted FAQ rich results to government and
  health sites in August 2023.

**NAP consistency (Google Business Profile)**

Joice has a verified GBP. Google links that listing to this site by comparing
Name, Address, Phone and URL — there is no shared ID to join on. When they
agree, the site becomes eligible for the local pack and gets a knowledge panel
that links back. When they disagree, Google hedges and the benefit is lost.

Confirmed: **GBP lists the same number as the WhatsApp CTA.** One number
everywhere — `wa.me` link, JSON-LD `telephone`, and GBP all identical. This also
makes GBP the fastest way to settle the 9th-digit question above: read the phone
field off her own listing rather than guessing.

Address: default to **service-area** (no `address` key, use `areaServed`).
This is the common setup for a solo planner and avoids publishing a home
address. Verify in GBP and swap in a full `PostalAddress` + `geo` only if she
has a public office.

```json
{
  "@context": "https://schema.org",
  "@type": "FinancialService",
  "name": "<exact string from Google Business Profile>",
  "url": "https://<canonical domain>",
  "telephone": "<same number as the wa.me link>",
  "areaServed": { "@type": "City", "name": "<city>" },
  "sameAs": [
    "https://www.linkedin.com/in/joice-sperandio/",
    "https://www.instagram.com/joicesperandio/",
    "https://maps.app.goo.gl/<GBP short link>"
  ]
}
```

Include the Maps short link in `sameAs` — it points directly at the listing
instead of relying on a fuzzy name match.

A separate `Person` entity for Joice herself (`jobTitle`, `knowsAbout`,
`sameAs` with the same two social URLs) sits alongside this.

**To verify in Google Business Profile before launch:**
- exact business name string (copy verbatim into `name`)
- phone field (settles the 9th digit)
- website URL — must match the canonical form, www vs non-www
- whether the address is shown or hidden
- Maps short link for `sameAs`

**`robots.txt` + `sitemap.xml`** — trivial to hand-write for one URL.

**Honest limitation:** a single page can rank for one primary intent cluster.
"planejamento financeiro" and "consultoria em investimentos" would normally
want separate URLs; anchor sections may surface as sitelinks but will not rank
independently. This is a real ceiling on organic reach, not a bug in the build.
The architecture keeps the door open at zero cost — adding
`planejamento-financeiro.html` later is a new file, not a migration. Flag to
Joice that a blog or service pages are the growth path if search becomes the
main channel.

## Phase 5 — Performance (Core Web Vitals are ranking signals)

- **LCP** — likely the hero portrait. `<picture>` with AVIF → WebP → JPEG,
  `fetchpriority="high"`, `<link rel="preload">`, explicit `width`/`height`.
- **CLS** — explicit dimensions on *every* image. For fonts, preload the
  critical `.woff2` and set `size-adjust` / `ascent-override` /
  `descent-override` on a local fallback `@font-face` so the swap doesn't shift
  layout. This matters more than `font-display` choice alone.
- **INP** — free. Zero JS.
- Compression: let Cloudflare handle Brotli. No minification step.

## Verification

1. Serve locally (`python3 -m http.server`) — confirm the page works with
   **JavaScript disabled**. Everything must render and all nav must function.
2. `curl` the deployed URL and read the raw HTML — confirm every piece of
   content is present in the initial response, not injected.
3. Lighthouse on mobile emulation, throttled. Target 100 SEO, 100 Accessibility,
   LCP < 2.5s.
4. Google Rich Results Test on the deployed URL — validate `Person` and
   `FinancialService` parse without errors.
5. Paste the URL into WhatsApp and confirm the OG preview card renders.
6. Check the rendered page against the Figma frames at 375px, 768px, 1440px.
7. Submit `sitemap.xml` in Google Search Console; confirm indexing.

## Open questions

1. **Which Figma frames are canonical?** (blocking Phase 1)
2. **Does mobile have its own type sizes**, or does the single scale apply?
3. **Confirm the WhatsApp number.** Given as `+55 47 9193-9397` — only 8 digits
   after the DDD. Brazilian mobiles have been 9 digits since the nationwide
   9th-digit rollout (`9XXXX-XXXX`), so this is very likely
   `+55 47 99193-9397`. DDD 47 is Santa Catarina.

   ```html
   <a href="https://wa.me/5547991939397?text=Ol%C3%A1%20Joice%2C%20vim%20pelo%20site">
     Falar no WhatsApp
   </a>
   ```

   Format notes: digits only, no `+`, no dashes; country code `55` + DDD `47` +
   number. Prefill `text` with a URL-encoded pt-BR opener so she can see which
   leads came from the site. Test the final link on a real phone before launch —
   a bad number fails silently.
4. **Read the five fields off her Google Business Profile** (list in Phase 4).
   Settles the 9th digit, the address question, and the canonical URL form.
5. Custom domain — needed for `url`, canonical, and `sitemap.xml`.
