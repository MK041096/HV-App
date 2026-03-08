import { z } from 'zod'

export const createUnitSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(200, 'Name darf maximal 200 Zeichen lang sein'),
  address: z
    .string()
    .max(500, 'Adresse darf maximal 500 Zeichen lang sein')
    .optional()
    .nullable(),
  floor: z
    .string()
    .max(50, 'Stockwerk darf maximal 50 Zeichen lang sein')
    .optional()
    .nullable(),
})

export const updateUnitSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(200, 'Name darf maximal 200 Zeichen lang sein')
    .optional(),
  address: z
    .string()
    .max(500, 'Adresse darf maximal 500 Zeichen lang sein')
    .optional()
    .nullable(),
  floor: z
    .string()
    .max(50, 'Stockwerk darf maximal 50 Zeichen lang sein')
    .optional()
    .nullable(),
})

export type CreateUnitInput = z.infer<typeof createUnitSchema>
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>
