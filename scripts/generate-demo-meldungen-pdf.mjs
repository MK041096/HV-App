/**
 * Generiert 3 anspruchsvolle Mustermeldungen für die Live-Demo als PDF.
 *
 * Coverage:
 *  - Meldung 1: Vermieter + Versicherung greift + Wunschtermin-Pfad
 *  - Meldung 2: Vermieter + komplexe Diagnose + Telefonisch-Pfad
 *  - Meldung 3: Mieter (subtiler Fall der nach Vermieter aussieht) + Ablehnung
 *
 * Output: Desktop/SMARTCARL_Onboarding_Demo_Pack/3_Mustermeldungen.pdf
 *
 * Aufruf: node scripts/generate-demo-meldungen-pdf.mjs
 */

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import os from 'os'

function findDesktopPath() {
  const home = os.homedir()
  const candidates = [
    path.join(home, 'OneDrive', 'Desktop'),
    path.join(home, 'OneDrive - Personal', 'Desktop'),
    path.join(home, 'Desktop'),
  ]
  for (const p of candidates) if (fs.existsSync(p)) return p
  return home
}

const desktop = findDesktopPath()
const packDir = path.join(desktop, 'SMARTCARL_Onboarding_Demo_Pack')
if (!fs.existsSync(packDir)) fs.mkdirSync(packDir, { recursive: true })

const outPath = path.join(packDir, '3_Mustermeldungen.pdf')

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'SMARTCARL — 3 Mustermeldungen für Live-Demo',
    Author: 'SMARTCARL',
    Subject: 'Test-Meldungen mit allen Workflow-Varianten',
  },
})
doc.pipe(fs.createWriteStream(outPath))

const C = {
  primary: '#18181b',
  muted: '#71717a',
  accent: '#2563eb',
  green: '#16a34a',
  red: '#dc2626',
  amber: '#d97706',
  bg: '#f4f4f5',
  border: '#e4e4e7',
}

function h1(text, color = C.accent) {
  doc.moveDown(0.3)
  doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(20).text(text)
  doc.moveDown(0.2)
  doc.strokeColor(color).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.5)
}

function h2(text, color = C.accent) {
  if (doc.y > 720) doc.addPage()
  doc.moveDown(0.5)
  doc.fillColor(color).font('Helvetica-Bold').fontSize(13).text(text)
  doc.moveDown(0.3)
  doc.fillColor(C.primary).font('Helvetica').fontSize(10)
}

function h3(text) {
  if (doc.y > 740) doc.addPage()
  doc.moveDown(0.4)
  doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(11).text(text)
  doc.moveDown(0.2)
  doc.font('Helvetica').fontSize(10)
}

function p(text, opts = {}) {
  doc.fillColor(opts.color || C.primary).font('Helvetica').fontSize(opts.size || 10).text(text, { lineGap: 2, ...opts })
  doc.moveDown(0.3)
}

function bullet(items, opts = {}) {
  doc.font('Helvetica').fontSize(opts.size || 10).fillColor(C.primary)
  for (const item of items) {
    if (doc.y > 760) doc.addPage()
    const y = doc.y
    doc.circle(57, y + 4, 1.8).fill(opts.dotColor || C.accent)
    doc.fillColor(C.primary).text(item, 65, y, { width: 480, lineGap: 2 })
    doc.moveDown(0.2)
  }
  doc.moveDown(0.3)
}

function meldung(num, title, color, kategorie, unterkat, raum, titel, beschreibung, zugang, w1, w2, expectations, demoSteps) {
  doc.addPage()

  // Header
  doc.rect(50, doc.y, 495, 60).fillAndStroke(color, color)
  const headerY = doc.y - 55
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(11).text('MUSTERMELDUNG ' + num, 60, headerY + 8)
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(18).text(title, 60, headerY + 24, { width: 475 })
  doc.moveDown(2)

  // Eingabe-Daten
  h2('Eingabe im Mieter-Portal (zum Reinkopieren)')
  doc.font('Courier').fontSize(9).fillColor(C.primary)
  const data = `Kategorie:        ${kategorie}
Unterkategorie:   ${unterkat}
Raum:             ${raum}
Titel:            ${titel}

Beschreibung:
${beschreibung}

Zugangshinweise:
${zugang}

Wunschtermin 1:   ${w1}
Wunschtermin 2:   ${w2}`
  doc.text(data, { lineGap: 2 })
  doc.moveDown(0.8)

  // CARL-Erwartung
  h2('Was CARL liefern soll', C.amber)
  for (const exp of expectations) {
    if (doc.y > 760) doc.addPage()
    const y = doc.y
    doc.fillColor(C.green).font('Helvetica-Bold').text('✓ ', 60, y, { continued: true })
    doc.fillColor(C.primary).font('Helvetica').fontSize(10).text(exp, { lineGap: 2, width: 480 })
    doc.moveDown(0.15)
  }
  doc.moveDown(0.4)

  // Demo-Schritte
  h2('Demo-Schritte vor Ort', C.green)
  let stepNum = 1
  for (const step of demoSteps) {
    if (doc.y > 760) doc.addPage()
    const y = doc.y
    doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(10).text(stepNum + '.', 60, y, { continued: true })
    doc.fillColor(C.primary).font('Helvetica').text(' ' + step, { lineGap: 2, width: 480 })
    doc.moveDown(0.2)
    stepNum++
  }
}

// ═══════════════════════════════════════════════════════════════════════
// COVER
// ═══════════════════════════════════════════════════════════════════════
doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(34).text('SMARTCARL', { align: 'center' })
doc.moveDown(0.2)
doc.fillColor(C.primary).font('Helvetica').fontSize(16).text('3 Mustermeldungen für die Live-Demo', { align: 'center' })
doc.moveDown(1.5)

doc.fillColor(C.muted).fontSize(11).text('COVERAGE', { align: 'center', characterSpacing: 1 })
doc.moveDown(0.5)
doc.fillColor(C.primary).fontSize(11)
doc.text('✓ Vermieter zuständig (2 Fälle, verschiedene Komplexität)', { align: 'center' })
doc.text('✓ Mieter zuständig (1 Fall — subtil, sieht zuerst nach Vermieter aus)', { align: 'center' })
doc.text('✓ Versicherung greift (Leitungswasser, prüfend)', { align: 'center' })
doc.text('✓ Werkstatt-Pfad: Wunschtermin (Meldung 1)', { align: 'center' })
doc.text('✓ Werkstatt-Pfad: Telefonisch (Meldung 2)', { align: 'center' })
doc.text('✓ HV-Pfad: Ablehnen mit Begründung (Meldung 3)', { align: 'center' })

doc.moveDown(1.5)
doc.strokeColor(C.accent).lineWidth(1).moveTo(150, doc.y).lineTo(445, doc.y).stroke()
doc.moveDown(1)

doc.fillColor(C.muted).fontSize(11).text('CARL-CHALLENGE-LEVEL', { align: 'center', characterSpacing: 1 })
doc.moveDown(0.5)
doc.fillColor(C.primary).fontSize(11)
doc.text('Jede Meldung enthält bewusst Details die CARL fordern —', { align: 'center' })
doc.text('mehrere Versicherungen die greifen könnten, Diagnose-Komplexität,', { align: 'center' })
doc.text('Klassifizierung Mieter vs. Vermieter mit Mietvertrags-§ als Tiebreaker.', { align: 'center' })

doc.moveDown(2)
doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(10).text('Erstellt: 06.05.2026 — für die Demo-Probe und den Live-Termin', { align: 'center' })

// ═══════════════════════════════════════════════════════════════════════
// MELDUNG 1: VERMIETER + VERSICHERUNG + WUNSCHTERMIN
// ═══════════════════════════════════════════════════════════════════════
meldung(
  '1 / 3',
  'Wasseraustritt aus Heizungstherme',
  C.green,
  'Wasserschaden',
  'Sonstiges',
  'Küche',
  'Wasser tritt aus der Heizungstherme aus',
  'Heute Morgen habe ich in der Küche eine Pfütze unter der Heizungstherme entdeckt. Die Therme tropft sichtbar an der unteren rechten Anschlussstelle, ich sehe einen Tropfen ca. alle 10 Sekunden. Die Therme funktioniert noch — Heizung läuft, Warmwasser auch. Ich habe einen Eimer untergestellt und mit einem alten Handtuch den Boden trocken gelegt. Hauptabsperrhahn habe ich nicht zugedreht da die Therme nicht direkt darüber sitzt. Die Therme war schon bei meinem Einzug mitvermietet, ist also nicht meine eigene.',
  'Ich bin heute den ganzen Tag zuhause, klingeln rechts oben (Kracher)',
  'heute 16:00',
  'morgen 09:00',
  [
    'ZUSTÄNDIGKEIT: VERMIETER (mitvermietete Therme = wesentliche Anlage)',
    'RECHTSGRUNDLAGE: MRG § 3 + Mietvertrag (mitvermietete Heizthermen-Klausel)',
    'GEWERK: Installateur (Sanitär-Heizung-Klima / SHK)',
    'WERKSTATT: Pappel Installationen oder ähnlich (Installateur)',
    'VERSICHERUNG: Leitungswasserversicherung Wiener Städtische greift',
    'VERSICHERUNG_KLAUSEL: wörtliches Zitat aus Police (Bruch wasserführender Leitungen)',
    'WERKSTATT_AUFTRAG: rein technisch, ohne Versicherungsgeschwafel',
    'EMPFEHLUNG: an HV gerichtet (Werkstatt beauftragen + Versicherung melden)',
    'MIETVERTRAG_STATUS: AUSGEWERTET (Mietvertrag liegt vor)',
  ],
  [
    'Im Mieter-Portal (Inkognito-Tab) Meldung anlegen — wird SCH-2026-00001',
    'Im HV-Portal CARL-Analyse zeigen, alle 4 Tiles besprechen',
    'Klick auf Rechtsgrundlage-Tile → MRG § 3 Volltext aus RIS einblenden',
    'Klick auf Versicherungs-Tile → PDF mit gelb hervorgehobener Klausel zeigen',
    '"Analyse bestätigen" → Mail-Vorschau-Dialog → eventuell persönliche Notiz hinzufügen',
    '"Senden" → Gmail-Inbox prüfen, Werkstatt-Mail mit 3 Buttons öffnen',
    'In der Werkstatt-Mail: Wunschtermin 1 (heute 16:00) bestätigen',
    'HV-Portal refresh → Status "Termin vereinbart" + grüner Banner im Mieter-Portal',
    '"Schaden behoben — Fall abschließen" klicken → Abschluss-Dialog mit optionalem Rechnung-Upload',
    '"Fall jetzt abschließen" → Status erledigt, Workflow komplett',
  ]
)

// ═══════════════════════════════════════════════════════════════════════
// MELDUNG 2: VERMIETER + KOMPLEXE DIAGNOSE + TELEFONISCH
// ═══════════════════════════════════════════════════════════════════════
meldung(
  '2 / 3',
  'Stromausfall in mehreren Räumen',
  C.amber,
  'Elektrik',
  'Sonstiges',
  'Wohnzimmer',
  'Steckdosen ohne Strom — mehrere Räume betroffen',
  'Seit gestern Abend funktionieren mehrere Steckdosen nicht mehr — im Wohnzimmer alle drei an der Außenwand, im Schlafzimmer eine bei der Tür. Die Lampen funktionieren noch, der Kühlschrank läuft, die Sicherung im Sicherungskasten ist NICHT herausgesprungen — habe nachgesehen, alle Schalter stehen oben. Habe testweise einen Föhn an die Steckdosen angeschlossen, kein Strom. Es war kein Gewitter, kein lautes Geräusch, ich kann mir nicht erklären woher das kommt. In der betroffenen Außenwand verläuft laut Mietvertrag die Hauptleitung.',
  'Ich bin werktags ab 17:00 zu Hause, am Wochenende ganztags',
  'übermorgen 18:00',
  'Samstag 11:00',
  [
    'ZUSTÄNDIGKEIT: VERMIETER (Elektroleitungen in Außenwand = MRG § 3)',
    'RECHTSGRUNDLAGE: MRG § 3 — Erhaltung wesentlicher Anlagen (Elektroinstallation)',
    'GEWERK: Elektriker / Elektrofachbetrieb',
    'WERKSTATT: ADA-Elektro oder ähnlich (Elektriker mit Notfall-Erfahrung)',
    'VERSICHERUNG: Keine direkte (kein Blitzschlag, kein Brand, kein Wasser) — KEINE',
    'VERSICHERUNG_BEGRUENDUNG: kein versichertes Ereignis (kein Sturm, Feuer, Leitungswasser)',
    'WERKSTATT_AUFTRAG: Diagnose und Reparatur eines Stromausfalls in mehreren Steckdosen — keine offensichtliche Ursache, Sicherungen drin geblieben',
    'CARL-Herausforderung: Diagnose ist unklar, Werkstatt wird wahrscheinlich erst telefonieren wollen',
  ],
  [
    'Im Mieter-Portal Meldung anlegen — wird SCH-2026-00002',
    'CARL analysiert — wahrscheinlich VERMIETER, KEINE Versicherung, Elektriker',
    'Versicherungs-Tile bleibt grau (nicht klickbar) — "Keine"',
    'In der Begründungs-Box wird die Versicherungs-Begründung trotzdem angezeigt',
    '"Analyse bestätigen" → Werkstatt-Mail',
    'In der Werkstatt-Mail: Telefonisch-Button drücken (NICHT Wunschtermin!)',
    'Page zeigt Mieter-Telefonnummer an → "Werkstatt ruft an"',
    'HV-Portal: Status "Termin telefonisch", blauer Info-Block',
    'Mieter-Portal: grüner Banner "Werkstatt meldet sich telefonisch — bitte mit Anruf von unbekannter Nummer rechnen"',
    'Live-Demo: nach 1-2 Tagen telefoniert die Werkstatt mit Mieter, vereinbart Termin offline, repariert',
    'HV: "Schaden behoben — Fall abschließen" → Status erledigt',
  ]
)

// ═══════════════════════════════════════════════════════════════════════
// MELDUNG 3: MIETER (SUBTIL) + ABLEHNUNG
// ═══════════════════════════════════════════════════════════════════════
meldung(
  '3 / 3',
  'Wasserhahn in der Küche tropft',
  C.red,
  'Sanitär',
  'Sonstiges',
  'Küche',
  'Wasserhahn am Spülbecken tropft seit ein paar Tagen',
  'Der Wasserhahn beim Spülbecken in der Küche tropft seit ein paar Tagen kontinuierlich. Es kommt etwa alle 2-3 Sekunden ein Tropfen, auch wenn ich den Hahn ganz fest zudrehe. Funktioniert sonst noch — also Warm- und Kaltwasser kommen normal raus wenn ich aufdrehe. Es ist also nur dieses ständige Tropfen das mich stört, vor allem nachts ist es laut. Ich vermute es ist die Dichtung oder die Patrone im Inneren.',
  'Werktags ab 16:30 zu Hause, Wochenende variabel',
  'morgen 17:00',
  'Samstag 10:00',
  [
    'ZUSTÄNDIGKEIT: MIETER (Wasserhahn-Dichtung = klassische Kleinreparatur)',
    'RECHTSGRUNDLAGE: MRG § 8 Abs. 2 + Mietvertrag § 10 (Kleinreparaturklausel)',
    'GEWERK: Installateur (Empfehlung — Mieter beauftragt selbst)',
    'WERKSTATT: Pappel Installationen oder ähnlich (als Empfehlung, nicht als Auftrag)',
    'VERSICHERUNG: Keine (kein versichertes Ereignis)',
    'VERSICHERUNG_BEGRUENDUNG: tropfender Wasserhahn ist Verschleiß, keine Schadenursache',
    'MIETERINFO: freundliche Erklärung an Mieter (Mietvertrag § 10, Kosten unter 100 €)',
    'CARL-Herausforderung: erkennt subtil dass Sanitär nicht automatisch Vermieter ist — Wasserhahn-Dichtung explizit in Mietvertrag § 10 als Kleinreparatur gelistet',
  ],
  [
    'Im Mieter-Portal Meldung anlegen — wird SCH-2026-00003',
    'CARL analysiert — sollte MIETER liefern (rote Box)',
    'Klick auf Rechtsgrundlage-Tile → MRG § 8 Volltext',
    'Im Sheet wird der amber-farbige Hinweis "Mietvertrag § 10 öffnen" angezeigt',
    'Klick auf "Mietvertrag öffnen" → PDF mit § 10 Kleinreparaturklausel sichtbar',
    'Versicherungs-Tile ist nicht klickbar (grau, "Keine")',
    'Im Aktions-Panel: Begründung ist VORBEFÜLLT mit CARL-MIETERINFO',
    '"Ablehnen — Mieter zuständig" klicken',
    'Mieter-Portal refresh → rote Banner-Box: "Hausverwaltung sieht dies als Ihre Zuständigkeit"',
    'Begründung lesbar + CARL-Empfehlung "Falls Sie selbst beauftragen möchten, empfehlen wir [Werkstatt]"',
    'In der HV-Übersicht: Fall erscheint unter "Erledigt" (abgelehnt zählt mit)',
  ]
)

// ═══════════════════════════════════════════════════════════════════════
// LETZTE SEITE: CHECKLISTE + GOLDENE REGEL
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('Test-Checkliste vor der Demo', C.green)

p('Spiele die 3 Meldungen einmal komplett durch BEVOR du zum Termin fährst. Nach jeder Meldung haken: alles wie erwartet?', { color: C.muted, size: 9 })

doc.moveDown(0.5)

const checks = [
  'Meldung 1 — Wasseraustritt Therme',
  '   ☐ CARL liefert VERMIETER + Leitungswasserversicherung',
  '   ☐ Beide Tiles (Rechtsgrundlage + Versicherung) klickbar',
  '   ☐ Werkstatt-Mail kommt in Gmail (+werkstatt) an',
  '   ☐ Wunschtermin-Klick → Status termin_vereinbart',
  '   ☐ Mieter sieht grünen Termin-Banner',
  '   ☐ Abschluss-Dialog öffnet sich + Fall wird erledigt',
  '',
  'Meldung 2 — Stromausfall',
  '   ☐ CARL liefert VERMIETER + Versicherung "Keine" (mit Begründung)',
  '   ☐ Versicherungs-Tile bleibt grau (nicht klickbar)',
  '   ☐ Telefonisch-Klick → Status termin_telefonisch',
  '   ☐ HV sieht blauen Info-Block "Werkstatt meldet sich telefonisch"',
  '   ☐ Mieter-Mail enthält gelben Telefon-Hinweis',
  '   ☐ Abschluss-Dialog auch bei termin_telefonisch verfügbar',
  '',
  'Meldung 3 — Tropfender Wasserhahn',
  '   ☐ CARL liefert MIETER (subtiler Fall, KEIN Auto-Vermieter)',
  '   ☐ Mietvertrag § 10 wird im Sheet referenziert',
  '   ☐ Mieter-Begründung ist vorbefüllt',
  '   ☐ Ablehn-Mail kommt mit Werkstatt-Empfehlung',
  '   ☐ Mieter-Portal zeigt rote Box mit Begründung',
  '   ☐ HV-Übersicht: Fall unter "Erledigt"',
]

doc.font('Helvetica').fontSize(10).fillColor(C.primary)
for (const line of checks) {
  doc.text(line, { lineGap: 3 })
}

doc.moveDown(2)
doc.rect(50, doc.y, 495, 90).fillAndStroke('#fef3c7', '#fbbf24')
const mantraY = doc.y - 85
doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(11).text('GOLDENE REGEL FÜR DIE DEMO', 60, mantraY + 10)
doc.fillColor('#92400e').font('Helvetica').fontSize(10).text(
  'Nach jeder Meldung kurz pausieren und sagen: "Was Sie hier gerade gesehen haben — ' +
  'CARL hat in 5 Sekunden eine juristische Bewertung gemacht, die mich früher 15 Minuten Recherche ' +
  'gekostet hat. Bei drei Meldungen pro Tag sparen Sie über eine Stunde Sachbearbeiterzeit. Bei 200 Einheiten ' +
  'rentiert sich SMARTCARL ab dem ersten Monat."',
  60, mantraY + 28, { width: 475, lineGap: 2 }
)

doc.end()

console.log('✓ PDF erstellt: ' + outPath)
