import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function checkPlatformAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, error: 'Nicht angemeldet', status: 401 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'platform_admin') {
    return { user: null, error: 'Kein Zugriff', status: 403 }
  }

  return { user, error: null, status: 200 }
}

// GET /api/admin/organizations/[id] — single org detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error, status } = await checkPlatformAdmin()
    if (!user) return NextResponse.json({ error }, { status })

    const { id } = await params

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Ungültige Organisations-ID' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch organization
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('id, name, created_at, avv_accepted_at')
      .eq('id', id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organisation nicht gefunden' }, { status: 404 })
    }

    // Fetch all data in parallel
    const [profilesResult, casesResult, unitsResult, tenantsResult] = await Promise.all([
      // All users of this org (hv_admin + hv_mitarbeiter)
      admin
        .from('profiles')
        .select('id, first_name, last_name, role, created_at')
        .eq('organization_id', id)
        .in('role', ['hv_admin', 'hv_mitarbeiter'])
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }),

      // Last 10 cases
      admin
        .from('damage_reports')
        .select('id, case_number, title, status, urgency, created_at')
        .eq('organization_id', id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10),

      // Unit count
      admin
        .from('units')
        .select('id', { count: 'exact' })
        .eq('organization_id', id)
        .eq('is_deleted', false),

      // Tenant count
      admin
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('organization_id', id)
        .eq('role', 'mieter')
        .eq('is_deleted', false),
    ])

    // Open case count
    const CLOSED_STATUSES = ['erledigt', 'abgelehnt']
    const allCases = casesResult.data || []

    // Get total case count separately
    const { count: totalCaseCount } = await admin
      .from('damage_reports')
      .select('id', { count: 'exact' })
      .eq('organization_id', id)
      .eq('is_deleted', false)

    const { count: openCaseCount } = await admin
      .from('damage_reports')
      .select('id', { count: 'exact' })
      .eq('organization_id', id)
      .eq('is_deleted', false)
      .not('status', 'in', `(${CLOSED_STATUSES.join(',')})`)

    // Get emails for staff profiles
    const staffProfiles = profilesResult.data || []
    const emailMap: Record<string, string> = {}

    for (const p of staffProfiles) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(p.id)
        if (authUser?.user?.email) {
          emailMap[p.id] = authUser.user.email
        }
      } catch {
        // Skip
      }
    }

    const users = staffProfiles.map((p) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: emailMap[p.id] ?? '',
      role: p.role,
      created_at: p.created_at,
    }))

    return NextResponse.json({
      data: {
        id: org.id,
        name: org.name,
        created_at: org.created_at,
        avv_accepted_at: org.avv_accepted_at ?? null,
        is_suspended: false,
        unit_count: unitsResult.count ?? 0,
        tenant_count: tenantsResult.count ?? 0,
        case_count: totalCaseCount ?? 0,
        open_case_count: openCaseCount ?? 0,
        users,
        recent_cases: allCases,
      },
    })
  } catch (err) {
    console.error('Admin organization detail error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

// PATCH /api/admin/organizations/[id] — suspend/unsuspend (not yet implemented)
export async function PATCH(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error, status } = await checkPlatformAdmin()
    if (!user) return NextResponse.json({ error }, { status })

    return NextResponse.json(
      { error: 'Noch nicht implementiert' },
      { status: 501 }
    )
  } catch (err) {
    console.error('Admin organization patch error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
