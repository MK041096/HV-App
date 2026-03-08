# PROJ-7: Mieterübersicht & -verwaltung (HV-Portal)

## Status: In Progress
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-2 (HV-Authentifizierung)
- Requires: PROJ-3 (Mieter-Registrierung) — Mieter müssen existieren

## Beschreibung
Verwaltungsbereich im HV-Portal für alle Mieter der Organisation. HV-Mitarbeiter sehen alle Wohneinheiten, welche Mieter registriert sind, können Aktivierungscodes generieren und Mieterprofile einsehen. Kein Mieter kann hier direkten Zugang erhalten — alles läuft über den HV-Mitarbeiter.

## User Stories
- Als HV-Mitarbeiter möchte ich alle Wohneinheiten meiner Organisation sehen (mit/ohne registriertem Mieter), damit ich den Überblick über mein Portfolio habe.
- Als HV-Mitarbeiter möchte ich für eine Wohneinheit einen Aktivierungscode generieren, damit der Mieter sich registrieren kann.
- Als HV-Mitarbeiter möchte ich sehen welche Mieter bereits registriert sind und welche nicht, damit ich das Onboarding steuern kann.
- Als HV-Mitarbeiter möchte ich einen Mieter-Account deaktivieren (z.B. nach Auszug), damit Ex-Mieter keinen Zugriff mehr haben.
- Als HV-Mitarbeiter möchte ich die Schadensmeldungshistorie eines Mieters einsehen, damit ich beim nächsten Gespräch vorbereitet bin.

## Acceptance Criteria
- [ ] Übersicht aller Wohneinheiten der Organisation (Adresse, Einheit, Stockwerk/Tür)
- [ ] Status pro Einheit: Kein Mieter registriert / Registrierung ausstehend / Aktiver Mieter
- [ ] Aktivierungscode generieren: Button pro Einheit → Code wird angezeigt (einmalig, dann nur Hash gespeichert)
- [ ] Code per E-Mail an Mieter senden (Freitext-E-Mail mit Code, aus der App heraus)
- [ ] Mieter-Detailprofil: Name, E-Mail, Registrierungsdatum, Anzahl Schadensmeldungen, letzter Login
- [ ] Mieter deaktivieren: Account wird gesperrt, Mieter kann sich nicht mehr einloggen
- [ ] Mieter-Schadensmeldungshistorie: Link zur gefilterten Case-Ansicht für diesen Mieter
- [ ] Wohneinheiten können manuell angelegt werden (Adresse + Einheitsnummer)
- [ ] Massenimport von Wohneinheiten via CSV (P1, nicht MVP)

## Edge Cases
- Was passiert wenn eine Wohneinheit gelöscht wird? → Soft-Delete: Daten bleiben für 7 Jahre (steuerliche Aufbewahrung), Einheit als "inaktiv" markiert
- Was passiert wenn ein Mieter seinen Account selbst löschen möchte? → DSGVO-Recht auf Löschung: HV wird informiert, Account wird nach 30 Tagen gelöscht (Soft-Delete)
- Was passiert wenn zwei HV-Mitarbeiter gleichzeitig für dieselbe Einheit einen Code generieren? → Letzter Code gilt, vorheriger wird ungültig
- Was passiert bei einer sehr großen Organisation (1500 Einheiten)? → Pagination (50 pro Seite) + Suchfunktion nach Adresse/Einheit
- Was passiert wenn der Code-Versand per E-Mail fehlschlägt? → Fehlermeldung + Code wird trotzdem angezeigt zum manuellen Weitergeben

## Technical Requirements
- Tabelle `units` (Wohneinheiten): id, organization_id, adresse, einheit_nr, stockwerk, is_active
- Tabelle `activation_codes`: Verweis aus PROJ-3, hier nur Verwaltung
- Pagination: 50 Einheiten pro Seite
- E-Mail-Versand: Supabase Auth E-Mail oder einfaches SMTP (für MVP)
- Suche: Full-Text-Search auf Adresse + Einheit-Nummer

## DSGVO-Relevanz
- Mieter-Deaktivierung ≠ Datenlöschung (Aufbewahrungspflichten bleiben)
- Löschanfragen: 30-Tage-Frist per DSGVO Art. 17 dokumentieren
- HV-Mitarbeiter sieht Mieter-E-Mail-Adressen — Datenschutzhinweis im UI

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
