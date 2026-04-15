import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'platform_admin') return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

    const admin = createAdminClient()
    const PLATFORM_ORG_ID = 'bbbbbbbb-0000-0000-0000-000000000000'

    // Base counts
    const [orgsResult, usersResult, casesResult, unitsResult] = await Promise.all([
      admin.from('organizations').select('id, created_at, status', { count: 'exact' }).neq('id', PLATFORM_ORG_ID),
      admin.from('profiles').select('id', { count: 'exact' }).eq('is_deleted', false).neq('role', 'platform_admin'),
      admin.from('damage_reports').select('id, status, urgency, created_at', { count: 'exact' }).eq('is_deleted', false),
      admin.from('units').select('id', { count: 'exact' }).eq('is_deleted', false),
    ])

    const total_organizations = orgsResult.count ?? 0
    const total_users = usersResult.count ?? 0
    const total_cases = casesResult.count ?? 0
    const total_units = unitsResult.count ?? 0

    // New orgs this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { count: newOrgsCount } = await admin
      .from('organizations').select('id', { count: 'exact' })
      .neq('id', PLATFORM_ORG_ID)
      .gte('created_at', startOfMonth.toISOString())

    // Cases by status
    const allCases = casesResult.data || []
    const cases_by_status = {
      neu: allCases.filter(c => c.status === 'neu').length,
      warte_auf_handwerker: allCases.filter(c => c.status === 'warte_auf_handwerker').length,
      termin_vereinbart: allCases.filter(c => c.status === 'termin_vereinbart' || c.status === 'termin_telefonisch').length,
      erledigt: allCases.filter(c => c.status === 'erledigt').length,
      abgelehnt: allCases.filter(c => c.status === 'abgelehnt').length,
    }

    // Cases by urgency
    const cases_by_urgency = {
      notfall: allCases.filter(c => c.urgency === 'notfall').length,
      dringend: allCases.filter(c => c.urgency === 'dringend').length,
      normal: allCases.filter(c => c.urgency === 'normal').length,
    }

    // Orgs by status
    const allOrgs = orgsResult.data || []
    const orgs_by_status = {
      active: allOrgs.filter(o => o.status === 'active').length,
      pending: allOrgs.filter(o => o.status === 'pending').length,
      inactive: allOrgs.filter(o => o.status === 'inactive').length,
    }

    // Cases per month (last 6 months)
    const now = new Date()
    const cases_per_month = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const end = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
      const label = d.toLocaleDateString('de-AT', { month: 'short', year: '2-digit' })
      const count = allCases.filter(c => {
        const cd = new Date(c.created_at)
        return cd >= d && cd < end
      }).length
      return { month: label, cases: count }
    })

    // Orgs per month (last 6 months)
    const orgs_per_month = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const end = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
      const label = d.toLocaleDateString('de-AT', { month: 'short', year: '2-digit' })
      const count = allOrgs.filter(o => {
        const od = new Date(o.created_at)
        return od >= d && od < end
      }).length
      return { month: label, orgs: count }
    })

    // Recent errors from audit_logs (failed actions)
    const { data: recentErrors } = await admin
      .from('audit_logs')
      .select('id, action, entity_type, details, created_at, organization_id')
      .in('action', ['ki_analyse_failed', 'email_failed', 'upload_failed', 'import_failed'])
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      data: {
        total_organizations,
        total_users,
        total_cases,
        total_units,
        new_orgs_this_month: newOrgsCount ?? 0,
        cases_by_status,
        cases_by_urgency,
        orgs_by_status,
        cases_per_month,
        orgs_per_month,
        recent_errors: recentErrors || [],
      },
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
