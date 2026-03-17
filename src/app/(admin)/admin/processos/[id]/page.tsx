'use client'

import { useState } from 'react'
import Link from 'next/link'

// Mock data — em produção vem do Supabase via params.id
const mockProcess = {
  id: '1',
  client: {
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    userId: 'user-123',
  },
  package: 'Pro+',
  maxApplicants: 3,
  status: 'consular_fee_paid',
  statusLabel: 'Taxa paga',
  consulting_paid_at: '2024-01-10',
  consulting_amount_brl: 599.00,
  consular_paid_at: '2024-01-20',
  consular_amount_brl: 1320.00,
  consular_usd_rate: 5.92,
  createdAt: '2024-01-10',
  applicants: [
    { id: 'a1', label: 'Solicitante Principal', given_name: 'João', surname: 'Silva', form_step: 8, form_completed_at: '2024-01-15', email: 'joao@email.com' },
    { id: 'a2', label: 'Cônjuge', given_name: 'Maria', surname: 'Silva', form_step: 3, form_completed_at: null, email: 'maria@email.com' },
    { id: 'a3', label: 'Filho', given_name: null, surname: null, form_step: 0, form_completed_at: null, email: null },
  ],
  documents: [
    { id: 'd1', name: 'DS-160 — João Silva.pdf', created_at: '2024-01-20' },
  ],
  notes: [
    { id: 'n1', admin: 'Admin', content: 'Cliente confirmou disponibilidade para SP em fevereiro.', created_at: '2024-01-21T10:00:00Z' },
  ],
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
  const process = mockProcess
  const [status, setStatus] = useState(process.status)
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState(process.notes)
  const [saving, setSaving] = useState(false)

  const handleStatusUpdate = async () => {
    setSaving(true)
    // TODO: atualizar no Supabase
    setTimeout(() => setSaving(false), 1000)
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    setNotes([...notes, {
      id: `n${Date.now()}`,
      admin: 'Admin',
      content: newNote,
      created_at: new Date().toISOString(),
    }])
    setNewNote('')
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/admin" className="hover:text-blue-700">Admin</Link>
          <span>/</span>
          <Link href="/admin/processos" className="hover:text-blue-700">Processos</Link>
          <span>/</span>
          <span className="text-slate-900">{process.client.name}</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{process.client.name}</h1>
            <p className="text-slate-600 mt-1">{process.package} · {process.maxApplicants} solicitantes · Contratado em {process.createdAt}</p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${STATUS_BADGE[status]}`}>
            {STATUS_OPTIONS.find(s => s.value === status)?.label}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicants */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-5">Solicitantes</h2>
            <div className="space-y-3">
              {process.applicants.map((applicant) => {
                const name = applicant.given_name && applicant.surname
                  ? `${applicant.given_name} ${applicant.surname}`
                  : applicant.label
                const progress = Math.round((applicant.form_step / 8) * 100)
                return (
                  <div key={applicant.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">
                        {(applicant.given_name?.[0] || applicant.label[0]).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">{applicant.label}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{progress}% ({applicant.form_step}/8 etapas)</span>
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
            {process.documents.length === 0 ? (
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
                      <p className="text-xs text-slate-500">{doc.created_at}</p>
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
                    <span className="text-xs font-semibold text-slate-700">{note.admin}</span>
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
                disabled={!newNote.trim()}
                className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl transition-colors self-end"
              >
                Adicionar
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
                { label: 'Nome', value: process.client.name },
                { label: 'E-mail', value: process.client.email },
                { label: 'WhatsApp', value: process.client.phone },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-xs text-slate-500 mb-0.5">{field.label}</p>
                  <p className="text-sm font-medium text-slate-900">{field.value}</p>
                </div>
              ))}
            </div>
            <a
              href={`https://wa.me/${process.client.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 justify-center bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors w-full"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar WhatsApp
            </a>
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Atualizar status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900 mb-3"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
    </div>
  )
}
