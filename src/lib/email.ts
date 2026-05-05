import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'SMARTCARL <noreply@smartcarl.com>'

const STATUS_LABELS: Record<string, string> = {
  termin_vereinbart: 'Termin vereinbart',
  termin_telefonisch: 'Werkstatt vereinbart Termin persönlich',
  erledigt: 'Erledigt',
  abgelehnt: 'Abgelehnt',
}

const STATUS_COLORS: Record<string, string> = {
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
                    <span style="color:#ffffff;font-size:18px;font-weight:700;">SMARTCARL</span>
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
                SMARTCARL · smartcarl.com<br>
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

    <a href="https://smartcarl.com/mein-bereich/meldungen"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Meldung ansehen →
    </a>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Status: ${statusLabel} – SMARTCARL`,
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

  // Use only the first name for a clean, personal greeting (avoids full name duplication)
  const firstName = tenantName ? tenantName.trim().split(' ')[0] : null
  const greeting = firstName ? `Hallo ${firstName},` : 'Guten Tag,'

  const expiryDate = new Date(expiresAt).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const registerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'}/register`

  const emailContent = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 16px 0;">
      Einladung Ihrer Hausverwaltung
    </h2>

    <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 6px 0;">${greeting}</p>
    <p style="color:#52525b;font-size:14px;line-height:1.7;margin:0 0 20px 0;">
      Ihre Hausverwaltung <strong>${orgName}</strong> hat ein neues digitales System
      für die Schadensmeldung eingeführt. Ab sofort können Sie Schäden in Ihrer Wohnung
      einfach online melden — ohne Telefonanruf, ohne Warten.
    </p>

    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="color:#166534;font-size:13px;font-weight:600;margin:0 0 2px 0;">
        &#10003; Diese Einladung wurde von <strong>${orgName}</strong> ausgelöst
      </p>
      <p style="color:#15803d;font-size:12px;margin:0;">
        Sie erhalten diese E-Mail, weil Sie als Mieter der unten angegebenen Wohnung eingetragen wurden.
      </p>
    </div>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Ihre Wohnung</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 20px 0;">${unitName}</p>

      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px 0;">Ihr persönlicher Aktivierungscode</p>
      <p style="color:#18181b;font-size:30px;font-weight:700;letter-spacing:0.2em;font-family:monospace;margin:0 0 6px 0;">${activationCode}</p>
      <p style="color:#71717a;font-size:12px;margin:0;">Gültig bis <strong>${expiryDate}</strong> &middot; Nur für Sie bestimmt</p>
    </div>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
      Klicken Sie auf den Button, geben Sie Ihren Code ein und registrieren Sie sich in 2 Minuten:
    </p>
    <a href="${registerUrl}"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:16px;">
      Jetzt kostenlos registrieren →
    </a>

    <p style="color:#71717a;font-size:12px;margin:0 0 8px 0;">
      Oder öffnen Sie diesen Link manuell in Ihrem Browser:<br>
      <span style="color:#18181b;font-weight:500;">${registerUrl}</span>
    </p>

    <div style="background-color:#fefce8;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
      <p style="color:#854d0e;font-size:12px;line-height:1.6;margin:0;">
        <strong>&#9888; Hinweis:</strong> Diese E-Mail stammt von SMARTCARL, dem offiziellen digitalen System Ihrer Hausverwaltung <strong>${orgName}</strong>.
        Falls sie in Ihrem Spam-Ordner gelandet ist, markieren Sie sie bitte als <strong>„Kein Spam"</strong> — so erhalten Sie zukünftige Nachrichten direkt im Posteingang.
        Ihr Aktivierungscode lautet: <strong style="letter-spacing:0.1em;">${activationCode}</strong>
      </p>
    </div>

    <div style="border-top:1px solid #e4e4e7;padding-top:16px;">
      <p style="color:#a1a1aa;font-size:12px;line-height:1.7;margin:0;">
        Bei Fragen wenden Sie sich direkt an Ihre Hausverwaltung <strong>${orgName}</strong>.<br>
        Falls Sie diese Einladung nicht erwartet haben oder keine Wohnung bei ${orgName} besitzen,
        können Sie diese E-Mail einfach ignorieren.
      </p>
    </div>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Einladung von ${orgName} – Schäden jetzt einfach online melden`,
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'
  const caseUrl = reportId ? appUrl + '/dashboard/cases/' + reportId : appUrl + '/dashboard/cases'

  // Extract VERANTWORTLICH line for email badge
  let kiVerdikt: string | null = null
  let kiVerdiktColor = '#7c3aed'
  if (kiAnalysis) {
    const match = kiAnalysis.match(/(?:Zust[äa]ndigkeit|VERANTWORTLICH)[*\s]*:?\s*\*?\*?\s*(VERMIETER|MIETER|UNKLAR)/i)
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

export async function sendTerminVereinbartEmail(params: {
  to: string
  tenantName: string
  caseNumber: string
  caseTitle: string
  scheduledAppointment: string | null
  orgName: string
}): Promise<void> {
  const { to, tenantName, caseNumber, caseTitle, scheduledAppointment, orgName } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'

  let appointmentHtml = ''
  if (scheduledAppointment) {
    const date = new Date(scheduledAppointment)
    const formatted = date.toLocaleDateString('de-AT', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
    appointmentHtml = `
    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#16a34a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px 0;">&#128197; Bestätigter Termin</p>
      <p style="color:#18181b;font-size:18px;font-weight:700;margin:0;">${formatted}</p>
    </div>`
  }

  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Termin für Ihre Schadensmeldung
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Hallo ${tenantName},</p>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Meldung</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 4px 0;">${caseTitle}</p>
      <p style="color:#71717a;font-size:13px;margin:0;">Fall-Nr. ${caseNumber}</p>
    </div>

    ${appointmentHtml}

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      Bitte stellen Sie sicher, dass die Wohnung zum vereinbarten Termin zugänglich ist.
      Bei Fragen wenden Sie sich an Ihre Hausverwaltung.
    </p>

    <a href="${appUrl}/mein-bereich/meldungen"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Meldung ansehen &rarr;
    </a>
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Termin vereinbart – ${orgName}`,
    html: baseTemplate(content, orgName),
  })
}

export async function sendAblehnungEmail(params: {
  to: string
  tenantName: string
  caseNumber: string
  caseTitle: string
  begruendung: string
  reportId: string
  orgName: string
  orgPhone?: string
}): Promise<void> {
  const { to, tenantName, caseNumber, caseTitle, begruendung, reportId, orgName, orgPhone } = params
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

    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'}/mein-bereich/meldungen/${reportId}"
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

export async function sendBestaetigungEmail(params: {
  to: string
  tenantName: string
  caseNumber: string
  caseTitle: string
  reportId: string
  orgName: string
}): Promise<void> {
  const { to, tenantName, caseNumber, caseTitle, reportId, orgName } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'
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

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      Ihre Hausverwaltung hat Ihre Schadensmeldung bestätigt und eine Werkstatt wurde informiert.
    </p>

    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="color:#166534;font-size:13px;font-weight:600;margin:0 0 4px 0;">Was passiert als nächstes?</p>
      <p style="color:#15803d;font-size:13px;line-height:1.6;margin:0;">
        Die Werkstatt wird Ihren Wunschtermin entweder per E-Mail bestätigen oder Sie direkt telefonisch kontaktieren.
      </p>
    </div>

    <a href="${appUrl}/mein-bereich/meldungen/${reportId}"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Meldung ansehen &rarr;
    </a>
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Update zu Ihrer Schadensmeldung – ${orgName}`,
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
  wunschtermin2?: string | null
  orgName: string
}): Promise<void> {
  const { to, tenantName, caseNumber, caseTitle, contractorName, contractorCompany, wunschtermin, wunschtermin2, orgName } = params
  const hasTermine = !!(wunschtermin || wunschtermin2)
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
      ${hasTermine ? `
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px 0;">Ihre Wunschtermine</p>
      ${wunschtermin ? `<p style="color:#18181b;font-size:14px;font-weight:600;margin:0 0 4px 0;">1. ${wunschtermin}</p>` : ''}
      ${wunschtermin2 ? `<p style="color:#18181b;font-size:14px;font-weight:600;margin:0;">2. ${wunschtermin2}</p>` : ''}
      ` : ''}
    </div>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      Die Werkstatt wurde über Ihre Wunschtermine informiert und wählt einen davon aus. Sobald der Termin feststeht, erhalten Sie eine separate Bestätigung mit dem konkreten Termin.
    </p>

    <a href="https://smartcarl.com/mein-bereich/meldungen"
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

export interface ContractorEmailParams {
  to: string
  contractorName: string
  caseNumber: string
  caseTitle: string
  category: string
  description: string | null
  unitAddress: string
  unitName: string
  wunschtermin: string | null
  wunschtermin2: string | null
  tokenUrl: string
  orgName: string
  orgPhone?: string
  personalNote?: string | null
  /** Professionelle Auftragsbeschreibung von CARL (an die Werkstatt gerichtet) — ersetzt Mieter-Beschreibung */
  werkstattAuftrag?: string | null
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildContractorEmail(params: ContractorEmailParams): { subject: string; html: string; from: string } {
  const { to: _to, contractorName, caseNumber, caseTitle, description, unitAddress, unitName, wunschtermin, wunschtermin2, tokenUrl, orgName, orgPhone, personalNote, werkstattAuftrag } = params
  const noteHtml = personalNote && personalNote.trim()
    ? `<div style="background-color:#fef9c3;border-left:4px solid #eab308;border-radius:6px;padding:12px 16px;margin-bottom:20px;">
         <p style="color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px 0;">Persönliche Nachricht von ${escapeHtml(orgName)}</p>
         <p style="color:#18181b;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${escapeHtml(personalNote.trim())}</p>
       </div>`
    : ''

  // Adresse: weglassen wenn Address und Name redundant sind (gleicher Text oder einer im anderen enthalten)
  const addrTrim = (unitAddress || '').trim()
  const nameTrim = (unitName || '').trim()
  const addressLine = addrTrim && nameTrim && addrTrim !== nameTrim && !addrTrim.includes(nameTrim) && !nameTrim.includes(addrTrim)
    ? `${escapeHtml(addrTrim)} &mdash; ${escapeHtml(nameTrim)}`
    : escapeHtml(addrTrim || nameTrim)

  // Auftragsbeschreibung: bevorzugt CARL's professionelle Beschreibung, sonst Mieter-Text als Fallback
  const auftragText = (werkstattAuftrag && werkstattAuftrag.trim()) || description || null

  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Neuer Reparaturauftrag
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Guten Tag ${escapeHtml(contractorName)},</p>
    ${noteHtml}
    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      <strong>${escapeHtml(orgName)}</strong> beauftragt Sie mit folgendem Auftrag:
    </p>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Fall-Nr.</p>
      <p style="color:#18181b;font-size:15px;font-weight:700;margin:0 0 12px 0;">${escapeHtml(caseNumber)}</p>

      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Schadensart</p>
      <p style="color:#18181b;font-size:14px;font-weight:600;margin:0 0 12px 0;">${escapeHtml(caseTitle)}</p>

      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Adresse</p>
      <p style="color:#18181b;font-size:14px;margin:0 0 12px 0;">${addressLine}</p>

      ${auftragText ? `
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Auftrag</p>
      <p style="color:#18181b;font-size:14px;line-height:1.6;margin:0;">${escapeHtml(auftragText)}</p>
      ` : ''}
    </div>

    ${(wunschtermin || wunschtermin2) ? `
    <p style="color:#18181b;font-size:14px;font-weight:600;margin:0 0 12px 0;">Terminwünsche des Mieters:</p>
    ` : ''}

    ${wunschtermin ? `
    <a href="${tokenUrl}?w=1"
       style="display:block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:10px;text-align:center;">
      &#10003; Wunschtermin 1 bestätigen: ${escapeHtml(wunschtermin)}
    </a>
    ` : ''}

    ${wunschtermin2 ? `
    <a href="${tokenUrl}?w=2"
       style="display:block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:10px;text-align:center;">
      &#10003; Wunschtermin 2 bestätigen: ${escapeHtml(wunschtermin2)}
    </a>
    ` : ''}

    <a href="${tokenUrl}?w=phone"
       style="display:block;background-color:#f4f4f5;color:#18181b;text-decoration:none;padding:14px 20px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:24px;text-align:center;border:1px solid #e4e4e7;">
      &#128222; Termin persönlich mit Mieter vereinbaren
    </a>

    ${orgPhone ? `<p style="color:#71717a;font-size:13px;margin:0;">Rückfragen: ${escapeHtml(orgName)} &mdash; ${escapeHtml(orgPhone)}</p>` : `<p style="color:#71717a;font-size:13px;margin:0;">Rückfragen direkt an ${escapeHtml(orgName)}.</p>`}
  `
  return {
    subject: `[${orgName}] Auftrag ${caseNumber} – ${caseTitle}`,
    from: FROM_EMAIL,
    html: baseTemplate(content, orgName),
  }
}

export async function sendContractorEmail(params: ContractorEmailParams): Promise<void> {
  const { subject, html, from } = buildContractorEmail(params)
  await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
  })
}

export async function sendTerminBestaetigungMieter(params: {
  to: string
  tenantName: string
  caseNumber: string
  caseTitle: string
  contractorCompany: string
  confirmedDate: string
  orgName: string
}): Promise<void> {
  const { to, tenantName, caseNumber, caseTitle, contractorCompany, confirmedDate, orgName } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'

  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Ihr Reparaturtermin wurde bestätigt
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Hallo ${tenantName},</p>

    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#16a34a;font-size:13px;font-weight:700;margin:0 0 4px 0;">&#10003; Termin bestätigt</p>
      <p style="color:#18181b;font-size:18px;font-weight:700;margin:4px 0 4px 0;">${confirmedDate}</p>
      <p style="color:#71717a;font-size:13px;margin:0;">${contractorCompany} &mdash; Fall ${caseNumber}: ${caseTitle}</p>
    </div>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
      Bitte halten Sie sich diesen Termin frei. Die Werkstatt kommt zu Ihnen.
    </p>

    <a href="${appUrl}/mein-bereich/meldungen"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Meldung ansehen &rarr;
    </a>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Ihr Reparaturtermin: ${confirmedDate}`,
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
  contractorPhone?: string | null
  confirmedDate: string
  isRescheduled: boolean
  isPhone?: boolean
  orgName: string
}): Promise<void> {
  const { hvEmails, tenantEmail, tenantName, caseNumber, caseTitle, contractorCompany, contractorPhone, confirmedDate, isRescheduled, isPhone, orgName } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'

  const hvHeading = isPhone
    ? 'Werkstatt vereinbart Termin telefonisch'
    : isRescheduled ? 'Werkstatt hat neuen Termin vorgeschlagen' : 'Werkstatt hat Termin bestätigt'
  const hvBadge = isPhone
    ? '&#128222; Mieter wird telefonisch kontaktiert'
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
        ? `[${caseNumber}] Werkstatt kontaktiert Mieter telefonisch – ${contractorCompany}`
        : `[${caseNumber}] ${isRescheduled ? 'Neuer Terminvorschlag' : 'Termin bestätigt'} – ${contractorCompany}`,
      html: baseTemplate(hvContent, orgName),
    })
  }

  // E-Mail an Mieter
  if (tenantEmail) {
    const tenantHeading = isPhone
      ? 'Die Werkstatt meldet sich bei Ihnen'
      : isRescheduled ? 'Neuer Terminvorschlag der Werkstatt' : 'Ihr Reparaturtermin wurde bestätigt'
    const tenantBadge = isPhone
      ? '&#128222; Telefonische Terminvereinbarung'
      : isRescheduled ? '&#128197; Die Werkstatt schlägt einen neuen Termin vor' : '&#10003; Termin bestätigt'
    const tenantText = isPhone
      ? 'Die Werkstatt möchte einen Termin telefonisch mit Ihnen vereinbaren und wird sich in Kürze bei Ihnen melden.'
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

      ${isPhone && contractorPhone ? `
      <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#1d4ed8;font-size:13px;font-weight:700;margin:0 0 6px 0;">&#128222; Werkstatt – Rückrufnummer</p>
        <p style="color:#18181b;font-size:20px;font-weight:700;margin:0;">${contractorPhone}</p>
        <p style="color:#71717a;font-size:12px;margin:6px 0 0 0;">${contractorCompany}</p>
      </div>
      ` : ''}

      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
        ${tenantText}
      </p>

      <a href="https://smartcarl.com/mein-bereich/meldungen"
         style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
        Meldung ansehen &rarr;
      </a>
    `
    await resend.emails.send({
      from: FROM_EMAIL,
      to: tenantEmail,
      subject: isPhone
        ? `[${caseNumber}] Werkstatt versucht Sie zu erreichen – ${contractorCompany}`
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

    <a href="https://smartcarl.com/mein-bereich/meldungen"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Antworten / Meldung ansehen →
    </a>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Neue Nachricht – SMARTCARL`,
    html: baseTemplate(content, orgName),
  })
}

export async function sendWerkstattErinnerung(params: {
  hvEmails: string[]
  tenantEmail: string | null
  tenantName: string
  caseNumber: string
  caseTitle: string
  contractorCompany: string
  contractorPhone: string | null
  reportId: string
  orgName: string
}): Promise<void> {
  const { hvEmails, tenantEmail, tenantName, caseNumber, caseTitle, contractorCompany, contractorPhone, reportId, orgName } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'
  const caseUrl = appUrl + '/dashboard/cases/' + reportId

  // E-Mail an HV
  if (hvEmails.length > 0) {
    const hvContent = `
      <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
        Werkstatt hat noch nicht reagiert
      </h2>
      <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 4px 0;">&#9888; Keine Antwort seit 24 Stunden</p>
        <p style="color:#18181b;font-size:15px;font-weight:600;margin:4px 0 2px 0;">${contractorCompany}</p>
        <p style="color:#71717a;font-size:13px;margin:0;">Fall ${caseNumber}: ${caseTitle}</p>
      </div>
      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
        Die Werkstatt <strong>${contractorCompany}</strong> hat die Terminanfrage noch nicht beantwortet.
        Bitte prüfen Sie den Fall und kontaktieren Sie die Werkstatt ggf. direkt.
      </p>
      ${contractorPhone ? `<p style="color:#18181b;font-size:16px;font-weight:700;margin:0 0 24px 0;">&#128222; ${contractorPhone}</p>` : ''}
      <a href="${caseUrl}"
         style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
        Fall pruefen &rarr;
      </a>
    `
    await resend.emails.send({
      from: FROM_EMAIL,
      to: hvEmails,
      subject: `[${caseNumber}] Werkstatt reagiert nicht – bitte pruefen`,
      html: baseTemplate(hvContent, orgName),
    })
  }

  // E-Mail an Mieter
  if (tenantEmail) {
    const tenantContent = `
      <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
        Wir arbeiten an Ihrem Termin
      </h2>
      <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Hallo ${tenantName},</p>

      <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#16a34a;font-size:13px;font-weight:700;margin:0 0 4px 0;">&#10003; Ihr Schaden wird bearbeitet</p>
        <p style="color:#18181b;font-size:15px;font-weight:600;margin:4px 0 2px 0;">${caseTitle}</p>
        <p style="color:#71717a;font-size:13px;margin:0;">Fall-Nr. ${caseNumber}</p>
      </div>

      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
        Die Werkstatt <strong>${contractorCompany}</strong> wird sich in Kuerze mit Ihnen in Verbindung setzen, um einen Termin zu vereinbaren.
      </p>

      ${contractorPhone ? `
      <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#1d4ed8;font-size:13px;font-weight:700;margin:0 0 6px 0;">&#128222; Werkstatt – Rueckrufnummer</p>
        <p style="color:#18181b;font-size:20px;font-weight:700;margin:0;">${contractorPhone}</p>
        <p style="color:#71717a;font-size:12px;margin:6px 0 0 0;">${contractorCompany}</p>
      </div>
      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
        Falls Sie erreichbar sein moechten, koennen Sie die Werkstatt auch direkt unter obiger Nummer anrufen.
      </p>
      ` : '<div style="margin-bottom:24px;"></div>'}

      <a href="https://smartcarl.com/mein-bereich/meldungen"
         style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
        Status verfolgen &rarr;
      </a>
    `
    await resend.emails.send({
      from: FROM_EMAIL,
      to: tenantEmail,
      subject: `[${caseNumber}] Wir arbeiten an Ihrem Termin – ${contractorCompany} kontaktiert Sie bald`,
      html: baseTemplate(tenantContent, orgName),
    })
  }
}

export async function sendWerkstattWillkommensmail(params: {
  to: string
  contractorName: string
  orgName: string
  orgPhone?: string
}): Promise<void> {
  const { to, contractorName, orgName, orgPhone } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'

  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Herzlich willkommen als Partnerwerkstatt
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Guten Tag ${contractorName},</p>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      <strong>${orgName}</strong> nutzt ab sofort <strong>SMARTCARL</strong> für die digitale Abwicklung von Schadensmeldungen.
      Als eingetragene Partnerwerkstatt werden Sie bei passenden Aufträgen automatisch per E-Mail kontaktiert.
    </p>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0;">So läuft es ab</p>
      <p style="color:#52525b;font-size:14px;line-height:1.8;margin:0;">
        1. Mieter meldet einen Schaden online<br/>
        2. SMARTCARL analysiert den Schaden und wählt passende Werkstatt<br/>
        3. Sie erhalten eine E-Mail mit allen Details: Adresse, Schadensbeschreibung, Terminwünsche<br/>
        4. Per Klick bestätigen Sie einen der vorgeschlagenen Termine — fertig
      </p>
    </div>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
      Kein Login erforderlich. Kein neues System einlernen. Einfach auf den Link in der E-Mail klicken und Termin bestätigen.
    </p>

    ${orgPhone ? `<p style="color:#71717a;font-size:13px;margin:0 0 24px 0;">Bei Rückfragen erreichen Sie <strong>${orgName}</strong> unter: <strong>${orgPhone}</strong></p>` : `<p style="color:#71717a;font-size:13px;margin:0 0 24px 0;">Bei Rückfragen wenden Sie sich direkt an <strong>${orgName}</strong>.</p>`}

    <a href="${appUrl}"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Mehr über SMARTCARL &rarr;
    </a>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${orgName} nutzt jetzt SMARTCARL – so funktioniert die Auftragsabwicklung`,
    html: baseTemplate(content, orgName),
  })
}

// Anfrage-E-Mail an unbekannte Werkstatt — KEIN SMARTCARL-Branding, HV schreibt im eigenen Namen
function anfrageTemplate(content: string, orgName: string): string {
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
          <tr>
            <td style="background-color:#1e3a5f;border-radius:12px 12px 0 0;padding:24px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;">${orgName}</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="color:#a1a1aa;font-size:12px;margin:0;">
                Diese E-Mail wurde von ${orgName} versendet.
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

export async function sendAnfrageEmail(params: {
  to: string
  caseNumber: string
  caseTitle: string
  category: string
  description: string | null
  unitAddress: string
  unitName: string
  wunschtermin: string | null
  wunschtermin2: string | null
  orgName: string
  orgPhone?: string
  orgEmail?: string
}): Promise<void> {
  const { to, caseNumber, caseTitle, category, description, unitAddress, unitName, wunschtermin, wunschtermin2, orgName, orgPhone, orgEmail } = params

  const content = `
    <h2 style="color:#18181b;font-size:22px;font-weight:700;margin:0 0 8px 0;">
      Anfrage für Reparaturarbeiten
    </h2>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px 0;">Sehr geehrte Damen und Herren,</p>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
      wir sind die Hausverwaltung <strong>${orgName}</strong> und benötigen für eine unserer verwalteten Liegenschaften
      einen Fachbetrieb für folgende Reparatur:
    </p>

    <div style="background-color:#f4f4f5;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Art des Schadens</p>
      <p style="color:#18181b;font-size:15px;font-weight:700;margin:0 0 12px 0;">${caseTitle}</p>

      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Kategorie</p>
      <p style="color:#18181b;font-size:14px;margin:0 0 12px 0;">${category}</p>

      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Adresse</p>
      <p style="color:#18181b;font-size:14px;margin:0 0 12px 0;">${unitAddress} — ${unitName}</p>

      ${description ? `
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Schadensbeschreibung</p>
      <p style="color:#18181b;font-size:14px;line-height:1.6;margin:0;">${description}</p>
      ` : ''}
    </div>

    ${(wunschtermin || wunschtermin2) ? `
    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 12px 0;">
      <strong>Mögliche Termine für den Einsatz:</strong>
    </p>
    <ul style="color:#52525b;font-size:14px;line-height:1.8;margin:0 0 20px 0;padding-left:20px;">
      ${wunschtermin ? `<li>${wunschtermin}</li>` : ''}
      ${wunschtermin2 ? `<li>${wunschtermin2}</li>` : ''}
    </ul>
    ` : ''}

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
      Bitte teilen Sie uns mit, ob Sie diesen Auftrag übernehmen können und zu welchem Termin ein Einsatz möglich wäre.
    </p>

    <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 8px 0;"><strong>Kontakt:</strong></p>
    <p style="color:#52525b;font-size:14px;line-height:1.8;margin:0 0 24px 0;">
      ${orgName}<br/>
      ${orgPhone ? `Tel: ${orgPhone}<br/>` : ''}
      ${orgEmail ? `E-Mail: ${orgEmail}` : ''}
    </p>

    <p style="color:#71717a;font-size:13px;margin:0;">
      Wir freuen uns auf Ihre Rückmeldung.<br/>
      Mit freundlichen Grüßen,<br/>
      <strong>${orgName}</strong>
    </p>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${orgName}] Anfrage Reparaturauftrag: ${caseTitle} – ${unitAddress}`,
    html: anfrageTemplate(content, orgName),
  })
}

export async function sendAdminSuspiciousActivityAlert(params: {
  tenantName: string
  tenantEmail: string | null
  orgName: string
  reportCount: number
  unitName: string
  dashboardUrl: string
}): Promise<void> {
  const { tenantName, tenantEmail, orgName, reportCount, unitName, dashboardUrl } = params
  const ADMIN_EMAIL = 'Kracherdigital@gmail.com'

  const content = `
    <h2 style="color:#dc2626;font-size:22px;font-weight:700;margin:0 0 16px 0;">
      &#9888; Verdächtige Aktivität erkannt
    </h2>
    <p style="color:#52525b;font-size:15px;margin:0 0 20px 0;">
      Ein Mieter hat heute bereits <strong>${reportCount} Schadensmeldungen</strong> erstellt.
      Bitte prüfen Sie ob dies legitim ist.
    </p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#7f1d1d;font-size:12px;font-weight:600;text-transform:uppercase;margin:0 0 8px 0;">Mieter-Details</p>
      <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 4px 0;">${tenantName}</p>
      ${tenantEmail ? `<p style="color:#52525b;font-size:14px;margin:0 0 4px 0;">${tenantEmail}</p>` : ''}
      <p style="color:#52525b;font-size:14px;margin:0 0 4px 0;">Einheit: <strong>${unitName}</strong></p>
      <p style="color:#52525b;font-size:14px;margin:0;">Organisation: <strong>${orgName}</strong></p>
    </div>
    <p style="color:#52525b;font-size:14px;margin:0 0 20px 0;">
      Falls Sie den Mieter sperren möchten, klicken Sie auf den Button unten und gehen Sie zum Mieterprofil.
    </p>
    <a href="${dashboardUrl}" style="display:inline-block;background-color:#dc2626;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
      Zum Dashboard &rarr;
    </a>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `⚠️ ${reportCount} Schadensmeldungen heute — ${tenantName} (${orgName})`,
    html: baseTemplate(content, 'SMARTCARL Admin-Alert'),
  })
}
