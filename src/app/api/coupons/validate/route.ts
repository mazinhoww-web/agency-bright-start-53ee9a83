import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type CouponRow = Database['public']['Tables']['coupons']['Row']

export async function POST(req: NextRequest) {
  try {
    const { code, amountInCents } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single() as { data: CouponRow | null; error: unknown }

    if (error || !coupon) {
      return NextResponse.json({ error: 'Cupom inválido ou inativo' }, { status: 404 })
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 })
    }

    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
    }

    const originalAmount = amountInCents || 0
    let discountInCents = 0

    if (coupon.discount_type === 'percentage') {
      discountInCents = Math.round(originalAmount * (coupon.discount_value / 100))
    } else {
      discountInCents = Math.round(coupon.discount_value * 100)
    }

    const finalAmount = Math.max(0, originalAmount - discountInCents)

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        influencer_name: coupon.influencer_name,
      },
      discount_in_cents: discountInCents,
      final_amount_in_cents: finalAmount,
    })
  } catch (error) {
    console.error('Coupon validate error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
