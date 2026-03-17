import { MetadataRoute } from 'next'
import { SEO_BASE } from '@/config/seo'

/**
 * robots.txt dinâmico — gerado pelo Next.js
 * Acessível em: /robots.txt
 *
 * Bloqueia crawlers de rotas privadas (dashboard, admin, API)
 * e permite indexação completa das páginas públicas.
 */
export default function robots(): MetadataRoute.Robots {
  const base = SEO_BASE.siteUrl

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/checkout',
          '/login',
        ],
        disallow: [
          '/dashboard',
          '/formulario',
          '/taxa-consular',
          '/agendamento',
          '/documentos',
          '/admin',
          '/api/',
          '/verify',
          '/_next/',
          '/static/',
        ],
      },
      // Bloquear bots de AI de rastrear conteúdo proprietário
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
