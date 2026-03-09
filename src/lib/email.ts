import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'SchadensMelder <noreply@zerodamage.de>'

const STATUS_LABELS: Record<string, string> = {
  in_bearbeitung: 'In Bearbeitung',
  termin_vereinbart: 'Termin vereinbart',
  erledigt: 'Erledigt',
  abgelehnt: 'Abgelehnt',
}

const STATUS_COLORS: Record<string, string> = {
  in_bearbeitung: '#f59e0b',
  termin_vereinbart: '#6366f1',
  erledigt: '#22c55e',
  abgelehnt: '#6b7280',
}

// Only send notifications for these statuses
export const NOTIFICATION_STATUSES = ['in_bearbeitung', 'termin_vereinbart', 'erledigt', 'abgelehnt']

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
}): Promise<void> {
  const { to, caseNumber, title, category, urgency, unitName, tenantName, orgName } = params
  if (!to.length) return

  const urgencyLabel: Record<string, string> = { hoch: 'Dringend', mittel: 'Normal', niedrig: 'Niedrig' }
  const urgencyColor: Record<string, string> = { hoch: '#ef4444', mittel: '#f59e0b', niedrig: '#22c55e' }
  const urg = urgencyLabel[urgency] || urgency
  const urgColor = urgencyColor[urgency] || '#18181b'
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://zerodamage.de'}/dashboard/meldungen`

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
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Kategorie</p>
      <p style="color:#18181b;font-size:14px;margin:0 0 12px 0;">${category}</p>
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Einheit</p>
      <p style="color:#18181b;font-size:14px;margin:0 0 12px 0;">${unitName}</p>
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Gemeldet von</p>
      <p style="color:#18181b;font-size:14px;margin:0 0 12px 0;">${tenantName}</p>
      <p style="color:#71717a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px 0;">Dringlichkeit</p>
      <div style="display:inline-block;background-color:${urgColor}20;border:1px solid ${urgColor}40;border-radius:6px;padding:4px 12px;">
        <span style="color:${urgColor};font-size:13px;font-weight:600;">${urg}</span>
      </div>
    </div>

    <a href="${dashboardUrl}"
       style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Jetzt im Dashboard ansehen →
    </a>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[${caseNumber}] Neue Schadensmeldung: ${title}`,
    html: baseTemplate(content, orgName),
  })
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
