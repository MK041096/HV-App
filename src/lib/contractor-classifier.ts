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

Deine Aufgabe: Aus Firmenname, Tätigkeit und Beschreibung erstellst du ein DETAILLIERTES strukturiertes Werkstatt-Profil. Dieses Profil wird später bei jeder Schadensmeldung an CARL übergeben — je präziser dein Profil, desto besser kann CARL die richtige Werkstatt für einen konkreten Schaden auswählen.

═══════════════════════════════════════════
WEB-SUCHE (web_search Tool)
═══════════════════════════════════════════
Du hast Zugang zu einer Internet-Suche. NUTZE sie aktiv wenn:
- Tätigkeit/Beschreibung knapp ist (z. B. nur "Glaserei", "Maler")
- Du den Firmennamen suchen kannst um Webseite, Branchenbucheintrag, Google-Bewertungen zu finden
- Spezialisierungen, Notdienst-Verfügbarkeit oder Service-Gebiet aus der CSV nicht hervorgehen

Maximal 3 Suchen pro Werkstatt. Sinnvolle Suchen:
- "{Firmenname} Wien" — findet Hauptseite + Adresse
- "{Firmenname} Notdienst" — findet 24h-Hotlines, Bereitschaft
- "{Firmenname} Spezialisierung" oder "{Tätigkeit} {Bezirk}"

WICHTIG: Wenn die Beschreibung BEREITS sehr detailliert ist (3+ Sätze mit Spezialisierungen, Notdienst, Region) — dann NICHT suchen, sondern aus der Beschreibung extrahieren.

═══════════════════════════════════════════
KLASSIFIZIERUNG
═══════════════════════════════════════════

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

═══════════════════════════════════════════
DETAILLIERTES PROFIL (carl_hint) — 4-6 Sätze, MUSS folgendes enthalten:
═══════════════════════════════════════════

1. **Hauptspezialisierung**: Was macht dieser Betrieb am besten? (1 Satz)
2. **Konkrete Schadens-Typen**: Bei welchen Schäden ist diese Werkstatt erste Wahl? (1-2 Sätze, sehr spezifisch — z. B. "Rohrbrüche unter Putz, Frostschäden an Heizungsleitungen, Bautrocknung nach Wasserschäden")
3. **Notdienst-Verfügbarkeit**: 24/7? Werktags? Bei welchen Notfällen? Hotline-Nummer falls bekannt.
4. **Service-Gebiet**: Welche Bezirke/Bundesländer werden bedient?
5. **Besonderheiten/Differenziatoren** (falls vorhanden): Zertifizierungen, Größe, Geschichte, Spezialequipment.

Tonfall: sachlich, fachlich präzise, KEIN Marketing-Sprech. Was die Werkstatt nachweislich kann, nicht was sie behauptet.

WENN du im Web nichts findest: schreibe ehrlich "Keine erweiterte Web-Recherche möglich, Klassifizierung anhand der Tätigkeitsbeschreibung." und nutze nur was in der CSV stand.

═══════════════════════════════════════════
SEARCH KEYWORDS — 10-15 Begriffe
═══════════════════════════════════════════
Deutsche Synonyme + Schadens-Begriffe die typischerweise in einer Mietermeldung vorkommen würden, bei der DIESE Werkstatt passt.

Beispiele:
- Sanitär-Werkstatt → ["Rohrbruch", "Wasseraustritt", "Leitungswasserschaden", "Verstopfung", "Toilette läuft", "Boiler kaputt", "Therme defekt", "Frostschaden Wasser", "Sickerwasser", "Wasserdruck weg", "Heizungsausfall warm", "Dusche tropft"]
- Aufzug → ["Aufzug steckt", "Aufzug bleibt stehen", "Lift defekt", "Person eingeschlossen", "Aufzug fährt nicht", "Türen schließen nicht", "Notrufsystem", "TÜV-Termin", "Fahrstuhl-Wartung"]

═══════════════════════════════════════════
REGELN
═══════════════════════════════════════════
- specialties kann mehrere Werte enthalten (z. B. ["wasserschaden","sanitaer"])
- subtags sind ZUSÄTZLICH zu specialties
- Bei Allroundern ohne Web-Funden: specialties=["sonstiges"], carl_hint erklärt warum unspezifisch
- KEIN Marketing-Sprech, KEINE Floskeln, KEINE erfundenen Fakten

═══════════════════════════════════════════
ANTWORTFORMAT
═══════════════════════════════════════════
Am Ende GENAU EIN JSON-Objekt, kein Markdown-Codeblock, kein Text davor oder danach:
{"specialties":["..."],"subtags":["..."],"carl_hint":"4-6 Sätze...","search_keywords":["..."]}`

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
      max_tokens: 3500,  // Höhere Tokens für ausführlichere carl_hint + mehr search_keywords
      system: SYSTEM_PROMPT,
      tools: [{
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 3,  // 3 Suchen pro Werkstatt für tiefere Recherche
        user_location: { type: 'approximate', country: 'AT', timezone: 'Europe/Vienna' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any],
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Server-Tool: Anthropic führt web_search intern aus, das finale Antwort-Text-Block
    // ist die JSON-Antwort. Wir nehmen alle Text-Blöcke und nehmen den letzten als JSON.
    const textBlocks = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
    const text = (textBlocks[textBlocks.length - 1] || '').trim()

    // JSON aus dem Antwort-Text extrahieren — robust gegen Markdown-Codeblocks
    // und gegen extra Text vor/nach dem JSON (kann bei Web-Search-Antworten passieren)
    let cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1)
    }
    const parsed = JSON.parse(cleaned) as Partial<ContractorClassification>

    // Whitelist enforcement — keine kreativen Tags zulassen
    const specialties = (parsed.specialties || [])
      .filter(s => typeof s === 'string' && VALID_SPECIALTIES.includes(s))
    const subtags = (parsed.subtags || [])
      .filter(s => typeof s === 'string' && VALID_SUBTAGS.includes(s))

    return {
      specialties: specialties.length > 0 ? specialties : ['sonstiges'],
      subtags: Array.from(new Set(subtags)),
      carl_hint: typeof parsed.carl_hint === 'string' ? parsed.carl_hint.slice(0, 2000) : '',
      search_keywords: Array.isArray(parsed.search_keywords)
        ? parsed.search_keywords.filter(k => typeof k === 'string').slice(0, 20)
        : [],
    }
  } catch (err) {
    console.error('classifyContractor failed for', company, '— fallback to keyword logic:', err)
    return fallback()
  }
}
