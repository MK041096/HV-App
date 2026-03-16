import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    // Auth check: must be platform_admin
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Fetch all organizations
    const { data: orgs, error: orgsError } = await admin
      .from('organizations')
      .select('id, name, created_at, avv_accepted_at')
      .order('created_at', { ascending: false })

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError)
      return NextResponse.json({ error: 'Fehler beim Laden der Organisationen' }, { status: 500 })
    }

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const orgIds = orgs.map((o) => o.id)

    // Fetch all needed data in parallel
    const [hvAdminsResult, unitsResult, tenantsResult, casesResult] = await Promise.all([
      // HV admins (hv_admin role per org)
      admin
        .from('profiles')
        .select('id, organization_id, first_name, last_name')
        .in('organization_id', orgIds)
        .eq('role', 'hv_admin')
        .eq('is_deleted', false),

      // Unit counts per org
      admin
        .from('units')
        .select('organization_id')
        .in('organization_id', orgIds)
        .eq('is_deleted', false),

      // Tenant counts per org
      admin
        .from('profiles')
        .select('organization_id')
        .in('organization_id', orgIds)
        .eq('role', 'mieter')
        .eq('is_deleted', false),

      // Case counts per org (all and open)
      admin
        .from('damage_reports')
        .select('organization_id, status')
        .in('organization_id', orgIds)
        .eq('is_deleted', false),
    ])

    // Get admin emails from auth.users for hv_admins
    const adminProfiles = hvAdminsResult.data || []
    const adminUserIds = adminProfiles.map((p) => p.id)

    // Build email map via admin auth API
    const emailMap: Record<string, string> = {}
    if (adminUserIds.length > 0) {
      // Fetch auth users for each admin profile (in batches to be safe)
      for (const adminId of adminUserIds) {
        try {
          const { data: authUser } = await admin.auth.admin.getUserById(adminId)
          if (authUser?.user?.email) {
            emailMap[adminId] = authUser.user.email
          }
        } catch {
          // Skip if individual user lookup fails
        }
      }
    }

    // Build lookup maps
    // HV admin per org (first hv_admin found)
    const hvAdminByOrg: Record<string, { email: string; name: string }> = {}
    for (const p of adminProfiles) {
      if (!hvAdminByOrg[p.organization_id]) {
        hvAdminByOrg[p.organization_id] = {
          email: emailMap[p.id] || '',
          name: [p.first_name, p.last_name].filter(Boolean).join(' '),
        }
      }
    }

    // Unit count per org
    const unitCountByOrg: Record<string, number> = {}
    for (const u of unitsResult.data || []) {
      unitCountByOrg[u.organization_id] = (unitCountByOrg[u.organization_id] || 0) + 1
    }

    // Tenant count per org
    const tenantCountByOrg: Record<string, number> = {}
    for (const t of tenantsResult.data || []) {
      tenantCountByOrg[t.organization_id] = (tenantCountByOrg[t.organization_id] || 0) + 1
    }

    // Case counts per org
    const caseCountByOrg: Record<string, number> = {}
    const openCaseCountByOrg: Record<string, number> = {}
    const CLOSED_STATUSES = ['erledigt', 'abgelehnt']

    for (const c of casesResult.data || []) {
      caseCountByOrg[c.organization_id] = (caseCountByOrg[c.organization_id] || 0) + 1
      if (!CLOSED_STATUSES.includes(c.status)) {
        openCaseCountByOrg[c.organization_id] = (openCaseCountByOrg[c.organization_id] || 0) + 1
      }
    }

    // Build final response
    const data = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      created_at: org.created_at,
      avv_accepted_at: org.avv_accepted_at ?? null,
      is_suspended: false, // Column does not exist yet — always false for now
      admin_email: hvAdminByOrg[org.id]?.email ?? '',
      admin_name: hvAdminByOrg[org.id]?.name ?? '',
      unit_count: unitCountByOrg[org.id] ?? 0,
      tenant_count: tenantCountByOrg[org.id] ?? 0,
      case_count: caseCountByOrg[org.id] ?? 0,
      open_case_count: openCaseCountByOrg[org.id] ?? 0,
    }))

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Admin organizations error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
