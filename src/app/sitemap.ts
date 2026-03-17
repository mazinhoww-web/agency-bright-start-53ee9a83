import { MetadataRoute } from 'next'
import { SEO_BASE } from '@/config/seo'

/**
 * Sitemap dinâmico — gerado automaticamente pelo Next.js
 * Acessível em: /sitemap.xml
 *
 * Incluímos apenas páginas públicas e indexáveis.
 * Rotas de cliente (/dashboard, /formulario, etc.) e admin são excluídas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SEO_BASE.siteUrl

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Em produção, adicionar rotas dinâmicas se houver páginas de blog/conteúdo:
  // const blogPosts = await getBlogPosts()
  // const dynamicRoutes = blogPosts.map(post => ({ url: `${base}/blog/${post.slug}`, ... }))

  return staticRoutes
}
