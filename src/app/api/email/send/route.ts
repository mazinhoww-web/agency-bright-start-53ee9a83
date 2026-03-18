import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, interpolate, commonVars } from '@/lib/resend/client'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { templateKey, to, toName, vars, processId, leadId, customSubject, customHtml } = await req.json()

    if (!to) return NextResponse.json({ error: 'Destinatário obrigatório' }, { status: 400 })

    let subject: string
    let html: string
    let text: string = ''

    if (templateKey) {
      const { data: tpl } = await supabaseAdmin
        .from('email_templates')
        .select('subject, body_html, body_text')
        .eq('key', templateKey)
        .eq('is_active', true)
        .single() as { data: { subject: string; body_html: string; body_text: string | null } | null }

      if (!tpl) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })

      const allVars = { ...commonVars(), ...(vars ?? {}) }
      subject = interpolate(tpl.subject, allVars)
      html = interpolate(tpl.body_html, allVars)
      text = interpolate(tpl.body_text ?? '', allVars)
    } else if (customSubject && customHtml) {
      subject = customSubject
      html = customHtml
    } else {
      return NextResponse.json({ error: 'templateKey ou customSubject+customHtml obrigatórios' }, { status: 400 })
    }

    const result = await sendEmail({ to, toName, subject, html, text, templateKey, processId, leadId })
    return NextResponse.json(result)
  } catch (err) {
    console.error('POST /api/email/send error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
