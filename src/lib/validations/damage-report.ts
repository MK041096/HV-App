import { z } from 'zod'

// Valid categories matching DB CHECK constraint
export const DAMAGE_CATEGORIES = [
  'wasserschaden',
  'heizung',
  'elektrik',
  'fenster_tueren',
  'schimmel',
  'sanitaer',
  'boeden_waende',
  'aussenbereich',
  'sonstiges',
] as const

// Human-readable labels for categories (German)
export const CATEGORY_LABELS: Record<typeof DAMAGE_CATEGORIES[number], string> = {
  wasserschaden: 'Wasserschaden',
  heizung: 'Heizung',
  elektrik: 'Elektrik',
  fenster_tueren: 'Fenster & Türen',
  schimmel: 'Schimmel',
  sanitaer: 'Sanitär',
  boeden_waende: 'Böden & Wände',
  aussenbereich: 'Außenbereich',
  sonstiges: 'Sonstiges',
}

// Subcategories per category
export const SUBCATEGORIES: Record<typeof DAMAGE_CATEGORIES[number], string[]> = {
  wasserschaden: ['rohrbruch', 'undichte_leitung', 'ueberflutung', 'kondenswasser', 'sonstiges'],
  heizung: ['ausfall', 'undicht', 'geraeusche', 'thermostat_defekt', 'sonstiges'],
  elektrik: ['steckdose_defekt', 'lichtschalter', 'sicherung', 'kabelschaden', 'sonstiges'],
  fenster_tueren: ['schliesst_nicht', 'glasbruch', 'dichtung_defekt', 'griff_defekt', 'sonstiges'],
  schimmel: ['wand', 'decke', 'fensterbereich', 'bad', 'sonstiges'],
  sanitaer: ['toilette', 'waschbecken', 'dusche_badewanne', 'abfluss', 'sonstiges'],
  boeden_waende: ['risse', 'feuchtigkeit', 'beschaedigung', 'abloesungen', 'sonstiges'],
  aussenbereich: ['fassade', 'dach', 'balkon', 'eingang', 'sonstiges'],
  sonstiges: ['sonstiges'],
}

// Valid rooms matching DB CHECK constraint (legacy single-room field)
export const ROOMS = [
  'kueche',
  'bad',
  'wc',
  'schlafzimmer',
  'wohnzimmer',
  'flur',
  'keller',
  'balkon',
  'terrasse',
  'sonstiges',
] as const

export const ROOM_LABELS: Record<typeof ROOMS[number], string> = {
  kueche: 'Küche',
  bad: 'Bad',
  wc: 'WC',
  schlafzimmer: 'Schlafzimmer',
  wohnzimmer: 'Wohnzimmer',
  flur: 'Flur / Gang',
  keller: 'Keller',
  balkon: 'Balkon',
  terrasse: 'Terrasse',
  sonstiges: 'Sonstiges',
}

// Extended room list for multi-select (includes exterior/communal areas)
export const ROOMS_EXTENDED = [
  'kueche',
  'bad',
  'wc',
  'schlafzimmer',
  'wohnzimmer',
  'flur',
  'keller',
  'balkon',
  'terrasse',
  'dachboden',
  'aussenbereich_fassade',
  'gemeinschaftsbereich',
  'sonstiges',
] as const

export const ROOM_LABELS_EXTENDED: Record<string, string> = {
  kueche: 'Küche',
  bad: 'Bad',
  wc: 'WC',
  schlafzimmer: 'Schlafzimmer',
  wohnzimmer: 'Wohnzimmer',
  flur: 'Flur / Gang',
  keller: 'Keller',
  balkon: 'Balkon',
  terrasse: 'Terrasse',
  dachboden: 'Dachboden / Speicher',
  aussenbereich_fassade: 'Außenbereich / Fassade',
  gemeinschaftsbereich: 'Gemeinschaftsbereich',
  sonstiges: 'Sonstiges',
}

// Valid urgency levels matching DB CHECK constraint
export const URGENCY_LEVELS = ['notfall', 'dringend', 'normal'] as const

export const URGENCY_LABELS: Record<typeof URGENCY_LEVELS[number], string> = {
  notfall: 'Notfall (sofort)',
  dringend: 'Dringend (innerhalb 48h)',
  normal: 'Normal (innerhalb 2 Wochen)',
}

// Innen/Außen distinction — determines if damage belongs to unit or building
export const DAMAGE_SIDES = ['innen', 'aussen', 'beides'] as const

export const DAMAGE_SIDE_LABELS: Record<string, string> = {
  innen: 'Innenseite (Wohnung)',
  aussen: 'Außenseite (Gebäude / Liegenschaft)',
  beides: 'Innen- und Außenseite',
}

export const DAMAGE_SIDE_DESCRIPTIONS: Record<string, string> = {
  innen: 'Der Schaden befindet sich innerhalb der Wohnung. Zuständigkeit: Mieter oder HV je nach Mietvertrag.',
  aussen: 'Der Schaden betrifft Fassade, Außenwand oder Gemeinschaftsbereiche. Zuständigkeit: Hausverwaltung / Liegenschaft.',
  beides: 'Der Schaden betrifft sowohl die Wohnung als auch das Gebäude.',
}

// Categories where innen/außen question is shown
export const CATEGORIES_WITH_SIDE = [
  'fenster_tueren',
  'boeden_waende',
  'aussenbereich',
  'schimmel',
  'wasserschaden',
] as const

// Schema for creating a damage report
export const createDamageReportSchema = z.object({
  category: z.enum(DAMAGE_CATEGORIES, {
    error: 'Bitte wählen Sie eine Kategorie',
  }),
  // Legacy single-value fields (kept for backward compat, populated from arrays)
  subcategory: z
    .string()
    .max(100, 'Unterkategorie darf maximal 100 Zeichen lang sein')
    .optional()
    .nullable(),
  room: z.enum(ROOMS, {
    error: 'Bitte wählen Sie einen Raum',
  }).optional().nullable(),
  // New multi-value fields
  subcategories: z
    .array(z.string().max(100))
    .max(10, 'Maximal 10 Unterkategorien')
    .optional()
    .default([]),
  rooms: z
    .array(z.string().max(100))
    .max(10, 'Maximal 10 Räume')
    .optional()
    .default([]),
  damage_side: z
    .enum(DAMAGE_SIDES, { error: 'Ungültiger Wert' })
    .optional()
    .nullable(),
  title: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(100, 'Titel darf maximal 100 Zeichen lang sein'),
  description: z
    .string()
    .max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein')
    .optional()
    .nullable(),
  urgency: z.enum(URGENCY_LEVELS, {
    error: 'Bitte wählen Sie eine Dringlichkeitsstufe',
  }),
  preferred_appointment: z
    .string()
    .datetime({ message: 'Ungültiges Datumsformat' })
    .optional()
    .nullable(),
  preferred_appointment_2: z
    .string()
    .datetime({ message: 'Ungültiges Datumsformat' })
    .optional()
    .nullable(),
  damage_since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat')
    .optional()
    .nullable(),
  access_notes: z
    .string()
    .max(500, 'Zugangshinweise dürfen maximal 500 Zeichen lang sein')
    .optional()
    .nullable(),
  photo_ids: z
    .array(z.string().uuid('Ungültige Foto-ID'))
    .max(5, 'Maximal 5 Fotos erlaubt')
    .optional()
    .default([]),
  reporter_phone: z
    .string()
    .max(30, 'Telefonnummer darf maximal 30 Zeichen lang sein')
    .optional()
    .nullable(),
})

// Schema for listing damage reports (query params)
export const listDamageReportsSchema = z.object({
  status: z
    .enum(['neu', 'in_bearbeitung', 'warte_auf_handwerker', 'termin_vereinbart', 'termin_telefonisch', 'erledigt', 'abgelehnt'])
    .optional(),
  urgency: z.enum(URGENCY_LEVELS).optional(),
  category: z.enum(DAMAGE_CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export type CreateDamageReportInput = z.infer<typeof createDamageReportSchema>
export type ListDamageReportsInput = z.infer<typeof listDamageReportsSchema>
