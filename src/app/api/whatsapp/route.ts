import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, message, event, processId } = body

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone e message são obrigatórios' }, { status: 400 })
    }

    // TODO: Fase 3
    // const { sendWhatsAppText } = await import('@/lib/zapi/client')
    // const result = await sendWhatsAppText({ phone, message })
    // Salvar log no Supabase

    return NextResponse.json({ message: 'WhatsApp — em desenvolvimento' })
  } catch (error) {
    console.error('WhatsApp route error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
