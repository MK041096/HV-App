import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

// POST /api/documents/upload — upload file to Supabase Storage
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Keine Datei gefunden' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Datei zu groß (max. 20 MB)' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Nur PDF, JPG und PNG erlaubt' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'pdf'
    const filePath = `${profile.organization_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    return NextResponse.json({
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      original_name: file.name,
    })
  } catch (err) {
    console.error('Document upload error:', err)
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 })
  }
}
