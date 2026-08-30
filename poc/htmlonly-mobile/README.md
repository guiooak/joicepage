# poc/htmlonly-mobile

Zero-dependency implementation of the Joice Sperandio landing page for mobile,
built to match the Figma frame **Layouts › Mobile › `MOBILE 360px`**
(`392:8099`, 360 × 11477.67, fourteen sections).

Hand-authored HTML, pure CSS, one small additive script, no build step, no
`node_modules`.

```sh
python3 -m http.server 8000
```

## This is a sibling of `poc/rawhtml`, not a breakpoint of it

The mobile frame is a **separately-designed layout**, not a responsive variant
of the 1440 desktop page. The structure differs — hamburger nav, two
horizontally scrolling rails, a two-card carousel — and so does the copy, in
at least five places: the Visão headline, the Serviços intro, the Serviços
list labels, the two Processo blocks and the hero lead. A responsive layer was
attempted in this repo and reverted in `d750c35` precisely because it fought
the desktop build.

So the two live side by side, each independently runnable, which is what
`poc/` is for. Assets are **duplicated** rather than shared (~1.3 MB) to keep
that true: a shared-asset arrangement assembled at deploy time would leave a
folder that no longer runs from `python3 -m http.server`.

## Scope

**Phones and tablets, through 1024px inclusive.** There are still no
breakpoints: `body` holds the drawn 360 canvas and `base.css` scales the whole
thing to the viewport, so every drawn proportion survives at 360, 390, 430,
834 and 1024 alike — the same technique the desktop build uses at 1440, except
this one scales up as well as down, and now scales a long way up. An iPad Pro
11" in portrait renders the canvas at 2.32x, an iPad Pro 12.9" at 2.84x.

The boundary is inclusive because iPad Pro 12.9" portrait is *exactly* 1024;
`< 1024` would miss the widest tablet in portrait, which is the case the
number exists for. Tablet landscape above it, and every laptop, gets
`poc/rawhtml` instead.

Visitors are put on the right page by a small blocking head script in each of
the two files — `rel="alternate"` is an annotation to search engines, not a
redirect. The desktop half has to read `Math.min(screen.width, innerWidth)`
because its viewport is pinned to 1440 and `innerWidth` reports the pin; this
page reads `innerWidth` alone, since its viewport is `device-width` and honest.
The two tests are strict complements so they cannot ping-pong, and
`?layout=mobile` or `?layout=desktop` pins a choice for the session. The
reasoning is written out in full in the comments above each script.

The scale uses `cqw`, not `vw`. `100vw` includes the classic scrollbar gutter,
so a zoom derived from it renders the page wider than the space it has and
reintroduces the horizontal scrollbar. The desktop build hit exactly that bug.

## How the values were obtained

Three sources, cheapest first:

1. **`tools/figextract/figma-mcp-layouts-tree.xml`** — the committed node
   tree. It holds the whole `MOBILE 360px` subtree with every node's id, box
   and `hidden` flag, and text nodes carry their copy in the `name` attribute,
   so most of the wording came from here at no cost. This is the backbone, and
   the drawn section tops in it are the geometry target.
2. **`styles/tokens.css`** — a copy of the desktop's. Both layouts read the
   same Figma variables, so colour, family and weight transfer directly. Only
   the dimension block differs.
3. **Figma MCP `get_design_context`** — for what only it can give:
   per-section typography and the contents of `INSTANCE` nodes, which the
   `.fig` decoder cannot expand.

One size is deliberately off-token. The designer left a note in the file
(`413:20597`): *"Aqui foi o único lugar que não apliquei style. A Joice tinha
pedido para diminuir um pouco o tamanho da fonte. Então saí de 48px, que era
um style, e apliquei 40px, que por sua vez não tem um style dentro do Figma."*

## Deployment

Both sites ship from one GitHub Pages artifact, assembled by
`.github/workflows/deploy.yml`: `poc/rawhtml/` at the root and this folder at
`mobile/`. There is deliberately **no `robots.txt` here** — it is only honoured
at the origin root, so one in a subdirectory would be dead weight that reads as
policy. The root one covers the whole site.
