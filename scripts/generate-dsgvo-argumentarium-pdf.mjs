/**
 * Generiert DSGVO-Argumentarium für Demo-Termine.
 * Output: Desktop/SMARTCARL_Onboarding_Demo_Pack/DSGVO_Argumentarium.pdf
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
const outPath = path.join(packDir, 'DSGVO_Argumentarium.pdf')

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'SMARTCARL — DSGVO Argumentarium',
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

function checkBullet(text, checked = true) {
  if (doc.y > 760) doc.addPage()
  const y = doc.y
  doc.fillColor(checked ? C.green : C.amber).font('Helvetica-Bold').fontSize(11).text(checked ? '✓' : '○', 55, y)
  doc.fillColor(C.primary).font('Helvetica').fontSize(10).text(text, 75, y, { width: 470, lineGap: 2 })
  doc.moveDown(0.25)
}

function qaBlock(question, answer) {
  if (doc.y > 700) doc.addPage()
  doc.moveDown(0.3)
  doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(11).text('▸ ' + question, { lineGap: 2 })
  doc.moveDown(0.2)
  doc.fillColor(C.primary).font('Helvetica').fontSize(10).text(answer, { lineGap: 3 })
  doc.moveDown(0.5)
}

// Robuste Info-Box: misst Text-Hoehe VORHER, zeichnet Box, dann Text drueber
function infoBox(title, content, fillColor = '#fef3c7', strokeColor = '#fbbf24', textColor = '#92400e') {
  const padding = 12
  const innerWidth = 495 - padding * 2
  doc.font('Helvetica-Bold').fontSize(10)
  const titleH = doc.heightOfString(title, { width: innerWidth })
  doc.font('Helvetica').fontSize(10)
  const contentH = doc.heightOfString(content, { width: innerWidth, lineGap: 3 })
  const totalH = padding + titleH + 8 + contentH + padding
  if (doc.y + totalH > 780) doc.addPage()
  const yStart = doc.y
  doc.rect(50, yStart, 495, totalH).fillAndStroke(fillColor, strokeColor)
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10)
    .text(title, 50 + padding, yStart + padding, { width: innerWidth })
  doc.fillColor(textColor).font('Helvetica').fontSize(10)
    .text(content, 50 + padding, yStart + padding + titleH + 8, { width: innerWidth, lineGap: 3 })
  doc.y = yStart + totalH
  doc.moveDown(0.6)
}

// ═══════════════════════════════════════════════════════════════════════
// COVER
// ═══════════════════════════════════════════════════════════════════════
doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(34).text('SMARTCARL', { align: 'center' })
doc.moveDown(0.2)
doc.fillColor(C.primary).font('Helvetica').fontSize(16).text('DSGVO Argumentarium', { align: 'center' })
doc.moveDown(0.5)
doc.fillColor(C.muted).fontSize(11).text('Für Demo-Termine: was du wann sagen kannst, ohne juristisch glatt aufs Eis zu gehen', { align: 'center' })

doc.moveDown(2)
doc.strokeColor(C.accent).lineWidth(1).moveTo(150, doc.y).lineTo(445, doc.y).stroke()
doc.moveDown(1)

doc.fillColor(C.muted).fontSize(11).text('INHALT', { align: 'center', characterSpacing: 1 })
doc.moveDown(0.5)
doc.fillColor(C.primary).fontSize(11).text('1. Was die App heute schon kann', { align: 'center' })
doc.text('2. Sub-Auftragsverarbeiter (transparente Liste)', { align: 'center' })
doc.text('3. Technische & organisatorische Maßnahmen (TOM)', { align: 'center' })
doc.text('4. Häufige HV-Fragen + ehrliche Antworten', { align: 'center' })
doc.text('5. Was vor Live-Gang noch zu tun ist', { align: 'center' })
doc.text('6. Pilotkunde-Vorteil', { align: 'center' })

doc.moveDown(3)
doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(9).text('Stand: 06.05.2026 — Dieses Dokument ersetzt keine Rechtsberatung. Vor zahlenden Kunden Datenschutzanwalt einholen.', { align: 'center' })

// ═══════════════════════════════════════════════════════════════════════
// SEITE 2: WAS DIE APP HEUTE SCHON KANN
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('1. Was die App heute schon abdeckt')

p('Stand der Technik — alles ist im Code implementiert und produktiv:', { color: C.muted })
doc.moveDown(0.3)

h2('Datenstandort & Hosting', C.green)
checkBullet('Datenbank: Supabase EU (Frankfurt) — Daten verlassen niemals die EU')
checkBullet('Hosting: Vercel EU-Edge — Datenverarbeitung in EU-Rechenzentren')
checkBullet('Verschlüsselung in Transit: TLS 1.3 (HTTPS überall)')
checkBullet('Verschlüsselung at-rest: AES-256 (Supabase Standard)')

h2('Mandantentrennung (Multi-Tenancy)', C.green)
checkBullet('Jede Hausverwaltung erhält eine eigene organization_id')
checkBullet('Row-Level-Security auf JEDER Tabelle mit personenbezogenen Daten')
checkBullet('Es ist technisch unmöglich dass HV X die Daten von HV Y sieht')
checkBullet('Kann live in der Demo gezeigt werden (versuche eine Tenant-Grenze zu überschreiten)')

h2('Datensparsamkeit (Art. 5 DSGVO)', C.green)
checkBullet('EXIF-Daten (GPS, Gerät) werden bei Foto-Upload serverseitig entfernt')
checkBullet('Storage-Buckets sind privat, nur über signed URLs zugänglich (5-30 Min Gültigkeit)')
checkBullet('Keine Tracking-Cookies, kein Google Analytics, keine 3rd-Party-Pixel')

h2('Auditierbarkeit', C.green)
checkBullet('audit_logs-Tabelle: jede Datenmanipulation wird protokolliert')
checkBullet('Status-History pro Schadensfall: wer hat wann was geändert')
checkBullet('Login-Versuche werden geloggt (Brute-Force-Schutz)')

h2('AVV-Prozess', C.green)
checkBullet('Bei HV-Registrierung: AVV-Zustimmung muss aktiv geklickt werden')
checkBullet('AVV-Volltext ist auf /avv jederzeit einsehbar')
checkBullet('Datum + Identität der Zustimmung wird in der DB gespeichert')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 3: SUB-AUFTRAGSVERARBEITER
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('2. Sub-Auftragsverarbeiter (transparent)')

p('Diese externen Dienste verarbeiten in unserem Auftrag personenbezogene Daten. Mit allen besteht ein Auftragsverarbeitungsvertrag (DPA).', { color: C.muted })
doc.moveDown(0.5)

const subs = [
  ['Supabase Inc.', 'Datenbank, Authentifizierung, Storage', 'EU (Frankfurt)', 'supabase.com/legal/dpa'],
  ['Vercel Inc.', 'Hosting, Edge-Functions', 'EU', 'vercel.com/legal/dpa'],
  ['Resend Inc.', 'Transaktionale E-Mails (Werkstatt-, Mieter-Mails)', 'EU + USA', 'resend.com/legal/dpa'],
  ['Anthropic PBC', 'KI-Analyse von Schadensmeldungen (CARL)', 'EU + USA', 'anthropic.com/legal'],
]

doc.font('Helvetica-Bold').fontSize(9).fillColor(C.muted)
const colW = [120, 180, 100, 95]
const headerY = doc.y
doc.text('Anbieter', 50, headerY, { width: colW[0] })
doc.text('Zweck', 50 + colW[0], headerY, { width: colW[1] })
doc.text('Datenstandort', 50 + colW[0] + colW[1], headerY, { width: colW[2] })
doc.text('DPA-Link', 50 + colW[0] + colW[1] + colW[2], headerY, { width: colW[3] })
doc.moveDown(0.7)
doc.strokeColor(C.border).lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
doc.moveDown(0.3)

for (const [name, zweck, ort, dpa] of subs) {
  if (doc.y > 740) doc.addPage()
  const y = doc.y
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.primary).text(name, 50, y, { width: colW[0] })
  doc.font('Helvetica').fontSize(9).fillColor(C.primary).text(zweck, 50 + colW[0], y, { width: colW[1] })
  doc.fontSize(9).text(ort, 50 + colW[0] + colW[1], y, { width: colW[2] })
  doc.fillColor(C.accent).fontSize(8).text(dpa, 50 + colW[0] + colW[1] + colW[2], y, { width: colW[3] })
  doc.moveDown(0.6)
  doc.strokeColor(C.border).lineWidth(0.3).moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(0.3)
}

doc.moveDown(0.5)
doc.fillColor(C.muted).fontSize(9).font('Helvetica-Oblique').text(
  'Anthropic-Hinweis: Daten werden NICHT für KI-Training verwendet (deaktiviert via API-Konfiguration). ' +
  'Bei Resend und Anthropic werden EU-Standardvertragsklauseln (SCC) angewandt für die USA-Komponente.',
  { lineGap: 2 }
)

// ═══════════════════════════════════════════════════════════════════════
// SEITE 4: TOM
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('3. Technische und organisatorische Maßnahmen (TOM)')

p('Pflicht-Anhang zum AVV gemäß DSGVO Art. 32. Diese Maßnahmen sind im Code implementiert:', { color: C.muted })

h2('3.1 Vertraulichkeit', C.accent)
checkBullet('Zutrittskontrolle: Datenbank nur via Service-Role-Key zugänglich, kein Direkt-Login')
checkBullet('Zugangskontrolle: Supabase Auth (gehashte Passwörter, Bcrypt)')
checkBullet('Zugriffskontrolle: Row-Level-Security (RLS) — User sehen nur eigene Daten')
checkBullet('Trennung: organization_id auf allen Tabellen — Mandantentrennung erzwungen')
checkBullet('Pseudonymisierung: User-IDs sind UUIDs, keine sprechenden Namen')

h2('3.2 Integrität', C.accent)
checkBullet('Eingabekontrolle: Alle API-Inputs werden mit Zod validiert')
checkBullet('Audit-Trail: damage_report_status_history + audit_logs-Tabelle')
checkBullet('Versionierung: updated_at-Zeitstempel auf jeder Tabelle')

h2('3.3 Verfügbarkeit', C.accent)
checkBullet('Backups: Supabase Point-in-Time-Recovery (Pro-Plan, 7 Tage Wiederherstellung)')
checkBullet('Hosting: Vercel mit automatischem Failover')
checkBullet('Monitoring: Sentry-ready (Error-Tracking nach Live-Gang aktivieren)')

h2('3.4 Belastbarkeit', C.accent)
checkBullet('Rate-Limiting: max. 5 Schadensmeldungen pro Mieter/Stunde')
checkBullet('Brute-Force-Schutz: Login-Versuche werden gezählt + Account-Sperre')
checkBullet('DDoS-Schutz: Vercel + Cloudflare-Layer')

h2('3.5 Verfahren zur Wiederherstellung', C.accent)
checkBullet('Backup-Wiederherstellung: < 1h via Supabase Dashboard')
checkBullet('Datenverlust-Risiko: < 5 Minuten (Supabase WAL-Logs)')

h2('3.6 Datenschutz-Folgenabschätzung (DSFA)', C.accent)
checkBullet('Schadensmeldungen mit Fotos: keine besonderen Kategorien (Art. 9) — keine DSFA nötig')
checkBullet('Mieterdaten beschränkt auf Name, Email, Telefon, Wohneinheit — Standard-Risiko')

// ═══════════════════════════════════════════════════════════════════════
// SEITE 5: HÄUFIGE FRAGEN
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('4. Häufige HV-Fragen + ehrliche Antworten')

qaBlock(
  'Wo liegen die Daten meiner Mieter?',
  'In Frankfurt am Main, im Supabase-Rechenzentrum (Tier-IV, ISO 27001 zertifiziert). Die Daten verlassen die EU nicht. Sie können das im AVV-Anhang dokumentiert nachprüfen.'
)

qaBlock(
  'Was passiert mit den KI-Anfragen — landet das bei OpenAI/Google?',
  'Wir nutzen Anthropic Claude — nicht OpenAI, nicht Google. Anthropic verarbeitet Anfragen über Server in der EU und USA mit EU-Standardvertragsklauseln. Wichtig: Ihre Daten werden NICHT für das Training der KI verwendet (aktiv deaktiviert in unserer Konfiguration).'
)

qaBlock(
  'Was wenn ein Mieter seine Daten löschen lassen will?',
  'DSGVO-Recht auf Vergessenwerden (Art. 17): Sie als Hausverwaltung leiten den Antrag an uns weiter, wir löschen den Mieter-Account innerhalb von 30 Tagen mit Soft-Delete-Phase. Schadensmeldungen bleiben aber 7 Jahre gespeichert (§ 132 BAO, steuerliche Aufbewahrungspflicht).'
)

qaBlock(
  'Was wenn es einen Hack gibt?',
  'Wir informieren Sie als Verantwortlichen unverzüglich (DSGVO Art. 33). Sie haben dann 72 Stunden Zeit für die Meldung an die Datenschutzbehörde. Wir liefern Ihnen alle technischen Daten dafür.'
)

qaBlock(
  'Wer haftet bei einem Datenleck?',
  'Wir als Auftragsverarbeiter haften für Verletzungen unserer technisch-organisatorischen Maßnahmen. Sie als Verantwortlicher haften für die Rechtmäßigkeit der Verarbeitung an sich. Im AVV ist die Haftungsverteilung klar geregelt.'
)

qaBlock(
  'Können wir den Anbieter wechseln und unsere Daten mitnehmen?',
  'Ja. Auf Anfrage liefern wir Ihnen alle Daten als JSON/CSV-Export — innerhalb von 30 Tagen. Bei Vertragsende werden alle Daten nach Ablauf der gesetzlichen Aufbewahrungsfristen gelöscht.'
)

qaBlock(
  'Ist die App schon DSGVO-zertifiziert?',
  'Eine offizielle DSGVO-Zertifizierung gibt es als solche nicht — was wir haben: ISO-27001-zertifizierte Sub-Dienstleister (Supabase, Vercel), AVV mit allen Dritten, dokumentierte TOM, EU-Hosting. Vor unserem öffentlichen Live-Gang lassen wir die Datenschutzerklärung von einem Datenschutzanwalt final prüfen.'
)

// ═══════════════════════════════════════════════════════════════════════
// SEITE 6: WAS VOR LIVE-GANG NOCH ZU TUN
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('5. Was vor Live-Gang noch zu tun ist (intern)')

p('Diese Liste zeigst du der HV nicht — das sind deine eigenen Hausaufgaben:', { color: C.muted })

h2('Pflicht (vor erstem zahlenden Kunden)', C.red)
checkBullet('Impressum mit echten Firmendaten füllen (Adresse, UID, FB-Nr.)', false)
checkBullet('Datenschutzerklärung mit Anwalt abstimmen (200-400 € einmalig)', false)
checkBullet('AVV-Volltext vom Anwalt prüfen lassen', false)
checkBullet('DPAs mit Supabase, Vercel, Resend, Anthropic unterschreiben', false)
checkBullet('PROJ-15 deployen (Datenexport + Account-Löschung automatisiert)', false)

h2('Empfohlen (innerhalb erste 4 Wochen)', C.amber)
checkBullet('Sentry für Error-Tracking aktivieren', false)
checkBullet('Backup-Strategie schriftlich dokumentieren (intern)', false)
checkBullet('Incident-Response-Playbook anlegen', false)
checkBullet('TOM-Dokument als PDF (kann automatisch generiert werden)', false)

h2('Nice to have (vor Skalierung)', C.green)
checkBullet('ISO 27001-Beratung erwägen (Premium-Argument)', false)
checkBullet('Penetration-Test einmal jährlich', false)
checkBullet('Datenschutzbeauftragter bestellen wenn > 20 Mitarbeiter (DSG Österreich)', false)

// ═══════════════════════════════════════════════════════════════════════
// SEITE 7: PILOTKUNDE-VORTEIL
// ═══════════════════════════════════════════════════════════════════════
doc.addPage()
h1('6. Pilotkunde-Vorteil')

p('Wenn die HV nach DSGVO-Lücken fragt, kannst du das ehrlich + selbstbewusst kontern:', { color: C.muted })

infoBox(
  'PILOTKUNDE-ANGEBOT',
  'Wenn Sie SMARTCARL als einer der ersten 3 Pilotkunden testen, profitieren Sie davon ' +
  'dass wir gemeinsam die letzten DSGVO-Punkte abschließen können — IHRE konkreten Anforderungen ' +
  'fließen direkt in unsere finale Datenschutz-Konzeption ein. Sie kommunizieren mit Ihrem ' +
  'eigenen Datenschutzanwalt, wir setzen technisch um.\n\n' +
  'Konkret: Einrichtungsgebühr von 699 € entfällt komplett. Sie sparen 699 € + bekommen ' +
  'Mitspracherecht beim finalen Datenschutz-Setup. Und falls etwas nicht passt — ' +
  '30 Tage Geld-zurück-Garantie, kein Risiko.',
  '#dbeafe',
  '#3b82f6',
  '#1e3a8a'
)

h2('Drei Sätze die du dir merken solltest', C.accent)

p('1. "Wir hosten ausschließlich in der EU — Frankfurt — Ihre Mieterdaten verlassen Deutschland nie."',
  { font: 'Helvetica-Bold', size: 11 })

p('2. "Jede Hausverwaltung hat eine technisch erzwungene Datenisolation — ich kann Ihnen das in der Demo live zeigen."',
  { font: 'Helvetica-Bold', size: 11 })

p('3. "Vor unserem Live-Gang stimmen wir mit einem Datenschutzanwalt ab — als Pilotkunde haben Sie Mitspracherecht."',
  { font: 'Helvetica-Bold', size: 11 })

infoBox(
  'GOLDENE REGEL',
  'NIEMALS sagen "wir sind 100% DSGVO-konform" — das gibt es nicht. Sage stattdessen ' +
  '"wir setzen Stand der Technik um und prüfen vor Live-Gang anwaltlich". ' +
  'Ehrlichkeit gewinnt Vertrauen, Übertreibung verliert es.',
  '#fef3c7',
  '#fbbf24',
  '#92400e'
)

doc.end()

console.log('✓ PDF erstellt: ' + outPath)
