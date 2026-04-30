/**
 * Extrahiert die Liegenschafts-Adresse aus einer Einheits-Adresse.
 *
 * Beispiele:
 *   "Mariahilfer Straße 88 Top 1, 1060 Wien"  → "Mariahilfer Straße 88, 1060 Wien"
 *   "Hauptstraße 1/3, 1010 Wien"              → "Hauptstraße 1, 1010 Wien"
 *   "Beispielgasse 5 Stiege 2 Tür 4, 1020 Wien" → "Beispielgasse 5, 1020 Wien"
 *
 * Wird verwendet:
 *   - beim Upload einer Versicherungspolice (Auto-Zuordnung zur Liegenschaft)
 *   - bei der CARL-Analyse (Auto-Loading aller Policen die die Einheit decken)
 *
 * Beide Stellen müssen identisch normalisieren, sonst findet CARL die hochgeladenen
 * Policen nicht wieder.
 */
export function extractLiegenschaftFromAddress(address: string): string {
  let addr = address

  // Slash-Format: "Hauptstraße 1/3, 1010 Wien" → "Hauptstraße 1, 1010 Wien"
  if (addr.includes('/')) {
    const slashSplit = addr.split('/')
    const afterSlash = slashSplit.slice(1).join('/')
    const postalAndCity = afterSlash.match(/(\d{4,5}\s+\S.*)$/)
    addr = slashSplit[0].trim() + (postalAndCity ? ', ' + postalAndCity[1].trim() : '')
  }

  // "Top X"-Format: "… 88 Top 1, 1060 Wien" → "… 88, 1060 Wien"
  addr = addr.replace(/\s+Top\s+\d+/i, '')

  // Stiege/Tür-Format: österreichisches Adressformat in größeren Häusern
  addr = addr.replace(/\s+(Stiege|Tür)\s+\d+/gi, '')

  // Whitespace + Komma-Spacing normalisieren
  return addr.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim()
}
