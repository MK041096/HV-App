import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

    // Load the case with unit info
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

    // Find the Mietvertrag for this unit
    const unit = (Array.isArray(caseData.unit) ? caseData.unit[0] : caseData.unit) as { id: string; name: string; address: string | null } | null
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

    const categoryLabels: Record<string, string> = {
      wasserschaden: 'Wasserschaden', heizung: 'Heizung/Warmwasser', elektrik: 'Elektrik',
      fenster_tueren: 'Fenster/Türen', boeden_waende: 'Böden & Wände', schimmel: 'Schimmel',
      sanitaer: 'Sanitär', aussenbereich: 'Außenbereich', sonstiges: 'Sonstiges',
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

    let messages: Anthropic.MessageParam[]

    if (leaseFound && leaseContent) {
      messages = [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: leaseContent },
          } as Anthropic.DocumentBlockParam,
          {
            type: 'text',
            text: `Du bist ein Experte für österreichisches Mietrecht (MRG) und Wohnrecht.

Analysiere die folgende Schadensmeldung anhand des beigefügten Mietvertrags.

**Schadensmeldung:**
${damageInfo}

Beantworte folgende Fragen klar und präzise:
1. **Verantwortlichkeit**: Ist der Schaden durch den Mieter oder den Vermieter/die Hausverwaltung zu beheben? Gibt es relevante Klauseln im Mietvertrag?
2. **Vertragliche Grundlage**: Was sagt der Mietvertrag konkret dazu? Zitiere relevante Stellen wenn möglich.
3. **Gesetzliche Lage**: Was sagt das österreichische MRG (Mietrechtsgesetz) dazu?
4. **Empfehlung**: Was sollte die Hausverwaltung als nächsten Schritt tun?

Antworte auf Deutsch, klar strukturiert, ohne unnötige Fachbegriffe.`,
          },
        ],
      }]
    } else {
      messages = [{
        role: 'user',
        content: `Du bist ein Experte für österreichisches Mietrecht (MRG) und Wohnrecht.

Analysiere die folgende Schadensmeldung. Kein Mietvertrag für diese Einheit hinterlegt.

**Schadensmeldung:**
${damageInfo}

Beantworte folgende Fragen:
1. **Verantwortlichkeit**: Ist dieser Schaden typischerweise durch den Mieter oder den Vermieter/die Hausverwaltung zu beheben?
2. **Gesetzliche Lage**: Was sagt das österreichische MRG (§ 3, § 8) zu diesem Schadenstyp?
3. **Empfehlung**: Was sollte die Hausverwaltung als nächsten Schritt tun?

Hinweis: Kein Mietvertrag hinterlegt — Analyse basiert nur auf österreichischem Mietrecht.

Antworte auf Deutsch, klar strukturiert.`,
      }]
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages,
    })

    const analysisText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n')

    // Save result to damage_reports
    await supabase
      .from('damage_reports')
      .update({ ki_analyse_result: analysisText, ki_analyse_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    return NextResponse.json({ result: analysisText, lease_found: leaseFound, unit_name: unit?.name || null })
  } catch (err) {
    console.error('KI-Analyse error:', err)
    return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen' }, { status: 500 })
  }
}
