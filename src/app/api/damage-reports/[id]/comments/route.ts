import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/damage-reports/[id]/comments - List comments for a damage report
// Tenants see only non-internal comments (enforced by RLS).
// HV users see all comments including internal ones (enforced by RLS).
// Write API for HV comes in PROJ-6.
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

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Ungültige Schadensmeldungs-ID' },
        { status: 400 }
      )
    }

    // Verify access to the report (RLS will filter)
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

    // Parse pagination from query params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') || undefined
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)
    const limit = Math.min(Math.max(limitParam, 1), 100)

    // Fetch comments (RLS automatically filters internal comments for tenants)
    let query = supabase
      .from('damage_report_comments')
      .select('id, author_id, content, is_internal, created_at, updated_at')
      .eq('damage_report_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(limit + 1)

    if (cursor) {
      query = query.gt('created_at', cursor)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Kommentare' },
        { status: 500 }
      )
    }

    const hasMore = (data?.length || 0) > limit
    const items = (data || []).slice(0, limit)

    // Resolve author profiles
    const authorIds = [...new Set(items.map((c) => c.author_id).filter(Boolean))]
    type ProfileInfo = { id: string; first_name: string | null; last_name: string | null; role: string }
    const profileMap = new Map<string, ProfileInfo>()
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('id', authorIds)
      for (const p of profiles || []) {
        profileMap.set(p.id, p)
      }
    }

    const enriched = items.map((comment) => {
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

    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].created_at
      : null

    return NextResponse.json({
      data: enriched,
      pagination: {
        next_cursor: nextCursor,
        has_more: hasMore,
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
