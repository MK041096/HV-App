import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hvUnitListSchema } from '@/lib/validations/hv-tenant-management'

const HV_ROLES = ['hv_admin', 'hv_mitarbeiter', 'platform_admin']

// GET /api/hv/units - List all units with tenant status for HV portal
// Returns enriched unit data: unit info + assigned tenant + activation code status
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
        { error: 'Keine Berechtigung. Nur HV-Mitarbeiter können auf die Einheitenverwaltung zugreifen.' },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const parsed = hvUnitListSchema.safeParse({
      page: searchParams.get('page') || undefined,
      per_page: searchParams.get('per_page') || undefined,
      tenant_status: searchParams.get('tenant_status') || undefined,
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

    const { page, per_page, tenant_status, search, sort_by, sort_order } = parsed.data

    // Count query
    let countQuery = supabase
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    // Data query - fetch units with basic info
    let dataQuery = supabase
      .from('units')
      .select('id, name, address, floor, is_deleted, created_at, updated_at')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    // Search by name or address
    if (search) {
      const searchTerm = `%${search}%`
      countQuery = countQuery.or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`)
      dataQuery = dataQuery.or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`)
    }

    // Sorting
    dataQuery = dataQuery.order(sort_by, { ascending: sort_order === 'asc' })
    if (sort_by !== 'created_at') {
      dataQuery = dataQuery.order('created_at', { ascending: false })
    }

    // Execute count
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting units:', countError)
      return NextResponse.json(
        { error: 'Fehler beim Zählen der Einheiten' },
        { status: 500 }
      )
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / per_page)
    const offset = (page - 1) * per_page

    dataQuery = dataQuery.range(offset, offset + per_page - 1)

    const { data: units, error } = await dataQuery

    if (error) {
      console.error('Error fetching units:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Einheiten' },
        { status: 500 }
      )
    }

    const unitIds = (units || []).map((u) => u.id)

    // Batch fetch: tenants assigned to these units
    let tenantsByUnit: Record<string, { id: string; first_name: string | null; last_name: string | null; is_deleted: boolean }> = {}
    if (unitIds.length > 0) {
      const { data: tenants } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, unit_id, is_deleted')
        .in('unit_id', unitIds)
        .eq('role', 'mieter')

      if (tenants) {
        for (const t of tenants) {
          if (t.unit_id) {
            tenantsByUnit[t.unit_id] = {
              id: t.id,
              first_name: t.first_name,
              last_name: t.last_name,
              is_deleted: t.is_deleted,
            }
          }
        }
      }
    }

    // Batch fetch: pending activation codes for these units
    let pendingCodesByUnit: Record<string, { id: string; created_at: string; expires_at: string }> = {}
    if (unitIds.length > 0) {
      const { data: codes } = await supabase
        .from('activation_codes')
        .select('id, unit_id, created_at, expires_at')
        .in('unit_id', unitIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (codes) {
        // Only keep the latest pending code per unit
        for (const c of codes) {
          if (!pendingCodesByUnit[c.unit_id]) {
            pendingCodesByUnit[c.unit_id] = {
              id: c.id,
              created_at: c.created_at,
              expires_at: c.expires_at,
            }
          }
        }
      }
    }

    // Batch fetch: damage report counts per unit
    let reportCountsByUnit: Record<string, number> = {}
    if (unitIds.length > 0) {
      const { data: reports } = await supabase
        .from('damage_reports')
        .select('unit_id')
        .in('unit_id', unitIds)
        .eq('organization_id', profile.organization_id)
        .eq('is_deleted', false)

      if (reports) {
        for (const r of reports) {
          reportCountsByUnit[r.unit_id] = (reportCountsByUnit[r.unit_id] || 0) + 1
        }
      }
    }

    // Determine tenant_status for each unit and enrich
    type TenantStatus = 'occupied' | 'vacant' | 'pending'

    const enriched = (units || []).map((unit) => {
      const tenant = tenantsByUnit[unit.id]
      const pendingCode = pendingCodesByUnit[unit.id]

      let unitTenantStatus: TenantStatus
      if (tenant && !tenant.is_deleted) {
        unitTenantStatus = 'occupied' // Active tenant assigned
      } else if (pendingCode) {
        unitTenantStatus = 'pending' // Activation code sent, waiting for registration
      } else {
        unitTenantStatus = 'vacant' // No tenant, no pending code
      }

      return {
        id: unit.id,
        name: unit.name,
        address: unit.address,
        floor: unit.floor,
        created_at: unit.created_at,
        tenant_status: unitTenantStatus,
        tenant_status_label: {
          occupied: 'Aktiver Mieter',
          pending: 'Registrierung ausstehend',
          vacant: 'Kein Mieter',
        }[unitTenantStatus],
        tenant: tenant && !tenant.is_deleted
          ? {
              id: tenant.id,
              first_name: tenant.first_name,
              last_name: tenant.last_name,
              full_name: [tenant.first_name, tenant.last_name].filter(Boolean).join(' ') || 'Unbekannt',
            }
          : null,
        pending_code: pendingCode || null,
        damage_report_count: reportCountsByUnit[unit.id] || 0,
      }
    })

    // Apply tenant_status filter (post-query since it depends on joined data)
    let filtered = enriched
    if (tenant_status !== 'all') {
      filtered = enriched.filter((u) => u.tenant_status === tenant_status)
    }

    return NextResponse.json({
      data: filtered,
      pagination: {
        page,
        per_page,
        total_count: tenant_status === 'all' ? totalCount : filtered.length,
        total_pages: tenant_status === 'all' ? totalPages : Math.ceil(filtered.length / per_page),
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      summary: {
        total_units: totalCount,
        occupied: enriched.filter((u) => u.tenant_status === 'occupied').length,
        pending: enriched.filter((u) => u.tenant_status === 'pending').length,
        vacant: enriched.filter((u) => u.tenant_status === 'vacant').length,
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
