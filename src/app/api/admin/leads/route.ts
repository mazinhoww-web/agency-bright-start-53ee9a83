import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, interpolate, commonVars } from '@/lib/resend/client'
import { enqueueLeadSequence, cancelLeadSequence } from '@/lib/email/automations'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const source = searchParams.get('source')
  const search = searchParams.get('search')

  let query = supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status as never)
  if (source) query = query.eq('source', source as never)
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await query as { data: Record<string, unknown>[] | null; error: unknown }
  if (error) return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
  return NextResponse.json({ leads: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notes, lead_score, interested_package } = await req.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status !== undefined) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (lead_score !== undefined) updates.lead_score = lead_score
    if (interested_package !== undefined) updates.interested_package = interested_package

    if (status === 'converted') {
      await cancelLeadSequence(id)
    }
    if (status === 'nurturing') {
      await enqueueLeadSequence(id)
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single() as { data: Record<string, unknown> | null; error: unknown }

    if (error) throw error
    return NextResponse.json({ lead: data })
  } catch (err) {
    console.error('PATCH leads error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Admin sends manual email to a lead
  try {
    const { leadId, templateKey, vars } = await req.json()
    if (!leadId || !templateKey) return NextResponse.json({ error: 'leadId e templateKey obrigatórios' }, { status: 400 })

    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('name, email')
      .eq('id', leadId)
      .single() as { data: { name: string; email: string } | null }

    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

    const { data: tpl } = await supabaseAdmin
      .from('email_templates')
      .select('subject, body_html, body_text')
      .eq('key', templateKey)
      .single() as { data: { subject: string; body_html: string; body_text: string | null } | null }

    if (!tpl) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })

    const allVars = { ...commonVars(), nome: lead.name, ...(vars ?? {}) }
    const subject = interpolate(tpl.subject, allVars)
    const html = interpolate(tpl.body_html, allVars)
    const text = interpolate(tpl.body_text ?? '', allVars)

    const result = await sendEmail({ to: lead.email, toName: lead.name, subject, html, text, templateKey, leadId })

    // Update last_contacted_at
    await supabaseAdmin
      .from('leads')
      .update({ last_contacted_at: new Date().toISOString() } as never)
      .eq('id', leadId)

    return NextResponse.json(result)
  } catch (err) {
    console.error('POST /api/admin/leads email error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
