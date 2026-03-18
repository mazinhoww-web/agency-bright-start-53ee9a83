'use client'

import { useState, useEffect } from 'react'

type Coupon = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  influencer_name: string | null
  influencer_email: string | null
  max_uses: number | null
  uses_count: number
  total_revenue_generated: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

const emptyForm: {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  influencer_name: string
  influencer_email: string
  max_uses: string
  expires_at: string
} = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  influencer_name: '',
  influencer_email: '',
  max_uses: '',
  expires_at: '',
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json()
      setCoupons(data.coupons || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        influencer_name: form.influencer_name || null,
        influencer_email: form.influencer_email || null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Erro ao criar cupom')
      return
    }

    setShowModal(false)
    setForm(emptyForm)
    fetchCoupons()
  }

  const toggleActive = async (coupon: Coupon) => {
    await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
    })
    fetchCoupons()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cupom?')) return
    await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' })
    fetchCoupons()
  }

  const formatDiscount = (c: Coupon) =>
    c.discount_type === 'percentage' ? `${c.discount_value}%` : `R$ ${c.discount_value.toFixed(2)}`

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cupons & Indicações</h1>
          <p className="text-slate-600 mt-1">Gerencie cupons de desconto e indicações de influenciadores</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Novo cupom
        </button>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total de cupons', value: coupons.length },
          { label: 'Cupons ativos', value: coupons.filter(c => c.is_active).length },
          { label: 'Usos totais', value: coupons.reduce((s, c) => s + c.uses_count, 0) },
          { label: 'Receita gerada', value: `R$ ${coupons.reduce((s, c) => s + (c.total_revenue_generated || 0), 0).toFixed(0)}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Nenhum cupom cadastrado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Código', 'Desconto', 'Influenciador', 'Usos', 'Receita', 'Validade', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-sm">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-green-700">{formatDiscount(coupon)}</td>
                    <td className="px-5 py-4">
                      {coupon.influencer_name ? (
                        <div>
                          <p className="text-sm font-medium text-slate-900">{coupon.influencer_name}</p>
                          {coupon.influencer_email && (
                            <p className="text-xs text-slate-500">{coupon.influencer_email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {coupon.uses_count}
                      {coupon.max_uses && <span className="text-slate-400"> / {coupon.max_uses}</span>}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      R$ {(coupon.total_revenue_generated || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {coupon.expires_at
                        ? new Intl.DateTimeFormat('pt-BR').format(new Date(coupon.expires_at))
                        : <span className="text-slate-400">Sem validade</span>}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                          coupon.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {coupon.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal novo cupom */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Novo cupom</h2>
              <button onClick={() => { setShowModal(false); setError('') }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Código do cupom *</label>
                <input
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="EX: INFLUENCER10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo *</label>
                  <select
                    value={form.discount_type}
                    onChange={e => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {form.discount_type === 'percentage' ? 'Desconto (%) *' : 'Valor (R$) *'}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    max={form.discount_type === 'percentage' ? '100' : undefined}
                    value={form.discount_value}
                    onChange={e => setForm({ ...form, discount_value: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    placeholder={form.discount_type === 'percentage' ? '10' : '50'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do influenciador</label>
                <input
                  value={form.influencer_name}
                  onChange={e => setForm({ ...form, influencer_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="João Influencer"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail do influenciador</label>
                <input
                  type="email"
                  value={form.influencer_email}
                  onChange={e => setForm({ ...form, influencer_email: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="joao@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Limite de usos</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses}
                    onChange={e => setForm({ ...form, max_uses: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Validade</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={e => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError('') }}
                  className="flex-1 border-2 border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:border-slate-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {saving ? 'Criando...' : 'Criar cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
