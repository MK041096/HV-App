import { classifyContractor } from '@/lib/contractor-classifier'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendWerkstattWillkommensmail } from '@/lib/email'

// Vercel-Timeout hochsetzen — KI-Klassifizierung mit Web-Suche kann pro Werkstatt
// 5-15 Sek dauern. Bei 100 Werkstätten erreichen wir bis zu 5 Min Gesamtlaufzeit.
export const maxDuration = 300

const MAX_FILE_SIZE = 5 * 1024 * 1024

// Column aliases
const COL_COMPANY     = ['firmenname', 'firma', 'unternehmen', 'company', 'betrieb', 'unternehmensname', 'name']
const COL_PHONE       = ['telefon', 'tel', 'phone', 'mobil', 'handy', 'telefonnummer', 'tel.', 'mobilnummer']
const COL_EMAIL       = ['email', 'e-mail', 'mail', 'e mail', 'emailadresse', 'mailadresse']
const COL_TAETIGKEIT  = ['tätigkeit', 'taetigkeit', 'tätigkeit der werkstatt', 'leistung', 'fachgebiet', 'gewerk', 'spezialisierung']
const COL_BESCHREIBUNG = ['beschreibung', 'notiz', 'notizen', 'notes', 'anmerkung', 'kommentar', 'info']

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

    const { data: org } = await supabase
      .from('organizations')
      .select('name, phone')
      .eq('id', orgId)
      .single()
    const orgName = org?.name || 'Ihre Hausverwaltung'
    const orgPhone = org?.phone || undefined

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
    const colCompany      = findCol(headers, COL_COMPANY)
    const colPhone        = findCol(headers, COL_PHONE)
    const colEmail        = findCol(headers, COL_EMAIL)
    const colTaetigkeit   = findCol(headers, COL_TAETIGKEIT)
    const colBeschreibung = findCol(headers, COL_BESCHREIBUNG)

    if (colCompany === -1) {
      return NextResponse.json(
        { error: 'Keine Firmenname-Spalte gefunden. Erkannte Spalten: ' + headers.join(', ') },
        { status: 400 }
      )
    }

    // Fetch existing to detect duplicates (by name + phone)
    const { data: existing } = await supabase
      .from('contractors')
      .select('name, phone')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .limit(2000)

    const existingKeys = new Set(
      (existing || []).map(c => `${c.name?.toLowerCase()}|${c.phone?.toLowerCase() || ''}`)
    )

    const result: ImportResult = { contractors_created: 0, contractors_skipped: 0, errors: [] }

    // ── Phase 1: Validate and collect valid rows ──
    interface ValidContractor {
      rowIndex: number
      company: string
      phone: string
      email: string
      notes: string
      description: string | null
    }
    const validContractors: ValidContractor[] = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || []
      const company = row[colCompany]?.toString().trim()
      if (!company) continue

      const phone        = colPhone        >= 0 ? row[colPhone]?.toString().trim()        || null : null
      const email        = colEmail        >= 0 ? row[colEmail]?.toString().trim().toLowerCase() || null : null
      const taetigkeit   = colTaetigkeit   >= 0 ? row[colTaetigkeit]?.toString().trim()   || null : null
      const beschreibung = colBeschreibung >= 0 ? row[colBeschreibung]?.toString().trim()  || null : null

      if (!phone) { result.errors.push({ row: i + 1, message: `"${company}": Telefonnummer fehlt (Pflichtfeld)` }); continue }
      if (!email) { result.errors.push({ row: i + 1, message: `"${company}": E-Mail fehlt (Pflichtfeld)` }); continue }
      if (!taetigkeit) { result.errors.push({ row: i + 1, message: `"${company}": Tätigkeit fehlt (Pflichtfeld)` }); continue }

      const key = `${company.toLowerCase()}|${phone.toLowerCase()}`
      if (existingKeys.has(key)) { result.contractors_skipped++; continue }

      existingKeys.add(key)
      validContractors.push({ rowIndex: i + 1, company, phone, email, notes: taetigkeit, description: beschreibung })
    }

    // ── Phase 2: KI-Klassifizierung (parallel, max 10 gleichzeitig) ──
    // Höhere Concurrency damit der Import bei vielen Werkstätten + Web-Suche schnell bleibt.
    // Anthropic Rate-Limit pro API-Key liegt deutlich darüber.
    const CONCURRENCY = 10
    const classifications: { company: string; result: Awaited<ReturnType<typeof classifyContractor>> }[] = []
    for (let i = 0; i < validContractors.length; i += CONCURRENCY) {
      const batch = validContractors.slice(i, i + CONCURRENCY)
      const batchResults = await Promise.all(
        batch.map(async c => ({
          company: c.company,
          result: await classifyContractor({
            company: c.company,
            taetigkeit: c.notes,
            beschreibung: c.description,
          }),
        }))
      )
      classifications.push(...batchResults)
    }

    const classByCompany = new Map(classifications.map(x => [x.company, x.result]))

    // ── Phase 3: Batch insert all valid contractors mit KI-Daten ──
    if (validContractors.length > 0) {
      const { error: batchErr } = await adminSupabase.from('contractors').insert(
        validContractors.map(c => {
          const cls = classByCompany.get(c.company)
          const allSpecialties = cls
            ? Array.from(new Set([...cls.specialties, ...cls.subtags]))
            : ['sonstiges']
          return {
            organization_id: orgId,
            name: c.company,
            company: c.company,
            phone: c.phone,
            email: c.email,
            specialties: allSpecialties,
            carl_hint: cls?.carl_hint || null,
            search_keywords: cls?.search_keywords || [],
            notes: c.notes,
            description: c.description,
            is_active: true,
          }
        })
      )

      if (batchErr) {
        return NextResponse.json({ error: `Fehler beim Speichern: ${batchErr.message}` }, { status: 500 })
      }

      result.contractors_created = validContractors.length

      // ── Phase 4: Send welcome emails (non-blocking) ──
      for (const c of validContractors) {
        sendWerkstattWillkommensmail({ to: c.email, contractorName: c.company, orgName, orgPhone })
          .catch(() => { /* silent */ })
      }
    }

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (err) {
    console.error('Contractor import error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
