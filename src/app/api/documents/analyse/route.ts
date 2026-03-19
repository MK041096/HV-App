import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require('pdf-parse')
// pdf-parse v2 exports a class, v1 exports a function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buf: Buffer) => Promise<{ text: string }> =
  typeof pdfParseModule === 'function'
    ? pdfParseModule
    : pdfParseModule.default && typeof pdfParseModule.default === 'function'
    ? pdfParseModule.default
    : (buf: Buffer) => new pdfParseModule.PDFParse().parse(buf)

// Normalizes an address string for fuzzy matching
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/straße/g, 'strasse').replace(/str\./g, 'strasse').replace(/strasse/g, 'strasse')
    .replace(/gasse/g, 'gasse').replace(/platz/g, 'platz').replace(/weg/g, 'weg')
    .replace(/[^a-z0-9]/g, '')
}

// Known Austrian/German insurers (order: most specific first)
const INSURERS = [
  'Wiener Städtische', 'Grazer Wechselseitige', 'Niederösterreichische Versicherung',
  'Burgenländische', 'Tiroler', 'Vorarlberger', 'Salzburger',
  'Allianz', 'Generali', 'Uniqa', 'UNIQA', 'Zürich', 'Zurich',
  'AXA', 'HDI', 'Helvetia', 'Basler', 'Donau Versicherung', 'Donau',
  'Merkur', 'Österreichische Hagelversicherung',
  'VIG', 'Vienna Insurance Group',
]

// Insurance type keywords (most specific first)
const INSURANCE_TYPES: { pattern: RegExp; label: string }[] = [
  { pattern: /gebäudeversicherung|gebaeude.?versicherung/i, label: 'Gebäudeversicherung' },
  { pattern: /haftpflichtversicherung|haftpflicht.?versicherung/i, label: 'Haftpflichtversicherung' },
  { pattern: /rechtsschutzversicherung|rechtsschutz.?versicherung/i, label: 'Rechtsschutzversicherung' },
  { pattern: /elementarschadenversicherung|elementar.?schaden|elementar.?versicherung/i, label: 'Elementarschadenversicherung' },
  { pattern: /feuerversicherung|feuer.?versicherung/i, label: 'Feuerversicherung' },
  { pattern: /leitungswasserversicherung|leitungswasser.?versicherung/i, label: 'Leitungswasserversicherung' },
  { pattern: /sturmversicherung|sturm.?versicherung/i, label: 'Sturmversicherung' },
  { pattern: /glasversicherung|glas.?versicherung/i, label: 'Glasversicherung' },
  { pattern: /einbruchversicherung|einbruch.?versicherung/i, label: 'Einbruchversicherung' },
  { pattern: /haushaltsversicherung|haushalt.?versicherung/i, label: 'Haushaltsversicherung' },
  { pattern: /gebäude|liegenschaft|immobilien/i, label: 'Gebäudeversicherung' },
]

// Extracts a human-readable policy name from raw PDF text
function extractPolicyName(text: string): string | null {
  const parts: string[] = []

  for (const { pattern, label } of INSURANCE_TYPES) {
    if (pattern.test(text)) { parts.push(label); break }
  }

  for (const insurer of INSURERS) {
    if (text.toLowerCase().includes(insurer.toLowerCase())) { parts.push(insurer); break }
  }

  const yearMatch = text.match(/(202[0-9]|203[0-5])/)
  if (yearMatch) parts.push(yearMatch[1])

  if (parts.length === 0) return null
  return parts.join(' ')
}

// POST /api/documents/analyse
// Body: { file_path: string }
// Returns: { liegenschaft, suggested_name, confidence }
export async function POST(request: NextRequest) {
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

    const { file_path } = await request.json()
    if (!file_path) return NextResponse.json({ error: 'file_path fehlt' }, { status: 400 })

    // Load known Liegenschaften for this org
    const { data: units } = await supabase
      .from('units')
      .select('address')
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)

    const liegenschaften = Array.from(
      new Set(
        (units || [])
          .filter(u => u.address)
          .map(u => {
            const addr = u.address as string
            return addr.includes('/') ? addr.split('/')[0].trim() : addr.trim()
          })
      )
    )

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(file_path)

    if (downloadError || !fileData) {
      return NextResponse.json({ liegenschaft: null, suggested_name: null, confidence: 'nicht_erkannt' })
    }

    // Extract text from PDF
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let pdfText = ''
    try {
      const parsed = await pdfParse(buffer)
      pdfText = parsed.text || ''
    } catch {
      return NextResponse.json({ liegenschaft: null, suggested_name: null, confidence: 'nicht_erkannt' })
    }

    // Extract policy name from PDF text
    const suggested_name = extractPolicyName(pdfText)

    // Match Liegenschaft
    let bestMatch: string | null = null
    let bestMatchLength = 0

    if (liegenschaften.length > 0) {
      const normalizedPdf = normalize(pdfText)

      for (const lg of liegenschaften) {
        const normalizedLg = normalize(lg)
        if (normalizedPdf.includes(normalizedLg) && normalizedLg.length > bestMatchLength) {
          bestMatch = lg
          bestMatchLength = normalizedLg.length
        }
      }

      if (!bestMatch) {
        for (const lg of liegenschaften) {
          const streetPart = lg.split(',')[0].trim()
          const normalizedStreet = normalize(streetPart)
          if (normalizedStreet.length > 5 && normalize(pdfText).includes(normalizedStreet)) {
            bestMatch = lg
            break
          }
        }
      }
    }

    return NextResponse.json({
      liegenschaft: bestMatch,
      suggested_name,
      confidence: bestMatch ? 'hoch' : 'nicht_erkannt',
    })
  } catch (err) {
    console.error('PDF analyse error:', err)
    return NextResponse.json({ liegenschaft: null, suggested_name: null, confidence: 'nicht_erkannt' })
  }
}
