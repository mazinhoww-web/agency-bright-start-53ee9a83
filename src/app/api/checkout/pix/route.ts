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

    if (!process.env.ABACATEPAY_API_KEY) {
      return NextResponse.json({ error: 'AbacatePay não configurado. Defina ABACATEPAY_API_KEY no .env.local' }, { status: 500 })
    }

    // Calcular valor: usar amountBrl se fornecido (desconto de cupom já aplicado), senão usar preço do pacote
    // PIX: markup de 15% para cobrir spread cambial e taxas
    const baseAmountCents = amountBrl ? Math.round(amountBrl * 100) : pkg.priceInCents
    const PIX_MARKUP = 1.15
    const finalAmountCents = Math.round(baseAmountCents * PIX_MARKUP)
    const finalAmountBrl = finalAmountCents / 100

    // Formatar CPF (remover formatação)
    const cpfClean = cpf.replace(/\D/g, '')

    // Chamar API do AbacatePay para criar cobrança PIX
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
            externalId: packageId,
            name: `Assessoria Cia do Visto — ${pkg.name}`,
            description: pkg.features.slice(0, 2).join(', '),
            quantity: 1,
            price: finalAmountCents,
          },
        ],
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        customer: {
          name,
          email,
          cellphone: phone ? phone.replace(/\D/g, '') : undefined,
          taxId: cpfClean,
        },
        metadata: {
          packageId,
          couponCode: couponCode || '',
          baseAmountCents: String(baseAmountCents),
        },
      }),
    })

    if (!abacateRes.ok) {
      const errData = await abacateRes.json().catch(() => ({}))
      console.error('AbacatePay API error:', abacateRes.status, errData)
      return NextResponse.json(
        { error: errData?.error || `AbacatePay retornou ${abacateRes.status}` },
        { status: 502 }
      )
    }

    const abacateData = await abacateRes.json()

    // AbacatePay retorna o PIX na estrutura: data.charges[0].brCode / brCodeBase64
    const charge = abacateData?.data?.charges?.[0]
    if (!charge) {
      console.error('AbacatePay: estrutura de resposta inesperada', abacateData)
      return NextResponse.json({ error: 'Resposta inválida do AbacatePay' }, { status: 502 })
    }

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    return NextResponse.json({
      qr_code_base64: charge.brCodeBase64 || null,
      pix_copy_paste: charge.brCode,
      expires_at: expiresAt.toISOString(),
      charge_id: abacateData?.data?.id || charge.id,
      amount_cents: finalAmountCents,
      amount_brl: finalAmountBrl,
    })
  } catch (error: unknown) {
    console.error('PIX checkout error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
