/**
 * Generiert SMARTCARL Demo-Plan als PDF.
 * Output: Desktop (OneDrive falls vorhanden, sonst Standard-Desktop)
 *
 * Aufruf: node scripts/generate-demo-plan-pdf.mjs
 */

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import os from 'os'

// ── Output-Pfad: OneDrive Desktop bevorzugt, sonst Standard-Desktop ─────
function findDesktopPath() {
  const home = os.homedir()
  const candidates = [
    path.join(home, 'OneDrive', 'Desktop'),
    path.join(home, 'OneDrive - Personal', 'Desktop'),
    path.join(home, 'Desktop'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return home
}

const desktop = findDesktopPath()
const outPath = path.join(desktop, 'SMARTCARL_Demo_Plan.pdf')

// ── PDF-Setup ──────────────────────────────────────────────────────────
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'SMARTCARL Live-Demo Plan',
    Author: 'SMARTCARL',
    Subject: 'Demo-Plan für Live-Präsentation bei der Hausverwaltung',
  },
})

doc.pipe(fs.createWriteStream(outPath))

// ── Farben ─────────────────────────────────────────────────────────────
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

// ── Layout-Helpers ─────────────────────────────────────────────────────
function h1(text) {
  doc.moveDown(0.3)
  doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(20).text(text)
  doc.moveDown(0.2)
  doc.strokeColor(C.accent).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.5)
}

function h2(text) {
  if (doc.y > 720) doc.addPage()
  doc.moveDown(0.5)
  doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(13).text(text)
  doc.moveDown(0.3)
  doc.fillColor(C.primary).font('Helvetica').fontSize(11)
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

function quote(text) {
  doc.moveDown(0.2)
  const yStart = doc.y
  const x = 60
  doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(10).text('„' + text + '"', x, yStart, { width: 480, lineGap: 2 })
  // Linker Akzent-Strich
  const yEnd = doc.y
  doc.strokeColor(C.accent).lineWidth(3).moveTo(50, yStart).lineTo(50, yEnd).stroke()
  doc.moveDown(0.4)
}

function bullet(items, opts = {}) {
  doc.font('Helvetica').fontSize(opts.size || 10).fillColor(C.primary)
  for (const item of items) {
    if (doc.y > 760) doc.addPage()
    const y = doc.y
    doc.circle(57, y + 4, 1.8).fill(C.accent)
    doc.fillColor(C.primary).text(item, 65, y, { width: 480, lineGap: 2 })
    doc.moveDown(0.2)
  }
  doc.moveDown(0.3)
}

function box(title, contentFn, color = C.bg) {
  if (doc.y > 660) doc.addPage()
  const yStart = doc.y
  const padding = 12
  doc.rect(50, yStart, 495, 0).fillAndStroke(color, C.border)
  doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8).text(title.toUpperCase(), 50 + padding, yStart + padding, { characterSpacing: 0.5 })
  doc.moveDown(0.3)
  doc.fillColor(C.primary).font('Helvetica').fontSize(10)
  contentFn()
  const yEnd = doc.y + padding
  // Re-render box with correct height
  const realHeight = yEnd - yStart
  doc.save()
  doc.rect(50, yStart, 495, realHeight).fillAndStroke(color, C.border)
  doc.restore()
  // Re-render content on top
  doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8).text(title.toUpperCase(), 50 + padding, yStart + padding, { characterSpacing: 0.5 })
  doc.moveDown(0.3)
  doc.fillColor(C.primary).font('Helvetica').fontSize(10)
  contentFn()
  doc.moveDown(0.5)
}

function tableRow(cells, isHeader = false) {
  if (doc.y > 760) doc.addPage()
  const colW = [50, 445]
  const x = 50
  const y = doc.y
  if (isHeader) {
    doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(9)
  } else {
    doc.fillColor(C.primary).font('Helvetica').fontSize(10)
  }
  let xPos = x
  cells.forEach((c, i) => {
    doc.text(c, xPos + 4, y + 4, { width: colW[i] - 8 })
    xPos += colW[i]
  })
  doc.moveDown(0.5)
  doc.strokeColor(C.border).lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.2)
}

function spickRow(label, value) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.muted).text(label, 50, doc.y, { continued: false, width: 100 })
  const labelY = doc.y - 11
  doc.font('Courier').fontSize(10).fillColor(C.primary).text(value, 155, labelY, { width: 390 })
  doc.moveDown(0.3)
}

// ═══════════════════════════════════════════════════════════════════════
// COVER / TITEL
// ═══════════════════════════════════════════════════════════════════════
doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(34).text('SMARTCARL', { align: 'center' })
doc.moveDown(0.2)
doc.fillColor(C.primary).font('Helvetica').fontSize(16).text('Live-Demo Plan', { align: 'center' })
doc.moveDown(0.5)
doc.fillColor(C.muted).fontSize(11).text('Plan für die Live-Präsentation bei der Hausverwaltung', { align: 'center' })
doc.moveDown(0.3)
doc.fontSize(10).text('Erstellt: 06.05.2026', { align: 'center' })

doc.moveDown(2)
doc.strokeColor(C.accent).lineWidth(1).moveTo(150, doc.y).lineTo(445, doc.y).stroke()
doc.moveDown(1)

// Inhalt
doc.fillColor(C.muted).fontSize(11).text('INHALT', { align: 'center', characterSpacing: 1 })
doc.moveDown(0.5)
doc.fillColor(C.primary).fontSize(11).text('1. Vorbereitung (15 Min vor Termin)', { align: 'center' })
doc.text('2. Demo-Ablauf (ca. 20 Min)', { align: 'center' })
doc.text('3. Test-Meldungen zum Reinkopieren', { align: 'center' })
doc.text('4. Verkaufsargumente & Pricing', { align: 'center' })
doc.text('5. Backup-Plan', { align: 'center' })
doc.text('6. Spickzettel', { align: 'center' })

// ═══════════════════════════════════════════════════════════════════════
// SEITE 2: VORBEREITUNG
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('1. Vorbereitung — 15 Min vor Termin')

bullet([
  'Browser öffnen mit DREI Tabs:',
])
doc.moveDown(-0.2)
doc.font('Helvetica').fontSize(10).fillColor(C.primary)

// Sub-bullets
const subBullets = [
  'Tab A (HV-Portal): smartcarl.com/dashboard — eingeloggt mit kracherdigital+hv@gmail.com',
  'Tab B (Inkognito-Fenster, Mieter): smartcarl.com/mein-bereich — eingeloggt mit kracherdigital+mieter@gmail.com',
  'Tab C (Gmail): mail.google.com — eingeloggt mit kracherdigital@gmail.com',
]
for (const item of subBullets) {
  if (doc.y > 760) doc.addPage()
  const y = doc.y
  doc.fillColor(C.muted).text('—', 70, y)
  doc.fillColor(C.primary).text(item, 85, y, { width: 460, lineGap: 2 })
  doc.moveDown(0.25)
}

doc.moveDown(0.3)
bullet([
  'Hard-Reload in jedem Tab (Strg + Shift + R) — frischer Code geladen',
  'Gmail-Filter testen: in Suchleiste "to:smartcarldemo" eintippen — leerer Filter ist OK',
  'HV-Dashboard als Startansicht offen lassen',
  'Diesen Demo-Plan ausgedruckt oder am zweiten Bildschirm bereithalten',
])

doc.moveDown(0.3)

// ═══════════════════════════════════════════════════════════════════════
// SEITE 3-4: DEMO-ABLAUF
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('2. Demo-Ablauf')

// Phase 1
h2('Phase 1 — Einstieg & Übersicht (3 Min)')
quote('Was Sie hier sehen ist SMARTCARL — eine Software speziell für Hausverwaltungen. Kernidee: jede Schadensmeldung wird vom Mieter selbst erfasst, KI macht die juristische Vor-Analyse, und Sie als Sachbearbeiter brauchen für die Bearbeitung MAXIMAL 3 KLICKS statt 20 Minuten manueller Arbeit.')

h3('Was du zeigst:')
bullet([
  'Dashboard mit Onboarding-Cards',
  'Liegenschaften (eine angelegte Einheit)',
  'Werkstätten — "25 Wiener Werkstätten, KI hat sie automatisch eingeordnet"',
  'Versicherungen — "Polizzen sind hochgeladen, das System kennt jede Klausel"',
])

h3('USPs nebenher betonen:')
bullet([
  'Multi-Tenant (mehrere Hausverwaltungen, Daten 100% getrennt)',
  'EU-Hosting, DSGVO-konform',
  'Mobile-fähig (responsive Design)',
])

// Phase 2
doc.addPage()
h2('Phase 2 — Live-Test 1: Klassischer Vermieter-Fall (8 Min)')

quote('Jetzt zeige ich Ihnen wie eine echte Schadensmeldung abläuft. Ich gehe zuerst in die Mieter-Sicht.')

h3('Im Mieter-Portal (Tab B) eine Meldung anlegen:')
p('Test-Meldung: Wasserschaden — Daten siehe Abschnitt 3 unten.')

h3('Im HV-Portal (Tab A) zeigen:')
bullet([
  'CARL-Analyse mit allen 4 Tiles (Zuständigkeit, Rechtsgrundlage, Versicherung, Empfehlung)',
  'Klick auf Rechtsgrundlage-Tile → MRG § 3 Volltext aus RIS',
  'Klick auf Versicherungs-Tile → Police-PDF mit markierter Klausel',
  '"Die HV kann jede CARL-Aussage in einem Klick verifizieren — das ist Vertrauen."',
  'Klick "Analyse bestätigen" → Mail-Vorschau-Dialog öffnet sich',
  '"Hier kann ich noch eine persönliche Notiz hinzufügen"',
  'Klick "Senden"',
])

h3('In Gmail (Tab C) zeigen:')
bullet([
  'Werkstatt-Mail mit 3 Termin-Buttons',
  'Mieter-Mail "Schaden bestätigt"',
  'HV-Notification-Mail (war schon vorher da)',
  'Klick auf Wunschtermin 1 in der Werkstatt-Mail',
])

h3('Status-Update demonstrieren:')
bullet([
  'Tab A refresh → Status "Termin vereinbart"',
  'Tab B refresh → Mieter sieht prominenten grünen Termin-Banner',
])

quote('Was Sie gerade gesehen haben: Mieter meldet, KI analysiert, ich bestätige mit einem Klick, Werkstatt bekommt den Auftrag, alle bleiben informiert. Das war EIN KLICK von der HV. Bei einem klassischen ERP-System wären das jetzt mindestens 6 manuelle Schritte gewesen.')

// Phase 3
doc.addPage()
h2('Phase 3 — Live-Test 2: Mieter-Fall (4 Min)')

h3('Im Mieter-Portal (Tab B) neue Meldung anlegen:')
p('Test-Meldung: Türgriff — Daten siehe Abschnitt 3 unten.')

h3('Im HV-Portal (Tab A) zeigen:')
bullet([
  'CARL: ZUSTÄNDIGKEIT = MIETER (rote Box)',
  'Klick auf Rechtsgrundlage → MRG § 8',
  'Klick auf "Mietvertrag öffnen" im Sheet',
  '"Hier sieht die HV in Sekunden ob der Mietvertrag den Mieter wirklich verpflichtet — Kleinreparaturklausel § 10."',
  'Begründungsfeld: vorbefüllt mit CARL-MIETERINFO',
  'Klick "Ablehnen — Mieter zuständig"',
])

h3('Im Mieter-Portal (Tab B):')
bullet([
  'Rote Box "Hausverwaltung sieht dies als Ihre Zuständigkeit"',
  'Begründung lesbar + Werkstatt-Empfehlung als Hilfe',
  '"Der Mieter weiß sofort warum, und kann die Sache selbst regeln — kein Telefonat, keine E-Mail-Wechsel."',
])

// Phase 4
h2('Phase 4 — Highlights die du noch zeigst (3 Min)')
tableRow(['', 'WO ZEIGEN'], true)
tableRow(['CARL liest Mietverträge', 'Detail-Page → MIETVERTRAG_HINWEIS-Box'])
tableRow(['Versicherungs-Klausel automatisch', 'Versicherungs-Sheet → gelbe Zitat-Box'])
tableRow(['Werkstatt-Pool mit KI-Profilen', '/dashboard/werkstaetten → eine anklicken'])
tableRow(['Versicherungsschadenblatt', 'Abschluss-Dialog → "Versicherungsblatt erstellen"'])
tableRow(['Mobile-fähig', 'Browser-Fenster schmal ziehen'])

// ═══════════════════════════════════════════════════════════════════════
// SEITE 5: TEST-MELDUNGEN
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('3. Test-Meldungen zum Reinkopieren')

h2('Meldung 1 — Wasserschaden (Vermieter-Fall)')
doc.font('Courier').fontSize(9).fillColor(C.primary)
const m1 = `Kategorie:        Wasserschaden
Unterkategorie:   Rohrbruch / undichtes Rohr
Raum:             Badezimmer
Titel:            Wasseraustritt unter dem Waschbecken

Beschreibung:
Seit gestern Abend tropft es unter dem Waschbecken im
Bad. Heute Morgen war eine kleine Pfütze auf dem Boden.
Das Wasser kommt aus dem Eckventil, das in der Wand
verbaut ist. Hauptabsperrhahn habe ich zugedreht.

Zugangshinweise:
Klingel rechts oben (Kracher), bitte 10 Min vorher
anrufen

Wunschtermin 1:   morgen 09:00
Wunschtermin 2:   übermorgen 14:00`
doc.text(m1, { lineGap: 2 })
doc.moveDown(1)

h2('Meldung 2 — Türgriff (Mieter-Fall)')
doc.font('Courier').fontSize(9).fillColor(C.primary)
const m2 = `Kategorie:        Fenster & Türen
Unterkategorie:   Griff defekt
Raum:             Schlafzimmer
Titel:            Innentürgriff abgebrochen

Beschreibung:
Beim Schließen ist der Griff der Schlafzimmertür
komplett abgebrochen. Die Tür lässt sich noch öffnen,
aber ohne Griff. Es scheint die Mechanik im Griff
selbst zu sein.

Zugangshinweise:
Bin Mo-Fr ab 17 Uhr da

Wunschtermine:    nächste Woche Mo + Mi je 17:30`
doc.text(m2, { lineGap: 2 })

// ═══════════════════════════════════════════════════════════════════════
// SEITE 6: VERKAUFSARGUMENTE
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('4. Verkaufsargumente & Pricing')

h2('Wenn die HV fragt: "Was kostet das?"')
bullet([
  'Einrichtungsgebühr: 699 € einmalig (oder 349 € als Gründungskunde)',
  'Laufend: 1 € / Einheit / Monat (Gründungskunde: 0,50 €)',
  'Bei Jahresabo: 0,85 € / Einheit / Monat (Gründungskunde: 0,43 €)',
  '30-Tage Geld-zurück-Garantie — kein Risiko',
])

h2('Wenn die HV fragt: "Was bringt mir das konkret?"')
bullet([
  'Pro Schadensmeldung: 17 Minuten gespart (3 statt 20 Minuten)',
  'Bei 200 Einheiten und ~5 Meldungen/Monat = 17 Stunden/Monat eingespart',
  'Bei 30 €/Stunde Sachbearbeiter-Kosten = 510 €/Monat Ersparnis',
  'Demgegenüber: ~200 €/Monat App-Kosten — über 300 €/Monat Netto-Gewinn',
])

h2('Wenn die HV zögert')
quote('Ich brauche jetzt nicht heute eine Entscheidung. Probieren Sie\'s einfach 30 Tage aus — wenn Sie nicht zufrieden sind, bekommen Sie alles zurück. Sie haben buchstäblich kein Risiko.')

p('Anbieten: kostenlose Einrichtung für die ersten 3 Pilotkunden — sie helfen dir bei der Optimierung, dafür sparen sie 699 €.')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 7: BACKUP-PLAN
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('5. Backup-Plan — Falls etwas schiefgeht')

const backups = [
  ['Werkstatt-Mail kommt nicht in 30 Sek an', '"Bei Gmail manchmal ein paar Sekunden Verzögerung — der Code läuft aber bereits, Sie sehen den Status hier." → Tab A zeigen, Status ist gesetzt'],
  ['CARL macht falschen Verdict', '"Neu analysieren"-Button rechts unten in der CARL-Box klicken. CARL liefert deterministisch, einfache Korrektur möglich.'],
  ['Browser hängt', 'Tab schließen + neu öffnen, eingeloggt bleibt. Strg+Shift+R für Hard-Reload.'],
  ['Live-Verbindung weg', 'Zur Not weiter mit Powerpoint-Slides oder Screenshots — App-Idee verkauft sich auch ohne Live-Demo.'],
  ['HV findet einen Bug', '"Genau dafür suche ich Pilotkunden — wenn Sie mir das melden, fixe ich es noch heute. So wird die App zu IHRER perfekten Lösung."'],
]

doc.font('Helvetica').fontSize(10)
for (const [problem, solution] of backups) {
  if (doc.y > 720) doc.addPage()
  doc.fillColor(C.red).font('Helvetica-Bold').fontSize(11).text('⚠ ' + problem)
  doc.moveDown(0.2)
  doc.fillColor(C.primary).font('Helvetica').fontSize(10).text(solution, { lineGap: 2 })
  doc.moveDown(0.6)
}

// ═══════════════════════════════════════════════════════════════════════
// SEITE 8: SPICKZETTEL
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('6. Spickzettel')
p('Diese Seite ausschneiden oder am zweiten Bildschirm offen halten.', { color: C.muted, size: 9 })
doc.moveDown(0.5)

h2('Logins')
doc.font('Courier').fontSize(11).fillColor(C.primary)
doc.text('HV-Portal:', 50, doc.y, { continued: true })
doc.fillColor(C.accent).text('  kracherdigital+hv@gmail.com')
doc.fillColor(C.primary).text('Mieter-Portal:', { continued: true })
doc.fillColor(C.accent).text('  kracherdigital+mieter@gmail.com')
doc.fillColor(C.muted).fontSize(9).font('Helvetica').text('(Passwort: wie bisher)', { align: 'left' })
doc.moveDown(1)

h2('Top 3 USPs (in 30 Sek erklärt)')
doc.font('Helvetica-Bold').fontSize(11).fillColor(C.green).text('1. ', { continued: true })
doc.font('Helvetica').fillColor(C.primary).text('3 Klicks statt 20 Minuten pro Schaden')
doc.font('Helvetica-Bold').fontSize(11).fillColor(C.green).text('2. ', { continued: true })
doc.font('Helvetica').fillColor(C.primary).text('KI versteht Mietrecht (MRG, ABGB) automatisch')
doc.font('Helvetica-Bold').fontSize(11).fillColor(C.green).text('3. ', { continued: true })
doc.font('Helvetica').fillColor(C.primary).text('Versicherungs-Klausel wird wörtlich aus Police zitiert')

doc.moveDown(1)

h2('Pricing-Eckdaten')
doc.font('Helvetica').fontSize(11).fillColor(C.primary)
doc.text('• Einrichtung: 699 €  /  Gründungskunde: 349 €')
doc.text('• Monatlich:   1 € pro Einheit  /  Gründungskunde: 0,50 €')
doc.text('• Jahresabo:  0,85 € pro Einheit  /  Gründungskunde: 0,43 €')
doc.text('• 30 Tage Geld-zurück-Garantie')

doc.moveDown(1.5)

// ── Demo-Mantra ────────────────────────────────────────────────────────
doc.rect(50, doc.y, 495, 80).fillAndStroke('#fef3c7', '#fbbf24')
const mantraY = doc.y - 75
doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(11).text('GOLDENE REGEL FÜR DIE DEMO', 60, mantraY + 10)
doc.fillColor('#92400e').font('Helvetica').fontSize(10).text(
  'Verkaufe nicht die Software — verkaufe die GESCHICHTE: ' +
  'Der HV-Sachbearbeiter hat Feierabend-Stress. Mit dem alten System: morgen früh manuell Tools öffnen, ' +
  'Formulare ausfüllen, anrufen. Mit SMARTCARL: 1× "Analyse bestätigen", Werkstatt informiert, Mieter informiert, Feierabend.',
  60, mantraY + 28, { width: 475, lineGap: 2 }
)

// Footer Cover
doc.moveDown(3)
doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(10).text('Viel Erfolg!', { align: 'center' })

// ── Finalisieren ───────────────────────────────────────────────────────
doc.end()

console.log('✓ PDF erstellt: ' + outPath)
