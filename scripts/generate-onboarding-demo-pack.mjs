/**
 * Generiert komplettes Onboarding-Demo-Pack für Live-Präsentation:
 *  - Einheiten-Bulk-Import.xlsx     (10 Einheiten in 2 Liegenschaften, mit Mietern)
 *  - Werkstaetten-Bulk-Import.xlsx  (12 Werkstätten verschiedener Gewerke)
 *  - 3x Mietvertrag-PDFs            (Demo-Mieter)
 *  - 3x Versicherungspolice-PDFs    (Gebäude, Leitungswasser, Haftpflicht)
 *  - README.txt                     (Erklärt was womit demonstriert wird)
 *
 * Output: Desktop/SMARTCARL_Onboarding_Demo_Pack/
 *
 * Aufruf: node scripts/generate-onboarding-demo-pack.mjs
 */

import XLSX from 'xlsx'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import os from 'os'

// ── Output-Pfad ────────────────────────────────────────────────────────
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
const packDir = path.join(desktop, 'SMARTCARL_Onboarding_Demo_Pack')

if (!fs.existsSync(packDir)) fs.mkdirSync(packDir, { recursive: true })

// ═══════════════════════════════════════════════════════════════════════
// 1. EINHEITEN-EXCEL  (Format: Einheit-Adresse | Mieter | E-Mail | Telefon)
// ═══════════════════════════════════════════════════════════════════════
const einheiten = [
  ['Einheit (Adresse)', 'Mieter', 'E-Mail', 'Telefon'],
  // Liegenschaft 1: Schottenring 12, 1010 Wien (5 Einheiten)
  ['Schottenring 12 Top 1, 1010 Wien', 'Anna Berger', 'anna.berger@example.at', '+43 660 1234567'],
  ['Schottenring 12 Top 2, 1010 Wien', 'Bernhard Mayer', 'b.mayer@example.at', '+43 660 2345678'],
  ['Schottenring 12 Top 3, 1010 Wien', 'Carolin Huber', 'c.huber@example.at', '+43 660 3456789'],
  ['Schottenring 12 Top 4, 1010 Wien', 'David Schmidt', 'd.schmidt@example.at', '+43 660 4567890'],
  ['Schottenring 12 Top 5, 1010 Wien', 'Elena Wagner', 'e.wagner@example.at', '+43 660 5678901'],
  // Liegenschaft 2: Praterstraße 45, 1020 Wien (5 Einheiten)
  ['Praterstraße 45 Top 1, 1020 Wien', 'Florian Gruber', 'f.gruber@example.at', '+43 660 6789012'],
  ['Praterstraße 45 Top 2, 1020 Wien', 'Greta Fischer', 'g.fischer@example.at', '+43 660 7890123'],
  ['Praterstraße 45 Top 3, 1020 Wien', 'Hannes Steiner', 'h.steiner@example.at', '+43 660 8901234'],
  ['Praterstraße 45 Top 4, 1020 Wien', 'Iris Lechner', 'i.lechner@example.at', '+43 660 9012345'],
  ['Praterstraße 45 Top 5, 1020 Wien', 'Julian Brandl', 'j.brandl@example.at', '+43 660 0123456'],
]
const wbE = XLSX.utils.book_new()
const wsE = XLSX.utils.aoa_to_sheet(einheiten)
wsE['!cols'] = [{ wch: 38 }, { wch: 22 }, { wch: 28 }, { wch: 18 }]
XLSX.utils.book_append_sheet(wbE, wsE, 'Einheiten')
XLSX.writeFile(wbE, path.join(packDir, 'Einheiten-Bulk-Import.xlsx'))

// ═══════════════════════════════════════════════════════════════════════
// 2. WERKSTÄTTEN-EXCEL  (Format: Firmenname | Telefon | E-Mail | Tätigkeit | Beschreibung)
// ═══════════════════════════════════════════════════════════════════════
const werkstaetten = [
  ['Firmenname', 'Telefon', 'E-Mail', 'Tätigkeit', 'Beschreibung'],
  ['Installateur Müller GmbH', '+43 1 5556677', 'office@mueller-installateur.at', 'Sanitär & Heizung', '24h Notdienst, Wien gesamt'],
  ['Elektro Stark KG', '+43 1 4448899', 'service@elektro-stark.at', 'Elektroinstallation', 'Sicherungskasten, Stromausfälle, Notdienst'],
  ['Glaserei Klar OG', '+43 1 3334455', 'info@glaserei-klar.at', 'Glaser', 'Fensterglas, Notverglasung'],
  ['Tischlerei Holzweg', '+43 1 2221122', 'kontakt@holzweg.at', 'Tischler', 'Türen, Fenster, Möbel-Reparatur'],
  ['Schlosserei Stahl', '+43 1 7778899', 'office@schlosserei-stahl.at', 'Schlosser', 'Türschlösser, Sicherheitstechnik'],
  ['Malermeister Bunt', '+43 1 6665544', 'info@maler-bunt.at', 'Maler & Anstreicher', 'Innenanstrich, Tapeten, Schimmelbeseitigung'],
  ['Bodenleger Parkett-Profi', '+43 1 9990011', 'service@parkett-profi.at', 'Bodenleger', 'Parkett, Laminat, Vinyl, Fliesen'],
  ['Dachdeckerei Hoch GmbH', '+43 1 5550022', 'office@hoch-dach.at', 'Dachdecker', 'Dachreparatur, Dachrinnen, Kamin'],
  ['Schädlingsbekämpfung Reinhardt', '+43 1 8881133', 'info@reinhardt-pest.at', 'Schädlingsbekämpfer', 'Wespen, Mäuse, Ratten, Kakerlaken'],
  ['Heizungsbau Wärmer', '+43 1 7779988', 'service@waermer-heizung.at', 'Heizungstechniker', 'Gas-Therme, Pellet, Fernwärme'],
  ['Trockenbau Wand & Co', '+43 1 6664433', 'kontakt@wand-co.at', 'Trockenbauer', 'Rigips, Trennwände, Decken'],
  ['Notdienst-Express 24/7', '+43 1 9991177', 'notdienst@express247.at', 'Allround-Notdienst', '24h erreichbar, Wien + Umgebung'],
]
const wbW = XLSX.utils.book_new()
const wsW = XLSX.utils.aoa_to_sheet(werkstaetten)
wsW['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 32 }, { wch: 22 }, { wch: 50 }]
XLSX.utils.book_append_sheet(wbW, wsW, 'Werkstätten')
XLSX.writeFile(wbW, path.join(packDir, 'Werkstaetten-Bulk-Import.xlsx'))

// ═══════════════════════════════════════════════════════════════════════
// 3. MIETVERTRAG-PDFs (3 Stück für verschiedene Demo-Mieter)
// ═══════════════════════════════════════════════════════════════════════
function generateMietvertrag(mieterName, adresse, output) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 } })
  doc.pipe(fs.createWriteStream(output))

  doc.fillColor('#000').font('Helvetica-Bold').fontSize(18).text('MIETVERTRAG', { align: 'center' })
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(10).fillColor('#555').text('für eine Wohnung gemäß Mietrechtsgesetz (MRG)', { align: 'center' })
  doc.moveDown(2)

  doc.fillColor('#000').font('Helvetica-Bold').fontSize(11).text('Vertragsparteien')
  doc.moveDown(0.3)
  doc.font('Helvetica').fontSize(10)
  doc.text('Vermieter: Muster Hausverwaltung, 1010 Wien')
  doc.moveDown(0.2)
  doc.text(`Mieter: ${mieterName}`)
  doc.moveDown(1)

  doc.font('Helvetica-Bold').fontSize(11).text('§ 1 Mietgegenstand')
  doc.font('Helvetica').fontSize(10).moveDown(0.2)
  doc.text(`Gegenstand des Vertrags ist die Wohnung in ${adresse}, bestehend aus ca. 65 m² Wohnfläche, drei Zimmern, Küche, Bad, WC, Diele und Kellerabteil.`, { align: 'justify' })
  doc.moveDown(0.8)

  doc.font('Helvetica-Bold').fontSize(11).text('§ 3 Erhaltungspflichten')
  doc.font('Helvetica').fontSize(10).moveDown(0.2)
  doc.text('Der Vermieter trägt die Kosten für die Erhaltung des Mietgegenstandes gemäß § 3 MRG. Dazu zählen insbesondere ernste Schäden des Hauses, die Erhaltung wesentlicher Anlagen (Wasserversorgung, Heizung, Strom, Aufzug) sowie die Beseitigung erheblicher Gesundheitsgefährdungen.', { align: 'justify' })
  doc.moveDown(0.8)

  doc.font('Helvetica-Bold').fontSize(11).text('§ 8 Pflichten des Mieters')
  doc.font('Helvetica').fontSize(10).moveDown(0.2)
  doc.text('Der Mieter hat den Mietgegenstand nach den Bestimmungen des MRG § 8 zu warten und zu pflegen. Er hat schuldhaft verursachte Schäden auf eigene Kosten zu beheben. Schäden sind dem Vermieter unverzüglich anzuzeigen.', { align: 'justify' })
  doc.moveDown(0.8)

  doc.font('Helvetica-Bold').fontSize(11).text('§ 10 Kleinreparaturen')
  doc.font('Helvetica').fontSize(10).moveDown(0.2)
  doc.text('Der Mieter trägt die Kosten für Kleinreparaturen am Mietgegenstand bis zu einem Betrag von EUR 100,00 je Einzelreparatur. Hierzu zählen insbesondere: Türgriffe, Wasserhähne, Lichtschalter, Steckdosen, Duschköpfe, Toilettensitze, Türdichtungen sowie kleinere Wartungsarbeiten an den vom Mieter direkt und häufig berührten Gegenständen. Die Gesamtsumme der vom Mieter im Kalenderjahr zu tragenden Kleinreparaturen ist mit 6% des Jahres-Hauptmietzinses begrenzt.', { align: 'justify' })
  doc.moveDown(0.8)

  doc.font('Helvetica-Bold').fontSize(11).text('§ 16 Schadensanzeigepflicht')
  doc.font('Helvetica').fontSize(10).moveDown(0.2)
  doc.text('(1) Der Mieter ist verpflichtet, dem Vermieter alle Schäden am Mietgegenstand unverzüglich anzuzeigen, sobald er von ihnen Kenntnis erlangt.', { align: 'justify' })
  doc.moveDown(0.2)
  doc.text('(2) Bei Gefahr im Verzug, insbesondere bei Wasserschäden, Stromausfall mit Brandgefahr oder Gasaustritt, hat der Mieter zusätzlich umgehend den jeweiligen Notdienst zu verständigen.', { align: 'justify' })
  doc.moveDown(0.2)
  doc.text('(3) Der Mieter hat zur Schadensminderung verpflichtende Sofortmaßnahmen zu ergreifen, insbesondere das Schließen des Hauptabsperrhahns bei Wasseraustritt.', { align: 'justify' })
  doc.moveDown(2)

  doc.fontSize(9).fillColor('#555').text('Wien, 06.05.2026', { align: 'center' })
  doc.moveDown(1)
  doc.text('______________________                              ______________________', { align: 'center' })
  doc.moveDown(0.2)
  doc.text('Vermieter                                                            Mieter', { align: 'center' })

  doc.end()
}

const mvDir = path.join(packDir, 'Mietvertraege')
if (!fs.existsSync(mvDir)) fs.mkdirSync(mvDir)

generateMietvertrag('Anna Berger', 'Schottenring 12 Top 1, 1010 Wien', path.join(mvDir, 'Mietvertrag_Berger_Schottenring12_Top1.pdf'))
generateMietvertrag('Bernhard Mayer', 'Schottenring 12 Top 2, 1010 Wien', path.join(mvDir, 'Mietvertrag_Mayer_Schottenring12_Top2.pdf'))
generateMietvertrag('Florian Gruber', 'Praterstraße 45 Top 1, 1020 Wien', path.join(mvDir, 'Mietvertrag_Gruber_Praterstrasse45_Top1.pdf'))

// ═══════════════════════════════════════════════════════════════════════
// 4. VERSICHERUNGSPOLICEN (3 Stück verschiedene Versicherungen)
// ═══════════════════════════════════════════════════════════════════════
function generatePolice(polNr, versName, kategorie, deckungstext, output) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 } })
  doc.pipe(fs.createWriteStream(output))

  doc.fillColor('#000').font('Helvetica-Bold').fontSize(18).text('VERSICHERUNGSPOLICE', { align: 'center' })
  doc.moveDown(0.3)
  doc.font('Helvetica').fontSize(11).fillColor('#555').text(versName, { align: 'center' })
  doc.moveDown(0.2)
  doc.fontSize(9).text(`Polizzennummer: ${polNr}`, { align: 'center' })
  doc.moveDown(2)

  doc.fillColor('#000').font('Helvetica-Bold').fontSize(11).text('Versicherungsnehmer')
  doc.moveDown(0.2)
  doc.font('Helvetica').fontSize(10).text('Muster Hausverwaltung, 1010 Wien')
  doc.moveDown(0.8)

  doc.font('Helvetica-Bold').fontSize(11).text('Versicherte Liegenschaft')
  doc.moveDown(0.2)
  doc.font('Helvetica').fontSize(10).text('Schottenring 12, 1010 Wien — Wohngebäude mit 5 Wohneinheiten')
  doc.moveDown(0.8)

  doc.font('Helvetica-Bold').fontSize(11).text(`Versicherungsart: ${kategorie}`)
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').fontSize(11).text('§ 1 Versicherter Gefahrenkreis')
  doc.font('Helvetica').fontSize(10).moveDown(0.2)
  doc.text(deckungstext, { align: 'justify' })
  doc.moveDown(0.8)

  doc.font('Helvetica-Bold').fontSize(11).text('§ 2 Versicherungssumme')
  doc.font('Helvetica').fontSize(10).moveDown(0.2)
  doc.text('Die Versicherungssumme beträgt EUR 850.000,00 zum gleitenden Neuwert. Selbstbehalt EUR 300,00 je Schadensfall.', { align: 'justify' })
  doc.moveDown(0.8)

  doc.font('Helvetica-Bold').fontSize(11).text('§ 3 Schadensmeldung')
  doc.font('Helvetica').fontSize(10).moveDown(0.2)
  doc.text(`Der Versicherungsnehmer ist verpflichtet, jeden Schaden unverzüglich, spätestens binnen sieben Tagen nach Kenntnis, schriftlich anzuzeigen. Schadenshotline: +43 1 ${polNr.slice(-7, -3)} ${polNr.slice(-3)}.`, { align: 'justify' })
  doc.moveDown(0.8)

  doc.font('Helvetica-Bold').fontSize(11).text('§ 4 Vertragsbeginn / Laufzeit')
  doc.font('Helvetica').fontSize(10).moveDown(0.2)
  doc.text('Vertragsbeginn: 01.01.2026 — Laufzeit: 12 Monate, automatische Verlängerung um jeweils ein Jahr, sofern nicht 3 Monate vor Ablauf gekündigt wird.', { align: 'justify' })
  doc.moveDown(2)

  doc.fontSize(9).fillColor('#555').text(`Wien, 01.01.2026 — ${versName}`, { align: 'center' })

  doc.end()
}

const versDir = path.join(packDir, 'Versicherungspolicen')
if (!fs.existsSync(versDir)) fs.mkdirSync(versDir)

generatePolice(
  'AT-2026-GB-441290',
  'UNIQA Österreich',
  'Gebäudeversicherung',
  'Versicherungsschutz besteht für Schäden am versicherten Wohngebäude durch Feuer (Brand, Blitzschlag, Explosion), Sturm ab Windstärke 8 (62 km/h), Hagel sowie Folgeschäden an Bauwerk und Inventar. Mitversichert sind außerdem Aufräumungs-, Abbruch- und Bewegungskosten bis zu 10% der Versicherungssumme.',
  path.join(versDir, 'Police_Gebaeudeversicherung_UNIQA.pdf')
)

generatePolice(
  'AT-2026-LW-991423',
  'Wiener Städtische Versicherung AG',
  'Leitungswasserversicherung',
  'Versicherungsschutz besteht für Schäden durch bestimmungswidrig austretendes Leitungswasser aus den Zuleitungs- und Ableitungsrohren der Wasserversorgung sowie aus damit fest verbundenen Einrichtungen. Mitversichert sind Bruchschäden an Frischwasser- und Abwasserleitungen innerhalb des Gebäudes, Folgeschäden an Boden, Wänden und Decken sowie die Kosten für Leck-Ortung.',
  path.join(versDir, 'Police_Leitungswasser_WienerStaedtische.pdf')
)

generatePolice(
  'AT-2026-HP-558820',
  'Generali Versicherung AG',
  'Haftpflichtversicherung',
  'Versicherungsschutz besteht für die gesetzliche Haftpflicht des Hauseigentümers aus Personen-, Sach- und Vermögensschäden, die Dritten infolge eines Versicherungsfalls aus dem Eigentum, dem Besitz oder der Verwaltung der versicherten Liegenschaft entstehen. Mitversichert sind Streupflicht-Versäumnisse, Schäden durch herabfallende Gebäudeteile sowie Schäden an Dritten durch defekte Beleuchtung im Stiegenhaus.',
  path.join(versDir, 'Police_Haftpflicht_Generali.pdf')
)

// ═══════════════════════════════════════════════════════════════════════
// 5. README.txt
// ═══════════════════════════════════════════════════════════════════════
const readme = `
SMARTCARL Onboarding-Demo-Pack
================================

Dieses Pack enthält Test-Materialien für die LIVE-Onboarding-Demo bei der
Hausverwaltung. Sie können während der Präsentation zeigen wie Sie als HV
Ihre Daten in 5 Minuten in SMARTCARL einspielen.

Inhalt
------

📋 Einheiten-Bulk-Import.xlsx
   10 Einheiten in 2 Liegenschaften (Schottenring 12 + Praterstraße 45),
   inklusive Mieter-Namen, E-Mail und Telefon.

   ▸ Demo-Ort: Dashboard → Einheiten → Bulk-Import
   ▸ Was passiert: SMARTCARL erkennt die Spalten automatisch, legt
     Liegenschaften + Einheiten an, generiert Aktivierungscodes,
     versendet Einladungen an die Mieter.

📋 Werkstaetten-Bulk-Import.xlsx
   12 Werkstätten verschiedener Gewerke (Installateur, Elektriker, Glaser,
   Tischler, Schlosser, Maler, Bodenleger, Dachdecker, Schädlings-
   bekämpfer, Heizungstechniker, Trockenbauer, Allround-Notdienst).

   ▸ Demo-Ort: Dashboard → Werkstätten → Bulk-Import
   ▸ Was passiert: KI klassifiziert jede Werkstatt automatisch, ordnet
     Gewerke zu, recherchiert ergänzende Infos via Web-Suche.

📁 Mietvertraege/   (3 PDFs)
   Mietvertraege für die Demo-Mieter Anna Berger, Bernhard Mayer und
   Florian Gruber. Mit relevanten §§ 3, 8, 10 (Kleinreparatur), 16.

   ▸ Demo-Ort: Dashboard → Liegenschaften → Einheit anklicken →
              Dokument hochladen
   ▸ Was passiert: PDF wird gespeichert, CARL nutzt den Volltext bei der
     KI-Schadensanalyse.

📁 Versicherungspolicen/   (3 PDFs)
   - Gebäudeversicherung UNIQA   (Sturm, Feuer)
   - Leitungswasserversicherung Wiener Städtische   (Wasser-Schäden)
   - Haftpflichtversicherung Generali   (Personenschäden)

   ▸ Demo-Ort: Dashboard → Dokumente → Versicherung hochladen
              ODER Bulk-Import-Page
   ▸ Was passiert: PDF wird gespeichert, CARL extrahiert bei
     Schadensfällen das passende Klausel-Zitat aus dem Volltext.


Empfohlener Demo-Ablauf für Onboarding
---------------------------------------

1. (1 Min) Werkstätten-Excel hochladen
   → "In 30 Sekunden hat die KI 12 Wiener Werkstätten klassifiziert."

2. (1 Min) Einheiten-Excel hochladen
   → "10 Mieter werden automatisch eingeladen."

3. (1 Min) Mietvertrag-PDFs für eine Einheit hochladen
   → "CARL liest den Vertrag und kennt jede Sonderklausel."

4. (1 Min) Versicherungs-PDFs hochladen
   → "Versicherungs-Klauseln werden bei Schäden automatisch extrahiert."

5. (1 Min) "Fertig — 10 Mieter, 3 Versicherungen, 12 Werkstätten in
   5 Minuten. Sie sind einsatzbereit."


WICHTIG
-------

✓ Diese Daten sind 100% Demo-Material — alle E-Mails sind example.at
  (existieren nicht), alle Telefonnummern sind erfunden.

✓ Falls Sie nach der Demo die Daten wieder löschen möchten: einfach
  Bescheid geben, ein DB-Reset ist sofort gemacht.

✓ Wenn Sie nur die Schadens-Demo zeigen, ist dieses Pack ungenutzt —
  kein Druck.
`.trim()

fs.writeFileSync(path.join(packDir, 'README.txt'), readme, 'utf-8')

console.log('✓ Onboarding-Demo-Pack erstellt:')
console.log('  ' + packDir)
console.log('')
console.log('Inhalt:')
console.log('  ✓ Einheiten-Bulk-Import.xlsx       (10 Einheiten)')
console.log('  ✓ Werkstaetten-Bulk-Import.xlsx    (12 Werkstätten)')
console.log('  ✓ Mietvertraege/                   (3 PDFs)')
console.log('  ✓ Versicherungspolicen/            (3 PDFs)')
console.log('  ✓ README.txt                       (Demo-Anleitung)')
