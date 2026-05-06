/**
 * Generiert HV-Bedarfsanalyse Fragen-Pack als PDF.
 * Output: Desktop/SMARTCARL_Onboarding_Demo_Pack/HV_Fragen_Bedarfsanalyse.pdf
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
const outPath = path.join(packDir, 'HV_Fragen_Bedarfsanalyse.pdf')

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'SMARTCARL — Fragen für das erste HV-Gespräch',
    Author: 'SMARTCARL',
  },
})
doc.pipe(fs.createWriteStream(outPath))

const C = {
  primary: '#18181b',
  muted: '#71717a',
  accent: '#2563eb',
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
  bg: '#f4f4f5',
  border: '#e4e4e7',
}

function h1(text) {
  doc.moveDown(0.3)
  doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(20).text(text)
  doc.moveDown(0.2)
  doc.strokeColor(C.accent).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.5)
}

function h2(text, color = C.accent) {
  if (doc.y > 720) doc.addPage()
  doc.moveDown(0.5)
  doc.fillColor(color).font('Helvetica-Bold').fontSize(13).text(text)
  doc.moveDown(0.3)
  doc.fillColor(C.primary).font('Helvetica').fontSize(10)
}

function p(text, opts = {}) {
  doc.fillColor(opts.color || C.primary).font(opts.font || 'Helvetica').fontSize(opts.size || 10).text(text, { lineGap: 2, ...opts })
  doc.moveDown(0.3)
}

// Frage mit "Was du rauskriegst" als Sub-Text
function frage(num, text, hinweis) {
  if (doc.y > 740) doc.addPage()
  const y = doc.y
  doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(11).text(num + '.', 50, y, { continued: true })
  doc.fillColor(C.primary).text('  ' + text, { lineGap: 2 })
  if (hinweis) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(C.muted).text('   → ' + hinweis, { lineGap: 2 })
  }
  doc.moveDown(0.3)
}

// Argumentations-Hebel: was du sagst wenn die HV etwas zugibt
function hebel(text) {
  if (doc.y > 720) doc.addPage()
  doc.moveDown(0.2)
  const yStart = doc.y
  doc.font('Helvetica-Oblique').fontSize(9).fillColor('#92400e')
  const padding = 8
  const innerWidth = 495 - padding * 2
  const textH = doc.heightOfString('💡 SMARTCARL-Hebel: ' + text, { width: innerWidth, lineGap: 2 })
  const totalH = padding * 2 + textH
  doc.rect(50, yStart, 495, totalH).fillAndStroke('#fef3c7', '#fbbf24')
  doc.fillColor('#92400e').font('Helvetica-Oblique').fontSize(9)
    .text('💡 SMARTCARL-Hebel: ' + text, 50 + padding, yStart + padding, { width: innerWidth, lineGap: 2 })
  doc.y = yStart + totalH
  doc.moveDown(0.5)
}

// ═══════════════════════════════════════════════════════════════════════
// COVER
// ═══════════════════════════════════════════════════════════════════════
doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(34).text('SMARTCARL', { align: 'center' })
doc.moveDown(0.2)
doc.fillColor(C.primary).font('Helvetica').fontSize(16).text('Fragen für das erste HV-Gespräch', { align: 'center' })
doc.moveDown(0.5)
doc.fillColor(C.muted).fontSize(11).text('Bedarfsanalyse-Leitfaden — alles rausholen, gezielt argumentieren', { align: 'center' })

doc.moveDown(2)
doc.strokeColor(C.accent).lineWidth(1).moveTo(150, doc.y).lineTo(445, doc.y).stroke()
doc.moveDown(1)

doc.fillColor(C.muted).fontSize(11).text('STRATEGIE', { align: 'center', characterSpacing: 1 })
doc.moveDown(0.5)
doc.fillColor(C.primary).fontSize(11)
doc.text('Erst zuhören, dann verkaufen.', { align: 'center' })
doc.text('70% Fragen, 30% Lösung präsentieren.', { align: 'center' })
doc.text('Schmerzpunkte sammeln — DAVON profitiert dein Pitch.', { align: 'center' })

doc.moveDown(1.5)
doc.fillColor(C.muted).fontSize(11).text('INHALT', { align: 'center', characterSpacing: 1 })
doc.moveDown(0.5)
doc.fillColor(C.primary).fontSize(11)
doc.text('1. IST-Zustand: Wie läuft es heute?', { align: 'center' })
doc.text('2. Schadensmeldung-Workflow im Detail', { align: 'center' })
doc.text('3. Zeit & Kosten — der ROI-Hebel', { align: 'center' })
doc.text('4. Werkstatt-Management', { align: 'center' })
doc.text('5. Versicherungsabwicklung', { align: 'center' })
doc.text('6. Mieter-Beziehung', { align: 'center' })
doc.text('7. Schmerzpunkte aufdecken', { align: 'center' })
doc.text('8. Vision & Erwartungen', { align: 'center' })
doc.text('9. Entscheidungs-Fragen', { align: 'center' })
doc.text('10. Konkurrenz-Check', { align: 'center' })
doc.text('11. Closer & Notiz-Hinweise', { align: 'center' })

doc.moveDown(2.5)
doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(9).text('Erstellt: 06.05.2026 — Print + Block + Stift mitnehmen, mitschreiben!', { align: 'center' })

// ═══════════════════════════════════════════════════════════════════════
// SEITE 2: IST-ZUSTAND
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('1. IST-Zustand: Wie läuft es heute?')

p('Open-Door-Fragen — lass den GF erzählen. Mit-schreiben!', { color: C.muted })

frage('1.1', 'Wie viele Einheiten verwalten Sie aktuell?',
  'Wichtig für ROI-Rechnung. Bei 200+ wird SMARTCARL günstig, bei 50 musst du anders argumentieren.')

frage('1.2', 'Wie viele Mitarbeiter haben Sie insgesamt? Davon wie viele in der Sachbearbeitung?',
  'Bei kleinen HVs (1-3 MA) → "Ich entlaste Sie persönlich". Bei großen (10+) → "skalieren ohne Personalaufstockung".')

frage('1.3', 'Wie viele Schadensmeldungen kommen pro Monat rein? Saisonal unterschiedlich?',
  'Wenn 50+ → großer Hebel. Saison: Heizung Oktober-Februar = Stoßzeit, da brennts.')

frage('1.4', 'Auf welchen Wegen kommen Meldungen rein? Telefon, Mail, WhatsApp, persönlich?',
  'Je mehr Kanäle desto chaotischer. WhatsApp + persönlich = riesiger Verlust-Risiko.')

frage('1.5', 'Welche Software nutzen Sie aktuell für die Abwicklung? Excel, Outlook, Immoware, Domus?',
  'Excel = Goldgrube. Domus/Immoware = teurere Konkurrenz, du musst klar sein wo SMARTCARL ergänzt.')

frage('1.6', 'Wer ist die erste Anlaufstelle wenn ein Mieter anruft?',
  'Sekretärin, Sachbearbeiterin, GF? Das ist die Person die du als Champion gewinnen musst.')

hebel('Wenn HV mehrere Eingangs-Kanäle nennt: "Bei SMARTCARL kommen ALLE Meldungen über ein einziges Portal — der Mieter kann nicht mehr zu 5 verschiedenen Stellen anrufen, alles ist zentral."')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 3: WORKFLOW IM DETAIL
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('2. Schadensmeldung-Workflow im Detail')

p('Hier merkt der GF wie aufwendig sein eigener Prozess ist — wenn er es Schritt für Schritt erklärt:', { color: C.muted })

frage('2.1', 'Können Sie mir den Workflow von einer typischen Schadensmeldung beschreiben — von Anruf bis Erledigung?',
  'Lass ihn ALLES erzählen, unterbrich nicht. Notiere jeden Schritt — gleich gibts Argumentations-Material.')

frage('2.2', 'Wie lange dauert es im Schnitt vom Anruf des Mieters bis ein Termin steht?',
  'Wenn 2-3 Tage = normal. Wenn 1 Woche+ = riesiger Hebel. SMARTCARL: < 1 Stunde.')

frage('2.3', 'Wie viele Telefonate sind im Schnitt nötig pro Schaden?',
  'Realistisch sind 4-8: Mieter ruft an → Sachb. ruft Werkstatt → Werkstatt ruft Mieter → Bestätigung an HV → Rückfrage Mieter → ... Each = ~5 Min Zeit.')

frage('2.4', 'Was passiert wenn der Sachbearbeiter im Urlaub oder krank ist?',
  'Vertretung übernimmt? Werden Schäden liegen? Antworten zeigen organisatorische Schwachstellen.')

frage('2.5', 'Wie wird der Status eines Falls dokumentiert? Notizbuch, Excel, E-Mail-Suche?',
  'Wenn "E-Mail-Postfach" oder "ich erinnere mich" → das ist Audit-Risiko. SMARTCARL hat lückenlosen Verlauf.')

frage('2.6', 'Wenn ein Mieter nachfragt "wie ist der Stand?", wie schnell können Sie ihm Auskunft geben?',
  'Wenn 30 Min Recherche → Argument. Wenn "sofort" → woher? Excel? Aufwendig zu pflegen!')

frage('2.7', 'Gibt es Fälle wo etwas vergessen wurde oder durch die Maschen gefallen ist?',
  'Hier wird er ehrlich. Zumindest 1-2 Anekdoten kommen — DAS ist dein Story-Stoff!')

hebel('Wenn HV 4+ Telefonate pro Schaden nennt: "Bei 50 Schäden im Monat sind das 200+ Telefonate — also 16 Stunden reines Telefonieren. Mit SMARTCARL: 0. Werkstatt klickt einen Mail-Button, fertig."')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 4: ZEIT & KOSTEN — ROI-HEBEL
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('3. Zeit & Kosten — der ROI-Hebel')

p('Zahlen sammeln für die Wirtschaftlichkeitsrechnung am Ende:', { color: C.muted })

frage('3.1', 'Was kostet eine Sachbearbeiter-Stunde brutto bei Ihnen?',
  'Branchenschnitt: 30-50 €. Wenn er es nicht weiß, sage "üblich sind 35 €" — dann hat er einen Anker.')

frage('3.2', 'Wie viel Zeit (in Minuten) verbringt eine Sachbearbeiterin pro Schadensmeldung — von Annahme bis Akte abgelegt?',
  'Realistisch 15-30 Minuten. Wenn nur 5 → er unterschätzt. Wenn 60+ → riesiger Hebel.')

frage('3.3', 'Wie viel Zeit pro Woche geht für reine Werkstatt-Koordination drauf?',
  'Versuchen anzuregen: "anrufen, Termin vereinbaren, Mieter informieren, nachhaken..." — er wird auf 5-10h kommen.')

frage('3.4', 'Wenn Sie eine Stunde am Tag pro Sachbearbeiter sparen würden — wäre das spürbar?',
  'Antwort ist immer "JA". Damit hast du Konsens auf der Wertfrage.')

frage('3.5', 'Gab es schon mal Versicherungs-Probleme weil eine Frist verpasst wurde?',
  'Goldnugget. Wenn ja → SMARTCARL erinnert proaktiv an Meldefristen.')

frage('3.6', 'Wie viele Beschwerden bekommen Sie pro Monat von Mietern bezüglich Schadensbearbeitung?',
  'Wenn 5+ → erheblich. Argument: zufriedene Mieter = weniger Fluktuation = weniger Leerstand.')

frage('3.7', 'Wenn ein Mieter im Notfall (Wasserrohrbruch um 22 Uhr) anruft — wer übernimmt? Privat-Handy?',
  'Riesiger Pain-Point. SMARTCARL: Mieter erfasst online, Notdienst-Werkstatt wird gleich informiert.')

hebel('Wenn HV sagt "30 Min pro Schaden, 60 Schäden/Monat, 35 €/h": Rechne LIVE vor: 30 Std × 35 € = 1.050 € pro Monat. SMARTCARL kostet bei 200 Einheiten: 200 €. Netto-Ersparnis: 850 €/Monat = 10.200 €/Jahr.')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 5: WERKSTATT-MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('4. Werkstatt-Management')

frage('4.1', 'Mit wie vielen Werkstätten arbeiten Sie regelmäßig zusammen?',
  '5-15 ist normal. Wenn fester Pool: SMARTCARL importiert das. Wenn ad-hoc: SMARTCARL hilft beim Aufbau.')

frage('4.2', 'Wie wählen Sie aus welche Werkstatt Sie für einen konkreten Schaden anrufen?',
  '"Aus Erfahrung" → KI macht das objektiv. "Wer gerade Zeit hat" → Optimierung möglich.')

frage('4.3', 'Wie sind die Reaktionszeiten Ihrer Werkstätten? Antwortet jede innerhalb von 24h?',
  'Nein! Werkstätten sind notorisch slow. SMARTCARL: 3-Button-Mail = sofort.')

frage('4.4', 'Was ist Ihre größte Frustration im Umgang mit Werkstätten?',
  'Goldfrage. Antworten: vergessen Termine, melden sich nicht, schreiben falsche Rechnungen, etc.')

frage('4.5', 'Wie dokumentieren Sie welche Werkstatt für welches Gewerk geeignet ist?',
  'Im Kopf? Excel? SMARTCARL hat KI-klassifizierte Werkstätten mit Spezialisierungs-Tags.')

frage('4.6', 'Bezahlen Sie Werkstätten direkt oder läuft das über die Versicherung?',
  'Beides je nach Schadensart. Wichtig zu wissen weil das den Workflow beeinflusst.')

frage('4.7', 'Gab es schon Werkstätten die Sie aussortieren mussten? Warum?',
  'Pünktlichkeit, Qualität, Preis, Rechnungsfehler — jede Antwort gibt dir mehr Pain-Points.')

hebel('Wenn HV "wir rufen meistens Werkstatt X an": "Genau das macht CARL automatisch — bei 200 Einheiten kommt es darauf an die richtige Werkstatt für den richtigen Schaden zu wählen, nicht immer nur Notdienst-X."')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 6: VERSICHERUNGSABWICKLUNG
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('5. Versicherungsabwicklung')

frage('5.1', 'Wie viele Versicherungspolicen verwalten Sie pro Liegenschaft? Gebäude, Leitungswasser, Haftpflicht?',
  '3-5 ist normal. Mehr = mehr Komplexität bei der Zuordnung wer wann zahlt.')

frage('5.2', 'Wie melden Sie Schäden bei der Versicherung — Online-Portal, E-Mail, PDF-Formular?',
  'Wenn jede Versicherung ein anderes Portal hat → Pain. SMARTCARL füllt Schadensblatt automatisch.')

frage('5.3', 'Wie lange dauert die Schadensblatt-Erstellung pro Fall?',
  '15-30 Min realistisch. SMARTCARL: 30 Sek auto-befüllt.')

frage('5.4', 'Gab es Fälle wo Sie nicht wussten welche Police greift?',
  'Sicher schon mal. SMARTCARL klassifiziert automatisch + zitiert Klausel.')

frage('5.5', 'Wie oft kommt es vor dass eine Versicherung wegen Frist-Versäumnis nicht zahlt?',
  '7-Tage-Meldefrist ist Standard. Wenn das schon mal passiert ist → SMARTCARL erinnert proaktiv.')

frage('5.6', 'Wer behält den Überblick über offene Versicherungsfälle?',
  'Eine Person? Excel-Liste? SMARTCARL hat das eingebaut.')

hebel('Wenn HV ein Schadensblatt-Beispiel zeigt: "Bei SMARTCARL ist das automatisch 95% befüllt — Sie korrigieren maximal noch ein Feld und drücken Senden. Das spart 25 Min pro Fall."')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 7: MIETER-BEZIEHUNG
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('6. Mieter-Beziehung')

frage('6.1', 'Wie reagieren Mieter wenn sie 3-5 Tage auf Rückmeldung warten?',
  'Schlecht. Wiederholtes Anrufen, Beschwerden, schlechte Stimmung beim nächsten Mietvertrag.')

frage('6.2', 'Haben Sie Daten über die Mieter-Zufriedenheit? Bewertungen, Feedback?',
  'Selten. SMARTCARL hat Bewertungs-System integriert (auch wenn aktuell ausgeblendet — kann reaktiviert werden).')

frage('6.3', 'Wie kommunizieren Sie aktuell mit Mietern wenn sich was am Schadensfall ändert?',
  'Telefon? E-Mail? Brief? Jeder Kanal kostet Zeit. SMARTCARL: automatisch.')

frage('6.4', 'Wie hoch ist die Mieterfluktuation in Ihren Häusern?',
  'Höher = Problem. Schadensbearbeitungs-Qualität wirkt sich auf Treue aus.')

frage('6.5', 'Was würden Mieter Ihrer Meinung nach an der aktuellen Schadensbearbeitung kritisieren?',
  'Selbstreflexion erzwingen. "Zu langsam", "intransparent", "nicht informiert" werden kommen.')

frage('6.6', 'Gibt es Mieter die Schäden NICHT melden weil ihnen die Hürde zu hoch ist (Telefonangst, Sprachbarriere)?',
  'JA — und das ist später Vermieter-Problem (verschleppte Schäden = teurer). SMARTCARL: anonyme Schwelle niedriger.')

hebel('"Mieter geben einen Schaden im Mieter-Portal in 2 Minuten ein — kein Telefonat, kein E-Mail-Schreiben. Auch ältere Mieter klicken sich durch wenn das UI klar ist. Das senkt die Hürde, weniger Schäden werden verschleppt — und das spart Ihnen Geld bei Folgeschäden."')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 8: SCHMERZPUNKTE AUFDECKEN
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('7. Schmerzpunkte aufdecken')

p('Das sind die direktesten Verkaufs-Fragen. Hör genau zu und notiere wörtliche Zitate:', { color: C.muted })

frage('7.1', 'Was ist der nervigste Aspekt der Schadensbearbeitung — wenn Sie ehrlich sind?',
  'Direkt fragen wirkt Wunder. Antworten = dein Pitch.')

frage('7.2', 'Wenn Sie eine Sache an Ihrem aktuellen Prozess sofort ändern könnten — was wäre es?',
  'Top-Wunsch. Zeig dann: "Genau das macht SMARTCARL".')

frage('7.3', 'Was kostet Sie aktuell mehr — die Schäden selbst oder die Verwaltung darum herum?',
  'Wenn "Verwaltung" → eindeutiger Hebel.')

frage('7.4', 'Gibt es Schäden die Sie aktuell verzögert bearbeiten weil Sie keine Zeit haben?',
  'Ja-Antwort = Argument. Verzögerung = höhere Folgekosten.')

frage('7.5', 'Mussten Sie schon mal einen Streit mit einem Mieter führen weil Sie etwas behauptet haben aber kein Beleg da war?',
  'Audit-Trail-Argument. SMARTCARL: jede Aktion protokolliert, nichts ist behauptet.')

frage('7.6', 'Wie sicher sind Sie dass DSGVO-Anforderungen aktuell zu 100% erfüllt sind?',
  'Wenn unsicher → SMARTCARL: EU-Hosting, AVV digital, Audit-Log, alles dokumentiert.')

frage('7.7', 'Was wäre für Sie persönlich der größte Gewinn wenn die Schadensabwicklung automatisiert wäre?',
  'Persönliche Frage = persönliche Antwort = emotionaler Hebel.')

hebel('"Sie haben gerade gesagt [WORTLAUT]. Genau dafür haben wir SMARTCARL gebaut. Darf ich Ihnen zeigen wie das konkret bei Ihrer nächsten Meldung aussehen würde?"')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 9: VISION & ERWARTUNGEN
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('8. Vision & Erwartungen')

frage('8.1', 'Wo sehen Sie Ihr Unternehmen in 3 Jahren — mehr Einheiten, mehr Personal, gleich groß?',
  'Wachstum = Skalierungs-Argument. Stagnation = Effizienz-Argument.')

frage('8.2', 'Wenn Sie sich eine perfekte Schadens-Software wünschen dürften — welche 3 Features hätten Sie?',
  'Top-3 Wunschliste. Du kannst dann zeigen welche davon SMARTCARL hat.')

frage('8.3', 'Wie wichtig ist Ihnen dass Mieter das System mobil nutzen können?',
  'Bei < 50 Jahre alten HVs: hoch. Bei alten Strukturen: nice-to-have. SMARTCARL ist responsive.')

frage('8.4', 'Sind KI-gestützte Tools für Sie Zukunft, Spielerei oder Bedrohung?',
  'Antwort entscheidet wie du CARL präsentieren musst.')

frage('8.5', 'Welche Rolle spielt Datenschutz für Sie bei der Tool-Auswahl?',
  'Wenn hoch → DSGVO-Argumentarium ziehen. Wenn niedrig → kurz erwähnen.')

frage('8.6', 'Wenn ich Ihnen sagen würde dass Sie 50% Zeit pro Schaden sparen — wofür würden Sie diese Zeit nutzen?',
  'Persönlich = emotional. Antworten: "Mehr Häuser akquirieren", "weniger Stress", "Familie".')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 10: ENTSCHEIDUNGS-FRAGEN
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('9. Entscheidungs-Fragen')

p('Die wichtigsten Fragen um zu verstehen ob/wann ein Abschluss möglich ist:', { color: C.muted })

frage('9.1', 'Wer entscheidet bei Ihnen über die Einführung neuer Software — Sie alleine oder gemeinsam?',
  'Direkt-Entscheider = schneller Abschluss möglich. Komitee = mehr Termine nötig.')

frage('9.2', 'Welches Budget haben Sie für Software-Tools pro Jahr?',
  'Vergleich mit deinem Pricing. Wenn deutlich höher → leichter Abschluss.')

frage('9.3', 'Was war die letzte Software die Sie eingeführt haben? Wie lief das?',
  'Erfolgsgeschichte? Schmerzgeschichte? Beides hilft dir den Pitch zuzuschneiden.')

frage('9.4', 'Wenn Sie SMARTCARL grundsätzlich gut finden — wie sähe Ihr Entscheidungs-Prozess aus?',
  'Konkrete Schritte verstehen: Probelauf? Vergleich? Vorstand? Setzt einen Plan auf.')

frage('9.5', 'Was müsste passieren damit Sie SMARTCARL nicht in Erwägung ziehen?',
  'Negativ-Frage = Ehrlichkeit. K.O.-Kriterien identifizieren, jetzt kannst du noch reagieren.')

frage('9.6', 'Welche Bedenken haben Sie aktuell wenn Sie an SMARTCARL denken?',
  'Direkt nach Einwänden fragen — bevor sie raus sind. Du kannst sie sofort entschärfen.')

frage('9.7', 'Wenn ich Ihnen heute ein Pilot-Projekt für 4 Wochen kostenlos anbieten würde — wer aus Ihrem Team würde das testen?',
  'Wenn er einen Namen nennt → erstes JA. Wenn er ausweicht → noch nicht reif.')

hebel('"Das Geld-zurück-Versprechen ist genau für solche Bedenken. Sie zahlen 30 Tage normal, wenn es Ihnen oder Ihrem Team nicht passt — komplette Rückerstattung. Sie haben 0 Risiko."')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 11: KONKURRENZ-CHECK
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('10. Konkurrenz-Check')

p('Wichtig zu wissen: kämpfen wir gegen Status-Quo (Excel) oder gegen Konkurrent (Domus, Immoware)?', { color: C.muted })

frage('10.1', 'Haben Sie sich in den letzten 12 Monaten andere Software-Lösungen angeschaut?',
  'Wenn ja: was hat ihm nicht gefallen? Goldgrube für Differenzierung.')

frage('10.2', 'Wie zufrieden sind Sie mit Ihrer aktuellen Lösung — von 1 bis 10?',
  '< 7 = große Chance. > 8 = du musst klar machen was BESSER ist, nicht nur "anders".')

frage('10.3', 'Was kostet Ihr aktuelles System im Jahr — falls ein laufendes Tool nutzen?',
  'Vergleichswert. Domus + Immoware kosten bei 200 Einheiten oft 5.000+ € pro Jahr.')

frage('10.4', 'Was vermissen Sie an Ihrer aktuellen Lösung am meisten?',
  'Direkt = Differenzierungs-Hebel.')

frage('10.5', 'Würden Sie ein neues Tool zusätzlich zu Domus/Immoware einsetzen oder ersetzen?',
  'Wenn "ergänzen" → SMARTCARL kann KI-Layer auf bestehender Software werden. Wenn "ersetzen" → kompletter Wechsel-Plan.')

frage('10.6', 'Was hat Sie davon abgehalten bisher zu wechseln?',
  'Migrations-Aufwand? Schulung? Verträge? Kosten? Antworten = was du adressieren musst.')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 12: CLOSER
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('11. Closer & Notiz-Hinweise')

h2('Closer-Fragen am Ende des Termins', C.green)

frage('11.1', 'Was war für Sie der überzeugendste Punkt heute — und was ist noch offen?',
  'Direkte Reflexion. Das was offen ist = nächster Schritt.')

frage('11.2', 'Was würde der nächste konkrete Schritt von Ihrer Seite aussehen?',
  'Druck rausnehmen, ihm die Initiative überlassen. Klare Antwort = Verkaufs-Trichter.')

frage('11.3', 'Wenn ich Ihnen morgen einen 30-tägigen Pilotvertrag schicke — wann könnten Sie starten?',
  'Konkretes Datum bekommen. Wenn er sagt "in 2 Wochen" → Vertrag ist quasi gewonnen.')

frage('11.4', 'Was müsste in unserem Vertrag drinstehen damit Sie sich wohlfühlen?',
  'Vertrags-Bedenken früh adressieren. Das ist NICHT zu früh!')

frage('11.5', 'Wer sonst sollte SMARTCARL noch sehen — Buchhaltung, IT, Geschäftsführung?',
  'Stakeholder-Mapping. Wer ist außer GF noch Entscheider?')

doc.moveDown(0.5)

h2('Notiz-Hinweise — was du dir IMMER aufschreibst', C.amber)

doc.font('Helvetica').fontSize(10).fillColor(C.primary)
const notes = [
  '✏️ WÖRTLICHE ZITATE bei Schmerzpunkten ("Wir verlieren ständig den Überblick")',
  '✏️ Konkrete Zahlen: Anzahl Einheiten, Mitarbeiter, Schäden/Monat, Stundenlohn',
  '✏️ Tool-Namen die genannt werden (Domus, Immoware, Excel-Vorlagen, etc.)',
  '✏️ Persönliche Frustration des GF — emotional anders als sachlich',
  '✏️ Decision-Maker-Hierarchie (GF allein? Vorstand? Buchhaltung?)',
  '✏️ Timeline-Aussagen ("nächstes Quartal", "vor Sommer")',
  '✏️ Budget-Hinweise (auch indirekte: "wir hatten X für Y ausgegeben")',
  '✏️ K.O.-Kriterien: was MUSS oder DARF NICHT sein',
  '✏️ Pilot-Champion: welcher Mitarbeiter würde mittesten?',
  '✏️ Konkrete Schmerz-Geschichten ("Letzten Winter hatten wir...")',
]
for (const n of notes) {
  if (doc.y > 760) doc.addPage()
  doc.text(n, { lineGap: 3 })
}

doc.moveDown(1)

h2('GOLDENE REGEL', C.red)

p('Im Gespräch:', { font: 'Helvetica-Bold' })
p('• 70% sprechen lassen, 30% selbst sprechen')
p('• Nach jeder Antwort: "Erzählen Sie mir mehr darüber"')
p('• KEINE Lösung präsentieren bevor du den Schmerz verstanden hast')
p('• Wenn er den Wert SELBST formuliert → er glaubt es. Wenn DU es formulierst → er zweifelt.')

doc.moveDown(0.5)
p('Nach dem Gespräch:', { font: 'Helvetica-Bold' })
p('• In den ersten 60 Min nach dem Termin alle Notizen ordnen')
p('• Innerhalb 24h Zusammenfassung per Mail an den GF schicken — zeigt Professionalität')
p('• 3-Top-Schmerzpunkte rauskristallisieren, die wirst du im Folge-Pitch vorne nennen')
p('• Pilot-Vertragsentwurf binnen 48h schicken — wenn er das eingefordert hat')

doc.end()

console.log('✓ PDF erstellt: ' + outPath)
