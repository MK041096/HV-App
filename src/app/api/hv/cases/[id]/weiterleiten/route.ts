import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendWeiterleitungTenantEmail, sendContractorEmail } from '@/lib/email'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const body = await request.json()
    const { contractor_id, scheduled_appointment } = body
    if (!contractor_id) {
      return NextResponse.json({ error: 'Werkstatt ist erforderlich' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Load case + contractor in parallel
    const [{ data: report }, { data: contractor }] = await Promise.all([
      adminClient.from('damage_reports')
        .select('id, case_number, title, description, category, reporter_id, unit_id, preferred_appointment, preferred_appointment_2')
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .single(),
      adminClient.from('contractors')
        .select('id, name, company, email, phone')
        .eq('id', contractor_id)
        .eq('organization_id', profile.organization_id)
        .single(),
    ])

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    if (!contractor) return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    if (!contractor.email) {
      return NextResponse.json(
        { error: 'Diese Werkstatt hat keine E-Mail-Adresse hinterlegt. Bitte zuerst in der Werkstatt-Verwaltung eine E-Mail ergänzen.' },
        { status: 400 }
      )
    }

    const appointmentDate = scheduled_appointment || report.preferred_appointment || report.preferred_appointment_2

    // Load current status
    const { data: currentStatusData } = await supabase
      .from('damage_reports')
      .select('status')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    // Update damage report
    await supabase.from('damage_reports').update({
      status: 'warte_auf_handwerker',
      assigned_to_name: contractor.name,
      assigned_to_company: contractor.company,
      assigned_to_email: contractor.email,
      assigned_to_phone: contractor.phone,
      scheduled_appointment: appointmentDate,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    // Save to status history so portal shows who was assigned
    await supabase.from('damage_report_status_history').insert({
      damage_report_id: id,
      old_status: currentStatusData?.status ?? null,
      new_status: 'warte_auf_handwerker',
      note: `Weitergeleitet an ${contractor.company} (${contractor.name})`,
      changed_by: user.id,
    })

    // Create appointment token
    const { data: tokenData } = await adminClient.from('appointment_tokens').insert({
      damage_report_id: id,
      organization_id: profile.organization_id,
      contractor_id,
    }).select('token').single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zerodamage.de'
    const tokenUrl = `${appUrl}/termin/${tokenData?.token}`

    // Fire-and-forget: emails
    ;(async () => {
      try {
        const [{ data: tenantProfile }, { data: unit }, { data: org }, { data: { users } }] = await Promise.all([
          adminClient.from('profiles').select('id, first_name, last_name').eq('id', report.reporter_id).single(),
          adminClient.from('units').select('name, address').eq('id', report.unit_id).single(),
          adminClient.from('organizations').select('name, phone').eq('id', profile.organization_id).single(),
          adminClient.auth.admin.listUsers({ perPage: 1000 }),
        ])

        const tenantUser = users?.find((u: any) => u.id === report.reporter_id)
        const tenantEmail = tenantUser?.email
        const tenantName = [tenantProfile?.first_name, tenantProfile?.last_name].filter(Boolean).join(' ') || 'Mieter'
        const orgName = org?.name || 'Hausverwaltung'
        const wunschterminLabel = appointmentDate
          ? new Date(appointmentDate).toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : null

        await Promise.all([
          tenantEmail ? sendWeiterleitungTenantEmail({
            to: tenantEmail,
            tenantName,
            caseNumber: report.case_number,
            caseTitle: report.title,
            contractorName: contractor.name,
            contractorCompany: contractor.company,
            wunschtermin: wunschterminLabel,
            orgName,
          }) : Promise.resolve(),
          sendContractorEmail({
            to: contractor.email,
            contractorName: contractor.name,
            caseNumber: report.case_number,
            caseTitle: report.title,
            category: report.category,
            description: report.description,
            unitAddress: unit?.address || '',
            unitName: unit?.name || '',
            wunschtermin: wunschterminLabel,
            tokenUrl,
            orgName,
            orgPhone: (org as any)?.phone,
          }),
        ])
      } catch (err) {
        console.error('Weiterleiten E-Mail Fehler:', err)
      }
    })()

    return NextResponse.json({ success: true, token_url: tokenUrl })
  } catch (err) {
    console.error('Weiterleiten Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
