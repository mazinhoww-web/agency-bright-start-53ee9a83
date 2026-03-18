import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*, coupon_uses(count)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ coupons: data })
  } catch (error) {
    console.error('GET coupons error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, discount_type, discount_value, influencer_name, influencer_email, max_uses, expires_at } = body

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json({ error: 'code, discount_type e discount_value são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: code.toUpperCase().trim(),
        discount_type,
        discount_value,
        influencer_name: influencer_name || null,
        influencer_email: influencer_email || null,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Código já existe' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ coupon: data }, { status: 201 })
  } catch (error) {
    console.error('POST coupons error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()

    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ coupon: data })
  } catch (error) {
    console.error('PATCH coupons error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE coupons error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
