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
