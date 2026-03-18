import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppText } from '@/lib/zapi/client'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, message, event, processId } = body

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone e message são obrigatórios' }, { status: 400 })
    }

    let status = 'sent'
    let zapiResponse: Record<string, unknown> | null = null

    try {
      zapiResponse = await sendWhatsAppText({ phone, message })
    } catch (err) {
      status = 'failed'
      console.error('Z-API send error:', err)
    }

    await supabaseAdmin.from('whatsapp_logs').insert({
      process_id: processId || null,
      to_number: phone,
      message,
      event: event || null,
      status,
      z_api_response: zapiResponse,
    })

    if (status === 'failed') {
      return NextResponse.json({ error: 'Falha ao enviar mensagem' }, { status: 502 })
    }

    return NextResponse.json({ success: true, response: zapiResponse })
  } catch (error) {
    console.error('WhatsApp route error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
