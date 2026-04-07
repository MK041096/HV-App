import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

// GET /api/admin/suspicious-activity
// Gibt Mieter zurück, die in den letzten 2 Stunden 5 oder mehr Schadensmeldungen eingereicht haben
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || profile.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Alle Meldungen der letzten 2 Stunden laden
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    const { data: reports, error } = await adminClient
      .from('damage_reports')
      .select('reporter_id, created_at')
      .eq('is_deleted', false)
      .gte('created_at', twoHoursAgo)
      .not('reporter_id', 'is', null)

    if (error) throw error

    // Gruppieren nach reporter_id
    const countMap: Record<string, number> = {}
    for (const r of reports || []) {
      if (r.reporter_id) {
        countMap[r.reporter_id] = (countMap[r.reporter_id] || 0) + 1
      }
    }

    // Nur Mieter mit 5+ Meldungen
    const suspiciousIds = Object.entries(countMap)
      .filter(([, count]) => count >= 5)
      .sort(([, a], [, b]) => b - a)
      .map(([id, count]) => ({ id, count }))

    if (suspiciousIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Profil-Daten laden
    const ids = suspiciousIds.map(s => s.id)
    const { data: profiles } = await adminClient
      .from('profiles')
      .select(`
        id, first_name, last_name, blocked_until, unit_id,
        organization_id,
        organization:organizations(id, name),
        unit:units(id, name)
      `)
      .in('id', ids)
      .eq('is_deleted', false)

    // Auth-E-Mails laden
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    const emailMap: Record<string, string> = {}
    for (const u of authUsers || []) {
      if (u.email) emailMap[u.id] = u.email
    }

    // Zusammenführen
    const result = suspiciousIds.map(({ id, count }) => {
      const p = profiles?.find(pr => pr.id === id)
      const isBlocked = p?.blocked_until && new Date(p.blocked_until) > new Date()
      return {
        tenant_id: id,
        tenant_name: p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : 'Unbekannt',
        email: emailMap[id] || null,
        report_count: count,
        organization_id: p?.organization_id || null,
        org_name: (p?.organization as { name?: string } | null)?.name || 'Unbekannt',
        unit_name: (p?.unit as { name?: string } | null)?.name || null,
        blocked_until: p?.blocked_until || null,
        is_blocked: isBlocked,
      }
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('Suspicious activity error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
