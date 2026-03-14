import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

// GET /api/documents — list documents for the org
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unit_id')

    let query = supabase
      .from('documents')
      .select(`
        id, name, file_path, file_size, mime_type, document_type, created_at,
        unit:units(id, name),
        uploader:profiles!documents_uploaded_by_fkey(first_name, last_name)
      `)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(100)

    if (unitId) query = query.eq('unit_id', unitId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Documents list error:', err)
    return NextResponse.json({ error: 'Fehler beim Laden der Dokumente' }, { status: 500 })
  }
}

// POST /api/documents — upload document metadata after file upload
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, file_path, file_size, mime_type, document_type, unit_id } = body

    if (!name || !file_path || !file_size) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        organization_id: profile.organization_id,
        uploaded_by: user.id,
        unit_id: unit_id || null,
        name,
        file_path,
        file_size,
        mime_type: mime_type || 'application/pdf',
        document_type: document_type || 'sonstiges',
      })
      .select('id, name, document_type, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Document create error:', err)
    return NextResponse.json({ error: 'Fehler beim Speichern des Dokuments' }, { status: 500 })
  }
}
