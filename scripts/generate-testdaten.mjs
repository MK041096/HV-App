import XLSX from 'xlsx'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

const DESKTOP = 'C:/Users/tradi/Desktop/SMARTCARL_Testdaten'
fs.mkdirSync(DESKTOP, { recursive: true })
fs.mkdirSync(DESKTOP + '/Mietvertraege', { recursive: true })
fs.mkdirSync(DESKTOP + '/Versicherungen', { recursive: true })
fs.mkdirSync(DESKTOP + '/Schadensfotos', { recursive: true })

// ── 10 Liegenschaften mit je 50 Einheiten ──
const LIEGENSCHAFTEN = [
  { strasse: 'Mariahilfer Straße 88', plz: '1060', ort: 'Wien' },
  { strasse: 'Favoritenstraße 42', plz: '1100', ort: 'Wien' },
  { strasse: 'Währinger Straße 15', plz: '1090', ort: 'Wien' },
  { strasse: 'Praterstraße 27', plz: '1020', ort: 'Wien' },
  { strasse: 'Hernalser Hauptstraße 63', plz: '1170', ort: 'Wien' },
  { strasse: 'Meidlinger Hauptstraße 34', plz: '1120', ort: 'Wien' },
  { strasse: 'Döblinger Hauptstraße 51', plz: '1190', ort: 'Wien' },
  { strasse: 'Brigittenauer Lände 18', plz: '1200', ort: 'Wien' },
  { strasse: 'Ottakringer Straße 99', plz: '1160', ort: 'Wien' },
  { strasse: 'Simmeringer Hauptstraße 77', plz: '1110', ort: 'Wien' },
]

const STOCKWERKE = ['EG', '1. OG', '2. OG', '3. OG', '4. OG']
const MIETER_NAMEN = [
  ['Thomas', 'Müller'], ['Anna', 'Huber'], ['Michael', 'Wagner'], ['Maria', 'Bauer'],
  ['Stefan', 'Gruber'], ['Elisabeth', 'Hofmann'], ['Andreas', 'Pichler'], ['Sabine', 'Moser'],
  ['Klaus', 'Berger'], ['Martina', 'Steiner'], ['Peter', 'Fischer'], ['Ingrid', 'Schwarz'],
  ['Wolfgang', 'Maier'], ['Christine', 'Leitner'], ['Gerhard', 'Hofer'], ['Brigitte', 'Fuchs'],
  ['Helmut', 'Winkler'], ['Eva', 'Reiter'], ['Franz', 'Schmid'], ['Ursula', 'Weiss'],
  ['Johann', 'Lehner'], ['Renate', 'Brunner'], ['Karl', 'Eder'], ['Monika', 'Ebner'],
  ['Josef', 'Aigner'], ['Sandra', 'Bachmann'], ['Christian', 'Haas'], ['Barbara', 'Wimmer'],
  ['Manfred', 'Lang'], ['Karin', 'Zimmermann'], ['Herbert', 'Becker'], ['Silvia', 'Mayer'],
  ['Walter', 'Koch'], ['Doris', 'Riedl'], ['Erich', 'Weber'], ['Petra', 'Richter'],
  ['Bernhard', 'Schneider'], ['Claudia', 'Wolf'], ['Reinhard', 'Schober'], ['Andrea', 'Hammer'],
  ['Günter', 'Roth'], ['Sonja', 'Braun'], ['Norbert', 'Klein'], ['Margit', 'Friedl'],
  ['Oskar', 'Haider'], ['Ingeborg', 'Nagl'], ['Dietmar', 'Ortner'], ['Hannelore', 'Seidl'],
  ['Rainer', 'Mayr'], ['Gabriele', 'Lackner'],
]

// ── SCHRITT 1: 500 Einheiten generieren ──
console.log('Generiere 500 Einheiten...')

const einheitenRows = [['Einheit', 'Adresse', 'Stockwerk', 'Vorname', 'Nachname', 'Email', 'Telefon']]
let einheitenCounter = 0

for (let l = 0; l < LIEGENSCHAFTEN.length; l++) {
  const lg = LIEGENSCHAFTEN[l]
  const adresse = `${lg.strasse}, ${lg.plz} ${lg.ort}`

  for (let top = 1; top <= 50; top++) {
    const mieter = MIETER_NAMEN[(einheitenCounter) % MIETER_NAMEN.length]
    const stock = STOCKWERKE[Math.floor((top - 1) / 10)]
    const einheitName = `${lg.strasse} Top ${top}`

    // Nur eine Einheit bekommt die Test-E-Mail (Liegenschaft 1, Top 1)
    const email = (l === 0 && top === 1) ? 'kracherdigital@gmx.at' : ''
    const telefon = (l === 0 && top === 1) ? '+43 664 46 82 910' : ''
    const vorname = (l === 0 && top === 1) ? 'Mathias' : mieter[0]
    const nachname = (l === 0 && top === 1) ? 'Kracher' : mieter[1]

    einheitenRows.push([einheitName, adresse, stock, vorname, nachname, email, telefon])
    einheitenCounter++
  }
}

// Excel
const wb1 = XLSX.utils.book_new()
const ws1 = XLSX.utils.aoa_to_sheet(einheitenRows)
ws1['!cols'] = [{ wch: 32 }, { wch: 36 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 18 }]
XLSX.utils.book_append_sheet(wb1, ws1, 'Einheiten')
XLSX.writeFile(wb1, DESKTOP + '/SMARTCARL_Testeinheiten.xlsx')

// CSV
const csv1 = einheitenRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
fs.writeFileSync(DESKTOP + '/SMARTCARL_Testeinheiten.csv', '\uFEFF' + csv1, 'utf8')
console.log('✓ Einheiten: XLSX + CSV erstellt (500 Einheiten)')

// ── SCHRITT 2: 18 Werkstätten ──
console.log('Generiere 18 Werkstätten...')

const werkstaetten = [
  ['Huber Sanitär GmbH', '+43 664 111 2233', 'Tradingworld@gmx.at', 'Sanitär & Wasserschaden', 'Rohrbruch, Wasserinstallation, Badezimmerrenovierung, Leitungswasserschäden'],
  ['Elektro Brandner eU', '+43 664 222 3344', 'Tradingworld@gmx.at', 'Elektroinstallation', 'Reparaturen, Zählerkasten, Beleuchtung, Sicherungskasten, Steckdosen'],
  ['Tischlerei Fuchs KG', '+43 664 333 4455', 'Tradingworld@gmx.at', 'Tischlerei & Türen', 'Einbauküchen, Zimmertüren, Parkettboden, Möbelreparatur, Holzarbeiten'],
  ['Schlosserei Mayr GmbH', '+43 664 444 5566', 'Tradingworld@gmx.at', 'Schlosserei & Sicherheit', 'Aufsperrdienst, Schlossaustausch, Türreparatur, Einbruchschutz, Tresore'],
  ['Maler Steiner eU', '+43 664 555 6677', 'Tradingworld@gmx.at', 'Malerarbeiten & Verputz', 'Innenanstrich, Außenanstrich, Verputzarbeiten, Tapezieren, Fassadensanierung'],
  ['Aufzug Service Pichler', '+43 664 666 7788', 'Tradingworld@gmx.at', 'Aufzugservice & Wartung', 'Aufzugwartung, Reparatur, TÜV-Abnahme, Modernisierung, Notfallservice 24h'],
  ['Heizung Klimatechnik Wagner', '+43 664 777 8899', 'Tradingworld@gmx.at', 'Heizung & Klimaanlage', 'Heizungsservice, Klimaanlagen, Wärmepumpen, Gasheizung, Brennerservice'],
  ['Dachdecker Hofer GmbH', '+43 664 888 9900', 'Tradingworld@gmx.at', 'Dachdeckerei & Spengler', 'Dachreparatur, Dachsanierung, Flachdach, Spenglerei, Regenrinnen, Dachabdichtung'],
  ['Glaserei Schmid eU', '+43 664 999 0011', 'Tradingworld@gmx.at', 'Glaserei & Fenster', 'Fensterglas, Spiegel, Doppelverglasung, Schaufenster, Glastüren'],
  ['Schädlingsbekämpfung Gruber', '+43 664 100 1122', 'Tradingworld@gmx.at', 'Schädlingsbekämpfung', 'Schimmelbekämpfung, Ungeziefer, Taubenabwehr, Desinfektion, Begasung'],
  ['Gartenpflege Leitner KG', '+43 664 200 2233', 'Tradingworld@gmx.at', 'Gartenpflege & Grünflächen', 'Rasenmähen, Heckenschnitt, Baumschnitt, Bepflanzung, Winterdienst'],
  ['Reinigungsservice Bauer GmbH', '+43 664 300 3344', 'Tradingworld@gmx.at', 'Gebäudereinigung', 'Hausreinigung, Treppenhausreinigung, Fensterreinigung, Tiefenreinigung, Grundreinigung'],
  ['Fliesenleger Moser eU', '+43 664 400 4455', 'Tradingworld@gmx.at', 'Fliesenleger & Estrich', 'Badezimmerfliesen, Bodenfliesen, Estrich, Natursteinarbeiten, Fugensanierung'],
  ['Spengler Reiter GmbH', '+43 664 500 5566', 'Tradingworld@gmx.at', 'Spenglerei & Abdichtung', 'Blecharbeiten, Dachabdichtung, Fassadenblechverkleidung, Balkonabdichtung'],
  ['Trockenbau Fischer KG', '+43 664 600 6677', 'Tradingworld@gmx.at', 'Trockenbau & Schimmel', 'Trockenbauarbeiten, Schimmelsanierung, Zwischenwände, Deckenverkleidung, Wärmedämmung'],
  ['Brandschutz Wimmer eU', '+43 664 700 7788', 'Tradingworld@gmx.at', 'Brandschutz & Sicherheit', 'Rauchmelderwartung, Feuerlöscher, Brandschutztüren, Fluchtwegschilderung, Sicherheitsbeleuchtung'],
  ['Fenster & Türen Eder GmbH', '+43 664 800 8899', 'Tradingworld@gmx.at', 'Fenster & Türenmontage', 'Fenstermontage, Türmontage, Rollläden, Jalousien, Wärmeschutzfenster, Dichtungen'],
  ['Estrich & Boden Haas eU', '+43 664 900 9900', 'Tradingworld@gmx.at', 'Estrich & Bodenbelag', 'Estricharbeiten, Laminat, Parkett, Vinylboden, Teppich, Fußbodenheizung'],
]

const wRows = [['Firmenname', 'Telefon', 'E-Mail', 'Tätigkeit', 'Beschreibung']]
werkstaetten.forEach(w => wRows.push(w))

const wb2 = XLSX.utils.book_new()
const ws2 = XLSX.utils.aoa_to_sheet(wRows)
ws2['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 26 }, { wch: 28 }, { wch: 60 }]
XLSX.utils.book_append_sheet(wb2, ws2, 'Werkstätten')
XLSX.writeFile(wb2, DESKTOP + '/SMARTCARL_Werkstaetten.xlsx')

const csv2 = wRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
fs.writeFileSync(DESKTOP + '/SMARTCARL_Werkstaetten.csv', '\uFEFF' + csv2, 'utf8')
console.log('✓ Werkstätten: XLSX + CSV erstellt (18 Betriebe)')

// ── SCHRITT 3: 30 Mietvertrag-PDFs (3 pro Liegenschaft) ──
console.log('Generiere 30 Mietvertrag-PDFs...')

function createMietvertragPDF(outputPath, liegenschaft, top, mieterVorname, mieterNachname, datum) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 })
    const stream = fs.createWriteStream(outputPath)
    doc.pipe(stream)

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('MIETVERTRAG', { align: 'center' })
    doc.fontSize(12).font('Helvetica').text('gemäß Mietrechtsgesetz (MRG), BGBl. Nr. 520/1981 idgF', { align: 'center' })
    doc.moveDown(2)

    // Parteien
    doc.fontSize(11).font('Helvetica-Bold').text('VERMIETER:')
    doc.font('Helvetica').text('Kracher ImmoGmbH')
    doc.text('Wildgansgasse 8/2, 7400 Oberwart')
    doc.text('Tel: +43 664 46 82 910 | E-Mail: kracherdigital@gmail.com')
    doc.moveDown()

    doc.font('Helvetica-Bold').text('MIETER:')
    doc.font('Helvetica').text(`${mieterVorname} ${mieterNachname}`)
    doc.moveDown()

    // Mietobjekt
    doc.font('Helvetica-Bold').text('§ 1 MIETOBJEKT')
    doc.font('Helvetica').text(`Das Mietobjekt befindet sich in der Liegenschaft ${liegenschaft.strasse}, ${liegenschaft.plz} ${liegenschaft.ort}.`)
    doc.text(`Die Wohnung Top ${top} wird dem Mieter zur ausschließlichen Nutzung als Wohnung überlassen.`)
    doc.text(`Nutzfläche: ca. ${50 + top * 2} m²`)
    doc.moveDown()

    // Mietdauer
    doc.font('Helvetica-Bold').text('§ 2 MIETDAUER')
    doc.font('Helvetica').text(`Das Mietverhältnis beginnt am ${datum} und wird auf unbestimmte Zeit abgeschlossen.`)
    doc.text('Die Kündigungsfrist beträgt drei Monate zum Monatsletzten.')
    doc.moveDown()

    // Mietzins
    const miete = 400 + top * 3
    doc.font('Helvetica-Bold').text('§ 3 MIETZINS')
    doc.font('Helvetica').text(`Der monatliche Hauptmietzins beträgt EUR ${miete},00 (in Worten: ${miete} Euro).`)
    doc.text(`Hinzu kommen Betriebskosten gemäß § 21 MRG sowie Umsatzsteuer in gesetzlicher Höhe.`)
    doc.text(`Der Gesamtmietzins beträgt EUR ${miete + 85},00 monatlich.`)
    doc.moveDown()

    // Kaution
    doc.font('Helvetica-Bold').text('§ 4 KAUTION')
    doc.font('Helvetica').text(`Der Mieter leistet eine Kaution in Höhe von EUR ${miete * 3},00 (drei Monatsmieten).`)
    doc.moveDown()

    // Erhaltung
    doc.font('Helvetica-Bold').text('§ 5 ERHALTUNG UND INSTANDHALTUNG')
    doc.font('Helvetica').text('Der Vermieter ist verpflichtet, das Mietobjekt in brauchbarem Zustand zu erhalten.')
    doc.text('Kleinere Reparaturen bis EUR 100,00 trägt der Mieter selbst.')
    doc.text('Schadensmeldungen sind unverzüglich über das SMARTCARL-Portal einzureichen.')
    doc.moveDown()

    // Hausordnung
    doc.font('Helvetica-Bold').text('§ 6 HAUSORDNUNG')
    doc.font('Helvetica').text('Der Mieter verpflichtet sich zur Einhaltung der Hausordnung.')
    doc.text('Haustiere sind nach vorheriger Genehmigung des Vermieters gestattet.')
    doc.text('Musizieren ist werktags von 10:00–12:00 und 15:00–19:00 Uhr gestattet.')
    doc.moveDown()

    // Versicherung
    doc.font('Helvetica-Bold').text('§ 7 VERSICHERUNG')
    doc.font('Helvetica').text('Das Gebäude ist durch den Vermieter gegen Feuer, Leitungswasser, Sturm und Elementarschäden versichert.')
    doc.text('Der Mieter wird empfohlen, eine eigene Haushaltsversicherung abzuschließen.')
    doc.moveDown()

    // Unterschriften
    doc.moveDown(2)
    doc.text(`Oberwart, am ${datum}`)
    doc.moveDown(2)
    doc.text('________________________          ________________________')
    doc.text('Vermieter (Kracher ImmoGmbH)      Mieter')

    doc.end()
    stream.on('finish', resolve)
  })
}

let pdfCount = 0
for (let l = 0; l < LIEGENSCHAFTEN.length; l++) {
  const lg = LIEGENSCHAFTEN[l]
  for (let t = 0; t < 3; t++) {
    const top = t * 10 + 1 + t
    const mieter = MIETER_NAMEN[(l * 3 + t) % MIETER_NAMEN.length]
    const datum = `0${t + 1}.03.2024`
    const filename = `Mietvertrag_${lg.strasse.replace(/ /g, '_')}_Top${top}.pdf`
    await createMietvertragPDF(
      path.join(DESKTOP, 'Mietvertraege', filename),
      lg, top, mieter[0], mieter[1], datum
    )
    pdfCount++
  }
}
console.log(`✓ Mietverträge: ${pdfCount} PDFs erstellt`)

// ── SCHRITT 4: 10 Versicherungs-PDFs ──
console.log('Generiere 10 Versicherungs-PDFs...')

const VERSICHERUNGSTYPEN = [
  { typ: 'Gebäudeversicherung', gesellschaft: 'UNIQA Versicherung AG', deckung: '3.500.000' },
  { typ: 'Leitungswasserversicherung', gesellschaft: 'Wiener Städtische Versicherung AG', deckung: '500.000' },
  { typ: 'Haftpflichtversicherung', gesellschaft: 'Generali Versicherung AG', deckung: '1.000.000' },
  { typ: 'Sturmschadenversicherung', gesellschaft: 'Allianz Elementar Versicherungs-AG', deckung: '800.000' },
  { typ: 'Elementarschadenversicherung', gesellschaft: 'GRAWE Versicherung AG', deckung: '600.000' },
  { typ: 'Gebäudeversicherung', gesellschaft: 'Zürich Versicherungs-AG', deckung: '4.200.000' },
  { typ: 'Leitungswasser & Sturmversicherung', gesellschaft: 'HDI Versicherung AG', deckung: '750.000' },
  { typ: 'Haftpflicht & Rechtsschutz', gesellschaft: 'ERGO Versicherung AG', deckung: '2.000.000' },
  { typ: 'Geräteversicherung', gesellschaft: 'Helvetia Versicherungen AG', deckung: '150.000' },
  { typ: 'Gebäude-Vollversicherung', gesellschaft: 'R+V Allgemeine Versicherung AG', deckung: '5.000.000' },
]

function createVersicherungsPDF(outputPath, liegenschaft, versTyp) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 })
    const stream = fs.createWriteStream(outputPath)
    doc.pipe(stream)

    doc.fontSize(18).font('Helvetica-Bold').text('VERSICHERUNGSPOLICE', { align: 'center' })
    doc.fontSize(11).font('Helvetica').text(versTyp.gesellschaft, { align: 'center' })
    doc.moveDown(2)

    doc.font('Helvetica-Bold').text('VERSICHERUNGSNEHMER:')
    doc.font('Helvetica').text('Kracher ImmoGmbH')
    doc.text('Wildgansgasse 8/2, 7400 Oberwart')
    doc.moveDown()

    doc.font('Helvetica-Bold').text('VERSICHERTES OBJEKT / LIEGENSCHAFT:')
    doc.font('Helvetica').text(`${liegenschaft.strasse}, ${liegenschaft.plz} ${liegenschaft.ort}`)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('VERSICHERUNGSART:')
    doc.font('Helvetica').text(versTyp.typ)
    doc.moveDown()

    const polNr = `AT-${2024}-${Math.floor(Math.random() * 900000 + 100000)}`
    doc.font('Helvetica-Bold').text('POLIZZENNUMMER:')
    doc.font('Helvetica').text(polNr)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('VERSICHERUNGSSUMME:')
    doc.font('Helvetica').text(`EUR ${versTyp.deckung},00`)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('VERSICHERUNGSPERIODE:')
    doc.font('Helvetica').text('01.01.2024 bis 31.12.2024 (automatische Verlängerung)')
    doc.moveDown()

    doc.font('Helvetica-Bold').text('PRÄMIE:')
    const praemie = Math.floor(parseInt(versTyp.deckung.replace('.', '')) / 10000)
    doc.font('Helvetica').text(`EUR ${praemie},00 jährlich, zahlbar vierteljährlich`)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('GEDECKTE RISIKEN:')
    if (versTyp.typ.includes('Gebäude')) {
      doc.font('Helvetica').text('• Brandschäden, Blitzschlag, Explosion')
      doc.text('• Leitungswasserschäden')
      doc.text('• Sturmschäden (ab Windstärke 7)')
      doc.text('• Einbruchdiebstahl')
    } else if (versTyp.typ.includes('Leitungswasser')) {
      doc.font('Helvetica').text('• Bruch von Rohrleitungen')
      doc.text('• Frostschäden an Leitungen')
      doc.text('• Überschwemmung durch Rohrbruch')
      doc.text('• Sturmschäden an der Außenhülle')
    } else if (versTyp.typ.includes('Haftpflicht')) {
      doc.font('Helvetica').text('• Personen- und Sachschäden gegenüber Dritten')
      doc.text('• Vermögensschäden')
      doc.text('• Mieter- und Hausherrenhaftpflicht')
    } else if (versTyp.typ.includes('Gerät')) {
      doc.font('Helvetica').text('• Heizungsanlagen und Kessel')
      doc.text('• Aufzugsanlagen')
      doc.text('• Waschmaschinen und Trockner (Gemeinschaftsräume)')
      doc.text('• Photovoltaikanlagen')
    } else {
      doc.font('Helvetica').text('• Elementarereignisse (Hochwasser, Erdrutsch, Lawinen)')
      doc.text('• Sturmschäden')
      doc.text('• Hagel')
      doc.text('• Erdbeben')
    }
    doc.moveDown()

    doc.font('Helvetica-Bold').text('SELBSTBEHALT:')
    doc.font('Helvetica').text('EUR 500,00 je Schadensfall')
    doc.moveDown()

    doc.font('Helvetica-Bold').text('SCHADENSMELDUNG:')
    doc.font('Helvetica').text('Schäden sind unverzüglich, spätestens binnen 7 Tagen, dem Versicherer zu melden.')
    doc.text(`Schadenhotline: 0800 ${Math.floor(Math.random() * 90000 + 10000)} (kostenlos, 24h)`)
    doc.moveDown(2)

    doc.text('Wien, 01.01.2024')
    doc.moveDown(2)
    doc.text('________________________          ________________________')
    doc.text(`${versTyp.gesellschaft}          Kracher ImmoGmbH`)

    doc.end()
    stream.on('finish', resolve)
  })
}

for (let l = 0; l < LIEGENSCHAFTEN.length; l++) {
  const lg = LIEGENSCHAFTEN[l]
  const versTyp = VERSICHERUNGSTYPEN[l]
  const filename = `Versicherung_${lg.strasse.replace(/ /g, '_')}_${versTyp.typ.replace(/ /g, '_').replace(/&/g, 'und')}.pdf`
  await createVersicherungsPDF(
    path.join(DESKTOP, 'Versicherungen', filename),
    lg, versTyp
  )
}
console.log('✓ Versicherungen: 10 PDFs erstellt')

// ── SCHRITT 5: Schadensfotos (SVG→PNG simuliert als PDF) ──
console.log('Generiere Schadensfotos (als PDF-Platzhalter)...')

const schadensfotos = [
  { name: 'Wasserschaden_Decke', text: 'SCHADENSFOTO\nWasserschaden Decke\nDatum: 06.04.2026\nRaum: Wohnzimmer\nBeschreibung: Wasserfleck an Decke, ca. 50x40cm,\nVerursacht durch Rohrbruch im Obergeschoss' },
  { name: 'Riss_Aussenwand', text: 'SCHADENSFOTO\nRiss in Außenwand\nDatum: 06.04.2026\nBereich: Fassade Nordseite\nBeschreibung: Vertikaler Riss, Länge ca. 80cm,\nBreite 3-5mm, möglicherweise Setzungsschaden' },
  { name: 'Defekte_Eingangstuer', text: 'SCHADENSFOTO\nDefekte Eingangstür\nDatum: 06.04.2026\nBereich: Hauseingang EG\nBeschreibung: Türschloss defekt, Schließblech\nverbogen, Tür lässt sich nicht mehr sperren' },
  { name: 'Schimmel_Bad', text: 'SCHADENSFOTO\nSchimmelbefall Badezimmer\nDatum: 06.04.2026\nRaum: Badezimmer Top 1\nBeschreibung: Schwarzer Schimmel an Fugen\nund Wand hinter Dusche, ca. 30x20cm' },
]

for (const foto of schadensfotos) {
  const fotoPath = path.join(DESKTOP, 'Schadensfotos', `${foto.name}.pdf`)
  await new Promise((resolve) => {
    const doc = new PDFDocument({ size: [400, 300], margin: 30 })
    const stream = fs.createWriteStream(fotoPath)
    doc.pipe(stream)
    doc.rect(0, 0, 400, 300).fill('#1a1a2e')
    doc.fill('#ffffff').fontSize(14).font('Helvetica-Bold')
    doc.text(foto.text, 30, 30, { width: 340, lineGap: 6 })
    doc.end()
    stream.on('finish', resolve)
  })
}
console.log('✓ Schadensfotos: 4 Dateien erstellt')

// ── ZUSAMMENFASSUNG ──
console.log('\n═══════════════════════════════════════════════════')
console.log('✅ ALLE TESTDATEIEN ERSTELLT!')
console.log('═══════════════════════════════════════════════════')
console.log(`📁 Ordner: ${DESKTOP}`)
console.log('')
console.log('📄 DATEIEN:')
console.log('  SMARTCARL_Testeinheiten.xlsx  (500 Einheiten)')
console.log('  SMARTCARL_Testeinheiten.csv   (500 Einheiten)')
console.log('  SMARTCARL_Werkstaetten.xlsx   (18 Werkstätten)')
console.log('  SMARTCARL_Werkstaetten.csv    (18 Werkstätten)')
console.log('  Mietvertraege/               (30 PDFs)')
console.log('  Versicherungen/              (10 PDFs)')
console.log('  Schadensfotos/               (4 PDFs)')
console.log('')
console.log('🔑 HV-LOGIN:')
console.log('  E-Mail: mathiaskracher@gmx.at')
console.log('  Passwort: 12345678')
console.log('')
console.log('📧 AKTIVIERUNGSCODE kommt an:')
console.log('  kracherdigital@gmx.at')
console.log('  (Mariahilfer Straße 88 Top 1 — Mieter: Mathias Kracher)')
