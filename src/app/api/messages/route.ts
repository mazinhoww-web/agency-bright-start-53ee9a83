import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const processId = searchParams.get('processId')

    if (!processId) {
      return NextResponse.json({ error: 'processId obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('process_id', processId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Marcar mensagens do admin como lidas (para o cliente)
    await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('process_id', processId)
      .eq('sender_type', 'admin')
      .eq('is_read', false)

    return NextResponse.json({ messages: data })
  } catch (error) {
    console.error('GET messages error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { processId, content, senderType } = await req.json()

    if (!processId || !content?.trim()) {
      return NextResponse.json({ error: 'processId e content são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        process_id: processId,
        sender_id: user.id,
        sender_type: senderType || 'client',
        content: content.trim(),
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: data }, { status: 201 })
  } catch (error) {
    console.error('POST messages error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
