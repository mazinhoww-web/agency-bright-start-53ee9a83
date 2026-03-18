'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Document = {
  id: string
  name: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
}

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
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: process } = await supabase
          .from('processes')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!process) return

        const { data } = await supabase
          .from('documents')
          .select('*')
          .eq('process_id', process.id)
          .order('created_at', { ascending: false })

        if (data) setDocs(data as Document[])
      } catch (err) {
        console.error('Error loading documents:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const handleDownload = async (doc: Document) => {
    setDownloadingId(doc.id)
    try {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(doc.file_path, 3600)

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err) {
      console.error('Error downloading document:', err)
    } finally {
      setDownloadingId(null)
    }
  }

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

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Carregando documentos...</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="flex justify-center mb-4" aria-hidden="true">
            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhum documento disponível</h2>
          <p className="text-slate-600">Assim que sua consultora preparar os documentos, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-colors"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{doc.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatFileSize(doc.file_size)} • Disponível em {formatDate(doc.created_at)}
                </p>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                disabled={downloadingId === doc.id}
                className="flex-shrink-0 flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-3 rounded-lg transition-colors min-h-[44px]"
              >
                {downloadingId === doc.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
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
