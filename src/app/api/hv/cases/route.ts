import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  hvCaseListSchema,
  URGENCY_SORT_ORDER,
  CASE_STATUS_LABELS,
} from '@/lib/validations/hv-case-management'
import { CATEGORY_LABELS, URGENCY_LABELS } from '@/lib/validations/damage-report'

// GET /api/hv/cases - List all damage reports for the HV organization
// Supports: pagination (page/per_page), filtering, sorting, search
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

    // Verify HV role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Benutzerprofil nicht gefunden' },
        { status: 403 }
      )
    }

    if (!['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Keine Berechtigung. Nur HV-Mitarbeiter können auf das Case-Management zugreifen.' },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const parsed = hvCaseListSchema.safeParse({
      page: searchParams.get('page') || undefined,
      per_page: searchParams.get('per_page') || undefined,
      status: searchParams.get('status') || undefined,
      urgency: searchParams.get('urgency') || undefined,
      category: searchParams.get('category') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: searchParams.get('sort_order') || undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      page,
      per_page,
      status,
      urgency,
      category,
      assigned_to,
      date_from,
      date_to,
      search,
      sort_by,
      sort_order,
    } = parsed.data

    // Build count query (for total pages)
    let countQuery = supabase
      .from('damage_reports')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    // Build data query
    let dataQuery = supabase
      .from('damage_reports')
      .select(`
        id, case_number, title, category, subcategory, status, urgency,
        created_at, updated_at, closed_at,
        assigned_to_name, assigned_to_company, scheduled_appointment,
        unit:units(id, name, address, floor),
        reporter:profiles!damage_reports_reporter_id_fkey(id, first_name, last_name),
        photos:damage_report_photos(id)
      `)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    // Apply filters to both queries
    if (status) {
      countQuery = countQuery.eq('status', status)
      dataQuery = dataQuery.eq('status', status)
    }
    if (urgency) {
      countQuery = countQuery.eq('urgency', urgency)
      dataQuery = dataQuery.eq('urgency', urgency)
    }
    if (category) {
      countQuery = countQuery.eq('category', category)
      dataQuery = dataQuery.eq('category', category)
    }
    if (assigned_to) {
      // Filter by assigned_to_name (partial match)
      countQuery = countQuery.ilike('assigned_to_name', `%${assigned_to}%`)
      dataQuery = dataQuery.ilike('assigned_to_name', `%${assigned_to}%`)
    }
    if (date_from) {
      countQuery = countQuery.gte('created_at', date_from)
      dataQuery = dataQuery.gte('created_at', date_from)
    }
    if (date_to) {
      countQuery = countQuery.lte('created_at', date_to)
      dataQuery = dataQuery.lte('created_at', date_to)
    }

    // Search: case_number, title (using ilike for simplicity at MVP scale)
    // For search we also need to search reporter name and unit name,
    // which requires a different approach since they're in joined tables.
    // We use textSearch on the main table fields and OR conditions.
    if (search) {
      const searchTerm = `%${search}%`
      // Search across case_number and title on main table
      countQuery = countQuery.or(`case_number.ilike.${searchTerm},title.ilike.${searchTerm}`)
      dataQuery = dataQuery.or(`case_number.ilike.${searchTerm},title.ilike.${searchTerm}`)
    }

    // Sorting
    if (sort_by === 'urgency') {
      // Custom urgency sort: notfall (0) -> dringend (1) -> normal (2)
      // Then by created_at desc as secondary sort
      // Supabase doesn't support custom ordering, so we sort in-memory after fetch
      // But first sort by created_at as secondary
      dataQuery = dataQuery
        .order('created_at', { ascending: false })
    } else {
      dataQuery = dataQuery.order(sort_by, { ascending: sort_order === 'asc' })
      // Secondary sort by created_at
      if (sort_by !== 'created_at') {
        dataQuery = dataQuery.order('created_at', { ascending: false })
      }
    }

    // Execute count query
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting cases:', countError)
      return NextResponse.json(
        { error: 'Fehler beim Zählen der Fälle' },
        { status: 500 }
      )
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / per_page)

    // For urgency sort, we need all matching records to sort properly,
    // but we limit to a reasonable max to avoid memory issues
    let offset: number
    let limit: number

    if (sort_by === 'urgency') {
      // Fetch all for custom sort, but cap at 500 for safety
      offset = 0
      limit = Math.min(totalCount, 500)
    } else {
      offset = (page - 1) * per_page
      limit = per_page
      dataQuery = dataQuery.range(offset, offset + limit - 1)
    }

    if (sort_by === 'urgency') {
      dataQuery = dataQuery.limit(limit)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error('Error fetching cases:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Fälle' },
        { status: 500 }
      )
    }

    let items = data || []

    // Custom urgency sort (notfall first, then dringend, then normal)
    if (sort_by === 'urgency') {
      items = items.sort((a, b) => {
        const urgA = URGENCY_SORT_ORDER[a.urgency] ?? 99
        const urgB = URGENCY_SORT_ORDER[b.urgency] ?? 99
        if (urgA !== urgB) {
          return sort_order === 'asc' ? urgA - urgB : urgB - urgA
        }
        // Secondary sort: newest first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      // Apply pagination after sorting
      const start = (page - 1) * per_page
      items = items.slice(start, start + per_page)
    }

    // Enrich with labels
    const enriched = items.map((item) => ({
      ...item,
      status_label: CASE_STATUS_LABELS[item.status as keyof typeof CASE_STATUS_LABELS] || item.status,
      category_label: CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category,
      urgency_label: URGENCY_LABELS[item.urgency as keyof typeof URGENCY_LABELS] || item.urgency,
      photo_count: Array.isArray(item.photos) ? item.photos.length : 0,
      // Remove raw photos array from list response (only need count)
      photos: undefined,
    }))

    return NextResponse.json({
      data: enriched,
      pagination: {
        page,
        per_page,
        total_count: totalCount,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
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
