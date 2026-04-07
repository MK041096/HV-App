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

// Insurance type keywords (most specific first — NO catch-all fallbacks)
const INSURANCE_TYPES: { pattern: RegExp; label: string }[] = [
  { pattern: /gebäudeversicherung|gebaeude.?versicherung/i, label: 'Gebäudeversicherung' },
  { pattern: /haftpflichtversicherung|haftpflicht.?versicherung/i, label: 'Haftpflichtversicherung' },
  { pattern: /rechtsschutzversicherung|rechtsschutz.?versicherung/i, label: 'Rechtsschutzversicherung' },
  { pattern: /elementarschadenversicherung|elementar.?schaden|elementar.?versicherung/i, label: 'Elementarschadenversicherung' },
  { pattern: /feuerversicherung|feuer.?versicherung/i, label: 'Feuerversicherung' },
  { pattern: /leitungswasserversicherung|leitungswasser.?versicherung/i, label: 'Leitungswasserversicherung' },
  { pattern: /sturmversicherung|sturm.?versicherung/i, label: 'Sturmversicherung' },
  { pattern: /glasbruchversicherung|glas.{0,8}bruch.{0,8}versicherung/i, label: 'Glasbruchversicherung' },
  { pattern: /glasversicherung|glas.{0,8}versicherung/i, label: 'Glasversicherung' },
  { pattern: /geräteversicherung|geraete.{0,4}versicherung|gerät.{0,4}versicherung/i, label: 'Geräteversicherung' },
  { pattern: /einbruchversicherung|einbruch.?versicherung/i, label: 'Einbruchversicherung' },
  { pattern: /haushaltsversicherung|haushalt.?versicherung/i, label: 'Haushaltsversicherung' },
  { pattern: /maschinenversicherung|maschinen.?versicherung/i, label: 'Maschinenversicherung' },
  { pattern: /betriebsunterbrechungsversicherung|betriebs.?unterbrechung/i, label: 'Betriebsunterbrechungsversicherung' },
]

// Indicators that a document IS an insurance policy (at least one must match)
const INSURANCE_INDICATORS: RegExp[] = [
  /versicherungsschein/i,
  /polizzennummer/i,
  /polizze/i,
  /versicherungspr[äa]mie/i,
  /pr[äa]mie/i,
  /jahrespr[äa]mie/i,
  /versicherungssumme/i,
  /versicherungsnehmer/i,
  /deckungsumfang/i,
  /versicherungsschutz/i,
  /selbstbehalt/i,
  /versicherungsnummer/i,
  /versicherungsperiode/i,
  /deckungsbeitrag/i,
]

// Keywords that clearly identify NON-insurance documents
const NON_INSURANCE_INDICATORS: RegExp[] = [
  /mietvertrag/i,
  /untermietvertrag/i,
  /mietzins/i,
  /hauptmieter/i,
  /unterverm[ie]ter/i,
  /mietgegenstand/i,
  /mietdauer/i,
  /wohnungsübergabe/i,
  /wohnungsuebergabe/i,
  /kaufvertrag/i,
  /grundbuchauszug/i,
  /betriebskostenabrechnung/i,
]

function detectDocumentType(text: string): 'insurance' | 'wrong_type' {
  // Immediate reject: known non-insurance document types
  if (NON_INSURANCE_INDICATORS.some(p => p.test(text))) return 'wrong_type'
  // Require at least one insurance-specific indicator
  if (INSURANCE_INDICATORS.some(p => p.test(text))) return 'insurance'
  return 'wrong_type'
}

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

    // ── Gemeinsame Hilfsfunktion: Liegenschaft in Text suchen ──
    const findMatch = (searchText: string): string | null => {
      const normalizedSearch = normalize(searchText)
      let found: string | null = null
      let foundLen = 0

      // Pass 1: exact full liegenschaft match
      for (const lg of liegenschaften) {
        const normalizedLg = normalize(lg)
        if (normalizedSearch.includes(normalizedLg) && normalizedLg.length > foundLen) {
          found = lg
          foundLen = normalizedLg.length
        }
      }
      if (found) return found

      // Pass 2: street part only (before comma)
      for (const lg of liegenschaften) {
        const streetPart = lg.split(',')[0].trim()
        const normalizedStreet = normalize(streetPart)
        if (normalizedStreet.length > 5 && normalizedSearch.includes(normalizedStreet)) {
          return lg
        }
      }

      // Pass 3: token-based — all significant words of the street must appear in text
      let bestLg: string | null = null
      let bestScore = 0
      for (const lg of liegenschaften) {
        const streetPart = lg.split(',')[0].trim()
        const tokens = streetPart.split(/\s+/).map(t => normalize(t)).filter(t => t.length >= 3)
        if (tokens.length < 2) continue
        const matched = tokens.filter(t => normalizedSearch.includes(t))
        const score = matched.length / tokens.length
        if (score >= 0.8 && matched.length >= 2 && score > bestScore) {
          bestScore = score
          bestLg = lg
        }
      }
      return bestLg
    }

    // ── Top-Nummer aus PDF extrahieren ──
    const topMatch =
      pdfText.match(/\b(?:wohnung|mietobjekt|einheit|mietgegenstand)[^.\n]{0,80}\bTop\s*(\d{1,3})\b(?!\s*[-–]\s*\d)/i) ??
      pdfText.match(/\bTop\s+Nr\.?\s*(\d{1,3})\b/i) ??
      pdfText.match(/[/\\]Top\s*(\d{1,3})\b/i) ??
      // Versicherungs-spezifische Kontexte (Risikoanschrift, Bewohnte Einheit etc.)
      pdfText.match(/(?:risikoanschrift|risikostandort|versicherungsort|bewohnte?\s*einheit|versicherte?\s*einheit)[^\n]{0,150}Top\s*(\d{1,3})\b/i) ??
      // Adressformat: "Top 1, 1060 Wien"
      pdfText.match(/\bTop\s*(\d{1,3})[,\s]+\d{4}/i) ??
      pdfText.match(/\bTop\s*(\d{1,3})\b(?!\s*[-–]\s*\d)/i)
    const unit_top = topMatch ? topMatch[1] : null

    // ── Einheits-Police: genau dann wenn die Adresse eine Top-Nummer enthält ──
    // Kein Raten anhand des Dokumenttyps — allein die Adresse entscheidet.
    // Gebäudeversicherung einer Zentralheizung → keine Top-Nummer → Liegenschaft ✓
    // Geräteversicherung Top 1 → enthält "Top 1" in der Risikoanschrift → Einheit ✓
    const is_unit_police = unit_top !== null

    // ── Mietvertrag-Pfad ──
    // Mietvertrag erkennen: mind. ein Mietvertrag-typisches Wort vorhanden
    const MIETVERTRAG_POSITIVE: RegExp[] = [
      /mietvertrag/i, /mietzins/i, /hauptmieter/i, /untermieter/i,
      /vermieter/i, /mietgegenstand/i, /mietobjekt/i, /mietdauer/i,
      /wohnungsübergabe/i, /wohnungsuebergabe/i,
    ]
    const isMietvertrag = NON_INSURANCE_INDICATORS.some(p => p.test(pdfText))
      || MIETVERTRAG_POSITIVE.some(p => p.test(pdfText))
    // Kein Versicherungsdokument = eindeutig kein Insurance-Wort enthalten
    const hasInsuranceWords = INSURANCE_INDICATORS.some(p => p.test(pdfText))
    if (isMietvertrag && !hasInsuranceWords) {
      let bestMatch: string | null = null

      if (liegenschaften.length > 0) {
        // Kontext-Labels für Mietverträge — in größeren Fenstern suchen
        const mietLabels = [
          'mietgegenstand', 'mietobjekt', 'das mietobjekt',
          'die wohnung', 'wohneinheit', 'mietgegenstand befindet sich',
          'objekt:', 'adresse:', 'lage:', 'gelegen in', 'befindet sich in',
          'mietgegenstand befindet', 'das mietobjekt befindet',
          'vermietet an', 'mieterin', 'mieter:',
          'top ', '/top', '/ top',
          'straße', 'strasse', 'gasse', 'platz', 'weg', 'allee',
        ]
        const contextWindows: string[] = []
        const lowerText = pdfText.toLowerCase()
        for (const label of mietLabels) {
          let pos = lowerText.indexOf(label)
          while (pos !== -1) {
            // Auch Kontext VOR dem Label einbeziehen (Adresse kann vor dem Schlagwort stehen)
            const start = Math.max(0, pos - 100)
            contextWindows.push(pdfText.slice(start, pos + 500))
            pos = lowerText.indexOf(label, pos + 1)
          }
        }
        for (const ctx of contextWindows) {
          const match = findMatch(ctx)
          if (match) { bestMatch = match; break }
        }
        // Volltext-Fallback
        if (!bestMatch) bestMatch = findMatch(pdfText)
      }

      return NextResponse.json({
        liegenschaft: bestMatch,
        suggested_name: null,
        unit_top,
        is_insurance: false,
        is_mietvertrag: true,
        confidence: bestMatch ? 'hoch' : 'nicht_erkannt',
      })
    }

    // ── Versicherungsdokument-Pfad ──
    const docType = detectDocumentType(pdfText)
    if (docType === 'wrong_type') {
      return NextResponse.json({ liegenschaft: null, suggested_name: null, is_insurance: false, confidence: 'kein_versicherungsdokument' })
    }

    // Extract policy name from PDF text
    const suggested_name = extractPolicyName(pdfText)

    let bestMatch: string | null = null

    if (liegenschaften.length > 0) {
      const objectLabels = [
        'versichertes objekt', 'versicherungsobjekt', 'das versicherte objekt',
        'liegenschaftsadresse', 'geschützte liegenschaft', 'geschuetzte liegenschaft',
        'versicherte liegenschaft', 'liegenschaft',
        'risikoanschrift', 'risikoadresse', 'risikoort', 'risikostandort',
        'ort der risikobelegenheit', 'belegenheitsadresse', 'belegenheitsort',
        'versicherter standort', 'versicherungsort', 'objektadresse',
        'gebäudeadresse', 'gebaeudeadresse', 'versichertes gebäude', 'versichertes gebaeude',
        'versicherter gegenstand', 'versichertes risiko', 'anschrift des risikos',
        'lageadresse', 'standortadresse',
      ]
      const contextWindows: string[] = []
      const lowerText = pdfText.toLowerCase()
      for (const label of objectLabels) {
        let pos = lowerText.indexOf(label)
        while (pos !== -1) {
          contextWindows.push(pdfText.slice(pos, pos + 400))
          pos = lowerText.indexOf(label, pos + 1)
        }
      }
      for (const ctx of contextWindows) {
        const match = findMatch(ctx)
        if (match) { bestMatch = match; break }
      }
      if (!bestMatch) bestMatch = findMatch(pdfText)
    }

    return NextResponse.json({
      liegenschaft: bestMatch,
      suggested_name,
      unit_top,
      is_insurance: true,
      is_unit_police,
      confidence: bestMatch ? 'hoch' : 'nicht_erkannt',
    })
  } catch (err) {
    console.error('PDF analyse error:', err)
    return NextResponse.json({ liegenschaft: null, suggested_name: null, confidence: 'nicht_erkannt' })
  }
}
