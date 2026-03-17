'use client'

import { useState } from 'react'
import { CONSULADOS, CASVS } from '@/config/locations'

type LocationType = 'casv' | 'consulate'

const mockDates = [
  { id: '1', location_type: 'casv' as LocationType, city: 'São Paulo', date: '2024-02-10', is_active: true },
  { id: '2', location_type: 'casv' as LocationType, city: 'São Paulo', date: '2024-02-17', is_active: true },
  { id: '3', location_type: 'casv' as LocationType, city: 'Rio de Janeiro', date: '2024-02-12', is_active: true },
  { id: '4', location_type: 'consulate' as LocationType, city: 'São Paulo', date: '2024-02-15', is_active: true },
  { id: '5', location_type: 'consulate' as LocationType, city: 'Brasília', date: '2024-02-20', is_active: false },
]

export default function DatasPage() {
  const [dates, setDates] = useState(mockDates)
  const [tab, setTab] = useState<LocationType>('casv')
  const [newDate, setNewDate] = useState({ city: '', date: '' })

  const filtered = dates.filter((d) => d.location_type === tab)
  const locations = tab === 'casv' ? CASVS : CONSULADOS

  const handleAdd = () => {
    if (!newDate.city || !newDate.date) return
    setDates([...dates, {
      id: `d${Date.now()}`,
      location_type: tab,
      city: newDate.city,
      date: newDate.date,
      is_active: true,
    }])
    setNewDate({ city: '', date: '' })
  }

  const toggleActive = (id: string) => {
    setDates(dates.map((d) => d.id === id ? { ...d, is_active: !d.is_active } : d))
  }

  const removeDate = (id: string) => {
    setDates(dates.filter((d) => d.id !== id))
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Datas disponíveis</h1>
        <p className="text-slate-600 mt-1">Gerencie as datas que aparecem para os clientes na solicitação de agendamento.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'casv' as LocationType, label: 'CASV (Biometria)' },
          { value: 'consulate' as LocationType, label: 'Consulado (Entrevista)' },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.value
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add Date */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-4">Adicionar data</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={newDate.city}
            onChange={(e) => setNewDate({ ...newDate, city: e.target.value })}
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
          >
            <option value="">Selecione a cidade</option>
            {locations.map((l) => (
              <option key={l.id} value={l.city}>{l.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={newDate.date}
            onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
          />
          <button
            onClick={handleAdd}
            disabled={!newDate.city || !newDate.date}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
          >
            + Adicionar
          </button>
        </div>
      </div>

      {/* Dates List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <p className="text-sm font-semibold text-slate-700">{filtered.length} datas cadastradas</p>
        </div>
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <p>Nenhuma data cadastrada para {tab === 'casv' ? 'CASV' : 'Consulado'}.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Cidade</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{d.city}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d.date + 'T12:00:00'))}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {d.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(d.id)}
                      className="text-sm text-blue-700 font-semibold hover:underline mr-3"
                    >
                      {d.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => removeDate(d.id)}
                      className="text-sm text-red-600 font-semibold hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
