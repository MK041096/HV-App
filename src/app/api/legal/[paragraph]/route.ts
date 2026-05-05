import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Cache: Gesetzestexte sind semi-statisch
export const revalidate = 86400 // 24h

export async function GET(_request: NextRequest, { params }: { params: Promise<{ paragraph: string }> }) {
  const { paragraph: rawParam } = await params
  const paragraph = decodeURIComponent(rawParam)

  const supabase = await createServerSupabaseClient()

  // 1. Exakter Match
  let { data, error } = await supabase
    .from('legal_texts')
    .select('paragraph, country, law, title, text, source_url, last_verified_at')
    .eq('paragraph', paragraph)
    .maybeSingle()

  // 2. Fallback: Prefix-Match (z.B. "MRG § 8 Abs. 2" → "MRG § 8")
  if (!error && !data) {
    const baseMatch = paragraph.match(/^([A-Z]+\s*§\s*\d+)/i)
    if (baseMatch) {
      const baseParagraph = baseMatch[1].replace(/\s+/g, ' ').replace(/\s*§\s*/, ' § ')
      const result = await supabase
        .from('legal_texts')
        .select('paragraph, country, law, title, text, source_url, last_verified_at')
        .eq('paragraph', baseParagraph)
        .maybeSingle()
      data = result.data
      error = result.error
    }
  }

  if (error) {
    console.error('Legal text fetch error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Paragraf nicht hinterlegt', paragraph },
      { status: 404 }
    )
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
