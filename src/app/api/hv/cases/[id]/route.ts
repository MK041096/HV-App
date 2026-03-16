import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import {
  hvStatusUpdateSchema,
  hvAssignmentSchema,
  hvAppointmentSchema,
  CASE_STATUS_LABELS,
} from '@/lib/validations/hv-case-management'
import { CATEGORY_LABELS, URGENCY_LABELS } from '@/lib/validations/damage-report'
import { STATUS_DISPLAY_MAP } from '@/lib/validations/damage-report-dashboard'
import { sendStatusChangeEmail, NOTIFICATION_STATUSES } from '@/lib/email'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Helper: verify HV role and get profile
async function getHvProfile(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id, role, first_name, last_name')
    .eq('id', userId)
    .eq('is_deleted', false)
    .single()

  if (error || !profile) return null
  if (!['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) return null
  return profile
}

// GET /api/hv/cases/[id] - Get full case detail for HV staff
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
      return NextResponse.json({ error: 'Ungültige Fall-ID' }, { status: 400 })
    }

    const profile = await getHvProfile(supabase, user.id)
    if (!profile) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für das Case-Management' },
        { status: 403 }
      )
    }

    // Fetch full report with joins
    const { data: report, error } = await supabase
      .from('damage_reports')
      .select(`
        *,
        unit:units(id, name, address, floor),
        reporter:profiles!damage_reports_reporter_id_fkey(id, first_name, last_name, role),
        photos:damage_report_photos(id, storage_path, file_name, mime_type, file_size, sort_order)
      `)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (error || !report) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
      }
      console.error('Error fetching case:', error)
      return NextResponse.json({ error: 'Fehler beim Laden des Falls' }, { status: 500 })
    }

    // Fetch status history, comments in parallel
    const [statusHistoryResult, commentsResult] = await Promise.all([
      supabase
        .from('damage_report_status_history')
        .select('id, old_status, new_status, changed_by, note, created_at')
        .eq('damage_report_id', id)
        .order('created_at', { ascending: true }),

      supabase
        .from('damage_report_comments')
        .select('id, author_id, content, is_internal, created_at, updated_at')
        .eq('damage_report_id', id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(200),
    ])

    // Collect unique user IDs for profile resolution
    const userIds = new Set<string>()
    for (const entry of statusHistoryResult.data || []) {
      if (entry.changed_by) userIds.add(entry.changed_by)
    }
    for (const comment of commentsResult.data || []) {
      if (comment.author_id) userIds.add(comment.author_id)
    }

    type ProfileInfo = { id: string; first_name: string | null; last_name: string | null; role: string }
    const profileMap = new Map<string, ProfileInfo>()
    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('id', Array.from(userIds))
      for (const p of profiles || []) {
        profileMap.set(p.id, p)
      }
    }

    // Generate signed URLs for photos
    const photosWithUrls = await Promise.all(
      (report.photos || []).map(async (photo: {
        id: string; storage_path: string; file_name: string
        mime_type: string; file_size: number; sort_order: number
      }) => {
        const { data: signedUrl } = await supabase.storage
          .from('damage-photos')
          .createSignedUrl(photo.storage_path, 1800)

        return {
          id: photo.id,
          file_name: photo.file_name,
          mime_type: photo.mime_type,
          file_size: photo.file_size,
          sort_order: photo.sort_order,
          url: signedUrl?.signedUrl || null,
        }
      })
    )

    // Enrich status history
    const statusHistory = (statusHistoryResult.data || []).map((entry) => {
      const p = entry.changed_by ? profileMap.get(entry.changed_by) : null
      return {
        id: entry.id,
        old_status: entry.old_status,
        new_status: entry.new_status,
        old_status_label: entry.old_status
          ? CASE_STATUS_LABELS[entry.old_status as keyof typeof CASE_STATUS_LABELS] || entry.old_status
          : null,
        new_status_label: CASE_STATUS_LABELS[entry.new_status as keyof typeof CASE_STATUS_LABELS] || entry.new_status,
        note: entry.note,
        created_at: entry.created_at,
        changed_by: p
          ? { first_name: p.first_name, last_name: p.last_name, role: p.role }
          : null,
      }
    })

    // Enrich comments
    const comments = (commentsResult.data || []).map((comment) => {
      const p = comment.author_id ? profileMap.get(comment.author_id) : null
      return {
        id: comment.id,
        content: comment.content,
        is_internal: comment.is_internal,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: p
          ? { first_name: p.first_name, last_name: p.last_name, role: p.role }
          : null,
      }
    })

    // Build response, removing internal fields
    const { photos: _photos, ...reportWithoutRawPhotos } = report

    return NextResponse.json({
      data: {
        ...reportWithoutRawPhotos,
        status_label: CASE_STATUS_LABELS[report.status as keyof typeof CASE_STATUS_LABELS] || report.status,
        display_status: STATUS_DISPLAY_MAP[report.status as keyof typeof STATUS_DISPLAY_MAP] || report.status,
        category_label: CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category,
        urgency_label: URGENCY_LABELS[report.urgency as keyof typeof URGENCY_LABELS] || report.urgency,
        photos: photosWithUrls,
        status_history: statusHistory,
        comments,
      },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// PATCH /api/hv/cases/[id] - Update case: status, assignment, or appointment
// Body discriminated by the presence of keys:
//   { new_status, comment }           -> status update
//   { assigned_to_name, ... }         -> handwerker assignment
//   { clear: true }                   -> clear assignment
//   { scheduled_appointment }         -> set/clear appointment
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
      return NextResponse.json({ error: 'Ungültige Fall-ID' }, { status: 400 })
    }

    const profile = await getHvProfile(supabase, user.id)
    if (!profile) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für das Case-Management' },
        { status: 403 }
      )
    }

    // Verify case exists and belongs to org
    const { data: existingReport, error: fetchError } = await supabase
      .from('damage_reports')
      .select('id, status, organization_id, reporter_id, case_number, title')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !existingReport) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()

    // ── STATUS UPDATE ──
    if ('new_status' in body) {
      const parsed = hvStatusUpdateSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { new_status, comment } = parsed.data
      const old_status = existingReport.status

      // Update status
      const updateData: Record<string, unknown> = {
        status: new_status,
        updated_at: new Date().toISOString(),
      }

      // Set closed_at when closing, clear it when reopening
      if (new_status === 'erledigt' || new_status === 'abgelehnt') {
        updateData.closed_at = new Date().toISOString()
      } else if (old_status === 'erledigt' || old_status === 'abgelehnt') {
        updateData.closed_at = null
      }

      const { data: updated, error: updateError } = await supabase
        .from('damage_reports')
        .update(updateData)
        .eq('id', id)
        .select('id, status, updated_at, closed_at')
        .single()

      if (updateError) {
        console.error('Error updating status:', updateError)
        return NextResponse.json({ error: 'Fehler beim Aktualisieren des Status' }, { status: 500 })
      }

      // Insert status history entry
      await supabase.from('damage_report_status_history').insert({
        damage_report_id: id,
        organization_id: profile.organization_id,
        old_status,
        new_status,
        changed_by: user.id,
        note: comment,
      })

      // Insert public comment (status change comments are visible to tenants)
      await supabase.from('damage_report_comments').insert({
        damage_report_id: id,
        organization_id: profile.organization_id,
        author_id: user.id,
        content: comment,
        is_internal: false,
      })

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        action: 'damage_report_status_updated',
        entity_type: 'damage_report',
        entity_id: id,
        details: { old_status, new_status, comment },
      })

      // Send email notification (fire-and-forget, never fail the request)
      if (NOTIFICATION_STATUSES.includes(new_status) && existingReport.reporter_id) {
        const orgName = 'Hausverwaltung'
        try {
          const adminClient = createAdminClient()
          const [reporterResult, orgResult] = await Promise.all([
            adminClient.auth.admin.getUserById(existingReport.reporter_id),
            supabase.from('organizations').select('name').eq('id', profile.organization_id).single(),
          ])
          const reporterProfile = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', existingReport.reporter_id)
            .single()

          const email = reporterResult.data?.user?.email
          const name = reporterProfile.data
            ? `${reporterProfile.data.first_name || ''} ${reporterProfile.data.last_name || ''}`.trim()
            : 'Mieter'
          const org = orgResult.data?.name || orgName

          if (email) {
            sendStatusChangeEmail({
              to: email,
              tenantName: name,
              caseNumber: existingReport.case_number,
              caseTitle: existingReport.title,
              newStatus: new_status,
              comment,
              orgName: org,
            }).catch((err) => console.error('Email send failed:', err))
          }
        } catch (err) {
          console.error('Email notification error:', err)
        }
      }

      return NextResponse.json({
        data: {
          ...updated,
          status_label: CASE_STATUS_LABELS[new_status as keyof typeof CASE_STATUS_LABELS] || new_status,
        },
        message: `Status aktualisiert: ${CASE_STATUS_LABELS[old_status as keyof typeof CASE_STATUS_LABELS] || old_status} -> ${CASE_STATUS_LABELS[new_status as keyof typeof CASE_STATUS_LABELS] || new_status}`,
      })
    }

    // ── HANDWERKER ASSIGNMENT ──
    if ('assigned_to_name' in body) {
      const parsed = hvAssignmentSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { data: updated, error: updateError } = await supabase
        .from('damage_reports')
        .update({
          assigned_to_name: parsed.data.assigned_to_name,
          assigned_to_phone: parsed.data.assigned_to_phone || null,
          assigned_to_email: parsed.data.assigned_to_email || null,
          assigned_to_company: parsed.data.assigned_to_company || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, assigned_to_name, assigned_to_phone, assigned_to_email, assigned_to_company, updated_at')
        .single()

      if (updateError) {
        console.error('Error updating assignment:', updateError)
        return NextResponse.json({ error: 'Fehler beim Zuweisen des Handwerkers' }, { status: 500 })
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        action: 'damage_report_assigned',
        entity_type: 'damage_report',
        entity_id: id,
        details: {
          assigned_to_name: parsed.data.assigned_to_name,
          assigned_to_company: parsed.data.assigned_to_company,
        },
      })

      return NextResponse.json({
        data: updated,
        message: `Handwerker zugewiesen: ${parsed.data.assigned_to_name}`,
      })
    }

    // ── CLEAR ASSIGNMENT ──
    if ('clear' in body && body.clear === true) {
      const { data: updated, error: updateError } = await supabase
        .from('damage_reports')
        .update({
          assigned_to_name: null,
          assigned_to_phone: null,
          assigned_to_email: null,
          assigned_to_company: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, updated_at')
        .single()

      if (updateError) {
        console.error('Error clearing assignment:', updateError)
        return NextResponse.json({ error: 'Fehler beim Entfernen der Zuweisung' }, { status: 500 })
      }

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        action: 'damage_report_assignment_cleared',
        entity_type: 'damage_report',
        entity_id: id,
      })

      return NextResponse.json({
        data: updated,
        message: 'Handwerker-Zuweisung entfernt',
      })
    }

    // ── APPOINTMENT ──
    if ('scheduled_appointment' in body) {
      // Allow setting to null (clearing)
      if (body.scheduled_appointment === null) {
        const { data: updated, error: updateError } = await supabase
          .from('damage_reports')
          .update({
            scheduled_appointment: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('id, scheduled_appointment, updated_at')
          .single()

        if (updateError) {
          console.error('Error clearing appointment:', updateError)
          return NextResponse.json({ error: 'Fehler beim Entfernen des Termins' }, { status: 500 })
        }

        await supabase.from('audit_logs').insert({
          user_id: user.id,
          organization_id: profile.organization_id,
          action: 'damage_report_appointment_cleared',
          entity_type: 'damage_report',
          entity_id: id,
        })

        return NextResponse.json({
          data: updated,
          message: 'Termin entfernt',
        })
      }

      const parsed = hvAppointmentSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { data: updated, error: updateError } = await supabase
        .from('damage_reports')
        .update({
          scheduled_appointment: parsed.data.scheduled_appointment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, scheduled_appointment, updated_at')
        .single()

      if (updateError) {
        console.error('Error setting appointment:', updateError)
        return NextResponse.json({ error: 'Fehler beim Setzen des Termins' }, { status: 500 })
      }

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        action: 'damage_report_appointment_set',
        entity_type: 'damage_report',
        entity_id: id,
        details: { scheduled_appointment: parsed.data.scheduled_appointment },
      })

      return NextResponse.json({
        data: updated,
        message: 'Termin eingetragen',
      })
    }

    // ── INSURANCE DAMAGE FLAG ──
    if ('is_insurance_damage' in body) {
      const isInsurance = Boolean(body.is_insurance_damage)
      const notes = typeof body.insurance_notes === 'string' ? body.insurance_notes.slice(0, 1000) : null

      const { data: updated, error: updateError } = await supabase
        .from('damage_reports')
        .update({
          is_insurance_damage: isInsurance,
          insurance_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, is_insurance_damage, insurance_notes, updated_at')
        .single()

      if (updateError) {
        console.error('Error updating insurance flag:', updateError)
        return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
      }

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        action: isInsurance ? 'insurance_damage_flagged' : 'insurance_damage_unflagged',
        entity_type: 'damage_report',
        entity_id: id,
      })

      return NextResponse.json({
        data: updated,
        message: isInsurance ? 'Als Versicherungsschaden markiert' : 'Versicherungsschaden-Markierung entfernt',
      })
    }

    return NextResponse.json(
      { error: 'Ungültige Anfrage. Erwartet: new_status, assigned_to_name, clear, scheduled_appointment oder is_insurance_damage.' },
      { status: 400 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// DELETE /api/hv/cases/[id] - Soft-delete a case (hv_admin only)
export async function DELETE(
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
      return NextResponse.json({ error: 'Ungültige Fall-ID' }, { status: 400 })
    }

    const profile = await getHvProfile(supabase, user.id)
    if (!profile) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Only admins can delete
    if (!['hv_admin', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Nur Administratoren dürfen Meldungen löschen' },
        { status: 403 }
      )
    }

    // Verify case exists and belongs to org
    const { data: existingReport, error: fetchError } = await supabase
      .from('damage_reports')
      .select('id, case_number, title')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !existingReport) {
      return NextResponse.json({ error: 'Fall nicht gefunden' }, { status: 404 })
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('damage_reports')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (deleteError) {
      console.error('Error deleting case:', deleteError)
      return NextResponse.json({ error: 'Fehler beim Löschen der Meldung' }, { status: 500 })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: profile.organization_id,
      action: 'damage_report_deleted',
      entity_type: 'damage_report',
      entity_id: id,
      details: { case_number: existingReport.case_number, title: existingReport.title },
    })

    return NextResponse.json({ message: 'Meldung erfolgreich gelöscht' })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
