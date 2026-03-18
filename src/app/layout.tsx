import type { Metadata, Viewport } from 'next'
import { SEO_BASE } from '@/config/seo'
import './globals.css'

export const viewport: Viewport = {
  themeColor: SEO_BASE.themeColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(SEO_BASE.siteUrl),
  title: {
    default: SEO_BASE.defaultTitle,
    template: `%s | ${SEO_BASE.siteName}`,
  },
  description: SEO_BASE.defaultDescription,
  keywords: SEO_BASE.defaultKeywords,
  authors: [{ name: SEO_BASE.siteName, url: SEO_BASE.siteUrl }],
  creator: SEO_BASE.siteName,
  publisher: SEO_BASE.siteName,

  // Open Graph
  openGraph: {
    type: 'website',
    locale: SEO_BASE.locale,
    url: SEO_BASE.siteUrl,
    siteName: SEO_BASE.siteName,
    title: SEO_BASE.defaultTitle,
    description: SEO_BASE.defaultDescription,
    images: [
      {
        url: SEO_BASE.defaultOgImage,
        width: 1200,
        height: 630,
        alt: 'Cia do Visto — Assessoria para vistos americanos',
      },
    ],
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    site: SEO_BASE.twitterHandle,
    creator: SEO_BASE.twitterHandle,
    title: SEO_BASE.defaultTitle,
    description: SEO_BASE.defaultDescription,
    images: [SEO_BASE.defaultOgImage],
  },

  // Robots (padrão: indexável)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verificações de propriedade (preencher quando tiver as contas)
  // verification: {
  //   google: 'SEU_GOOGLE_SITE_VERIFICATION',
  //   other: { 'msvalidate.01': 'SEU_BING_VERIFICATION' },
  // },

  // Ícones
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Manifest para PWA
  // manifest: '/manifest.json',

  // Categoria
  category: 'business',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" dir="ltr">
      <head>
        {/* Preconnects para domínios críticos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch para domínios externos */}
        <link rel="dns-prefetch" href="//economia.awesomeapi.com.br" />
        <link rel="dns-prefetch" href="//api.z-api.io" />
      </head>
      <body className="antialiased">
        {/* Skip-to-content — WCAG 2.4.1 */}
        <a href="#main-content" className="skip-to-content">
          Ir para o conteúdo principal
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  )
}
