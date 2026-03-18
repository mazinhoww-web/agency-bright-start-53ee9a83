import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendLeadWelcome, enqueueLeadSequence } from '@/lib/email/automations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, interested_package, source, utm_source, utm_medium, utm_campaign } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
    }

    // Upsert lead (update if email already exists)
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .upsert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ?? null,
        interested_package: interested_package ?? null,
        source: source ?? 'site',
        utm_source: utm_source ?? null,
        utm_medium: utm_medium ?? null,
        utm_campaign: utm_campaign ?? null,
        status: 'new',
        lead_score: 10,
      } as never, { onConflict: 'email' })
      .select()
      .single() as { data: { id: string; status: string } | null; error: unknown }

    if (error || !lead) {
      throw error ?? new Error('Failed to upsert lead')
    }

    // Only send welcome + enqueue if it's a truly new lead (not already in nurturing)
    if (lead.status === 'new') {
      await sendLeadWelcome(lead.id, name, email, interested_package)
      await enqueueLeadSequence(lead.id)

      // Update status to nurturing
      await supabaseAdmin
        .from('leads')
        .update({ status: 'nurturing', last_contacted_at: new Date().toISOString() } as never)
        .eq('id', lead.id)
    }

    return NextResponse.json({ ok: true, leadId: lead.id }, { status: 201 })
  } catch (err) {
    console.error('POST /api/leads error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ exists: false })

  const { data } = await supabaseAdmin
    .from('leads')
    .select('id, status')
    .ilike('email', email)
    .single() as { data: { id: string; status: string } | null }

  return NextResponse.json({ exists: !!data, lead: data })
}
