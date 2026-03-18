import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const chargeId = searchParams.get('chargeId')

    if (!chargeId) {
      return NextResponse.json({ error: 'chargeId obrigatório' }, { status: 400 })
    }

    if (!process.env.ABACATEPAY_API_KEY) {
      return NextResponse.json({ paid: false, error: 'AbacatePay não configurado' }, { status: 500 })
    }

    // Endpoint oficial: GET /v1/checkouts/get?id={billingId}
    const res = await fetch(
      `https://api.abacatepay.com/v1/checkouts/get?id=${encodeURIComponent(chargeId)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      return NextResponse.json({ paid: false })
    }

    const json = await res.json()

    // Resposta: { data: { status: 'PAID' | 'PENDING' | 'EXPIRED' | ... }, error: null }
    const status: string = json?.data?.status ?? ''
    const paid = status === 'PAID'

    return NextResponse.json({ paid, status })
  } catch (error) {
    console.error('AbacatePay status check error:', error)
    return NextResponse.json({ paid: false })
  }
}
