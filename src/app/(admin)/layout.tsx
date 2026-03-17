import type { Metadata } from 'next'
import AdminLayout from '@/components/admin/AdminLayout'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  title: {
    default: 'Admin — Cia do Visto',
    template: '%s | Admin — Cia do Visto',
  },
}

export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
