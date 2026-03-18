import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('processes')
      .select(`
        *,
        applicants(*),
        documents(*),
        admin_notes(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ process: data })
  } catch (error) {
    console.error('GET /api/admin/processes/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
