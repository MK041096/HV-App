/**
 * Klassifiziert nur die Werkstätten neu, deren carl_hint im trivialen Fallback-Format
 * "Company: Tätigkeit. Beschreibung" steht (= Anthropic Web-Search Rate-Limit getroffen).
 *
 * Nutzt direkt die /api/hv/contractors/[id] PATCH Route oder ruft den Classifier
 * direkt auf via Service-Role-Key.
 *
 * Usage:
 *   1. Stelle sicher dass Vercel den neuesten Code deployed hat (Concurrency=3, Retry-Logic)
 *   2. node scripts/reclassify-fallbacks.mjs
 *   3. Wartet sequenziell (concurrency=1) damit garantiert kein Rate-Limit greift
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

// .env.local laden
const envPath = 'c:/Users/tradi/Hausverwaltungs App/HV-App/.env.local'
const envText = fs.readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envText.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANTHROPIC_KEY) {
  console.error('FEHLER: Env-Variablen fehlen')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

const VALID_SPECIALTIES = ['wasserschaden','heizung','elektrik','fenster_tueren','schimmel','sanitaer','boeden_waende','aussenbereich','sonstiges']
const VALID_SUBTAGS = ['aufzug','brandschutz','schaedlingsbekaempfung','schadstoffsanierung','rauchfangkehrer','reinigung','garten','baumdienst','schlosserei','tischlerei','glas','dach','fliesen','trockenbau','lueftung']

const SYSTEM_PROMPT = `Du klassifizierst österreichische Handwerker-Betriebe für eine Hausverwaltungs-Software.

Du hast Web-Suche. NUTZE sie aktiv (max 2 Suchen) um die Firma zu recherchieren — Webseite, Branchenbuch, Notdienst, Adresse.

ERLAUBTE specialties: ${VALID_SPECIALTIES.join(', ')}
ERLAUBTE subtags: ${VALID_SUBTAGS.join(', ')}

carl_hint MUSS 4-6 Sätze enthalten mit:
1. Hauptspezialisierung
2. Konkrete Schadens-Typen (sehr spezifisch)
3. Notdienst + Hotline-Nummer falls bekannt
4. Service-Gebiet
5. Besonderheiten/Zertifizierungen

search_keywords: 10-15 deutsche Schadens-Synonyme.

ANTWORT NUR JSON, kein Markdown, keine Citations:
{"specialties":["..."],"subtags":["..."],"carl_hint":"...","search_keywords":["..."]}`

async function classify(company, taetigkeit, beschreibung) {
  const userPrompt = `FIRMA: ${company}\nTÄTIGKEIT: ${taetigkeit}\nBESCHREIBUNG: ${beschreibung || '(keine)'}`

  const tryCall = async (withWeb) => {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 3500,
      system: SYSTEM_PROMPT,
      ...(withWeb ? {
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2, user_location: { type: 'approximate', country: 'AT', timezone: 'Europe/Vienna' } }],
      } : {}),
      messages: [{ role: 'user', content: userPrompt }],
    })
    const blocks = resp.content.filter(b => b.type === 'text').map(b => b.text)
    return (blocks[blocks.length - 1] || '').trim()
  }

  let text
  try { text = await tryCall(true) } catch (e) {
    console.warn('  web_search failed, retry without:', e.message)
    text = await tryCall(false)
  }

  // <cite> tags strippen
  let cleaned = text
    .replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
    .replace(/<cite\s+index="[^"]*">/gi, '')
    .replace(/<\/cite>/gi, '')
    .trim()

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1) cleaned = cleaned.slice(firstBrace, lastBrace + 1)

  const parsed = JSON.parse(cleaned)
  const specialties = (parsed.specialties || []).filter(s => VALID_SPECIALTIES.includes(s))
  const subtags = (parsed.subtags || []).filter(s => VALID_SUBTAGS.includes(s))

  return {
    specialties: Array.from(new Set([...(specialties.length ? specialties : ['sonstiges']), ...subtags])),
    carl_hint: (parsed.carl_hint || '').replace(/\s+/g, ' ').slice(0, 2000),
    search_keywords: Array.isArray(parsed.search_keywords) ? parsed.search_keywords.slice(0, 20) : [],
  }
}

// ── Main ────────────────────────────────────────────────────────
const { data: contractors } = await supabase
  .from('contractors')
  .select('id, company, notes, description, carl_hint, search_keywords')
  .eq('is_active', true)

// Fallback erkennen: hint sehr kurz ODER 0 keywords
const fallbacks = contractors.filter(c =>
  !c.carl_hint || c.carl_hint.length < 200 ||
  !c.search_keywords || c.search_keywords.length === 0
)

console.log(`${contractors.length} Werkstätten total, ${fallbacks.length} im Fallback — werden neu klassifiziert\n`)

let success = 0
let fail = 0
for (let i = 0; i < fallbacks.length; i++) {
  const c = fallbacks[i]
  process.stdout.write(`[${i+1}/${fallbacks.length}] ${c.company.padEnd(45)} ... `)
  try {
    const result = await classify(c.company, c.notes || '', c.description)
    await supabase.from('contractors').update({
      specialties: result.specialties,
      carl_hint: result.carl_hint,
      search_keywords: result.search_keywords,
    }).eq('id', c.id)
    console.log(`✓ ${result.carl_hint.length}ch ${result.search_keywords.length}kw`)
    success++
  } catch (e) {
    console.log(`✗ ${e.message?.slice(0, 60)}`)
    fail++
  }
  // 1 Sekunde Pause zwischen Calls — vermeidet jegliches Rate-Limit
  await new Promise(r => setTimeout(r, 1000))
}

console.log(`\nFertig: ${success} erfolgreich, ${fail} fehlgeschlagen.`)
