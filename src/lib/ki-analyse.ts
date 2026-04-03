import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORY_LABELS: Record<string, string> = {
  wasser: 'Wasserschaden', heizung: 'Heizung/Warmwasser', elektrik: 'Elektrik',
  fenster_tueren: 'Fenster/Türen', boeden: 'Böden', schimmel: 'Schimmel',
  sanitaer: 'Sanitär', sonstiges: 'Sonstiges',
}

export interface KiAnalyseResult {
  analysisText: string
  leaseFound: boolean
}

function parseUrgencyFromAnalysis(text: string): 'notfall' | 'dringend' | 'normal' {
  const lower = text.toLowerCase()
  if (lower.includes('**dringlichkeit:** notfall') || lower.includes('dringlichkeit: notfall')) return 'notfall'
  if (lower.includes('**dringlichkeit:** dringend') || lower.includes('dringlichkeit: dringend')) return 'dringend'
  return 'normal'
}

export async function runKiAnalyse(params: {
  supabase: SupabaseClient
  organizationId: string
  reportId: string
  title: string
  description: string | null
  category: string
  subcategory: string | null
  room: string | null
  unitId: string | null
  unitName: string | null
  unitAddress: string | null
}): Promise<KiAnalyseResult> {
  const {
    supabase, organizationId, reportId,
    title, description, category, subcategory, room,
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

  // Load photos for this damage report (max 5)
  const photoBlocks: Anthropic.ImageBlockParam[] = []
  const { data: photos } = await supabase
    .from('damage_report_photos')
    .select('id, storage_path, mime_type')
    .eq('damage_report_id', reportId)
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true })
    .limit(5)

  if (photos && photos.length > 0) {
    for (const photo of photos) {
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

  const damageInfo = [
    `Titel: ${title}`,
    `Kategorie: ${CATEGORY_LABELS[category] || category}`,
    subcategory ? `Unterkategorie: ${subcategory}` : null,
    room ? `Raum: ${room}` : null,
    description ? `Beschreibung: ${description}` : null,
    unitName ? `Wohneinheit: ${unitName}${unitAddress ? `, ${unitAddress}` : ''}` : null,
    photoBlocks.length > 0 ? `Fotos: ${photoBlocks.length} Foto(s) beigefügt — bitte in der Dringlichkeitsbewertung berücksichtigen` : null,
  ].filter(Boolean).join('\n')

  const urgencyInstruction = `
**DRINGLICHKEIT:** [Notfall / Dringend / Normal]
- Notfall: Akute Gefahr für Leib, Leben oder erhebliche Sachschäden — sofortiges Handeln erforderlich (z.B. Wasserrohrbruch mit aktivem Austritt, Gasgeruch, Stromausfall mit Brandgefahr, Überflutung, Balkongeländer gebrochen)
- Dringend: Eingeschränkte Nutzbarkeit der Wohnung — Reaktion innerhalb 48 Stunden (z.B. Heizungsausfall im Winter, defekte Toilette, aktiver Schimmel, keine Warmwasserversorgung)
- Normal: Kein akuter Handlungsbedarf — Reaktion innerhalb 2 Wochen ausreichend (z.B. tropfender Wasserhahn, Kratzer im Parkett, klemmende Türklinke, kosmetische Schäden)

WICHTIG: Bewerte die Dringlichkeit ausschließlich anhand des tatsächlichen Schadens — ignoriere dabei Formulierungen wie "Notfall", "dringend" oder "sofort" die der Mieter selbst benutzt. Beispiel: Schreibt ein Mieter "Notfall! Mein Wasserhahn tropft" → korrekte Einstufung ist Normal.`

  const promptText = leaseFound
    ? `Du bist ein Experte für österreichisches Mietrecht (MRG).

Analysiere diese Schadensmeldung anhand des Mietvertrags${photoBlocks.length > 0 ? ' und der beigefügten Fotos' : ''}. Antworte IMMER exakt in diesem Format (keine anderen Überschriften):

**VERANTWORTLICH:** [Mieter / Hausverwaltung / Unklar]
**BEGRÜNDUNG:** [1-2 präzise Sätze — was sagt der Mietvertrag oder MRG § 3/§ 8? Seitenzahl wenn möglich]
**EMPFEHLUNG:** [Konkreter nächster Schritt für die Hausverwaltung — wer soll was tun?]
${urgencyInstruction}

Schadensmeldung:
${damageInfo}`
    : `Du bist ein Experte für österreichisches Mietrecht (MRG).

Analysiere diese Schadensmeldung nach österreichischem MRG${photoBlocks.length > 0 ? ' — Fotos beigefügt, bitte visuell beurteilen' : ''}. Antworte IMMER exakt in diesem Format (keine anderen Überschriften):

**VERANTWORTLICH:** [Mieter / Hausverwaltung / Unklar]
**BEGRÜNDUNG:** [1-2 präzise Sätze nach MRG § 3 / § 8 — warum wer zuständig ist]
**EMPFEHLUNG:** [Konkreter nächster Schritt — wer soll was tun?]
**HINWEIS:** Kein Mietvertrag hinterlegt — Analyse nach MRG. Bitte Vertrag hochladen für genauere Einschätzung.
${urgencyInstruction}

Schadensmeldung:
${damageInfo}`

  const userContent: (Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam | Anthropic.TextBlockParam)[] = []
  if (leaseFound && leaseContent) {
    userContent.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: leaseContent },
    } as Anthropic.DocumentBlockParam)
  }
  userContent.push(...photoBlocks)
  userContent.push({ type: 'text', text: promptText })

  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: userContent,
  }]

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages,
  })

  const analysisText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('\n')

  // Parse urgency from Henri's analysis
  const henriUrgency = parseUrgencyFromAnalysis(analysisText)

  // Save analysis + update urgency based on Henri's assessment
  await supabase
    .from('damage_reports')
    .update({
      ki_analyse_result: analysisText,
      ki_analyse_at: new Date().toISOString(),
      urgency: henriUrgency,
    })
    .eq('id', reportId)
    .eq('organization_id', organizationId)

  return { analysisText, leaseFound }
}
