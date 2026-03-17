/**
 * Generiert detaillierte Test-PDFs fuer KracherimmoGmbH:
 * - 1 Versicherungspolice
 * - 20 Mietvertraege mit unterschiedlichen Klauseln (4 Gruppen)
 *
 * Gruppen:
 *   Gruppe A (Top 1-5):  Standard, unbefristet, keine Haustiere, Kleinreparatur EUR 100,-
 *   Gruppe B (Top 6-10): Mit Haustiergenehmigung (Katze), explizite Glasklausel
 *   Gruppe C (Top 11-15): Befristet 3 Jahre, Indexanpassung VPI, Kleinreparatur EUR 75,-
 *   Gruppe D (Top 16-20): Parkettklausel, Kleinreparatur EUR 150,-, unbefristet
 *
 * PDFs heissen "Vorname Nachname.pdf" -> Bulk-Import erkennt Mieter aus dem PDF-Text
 *
 * Usage: node scripts/generate-test-docs.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, 'test-docs')

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

// PDF Generator using absolute Tm positioning
function createPdf(lines) {
  const textCommands = []
  let y = 780
  for (const line of lines) {
    if (line === '') { y -= 12; continue }
    const isBold = line.startsWith('**') && line.endsWith('**')
    const text = isBold ? line.slice(2, -2) : line
    const font = isBold ? '/F2' : '/F1'
    const size = isBold ? 11 : 9
    const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    textCommands.push(`${font} ${size} Tf`)
    textCommands.push(`1 0 0 1 50 ${y} Tm`)
    textCommands.push(`(${escaped}) Tj`)
    y -= size + 3
    if (y < 50) { y = 780 }
  }
  const streamContent = 'BT\n' + textCommands.join('\n') + '\nET'
  const streamLen = Buffer.byteLength(streamContent, 'latin1')

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n   /Contents 4 0 R\n   /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n'
  const obj4 = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj\n`
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n'

  const header = '%PDF-1.4\n'
  const body = obj1 + obj2 + obj3 + obj4 + obj5 + obj6

  const offsets = []
  let offset = header.length
  for (const obj of [obj1, obj2, obj3, obj4, obj5, obj6]) {
    offsets.push(offset)
    offset += Buffer.byteLength(obj, 'latin1')
  }
  const xrefPos = header.length + Buffer.byteLength(body, 'latin1')
  let xref = 'xref\n0 7\n0000000000 65535 f \n'
  for (const off of offsets) xref += String(off).padStart(10, '0') + ' 00000 n \n'
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`

  return Buffer.from(header + body + xref + trailer, 'latin1')
}

const today = new Date().toLocaleDateString('de-AT')
const year = new Date().getFullYear()

const MIETER = [
  { vorname: 'Anna',      nachname: 'Berger',      gruppe: 'A' },
  { vorname: 'Thomas',    nachname: 'Hofmann',     gruppe: 'A' },
  { vorname: 'Maria',     nachname: 'Schneider',   gruppe: 'A' },
  { vorname: 'Klaus',     nachname: 'Bauer',       gruppe: 'A' },
  { vorname: 'Sandra',    nachname: 'Gruber',      gruppe: 'A' },
  { vorname: 'Michael',   nachname: 'Wagner',      gruppe: 'B' },
  { vorname: 'Lisa',      nachname: 'Mueller',     gruppe: 'B' },
  { vorname: 'Andreas',   nachname: 'Koch',        gruppe: 'B' },
  { vorname: 'Christine', nachname: 'Fischer',     gruppe: 'B' },
  { vorname: 'Robert',    nachname: 'Weber',       gruppe: 'B' },
  { vorname: 'Sabine',    nachname: 'Klein',       gruppe: 'C' },
  { vorname: 'Martin',    nachname: 'Wolf',        gruppe: 'C' },
  { vorname: 'Julia',     nachname: 'Schroeder',   gruppe: 'C' },
  { vorname: 'Stefan',    nachname: 'Neumann',     gruppe: 'C' },
  { vorname: 'Monika',    nachname: 'Zimmermann',  gruppe: 'C' },
  { vorname: 'David',     nachname: 'Braun',       gruppe: 'D' },
  { vorname: 'Laura',     nachname: 'Hartmann',    gruppe: 'D' },
  { vorname: 'Peter',     nachname: 'Huber',       gruppe: 'D' },
  { vorname: 'Eva',       nachname: 'Richter',     gruppe: 'D' },
  { vorname: 'Max',       nachname: 'Mustermann',  gruppe: 'D' },
]

const SIZES = [52,67,48,71,55,63,44,58,39,72,50,65,47,56,68,45,61,38,53,60]
const RENTS = [720,890,680,950,780,840,630,800,570,980,710,870,660,760,910,650,820,550,740,850]
const START_DATES = [
  '01.01.2023','01.03.2023','01.06.2023','01.09.2023','01.01.2024',
  '01.03.2024','01.06.2024','01.09.2024','01.01.2025','01.03.2025',
  '01.04.2025','01.05.2025','01.06.2025','01.07.2025','01.08.2025',
  '01.09.2025','01.10.2025','01.11.2025','01.12.2025','01.01.2026',
]

// Versicherungspolice
const versicherungLines = [
  '**VERSICHERUNGSPOLICE**',
  '',
  '**Polizennummer:** VS-2025-KR-0042',
  `**Ausgestellt am:** ${today}`,
  '**Versicherungsnehmer:** KracherimmoGmbH',
  '**Adresse:** Wildgansgasse 8/2, 7400 Oberwart',
  '',
  '**VERSICHERUNGSART: Gebaeudeversicherung**',
  `**Versicherungsjahr:** ${year}`,
  '**Versicherer:** Wiener Staedtische Versicherung AG',
  '',
  '**VERSICHERTES OBJEKT:**',
  'Mustergasse 1-20, 7400 Oberwart - 20 Wohneinheiten Top 1 bis Top 20',
  '',
  '**1. LEITUNGSWASSERVERSICHERUNG**',
  '   Bruch von Rohrleitungen, Austreten von Leitungswasser, Frost- und Druckschaeden.',
  '   Selbstbehalt: EUR 500,- | Versicherungssumme: EUR 2.000.000,-',
  '',
  '**2. FEUERVERSICHERUNG**',
  '   Feuer, Blitzschlag, Explosion, Anprall von Luftfahrzeugen.',
  '   Selbstbehalt: EUR 500,- | Versicherungssumme: EUR 2.000.000,-',
  '',
  '**3. STURMSCHADENVERSICHERUNG**',
  '   Sturm ab Windstaerke 7, Hagel, Schneedruck.',
  '   Fassade, Dach, Fenster Aussenbereich: gedeckt.',
  '   Selbstbehalt: EUR 500,- | Versicherungssumme: EUR 500.000,-',
  '',
  '**4. HAFTPFLICHTVERSICHERUNG**',
  '   Ansprueche Dritter wegen Personen- und Sachschaeden.',
  '   Deckungssumme: EUR 3.000.000,-',
  '',
  '**NICHT GEDECKT:**',
  '- Vorsaetzliche Handlungen des Versicherungsnehmers',
  '- Abnutzung, Alterung, Verwitterung',
  '- Haushaltsgegenstaende der Mieter',
  '- Wasserschaeden durch Verstopfung (kein Rohrleitungsbruch)',
  '- Fensterscheiben Innenseite durch Mieter beschaedigt: NICHT gedeckt',
  '',
  '**GLASVERSICHERUNG:**',
  '   Fensterscheiben Aussenseite: durch Sturmversicherung gedeckt.',
  '   Glasbruch durch Vandalismus oder Einbruch: gedeckt.',
  '   Glasbruch durch Mieter von innen: NICHT gedeckt.',
  '',
  '**SCHIMMELSCHAEDEN:**',
  '   Schimmel als Folge eines Leitungswasserschadens: gedeckt.',
  '   Schimmel durch Fehllueftung des Mieters: NICHT gedeckt.',
  '',
  '**SCHADENMELDUNG:** Wiener Staedtische - Hotline: 050 350-351',
  '   Schadensnummer KracherimmoGmbH: KR-2025-042',
  '',
  `**Jaehrliche Versicherungspraemie:** EUR 4.800,-`,
  `**Naechste Faelligkeit:** 01.01.${year + 1}`,
  '',
  `Oberwart, ${today}`,
  'Wiener Staedtische Versicherung AG - Unterschrift Bevollmaechtigter',
]

writeFileSync(join(OUTPUT_DIR, 'Versicherungspolice_KracherimmoGmbH_2025.pdf'), createPdf(versicherungLines))
console.log('Versicherungspolice: OK')

// 20 Mietvertraege
for (let i = 0; i < 20; i++) {
  const top = i + 1
  const { vorname, nachname, gruppe } = MIETER[i]
  const size = SIZES[i]
  const rent = RENTS[i]
  const startDate = START_DATES[i]
  const bk = Math.round(rent * 0.25)
  const kaution = rent * 3
  const contractNr = `MV-KR-2025-${String(top).padStart(3, '0')}`
  const adresse = `Mustergasse ${top <= 10 ? 1 : 2}, Top ${top > 10 ? top - 10 : top}, 7400 Oberwart`
  const stockwerk = top <= 5 ? 'Erdgeschoss' : top <= 10 ? '1. Obergeschoss' : top <= 15 ? '2. Obergeschoss' : '3. Obergeschoss'

  const kleinreparaturGrenze = gruppe === 'C' ? 75 : gruppe === 'D' ? 150 : 100
  const kleinreparaturJahr = gruppe === 'C' ? 300 : gruppe === 'D' ? 600 : 400

  const startParts = startDate.split('.')
  const endeDatum = `${startParts[0]}.${startParts[1]}.${parseInt(startParts[2]) + 3}`

  const lines = [
    '**MIETVERTRAG**',
    '',
    `**Vertragsnummer:** ${contractNr}`,
    `**Abgeschlossen am:** ${startDate}`,
    '',
    '**VERMIETER:**',
    'KracherimmoGmbH - Vertreten durch: Mathias Kracher',
    'Wildgansgasse 8/2, 7400 Oberwart - UID: ATU81585679',
    '',
    '**MIETER:**',
    `${vorname} ${nachname}`,
    `Wohnhaft: ${adresse}`,
    '',
    '**MIETOBJEKT:**',
    `Wohneinheit: Top ${top} | Adresse: ${adresse}`,
    `Nutzflaeche: ${size} m2 | Stockwerk: ${stockwerk}`,
    '',
    `**MIETBEGINN:** ${startDate}`,
    `**MIETDAUER:** ${gruppe === 'C' ? `Befristet auf 3 Jahre, Mietende: ${endeDatum}` : 'Unbefristet'}`,
    '',
    '**MIETZINS:**',
    `Nettomiete: EUR ${rent},- | Betriebskosten Akonto: EUR ${bk},-`,
    `Gesamtmiete: EUR ${rent + bk},- | Faelligkeit: 5. des Monats`,
    '',
    `**KAUTION:** EUR ${kaution},- (3 Monatsmieten, rueckzahlbar bei Auszug ohne Schadensabzug)`,
    '',
    ...(gruppe === 'C' ? [
      '**WERTSICHERUNG / INDEXANPASSUNG (VPI):**',
      'Die Nettomiete ist wertgesichert gemaess Verbraucherpreisindex VPI 2020.',
      `Jaehrliche Anpassung zum 01.01. an den aktuellen VPI der Statistik Austria.`,
      `Basis-Indexwert: VPI-Stand zum Vertragsabschluss (${startDate}).`,
      'Anpassung erfolgt automatisch ohne gesonderte Kuendigung.',
      '',
    ] : []),
    '**ERHALTUNGSPFLICHTEN (SS 3 MRG):**',
    '',
    'Vermieter traegt die Erhaltung von:',
    '- Dach, Fassade, tragende Waende, Stiegen, Keller, Gemeinschaftsflaechen',
    '- Aussenfenster (Glasscheibe Aussenseite) und Aussentueren',
    '- Zentralheizung, Warmwasserversorgung (Kessel und Leitungen in Waenden)',
    '- Gas-, Wasser-, Stromleitungen innerhalb der Waende',
    '',
    'Mieter traegt die Erhaltung von (SS 8 MRG):',
    '- Innentueren, Griffe, Sperrvorrichtungen, Schloessel',
    '- Lichtschalter, Steckdosen (Installationseinheiten)',
    '- Armaturen (Wasserhahn, Duschkopf, Mischbatterie)',
    '- Dichtungen, Siphons, Abfluesse (Reinigung und Entstopfung)',
    '',
    `**KLEINREPARATURKLAUSEL:**`,
    `Reparaturen bis EUR ${kleinreparaturGrenze},- je Einzelfall: Mieter zustaendig.`,
    `Jaehrliche Gesamtgrenze fuer Kleinreparaturen: EUR ${kleinreparaturJahr},-`,
    'Betroffen: Steckdosen, Lichtschalter, Tuergriffe, Fenstergriffe (innen),',
    'Armaturen, Duschkoepfe, Abfluesse, Dichtungen.',
    'Rohrleitungsschaeden in Waenden und Decken: immer VERMIETER zustaendig.',
    '',
    '**FENSTER UND GLASSCHAEDEN:**',
    ...(gruppe === 'B' ? [
      'Fensterscheiben Aussenseite: VERMIETER (Versicherung Sturmschaden).',
      'Fensterscheiben Innenseite durch Mieter beschaedigt: MIETER zustaendig.',
      'Glasbruch durch Einbruch oder Vandalismus: VERMIETER (Versicherung).',
      'Fenstergriffe (innen): Mieter (Kleinreparatur bis EUR 100,-).',
    ] : [
      'Fensterscheiben Aussenseite: VERMIETER zustaendig.',
      `Fensterscheiben von innen durch Mieter verursacht: MIETER zustaendig.`,
      `Fenstergriffe (innen): Mieter (Kleinreparatur bis EUR ${kleinreparaturGrenze},-).',`,
    ]),
    '',
    '**HEIZUNG UND WARMWASSER:**',
    'Zentralheizungsanlage (Kessel, Hauptleitungen in Waenden): VERMIETER.',
    'Thermostatventile an Heizkoerpern: Mieter (Kleinreparatur).',
    'Heizkoerper selbst (Leck, Defekt): VERMIETER.',
    'Warmwasserboiler (zentral): VERMIETER.',
    'Elektrischer Einzelboiler (vom Mieter selbst eingebaut): MIETER.',
    '',
    '**SCHIMMEL UND FEUCHTIGKEIT:**',
    'Schimmel durch Rohrbruch oder Leitungswasserschaden: VERMIETER / Versicherung.',
    'Schimmel durch Fehllueftung, falsches Heizverhalten des Mieters: MIETER.',
    'Mieter verpflichtet zu regelmaessigem Lueften (mind. 3x taeglich Stossluften).',
    '',
    ...(gruppe === 'D' ? [
      '**PARKETTBODEN:**',
      'Wohnung ist mit Parkettboden ausgestattet.',
      'Mieter verpflichtet zur sachgemaessen Pflege (geeignete Pflegemittel, kein Stehwasser).',
      'Normale Abnutzung durch bestimmungsmaessigen Gebrauch: kein Schadenersatz.',
      'Tiefe Kratzer, Verfaerbungen, Beschaedigungen durch Vernachlaessigung: MIETER ersatzpflichtig.',
      'Bei Auszug: Parkett in ordentlichem gepflegten Zustand zu uebergeben.',
      '',
    ] : []),
    ...(gruppe === 'B' ? [
      '**HAUSTIERHALTUNG:**',
      `Dem Mieter ${vorname} ${nachname} wird die Haltung von 1 (einer) Katze genehmigt.`,
      'Hunde oder weitere Tiere benoetigen gesonderte schriftliche Genehmigung.',
      'Schaeden durch das Tier traegt der Mieter vollstaendig.',
      '',
    ] : [
      '**HAUSTIERHALTUNG:**',
      'Nur mit ausdruecklicher schriftlicher Genehmigung des Vermieters gestattet.',
      '',
    ]),
    '**UNTERVERMIETUNG:** Nur mit schriftlicher Zustimmung des Vermieters.',
    '',
    '**KUENDIGUNG:**',
    gruppe === 'C'
      ? `Befristetes Mietverhaeltnis endet automatisch am ${endeDatum}.`
      : 'Gemaess MRG: mind. 1 Monat Kuendigungsfrist zum Monatsletzten.',
    '',
    '**HAUSORDNUNG:** Nachtruhe 22:00-06:00 Uhr | Muell Mo+Do | Stiegenhaus lt. Plan',
    '',
    `Oberwart, ${today}`,
    `Vermieter: KracherimmoGmbH (Mathias Kracher)    Mieter: ${vorname} ${nachname}`,
  ]

  const filename = `${vorname} ${nachname}.pdf`
  writeFileSync(join(OUTPUT_DIR, filename), createPdf(lines))
  console.log(`Top ${top} Gruppe ${gruppe}: ${filename}`)
}

console.log('\n=== FERTIG ===')
console.log('PDFs heissen "Vorname Nachname.pdf"')
console.log('Bulk-Import liest den Namen aus dem PDF und ordnet automatisch zu.')
