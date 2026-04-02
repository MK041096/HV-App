import { z } from 'zod'

export const updateProfileSchema = z.object({
  first_name: z
    .string()
    .max(100, 'Vorname darf maximal 100 Zeichen lang sein')
    .optional(),
  last_name: z
    .string()
    .max(100, 'Nachname darf maximal 100 Zeichen lang sein')
    .optional(),
  phone: z
    .string()
    .max(50, 'Telefonnummer darf maximal 50 Zeichen lang sein')
    .optional()
    .nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
