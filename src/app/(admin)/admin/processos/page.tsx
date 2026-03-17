'use client'

import { useState } from 'react'
import Link from 'next/link'

const ALL_PROCESSES = [
  { id: '1', client: 'João Silva', email: 'joao@email.com', package: 'Pro+', applicants: 2, status: 'consular_fee_paid', statusLabel: 'Taxa paga', createdAt: '2024-01-20' },
  { id: '2', client: 'Maria Oliveira', email: 'maria@email.com', package: 'Start+', applicants: 1, status: 'pending_form', statusLabel: 'Formulário pendente', createdAt: '2024-01-19' },
  { id: '3', client: 'Carlos Família', email: 'carlos@email.com', package: 'Vip+', applicants: 4, status: 'appointment_requested', statusLabel: 'Agendamento solicitado', createdAt: '2024-01-18' },
  { id: '4', client: 'Ana Costa', email: 'ana@email.com', package: 'Pro+', applicants: 2, status: 'docs_ready', statusLabel: 'Documentos prontos', createdAt: '2024-01-17' },
  { id: '5', client: 'Pedro Santos', email: 'pedro@email.com', package: 'Start+', applicants: 1, status: 'completed', statusLabel: 'Concluído', createdAt: '2024-01-15' },
  { id: '6', client: 'Lucia Ferreira', email: 'lucia@email.com', package: 'Pro+', applicants: 3, status: 'form_completed', statusLabel: 'Formulário enviado', createdAt: '2024-01-14' },
  { id: '7', client: 'Roberto Lima', email: 'roberto@email.com', package: 'Start+', applicants: 1, status: 'docs_in_preparation', statusLabel: 'Preparando documentos', createdAt: '2024-01-12' },
]

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

  const filtered = ALL_PROCESSES.filter((p) => {
    const matchSearch = !search ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.status === statusFilter
    const matchPackage = !packageFilter || p.package === packageFilter
    return matchSearch && matchStatus && matchPackage
  })

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Processos</h1>
        <p className="text-slate-600 mt-1">{ALL_PROCESSES.length} processos cadastrados</p>
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    Nenhum processo encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-sm">{p.client[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{p.client}</p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-700">{p.package}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{p.applicants}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[p.status]}`}>
                        {p.statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{p.createdAt}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/processos/${p.id}`}
                        className="text-sm text-blue-700 font-semibold hover:underline mr-3"
                      >
                        Gerenciar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
