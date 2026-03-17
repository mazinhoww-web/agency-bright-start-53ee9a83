import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cia do Visto — Assessoria para Vistos Americanos',
  description:
    'Assessoria digital completa para seu visto americano de turismo. Rápido, seguro e sem complicação.',
  keywords: 'visto americano, assessoria visto, DS-160, visto turismo, B1 B2',
  openGraph: {
    title: 'Cia do Visto',
    description: 'Seu visto americano com assessoria especializada',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  )
}
