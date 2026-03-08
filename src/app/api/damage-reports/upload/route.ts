import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { stripExifAndValidate, getExtensionForMimeType } from '@/lib/exif-strip'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, unit_id')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (profileError || !profile || !profile.unit_id) {
      return NextResponse.json({ error: 'Benutzerprofil oder Wohneinheit nicht gefunden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let processed
    try {
      processed = await stripExifAndValidate(buffer, file.type)
    } catch (exifError) {
      return NextResponse.json({ error: (exifError as Error).message }, { status: 400 })
    }

    const fileId = crypto.randomUUID()
    const extension = getExtensionForMimeType(processed.mimeType)
    const storagePath = `${profile.organization_id}/${fileId}.${extension}`

    // Use admin client for storage upload (server-side operation, auth verified above)
    const adminClient = createAdminClient()
    const { error: uploadError } = await adminClient.storage
      .from('damage-photos')
      .upload(storagePath, processed.buffer, {
        contentType: processed.mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Fehler beim Hochladen des Fotos' }, { status: 500 })
    }

    const { data: photo, error: photoError } = await adminClient
      .from('damage_report_photos')
      .insert({
        damage_report_id: null,
        uploaded_by: user.id,
        organization_id: profile.organization_id,
        storage_path: storagePath,
        file_name: file.name || `foto.${extension}`,
        file_size: processed.size,
        mime_type: processed.mimeType,
      })
      .select('id, file_name, mime_type, file_size')
      .single()

    if (photoError) {
      await adminClient.storage.from('damage-photos').remove([storagePath])
      console.error('Error creating photo record:', photoError)
      return NextResponse.json({ error: 'Fehler beim Speichern der Foto-Metadaten' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        id: photo.id,
        file_name: photo.file_name,
        mime_type: photo.mime_type,
        file_size: photo.file_size,
      },
    }, { status: 201 })
  } catch (err) {
    console.error('Unexpected upload error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler beim Upload' }, { status: 500 })
  }
}
