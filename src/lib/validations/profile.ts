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
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
