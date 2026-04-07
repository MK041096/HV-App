import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/hv/einheiten-mit-vertraegen
// Returns all units of the org with their mietvertrag documents
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Load all units (no DB-level order — we sort numerically below)
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, name, address')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    if (unitsError) throw unitsError

    // Sort: address alphabetically, then Top number numerically (Top 2 before Top 10)
    ;(units || []).sort((a, b) => {
      const addrCmp = (a.address || '').localeCompare(b.address || '', 'de', { numeric: true, sensitivity: 'base' })
      if (addrCmp !== 0) return addrCmp
      return (a.name || '').localeCompare(b.name || '', 'de', { numeric: true, sensitivity: 'base' })
    })

    // Load tenant names for each unit (active tenants + pending activation codes)
    const unitIds = (units || []).map(u => u.id)
    const [{ data: tenants }, { data: codes }] = await Promise.all([
      supabase
        .from('profiles')
        .select('unit_id, first_name, last_name')
        .in('unit_id', unitIds)
        .eq('role', 'mieter')
        .eq('is_deleted', false),
      supabase
        .from('activation_codes')
        .select('unit_id, invited_first_name, invited_last_name')
        .in('unit_id', unitIds)
        .eq('status', 'pending'),
    ])
    const tenantMap: Record<string, string> = {}
    for (const t of tenants || []) {
      if (t.unit_id) tenantMap[t.unit_id] = [t.first_name, t.last_name].filter(Boolean).join(' ')
    }
    for (const c of codes || []) {
      if (c.unit_id && !tenantMap[c.unit_id]) {
        const name = [c.invited_first_name, c.invited_last_name].filter(Boolean).join(' ')
        if (name) tenantMap[c.unit_id] = name
      }
    }

    // Load all mietvertrag docs that are assigned to a unit
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, unit_id, created_at')
      .eq('organization_id', profile.organization_id)
      .eq('document_type', 'mietvertrag')
      .eq('is_deleted', false)
      .not('unit_id', 'is', null)

    const docsByUnit = new Map<string, { id: string; name: string; created_at: string }[]>()
    for (const doc of docs || []) {
      if (!doc.unit_id) continue
      if (!docsByUnit.has(doc.unit_id)) docsByUnit.set(doc.unit_id, [])
      docsByUnit.get(doc.unit_id)!.push({ id: doc.id, name: doc.name, created_at: doc.created_at })
    }

    const einheiten = (units || []).map(unit => ({
      id: unit.id,
      name: unit.name,
      address: unit.address,
      tenant_name: tenantMap[unit.id] || null,
      docs: docsByUnit.get(unit.id) || [],
    }))

    return NextResponse.json({ einheiten })
  } catch (err) {
    console.error('Einheiten-mit-Vertraegen error:', err)
    return NextResponse.json({ error: 'Fehler beim Laden der Einheiten' }, { status: 500 })
  }
}
