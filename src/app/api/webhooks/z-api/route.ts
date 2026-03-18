import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Z-API envia mensagens recebidas para este webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Estrutura do payload Z-API para mensagens recebidas
    const fromPhone = body?.phone || body?.from || body?.sender?.phone
    const fromName = body?.senderName || body?.sender?.name || null
    const messageText = body?.text?.message || body?.message || null

    // Ignorar mensagens enviadas pelo próprio número
    if (body?.fromMe) {
      return NextResponse.json({ received: true })
    }

    if (!fromPhone || !messageText) {
      return NextResponse.json({ received: true })
    }

    // Salvar mensagem recebida no banco
    const { error } = await supabaseAdmin
      .from('whatsapp_inbound')
      .insert({
        from_phone: fromPhone,
        from_name: fromName,
        message: messageText,
        is_read: false,
        z_api_data: body,
      })

    if (error) {
      console.error('Error saving inbound message:', error)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Z-API webhook error:', error)
    return NextResponse.json({ received: true })
  }
}
