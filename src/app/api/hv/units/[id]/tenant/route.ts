import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  hvAssignTenantSchema,
  hvUnassignTenantSchema,
} from '@/lib/validations/hv-tenant-management'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HV_ROLES = ['hv_admin', 'hv_mitarbeiter', 'platform_admin']

// Helper: verify HV role and get profile
async function getHvProfile(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id, role, first_name, last_name')
    .eq('id', userId)
    .eq('is_deleted', false)
    .single()

  if (error || !profile) return null
  if (!HV_ROLES.includes(profile.role)) return null
  return profile
}

// PUT /api/hv/units/[id]/tenant - Assign a tenant to a unit
// PATCH with { unassign: true } - Unassign tenant from a unit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: unitId } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    if (!UUID_REGEX.test(unitId)) {
      return NextResponse.json({ error: 'Ungültige Einheit-ID' }, { status: 400 })
    }

    const hvProfile = await getHvProfile(supabase, user.id)
    if (!hvProfile) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für die Einheitenverwaltung' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = hvAssignTenantSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { tenant_id } = parsed.data

    // Verify unit exists and belongs to the same org
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, name, organization_id')
      .eq('id', unitId)
      .eq('organization_id', hvProfile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (unitError || !unit) {
      return NextResponse.json({ error: 'Wohneinheit nicht gefunden' }, { status: 404 })
    }

    // Verify tenant exists and belongs to the same org
    const { data: tenant, error: tenantError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, unit_id, organization_id')
      .eq('id', tenant_id)
      .eq('organization_id', hvProfile.organization_id)
      .eq('role', 'mieter')
      .eq('is_deleted', false)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Mieter nicht gefunden' }, { status: 404 })
    }

    // Check if the unit already has another active tenant assigned
    const { data: existingTenant } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('unit_id', unitId)
      .eq('role', 'mieter')
      .eq('is_deleted', false)
      .neq('id', tenant_id)
      .limit(1)

    if (existingTenant && existingTenant.length > 0) {
      const existing = existingTenant[0]
      return NextResponse.json(
        {
          error: `Wohneinheit ist bereits an ${[existing.first_name, existing.last_name].filter(Boolean).join(' ')} vergeben. Bitte zuerst den bestehenden Mieter entfernen.`,
        },
        { status: 409 }
      )
    }

    // If tenant is already assigned to another unit, remove them from that unit
    if (tenant.unit_id && tenant.unit_id !== unitId) {
      // This is an intentional reassignment - log it
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: hvProfile.organization_id,
        action: 'tenant_unassigned_from_unit',
        entity_type: 'profile',
        entity_id: tenant_id,
        details: { old_unit_id: tenant.unit_id, reason: 'reassignment' },
      })
    }

    // Assign tenant to unit
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        unit_id: unitId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenant_id)
      .select('id, first_name, last_name, unit_id, updated_at')
      .single()

    if (updateError) {
      console.error('Error assigning tenant to unit:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Zuweisen des Mieters zur Wohneinheit' },
        { status: 500 }
      )
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: hvProfile.organization_id,
      action: 'tenant_assigned_to_unit',
      entity_type: 'unit',
      entity_id: unitId,
      details: {
        tenant_id,
        tenant_name: [tenant.first_name, tenant.last_name].filter(Boolean).join(' '),
        unit_name: unit.name,
      },
    })

    return NextResponse.json({
      data: updated,
      message: `${[tenant.first_name, tenant.last_name].filter(Boolean).join(' ')} wurde der Einheit "${unit.name}" zugewiesen.`,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// DELETE /api/hv/units/[id]/tenant - Remove tenant from unit (soft-delete profile + deactivate codes)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: unitId } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    if (!UUID_REGEX.test(unitId)) {
      return NextResponse.json({ error: 'Ungültige Einheit-ID' }, { status: 400 })
    }

    const hvProfile = await getHvProfile(supabase, user.id)
    if (!hvProfile) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für die Einheitenverwaltung' },
        { status: 403 }
      )
    }

    // Verify unit exists
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, name')
      .eq('id', unitId)
      .eq('organization_id', hvProfile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (unitError || !unit) {
      return NextResponse.json({ error: 'Wohneinheit nicht gefunden' }, { status: 404 })
    }

    let tenantName = ''

    // Soft-delete active tenant if one exists
    const { data: tenant } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('unit_id', unitId)
      .eq('role', 'mieter')
      .eq('is_deleted', false)
      .single()

    if (tenant) {
      tenantName = [tenant.first_name, tenant.last_name].filter(Boolean).join(' ')
      await supabase
        .from('profiles')
        .update({ is_deleted: true, unit_id: null, updated_at: new Date().toISOString() })
        .eq('id', tenant.id)
    }

    // Deactivate all pending activation codes for this unit
    await supabase
      .from('activation_codes')
      .update({ status: 'deactivated', updated_at: new Date().toISOString() })
      .eq('unit_id', unitId)
      .eq('status', 'pending')

    // Soft-delete the unit itself
    await supabase
      .from('units')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', unitId)

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: hvProfile.organization_id,
      action: 'tenant_removed_from_unit',
      entity_type: 'unit',
      entity_id: unitId,
      details: {
        tenant_id: tenant?.id || null,
        tenant_name: tenantName || null,
        unit_name: unit.name,
      },
    })

    return NextResponse.json({
      message: `Einheit "${unit.name}" wurde gelöscht.`,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
