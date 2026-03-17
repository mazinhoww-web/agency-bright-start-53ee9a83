import { MetadataRoute } from 'next'
import { SEO_BASE } from '@/config/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cia do Visto',
    short_name: 'Cia do Visto',
    description: SEO_BASE.defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: SEO_BASE.themeColor,
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
    categories: ['business', 'productivity'],
    lang: 'pt-BR',
    dir: 'ltr',
  }
}
