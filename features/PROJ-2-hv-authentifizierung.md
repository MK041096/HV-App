# PROJ-2: HV-Authentifizierung (Login/Logout)

## Status: In Progress
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-1 (Organisation & Multi-Tenancy) — User muss einer Organisation zugeordnet sein

## Beschreibung
Login- und Logout-Funktionalität für Hausverwaltungs-Mitarbeiter. Sichere E-Mail/Passwort-Authentifizierung über Supabase Auth. Nach Login landet der Mitarbeiter im HV-Dashboard seiner Organisation.

## User Stories
- Als HV-Mitarbeiter möchte ich mich mit E-Mail und Passwort einloggen, damit ich auf das HV-Dashboard zugreifen kann.
- Als HV-Mitarbeiter möchte ich eingeloggt bleiben (Session), damit ich nicht bei jedem Besuch neu einloggen muss.
- Als HV-Mitarbeiter möchte ich mich ausloggen können, damit andere Personen an meinem Gerät keinen Zugriff haben.
- Als HV-Mitarbeiter möchte ich mein Passwort zurücksetzen können, wenn ich es vergessen habe.
- Als Plattformbetreiber möchte ich, dass nur verifizierte E-Mail-Adressen sich einloggen können, damit keine gefakten Accounts entstehen.

## Acceptance Criteria
- [ ] Login-Formular mit E-Mail + Passwort und Validierung
- [ ] Fehlermeldung bei falschem Passwort (ohne Hinweis welches Feld falsch ist — Security Best Practice)
- [ ] Nach erfolgreichem Login: Weiterleitung zum HV-Dashboard `/dashboard`
- [ ] Session bleibt über Browser-Neustart erhalten (Supabase persistiert Session)
- [ ] Logout-Button löscht Session und leitet auf `/login` weiter
- [ ] Passwort-Reset via E-Mail funktioniert (Supabase built-in)
- [ ] Geschützte Routen: Zugriff auf `/dashboard/*` ohne Login leitet auf `/login` weiter
- [ ] Rate Limiting auf Login-Endpunkt (max. 10 Versuche / 15 min pro IP)
- [ ] E-Mail-Verifizierung bei Erstregistrierung erforderlich

## Edge Cases
- Was passiert bei abgelaufener Session? → Automatische Weiterleitung zu `/login`
- Was passiert wenn ein User zu keiner Organisation gehört? → Fehlermeldung + Kontakt-Hinweis
- Was passiert bei mehrfachem Tab-Login mit verschiedenen Accounts? → Session pro Tab, kein Konflikt
- Was passiert wenn die Passwort-Reset-Mail nicht ankommt? → "E-Mail erneut senden" Button (nach 60s)
- Was passiert bei Login auf einem geteilten Gerät? → Expliziter Logout-Hinweis nach Login

## Technical Requirements
- Supabase Auth (E-Mail/Passwort) — kein Social-Login im MVP
- Middleware in Next.js prüft Auth-Status auf allen `/dashboard/*` Routen
- Passwörter: min. 8 Zeichen, Supabase handled Hashing (bcrypt)
- HTTPS obligatorisch (Vercel stellt das sicher)
- Session-Token im HttpOnly Cookie (Supabase default)

## DSGVO-Relevanz
- Authentifizierungslogs: wann hat wer sich eingeloggt (Audit-Trail, § 54 DSG)
- Passwort-Reset: E-Mail-Adresse ist personenbezogenes Datum (Art. 6 Abs. 1 lit. b DSGVO)
- Rate Limiting: Schutz gegen Brute-Force (Art. 32 DSGVO — Datensicherheit)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
