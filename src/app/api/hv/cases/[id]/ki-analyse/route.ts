import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Legal knowledge indexed by country code
const LEGAL_AT = [
  '## Oesterreichisches Mietrecht (MRG/ABGB)',
  '',
  '**VERMIETER (§ 3 MRG):** Dach, Fassade, tragende Waende, Stiegenhaus, Keller,',
  'Aussenfenster (Aussenbereich), Aussentueren, Zentralheizung, Warmwasser,',
  'Gas-/Wasser-/Stromleitungen in Waenden, Aufzug.',
  '',
  '**MIETER (§ 8 MRG):** Schonendes Behandeln. Vom Mieter verursachte Schaeden = MIETER haftet.',
  '',
  '**Kleinreparaturklausel (§ 1096 ABGB):** Vertraglich oft 75-150 EUR: Steckdosen,',
  'Lichtschalter, Tuergriffe, Armaturen, Tuerdichtungen = MIETER.',
  'Aussenfenster, Heizung, Rohre in Wand = immer VERMIETER.',
  '',
  '**Mietminderung (§ 1096 ABGB):** Bei erheblicher Beeintraechtigung moeglich.',
  '',
  '**Schadensersatz (§ 1111 ABGB):** Mieter haftet fuer Schaeden ueber normale Abnutzung.',
  '',
  '**Allgemeine Teile:** Stiegenhaus, Dach, Fassade, Keller, Lift, Aussenanlagen = immer VERMIETER.',
  '',
  '**Versicherung (AT):** Gebaeudeversicherung = Vermietersache (Sturm, Leitungswasser, Feuer, Hagel).',
  'Haushaltsversicherung = Mietersache (eigene Einrichtung + durch Mieter verursachte Schaeden).',
].join('\n')

const LEGAL_DE = [
  '## Deutsches Mietrecht (BGB)',
  '',
  '**VERMIETER (§ 535 BGB):** Mietsache in gebrauchstauglichem Zustand erhalten.',
  'Dach, Fassade, Treppenhaus, Heizungsanlage, Aufzug, Rohre in Waenden = VERMIETER.',
  '',
  '**MIETER Kleinreparaturklausel (BGH):** Bis ca. 100-150 EUR pro Reparatur, max. 6-8% Jahresmiete.',
  'Armaturen, Lichtschalter, Steckdosen, Tuerklinken, Fenstergriffe = MIETER.',
  'Aussenbereich, Heizung, Rohre = immer VERMIETER.',
  '',
  '**Minderungsrecht (§ 536 BGB):** Bei Maengeln Mietzinsreduktion moeglich.',
  '',
  '**Normale Abnutzung (§ 538 BGB):** Traegt Vermieter.',
  '',
  '**Schadensersatz (§ 280 + § 241 BGB):** Mieter haftet fuer schuldhaft verursachte Schaeden.',
  '',
  '**Versicherung (DE):** Gebaeudeversicherung = Vermietersache.',
  'Hausrat + Haftpflicht = Mietersache.',
].join('\n')

const LEGAL_CH = [
  '## Schweizer Mietrecht (OR)',
  '',
  '**VERMIETER (Art. 256 OR):** Mietsache in vereinbartem Zustand erhalten.',
  '',
  '**MIETER (Art. 257f OR):** Sorgfaeltiger Gebrauch. Kleine Unterhaltsarbeiten (Art. 259 OR) = MIETER.',
  '',
  '**Mietminderung (Art. 259a OR):** Bei Maengeln Mietzinsreduktion moeglich.',
  '',
  '**Haftung Rueckgabe (Art. 267a OR):** Mieter haftet fuer von ihm zu vertretende Maengel.',
].join('\n')

const LEGAL_KNOWLEDGE: Record<string, string> = { AT: LEGAL_AT, DE: LEGAL_DE, CH: LEGAL_CH }

export async function POST(
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

    // Load org country for legal framework selection
    const { data: orgData } = await supabase
      .from('organizations')
      .select('country')
      .eq('id', profile.organization_id)
      .single()
    const country = (orgData?.country as string) || 'AT'
    const legalKnowledge = LEGAL_KNOWLEDGE[country] || LEGAL_AT
    const countryLabelMap: Record<string, string> = { AT: 'oesterreichische', DE: 'deutsche', CH: 'schweizerische' }
    const countryLabel = countryLabelMap[country] || 'oesterreichische'

    // Load case with unit info
    const { data: caseData, error: caseError } = await supabase
      .from('damage_reports')
      .select('id, title, description, category, subcategory, urgency, room, unit:units(id, name, address)')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    }

    const unit = (Array.isArray(caseData.unit) ? caseData.unit[0] : caseData.unit) as { id: string; name: string; address: string | null } | null

    // Load Mietvertrag for this unit
    let leaseContent: string | null = null
    let leaseFound = false

    if (unit?.id) {
      const { data: docs } = await supabase
        .from('documents')
        .select('id, name, file_path, mime_type')
        .eq('organization_id', profile.organization_id)
        .eq('unit_id', unit.id)
        .eq('document_type', 'mietvertrag')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)

      if (docs && docs.length > 0) {
        const doc = docs[0]
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(doc.file_path)

        if (!downloadError && fileData) {
          leaseFound = true
          if (doc.mime_type === 'application/pdf') {
            const arrayBuffer = await fileData.arrayBuffer()
            leaseContent = Buffer.from(arrayBuffer).toString('base64')
          } else {
            leaseContent = await fileData.text()
          }
        }
      }
    }

    // Load Versicherungspolice: match by Liegenschaft (address before "/"), fallback to unassigned
    let insuranceContent: string | null = null
    let insuranceFound = false

    // Derive Liegenschaft from unit address (e.g. "Schönbrunnerstraße 42/Top 1" → "Schönbrunnerstraße 42")
    const liegenschaft = unit?.address
      ? (unit.address.includes('/') ? unit.address.split('/')[0].trim() : unit.address.trim())
      : null

    let insuranceQuery = supabase
      .from('documents')
      .select('id, name, file_path, mime_type, liegenschaft')
      .eq('organization_id', profile.organization_id)
      .eq('document_type', 'versicherung')
      .eq('is_deleted', false)
      .is('unit_id', null)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: allInsuranceDocs } = await insuranceQuery

    // Prefer a doc matching the exact Liegenschaft; fall back to docs without liegenschaft set
    let chosenInsuranceDoc: { id: string; name: string; file_path: string; mime_type: string } | null = null
    if (allInsuranceDocs && allInsuranceDocs.length > 0) {
      if (liegenschaft) {
        chosenInsuranceDoc = allInsuranceDocs.find(d => d.liegenschaft === liegenschaft) || null
      }
      if (!chosenInsuranceDoc) {
        // Fallback: use a doc without an assigned Liegenschaft
        chosenInsuranceDoc = allInsuranceDocs.find(d => !d.liegenschaft) || allInsuranceDocs[0]
      }
    }

    if (chosenInsuranceDoc) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(chosenInsuranceDoc.file_path)

      if (!downloadError && fileData) {
        insuranceFound = true
        if (chosenInsuranceDoc.mime_type === 'application/pdf') {
          const arrayBuffer = await fileData.arrayBuffer()
          insuranceContent = Buffer.from(arrayBuffer).toString('base64')
        } else {
          insuranceContent = await fileData.text()
        }
      }
    }

    // Load unit-level insurance (e.g. Maschinenversicherung for built-in appliances)
    let unitInsuranceContent: string | null = null
    let unitInsuranceFound = false

    if (unit?.id) {
      const { data: unitInsuranceDocs } = await supabase
        .from('documents')
        .select('id, name, file_path, mime_type')
        .eq('organization_id', profile.organization_id)
        .eq('unit_id', unit.id)
        .eq('document_type', 'versicherung')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)

      if (unitInsuranceDocs && unitInsuranceDocs.length > 0) {
        const doc = unitInsuranceDocs[0]
        const { data: fileData, error: dlErr } = await supabase.storage
          .from('documents')
          .download(doc.file_path)

        if (!dlErr && fileData) {
          unitInsuranceFound = true
          if (doc.mime_type === 'application/pdf') {
            const arrayBuffer = await fileData.arrayBuffer()
            unitInsuranceContent = Buffer.from(arrayBuffer).toString('base64')
          } else {
            unitInsuranceContent = await fileData.text()
          }
        }
      }
    }

    // Load contractors so CARL can recommend the right one
    const { data: contractors } = await supabase
      .from('contractors')
      .select('id, name, notes')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('name')

    const contractorList = contractors && contractors.length > 0
      ? contractors.map((ct, i) => {
          const lines = (ct.notes || '').split('\n')
          const taetigkeit = lines[0] || ''
          const beschreibung = lines.slice(1).join(' ').trim()
          return `${i + 1}. ${ct.name} — ${taetigkeit}${beschreibung ? ' | ' + beschreibung : ''}`
        }).join('\n')
      : null

    // Build damage info text
    const categoryLabels: Record<string, string> = {
      wasserschaden: 'Wasserschaden', heizung: 'Heizung/Warmwasser', elektrik: 'Elektrik',
      fenster_tueren: 'Fenster/Tueren', boeden_waende: 'Boeden & Waende', schimmel: 'Schimmel',
      sanitaer: 'Sanitaer', aussenbereich: 'Aussenbereich', sonstiges: 'Sonstiges',
    }
    const urgencyLabels: Record<string, string> = {
      notfall: 'Notfall (sofort)', dringend: 'Dringend (innerhalb 48h)', normal: 'Normal',
    }

    const damageInfo = [
      `Titel: ${caseData.title}`,
      `Kategorie: ${categoryLabels[caseData.category] || caseData.category}`,
      caseData.subcategory ? `Unterkategorie: ${caseData.subcategory}` : null,
      `Dringlichkeit: ${urgencyLabels[caseData.urgency] || caseData.urgency}`,
      caseData.room ? `Raum: ${caseData.room}` : null,
      caseData.description ? `Beschreibung des Mieters: ${caseData.description}` : null,
      unit ? `Wohneinheit: ${unit.name}${unit.address ? `, ${unit.address}` : ''}` : null,
    ].filter(Boolean).join('\n')

    const werkstattHinweis = contractorList
      ? `\n\nVERFÜGBARE WERKSTÄTTEN (wähle genau eine):\n${contractorList}`
      : ''

    const systemPrompt = `Du bist ein Experte für das ${countryLabel} Mietrecht und Immobilienverwaltung.

${legalKnowledge}

---

Antworte IMMER exakt in diesem Format — keine Abweichungen:

ZUSTÄNDIGKEIT: [VERMIETER / MIETER / UNKLAR]
RECHTSGRUNDLAGE: [Paragraph + 1 Satz Erklärung]
VERSICHERUNG: [Versicherungsart + Police wenn erkennbar / Keine]
EMPFEHLUNG: [Konkreter nächster Schritt, max. 1 Satz]
DRINGLICHKEIT: [Notfall / Dringend / Normal]

ERKLÄRUNG:
[2-3 Sätze in formellem Ton — direkt weiterleitbar an Mieter, Versicherung oder Werkstatt. Nennt den Schadenstyp, die Zuständigkeit und den nächsten Schritt.]

WICHTIG zur DRINGLICHKEIT:
- Notfall: Akute Gefahr oder aktiver Wasseraustritt, Stromausfall mit Brandgefahr → sofort
- Dringend: Eingeschränkte Nutzbarkeit (Heizung, Toilette, kein Warmwasser) → 48h
- Normal: Kein akuter Schaden → 2 Wochen
Ignoriere wie der Mieter die Dringlichkeit selbst beschreibt.${contractorList ? '\n\nPunkt WERKSTATT (zusätzlich nach ERKLÄRUNG):\nWERKSTATT: [exakter Firmenname aus der Liste]' : ''}${werkstattHinweis}`

    // Load photos for this damage report (max 5)
    const photoBlocks: Anthropic.ImageBlockParam[] = []
    const { data: reportPhotos } = await supabase
      .from('damage_report_photos')
      .select('id, storage_path, mime_type')
      .eq('damage_report_id', id)
      .eq('organization_id', profile.organization_id)
      .order('sort_order', { ascending: true })
      .limit(5)

    if (reportPhotos && reportPhotos.length > 0) {
      for (const photo of reportPhotos) {
        try {
          const { data: fileData } = await supabase.storage
            .from('damage-photos')
            .download(photo.storage_path)
          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            const mediaType = (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(photo.mime_type)
              ? photo.mime_type
              : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
            photoBlocks.push({
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            })
          }
        } catch {
          // Skip photos that can't be loaded
        }
      }
    }

    type ContentBlock = Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam | Anthropic.TextBlockParam
    const userContentBlocks: ContentBlock[] = []

    if (leaseFound && leaseContent) {
      userContentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: leaseContent },
        title: 'Mietvertrag',
      } as Anthropic.DocumentBlockParam)
    }

    if (insuranceFound && insuranceContent) {
      userContentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: insuranceContent },
        title: 'Liegenschafts-Versicherungspolice',
      } as Anthropic.DocumentBlockParam)
    }

    if (unitInsuranceFound && unitInsuranceContent) {
      userContentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: unitInsuranceContent },
        title: 'Einheits-Versicherungspolice',
      } as Anthropic.DocumentBlockParam)
    }

    // Add photo blocks after documents
    userContentBlocks.push(...photoBlocks)

    const contextInfo = [
      leaseFound ? 'Mietvertrag: vorhanden und analysiert' : 'Mietvertrag: NICHT hinterlegt (Analyse nur nach Gesetz)',
      insuranceFound ? 'Liegenschafts-Versicherungspolice: vorhanden und analysiert' : 'Liegenschafts-Versicherungspolice: NICHT hinterlegt',
      unitInsuranceFound ? 'Einheits-Versicherungspolice: vorhanden und analysiert' : null,
      photoBlocks.length > 0 ? `Fotos: ${photoBlocks.length} Foto(s) beigefügt und analysiert` : 'Fotos: keine vorhanden',
    ].filter(Boolean).join('\n')

    userContentBlocks.push({
      type: 'text',
      text: `Analysiere folgende Schadensmeldung.\n\nDokumentenstatus:\n${contextInfo}\n\nSchadensmeldung:\n${damageInfo}\n\nBeantworte die 4 Punkte.`,
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContentBlocks }],
    })

    const analysisText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n')

    // Dringlichkeit aus CARL-Analyse ableiten und in DB setzen
    // Parse CARL's workshop recommendation
    let recommendedContractorId: string | null = null
    let recommendedContractorName: string | null = null
    if (contractors && contractors.length > 0) {
      const werkstattMatch = analysisText.match(/WERKSTATT:\s*(.+)/i)
      if (werkstattMatch) {
        const named = werkstattMatch[1].trim().replace(/[*_.]/g, '')
        const found = contractors.find(ct =>
          named.toLowerCase().includes(ct.name.toLowerCase()) ||
          ct.name.toLowerCase().includes(named.toLowerCase())
        )
        if (found) {
          recommendedContractorId = found.id
          recommendedContractorName = found.name
        }
      }
    }

    const analysisLower = analysisText.toLowerCase()
    let detectedUrgency: string | null = null
    if (
      analysisLower.includes('notfall') ||
      analysisLower.includes('sofort') ||
      analysisLower.includes('brandgefahr') ||
      analysisLower.includes('stromschlag') ||
      analysisLower.includes('gasgefahr') ||
      analysisLower.includes('unmittelbare gefahr') ||
      analysisLower.includes('sofortiges handeln')
    ) {
      detectedUrgency = 'notfall'
    } else if (
      analysisLower.includes('dringend') ||
      analysisLower.includes('innerhalb 24') ||
      analysisLower.includes('innerhalb 48') ||
      analysisLower.includes('zeitnah')
    ) {
      detectedUrgency = 'dringend'
    }

    const updatePayload: Record<string, string> = {
      ki_analyse_result: analysisText,
      ki_analyse_at: new Date().toISOString(),
    }
    if (detectedUrgency && detectedUrgency !== caseData.urgency) {
      updatePayload.urgency = detectedUrgency
    }

    await supabase
      .from('damage_reports')
      .update(updatePayload)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    return NextResponse.json({
      result: analysisText,
      lease_found: leaseFound,
      insurance_found: insuranceFound || unitInsuranceFound,
      unit_insurance_found: unitInsuranceFound,
      photo_count: photoBlocks.length,
      unit_name: unit?.name || null,
      country,
    })
  } catch (err) {
    console.error('KI-Analyse error:', err)
    return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen' }, { status: 500 })
  }
}
