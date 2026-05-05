import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  hvCaseListSchema,
  URGENCY_SORT_ORDER,
  CASE_STATUS_LABELS,
} from '@/lib/validations/hv-case-management'
import { CATEGORY_LABELS, URGENCY_LABELS, DAMAGE_CATEGORIES, URGENCY_LEVELS } from '@/lib/validations/damage-report'

const createCaseSchema = z.object({
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen haben').max(200),
  category: z.enum(DAMAGE_CATEGORIES),
  urgency: z.enum(URGENCY_LEVELS).default('normal'),
  unit_id: z.string().uuid('Ungültige Einheit').optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
})

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
    // Status "erledigt" inkludiert "abgelehnt" — der Fall ist mit der Ablehnung
    // praktisch erledigt aus Sicht der HV (nichts mehr zu tun)
    if (status) {
      if (status === 'erledigt') {
        countQuery = countQuery.in('status', ['erledigt', 'abgelehnt'])
        dataQuery = dataQuery.in('status', ['erledigt', 'abgelehnt'])
      } else {
        countQuery = countQuery.eq('status', status)
        dataQuery = dataQuery.eq('status', status)
      }
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

    // Search: case_number, title, reporter name, unit address/name
    if (search) {
      const searchTerm = `%${search}%`

      // Find matching reporter IDs from profiles
      const { data: matchingProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
        .limit(100)

      // Find matching unit IDs from units
      const { data: matchingUnits } = await supabase
        .from('units')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`)
        .limit(100)

      const reporterIds = (matchingProfiles || []).map(p => p.id)
      const unitIds = (matchingUnits || []).map(u => u.id)

      // Build OR filter: case_number, title, reporter_id IN [...], unit_id IN [...]
      let orParts = [`case_number.ilike.${searchTerm}`, `title.ilike.${searchTerm}`]
      if (reporterIds.length > 0) orParts.push(`reporter_id.in.(${reporterIds.join(',')})`)
      if (unitIds.length > 0) orParts.push(`unit_id.in.(${unitIds.join(',')})`)

      const orFilter = orParts.join(',')
      countQuery = countQuery.or(orFilter)
      dataQuery = dataQuery.or(orFilter)
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

// POST /api/hv/cases - HV legt manuell einen Fall an
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createCaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Ungültige Eingabe' }, { status: 400 })
    }

    const { title, category, urgency, unit_id, description } = parsed.data

    // Einheit prüfen wenn angegeben
    if (unit_id) {
      const { data: unit } = await supabase.from('units').select('id').eq('id', unit_id).eq('organization_id', profile.organization_id).single()
      if (!unit) return NextResponse.json({ error: 'Einheit nicht gefunden' }, { status: 404 })
    }

    // Fallnummer generieren
    const { data: countData } = await supabase
      .from('damage_reports')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
    const caseNumber = `F-${String((countData as unknown as number ?? 0) + 1).padStart(4, '0')}`

    const { data: newCase, error: insertError } = await supabase
      .from('damage_reports')
      .insert({
        organization_id: profile.organization_id,
        reporter_id: user.id,
        unit_id: unit_id || null,
        title,
        category,
        urgency,
        status: 'neu',
        description: description || null,
        case_number: caseNumber,
        created_by_hv: true,
      })
      .select('id, case_number')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Fall konnte nicht angelegt werden' }, { status: 500 })
    }

    return NextResponse.json({ data: newCase }, { status: 201 })
  } catch (err) {
    console.error('POST /api/hv/cases error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
