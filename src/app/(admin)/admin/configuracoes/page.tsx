'use client'

import { useState, useEffect } from 'react'

export default function ConfiguracoesPage() {
  const [prices, setPrices] = useState({
    price_start_plus: 299,
    price_pro_plus: 599,
    price_vip_plus: 999,
    consular_fee_usd: 185,
    markup_card: 1.10,
    markup_pix: 1.15,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchConfig() {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/config')
        const data = await res.json()
        if (data?.config) {
          const c = data.config
          setPrices({
            price_start_plus: Number(c.price_start_plus ?? 299),
            price_pro_plus: Number(c.price_pro_plus ?? 599),
            price_vip_plus: Number(c.price_vip_plus ?? 999),
            consular_fee_usd: Number(c.consular_fee_usd ?? 185),
            markup_card: Number(c.markup_card ?? 1.10),
            markup_pix: Number(c.markup_pix ?? 1.15),
          })
        }
      } catch (err) {
        console.error('Error fetching config:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: Record<string, string> = {
        price_start_plus: String(prices.price_start_plus),
        price_pro_plus: String(prices.price_pro_plus),
        price_vip_plus: String(prices.price_vip_plus),
        consular_fee_usd: String(prices.consular_fee_usd),
        markup_card: String(prices.markup_card),
        markup_pix: String(prices.markup_pix),
      }
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Error saving config:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-600 mt-1">Preços, integrações e configurações gerais.</p>
      </div>

      {loading && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-sm text-slate-500">
          Carregando configurações...
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-800 font-semibold">Configurações salvas com sucesso!</p>
        </div>
      )}

      {/* Preços dos pacotes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-5">Preços dos pacotes (R$)</h2>
        <div className="space-y-4">
          {[
            { key: 'price_start_plus' as const, label: 'Start+ (1 solicitante)' },
            { key: 'price_pro_plus' as const, label: 'Pro+ (até 3 solicitantes)' },
            { key: 'price_vip_plus' as const, label: 'Vip+ (até 6 solicitantes)' },
          ].map((pkg) => (
            <div key={pkg.key} className="flex items-center gap-4">
              <label className="flex-1 text-sm font-semibold text-slate-700">{pkg.label}</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">R$</span>
                <input
                  type="number"
                  value={prices[pkg.key]}
                  onChange={(e) => setPrices({ ...prices, [pkg.key]: Number(e.target.value) })}
                  disabled={loading}
                  className="w-28 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Câmbio / Taxa consular */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-5">Taxa consular e câmbio</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex-1 text-sm font-semibold text-slate-700">Taxa consular (US$ por pessoa)</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm">US$</span>
              <input
                type="number"
                value={prices.consular_fee_usd}
                onChange={(e) => setPrices({ ...prices, consular_fee_usd: Number(e.target.value) })}
                disabled={loading}
                className="w-24 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900 disabled:opacity-60"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex-1 text-sm font-semibold text-slate-700">Spread cartão (ex: 1.10 = +10%)</label>
            <input
              type="number"
              step="0.01"
              value={prices.markup_card}
              onChange={(e) => setPrices({ ...prices, markup_card: Number(e.target.value) })}
              disabled={loading}
              className="w-24 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900 disabled:opacity-60"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex-1 text-sm font-semibold text-slate-700">Spread PIX (ex: 1.15 = +15%)</label>
            <input
              type="number"
              step="0.01"
              value={prices.markup_pix}
              onChange={(e) => setPrices({ ...prices, markup_pix: Number(e.target.value) })}
              disabled={loading}
              className="w-24 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900 disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Integrações */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-5">Integrações</h2>
        <div className="space-y-4">
          {[
            { label: 'Supabase URL', key: 'NEXT_PUBLIC_SUPABASE_URL', masked: false },
            { label: 'Stripe (chave pública)', key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', masked: true },
            { label: 'Z-API Instance ID', key: 'ZAPI_INSTANCE_ID', masked: true },
            { label: 'WhatsApp de contato', key: 'NEXT_PUBLIC_WHATSAPP_NUMBER', masked: false },
            { label: 'E-mail admin', key: 'ADMIN_EMAIL', masked: false },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.label}</label>
              <input
                type={field.masked ? 'password' : 'text'}
                placeholder={`${field.key}=...`}
                disabled
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Configurado via variáveis de ambiente (.env.local)</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || loading}
        className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white font-bold py-4 rounded-xl transition-colors text-lg"
      >
        {saving ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </div>
  )
}
