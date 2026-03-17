import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { packageId, customerEmail, customerName, cpfCnpj, phone } = body

    if (!packageId || !customerEmail || !cpfCnpj) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // TODO: Fase 3
    // const { createPixCharge } = await import('@/lib/abacatepay/client')
    // const charge = await createPixCharge({ ... })
    // return NextResponse.json({ pixCode: charge.pixCode, qrCode: charge.qrCodeImage })

    return NextResponse.json({ message: 'PIX checkout — em desenvolvimento' })
  } catch (error) {
    console.error('PIX checkout error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
