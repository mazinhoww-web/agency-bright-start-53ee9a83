const ABACATE_BASE = 'https://api.abacatepay.com/v1'

export async function createPixCharge(params: {
  amount: number // em centavos
  description: string
  customer: {
    name: string
    email: string
    cpfCnpj: string
    phone: string
  }
  externalId: string
  expiresIn?: number // segundos, padrão 3600
}) {
  const res = await fetch(`${ABACATE_BASE}/billing/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    },
    body: JSON.stringify({
      frequency: 'ONE_TIME',
      methods: ['PIX'],
      products: [
        {
          externalId: params.externalId,
          name: params.description,
          quantity: 1,
          price: params.amount,
        },
      ],
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/abacatepay`,
      customer: params.customer,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`AbacatePay error: ${error}`)
  }

  return res.json()
}
