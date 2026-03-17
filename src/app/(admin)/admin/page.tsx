'use client'

import Link from 'next/link'

const STATS = [
  { label: 'Total de processos', value: '47', change: '+5 este mês', color: 'text-blue-700', bg: 'bg-blue-50' },
  { label: 'Aguardando formulário', value: '8', change: 'Ação necessária', color: 'text-amber-700', bg: 'bg-amber-50' },
  { label: 'Taxa consular pendente', value: '12', change: 'Após formulário', color: 'text-purple-700', bg: 'bg-purple-50' },
  { label: 'Processos concluídos', value: '22', change: '47% do total', color: 'text-green-700', bg: 'bg-green-50' },
]

const RECENT_PROCESSES = [
  { id: '1', client: 'João Silva', package: 'Pro+', status: 'consular_fee_paid', statusLabel: 'Taxa paga', date: '2024-01-20' },
  { id: '2', client: 'Maria Oliveira', package: 'Start+', status: 'pending_form', statusLabel: 'Formulário pendente', date: '2024-01-19' },
  { id: '3', client: 'Carlos Família', package: 'Vip+', status: 'appointment_requested', statusLabel: 'Agendamento solicitado', date: '2024-01-18' },
  { id: '4', client: 'Ana Costa', package: 'Pro+', status: 'docs_ready', statusLabel: 'Documentos prontos', date: '2024-01-17' },
  { id: '5', client: 'Pedro Santos', package: 'Start+', status: 'completed', statusLabel: 'Concluído', date: '2024-01-15' },
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

export default function AdminDashboardPage() {
  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Painel administrativo</h1>
        <p className="text-slate-600 mt-1">Gestão de processos — Cia do Visto</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 ${stat.bg} rounded-xl mb-3`}>
              <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="font-bold text-slate-900 text-xl mb-0.5">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className={`text-xs font-semibold mt-1 ${stat.color}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Processes */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Processos recentes</h2>
          <Link href="/admin/processos" className="text-sm text-blue-700 font-semibold hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pacote</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_PROCESSES.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-xs">{p.client[0]}</span>
                      </div>
                      <span className="font-medium text-slate-900">{p.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{p.package}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[p.status]}`}>
                      {p.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">{p.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/processos/${p.id}`}
                      className="text-sm text-blue-700 font-semibold hover:underline"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Gerenciar datas', desc: 'Adicionar/remover datas disponíveis', href: '/admin/datas', icon: '📅' },
          { label: 'Todos os processos', desc: 'Filtrar e buscar por status', href: '/admin/processos', icon: '📋' },
          { label: 'Configurações', desc: 'Preços, WhatsApp e integrações', href: '/admin/configuracoes', icon: '⚙️' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="text-2xl mb-3">{action.icon}</div>
            <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{action.label}</p>
            <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
