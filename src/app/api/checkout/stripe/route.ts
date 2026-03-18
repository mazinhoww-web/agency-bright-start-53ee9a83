import { NextRequest, NextResponse } from 'next/server'
import { PACKAGES } from '@/config/packages'
import type { PackageId } from '@/config/packages'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, cpf, packageId, couponCode, amountBrl } = body

    if (!packageId || !email || !name || !cpf) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando: name, email, cpf, packageId' }, { status: 400 })
    }

    const pkg = PACKAGES[packageId as PackageId]
    if (!pkg) {
      return NextResponse.json({ error: 'Pacote inválido' }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe não configurado. Defina STRIPE_SECRET_KEY no .env.local' }, { status: 500 })
    }

    // Calcular valor: usar amountBrl se fornecido (desconto de cupom já aplicado), senão usar preço do pacote
    const baseAmountCents = amountBrl ? Math.round(amountBrl * 100) : pkg.priceInCents

    // Aplicar markup de 10% para cartão de crédito
    const CARD_MARKUP = 1.10
    const finalAmountCents = Math.round(baseAmountCents * CARD_MARKUP)

    const stripe = new (await import('stripe')).default(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountCents,
      currency: 'brl',
      payment_method_types: ['card'],
      metadata: {
        packageId,
        packageName: pkg.name,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || '',
        customerCpf: cpf,
        couponCode: couponCode || '',
        baseAmountCents: String(baseAmountCents),
      },
      description: `Assessoria Cia do Visto — ${pkg.name}`,
      receipt_email: email,
    })

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount_cents: finalAmountCents,
    })
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
