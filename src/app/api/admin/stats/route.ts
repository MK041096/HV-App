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

    const PLATFORM_ORG_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

    // Fetch counts in parallel — exclude platform-internal org/user
    const [orgsResult, usersResult, casesResult, unitsResult] = await Promise.all([
      admin.from('organizations').select('id, created_at', { count: 'exact' }).neq('id', PLATFORM_ORG_ID),
      admin.from('profiles').select('id', { count: 'exact' }).eq('is_deleted', false).neq('role', 'platform_admin'),
      admin
        .from('damage_reports')
        .select('id', { count: 'exact' })
        .eq('is_deleted', false),
      admin.from('units').select('id', { count: 'exact' }).eq('is_deleted', false),
    ])

    const total_organizations = orgsResult.count ?? 0
    const total_users = usersResult.count ?? 0
    const total_cases = casesResult.count ?? 0
    const total_units = unitsResult.count ?? 0

    // New orgs this month (excluding platform org)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newOrgsCount } = await admin
      .from('organizations')
      .select('id', { count: 'exact' })
      .neq('id', PLATFORM_ORG_ID)
      .gte('created_at', startOfMonth.toISOString())

    return NextResponse.json({
      data: {
        total_organizations,
        total_users,
        total_cases,
        total_units,
        new_orgs_this_month: newOrgsCount ?? 0,
      },
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
