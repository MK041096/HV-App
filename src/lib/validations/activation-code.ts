import { z } from 'zod'

// Schema for generating a new activation code (HV creates for a unit)
export const createActivationCodeSchema = z.object({
  unit_id: z
    .string()
    .uuid('Ungültige Wohneinheit-ID'),
  expires_in_days: z
    .number()
    .int()
    .min(1, 'Ablaufzeit muss mindestens 1 Tag sein')
    .max(365, 'Ablaufzeit darf maximal 365 Tage sein')
    .default(30),
})

// Schema for deactivating a code
export const deactivateCodeSchema = z.object({
  id: z
    .string()
    .uuid('Ungültige Code-ID'),
})

// Schema for tenant registration with activation code
export const tenantRegisterSchema = z.object({
  code: z
    .string()
    .min(8, 'Aktivierungscode muss mindestens 8 Zeichen lang sein')
    .max(16, 'Aktivierungscode darf maximal 16 Zeichen lang sein')
    .regex(/^[A-Z0-9]+$/, 'Aktivierungscode darf nur Grossbuchstaben und Zahlen enthalten'),
  email: z
    .string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .max(255, 'E-Mail darf maximal 255 Zeichen lang sein'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .max(128, 'Passwort darf maximal 128 Zeichen lang sein'),
  first_name: z
    .string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname darf maximal 100 Zeichen lang sein'),
  last_name: z
    .string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname darf maximal 100 Zeichen lang sein'),
  privacy_accepted: z
    .literal(true, {
      error: 'Datenschutzerklaerung muss akzeptiert werden',
    }),
})

// Schema for validating (checking) a code before registration
export const validateCodeSchema = z.object({
  code: z
    .string()
    .min(8, 'Aktivierungscode muss mindestens 8 Zeichen lang sein')
    .max(16, 'Aktivierungscode darf maximal 16 Zeichen lang sein')
    .regex(/^[A-Z0-9]+$/, 'Aktivierungscode darf nur Grossbuchstaben und Zahlen enthalten'),
})

export type CreateActivationCodeInput = z.infer<typeof createActivationCodeSchema>
export type DeactivateCodeInput = z.infer<typeof deactivateCodeSchema>
export type TenantRegisterInput = z.infer<typeof tenantRegisterSchema>
export type ValidateCodeInput = z.infer<typeof validateCodeSchema>
