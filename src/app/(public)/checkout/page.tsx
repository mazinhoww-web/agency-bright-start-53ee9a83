'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PACKAGES } from '@/config/packages'
import { formatCurrencyFromCents } from '@/utils/currency'
import type { PackageId } from '@/config/packages'

const PAYMENT_METHODS = [
  {
    id: 'card',
    label: 'Cartão de crédito',
    description: 'Visa, Mastercard, Elo, Amex',
    icon: (
      <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'pix',
    label: 'PIX',
    description: 'Aprovação imediata',
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

function CheckoutPageInner() {
  const searchParams = useSearchParams()
  const defaultPkg = (searchParams.get('package') as PackageId) || 'pro_plus'
  const [selectedPackage, setSelectedPackage] = useState<PackageId>(
    Object.keys(PACKAGES).includes(defaultPkg) ? defaultPkg : 'pro_plus'
  )
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('pix')
  const [step, setStep] = useState<1 | 2>(1)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', cpf: '' })
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount_in_cents: number; final_amount_in_cents: number; coupon: { id: string; code: string; discount_type: string; discount_value: number; influencer_name: string | null } } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const pkg = PACKAGES[selectedPackage]

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setCouponResult(null)

    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, amountInCents: pkg.priceInCents }),
    })
    const data = await res.json()
    setCouponLoading(false)

    if (!res.ok) {
      setCouponError(data.error || 'Cupom inválido')
      return
    }

    setCouponResult(data)
  }

  const finalPriceInCents = couponResult ? couponResult.final_amount_in_cents : pkg.priceInCents

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: integrar com API de checkout
    setTimeout(() => {
      setLoading(false)
      alert('Redirecionando para pagamento...')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="font-bold text-slate-900">Cia do Visto</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pagamento seguro
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {['Escolha do plano', 'Seus dados', 'Pagamento'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i + 1 <= step ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm hidden sm:block ${i + 1 <= step ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {label}
                </span>
                {i < 2 && <div className="w-8 h-px bg-slate-200 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {step === 1 ? (
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Escolha seu plano</h1>
                <p className="text-slate-600 mb-8">Selecione o pacote ideal para você ou sua família.</p>

                <div className="space-y-4 mb-8">
                  {Object.values(PACKAGES).map((p) => (
                    <label
                      key={p.id}
                      className={`relative flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPackage === p.id
                          ? 'border-blue-700 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="package"
                        value={p.id}
                        checked={selectedPackage === p.id}
                        onChange={() => setSelectedPackage(p.id as PackageId)}
                        className="mt-1 accent-blue-700"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{p.name}</span>
                            {'badge' in p && p.badge && (
                              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                                {p.badge}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-blue-700">
                            {formatCurrencyFromCents(p.priceInCents)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">
                          Até {p.maxApplicants} {p.maxApplicants === 1 ? 'solicitante' : 'solicitantes'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {p.features.slice(0, 3).map((f) => (
                            <span key={f} className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                              {f}
                            </span>
                          ))}
                          {p.features.length > 3 && (
                            <span className="text-xs text-blue-600">+{p.features.length - 3} mais</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <h2 className="text-lg font-bold text-slate-900 mb-4">Forma de pagamento</h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === m.id
                          ? 'border-blue-700 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id as 'card' | 'pix')}
                        className="accent-blue-700"
                      />
                      {m.icon}
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{m.label}</p>
                        <p className="text-xs text-slate-500">{m.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
                >
                  Continuar →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Seus dados</h1>
                <p className="text-slate-600 mb-8">Preencha os dados do responsável pelo pagamento.</p>

                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all"
                      placeholder="João da Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all"
                      placeholder="joao@email.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">CPF *</label>
                      <input
                        type="text"
                        required
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </div>

                {/* Cupom de desconto */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Cupom de desconto</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setCouponError('') }}
                      placeholder="EX: PROMO10"
                      className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="border-2 border-blue-700 text-blue-700 font-semibold px-5 py-3 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors text-sm"
                    >
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600 mt-2">{couponError}</p>
                  )}
                  {couponResult && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-xl border border-green-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        Cupom <strong>{couponResult.coupon.code}</strong> aplicado!
                        {couponResult.coupon.discount_type === 'percentage'
                          ? ` ${couponResult.coupon.discount_value}% de desconto`
                          : ` R$ ${(couponResult.discount_in_cents / 100).toFixed(2)} de desconto`}
                        {couponResult.coupon.influencer_name && ` · Indicação de ${couponResult.coupon.influencer_name}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold py-4 px-8 rounded-xl transition-colors"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white font-bold py-4 px-8 rounded-xl transition-colors"
                  >
                    {loading ? 'Processando...' : `Pagar ${formatCurrencyFromCents(finalPriceInCents)}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h3 className="font-bold text-slate-900 mb-6 text-lg">Resumo do pedido</h3>
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-900">{pkg.name}</span>
                  <span className="font-bold text-blue-900">{formatCurrencyFromCents(pkg.priceInCents)}</span>
                </div>
                <p className="text-sm text-blue-700">Até {pkg.maxApplicants} {pkg.maxApplicants === 1 ? 'solicitante' : 'solicitantes'}</p>
              </div>
              <ul className="space-y-2 mb-6">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Assessoria</span>
                  <span>{formatCurrencyFromCents(pkg.priceInCents)}</span>
                </div>
                {couponResult && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Desconto ({couponResult.coupon.code})</span>
                    <span>- {formatCurrencyFromCents(couponResult.discount_in_cents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-500 italic">
                  <span>Taxa consular (separado)</span>
                  <span>US$ 185/pessoa</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-lg border-t pt-2">
                  <span>Total hoje</span>
                  <span>{formatCurrencyFromCents(finalPriceInCents)}</span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Pagamento 100% seguro e criptografado
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutPageInner />
    </Suspense>
  )
}
