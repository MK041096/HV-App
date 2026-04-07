import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const schema = z.object({
  code: z.string().min(6).max(6).regex(/^\d{6}$/, 'Code muss 6 Ziffern enthalten'),
})

// POST /api/auth/mfa-verify
// Called after password login when 2FA is required.
// Session is already at AAL1 — this upgrades it to AAL2.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültiger Code — bitte 6 Ziffern eingeben.' }, { status: 400 })
    }

    const { code } = parsed.data
    const supabase = await createServerSupabaseClient()

    // Verify user is logged in at AAL1
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Sitzung abgelaufen — bitte erneut anmelden.' }, { status: 401 })
    }

    // Get enrolled TOTP factor
    const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors()
    if (factorsErr || !factors?.totp?.length) {
      return NextResponse.json({ error: 'Kein 2FA-Gerät registriert.' }, { status: 400 })
    }

    const totpFactor = factors.totp[0]

    // Create a challenge
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
      factorId: totpFactor.id,
    })
    if (challengeErr || !challenge) {
      console.error('MFA challenge error:', challengeErr)
      return NextResponse.json({ error: 'Fehler beim Erstellen der 2FA-Abfrage.' }, { status: 500 })
    }

    // Verify the code — this upgrades the session to AAL2
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.id,
      code,
    })

    if (verifyErr) {
      return NextResponse.json(
        { error: 'Falscher Code. Bitte prüfen Sie Ihre Authenticator-App.' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('MFA verify error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
