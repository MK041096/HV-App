import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendWeiterleitungTenantEmail, sendContractorEmail } from '@/lib/email'

// Extrahiert CARL's WERKSTATT_AUFTRAG-Feld aus dem ki_analyse_result-Text
function extractWerkstattAuftrag(analysisText: string | null | undefined): string | null {
  if (!analysisText) return null
  const m = analysisText.match(/^WERKSTATT_AUFTRAG:\s*([\s\S]+?)(?:\n[A-ZÜÄÖ_]{3,}:|$)/mi)
  if (!m) return null
  const v = m[1].trim()
  if (!v || v === 'NICHT_NOETIG' || v === 'NICHT_VERFUEGBAR') return null
  return v
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const body = await request.json()
    const { contractor_id, manual_contractor, scheduled_appointment, save_to_list, personal_note } = body

    // Either contractor_id (from list) or manual_contractor (name + email + phone) must be provided
    if (!contractor_id && (!manual_contractor?.name || !manual_contractor?.email || !manual_contractor?.phone)) {
      return NextResponse.json({ error: 'Name, E-Mail und Telefon sind bei manueller Eingabe Pflichtfelder' }, { status: 400 })
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

    // Load case + (optionally) contractor from DB
    const reportPromise = adminClient.from('damage_reports')
      .select('id, case_number, title, description, category, urgency, reporter_id, unit_id, preferred_appointment, preferred_appointment_2, ki_analyse_result')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    const contractorPromise = contractor_id
      ? adminClient.from('contractors')
          .select('id, name, company, email, phone')
          .eq('id', contractor_id)
          .eq('organization_id', profile.organization_id)
          .single()
      : Promise.resolve({ data: null, error: null })

    const [{ data: report }, { data: contractorFromDb }] = await Promise.all([reportPromise, contractorPromise])

    if (!report) return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })

    // Build contractor object: from DB or from manual input
    const contractor = contractor_id
      ? contractorFromDb
      : {
          id: null,
          name: manual_contractor.name,
          company: manual_contractor.name,
          email: manual_contractor.email,
          phone: manual_contractor.phone,
          taetigkeit: manual_contractor.taetigkeit || null,
          beschreibung: manual_contractor.beschreibung || null,
        }

    if (!contractor) return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    if (!contractor.email) {
      return NextResponse.json(
        { error: 'Diese Werkstatt hat keine E-Mail-Adresse hinterlegt.' },
        { status: 400 }
      )
    }

    const appointmentDate = scheduled_appointment || report.preferred_appointment || null

    // Load current status (via admin client — Tenant-Isolation oben bereits verifiziert)
    const { data: currentStatusData } = await adminClient
      .from('damage_reports')
      .select('status')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    // Update damage report (admin client — bypass RLS, da Auth+Role+Tenant manuell geprüft)
    const { error: updateError } = await adminClient.from('damage_reports').update({
      status: 'warte_auf_handwerker',
      assigned_to_name: contractor.name,
      assigned_to_company: contractor.company,
      assigned_to_email: contractor.email,
      assigned_to_phone: contractor.phone,
      scheduled_appointment: appointmentDate,
      updated_at: new Date().toISOString(),
    }).eq('id', id).eq('organization_id', profile.organization_id)

    if (updateError) {
      console.error('Status-Update fehlgeschlagen:', updateError)
      return NextResponse.json({ error: 'Status-Update fehlgeschlagen', details: updateError.message }, { status: 500 })
    }

    // Status-History: Trigger hat bereits einen Eintrag erstellt (note=null, changed_by=null).
    // Wir updaten ihn mit Werkstatt-Info + User-ID, statt einen zweiten Eintrag anzulegen.
    const historyNote = `Weitergeleitet an ${contractor.company} (${contractor.name})`
    const { data: triggerEntry } = await adminClient
      .from('damage_report_status_history')
      .select('id')
      .eq('damage_report_id', id)
      .eq('new_status', 'warte_auf_handwerker')
      .is('changed_by', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (triggerEntry) {
      const { error: histErr } = await adminClient
        .from('damage_report_status_history')
        .update({ note: historyNote, changed_by: user.id })
        .eq('id', triggerEntry.id)
      if (histErr) console.error('Status-History-Update-Fehler:', histErr)
    } else {
      const { error: insErr } = await adminClient.from('damage_report_status_history').insert({
        damage_report_id: id,
        old_status: currentStatusData?.status ?? null,
        new_status: 'warte_auf_handwerker',
        note: historyNote,
        changed_by: user.id,
      })
      if (insErr) console.error('Status-History-Insert-Fehler:', insErr)
    }

    // Create appointment token (contractor_id may be null for manual contractors)
    const { data: tokenData } = await adminClient.from('appointment_tokens').insert({
      damage_report_id: id,
      organization_id: profile.organization_id,
      ...(contractor_id ? { contractor_id } : {}),
    }).select('token').single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcarl.com'
    const tokenUrl = `${appUrl}/termin/${tokenData?.token}`

    // Save manual contractor to partners list if requested
    if (!contractor_id && save_to_list && contractor) {
      await adminClient.from('contractors').insert({
        organization_id: profile.organization_id,
        name: contractor.name,
        company: contractor.name,
        email: contractor.email,
        phone: (contractor as any).phone,
        description: (contractor as any).taetigkeit || null,
        notes: (contractor as any).beschreibung || null,
        is_active: true,
      }).then(({ error: insErr }) => {
        if (insErr) console.error('Contractor save-to-list Fehler:', insErr)
      })
    }

    // Mail-Versand SYNCHRON — User wartet auf Bestätigung, dass Mails wirklich raus sind.
    // waitUntil hat sich als unzuverlässig erwiesen (Mails kamen nie an), daher direkt awaiten.
    let mailContractorOk = false
    let mailTenantOk = false
    let mailError: string | null = null
    try {
      const [{ data: tenantProfile }, { data: unit }, { data: org }, { data: { users } }] = await Promise.all([
        adminClient.from('profiles').select('id, first_name, last_name, phone').eq('id', report.reporter_id).single(),
        adminClient.from('units').select('name, address').eq('id', report.unit_id).single(),
        adminClient.from('organizations').select('name, phone').eq('id', profile.organization_id).single(),
        adminClient.auth.admin.listUsers({ perPage: 1000 }),
      ])

      const tenantUser = users?.find((u: any) => u.id === report.reporter_id)
      const tenantEmail = tenantUser?.email
      const tenantName = [tenantProfile?.first_name, tenantProfile?.last_name].filter(Boolean).join(' ') || 'Mieter'
      const orgName = org?.name || 'Hausverwaltung'

      const formatDate = (d: string | null) => d
        ? new Date(d).toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null

      const wunschterminLabel = formatDate(report.preferred_appointment)
      const wunschtermin2Label = formatDate(report.preferred_appointment_2)
      const appointmentForTenant = formatDate(appointmentDate)

      // Werkstatt-Mail ZUERST (kritisch — ohne sie keine Reparatur)
      try {
        await sendContractorEmail({
          to: contractor.email,
          contractorName: contractor.name,
          caseNumber: report.case_number,
          caseTitle: report.title,
          category: report.category,
          description: report.description,
          unitAddress: unit?.address || '',
          unitName: unit?.name || '',
          wunschtermin: wunschterminLabel,
          wunschtermin2: wunschtermin2Label,
          tokenUrl,
          orgName,
          orgPhone: (org as any)?.phone,
          personalNote: personal_note || null,
          werkstattAuftrag: extractWerkstattAuftrag(report.ki_analyse_result),
        })
        mailContractorOk = true
      } catch (err) {
        console.error('Contractor-Mail Fehler:', err)
        mailError = err instanceof Error ? err.message : 'Werkstatt-Mail fehlgeschlagen'
      }

      // Mieter-Mail (Information)
      if (tenantEmail) {
        try {
          await sendWeiterleitungTenantEmail({
            to: tenantEmail,
            tenantName,
            caseNumber: report.case_number,
            caseTitle: report.title,
            contractorName: contractor.name,
            contractorCompany: contractor.company,
            wunschtermin: appointmentForTenant,
            orgName,
          })
          mailTenantOk = true
        } catch (err) {
          console.error('Tenant-Mail Fehler:', err)
        }
      }
    } catch (err) {
      console.error('Weiterleiten Mail-Setup Fehler:', err)
      mailError = err instanceof Error ? err.message : 'Mail-Setup Fehler'
    }

    return NextResponse.json({
      success: true,
      token_url: tokenUrl,
      mail_contractor_sent: mailContractorOk,
      mail_tenant_sent: mailTenantOk,
      mail_error: mailError,
    })
  } catch (err) {
    console.error('Weiterleiten Fehler:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
