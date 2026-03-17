import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, data } = body

    // TODO: Fase 3
    // Verificar assinatura do webhook
    // Processar evento de pagamento PIX confirmado

    console.log('AbacatePay webhook:', event, data)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('AbacatePay webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
