import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Página não encontrada — Cia do Visto',
  description: 'A página que você procura não existe.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-blue-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Página não encontrada</h1>
        <p className="text-slate-600 mb-8">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Voltar ao início
          </Link>
          <Link
            href="/checkout"
            className="border-2 border-slate-300 hover:border-blue-400 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Contratar assessoria
          </Link>
        </div>
      </div>
    </div>
  )
}
