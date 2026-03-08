# PROJ-13: HV-Onboarding & Aktivierungscode-Generator (Plattform-Admin)

## Status: Planned
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-2 (HV-Authentifizierung)
- Requires: PROJ-1 (Organisation & Multi-Tenancy)

## Beschreibung
Als Plattformbetreiber (du) musst du neue Hausverwaltungen als Kunden anlegen können. Dieser Flow umfasst: Organisation erstellen, ersten HV-Admin-Account anlegen, Einheiten importieren und die HV in ihre neue Plattform einführen. Ziel: Onboarding einer neuen HV unter 30 Minuten.

## User Stories
- Als Plattformbetreiber möchte ich eine neue Hausverwaltung mit wenigen Klicks anlegen (Organisation + Admin-Account), damit das Onboarding effizient läuft.
- Als Plattformbetreiber möchte ich der neuen HV einen temporären Admin-Zugang schicken, damit sie sich selbst einloggen und die Plattform erkunden können.
- Als neuer HV-Admin möchte ich beim ersten Login durch einen Setup-Wizard geführt werden (Profil, Einheiten importieren), damit ich schnell produktiv bin.
- Als Plattformbetreiber möchte ich Einheiten einer HV per CSV importieren, damit ich nicht 500 Einheiten manuell anlegen muss.
- Als Plattformbetreiber möchte ich einen Überblick aller Kunden-Organisationen und deren Status sehen.

## Acceptance Criteria
- [ ] Plattform-Admin-Bereich (nur für Betreiber zugänglich, separate Rolle)
- [ ] Neue Organisation anlegen: Name, Adresse, Einheitenanzahl, Plan, Ansprechpartner
- [ ] Automatische Generierung eines temporären Passworts für den ersten HV-Admin
- [ ] Onboarding-E-Mail an HV-Admin mit Login-Link + temporärem Passwort
- [ ] CSV-Import für Wohneinheiten: Adresse, Einheit-Nr, Stockwerk (Template bereitgestellt)
- [ ] Setup-Wizard für neuen HV-Admin: Passwort ändern → Profil vervollständigen → Erste Einheit anlegen → Ersten Mieter einladen
- [ ] Kunden-Übersicht im Admin-Bereich: alle Orgs, Einheitenanzahl, aktive Mieter, letzter Login, Plan
- [ ] Organisation deaktivieren (bei Kündigung): Mieter können sich nicht mehr einloggen, Daten bleiben

## Edge Cases
- Was passiert wenn der CSV-Import fehlerhafte Daten enthält? → Zeile-für-Zeile Validierung, Fehlerreport mit Zeilennummern
- Was passiert wenn der erste HV-Admin das temporäre Passwort nicht ändert? → Erinnerungsmail nach 3 Tagen
- Was passiert wenn eine Organisation mit Daten gelöscht werden soll? → Nur Deaktivierung möglich (DSGVO Aufbewahrungspflichten), kein Hard-Delete
- Was passiert bei einer großen CSV (1500 Einheiten)? → Asynchroner Import mit Fortschrittsanzeige

## Technical Requirements
- Plattform-Admin-Rolle: separater Supabase Auth User mit Rolle `platform_admin`
- CSV-Import: serverseitig verarbeitet, max. 2000 Zeilen
- Temporäres Passwort: zufällig generiert, min. 12 Zeichen, Ablauf nach 7 Tagen
- Admin-Bereich unter `/admin` — nicht verlinkter, nur für Betreiber bekannter Pfad

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
