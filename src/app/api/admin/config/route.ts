import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('key, value')

    if (error) throw error

    const config: Record<string, string> = {}
    for (const row of data || []) {
      config[row.key] = row.value
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('GET /api/admin/config error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { updates } = await req.json() as { updates: Record<string, string> }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates obrigatório' }, { status: 400 })
    }

    const upserts = Object.entries(updates).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabaseAdmin
      .from('system_config')
      .upsert(upserts, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/admin/config error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
