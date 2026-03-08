import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hvTenantListSchema } from '@/lib/validations/hv-tenant-management'

const HV_ROLES = ['hv_admin', 'hv_mitarbeiter', 'platform_admin']

// GET /api/hv/tenants - List all tenants for the HV organization
// Supports: pagination, filtering by status, search by name/email, sorting
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

    if (!HV_ROLES.includes(profile.role)) {
      return NextResponse.json(
        { error: 'Keine Berechtigung. Nur HV-Mitarbeiter können auf die Mieterverwaltung zugreifen.' },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const parsed = hvTenantListSchema.safeParse({
      page: searchParams.get('page') || undefined,
      per_page: searchParams.get('per_page') || undefined,
      status: searchParams.get('status') || undefined,
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

    const { page, per_page, status, search, sort_by, sort_order } = parsed.data

    // Build count query for tenants (role = 'mieter') in the same organization
    let countQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('role', 'mieter')

    // Build data query with unit join
    let dataQuery = supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, role, unit_id, is_deleted, created_at, updated_at,
        unit:units(id, name, address, floor)
      `)
      .eq('organization_id', profile.organization_id)
      .eq('role', 'mieter')

    // Apply status filter
    if (status === 'active') {
      countQuery = countQuery.eq('is_deleted', false)
      dataQuery = dataQuery.eq('is_deleted', false)
    } else if (status === 'inactive') {
      countQuery = countQuery.eq('is_deleted', true)
      dataQuery = dataQuery.eq('is_deleted', true)
    }
    // 'all' shows both active and inactive

    // Search by name (first_name, last_name via ilike)
    if (search) {
      const searchTerm = `%${search}%`
      countQuery = countQuery.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
      dataQuery = dataQuery.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    }

    // Sorting
    if (sort_by === 'name') {
      dataQuery = dataQuery
        .order('last_name', { ascending: sort_order === 'asc', nullsFirst: false })
        .order('first_name', { ascending: sort_order === 'asc', nullsFirst: false })
    } else if (sort_by === 'created_at') {
      dataQuery = dataQuery.order('created_at', { ascending: sort_order === 'asc' })
    } else if (sort_by === 'unit') {
      // Sort by unit not directly possible in Supabase joins, sort by unit_id presence
      dataQuery = dataQuery
        .order('unit_id', { ascending: sort_order === 'asc', nullsFirst: sort_order === 'desc' })
        .order('last_name', { ascending: true, nullsFirst: false })
    }

    // Execute count
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting tenants:', countError)
      return NextResponse.json(
        { error: 'Fehler beim Zählen der Mieter' },
        { status: 500 }
      )
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / per_page)
    const offset = (page - 1) * per_page

    // Paginate
    dataQuery = dataQuery.range(offset, offset + per_page - 1)

    const { data, error } = await dataQuery

    if (error) {
      console.error('Error fetching tenants:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Mieter' },
        { status: 500 }
      )
    }

    // Fetch email addresses from auth.users via admin or user metadata
    // Since we can't query auth.users from client SDK, we fetch from user_metadata
    // stored during registration. We'll get emails by looking up auth users for each tenant.
    // For MVP: we'll batch-fetch the damage report counts per tenant.
    const tenantIds = (data || []).map((t) => t.id)

    // Count damage reports per tenant
    let reportCounts: Record<string, number> = {}
    if (tenantIds.length > 0) {
      const { data: reports } = await supabase
        .from('damage_reports')
        .select('reporter_id')
        .in('reporter_id', tenantIds)
        .eq('organization_id', profile.organization_id)
        .eq('is_deleted', false)

      if (reports) {
        for (const r of reports) {
          reportCounts[r.reporter_id] = (reportCounts[r.reporter_id] || 0) + 1
        }
      }
    }

    // Check for pending activation codes per unit
    const unitIds = (data || [])
      .filter((t) => t.unit_id)
      .map((t) => t.unit_id as string)

    let pendingCodes: Record<string, boolean> = {}
    if (unitIds.length > 0) {
      const { data: codes } = await supabase
        .from('activation_codes')
        .select('unit_id')
        .in('unit_id', unitIds)
        .eq('status', 'pending')

      if (codes) {
        for (const c of codes) {
          pendingCodes[c.unit_id] = true
        }
      }
    }

    const enriched = (data || []).map((tenant) => ({
      id: tenant.id,
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      full_name: [tenant.first_name, tenant.last_name].filter(Boolean).join(' ') || 'Unbekannt',
      is_active: !tenant.is_deleted,
      unit: tenant.unit,
      unit_id: tenant.unit_id,
      damage_report_count: reportCounts[tenant.id] || 0,
      created_at: tenant.created_at,
      updated_at: tenant.updated_at,
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
