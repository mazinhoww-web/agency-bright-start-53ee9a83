# Cia do Visto — Guia de SEO

## Implementações realizadas

### Fase 1 — Metadados centralizados
- `src/config/seo.ts` — configuração global: `SEO_BASE`, `PAGE_SEO`, helpers `buildTitle` e `buildCanonical`
- `src/app/layout.tsx` — metadados globais com template de título, OpenGraph, Twitter Card, robots, `metadataBase`

### Fase 2 — Technical SEO
| Arquivo | Rota | Descrição |
|---------|------|-----------|
| `src/app/sitemap.ts` | `/sitemap.xml` | Sitemap dinâmico (apenas páginas públicas) |
| `src/app/robots.ts` | `/robots.txt` | Bloqueia crawler em rotas privadas e bots de AI |
| `src/app/manifest.ts` | `/manifest.webmanifest` | PWA manifest |
| `src/app/opengraph-image.tsx` | `/opengraph-image` | OG image gerada dinamicamente via `next/og` |
| `src/app/not-found.tsx` | `404` | Página 404 com noindex |

### Fase 3 — Metadados por página
| Rota | Index | Canonical | OG Image |
|------|-------|-----------|----------|
| `/` | ✅ Sim | `/` | `/opengraph-image` |
| `/checkout` | ❌ noindex | — | — |
| `/login` | ❌ noindex | — | — |
| `/verify` | ❌ noindex | — | — |
| `/dashboard` e subpáginas | ❌ noindex | — | — |
| `/admin` e subpáginas | ❌ noindex | — | — |

### Fase 4 — Dados Estruturados (JSON-LD)
Na landing page (`/`), três schemas Schema.org são injetados via `<script type="application/ld+json">`:
1. **ProfessionalService** — informações do negócio, avaliações, catálogo de serviços com preços
2. **FAQPage** — perguntas frequentes (melhora rich snippets no Google)
3. **BreadcrumbList** — breadcrumb da página inicial

### Fase 5 — Acessibilidade (impacta SEO)
A landing page foi refatorada com:
- `aria-label` em elementos interativos
- `role="navigation"` no menu
- `role="contentinfo"` no footer
- `<ol>` para a lista de etapas (lista ordenada semântica)
- `<blockquote>` + `<cite>` para depoimentos
- `<dl>` + `<dt>` + `<dd>` para o FAQ
- `aria-expanded` nos botões do FAQ

---

## Checklist para produção

### Antes do deploy
- [ ] Substituir `https://ciadovisto.com.br` em `.env.local` → `NEXT_PUBLIC_APP_URL`
- [ ] Criar OG image real (1200×630px) em `/public/og-home.png` e `/public/og-default.png`
- [ ] Criar `apple-touch-icon.png` (180×180px) em `/public/`
- [ ] Gerar favicon em múltiplos tamanhos

### Google Search Console
- [ ] Verificar propriedade via meta tag em `src/app/layout.tsx`:
  ```tsx
  verification: { google: 'SEU_GOOGLE_SITE_VERIFICATION' }
  ```
- [ ] Submeter sitemap: `https://ciadovisto.com.br/sitemap.xml`
- [ ] Monitorar Core Web Vitals

### Bing Webmaster Tools
- [ ] Verificar propriedade e submeter sitemap

---

## Keywords-alvo por intenção

### Informacional (top of funnel)
- "como tirar visto americano"
- "quanto custa visto americano"
- "o que é DS-160"
- "quanto tempo demora visto americano"

### Navegacional
- "cia do visto"
- "assessoria visto americano"

### Transacional (bottom of funnel) — foco principal
- "assessoria visto americano preço"
- "contratar assessoria visto americano"
- "assessoria visto turismo EUA"
- "preenchimento DS-160"

### Local (adicionar futuramente)
- "assessoria visto americano São Paulo"
- "assessoria visto americano Rio de Janeiro"
- "assessoria visto americano Curitiba"

---

## Performance (Core Web Vitals)

### Otimizações implementadas
- `display: 'swap'` na fonte Geist (evita FOIT)
- `preload: true` na fonte
- `<link rel="preconnect">` para fonts.googleapis.com e fonts.gstatic.com
- `<link rel="dns-prefetch">` para APIs externas
- `metadataBase` configurado (evita URLs relativas em OG)

### Recomendações para produção
- Usar `next/image` em todas as imagens com `width`, `height` e `priority` no LCP
- Implementar ISR (Incremental Static Regeneration) em páginas com dados dinâmicos
- Configurar `Cache-Control` nos headers da Vercel para assets estáticos
- Monitorar via [PageSpeed Insights](https://pagespeed.web.dev)

---

## Próximos passos de SEO

1. **Blog de conteúdo** — artigos sobre "como tirar visto americano", dicas DS-160, etc.
   - Criar `src/app/(public)/blog/[slug]/page.tsx` com metadata dinâmico
   - Adicionar rotas de blog ao sitemap
2. **Páginas de cidade** — landing pages para cada cidade com consulado
   - `/assessoria-visto-americano-sao-paulo`, `/assessoria-visto-americano-rio-de-janeiro`, etc.
3. **Schema Review** — adicionar mais avaliações reais ao JSON-LD após coletar reviews
4. **Google Business Profile** — cadastrar o negócio para buscas locais
