import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processId } = await params
    const { content } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('admin_notes')
      .insert({ process_id: processId, content })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ note: data })
  } catch (error) {
    console.error('POST /api/admin/processes/[id]/notes error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
