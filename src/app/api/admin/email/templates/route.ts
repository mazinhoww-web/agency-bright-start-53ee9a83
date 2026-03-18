import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('email_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true }) as { data: Record<string, unknown>[] | null; error: unknown }

  if (error) return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 })
  return NextResponse.json({ templates: data })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, name, category, subject, body_html, body_text, variables, trigger_status, send_delay_hours } = body

    if (!key || !name || !category || !subject || !body_html) {
      return NextResponse.json({ error: 'Campos obrigatórios: key, name, category, subject, body_html' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert({ key, name, category, subject, body_html, body_text: body_text ?? null, variables: variables ?? [], trigger_status: trigger_status ?? null, send_delay_hours: send_delay_hours ?? 0 } as never)
      .select()
      .single() as { data: Record<string, unknown> | null; error: unknown }

    if (error) throw error
    return NextResponse.json({ template: data }, { status: 201 })
  } catch (err) {
    console.error('POST email templates error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single() as { data: Record<string, unknown> | null; error: unknown }

    if (error) throw error
    return NextResponse.json({ template: data })
  } catch (err) {
    console.error('PATCH email templates error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
