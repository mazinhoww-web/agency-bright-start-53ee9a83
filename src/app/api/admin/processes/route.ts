import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const pkg = searchParams.get('package') || ''
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let query = supabaseAdmin
      .from('processes')
      .select(`
        id, package, status, created_at, max_applicants,
        applicants(id, given_name, surname, email, is_primary)
      `, { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (pkg) query = query.eq('package', pkg)

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    // Map to flat structure with primary applicant info
    const processes = (data || []).map((p) => {
      const applicants = Array.isArray(p.applicants) ? p.applicants : [p.applicants].filter(Boolean)
      const primary = applicants.find((a: { is_primary: boolean }) => a.is_primary) || applicants[0] || null

      const applicant_name = primary
        ? [primary.given_name, primary.surname].filter(Boolean).join(' ') || null
        : null
      const applicant_email = primary?.email || null

      // Filter by search (name or email)
      if (search) {
        const s = search.toLowerCase()
        const nameMatch = applicant_name?.toLowerCase().includes(s)
        const emailMatch = applicant_email?.toLowerCase().includes(s)
        if (!nameMatch && !emailMatch) return null
      }

      return {
        id: p.id,
        package: p.package,
        status: p.status,
        created_at: p.created_at,
        max_applicants: p.max_applicants,
        applicant_name,
        applicant_email,
        applicant_count: applicants.length,
      }
    }).filter(Boolean)

    return NextResponse.json({ processes, total: search ? processes.length : (count || 0) })
  } catch (error) {
    console.error('GET /api/admin/processes error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
