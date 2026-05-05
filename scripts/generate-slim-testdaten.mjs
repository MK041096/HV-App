/**
 * SLIM TEST PACK — 1 Einheit, mehrseitiger Mietvertrag, 4 HV-Versicherungen, ~25 Werkstätten
 *
 * Mieter fix:    Mathias Kracher / Mathiaskracher@gmx.at
 * Werkstätten:   alle mit Tradingworld@gmx.at + erfundene Telefonnummer
 * Liegenschaft:  Mariahilfer Straße 88, 1060 Wien Top 1
 * Versicherungen: HV-relevant (Gebäude, Leitungswasser, Haftpflicht, Elementar) — KEINE Mieter-Versicherungen
 *
 * Output:        C:/Users/tradi/Desktop/SMARTCARL_Test_Slim/
 * Usage:         node scripts/generate-slim-testdaten.mjs
 */

import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

// Bevorzugt OneDrive-Desktop wenn vorhanden (Windows synced Desktop dorthin)
const ONEDRIVE_DESKTOP = 'C:/Users/tradi/OneDrive/Desktop'
const LOCAL_DESKTOP = 'C:/Users/tradi/Desktop'
const DESKTOP = fs.existsSync(ONEDRIVE_DESKTOP) ? ONEDRIVE_DESKTOP : LOCAL_DESKTOP
const OUTPUT = path.join(DESKTOP, 'SMARTCARL_Test_Slim')
fs.mkdirSync(OUTPUT, { recursive: true })

// ════════════════════════════════════════════════════════════
// 1) EINHEIT — 1 Zeile mit Mathias Kracher als Mieter
// ════════════════════════════════════════════════════════════
const einheitenCsv = [
  ['Einheit (Adresse)', 'Mieter', 'E-Mail', 'Telefon'],
  ['Mariahilfer Straße 88 Top 1, 1060 Wien', 'Mathias Kracher', 'Mathiaskracher@gmx.at', '+43 664 46 82 910'],
]
const einheitenCsvText = '﻿' + einheitenCsv
  .map(r => r.map(c => `"${c}"`).join(','))
  .join('\n')
fs.writeFileSync(path.join(OUTPUT, '01_Einheit.csv'), einheitenCsvText, 'utf8')

// ════════════════════════════════════════════════════════════
// 2) WERKSTÄTTEN — 25 ECHTE Wien/AT-Betriebe, breit über alle Gewerke verteilt
//    Recherchiert über Web-Suche am 04.05.2026, alle Firmen mit eigener Web-Präsenz.
//    E-Mails: Tradingworld@gmx.at, Telefonnummern erfunden (kein Spam an echte Firmen).
//
// Mischung der Datenqualität für CARL-Test:
//  - 15 Einträge OHNE Beschreibung → CARL muss im Web recherchieren
//  - 10 Einträge MIT klarer Beschreibung → CARL klassifiziert direkt
// ════════════════════════════════════════════════════════════
const werkstaetten = [
  // ─── Aufzug (2) ──────────────────────────────────────────────────
  ['OTIS GmbH', '+43 664 111 0001', 'Aufzüge', ''],
  ['Schindler Aufzüge AG', '+43 664 111 0002', 'Aufzugservice & Wartung', ''],

  // ─── Schädlingsbekämpfung (1) ────────────────────────────────────
  ['Anticimex Austria GmbH', '+43 664 111 0003', 'Schädlingsbekämpfung', ''],

  // ─── Sanitär / Heizung / Gas (3) ─────────────────────────────────
  ['Pappel Installationen', '+43 664 111 0004', 'Installateur Sanitär & Heizung', '24h Notdienst, Gas-Wasser-Heizung, Boiler-Tausch, Wartung'],
  ['Adler Installationen GmbH', '+43 664 111 0005', 'Sanitär, Gas, Heizung', ''],
  ['Kocer Installateur Wien', '+43 664 111 0006', 'Heizung & Klimatechnik', ''],

  // ─── Elektrik (2) ────────────────────────────────────────────────
  ['ADA-Elektro', '+43 664 111 0007', 'Elektriker Notdienst', 'Innere Stadt, Antwortzeit 20-40 Min, Stromausfälle, Sicherungen, FI-Schalter'],
  ['BS Elektrobau e.U.', '+43 664 111 0008', 'Elektroinstallation', ''],

  // ─── Glaserei (2) ────────────────────────────────────────────────
  ['Erdö Glaserei', '+43 664 111 0009', 'Glaserei', ''],
  ['Heinzl Glasbau', '+43 664 111 0010', 'Glaserei', 'Reparaturen, Türen, Möbel, Spiegel, Fensterglas'],

  // ─── Tischlerei (2) ──────────────────────────────────────────────
  ['Tischlerei Edinger', '+43 664 111 0011', 'Tischlerei', ''],
  ['Tischlerei Schmiedmaier', '+43 664 111 0012', 'Bau- und Möbeltischlerei', ''],

  // ─── Schlosserei (2) ─────────────────────────────────────────────
  ['Star Schlosserei GmbH', '+43 664 111 0013', 'Schlosserei & Aufsperrdienst', ''],
  ['Schlosserei Janecek', '+43 664 111 0014', 'Schlosserei', 'Wiens älteste Schlosserei seit 1886, Aufsperrdienst, Schlossaustausch'],

  // ─── Maler / Verputz (2) ─────────────────────────────────────────
  ['Valenta & Valenta GmbH', '+43 664 111 0015', 'Stuckatur, Verputz, Malerei', ''],
  ['Malerei Hofbauer & Dennl', '+43 664 111 0016', 'Maler & Anstreicher', 'Innenanstrich, Verputz, Spachtel, Tapezieren'],

  // ─── Dach / Spengler (2) ─────────────────────────────────────────
  ['Eppler - Der Spengler', '+43 664 111 0017', 'Spenglerei & Dachdeckerei', ''],
  ['Hohl Gerhard Dachdeckerei & Spenglerei GmbH', '+43 664 111 0018', 'Dachdeckerei & Spenglerei', ''],

  // ─── Wasserschaden / Schimmel (2) ────────────────────────────────
  ['DRYSTAR', '+43 664 111 0019', 'Leckortung, Schimmelsanierung & Entfeuchtung', ''],
  ['SANAG Sanierung', '+43 664 111 0020', 'Schimmelsanierung', '24h erreichbar, Schimmelschäden in Wien und NÖ, Ursachenanalyse, dauerhafte Beseitigung'],

  // ─── Brandschutz (1) ─────────────────────────────────────────────
  ['Gabriel Brandschutz', '+43 664 111 0021', 'Brandschutz & Feuerlöscher-Service', ''],

  // ─── Reinigung (1) ───────────────────────────────────────────────
  ['BGN Reinigungsfirma', '+43 664 111 0022', 'Gebäudereinigung & Hausbetreuung', ''],

  // ─── Asbest- / Schadstoffsanierung (1) ───────────────────────────
  ['PORR Umwelttechnik', '+43 664 111 0023', 'Asbest- & Schadstoffsanierung', 'PORR Konzern-Tochter, industrielle Rückbau- und Demolierungsarbeiten, Dekontamination'],

  // ─── Garten / Baumpflege / Winterdienst (1) ──────────────────────
  ['SBG Spurny GmbH', '+43 664 111 0024', 'Garten- und Baumpflege', ''],

  // ─── Boden / Fliesen (1) ─────────────────────────────────────────
  ['ASKAR Fliesen & Böden', '+43 664 111 0025', 'Fliesen- und Bodenverlegung', ''],
]

const werkstaettenCsv = [
  ['Firmenname', 'Telefon', 'E-Mail', 'Tätigkeit', 'Beschreibung'],
  ...werkstaetten.map(([name, tel, taetigkeit, desc]) => [name, tel, 'Tradingworld@gmx.at', taetigkeit, desc]),
]
const werkstaettenCsvText = '﻿' + werkstaettenCsv
  .map(r => r.map(c => `"${c}"`).join(','))
  .join('\n')
fs.writeFileSync(path.join(OUTPUT, '02_Werkstaetten.csv'), werkstaettenCsvText, 'utf8')

// ════════════════════════════════════════════════════════════
// 3) MIETVERTRAG — mehrseitig, AT-Standard nach MRG
// ════════════════════════════════════════════════════════════
function createMietvertrag(outputPath) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60, bufferPages: true })
    const stream = fs.createWriteStream(outputPath)
    doc.pipe(stream)

    const H1 = (t) => doc.fontSize(16).font('Helvetica-Bold').text(t, { align: 'center' }).moveDown(0.3)
    const H2 = (t) => doc.fontSize(11).font('Helvetica-Bold').text(t).moveDown(0.2)
    const P  = (t) => doc.fontSize(10).font('Helvetica').text(t, { align: 'justify' }).moveDown(0.4)
    const SM = (t) => doc.fontSize(9).font('Helvetica-Oblique').fillColor('#444').text(t, { align: 'justify' }).fillColor('#000').moveDown(0.4)

    // ── Seite 1: Header & Parteien ──
    H1('M I E T V E R T R A G')
    doc.fontSize(10).font('Helvetica').text('über eine Wohnung gemäß Mietrechtsgesetz (MRG), BGBl. Nr. 520/1981 idgF', { align: 'center' })
    doc.fontSize(9).text('sowie Allgemeines Bürgerliches Gesetzbuch (ABGB) und Konsumentenschutzgesetz (KSchG)', { align: 'center' })
    doc.moveDown(1.5)

    H2('abgeschlossen zwischen')
    P('Muster HV GmbH\nWildgansgasse 8/2, 7400 Oberwart\nFirmenbuchnummer: FN 123456a, Landesgericht Eisenstadt\nUID: ATU12345678\nTel.: +43 664 46 82 910 | E-Mail: kracherdigital@gmail.com')
    doc.font('Helvetica-Oblique').fontSize(9).text('— im Folgenden „Vermieter" genannt —', { align: 'right' }).font('Helvetica').fontSize(10).moveDown()

    H2('und')
    P('Herrn Mathias Kracher\ngeboren am 01.01.1990\nwohnhaft in Mariahilfer Straße 88 Top 1, 1060 Wien\nE-Mail: Mathiaskracher@gmx.at | Tel.: +43 664 46 82 910')
    doc.font('Helvetica-Oblique').fontSize(9).text('— im Folgenden „Mieter" genannt —', { align: 'right' }).font('Helvetica').fontSize(10).moveDown()

    H2('§ 1 Mietgegenstand')
    P('(1) Der Vermieter überlässt dem Mieter die Wohnung Top 1 im Erdgeschoß des Hauses Mariahilfer Straße 88, 1060 Wien, bestehend aus 2 Zimmern, Küche, Vorraum, Bad, WC, mit einer Gesamtnutzfläche von 62,40 m², zur ausschließlichen Wohnnutzung.')
    P('(2) Mitvermietet sind: 1 Kellerabteil (Nr. 1), Mitbenutzung des Innenhofes und der allgemeinen Teile des Hauses (Stiegenhaus, Müllraum, Fahrradraum).')
    P('(3) Die Wohnung wird in dem im Übergabeprotokoll (Beilage ./A) festgehaltenen Zustand übergeben.')

    // ── Seite 2 ──
    doc.addPage()
    H2('§ 2 Mietzweck')
    P('Die Wohnung dient ausschließlich Wohnzwecken des Mieters und der mit ihm im gemeinsamen Haushalt lebenden Personen. Eine gewerbliche Nutzung, auch teilweise, ist untersagt und bedarf der ausdrücklichen schriftlichen Zustimmung des Vermieters.')

    H2('§ 3 Beginn und Dauer des Mietverhältnisses')
    P('(1) Das Mietverhältnis beginnt am 01.05.2026 und wird auf unbestimmte Zeit abgeschlossen.')
    P('(2) Der Mietvertrag unterliegt dem Vollanwendungsbereich des MRG.')

    H2('§ 4 Kündigung')
    P('(1) Das Mietverhältnis kann unter Einhaltung der gesetzlichen Kündigungsfrist von drei Monaten zum Monatsletzten schriftlich aufgekündigt werden.')
    P('(2) Eine Aufkündigung durch den Vermieter bedarf eines Kündigungsgrundes gemäß § 30 MRG.')

    H2('§ 5 Hauptmietzins')
    P('(1) Der monatliche Hauptmietzins beträgt EUR 580,00 (in Worten: fünfhundertachtzig Euro). Er ist gemäß § 16 MRG als angemessener Hauptmietzins vereinbart.')
    P('(2) Hinzu kommen die anteiligen Betriebskosten gemäß § 21 MRG, die laufenden öffentlichen Abgaben sowie die Umsatzsteuer in gesetzlicher Höhe (derzeit 10 % auf Wohnraumvermietung).')
    P('(3) Der Gesamtmietzins beträgt zum Vertragsbeginn EUR 742,30 monatlich (Hauptmietzins zzgl. Betriebskostenakonto EUR 102,00, USt 10 % EUR 60,30).')
    P('(4) Der Mietzins ist im Vorhinein, spätestens am 5. eines jeden Monats, kostenfrei auf das Konto des Vermieters bei der Erste Bank (IBAN AT00 0000 0000 0000 0000) zu überweisen.')

    H2('§ 6 Wertsicherung / Indexanpassung')
    P('Der Hauptmietzins ist wertgesichert nach dem Verbraucherpreisindex 2020 (VPI) der Statistik Austria. Als Bezugsgröße gilt der für den Monat des Vertragsbeginns verlautbarte Indexwert. Anpassungen erfolgen jährlich, frühestens 12 Monate nach Vertragsbeginn, bei Indexschwankungen ab 5 %.')

    H2('§ 7 Kaution')
    P('Der Mieter leistet eine Kaution in Höhe von EUR 1.740,00 (drei Bruttomonatsmieten) durch Banküberweisung. Die Kaution wird auf einem Sparbuch zugunsten des Mieters mündelsicher veranlagt. Die Kaution dient der Sicherung sämtlicher Ansprüche des Vermieters aus dem Mietverhältnis und ist bei ordnungsgemäßer Rückgabe der Wohnung zurückzuerstatten.')

    // ── Seite 3 ──
    doc.addPage()
    H2('§ 8 Übergabe und Zustand')
    P('(1) Die Wohnung wird in geräumtem, gereinigtem und besenrein übergebenen Zustand übergeben. Der genaue Zustand sowie eventuelle Mängel werden im Übergabeprotokoll festgehalten.')
    P('(2) Der Mieter bestätigt, dass die Wohnung in einem dem Vertragszweck entsprechenden, brauchbaren Zustand iSd § 1096 ABGB übernommen wird.')

    H2('§ 9 Erhaltung und Instandhaltung')
    P('(1) Der Vermieter ist gemäß § 3 MRG zur Erhaltung des Mietgegenstandes in brauchbarem Zustand verpflichtet, soweit es sich um ernste Schäden des Hauses, erhebliche Gesundheitsgefährdungen oder die Behebung von Funktionsstörungen wesentlicher Anlagen (Heizung, Wasser, Strom) handelt.')
    P('(2) Alle vom Vermieter zu tragenden Erhaltungsarbeiten werden über das digitale Schadensmeldungssystem SMARTCARL abgewickelt. Schäden sind unverzüglich über das Mieterportal (smartcarl.com) zu melden.')

    H2('§ 10 Kleinreparaturen')
    P('Der Mieter trägt selbst Kosten für Kleinreparaturen bis zu einem Betrag von EUR 100,00 je Einzelreparatur (Wartung von Wasserhähnen, Lichtschaltern, Türgriffen, Duschköpfen, Toilettensitzen). Insgesamt darf dieser Betrag pro Mietjahr 6 % der Jahresmiete nicht überschreiten.')

    H2('§ 11 Veränderungen am Mietgegenstand')
    P('Veränderungen am Mietgegenstand, insbesondere bauliche Maßnahmen, Einbauten, Bohrungen in tragenden Wänden oder die Anbringung von Markisen/Klimageräten an der Außenfassade, bedürfen der ausdrücklichen schriftlichen Zustimmung des Vermieters.')

    H2('§ 12 Untervermietung')
    P('Eine entgeltliche oder unentgeltliche Untervermietung oder sonstige Überlassung der Wohnung an Dritte ist nur mit ausdrücklicher schriftlicher Zustimmung des Vermieters zulässig. Aufenthalte naher Angehöriger gelten nicht als Untervermietung.')

    H2('§ 13 Hausordnung')
    P('Die Hausordnung (Beilage ./B) ist Bestandteil dieses Vertrages. Insbesondere gilt: Nachtruhe von 22:00 bis 06:00 Uhr; Musizieren werktags 10:00–12:00 und 15:00–19:00; sonn- und feiertags ganztags untersagt; Reinigung der allgemeinen Teile des Hauses gemäß Reinigungsplan.')

    // ── Seite 4 ──
    doc.addPage()
    H2('§ 14 Tierhaltung')
    P('(1) Die Haltung von Hunden und Katzen sowie anderen größeren Haustieren ist nur nach vorheriger schriftlicher Genehmigung des Vermieters gestattet.')
    P('(2) Die Haltung von Kleintieren in handelsüblichen Behältnissen (Aquarium, Vogelkäfig, Hamsterkäfig) ist auch ohne Genehmigung zulässig, sofern keine Geruchs- oder Lärmbelästigung entsteht.')

    H2('§ 15 Versicherung')
    P('(1) Das Gebäude ist durch den Vermieter gegen Feuer, Leitungswasser, Sturm, Hagel und Elementarschäden versichert (Police siehe Beilage ./C).')
    P('(2) Dem Mieter wird der Abschluss einer eigenen Haushaltsversicherung sowie einer Haftpflichtversicherung dringend empfohlen. Schäden am persönlichen Eigentum des Mieters sind nicht durch die Gebäudeversicherung des Vermieters gedeckt.')

    H2('§ 16 Schadensmeldung über SMARTCARL')
    P('(1) Schäden am Mietobjekt oder den allgemeinen Teilen des Hauses sind unverzüglich, spätestens binnen 48 Stunden nach Bekanntwerden, über das Mieterportal SMARTCARL (smartcarl.com) zu melden.')
    P('(2) Bei Notfällen (akuter Wasseraustritt, Stromausfall mit Brandgefahr, Heizungsausfall im Winter, Gasleck) ist zusätzlich umgehend telefonisch unter +43 664 46 82 910 zu informieren.')
    P('(3) Der Mieter ist verpflichtet, im Schadensfall unverzüglich Sicherungsmaßnahmen zu treffen (z. B. Wasserzufuhr abdrehen) und Folgeschäden so weit wie möglich zu vermeiden.')

    H2('§ 17 Datenschutz')
    P('Der Mieter nimmt zur Kenntnis, dass seine personenbezogenen Daten (Name, Adresse, Kontaktdaten, Schadensmeldungen) zur Erfüllung des Mietvertrages und zur Schadensabwicklung durch den Vermieter sowie dessen Auftragsverarbeiter (SMARTCARL, EU-Hosting) gemäß DSGVO verarbeitet werden. Die Datenschutzerklärung ist unter smartcarl.com/datenschutz abrufbar.')

    H2('§ 18 Rauchverbot')
    P('Das Rauchen in den allgemeinen Teilen des Hauses (Stiegenhaus, Keller, Innenhof) ist untersagt. In der Wohnung ist Rauchen gestattet, der Mieter hat jedoch für entstehende Beschädigungen (Vergilbung, Geruchsbelästigung Nachbarn) bei Auszug Ersatz zu leisten.')

    // ── Seite 5 ──
    doc.addPage()
    H2('§ 19 Schlüsselübergabe')
    P('Der Mieter erhält bei Vertragsbeginn 2 (zwei) Wohnungsschlüssel sowie 1 (einen) Hausschlüssel. Verlust ist unverzüglich zu melden; die Kosten der Schloss- bzw. Schließanlagenneuanfertigung trägt im Verlustfall der Mieter.')

    H2('§ 20 Rückgabe der Wohnung')
    P('(1) Bei Beendigung des Mietverhältnisses ist die Wohnung in geräumtem, besenrein gereinigtem Zustand zu übergeben. Etwaige vom Mieter zu vertretende Beschädigungen sind beseitigt.')
    P('(2) Übermäßige Abnutzung wird vom Mieter ersetzt. Normale Abnutzung iSd § 1109 ABGB geht zu Lasten des Vermieters.')

    H2('§ 21 Anwendbares Recht und Gerichtsstand')
    P('Auf diesen Vertrag findet ausschließlich österreichisches Recht Anwendung. Gerichtsstand ist das sachlich zuständige Bezirksgericht für die Liegenschaft 1060 Wien (BG Innere Stadt Wien). Verbraucherrechtliche Bestimmungen bleiben unberührt.')

    H2('§ 22 Schriftform und Schlussbestimmungen')
    P('(1) Mündliche Nebenabreden bestehen nicht. Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform; dies gilt auch für die Aufhebung des Schriftformerfordernisses.')
    P('(2) Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein, bleibt die Gültigkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Bestimmung tritt eine Regelung, die dem wirtschaftlichen Zweck am nächsten kommt.')
    P('(3) Vertragsgebühr (1 % vom dreifachen Jahresbruttomietzins) wird vom Mieter getragen und im ersten Monat anteilig vorgeschrieben.')

    H2('Beilagen')
    P('./A   Übergabeprotokoll\n./B   Hausordnung\n./C   Versicherungspolicen-Auszug\n./D   Datenschutzerklärung gemäß Art. 13 DSGVO')

    doc.moveDown(2)
    P('Wien, am 01.05.2026')
    doc.moveDown(2)
    doc.fontSize(10).text('________________________________          ________________________________')
    doc.text('Muster HV GmbH                          Mathias Kracher')
    doc.fontSize(9).fillColor('#666').text('(Vermieter)                              (Mieter)').fillColor('#000')

    doc.end()
    stream.on('finish', resolve)
  })
}

// ════════════════════════════════════════════════════════════
// 4) VERSICHERUNGEN — 4 HV-relevante Policen
// ════════════════════════════════════════════════════════════
function createVersicherung(outputPath, vers) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 })
    const stream = fs.createWriteStream(outputPath)
    doc.pipe(stream)

    doc.fontSize(9).font('Helvetica').fillColor('#666').text(vers.versicherer, { align: 'right' })
    doc.text(vers.adresse, { align: 'right' }).fillColor('#000').moveDown(2)

    doc.fontSize(18).font('Helvetica-Bold').text('VERSICHERUNGSPOLIZZE', { align: 'center' })
    doc.fontSize(13).font('Helvetica').text(vers.produkt, { align: 'center' })
    doc.moveDown(1.5)

    const row = (label, value) => {
      doc.fontSize(10).font('Helvetica-Bold').text(label, { continued: true })
      doc.font('Helvetica').text('  ' + value)
      doc.moveDown(0.3)
    }

    row('Polizzennummer:', vers.polNr)
    row('Versicherungsnehmer:', 'Muster HV GmbH, Wildgansgasse 8/2, 7400 Oberwart')
    row('FN / UID:', 'FN 123456a / ATU12345678')
    row('Versicherte Liegenschaft:', 'Mariahilfer Straße 88, 1060 Wien')
    row('Versicherungssumme:', 'EUR ' + vers.summe + ',00')
    row('Selbstbehalt:', 'EUR ' + vers.selbst + ',00 je Schadensfall')
    row('Jahresprämie:', 'EUR ' + vers.praemie + ',00 (zzgl. 11 % Versicherungssteuer)')
    row('Zahlweise:', 'vierteljährlich, jeweils zum 1. des Quartals')
    row('Versicherungsperiode:', '01.01.2026 bis 31.12.2026 (automat. Verlängerung um je 1 Jahr)')
    row('Schadenmeldung:', vers.hotline + ' (24h-Schadenhotline)')
    doc.moveDown(0.8)

    doc.fontSize(11).font('Helvetica-Bold').text('VERSICHERTE GEFAHREN UND DECKUNG').moveDown(0.4)
    doc.fontSize(10).font('Helvetica')
    vers.gefahren.forEach(g => {
      doc.text('• ' + g, { indent: 10, align: 'justify' }).moveDown(0.2)
    })
    doc.moveDown(0.5)

    doc.fontSize(11).font('Helvetica-Bold').text('AUSSCHLÜSSE').moveDown(0.4)
    doc.fontSize(10).font('Helvetica')
    vers.ausschluesse.forEach(a => {
      doc.text('– ' + a, { indent: 10, align: 'justify' }).moveDown(0.2)
    })
    doc.moveDown(0.5)

    doc.fontSize(11).font('Helvetica-Bold').text('OBLIEGENHEITEN DES VERSICHERUNGSNEHMERS').moveDown(0.4)
    doc.fontSize(10).font('Helvetica').text(
      'Schäden sind unverzüglich, spätestens binnen 7 Tagen nach Kenntnis, dem Versicherer zu melden. ' +
      'Im Rahmen der Schadensminderungspflicht sind Sofortmaßnahmen zu setzen. ' +
      'Es gelten die Allgemeinen Bedingungen für die Sachversicherung (ABS) sowie die produktspezifischen Besonderen Bedingungen.',
      { align: 'justify' }
    )
    doc.moveDown(2)

    doc.fontSize(9).fillColor('#666').text('Wien, 01.01.2026', { align: 'left' })
    doc.moveDown(1.5)
    doc.fontSize(10).fillColor('#000').text('________________________          ________________________')
    doc.text(vers.versicherer + '          Muster HV GmbH')

    doc.end()
    stream.on('finish', resolve)
  })
}

const versicherungen = [
  {
    file: '04_Versicherung_Gebaeude_UNIQA.pdf',
    versicherer: 'UNIQA Österreich Versicherungen AG',
    adresse: 'Untere Donaustraße 21, 1029 Wien',
    produkt: 'Gebäudeversicherung Premium',
    polNr: 'AT-2026-G-485217',
    summe: '3.500.000',
    selbst: '500',
    praemie: '2.380',
    hotline: '+43 50 677 670',
    gefahren: [
      'Feuer (Brand, Blitzschlag, Explosion, Implosion, Anprall von Luftfahrzeugen)',
      'Leitungswasser (Bruch wasserführender Anlagen, Frostschäden, Korrosion)',
      'Sturm ab Windstärke 8 (62 km/h) und Hagel',
      'Glasbruch an festeingebauter Verglasung (inkl. Wintergarten)',
      'Einbruchdiebstahl, Vandalismus nach Einbruch',
      'Aufräumungs-, Bewegungs- und Schutzkosten bis 10 % der Versicherungssumme',
      'Mietausfall bis 18 Monate nach versichertem Schaden',
    ],
    ausschluesse: [
      'Schäden durch Krieg, innere Unruhen, Kernenergie',
      'Vorsätzlich vom Versicherungsnehmer verursachte Schäden',
      'Allmähliche Einwirkung von Temperatur, Gasen, Dämpfen, Feuchtigkeit',
      'Schäden am persönlichen Eigentum von Bewohnern',
    ],
  },
  {
    file: '05_Versicherung_Leitungswasser_WienerStaedtische.pdf',
    versicherer: 'Wiener Städtische Versicherung AG',
    adresse: 'Schottenring 30, 1010 Wien',
    produkt: 'Leitungswasserversicherung Spezial',
    polNr: 'AT-2026-LW-991423',
    summe: '750.000',
    selbst: '300',
    praemie: '890',
    hotline: '+43 50 350 350',
    gefahren: [
      'Bruch von Frischwasser- und Abwasserleitungen innerhalb des Gebäudes',
      'Bruch von Heizungs- und Klimaanlagenrohren',
      'Frostschäden an Leitungen, Heizkörpern, Boilern, Wasserzählern',
      'Rohrverstopfungen und deren Folgeschäden (Bruchortungs- und Rohrreinigungskosten)',
      'Wasserschäden durch Aquarien (bis 200 Liter) und Wasserbetten',
      'Folgeschäden an Fußböden, Wänden, Decken (Bautrocknung inkl.)',
      'Leckortungskosten bis EUR 5.000 ohne Anrechnung auf SVS',
    ],
    ausschluesse: [
      'Schäden durch Witterungseinflüsse (Regen, Schnee, Hochwasser von außen)',
      'Schäden durch Grundwasser oder aufsteigende Feuchtigkeit',
      'Schäden durch unzureichende Wartung oder bekannte Mängel',
    ],
  },
  {
    file: '06_Versicherung_Haftpflicht_Generali.pdf',
    versicherer: 'Generali Versicherung AG',
    adresse: 'Landskrongasse 1-3, 1010 Wien',
    produkt: 'Haftpflichtversicherung Hausherren Premium',
    polNr: 'AT-2026-HH-552831',
    summe: '5.000.000',
    selbst: '0',
    praemie: '420',
    hotline: '+43 1 53401-0',
    gefahren: [
      'Personen- und Sachschäden gegenüber Mietern und Dritten',
      'Schäden durch mangelhafte Bauwerksunterhaltung (§ 1319 ABGB)',
      'Schäden durch herabfallende Bauteile, Fassadenstücke, Eis und Schnee',
      'Schäden durch Streupflichtverletzung (Glatteis vor dem Haus)',
      'Vermögensschäden bis EUR 100.000 (z. B. fehlerhafte Betriebskostenabrechnung)',
      'Mitversicherte Hausverwaltung und beauftragte Hausbetreuer',
      'Forderungsausfalldeckung gegen Schädiger (Subsidiärdeckung)',
    ],
    ausschluesse: [
      'Tätigkeit als Bauherr (separate Bauherrenhaftpflicht erforderlich)',
      'Vorsätzlich verursachte Schäden',
      'Reine Vermögensschäden außerhalb der ausdrücklichen Deckung',
      'Schäden des Versicherungsnehmers selbst (Eigenschäden)',
    ],
  },
  {
    file: '07_Versicherung_Elementarschaden_GRAWE.pdf',
    versicherer: 'Grazer Wechselseitige Versicherung AG',
    adresse: 'Herrengasse 18-20, 8010 Graz',
    produkt: 'Elementarschadenversicherung Naturgefahren Plus',
    polNr: 'AT-2026-EL-117009',
    summe: '600.000',
    selbst: '1.000',
    praemie: '350',
    hotline: '+43 316 8037-0',
    gefahren: [
      'Hochwasser und Überschwemmung (auch durch Starkregen mit Niederschlagsmengen ab 30 mm/h)',
      'Erdrutsch, Erdsenkung, Murenabgang',
      'Erdbeben (ab Magnitude 4,0 Richterskala)',
      'Lawinen und Schneedruck',
      'Vulkanausbrüche (akademisch — gilt auch für AT)',
      'Rückstau aus Kanalisationsleitungen',
    ],
    ausschluesse: [
      'Schäden durch Grundwasser, sofern nicht durch Hochwasser verursacht',
      'Schäden in Hochrisikozonen (HORA-Zone 4) sofern nicht ausdrücklich versichert',
      'Reine Sturm-/Hagelschäden ohne Elementarursache',
    ],
  },
]

// ════════════════════════════════════════════════════════════
// MAIN — Async PDF-Generierung
// ════════════════════════════════════════════════════════════
console.log('Generiere Slim Test Pack ...')

await createMietvertrag(path.join(OUTPUT, '03_Mietvertrag_MathiasKracher_Top1.pdf'))
console.log('  ✓ Mietvertrag (mehrseitig, MRG-Standard)')

for (const v of versicherungen) {
  await createVersicherung(path.join(OUTPUT, v.file), v)
  console.log('  ✓ ' + v.file)
}

// ════════════════════════════════════════════════════════════
// README
// ════════════════════════════════════════════════════════════
const readme = `SMARTCARL Slim Test Pack
========================

INHALT
------
01_Einheit.csv                                       1 Einheit (Mariahilfer Straße 88 Top 1, 1060 Wien)
                                                     Mieter: Mathias Kracher / Mathiaskracher@gmx.at
02_Werkstaetten.csv                                  ${werkstaetten.length} Werkstätten (alle Tradingworld@gmx.at)
03_Mietvertrag_MathiasKracher_Top1.pdf               5-seitiger MRG-Mietvertrag, AT-Standard
04_Versicherung_Gebaeude_UNIQA.pdf                   Gebäudeversicherung Premium 3,5 Mio
05_Versicherung_Leitungswasser_WienerStaedtische.pdf Leitungswasser Spezial 750k
06_Versicherung_Hausherrenhaftpflicht_Generali.pdf   Hausherrenhaftpflicht 5 Mio
07_Versicherung_Elementarschaden_GRAWE.pdf           Elementarschaden 600k

REIHENFOLGE LAUT DASHBOARD-ANLEITUNG
------------------------------------
1. Einheiten:    /dashboard/units/import → 01_Einheit.csv
2. Dokumente:    /dashboard/dokumente
                 - 03_Mietvertrag... der Einheit "Mariahilfer Straße 88 Top 1" zuweisen
                 - 04_-07_Versicherung... der Liegenschaft "Mariahilfer Straße 88" zuweisen
3. Werkstätten:  /dashboard/werkstaetten/import → 02_Werkstaetten.csv

ANSCHLIESSEND
-------------
4. /dashboard/codes → Aktivierungscode für Mathiaskracher@gmx.at generieren
5. Mieter-Mail empfangen → Mieter registriert sich
6. Schadensmeldung erstellen → CARL analysiert mit Mietvertrag + Versicherung im Kontext

PHILOSOPHIE
-----------
- App ist Mehrwert für die HV.
- Wenn CARL erkennt: "Mieter zuständig" → HV ist raus → App ist raus.
- Mieter-Versicherungen (Haushalt, persönliche Haftpflicht) sind nicht Teil dieses Setups.
- HV-Versicherungen decken Gebäude, Leitungswasser, Haftpflicht, Elementar.
`
fs.writeFileSync(path.join(OUTPUT, 'README.txt'), readme, 'utf8')

console.log('  ✓ README.txt')
console.log('')
console.log('✅ Test Pack: ' + OUTPUT)
