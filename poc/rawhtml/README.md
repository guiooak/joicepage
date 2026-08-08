# poc/rawhtml

Zero-dependency implementation of the Joice Sperandio landing page, built to
match the Figma frame **Layouts › Finais › "Site desktop"**.

Hand-authored HTML, pure CSS, no JavaScript, no build step, no `node_modules`.

```sh
python3 -m http.server 8000
```

## Scope

**Desktop only.** There are no breakpoints and no mobile CSS anywhere in this
build — `body` holds `min-inline-size: 1440px` and the viewport meta is pinned
to the frame width. Mobile is a separate exercise against the `Mobile` frame.

## Sections implemented

Header · Hero · Credentials bar · Visão · Princípios · Serviços · Processo

All copy is transcribed verbatim from the mockup.

## Not yet built

The nav links to seven sections; four still need capturing from Figma:

- **Histórias** — testimonials
- **Sobre**
- **Dúvidas** — FAQ (the designer's comments show real questions, e.g. "A
  conversa inicial tem custo?", "Os atendimentos são presenciais ou online?",
  "Você executa os investimentos para mim?")
- **Footer**

Also missing: panel copy for five of the six Processo accordion items, which
are collapsed in the mockup and cannot be read from the canvas.

## How the values were obtained

Figma MCP requires **edit** access on the file; only view access is available,
so the design was read through the canvas UI. That splits the values into two
confidence levels, both recorded in `styles/tokens.css`:

**Exact** — read off Figma's properties panel:

| | |
|---|---|
| Type scale | all ten text styles, `size/line-height-%` |
| Content width | 1360px (frame 1440px, 40px gutters) |
| Section rhythm | `padding-top: 160px`, gap token `Sizes/72px` |
| Copy | transcribed from the rendered frame |

**Sampled** — measured off the rendered canvas, not from Figma variables:
every colour, the corner radii, and the font family. Each is a token, so
replacing it from source is a one-line change that touches no component CSS.

## Known gaps against the mockup

1. **The font is a substitute.** The Figma variable name was truncated in the
   view-only panel (`Typography/Font …`), so the real family is unknown. The
   fallback stack is wider than the design's face, so a few headlines wrap onto
   one more line than the mockup. This is the single largest visual difference
   and it resolves the moment the real woff2 lands.
2. **Colours are sampled, not exact.** Close, but not guaranteed to the hex.
3. **Images are placeholders** at the exact footprint they occupy in the
   mockup — hero portrait 700 × 760, Princípios photo 1360 × 710.
4. **The header is static, not sticky**, matching how the frame draws it. A
   static frame cannot express stickiness, so this is a literal reading; say
   the word if it should pin.

## What unblocks the rest

Edit access on `35gFTPRFgD9FZ0pwIxO3GL` for `guibrancopc@gmail.com`. That turns
`get_variable_defs` into exact tokens, `get_design_context` into exact geometry
per section, and `download_assets` into the real logo, icons and photos —
replacing every "sampled" value above in a single pass.
