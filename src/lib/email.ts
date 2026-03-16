import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'SchadensMelder <noreply@zerodamage.de>'

const STATUS_LABELS: Record<string, string> = {
  in_bearbeitung: 'In Bearbeitung',
  termin_vereinbart: 'Termin vereinbart',
  termin_telefonisch: 'Termin telefonisch vereinbart',
  erledigt: 'Erledigt',
  abgelehnt: 'Abgelehnt',
}

const STATUS_COLORS: Record<string, string> = {
  in_bearbeitung: '#f59e0b',
  termin_vereinbart: '#6366f1',
  erledigt: '#22c55e',
  abgelehnt: '#6b7280',
}

// Status change emails disabled — Mieter sees status in the app
export const NOTIFICATION_STATUSES: string[] = []

function baseTemplate(content: string, orgName: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;border-radius:12px 12px 0 0;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:#ffffff;font-size:18px;font-weight:700;">SchadensMelder</span>
                    <br>
                    <span style="color:#a1a1aa;font-size:13px;">${orgName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="color:#a1a1aa;font-size:12px;margin:0;">
                SchadensMelder · zerodamage.de<br>
                Diese E-Mail wurde automatisch generiert.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendStatusChangeEmail(params: {
  to: string
  tenantName: string
  caseNumber: string
  caseTitle: string
  newStatus: string
  comment: string
  orgName: string
}): Promise<void> {
  const { to, tenantName, caseNumber, caseTitle, newStatus, comment, orgName } = params
  const statusLabel = STATUS_LABELS[newStatus] || newStatus
  const statusColor = STATUS_COLORS[newStatus] || '#18181b'

  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Update zu Ihrer Schadensmeldung
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Hallo ${tenantName},</p>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Meldung</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 4px 0;">${caseTitle}</p>
      <p style="color:#71717a;font-size:13px;margin:0;">Fall-Nr. ${caseNumber}</p>
    </div>

    <p style="color:#52525b;font-size:14px;margin:0 0 12px 0;">Neuer Status:</p>
    <div style="display:inline-block;background-color:${statusColor}20;border:1px solid ${statusColor}40;border-radius:6px;padding:6px 14px;margin-bottom:24px;">
      <span style="color:${statusColor};font-size:14px;font-weight:600;">${statusLabel}</span>
    </div>

    ${comment ? `
    <div style="border-left:3px solid #e4e4e7;padding-left:16px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px 0;">Nachricht der Hausverwaltung</p>
      <p style="color:#18181b;font-size:14px;line-height:1.6;margin:0;">${comment}</p>
    </div>
    ` : ''}

    <a href="https://zerodamage.de/mein-bereich/meldungen"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Meldung ansehen →
    </a>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Status: ${statusLabel} – SchadensMelder`,
    html: baseTemplate(content, orgName),
  })
}


export async function sendTenantInviteEmail(params: {
  to: string
  tenantName: string | null
  activationCode: string
  expiresAt: string
  orgName: string
  unitName: string
}): Promise<void> {
  const { to, tenantName, activationCode, expiresAt, orgName, unitName } = params
  const greeting = tenantName ? `Hallo ${tenantName},` : 'Sehr geehrte Damen und Herren,'
  const expiryDate = new Date(expiresAt).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const registerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://zerodamage.de'}/register`

  const emailContent = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Ihre Hausverwaltung hat SchadensMelder eingeführt
    </h2>
    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">${greeting}</p>
    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      <strong>${orgName}</strong> nutzt ab sofort <strong>SchadensMelder</strong> —
      ein digitales Tool, mit dem Sie Schäden in Ihrer Wohnung bequem online melden und den
      Bearbeitungsstatus jederzeit einsehen können. Kein Telefonanruf, kein Warten.
    </p>
    <div style="background-color:#f4f4f5;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Ihre Wohnung</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 16px 0;">${unitName}</p>
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Ihr persönlicher Aktivierungscode</p>
      <p style="color:#18181b;font-size:28px;font-weight:700;letter-spacing:0.15em;font-family:monospace;margin:0 0 8px 0;">${activationCode}</p>
      <p style="color:#71717a;font-size:12px;margin:0;">Gültig bis ${expiryDate}</p>
    </div>
    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      Klicken Sie auf den Button, geben Sie Ihren Code ein und registrieren Sie sich in weniger als 2 Minuten:
    </p>
    <a href="${registerUrl}"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:24px;">
      Jetzt registrieren →
    </a>
    <p style="color:#a1a1aa;font-size:12px;line-height:1.6;margin:0;">
      Falls Sie Fragen haben, wenden Sie sich bitte direkt an Ihre Hausverwaltung ${orgName}.
    </p>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Einladung zu SchadensMelder – Ihr Aktivierungscode`,
    html: baseTemplate(emailContent, orgName),
  })
}

export async function sendDamageReportNotificationEmail(params: {
  to: string[]
  caseNumber: string
  title: string
  category: string
  urgency: string
  unitName: string
  tenantName: string
  orgName: string
  reportId?: string
  kiAnalysis?: string | null
  kiLeaseFound?: boolean
}): Promise<void> {
  const { to, caseNumber, title, category, urgency, unitName, tenantName, orgName, reportId, kiAnalysis, kiLeaseFound } = params
  if (!to.length) return

  const urgencyLabel: Record<string, string> = { notfall: 'Notfall', dringend: 'Dringend', normal: 'Normal', hoch: 'Dringend', mittel: 'Normal', niedrig: 'Niedrig' }
  const urgencyColor: Record<string, string> = { notfall: '#ef4444', dringend: '#f59e0b', normal: '#22c55e', hoch: '#ef4444', mittel: '#f59e0b', niedrig: '#22c55e' }
  const urg = urgencyLabel[urgency] || urgency
  const urgColor = urgencyColor[urgency] || '#18181b'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zerodamage.de'
  const caseUrl = reportId ? appUrl + '/dashboard/cases/' + reportId : appUrl + '/dashboard/cases'

  // Extract VERANTWORTLICH line for email badge
  let kiVerdikt: string | null = null
  let kiVerdiktColor = '#7c3aed'
  if (kiAnalysis) {
    const match = kiAnalysis.match(new RegExp('\*\*VERANTWORTLICH:\*\*\s*(.+)', 'i'))
    if (match) {
      kiVerdikt = match[1].trim()
      if (kiVerdikt.toLowerCase().includes('mieter')) kiVerdiktColor = '#dc2626'
      else if (kiVerdikt.toLowerCase().includes('hausverwaltung')) kiVerdiktColor = '#2563eb'
      else kiVerdiktColor = '#d97706'
    }
  }

  const kiSection = kiAnalysis ? (
    '<div style="background-color:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px 20px;margin-bottom:16px;">' +
    '<p style="color:#6d28d9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0;">&#10022; KI-Analyse (automatisch)</p>' +
    (kiVerdikt ? '<div style="display:inline-block;background-color:' + kiVerdiktColor + '15;border:1px solid ' + kiVerdiktColor + '40;border-radius:6px;padding:5px 14px;margin-bottom:10px;"><span style="color:' + kiVerdiktColor + ';font-size:14px;font-weight:700;">Verantwortlich: ' + kiVerdikt + '</span></div><br>' : '') +
    '<p style="color:#3b0764;font-size:13px;line-height:1.6;margin:8px 0 0 0;white-space:pre-wrap;">' + kiAnalysis.split('**').join('') + '</p>' +
    (!kiLeaseFound ? '<p style="color:#92400e;font-size:12px;margin:8px 0 0 0;">&#9888; Kein Mietvertrag hinterlegt &mdash; bitte hochladen.</p>' : '') +
    '</div>'
  ) : ''

  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Neue Schadensmeldung eingegangen
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Eine neue Meldung wurde soeben eingereicht und wartet auf Bearbeitung.</p>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Fall-Nr.</p>
      <p style="color:#18181b;font-size:15px;font-weight:700;margin:0 0 12px 0;">${caseNumber}</p>
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Titel</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 12px 0;">${title}</p>
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Einheit &middot; Mieter</p>
      <p style="color:#18181b;font-size:14px;margin:0 0 12px 0;">${unitName} &middot; ${tenantName}</p>
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Dringlichkeit</p>
      <div style="display:inline-block;background-color:${urgColor}20;border:1px solid ${urgColor}40;border-radius:6px;padding:4px 12px;">
        <span style="color:${urgColor};font-size:13px;font-weight:600;">${urg}</span>
      </div>
    </div>

    ${kiSection}

    <a href="${caseUrl}"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Fall öffnen &amp; bestätigen &rarr;
    </a>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '[' + caseNumber + '] Neue Meldung' + (kiVerdikt ? ' · ' + kiVerdikt : '') + ': ' + title,
    html: baseTemplate(content, orgName),
  })
}

export async function sendAblehnungEmail(params: {
  to: string
  tenantName: string
  caseNumber: string
  caseTitle: string
  begruendung: string
  orgName: string
  orgPhone?: string
}): Promise<void> {
  const { to, tenantName, caseNumber, caseTitle, begruendung, orgName, orgPhone } = params
  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Ergebnis Ihrer Schadensmeldung
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Hallo ${tenantName},</p>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Meldung</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 4px 0;">${caseTitle}</p>
      <p style="color:#71717a;font-size:13px;margin:0;">Fall-Nr. ${caseNumber}</p>
    </div>

    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#dc2626;font-size:13px;font-weight:700;margin:0 0 8px 0;">&#9888; Kosten liegen beim Mieter</p>
      <p style="color:#18181b;font-size:14px;line-height:1.6;margin:0;">${begruendung}</p>
    </div>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      Bei Fragen oder Unklarheiten wenden Sie sich bitte telefonisch an Ihre Hausverwaltung:
    </p>
    ${orgPhone ? `<p style="color:#18181b;font-size:16px;font-weight:700;margin:0 0 24px 0;">&#128222; ${orgPhone}</p>` : `<p style="color:#52525b;font-size:14px;margin:0 0 24px 0;">Bitte kontaktieren Sie <strong>${orgName}</strong> direkt.</p>`}

    <a href="https://zerodamage.de/mein-bereich/meldungen"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Meldung ansehen &rarr;
    </a>
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Ergebnis Ihrer Schadensmeldung – ${orgName}`,
    html: baseTemplate(content, orgName),
  })
}

export async function sendWeiterleitungTenantEmail(params: {
  to: string
  tenantName: string
  caseNumber: string
  caseTitle: string
  contractorName: string
  contractorCompany: string
  wunschtermin: string | null
  orgName: string
}): Promise<void> {
  const { to, tenantName, caseNumber, caseTitle, contractorName, contractorCompany, wunschtermin, orgName } = params
  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Ihr Schaden wurde bestätigt
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Hallo ${tenantName},</p>

    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#16a34a;font-size:13px;font-weight:700;margin:0 0 4px 0;">&#10003; Schaden wurde von der Hausverwaltung bestätigt</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:4px 0 2px 0;">${caseTitle}</p>
      <p style="color:#71717a;font-size:13px;margin:0;">Fall-Nr. ${caseNumber}</p>
    </div>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Zugewiesene Werkstatt</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 2px 0;">${contractorCompany}</p>
      <p style="color:#71717a;font-size:13px;margin:0 0 12px 0;">Ansprechperson: ${contractorName}</p>
      ${wunschtermin ? `
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Ihr Wunschtermin</p>
      <p style="color:#18181b;font-size:14px;font-weight:600;margin:0;">${wunschtermin}</p>
      ` : ''}
    </div>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      Die Werkstatt wurde über Ihren Wunschtermin informiert. Sobald der Termin bestätigt wird, erhalten Sie eine weitere Benachrichtigung.
    </p>

    <a href="https://zerodamage.de/mein-bereich/meldungen"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Status verfolgen &rarr;
    </a>
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Schaden bestätigt – Werkstatt wurde informiert`,
    html: baseTemplate(content, orgName),
  })
}

export async function sendContractorEmail(params: {
  to: string
  contractorName: string
  caseNumber: string
  caseTitle: string
  category: string
  description: string | null
  unitAddress: string
  unitName: string
  wunschtermin: string | null
  tokenUrl: string
  orgName: string
  orgPhone?: string
}): Promise<void> {
  const { to, contractorName, caseNumber, caseTitle, category, description, unitAddress, unitName, wunschtermin, tokenUrl, orgName, orgPhone } = params
  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Neuer Reparaturauftrag
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Guten Tag ${contractorName},</p>
    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      <strong>${orgName}</strong> beauftragt Sie mit folgendem Auftrag:
    </p>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Fall-Nr.</p>
      <p style="color:#18181b;font-size:15px;font-weight:700;margin:0 0 12px 0;">${caseNumber}</p>

      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Schadensart</p>
      <p style="color:#18181b;font-size:14px;font-weight:600;margin:0 0 12px 0;">${caseTitle}</p>

      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Adresse</p>
      <p style="color:#18181b;font-size:14px;margin:0 0 12px 0;">${unitAddress} &mdash; ${unitName}</p>

      ${wunschtermin ? `
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Wunschtermin des Mieters</p>
      <p style="color:#18181b;font-size:15px;font-weight:700;margin:0 0 12px 0;">${wunschtermin}</p>
      ` : ''}

      ${description ? `
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Beschreibung</p>
      <p style="color:#18181b;font-size:14px;line-height:1.6;margin:0;">${description}</p>
      ` : ''}
    </div>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
      Bitte bestätigen Sie den Termin oder schlagen Sie einen anderen vor:
    </p>

    <a href="${tokenUrl}"
       style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;margin-bottom:24px;">
      &#10003; Termin bestätigen / Neuen Termin vorschlagen &rarr;
    </a>

    ${orgPhone ? `<p style="color:#71717a;font-size:13px;margin:0;">Rückfragen: ${orgName} &mdash; ${orgPhone}</p>` : `<p style="color:#71717a;font-size:13px;margin:0;">Rückfragen direkt an ${orgName}.</p>`}
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Reparaturauftrag – ${caseTitle}`,
    html: baseTemplate(content, orgName),
  })
}

export async function sendTerminBestaetigung(params: {
  hvEmails: string[]
  tenantEmail: string | null
  tenantName: string
  caseNumber: string
  caseTitle: string
  contractorCompany: string
  confirmedDate: string
  isRescheduled: boolean
  isPhone?: boolean
  orgName: string
}): Promise<void> {
  const { hvEmails, tenantEmail, tenantName, caseNumber, caseTitle, contractorCompany, confirmedDate, isRescheduled, isPhone, orgName } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zerodamage.de'

  const hvHeading = isPhone
    ? 'Werkstatt hat Termin telefonisch vereinbart'
    : isRescheduled ? 'Werkstatt hat neuen Termin vorgeschlagen' : 'Werkstatt hat Termin bestätigt'
  const hvBadge = isPhone
    ? '&#128222; Telefonisch vereinbart'
    : isRescheduled ? '&#128197; Neuer Terminvorschlag' : '&#10003; Termin bestätigt'

  // E-Mail an HV
  if (hvEmails.length > 0) {
    const hvContent = `
      <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
        ${hvHeading}
      </h2>
      <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#16a34a;font-size:13px;font-weight:700;margin:0 0 4px 0;">${hvBadge}</p>
        ${!isPhone ? `<p style="color:#18181b;font-size:15px;font-weight:700;margin:4px 0 2px 0;">${confirmedDate}</p>` : ''}
        <p style="color:#71717a;font-size:13px;margin:0;">${contractorCompany} &mdash; Fall ${caseNumber}: ${caseTitle}</p>
      </div>
      <a href="${appUrl}/dashboard/cases"
         style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
        Im Portal ansehen &rarr;
      </a>
    `
    await resend.emails.send({
      from: FROM_EMAIL,
      to: hvEmails,
      subject: isPhone
        ? `[${caseNumber}] Termin telefonisch vereinbart – ${contractorCompany}`
        : `[${caseNumber}] ${isRescheduled ? 'Neuer Terminvorschlag' : 'Termin bestätigt'} – ${contractorCompany}`,
      html: baseTemplate(hvContent, orgName),
    })
  }

  // E-Mail an Mieter
  if (tenantEmail) {
    const tenantHeading = isPhone
      ? 'Werkstatt hat einen Termin mit Ihnen vereinbart'
      : isRescheduled ? 'Neuer Terminvorschlag der Werkstatt' : 'Ihr Reparaturtermin wurde bestätigt'
    const tenantBadge = isPhone
      ? '&#128222; Termin telefonisch vereinbart'
      : isRescheduled ? '&#128197; Die Werkstatt schlägt einen neuen Termin vor' : '&#10003; Termin bestätigt'
    const tenantText = isPhone
      ? 'Die Werkstatt hat einen Termin direkt mit Ihnen telefonisch vereinbart. Bitte stellen Sie sicher, dass die Wohnung zum vereinbarten Zeitpunkt zugänglich ist.'
      : isRescheduled
        ? 'Die Werkstatt konnte Ihren Wunschtermin nicht einhalten und hat einen neuen Termin vorgeschlagen. Ihre Hausverwaltung wurde informiert.'
        : 'Die Werkstatt kommt zum oben angezeigten Termin zu Ihnen. Bitte stellen Sie sicher, dass die Wohnung zugänglich ist.'

    const tenantContent = `
      <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
        ${tenantHeading}
      </h2>
      <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Hallo ${tenantName},</p>

      <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#16a34a;font-size:13px;font-weight:700;margin:0 0 4px 0;">${tenantBadge}</p>
        ${!isPhone ? `<p style="color:#18181b;font-size:16px;font-weight:700;margin:4px 0 2px 0;">${confirmedDate}</p>` : ''}
        <p style="color:#71717a;font-size:13px;margin:0;">${contractorCompany}</p>
      </div>

      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
        ${tenantText}
      </p>

      <a href="https://zerodamage.de/mein-bereich/meldungen"
         style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
        Meldung ansehen &rarr;
      </a>
    `
    await resend.emails.send({
      from: FROM_EMAIL,
      to: tenantEmail,
      subject: isPhone
        ? `[${caseNumber}] Termin telefonisch vereinbart – ${contractorCompany}`
        : `[${caseNumber}] ${isRescheduled ? 'Neuer Terminvorschlag' : 'Termin bestätigt'} – ${contractorCompany}`,
      html: baseTemplate(tenantContent, orgName),
    })
  }
}

export async function sendNewCommentEmail(params: {
  to: string
  tenantName: string
  caseNumber: string
  caseTitle: string
  comment: string
  authorName: string
  orgName: string
}): Promise<void> {
  const { to, tenantName, caseNumber, caseTitle, comment, authorName, orgName } = params

  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Neue Nachricht von Ihrer Hausverwaltung
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Hallo ${tenantName},</p>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Meldung</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 4px 0;">${caseTitle}</p>
      <p style="color:#71717a;font-size:13px;margin:0;">Fall-Nr. ${caseNumber}</p>
    </div>

    <div style="border-left:3px solid #3b82f6;padding-left:16px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px 0;">Nachricht von ${authorName}</p>
      <p style="color:#18181b;font-size:14px;line-height:1.6;margin:0;">${comment}</p>
    </div>

    <a href="https://zerodamage.de/mein-bereich/meldungen"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Antworten / Meldung ansehen →
    </a>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Neue Nachricht – SchadensMelder`,
    html: baseTemplate(content, orgName),
  })
}
