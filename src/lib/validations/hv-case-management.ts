import { z } from 'zod'
import { DAMAGE_CATEGORIES, URGENCY_LEVELS } from './damage-report'

// All valid DB statuses for damage reports
export const CASE_STATUSES = [
  'neu',
  'in_bearbeitung',
  'warte_auf_handwerker',
  'termin_vereinbart',
  'erledigt',
  'abgelehnt',
] as const

export type CaseStatus = (typeof CASE_STATUSES)[number]

// HV-facing status labels (German)
export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  neu: 'Neu',
  in_bearbeitung: 'In Bearbeitung',
  warte_auf_handwerker: 'Warte auf Handwerker',
  termin_vereinbart: 'Termin vereinbart',
  erledigt: 'Erledigt',
  abgelehnt: 'Abgelehnt',
}

// Urgency sort order (Notfall first)
export const URGENCY_SORT_ORDER: Record<string, number> = {
  notfall: 0,
  dringend: 1,
  normal: 2,
}

// ── List / Filter / Search Schema ──
export const hvCaseListSchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(25),

  // Filters
  status: z.enum(CASE_STATUSES).optional(),
  urgency: z.enum(URGENCY_LEVELS).optional(),
  category: z.enum(DAMAGE_CATEGORIES).optional(),
  assigned_to: z.string().max(200).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),

  // Search (case_number, tenant name, unit name)
  search: z.string().max(200).optional(),

  // Sorting
  sort_by: z
    .enum(['urgency', 'created_at', 'status', 'category', 'case_number'])
    .default('urgency'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})

// ── Status Update Schema ──
export const hvStatusUpdateSchema = z.object({
  new_status: z.enum(CASE_STATUSES, {
    error: 'Ungültiger Status',
  }),
  comment: z
    .string()
    .min(1, 'Kommentar ist bei Status-Änderungen erforderlich')
    .max(2000, 'Kommentar darf maximal 2000 Zeichen lang sein'),
})

// ── Comment Schema ──
export const hvCommentCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'Kommentar darf nicht leer sein')
    .max(2000, 'Kommentar darf maximal 2000 Zeichen lang sein'),
  is_internal: z.boolean().default(false),
})

// ── Handwerker Assignment Schema ──
export const hvAssignmentSchema = z.object({
  assigned_to_name: z
    .string()
    .min(1, 'Name des Handwerkers ist erforderlich')
    .max(200, 'Name darf maximal 200 Zeichen lang sein'),
  assigned_to_phone: z
    .string()
    .max(50, 'Telefonnummer darf maximal 50 Zeichen lang sein')
    .optional()
    .nullable(),
  assigned_to_email: z
    .string()
    .email('Ungültige E-Mail-Adresse')
    .max(200, 'E-Mail darf maximal 200 Zeichen lang sein')
    .optional()
    .nullable(),
  assigned_to_company: z
    .string()
    .max(200, 'Firmenname darf maximal 200 Zeichen lang sein')
    .optional()
    .nullable(),
})

// ── Clear Assignment Schema (set all to null) ──
export const hvClearAssignmentSchema = z.object({
  clear: z.literal(true),
})

// ── Appointment Schema ──
export const hvAppointmentSchema = z.object({
  scheduled_appointment: z
    .string()
    .datetime({ message: 'Ungültiges Datumsformat' }),
})

// ── Clear Appointment Schema ──
export const hvClearAppointmentSchema = z.object({
  scheduled_appointment: z.null(),
})

// Export types
export type HvCaseListInput = z.infer<typeof hvCaseListSchema>
export type HvStatusUpdateInput = z.infer<typeof hvStatusUpdateSchema>
export type HvCommentCreateInput = z.infer<typeof hvCommentCreateSchema>
export type HvAssignmentInput = z.infer<typeof hvAssignmentSchema>
export type HvAppointmentInput = z.infer<typeof hvAppointmentSchema>
