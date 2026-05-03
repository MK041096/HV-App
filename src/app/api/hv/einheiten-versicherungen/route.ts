import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { extractLiegenschaftFromAddress } from '@/lib/liegenschaft'

interface DocOut {
  id: string
  name: string
  scope: 'liegenschaft' | 'einheit'
  liegenschaft: string | null
  created_at: string
}

// GET /api/hv/einheiten-versicherungen
// Liefert alle Einheiten mit ALLEN für sie greifenden Versicherungspolicen
// (sowohl direkt der Einheit zugewiesene als auch von der Liegenschaft geerbte).
// Single Source of Truth: HV sieht pro Einheit was sie schützt.
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

    // Alle Einheiten laden
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, name, address')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .order('name')

    if (unitsError) throw unitsError

    // ALLE Versicherungs-Dokumente laden (Liegenschafts + Einheits)
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, name, unit_id, liegenschaft, created_at')
      .eq('organization_id', profile.organization_id)
      .eq('document_type', 'versicherung')
      .eq('is_deleted', false)

    // Index 1: Einheits-spezifische Policen pro unit_id
    const unitDocsById = new Map<string, DocOut[]>()
    // Index 2: Liegenschafts-Policen pro Liegenschafts-Adresse (normalisiert)
    const lgDocsByAddr = new Map<string, DocOut[]>()

    for (const doc of allDocs || []) {
      if (doc.unit_id) {
        const arr = unitDocsById.get(doc.unit_id) || []
        arr.push({
          id: doc.id,
          name: doc.name,
          scope: 'einheit',
          liegenschaft: null,
          created_at: doc.created_at,
        })
        unitDocsById.set(doc.unit_id, arr)
      } else if (doc.liegenschaft) {
        const arr = lgDocsByAddr.get(doc.liegenschaft) || []
        arr.push({
          id: doc.id,
          name: doc.name,
          scope: 'liegenschaft',
          liegenschaft: doc.liegenschaft,
          created_at: doc.created_at,
        })
        lgDocsByAddr.set(doc.liegenschaft, arr)
      }
    }

    // Pro Einheit: alle relevanten Policen sammeln
    const einheiten = (units || []).map(unit => {
      const unitLg = unit.address ? extractLiegenschaftFromAddress(unit.address) : null
      const inherited = unitLg ? (lgDocsByAddr.get(unitLg) || []) : []
      const direct = unitDocsById.get(unit.id) || []
      const docs = [...inherited, ...direct].sort((a, b) =>
        // Liegenschaft zuerst, dann Einheit; innerhalb nach Datum
        a.scope !== b.scope
          ? (a.scope === 'liegenschaft' ? -1 : 1)
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      return {
        id: unit.id,
        name: unit.name,
        address: unit.address,
        liegenschaft: unitLg,
        docs,
        inheritedCount: inherited.length,
        directCount: direct.length,
      }
    })

    return NextResponse.json({ einheiten })
  } catch (err) {
    console.error('Einheiten-Versicherungen error:', err)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
