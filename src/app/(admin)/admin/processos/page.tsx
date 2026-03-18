'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type ProcessRow = {
  id: string
  applicant_name: string | null
  applicant_email: string | null
  package: string
  applicant_count: number
  status: string
  created_at: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pending_form', label: 'Formulário pendente' },
  { value: 'form_completed', label: 'Formulário enviado' },
  { value: 'consular_fee_paid', label: 'Taxa paga' },
  { value: 'appointment_requested', label: 'Agendamento solicitado' },
  { value: 'docs_in_preparation', label: 'Preparando documentos' },
  { value: 'docs_ready', label: 'Documentos prontos' },
  { value: 'completed', label: 'Concluído' },
]

const STATUS_LABEL: Record<string, string> = {
  pending_form: 'Formulário pendente',
  form_completed: 'Formulário enviado',
  consular_fee_paid: 'Taxa paga',
  appointment_requested: 'Agendamento solicitado',
  docs_in_preparation: 'Preparando documentos',
  docs_ready: 'Documentos prontos',
  completed: 'Concluído',
}

const STATUS_BADGE: Record<string, string> = {
  pending_form: 'bg-amber-100 text-amber-700',
  form_completed: 'bg-blue-100 text-blue-700',
  consular_fee_paid: 'bg-blue-100 text-blue-700',
  appointment_requested: 'bg-purple-100 text-purple-700',
  docs_in_preparation: 'bg-indigo-100 text-indigo-700',
  docs_ready: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
}

export default function ProcessosPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [packageFilter, setPackageFilter] = useState('')
  const [processes, setProcesses] = useState<ProcessRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchProcesses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (packageFilter) params.set('package', packageFilter)
      if (search) params.set('search', search)
      params.set('limit', '50')

      const res = await fetch(`/api/admin/processes?${params.toString()}`)
      const data = await res.json()
      if (data?.processes) {
        setProcesses(data.processes)
        setTotal(data.total || data.processes.length)
      }
    } catch (err) {
      console.error('Error fetching processes:', err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, packageFilter])

  useEffect(() => {
    fetchProcesses()
  }, [fetchProcesses])

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Processos</h1>
        <p className="text-slate-600 mt-1">{loading ? '…' : `${total} processos cadastrados`}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900 text-sm"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
          >
            <option value="">Todos os pacotes</option>
            <option value="Start+">Start+</option>
            <option value="Pro+">Pro+</option>
            <option value="Vip+">Vip+</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-sm">Carregando...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pacote</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitantes</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {processes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      Nenhum processo encontrado
                    </td>
                  </tr>
                ) : (
                  processes.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-bold text-sm">
                              {(p.applicant_name || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{p.applicant_name || '—'}</p>
                            <p className="text-xs text-slate-500">{p.applicant_email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700">{p.package}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">{p.applicant_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[p.status] || 'bg-slate-100 text-slate-700'}`}>
                          {STATUS_LABEL[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/processos/${p.id}`}
                          className="text-sm text-blue-700 font-semibold hover:underline mr-3 min-h-[44px] inline-flex items-center"
                        >
                          Gerenciar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
