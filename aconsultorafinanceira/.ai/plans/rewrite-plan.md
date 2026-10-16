# Plano: reescrever aconsultorafinanceira.com.br no sistema visual do joicesperandio.com.br

## Contexto

Hoje aconsultorafinanceira.com.br é um tema WordPress da Zelo Finanças (Bootstrap + Slick, azul `#199ECD`). A ideia é reconstruir a página como um app estático novo e isolado em `/aconsultorafinanceira`. O conteúdo e as fotografias continuam os mesmos, mas tudo é redesenhado com os tokens e componentes do joicesperandio.com.br (`raw/mobile`, `raw/web`).

Decisões já tomadas:
- **Duas páginas irmãs**, no mesmo modelo de `raw/`: a página mobile (canvas de 360) fica na raiz e a página desktop (canvas de 1440) em `/inicio/`. Cada uma escala com `zoom` e redireciona a outra com o head script já existente.
- **Sem formulários.** Os formulários de contato e de newsletter dão lugar ao bloco "conversa" da Joice: WhatsApp e mailto.
- **Nenhuma referência à Zelo Finanças.** Saem o logo, o menu, os links, as redes e o e-mail da Zelo. A marca passa a ser só a da Joice, e o único link externo de marca é para joicesperandio.com.br.
- **Fica só local.** Deploy, domínio e workflows ficam fora deste trabalho.
- **Identidade visual 100% Joice Sperandio.** Logo, cores, tipografia, ícones, selos, formas e componentes vêm todos do joicesperandio.com.br. **Nada** da identidade do site original nem da Zelo é reaproveitado: nem o azul `#199ECD`, nem círculos decorativos, nem as caixinhas de checklist, nem o selo CEA/CVM em bitmap, nem o ícone de aspas ou de WhatsApp/Gmail. Do site original entram **só o texto e as fotografias limpas** (fotos de pessoas e prints de conversa).
- **Isolado.** Nada fora de `/aconsultorafinanceira` é importado nem referenciado. Os arquivos compartilhados (fontes, logo, ícones) são **copiados** para dentro do app, como `raw/mobile` e `raw/web` já fazem entre si.

## Estrutura

```
aconsultorafinanceira/
  README.md            o que é, como rodar e as decisões acima
  originals/           as imagens baixadas do WordPress, nunca publicadas
  mobile/              página 360, servida em /
    index.html  404.html  robots.txt  sitemap.xml
    favicon.svg  favicon.png  apple-touch-icon.png
    assets/fonts/      allomira-variable.woff2, lora-latin(-ext).woff2  (copiadas de raw/mobile)
    assets/img/        logo.svg, arrow.svg, quote.svg, to-top.svg, social-*.svg (copiados) + as fotos novas
    styles/            tokens.css  base.css  sections.css  motion.css
    scripts/           motion.js
  web/                 página 1440, servida em /inicio/. Mesma estrutura, sem robots/sitemap/404
```

## Abordagem

### 1. Base copiada, sem nada reinventado
- Copiar `raw/mobile/styles/{tokens,base}.css` e `raw/web/styles/{tokens,base}.css` **como estão**. Nenhuma cor, tamanho de tipo, raio ou espaçamento novo: o azul `#199ECD` da Zelo não entra. Os tokens que nada usar são removidos no final.
- Copiar de `raw/*/index.html` o `<head>` (preload das fontes, head script de redirecionamento com `BREAK = 1024` e `?layout=`) e trocar nele a URL de produção, o título, a descrição e o JSON-LD.
- Copiar de `raw/*/styles/sections.css` e `raw/*/styles/motion.css` só os blocos dos componentes usados (lista abaixo), renomeando as classes de seção quando a seção mudar de papel.
- Copiar de `raw/*/scripts/motion.js` só o que for usado: o menu mobile, o carrossel de cards, os reveals de scroll e o diálogo de política. Saem o diálogo de vídeo e a parte de GA/consentimento (ver item 5).

### 2. Mapa das seções (original → componente da Joice)

| # | Original (WordPress) | Âncora | Componente da Joice reaproveitado |
|---|---|---|---|
| 0 | Faixa "Avaliação gratuita: Nosso primeiro encontro é por minha conta" + menu Zelo | — | `site-header` com `logo.svg` da Joice, âncoras internas e `btn--primary` "Agendar avaliação" para o WhatsApp. No mobile, o `menu__panel` (hambúrguer). A frase da faixa vira um `tag` no hero |
| 1 | Hero: "Investimentos com tranquilidade e segurança", subtítulo, lead, CTA, foto | `#inicio` | `hero`: foto com os blobs violeta em hard-light, `hero__title` e `hero__lead`, subtítulo em `--color-accent-text` e `btn--primary` "Vamos conversar" → `#contato` |
| 2 | Currículo: Joice Sperandio, credencial CVM 002276-4, "Online para todo o Brasil", 4 pilares (Experiência, Imparcialidade, Personalização, Disponibilidade), foto redonda e selo CEA/CVM | `#sobre` | Foto redonda da Joice. `credentials` com o `cred-cvm.webp` **da Joice** e a certificação CEA em texto, porque o bitmap de selos do site original sai. `tag` "Online para todo o Brasil" no lugar do emoji 🗺, e `principios__cards` com os 4 pilares e os `icon-0{1..4}` da Joice |
| 3 | Serviços: "Vamos conversar?", duas perguntas, parágrafo e 4 objetivos (Independência financeira, Projeto de vida, Aposentadoria e patrimônio, Organização e gestão de risco), mais a imagem composta | `#servicos` | `servicos__head` + `tag`, e 4 `service-card` com numerais Lora 01–04 e `service-card__claim`. **A imagem composta sai**: ela traz o círculo azul e as caixinhas de checklist do site original gravados no bitmap. A seção fica só com os cards, como os cards de serviço da Joice |
| 4 | "Entre tantas opções": 4 itens (Isenção garantida, Encontros online e presenciais, Metodologia prática, Conversa inicial gratuita) | `#metodo` | `processo__grid` (colunas numeradas). O item "Conversa inicial gratuita" ganha destaque igual ao de `processo-extras` |
| 5 | "Quem recomenda": 3 depoimentos com título, foto e nome | `#depoimentos` | `historias` + `depoimento` (`quote.svg`, foto redonda, título do depoimento como `tag`). Carrossel de dois cards no mobile, 3 lado a lado no desktop |
| 6 | Prints de conversas (4 imagens 502×886) | `#conversas` | Rail horizontal com scroll-snap no mobile (padrão do mobile da Joice) e fila de 4 escalonada no desktop, com `--radius-md`. `alt` descritivo em cada um |
| 7 | Contato: "Invista você também / Vamos conversar?", parágrafo, WhatsApp e formulário | `#contato` | `conversa`: foto 210 da Joice como avatar, `btn--primary` "Me chama no WhatsApp" → `https://wa.me/5547991939397` e mailto `oi@joicesperandio.com.br`. O formulário sai |
| 8 | FAQ: 10 perguntas com resposta | `#duvidas` | `accordion` em `<details>/<summary>` (`faq__grid`, `faq__list`), com a primeira aberta, igual ao FAQ da Joice |
| 9 | Rodapé da Zelo e newsletter | `#rodape` | `site-footer`: logo da Joice, WhatsApp, e-mail, Instagram/LinkedIn da Joice, link "joicesperandio.com.br", "Política de Privacidade" (diálogo), "© 2026 Joice Sperandio", `site-footer__totop`. A newsletter sai |

A ordem das seções, os textos e os títulos seguem o original. A única mudança é a adaptação de componente.

### 3. Conteúdo
- Transcrever o texto **na íntegra** a partir do HTML do site atual, incluindo as respostas do FAQ, que estão ocultas no DOM (já extraídas nesta análise).
- **Três edições mínimas para tirar a Zelo do texto.** O texto final vai para revisão no README:
  - "Planejadora Financeira da Zelo Finanças, Especialista em Investimentos…" → "Planejadora Financeira, Especialista em Investimentos…"
  - "…é criadora da Zelo Finanças, uma consultoria financeira focada em…" → "…é criadora de uma consultoria financeira focada em…"
  - `alt="Zelo Finanças Consultoria"` → `alt="Joice Sperandio"`
- Corrigir só o erro de crase evidente ("Apoio à pessoas" → "Apoio a pessoas") e registrar no README.
- Ao final, `grep -ri zelo aconsultorafinanceira/{mobile,web}` tem de retornar 0.

### 4. Imagens
- Baixar para `originals/`, sem o prefixo `zelofinancas-`, **só as 9 fotografias limpas**: `hero.webp` (retrato 718×946, fundo neutro), `joice-avatar.webp`, `depoimento-{ana-luiza,renato,kamila-tiago}.png` e `conversa-0{1..4}.webp`. Os dois arquivos que carregam identidade do site original (`curriculo-certificados` e `nossos-servicos`) **não** entram.
- Todos os elementos gráficos vêm de `raw/mobile/assets/img`: `logo.svg`, `quote.svg`, `arrow.svg`, `to-top.svg`, `social-*.svg`, `icon-0{1..4}.webp`, `cred-cvm.webp` e os favicons.
- Os arquivos que já são WebP vão para `assets/img/` **sem recodificar**, porque recompressão com perda só degrada. Os três PNG viram WebP com `cwebp -q 82`, a regra de `raw/`.
- Gerar `og.jpg` (1200×630) a partir da foto do hero.
- `favicon.svg`, `favicon.png` e `apple-touch-icon.png` são copiados da Joice.
- Ponto de atenção para o README: o hero tem só 718×946. No desktop ele fica nítido em 1x e um pouco mole em telas 2x. As duas fotos da imagem composta de serviços só voltam se houver os arquivos originais, sem a montagem.

### 5. Head, SEO e políticas
- Canonical, `og:url`, `og:title` e `og:description` apontam para `https://aconsultorafinanceira.com.br/`. O canonical da página desktop aponta para a raiz, como em `raw/web`.
- JSON-LD com `WebSite` + `Person`, com `sameAs` para joicesperandio.com.br, Instagram e LinkedIn, e a credencial CEA/CVM 002276-4.
- `robots.txt`, `sitemap.xml` e `404.html` ficam só em `mobile/`.
- **Sem analytics, logo sem barra de consentimento e sem política de cookies.** Só o diálogo `policy-modal` de privacidade, adaptado da Joice com troca de domínio e e-mail. Se depois quiser GA, `consent.js` entra igual ao da Joice.

### 6. Verificação
Adicionar em `.claude/launch.json` duas configurações, `acf-mobile` e `acf-web` (`python3 -m http.server` em cada pasta), e uma terceira que sirva uma cópia montada no scratchpad (`mobile/` na raiz e `web/` em `inicio/`) para testar o redirecionamento.

1. **Conteúdo:** um script compara cada frase do texto extraído do site atual com o HTML novo (as 10 respostas do FAQ e os 3 depoimentos). Zero ausências, fora as três edições listadas. `grep -ri zelo` = 0.
1b. **Identidade:** `grep -ri '199ecd'` = 0 em CSS, HTML e SVG. Toda cor no CSS de seção é `var(--…)` dos tokens copiados (sem hex solto). As screenshots não mostram nenhum elemento gráfico que não exista no joicesperandio.com.br.
2. **Integridade:** rodar à mão a mesma lógica de guarda de `.github/actions/site-build`: toda referência relativa no HTML existe, todo `url()` do CSS existe e os comentários do CSS estão balanceados.
3. **Layout:** no navegador do app, em 360, 390, 430, 834 e 1024 (mobile) e em 1280, 1440 e 1920 (desktop): sem scroll horizontal, sem erro no console, screenshots de cada seção.
4. **Redirecionamento:** na cópia montada, largura ≤1024 fica na raiz e >1024 vai para `/inicio/`. `?layout=` fixa a escolha.
5. **Sem JS:** com JavaScript desligado, todo o texto e todas as respostas do FAQ continuam legíveis, e o menu e o diálogo caem para `:target`.
6. **Links:** os CTAs de WhatsApp vão para `wa.me/5547991939397` e os mailtos para `oi@joicesperandio.com.br`. Nenhum link aponta para zelofinancas.com.br.

## Pendências para o README (fora do escopo)
- **Licença da Allomira:** é uma fonte comercial. Confirmar se a licença cobre um segundo domínio.
- **Revisão do texto:** confirmar as três edições que tiram a Zelo.
- Deploy e domínio (Firebase ou outro), Search Console e analytics.
