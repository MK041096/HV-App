import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  createRatingSchema,
  updateRatingSchema,
} from '@/lib/validations/damage-report-dashboard'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST /api/damage-reports/[id]/rating - Create or update a rating
export async function POST(
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
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Ungültige Schadensmeldungs-ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = createRatingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verify the report exists, belongs to user, and is closed
    const { data: report, error: reportError } = await supabase
      .from('damage_reports')
      .select('id, organization_id, reporter_id, status, closed_at')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Schadensmeldung nicht gefunden' },
        { status: 404 }
      )
    }

    if (report.reporter_id !== user.id) {
      return NextResponse.json(
        { error: 'Nur der Ersteller kann eine Bewertung abgeben' },
        { status: 403 }
      )
    }

    if (report.status !== 'erledigt') {
      return NextResponse.json(
        { error: 'Nur abgeschlossene Fälle können bewertet werden' },
        { status: 400 }
      )
    }

    // Calculate 7-day rating deadline from closure
    const closedAt = report.closed_at ? new Date(report.closed_at) : new Date()
    const ratingDeadline = new Date(closedAt.getTime() + 7 * 24 * 60 * 60 * 1000)

    if (new Date() > ratingDeadline) {
      return NextResponse.json(
        { error: 'Bewertungszeitraum abgelaufen (7 Tage nach Abschluss)' },
        { status: 400 }
      )
    }

    // Check if a rating already exists
    const { data: existingRating } = await supabase
      .from('damage_report_ratings')
      .select('id, updated_count, rating_deadline')
      .eq('damage_report_id', id)
      .eq('rated_by', user.id)
      .maybeSingle()

    if (existingRating) {
      // Update existing rating
      if (existingRating.updated_count >= 1) {
        return NextResponse.json(
          { error: 'Bewertung kann nur einmal geändert werden' },
          { status: 400 }
        )
      }

      if (new Date(existingRating.rating_deadline) < new Date()) {
        return NextResponse.json(
          { error: 'Bewertungszeitraum abgelaufen' },
          { status: 400 }
        )
      }

      const updateParsed = updateRatingSchema.safeParse(body)
      if (!updateParsed.success) {
        return NextResponse.json(
          { error: 'Ungültige Eingabe', details: updateParsed.error.flatten() },
          { status: 400 }
        )
      }

      const { data: updated, error: updateError } = await supabase
        .from('damage_report_ratings')
        .update({
          rating: updateParsed.data.rating,
          updated_count: existingRating.updated_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRating.id)
        .eq('rated_by', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating rating:', updateError)
        return NextResponse.json(
          { error: 'Fehler beim Aktualisieren der Bewertung' },
          { status: 500 }
        )
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: report.organization_id,
        action: 'damage_report_rating_updated',
        entity_type: 'damage_report_rating',
        entity_id: updated.id,
        details: { damage_report_id: id, rating: updateParsed.data.rating },
      })

      return NextResponse.json({
        data: updated,
        message: 'Bewertung aktualisiert',
      })
    }

    // Create new rating
    const { data: rating, error: insertError } = await supabase
      .from('damage_report_ratings')
      .insert({
        damage_report_id: id,
        organization_id: report.organization_id,
        rated_by: user.id,
        rating: parsed.data.rating,
        rating_deadline: ratingDeadline.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Bewertung existiert bereits' },
          { status: 409 }
        )
      }
      console.error('Error creating rating:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Bewertung' },
        { status: 500 }
      )
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: report.organization_id,
      action: 'damage_report_rated',
      entity_type: 'damage_report_rating',
      entity_id: rating.id,
      details: { damage_report_id: id, rating: parsed.data.rating },
    })

    return NextResponse.json(
      { data: rating, message: 'Bewertung abgegeben' },
      { status: 201 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
