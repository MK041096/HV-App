import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/damage-reports/[id]/photos - Get signed URLs for a report's photos
// Signed URLs expire after 30 minutes (DSGVO: no permanent public URLs)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Ungültige Schadensmeldungs-ID' },
        { status: 400 }
      )
    }

    // Verify the report exists and user has access (RLS handles this)
    const { data: report, error: reportError } = await supabase
      .from('damage_reports')
      .select('id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Schadensmeldung nicht gefunden' },
        { status: 404 }
      )
    }

    // Fetch photos
    const { data: photos, error: photosError } = await supabase
      .from('damage_report_photos')
      .select('id, storage_path, file_name, mime_type, file_size, sort_order')
      .eq('damage_report_id', id)
      .order('sort_order')

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Fotos' },
        { status: 500 }
      )
    }

    // Generate signed URLs (30 min expiry)
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        const { data: signedUrl } = await supabase.storage
          .from('damage-photos')
          .createSignedUrl(photo.storage_path, 1800)

        return {
          id: photo.id,
          file_name: photo.file_name,
          mime_type: photo.mime_type,
          file_size: photo.file_size,
          sort_order: photo.sort_order,
          url: signedUrl?.signedUrl || null,
        }
      })
    )

    return NextResponse.json({ data: photosWithUrls })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
