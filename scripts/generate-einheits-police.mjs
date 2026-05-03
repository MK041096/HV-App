/**
 * Generiert eine zusätzliche Einheits-spezifische Versicherungspolice
 * für Test-Zwecke — soll automatisch der Einheit "Mariahilfer Straße 88 Top 1, 1060 Wien"
 * zugeordnet werden (NICHT der ganzen Liegenschaft).
 *
 * Beispiel: Geräteversicherung für eingebaute Küchengeräte einer einzelnen Wohnung.
 *
 * Output: SMARTCARL_Test_Slim/08_Versicherung_Geraete_Top1_UNIQA.pdf
 */

import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

const ONEDRIVE_DESKTOP = 'C:/Users/tradi/OneDrive/Desktop'
const LOCAL_DESKTOP = 'C:/Users/tradi/Desktop'
const DESKTOP = fs.existsSync(ONEDRIVE_DESKTOP) ? ONEDRIVE_DESKTOP : LOCAL_DESKTOP
const OUTPUT = path.join(DESKTOP, 'SMARTCARL_Test_Slim')
fs.mkdirSync(OUTPUT, { recursive: true })

const file = path.join(OUTPUT, '08_Versicherung_Geraete_Top1_UNIQA.pdf')

const doc = new PDFDocument({ size: 'A4', margin: 60 })
const stream = fs.createWriteStream(file)
doc.pipe(stream)

doc.fontSize(9).font('Helvetica').fillColor('#666').text('UNIQA Österreich Versicherungen AG', { align: 'right' })
doc.text('Untere Donaustraße 21, 1029 Wien', { align: 'right' }).fillColor('#000').moveDown(2)

doc.fontSize(18).font('Helvetica-Bold').text('VERSICHERUNGSPOLIZZE', { align: 'center' })
doc.fontSize(13).font('Helvetica').text('Geräteversicherung Wohneinheit', { align: 'center' })
doc.moveDown(1.5)

const row = (label, value) => {
  doc.fontSize(10).font('Helvetica-Bold').text(label, { continued: true })
  doc.font('Helvetica').text('  ' + value)
  doc.moveDown(0.3)
}

row('Polizzennummer:', 'AT-2026-GE-771042')
row('Versicherungsnehmer:', 'Kracher ImmoGmbH, Wildgansgasse 8/2, 7400 Oberwart')
row('FN / UID:', 'FN 123456a / ATU12345678')
row('Risikoanschrift:', 'Mariahilfer Straße 88, Top 1, 1060 Wien')
row('Versicherte Einheit:', 'Top 1 (Erdgeschoß, ca. 62 m²)')
row('Versicherungssumme:', 'EUR 25.000,00')
row('Selbstbehalt:', 'EUR 200,00 je Schadensfall')
row('Jahresprämie:', 'EUR 180,00 (zzgl. 11 % Versicherungssteuer)')
row('Zahlweise:', 'jährlich, jeweils zum 1. Januar')
row('Versicherungsperiode:', '01.01.2026 bis 31.12.2026 (automat. Verlängerung um je 1 Jahr)')
row('Schadenmeldung:', '+43 50 677 670 (24h-Schadenhotline)')
doc.moveDown(0.8)

doc.fontSize(11).font('Helvetica-Bold').text('VERSICHERTE GERÄTE IN DER WOHNEINHEIT TOP 1').moveDown(0.4)
doc.fontSize(10).font('Helvetica')
const geraete = [
  'Einbauküche inkl. Kühlschrank, Backofen, Ceranfeld, Geschirrspüler, Dunstabzug',
  'Boiler / Warmwasserspeicher (80 Liter)',
  'Therme (Gas-Brennwertgerät, Wandhängend)',
  'Klimaanlage (Split-System, fest installiert)',
  'Elektrische Rolllädensteuerung',
  'Türsprechanlage / Videogegensprechanlage',
]
geraete.forEach(g => doc.text('• ' + g, { indent: 10, align: 'justify' }).moveDown(0.2))
doc.moveDown(0.5)

doc.fontSize(11).font('Helvetica-Bold').text('VERSICHERTE GEFAHREN').moveDown(0.4)
doc.fontSize(10).font('Helvetica')
const gefahren = [
  'Bedienungsfehler, Ungeschicklichkeit, Fahrlässigkeit Dritter',
  'Konstruktions-, Material- und Ausführungsfehler nach Ablauf der Herstellergarantie',
  'Überspannungs- und Kurzschlussschäden',
  'Wasser, Feuchtigkeit, Korrosion',
  'Diebstahl, Einbruchdiebstahl, Vandalismus',
  'Bruch, Sturz, Anprall',
  'Folgeschäden an benachbarten Bauteilen bis EUR 5.000',
]
gefahren.forEach(g => doc.text('• ' + g, { indent: 10, align: 'justify' }).moveDown(0.2))
doc.moveDown(0.5)

doc.fontSize(11).font('Helvetica-Bold').text('AUSSCHLÜSSE').moveDown(0.4)
doc.fontSize(10).font('Helvetica')
const ausschluesse = [
  'Schäden durch normale Abnutzung und Alterung',
  'Vorsätzlich vom Versicherungsnehmer oder Mieter verursachte Schäden',
  'Schäden während Wartungsarbeiten durch nicht autorisierte Personen',
  'Geräte des persönlichen Eigentums des Mieters (eigene Waschmaschine, Trockner etc.)',
]
ausschluesse.forEach(a => doc.text('– ' + a, { indent: 10, align: 'justify' }).moveDown(0.2))
doc.moveDown(2)

doc.fontSize(9).fillColor('#666').text('Wien, 01.01.2026', { align: 'left' })
doc.moveDown(1.5)
doc.fontSize(10).fillColor('#000').text('________________________          ________________________')
doc.text('UNIQA Österreich Versicherungen AG          Kracher ImmoGmbH')

doc.end()
stream.on('finish', () => {
  console.log('✅ Einheits-Police erstellt: ' + file)
  console.log('')
  console.log('Auto-Erkennung beim Upload:')
  console.log('  - Risikoanschrift mit "Top 1" → System erkennt: EINHEITS-Police')
  console.log('  - Zuordnung zu: Einheit "Mariahilfer Straße 88 Top 1, 1060 Wien"')
  console.log('  - Liegenschafts-Feld bleibt leer (weil Top spezifiziert)')
})
