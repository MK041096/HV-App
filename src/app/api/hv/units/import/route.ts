import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import crypto from 'crypto'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { sendTenantInviteEmail } from '@/lib/email'

// Max 5MB file
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Expected column header aliases (case-insensitive, very flexible)
const COL_UNIT = [
  'einheit', 'wohnung', 'wohneinheit', 'unit', 'name', 'bezeichnung',
  'objekt', 'liegenschaft', 'immobilie', 'apartment', 'wohnungsnummer',
  'einheitsnummer', 'wohnungs-nr', 'wohnungs nr', 'nr', 'nummer',
  'top', 'top-nr', 'top nr', 'türnummer', 'türnr',
]
const COL_ADDRESS = [
  'adresse', 'address', 'strasse', 'straße', 'anschrift',
  'wohnadresse', 'wohnort', 'standort', 'lage', 'ort',
  'straße und hausnummer', 'strassenadresse', 'objektadresse',
  'full address', 'vollständige adresse',
]
const COL_FLOOR = [
  'stockwerk', 'etage', 'floor', 'geschoss', 'stiege',
  'ebene', 'stock', 'og', 'eg', 'ug', 'dg',
]
const COL_EMAIL = [
  'email', 'e-mail', 'mail', 'e mail',
  'mieter email', 'mieter e-mail', 'mieter mail',
  'tenant email', 'kontakt email', 'kontaktdaten',
  'kontakt', 'emailadresse', 'e-mail adresse', 'mailadresse',
  'email adresse', 'electronic mail',
]
const COL_FIRST_NAME = [
  'vorname', 'first name', 'firstname', 'mieter vorname',
  'bewohner vorname', 'vname',
]
const COL_LAST_NAME = [
  'nachname', 'last name', 'lastname', 'familienname', 'mieter nachname',
  'bewohner nachname', 'zuname', 'nname',
]
// Full name column: split into first/last automatically
const COL_FULL_NAME = [
  'mieter', 'tenant', 'bewohner', 'mieter name', 'bewohner name',
  'vollständiger name', 'full name', 'fullname', 'name mieter',
  'mietername', 'bewohnername', 'person', 'mieter/bewohner',
  'inhaber', 'nutzer', 'kunde',
]

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

function findCol(headers: string[], aliases: string[]): number {
  // Exact match first
  const exact = headers.findIndex((h) => aliases.includes(normalize(h)))
  if (exact !== -1) return exact
  // Partial match: header must CONTAIN the alias (not the reverse — prevents "Mieter" from
  // falsely matching "mieter vorname" or "mieter nachname")
  return headers.findIndex((h) => {
    const n = normalize(h)
    return aliases.some((a) => n.includes(a))
  })
}

// Content-based column detection (no complex regex - linter-safe)
function hasAtSign(v: string): boolean { return v.includes('@') && v.includes('.') && !v.includes(' ') }
function hasPostalCode(v: string): boolean { return /[0-9]{4}/.test(v) }
function hasStreetWord(v: string): boolean { const lv = v.toLowerCase(); return ['straße','gasse','weg','platz','ring','allee','str.','gasse'].some(w => lv.includes(w)) }
function looksLikePersonName(v: string): boolean { const parts = v.trim().split(' '); return parts.length >= 2 && parts.length <= 4 && !v.includes('@') && !/[0-9]/.test(v) }

function colScore(rows: string[][], colIndex: number, check: (v: string) => boolean): number {
  const vals = rows.slice(1, Math.min(11, rows.length)).map(r => r[colIndex]?.toString().trim() || '').filter(Boolean)
  return vals.length ? vals.filter(check).length / vals.length : 0
}

function findColByContent(rows: string[][], headers: string[], type: string, assigned: Set<number>): number {
  const checks: Record<string, (v: string) => boolean> = {
    email: hasAtSign,
    address: (v) => hasPostalCode(v) || hasStreetWord(v),
    name: looksLikePersonName,
    unit: (v) => v.length <= 40 && !hasAtSign(v) && !hasPostalCode(v),
  }
  const check = checks[type]
  let best = -1; let bestScore = 0.5
  for (let i = 0; i < headers.length; i++) {
    if (assigned.has(i)) continue
    const s = colScore(rows, i, check)
    if (s > bestScore) { bestScore = s; best = i }
  }
  return best
}
function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

interface ImportRow {
  rowIndex: number
  unitName: string
  address: string | null
  floor: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
}

interface ImportResult {
  units_created: number
  units_skipped: number
  codes_generated: number
  emails_sent: number
  errors: { row: number; message: string }[]
}

// POST /api/hv/units/import - Parse Excel/CSV and bulk-import units + generate codes + send invites
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Get organization info
    const { data: orgId, error: orgError } = await supabase.rpc('get_user_organization_id')
    if (orgError || !orgId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, einheiten_anzahl')
      .eq('id', orgId)
      .single()

    const orgName = orgData?.name || 'Ihre Hausverwaltung'
    const einheitenLimit = orgData?.einheiten_anzahl || 0

    // Count current units to determine remaining slots
    let remainingSlots = Infinity
    if (einheitenLimit > 0) {
      const { count: currentCount } = await supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
      const used = currentCount ?? 0
      remainingSlots = Math.max(0, einheitenLimit - used)
    }

    // Parse multipart form
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Datei zu groß (max. 5 MB)' },
        { status: 400 }
      )
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ]
    const fileName = file.name.toLowerCase()
    const isValidExt =
      fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')

    if (!isValidExt) {
      return NextResponse.json(
        { error: 'Ungültiges Dateiformat. Nur .xlsx, .xls und .csv erlaubt.' },
        { status: 400 }
      )
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse with xlsx
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json({ error: 'Leere Datei oder kein Tabellenblatt gefunden' }, { status: 400 })
    }

    const sheet = workbook.Sheets[sheetName]
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as string[][]

    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'Die Datei enthält keine Daten (mindestens eine Kopfzeile + eine Datenzeile erforderlich)' },
        { status: 400 }
      )
    }

    // Auto-detect columns: header matching first, then content analysis as fallback
    const headers = (rows[0] || []).map(String)
    const assigned = new Set<number>()

    function detect(aliases: string[], contentType?: string): number {
      let idx = findCol(headers, aliases)
      if (idx === -1 && contentType) idx = findColByContent(rows, headers, contentType, assigned)
      if (idx !== -1) assigned.add(idx)
      return idx
    }

    const colUnit      = detect(COL_UNIT, 'unit')
    const colAddress   = detect(COL_ADDRESS, 'address')
    const colFloor     = detect(COL_FLOOR, undefined)
    const colEmail     = detect(COL_EMAIL, 'email')
    const colFirstName = detect(COL_FIRST_NAME, undefined)
    const colLastName  = detect(COL_LAST_NAME, undefined)
    const colFullName  = detect(COL_FULL_NAME, 'name')

    if (colUnit === -1) {
      return NextResponse.json(
        { error: 'Konnte keine Einheiten-Spalte erkennen. Erkannte Spalten: ' + headers.join(', ') },
        { status: 400 }
      )
    }

    // Parse data rows
    const importRows: ImportRow[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || []
      const unitName = row[colUnit]?.toString().trim()
      if (!unitName) continue // skip empty rows

      // Parse name: prefer separate Vorname/Nachname columns; fall back to full-name column
      let firstName: string | null = colFirstName >= 0 ? row[colFirstName]?.toString().trim() || null : null
      let lastName: string | null = colLastName >= 0 ? row[colLastName]?.toString().trim() || null : null
      if (!firstName && !lastName && colFullName >= 0) {
        const fullName = row[colFullName]?.toString().trim() || null
        if (fullName) {
          const parts = fullName.split(' ')
          if (parts.length >= 2) {
            // Standard: Vorname Nachname (e.g. "Mathias Kracher")
            firstName = parts[0]
            lastName = parts.slice(1).join(' ')
          } else {
            firstName = fullName
          }
        }
      }

      importRows.push({
        rowIndex: i + 1,
        unitName,
        address: colAddress >= 0 ? row[colAddress]?.toString().trim() || null : null,
        floor: colFloor >= 0 ? row[colFloor]?.toString().trim() || null : null,
        email: colEmail >= 0 ? row[colEmail]?.toString().trim().toLowerCase() || null : null,
        firstName,
        lastName,
      })
    }

    if (importRows.length === 0) {
      return NextResponse.json({ error: 'Keine gültigen Zeilen gefunden' }, { status: 400 })
    }

    if (importRows.length > 1000) {
      return NextResponse.json(
        { error: 'Maximal 1000 Einheiten pro Import' },
        { status: 400 }
      )
    }

    // Get existing unit names to detect duplicates
    const { data: existingUnits } = await supabase
      .from('units')
      .select('id, name')
      .eq('organization_id', orgId)
      .eq('is_deleted', false)
      .limit(2000)

    const existingNames = new Set(
      (existingUnits || []).map((u) => u.name.toLowerCase().trim())
    )

    const result: ImportResult = {
      units_created: 0,
      units_skipped: 0,
      codes_generated: 0,
      emails_sent: 0,
      errors: [],
    }

    function isValidEmail(email: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    const expiresAtStr = expiresAt.toISOString()

    // ── Phase 1: Filter valid rows (duplicates + limit) ──
    const validRows: ImportRow[] = []
    for (const row of importRows) {
      if (remainingSlots !== Infinity && validRows.length >= remainingSlots) {
        result.errors.push({ row: row.rowIndex, message: `Einheitenlimit erreicht — "${row.unitName}" wurde nicht importiert.` })
        continue
      }
      if (existingNames.has(row.unitName.toLowerCase())) {
        result.units_skipped++
        continue
      }
      validRows.push(row)
      existingNames.add(row.unitName.toLowerCase())
    }

    if (validRows.length === 0) {
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id, organization_id: orgId, action: 'units_imported',
        entity_type: 'unit', entity_id: orgId,
        details: { file_name: file.name, rows_total: importRows.length, units_created: 0, units_skipped: result.units_skipped, codes_generated: 0, emails_sent: 0, errors: result.errors.length },
      })
      return NextResponse.json({ data: result }, { status: 200 })
    }

    // ── Phase 2: Generate unique codes in bulk ──
    const generatedCodes: string[] = []
    while (generatedCodes.length < validRows.length) {
      const needed = validRows.length - generatedCodes.length
      const candidates = Array.from({ length: needed + 20 }, () => generateActivationCode())
      const { data: existing } = await adminSupabase
        .from('activation_codes').select('code').in('code', candidates)
      const existingSet = new Set((existing || []).map((e: { code: string }) => e.code))
      const usedSet = new Set(generatedCodes)
      for (const c of candidates) {
        if (!existingSet.has(c) && !usedSet.has(c) && generatedCodes.length < validRows.length) {
          generatedCodes.push(c)
        }
      }
    }

    // ── Phase 3: Batch insert units ──
    const { data: newUnits, error: batchUnitError } = await adminSupabase
      .from('units')
      .insert(validRows.map(row => ({
        organization_id: orgId,
        name: row.unitName,
        address: row.address,
        floor: row.floor,
        is_deleted: false,
      })))
      .select('id, name')

    if (batchUnitError || !newUnits || newUnits.length === 0) {
      return NextResponse.json({ error: `Fehler beim Erstellen der Einheiten: ${batchUnitError?.message}` }, { status: 500 })
    }

    result.units_created = newUnits.length

    // Map unit name → id (Supabase preserves insert order but we match by name to be safe)
    const unitIdByName = new Map(newUnits.map((u: { id: string; name: string }) => [u.name, u.id]))

    // ── Phase 4: Batch insert activation codes ──
    const codeInserts = validRows.map((row, i) => ({
      organization_id: orgId,
      unit_id: unitIdByName.get(row.unitName) ?? newUnits[i]?.id,
      code: generatedCodes[i],
      status: 'pending',
      expires_at: expiresAtStr,
      created_by: user.id,
      invited_email: row.email || null,
      invited_first_name: row.firstName || null,
      invited_last_name: row.lastName || null,
    }))

    const { error: batchCodeError } = await adminSupabase.from('activation_codes').insert(codeInserts)
    if (!batchCodeError) result.codes_generated = codeInserts.length

    // ── Phase 5: Send emails (sequential, only for rows with email) ──
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      if (!row.email || !isValidEmail(row.email)) continue
      const tenantName = row.firstName && row.lastName
        ? `${row.firstName} ${row.lastName}`
        : row.firstName || row.lastName || null
      const unitId = unitIdByName.get(row.unitName) ?? newUnits[i]?.id
      const unitName = newUnits.find((u: { id: string; name: string }) => u.id === unitId)?.name ?? row.unitName
      try {
        await sendTenantInviteEmail({ to: row.email, tenantName, activationCode: generatedCodes[i], expiresAt: expiresAtStr, orgName, unitName })
        result.emails_sent++
      } catch {
        result.errors.push({ row: row.rowIndex, message: `E-Mail an ${row.email} konnte nicht gesendet werden` })
      }
    }

    // Audit log
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      organization_id: orgId,
      action: 'units_imported',
      entity_type: 'unit',
      entity_id: orgId,
      details: {
        file_name: file.name,
        rows_total: importRows.length,
        units_created: result.units_created,
        units_skipped: result.units_skipped,
        codes_generated: result.codes_generated,
        emails_sent: result.emails_sent,
        errors: result.errors.length,
      },
    })

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler beim Import' }, { status: 500 })
  }
}
