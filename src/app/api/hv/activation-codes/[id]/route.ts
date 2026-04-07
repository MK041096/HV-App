import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendTenantInviteEmail } from '@/lib/email'
import { z } from 'zod'

const HV_ROLES = ['hv_admin', 'hv_mitarbeiter', 'platform_admin']

const patchSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  resend: z.boolean().optional().default(false),
})

// PATCH /api/hv/activation-codes/[id]
// Aktualisiert die E-Mail-Adresse eines ausstehenden Aktivierungscodes
// und sendet optional die Einladung neu
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !HV_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email, resend } = parsed.data

    // Aktivierungscode laden (muss zur Organisation gehören und pending sein)
    const { data: code } = await admin
      .from('activation_codes')
      .select('id, code, unit_id, expires_at, invited_first_name, invited_last_name, status')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'pending')
      .single()

    if (!code) {
      return NextResponse.json(
        { error: 'Aktivierungscode nicht gefunden oder bereits verwendet' },
        { status: 404 }
      )
    }

    // E-Mail aktualisieren
    const { error: updateError } = await admin
      .from('activation_codes')
      .update({ invited_email: email })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating activation code email:', updateError)
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
    }

    // Einladung neu senden wenn gewünscht
    let emailSent = false
    if (resend) {
      try {
        // Einheitenname und Organisationsname laden
        const [{ data: unit }, { data: org }] = await Promise.all([
          admin.from('units').select('name').eq('id', code.unit_id).single(),
          supabase.from('organizations').select('name').eq('id', profile.organization_id).single(),
        ])

        const tenantName = [code.invited_first_name, code.invited_last_name]
          .filter(Boolean)
          .join(' ') || null

        await sendTenantInviteEmail({
          to: email,
          tenantName,
          activationCode: code.code,
          expiresAt: code.expires_at,
          orgName: org?.name || 'Ihre Hausverwaltung',
          unitName: unit?.name || '',
        })
        emailSent = true
      } catch (emailErr) {
        console.error('Error resending invite email:', emailErr)
      }
    }

    await admin.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'activation_code_email_updated',
      entity_type: 'activation_code',
      entity_id: id,
      details: { new_email: email, email_resent: emailSent },
    })

    return NextResponse.json({ success: true, email_sent: emailSent })
  } catch (err) {
    console.error('PATCH /api/hv/activation-codes/[id] error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
