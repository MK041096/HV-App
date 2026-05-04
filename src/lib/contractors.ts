/**
 * Leitet die specialties (Gewerk-Tags) einer Werkstatt aus den Freitext-Feldern
 * Tätigkeit + Beschreibung ab. Wird beim Import + jeder Aktualisierung aufgerufen.
 *
 * Damit kann CARL bei einer Schadensmeldung die richtige Werkstatt auswählen:
 * - Hauptkategorien (matchen die damage_reports.category enum):
 *   wasserschaden, heizung, elektrik, fenster_tueren, schimmel, sanitaer,
 *   boeden_waende, aussenbereich, sonstiges
 * - Spezial-Subtags für CARL (zusätzlich zu Hauptkategorien):
 *   aufzug, brandschutz, schaedlingsbekaempfung, schadstoffsanierung,
 *   rauchfangkehrer, reinigung, garten, baumdienst, schlosserei,
 *   tischlerei, glas, dach, fliesen, trockenbau, lueftung
 *
 * Eine Werkstatt kann mehrere Tags bekommen (z. B. "Trockenbau & Schimmel" →
 * ['boeden_waende', 'trockenbau', 'schimmel']).
 */

function matches(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw))
}

/**
 * WICHTIG: Wir matchen nur gegen die Tätigkeit-Spalte (= Hauptgewerk).
 * Die Beschreibung wird nicht in den Tags reflektiert, weil sie viele
 * Cross-Matches erzeugt (z. B. "Fensterreinigung" in einer Reinigungsfirma
 * → würde fälschlich als Fenster-Werkstatt klassifiziert).
 *
 * CARL bekommt die Beschreibung trotzdem als Volltext und kann sie nutzen —
 * die Tags hier sind nur ein zusätzlicher strukturierter Hint.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function deriveSpecialties(taetigkeit: string, _beschreibung = ''): string[] {
  const text = taetigkeit.toLowerCase()
  const out = new Set<string>()

  // ── Wasser / Sanitär ─────────────────────────────────────────────────
  if (matches(text, [
    'sanitär', 'sanitaer', 'rohrbruch', 'leitungswasser', 'wasserschaden',
    'wasserinstall', 'badezimmer', 'kanal', 'abwasser', 'verstopfung',
    ' shk', 'leckortung', 'bautrocknung', 'estrichtrocknung',
    'wasser-', 'rohr ', 'rohre', 'boiler', 'warmwasser',
  ])) {
    out.add('wasserschaden')
    out.add('sanitaer')
  }

  // ── Heizung ──────────────────────────────────────────────────────────
  if (matches(text, [
    'heizung', 'therme', 'heizkörper', 'heizkoerper', 'gasheizung',
    'pelletsheizung', 'wärmepumpe', 'waermepumpe', 'brennerwartung',
    'gas-brennwert', 'heizungsservice',
  ])) {
    out.add('heizung')
  }

  // ── Lüftung / Klima (extra Subtag, primär heizung) ──────────────────
  if (matches(text, [
    'lüftung', 'lueftung', 'klimaanlage', 'klimatechnik', 'wohnraumlüftung',
    'lüftungsanlage', 'split-system',
  ])) {
    out.add('heizung')
    out.add('lueftung')
  }

  // ── Elektrik ─────────────────────────────────────────────────────────
  if (matches(text, [
    'elektrik', 'elektrisch', 'strom', 'sicherung', 'steckdose',
    'beleucht', 'fi-schalter', 'zählerkasten', 'zaehlerkasten',
    'kurzschluss', 'photovoltaik', 'pv-anlage', 'e-check', 'elektro',
  ])) {
    out.add('elektrik')
  }

  // ── Fenster / Glas ───────────────────────────────────────────────────
  if (matches(text, [
    'fenster', 'verglasung', 'isolierglas', 'doppelverglasung',
    'glasbruch', 'glaserei',
  ])) {
    out.add('fenster_tueren')
    out.add('glas')
  }

  // ── Türen ────────────────────────────────────────────────────────────
  if (matches(text, [
    'tür ', 'türen', 'tueren', 'eingangstür', 'wohnungstür',
    'türmontage', 'tuermontage',
  ])) {
    out.add('fenster_tueren')
  }

  // ── Schlosserei / Sicherheit ─────────────────────────────────────────
  if (matches(text, [
    'schloss', 'schlüssel', 'schluessel', 'schlosserei', 'aufsperrdienst',
    'einbruchschutz', 'sicherheitstür', 'tresor',
  ])) {
    out.add('fenster_tueren')
    out.add('schlosserei')
  }

  // ── Tischlerei / Holz ────────────────────────────────────────────────
  if (matches(text, [
    'tischler', 'schreiner', 'holzarbeit', 'einbauküche', 'einbaukueche',
    'möbelreparatur', 'moebelreparatur', 'maßanfertigung',
  ])) {
    out.add('fenster_tueren')
    out.add('tischlerei')
  }

  // ── Schimmel ─────────────────────────────────────────────────────────
  if (matches(text, [
    'schimmel', 'schwarzschimmel', 'sporen', 'feuchtigkeitsschaden',
    'schimmelsanierung', 'schimmelanalyse',
  ])) {
    out.add('schimmel')
  }

  // ── Boden ────────────────────────────────────────────────────────────
  if (matches(text, [
    'fliese', 'fliesenleger', 'fugen', 'silikonfugen',
    'parkett', 'laminat', 'vinyl', 'teppich', 'fußbodenheizung',
    'estrich', 'bodenleger', 'naturstein',
  ])) {
    out.add('boeden_waende')
    if (matches(text, ['fliese', 'fliesenleger'])) out.add('fliesen')
  }

  // ── Wand / Maler / Trockenbau ────────────────────────────────────────
  if (matches(text, [
    'maler', 'malerei', 'tapezier', 'innenanstrich', 'außenanstrich',
    'aussenanstrich', 'verputz', 'fassadensanierung',
  ])) {
    out.add('boeden_waende')
  }
  if (matches(text, [
    'trockenbau', 'zwischenwand', 'deckenverkleidung', 'wärmedämmung',
    'waermedaemmung',
  ])) {
    out.add('boeden_waende')
    out.add('trockenbau')
  }

  // ── Dach ─────────────────────────────────────────────────────────────
  if (matches(text, [
    'dachdecker', 'dachreparatur', 'dachsanierung', 'flachdach',
    'dachabdichtung', 'sturmschadenbehebung',
  ])) {
    out.add('aussenbereich')
    out.add('dach')
  }

  // ── Spengler ─────────────────────────────────────────────────────────
  if (matches(text, [
    'spengler', 'spenglerei', 'blecharbeit', 'fassadenblech',
    'regenrinne', 'balkonabdichtung',
  ])) {
    out.add('aussenbereich')
    out.add('dach')
  }

  // ── Garten / Winterdienst ────────────────────────────────────────────
  if (matches(text, [
    'gartenpflege', 'rasen', 'hecke', 'bepflanzung', 'grünfläche',
    'gruenflaeche', 'winterdienst', 'streupflicht', 'gartenarbeit',
  ])) {
    out.add('aussenbereich')
    out.add('garten')
  }

  // ── Baumdienst ───────────────────────────────────────────────────────
  if (matches(text, [
    'baumfällung', 'baumfaellung', 'baumdienst', 'wurzelentfernung',
    'kronenpflege', 'baumgutachten', 'baumarbeit',
  ])) {
    out.add('aussenbereich')
    out.add('baumdienst')
  }

  // ── Aufzug ───────────────────────────────────────────────────────────
  if (matches(text, [
    'aufzug', 'lift ', 'tüv-abnahme', 'tuev-abnahme', 'personenbefreiung',
    'aufzugwartung', 'aufzugservice',
  ])) {
    out.add('sonstiges')
    out.add('aufzug')
  }

  // ── Brandschutz / Sicherheit ─────────────────────────────────────────
  if (matches(text, [
    'brandschutz', 'rauchmelder', 'feuerlöscher', 'feuerloescher',
    'fluchtweg', 'sicherheitsbeleuchtung', 'brandschutztür',
  ])) {
    out.add('sonstiges')
    out.add('brandschutz')
  }

  // ── Schädlingsbekämpfung ─────────────────────────────────────────────
  if (matches(text, [
    'schädling', 'schaedling', 'ungeziefer', 'mäuse', 'maeuse',
    'ratte', 'wespen', 'hornissen', 'bettwanze', 'taubenabwehr',
    'desinfektion', 'begasung',
  ])) {
    out.add('sonstiges')
    out.add('schaedlingsbekaempfung')
  }

  // ── Asbest / Schadstoffsanierung ─────────────────────────────────────
  if (matches(text, [
    'asbest', 'kmf-mineralfaser', 'schadstoffanalyse', 'bauschadstoff',
    'schadstoffsanierung', 'awg',
  ])) {
    out.add('sonstiges')
    out.add('schadstoffsanierung')
  }

  // ── Rauchfangkehrer ──────────────────────────────────────────────────
  if (matches(text, [
    'rauchfang', 'kaminkehr', 'feuerstättenschau', 'feuerstaettenschau',
    'kehrordnung', 'co-messung',
  ])) {
    out.add('sonstiges')
    out.add('rauchfangkehrer')
    out.add('heizung')
  }

  // ── Reinigung ────────────────────────────────────────────────────────
  if (matches(text, [
    'gebäudereinigung', 'gebaeudereinigung', 'hausreinigung',
    'treppenhausreinigung', 'fensterreinigung', 'tiefenreinigung',
    'sonderreinigung', 'grundreinigung',
  ])) {
    out.add('sonstiges')
    out.add('reinigung')
  }

  // ── Wasserschadensanierer (spezialisiert) ────────────────────────────
  if (matches(text, [
    'leckortung', 'bautrocknung', 'wasserschaden-sanier',
    'schadenbehebung nach rohrbruch',
  ])) {
    out.add('wasserschaden')
    out.add('sanitaer')
  }

  // ── Fallback ─────────────────────────────────────────────────────────
  if (out.size === 0) out.add('sonstiges')

  return Array.from(out)
}
