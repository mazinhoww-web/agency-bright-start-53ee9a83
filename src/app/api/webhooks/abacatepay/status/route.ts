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

    const res = await fetch(
      `https://api.abacatepay.com/v1/billing/getById?id=${encodeURIComponent(chargeId)}`,
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

    const data = await res.json()
    const billing = data?.data ?? data

    // O billing está pago se houver um charge com status PAID
    const charges: Array<{ status?: string }> = billing?.charges ?? []
    const paid =
      charges.some((c) => c.status === 'PAID') ||
      billing?.status === 'PAID'

    return NextResponse.json({ paid })
  } catch (error) {
    console.error('AbacatePay status check error:', error)
    return NextResponse.json({ paid: false })
  }
}
