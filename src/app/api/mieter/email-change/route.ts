import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
})

const COOLDOWN_DAYS = 7

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
    }
    const { email } = parsed.data

    if (email.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Das ist bereits Ihre aktuelle E-Mail-Adresse' }, { status: 400 })
    }

    // Rate-Limit prüfen: letzte Änderung aus profiles holen
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_changed_at')
      .eq('id', user.id)
      .single()

    if (profile?.email_changed_at) {
      const lastChange = new Date(profile.email_changed_at)
      const daysSince = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < COOLDOWN_DAYS) {
        const daysLeft = Math.ceil(COOLDOWN_DAYS - daysSince)
        return NextResponse.json({
          error: `E-Mail-Adresse kann nur einmal pro Woche geändert werden. Bitte warten Sie noch ${daysLeft} Tag${daysLeft !== 1 ? 'e' : ''}.`
        }, { status: 429 })
      }
    }

    // E-Mail-Änderung in Supabase Auth auslösen (sendet Bestätigungslink)
    const { error: updateError } = await supabase.auth.updateUser({ email })
    if (updateError) {
      return NextResponse.json({ error: 'E-Mail konnte nicht geändert werden. Bitte prüfen Sie die Adresse.' }, { status: 400 })
    }

    // Zeitstempel speichern (via admin um RLS zu umgehen)
    await admin
      .from('profiles')
      .update({ email_changed_at: new Date().toISOString() })
      .eq('id', user.id)

    // Audit log
    await admin.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile ? (await supabase.from('profiles').select('organization_id').eq('id', user.id).single()).data?.organization_id : null,
      action: 'tenant_email_change_requested',
      entity_type: 'profile',
      entity_id: user.id,
      details: { new_email: email },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/mieter/email-change error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
