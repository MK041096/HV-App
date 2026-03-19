import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

// Normalizes an address string for fuzzy matching:
// "Mariahilfer Straße 88, 1060 Wien" → "mariahilferstrasse88"
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/straße/g, 'strasse').replace(/str\./g, 'strasse').replace(/strasse/g, 'strasse')
    .replace(/gasse/g, 'gasse').replace(/platz/g, 'platz').replace(/weg/g, 'weg')
    .replace(/[^a-z0-9]/g, '')
}

// POST /api/documents/analyse
// Body: { file_path: string }
// Returns: { liegenschaft: string | null, confidence: 'hoch' | 'niedrig' | 'nicht_erkannt' }
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

    if (liegenschaften.length === 0) {
      return NextResponse.json({ liegenschaft: null, confidence: 'nicht_erkannt' })
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(file_path)

    if (downloadError || !fileData) {
      return NextResponse.json({ liegenschaft: null, confidence: 'nicht_erkannt' })
    }

    // Extract text from PDF
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let pdfText = ''
    try {
      const parsed = await pdfParse(buffer)
      pdfText = parsed.text || ''
    } catch {
      return NextResponse.json({ liegenschaft: null, confidence: 'nicht_erkannt' })
    }

    const normalizedPdf = normalize(pdfText)

    // Try to match each known Liegenschaft
    let bestMatch: string | null = null
    let bestMatchLength = 0

    for (const lg of liegenschaften) {
      const normalizedLg = normalize(lg)
      if (normalizedPdf.includes(normalizedLg) && normalizedLg.length > bestMatchLength) {
        bestMatch = lg
        bestMatchLength = normalizedLg.length
      }
    }

    if (bestMatch) {
      return NextResponse.json({ liegenschaft: bestMatch, confidence: 'hoch' })
    }

    // Fallback: try partial matching (street name + number only)
    for (const lg of liegenschaften) {
      // Extract just street + number (before comma)
      const streetPart = lg.split(',')[0].trim()
      const normalizedStreet = normalize(streetPart)
      if (normalizedStreet.length > 5 && normalizedPdf.includes(normalizedStreet)) {
        return NextResponse.json({ liegenschaft: lg, confidence: 'hoch' })
      }
    }

    return NextResponse.json({ liegenschaft: null, confidence: 'nicht_erkannt' })
  } catch (err) {
    console.error('PDF analyse error:', err)
    return NextResponse.json({ liegenschaft: null, confidence: 'nicht_erkannt' })
  }
}
