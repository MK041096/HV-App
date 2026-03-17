import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const VALID_SPECIALTIES = [
  'wasserschaden', 'heizung', 'elektrik', 'fenster_tueren',
  'schimmel', 'sanitaer', 'boeden_waende', 'aussenbereich', 'sonstiges',
]

// Column aliases
const COL_NAME     = ['name', 'vorname nachname', 'kontakt', 'ansprechpartner', 'handwerker', 'person']
const COL_COMPANY  = ['firma', 'unternehmen', 'company', 'betrieb', 'firmenname', 'unternehmensname']
const COL_PHONE    = ['telefon', 'tel', 'phone', 'mobil', 'handy', 'telefonnummer', 'tel.', 'mobilnummer']
const COL_EMAIL    = ['email', 'e-mail', 'mail', 'e mail', 'emailadresse', 'mailadresse']
const COL_SPECIALTY = ['gewerk', 'spezialisierung', 'specialty', 'fachgebiet', 'kategorie', 'bereich', 'spezialitaet', 'leistung']
const COL_NOTES    = ['notiz', 'notizen', 'notes', 'anmerkung', 'beschreibung', 'kommentar', 'info']

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

function findCol(headers: string[], aliases: string[]): number {
  const exact = headers.findIndex(h => aliases.includes(normalize(h)))
  if (exact !== -1) return exact
  return headers.findIndex(h => {
    const n = normalize(h)
    return aliases.some(a => n.includes(a) || a.includes(n))
  })
}

function parseSpecialties(raw: string): string[] {
  if (!raw) return []
  // Split by comma, semicolon or slash
  return raw
    .split(/[,;/]/)
    .map(s => s.trim().toLowerCase())
    .filter(s => VALID_SPECIALTIES.includes(s))
}

interface ImportResult {
  contractors_created: number
  contractors_skipped: number
  errors: { row: number; message: string }[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const orgId = profile.organization_id

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Datei zu groß (max. 5 MB)' }, { status: 400 })

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return NextResponse.json({ error: 'Nur .xlsx, .xls und .csv erlaubt' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return NextResponse.json({ error: 'Leere Datei' }, { status: 400 })

    const rows: string[][] = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { header: 1, raw: false }
    ) as string[][]

    if (rows.length < 2) {
      return NextResponse.json({ error: 'Keine Daten gefunden (mindestens Kopfzeile + 1 Zeile)' }, { status: 400 })
    }

    const headers = (rows[0] || []).map(String)
    const colName      = findCol(headers, COL_NAME)
    const colCompany   = findCol(headers, COL_COMPANY)
    const colPhone     = findCol(headers, COL_PHONE)
    const colEmail     = findCol(headers, COL_EMAIL)
    const colSpecialty = findCol(headers, COL_SPECIALTY)
    const colNotes     = findCol(headers, COL_NOTES)

    if (colName === -1) {
      return NextResponse.json(
        { error: 'Keine Name-Spalte gefunden. Erkannte Spalten: ' + headers.join(', ') },
        { status: 400 }
      )
    }

    // Fetch existing to detect duplicates (by name + company)
    const { data: existing } = await supabase
      .from('contractors')
      .select('name, company')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .limit(2000)

    const existingKeys = new Set(
      (existing || []).map(c => `${c.name?.toLowerCase()}|${c.company?.toLowerCase() || ''}`)
    )

    const result: ImportResult = { contractors_created: 0, contractors_skipped: 0, errors: [] }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || []
      const name = row[colName]?.toString().trim()
      if (!name) continue

      const company  = colCompany  >= 0 ? row[colCompany]?.toString().trim()  || null : null
      const phone    = colPhone    >= 0 ? row[colPhone]?.toString().trim()    || null : null
      const email    = colEmail    >= 0 ? row[colEmail]?.toString().trim().toLowerCase() || null : null
      const notesRaw = colNotes    >= 0 ? row[colNotes]?.toString().trim()    || null : null
      const specRaw  = colSpecialty >= 0 ? row[colSpecialty]?.toString().trim() || '' : ''
      const specialties = parseSpecialties(specRaw)

      const key = `${name.toLowerCase()}|${company?.toLowerCase() || ''}`
      if (existingKeys.has(key)) {
        result.contractors_skipped++
        continue
      }

      const { error: insertErr } = await adminSupabase.from('contractors').insert({
        organization_id: orgId,
        name,
        company,
        phone,
        email,
        specialties,
        notes: notesRaw,
        is_active: true,
      })

      if (insertErr) {
        result.errors.push({ row: i + 1, message: `"${name}" konnte nicht gespeichert werden: ${insertErr.message}` })
        continue
      }

      result.contractors_created++
      existingKeys.add(key)
    }

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (err) {
    console.error('Contractor import error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
