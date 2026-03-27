import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { first_name, last_name, org_name, email, phone, units_estimate } = body

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Anotherhenri <noreply@zerodamage.de>',
      to: 'Kracherdigital@gmail.com',
      subject: `Neue Anfrage von ${first_name} ${last_name} (${org_name || 'keine Firma'})`,
      html: `
        <h2>Neue unverbindliche Anfrage</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; font-weight: bold;">Name</td><td style="padding: 8px;">${first_name} ${last_name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Firma</td><td style="padding: 8px;">${org_name || '—'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">E-Mail</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Telefon</td><td style="padding: 8px;">${phone || '—'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Einheiten</td><td style="padding: 8px;">${units_estimate || '—'}</td></tr>
        </table>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 })
  }
}
