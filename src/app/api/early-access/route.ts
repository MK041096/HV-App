import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  company: z.string().min(1).max(200),
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Save to Supabase (service role — bypasses RLS since this is public)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.from('early_access_leads').insert({
      name: data.name,
      company: data.company,
      email: data.email,
    })

    // Send confirmation email to lead
    const resend = new Resend(process.env.RESEND_API_KEY!)
    await resend.emails.send({
      from: 'zerodamage.de <noreply@zerodamage.de>',
      to: data.email,
      subject: 'Ihre Anfrage ist bei uns eingegangen',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
          <h2 style="color:#09090f">Vielen Dank, ${data.name}!</h2>
          <p>Ihre Anfrage für das April-Angebot ist bei uns eingegangen.</p>
          <p>Wir melden uns innerhalb von <strong>24 Stunden</strong> bei Ihnen unter dieser E-Mail-Adresse.</p>
          <p style="color:#888;font-size:13px;margin-top:32px">zerodamage.de · Mathias Kracher · Oberwart, Österreich</p>
        </div>
      `,
    })

    // Notify owner
    await resend.emails.send({
      from: 'zerodamage.de <noreply@zerodamage.de>',
      to: 'Kracherdigital@gmail.com',
      subject: `Neuer Lead: ${data.name} (${data.company})`,
      html: `
        <div style="font-family:sans-serif;color:#1a1a1a">
          <h3>Neuer Early-Access Lead</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Firma:</strong> ${data.company}</p>
          <p><strong>E-Mail:</strong> ${data.email}</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('early-access error:', err)
    return NextResponse.json({ error: 'Fehler' }, { status: 400 })
  }
}
