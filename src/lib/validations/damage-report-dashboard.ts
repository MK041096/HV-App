import { z } from 'zod'

// Status display mapping: DB statuses -> user-friendly German labels
export const STATUS_DISPLAY_MAP = {
  neu: 'Eingegangen',
  in_bearbeitung: 'In Bearbeitung',
  warte_auf_handwerker: 'In Bearbeitung',
  termin_vereinbart: 'Termin vereinbart',
  erledigt: 'Abgeschlossen',
  abgelehnt: 'Abgeschlossen',
} as const

// Filter groups for the dashboard (maps display status to DB statuses)
export const STATUS_FILTER_MAP = {
  alle: null,
  offen: ['neu', 'in_bearbeitung', 'warte_auf_handwerker', 'termin_vereinbart'],
  abgeschlossen: ['erledigt', 'abgelehnt'],
} as const

export type StatusFilter = keyof typeof STATUS_FILTER_MAP
export type DbStatus = keyof typeof STATUS_DISPLAY_MAP
export type DisplayStatus = (typeof STATUS_DISPLAY_MAP)[DbStatus]

// Schema for cursor-based pagination on dashboard
export const dashboardListSchema = z.object({
  filter: z.enum(['alle', 'offen', 'abgeschlossen']).default('alle'),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

// Schema for creating/updating a rating
export const createRatingSchema = z.object({
  rating: z.boolean({ message: 'Bewertung muss true (zufrieden) oder false (unzufrieden) sein' }),
})

// Schema for updating a rating
export const updateRatingSchema = z.object({
  rating: z.boolean({ message: 'Bewertung muss true (zufrieden) oder false (unzufrieden) sein' }),
})

export type DashboardListInput = z.infer<typeof dashboardListSchema>
export type CreateRatingInput = z.infer<typeof createRatingSchema>
