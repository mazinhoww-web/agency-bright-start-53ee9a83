'use client'

import { useState, useEffect } from 'react'

type Lead = {
  id: string
  name: string
  email: string
  phone: string | null
  interested_package: string | null
  source: string
  status: 'new' | 'contacted' | 'nurturing' | 'hot' | 'converted' | 'lost'
  notes: string | null
  lead_score: number
  last_contacted_at: string | null
  created_at: string
}

type EmailTemplate = {
  id: string
  key: string
  name: string
  category: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-slate-100 text-slate-700' },
  contacted: { label: 'Contatado', color: 'bg-blue-100 text-blue-700' },
  nurturing: { label: 'Nurturing', color: 'bg-purple-100 text-purple-700' },
  hot: { label: 'Quente 🔥', color: 'bg-orange-100 text-orange-700' },
  converted: { label: 'Convertido ✅', color: 'bg-green-100 text-green-700' },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-700' },
}

const SOURCE_LABELS: Record<string, string> = {
  site: 'Site',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  referral: 'Indicação',
  google: 'Google',
  other: 'Outro',
}

const PACKAGE_LABELS: Record<string, string> = {
  start_plus: 'Start+',
  pro_plus: 'Pro+',
  vip_plus: 'Vip+',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [notesEdit, setNotesEdit] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    fetchLeads()
    fetchTemplates()
  }, [filterStatus, filterSource, search])

  async function fetchLeads() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterSource) params.set('source', filterSource)
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/leads?${params}`)
    const data = await res.json()
    setLeads(data.leads ?? [])
    setLoading(false)
  }

  async function fetchTemplates() {
    const res = await fetch('/api/admin/email/templates')
    const data = await res.json()
    setTemplates((data.templates ?? []).filter((t: EmailTemplate) =>
      ['lead_nurturing', 'lead_magnet', 'transactional'].includes(t.category)
    ))
  }

  async function sendEmail() {
    if (!selectedLead || !selectedTemplate) return
    setSending(true)
    setSendResult(null)

    const res = await fetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: selectedLead.id, templateKey: selectedTemplate }),
    })
    const data = await res.json()
    setSending(false)
    setSendResult(data.ok ? { ok: true, message: 'Email enviado com sucesso!' } : { ok: false, message: data.error ?? 'Erro ao enviar' })
    if (data.ok) {
      setTimeout(() => { setShowEmailModal(false); setSendResult(null) }, 2000)
    }
  }

  async function updateStatus(leadId: string, status: string) {
    await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: leadId, status }),
    })
    fetchLeads()
    if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status: status as Lead['status'] } : prev)
  }

  async function saveNotes(leadId: string) {
    setSavingNotes(true)
    await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: leadId, notes: notesEdit }),
    })
    setSavingNotes(false)
    fetchLeads()
  }

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    hot: leads.filter(l => l.status === 'hot').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads & CRM</h1>
          <p className="text-slate-500 mt-1">Gerencie seus leads e sequências de nutrição</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900' },
          { label: 'Novos', value: stats.new, color: 'text-blue-700' },
          { label: 'Quentes', value: stats.hot, color: 'text-orange-600' },
          { label: 'Convertidos', value: stats.converted, color: 'text-green-700' },
          { label: 'Perdidos', value: stats.lost, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lead list */}
        <div className="flex-1">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 min-w-48 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                <option value="">Todos os status</option>
                {Object.entries(STATUS_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
              </select>
              <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                <option value="">Todas as fontes</option>
                {Object.entries(SOURCE_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Carregando...</div>
            ) : leads.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl mb-3">🎯</p>
                <p className="text-slate-600 font-medium">Nenhum lead encontrado</p>
                <p className="text-slate-400 text-sm mt-1">Leads capturados no site aparecerão aqui</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Lead</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Pacote</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Fonte</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Score</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map(lead => (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-blue-50' : ''}`}
                      onClick={() => { setSelectedLead(lead); setNotesEdit(lead.notes ?? '') }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 text-sm">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.email}</p>
                        {lead.phone && <p className="text-xs text-slate-400">{lead.phone}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-slate-600">{lead.interested_package ? PACKAGE_LABELS[lead.interested_package] ?? lead.interested_package : '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-slate-600">{SOURCE_LABELS[lead.source] ?? lead.source}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, lead.lead_score)}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{lead.lead_score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[lead.status]?.color}`}>
                          {STATUS_LABELS[lead.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { setSelectedLead(lead); setShowEmailModal(true); setSelectedTemplate('') }}
                            className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 font-medium"
                          >
                            Email
                          </button>
                          <select
                            value={lead.status}
                            onChange={e => updateStatus(lead.id, e.target.value)}
                            className="text-xs border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-700"
                          >
                            {Object.entries(STATUS_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Lead detail panel */}
        {selectedLead && (
          <div className="lg:w-80 xl:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Detalhes do lead</h3>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Nome</p>
                <p className="text-slate-900 font-medium">{selectedLead.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Email</p>
                <p className="text-slate-900"><a href={`mailto:${selectedLead.email}`} className="text-blue-700 hover:underline">{selectedLead.email}</a></p>
              </div>
              {selectedLead.phone && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Telefone</p>
                  <p className="text-slate-900">{selectedLead.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Interesse</p>
                <p className="text-slate-900">{selectedLead.interested_package ? PACKAGE_LABELS[selectedLead.interested_package] ?? selectedLead.interested_package : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Fonte</p>
                <p className="text-slate-900">{SOURCE_LABELS[selectedLead.source] ?? selectedLead.source}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Capturado em</p>
                <p className="text-slate-900 text-sm">{new Date(selectedLead.created_at).toLocaleString('pt-BR')}</p>
              </div>
              {selectedLead.last_contacted_at && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Último contato</p>
                  <p className="text-slate-900 text-sm">{new Date(selectedLead.last_contacted_at).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Notas</p>
              <textarea
                value={notesEdit}
                onChange={e => setNotesEdit(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
                placeholder="Anotações sobre este lead..."
              />
              <button
                onClick={() => saveNotes(selectedLead.id)}
                disabled={savingNotes}
                className="mt-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg font-medium disabled:opacity-50"
              >
                {savingNotes ? 'Salvando...' : 'Salvar nota'}
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { setShowEmailModal(true); setSelectedTemplate('') }}
                className="w-full bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-800"
              >
                📧 Enviar email
              </button>
              <button
                onClick={() => updateStatus(selectedLead.id, 'hot')}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600"
              >
                🔥 Marcar como Quente
              </button>
              <button
                onClick={() => updateStatus(selectedLead.id, 'converted')}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700"
              >
                ✅ Marcar como Convertido
              </button>
              <button
                onClick={() => updateStatus(selectedLead.id, 'lost')}
                className="w-full border border-red-300 text-red-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50"
              >
                Marcar como Perdido
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Enviar email para {selectedLead.name}</h3>
              <button onClick={() => { setShowEmailModal(false); setSendResult(null) }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-1">Para: <strong>{selectedLead.email}</strong></p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Template de email *</label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <option value="">Selecione um template...</option>
                  {templates.map(t => (
                    <option key={t.key} value={t.key}>[{t.category}] {t.name}</option>
                  ))}
                </select>
              </div>
              {sendResult && (
                <div className={`mb-4 p-3 rounded-xl text-sm ${sendResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {sendResult.message}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowEmailModal(false); setSendResult(null) }} className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50">
                  Cancelar
                </button>
                <button
                  onClick={sendEmail}
                  disabled={sending || !selectedTemplate}
                  className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-800 disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : '📧 Enviar email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
