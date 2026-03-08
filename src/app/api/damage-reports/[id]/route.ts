import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STATUS_DISPLAY_MAP } from '@/lib/validations/damage-report-dashboard'

// GET /api/damage-reports/[id] - Get a single damage report with signed photo URLs,
// status history, comments, and rating
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Ungültige Schadensmeldungs-ID' },
        { status: 400 }
      )
    }

    // Fetch report (RLS ensures user can only see their own or their org's reports)
    const { data: report, error } = await supabase
      .from('damage_reports')
      .select(`
        *,
        unit:units(id, name, address, floor),
        reporter:profiles!damage_reports_reporter_id_fkey(id, first_name, last_name),
        photos:damage_report_photos(id, storage_path, file_name, mime_type, file_size, sort_order)
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error || !report) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Schadensmeldung nicht gefunden' },
          { status: 404 }
        )
      }
      console.error('Error fetching damage report:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Schadensmeldung' },
        { status: 500 }
      )
    }

    // Fetch status history, comments, and rating in parallel
    const [statusHistoryResult, commentsResult, ratingResult] = await Promise.all([
      // Status history timeline
      supabase
        .from('damage_report_status_history')
        .select('id, old_status, new_status, changed_by, note, created_at')
        .eq('damage_report_id', id)
        .order('created_at', { ascending: true }),

      // Comments (RLS filters out internal comments for tenants automatically)
      supabase
        .from('damage_report_comments')
        .select('id, author_id, content, is_internal, created_at, updated_at')
        .eq('damage_report_id', id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100),

      // Rating by current user
      supabase
        .from('damage_report_ratings')
        .select('id, rating, updated_count, rating_deadline, created_at, updated_at')
        .eq('damage_report_id', id)
        .eq('rated_by', user.id)
        .maybeSingle(),
    ])

    // Collect unique user IDs from status history and comments to resolve profiles
    const userIds = new Set<string>()
    for (const entry of statusHistoryResult.data || []) {
      if (entry.changed_by) userIds.add(entry.changed_by)
    }
    for (const comment of commentsResult.data || []) {
      if (comment.author_id) userIds.add(comment.author_id)
    }

    // Fetch profiles for all referenced users in one query
    type ProfileInfo = { id: string; first_name: string | null; last_name: string | null; role: string }
    const profileMap = new Map<string, ProfileInfo>()
    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('id', Array.from(userIds))
      for (const p of profiles || []) {
        profileMap.set(p.id, p)
      }
    }

    // Generate signed URLs for photos (30 min expiry, DSGVO compliant)
    const photosWithUrls = await Promise.all(
      (report.photos || []).map(async (photo: {
        id: string
        storage_path: string
        file_name: string
        mime_type: string
        file_size: number
        sort_order: number
      }) => {
        const { data: signedUrl } = await supabase.storage
          .from('damage-photos')
          .createSignedUrl(photo.storage_path, 1800) // 30 minutes

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

    // Map display status labels and profile info onto status history entries
    const statusHistory = (statusHistoryResult.data || []).map((entry) => {
      const profile = entry.changed_by ? profileMap.get(entry.changed_by) : null
      return {
        id: entry.id,
        old_status: entry.old_status,
        new_status: entry.new_status,
        display_status: STATUS_DISPLAY_MAP[entry.new_status as keyof typeof STATUS_DISPLAY_MAP] || entry.new_status,
        note: entry.note,
        created_at: entry.created_at,
        changed_by: profile
          ? { first_name: profile.first_name, last_name: profile.last_name, role: profile.role }
          : null,
      }
    })

    // Enrich comments with author profile info
    const comments = (commentsResult.data || []).map((comment) => {
      const profile = comment.author_id ? profileMap.get(comment.author_id) : null
      return {
        id: comment.id,
        content: comment.content,
        is_internal: comment.is_internal,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: profile
          ? { first_name: profile.first_name, last_name: profile.last_name, role: profile.role }
          : null,
      }
    })

    // Remove storage_path from response (internal detail)
    const { photos: _photos, ...reportWithoutRawPhotos } = report

    // Determine if rating is still possible
    const ratingData = ratingResult.data
    const canRate = report.status === 'erledigt' && !ratingData
    const canUpdateRating = ratingData
      ? ratingData.updated_count < 1 && new Date(ratingData.rating_deadline) > new Date()
      : false

    return NextResponse.json({
      data: {
        ...reportWithoutRawPhotos,
        display_status: STATUS_DISPLAY_MAP[report.status as keyof typeof STATUS_DISPLAY_MAP] || report.status,
        photos: photosWithUrls,
        status_history: statusHistory,
        comments,
        rating: ratingData || null,
        can_rate: canRate,
        can_update_rating: canUpdateRating,
      },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
