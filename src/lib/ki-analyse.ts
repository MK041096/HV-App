import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORY_LABELS: Record<string, string> = {
  wasser: 'Wasserschaden', heizung: 'Heizung/Warmwasser', elektrik: 'Elektrik',
  fenster_tueren: 'Fenster/Türen', boeden: 'Böden', schimmel: 'Schimmel',
  sanitaer: 'Sanitär', sonstiges: 'Sonstiges',
}
const URGENCY_LABELS: Record<string, string> = {
  notfall: 'Notfall (sofort)', dringend: 'Dringend (innerhalb 48h)', normal: 'Normal',
}

export interface KiAnalyseResult {
  analysisText: string
  leaseFound: boolean
}

export async function runKiAnalyse(params: {
  supabase: SupabaseClient
  organizationId: string
  reportId: string
  title: string
  description: string | null
  category: string
  subcategory: string | null
  urgency: string
  room: string | null
  unitId: string | null
  unitName: string | null
  unitAddress: string | null
}): Promise<KiAnalyseResult> {
  const {
    supabase, organizationId, reportId,
    title, description, category, subcategory, urgency, room,
    unitId, unitName, unitAddress,
  } = params

  let leaseContent: string | null = null
  let leaseFound = false

  // Try to find Mietvertrag for this unit
  if (unitId) {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, file_path, mime_type')
      .eq('organization_id', organizationId)
      .eq('unit_id', unitId)
      .eq('document_type', 'mietvertrag')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (docs && docs.length > 0) {
      const doc = docs[0]
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.file_path)

      if (!downloadError && fileData && doc.mime_type === 'application/pdf') {
        const arrayBuffer = await fileData.arrayBuffer()
        leaseContent = Buffer.from(arrayBuffer).toString('base64')
        leaseFound = true
      }
    }
  }

  const damageInfo = [
    `Titel: ${title}`,
    `Kategorie: ${CATEGORY_LABELS[category] || category}`,
    subcategory ? `Unterkategorie: ${subcategory}` : null,
    `Dringlichkeit: ${URGENCY_LABELS[urgency] || urgency}`,
    room ? `Raum: ${room}` : null,
    description ? `Beschreibung: ${description}` : null,
    unitName ? `Wohneinheit: ${unitName}${unitAddress ? `, ${unitAddress}` : ''}` : null,
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
          text: `Du bist ein Experte für österreichisches Mietrecht (MRG).

Analysiere diese Schadensmeldung anhand des Mietvertrags. Antworte IMMER in diesem Format:

**VERANTWORTLICH:** [Mieter / Hausverwaltung / Unklar]
**BEGRÜNDUNG:** [1-2 Sätze, was der Mietvertrag oder das MRG sagt, mit Seitenzahl wenn möglich]
**EMPFEHLUNG:** [Konkreter nächster Schritt für die Hausverwaltung]

Schadensmeldung:
${damageInfo}`,
        },
      ],
    }]
  } else {
    messages = [{
      role: 'user',
      content: `Du bist ein Experte für österreichisches Mietrecht (MRG).

Analysiere diese Schadensmeldung nach österreichischem MRG (kein Mietvertrag hinterlegt). Antworte IMMER in diesem Format:

**VERANTWORTLICH:** [Mieter / Hausverwaltung / Unklar]
**BEGRÜNDUNG:** [1-2 Sätze nach MRG § 3 / § 8]
**EMPFEHLUNG:** [Konkreter nächster Schritt]
**HINWEIS:** Kein Mietvertrag hinterlegt — bitte Vertrag in Dokumentenablage hochladen.

Schadensmeldung:
${damageInfo}`,
    }]
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages,
  })

  const analysisText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('\n')

  // Save to DB (fire-and-forget style, ignore errors)
  await supabase
    .from('damage_reports')
    .update({ ki_analyse_result: analysisText, ki_analyse_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('organization_id', organizationId)

  return { analysisText, leaseFound }
}
