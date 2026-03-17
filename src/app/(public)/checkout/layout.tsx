import type { Metadata } from 'next'
import { PAGE_SEO } from '@/config/seo'

export const metadata: Metadata = {
  title: PAGE_SEO.checkout.title,
  description: PAGE_SEO.checkout.description,
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
