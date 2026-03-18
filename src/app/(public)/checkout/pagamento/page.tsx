'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getStripe } from '@/lib/stripe/client'
import type { Stripe, StripeCardElement } from '@stripe/stripe-js'
import { formatCurrencyFromCents } from '@/utils/currency'

type PaymentData = {
  client_secret: string
  payment_intent_id: string
  amount_cents: number
  package_name: string
  customer_email: string
}

export default function CheckoutPagamentoPage() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [cardReady, setCardReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Ler dados do sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('stripe_payment_intent')
    if (!raw) {
      router.replace('/checkout')
      return
    }
    try {
      setPaymentData(JSON.parse(raw))
    } catch {
      router.replace('/checkout')
    }
  }, [router])

  // Montar Stripe Card Element
  const initStripe = useCallback(async () => {
    if (!cardRef.current || !paymentData) return

    const stripeInstance = await getStripe()
    if (!stripeInstance) return

    const elements = stripeInstance.elements({
      locale: 'pt-BR',
    })

    const card = elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          fontSize: '16px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          color: '#1e293b',
          '::placeholder': { color: '#94a3b8' },
          iconColor: '#1d4ed8',
        },
        invalid: {
          color: '#dc2626',
          iconColor: '#dc2626',
        },
      },
    })

    card.mount(cardRef.current)
    card.on('ready', () => setCardReady(true))
    card.on('change', (e) => {
      if (e.error) setError(e.error.message)
      else setError('')
    })

    setStripe(stripeInstance)
    setCardElement(card)
  }, [paymentData])

  useEffect(() => {
    if (paymentData) initStripe()
    return () => {
      cardElement?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !cardElement || !paymentData) return

    setLoading(true)
    setError('')

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      paymentData.client_secret,
      {
        payment_method: {
          card: cardElement,
          billing_details: { email: paymentData.customer_email },
        },
      }
    )

    if (stripeError) {
      setError(stripeError.message || 'Erro ao processar o pagamento. Tente novamente.')
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      sessionStorage.removeItem('stripe_payment_intent')
      router.push('/dashboard?payment=success')
    } else {
      setError('Pagamento não confirmado. Entre em contato pelo WhatsApp.')
      setLoading(false)
    }
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="font-bold text-xl text-slate-900">Cia do Visto</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Resumo do pedido */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-1">
              Resumo do pedido
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-900 font-medium">
                Assessoria — {paymentData.package_name}
              </span>
              <span className="text-lg font-bold text-blue-900">
                {formatCurrencyFromCents(paymentData.amount_cents)}
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">{paymentData.customer_email}</p>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-1">Dados do cartão</h2>
          <p className="text-sm text-slate-500 mb-5">
            Pagamento processado com segurança via Stripe.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Stripe Card Element */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Número do cartão
              </label>
              <div
                ref={cardRef}
                className="border border-slate-300 rounded-xl px-4 py-3.5 bg-white focus-within:ring-2 focus-within:ring-blue-700 focus-within:border-transparent transition-all min-h-[50px]"
              />
              {!cardReady && (
                <p className="text-xs text-slate-400 mt-1">Carregando formulário seguro...</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !cardReady}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white font-bold py-4 rounded-xl transition-colors text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </span>
              ) : (
                `Pagar ${formatCurrencyFromCents(paymentData.amount_cents)}`
              )}
            </button>
          </form>

          {/* Segurança */}
          <div className="flex items-center justify-center gap-2 mt-5 text-xs text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Pagamento seguro com criptografia SSL</span>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link href="/checkout" className="text-blue-700 hover:underline">
            ← Voltar ao checkout
          </Link>
        </p>
      </div>
    </div>
  )
}
