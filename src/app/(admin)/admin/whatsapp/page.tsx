'use client'

import { useState, useEffect } from 'react'

type InboundMessage = {
  id: string
  from_phone: string
  from_name: string | null
  message: string
  is_read: boolean
  process_id: string | null
  received_at: string
}

type Template = {
  id: string
  name: string
  category: string
  content: string
  trigger_status: string | null
  is_active: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  status_update: 'Atualização de status',
  appointment: 'Agendamento',
  sales: 'Vendas',
  general: 'Geral / Dúvidas',
  existing_client: 'Cliente em processo',
}

const emptyTemplate = { name: '', category: 'general', content: '', trigger_status: '' }

export default function AdminWhatsAppPage() {
  const [tab, setTab] = useState<'atendimento' | 'templates'>('atendimento')
  const [messages, setMessages] = useState<InboundMessage[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<InboundMessage | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateForm, setTemplateForm] = useState(emptyTemplate)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const fetchMessages = async () => {
    const res = await fetch('/api/admin/whatsapp/send')
    const data = await res.json()
    setMessages(data.messages || [])
    setLoadingMessages(false)
  }

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/whatsapp/templates')
    const data = await res.json()
    setTemplates(data.templates || [])
    setLoadingTemplates(false)
  }

  useEffect(() => {
    fetchMessages()
    fetchTemplates()
  }, [])

  const handleMarkRead = async (id: string) => {
    await fetch('/api/admin/whatsapp/send', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_read: true }),
    })
    fetchMessages()
  }

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return
    setSending(true)

    await fetch('/api/admin/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: selectedMessage.from_phone,
        message: replyText,
        processId: selectedMessage.process_id,
      }),
    })

    setSending(false)
    setReplyText('')
    await handleMarkRead(selectedMessage.id)
    setSelectedMessage(null)
  }

  const insertTemplate = (templateContent: string) => {
    setReplyText(templateContent)
    setSelectedTemplate('')
  }

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingTemplate(true)

    const method = editingTemplate ? 'PATCH' : 'POST'
    const body = editingTemplate
      ? { id: editingTemplate.id, ...templateForm }
      : templateForm

    await fetch('/api/admin/whatsapp/templates', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSavingTemplate(false)
    setShowTemplateModal(false)
    setEditingTemplate(null)
    setTemplateForm(emptyTemplate)
    fetchTemplates()
  }

  const toggleTemplateActive = async (t: Template) => {
    await fetch('/api/admin/whatsapp/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
    })
    fetchTemplates()
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Excluir este template?')) return
    await fetch(`/api/admin/whatsapp/templates?id=${id}`, { method: 'DELETE' })
    fetchTemplates()
  }

  const unreadCount = messages.filter(m => !m.is_read).length

  const groupedTemplates = templates.reduce<Record<string, Template[]>>((acc, t) => {
    const cat = t.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">WhatsApp</h1>
        <p className="text-slate-600 mt-1">Atendimento e templates de mensagens</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-8 w-fit">
        <button
          onClick={() => setTab('atendimento')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'atendimento' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Atendimento
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Templates
        </button>
      </div>

      {/* ===== ABA ATENDIMENTO ===== */}
      {tab === 'atendimento' && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Lista de mensagens */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Mensagens recebidas</h2>
            </div>
            {loadingMessages ? (
              <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Nenhuma mensagem recebida.</div>
            ) : (
              <div className="overflow-y-auto max-h-[600px] divide-y divide-slate-100">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => { setSelectedMessage(msg); if (!msg.is_read) handleMarkRead(msg.id) }}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      selectedMessage?.id === msg.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {!msg.is_read && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />}
                        <span className="font-semibold text-sm text-slate-900">
                          {msg.from_name || msg.from_phone}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(msg.received_at))}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{msg.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{msg.from_phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Painel de resposta */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 flex flex-col">
            {selectedMessage ? (
              <>
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{selectedMessage.from_name || 'Desconhecido'}</h3>
                      <p className="text-sm text-slate-500">{selectedMessage.from_phone}</p>
                    </div>
                    <a
                      href={`https://wa.me/${selectedMessage.from_phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Abrir no WhatsApp
                    </a>
                  </div>
                </div>

                <div className="flex-1 p-5">
                  {/* Mensagem recebida */}
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-4 mb-4 max-w-sm">
                    <p className="text-sm text-slate-800">{selectedMessage.message}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(selectedMessage.received_at))}
                    </p>
                  </div>

                  {/* Inserir template */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Inserir template rápido</label>
                    <select
                      value={selectedTemplate}
                      onChange={e => { if (e.target.value) insertTemplate(e.target.value) }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    >
                      <option value="">Selecionar template...</option>
                      {Object.entries(groupedTemplates).map(([cat, tmps]) => (
                        <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat}>
                          {tmps.filter(t => t.is_active).map(t => (
                            <option key={t.id} value={t.content}>{t.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Campo de resposta */}
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={5}
                    placeholder="Digite sua resposta..."
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Variáveis disponíveis: {'{{'+'nome'+'}}'}  {'{{'+'link'+'}}'}  {'{{'+'data'+'}}'} etc.
                  </p>
                </div>

                <div className="p-5 border-t border-slate-100">
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    {sending ? 'Enviando...' : 'Enviar via WhatsApp'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Selecione uma mensagem para responder
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== ABA TEMPLATES ===== */}
      {tab === 'templates' && (
        <div>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => { setEditingTemplate(null); setTemplateForm(emptyTemplate); setShowTemplateModal(true) }}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              + Novo template
            </button>
          </div>

          {loadingTemplates ? (
            <div className="text-center text-slate-500 py-12">Carregando...</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTemplates).map(([category, tmps]) => (
                <div key={category}>
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
                    {CATEGORY_LABELS[category] || category}
                  </h2>
                  <div className="space-y-3">
                    {tmps.map(t => (
                      <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-slate-900">{t.name}</span>
                              {t.trigger_status && (
                                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                                  Auto: {t.trigger_status}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-3">{t.content}</p>
                            <p className="text-xs text-slate-400 mt-2">
                              Variáveis: {'{{'+'nome'+'}}'}, {'{{'+'link'+'}}'}, {'{{'+'data'+'}}'}, {'{{'+'cidade_casv'+'}}'} etc.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => toggleTemplateActive(t)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                                t.is_active
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {t.is_active ? 'Ativo' : 'Inativo'}
                            </button>
                            <button
                              onClick={() => { setEditingTemplate(t); setTemplateForm({ name: t.name, category: t.category, content: t.content, trigger_status: t.trigger_status || '' }); setShowTemplateModal(true) }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {templates.length === 0 && (
                <div className="text-center text-slate-500 py-12">Nenhum template cadastrado.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                {editingTemplate ? 'Editar template' : 'Novo template'}
              </h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome *</label>
                <input
                  required
                  value={templateForm.name}
                  onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Ex: Boas-vindas"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Categoria *</label>
                <select
                  value={templateForm.category}
                  onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status que dispara automaticamente</label>
                <select
                  value={templateForm.trigger_status}
                  onChange={e => setTemplateForm({ ...templateForm, trigger_status: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <option value="">Nenhum (manual)</option>
                  <option value="pending_form">Formulário pendente</option>
                  <option value="form_completed">Formulário enviado</option>
                  <option value="consular_fee_paid">Taxa paga</option>
                  <option value="appointment_requested">Agendamento solicitado</option>
                  <option value="docs_in_preparation">Preparando documentos</option>
                  <option value="docs_ready">Documentos prontos</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Conteúdo *</label>
                <textarea
                  required
                  rows={6}
                  value={templateForm.content}
                  onChange={e => setTemplateForm({ ...templateForm, content: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
                  placeholder={'Olá {{nome}}!\n\nSua mensagem aqui...'}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Variáveis: {'{{'+'nome'+'}}'}, {'{{'+'link'+'}}'}, {'{{'+'data'+'}}'}, {'{{'+'cidade_casv'+'}}'}, {'{{'+'cidade_consulado'+'}}'}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 border-2 border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:border-slate-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {savingTemplate ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
