/**
 * CIA DO VISTO — Configuração central de SEO
 * Todas as páginas devem usar esses valores como base.
 */

export const SEO_BASE = {
  siteName: 'Cia do Visto',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ciadovisto.com.br',
  defaultTitle: 'Cia do Visto — Assessoria para Vistos Americanos de Turismo',
  defaultDescription:
    'Assessoria digital completa para vistos americanos B1/B2 de turismo. Preenchimento do DS-160, taxa consular, agendamento e documentação — tudo no portal, com suporte pelo WhatsApp.',
  defaultKeywords: [
    'visto americano',
    'assessoria visto americano',
    'DS-160',
    'visto turismo EUA',
    'visto B1 B2',
    'taxa consular americana',
    'agendamento visto americano',
    'MRV taxa consular',
    'visto americano Brasil',
    'visto americano São Paulo',
    'como tirar visto americano',
  ],
  locale: 'pt_BR',
  twitterHandle: '@ciadovisto',
  defaultOgImage: '/og-default.png', // 1200×630px
  themeColor: '#1e40af',
}

export type PageSEO = {
  title: string
  description: string
  keywords?: string[]
  noIndex?: boolean
  canonical?: string
  ogImage?: string
}

export const PAGE_SEO: Record<string, PageSEO> = {
  home: {
    title: 'Cia do Visto — Assessoria para Vistos Americanos B1/B2',
    description:
      'Tire seu visto americano de turismo com assessoria digital especializada. Preenchemos o DS-160, organizamos a documentação e acompanhamos você do início ao fim. A partir de R$ 299.',
    keywords: [
      'assessoria visto americano',
      'visto americano turismo',
      'DS-160 preenchimento',
      'visto americano SP',
      'como tirar visto americano',
      'assessoria visto B1 B2',
    ],
    canonical: '/',
  },
  checkout: {
    title: 'Contratar Assessoria — Cia do Visto',
    description: 'Escolha seu pacote e inicie sua assessoria para o visto americano.',
    noIndex: true,
  },
  login: {
    title: 'Acessar minha conta — Cia do Visto',
    description: 'Acesse o portal da Cia do Visto para acompanhar seu processo.',
    noIndex: true,
  },
  dashboard: {
    title: 'Meu processo — Cia do Visto',
    description: 'Acompanhe o andamento do seu visto americano.',
    noIndex: true,
  },
  admin: {
    title: 'Admin — Cia do Visto',
    description: 'Painel administrativo da Cia do Visto.',
    noIndex: true,
  },
}

/** Gera o título completo com o nome do site */
export function buildTitle(title: string): string {
  if (title === SEO_BASE.defaultTitle) return title
  return `${title} | ${SEO_BASE.siteName}`
}

/** Gera a URL canônica absoluta */
export function buildCanonical(path: string): string {
  const base = SEO_BASE.siteUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
