import { NextRequest, NextResponse } from 'next/server'
import { getUsdBrlRate } from '@/utils/currency'

export async function GET(req: NextRequest) {
  const rate = await getUsdBrlRate()
  return NextResponse.json({
    rate,
    timestamp: new Date().toISOString(),
    source: 'AwesomeAPI',
  })
}
