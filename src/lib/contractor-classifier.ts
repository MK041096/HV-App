/**
 * KI-basierte Werkstatt-Klassifizierung beim Import.
 *
 * Wird einmal pro Werkstatt aufgerufen (nur beim Anlegen oder Update).
 * Nutzt Claude Haiku (kostengünstig) und liefert strukturierte Daten:
 *   - specialties: Hauptkategorien (matchen damage_reports.category enum)
 *   - subtags: Spezialgewerke (aufzug, brandschutz etc.)
 *   - carl_hint: 1-2 Satz Zusammenfassung optimiert für CARL-Matching
 *   - search_keywords: Synonyme/verwandte Begriffe
 *
 * Bei API-Fehler oder Timeout: Fallback auf Keyword-basierte deriveSpecialties
 * (kein crash, kein Datenverlust — Werkstatt wird trotzdem gespeichert).
 */

import Anthropic from '@anthropic-ai/sdk'
import { deriveSpecialties } from './contractors'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Erlaubte Hauptkategorien (1:1 zu damage_reports.category enum)
const VALID_SPECIALTIES = [
  'wasserschaden', 'heizung', 'elektrik', 'fenster_tueren',
  'schimmel', 'sanitaer', 'boeden_waende', 'aussenbereich', 'sonstiges',
]

// Erlaubte Subtags (Spezialgewerke außerhalb der Hauptkategorien)
const VALID_SUBTAGS = [
  'aufzug', 'brandschutz', 'schaedlingsbekaempfung', 'schadstoffsanierung',
  'rauchfangkehrer', 'reinigung', 'garten', 'baumdienst', 'schlosserei',
  'tischlerei', 'glas', 'dach', 'fliesen', 'trockenbau', 'lueftung',
]

const SYSTEM_PROMPT = `Du klassifizierst österreichische Handwerker- und Werkstatt-Betriebe für eine Hausverwaltungs-Software.

Aufgabe: Aus dem Firmennamen, der Tätigkeit und der Beschreibung leitest du strukturierte Daten ab, die später bei einer Schadensmeldung helfen die richtige Werkstatt auszuwählen.

ERLAUBTE HAUPTKATEGORIEN (specialties) — wähle alle die zutreffen:
- wasserschaden — Wasserrohrbrüche, Leckortung, Bautrocknung, Wasserschadensanierung
- sanitaer — Bad, WC, Sanitärinstallation, Therme, Boiler
- heizung — Heizung, Therme, Wärmepumpe, Klimaanlage, Lüftung
- elektrik — Strom, Sicherungen, Elektroinstallation, Beleuchtung
- fenster_tueren — Fenster, Türen, Schlösser, Glas, Tischlerei
- schimmel — Schimmelbekämpfung, Sporen-Sanierung
- boeden_waende — Böden, Parkett, Fliesen, Estrich, Maler, Trockenbau, Verputz
- aussenbereich — Dach, Fassade, Garten, Baumdienst, Spengler
- sonstiges — Aufzug, Brandschutz, Schädlinge, Asbest, Rauchfangkehrer, Reinigung

ERLAUBTE SUBTAGS (Spezialgewerke) — falls zutreffend:
aufzug, brandschutz, schaedlingsbekaempfung, schadstoffsanierung, rauchfangkehrer, reinigung, garten, baumdienst, schlosserei, tischlerei, glas, dach, fliesen, trockenbau, lueftung

REGELN:
- specialties kann mehrere Werte enthalten (z. B. ["wasserschaden","sanitaer"] für Sanitär-Wasserschaden-Betrieb)
- subtags sind ZUSÄTZLICH zu specialties (z. B. Aufzug-Service: specialties=["sonstiges"], subtags=["aufzug"])
- Bei Allroundern oder unklarer Angabe: specialties=["sonstiges"]
- carl_hint: 1-2 prägnante Sätze auf Deutsch — was diese Werkstatt am besten kann, für welche Schäden, evtl. Notdienst-Erwähnung
- search_keywords: 5-12 deutsche Synonyme/verwandte Schadensbegriffe die zu dieser Werkstatt passen würden (z. B. Rohrbruch→Wasseraustritt, Leck, Frostschaden, Sickerwasser)

ANTWORTFORMAT — exakt JSON, keine Markdown-Codeblocks, kein Text drumherum:
{"specialties":["..."],"subtags":["..."],"carl_hint":"...","search_keywords":["..."]}`

export interface ContractorClassification {
  specialties: string[]
  subtags: string[]
  carl_hint: string
  search_keywords: string[]
}

/**
 * Klassifiziert eine Werkstatt mit Claude Haiku.
 * Bei Fehler: Fallback auf Keyword-Logik aus deriveSpecialties().
 */
export async function classifyContractor(params: {
  company: string
  taetigkeit: string
  beschreibung?: string | null
}): Promise<ContractorClassification> {
  const { company, taetigkeit, beschreibung } = params

  // Fallback wenn Claude-API nicht verfügbar
  const fallback = (): ContractorClassification => {
    const all = deriveSpecialties(taetigkeit, beschreibung || '')
    const specialties = all.filter(s => VALID_SPECIALTIES.includes(s))
    const subtags = all.filter(s => VALID_SUBTAGS.includes(s))
    return {
      specialties: specialties.length > 0 ? specialties : ['sonstiges'],
      subtags,
      carl_hint: `${company}: ${taetigkeit}${beschreibung ? '. ' + beschreibung : ''}`.slice(0, 300),
      search_keywords: [],
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return fallback()
  }

  try {
    const userPrompt = `FIRMA: ${company}
TÄTIGKEIT: ${taetigkeit}
BESCHREIBUNG: ${beschreibung || '(keine Beschreibung)'}

Klassifiziere diese Werkstatt. Antworte exakt im vorgegebenen JSON-Format.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('\n')
      .trim()

    // Markdown-Codeblocks entfernen falls Claude doch mal welche schickt
    const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<ContractorClassification>

    // Whitelist enforcement — keine kreativen Tags zulassen
    const specialties = (parsed.specialties || [])
      .filter(s => typeof s === 'string' && VALID_SPECIALTIES.includes(s))
    const subtags = (parsed.subtags || [])
      .filter(s => typeof s === 'string' && VALID_SUBTAGS.includes(s))

    return {
      specialties: specialties.length > 0 ? specialties : ['sonstiges'],
      subtags: Array.from(new Set(subtags)),
      carl_hint: typeof parsed.carl_hint === 'string' ? parsed.carl_hint.slice(0, 500) : '',
      search_keywords: Array.isArray(parsed.search_keywords)
        ? parsed.search_keywords.filter(k => typeof k === 'string').slice(0, 15)
        : [],
    }
  } catch (err) {
    console.error('classifyContractor failed for', company, '— fallback to keyword logic:', err)
    return fallback()
  }
}
