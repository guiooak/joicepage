# Joice Sperandio — Landing Page

Single-page landing site for Joice Sperandio, financial planner.

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

Then open <http://localhost:8000>.

## Status

The design tokens currently in `poc/rawhtml/styles/tokens.css` are **provisional**
— read off design screenshots, not extracted from Figma. Figma MCP access
requires *edit* rights on the file, which are pending. Once granted, the token
values get replaced from source. See the open questions at the end of the plan.
