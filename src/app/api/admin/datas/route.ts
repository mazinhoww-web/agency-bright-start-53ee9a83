import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('available_dates')
      .select('*')
      .order('date', { ascending: true })

    if (error) throw error

    return NextResponse.json({ dates: data || [] })
  } catch (error) {
    console.error('GET /api/admin/datas error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { location_type, city, date, is_active } = await req.json()

    if (!location_type || !city || !date) {
      return NextResponse.json({ error: 'location_type, city e date são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('available_dates')
      .insert({ location_type, city, date, is_active: is_active !== false })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ date: data })
  } catch (error) {
    console.error('POST /api/admin/datas error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, is_active } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('available_dates')
      .update({ is_active })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ date: data })
  } catch (error) {
    console.error('PATCH /api/admin/datas error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('available_dates')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/datas error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
