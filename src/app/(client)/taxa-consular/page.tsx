'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { calculateConsularFee, formatCurrencyFromCents } from '@/utils/currency'
import { createClient } from '@/lib/supabase/client'

type PixModalData = {
  pix_copy_paste: string
  qr_code_base64: string | null
  expires_at: string
  charge_id: string
  amount_cents: number
}

function PixModal({ data, onClose }: { data: PixModalData; onClose: () => void }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)
    return Math.max(0, diff)
  })

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  // Poll for payment confirmation every 5 seconds
  useEffect(() => {
    if (!data.charge_id) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/webhooks/abacatepay/status?chargeId=${data.charge_id}`)
        if (res.ok) {
          const d = await res.json()
          if (d.paid) {
            router.push('/dashboard?payment=consular_success')
          }
        }
      } catch {
        // silently ignore polling errors
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [data.charge_id, router])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.pix_copy_paste)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const minutes = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Pagar Taxa Consular via PIX</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-5">
          <p className="text-slate-600 text-sm mb-1">Valor a pagar</p>
          <p className="text-3xl font-bold text-slate-900">{formatCurrencyFromCents(data.amount_cents)}</p>
          {secondsLeft > 0 ? (
            <p className="text-sm text-amber-600 mt-1">
              Expira em {minutes}:{String(secs).padStart(2, '0')}
            </p>
          ) : (
            <p className="text-sm text-red-600 mt-1">PIX expirado</p>
          )}
        </div>

        {data.qr_code_base64 && (
          <div className="flex justify-center mb-5">
            <img
              src={`data:image/png;base64,${data.qr_code_base64}`}
              alt="QR Code PIX"
              className="w-48 h-48 rounded-xl border border-slate-200"
            />
          </div>
        )}

        <div className="mb-5">
          <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wide">PIX Copia e Cola</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-mono break-all mb-3 max-h-24 overflow-y-auto">
            {data.pix_copy_paste}
          </div>
          <button
            onClick={handleCopy}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            }`}
          >
            {copied ? 'Copiado!' : 'Copiar código PIX'}
          </button>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
          <p className="font-semibold mb-0.5">Como pagar:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>Abra o app do seu banco</li>
            <li>Vá em PIX {'>'} Pagar</li>
            <li>Cole o código acima ou escaneie o QR Code</li>
            <li>Confirme o pagamento</li>
          </ol>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          Após o pagamento, seu processo será atualizado automaticamente.
        </p>
      </div>
    </div>
  )
}

export default function TaxaConsularPage() {
  const router = useRouter()
  const supabase = createClient()
  const [usdRate, setUsdRate] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('pix')
  const [loading, setLoading] = useState(false)
  const [loadingRate, setLoadingRate] = useState(true)
  const [processId, setProcessId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pixModal, setPixModal] = useState<PixModalData | null>(null)

  const [applicantsCount, setApplicantsCount] = useState(1)
  const USD_AMOUNT = 185

  useEffect(() => {
    // Buscar processo do usuário e contagem de solicitantes
    const fetchProcess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: process } = await supabase
        .from('processes')
        .select('id, max_applicants')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: { id: string; max_applicants: number } | null }

      if (process) {
        setProcessId(process.id)
        setApplicantsCount(process.max_applicants || 1)
      }
    }

    fetchProcess()

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
    if (!fee) return
    setLoading(true)
    setError('')

    if (!processId) {
      setError('Processo não encontrado. Entre em contato pelo WhatsApp.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/checkout/consular-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processId,
          amountBrl: fee.totalBrl / 100,
          paymentMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao processar pagamento. Tente novamente.')
        setLoading(false)
        return
      }

      if (paymentMethod === 'pix') {
        setPixModal({
          pix_copy_paste: data.pix_copy_paste,
          qr_code_base64: data.qr_code_base64,
          expires_at: data.expires_at,
          charge_id: data.charge_id,
          amount_cents: data.amount_cents,
        })
        setLoading(false)
      } else {
        // Cartão — salvar client_secret e redirecionar para Stripe
        sessionStorage.setItem('stripe_consular_payment', JSON.stringify({
          client_secret: data.client_secret,
          payment_intent_id: data.payment_intent_id,
          amount_cents: data.amount_cents,
          process_id: processId,
        }))
        router.push('/dashboard/taxa-consular/pagamento')
      }
    } catch (err) {
      console.error('Consular fee payment error:', err)
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <>
      {pixModal && (
        <PixModal
          data={pixModal}
          onClose={() => setPixModal(null)}
        />
      )}

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

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading || loadingRate}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white font-bold py-4 rounded-xl transition-colors text-lg"
          >
            {loading
              ? 'Processando...'
              : paymentMethod === 'pix'
                ? `Gerar PIX ${fee?.totalFormatted || ''}`
                : `Pagar com cartão ${fee?.totalFormatted || ''}`}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
          <strong>Aviso:</strong> O pagamento da taxa não garante agendamento imediato. A disponibilidade depende do consulado americano. Após o pagamento, você poderá solicitar suas datas preferidas no próximo passo.
        </div>
      </div>
    </>
  )
}
