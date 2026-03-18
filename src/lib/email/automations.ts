import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, interpolate, commonVars, ADMIN_EMAIL } from '@/lib/resend/client'
import type { ProcessStatus } from '@/types/database'

const STATUS_TO_TEMPLATE: Partial<Record<ProcessStatus, string>> = {
  pending_form: 'welcome',
  form_completed: 'status_form_completed',
  consular_fee_paid: 'status_consular_fee_paid',
  appointment_requested: 'status_appointment_requested',
  docs_in_preparation: 'status_docs_in_preparation',
  docs_ready: 'status_docs_ready',
  completed: 'status_completed',
}

/** Get client email and name from a process ID */
async function getClientContact(processId: string): Promise<{ email: string; name: string } | null> {
  const { data: applicant } = await supabaseAdmin
    .from('applicants')
    .select('given_name, surname, email')
    .eq('process_id', processId)
    .eq('is_primary', true)
    .single() as { data: { given_name: string | null; surname: string | null; email: string | null } | null }

  if (!applicant?.email) return null
  const name = [applicant.given_name, applicant.surname].filter(Boolean).join(' ') || 'Cliente'
  return { email: applicant.email, name }
}

/** Fetch a template from DB and interpolate variables */
async function renderTemplate(
  key: string,
  vars: Record<string, string>
): Promise<{ subject: string; html: string; text: string } | null> {
  const { data: tpl } = await supabaseAdmin
    .from('email_templates')
    .select('subject, body_html, body_text')
    .eq('key', key)
    .eq('is_active', true)
    .single() as { data: { subject: string; body_html: string; body_text: string | null } | null }

  if (!tpl) return null
  const allVars = { ...commonVars(), ...vars }
  return {
    subject: interpolate(tpl.subject, allVars),
    html: interpolate(tpl.body_html, allVars),
    text: interpolate(tpl.body_text ?? '', allVars),
  }
}

/** Automatically send email when process status changes */
export async function sendStatusEmail(processId: string, newStatus: ProcessStatus): Promise<void> {
  const templateKey = STATUS_TO_TEMPLATE[newStatus]
  if (!templateKey) return

  const contact = await getClientContact(processId)
  if (!contact) return

  const rendered = await renderTemplate(templateKey, {
    nome: contact.name,
    process_id: processId,
    dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard`,
  })
  if (!rendered) return

  await sendEmail({
    to: contact.email,
    toName: contact.name,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    templateKey,
    processId,
  })
}

/** Send welcome + payment confirmed emails after checkout */
export async function sendWelcomeEmails(processId: string, amountBrl: number, packageName: string): Promise<void> {
  const contact = await getClientContact(processId)
  if (!contact) return

  const vars = {
    nome: contact.name,
    process_id: processId,
    valor: amountBrl.toFixed(2).replace('.', ','),
    plano: packageName,
    dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard`,
  }

  // Welcome email
  const welcomeRendered = await renderTemplate('welcome', vars)
  if (welcomeRendered) {
    await sendEmail({
      to: contact.email,
      toName: contact.name,
      ...welcomeRendered,
      templateKey: 'welcome',
      processId,
    })
  }

  // Payment confirmed
  const paymentRendered = await renderTemplate('payment_confirmed', vars)
  if (paymentRendered) {
    await sendEmail({
      to: contact.email,
      toName: contact.name,
      ...paymentRendered,
      templateKey: 'payment_confirmed',
      processId,
    })
  }

  // Admin notification
  const adminRendered = await renderTemplate('admin_payment_received', {
    ...vars,
    email: contact.email,
    admin_process_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/processos/${processId}`,
  })
  if (adminRendered) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: adminRendered.subject,
      html: adminRendered.html,
      text: adminRendered.text,
      templateKey: 'admin_payment_received',
      processId,
    })
  }
}

// =============================================
// LEAD SEQUENCE
// =============================================

const LEAD_SEQUENCE = [
  { key: 'lead_d0_welcome', delayHours: 0 },
  { key: 'lead_d3_followup', delayHours: 72 },
  { key: 'lead_d7_value', delayHours: 168 },
  { key: 'lead_d14_urgency', delayHours: 336 },
  { key: 'lead_d21_lastchance', delayHours: 504 },
  { key: 'lead_d30_reengagement', delayHours: 720 },
]

/** Enqueue a full nurturing email sequence for a new lead */
export async function enqueueLeadSequence(leadId: string): Promise<void> {
  const now = new Date()
  const rows = LEAD_SEQUENCE.map(item => ({
    lead_id: leadId,
    template_key: item.key,
    scheduled_for: new Date(now.getTime() + item.delayHours * 3600 * 1000).toISOString(),
    status: 'pending' as const,
  }))

  await supabaseAdmin.from('lead_email_queue').insert(rows as never)
}

/** Cancel remaining queued emails (when lead converts) */
export async function cancelLeadSequence(leadId: string): Promise<void> {
  await supabaseAdmin
    .from('lead_email_queue')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() } as never)
    .eq('lead_id', leadId)
    .eq('status', 'pending')
}

/** Send immediate D+0 welcome to a new lead + notify admin */
export async function sendLeadWelcome(leadId: string, name: string, email: string, interestedPackage?: string): Promise<void> {
  const vars = { nome: name, interested_package: interestedPackage ?? 'Não informado' }

  const rendered = await renderTemplate('lead_d0_welcome', vars)
  if (rendered) {
    await sendEmail({
      to: email,
      toName: name,
      ...rendered,
      templateKey: 'lead_d0_welcome',
      leadId,
    })
  }

  // Admin notification
  const adminRendered = await renderTemplate('admin_new_lead', {
    nome: name,
    email,
    phone: '',
    interested_package: interestedPackage ?? 'Não informado',
    source: 'site',
    created_at: new Date().toLocaleString('pt-BR'),
    admin_leads_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/leads`,
  })
  if (adminRendered) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: adminRendered.subject,
      html: adminRendered.html,
      text: adminRendered.text,
      templateKey: 'admin_new_lead',
      leadId,
    })
  }
}
