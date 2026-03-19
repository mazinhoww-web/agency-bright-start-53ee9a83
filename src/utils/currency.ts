export async function getUsdBrlRate(): Promise<number> {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', {
      next: { revalidate: 0 }, // sempre fresco
    })
    const data = await res.json()
    return parseFloat(data.USDBRL.bid)
  } catch {
    // Fallback: última cotação conhecida + 2% buffer de segurança
    console.error('AwesomeAPI indisponível, usando fallback')
    return 5.85 * 1.02
  }
}

export function calculateConsularFee(params: {
  usdAmount: number
  usdRate: number
  paymentMethod: 'card' | 'pix'
  applicants: number
}) {
  const { usdAmount, usdRate, paymentMethod, applicants } = params
  const markup = 1.10 // mesma taxa independente do método de pagamento
  const perApplicantBrl = usdAmount * usdRate * markup
  const totalBrl = perApplicantBrl * applicants

  return {
    usdAmount,
    usdRate,
    markup,
    perApplicantBrl: Math.round(perApplicantBrl * 100), // em centavos
    totalBrl: Math.round(totalBrl * 100), // em centavos
    perApplicantFormatted: formatCurrency(perApplicantBrl),
    totalFormatted: formatCurrency(totalBrl),
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatCurrencyFromCents(cents: number): string {
  return formatCurrency(cents / 100)
}
