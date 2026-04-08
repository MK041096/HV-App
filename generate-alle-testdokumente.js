#!/usr/bin/env node
'use strict';
/**
 * generate-alle-testdokumente.js
 * Erstellt 50 Mietverträge + 8 Versicherungspolicen für SMARTCARL-Tests.
 * Ausführen: node generate-alle-testdokumente.js
 */
const PDFDocument = require('pdfkit');
const fs   = require('fs');
const path = require('path');

// ─── OUTPUT ───────────────────────────────────────────────────────────────────
const BASE    = path.join('C:', 'Users', 'tradi', 'Hausverwaltungs App', 'Test-Dokumente');
const MV_BASE = path.join(BASE, 'Mietvertraege');
const VS_BASE = path.join(BASE, 'Versicherungen');

// ─── VERMIETER ────────────────────────────────────────────────────────────────
const VR = {
  firma : 'SMARTCARL Hausverwaltungs GmbH',
  str   : 'Mariahilfer Straße 100',
  plz   : '1060 Wien',
  uid   : 'ATU81585679',
  fn    : 'FN 543210a, Handelsgericht Wien',
  gesch : 'Mag. Alexander Brandstetter, Geschäftsführer',
  tel   : '+43 1 234 56 78',
  email : 'verwaltung@smartcarl.com',
  iban  : 'AT41 2011 1800 8001 2345',
  bic   : 'GIBAATWWXXX',
};

// ─── LIEGENSCHAFTEN ────────────────────────────────────────────────────────────
const LIEGENSCHAFTEN = [
  {
    id    : 'brigittenauer',
    str   : 'Brigittenauer Lände 18',
    plz   : '1200',
    ort   : 'Wien',
    bezirk: '20. Wiener Gemeindebezirk (Brigittenau)',
    mult  : 0.92,
    bj    : 1965,
    keller: 'Kellerabteil K',
    tops  : [1,2,3,4,5,6,7,8,9,10,11,12],
    base  : '2021-03-01',
    vsGes : 'UNIQA Österreich Versicherungen AG',
    vsPol : 'GV-2024-BL18-0001',
    vsSum : '4.200.000,00',
    vsPrae: '3.840,00',
  },
  {
    id    : 'doeblinger',
    str   : 'Döblinger Hauptstraße 51',
    plz   : '1190',
    ort   : 'Wien',
    bezirk: '19. Wiener Gemeindebezirk (Döbling)',
    mult  : 1.28,
    bj    : 1972,
    keller: 'Kellerabteil K',
    tops  : [1,2,3,4,5,6,7,8,9,10,11,12],
    base  : '2021-05-01',
    vsGes : 'Allianz Elementar Versicherungs-AG',
    vsPol : 'GV-2024-DH51-0001',
    vsSum : '5.800.000,00',
    vsPrae: '5.220,00',
  },
  {
    id    : 'favoriten',
    str   : 'Favoritenstraße 42',
    plz   : '1100',
    ort   : 'Wien',
    bezirk: '10. Wiener Gemeindebezirk (Favoriten)',
    mult  : 0.88,
    bj    : 1958,
    keller: 'Kellerabteil K',
    tops  : [1,2,3,4,5,6,7,8,9,10,11,12],
    base  : '2021-07-01',
    vsGes : 'Generali Versicherung AG',
    vsPol : 'GV-2024-FA42-0001',
    vsSum : '3.900.000,00',
    vsPrae: '3.510,00',
  },
  {
    id    : 'hernals',
    str   : 'Hernalser Hauptstraße 63',
    plz   : '1170',
    ort   : 'Wien',
    bezirk: '17. Wiener Gemeindebezirk (Hernals)',
    mult  : 1.05,
    bj    : 1968,
    keller: 'Kellerabteil K',
    tops  : [1,2,3,4,5,6,7,8,9,10,11,12,13],
    base  : '2021-09-01',
    vsGes : 'Wiener Städtische Versicherung AG',
    vsPol : 'GV-2024-HH63-0001',
    vsSum : '4.600.000,00',
    vsPrae: '4.140,00',
  },
];

const MARIAHILFER = {
  id    : 'mariahilfer',
  str   : 'Mariahilfer Straße 88',
  plz   : '1060',
  ort   : 'Wien',
  bezirk: '6. Wiener Gemeindebezirk (Mariahilf)',
  mult  : 1.42,
  bj    : 1978,
  keller: 'Kellerabteil K',
  tops  : [1],
  top   : 1,
  mieter: { v:'Mathias', n:'Kracher', geb:'15.03.1985', email:'kracherdigital@gmx.at' },
  start : '01.06.2023',
};

// ─── 49 FIKTIVE MIETER ─────────────────────────────────────────────────────────
const MIETER = [
  { v:'Andreas',   n:'Huber',        geb:'12.05.1978' },
  { v:'Maria',     n:'Schuster',     geb:'23.11.1982' },
  { v:'Thomas',    n:'Gruber',       geb:'07.03.1975' },
  { v:'Elisabeth', n:'Wagner',       geb:'14.08.1990' },
  { v:'Michael',   n:'Bauer',        geb:'29.01.1968' },
  { v:'Katharina', n:'Müller',       geb:'03.07.1985' },
  { v:'Stefan',    n:'Steiner',      geb:'18.12.1979' },
  { v:'Anna',      n:'Leitner',      geb:'25.04.1993' },
  { v:'Christian', n:'Moser',        geb:'09.06.1971' },
  { v:'Sabine',    n:'Pichler',      geb:'31.10.1988' },
  { v:'Johann',    n:'Mayr',         geb:'16.02.1965' },
  { v:'Eva',       n:'Berger',       geb:'05.09.1984' },
  { v:'Klaus',     n:'Wimmer',       geb:'22.03.1977' },
  { v:'Monika',    n:'Fuchs',        geb:'11.07.1992' },
  { v:'Werner',    n:'Hofer',        geb:'28.11.1963' },
  { v:'Christine', n:'Zimmermann',   geb:'02.05.1987' },
  { v:'Gerhard',   n:'Schmid',       geb:'19.08.1972' },
  { v:'Helga',     n:'Reiter',       geb:'06.01.1980' },
  { v:'Franz',     n:'Eder',         geb:'14.04.1969' },
  { v:'Barbara',   n:'Schwarz',      geb:'30.09.1991' },
  { v:'Josef',     n:'Winkler',      geb:'07.12.1961' },
  { v:'Susanne',   n:'Brunner',      geb:'24.06.1986' },
  { v:'Peter',     n:'Krenn',        geb:'11.03.1974' },
  { v:'Andrea',    n:'Mayer',        geb:'18.10.1989' },
  { v:'Karl',      n:'Koller',       geb:'03.07.1966' },
  { v:'Ingrid',    n:'Fischbach',    geb:'29.01.1981' },
  { v:'Martin',    n:'Krejci',       geb:'15.05.1976' },
  { v:'Renate',    n:'Haas',         geb:'22.08.1984' },
  { v:'Bernhard',  n:'Traxler',      geb:'08.02.1970' },
  { v:'Gabriele',  n:'Roth',         geb:'04.11.1994' },
  { v:'Hans',      n:'Hofmann',      geb:'17.06.1962' },
  { v:'Claudia',   n:'Spitzer',      geb:'26.03.1987' },
  { v:'Walter',    n:'Schneider',    geb:'13.09.1973' },
  { v:'Margit',    n:'Steinbauer',   geb:'01.12.1985' },
  { v:'Erich',     n:'Lehner',       geb:'20.04.1967' },
  { v:'Petra',     n:'Weiss',        geb:'09.07.1990' },
  { v:'Robert',    n:'Kohl',         geb:'16.11.1978' },
  { v:'Brigitte',  n:'Endl',         geb:'05.02.1983' },
  { v:'Manfred',   n:'Brunthaler',   geb:'23.08.1960' },
  { v:'Sonja',     n:'Raber',        geb:'12.05.1992' },
  { v:'Günther',   n:'Felder',       geb:'07.01.1971' },
  { v:'Ursula',    n:'Gschwandtner', geb:'14.06.1979' },
  { v:'Helmut',    n:'Strasser',     geb:'28.10.1964' },
  { v:'Irene',     n:'Pointner',     geb:'03.03.1988' },
  { v:'Roland',    n:'Burger',       geb:'19.07.1975' },
  { v:'Veronika',  n:'Kaspar',       geb:'30.11.1982' },
  { v:'Norbert',   n:'Pfeifer',      geb:'08.04.1969' },
  { v:'Regina',    n:'Kern',         geb:'21.09.1986' },
  { v:'Dietmar',   n:'Gärtner',      geb:'14.12.1973' },
];

// Nutzflächen für Top 1–13
const SIZES = [46.5, 54.2, 61.8, 68.3, 74.9, 81.5, 87.2, 92.6, 96.8, 103.4, 108.1, 112.7, 118.3];

// ─── HILFSFUNKTIONEN ──────────────────────────────────────────────────────────
function getSize(topIdx) { return SIZES[Math.min(topIdx, SIZES.length - 1)]; }

function getStock(topNr) {
  const stocks = [
    'Erdgeschoss', 'Erdgeschoss',
    '1. Obergeschoss', '1. Obergeschoss',
    '2. Obergeschoss', '2. Obergeschoss',
    '3. Obergeschoss', '3. Obergeschoss',
    '4. Obergeschoss', '4. Obergeschoss',
    '5. Obergeschoss', '5. Obergeschoss',
    '6. Obergeschoss',
  ];
  return stocks[Math.min(topNr - 1, stocks.length - 1)];
}

function getZimmer(size) {
  if (size < 55) return { anz:'2', str:'1 Wohnzimmer, 1 Schlafzimmer, Küche, Badezimmer mit WC' };
  if (size < 65) return { anz:'2', str:'1 Wohnzimmer, 1 Schlafzimmer, Wohnküche, Badezimmer mit WC, Vorraum' };
  if (size < 80) return { anz:'3', str:'1 Wohnzimmer, 2 Schlafzimmer, Küche, Badezimmer, sep. WC, Vorraum' };
  if (size < 98) return { anz:'3', str:'1 Wohnzimmer, 2 Schlafzimmer, Küche, Badezimmer, sep. WC, Vorraum, Abstellraum' };
  return          { anz:'4', str:'1 Wohnzimmer, 3 Schlafzimmer, Küche, Badezimmer, sep. WC, Vorraum, Abstellraum, Loggia' };
}

function getMietzins(size, mult) {
  const hm  = Math.round(size * 6.39 * mult * 100) / 100;
  const bk  = Math.round(size * 2.45 * 100) / 100;
  const ust = Math.round(hm * 0.10  * 100) / 100;
  const ges = Math.round((hm + bk + ust) * 100) / 100;
  const kau = Math.round(hm * 3 * 100) / 100;
  return { hm, bk, ust, ges, kau };
}

function eur(n) { return n.toFixed(2).replace('.', ',') + ' EUR'; }

function dateOffset(base, months) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function safeName(str) {
  return str
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')
    .replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue')
    .replace(/ß/g,'ss')
    .replace(/\s+/g,'-')
    .replace(/[^a-zA-Z0-9-]/g,'');
}

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }

function makePDF(filePath, buildFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size:'A4', margins:{ top:60, bottom:60, left:70, right:70 } });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    stream.on('finish', resolve);
    stream.on('error', reject);
    try { buildFn(doc); } catch(e) { reject(e); return; }
    doc.end();
  });
}

// ─── LAYOUT-HELFER ────────────────────────────────────────────────────────────
function hr(doc) {
  doc.moveTo(70, doc.y).lineTo(doc.page.width - 70, doc.y).lineWidth(0.4).strokeColor('#aaaaaa').stroke();
  doc.strokeColor('#000000');
  doc.moveDown(0.6);
}

function section(doc, title) {
  doc.moveDown(0.4);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a2e').text(title);
  doc.fillColor('#000000');
  doc.moveTo(70, doc.y + 2).lineTo(doc.page.width - 70, doc.y + 2).lineWidth(0.3).strokeColor('#999999').stroke();
  doc.strokeColor('#000000');
  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(10);
}

function kv(doc, label, value) {
  doc.font('Helvetica-Bold').text(label + '  ', { continued: true }).font('Helvetica').text(value);
}

function docHeader(doc, gesellschaft, titel) {
  doc.fontSize(9).font('Helvetica').fillColor('#666666')
     .text(`${gesellschaft}  |  Versicherungsnehmer: ${VR.firma}`, { align:'center' });
  doc.moveDown(0.3);
  doc.moveTo(70, doc.y).lineTo(doc.page.width-70, doc.y).lineWidth(0.5).strokeColor('#cccccc').stroke();
  doc.strokeColor('#000000').fillColor('#000000');
  doc.moveDown(1.5);
  doc.fontSize(18).font('Helvetica-Bold').text(titel, { align:'center' });
  doc.moveDown(1.2);
  doc.font('Helvetica').fontSize(10);
}

// ─── MIETVERTRAG ─────────────────────────────────────────────────────────────
function buildMietvertrag(doc, { lg, topNr, mieter, beginn, vertragNr }) {
  const size  = getSize(topNr - 1);
  const stock = getStock(topNr);
  const zm    = getZimmer(size);
  const mz    = getMietzins(size, lg.mult);
  const PW    = doc.page.width - 140;

  // ── Kopf ────────────────────────────────────────────────────────────────────
  doc.fontSize(9).font('Helvetica').fillColor('#666666')
     .text(`${VR.firma}  |  ${VR.str}, ${VR.plz}  |  ${VR.tel}  |  ${VR.email}`, { align:'center' });
  doc.moveDown(0.3);
  doc.moveTo(70, doc.y).lineTo(doc.page.width-70, doc.y).lineWidth(0.5).strokeColor('#cccccc').stroke();
  doc.strokeColor('#000000').fillColor('#000000');
  doc.moveDown(1.5);

  doc.fontSize(22).font('Helvetica-Bold').text('MIETVERTRAG', { align:'center' });
  doc.moveDown(0.4);
  doc.fontSize(11).font('Helvetica').text('gemäß §§ 1–29 Mietrechtsgesetz (MRG) idgF', { align:'center' });
  doc.moveDown(1.2);
  hr(doc);

  doc.fontSize(10).font('Helvetica');
  kv(doc, 'Vertragsnummer:',           vertragNr);
  kv(doc, 'Vertragsgegenstand:',       `${lg.str}, Top ${topNr}, ${lg.plz} ${lg.ort}`);
  kv(doc, 'Mieter/in:',                `${mieter.v} ${mieter.n}, geb. ${mieter.geb}`);
  kv(doc, 'Mietbeginn:',               beginn);
  kv(doc, 'Mietdauer:',                'Unbefristet');
  kv(doc, 'Monatlicher Gesamtmietzins:', eur(mz.ges));
  doc.moveDown(0.8);
  hr(doc);

  // § 1 VERTRAGSPARTEIEN ──────────────────────────────────────────────────────
  section(doc, '§ 1  Vertragsparteien');

  doc.font('Helvetica-Bold').text('1.1  Vermieter (im Folgenden „Vermieter"):').font('Helvetica');
  doc.text(`Firma:             ${VR.firma}`);
  doc.text(`Adresse:           ${VR.str}, ${VR.plz}`);
  doc.text(`UID-Nummer:        ${VR.uid}`);
  doc.text(`Firmenbuchnummer:  ${VR.fn}`);
  doc.text(`Vertreten durch:   ${VR.gesch}`);
  doc.text(`Telefon:           ${VR.tel}`);
  doc.text(`E-Mail:            ${VR.email}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').text('1.2  Hauptmieter (im Folgenden „Mieter"):').font('Helvetica');
  doc.text(`Name:              ${mieter.v} ${mieter.n}`);
  doc.text(`Geburtsdatum:      ${mieter.geb}`);
  if (mieter.email) doc.text(`E-Mail:            ${mieter.email}`);
  doc.moveDown(0.5);
  doc.text('Vermieter und Mieter werden gemeinsam als „Vertragsparteien" bezeichnet.');

  // § 2 MIETGEGENSTAND ────────────────────────────────────────────────────────
  section(doc, '§ 2  Mietgegenstand');
  doc.text(
    `Der Vermieter vermietet dem Mieter die Wohnung Top ${topNr} im ${stock} des Gebäudes ` +
    `${lg.str}, ${lg.plz} ${lg.ort} (${lg.bezirk}). Die Liegenschaft wurde im Jahr ${lg.bj} erbaut.`
  );
  doc.moveDown(0.5);
  doc.text(`Die Wohnung besteht aus ${zm.anz} Zimmern und umfasst:`);
  doc.text(zm.str, { indent:20 });
  doc.moveDown(0.5);
  doc.text(`Nutzfläche (§ 17 MRG):    ${size.toFixed(1)} m²`);
  doc.text(`Kellerabteil:             ${lg.keller}${topNr}, ${lg.str}`);
  doc.text(`Ausstattungskategorie:    Kategorie A gemäß § 15a MRG`);
  doc.text(`Baujahr des Gebäudes:     ${lg.bj}`);

  // § 3 VERWENDUNGSZWECK ──────────────────────────────────────────────────────
  section(doc, '§ 3  Verwendungszweck');
  doc.text(
    'Der Mietgegenstand wird ausschließlich zu Wohnzwecken überlassen. Eine gewerbliche oder ' +
    'berufliche Nutzung – auch nur teilweise – ist ohne vorherige schriftliche Genehmigung des ' +
    'Vermieters nicht gestattet. Die Nutzung als Kurzzeitunterkunft (z.B. Airbnb) ist ausdrücklich untersagt.'
  );

  // § 4 MIETDAUER ─────────────────────────────────────────────────────────────
  section(doc, '§ 4  Mietdauer');
  doc.text(
    `Das Mietverhältnis beginnt am ${beginn} und wird auf unbestimmte Zeit (unbefristet) abgeschlossen. ` +
    'Die Bestimmungen des MRG über Kündigungsschutz gelten uneingeschränkt. Eine Befristung gemäß ' +
    '§ 29 MRG wurde nicht vereinbart.'
  );

  // § 5 HAUPTMIETZINS ─────────────────────────────────────────────────────────
  doc.addPage();
  section(doc, '§ 5  Hauptmietzins');
  doc.text(
    `5.1  Der monatliche Hauptmietzins beträgt ${eur(mz.hm)} (netto, ohne USt). ` +
    'Er wird nach dem angemessenen Mietzins gemäß §§ 16 und 44 MRG berechnet.'
  );
  doc.moveDown(0.5);
  doc.text(
    '5.2  Berechnungsgrundlage ist der gesetzliche Richtwert für Wien gemäß § 5 Abs. 1 ' +
    'Richtwertgesetz (RichtWG) in der geltenden Fassung (EUR 6,39/m² per 01.04.2023) ' +
    `multipliziert mit einem Zu-/Abschlag entsprechend der Lage (${lg.bezirk}) und der ` +
    'Ausstattung des Mietgegenstandes.'
  );
  doc.moveDown(0.5);
  doc.text(
    `5.3  Der Hauptmietzins ist monatlich im Voraus, spätestens am 1. des jeweiligen ` +
    'Kalendermonats, auf folgendes Konto des Vermieters zu überweisen:'
  );
  doc.text(`     IBAN:             ${VR.iban}`, { indent:20 });
  doc.text(`     BIC:              ${VR.bic}`,  { indent:20 });
  doc.text(`     Verwendungszweck: Miete Top ${topNr} ${lg.str} – ${mieter.v} ${mieter.n}`, { indent:20 });
  doc.moveDown(0.5);
  doc.text(
    '5.4  Bei verspäteter Zahlung werden Verzugszinsen in gesetzlicher Höhe (§§ 1333, 1335 ABGB) ' +
    'sowie Mahnspesen in Höhe von EUR 15,00 je Mahnung verrechnet.'
  );

  // § 6 BETRIEBSKOSTEN ────────────────────────────────────────────────────────
  section(doc, '§ 6  Betriebskosten und sonstige Entgelte');
  doc.text(
    `6.1  Neben dem Hauptmietzins hat der Mieter eine monatliche Betriebskostenvorauszahlung ` +
    `von ${eur(mz.bk)} zu leisten. Diese umfasst anteilig folgende Positionen gemäß § 21 MRG:`
  );
  const bkItems = [
    'Wassergebühren und Kanalgebühren (MA 31)',
    'Müllabfuhr (MA 48)',
    'Kehrgebühren (MA 48)',
    'Hausbetreuung (Reinigung Gemeinschaftsflächen, Winterdienst)',
    'Anteil an der Gebäudeversicherungsprämie',
    'Allgemeinstrom (Stiegenhaus, Keller)',
    'Aufzugswartung und Betriebskosten des Aufzugs',
  ];
  bkItems.forEach(i => doc.text(`• ${i}`, { indent:20 }));
  doc.moveDown(0.5);
  doc.text(
    '6.2  Eine detaillierte Betriebskostenabrechnung gemäß § 21 MRG erfolgt jährlich bis ' +
    'spätestens 30. Juni des Folgejahres. Guthaben werden gutgeschrieben, Nachzahlungen ' +
    'werden mit der übernächsten Monatsmiete fällig.'
  );

  // § 7 UMSATZSTEUER ──────────────────────────────────────────────────────────
  section(doc, '§ 7  Umsatzsteuer');
  doc.text(
    `Auf den Hauptmietzins werden 10 % Umsatzsteuer gemäß § 10 Abs. 2 Z 4 UStG in Höhe von ` +
    `${eur(mz.ust)} monatlich verrechnet. Die Betriebskostenvorauszahlung ist umsatzsteuerbefreit.`
  );

  // Zusammenfassung
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').text('Monatliche Gesamtbelastung:').font('Helvetica');
  doc.text(`  Hauptmietzins netto:          ${eur(mz.hm)}`);
  doc.text(`  Umsatzsteuer (10 %):          ${eur(mz.ust)}`);
  doc.text(`  Betriebskostenvorauszahlung:  ${eur(mz.bk)}`);
  doc.text(`  ─────────────────────────────────────────`);
  doc.font('Helvetica-Bold').text(`  Gesamtbetrag monatlich:       ${eur(mz.ges)}`).font('Helvetica');

  // § 8 WERTSICHERUNG ─────────────────────────────────────────────────────────
  section(doc, '§ 8  Wertsicherung');
  doc.text(
    '8.1  Der Hauptmietzins wird wertgesichert. Maßzahl ist der Verbraucherpreisindex 2020 ' +
    '(VPI 2020) der Statistik Austria. Ausgangswert ist der für den Mietbeginnmonat verlautbarte ' +
    'Indexwert.'
  );
  doc.moveDown(0.4);
  doc.text(
    '8.2  Eine Anpassung des Hauptmietzinses erfolgt, sobald der kumulierte Indexanstieg ' +
    'gegenüber dem Ausgangswert (bzw. dem zuletzt angepassten Wert) 5 % übersteigt. Die ' +
    'Anpassung tritt jeweils mit dem 1. des Folgemonats nach schriftlicher Mitteilung in Kraft. ' +
    'Anpassungen nach unten werden nicht vorgenommen.'
  );

  // § 9 KAUTION ───────────────────────────────────────────────────────────────
  doc.addPage();
  section(doc, '§ 9  Kaution (Mietzinsdepot)');
  doc.text(
    `9.1  Der Mieter leistet eine Kaution in Höhe von ${eur(mz.kau)} (entspricht 3 Monats-` +
    'hauptmietzinsen) vor oder spätestens zum Zeitpunkt der Schlüsselübergabe auf das ' +
    'unter § 5.3 genannte Konto.'
  );
  doc.moveDown(0.4);
  doc.text(
    '9.2  Die Kaution dient zur Sicherung aller berechtigten Forderungen des Vermieters aus ' +
    'diesem Mietverhältnis. Sie wird nach vollständiger Rückgabe des Mietgegenstandes und ' +
    'Klärung allfälliger gegenseitiger Ansprüche – spätestens jedoch 3 Monate nach Beendigung ' +
    'des Mietverhältnisses – ohne Verzinsung rückerstattet.'
  );

  // § 10 ÜBERGABE ─────────────────────────────────────────────────────────────
  section(doc, '§ 10  Übergabe und Rückgabe des Mietgegenstandes');
  doc.text(
    `10.1  Der Mietgegenstand wird dem Mieter am ${beginn} in ordnungsgemäßem, zum vereinbarten ` +
    'Gebrauch geeignetem Zustand übergeben. Über die Übergabe wird ein gemeinsames Übergabeprotokoll ' +
    'angefertigt und von beiden Parteien unterzeichnet. Das Protokoll ist Bestandteil dieses Vertrages.'
  );
  doc.moveDown(0.4);
  doc.text(
    '10.2  Bei Beendigung des Mietverhältnisses ist der Mietgegenstand in ordnungsgemäßem Zustand, ' +
    'besenrein und vollständig geräumt zurückzugeben. Über die normale Abnutzung hinausgehende ' +
    'Schäden sind vom Mieter auf eigene Kosten zu beheben oder schriftlich abzugelten.'
  );

  // § 11 ERHALTUNGSPFLICHTEN ──────────────────────────────────────────────────
  section(doc, '§ 11  Erhaltungs- und Instandhaltungspflichten');
  doc.text(
    '11.1  Der Vermieter ist verpflichtet, die allgemeinen Teile des Hauses (Dach, Fassade, ' +
    'Aufzug, Heizungsanlage, Leitungen in Gemeinschaftsbereichen) gemäß § 3 MRG in ' +
    'ordnungsgemäßem Zustand zu erhalten.'
  );
  doc.moveDown(0.4);
  doc.text(
    '11.2  Der Mieter trägt die Erhaltungspflicht für die innere Ausstattung des Miet­gegenstandes, ' +
    'insbesondere für Böden, Wände, Türen, Sanitärinstallationen sowie eingebrachte Einrichtungen. ' +
    'Schäden sind dem Vermieter unverzüglich schriftlich zu melden.'
  );
  doc.moveDown(0.4);
  doc.text(
    '11.3  Kleinreparaturen bis EUR 100,00 (Tropfender Wasserhahn, Lichtschalter etc.) hat der ' +
    'Mieter selbst zu tragen. Bauliche Veränderungen bedürfen der vorherigen schriftlichen ' +
    'Genehmigung des Vermieters und sind bei Auszug auf Verlangen rückzubauen.'
  );

  // § 12 HAUSORDNUNG ──────────────────────────────────────────────────────────
  section(doc, '§ 12  Hausordnung');
  doc.text(
    '12.1  Der Mieter ist verpflichtet, die Hausordnung des Objektes ${lg.str} in ihrer jeweils ' +
    'gültigen Fassung einzuhalten. Die Hausordnung ist Bestandteil dieses Vertrages.'
  );
  doc.moveDown(0.4);
  doc.text(
    '12.2  Nachtruhe gilt täglich von 22:00 Uhr bis 06:00 Uhr sowie an Sonn- und Feiertagen den ' +
    'ganzen Tag. Lärmerregende Tätigkeiten (Bohrarbeiten etc.) sind nur werktags von 08:00–12:00 ' +
    'und 14:00–18:00 Uhr zulässig.'
  );
  doc.moveDown(0.4);
  doc.text(
    '12.3  Die Haltung von Haustieren ist nur mit schriftlicher Genehmigung des Vermieters ' +
    'gestattet. Kleintiere (Fische, Hamster) sind ohne Genehmigung zulässig.'
  );
  doc.moveDown(0.4);
  doc.text(
    '12.4  Sperrmüll, Elektro- und Sondermüll sind über die vorgesehenen kommunalen Stellen ' +
    '(MA 48) zu entsorgen. Die Ablagerung im Haus oder auf öffentlichem Grund ist verboten.'
  );

  // § 13 KÜNDIGUNG ─────────────────────────────────────────────────────────────
  doc.addPage();
  section(doc, '§ 13  Kündigung');
  doc.text(
    '13.1  Der Mieter kann das unbefristete Mietverhältnis unter Einhaltung einer Kündigungsfrist ' +
    'von 3 Kalendermonaten zum letzten Tag eines Kalendermonats schriftlich kündigen. Die Kündigung ' +
    'muss dem Vermieter spätestens am 1. des ersten Kündigungsmonats zugegangen sein.'
  );
  doc.moveDown(0.4);
  doc.text(
    '13.2  Der Vermieter kann das Mietverhältnis nur aus den in § 30 MRG abschließend genannten ' +
    'wichtigen Gründen kündigen. Hierzu zählen insbesondere: erheblich nachteiliger Gebrauch ' +
    '(§ 30 Abs. 2 Z 3 MRG), mehr als zwei Monate andauernder Zahlungsverzug (§ 30 Abs. 2 Z 1 MRG), ' +
    'unleidliches Verhalten gegenüber Mitbewohnern sowie Eigen- bzw. Lebensgefährdenbedarf.'
  );
  doc.moveDown(0.4);
  doc.text(
    '13.3  Die gerichtliche Aufkündigung durch den Vermieter hat beim zuständigen Bezirksgericht ' +
    'Wien zu erfolgen (§ 33 MRG). Einseitige Auflösungserklärungen des Vermieters ohne gerichtliche ' +
    'Mitwirkung entfalten keine Rechtswirkung.'
  );

  // § 14 UNTERVERMIETUNGSVERBOT ────────────────────────────────────────────────
  section(doc, '§ 14  Untervermietung und Weitergabe');
  doc.text(
    'Eine gänzliche oder teilweise Untervermietung sowie jede sonstige Weitergabe des ' +
    'Mietgegenstandes an Dritte bedarf der vorherigen schriftlichen Zustimmung des Vermieters. ' +
    'Die Zustimmung darf nur aus sachlichen Gründen verweigert werden (§ 11 MRG). Eine ' +
    'nicht genehmigte Untervermietung stellt einen wichtigen Kündigungsgrund dar (§ 30 Abs. 2 Z 4 MRG).'
  );

  // § 15 SCHLUSSBESTIMMUNGEN ───────────────────────────────────────────────────
  section(doc, '§ 15  Schlussbestimmungen');
  doc.text(
    '15.1  Änderungen und Ergänzungen dieses Vertrages bedürfen zu ihrer Gültigkeit der Schriftform ' +
    'und der Unterzeichnung durch beide Parteien.'
  );
  doc.moveDown(0.4);
  doc.text(
    '15.2  Sollten einzelne Bestimmungen dieses Vertrages unwirksam oder undurchsetzbar sein, ' +
    'berührt dies die Gültigkeit der übrigen Bestimmungen nicht (Salvatorische Klausel). An die ' +
    'Stelle der unwirksamen Bestimmung tritt eine wirksame, die dem wirtschaftlichen Zweck ' +
    'möglichst nahekommt.'
  );
  doc.moveDown(0.4);
  doc.text(
    '15.3  Für diesen Vertrag gilt ausschließlich österreichisches Recht, insbesondere das ' +
    'Mietrechtsgesetz (MRG), das Allgemeine Bürgerliche Gesetzbuch (ABGB) und das ' +
    'Richtwertgesetz (RichtWG) in ihrer jeweils gültigen Fassung.'
  );
  doc.moveDown(0.4);
  doc.text(
    '15.4  Gerichtsstand für alle Streitigkeiten aus diesem Mietverhältnis ist Wien.'
  );
  doc.moveDown(0.4);
  doc.text(
    '15.5  Die Vergebührung dieses Mietvertrages gemäß Gebührengesetz 1957 obliegt dem Mieter. ' +
    'Der Vermieter ist berechtigt, die entstandene Vertragsgebühr dem Mieter in Rechnung zu stellen.'
  );

  // UNTERSCHRIFTEN ─────────────────────────────────────────────────────────────
  doc.moveDown(2);
  doc.moveTo(70, doc.y).lineTo(doc.page.width-70, doc.y).lineWidth(0.5).strokeColor('#cccccc').stroke();
  doc.strokeColor('#000000');
  doc.moveDown(1);
  doc.font('Helvetica').fontSize(10).text(`Wien, den ${beginn}`);
  doc.moveDown(2.5);

  const pw = doc.page.width - 140;
  const lw = Math.floor(pw / 2) - 10;

  doc.moveTo(70, doc.y).lineTo(70 + lw, doc.y).lineWidth(0.5).stroke();
  doc.moveTo(doc.page.width - 70 - lw, doc.y).lineTo(doc.page.width - 70, doc.y).lineWidth(0.5).stroke();
  doc.moveDown(0.4);

  doc.fontSize(9).font('Helvetica')
     .text(VR.firma, 70, doc.y, { width: lw, align:'center' });
  doc.text(`${mieter.v} ${mieter.n}`, doc.page.width - 70 - lw, doc.y - doc.currentLineHeight(), { width: lw, align:'center' });
  doc.moveDown(0.3);
  doc.text('(Vermieter)', 70, doc.y, { width: lw, align:'center' });
  doc.text('(Mieter)', doc.page.width - 70 - lw, doc.y - doc.currentLineHeight(), { width: lw, align:'center' });
  doc.moveDown(1.5);

  doc.fontSize(7).fillColor('#999999').text(
    'Dieser Vertrag wurde in zwei gleichlautenden Ausfertigungen errichtet; je eine Ausfertigung ' +
    'erhält der Vermieter und der Mieter. Er wird mit der Unterzeichnung durch beide Vertragsparteien ' +
    'rechtswirksam. SMARTCARL Hausverwaltungs GmbH ist nach MRG § 17 als Hausverwalterin berechtigt, ' +
    'diesen Vertrag im Namen und auf Rechnung des Eigentümers abzuschließen.',
    { align:'justify' }
  );
  doc.fillColor('#000000');
}

// ─── GEBÄUDEVERSICHERUNG ─────────────────────────────────────────────────────
function buildGebaeudeversicherung(doc, { lg, polNr, gesellschaft, versSum, praemie }) {
  docHeader(doc, gesellschaft, 'GEBÄUDEVERSICHERUNG – POLIZZE');

  doc.fontSize(10).font('Helvetica');
  kv(doc, 'Polizzennummer:',      polNr);
  kv(doc, 'Versicherungsnehmer:', VR.firma);
  kv(doc, 'Adresse VN:',         `${VR.str}, ${VR.plz}`);
  kv(doc, 'Risikoanschrift:',    `${lg.str}, ${lg.plz} ${lg.ort}`);
  kv(doc, 'Versicherungsbeginn:','01. Jänner 2024');
  kv(doc, 'Versicherungsende:',  '31. Dezember 2024 (automatische Verlängerung um 1 Jahr)');
  kv(doc, 'Jährliche Prämie:',   `${praemie} EUR (inkl. 4 % Versicherungssteuer)`);
  doc.moveDown(1);

  section(doc, 'Versicherter Gegenstand');
  doc.text(
    `Das gesamte Gebäude auf der Liegenschaft ${lg.str}, ${lg.plz} ${lg.ort} (${lg.bezirk}), ` +
    `bestehend aus einem Hauptgebäude (Baujahr ${lg.bj}, Massivbauweise, ${lg.tops.length} Wohneinheiten), ` +
    'inklusive aller haustechnischen Anlagen (Heizung, Aufzug, Sanitäranlagen, Elektroinstallation), ' +
    'Außenanlagen, Kellerabteile und Gemeinschaftsbereiche.'
  );
  doc.moveDown(0.5);
  doc.text(
    `Gebäudedaten: Baujahr ${lg.bj} | Bauweise: Massiv (Ziegel) | Stockwerke: ${Math.ceil(lg.tops.length / 2) + 1} ` +
    `| Wohneinheiten: ${lg.tops.length} | Beheizung: Zentralheizung (Gas)`
  );

  section(doc, 'Versicherungssummen (Neuwert)');
  doc.text(`Gebäude (Neuwert):                ${versSum} EUR`);
  doc.text(`Nebengebäude und Außenanlagen:       50.000,00 EUR`);
  doc.text(`Aufräumungs- und Abbruchkosten:     200.000,00 EUR`);
  doc.text(`Architekten- und Sachverständigenkosten: 180.000,00 EUR`);
  doc.text(`Mietentgang (bis 24 Monate):        120.000,00 EUR`);

  section(doc, 'Versicherter Deckungsumfang');
  const deckung = [
    'Feuer (Brand, Blitzschlag, Explosion, Absturz von Luftfahrzeugen)',
    'Leitungswasser (Rohrbruch, Frost, Überlaufen fest installierter Behälter)',
    'Sturm und Hagel (ab Windstärke 7 / 51 km/h)',
    'Einbruchdiebstahl in Gemeinschaftsbereiche (Keller, Stiegenhaus)',
    'Glasbruch aller Außenfenster und Balkontüren',
    'Elementarschäden (Überschwemmung, Rückstau, Erdrutsch, Schneedruck, Felssturz)',
    'Fahrzeuganprall',
    'Rauch- und Rußschäden durch bestimmungsgemäßen Betrieb',
    'Graffitientfernung an der Außenfassade (bis EUR 5.000,00 je Schadenfall)',
  ];
  deckung.forEach(d => doc.text(`• ${d}`));

  section(doc, 'Selbstbehalt');
  doc.text('Standard-Selbstbehalt:     EUR 500,00 je Schadenfall');
  doc.text('Elementarschäden:          EUR 2.000,00 je Schadenfall');
  doc.text('Glasbruch:                 kein Selbstbehalt');

  section(doc, 'Obliegenheiten des Versicherungsnehmers');
  doc.text(
    'Der Versicherungsnehmer ist verpflichtet, bekannte Mängel (undichte Leitungen, defekte ' +
    'Dachabdichtung etc.) unverzüglich zu beheben, um die Schadenshöhe möglichst gering zu halten. ' +
    'Brandschutzvorschriften der MA 36 sind einzuhalten. Jeder Schaden ist innerhalb von 7 Tagen ' +
    'der Versicherung zu melden.'
  );

  section(doc, 'Ausschlüsse');
  doc.text(
    'Ausgeschlossen sind: vorsätzlich herbeigeführte Schäden, Kriegs- und Terrorschäden, ' +
    'Kernenergieschäden, Schäden infolge normaler Abnutzung oder mangelhafter Instandhaltung, ' +
    'Schäden durch Asbest oder andere Schadstoffe.'
  );

  doc.moveDown(1.5);
  hr(doc);
  doc.text(`Wien, 01. Jänner 2024`);
  doc.moveDown(2.5);
  doc.moveTo(70, doc.y).lineTo(280, doc.y).stroke();
  doc.moveTo(300, doc.y).lineTo(510, doc.y).stroke();
  doc.moveDown(0.4);
  doc.fontSize(9).text(gesellschaft, 70, doc.y, { width:210, align:'center' });
  doc.text(VR.firma, 300, doc.y - doc.currentLineHeight(), { width:210, align:'center' });
  doc.moveDown(0.3);
  doc.text('Bevollmächtigter Vertreter', 70, doc.y, { width:210, align:'center' });
  doc.text('Versicherungsnehmer', 300, doc.y - doc.currentLineHeight(), { width:210, align:'center' });
}

// ─── LEITUNGSWASSERVERSICHERUNG ───────────────────────────────────────────────
function buildLeitungswasserversicherung(doc, { lg }) {
  docHeader(doc, 'Zürich Versicherungs-AG', 'LEITUNGSWASSER-ZUSATZVERSICHERUNG – POLIZZE');

  kv(doc, 'Polizzennummer:',      'LW-2024-MH88-0002');
  kv(doc, 'Versicherungsnehmer:', VR.firma);
  kv(doc, 'Risikoanschrift:',    `${lg.str}, ${lg.plz} ${lg.ort}`);
  kv(doc, 'Versicherungsbeginn:','01. Jänner 2024');
  kv(doc, 'Versicherungsende:',  '31. Dezember 2024 (Verlängerung um je 1 Jahr)');
  kv(doc, 'Jährliche Prämie:',   '1.240,00 EUR (inkl. 4 % Versicherungssteuer)');
  doc.moveDown(1);

  section(doc, 'Zweck und Verhältnis zur Gebäudeversicherung');
  doc.text(
    'Diese Zusatzversicherung (Polizze LW-2024-MH88-0002) ergänzt die bestehende Gebäudeversicherung ' +
    '(Polizze GV-2024-MH88-0001, Allianz Elementar Versicherungs-AG) mit erweitertem ' +
    'Leistungsumfang für Leitungswasserschäden am Objekt Mariahilfer Straße 88, 1060 Wien.'
  );

  section(doc, 'Erweiterter Deckungsumfang');
  const items = [
    'Bruchschäden an allen Wasser-, Heizungs-, Gas- und Abwasserleitungen im Gebäude',
    'Frostschäden an Leitungen, Heizkörpern, Armaturen und Sanitärinstallationen',
    'Nässeschäden durch bestimmungswidrig austretendes Leitungswasser (inkl. Waschmaschinen, Spülmaschinen)',
    'Aufspür- und Stemmkosten zur Ortung der Schadstelle',
    'Verputz-, Maler- und Fliesenarbeiten als direkte Folge von Leitungsbruch',
    'Schäden durch Rückstau aus dem öffentlichen Kanalnetz (MA 30)',
    'Trocknungskosten und Mietkosten für Trocknungsgeräte (bis 90 Tage je Schadenfall)',
    'Schimmelbeseitigung als direkte Schadenfolge (bis EUR 15.000,00)',
  ];
  items.forEach(i => doc.text(`• ${i}`));

  section(doc, 'Versicherungssummen');
  doc.text('Maximale Entschädigungsleistung je Schadenfall:  500.000,00 EUR');
  doc.text('Trocknungskosten je Schadenfall:                  50.000,00 EUR');
  doc.text('Schimmelbeseitigung:                              15.000,00 EUR');
  doc.text('Folgekosten Innenausbau (Boden, Wände):         100.000,00 EUR');

  section(doc, 'Selbstbehalt');
  doc.text('Selbstbehalt je Schadenfall: EUR 250,00');
  doc.text('(Gilt nicht bei Schäden durch Rückstau: kein Selbstbehalt)');

  section(doc, 'Besondere Obliegenheiten');
  doc.text(
    'Der Versicherungsnehmer hat bekannte Leitungsschäden unverzüglich reparieren zu lassen. ' +
    'Eine Leitungsinspektion durch einen zertifizierten Installateur ist alle 5 Jahre ' +
    'durchzuführen; der Nachweis ist der Versicherung auf Anforderung vorzulegen. ' +
    'Schadenmeldungen haben innerhalb von 48 Stunden nach Schadenentdeckung zu erfolgen.'
  );

  doc.moveDown(1.5);
  hr(doc);
  doc.text('Wien, 01. Jänner 2024');
  doc.moveDown(2.5);
  doc.moveTo(70, doc.y).lineTo(280, doc.y).stroke();
  doc.moveTo(300, doc.y).lineTo(510, doc.y).stroke();
  doc.moveDown(0.4);
  doc.fontSize(9).text('Zürich Versicherungs-AG', 70, doc.y, { width:210, align:'center' });
  doc.text(VR.firma, 300, doc.y - doc.currentLineHeight(), { width:210, align:'center' });
}

// ─── GERÄTEVERSICHERUNG ───────────────────────────────────────────────────────
function buildGeraeteversicherung(doc, { lg, topNr, mieter }) {
  docHeader(doc, 'WIENER STÄDTISCHE Versicherung AG', 'GERÄTEVERSICHERUNG – POLIZZE');

  kv(doc, 'Polizzennummer:',          'GE-2024-MH88-T01-0001');
  kv(doc, 'Versicherungsnehmer:',     VR.firma);
  kv(doc, 'Risikoanschrift:',        `${lg.str}, Top ${topNr}, ${lg.plz} ${lg.ort}`);
  kv(doc, 'Bewohner der Einheit:',   `${mieter.v} ${mieter.n}, geb. ${mieter.geb}`);
  kv(doc, 'Versicherungsbeginn:',     '01. Juni 2023');
  kv(doc, 'Versicherungsende:',       '31. Mai 2024 (Verlängerung um je 1 Jahr)');
  kv(doc, 'Jährliche Prämie:',        '384,00 EUR (inkl. 4 % Versicherungssteuer)');
  doc.moveDown(1);

  section(doc, 'Versicherte Elektrogeräte in der Wohnung Top 1, Mariahilfer Straße 88, 1060 Wien');

  const geraete = [
    {
      nr:   1,
      name: 'Samsung Family Hub RF65A977FSR – Kühl-Gefrier-Kombination (French Door)',
      sn:   'SAM-KG-2022-RF65A-881234',
      bj:   2022,
      kauf: '1.199,00 EUR',
      vs:   '1.050,00 EUR',
      kat:  'Weiße Ware / Küchengerät',
    },
    {
      nr:   2,
      name: 'Miele WDA 201 WPM – Waschmaschine Frontlader 8 kg, 1400 U/min',
      sn:   'MIE-WA-2021-WDA201-779854',
      bj:   2021,
      kauf: '849,00 EUR',
      vs:   '720,00 EUR',
      kat:  'Weiße Ware / Haushaltsgerät',
    },
    {
      nr:   3,
      name: 'Sony XR-65X90L – BRAVIA XR 65" 4K Mini LED Smart Google TV',
      sn:   'SON-TV-2023-XR65X90L-445678',
      bj:   2023,
      kauf: '1.499,00 EUR',
      vs:   '1.350,00 EUR',
      kat:  'Unterhaltungselektronik',
    },
  ];

  geraete.forEach(g => {
    doc.font('Helvetica-Bold').text(`Gerät ${g.nr}: ${g.name}`).font('Helvetica');
    doc.text(`Seriennummer:      ${g.sn}`, { indent:20 });
    doc.text(`Baujahr:           ${g.bj}`, { indent:20 });
    doc.text(`Kaufpreis (Beleg): ${g.kauf}`, { indent:20 });
    doc.text(`Versicherungswert: ${g.vs}`, { indent:20 });
    doc.text(`Kategorie:         ${g.kat}`, { indent:20 });
    doc.moveDown(0.7);
  });

  section(doc, 'Versicherungsumfang (je Gerät)');
  const deck = [
    'Elektrischer Defekt, Kurzschluss, Überspannungsschäden (inkl. Blitzschlag)',
    'Bedienungsfehler und Ungeschicklichkeit (z.B. versehentliches Fallenlassen)',
    'Sturz- und Stoßschäden durch äußere Einwirkung',
    'Flüssigkeitsschäden (Wasser, Getränke)',
    'Vandalismus und mutwillige Beschädigung durch Dritte',
    'Diebstahl des versicherten Gerätes aus der Wohnung',
    'Kurzschluss-/Brandschäden am Gerät selbst (nicht Folgeschäden am Gebäude)',
  ];
  deck.forEach(d => doc.text(`• ${d}`));

  section(doc, 'Entschädigungsleistung');
  doc.text(
    'Im Schadenfall wird der Zeitwert erstattet (Kaufpreis abzüglich einer linearen ' +
    'Wertminderung von 15 % pro Jahr ab Kaufdatum). Ab einem Schaden von mehr als 70 % ' +
    'des Versicherungswertes wird Totalschaden angenommen und der volle Versicherungswert ausbezahlt. ' +
    'Die Versicherung ist verpflichtet, innerhalb von 10 Werktagen nach vollständiger ' +
    'Schadendokumentation die Leistung zu erbringen.'
  );

  section(doc, 'Selbstbehalt');
  doc.text('Selbstbehalt je Schadenfall und Gerät: EUR 100,00');

  section(doc, 'Pflichten des Versicherungsnehmers');
  doc.text(
    'Die versicherten Geräte sind ausschließlich am angegebenen Standort (Mariahilfer Straße 88, ' +
    'Top 1, 1060 Wien) zu betreiben. Bei Standortwechsel, Verkauf oder Entsorgung eines Gerätes ' +
    'ist die Versicherung schriftlich zu informieren. Kaufbelege und Seriennachweise sind aufzubewahren.'
  );

  doc.moveDown(1.5);
  hr(doc);
  doc.text('Wien, 01. Juni 2023');
  doc.moveDown(2.5);
  doc.moveTo(70, doc.y).lineTo(280, doc.y).stroke();
  doc.moveTo(300, doc.y).lineTo(510, doc.y).stroke();
  doc.moveDown(0.4);
  doc.fontSize(9).text('WIENER STÄDTISCHE Versicherung AG', 70, doc.y, { width:210, align:'center' });
  doc.text(VR.firma, 300, doc.y - doc.currentLineHeight(), { width:210, align:'center' });
}

// ─── GLASBRUCHVERSICHERUNG ─────────────────────────────────────────────────────
function buildGlasbruchversicherung(doc, { lg, topNr, mieter }) {
  docHeader(doc, 'Generali Versicherung AG', 'GLASBRUCHVERSICHERUNG – POLIZZE');

  kv(doc, 'Polizzennummer:',          'GL-2024-MH88-T01-0003');
  kv(doc, 'Versicherungsnehmer:',     VR.firma);
  kv(doc, 'Risikoanschrift:',        `${lg.str}, Top ${topNr}, ${lg.plz} ${lg.ort}`);
  kv(doc, 'Nutzer der Einheit:',     `${mieter.v} ${mieter.n}`);
  kv(doc, 'Versicherungsbeginn:',     '01. Juni 2023');
  kv(doc, 'Versicherungsende:',       '31. Mai 2024 (jährliche Verlängerung)');
  kv(doc, 'Jährliche Prämie:',        '156,00 EUR (inkl. 4 % Versicherungssteuer)');
  doc.moveDown(1);

  section(doc, 'Versicherter Gegenstand');
  doc.text(
    `Sämtliche Glascheiben, Spiegel und Glasflächen in der Wohneinheit Top ${topNr}, ` +
    `${lg.str}, ${lg.plz} ${lg.ort}, und zwar:`
  );
  const glasItems = [
    'Fenster-Isolierverglasung: 5 Fenster (Doppelverglasung, Wärmeschutzglas U-Wert 1,1)',
    'Balkonverglasung: 1 Balkontüre + 1 Balkon-Festverglasung',
    'Glastür Wohnzimmer → Vorraum (Parsol-Glas, 120 × 210 cm)',
    'Glastür Küche → Vorraum (ESG-Sicherheitsglas, 90 × 210 cm)',
    'Badezimmerspiegel (80 × 120 cm, fest verbaut)',
    'Glasablagen im Badezimmer (2 Stück, fest eingebaut)',
    'Ceranfeld Einbauküche – Glaskeramik-Kochfläche (80 cm)',
  ];
  glasItems.forEach(i => doc.text(`• ${i}`));

  section(doc, 'Versicherungsschutz');
  const schutz = [
    'Bruch durch jeden Unfall (unbeabsichtigtes mechanisches Zerbrechen)',
    'Vandalismusschäden an versicherten Glasflächen',
    'Hagelschlag- und Sturmschäden an Verglasung',
    'Sprung durch Temperaturdifferenzen (Thermischer Riss)',
    'Montageschäden bei Reparatur durch Fachbetrieb',
    'Sofortversiegelung / Notverglasung nach Schadenfall',
  ];
  schutz.forEach(s => doc.text(`• ${s}`));

  section(doc, 'Versicherungssummen');
  doc.text('Maximale Deckung je Schadenfall:  20.000,00 EUR');
  doc.text('Notverglasung und Sofortmaßnahmen: 2.000,00 EUR');
  doc.text('Demontage- und Montagekosten:      3.000,00 EUR');

  section(doc, 'Selbstbehalt und Ausschlüsse');
  doc.text('Selbstbehalt: EUR 0,00 (kein Selbstbehalt für Glasbruch)');
  doc.moveDown(0.5);
  doc.text(
    'Ausgeschlossen sind: Kratzer ohne vollständigen Durchbruch der Scheibe, Schäden an ' +
    'mobilem Inventar (Vasen, Bilderrahmen, Gläser), Schäden durch Bearbeitung (Schneiden, ' +
    'Schleifen), Schäden infolge von Umbau- oder Renovierungsarbeiten, die nicht mit der ' +
    'Versicherung abgesprochen wurden.'
  );

  section(doc, 'Besonderes');
  doc.text(
    'Im Schadenfall ist die Versicherung telefonisch (+43 1 534 00-0) oder per E-Mail ' +
    '(schaden@generali.at) zu benachrichtigen. Die Notverglasung ist durch einen von der ' +
    'Versicherung beauftragten Fachbetrieb durchzuführen. Der Vermieter stellt sicher, dass ' +
    'ein Ersatzschlüssel für das Schadensmanagement hinterlegt ist.'
  );

  doc.moveDown(1.5);
  hr(doc);
  doc.text('Wien, 01. Juni 2023');
  doc.moveDown(2.5);
  doc.moveTo(70, doc.y).lineTo(280, doc.y).stroke();
  doc.moveTo(300, doc.y).lineTo(510, doc.y).stroke();
  doc.moveDown(0.4);
  doc.fontSize(9).text('Generali Versicherung AG', 70, doc.y, { width:210, align:'center' });
  doc.text(VR.firma, 300, doc.y - doc.currentLineHeight(), { width:210, align:'center' });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  ensureDir(MV_BASE);
  ensureDir(VS_BASE);

  console.log('SMARTCARL Testdokumente-Generator');
  console.log('══════════════════════════════════\n');

  let mvCount = 0;
  let vsCount = 0;
  let mieterIdx = 0;

  // ── 49 Mietverträge + 4 Gebäudeversicherungen (LIEGENSCHAFTEN) ──────────────
  for (const lg of LIEGENSCHAFTEN) {
    const mvDir = path.join(MV_BASE, safeName(lg.str));
    const vsDir = path.join(VS_BASE, safeName(lg.str));
    ensureDir(mvDir);
    ensureDir(vsDir);

    for (let ti = 0; ti < lg.tops.length; ti++) {
      const topNr  = lg.tops[ti];
      const mieter = MIETER[mieterIdx++];
      const beginn = dateOffset(lg.base, ti * 2);
      const vNr    = `MV-${lg.id.toUpperCase().slice(0,3)}-T${String(topNr).padStart(2,'0')}-2024`;
      const fName  = `Mietvertrag_Top${String(topNr).padStart(2,'0')}_${safeName(mieter.v)}_${safeName(mieter.n)}.pdf`;

      await makePDF(path.join(mvDir, fName), doc =>
        buildMietvertrag(doc, { lg, topNr, mieter, beginn, vertragNr: vNr })
      );
      mvCount++;
      process.stdout.write(`\r  Mietverträge erstellt: ${mvCount}/50 ...`);
    }

    // Gebäudeversicherung für diese Liegenschaft
    await makePDF(
      path.join(vsDir, `Gebaeudeversicherung_${safeName(lg.str)}.pdf`),
      doc => buildGebaeudeversicherung(doc, {
        lg,
        polNr:      lg.vsPol,
        gesellschaft: lg.vsGes,
        versSum:    lg.vsSum,
        praemie:    lg.vsPrae,
      })
    );
    vsCount++;
  }

  // ── Mietvertrag Mathias Kracher (Top 50) ───────────────────────────────────
  const mhMvDir = path.join(MV_BASE, safeName(MARIAHILFER.str));
  ensureDir(mhMvDir);
  await makePDF(
    path.join(mhMvDir, `Mietvertrag_Top${String(MARIAHILFER.top).padStart(2,'0')}_Mathias_Kracher.pdf`),
    doc => buildMietvertrag(doc, {
      lg:       MARIAHILFER,
      topNr:    MARIAHILFER.top,
      mieter:   MARIAHILFER.mieter,
      beginn:   MARIAHILFER.start,
      vertragNr:'MV-MAR-T01-2023',
    })
  );
  mvCount++;
  process.stdout.write(`\r  Mietverträge erstellt: ${mvCount}/50 ...`);

  // ── Versicherungen Mariahilfer Straße 88 ───────────────────────────────────
  const mhVsDir = path.join(VS_BASE, safeName(MARIAHILFER.str));
  ensureDir(mhVsDir);

  // 1) Gebäudeversicherung
  await makePDF(
    path.join(mhVsDir, 'Gebaeudeversicherung_Mariahilfer-Strasse-88.pdf'),
    doc => buildGebaeudeversicherung(doc, {
      lg:          MARIAHILFER,
      polNr:       'GV-2024-MH88-0001',
      gesellschaft:'Allianz Elementar Versicherungs-AG',
      versSum:     '6.500.000,00',
      praemie:     '5.850,00',
    })
  );
  vsCount++;

  // 2) Leitungswasserversicherung
  await makePDF(
    path.join(mhVsDir, 'Leitungswasserversicherung_Mariahilfer-Strasse-88.pdf'),
    doc => buildLeitungswasserversicherung(doc, { lg: MARIAHILFER })
  );
  vsCount++;

  // 3) Geräteversicherung Top 1
  await makePDF(
    path.join(mhVsDir, 'Geraeteversicherung_Mariahilfer-Strasse-88_Top01.pdf'),
    doc => buildGeraeteversicherung(doc, {
      lg:     MARIAHILFER,
      topNr:  MARIAHILFER.top,
      mieter: MARIAHILFER.mieter,
    })
  );
  vsCount++;

  // 4) Glasbruchversicherung Top 1 (extra Versicherung)
  await makePDF(
    path.join(mhVsDir, 'Glasbruchversicherung_Mariahilfer-Strasse-88_Top01.pdf'),
    doc => buildGlasbruchversicherung(doc, {
      lg:     MARIAHILFER,
      topNr:  MARIAHILFER.top,
      mieter: MARIAHILFER.mieter,
    })
  );
  vsCount++;

  console.log('\n');
  console.log('✓ Fertig! Alle Testdokumente erstellt.\n');
  console.log(`  Ausgabeordner: ${BASE}`);
  console.log(`\n  Mietverträge:    ${mvCount} PDFs`);
  console.log(`    ├─ Brigittenauer Lände 18:      12`);
  console.log(`    ├─ Döblinger Hauptstraße 51:    12`);
  console.log(`    ├─ Favoritenstraße 42:          12`);
  console.log(`    ├─ Hernalser Hauptstraße 63:    13`);
  console.log(`    └─ Mariahilfer Straße 88 Top 1:  1 (Mathias Kracher)`);
  console.log(`\n  Versicherungen:  ${vsCount} PDFs`);
  console.log(`    ├─ 4x Gebäudeversicherung (je Liegenschaft)`);
  console.log(`    ├─ 1x Gebäudeversicherung Mariahilfer Str. 88`);
  console.log(`    ├─ 1x Leitungswasserversicherung Mariahilfer Str. 88`);
  console.log(`    ├─ 1x Geräteversicherung Top 1 (Samsung, Miele, Sony)`);
  console.log(`    └─ 1x Glasbruchversicherung Top 1`);
  console.log(`\n  Gesamt: ${mvCount + vsCount} PDF-Dokumente`);
}

main().catch(err => {
  console.error('\nFehler beim Erstellen der Dokumente:', err.message);
  console.error(err.stack);
  process.exit(1);
});
