import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Extracts the Liegenschaft (building address) from a unit address.
// e.g. "Schönbrunnerstraße 42/Top 1" → "Schönbrunnerstraße 42"
// e.g. "Mariahilfer Straße 88/Top 5" → "Mariahilfer Straße 88"
function extractLiegenschaft(address: string): string {
  const slashIdx = address.indexOf('/')
  if (slashIdx !== -1) {
    return address.substring(0, slashIdx).trim()
  }
  return address.trim()
}

// GET /api/hv/liegenschaften
// Returns unique Liegenschaften derived from units, with doc counts
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

    // Load all units with their addresses
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, name, address')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    if (unitsError) throw unitsError

    // Derive unique Liegenschaften
    const liegenschaftMap = new Map<string, { address: string; unitCount: number; unitIds: string[] }>()

    for (const unit of units || []) {
      if (!unit.address) continue
      const lg = extractLiegenschaft(unit.address)
      if (!liegenschaftMap.has(lg)) {
        liegenschaftMap.set(lg, { address: lg, unitCount: 0, unitIds: [] })
      }
      const entry = liegenschaftMap.get(lg)!
      entry.unitCount++
      entry.unitIds.push(unit.id)
    }

    // Load existing versicherung docs (with liegenschaft field)
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, liegenschaft, created_at')
      .eq('organization_id', profile.organization_id)
      .eq('document_type', 'versicherung')
      .eq('is_deleted', false)
      .is('unit_id', null)

    const docsByLiegenschaft = new Map<string, { id: string; name: string; created_at: string }[]>()
    for (const doc of docs || []) {
      const key = doc.liegenschaft || '__unassigned__'
      if (!docsByLiegenschaft.has(key)) docsByLiegenschaft.set(key, [])
      docsByLiegenschaft.get(key)!.push(doc)
    }

    const liegenschaften = Array.from(liegenschaftMap.values()).map(lg => ({
      address: lg.address,
      unitCount: lg.unitCount,
      docs: docsByLiegenschaft.get(lg.address) || [],
    }))

    // Also return unassigned docs (liegenschaft = null / not matching any building)
    const unassigned = docsByLiegenschaft.get('__unassigned__') || []

    return NextResponse.json({ liegenschaften, unassigned })
  } catch (err) {
    console.error('Liegenschaften error:', err)
    return NextResponse.json({ error: 'Fehler beim Laden der Liegenschaften' }, { status: 500 })
  }
}
