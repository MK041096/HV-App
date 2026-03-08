import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { hvCommentCreateSchema } from '@/lib/validations/hv-case-management'
import { sendNewCommentEmail } from '@/lib/email'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/hv/cases/[id]/comments - List all comments (internal + external) for HV staff
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
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Ungültige Fall-ID' }, { status: 400 })
    }

    // Verify HV role
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für das Case-Management' },
        { status: 403 }
      )
    }

    // Verify case belongs to org
    const { data: report } = await supabase
      .from('damage_reports')
      .select('id')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (!report) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    }

    // Pagination
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') || undefined
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)
    const limit = Math.min(Math.max(limitParam, 1), 200)

    // Fetch comments (HV sees all including internal via RLS)
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
      return NextResponse.json({ error: 'Fehler beim Laden der Kommentare' }, { status: 500 })
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
      const p = comment.author_id ? profileMap.get(comment.author_id) : null
      return {
        id: comment.id,
        content: comment.content,
        is_internal: comment.is_internal,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: p
          ? { first_name: p.first_name, last_name: p.last_name, role: p.role }
          : null,
      }
    })

    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].created_at
      : null

    return NextResponse.json({
      data: enriched,
      pagination: { next_cursor: nextCursor, has_more: hasMore },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// POST /api/hv/cases/[id]/comments - Add a comment (internal or external) to a case
export async function POST(
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
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Ungültige Fall-ID' }, { status: 400 })
    }

    // Verify HV role
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role, first_name, last_name')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für das Case-Management' },
        { status: 403 }
      )
    }

    // Verify case belongs to org
    const { data: report } = await supabase
      .from('damage_reports')
      .select('id, reporter_id, case_number, title')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (!report) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    }

    // Parse and validate body
    const body = await request.json()
    const parsed = hvCommentCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Insert comment
    const { data: comment, error: insertError } = await supabase
      .from('damage_report_comments')
      .insert({
        damage_report_id: id,
        organization_id: profile.organization_id,
        author_id: user.id,
        content: parsed.data.content,
        is_internal: parsed.data.is_internal,
      })
      .select('id, content, is_internal, created_at, updated_at')
      .single()

    if (insertError) {
      console.error('Error inserting comment:', insertError)
      return NextResponse.json({ error: 'Fehler beim Erstellen des Kommentars' }, { status: 500 })
    }

    // Update damage_report updated_at
    await supabase
      .from('damage_reports')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: parsed.data.is_internal ? 'damage_report_internal_note_added' : 'damage_report_comment_added',
      entity_type: 'damage_report',
      entity_id: id,
      details: {
        comment_id: comment.id,
        is_internal: parsed.data.is_internal,
      },
    })

    // Send email for public comments (fire-and-forget)
    if (!parsed.data.is_internal && report.reporter_id) {
      try {
        const adminClient = createAdminClient()
        const [reporterResult, orgResult, reporterProfile] = await Promise.all([
          adminClient.auth.admin.getUserById(report.reporter_id),
          supabase.from('organizations').select('name').eq('id', profile.organization_id).single(),
          supabase.from('profiles').select('first_name, last_name').eq('id', report.reporter_id).single(),
        ])

        const email = reporterResult.data?.user?.email
        const name = reporterProfile.data
          ? `${reporterProfile.data.first_name || ''} ${reporterProfile.data.last_name || ''}`.trim()
          : 'Mieter'
        const authorName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Hausverwaltung'
        const org = orgResult.data?.name || 'Hausverwaltung'

        if (email) {
          sendNewCommentEmail({
            to: email,
            tenantName: name,
            caseNumber: report.case_number,
            caseTitle: report.title,
            comment: parsed.data.content,
            authorName,
            orgName: org,
          }).catch((err) => console.error('Email send failed:', err))
        }
      } catch (err) {
        console.error('Email notification error:', err)
      }
    }

    return NextResponse.json(
      {
        data: {
          ...comment,
          author: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role,
          },
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
