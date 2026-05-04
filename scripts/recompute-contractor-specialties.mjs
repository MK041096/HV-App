/**
 * One-Time Cleanup: Berechnet specialties aller bestehenden Werkstätten neu
 * mit der aktualisierten deriveSpecialties-Logik aus lib/contractors.ts.
 *
 * Wird nur einmal nach dem Logik-Upgrade ausgeführt — neue Werkstätten kriegen
 * beim Import sowieso automatisch die neue Logik.
 *
 * Usage: node scripts/recompute-contractor-specialties.mjs
 */

import { createClient } from '@supabase/supabase-js'
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
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('FEHLER: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Inline-Kopie der deriveSpecialties-Logik (TS aus dem Script nicht direkt importierbar)
function matches(text, keywords) { return keywords.some(kw => text.includes(kw)) }

function deriveSpecialties(taetigkeit, _beschreibung = '') {
  // Nur Tätigkeit matchen — Beschreibung erzeugt zu viele Cross-Matches
  const text = taetigkeit.toLowerCase()
  const out = new Set()

  if (matches(text, ['sanitär','sanitaer','rohrbruch','leitungswasser','wasserschaden','wasserinstall','badezimmer','kanal','abwasser','verstopfung',' shk','leckortung','bautrocknung','estrichtrocknung','wasser-','rohr ','rohre','boiler','warmwasser'])) {
    out.add('wasserschaden'); out.add('sanitaer')
  }
  if (matches(text, ['heizung','therme','heizkörper','heizkoerper','gasheizung','pelletsheizung','wärmepumpe','waermepumpe','brennerwartung','gas-brennwert','heizungsservice'])) {
    out.add('heizung')
  }
  if (matches(text, ['lüftung','lueftung','klimaanlage','klimatechnik','wohnraumlüftung','lüftungsanlage','split-system'])) {
    out.add('heizung'); out.add('lueftung')
  }
  if (matches(text, ['elektrik','elektrisch','strom','sicherung','steckdose','beleucht','fi-schalter','zählerkasten','zaehlerkasten','kurzschluss','photovoltaik','pv-anlage','e-check','elektro'])) {
    out.add('elektrik')
  }
  if (matches(text, ['fenster','verglasung','isolierglas','doppelverglasung','glasbruch','glaserei'])) {
    out.add('fenster_tueren'); out.add('glas')
  }
  if (matches(text, ['tür ','türen','tueren','eingangstür','wohnungstür','türmontage','tuermontage'])) {
    out.add('fenster_tueren')
  }
  if (matches(text, ['schloss','schlüssel','schluessel','schlosserei','aufsperrdienst','einbruchschutz','sicherheitstür','tresor'])) {
    out.add('fenster_tueren'); out.add('schlosserei')
  }
  if (matches(text, ['tischler','schreiner','holzarbeit','einbauküche','einbaukueche','möbelreparatur','moebelreparatur','maßanfertigung'])) {
    out.add('fenster_tueren'); out.add('tischlerei')
  }
  if (matches(text, ['schimmel','schwarzschimmel','sporen','feuchtigkeitsschaden','schimmelsanierung','schimmelanalyse'])) {
    out.add('schimmel')
  }
  if (matches(text, ['fliese','fliesenleger','fugen','silikonfugen','parkett','laminat','vinyl','teppich','fußbodenheizung','estrich','bodenleger','naturstein'])) {
    out.add('boeden_waende')
    if (matches(text, ['fliese','fliesenleger'])) out.add('fliesen')
  }
  if (matches(text, ['maler','malerei','tapezier','innenanstrich','außenanstrich','aussenanstrich','verputz','fassadensanierung'])) {
    out.add('boeden_waende')
  }
  if (matches(text, ['trockenbau','zwischenwand','deckenverkleidung','wärmedämmung','waermedaemmung'])) {
    out.add('boeden_waende'); out.add('trockenbau')
  }
  if (matches(text, ['dachdecker','dachreparatur','dachsanierung','flachdach','dachabdichtung','sturmschadenbehebung'])) {
    out.add('aussenbereich'); out.add('dach')
  }
  if (matches(text, ['spengler','spenglerei','blecharbeit','fassadenblech','regenrinne','balkonabdichtung'])) {
    out.add('aussenbereich'); out.add('dach')
  }
  if (matches(text, ['gartenpflege','rasen','hecke','bepflanzung','grünfläche','gruenflaeche','winterdienst','streupflicht','gartenarbeit'])) {
    out.add('aussenbereich'); out.add('garten')
  }
  if (matches(text, ['baumfällung','baumfaellung','baumdienst','wurzelentfernung','kronenpflege','baumgutachten','baumarbeit'])) {
    out.add('aussenbereich'); out.add('baumdienst')
  }
  if (matches(text, ['aufzug','lift ','tüv-abnahme','tuev-abnahme','personenbefreiung','aufzugwartung','aufzugservice'])) {
    out.add('sonstiges'); out.add('aufzug')
  }
  if (matches(text, ['brandschutz','rauchmelder','feuerlöscher','feuerloescher','fluchtweg','sicherheitsbeleuchtung','brandschutztür'])) {
    out.add('sonstiges'); out.add('brandschutz')
  }
  if (matches(text, ['schädling','schaedling','ungeziefer','mäuse','maeuse','ratte','wespen','hornissen','bettwanze','taubenabwehr','desinfektion','begasung'])) {
    out.add('sonstiges'); out.add('schaedlingsbekaempfung')
  }
  if (matches(text, ['asbest','kmf-mineralfaser','schadstoffanalyse','bauschadstoff','schadstoffsanierung','awg'])) {
    out.add('sonstiges'); out.add('schadstoffsanierung')
  }
  if (matches(text, ['rauchfang','kaminkehr','feuerstättenschau','feuerstaettenschau','kehrordnung','co-messung'])) {
    out.add('sonstiges'); out.add('rauchfangkehrer'); out.add('heizung')
  }
  if (matches(text, ['gebäudereinigung','gebaeudereinigung','hausreinigung','treppenhausreinigung','fensterreinigung','tiefenreinigung','sonderreinigung','grundreinigung'])) {
    out.add('sonstiges'); out.add('reinigung')
  }
  if (matches(text, ['leckortung','bautrocknung','wasserschaden-sanier','schadenbehebung nach rohrbruch'])) {
    out.add('wasserschaden'); out.add('sanitaer')
  }
  if (out.size === 0) out.add('sonstiges')
  return Array.from(out)
}

// ── Main ─────────────────────────────────────────────────────────────
const { data: contractors, error } = await supabase
  .from('contractors')
  .select('id, company, notes, description, specialties')
  .eq('is_active', true)

if (error) { console.error(error); process.exit(1) }

console.log(`${contractors.length} Werkstätten gefunden\n`)

let updated = 0
for (const c of contractors) {
  const newSpecialties = deriveSpecialties(c.notes || '', c.description || '')
  const oldStr = JSON.stringify(c.specialties || [])
  const newStr = JSON.stringify(newSpecialties)

  if (oldStr !== newStr) {
    await supabase.from('contractors').update({ specialties: newSpecialties }).eq('id', c.id)
    console.log(`✓ ${c.company.padEnd(40)} ${oldStr} → ${newStr}`)
    updated++
  } else {
    console.log(`  ${c.company.padEnd(40)} unverändert: ${newStr}`)
  }
}

console.log(`\n${updated} Werkstätten aktualisiert, ${contractors.length - updated} unverändert.`)
