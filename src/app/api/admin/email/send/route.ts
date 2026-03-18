import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, interpolate, commonVars } from '@/lib/resend/client'

export async function POST(req: NextRequest) {
  try {
    const { templateKey, to, toName, vars, processId, leadId } = await req.json()

    if (!to || !templateKey) {
      return NextResponse.json({ error: 'to e templateKey obrigatórios' }, { status: 400 })
    }

    const { data: tpl } = await supabaseAdmin
      .from('email_templates')
      .select('subject, body_html, body_text, name')
      .eq('key', templateKey)
      .single() as { data: { subject: string; body_html: string; body_text: string | null; name: string } | null }

    if (!tpl) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })

    const allVars = { ...commonVars(), ...(vars ?? {}) }
    const subject = interpolate(tpl.subject, allVars)
    const html = interpolate(tpl.body_html, allVars)
    const text = interpolate(tpl.body_text ?? '', allVars)

    const result = await sendEmail({ to, toName, subject, html, text, templateKey, processId, leadId })
    return NextResponse.json({ ...result, templateName: tpl.name })
  } catch (err) {
    console.error('POST /api/admin/email/send error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(100) as { data: Record<string, unknown>[] | null; error: unknown }

  if (error) return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 })
  return NextResponse.json({ logs: data })
}
