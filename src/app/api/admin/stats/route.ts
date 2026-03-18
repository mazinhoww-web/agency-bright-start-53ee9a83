import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Count processes grouped by status
    const { data: processes, error: processesError } = await supabaseAdmin
      .from('processes')
      .select('status')

    if (processesError) throw processesError

    const by_status: Record<string, number> = {}
    let total_processes = 0
    for (const p of processes || []) {
      total_processes++
      by_status[p.status] = (by_status[p.status] || 0) + 1
    }

    // Count total leads
    const { count: total_leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })

    if (leadsError) throw leadsError

    // Count completed this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: completed_this_month, error: completedError } = await supabaseAdmin
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', startOfMonth.toISOString())

    if (completedError) throw completedError

    return NextResponse.json({
      total_processes,
      by_status,
      total_leads: total_leads || 0,
      completed_this_month: completed_this_month || 0,
    })
  } catch (error) {
    console.error('GET /api/admin/stats error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
