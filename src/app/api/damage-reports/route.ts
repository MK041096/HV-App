import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendDamageReportNotificationEmail } from '@/lib/email'
import { runKiAnalyse } from '@/lib/ki-analyse'
import {
  createDamageReportSchema,
  listDamageReportsSchema,
} from '@/lib/validations/damage-report'
import {
  dashboardListSchema,
  STATUS_DISPLAY_MAP,
  STATUS_FILTER_MAP,
} from '@/lib/validations/damage-report-dashboard'

// GET /api/damage-reports - List damage reports for the authenticated user
// Supports two modes:
//   1. Legacy offset pagination (status, urgency, category, limit, offset)
//   2. Dashboard cursor pagination (filter=alle|offen|abgeschlossen, cursor, limit)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode')

    // ── Dashboard mode (cursor pagination) ──
    if (mode === 'dashboard') {
      const parsed = dashboardListSchema.safeParse({
        filter: searchParams.get('filter') || undefined,
        cursor: searchParams.get('cursor') || undefined,
        limit: searchParams.get('limit') || undefined,
      })

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Ungültige Parameter', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { filter, cursor, limit } = parsed.data

      // Fetch limit + 1 to determine if there's a next page
      let query = supabase
        .from('damage_reports')
        .select(`
          id, case_number, title, category, status, urgency, created_at, closed_at, updated_at,
          unit:units(id, name, address),
          rating:damage_report_ratings(id, rating),
          photos:damage_report_photos(id, file_name, mime_type, sort_order)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit + 1)

      // Apply status filter
      const statusValues = STATUS_FILTER_MAP[filter]
      if (statusValues) {
        query = query.in('status', statusValues as unknown as string[])
      }

      // Cursor: fetch items older than cursor
      if (cursor) {
        query = query.lt('created_at', cursor)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching dashboard:', error)
        return NextResponse.json(
          { error: 'Fehler beim Laden der Schadensmeldungen' },
          { status: 500 }
        )
      }

      const hasMore = (data?.length || 0) > limit
      const items = (data || []).slice(0, limit)

      // Map DB status to display status
      const mapped = items.map((item) => ({
        ...item,
        display_status: STATUS_DISPLAY_MAP[item.status as keyof typeof STATUS_DISPLAY_MAP] || item.status,
      }))

      const nextCursor = hasMore && items.length > 0
        ? items[items.length - 1].created_at
        : null

      return NextResponse.json({
        data: mapped,
        pagination: {
          next_cursor: nextCursor,
          has_more: hasMore,
          limit,
        },
      })
    }

    // ── Legacy mode (offset pagination) ──
    const parsed = listDamageReportsSchema.safeParse({
      status: searchParams.get('status') || undefined,
      urgency: searchParams.get('urgency') || undefined,
      category: searchParams.get('category') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { status, urgency, category, limit, offset } = parsed.data

    let query = supabase
      .from('damage_reports')
      .select(`
        *,
        unit:units(id, name, address, floor),
        photos:damage_report_photos(id, file_name, mime_type, sort_order)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }
    if (urgency) {
      query = query.eq('urgency', urgency)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching damage reports:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Schadensmeldungen' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST /api/damage-reports - Create a new damage report
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Rate limiting: max 5 reports per hour per user
    const { data: isAllowed } = await supabase.rpc('check_rate_limit', {
      check_action: 'create_damage_report',
      check_identifier: user.id,
      max_attempts: 5,
      window_minutes: 60,
    })

    if (isAllowed === false) {
      return NextResponse.json(
        {
          error:
            'Zu viele Schadensmeldungen. Maximal 5 Meldungen pro Stunde erlaubt. Bitte versuchen Sie es später erneut.',
        },
        { status: 429 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const parsed = createDamageReportSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Get user profile (organization_id + unit_id + name)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, unit_id, role, first_name, last_name')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Benutzerprofil nicht gefunden' },
        { status: 403 }
      )
    }

    if (!profile.unit_id) {
      return NextResponse.json(
        { error: 'Keine Wohneinheit zugeordnet. Bitte kontaktieren Sie Ihre Hausverwaltung.' },
        { status: 403 }
      )
    }

    // Generate sequential case number
    const { data: caseNumber, error: caseNumberError } = await supabase.rpc(
      'generate_case_number',
      { org_id: profile.organization_id }
    )

    if (caseNumberError || !caseNumber) {
      console.error('Error generating case number:', caseNumberError)
      return NextResponse.json(
        { error: 'Fehler beim Generieren der Fallnummer' },
        { status: 500 }
      )
    }

    // Insert the damage report
    const { data: report, error: insertError } = await supabase
      .from('damage_reports')
      .insert({
        organization_id: profile.organization_id,
        unit_id: profile.unit_id,
        reporter_id: user.id,
        case_number: caseNumber,
        category: parsed.data.category,
        subcategory: parsed.data.subcategory || null,
        room: parsed.data.room || null,
        title: parsed.data.title,
        description: parsed.data.description || null,
        urgency: parsed.data.urgency,
        preferred_appointment: parsed.data.preferred_appointment || null,
        preferred_appointment_2: parsed.data.preferred_appointment_2 || null,
        access_notes: parsed.data.access_notes || null,
        status: 'neu',
      })
      .select(`
        *,
        unit:units(id, name, address, floor)
      `)
      .single()

    if (insertError) {
      if (insertError.code === '42501' || insertError.message?.includes('policy')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Erstellen einer Schadensmeldung' },
          { status: 403 }
        )
      }
      console.error('Error creating damage report:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Schadensmeldung' },
        { status: 500 }
      )
    }

    // Link uploaded photos to this report (if photo_ids provided)
    if (parsed.data.photo_ids && parsed.data.photo_ids.length > 0) {
      for (let i = 0; i < parsed.data.photo_ids.length; i++) {
        await supabase
          .from('damage_report_photos')
          .update({
            damage_report_id: report.id,
            sort_order: i,
          })
          .eq('id', parsed.data.photo_ids[i])
          .eq('organization_id', profile.organization_id)
      }
    }

    // Record rate limit attempt
    await supabase.rpc('record_rate_limit_attempt', {
      attempt_action: 'create_damage_report',
      attempt_identifier: user.id,
      attempt_success: true,
    })

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'damage_report_created',
      entity_type: 'damage_report',
      entity_id: report.id,
      details: {
        case_number: caseNumber,
        category: parsed.data.category,
        urgency: parsed.data.urgency,
        photo_count: parsed.data.photo_ids?.length || 0,
      },
    })

    // Fetch photos for response
    const { data: photos } = await supabase
      .from('damage_report_photos')
      .select('id, file_name, mime_type, sort_order')
      .eq('damage_report_id', report.id)
      .order('sort_order')

    // Fire-and-forget: KI-Analyse + E-Mail an HV-Admins
    ;(async () => {
      try {
        const adminClient = createAdminClient()
        const [{ data: orgAdmins }, { data: org }, { data: { users: allUsers } }] = await Promise.all([
          adminClient
            .from('profiles')
            .select('id')
            .eq('organization_id', profile.organization_id)
            .in('role', ['hv_admin', 'hv_mitarbeiter'])
            .eq('is_deleted', false),
          adminClient
            .from('organizations')
            .select('name')
            .eq('id', profile.organization_id)
            .single(),
          adminClient.auth.admin.listUsers({ perPage: 1000 }),
        ])

        const adminIds = new Set((orgAdmins || []).map((p: { id: string }) => p.id))
        const adminEmails = (allUsers || [])
          .filter(u => adminIds.has(u.id) && u.email)
          .map(u => u.email as string)
        const tenantName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unbekannter Mieter'
        const unit = report.unit as { id?: string; name?: string; address?: string } | null
        const unitName = unit?.name || 'Unbekannte Einheit'
        const orgName = org?.name || 'Hausverwaltung'

        // Run KI analysis automatically
        let kiAnalysis: string | null = null
        let kiLeaseFound = false
        if (process.env.ANTHROPIC_API_KEY) {
          try {
            const kiResult = await runKiAnalyse({
              supabase: adminClient,
              organizationId: profile.organization_id,
              reportId: report.id,
              title: parsed.data.title,
              description: parsed.data.description || null,
              category: parsed.data.category,
              subcategory: parsed.data.subcategory || null,
              urgency: parsed.data.urgency,
              room: parsed.data.room || null,
              unitId: profile.unit_id,
              unitName,
              unitAddress: unit?.address || null,
            })
            kiAnalysis = kiResult.analysisText
            kiLeaseFound = kiResult.leaseFound
          } catch (kiErr) {
            console.error('KI-Analyse failed (non-blocking):', kiErr)
          }
        }

        if (adminEmails.length > 0) {
          await sendDamageReportNotificationEmail({
            to: adminEmails,
            caseNumber,
            title: parsed.data.title,
            category: parsed.data.category,
            urgency: parsed.data.urgency,
            unitName,
            tenantName,
            orgName,
            reportId: report.id,
            kiAnalysis,
            kiLeaseFound,
          })
        }
      } catch (emailErr) {
        console.error('Failed to send damage report notification email:', emailErr)
      }
    })()

    return NextResponse.json(
      {
        data: {
          ...report,
          photos: photos || [],
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
