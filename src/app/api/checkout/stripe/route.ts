import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { packageId, customerEmail, customerName } = body

    if (!packageId || !customerEmail) {
      return NextResponse.json({ error: 'packageId e customerEmail são obrigatórios' }, { status: 400 })
    }

    // TODO: Fase 3
    // const { stripe } = await import('@/lib/stripe/server')
    // const pkg = PACKAGES[packageId as PackageId]
    // const session = await stripe.checkout.sessions.create({ ... })
    // return NextResponse.json({ url: session.url })

    return NextResponse.json({ message: 'Stripe checkout — em desenvolvimento' })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
