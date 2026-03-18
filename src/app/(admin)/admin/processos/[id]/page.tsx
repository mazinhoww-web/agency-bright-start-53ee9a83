'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  sender_type: 'client' | 'admin'
  content: string
  is_read?: boolean
  created_at: string
}

type Applicant = {
  id: string
  given_name: string | null
  surname: string | null
  email: string | null
  is_primary: boolean
  form_step: number
  form_completed_at: string | null
}

type Document = {
  id: string
  name: string
  created_at: string
}

type AdminNote = {
  id: string
  content: string
  created_at: string
  admin_id?: string
}

type ProcessDetail = {
  id: string
  package: string
  status: string
  max_applicants: number
  created_at: string
  consulting_paid_at?: string
  consulting_amount_brl?: number
  consular_paid_at?: string
  consular_amount_brl?: number
  consular_usd_rate?: number
  applicants: Applicant[]
  documents: Document[]
  admin_notes: AdminNote[]
}

const STATUS_OPTIONS = [
  { value: 'pending_form', label: 'Formulário pendente' },
  { value: 'form_completed', label: 'Formulário enviado' },
  { value: 'consular_fee_paid', label: 'Taxa paga' },
  { value: 'appointment_requested', label: 'Agendamento solicitado' },
  { value: 'docs_in_preparation', label: 'Preparando documentos' },
  { value: 'docs_ready', label: 'Documentos prontos' },
  { value: 'completed', label: 'Concluído' },
]

const STATUS_BADGE: Record<string, string> = {
  pending_form: 'bg-amber-100 text-amber-700',
  form_completed: 'bg-blue-100 text-blue-700',
  consular_fee_paid: 'bg-blue-100 text-blue-700',
  appointment_requested: 'bg-purple-100 text-purple-700',
  docs_in_preparation: 'bg-indigo-100 text-indigo-700',
  docs_ready: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
}

export default function ProcessoDetailPage({ params }: { params: { id: string } }) {
  const [process, setProcess] = useState<ProcessDetail | null>(null)
  const [loadingProcess, setLoadingProcess] = useState(true)
  const [activeTab, setActiveTab] = useState<'visao' | 'mensagens'>('visao')
  const [status, setStatus] = useState('')
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [saving, setSaving] = useState(false)
  const [statusSaved, setStatusSaved] = useState(false)
  const [addingNote, setAddingNote] = useState(false)

  // Mensagens
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [adminReply, setAdminReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function fetchProcess() {
      setLoadingProcess(true)
      try {
        const res = await fetch(`/api/admin/processes/${params.id}`)
        const data = await res.json()
        if (data?.process) {
          setProcess(data.process)
          setStatus(data.process.status)
          setNotes(data.process.admin_notes || [])
        }
      } catch (err) {
        console.error('Error fetching process:', err)
      } finally {
        setLoadingProcess(false)
      }
    }
    fetchProcess()
  }, [params.id])

  const fetchMessages = async () => {
    setLoadingMessages(true)
    const res = await fetch(`/api/messages?processId=${params.id}`)
    const data = await res.json()
    if (data.messages) {
      setMessages(data.messages)
      setUnreadCount(data.messages.filter((m: Message) => m.sender_type === 'client' && !m.is_read).length)
    }
    setLoadingMessages(false)
  }

  useEffect(() => {
    if (activeTab === 'mensagens') fetchMessages()
  }, [activeTab])

  // Supabase Realtime — escuta novas mensagens em tempo real quando a aba mensagens está ativa
  useEffect(() => {
    if (activeTab !== 'mensagens') return

    const supabase = createClient()
    const channel = supabase
      .channel(`messages-admin-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `process_id=eq.${params.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            const updated = [...prev, newMsg]
            // Atualizar contagem de não lidas
            if (newMsg.sender_type === 'client' && !newMsg.is_read) {
              setUnreadCount((c) => c + 1)
            }
            return updated
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeTab, params.id])

  const handleStatusUpdate = async () => {
    setSaving(true)
    setStatusSaved(false)

    const res = await fetch(`/api/admin/processes/${params.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notifyWhatsApp }),
    })

    setSaving(false)
    if (res.ok) {
      setStatusSaved(true)
      if (process) setProcess({ ...process, status })
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch(`/api/admin/processes/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      })
      const data = await res.json()
      if (data?.note) {
        setNotes((prev) => [...prev, data.note])
        setNewNote('')
      }
    } catch (err) {
      console.error('Error adding note:', err)
    } finally {
      setAddingNote(false)
    }
  }

  const handleSendReply = async () => {
    if (!adminReply.trim()) return
    setSendingReply(true)

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processId: params.id, content: adminReply, senderType: 'admin' }),
    })

    setSendingReply(false)
    setAdminReply('')
    fetchMessages()
  }

  if (loadingProcess) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-center text-slate-400 text-sm py-16">Carregando processo...</div>
      </div>
    )
  }

  if (!process) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-center text-slate-500 py-16">
          <p className="font-semibold">Processo não encontrado.</p>
          <Link href="/admin/processos" className="text-blue-700 hover:underline mt-2 inline-block">
            Voltar para processos
          </Link>
        </div>
      </div>
    )
  }

  const primaryApplicant = process.applicants?.find((a) => a.is_primary) || process.applicants?.[0]
  const clientName = primaryApplicant
    ? [primaryApplicant.given_name, primaryApplicant.surname].filter(Boolean).join(' ') || '—'
    : '—'
  const clientEmail = primaryApplicant?.email || '—'

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/admin" className="hover:text-blue-700">Admin</Link>
          <span>/</span>
          <Link href="/admin/processos" className="hover:text-blue-700">Processos</Link>
          <span>/</span>
          <span className="text-slate-900">{clientName}</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{clientName}</h1>
            <p className="text-slate-600 mt-1">
              {process.package} · {process.max_applicants} solicitantes · Contratado em {new Date(process.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${STATUS_BADGE[status] || 'bg-slate-100 text-slate-700'}`}>
            {STATUS_OPTIONS.find(s => s.value === status)?.label || status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-8 w-fit">
        <button
          onClick={() => setActiveTab('visao')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'visao' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Visão geral
        </button>
        <button
          onClick={() => setActiveTab('mensagens')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'mensagens' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Mensagens
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'visao' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicants */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-5">Solicitantes</h2>
              <div className="space-y-3">
                {(process.applicants || []).map((applicant, idx) => {
                  const name = applicant.given_name && applicant.surname
                    ? `${applicant.given_name} ${applicant.surname}`
                    : applicant.is_primary ? 'Solicitante Principal' : `Solicitante ${idx + 1}`
                  const progress = Math.round(((applicant.form_step || 0) / 8) * 100)
                  return (
                    <div key={applicant.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-sm">
                          {(applicant.given_name?.[0] || name[0] || '?').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-500">{applicant.is_primary ? 'Solicitante Principal' : `Solicitante ${idx + 1}`}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{progress}% ({applicant.form_step || 0}/8 etapas)</span>
                        </div>
                      </div>
                      {applicant.form_completed_at ? (
                        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">Completo</span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">Incompleto</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900">Documentos</h2>
                <button className="text-sm bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                  + Enviar documento
                </button>
              </div>
              {(process.documents || []).length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum documento enviado ainda.</p>
              ) : (
                <div className="space-y-3">
                  {process.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <button className="text-xs text-red-600 hover:underline">Remover</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-5">Notas internas</h2>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-slate-700">Admin</span>
                      <span className="text-xs text-slate-400">
                        {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(note.created_at))}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{note.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Adicionar nota interna..."
                  rows={2}
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900 resize-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                  className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl transition-colors self-end"
                >
                  {addingNote ? '...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Dados do cliente</h3>
              <div className="space-y-3">
                {[
                  { label: 'Nome', value: clientName },
                  { label: 'E-mail', value: clientEmail },
                ].map((field) => (
                  <div key={field.label}>
                    <p className="text-xs text-slate-500 mb-0.5">{field.label}</p>
                    <p className="text-sm font-medium text-slate-900">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Atualizar status</h3>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setStatusSaved(false) }}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900 mb-3"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyWhatsApp}
                  onChange={e => setNotifyWhatsApp(e.target.checked)}
                  className="w-4 h-4 accent-blue-700"
                />
                <span className="text-sm text-slate-700">Notificar cliente via WhatsApp</span>
              </label>

              {statusSaved && (
                <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  Status atualizado com sucesso!
                </div>
              )}

              <button
                onClick={handleStatusUpdate}
                disabled={saving}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {saving ? 'Salvando...' : 'Salvar status'}
              </button>
            </div>

            {/* Financial */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Financeiro</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Assessoria</span>
                  <span className="font-semibold text-slate-900">
                    {process.consulting_amount_brl ? `R$ ${process.consulting_amount_brl.toFixed(2)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Taxa consular</span>
                  <span className="font-semibold text-slate-900">
                    {process.consular_amount_brl ? `R$ ${process.consular_amount_brl.toFixed(2)}` : '—'}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-bold">
                  <span className="text-slate-900">Total recebido</span>
                  <span className="text-green-700">
                    R$ {((process.consulting_amount_brl || 0) + (process.consular_amount_brl || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA MENSAGENS */}
      {activeTab === 'mensagens' && (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col" style={{ minHeight: '500px' }}>
          <div className="p-5 border-b border-slate-100">
            <p className="text-sm text-slate-500">Mensagens trocadas com o cliente neste processo</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-96">
            {loadingMessages ? (
              <p className="text-center text-slate-400 text-sm">Carregando...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-slate-400 text-sm mt-8">Nenhuma mensagem ainda.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm ${
                    msg.sender_type === 'admin'
                      ? 'bg-blue-700 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.sender_type === 'admin' ? 'Você' : 'Cliente'} · {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.created_at))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 border-t border-slate-100">
            <div className="flex gap-3">
              <input
                type="text"
                value={adminReply}
                onChange={e => setAdminReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() } }}
                placeholder="Responder ao cliente..."
                className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              <button
                onClick={handleSendReply}
                disabled={sendingReply || !adminReply.trim()}
                className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
              >
                {sendingReply ? '...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
