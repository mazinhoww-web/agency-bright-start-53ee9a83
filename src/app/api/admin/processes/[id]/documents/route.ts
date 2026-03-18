import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processId } = await params

    // Verificar autenticação admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
    }

    // Sanitizar nome do arquivo
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${processId}/${Date.now()}_${safeName}`

    // Upload para Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from('client-documents')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 })
    }

    // Salvar registro na tabela documents
    const { data: doc, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        process_id: processId,
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Document insert error:', dbError)
      // Tentar remover o arquivo já enviado
      await supabaseAdmin.storage.from('client-documents').remove([filePath])
      return NextResponse.json({ error: 'Erro ao salvar documento' }, { status: 500 })
    }

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/processes/[id]/documents error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processId } = await params

    // Verificar autenticação admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const docId = searchParams.get('docId')

    if (!docId) {
      return NextResponse.json({ error: 'docId obrigatório' }, { status: 400 })
    }

    // Buscar o documento para obter o file_path
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('id, file_path')
      .eq('id', docId)
      .eq('process_id', processId)
      .single()

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // Remover do storage
    await supabaseAdmin.storage.from('client-documents').remove([doc.file_path])

    // Remover da tabela
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', docId)

    if (deleteError) {
      console.error('Document delete error:', deleteError)
      return NextResponse.json({ error: 'Erro ao remover documento' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/processes/[id]/documents error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
