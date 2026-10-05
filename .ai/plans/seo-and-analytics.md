# SEO e Google Analytics — avaliação e plano

Avaliação feita em 2026-10-04 contra o site no ar (`joicesperandio.com.br`,
commit `974a319`), com Lighthouse 13.5 e inspeção do HTML das duas páginas.

## Onde o site está hoje

A base técnica já é boa — o que falta é menos "consertar" e mais
**dizer ao Google quem a Joice é e onde ela atende**, e **medir**.

| Já está certo | Evidência |
|---|---|
| HTML estático, todo o texto na primeira resposta | sem dependência de JS para conteúdo |
| HTTPS + HSTS; `http://` e `www` redirecionam (301) para o domínio | conferido com `curl` |
| `<title>`, `canonical`, Open Graph, `lang="pt-BR"`, um único `<h1>` | nas duas páginas |
| `robots.txt` aberto e `sitemap.xml` publicados | 200 no domínio |
| Par desktop/mobile anotado (`rel="alternate"` ↔ `canonical`) | padrão Google para URLs separadas |
| Performance: mobile 91, LCP 3,2 s; desktop LCP 0,7 s | depois do WebP (`974a319`) |
| Lighthouse SEO: desktop **100**, mobile **92** | o 92 é o canonical — ver item 3 |
| Cópias de revisão neutralizadas | github.io com `noindex`; web.app/firebaseapp com canonical para o domínio |

## O que falta, por prioridade

### P0 — impacto direto, baixo esforço (código)

1. **JSON-LD ausente na página mobile.** Só o desktop tem os dados
   estruturados (`Person` + `FinancialService`). O Google indexa pela versão
   **mobile** (mobile-first indexing) — então, na prática, ele não vê nenhum.
   Copiar o bloco para `raw/mobile/index.html`.

2. **Enriquecer os dados estruturados** (nos dois):
   - `Person`: `image` (foto), `email`, `hasCredential` com CFP®, CEA e o
     registro CVM 002276-4 — credenciais são o maior sinal de confiança
     (E-E-A-T) num tema de finanças ("Your Money or Your Life").
   - `FinancialService`: `image`, `logo`, `email`, `address`
     (cidade/UF) e `areaServed` — hoje só diz "Brasil".
   - Novo nó `WebSite` com `name` — é o que o Google usa para o nome do site
     no resultado de busca.
   - Validar no Rich Results Test depois do deploy.

3. **Meta description com 198 caracteres** — o Google corta em ~155. Reescrever
   com as palavras que as pessoas buscam, p. ex.:
   *"Planejadora financeira CFP® e consultora de investimentos autorizada pela
   CVM. Atendimento online para todo o Brasil."* (~120)

4. **`sitemap.xml` desatualizado** (`lastmod` 2026-08-08). Atualizar a data e
   remover `changefreq`/`priority`, que o Google ignora.

### P1 — Google Search Console (ação sua + minha)

5. **Verificar o domínio no Search Console** como *propriedade de domínio*
   (registro TXT no DNS — cobre http/https/www de uma vez). Quem administra o
   DNS precisa adicionar o TXT; alternativa: eu incluo uma `<meta>` de
   verificação no HTML.
6. Enviar o `sitemap.xml`, pedir indexação de `/` e usar **Inspeção de URL**
   para confirmar que o Google renderiza `/` seguindo para `/mobile/` e
   reconhece o par. Esse é o ponto mais frágil do site (item 8).
7. Vincular o Search Console ao GA4 (relatórios de consultas orgânicas dentro
   do Analytics).

### P1 — Riscos estruturais a monitorar

8. **Duas URLs (desktop + `/mobile/`) com redirecionamento por JavaScript.**
   É suportado pelo Google, mas é a configuração que ele menos recomenda
   (prefere uma página responsiva). Consequências:
   - O Lighthouse marca o canonical do mobile como inválido (único ponto do
     SEO 92). Esperado nesse modelo, mas é sinal de que ferramentas de
     terceiros vão estranhar.
   - **Paridade de conteúdo:** o mobile tem textos diferentes do desktop em
     ~12 lugares (ex.: o primeiro `<h2>`). Como o Google indexa o mobile, é o
     texto *do mobile* que ranqueia. Revisar se as palavras-chave importantes
     estão lá.
   - Recomendação: **manter** por enquanto (refazer como responsivo é um
     projeto grande e foi revertido antes por bons motivos), e decidir com
     base no que o Search Console mostrar em 4–6 semanas.

### P2 — SEO local e fora do site (ação sua)

9. **Perfil da Empresa no Google (Google Business Profile).** É o que aparece
   no mapa e no painel lateral para "planejador financeiro + cidade". Pode ser
   configurado como *área de atendimento* sem expor endereço. Maior ganho
   isolado para buscas locais.
10. **Diretório da Planejar** ("encontre um planejador CFP®") — link de um site
    de alta autoridade e exatamente do tema. Conferir se o perfil da Joice
    aponta para o site.
11. Colocar o link do site nas bios do Instagram e LinkedIn (já estão no
    `sameAs`; a via de volta também conta).

### P2 — Acessibilidade (o Google também mede qualidade de página)

12. Contraste: o rótulo `.tag` (#5779aa sobre #f4f7f7) fica em 4,12:1 — o
    mínimo é 4,5:1. Escurecer um tom resolve.
13. As palavras "fantasma" da seção Visão (#ccdceb, 1,29:1) são o estado
    inicial da animação de revelação — falso positivo de design, documentar
    e não mexer.
14. Depoimentos: no mobile, os `radio` têm `label` oculto; no desktop, a
    lista `ul.depoimento__people` tem `role=button` como filho direto.
    Ajustes de marcação, sem efeito visual.

### P3 — Médio prazo

15. **Conteúdo.** Uma página única ranqueia para o nome da Joice e poucos
    termos. Para crescer em busca orgânica, o caminho é uma seção de artigos
    (perguntas reais de clientes: aposentadoria, reserva de emergência,
    previdência, etc.) — páginas HTML simples, sem quebrar a regra de "sem
    build".
16. Página 404 própria (`404.html`, servida pelo Firebase) com link para a
    home, em vez da 404 genérica.
17. Recorte da foto do hero (performance, já discutido).

## Google Analytics 4

A infraestrutura já está pronta (`scripts/consent.js`, nas duas pastas): o GA
só carrega depois do "Aceitar". Falta o ID.

**Você faz (5 min):**
1. analytics.google.com → *Administrador* → *Criar* → *Propriedade*
   ("Joice Sperandio", fuso de Brasília, moeda BRL).
2. *Fluxo de dados* → *Web* → `https://joicesperandio.com.br`, nome "Site".
   Deixar a **medição otimizada** ligada (rolagem, cliques de saída e vídeo
   são registrados sem código).
3. Copiar o **ID de métricas** (`G-XXXXXXXXXX`) e me mandar.
4. Em *Configurações de dados → Retenção*, escolher **14 meses** — é o que a
   Política de Privacidade promete.
5. Deixar **Google Signals desativado** — o aviso de cookies cobre análise,
   não publicidade.

**Eu faço:**
- Preencher `GA_MEASUREMENT_ID` nos dois `consent.js`, testar localmente que
  nada carrega antes do aceite e que o `collect` sai depois, e publicar.
- Conferir no *Tempo real* do GA4 que as visitas chegam.

**Depois, no GA (sem código):** marcar como *evento-chave* o clique no
WhatsApp — a medição otimizada já registra `click` com `link_url` contendo
`wa.me`; basta criar um evento derivado `contato_whatsapp` e marcá-lo. O
`mailto:` não é coberto pela medição otimizada; se o e-mail importar como
conversão, são poucas linhas no `consent.js` para enviar um evento próprio.

**Esperado:** o GA só conta quem aceitou os cookies, então os números serão
menores que o tráfego real. É o custo de cumprir a LGPD à risca; o Search
Console (que não depende de cookies) complementa.

## Ordem sugerida

1. Itens 1–4 (um commit) + GA com o ID que você mandar.
2. Search Console (5–7) assim que o DNS/meta estiver resolvido.
3. Google Business Profile e Planejar (9–11) — em paralelo, do seu lado.
4. Acessibilidade (12, 14).
5. Reavaliar em 4–6 semanas com dados do Search Console: item 8 e conteúdo (15).

## O que preciso de você

- O **ID do GA4** (`G-...`).
- **Cidade/UF** onde a Joice atua (para `address`/`areaServed` e o perfil no
  Google) — ou confirmação de que é só online.
- Quem administra o **DNS** do domínio (para o TXT do Search Console), ou se
  prefere a verificação por `<meta>`.
