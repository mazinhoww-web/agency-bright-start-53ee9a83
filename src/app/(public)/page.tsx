import type { Metadata } from 'next'
import { SEO_BASE, PAGE_SEO, buildCanonical } from '@/config/seo'
import { PACKAGES } from '@/config/packages'
import LandingPageContent from '@/components/landing/LandingPageContent'

export const metadata: Metadata = {
  title: PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  keywords: PAGE_SEO.home.keywords,
  alternates: {
    canonical: buildCanonical('/'),
  },
  openGraph: {
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    url: buildCanonical('/'),
    type: 'website',
    locale: SEO_BASE.locale,
    siteName: SEO_BASE.siteName,
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'Cia do Visto — Assessoria para vistos americanos B1/B2',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    images: ['/og-home.png'],
  },
}

/** JSON-LD: LocalBusiness + Service + FAQPage */
function generateJsonLd() {
  const baseUrl = SEO_BASE.siteUrl

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Cia do Visto',
    description: PAGE_SEO.home.description,
    url: baseUrl,
    telephone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
      ? `+${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`
      : undefined,
    email: 'contato@ciadovisto.com.br',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BR',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Brasil',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Pacotes de assessoria para visto americano',
      itemListElement: Object.values(PACKAGES).map((pkg, i) => ({
        '@type': 'Offer',
        position: i + 1,
        name: `Assessoria Cia do Visto — Pacote ${pkg.name}`,
        description: pkg.features.join('. '),
        price: (pkg.priceInCents / 100).toFixed(2),
        priceCurrency: 'BRL',
        url: `${baseUrl}/checkout?package=${pkg.id}`,
        eligibleQuantity: {
          '@type': 'QuantitativeValue',
          maxValue: pkg.maxApplicants,
          unitText: 'solicitante',
        },
      })),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    review: [
      {
        '@type': 'Review',
        author: { '@type': 'Person', name: 'Maria Silva' },
        reviewBody: 'Processo todo muito claro e tranquilo. Em menos de 6 semanas estava com o visto em mãos!',
        reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      },
    ],
  }

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Quanto tempo leva o processo de assessoria para visto americano?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O processo varia conforme a disponibilidade de datas no consulado. Em média, de 2 a 8 semanas após o pagamento da taxa consular.',
        },
      },
      {
        '@type': 'Question',
        name: 'A Cia do Visto garante a aprovação do visto americano?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nenhuma assessoria pode garantir aprovação, pois a decisão é exclusivamente do consulado americano. Nossa função é maximizar suas chances com uma documentação impecável.',
        },
      },
      {
        '@type': 'Question',
        name: 'O DS-160 é obrigatório para o visto americano de turismo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim, o DS-160 é obrigatório para todos os solicitantes de visto não-imigrante americano, incluindo turismo (B1/B2).',
        },
      },
      {
        '@type': 'Question',
        name: 'Posso incluir mais de um familiar no mesmo pacote de assessoria?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim! Os planos Pro+ (até 3 pessoas) e Vip+ (até 6 pessoas) são ideais para casais e famílias.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como funciona o suporte pelo WhatsApp da Cia do Visto?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Você terá acesso direto à nossa consultora via WhatsApp durante todo o processo, com tempo de resposta de até 4 horas em dias úteis.',
        },
      },
    ],
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: baseUrl,
      },
    ],
  }

  return [organization, faqPage, breadcrumb]
}

export default function HomePage() {
  const jsonLd = generateJsonLd()

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <LandingPageContent />
    </>
  )
}
