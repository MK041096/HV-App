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
  fenster_tueren: 'Fenster & Tueren',
  schimmel: 'Schimmel',
  sanitaer: 'Sanitaer',
  boeden_waende: 'Boeden & Waende',
  aussenbereich: 'Aussenbereich',
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

// Valid rooms matching DB CHECK constraint
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
  kueche: 'Kueche',
  bad: 'Bad',
  wc: 'WC',
  schlafzimmer: 'Schlafzimmer',
  wohnzimmer: 'Wohnzimmer',
  flur: 'Flur',
  keller: 'Keller',
  balkon: 'Balkon',
  terrasse: 'Terrasse',
  sonstiges: 'Sonstiges',
}

// Valid urgency levels matching DB CHECK constraint
export const URGENCY_LEVELS = ['notfall', 'dringend', 'normal'] as const

export const URGENCY_LABELS: Record<typeof URGENCY_LEVELS[number], string> = {
  notfall: 'Notfall (sofort)',
  dringend: 'Dringend (innerhalb 48h)',
  normal: 'Normal (innerhalb 2 Wochen)',
}

// Schema for creating a damage report
export const createDamageReportSchema = z.object({
  category: z.enum(DAMAGE_CATEGORIES, {
    error: 'Bitte wählen Sie eine Kategorie',
  }),
  subcategory: z
    .string()
    .max(100, 'Unterkategorie darf maximal 100 Zeichen lang sein')
    .optional()
    .nullable(),
  room: z.enum(ROOMS, {
    error: 'Bitte wählen Sie einen Raum',
  }).optional().nullable(),
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
  access_notes: z
    .string()
    .max(500, 'Zugangshinweise duerfen maximal 500 Zeichen lang sein')
    .optional()
    .nullable(),
  photo_ids: z
    .array(z.string().uuid('Ungültige Foto-ID'))
    .max(5, 'Maximal 5 Fotos erlaubt')
    .optional()
    .default([]),
})

// Schema for listing damage reports (query params)
export const listDamageReportsSchema = z.object({
  status: z
    .enum(['neu', 'in_bearbeitung', 'warte_auf_handwerker', 'termin_vereinbart', 'erledigt', 'abgelehnt'])
    .optional(),
  urgency: z.enum(URGENCY_LEVELS).optional(),
  category: z.enum(DAMAGE_CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export type CreateDamageReportInput = z.infer<typeof createDamageReportSchema>
export type ListDamageReportsInput = z.infer<typeof listDamageReportsSchema>
