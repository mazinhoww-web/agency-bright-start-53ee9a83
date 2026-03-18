import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { ProcessStatus } from '@/types/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status, notifyWhatsApp } = await req.json()
    const { id: processId } = await params

    if (!status) {
      return NextResponse.json({ error: 'status obrigatório' }, { status: 400 })
    }

    // Buscar processo com dados do cliente (via user_id)
    type ProcessWithApplicants = { applicants: { given_name: string | null; surname: string | null; phone_mobile: string | null; is_primary: boolean }[] }
    const { data: processData, error: fetchError } = await (supabaseAdmin
      .from('processes')
      .select('*, applicants!inner(given_name, surname, phone_mobile, is_primary)')
      .eq('id', processId)
      .single() as unknown as Promise<{ data: ProcessWithApplicants | null; error: unknown }>)

    if (fetchError || !processData) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
    }

    // Atualizar status
    const { error: updateError } = await supabaseAdmin
      .from('processes')
      .update({ status: status as ProcessStatus })
      .eq('id', processId)

    if (updateError) throw updateError

    // Notificar via WhatsApp se solicitado
    if (notifyWhatsApp) {
      const primaryApplicant = processData.applicants?.find((a: { is_primary: boolean }) => a.is_primary) || processData.applicants?.[0]
      const phone = primaryApplicant?.phone_mobile?.replace(/\D/g, '')

      if (phone) {
        const name = primaryApplicant.given_name || 'Cliente'
        const link = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

        // Buscar template para este status
        const { data: template } = await supabaseAdmin
          .from('whatsapp_templates')
          .select('content')
          .eq('trigger_status', status)
          .eq('is_active', true)
          .single()

        if (template) {
          const message = template.content
            .replace(/{{nome}}/g, name)
            .replace(/{{link}}/g, link)

          // Enviar via API interna
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message, event: `status_${status}`, processId }),
          })
        }
      }
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('PATCH process status error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
