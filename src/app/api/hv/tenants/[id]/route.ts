import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-server'
import { hvTenantStatusSchema } from '@/lib/validations/hv-tenant-management'
import { CASE_STATUS_LABELS } from '@/lib/validations/hv-case-management'
import { CATEGORY_LABELS, URGENCY_LABELS } from '@/lib/validations/damage-report'

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

// GET /api/hv/tenants/[id] - Get detailed tenant profile with damage report history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Ungültige Mieter-ID' }, { status: 400 })
    }

    const hvProfile = await getHvProfile(supabase, user.id)
    if (!hvProfile) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für die Mieterverwaltung' },
        { status: 403 }
      )
    }

    // Fetch tenant profile with unit
    const { data: tenant, error: tenantError } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, role, unit_id, is_deleted, deleted_at, created_at, updated_at,
        unit:units(id, name, address, floor)
      `)
      .eq('id', id)
      .eq('organization_id', hvProfile.organization_id)
      .eq('role', 'mieter')
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Mieter nicht gefunden' }, { status: 404 })
    }

    // Fetch tenant's email from auth (via admin client)
    let tenantEmail: string | null = null
    try {
      const adminClient = createAdminClient()
      const { data: authUser } = await adminClient.auth.admin.getUserById(id)
      tenantEmail = authUser?.user?.email || null
    } catch {
      // If admin client fails, email will be null
      console.error('Could not fetch tenant email via admin client')
    }

    // Fetch damage reports for this tenant
    const { data: reports, error: reportsError } = await supabase
      .from('damage_reports')
      .select(`
        id, case_number, title, category, status, urgency, created_at, updated_at, closed_at,
        unit:units(id, name, address)
      `)
      .eq('reporter_id', id)
      .eq('organization_id', hvProfile.organization_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (reportsError) {
      console.error('Error fetching tenant damage reports:', reportsError)
    }

    // Count total reports
    const { count: totalReports } = await supabase
      .from('damage_reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', id)
      .eq('organization_id', hvProfile.organization_id)
      .eq('is_deleted', false)

    // Count reports by status
    const statusCounts: Record<string, number> = {}
    if (reports) {
      for (const r of reports) {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
      }
    }

    // Fetch activation code history for the tenant's unit
    let activationCodes = null
    if (tenant.unit_id) {
      const { data: codes } = await supabase
        .from('activation_codes')
        .select('id, status, created_at, expires_at, used_at')
        .eq('unit_id', tenant.unit_id)
        .eq('used_by', id)
        .order('created_at', { ascending: false })
        .limit(5)

      activationCodes = codes
    }

    // Enrich damage reports with labels
    const enrichedReports = (reports || []).map((report) => ({
      ...report,
      status_label: CASE_STATUS_LABELS[report.status as keyof typeof CASE_STATUS_LABELS] || report.status,
      category_label: CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category,
      urgency_label: URGENCY_LABELS[report.urgency as keyof typeof URGENCY_LABELS] || report.urgency,
    }))

    // Audit log: HV staff viewed tenant profile (DSGVO: track data access)
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: hvProfile.organization_id,
      action: 'tenant_profile_viewed',
      entity_type: 'profile',
      entity_id: id,
    })

    return NextResponse.json({
      data: {
        id: tenant.id,
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        full_name: [tenant.first_name, tenant.last_name].filter(Boolean).join(' ') || 'Unbekannt',
        email: tenantEmail,
        is_active: !tenant.is_deleted,
        deleted_at: tenant.deleted_at,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        unit: tenant.unit,
        unit_id: tenant.unit_id,
        activation_codes: activationCodes,
        damage_reports: {
          items: enrichedReports,
          total_count: totalReports || 0,
          status_counts: statusCounts,
        },
      },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// PATCH /api/hv/tenants/[id] - Deactivate or reactivate a tenant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Ungültige Mieter-ID' }, { status: 400 })
    }

    const hvProfile = await getHvProfile(supabase, user.id)
    if (!hvProfile) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für die Mieterverwaltung' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = hvTenantStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { action, reason } = parsed.data

    // Verify tenant exists and belongs to the same org
    const { data: tenant, error: tenantError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, is_deleted, organization_id')
      .eq('id', id)
      .eq('organization_id', hvProfile.organization_id)
      .eq('role', 'mieter')
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Mieter nicht gefunden' }, { status: 404 })
    }

    if (action === 'deactivate') {
      if (tenant.is_deleted) {
        return NextResponse.json(
          { error: 'Mieter ist bereits deaktiviert' },
          { status: 409 }
        )
      }

      // Soft-delete the profile
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, first_name, last_name, is_deleted, deleted_at, updated_at')
        .single()

      if (updateError) {
        console.error('Error deactivating tenant:', updateError)
        return NextResponse.json(
          { error: 'Fehler beim Deaktivieren des Mieters' },
          { status: 500 }
        )
      }

      // Also ban the user in Supabase Auth so they can't log in
      try {
        const adminClient = createAdminClient()
        await adminClient.auth.admin.updateUserById(id, {
          ban_duration: '876600h', // ~100 years (effectively permanent)
        })
      } catch (authErr) {
        console.error('Warning: Could not ban user in auth system:', authErr)
        // Continue - profile is already soft-deleted
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: hvProfile.organization_id,
        action: 'tenant_deactivated',
        entity_type: 'profile',
        entity_id: id,
        details: {
          tenant_name: [tenant.first_name, tenant.last_name].filter(Boolean).join(' '),
          reason: reason || null,
        },
      })

      return NextResponse.json({
        data: updated,
        message: `Mieter ${[tenant.first_name, tenant.last_name].filter(Boolean).join(' ')} wurde deaktiviert.`,
      })
    }

    if (action === 'reactivate') {
      if (!tenant.is_deleted) {
        return NextResponse.json(
          { error: 'Mieter ist bereits aktiv' },
          { status: 409 }
        )
      }

      // Reactivate the profile
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          is_deleted: false,
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, first_name, last_name, is_deleted, updated_at')
        .single()

      if (updateError) {
        console.error('Error reactivating tenant:', updateError)
        return NextResponse.json(
          { error: 'Fehler beim Reaktivieren des Mieters' },
          { status: 500 }
        )
      }

      // Unban the user in Supabase Auth
      try {
        const adminClient = createAdminClient()
        await adminClient.auth.admin.updateUserById(id, {
          ban_duration: 'none',
        })
      } catch (authErr) {
        console.error('Warning: Could not unban user in auth system:', authErr)
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: hvProfile.organization_id,
        action: 'tenant_reactivated',
        entity_type: 'profile',
        entity_id: id,
        details: {
          tenant_name: [tenant.first_name, tenant.last_name].filter(Boolean).join(' '),
          reason: reason || null,
        },
      })

      return NextResponse.json({
        data: updated,
        message: `Mieter ${[tenant.first_name, tenant.last_name].filter(Boolean).join(' ')} wurde reaktiviert.`,
      })
    }

    return NextResponse.json(
      { error: 'Ungültige Aktion' },
      { status: 400 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
