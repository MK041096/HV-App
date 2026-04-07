import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server"
import { hvUnitListSchema } from "@/lib/validations/hv-tenant-management"
import { sendTenantInviteEmail } from "@/lib/email"

const HV_ROLES = ["hv_admin", "hv_mitarbeiter", "platform_admin"]
const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateCode(): string {
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)]
  }
  return code
}

// POST /api/hv/units - Create a single unit manually
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .eq("is_deleted", false)
      .single()

    if (profileError || !profile) return NextResponse.json({ error: "Benutzerprofil nicht gefunden" }, { status: 403 })
    if (!HV_ROLES.includes(profile.role)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

    const body = await request.json()
    const { name, address, floor, first_name, last_name, email, phone } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Einheitenname ist erforderlich" }, { status: 400 })
    }
    if (!email && !phone) {
      return NextResponse.json({ error: "E-Mail oder Telefonnummer ist erforderlich" }, { status: 400 })
    }

    // Check unit limit
    const { data: orgInfo } = await supabase
      .from('organizations')
      .select('einheiten_anzahl')
      .eq('id', profile.organization_id)
      .single()

    if (orgInfo?.einheiten_anzahl && orgInfo.einheiten_anzahl > 0) {
      const { count: currentCount } = await supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('is_deleted', false)
      if ((currentCount ?? 0) >= orgInfo.einheiten_anzahl) {
        return NextResponse.json({
          error: `Einheitenlimit erreicht (${orgInfo.einheiten_anzahl} von ${orgInfo.einheiten_anzahl}). Bitte kontaktieren Sie uns unter kracherdigital@gmail.com um Ihr Abonnement anzupassen.`
        }, { status: 403 })
      }
    }

    const { data: newUnit, error: unitError } = await adminSupabase
      .from("units")
      .insert({
        organization_id: profile.organization_id,
        name: name.trim(),
        address: address?.trim() || null,
        floor: floor?.trim() || null,
        is_deleted: false,
      })
      .select("id, name")
      .single()

    if (unitError || !newUnit) {
      return NextResponse.json({ error: "Einheit konnte nicht erstellt werden" }, { status: 500 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    const expiresAtStr = expiresAt.toISOString()

    let code = ""
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateCode()
      const { data: existing } = await adminSupabase
        .from("activation_codes")
        .select("id")
        .eq("code", candidate)
        .limit(1)
      if (!existing || existing.length === 0) { code = candidate; break }
    }
    if (!code) return NextResponse.json({ error: "Aktivierungscode konnte nicht generiert werden" }, { status: 500 })

    const tenantName = [first_name?.trim(), last_name?.trim()].filter(Boolean).join(" ") || null

    const { data: codeData, error: codeError } = await adminSupabase
      .from("activation_codes")
      .insert({
        organization_id: profile.organization_id,
        unit_id: newUnit.id,
        code,
        status: "pending",
        expires_at: expiresAtStr,
        created_by: user.id,
        invited_email: email?.trim() || null,
        invited_first_name: first_name?.trim() || null,
        invited_last_name: last_name?.trim() || null,
      })
      .select("id, code, expires_at")
      .single()

    if (codeError || !codeData) {
      return NextResponse.json({ error: "Aktivierungscode konnte nicht gespeichert werden" }, { status: 500 })
    }

    if (email?.trim()) {
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profile.organization_id)
        .single()

      await sendTenantInviteEmail({
        to: email.trim(),
        tenantName,
        activationCode: code,
        expiresAt: expiresAtStr,
        orgName: org?.name || "Ihre Hausverwaltung",
        unitName: newUnit.name,
      })
    }

    return NextResponse.json({
      data: {
        unit: newUnit,
        code: codeData.code,
        expires_at: codeData.expires_at,
      }
    }, { status: 201 })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

// DELETE /api/hv/units - Bulk delete units by IDs (single DB query, much faster than N individual calls)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !HV_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json()
    const ids: string[] = body.ids
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Keine IDs angegeben' }, { status: 400 })
    }

    // Verify all IDs belong to this organization and have no open reports
    const { data: units } = await admin
      .from('units')
      .select('id, name')
      .in('id', ids)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    const validIds = (units || []).map(u => u.id)
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'Keine gültigen Einheiten gefunden' }, { status: 404 })
    }

    // Check for open damage reports across all selected units
    const { data: openReports } = await admin
      .from('damage_reports')
      .select('unit_id, id')
      .in('unit_id', validIds)
      .eq('is_deleted', false)
      .not('status', 'in', '("erledigt","abgelehnt")')

    const blockedUnitIds = new Set((openReports || []).map(r => r.unit_id))
    const deletableIds = validIds.filter(id => !blockedUnitIds.has(id))
    const skippedNames = (units || []).filter(u => blockedUnitIds.has(u.id)).map(u => u.name)

    if (deletableIds.length > 0) {
      const now = new Date().toISOString()

      await admin
        .from('units')
        .update({ is_deleted: true, deleted_at: now })
        .in('id', deletableIds)
        .eq('organization_id', profile.organization_id)

      // Offene Aktivierungscodes für gelöschte Einheiten abbrechen
      await admin
        .from('activation_codes')
        .update({ status: 'deactivated' })
        .in('unit_id', deletableIds)
        .eq('organization_id', profile.organization_id)
        .eq('status', 'pending')

      // Verknüpfte Mieter-Profile soft-deleten
      await admin
        .from('profiles')
        .update({ is_deleted: true, deleted_at: now })
        .in('unit_id', deletableIds)
        .eq('organization_id', profile.organization_id)
        .eq('role', 'mieter')
        .eq('is_deleted', false)

      await admin.from('audit_logs').insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        action: 'units_bulk_deleted',
        entity_type: 'unit',
        entity_id: profile.organization_id,
        details: { deleted_count: deletableIds.length, skipped_count: skippedNames.length },
      })
    }

    return NextResponse.json({
      deleted: deletableIds.length,
      skipped: skippedNames,
    })
  } catch (err) {
    console.error('DELETE /api/hv/units error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

// GET /api/hv/units - List all units with tenant status for HV portal
// Returns enriched unit data: unit info + assigned tenant + activation code status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()

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

    // Get unit limit from organization
    const { data: orgData } = await supabase
      .from('organizations')
      .select('einheiten_anzahl')
      .eq('id', profile.organization_id)
      .single()
    const orgLimit = orgData?.einheiten_anzahl || 0

    // Parse query params
    const { searchParams } = new URL(request.url)
    const parsed = hvUnitListSchema.safeParse({
      page: searchParams.get('page') || undefined,
      per_page: searchParams.get('per_page') || undefined,
      tenant_status: searchParams.get('tenant_status') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: searchParams.get('sort_order') || undefined,
      ids_only: searchParams.get('ids_only') || undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Parameter', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { page, per_page, tenant_status, search, sort_by, sort_order, ids_only } = parsed.data

    // ── Fast path: return only unit IDs (for "select all" across pages) ──
    if (ids_only) {
      let idsQuery = admin
        .from('units')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('is_deleted', false)
        .limit(9999)
      if (search) {
        const searchTerm = `%${search}%`
        idsQuery = idsQuery.or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`)
      }
      const { data: idRows } = await idsQuery
      return NextResponse.json({ ids: (idRows || []).map(r => r.id) })
    }

    // Count query
    let countQuery = supabase
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    // Data query - fetch units with basic info (including imported tenant name)
    let dataQuery = supabase
      .from('units')
      .select('id, name, address, floor, is_deleted, created_at, updated_at, imported_first_name, imported_last_name')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    // Search by name or address
    if (search) {
      const searchTerm = `%${search}%`
      countQuery = countQuery.or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`)
      dataQuery = dataQuery.or(`name.ilike.${searchTerm},address.ilike.${searchTerm}`)
    }

    // Sorting — use name_sort for natural numeric order (1, 2, 3... not 1, 10, 11, 2...)
    const sortColumn = sort_by === 'name' ? 'name_sort' : sort_by
    dataQuery = dataQuery.order(sortColumn, { ascending: sort_order === 'asc' })
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
    // Uses admin client to bypass RLS (activation_codes RLS checks user_roles table which may not include all HV roles)
    let pendingCodesByUnit: Record<string, { id: string; code: string; invited_first_name: string | null; invited_last_name: string | null; invited_email: string | null; created_at: string; expires_at: string }> = {}
    if (unitIds.length > 0) {
      const { data: codes } = await admin
        .from('activation_codes')
        .select('id, unit_id, code, invited_first_name, invited_last_name, invited_email, created_at, expires_at')
        .in('unit_id', unitIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (codes) {
        // Only keep the latest pending code per unit
        for (const c of codes) {
          if (!pendingCodesByUnit[c.unit_id]) {
            pendingCodesByUnit[c.unit_id] = {
              id: c.id,
              code: c.code,
              invited_first_name: (c as any).invited_first_name ?? null,
              invited_last_name: (c as any).invited_last_name ?? null,
              invited_email: (c as any).invited_email ?? null,
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
        imported_first_name: (unit as any).imported_first_name || null,
        imported_last_name: (unit as any).imported_last_name || null,
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
    if (tenant_status === 'vacant_no_email') {
      // Pending code exists but no email was sent (import without email)
      filtered = enriched.filter((u) => u.tenant_status === 'pending' && !u.pending_code?.invited_email)
    } else if (tenant_status !== 'all') {
      filtered = enriched.filter((u) => u.tenant_status === tenant_status)
    }

    // ── Global summary counts (all units, not just current page) ──
    // Count occupied: units with an active tenant profile
    const { count: occupiedCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('role', 'mieter')
      .eq('is_deleted', false)
      .not('unit_id', 'is', null)

    // Count pending: only for non-deleted units
    // Uses admin client to bypass RLS
    const { data: activeUnitRows } = await admin
      .from('units')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    const activeUnitIds = (activeUnitRows || []).map((u: { id: string }) => u.id)

    let pendingWithEmail = 0
    let pendingNoEmail = 0

    if (activeUnitIds.length > 0) {
      const { data: pendingCodes } = await admin
        .from('activation_codes')
        .select('unit_id, invited_email')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'pending')
        .in('unit_id', activeUnitIds)

      pendingWithEmail = new Set(
        (pendingCodes || []).filter((r: { unit_id: string; invited_email: string | null }) => r.invited_email).map((r: { unit_id: string }) => r.unit_id)
      ).size
      pendingNoEmail = new Set(
        (pendingCodes || []).filter((r: { unit_id: string; invited_email: string | null }) => !r.invited_email).map((r: { unit_id: string }) => r.unit_id)
      ).size
    }

    const globalOccupied = occupiedCount || 0
    const globalPending = pendingWithEmail
    const globalVacantNoEmail = pendingNoEmail
    const globalVacant = Math.max(0, totalCount - globalOccupied - globalPending - globalVacantNoEmail)

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
        occupied: globalOccupied,
        pending: globalPending,
        vacant: globalVacant,
        vacant_no_email: globalVacantNoEmail,
        einheiten_limit: orgLimit,
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
