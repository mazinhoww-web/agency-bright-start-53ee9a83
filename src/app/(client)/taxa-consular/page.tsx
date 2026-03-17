'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { calculateConsularFee, formatCurrencyFromCents } from '@/utils/currency'

export default function TaxaConsularPage() {
  const [usdRate, setUsdRate] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('pix')
  const [loading, setLoading] = useState(false)
  const [loadingRate, setLoadingRate] = useState(true)

  const applicantsCount = 2 // mock — em produção vem do processo
  const USD_AMOUNT = 185

  useEffect(() => {
    fetch('/api/cambio')
      .then((r) => r.json())
      .then((data) => {
        setUsdRate(data.rate)
        setLoadingRate(false)
      })
      .catch(() => {
        setUsdRate(5.90)
        setLoadingRate(false)
      })
  }, [])

  const fee = usdRate
    ? calculateConsularFee({ usdAmount: USD_AMOUNT, usdRate, paymentMethod, applicants: applicantsCount })
    : null

  const handlePay = async () => {
    setLoading(true)
    // TODO: integrar com API de pagamento
    setTimeout(() => {
      setLoading(false)
      alert('Redirecionando para pagamento...')
    }, 1500)
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-700 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900">Taxa consular</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Taxa Consular Americana</h1>
        <p className="text-slate-600">Pague a taxa MRV obrigatória para todos os solicitantes.</p>
      </div>

      {/* Info Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-amber-800 mb-1">Sobre a taxa MRV</p>
            <p className="text-sm text-amber-700">
              A taxa de US$ 185 por pessoa é cobrada diretamente pelo governo americano e é obrigatória para todos os solicitantes de visto B1/B2. O câmbio inclui um spread para cobrir variações cambiais.
            </p>
          </div>
        </div>
      </div>

      {/* Fee Calculator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-6">Cálculo da taxa</h2>

        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Taxa por pessoa</p>
            <p className="text-xl font-bold text-slate-900">US$ {USD_AMOUNT}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Solicitantes</p>
            <p className="text-xl font-bold text-slate-900">{applicantsCount}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Cotação USD/BRL</p>
            {loadingRate ? (
              <div className="h-7 bg-slate-200 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-slate-900">R$ {usdRate?.toFixed(2)}</p>
            )}
          </div>
        </div>

        {/* Payment method */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-3">Forma de pagamento</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: 'pix' as const,
                label: 'PIX',
                markup: '+ 15%',
                icon: (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
              },
              {
                id: 'card' as const,
                label: 'Cartão',
                markup: '+ 10%',
                icon: (
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                ),
              },
            ].map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors min-h-[60px] ${
                  paymentMethod === m.id
                    ? 'border-blue-700 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={m.id}
                  checked={paymentMethod === m.id}
                  onChange={() => setPaymentMethod(m.id)}
                  className="accent-blue-700"
                />
                {m.icon}
                <div>
                  <p className="font-semibold text-sm text-slate-900">{m.label}</p>
                  <p className="text-xs text-slate-500">Spread {m.markup}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Total */}
        {fee && (
          <div className="bg-blue-50 rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-700">Por pessoa ({paymentMethod === 'pix' ? 'PIX' : 'Cartão'})</span>
              <span className="font-semibold text-slate-900">{fee.perApplicantFormatted}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-700">× {applicantsCount} solicitantes</span>
              <span className="font-semibold text-slate-900">{applicantsCount}x</span>
            </div>
            <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-blue-900 text-lg">Total</span>
              <span className="font-bold text-blue-900 text-2xl">{fee.totalFormatted}</span>
            </div>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading || loadingRate}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white font-bold py-4 rounded-xl transition-colors text-lg"
        >
          {loading ? 'Processando...' : `Pagar taxa ${fee?.totalFormatted || ''}`}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
        <strong>Aviso:</strong> O pagamento da taxa não garante agendamento imediato. A disponibilidade depende do consulado americano. Após o pagamento, você poderá solicitar suas datas preferidas no próximo passo.
      </div>
    </div>
  )
}
