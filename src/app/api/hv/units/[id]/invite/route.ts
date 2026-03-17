import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendTenantInviteEmail } from '@/lib/email'
import crypto from 'crypto'
import { z } from 'zod'

const HV_ROLES = ['hv_admin', 'hv_mitarbeiter', 'platform_admin']

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

const inviteSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
  tenant_name: z.string().max(200).optional(),
})

// POST /api/hv/units/[id]/invite
// Creates an activation code for the unit and optionally sends an invite email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Verify HV role
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !HV_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Parse body
    const body = await request.json().catch(() => ({}))
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email, tenant_name } = parsed.data

    // Verify unit belongs to this organization
    const { data: unit } = await supabase
      .from('units')
      .select('id, name, address, organization_id')
      .eq('id', unitId)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (!unit) {
      return NextResponse.json({ error: 'Einheit nicht gefunden' }, { status: 404 })
    }

    // Get organization name for email
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()

    // Deactivate any existing pending codes for this unit
    await adminSupabase
      .from('activation_codes')
      .update({ status: 'deactivated', updated_at: new Date().toISOString() })
      .eq('unit_id', unitId)
      .eq('status', 'pending')

    // Generate unique code
    let code = ''
    let attempts = 0
    while (attempts < 5) {
      code = generateActivationCode()
      const { data: existing } = await adminSupabase
        .from('activation_codes')
        .select('id')
        .eq('code', code)
        .limit(1)
      if (!existing || existing.length === 0) break
      attempts++
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Insert new activation code
    const { data: newCode, error: insertError } = await adminSupabase
      .from('activation_codes')
      .insert({
        organization_id: profile.organization_id,
        unit_id: unitId,
        code,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
        invited_email: email || null,
        invited_first_name: tenant_name ? tenant_name.split(' ')[0] : null,
        invited_last_name: tenant_name && tenant_name.includes(' ') ? tenant_name.split(' ').slice(1).join(' ') : null,
      })
      .select('id, code, expires_at')
      .single()

    if (insertError || !newCode) {
      console.error('Error creating activation code:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Aktivierungscodes' },
        { status: 500 }
      )
    }

    // Send invite email if email provided
    let emailSent = false
    if (email) {
      try {
        await sendTenantInviteEmail({
          to: email,
          tenantName: tenant_name || 'Mieter',
          activationCode: newCode.code,
          expiresAt: newCode.expires_at,
          orgName: org?.name || 'Ihre Hausverwaltung',
          unitName: unit.name,
        })
        emailSent = true
      } catch (emailErr) {
        console.error('Error sending invite email:', emailErr)
        // Don't fail the whole request if email fails
      }
    }

    // Audit log
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'activation_code_created',
      entity_type: 'activation_code',
      entity_id: newCode.id,
      details: {
        unit_id: unitId,
        expires_at: expiresAt.toISOString(),
        email_sent: emailSent,
        email: email || null,
      },
    })

    return NextResponse.json(
      {
        data: {
          id: newCode.id,
          code: newCode.code,
          expires_at: newCode.expires_at,
          email_sent: emailSent,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Unexpected error in invite route:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
