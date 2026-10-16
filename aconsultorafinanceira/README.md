# A Consultora Financeira — aconsultorafinanceira.com.br

A rewrite of <https://aconsultorafinanceira.com.br/>, a WordPress landing page,
as a static app in the joicesperandio.com.br visual system. The content and
photographs are the old site's. Everything visual is the Joice Sperandio
system: tokens, type, components, logo and icons.

The plan this was built from is in
[`.ai/plans/rewrite-plan.md`](.ai/plans/rewrite-plan.md).

**Review app:** <https://guiooak.github.io/joicepage/aconsultorafinanceira/>
(desktop at `…/inicio/`) on GitHub Pages, served `noindex` — see
[Publishing](#publishing).

## Layout

```
.ai/plans/   the approved plan
build.sh     checks, assembles and neutralises the app for publishing
originals/   the photographs as downloaded from the old site — kept, never deployed
mobile/      360 canvas, served at /           (built from ../raw/mobile)
web/         1440 canvas, served at /inicio/   (built from ../raw/web)
```

It is the same split as `../raw/`, for the same reasons: two sibling pages,
each scaling one fixed canvas with `zoom`, each sending the other's visitors
across with a small head script (`<= 1024` stays on the mobile page,
`> 1024` goes to `/inicio/`, `?layout=mobile|desktop` pins a choice for
the session). `robots.txt`, `sitemap.xml` and `404.html` live in `mobile/`
only, because it is the root.

**Isolated.** Nothing here references anything outside this folder. The
fonts, the logo, the icons and the credential marks are **copied** from
`../raw/`, and `styles/tokens.css` and `styles/base.css` are verbatim copies
of raw/'s. A change to the Joice system has to be copied across by hand.

## Running it

No install, no build:

```sh
cd aconsultorafinanceira/mobile && python3 -m http.server 8010
```

```sh
cd aconsultorafinanceira/web && python3 -m http.server 8011
```

Open <http://localhost:8010/?layout=mobile> or
<http://localhost:8011/?layout=desktop>. The `?layout=` pin stops the
handover script from redirecting: each folder served on its own has no
sibling to redirect to. To run it the way it will be served, with the
handover, assemble a copy with `mobile/` at the root and `web/` at `inicio/`:

```sh
rm -rf /tmp/acf-site && mkdir -p /tmp/acf-site/inicio && cp -R aconsultorafinanceira/mobile/. /tmp/acf-site/ && cp -R aconsultorafinanceira/web/. /tmp/acf-site/inicio/ && python3 -m http.server 8012 --directory /tmp/acf-site
```

Then open <http://localhost:8012>.

## Publishing

It shares the **joicepage** GitHub Pages site, at a subpath: Pages serves one
site per repository, and the root of this one is the Joice review app.

| Joice review app | `guiooak.github.io/joicepage/` and `/inicio/` |
|---|---|
| **This app** | `guiooak.github.io/joicepage/aconsultorafinanceira/` and `…/inicio/` |

`.github/workflows/deploy.yml`, the Pages workflow, builds the Joice site as
before and then runs [`build.sh`](build.sh). The script checks both folders the
way joicepage's build action does, copies `mobile/` to
`_site/aconsultorafinanceira/` and `web/` to `…/inicio/`, and neutralises the
copy as a review app. That means `noindex` with crawling left open, every
`aconsultorafinanceira.com.br` URL rewritten to the Pages address so the
canonical is self-referential, and `robots.txt`, `sitemap.xml` and `404.html`
dropped, because none of them means anything at a subpath. The domain is still
the WordPress site, which is why. The smoke test then checks both URLs live.

To try the publishing build locally:

```sh
bash aconsultorafinanceira/build.sh /tmp/acf-out https://example.test/aconsultorafinanceira
```

**Firebase is not involved.** `firebase.yml`, `firebase.json` and the shared
`site-build` action never see this folder, so production never carries it.
But `firebase.yml` runs on **every** push to `main`. A push that only changes
this app still redeploys joicesperandio.com.br, with identical content. A
`paths` filter on `firebase.yml` would stop that; it has deliberately not been
added yet.

## Decisions

- **Visual identity is 100% Joice Sperandio.** No colour, shape, icon or
  bitmap from the old theme or from Zelo Finanças is used. Two of the old
  site's images are left out for that reason: the services collage, which has
  the old theme's blue circle and checklist cards baked into the bitmap, and
  the CEA/CVM badge strip. The CVM and MBA marks are Joice's own. CEA is set
  in type, because the Joice assets have no CEA mark.
- **No reference to Zelo Finanças.** The menu, the logo, the links, the social
  profiles and the e-mail are Joice's. The one outward brand link is
  joicesperandio.com.br, in the footer.
- **No forms.** The contact form and the newsletter posted to WordPress. They
  are replaced by WhatsApp (`wa.me/5547991939397`, the old site's number) and
  `oi@joicesperandio.com.br`.
- **No analytics.** So there is no consent bar and no cookie policy. The
  privacy policy says so. If GA is wanted, `../raw/*/scripts/consent.js` and
  its cookie-policy dialog are the pattern to copy.
- **Section labels.** The eyebrow tags (Sobre, Serviços, Método, Depoimentos,
  Dúvidas, Invista você também) are the Joice pattern. Where the old page had
  no label, the tag is the section's menu name.

## Copy changes against the old site

Everything else is verbatim, including the ten FAQ answers.

| Where | Old | New |
|---|---|---|
| Sobre, credentials | Planejadora Financeira **da Zelo Finanças**, Especialista… | Planejadora Financeira, Especialista… |
| Pillar "Experiência" | …é criadora **da Zelo Finanças, uma** consultoria financeira… | …é criadora **de uma** consultoria financeira… |
| Pillar "Personalização" | Apoio **à** pessoas físicas… | Apoio **a** pessoas físicas… (crase) |
| Hero photo `alt` | Zelo Finanças Consultoria | Joice Sperandio |
| Footer | ©2026 Zelo Finanças | ©2026 Joice Sperandio |

The old header strip ("Avaliação gratuita: Nosso primeiro encontro é por
minha conta. Entre em contato e agende já a sua avaliação") is split across
the hero tag and the hero note (mobile) or caption (desktop).

## Images

`originals/` holds the nine photographs as downloaded. The ones that were
already WebP ship as they are, because recompressing a lossy file only loses
more. The three testimonial PNGs ship as WebP at q82, the `../raw/` rule.
`og-v1.jpg` is the portrait over `--c-ink` with the wordmark, built from
`originals/hero.webp`; bump the filename if it changes, since share sheets
cache by URL.

The hero portrait is only 718×946. It is sharp at 1x and slightly soft on
2x screens, at both widths. A larger export from the original shoot would
fix that.

## Open items

- **Copy review.** Joice should confirm the three wording changes above.
- **Privacy policy.** Standard LGPD wording, not legal advice. Have it
  reviewed.
- **Production deploy.** Only the GitHub Pages review app exists, and a
  subpath of another site cannot carry a custom domain. Putting
  aconsultorafinanceira.com.br on this means a second Firebase Hosting site in
  the `site-joice-sperandio` project, with its own target and a workflow
  filtered to this folder (`build.sh … production` skips the neutralising).
  Firebase is deliberately untouched for now.
- **Bigger hero photograph**, see Images.
