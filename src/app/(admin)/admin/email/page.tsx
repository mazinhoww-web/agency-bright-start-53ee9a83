'use client'

import { useState, useEffect } from 'react'

type EmailTemplate = {
  id: string
  key: string
  name: string
  category: string
  subject: string
  body_html: string
  body_text: string | null
  variables: string[]
  trigger_status: string | null
  is_active: boolean
  send_delay_hours: number
  created_at: string
}

type EmailLog = {
  id: string
  to_email: string
  to_name: string | null
  subject: string
  template_key: string | null
  status: string
  error_message: string | null
  sent_at: string
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  transactional: { label: 'Transacional', color: 'bg-blue-100 text-blue-700' },
  status_update: { label: 'Status', color: 'bg-purple-100 text-purple-700' },
  lead_nurturing: { label: 'Nurturing', color: 'bg-orange-100 text-orange-700' },
  admin_notification: { label: 'Admin', color: 'bg-slate-100 text-slate-700' },
  lead_magnet: { label: 'Lead Magnet', color: 'bg-green-100 text-green-700' },
}

export default function EmailPage() {
  const [tab, setTab] = useState<'templates' | 'send' | 'logs'>('templates')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [saving, setSaving] = useState(false)

  // Send form
  const [sendTo, setSendTo] = useState('')
  const [sendToName, setSendToName] = useState('')
  const [sendTemplate, setSendTemplate] = useState('')
  const [sendVars, setSendVars] = useState('')
  const [sendProcessId, setSendProcessId] = useState('')
  const [sendLeadId, setSendLeadId] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (tab === 'templates') fetchTemplates()
    if (tab === 'logs') fetchLogs()
  }, [tab])

  async function fetchTemplates() {
    setLoading(true)
    const res = await fetch('/api/admin/email/templates')
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setLoading(false)
  }

  async function fetchLogs() {
    setLoading(true)
    const res = await fetch('/api/admin/email/send')
    const data = await res.json()
    setLogs(data.logs ?? [])
    setLoading(false)
  }

  async function saveTemplate() {
    if (!editingTemplate) return
    setSaving(true)
    const res = await fetch('/api/admin/email/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingTemplate.id,
        subject: editingTemplate.subject,
        body_html: editingTemplate.body_html,
        body_text: editingTemplate.body_text,
        is_active: editingTemplate.is_active,
      }),
    })
    const data = await res.json()
    if (data.template) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...data.template } : t))
      setEditingTemplate(null)
    }
    setSaving(false)
  }

  async function sendTestEmail() {
    if (!sendTo || !sendTemplate) return
    setSending(true)
    setSendResult(null)

    let vars: Record<string, string> = {}
    try { vars = sendVars ? JSON.parse(sendVars) : {} } catch { vars = {} }

    const res = await fetch('/api/admin/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: sendTo,
        toName: sendToName || undefined,
        templateKey: sendTemplate,
        vars,
        processId: sendProcessId || undefined,
        leadId: sendLeadId || undefined,
      }),
    })
    const data = await res.json()
    setSending(false)
    setSendResult(data.ok ? { ok: true, message: 'Email enviado com sucesso!' } : { ok: false, message: data.error ?? 'Erro ao enviar' })
  }

  const grouped = templates.reduce((acc, t) => {
    const cat = t.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {} as Record<string, EmailTemplate[]>)

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Central de Email</h1>
        <p className="text-slate-500 mt-1">Gerencie templates, envie emails e acompanhe o histórico</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {(['templates', 'send', 'logs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'templates' ? '📋 Templates' : t === 'send' ? '📤 Enviar' : '📊 Histórico'}
          </button>
        ))}
      </div>

      {/* TEMPLATES TAB */}
      {tab === 'templates' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-slate-400">Carregando templates...</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, tpls]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${CATEGORY_LABELS[category]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                      {CATEGORY_LABELS[category]?.label ?? category}
                    </span>
                    <span className="text-slate-400 text-sm">({tpls.length} templates)</span>
                  </div>
                  <div className="grid gap-3">
                    {tpls.map(tpl => (
                      <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900">{tpl.name}</h3>
                              {!tpl.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inativo</span>}
                            </div>
                            <p className="text-sm text-slate-500">Assunto: <span className="text-slate-700">{tpl.subject}</span></p>
                            <p className="text-xs text-slate-400 font-mono mt-1">key: {tpl.key}</p>
                            {tpl.trigger_status && (
                              <p className="text-xs text-purple-600 mt-1">Disparo automático: {tpl.trigger_status}</p>
                            )}
                            {tpl.variables.length > 0 && (
                              <p className="text-xs text-slate-400 mt-1">Variáveis: {tpl.variables.join(', ')}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setPreviewTemplate(tpl)}
                              className="text-xs text-slate-600 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => setEditingTemplate({ ...tpl })}
                              className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEND TAB */}
      {tab === 'send' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Enviar email manual</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email destinatário *</label>
                  <input type="email" value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="cliente@email.com" className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do destinatário</label>
                  <input type="text" value={sendToName} onChange={e => setSendToName(e.target.value)} placeholder="João Silva" className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Template *</label>
                <select value={sendTemplate} onChange={e => setSendTemplate(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700">
                  <option value="">Selecione um template...</option>
                  {Object.entries(grouped).map(([cat, tpls]) => (
                    <optgroup key={cat} label={CATEGORY_LABELS[cat]?.label ?? cat}>
                      {tpls.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Variáveis extras (JSON opcional)</label>
                <textarea value={sendVars} onChange={e => setSendVars(e.target.value)} rows={3} placeholder={'{"nome": "João", "link": "https://..."}'} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 font-mono resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">ID do processo (opcional)</label>
                  <input type="text" value={sendProcessId} onChange={e => setSendProcessId(e.target.value)} placeholder="uuid..." className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">ID do lead (opcional)</label>
                  <input type="text" value={sendLeadId} onChange={e => setSendLeadId(e.target.value)} placeholder="uuid..." className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 font-mono" />
                </div>
              </div>

              {sendResult && (
                <div className={`p-4 rounded-xl text-sm font-medium ${sendResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {sendResult.ok ? '✅ ' : '❌ '}{sendResult.message}
                </div>
              )}

              <button
                onClick={sendTestEmail}
                disabled={sending || !sendTo || !sendTemplate}
                className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-50"
              >
                {sending ? 'Enviando...' : '📧 Enviar email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {tab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-slate-600 font-medium">Nenhum email enviado ainda</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Destinatário</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Assunto</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Template</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Enviado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{log.to_name ?? '—'}</p>
                      <p className="text-xs text-slate-500">{log.to_email}</p>
                    </td>
                    <td className="px-4 py-3"><p className="text-sm text-slate-700 max-w-xs truncate">{log.subject}</p></td>
                    <td className="px-4 py-3"><p className="text-xs font-mono text-slate-500">{log.template_key ?? '—'}</p></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.status === 'sent' || log.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><p className="text-sm text-slate-500">{new Date(log.sent_at).toLocaleString('pt-BR')}</p></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Editar: {editingTemplate.name}</h3>
              <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assunto</label>
                <input type="text" value={editingTemplate.subject} onChange={e => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : prev)} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Corpo HTML</label>
                <textarea value={editingTemplate.body_html} onChange={e => setEditingTemplate(prev => prev ? { ...prev, body_html: e.target.value } : prev)} rows={12} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Corpo plain-text</label>
                <textarea value={editingTemplate.body_text ?? ''} onChange={e => setEditingTemplate(prev => prev ? { ...prev, body_text: e.target.value } : prev)} rows={4} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={editingTemplate.is_active} onChange={e => setEditingTemplate(prev => prev ? { ...prev, is_active: e.target.checked } : prev)} className="rounded" />
                <label htmlFor="active" className="text-sm font-medium text-slate-700">Template ativo</label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button onClick={() => setEditingTemplate(null)} className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50">Cancelar</button>
              <button onClick={saveTemplate} disabled={saving} className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-800 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Preview: {previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-slate-500 mb-4">Assunto: <strong>{previewTemplate.subject}</strong></p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <iframe srcDoc={previewTemplate.body_html} className="w-full h-96 border-0" title="Email preview" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200">
              <button onClick={() => setPreviewTemplate(null)} className="w-full border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
