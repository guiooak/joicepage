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

**Simone [Sobrenome]** — `393:10527`
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

Still unwritten: **Frances [Sobrenome]** and **Rafael & [Parceira]**. Now
confirmed properly rather than inferred — four of the five `Depoimentos`
instances (`318:7447`, `318:7451`, `318:7448`, `318:7449`) were expanded, and
**none of them override the quote**: every one carries Alessandra's text. Only
the active name's Tags frame changes between states. So the desktop frame holds
exactly one written quote, and the other two came from the mobile annotations.

Ask Joice; the surnames are placeholders in the mockup too and need real names
before launch either way.

Two loose ends here, both small:

- The quote is drawn **28px Bold (H4)**, which the build does not currently
  match.
- Simone, Frances and Rafael each carry category tags that the build does not
  render (only Alessandra's are in). Reading them needs a full
  `get_design_context` on the parent instance — addressing the Tags sub-frame
  directly (`I318:7451;295:9360`) returns an empty node.

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

1. **Serviços list arrow** — still the one invented inline `<symbol>`. It is a
   VECTOR node, so it did not come out with the bitmap fills. Export and drop
   the `<defs>` block.
2. **`assets/img/og.jpg` does not exist** — `og:image` 404s, so WhatsApp and
   LinkedIn previews render imageless. Cheap, and it matters for a page whose
   lead capture *is* a WhatsApp link.
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

## Suggested order

| # | Task | Blocked on | Size |
|---|---|---|---|
| ~~1~~ | ~~Fix `motion.css` comment + balance assertion~~ | done `cfc4f04` | — |
| ~~2~~ | ~~Wire the two recovered testimonials (§4)~~ | done `cfc4f04` | — |
| 3 | Export the Serviços arrow, delete the inline symbol | — | small |
| 4 | Create `og.jpg` | — | small |
| 5 | Ask about hidden CTAs (§2) and `play-circle` (§3) | Joice / designer | — |
| 6 | Confirm the WhatsApp number, test `wa.me` on a phone | Joice | small |
| ~~7~~ | ~~FAQ + Processo copy (§5)~~ | done — it existed all along | — |
| 8 | Policy pages, GBP fields | Joice | medium |
| 9 | `figextract` visibility + overrides (§7) — also unblocks §8 | — | medium |
| 10 | TikTok and YouTube handles for the footer (§8) | Joice | small |
| 11 | Testimonial tags for Simone / Frances / Rafael (§4) | — | small |

Items 3 and 4 are what is left that is unblocked and self-contained. **The
launch blocker is gone** — the FAQ copy was never a writing task.

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
