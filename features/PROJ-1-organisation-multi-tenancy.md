# PROJ-1: Organisation & Multi-Tenancy Grundstruktur

## Status: In Review
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- None (Basis für alle anderen Features)

## Beschreibung
Aufbau der mandantenfähigen Datenbankstruktur. Jede Hausverwaltung ist eine eigene Organisation (Tenant) mit vollständig isolierten Daten. Kein Tenant kann Daten eines anderen Tenants sehen oder verändern.

## User Stories
- Als Plattformbetreiber möchte ich, dass jede Hausverwaltung eine eigene isolierte Umgebung hat, damit Datenlecks zwischen Kunden ausgeschlossen sind.
- Als Hausverwaltungs-Mitarbeiter möchte ich, dass ich ausschließlich Daten meiner eigenen Organisation sehe, auch wenn ich denselben Login-Service nutze wie andere HVs.
- Als Plattformbetreiber möchte ich neue Hausverwaltungen als Organisation anlegen können, damit das Onboarding strukturiert abläuft.
- Als Entwickler möchte ich eine einheitliche `organization_id`-Struktur in allen Tabellen, damit RLS-Policies konsistent durchgesetzt werden.

## Acceptance Criteria
- [ ] Tabelle `organizations` existiert mit: id, name, slug, plan, einheiten_anzahl, created_at, is_active
- [ ] Jede Tabelle mit personenbezogenen Daten hat eine `organization_id`-Spalte (NOT NULL)
- [ ] Row Level Security ist auf JEDER Tabelle aktiviert
- [ ] Ein User einer Organisation kann KEINE Daten einer anderen Organisation lesen (getestet mit zwei Test-Orgs)
- [ ] Ein User einer Organisation kann KEINE Daten einer anderen Organisation schreiben
- [ ] Soft-Delete implementiert: `is_deleted` + `deleted_at` Felder auf allen relevanten Tabellen
- [ ] Supabase-Projekt ist in EU-Region (Frankfurt / eu-central-1) angelegt
- [ ] Audit-Log-Tabelle existiert für sicherheitsrelevante Aktionen

## Edge Cases
- Was passiert wenn eine Organisation gelöscht wird? → CASCADE DELETE auf alle Daten dieser Org
- Was passiert wenn ein User zu mehreren Organisationen gehört? → Nicht erlaubt im MVP (1 User = 1 Org)
- Was passiert bei einem direkten Datenbank-Zugriff ohne RLS? → Alle Queries müssen über Supabase Client mit Auth-Context laufen
- Was passiert wenn `organization_id` NULL ist? → Datenbankconstraint verhindert Einfügen (NOT NULL)

## Technical Requirements
- Supabase Region: eu-central-1 (Frankfurt) — DSGVO-Pflicht
- RLS auf allen Tabellen: SELECT, INSERT, UPDATE, DELETE Policies
- Indexe auf `organization_id` in jeder Tabelle (Performance)
- `organizations` Tabelle hat Index auf `slug` (eindeutig, für URL-Routing)
- Alle personenbezogenen Daten: Soft-Delete-Felder (`is_deleted BOOLEAN DEFAULT FALSE`, `deleted_at TIMESTAMPTZ`)

## DSGVO-Relevanz
- Multi-Tenancy ist die technische Umsetzung der Datentrennung (Art. 32 DSGVO)
- Ohne korrekte RLS: Datenpanne = bis zu 20 Mio. € Strafe (Art. 83 DSGVO)
- Supabase EU-Region ist Pflicht (personenbezogene Daten nur in EU)

---

## Tech Design (Solution Architect)

### Übersicht
PROJ-1 hat keine Benutzeroberfläche — es ist reines Datenbankfundament. Kein Bildschirm, keine Buttons. Alles spielt sich unsichtbar in Supabase ab. Alle anderen Features (PROJ-2 bis PROJ-15) bauen darauf auf.

### Datenbankstruktur (4 Tabellen)

**Tabelle: organizations** (eine Zeile = eine Hausverwaltung)
- Eindeutige ID (UUID)
- Name der HV (z.B. "Müller Hausverwaltung GmbH")
- Slug (URL-freundlicher Kurzname, z.B. "mueller-hv", eindeutig)
- Plan ("standard" / "premium")
- Anzahl verwalteter Einheiten
- Erstellt am / Ist aktiv (ja/nein)

**Tabelle: profiles** (HV-Mitarbeiter-Profildaten)
- Eindeutige ID (UUID)
- Verknüpfung zu: welche Organisation? → `organization_id` (PFLICHT, nie leer)
- Vorname, Nachname
- Rolle: "hv_admin" oder "hv_mitarbeiter"
- Erstellt am / Soft-Delete Felder

**Tabelle: user_roles** (Rollenzuweisung)
- User-ID (verknüpft mit Supabase Auth Login)
- Organization-ID
- Rolle: "hv_admin" / "hv_mitarbeiter" / "mieter" / "platform_admin"

**Tabelle: audit_logs** (Sicherheitsprotokoll — DSGVO-Pflicht)
- Wer hat gehandelt? (user_id)
- Welche Organisation? (organization_id)
- Was wurde getan? (z.B. "login", "datensatz_gelöscht", "status_geändert")
- Wann? (Zeitstempel)
- Details (IP-Adresse, betroffene Datensatz-ID)

### Das Sicherheitssystem: RLS (Row Level Security)

**Funktionsprinzip — der automatische Türsteher:**
```
Jede Datenbank-Zeile hat einen unsichtbaren Stempel: "Gehört zu Org X"
Bei jeder Anfrage prüft Supabase automatisch:
  → "Bist du von Org X?" → Ja → Zeige Daten
                          → Nein → Zeige nichts (Zeile existiert für dich nicht)
```

Gilt für JEDE Tabelle des gesamten Projekts. Wird hier als Standard gesetzt.
Läuft auf Datenbankebene — kann durch App-Fehler NICHT umgangen werden.

### Technische Entscheidungen

| Entscheidung | Warum |
|-------------|-------|
| UUID als IDs | Nicht 1,2,3 — verhindert, dass Angreifer IDs anderer Orgs erraten |
| Soft-Delete | DSGVO: 7 Jahre Aufbewahrungspflicht. "Löschen" = unsichtbar machen |
| EU-Region Frankfurt | Gesetzliche Pflicht (DSGVO Art. 32) |
| Separate `profiles`-Tabelle | Supabase Auth kennt nur E-Mail/Passwort — Name + Rolle kommen hierher |
| `audit_logs`-Tabelle | § 54 DSG: sensible Aktionen protokollieren |

### Umsetzungsreihenfolge für `/backend`
1. Supabase-Projekt anlegen (Region: eu-central-1 Frankfurt — PFLICHT vor allem anderen)
2. Tabelle `organizations` anlegen + RLS aktivieren
3. Tabelle `profiles` anlegen + RLS aktivieren
4. Tabelle `user_roles` anlegen + RLS aktivieren
5. Tabelle `audit_logs` anlegen + RLS aktivieren
6. Supabase-Verbindungsdaten in `.env.local` eintragen
7. Sicherheitstest: 2 Test-Organisationen, cross-org Datenzugriff prüfen

### Keine neuen Pakete nötig
Supabase ist bereits installiert (`@supabase/supabase-js` in package.json). PROJ-1 ist reine Datenbankkonfiguration im Supabase Dashboard.

## QA Test Results

**Tested:** 2026-03-07
**Tester:** QA Engineer (AI)
**Method:** Database schema inspection, RLS policy audit, API route code review, TypeScript compilation check

### Acceptance Criteria Status

#### AC-1: Tabelle `organizations` existiert mit: id, name, slug, plan, einheiten_anzahl, created_at, is_active
- [x] Table exists with all required columns
- [x] Additional columns present: is_deleted, deleted_at, updated_at (good additions)
- [x] UUID primary key
- [x] slug has UNIQUE constraint
- [x] plan has CHECK constraint (standard/premium)
- [x] Defaults correct (is_active=true, is_deleted=false, plan=standard, einheiten_anzahl=0)

#### AC-2: Jede Tabelle mit personenbezogenen Daten hat eine `organization_id`-Spalte (NOT NULL)
- [x] `profiles.organization_id` — NOT NULL
- [x] `user_roles.organization_id` — NOT NULL
- [ ] **BUG-1:** `audit_logs.organization_id` — IS NULLABLE (should be NOT NULL per spec)

#### AC-3: Row Level Security ist auf JEDER Tabelle aktiviert
- [x] `organizations` — RLS enabled
- [x] `profiles` — RLS enabled
- [x] `user_roles` — RLS enabled
- [x] `audit_logs` — RLS enabled
- [x] Auto-RLS event trigger (`rls_auto_enable`) present for future tables — excellent

#### AC-4: Ein User einer Organisation kann KEINE Daten einer anderen Organisation lesen
- [x] All SELECT policies use `organization_id = get_user_organization_id()` filter
- [x] `get_user_organization_id()` function correctly queries profiles table with `is_deleted = FALSE`
- [x] Helper functions use SECURITY DEFINER (required to query other tables in RLS context)
- [ ] **BUG-2:** `relforcerowsecurity` is FALSE on all tables — table owner (postgres role) can bypass RLS

#### AC-5: Ein User einer Organisation kann KEINE Daten einer anderen Organisation schreiben
- [x] INSERT policies on profiles, user_roles check organization_id match
- [x] UPDATE policies check organization_id or require hv_admin role within same org
- [x] DELETE policies restricted to platform_admin or hv_admin within org
- [x] organizations INSERT/DELETE restricted to platform_admin only

#### AC-6: Soft-Delete implementiert: `is_deleted` + `deleted_at` Felder auf allen relevanten Tabellen
- [x] `organizations` — has is_deleted + deleted_at
- [x] `profiles` — has is_deleted + deleted_at
- [ ] **BUG-3:** `user_roles` — MISSING is_deleted and deleted_at columns
- [x] `audit_logs` — correctly has no soft-delete (audit logs should be immutable)

#### AC-7: Supabase-Projekt ist in EU-Region (Frankfurt / eu-central-1) angelegt
- [ ] **BUG-4:** Project region is `eu-north-1` (Stockholm), NOT `eu-central-1` (Frankfurt) as required by spec

#### AC-8: Audit-Log-Tabelle existiert fuer sicherheitsrelevante Aktionen
- [x] Table exists with: id, user_id, organization_id, action, entity_type, entity_id, details (jsonb), ip_address, created_at
- [x] No UPDATE or DELETE RLS policies — audit logs are effectively immutable via RLS
- [x] SELECT restricted to hv_admin of same org or platform_admin
- [x] INSERT allowed for authenticated users within their org

### Edge Cases Status

#### EC-1: Organisation geloescht — CASCADE DELETE auf alle Daten dieser Org
- [x] `profiles` FK → organizations: ON DELETE CASCADE
- [x] `user_roles` FK → organizations: ON DELETE CASCADE
- [ ] **BUG-5:** `audit_logs` FK → organizations: ON DELETE SET NULL (spec says CASCADE, but SET NULL is arguably better for audit trail preservation — needs design decision)

#### EC-2: User zu mehreren Organisationen — nicht erlaubt im MVP
- [x] `user_roles` has UNIQUE constraint on (user_id, organization_id) — prevents duplicate role per org
- [ ] **BUG-6:** No constraint preventing a user from having roles in MULTIPLE organizations. The unique constraint only prevents duplicate entries for the same org, not cross-org membership. A user could have rows for org A and org B.

#### EC-3: Direkter Datenbankzugriff ohne RLS
- [x] All API routes use `createServerSupabaseClient()` with anon key (RLS enforced)
- [x] Admin client (`createAdminClient()`) exists but is NOT used in any API route — good
- [x] Service role key stored in non-NEXT_PUBLIC env var (not exposed to browser)

#### EC-4: organization_id NULL — Datenbankconstraint verhindert Einfuegen
- [x] profiles: NOT NULL constraint on organization_id
- [x] user_roles: NOT NULL constraint on organization_id
- [ ] See BUG-1: audit_logs allows NULL organization_id

### Security Audit Results (Red Team)

#### Authentication
- [x] All API routes check `supabase.auth.getUser()` before processing
- [x] 401 returned for unauthenticated requests
- [x] Server-side Supabase client uses cookies (not client-side tokens)

#### Authorization
- [x] RLS policies enforce tenant isolation at database level
- [x] Organization CRUD restricted to platform_admin (INSERT/DELETE) and hv_admin (UPDATE)
- [x] Profile updates restricted to own profile or hv_admin of same org
- [x] Audit logs read-only for hv_admin, no delete possible

#### Input Validation
- [x] Zod schemas validate all POST/PATCH inputs server-side
- [x] Slug regex prevents injection: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
- [x] String length limits on name (200), slug (100), first_name (100), last_name (100)
- [x] Plan field restricted to enum values
- [x] einheiten_anzahl validated as non-negative integer

#### Data Exposure
- [x] Error responses do not leak internal details (generic German error messages)
- [x] Supabase errors logged server-side only (`console.error`)
- [ ] **BUG-7:** `.env.local` contains `SUPABASE_SERVICE_ROLE_KEY` — verify `.gitignore` includes `.env.local`

#### Rate Limiting
- [ ] **BUG-8:** No rate limiting on any API endpoint. Rapid requests could overwhelm the database.

#### Additional Security Observations
- [x] `is_platform_admin()` function uses SECURITY DEFINER — correct for RLS helper
- [x] Duplicate slug handled with 409 response (unique constraint violation)
- [x] Soft-delete on organization also sets `is_active = false` — defense in depth
- [x] Audit logging on create, update, delete operations — good traceability

### Bugs Found

#### BUG-1: audit_logs.organization_id is NULLABLE
- **Severity:** Medium
- **Details:** The spec requires `organization_id` NOT NULL on every table with person-related data. `audit_logs.organization_id` allows NULL. This could allow audit entries without tenant association, making it harder to track which org an action belongs to.
- **Priority:** Fix before deployment

#### BUG-2: FORCE ROW LEVEL SECURITY not enabled
- **Severity:** Medium
- **Details:** `relforcerowsecurity` is FALSE on all 4 tables. While the anon key enforces RLS, the postgres/service_role could bypass it. Running `ALTER TABLE x FORCE ROW LEVEL SECURITY` would close this gap for defense-in-depth.
- **Priority:** Fix before deployment

#### BUG-3: user_roles table missing soft-delete fields
- **Severity:** Medium
- **Details:** The spec requires `is_deleted` + `deleted_at` on all relevant tables. `user_roles` has neither. This means role assignments cannot be soft-deleted, violating DSGVO retention requirements.
- **Priority:** Fix before deployment

#### BUG-4: Wrong Supabase region (eu-north-1 instead of eu-central-1)
- **Severity:** High
- **Details:** The project is in `eu-north-1` (Stockholm). The spec and DSGVO rules explicitly require `eu-central-1` (Frankfurt). While both are EU regions and DSGVO-compliant, the spec is explicit about Frankfurt. Changing region requires creating a new project and migrating data.
- **Note:** Stockholm IS within the EU, so this is not a DSGVO violation per se, but it contradicts the explicit spec requirement. If the team accepts eu-north-1, this can be downgraded to Low.
- **Priority:** Design decision needed — accept eu-north-1 or recreate project

#### BUG-5: audit_logs FK uses SET NULL instead of CASCADE
- **Severity:** Low
- **Details:** When an organization is deleted, audit_logs.organization_id is set to NULL instead of cascading the delete. This is arguably better than CASCADE (preserves audit trail), but contradicts the spec which says "CASCADE DELETE auf alle Daten dieser Org".
- **Priority:** Design decision needed

#### BUG-6: No constraint preventing multi-org membership
- **Severity:** Medium
- **Details:** The spec states "1 User = 1 Org" in MVP. The UNIQUE constraint on `user_roles(user_id, organization_id)` only prevents duplicate roles within one org, but a user could still be added to multiple organizations. A UNIQUE constraint on just `user_id` in the `user_roles` table (or a partial unique index) is needed.
- **Priority:** Fix before deployment

#### BUG-7: ~~Verify .env.local is gitignored~~ VERIFIED OK
- **Severity:** Non-issue
- **Details:** `.env.local` is covered by `.env*.local` pattern in `.gitignore` (line 29). Service role key will not be committed.

#### BUG-8: No rate limiting on API endpoints
- **Severity:** Medium
- **Details:** All API routes (`/api/organizations`, `/api/profiles`, `/api/audit-logs`) lack rate limiting. An attacker could flood these endpoints.
- **Priority:** Fix in next sprint (can use middleware-based rate limiting)

### Summary
- **Acceptance Criteria:** 6/8 passed (AC-2, AC-6, AC-7 partially failed)
- **Bugs Found:** 7 actionable (1 high, 4 medium, 2 low/design decisions). BUG-7 verified as non-issue.
- **Security:** RLS policies are well-designed. Helper functions use SECURITY DEFINER correctly. Input validation with Zod is solid. Rate limiting missing.
- **Production Ready:** NO
- **Recommendation:** Fix BUG-1, BUG-2, BUG-3, BUG-6 before deployment. Make design decisions on BUG-4 and BUG-5. Schedule BUG-8 for next sprint.

## Deployment
_To be added by /deploy_
