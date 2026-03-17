'use client'

import Link from 'next/link'

// Mock data — em produção vem do Supabase
const mockDocuments = [
  { id: '1', name: 'DS-160 — João Silva.pdf', size: 245760, mime_type: 'application/pdf', created_at: '2024-01-20T10:00:00Z' },
  { id: '2', name: 'DS-160 — Maria Silva.pdf', size: 238592, mime_type: 'application/pdf', created_at: '2024-01-20T10:05:00Z' },
  { id: '3', name: 'Comprovante taxa consular.pdf', size: 102400, mime_type: 'application/pdf', created_at: '2024-01-21T14:30:00Z' },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))
}

export default function DocumentosPage() {
  const docs = mockDocuments

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-700 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900">Documentos</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Meus documentos</h1>
        <p className="text-slate-600">Documentos preparados pela sua consultora.</p>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhum documento disponível</h2>
          <p className="text-slate-600">Assim que sua consultora preparar os documentos, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{doc.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatFileSize(doc.size)} • Disponível em {formatDate(doc.created_at)}
                </p>
              </div>
              <button className="flex-shrink-0 flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Precisa de ajuda?</p>
        <p>
          Fale diretamente com sua consultora via{' '}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline"
          >
            WhatsApp
          </a>
          .
        </p>
      </div>
    </div>
  )
}
