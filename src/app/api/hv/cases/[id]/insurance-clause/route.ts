import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { extractLiegenschaftFromAddress } from '@/lib/liegenschaft'

// Liefert: signed URL der Versicherungs-PDF + die von CARL identifizierte Klausel
// Tenant-isoliert: prüft Auth + organization_id + Role
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // 1. Case + Unit-Adresse + KI-Analyse-Text laden
    const { data: report } = await adminClient
      .from('damage_reports')
      .select('id, unit_id, ki_analyse_result, units(address)')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    if (!report.ki_analyse_result) {
      return NextResponse.json({ error: 'Noch keine CARL-Analyse vorhanden' }, { status: 400 })
    }

    // 2. Aus dem Analyse-Text Police-Name + Klausel parsen
    const get = (key: string) => report.ki_analyse_result.match(new RegExp('^' + key + ':\\s*(.+)', 'mi'))?.[1]?.trim() ?? null
    const policyName = get('VERSICHERUNG')
    const clauseRaw = get('VERSICHERUNG_KLAUSEL')

    if (!policyName || policyName.toLowerCase().startsWith('keine') || policyName.toLowerCase().startsWith('prüfen') || policyName.toLowerCase().startsWith('pruefen')) {
      return NextResponse.json({ error: 'Keine greifende Versicherung in der CARL-Analyse' }, { status: 404 })
    }

    const clause = clauseRaw && clauseRaw !== 'NICHT_VERFUEGBAR' ? clauseRaw : null

    // 3. Police-Dokument finden — anhand Name + Liegenschaft/Unit
    const unitAddress = (report.units as any)?.address as string | undefined
    const liegenschaft = unitAddress ? extractLiegenschaftFromAddress(unitAddress) : null

    let policyDoc: { id: string; name: string; file_path: string } | null = null

    // 3a. Erst auf Einheits-Ebene suchen
    if (report.unit_id) {
      const { data } = await adminClient
        .from('documents')
        .select('id, name, file_path')
        .eq('organization_id', profile.organization_id)
        .eq('document_type', 'versicherung')
        .eq('unit_id', report.unit_id)
        .eq('is_deleted', false)
        .ilike('name', `%${policyName}%`)
        .limit(1)
        .maybeSingle()
      if (data) policyDoc = data
    }

    // 3b. Dann auf Liegenschafts-Ebene
    if (!policyDoc && liegenschaft) {
      const { data } = await adminClient
        .from('documents')
        .select('id, name, file_path')
        .eq('organization_id', profile.organization_id)
        .eq('document_type', 'versicherung')
        .eq('liegenschaft', liegenschaft)
        .is('unit_id', null)
        .eq('is_deleted', false)
        .ilike('name', `%${policyName}%`)
        .limit(1)
        .maybeSingle()
      if (data) policyDoc = data
    }

    // 3c. Fallback: alle Policen der Org per fuzzy match
    if (!policyDoc) {
      const { data } = await adminClient
        .from('documents')
        .select('id, name, file_path, unit_id, liegenschaft')
        .eq('organization_id', profile.organization_id)
        .eq('document_type', 'versicherung')
        .eq('is_deleted', false)
        .ilike('name', `%${policyName}%`)
        .limit(1)
        .maybeSingle()
      if (data) policyDoc = data
    }

    if (!policyDoc) {
      return NextResponse.json({ error: `Police "${policyName}" nicht gefunden` }, { status: 404 })
    }

    // 4. Signed URL erstellen (5 Min gültig)
    const { data: signed, error: signErr } = await adminClient.storage
      .from('documents')
      .createSignedUrl(policyDoc.file_path, 300)

    if (signErr || !signed?.signedUrl) {
      console.error('Signed URL Fehler:', signErr)
      return NextResponse.json({ error: 'Fehler beim Laden der Police-PDF' }, { status: 500 })
    }

    return NextResponse.json({
      name: policyDoc.name,
      pdfUrl: signed.signedUrl,
      clause,
    })
  } catch (err) {
    console.error('Insurance-clause Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
