# Plano de correção — desktop `raw/web` contra o Figma

## Context

A auditoria anterior levantou 5 bugs com consequência visível, 4 problemas de
asset e uma lista de divergências de tipografia, cor e higiene de CSS. Dois
itens ficaram bloqueados esperando o Figma e um terceiro estava marcado no
código como inferência.

O mockup foi duplicado para a conta paga do usuário, e **é esse o arquivo a
usar de agora em diante**:

```
fileKey  qbR4qsKh2ORznVybIlH7J6        (Joice Sperandio -Copy-)
página   157:1111  "Layouts"
```

A duplicata **preserva os ids** (`293:*`, `318:*`, `529:*`, `392:*`, `393:*`),
então tudo que já estava anotado continua resolvendo. A página tem cinco
seções; a de handoff é `529:2451` "DE PARA DESK", cujo frame é
`529:4112` "Site desktop" (1440 × 9969,33) — é contra ele que a auditoria mediu.

Com a cota fora do caminho, todos os itens bloqueados foram fechados e os
componentes que nunca tinham sido expandidos foram lidos. **Três achados mudam
o plano**, e dois deles corrigem afirmações minhas:

- **O card do Sobre tem sombra.** `box-shadow: 0 0 80px rgba(0,0,0,0.08)` no
  card 05 (`529:4348`), o topo da pilha. Eu havia lido só os cards 01–04 e
  concluído "nenhum tem efeito" — o 05 é nó irmão, fora do frame que empilha os
  outros quatro. O comentário que escrevi em `sections.css` nesta sessão afirma
  "NO effect" e **está errado**.
- **A citação do depoimento é H4**, `28px / 1.2 / weight 800`, não os
  `24px / 1.4` que estão no build. O bloco de 306 × 668 fecha em 9 linhas a 34
  de entrelinha, o que confirma.
- **O rodapé desenha quatro redes**, não duas: Instagram 24px, TikTok 20,
  LinkedIn 20, YouTube 20. Os dois SVGs que a auditoria chamou de órfãos estão
  no mockup. Decisão do usuário, reafirmada depois de ver isso: **remover
  assim mesmo** — vira divergência deliberada, documentada no código.

O resultado pretendido: a página desktop medindo igual ao frame, sem scroll
horizontal, e sem nenhum valor no CSS que seja chute.

**Onde salvar:** ao executar, copiar este arquivo para `.ai/plans/` no repo —
é onde os planos deste projeto moram.

---

## Decisões tomadas

- **Escopo:** tudo, Tier 1 → 4, um commit por tema.
- **Redes sociais:** remover `social-tiktok.svg` e `social-youtube.svg`,
  divergindo do mockup de propósito.
- **Baralho do Sobre:** confirmado no frame de QA — ver commit 5.

---

## Commit 1 — `interpolate-size` e o scroll horizontal (Tier 1.1)

O mais grave, e o que vem primeiro porque muda geometria que todo o resto mede
contra.

`base.css:140` declara `interpolate-size: allow-keywords` em `html`, com o
comentário de que "esse é o único lugar onde pode ser declarado". **Isso é
falso** — a propriedade é herdada e vale em qualquer ancestral. Declarada na
raiz, ela alcança `.service-card`, cujo `transition: flex-basis`
(`motion.css:152`) passa a interpolar a partir de `auto` e deixa o `flex-basis`
computado preso em `calc-size(auto, 0px + size)`. Os cards caem para largura de
conteúdo (1052,2 / 346,4 em vez de 899 / 437), estouram o grid de 1360 e
produzem `scrollWidth` 1463.

As larguras desenhadas estão confirmadas no frame de QA: `529:4189` **899** e
`529:4226` **437**, com 24 de gap = 1360.

**Correção:** mover a declaração de `html` para quem de fato precisa dela — o
accordion. Quem consome é `.accordion__item[open]::details-content`, que anima
`block-size: 0 → auto` (`@keyframes panel-open`, `motion.css:464`). Declarar em
`.accordion__item` cobre o elemento e o pseudo.

- `raw/web/styles/base.css:134-141` — tirar `interpolate-size` do bloco
  `html` e reescrever o comentário, que hoje afirma o contrário da spec.
- `raw/web/styles/motion.css` — declarar `interpolate-size: allow-keywords`
  em `.accordion__item`.

Os dois `@supports (interpolate-size: allow-keywords)` (`motion.css:415` e
`:436`) seguem válidos: testam suporte à propriedade, não onde foi declarada.

Corrigir também o comentário em `sections.css` que culpa o grid do Sobre pelo
overflow. O grid do Sobre é 1384 num shell de 1360 — merece nota própria, mas
não é ele que gera o scroll.

**Teste:** cards em 899 / 437 e `no horizontal scroll`.

---

## Commit 2 — âncora do `#contato` (Tier 1.5)

`#contato` (`index.html:503`) fica dentro de `#processo` (414–537), que declara
`--section-pad: 160px`. Como a variável herda,
`[id] { scroll-margin-top: calc(var(--size-48) - var(--section-pad, 0px)) }`
(`base.css:238`) resolve para **−112px** nesse id. Qualquer âncora futura
aninhada numa seção com padding tem o mesmo defeito.

**Correção** em `base.css:237-240` — separar os dois casos em vez de confiar no
fallback da variável:

```css
[id]          { scroll-margin-top: var(--size-48); }
.section[id]  { scroll-margin-top: calc(var(--size-48) - var(--section-pad, 0px)); }
```

Todas as seções que declaram `--section-pad` (`#visao`, `#servicos`,
`#processo`, `#historias`, `#sobre`, `#duvidas`) carregam `class="section"`
— conferido em `index.html:254-836` —, então a subtração continua valendo
exatamente onde valia.

---

## Commit 3 — primeiro item do FAQ aberto (Tier 1.2)

O Processo desenha e constrói um item aberto (`index.html:441` tem `open`); o
FAQ desenha um aberto e constrói os oito fechados (`index.html:866-929`). A
instância `529:4399` mede **820** contra os 720 construídos — os ~100px de uma
resposta aberta.

**Correção:** `open` no primeiro `<details class="accordion__item"
name="duvidas">`, linha 866. A exclusividade por `name` já garante que abrir
outro fecha esse.

---

## Commit 4 — o depoimento (Tier 1.3 + tipografia)

Fechado contra `529:4302` (a instância do frame de QA) e seus nós internos. O
bloco desenhado é **532** — conteúdo 1280 × 452 com 40 de padding em volta.

| elemento | desenhado | construído |
|---|---|---|
| citação | H4 `28px / 1.2` weight **800** | `--text-h5` 24px / `--leading-paragraph` 1.4, peso herdado (400) |
| linha de pessoa inativa | 76 (padding-block 24) | ~61 (padding-block 16) |
| linha ativa (com tags) | 148 | menor |
| gap nome → tags | 8 | 12 |
| separador | 1px `#e2e9eb` em cima **e embaixo** | só em cima, e nenhum no último |
| coluna de pessoas | 452 | 381 |
| bloco | 532 | 461 |

**Correções** em `raw/web/styles/sections.css`:

- `.depoimento__quote` (1055) — `--text-h4` / `--leading-h4` / weight 800.
  Pela regra de arredondamento do Figma (28 × 1,2 = 33,6 → **34**), escrever a
  entrelinha em **px**, não em razão. Isso muda a citação visivelmente: maior e
  bem mais pesada.
- `tokens.css` — não existe token de 800 (só `--weight-bold: 700` e
  `--weight-black: 900`). Adicionar `--weight-extrabold: 800`; Allomira é
  variável 100–900.
- `.depoimento__people li` — `padding-block` 16 → **24**, e fechar a coluna com
  uma borda embaixo do último item.
- `.depoimento__tags` (1108) — `margin-block-start` 12 → **8**.
- `.depoimento__tags span` (1154) — **manter** `--text-caption` /
  `--leading-tag`. A auditoria marcou esse par como inventado; ele não é:
  16 × 1 + 12 de padding = a pílula de 28 que o arquivo desenha (Caption a 1,5
  daria 36). O que falta é o comentário explicando isso.

**Alvo:** coluna de pessoas em 452, bloco em 532.

---

## Commit 5 — o baralho do Sobre (Tier 1.4 + a sombra)

Confirmado no frame de QA (`529:4313`), que é **idêntico** ao snapshot. O `-65`
que está no comentário de `motion.css:66` **não corresponde ao arquivo**. Os
cinco cards têm 158 de altura e tops progressivos, relativos ao topo do baralho:

```
card 01   top   0        \
card 02   top  30,33      |  três lombadas finas, sem conteúdo legível
card 03   top  66,33     /
card 04   top 106,33        texto visível, coberto embaixo pelo 05
card 05   top 212,33        inteiro por cima — e é o único com sombra
```

O render confirma: 01–03 aparecem como faixas de ~30–40px acima do 04, e o 05
pousa por cima de tudo. O build entrega cinco cards inteiros numa lista com 8px
de respiro e delega a sobreposição ao sticky, que só acontece durante a
rolagem — daí os 832 construídos contra os 466 do frame.

**Correções:**

1. **A sombra** — `box-shadow: 0 0 80px rgba(0, 0, 0, 0.08)` no card do topo da
   pilha, que em repouso é `.sobre__cards li:last-child`. Só nele: os cinco com
   esse halo viram borrão. É o item que originou esta conversa, e é o que faz a
   pilha existir contra um fundo da mesma cor do card.
2. **O repouso** — reproduzir os tops desenhados com margem negativa em
   `sections.css`, onde já mora a geometria (`.sobre__cards`, 1231):
   `margin-block-start` de −127,67 / −122 / −118 / −52 nos cards 2 a 5 (passo
   desenhado menos os 158 de altura). O `gap: var(--size-8)` atual sai.
3. **O comentário errado** — `sections.css:1245` afirma "NO effect… neither
   does the frame stacking them". Reescrever com o que foi lido: fill `#f4f7f7`,
   stroke 1px `#e2e9eb` (= `--color-line`, confirmado), raio 16, padding 32, e
   sombra `0 0 80px rgba(0,0,0,.08)` **no card do topo**.
4. **O `-65`** em `motion.css:66` — trocar pelos tops reais.

O sticky e o recuo por escala (`motion.css:71-105`) continuam: passam a operar
a partir de uma pilha em repouso em vez de uma lista. Verificar os dois estados
— parado e rolando — porque margem negativa e `position: sticky` interagem, e o
z-order tem que manter cada card por cima do anterior (a ordem do DOM já faz
isso).

**Alvo:** do topo do 01 à base do 05 = **370,33**. O Sobre encolhe ~460 e a
página converge para a altura do frame.

---

## Commit 6 — assets e atributos (Tier 2)

**6.1 — proporções erradas no markup.** `width`/`height` descrevem a caixa
desenhada, não o arquivo. O CSS sobrescreve o tamanho depois, então a
consequência é a caixa errada reservada no carregamento (CLS):

| arquivo | intrínseco | atributos | erro |
|---|---|---|---|
| `hero-joice.jpg` | 2200×1737 | 1358×750 | +43% |
| `principios.jpg` | 2000×1508 | 1360×710 | +44% |
| `sobre-main.jpg` | 1200×975 | 501×700 | −42% |

Corrigir para a proporção intrínseca (`index.html:194`, `:278`, `:792`),
mantendo o tamanho de exibição no CSS.

**6.2 — `sobre-thumb-3.jpg`.** 293×440, a única em retrato, numa caixa
paisagem de 210×150 com `object-fit: cover` — 52% do quadro descartado. As
outras duas são 615×440 e encaixam. Reenquadrar em paisagem, ou assumir o corte
com `object-position` escolhido em vez do centro padrão.

**6.3 — `icon-01.png`** é 119×120 contra 120×120 dos outros três. Reexportar
quadrado.

**6.4 — o ícone 03 do Princípios é desenhado a 32, não 40.** Achado novo:
`529:4161`, `529:4167` e `529:4177` são 40×40, mas `529:4171` (card 03,
"Prosperidade com propósito") é **32×32**. O build força os quatro a 40
(`sections.css:608-614`, `index.html:289-322`). O y do ícone e o do bloco de
texto não mudam, então é só o tamanho. Escopar o 40 e dar 32 ao terceiro.

**6.5 — redes sociais.** Remover `social-tiktok.svg` e `social-youtube.svg` de
`raw/web/assets/img/` (e conferir as cópias em
`raw/mobile/assets/img/`). O rodapé desenhado (`529:4400`) tem quatro
ícones — Instagram 24, TikTok 20, LinkedIn 20, YouTube 20, cada um numa pílula
de 8 de padding. **Deixar um comentário no rodapé registrando que a ausência é
deliberada**, para a próxima auditoria não reabrir isto como bug.

---

## Commit 7 — tipografia e cor (Tier 3)

A escala bate com as variáveis do Figma em todos os títulos e no corpo. Resta:

- **Tracking divergente no mesmo componente.** O `summary` do FAQ leva `0.01em`
  e o do Processo leva 0, e os dois compartilham `.accordion__item`. O
  componente desenhado (`529:4274`) define o título como **H5 24 / 1,2 /
  weight 500 / letterSpacing 0 / `#000000`** — o Processo está certo e o FAQ é
  o desviante. Unificar em 0.
- **`--color-line-strong` é uma armadilha de nome** (`tokens.css:84`): resolve
  para `--c-blue` (#5779aa), não para `--c-line-strong` (#587882), que existe e
  nunca é usado. O valor renderizado está certo — `Elements/Border/brand-subtle`
  é #5779aa — mas o nome mente. Renomear para o que ele é.
- **Tokens mortos** (zero usos, conferidos por grep): `--size-120`,
  `--c-violet-pale`, `--c-steel`, `--c-slate`, `--c-line-strong`,
  `--color-accent-soft`, `--text-tag`, `--page-gutter`. Remover — com duas
  ressalvas: `--leading-tag` **é** usado (a pílula do depoimento), então o par
  `--text-tag`/`--leading-tag` fica; e `--size-120` deve virar uso em
  `.sobre__play`, que escreve `120px` à mão duas vezes, em vez de ser apagado.

---

## Commit 8 — higiene (Tier 4, sem efeito visual)

- **Regras duplicadas:** `.conversa .tag` em `sections.css:955` e `:967`;
  `.video-modal__close:focus-visible` em `:1761` e `:1765`, com `opacity: 1`
  nas duas; `.sobre__num` em `:1263` e `:1282`.
- **Seletores que não casam com nada:** o bloco `.is-placeholder` inteiro
  (`:1785`), `.service-card__list svg` (`:750`), e as regras de `h4`/`h5` em
  `base.css:184-217` — o documento não tem nenhum dos dois (`grep -c` = 0).
- **O inverso:** `.sobre__col` e `.depoimento__who` são classes no HTML que
  nenhuma folha mira. Decidir entre estilizar ou tirar do markup.
- **Ícone do accordion:** o build desenha um mais/cruz de 16×16 com
  pseudo-elementos; o arquivo desenha o xmark a **24×24** (`I529:4274;121:2425`).
  Ajustar a caixa, mantendo a construção por pseudo-elemento.
- **Comentários que contradizem o código.** Dois já saem nos commits 1 e 5. O
  do card de Princípios pode ser fechado sem mudar código: `529:4160` é
  `rgba(255,255,255,0.9)` com `backdrop-blur 50` — que é exatamente o que
  `sections.css:596-603` faz. O comentário que fala em `#ffffff` é que está
  errado.
- **Números mágicos sem procedência:** os 6px da pílula de tag, o 1.5px do
  ícone do accordion, o `border-radius: 15px` do thumb do Sobre (1px fora do
  token de 16), o 50px do número do card. Documentar a origem ou trocar pelo
  token.

---

## O que foi verificado e está certo (não mexer)

Lido nesta sessão contra o arquivo novo, sem divergência:

- **Menu** (`529:4113`) — fill branco, borda 1px `#f4f7f7`, raio 24, padding
  16/24 e `drop-shadow(0 16px 10px rgba(87,121,170,.08))`. O build já tem os
  quatro (`sections.css:31-43`).
- **Botão** (`529:4282`) — `#5779aa`, raio 16, padding 12/24, texto 20/1,4
  `#f4f7f7`. Bate com `.btn` + `.btn--solid`.
- **Tag** (`529:4184`) — 36 de altura = 20 × 1,4 + 2×3 de padding + 2×1 de
  borda. Bate com `.tag`.
- **Card de Princípios** (`529:4160`) — branco a 90% sobre blur de 50, raio 16,
  padding 24. Bate.
- **Accordion do Processo** (`529:4274`) — H5 24/1,2/500, preto, header com
  padding-block 24, divisores em cima e embaixo. Bate, exceto o tamanho do
  ícone (commit 8).
- **Rodapé** (`529:4400`) — estrutura, textos, certificações, telefone, e-mail
  e links de política conferem. A única diferença são as duas redes.

---

## Verificação

Depois de cada commit, e no fim:

```
node tools/measure/measure.mjs raw/web 1440 "main > *, .conversa, .numeros, .site-footer"
```

A ferramenta já imprime o que interessa (`measure.mjs:173-187`): `scrollWidth`
contra `clientWidth`, altura da página e uma linha por seção, com os offsets
desescalados para comparar direto com o frame.

Critérios:

- `no horizontal scroll` em toda execução — hoje falha, e é o commit 1;
- larguras dos cards de Serviços em **899** e **437**;
- coluna de pessoas do depoimento em **452**, bloco em **532**;
- baralho do Sobre em **370,33** do topo do 01 à base do 05, e o Sobre
  encolhendo ~460;
- cada seção no padY desenhado, e a altura total convergindo para os
  **9969,33** do frame `529:4112`.

Além da medição, no navegador:

- `#contato` pelo menu para com a tag a 48 do topo, não 112 acima;
- o primeiro item do FAQ abre a página já aberto, e clicar noutro fecha ele;
- o accordion ainda anima nos dois sentidos depois do `interpolate-size` sair
  da raiz — é o único consumidor e o mais fácil de quebrar neste plano;
- a pilha do Sobre lê como pilha parada, e continua funcionando na rolagem.

---

## Itens que continuam em aberto

- **`529:4774`**, o nó que originou esta conversa, é um post-it de QA: "Faltou o
  text hover effect aqui no tittle Link". Há mais uma dúzia de post-its na
  seção `529:2451` (`529:4780` a `529:4850`) que nunca foram lidos — vale uma
  passada própria, fora deste plano.
- **Seção `529:5177` "Teste depoimento"** tem três variantes inteiras da página
  desktop. Não se sabe se alguma delas substitui o frame de handoff; se
  substituir, o depoimento e as alturas do commit 4 mudam.

## Memória a atualizar

`figma-mcp-starter-quota.md` — o arquivo passa a ser
`qbR4qsKh2ORznVybIlH7J6`, em conta paga, com os ids preservados. As notas sobre
cota do Starter e sobre a cópia Pro `kj4nWRhUjFSFcTXPS1v7dQ` não valerem para
os nós `529:*` ficam obsoletas.
