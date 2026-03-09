import { z } from 'zod'

// ── List / Filter / Search Schema for Tenants ──
export const hvTenantListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(50),

  // Filters
  status: z.enum(['active', 'inactive', 'all']).default('all'),

  // Search (name, email)
  search: z.string().max(200).optional(),

  // Sorting
  sort_by: z
    .enum(['name', 'created_at', 'unit'])
    .default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})

// ── List / Filter / Search Schema for Units (HV enriched view) ──
export const hvUnitListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(500).default(50),

  // Filters
  tenant_status: z
    .enum(['occupied', 'vacant', 'pending', 'all'])
    .default('all'),

  // Search (address, unit name)
  search: z.string().max(200).optional(),

  // Sorting
  sort_by: z
    .enum(['name', 'address', 'created_at'])
    .default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})

// ── Deactivate / Reactivate Tenant Schema ──
export const hvTenantStatusSchema = z.object({
  action: z.enum(['deactivate', 'reactivate'], {
    error: 'Aktion muss "deactivate" oder "reactivate" sein',
  }),
  reason: z
    .string()
    .max(500, 'Grund darf maximal 500 Zeichen lang sein')
    .optional(),
})

// ── Assign Tenant to Unit Schema ──
export const hvAssignTenantSchema = z.object({
  tenant_id: z
    .string()
    .uuid('Ungültige Mieter-ID'),
})

// ── Unassign Tenant from Unit Schema ──
export const hvUnassignTenantSchema = z.object({
  unassign: z.literal(true),
})

// Export types
export type HvTenantListInput = z.infer<typeof hvTenantListSchema>
export type HvUnitListInput = z.infer<typeof hvUnitListSchema>
export type HvTenantStatusInput = z.infer<typeof hvTenantStatusSchema>
export type HvAssignTenantInput = z.infer<typeof hvAssignTenantSchema>
export type HvUnassignTenantInput = z.infer<typeof hvUnassignTenantSchema>
