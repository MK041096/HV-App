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

    const systemPrompt = [
      `Du bist ein Experte fuer das ${countryLabel} Mietrecht und Immobilienverwaltung.`,
      '',
      legalKnowledge,
      '',
      '---',
      '',
      'DEINE AUFGABE: Beantworte diese 4 Punkte strukturiert:',
      '',
      '1. **Zustaendigkeit**: VERMIETER / MIETER / UNKLAR (mit Begruendung)',
      '2. **Rechtsgrundlage**: Welcher Paragraph oder welche Vertragsklausel?',
      '3. **Versicherungsrelevanz**: Welche Versicherung ist zustaendig? (Gebaeudeversicherung HV / Haushaltsversicherung Mieter / keine)',
      '4. **Empfehlung**: Konkreter naechster Schritt fuer die Hausverwaltung.',
      '',
      'Antworte auf Deutsch, klar strukturiert, max. 300 Woerter.',
    ].join('\n')

    type ContentBlock = Anthropic.DocumentBlockParam | Anthropic.TextBlockParam
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
        title: 'Versicherungspolice',
      } as Anthropic.DocumentBlockParam)
    }

    const contextInfo = [
      leaseFound ? 'Mietvertrag: vorhanden und analysiert' : 'Mietvertrag: NICHT hinterlegt (Analyse nur nach Gesetz)',
      insuranceFound ? 'Versicherungspolice: vorhanden und analysiert' : 'Versicherungspolice: NICHT hinterlegt',
    ].join('\n')

    userContentBlocks.push({
      type: 'text',
      text: `Analysiere folgende Schadensmeldung.\n\nDokumentenstatus:\n${contextInfo}\n\nSchadensmeldung:\n${damageInfo}\n\nBeantworte die 4 Punkte.`,
    })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContentBlocks }],
    })

    const analysisText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n')

    await supabase
      .from('damage_reports')
      .update({ ki_analyse_result: analysisText, ki_analyse_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    return NextResponse.json({
      result: analysisText,
      lease_found: leaseFound,
      insurance_found: insuranceFound,
      unit_name: unit?.name || null,
      country,
    })
  } catch (err) {
    console.error('KI-Analyse error:', err)
    return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen' }, { status: 500 })
  }
}
