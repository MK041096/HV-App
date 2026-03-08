# PROJ-3: Mieter-Registrierung per Aktivierungscode

## Status: In Progress
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-1 (Organisation & Multi-Tenancy)
- Requires: PROJ-2 (HV-Authentifizierung) — HV-Mitarbeiter erstellt Aktivierungscodes

## Beschreibung
Mieter können sich nicht frei registrieren — nur per eindeutigem Aktivierungscode, den die Hausverwaltung vorab für sie erstellt. Der Code ist an eine Wohneinheit geknüpft und kann nur einmal verwendet werden. So ist sichergestellt, dass nur echte Mieter der jeweiligen HV Zugang erhalten.

## User Stories
- Als HV-Mitarbeiter möchte ich für einen Mieter einen Aktivierungscode generieren, damit nur dieser Mieter sich registrieren kann.
- Als Mieter möchte ich mich mit meinem Aktivierungscode registrieren, ohne dass mir ein Passwort zugeteilt wird — ich wähle es selbst.
- Als Mieter möchte ich nach der Registrierung sofort auf mein Dashboard zugreifen können.
- Als HV-Mitarbeiter möchte ich sehen welche Mieter bereits registriert sind und welche nicht, damit ich nachfassen kann.
- Als HV-Mitarbeiter möchte ich einen abgelaufenen oder ungenutzten Code deaktivieren können.

## Acceptance Criteria
- [ ] HV-Mitarbeiter kann Aktivierungscode für eine Wohneinheit generieren (im HV-Portal)
- [ ] Aktivierungscode ist eindeutig, zufällig generiert (min. 8 Zeichen, alphanumerisch)
- [ ] Jeder Code kann nur EINMAL verwendet werden (nach Registrierung: status = 'used')
- [ ] Code hat Ablaufdatum (Standard: 30 Tage nach Erstellung, konfigurierbar)
- [ ] Mieter-Registrierungsformular: Code eingeben → E-Mail → Passwort → Bestätigen
- [ ] Nach Registrierung ist Mieter automatisch der richtigen Organisation und Wohneinheit zugeordnet
- [ ] HV-Mitarbeiter sieht Status aller Codes: ausstehend / registriert / abgelaufen
- [ ] HV-Mitarbeiter kann Code deaktivieren (bevor er genutzt wird)
- [ ] Registrierung mit abgelaufenem/ungültigem Code zeigt klare Fehlermeldung

## Edge Cases
- Was passiert wenn ein Mieter auszieht und ein neuer einzieht? → Neuer Code generieren, alter Code deaktivieren (Mieter-Account bleibt mit Soft-Delete, Daten bleiben für 3 Jahre per DSGVO-Frist)
- Was passiert wenn der Mieter seinen Code verliert? → HV kann neuen Code generieren (alter wird ungültig)
- Was passiert wenn jemand versucht Codes zu erraten (Brute Force)? → Rate Limiting: max. 5 Fehlversuche pro IP / 10 min
- Was passiert wenn zwei Mieter denselben Code gleichzeitig nutzen? → Datenbank-Lock / First-Write-Wins, zweiter erhält Fehlermeldung
- Was passiert wenn der Mieter die E-Mail-Verifizierung nicht abschließt? → Konto inaktiv bis Verifizierung, Code bleibt "reserved" für 24h dann wieder verfügbar

## Technical Requirements
- Aktivierungscodes: kryptographisch sicher generiert (crypto.randomBytes)
- Codes werden NICHT im Klartext gespeichert wenn möglich (Hash + Salt)
- Separate Tabelle `activation_codes` mit: id, organization_id, unit_id, code_hash, status, expires_at, used_by, used_at
- Mieter-Accounts: eigene Rolle in Supabase Auth (`role: 'tenant'`)
- Nach Registrierung: Mieter kann NUR eigene Daten sehen (RLS basiert auf user_id)

## DSGVO-Relevanz
- Aktivierungscode-System verhindert unberechtigte Datenerhebung (Art. 5 Abs. 1 lit. b)
- Mieter-Registrierung: Datenschutzerklärung muss vor Abschluss akzeptiert werden (Art. 13 DSGVO)
- E-Mail ist personenbezogenes Datum — nur für Auth-Zwecke verwendet

---

## Tech Design (Solution Architect)

### Database Tables
- **`units`** - Wohneinheiten (id, organization_id, name, address, floor, soft-delete)
- **`activation_codes`** - Codes (id, organization_id, unit_id, code (plaintext), status, expires_at, used_by, used_at, reserved_at, created_by)
- **`rate_limit_attempts`** - Generalized rate limiting (action, identifier, success, created_at)
- **`profiles.unit_id`** - New column linking tenant to their unit

### Database Functions
- `check_rate_limit(action, identifier, max_attempts, window_minutes)` - Generalized rate limiter
- `record_rate_limit_attempt(action, identifier, success)` - Record attempts
- `expire_activation_codes()` - Cron-callable function to expire stale codes

### API Endpoints
- `GET/POST /api/units` - List/create units (HV staff, RLS-protected)
- `GET/PATCH/DELETE /api/units/:id` - Unit CRUD (HV staff)
- `GET/POST /api/activation-codes` - List/generate codes (HV staff, RLS-protected)
- `GET/PATCH /api/activation-codes/:id` - View/deactivate code (HV staff)
- `POST /api/activation-codes/validate` - Public, rate-limited code validation
- `POST /api/auth/register-tenant` - Public, rate-limited tenant registration

### Design Decisions
- Codes stored in **plaintext** (HV needs to look up and resend codes)
- Proper **`units` table** created now (needed for PROJ-7)
- **Generalized `check_rate_limit`** function replaces login-specific rate limiting
- Code generation uses `crypto.randomBytes` with confusing-char-free alphabet (no I/1/O/0)
- Concurrent registration handled via optimistic locking (status = 'reserved')
- Auto-confirm email on registration (activation code serves as verification)

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
