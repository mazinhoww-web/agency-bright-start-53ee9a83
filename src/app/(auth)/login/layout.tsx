import type { Metadata } from 'next'
import { PAGE_SEO, buildCanonical } from '@/config/seo'

export const metadata: Metadata = {
  title: PAGE_SEO.login.title,
  description: PAGE_SEO.login.description,
  alternates: {
    canonical: buildCanonical('/login'),
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
