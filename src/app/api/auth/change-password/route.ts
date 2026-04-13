import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' },
        { status: 400 }
      )
    }

    // Admin-Client verwenden um MFA-Anforderung bei Recovery-Sessions zu umgehen
    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.updateUserById(user.id, {
      password: parsed.data.password,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Passwort konnte nicht geändert werden.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('change-password error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
