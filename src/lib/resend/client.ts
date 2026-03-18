import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Cia do Visto <noreply@ciadovisto.com.br>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@ciadovisto.com.br'

export { ADMIN_EMAIL }

export interface SendEmailOptions {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  templateKey?: string
  processId?: string
  leadId?: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    })

    if (error) throw error

    // Log in database
    await supabaseAdmin.from('email_logs').insert({
      to_email: opts.to,
      to_name: opts.toName ?? null,
      subject: opts.subject,
      template_key: opts.templateKey ?? null,
      process_id: opts.processId ?? null,
      lead_id: opts.leadId ?? null,
      resend_id: data?.id ?? null,
      status: 'sent',
    } as never)

    return { ok: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Log failure
    await supabaseAdmin.from('email_logs').insert({
      to_email: opts.to,
      to_name: opts.toName ?? null,
      subject: opts.subject,
      template_key: opts.templateKey ?? null,
      process_id: opts.processId ?? null,
      lead_id: opts.leadId ?? null,
      status: 'failed',
      error_message: message,
    } as never)

    console.error('[sendEmail] error:', message)
    return { ok: false, error: message }
  }
}

/** Substitute {{variable}} placeholders in a template string */
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

/** Build common variables available in all templates */
export function commonVars(): Record<string, string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ciadovisto.com.br'
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5511999999999'
  return {
    app_url: appUrl,
    dashboard_url: `${appUrl}/dashboard`,
    checkout_url: `${appUrl}/checkout`,
    admin_leads_url: `${appUrl}/admin/leads`,
    whatsapp_number: whatsappNumber,
    unsubscribe_url: `${appUrl}/unsubscribe`,
  }
}
