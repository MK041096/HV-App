import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendTenantInviteEmail } from '@/lib/email'
import crypto from 'crypto'
import { z } from 'zod'

const HV_ROLES = ['hv_admin', 'hv_mitarbeiter', 'platform_admin']
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

const tenantChangeSchema = z.object({
  first_name: z.string().min(1, 'Vorname erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname erforderlich').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  archive_lease: z.boolean().optional().default(false),
})

// POST /api/hv/units/[id]/tenant-change
// Mieter-Wechsel: entfernt alten Mieter, erstellt Aktivierungscode für neuen Mieter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    if (!UUID_REGEX.test(unitId)) {
      return NextResponse.json({ error: 'Ungültige Einheit-ID' }, { status: 400 })
    }

    // Verify HV role
    const { data: hvProfile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!hvProfile || !HV_ROLES.includes(hvProfile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Parse + validate body
    const body = await request.json().catch(() => ({}))
    const parsed = tenantChangeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { first_name, last_name, email, archive_lease } = parsed.data

    // Verify unit belongs to this org
    const { data: unit } = await supabase
      .from('units')
      .select('id, name, address, organization_id')
      .eq('id', unitId)
      .eq('organization_id', hvProfile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (!unit) {
      return NextResponse.json({ error: 'Einheit nicht gefunden' }, { status: 404 })
    }

    // Get org name for email
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', hvProfile.organization_id)
      .single()

    // ── Schritt 1: Alten Mieter entfernen ──
    const { data: oldTenant } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('unit_id', unitId)
      .eq('role', 'mieter')
      .eq('is_deleted', false)
      .single()

    let oldTenantName = ''

    if (oldTenant) {
      oldTenantName = [oldTenant.first_name, oldTenant.last_name].filter(Boolean).join(' ')

      // Audit log VOR dem Löschen (Profil wird durch CASCADE gelöscht)
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: hvProfile.organization_id,
        action: 'tenant_removed_for_change',
        entity_type: 'profile',
        entity_id: oldTenant.id,
        details: {
          tenant_name: oldTenantName,
          unit_id: unitId,
          unit_name: unit.name,
          new_tenant_email: email,
        },
      })

      // Hard-delete aus Auth → Cascade löscht Profil, setzt damage_reports.reporter_id = NULL
      await adminSupabase.auth.admin.deleteUser(oldTenant.id)
    }

    // ── Schritt 2: Alle offenen Aktivierungscodes dieser Einheit deaktivieren ──
    await adminSupabase
      .from('activation_codes')
      .update({ status: 'deactivated', updated_at: new Date().toISOString() })
      .eq('unit_id', unitId)
      .eq('status', 'pending')

    // ── Schritt 3: Mietvertrag archivieren (optional) ──
    if (archive_lease) {
      await adminSupabase
        .from('documents')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('unit_id', unitId)
        .eq('organization_id', hvProfile.organization_id)
        .eq('is_deleted', false)
    }

    // ── Schritt 4: Neuen Aktivierungscode erstellen ──
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

    const { data: newCode, error: codeError } = await adminSupabase
      .from('activation_codes')
      .insert({
        organization_id: hvProfile.organization_id,
        unit_id: unitId,
        code,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
        invited_email: email,
        invited_first_name: first_name,
        invited_last_name: last_name,
      })
      .select('id, code, expires_at')
      .single()

    if (codeError || !newCode) {
      console.error('Error creating activation code:', codeError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Aktivierungscodes' },
        { status: 500 }
      )
    }

    // ── Schritt 5: Einladungsmail an neuen Mieter senden ──
    let emailSent = false
    try {
      await sendTenantInviteEmail({
        to: email,
        tenantName: `${first_name} ${last_name}`,
        activationCode: newCode.code,
        expiresAt: newCode.expires_at,
        orgName: org?.name || 'Ihre Hausverwaltung',
        unitName: unit.name,
      })
      emailSent = true
    } catch (emailErr) {
      console.error('Error sending invite email:', emailErr)
    }

    // ── Audit log für Mieterwechsel ──
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: hvProfile.organization_id,
      action: 'tenant_changed',
      entity_type: 'unit',
      entity_id: unitId,
      details: {
        unit_name: unit.name,
        old_tenant_name: oldTenantName || null,
        new_tenant_name: `${first_name} ${last_name}`,
        new_tenant_email: email,
        lease_archived: archive_lease,
        email_sent: emailSent,
      },
    })

    return NextResponse.json({
      message: `Mieterwechsel durchgeführt. Einladungsmail an ${email} wurde ${emailSent ? 'gesendet' : 'konnte nicht gesendet werden'}.`,
      data: {
        activation_code: newCode.code,
        expires_at: newCode.expires_at,
        email_sent: emailSent,
      },
    })
  } catch (err) {
    console.error('Unexpected error in tenant-change:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
