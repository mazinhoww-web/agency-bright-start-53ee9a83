import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { phone, message, processId } = await req.json()

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone e message são obrigatórios' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${appUrl}/api/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message, event: 'admin_manual', processId }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error || 'Falha ao enviar' }, { status: 502 })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin WhatsApp send error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Buscar inbox de mensagens recebidas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const onlyUnread = searchParams.get('unread') === 'true'

    let query = supabaseAdmin
      .from('whatsapp_inbound')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(100)

    if (onlyUnread) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ messages: data })
  } catch (error) {
    console.error('GET whatsapp inbox error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()

    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('whatsapp_inbound')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error('PATCH whatsapp inbound error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
