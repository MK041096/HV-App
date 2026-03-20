import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

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

    // Match Liegenschaft — contextual search first, full-text fallback
    let bestMatch: string | null = null

    if (liegenschaften.length > 0) {
      // Step 1: Extract context windows around "Versichertes Objekt" labels
      // Covers label variations used by Austrian/German insurers (Wiener Städtische,
      // Allianz, Generali, UNIQA, HDI, Helvetia, Grazer Wechselseitige, etc.)
      const objectLabels = [
        // Most common
        'versichertes objekt',
        'versicherungsobjekt',
        'das versicherte objekt',
        // Liegenschaft-based
        'liegenschaftsadresse',
        'geschützte liegenschaft',
        'geschuetzte liegenschaft',
        'versicherte liegenschaft',
        'liegenschaft',
        // Risiko-based (Allianz, HDI, Helvetia)
        'risikoanschrift',
        'risikoadresse',
        'risikoort',
        'risikostandort',
        'ort der risikobelegenheit',
        'belegenheitsadresse',
        'belegenheitsort',
        // Standort / Gebäude
        'versicherter standort',
        'versicherungsort',
        'objektadresse',
        'gebäudeadresse',
        'gebaeudeadresse',
        'versichertes gebäude',
        'versichertes gebaeude',
        // Sonstige
        'versicherter gegenstand',
        'versichertes risiko',
        'anschrift des risikos',
        'lageadresse',
        'standortadresse',
      ]
      const contextWindows: string[] = []
      const lowerText = pdfText.toLowerCase()
      for (const label of objectLabels) {
        let pos = lowerText.indexOf(label)
        while (pos !== -1) {
          // Take 400 chars after the label (where the address follows)
          const window = pdfText.slice(pos, pos + 400)
          contextWindows.push(window)
          pos = lowerText.indexOf(label, pos + 1)
        }
      }

      // Helper: search liegenschaften in a given text block
      const findMatch = (searchText: string): string | null => {
        const normalizedSearch = normalize(searchText)
        let found: string | null = null
        let foundLen = 0
        for (const lg of liegenschaften) {
          const normalizedLg = normalize(lg)
          if (normalizedSearch.includes(normalizedLg) && normalizedLg.length > foundLen) {
            found = lg
            foundLen = normalizedLg.length
          }
        }
        if (!found) {
          // Street-only fallback (ignore house number and city)
          for (const lg of liegenschaften) {
            const streetPart = lg.split(',')[0].trim()
            const normalizedStreet = normalize(streetPart)
            if (normalizedStreet.length > 5 && normalizedSearch.includes(normalizedStreet)) {
              found = lg
              break
            }
          }
        }
        return found
      }

      // Step 2: Search in context windows (high confidence)
      for (const window of contextWindows) {
        const match = findMatch(window)
        if (match) { bestMatch = match; break }
      }

      // Step 3: Full-text fallback (lower confidence, still useful)
      if (!bestMatch) {
        bestMatch = findMatch(pdfText)
      }
    }

    // Extract Top/unit number from PDF text (for Mietvertrag matching)
    // Priority: specific context (Wohnung/Mietobjekt + Top N) → Top Nr. N → standalone Top N
    // Negative lookahead (?!\s*[-–]\s*\d) prevents matching "Top 1" in ranges like "Top 1-10"
    const topMatch =
      pdfText.match(/\b(?:wohnung|mietobjekt|einheit)[^.\n]{0,80}\bTop\s+(\d{1,3})\b(?!\s*[-–]\s*\d)/i) ??
      pdfText.match(/\bTop\s+Nr\.?\s*(\d{1,3})\b/i) ??
      pdfText.match(/\bTop\s+(\d{1,3})\b(?!\s*[-–]\s*\d)/i)
    const unit_top = topMatch ? topMatch[1] : null

    return NextResponse.json({
      liegenschaft: bestMatch,
      suggested_name,
      unit_top,
      confidence: bestMatch ? 'hoch' : 'nicht_erkannt',
    })
  } catch (err) {
    console.error('PDF analyse error:', err)
    return NextResponse.json({ liegenschaft: null, suggested_name: null, confidence: 'nicht_erkannt' })
  }
}
