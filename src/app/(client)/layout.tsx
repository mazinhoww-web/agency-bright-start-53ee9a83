import type { Metadata } from 'next'
import ClientLayout from '@/components/client/ClientLayout'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  title: {
    default: 'Portal do Cliente — Cia do Visto',
    template: '%s | Cia do Visto',
  },
}

export default function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>
}
