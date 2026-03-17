'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { SEO_BASE } from '@/config/seo'

/**
 * Hook para injetar a URL canônica dinamicamente em client components.
 * Para páginas server-rendered, use `alternates.canonical` no metadata.
 */
export function useCanonical() {
  const pathname = usePathname()

  useEffect(() => {
    const canonical = `${SEO_BASE.siteUrl}${pathname}`
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }

    link.href = canonical
  }, [pathname])
}
