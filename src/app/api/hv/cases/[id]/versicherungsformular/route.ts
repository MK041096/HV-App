import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/hv/cases/[id]/versicherungsformular
// Returns a printable HTML insurance claim form for this damage report
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Load case with all details
    const { data: caseData, error: caseError } = await supabase
      .from('damage_reports')
      .select(`
        id, case_number, title, description, category, subcategory, subcategories,
        urgency, room, rooms, damage_side, damage_since, status,
        created_at, access_notes, ki_analyse_result,
        unit:units(id, name, address, floor),
        reporter:profiles!reporter_id(first_name, last_name, phone)
      `)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    }

    // Load organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()

    const unit = (Array.isArray(caseData.unit) ? caseData.unit[0] : caseData.unit) as {
      id: string; name: string; address: string | null; floor: string | null
    } | null

    const reporter = (Array.isArray(caseData.reporter) ? caseData.reporter[0] : caseData.reporter) as {
      first_name: string | null; last_name: string | null; phone: string | null
    } | null

    // Derive Liegenschaft address from unit address
    const liegenschaft = unit?.address
      ? (unit.address.includes('/') ? unit.address.split('/')[0].trim() : unit.address.trim())
      : '—'

    // Load matching insurance policy name
    let insuranceName = '—'
    let insuranceLiegenschaft = '—'
    if (unit?.address) {
      const { data: insuranceDocs } = await supabase
        .from('documents')
        .select('name, liegenschaft')
        .eq('organization_id', profile.organization_id)
        .eq('document_type', 'versicherung')
        .eq('is_deleted', false)
        .is('unit_id', null)
        .limit(20)

      if (insuranceDocs && insuranceDocs.length > 0) {
        const matched = insuranceDocs.find(d => d.liegenschaft === liegenschaft)
          || insuranceDocs.find(d => !d.liegenschaft)
          || insuranceDocs[0]
        if (matched) {
          insuranceName = matched.name
          insuranceLiegenschaft = matched.liegenschaft || liegenschaft
        }
      }

      // Also check unit-level insurance
      if (unit?.id) {
        const { data: unitInsuranceDocs } = await supabase
          .from('documents')
          .select('name')
          .eq('organization_id', profile.organization_id)
          .eq('document_type', 'versicherung')
          .eq('unit_id', unit.id)
          .eq('is_deleted', false)
          .limit(5)
        if (unitInsuranceDocs && unitInsuranceDocs.length > 0) {
          insuranceName = unitInsuranceDocs.map(d => d.name).join(', ')
        }
      }
    }

    const categoryLabels: Record<string, string> = {
      wasserschaden: 'Wasserschaden', heizung: 'Heizung/Warmwasser', elektrik: 'Elektrik',
      fenster_tueren: 'Fenster/Türen', boeden_waende: 'Böden & Wände', schimmel: 'Schimmel',
      sanitaer: 'Sanitär', aussenbereich: 'Außenbereich', sonstiges: 'Sonstiges',
    }
    const damageSideLabels: Record<string, string> = {
      innen: 'Innenseite (Wohnung)', aussen: 'Außenseite (Gebäude)', beides: 'Innen- und Außenseite',
    }

    const today = new Date().toLocaleDateString('de-AT')
    const caseDate = new Date(caseData.created_at).toLocaleDateString('de-AT')
    const damageSince = caseData.damage_since
      ? new Date(caseData.damage_since).toLocaleDateString('de-AT')
      : '—'

    const subcategoriesList = (caseData.subcategories as string[] || []).join(', ') || caseData.subcategory || '—'
    const roomsList = (caseData.rooms as string[] || []).join(', ') || caseData.room || '—'

    const reporterName = reporter
      ? [reporter.first_name, reporter.last_name].filter(Boolean).join(' ')
      : '—'

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Schadensanzeige ${caseData.case_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #111; background: #fff; padding: 20mm; }
    h1 { font-size: 18pt; font-weight: bold; margin-bottom: 4px; }
    h2 { font-size: 13pt; font-weight: bold; margin: 20px 0 8px; border-bottom: 2px solid #222; padding-bottom: 4px; }
    h3 { font-size: 11pt; font-weight: bold; margin: 14px 0 6px; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #000; }
    .header-left h1 { font-size: 20pt; }
    .header-right { text-align: right; font-size: 10pt; color: #555; }
    .badge { display: inline-block; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 8px; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    td { padding: 6px 10px; border: 1px solid #ddd; vertical-align: top; }
    td:first-child { font-weight: bold; width: 35%; background: #f9fafb; }
    .section { margin-bottom: 20px; }
    .ki-box { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 12px 14px; margin-top: 8px; font-size: 10pt; white-space: pre-wrap; line-height: 1.5; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
    .signature-line { border-top: 1px solid #333; padding-top: 4px; font-size: 9pt; color: #555; margin-top: 40px; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 9pt; color: #888; text-align: center; }
    .urgency-notfall { color: #dc2626; font-weight: bold; }
    .urgency-dringend { color: #d97706; font-weight: bold; }
    .urgency-normal { color: #16a34a; }
    @media print {
      body { padding: 10mm; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>Schadensanzeige</h1>
    <p style="font-size:10pt;color:#555;margin-top:4px;">an die Versicherung</p>
  </div>
  <div class="header-right">
    <p><strong>${org?.name || 'Hausverwaltung'}</strong></p>
    <p>Datum: ${today}</p>
    <p>Fallnummer: <strong>${caseData.case_number}</strong></p>
  </div>
</div>

<div class="section">
  <h2>1. Versicherungsangaben</h2>
  <table>
    <tr><td>Versicherungspolice</td><td>${insuranceName}</td></tr>
    <tr><td>Liegenschaft</td><td>${insuranceLiegenschaft}</td></tr>
    <tr><td>Versicherungsnehmer</td><td>${org?.name || '—'}</td></tr>
  </table>
</div>

<div class="section">
  <h2>2. Schadensort</h2>
  <table>
    <tr><td>Liegenschaft / Gebäude</td><td>${liegenschaft}</td></tr>
    <tr><td>Wohneinheit</td><td>${unit?.name || '—'}</td></tr>
    <tr><td>Adresse</td><td>${unit?.address || '—'}</td></tr>
    <tr><td>Stockwerk</td><td>${unit?.floor || '—'}</td></tr>
    <tr><td>Schadensbereich</td><td>${damageSideLabels[caseData.damage_side as string] || '—'}</td></tr>
    <tr><td>Betroffene Räume</td><td>${roomsList}</td></tr>
  </table>
</div>

<div class="section">
  <h2>3. Schadensangaben</h2>
  <table>
    <tr><td>Schadensart / Kategorie</td><td>${categoryLabels[caseData.category] || caseData.category}</td></tr>
    <tr><td>Unterkategorie / Details</td><td>${subcategoriesList}</td></tr>
    <tr><td>Schaden bekannt seit</td><td>${damageSince}</td></tr>
    <tr><td>Schadensmeldung eingegangen</td><td>${caseDate}</td></tr>
    <tr><td>Dringlichkeit</td><td class="urgency-${caseData.urgency}">${caseData.urgency === 'notfall' ? 'NOTFALL (sofort)' : caseData.urgency === 'dringend' ? 'Dringend (innerhalb 48h)' : 'Normal'}</td></tr>
    <tr><td>Schadensbeschreibung</td><td>${caseData.description || '—'}</td></tr>
    ${caseData.access_notes ? `<tr><td>Zugangshinweise</td><td>${caseData.access_notes}</td></tr>` : ''}
  </table>
</div>

<div class="section">
  <h2>4. Meldender Mieter</h2>
  <table>
    <tr><td>Name</td><td>${reporterName}</td></tr>
    <tr><td>Telefon</td><td>${reporter?.phone || '—'}</td></tr>
  </table>
</div>

${caseData.ki_analyse_result ? `
<div class="section">
  <h2>5. Systemseitige Einschätzung</h2>
  <p style="font-size:9pt;color:#666;margin-bottom:6px;">Automatische Analyse (kein Rechtsanspruch — zur Orientierung)</p>
  <div class="ki-box">${caseData.ki_analyse_result}</div>
</div>
` : ''}

<div class="section">
  <h2>${caseData.ki_analyse_result ? '6' : '5'}. Unterschriften</h2>
  <div class="signature-grid">
    <div>
      <div class="signature-line">Datum, Ort</div>
    </div>
    <div>
      <div class="signature-line">Unterschrift Hausverwaltung</div>
    </div>
  </div>
  <div style="margin-top:24px;">
    <p style="font-size:10pt;font-weight:bold;margin-bottom:8px;">Schadensbeschreibung / Bemerkungen (handschriftlich):</p>
    <div style="border:1px solid #ccc;height:80px;border-radius:4px;"></div>
  </div>
</div>

<div class="footer">
  Erstellt am ${today} · Fallnummer ${caseData.case_number} · ${org?.name || 'Hausverwaltung'} · Dieses Formular wurde automatisch aus SchadensMelder generiert.
</div>

</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Schadensanzeige-${caseData.case_number}.html"`,
      },
    })
  } catch (err) {
    console.error('Versicherungsformular error:', err)
    return NextResponse.json({ error: 'Fehler beim Generieren des Formulars' }, { status: 500 })
  }
}
