const fs = require('fs')

// ── Shared new prompt template ──
const NEUE_FORMAT_ANWEISUNG = `Antworte IMMER exakt in diesem Format — keine Abweichungen:

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
Ignoriere wie der Mieter die Dringlichkeit selbst beschreibt.`

// ── 1. lib/ki-analyse.ts ──
const libPath = 'src/lib/ki-analyse.ts'
let lib = fs.readFileSync(libPath, 'utf8')

// Replace the old prompt construction
const oldLeasePrompt = `  const promptText = leaseFound
    ? \`Du bist ein Experte für österreichisches Mietrecht (MRG).

Analysiere diese Schadensmeldung anhand des Mietvertrags\${photoBlocks.length > 0 ? ' und der beigefügten Fotos' : ''}. Antworte IMMER exakt in diesem Format (keine anderen Überschriften):

**VERANTWORTLICH:** [Mieter / Hausverwaltung / Unklar]
**BEGRÜNDUNG:** [1-2 präzise Sätze — was sagt der Mietvertrag oder MRG § 3/§ 8? Seitenzahl wenn möglich]
**EMPFEHLUNG:** [Konkreter nächster Schritt für die Hausverwaltung — wer soll was tun?]
\${urgencyInstruction}

Schadensmeldung:
\${damageInfo}\`
    : \`Du bist ein Experte für österreichisches Mietrecht (MRG).

Analysiere diese Schadensmeldung nach österreichischem MRG\${photoBlocks.length > 0 ? ' — Fotos beigefügt, bitte visuell beurteilen' : ''}. Antworte IMMER exakt in diesem Format (keine anderen Überschriften):

**VERANTWORTLICH:** [Mieter / Hausverwaltung / Unklar]
**BEGRÜNDUNG:** [1-2 präzise Sätze nach MRG § 3 / § 8 — warum wer zuständig ist]
**EMPFEHLUNG:** [Konkreter nächster Schritt — wer soll was tun?]
**HINWEIS:** Kein Mietvertrag hinterlegt — Analyse nach MRG. Bitte Vertrag hochladen für genauere Einschätzung.
\${urgencyInstruction}

Schadensmeldung:
\${damageInfo}\``

const newLeasePrompt = `  const mietvertragHinweis = leaseFound
    ? ''
    : '\\nHINWEIS: Kein Mietvertrag hinterlegt — Analyse nach MRG/ABGB. Bitte Vertrag hochladen.'

  const promptText = \`Du bist ein Experte für österreichisches Mietrecht (MRG/ABGB).\${photoBlocks.length > 0 ? ' Fotos beigefügt — bitte visuell beurteilen.' : ''}\${mietvertragHinweis}

${NEUE_FORMAT_ANWEISUNG}

Schadensmeldung:
\${damageInfo}\``

lib = lib.replace(oldLeasePrompt, newLeasePrompt)

// Remove the urgencyInstruction variable (no longer needed)
lib = lib.replace(/\n  const urgencyInstruction[\s\S]*?sofort benutzt\.\`\n/, '\n')

// Update urgency parser to use new format
lib = lib.replace(
  `function parseUrgencyFromAnalysis(text: string): 'notfall' | 'dringend' | 'normal' {
  const lower = text.toLowerCase()
  if (lower.includes('**dringlichkeit:** notfall') || lower.includes('dringlichkeit: notfall')) return 'notfall'
  if (lower.includes('**dringlichkeit:** dringend') || lower.includes('dringlichkeit: dringend')) return 'dringend'
  return 'normal'
}`,
  `function parseUrgencyFromAnalysis(text: string): 'notfall' | 'dringend' | 'normal' {
  const m = text.match(/^DRINGLICHKEIT:\\s*(\\S+)/mi)
  const val = (m?.[1] || '').toLowerCase()
  if (val === 'notfall') return 'notfall'
  if (val === 'dringend') return 'dringend'
  return 'normal'
}`
)

// Increase max_tokens for longer structured output
lib = lib.replace('max_tokens: 600,', 'max_tokens: 900,')

fs.writeFileSync(libPath, lib)
console.log('lib/ki-analyse.ts: done')

// ── 2. ki-analyse/route.ts ──
const routePath = 'src/app/api/hv/cases/[id]/ki-analyse/route.ts'
let route = fs.readFileSync(routePath, 'utf8')

// Replace the systemPrompt construction
const oldSystemPrompt = `    const systemPrompt = [
      \`Du bist ein Experte fuer das \${countryLabel} Mietrecht und Immobilienverwaltung.\`,
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
      contractorList
        ? \`\\n---\\n\\nVERFUEBARE WERKSTAETTEN (nur aus dieser Liste waehlen):\\n\${contractorList}\\n\\nPunkt 5 ist PFLICHT wenn Werkstaetten vorhanden.\`
        : '',
      'Antworte auf Deutsch, klar strukturiert, max. 300 Woerter.',
    ].join('\\n')`

// Find it differently since escaping may differ
const systemPromptStart = route.indexOf("    const systemPrompt = [")
const systemPromptEnd = route.indexOf("].join('\\n')", systemPromptStart) + "].join('\\n')".length

if (systemPromptStart > -1 && systemPromptEnd > systemPromptStart) {
  const newSystemPrompt = `    const werkstattHinweis = contractorList
      ? \`\\n\\nVERFÜGBARE WERKSTÄTTEN (wähle genau eine):\\n\${contractorList}\`
      : ''

    const systemPrompt = \`Du bist ein Experte für das \${countryLabel} Mietrecht und Immobilienverwaltung.

\${legalKnowledge}

---

${NEUE_FORMAT_ANWEISUNG}\${contractorList ? '\\n\\nPunkt WERKSTATT (zusätzlich nach ERKLÄRUNG):\\nWERKSTATT: [exakter Firmenname aus der Liste]' : ''}\${werkstattHinweis}\``

  route = route.substring(0, systemPromptStart) + newSystemPrompt + route.substring(systemPromptEnd)
  console.log('ki-analyse route systemPrompt: replaced')
} else {
  console.log('ki-analyse route systemPrompt: NOT FOUND — check manually')
}

// Update urgency parsing in route
route = route.replace(
  `    const analysisLower = analysisText.toLowerCase()
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
    }`,
  `    const urgencyMatch = analysisText.match(/^DRINGLICHKEIT:\\s*(\\S+)/mi)
    const urgencyVal = (urgencyMatch?.[1] || '').toLowerCase()
    let detectedUrgency: string | null = null
    if (urgencyVal === 'notfall') detectedUrgency = 'notfall'
    else if (urgencyVal === 'dringend') detectedUrgency = 'dringend'`
)

// Increase max_tokens
route = route.replace('max_tokens: 1024,', 'max_tokens: 1200,')

fs.writeFileSync(routePath, route)
console.log('ki-analyse/route.ts: done')
console.log('\nAll done!')
