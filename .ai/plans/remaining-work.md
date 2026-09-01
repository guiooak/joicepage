# Remaining work — Joice Sperandio landing page

Companion to [`joice-landing-page.md`](joice-landing-page.md), which stays the
architecture and decision record. This file is the sequenced task list for
finishing the build, written against `main` at `7e1aeb4`.

It exists because a deep re-check of the mockup on 2026-08-11 turned up five
things the decision record does not list — one of them a live bug — and
resolved two items it recorded as blocked.

## What the re-check actually verified

The mockup was read from two independent sources and cross-checked:

- `tools/figextract/site-desktop.spec.txt` — the decoded `.fig` snapshot.
- `tools/figextract/figma-mcp-layouts-tree.xml` — the full node tree of the
  **Layouts** canvas (`157:1111`), pulled live through the Figma MCP server.
  133 KB, 283 text nodes, all three sections (Gui / Finais / Mobile).

Two results worth recording before the task list:

**No design drift.** All thirteen top-level children of `Site desktop`
(`318:7275`) match the `.fig` snapshot exactly — same order, same offsets, same
sizes, down to `big-numbers @40,6495.33`. The snapshot is still current and can
keep being trusted as the geometry source.

**The MCP tree carries visibility state the `.fig` dump does not.** This is the
one thing the tree adds that `figextract` cannot currently give: every node
reports `hidden`. That is how items 2 and 3 below were found, and it is worth
re-pulling the tree (one MCP call) after any significant design change.

> Quota note: the Figma account is **Starter — six MCP tool calls per month**,
> already spent for August 2026. The tree above was captured with one of them
> and written to disk precisely so it does not have to be fetched again — it is
> still **untracked**, and committing it should be part of the next commit.
> Read that file first; treat a live MCP call as a scarce resource.

---

> **Status, 2026-08-12.** Items 1 and 4 are done (`cfc4f04`). Mobile was
> built against `MOBILE 360px` and then reverted (`d750c35`) — it moves to a
> separate project, and this page is desktop-only again. The eight commits
> are still in history if that project wants a starting point; they were
> measured pixel-exact against the frame wherever the copy matched.
>
> Mobile did leave three things behind that belong to desktop, all kept:
> the two testimonials below, the `motion.css` fix, and the finding that the
> footer carries a social row and `Telefone:`/`Email:` labels — see §8.

## 1 · ~~Fix the broken comment in `motion.css`~~ — DONE (`cfc4f04`)

`poc/rawhtml/styles/motion.css` has **nine `/*` against ten `*/`**. The comment
opened at line 79 closes at line 83, and lines 84–88 are prose sitting in the
stylesheet as code, terminated by a second `*/`:

```css
     attribute, so the whole transition lives here. */   <- closes here
     The open/collapsed widths themselves live in sections.css, since they
     ...
     columns silently never swapped. */                  <- stray second close
  @media (prefers-reduced-motion: no-preference) {
    .service-card { transition: flex-basis 420ms cubic-bezier(0.4, 0, 0.2, 1); }
  }
```

The CSS parser reads the prose as the start of a qualified rule, scans forward
for a block, and takes the `@media`'s braces as that block. Confirmed by
parsing the file with postcss: the prose becomes a rule **selector**, with
`.service-card` nested inside it as its only child. A browser discards a rule
with an invalid selector along with its whole block — so
`transition: flex-basis` never reaches the page.

Effect: **the Serviços card open/collapse tween does not run.** The widths in
`sections.css` (`flex: 0 0 437px` / `flex-basis: 899px`) still apply, so the
cards do swap — instantly, with no animation. It fails silently and looks like
a design choice, which is why it survived review.

Fixed by deleting the stray `*/` and merging the prose back into the comment.
Confirmed by measurement, not by eye: the computed transition on
`.service-card` is now `flex-basis 0.42s cubic-bezier(0.4, 0, 0.2, 1)`, where
it was previously absent.

The class of bug is now guarded rather than just the instance — the deploy
workflow asserts comment balance across `styles/*.css` before upload:

```sh
for f in poc/rawhtml/styles/*.css; do
  [ "$(grep -o '/\*' "$f" | wc -l)" = "$(grep -o '\*/' "$f" | wc -l)" ] \
    || { echo "unbalanced CSS comment in $f"; exit 1; }
done
```

`tokens.css` (38/38), `base.css` (4/4) and `sections.css` (53/53) are clean.

## 2 · Decide on two blocks the mockup hides but the build renders

Both are `hidden="true"` in the live file. The `.fig` dump does not record
visibility, so the build had no way to know:

| Node | Build element | Content |
|---|---|---|
| `318:7313` — PROCESSO › content › **paragrafo** | `.processo__close` | "A conversa inicial é simples…" + *Agendar uma conversa* button |
| `318:7347` — SOBRE › Card › right › content › **Action** | `.sobre__actions` | The two 217/218 buttons |

`318:7313` also sits at `y=676` inside a parent only 650 tall — positioned
outside its own frame, which reads like something set aside rather than
composed.

This is a judgement call, not a defect, so it is **not** being changed
unilaterally. Three readings, and they point different ways:

- *Deliberate.* The designer removed a redundant CTA — the section is
  immediately followed by the full-width `paragrafo` CTA block (`345:7214`,
  1360×550) carrying the same "Tudo começa com uma conversa" message and the
  same button. Two CTAs 500px apart is a real redundancy.
- *Leftover.* Hidden while iterating and never restored.
- *Conversion.* Removing CTAs from a lead-gen page is the kind of change worth
  a second opinion regardless of intent.

Recommended: **ask Joice or the designer**, and until then leave the build as
it is. Rendering an extra CTA is the cheaper error.

## 3 · The `play-circle` on the Sobre photo is missing from the build

`318:7382` — a 120×120 play affordance (100×100 circle vector + 30×40
triangle), centred on the 501×700 panel in the Sobre collage. **Not hidden.**
It is absent from `index.html` and from `sections.css`.

It implies a video that does not exist anywhere in the repo or the Figma file.
Two paths:

- If there is a video: get the file or the URL, render the button as a real
  control, and decide hosting (self-hosted `<video>` keeps the zero-dependency
  rule; a YouTube embed breaks it and adds third-party JS to a page that
  currently has 159 lines of its own).
- If there is not: leave it out. A play button that plays nothing is worse than
  a plain photograph.

Blocked on Joice either way. Do not draw a decorative play button.

## 4 · ~~Two more testimonials are recoverable~~ — DONE (`cfc4f04`)

The decision record says one testimonial exists and the rest are placeholders.
That is true of the desktop frame, where `Depoimentos` (`318:8414`) holds five
instances all named "Alessandra" whose text lives in instance overrides the
metadata does not expand. But the **mobile annotation frames** draw the
component in different active states, and the text is readable there.

Matching each quote to the name sitting in the active (`y=0`) slot of its
`Names` list:

**Simone Maudonnet** (drawn as "Simone [Sobrenome]") — `393:10527`
> Desde 2023, conto com o acompanhamento da Joice para organizar minha vida
> financeira e tomar decisões com mais segurança. O que mais valorizo é o
> cuidado e a personalização em cada etapa.

**Luiz & Lívia** — `393:10575`
> A Joice transformou números espalhados em decisões mais conscientes. A
> organização financeira e dos investimentos trouxe clareza sobre nossas
> prioridades, aposentadoria e construção de patrimônio. Tudo de forma simples
> e aplicável ao nosso dia a dia.

Both are now `data-quote` attributes on their `<li>` in `.depoimento__people`.
`scripts/motion.js` already switched on any element carrying `data-quote`, so
the carousel went from one live entry to three with no change to the script.

~~Still unwritten: the **quotes** for Frances and Rafael.~~ **WRONG — and
this section was wrong the same way §5 was.** It claimed four of the five
`Depoimentos` instances had been expanded and that none overrode the quote,
so the desktop frame held exactly one. The frame holds **five**, one per
instance, and all five are now in the build.

The claim came from `get_design_context` returning nothing for those
instances. That is the §7 blind spot, not an absence: the quotes live in each
instance's `symbolData.symbolOverrides`, keyed by `guidPath`, which no
metadata dump expands. Decoding the `.fig` and reading that field directly
gives all five in one pass, no MCP call and no quota:

| Instance | Active | Quote opens |
|---|---|---|
| `318:7447` | Alessandra | *(no override — the component default)* |
| `318:7451` | Frances | "Eu queria entender melhor meus investimentos…" |
| `318:7448` | Simone | "Desde 2023, construímos uma parceria…" |
| `318:7449` | Rafael | "Quando iniciamos a consultoria… como casal…" |
| `318:7450` | Luiz & Lívia | "O trabalho da Joice nos ajudou…" |

Which person an instance shows is not inferred. Each overrides `visible` on
the five `Tags` frames and switches exactly one on — `295:9354` Alessandra,
`295:9360` Frances, `295:9366` Simone, `295:9372` Rafael, `295:9378` Luiz &
Lívia. Two of the five cross-check independently against the mobile
annotations above, which draw the same testimonials in shorter form.

The lesson is the one §5 already recorded, and it has now cost two passes:
**an instance that reads empty means unresolved, never empty.** The next
person who hits this should decode the `.fig` and walk `symbolOverrides`
rather than believe a metadata dump. That is item 9, and it is worth doing
properly in `extract.py` now that the shape is known.

The desktop page carries the desktop frame's own wording. Simone's and Luiz &
Lívia's were previously the *mobile* frame's shorter variants — the only ones
readable at the time — and are now the longer desktop text.

The **names** are no longer open. Joice supplied all four, and they are in
both builds: Alessandra Vizcarra, Frances Fonseca, Simone Maudonnet, Rafael
Coelho. Note the last is a correction, not just a surname — the frame draws
"Rafael & [Parceira]" as a couple and the entry is one person. Luiz & Lívia
was already real and is unchanged.

Two loose ends here, both small:

- The quote is drawn **28px Bold (H4)**, which the build does not currently
  match.
- ~~Simone, Frances and Rafael each carry category tags the build does not
  render.~~ **Done.** All five sets are in, from the same override walk —
  including the two slots no instance overrides, which fall back to the
  component's own tag text. Only the active entry's are shown, which is how
  the file draws it.

  One consequence worth knowing: the frame lays those four tag sets out 678
  wide on a single row, inside a column this page has only 480 of, so they
  wrap to two rows where Alessandra's fit one. The block reserves two rows in
  every state rather than resizing every 7s as the carousel advances, which
  puts it at 461 against the 425 the frame draws for the one state it draws.
  See the comment on `.depoimento__tags` in `sections.css`.

## 5 · ~~FAQ copy — confirmed missing~~ — WRONG, and now DONE

**This section was wrong, twice, and the mistake is worth recording.** It said
the FAQ copy did not exist, on the strength of two sources agreeing that the
eight `FAQ` nodes were empty. Both sources were blind in the same way: they
were **instances**, and neither the `.fig` decoder nor `get_metadata` on a
parent expands instance overrides. "Empty" meant "I cannot see inside", not
"nothing is there".

All eight Q&A pairs and all six Processo panels existed the whole time, in the
detached instances the Desktop section's arrows point at. They came out with
`get_design_context`, which does expand overrides. `grep -c "A capturar"` →
**0**.

Two lessons for the next extraction:

- A childless `INSTANCE` in a metadata dump means **unresolved**, never empty.
  Only `get_design_context` — or §7's override walker — settles it.
- `get_metadata` *does* expand an instance when called **directly on that
  instance**, and text shows up in node names. That is far cheaper than
  `get_design_context` for reading copy, and it is how the Depoimentos states
  were checked.

## 6 · Carry-overs already recorded, still open

Unchanged from the decision record, restated so this file is self-sufficient:

1. ~~**Serviços list arrow**~~ — done `8da4d28`. It was invented: a 24 viewBox
   at stroke-width 1.5 with round caps, against the real 32 viewBox at
   stroke-width 2 with a mitred, subtly curved head. Exported from `392:8193`
   to `assets/img/arrow.svg` in both folders, referenced with `<img>` as this
   codebase already does for `quote.svg`, and the `<defs>` carrier is gone.
   Note it was thirteen instances on desktop, not twelve — the 90px
   `.service-card__arrow` in the card corner used the same symbol.
2. ~~**`assets/img/og.jpg`**~~ — done `8da4d28`. Composed at 1200x630 from the
   page's own materials: the real Allomira and Lora files, the real palette,
   the brand lockup as the header draws it, the `og:description` as the lead,
   and `hero-joice.jpg`. Rendered through headless Chrome and downsampled,
   74KB, duplicated into both folders like every other asset.
3. **Confirm the WhatsApp number.** Drawn `+55 47 9193-9397`, eight digits after
   the DDD; the mobile frame draws the same, so the file does not settle it.
   The build assumes `+55 47 99193-9397` in both the footer link and the
   JSON-LD `telephone`. A wrong `wa.me` link fails silently — test on a phone.
4. **Policy pages.** `/politica-de-cookies` and `/politica-de-privacidade` are
   linked and do not exist.
5. **Google Business Profile fields** — exact business name, phone, www vs
   non-www, service-area vs address, Maps short link for `sameAs`. NAP mismatch
   costs the local-pack association.
6. **Sobre card deck** — the drawn overlapping offsets (auto-layout gap −65) are
   approximated by the sticky stack rather than reproduced.

## 7 · Optional: teach `figextract` to read visibility and instance overrides

Two capabilities the tool lacks, both of which cost a scarce MCP call to work
around today:

- ~~**`hidden` flags.** Item 2 above was undetectable from the `.fig` dump.
  Highest value per unit of effort — it is one field.~~ **Done** — `extract.py`
  now tags switched-off nodes `HIDDEN`, and takes its root frame as an
  argument so it can dump the mobile page too.
- **INSTANCE expansion** via `symbolData` / `overrides`. This is what hides the
  five testimonials, the six Processo panels, and the Menu and footer contents.
  Item 4 was recovered only because the designer happened to draw the mobile
  states separately.

  §4 has now done this by hand and the shape is no longer a guess. On a node,
  `symbolData.symbolOverrides` is a list; each entry has a `guidPath.guids`
  naming the sub-node it targets, and carries whichever fields it overrides —
  `textData.characters` for copy, `visible` for switched rows. Unset slots
  fall through to the master component, reachable via
  `symbolData.symbolID`. Resolving a node is therefore: read the master,
  then apply the instance's overrides by `guidPath`. That is the whole of it,
  and it wants to live in `extract.py` rather than be rediscovered a third
  time.

With both, the `.fig` route becomes fully self-sufficient and the six-call
monthly quota stops being on the critical path.

## 8 · The desktop footer is missing content the mobile frame revealed

Found while building mobile, and worth keeping now that mobile is gone.

The desktop footer (`318:7401`) is an **unexpanded instance** — the `.fig`
export cannot resolve it, which is why its contents were originally recovered
by reading the design rather than the file. The mobile footer (`392:8392`) is
the same component drawn expanded, and it carries two things the desktop
build does not have:

- **`Telefone:` and `Email:` labels** (`392:8402`, `392:8405`) above each
  value, where the desktop build lists the contacts bare.
- **A social row** (`392:8409`): Instagram, TikTok, LinkedIn and YouTube, with
  Facebook and X drawn hidden.

Whether the *desktop* footer carries them is genuinely unknown — the instance
will not expand, and the desktop build is verified against a drawn 396px
footer that has no room for an extra row. So this is blocked on the same
INSTANCE-override work as §7, not on a decision.

Two of the four social URLs are known and already in the JSON-LD `sameAs`
(Instagram, LinkedIn). **TikTok and YouTube are not** — get the handles from
Joice rather than guessing, since a wrong one ships a 404 in the footer.

## 9 · Found while building the mobile page

Three things the mobile frame raises that only the designer can settle.

**The FAQ's second answer is a copy-paste, not an answer.** `393:10620` is the
only state anywhere in the file that draws "Como saber se preciso de
planejamento financeiro ou consultoria em investimentos?" open, and its
override repeats question 1's answer word for word. Every other mobile answer
is its own, and shorter than the desktop's. Shipping the duplicate would put
the same paragraph under two different questions, so `poc/htmlonly-mobile`
carries the **desktop's** answer to that question with a comment saying so.
One line from the designer replaces it.

**`play-circle` again, on mobile.** `392:8315`, 49.77, centred on the Sobre
collage panel — the same open question as §3 and left out for the same
reason. If the answer is "there is a video", both builds need it.

**The Sobre deck hides three cards by design.** `392:8344` stacks four 204-tall
cards 71 apart (a −133 auto-layout gap), so only the first line of copy on
cards 01–03 is visible, with their numerals cut off below the fold of each
card. `poc/htmlonly-mobile` reproduces it exactly, and the design's own
screenshot of the node confirms that is what is drawn. Worth confirming it is
intended as a static stack rather than a scroll-driven reveal that the frame
cannot express — the desktop has the same construction at gap −65 and the
desktop build stood it up as a flat list instead (§6).

## Suggested order

| # | Task | Blocked on | Size |
|---|---|---|---|
| ~~1~~ | ~~Fix `motion.css` comment + balance assertion~~ | done `cfc4f04` | — |
| ~~2~~ | ~~Wire the two recovered testimonials (§4)~~ | done `cfc4f04` | — |
| ~~3~~ | ~~Export the Serviços arrow, delete the inline symbol~~ | done `8da4d28` | — |
| ~~4~~ | ~~Create `og.jpg`~~ | done `8da4d28` | — |
| 5 | Ask about hidden CTAs (§2) and `play-circle` (§3, §9) | Joice / designer | — |
| 6 | Confirm the WhatsApp number, test `wa.me` on a phone | Joice | small |
| ~~7~~ | ~~FAQ + Processo copy (§5)~~ | done — it existed all along | — |
| 8 | Policy pages, GBP fields | Joice | medium |
| 9 | `figextract` visibility + overrides (§7) — also unblocks §8, and §4 has now proved the shape | — | medium |
| 10 | TikTok and YouTube handles for the footer (§8) | Joice | small |
| ~~11~~ | ~~Testimonial tags for Simone / Frances / Rafael (§4)~~ | done — same override walk as the quotes | — |
| 12 | Real answer for mobile FAQ question 2 (§9) | designer | small |
| ~~13~~ | ~~Confirm the Sobre deck is a static stack (§9)~~ | answered — see §10 | — |
| ~~14~~ | ~~Route phones and tablets to the mobile page~~ | done `c16d2a1` | — |
| ~~15~~ | ~~Stand the Sobre deck up and pile it on scroll (§10)~~ | done `4b6eae2` | — |
| ~~16~~ | ~~Build the mobile motion layer~~ | done `431601d` | — |
| 17 | Revisit the desktop Sobre deck against §10 | — | small |

**Nothing unblocked and self-contained is left.** Items 3 and 4 were the last
two, and both shipped in `8da4d28`. Everything still open in the table waits
on Joice or the designer, except item 9 — teaching `figextract` to expand
INSTANCE overrides — which is unblocked but is tooling rather than a
launch item, and which item 8 depends on.

Item 17 is the one thing this round opened rather than closed. `poc/rawhtml`
already lays its five Sobre cards out flat and piles them with sticky, which
is the same answer `poc/htmlonly-mobile` now gives — but the desktop's depth
ramp, its sticky offsets and its `--header-height` allowance were all tuned
against a deck it believed was a static drawn overlap. Now that §10 has named
the component, the two are worth reading side by side to check they are
telling the same story at the two widths.

## 10 · The Sobre deck is a two-state interaction, not a static stack

Item 13 asked whether the overlapping deck was meant to be static. It is not,
and `Gui › Interactions` `293:7721` settles it: the group draws the deck
**twice** — five cards overlapping at one line of copy each (`293:6772`,
554×466) and the same five spread and fully readable (`293:6799`, 554×956),
under the heading "Stack". The drawn section frame is the *collapsed*
keyframe of that pair.

So the mobile page currently ships a state nobody can read: cards 01–04 show
a 71px strip each, and because `.sobre__num` is centred in a 204-tall card,
even the numerals sit below the cut. Nothing is broken — the interaction was
never built, and neither `styles/motion.css` nor `scripts/motion.js` exists
beyond a stub.

This also reopens §6's note that the desktop build "approximated" its own
−65 deck as a flat list. Both builds are drawing one half of the same
two-state component, and both should stand it up the same way.

The constraint on any fix: the drawn frame **is** the collapsed state and
both builds are verified against it, so the resting geometry may not move.
The spread has to be a layer on top of it, and under
`prefers-reduced-motion: reduce` the cards still have to be readable — a
stack that cannot be expanded is not an acceptable fallback.

Quota is no longer the constraint either. The file was duplicated into a Pro
team (`kj4nWRhUjFSFcTXPS1v7dQ`), which is 200 calls/day against the original's
6/month. Node IDs survived the duplicate, so every id in this document still
resolves. Mind that the copy is a **snapshot**: the designer's file is still
the live one.

## Re-verification after any of this

Unchanged from the decision record — the checks that matter here are the first
and the last:

1. `cd poc/rawhtml && python3 -m http.server` — confirm it still works with JS
   disabled. Non-negotiable.
2. Confirm the Serviços cards *animate* rather than snap (the observable §1
   restored; regression-guarded by the workflow's comment-balance assertion).
3. Lighthouse throttled: 100 SEO / 100 A11y, LCP < 2.5s.
4. Rich Results Test — `Person` and `FinancialService` parse.
5. `curl` the deployed URL: every word present in the initial response.
6. Compare against `Site desktop` at 1440px.
