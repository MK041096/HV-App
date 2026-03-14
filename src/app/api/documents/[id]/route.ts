import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/documents/[id] — get signed download URL
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const { id } = await params
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, file_path, name')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 })
    }

    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 900) // 15 Minuten gültig

    if (urlError || !signedUrl) {
      return NextResponse.json({ error: 'Download-Link konnte nicht erstellt werden' }, { status: 500 })
    }

    return NextResponse.json({ url: signedUrl.signedUrl, name: doc.name })
  } catch (err) {
    console.error('Document download error:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}

// DELETE /api/documents/[id] — soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const { id } = await params
    const { error } = await supabase
      .from('documents')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Document delete error:', err)
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
