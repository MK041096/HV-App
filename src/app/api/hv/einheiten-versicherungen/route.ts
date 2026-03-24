import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/hv/einheiten-versicherungen
// Returns all units with their unit-level insurance documents
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

    // Load all units
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, name, address')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .order('name')

    if (unitsError) throw unitsError

    // Load all unit-level insurance docs (unit_id IS NOT NULL)
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, unit_id, created_at')
      .eq('organization_id', profile.organization_id)
      .eq('document_type', 'versicherung')
      .eq('is_deleted', false)
      .not('unit_id', 'is', null)

    const docsByUnit = new Map<string, { id: string; name: string; created_at: string }[]>()
    for (const doc of docs || []) {
      if (!doc.unit_id) continue
      if (!docsByUnit.has(doc.unit_id)) docsByUnit.set(doc.unit_id, [])
      docsByUnit.get(doc.unit_id)!.push(doc)
    }

    const einheiten = (units || []).map(unit => ({
      id: unit.id,
      name: unit.name,
      address: unit.address,
      docs: docsByUnit.get(unit.id) || [],
    }))

    return NextResponse.json({ einheiten })
  } catch (err) {
    console.error('Einheiten-Versicherungen error:', err)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
