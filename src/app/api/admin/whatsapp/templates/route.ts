import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .select('*')
      .order('category')
      .order('name')

    if (error) throw error

    return NextResponse.json({ templates: data })
  } catch (error) {
    console.error('GET templates error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, category, content, trigger_status } = body

    if (!name || !category || !content) {
      return NextResponse.json({ error: 'name, category e content são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .insert({ name, category, content, trigger_status: trigger_status || null, is_active: true })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template: data }, { status: 201 })
  } catch (error) {
    console.error('POST templates error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()

    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error('PATCH templates error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('whatsapp_templates')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE templates error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
