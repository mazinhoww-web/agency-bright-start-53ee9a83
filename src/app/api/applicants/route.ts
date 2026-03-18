import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Find user's process
    const { data: process, error: processError } = await supabaseAdmin
      .from('processes')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (processError || !process) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
    }

    // Find primary applicant
    const { data: applicant, error: applicantError } = await supabaseAdmin
      .from('applicants')
      .select('*')
      .eq('process_id', process.id)
      .eq('is_primary', true)
      .single()

    if (applicantError || !applicant) {
      return NextResponse.json({ error: 'Solicitante não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ applicant, processId: process.id })
  } catch (error) {
    console.error('GET applicant error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do solicitante obrigatório' }, { status: 400 })
    }

    // Verify the applicant belongs to the user's process
    const { data: process, error: processError } = await supabaseAdmin
      .from('processes')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (processError || !process) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
    }

    const { data: existingApplicant, error: verifyError } = await supabaseAdmin
      .from('applicants')
      .select('id')
      .eq('id', id)
      .eq('process_id', process.id)
      .single()

    if (verifyError || !existingApplicant) {
      return NextResponse.json({ error: 'Solicitante não encontrado ou sem permissão' }, { status: 403 })
    }

    // Update applicant fields
    const { data: applicant, error: updateError } = await supabaseAdmin
      .from('applicants')
      .update(fields)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ applicant })
  } catch (error) {
    console.error('PATCH applicant error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
