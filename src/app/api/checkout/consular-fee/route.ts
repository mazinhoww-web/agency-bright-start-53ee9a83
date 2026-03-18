import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { processId, amountBrl, paymentMethod = 'pix' } = body

    if (!processId || !amountBrl) {
      return NextResponse.json({ error: 'processId e amountBrl são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar que o processo pertence ao usuário
    const { data: process, error: processError } = await supabase
      .from('processes')
      .select('id, user_id, status')
      .eq('id', processId)
      .eq('user_id', user.id)
      .single()

    if (processError || !process) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
    }

    // Buscar dados do usuário (nome, email, etc.) dos applicants
    const { data: primaryApplicant } = await supabase
      .from('applicants')
      .select('given_name, surname, email, phone_mobile, phone_residential')
      .eq('process_id', processId)
      .eq('is_primary', true)
      .single() as { data: { given_name: string | null; surname: string | null; email: string | null; phone_mobile: string | null; phone_residential: string | null } | null }

    const customerName = primaryApplicant
      ? `${primaryApplicant.given_name || ''} ${primaryApplicant.surname || ''}`.trim()
      : user.email?.split('@')[0] || 'Cliente'
    const customerEmail = primaryApplicant?.email || user.email || ''
    const customerPhone = primaryApplicant?.phone_mobile || primaryApplicant?.phone_residential || ''

    if (paymentMethod === 'pix') {
      if (!process.env.ABACATEPAY_API_KEY) {
        return NextResponse.json(
          { error: 'AbacatePay não configurado. Defina ABACATEPAY_API_KEY no .env.local' },
          { status: 500 }
        )
      }

      const finalAmountCents = Math.round(amountBrl * 100)

      const abacateRes = await fetch('https://api.abacatepay.com/v1/billing/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        },
        body: JSON.stringify({
          frequency: 'ONE_TIME',
          methods: ['PIX'],
          products: [
            {
              externalId: `consular-fee-${processId}`,
              name: 'Taxa Consular Americana (MRV)',
              description: 'Taxa MRV — US$ 185 por solicitante',
              quantity: 1,
              price: finalAmountCents,
            },
          ],
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=consular_success`,
          completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=consular_success`,
          customer: {
            name: customerName,
            email: customerEmail,
            cellphone: customerPhone ? customerPhone.replace(/\D/g, '') : undefined,
          },
          metadata: {
            processId,
            type: 'consular_fee',
          },
        }),
      })

      if (!abacateRes.ok) {
        const errData = await abacateRes.json().catch(() => ({}))
        console.error('AbacatePay consular fee error:', abacateRes.status, errData)
        return NextResponse.json(
          { error: errData?.error || `AbacatePay retornou ${abacateRes.status}` },
          { status: 502 }
        )
      }

      const abacateData = await abacateRes.json()
      const charge = abacateData?.data?.charges?.[0]

      if (!charge) {
        return NextResponse.json({ error: 'Resposta inválida do AbacatePay' }, { status: 502 })
      }

      const chargeId = abacateData?.data?.id || charge.id

      // Salvar o charge_id no processo
      await supabase
        .from('processes')
        .update({ consular_payment_id: chargeId })
        .eq('id', processId)

      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 30)

      return NextResponse.json({
        method: 'pix',
        qr_code_base64: charge.brCodeBase64 || null,
        pix_copy_paste: charge.brCode,
        expires_at: expiresAt.toISOString(),
        charge_id: chargeId,
        amount_cents: finalAmountCents,
        amount_brl: amountBrl,
      })
    } else {
      // Cartão via Stripe
      if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
          { error: 'Stripe não configurado. Defina STRIPE_SECRET_KEY no .env.local' },
          { status: 500 }
        )
      }

      const finalAmountCents = Math.round(amountBrl * 100)

      const stripe = new (await import('stripe')).default(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia',
      })

      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmountCents,
        currency: 'brl',
        payment_method_types: ['card'],
        metadata: {
          processId,
          type: 'consular_fee',
          customerEmail,
        },
        description: 'Taxa Consular Americana — Cia do Visto',
        receipt_email: customerEmail,
      })

      // Salvar o payment_intent_id no processo
      await supabase
        .from('processes')
        .update({ consular_payment_id: paymentIntent.id })
        .eq('id', processId)

      return NextResponse.json({
        method: 'card',
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount_cents: finalAmountCents,
      })
    }
  } catch (error: unknown) {
    console.error('Consular fee checkout error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
