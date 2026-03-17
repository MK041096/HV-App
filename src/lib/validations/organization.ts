import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(200, 'Name darf maximal 200 Zeichen lang sein'),
  slug: z
    .string()
    .min(2, 'Slug muss mindestens 2 Zeichen lang sein')
    .max(100, 'Slug darf maximal 100 Zeichen lang sein')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'
    ),
  plan: z.enum(['standard', 'premium']).default('standard'),
  einheiten_anzahl: z.number().int().min(0).default(0),
  country: z.enum(['AT', 'DE', 'CH']).default('AT'),
})

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(200, 'Name darf maximal 200 Zeichen lang sein')
    .optional(),
  slug: z
    .string()
    .min(2, 'Slug muss mindestens 2 Zeichen lang sein')
    .max(100, 'Slug darf maximal 100 Zeichen lang sein')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'
    )
    .optional(),
  plan: z.enum(['standard', 'premium']).optional(),
  einheiten_anzahl: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
