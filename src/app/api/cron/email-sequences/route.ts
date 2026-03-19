import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, interpolate, commonVars } from '@/lib/resend/client'

// Called by Vercel Cron or external scheduler
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/email-sequences", "schedule": "0 * * * *" }] }

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return processQueue()
}

export async function GET(req: NextRequest) {
  // Also allow GET for Vercel Cron (which uses GET)
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return processQueue()
}

async function processQueue(): Promise<NextResponse> {
  try {
    // Get all pending emails that are due
    const { data: queue } = await supabaseAdmin
      .from('lead_email_queue')
      .select('id, lead_id, template_key')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50) as { data: { id: string; lead_id: string; template_key: string }[] | null }

    if (!queue || queue.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    let sent = 0
    let failed = 0

    for (const item of queue) {
      try {
        // Get lead data
        const { data: lead } = await supabaseAdmin
          .from('leads')
          .select('name, email, status, interested_package')
          .eq('id', item.lead_id)
          .single() as { data: { name: string; email: string; status: string; interested_package: string | null } | null }

        if (!lead || lead.status === 'converted' || lead.status === 'lost') {
          // Cancel this item
          await supabaseAdmin
            .from('lead_email_queue')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() } as never)
            .eq('id', item.id)
          continue
        }

        // Get template
        const { data: tpl } = await supabaseAdmin
          .from('email_templates')
          .select('subject, body_html, body_text')
          .eq('key', item.template_key)
          .eq('is_active', true)
          .single() as { data: { subject: string; body_html: string; body_text: string | null } | null }

        if (!tpl) {
          await supabaseAdmin
            .from('lead_email_queue')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() } as never)
            .eq('id', item.id)
          continue
        }

        // Buscar vagas reais disponíveis
        const { count: vagasCount } = await supabaseAdmin
          .from('available_dates')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('date', new Date().toISOString().split('T')[0])

        const vagas = vagasCount ?? 3

        const deadlineDate = new Date(Date.now() + 48 * 3600 * 1000).toLocaleDateString('pt-BR')

        // Buscar cupom ativo real
        const { data: couponRow } = await supabaseAdmin
          .from('coupons')
          .select('code')
          .eq('is_active', true)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .limit(1)
          .maybeSingle()

        const couponCode = (couponRow as { code: string } | null)?.code ?? ''

        const allVars = {
          ...commonVars(),
          nome: lead.name,
          interested_package: lead.interested_package ?? 'Não informado',
          vagas: String(vagas),
          deadline_date: deadlineDate,
          coupon_code: couponCode,
        }

        const subject = interpolate(tpl.subject, allVars)
        const html = interpolate(tpl.body_html, allVars)
        const text = interpolate(tpl.body_text ?? '', allVars)

        const result = await sendEmail({
          to: lead.email,
          toName: lead.name,
          subject,
          html,
          text,
          templateKey: item.template_key,
          leadId: item.lead_id,
        })

        if (result.ok) {
          await supabaseAdmin
            .from('lead_email_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() } as never)
            .eq('id', item.id)

          await supabaseAdmin
            .from('leads')
            .update({ last_contacted_at: new Date().toISOString(), lead_score: 20 } as never)
            .eq('id', item.lead_id)

          sent++
        } else {
          failed++
        }
      } catch (err) {
        console.error(`Error processing queue item ${item.id}:`, err)
        failed++
      }
    }

    return NextResponse.json({ processed: queue.length, sent, failed })
  } catch (err) {
    console.error('Cron email sequences error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
