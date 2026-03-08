# PROJ-9: Automatische Werkstattkommunikation via n8n

## Status: Planned
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-8 (n8n Webhook-Integration) — n8n muss konfiguriert sein
- Requires: PROJ-6 (Case-Management HV) — Handwerker-Zuweisung kommt von hier

## Beschreibung
Wenn ein HV-Mitarbeiter einem Fall einen Handwerker zuweist, löst das automatisch eine E-Mail an den Handwerker aus (via n8n). Die E-Mail enthält alle relevanten Informationen: Adresse, Schadenbeschreibung, Fotos (als Links), Dringlichkeit und Kontakt des Mieters. HV-Mitarbeiter müssen keine E-Mails mehr manuell schreiben.

## User Stories
- Als HV-Mitarbeiter möchte ich, dass der Handwerker automatisch per E-Mail benachrichtigt wird wenn ich ihn einem Fall zuweise, damit ich keine manuelle E-Mail schreiben muss.
- Als Handwerker möchte ich eine strukturierte E-Mail mit allen relevanten Informationen erhalten (Adresse, Schaden, Fotos, Mieter-Kontakt), damit ich gut vorbereitet anreisen kann.
- Als HV-Mitarbeiter möchte ich eine Kopie der Handwerker-E-Mail erhalten, damit ich weiß was kommuniziert wurde.
- Als HV-Mitarbeiter möchte ich den E-Mail-Text vor dem Versand in der App kurz überprüfen und ggf. anpassen, damit keine falschen Informationen rausgehen.
- Als HV-Mitarbeiter möchte ich sehen ob die E-Mail an den Handwerker erfolgreich versendet wurde.

## Acceptance Criteria
- [ ] Bei Handwerker-Zuweisung + Speichern: Webhook an n8n mit Handwerker-Kontaktdaten
- [ ] n8n generiert E-Mail mit: Betreff (Fallnummer + Adresse), Schadensbeschreibung, Dringlichkeit, Adresse der Einheit, Fotos als Signed-URL-Links (48h gültig), Mieter-Name + Telefon (falls hinterlegt), Wunschtermin des Mieters
- [ ] Vorschau-Option im HV-Portal: "E-Mail-Vorschau anzeigen" bevor gesendet wird
- [ ] Manueller Versand: HV kann auch selbst auf "Handwerker informieren" klicken (nicht nur bei Zuweisung)
- [ ] CC an zuständigen HV-Mitarbeiter
- [ ] Versandstatus im Fall sichtbar: "E-Mail gesendet am [Datum]"
- [ ] Handwerker kann per Reply-To antworten (geht an HV-Mitarbeiter, nicht an Mieter)

## Edge Cases
- Was passiert wenn der Handwerker keine E-Mail-Adresse hat? → Pflichtfeld bei Zuweisung, Warnung wenn leer
- Was passiert wenn Fotos-Links bei E-Mail-Versand schon abgelaufen sind? → Signed URLs mit 48h Laufzeit extra für Handwerker-E-Mails generiert
- Was passiert wenn die Handwerker-E-Mail bounced? → n8n-Fehler → Webhook-Log → HV-Mitarbeiter bekommt Fehlermeldung im Portal
- Was passiert wenn HV Handwerker ändert nach bereits gesendeter E-Mail? → Neuer Handwerker bekommt neue E-Mail, alter Handwerker bekommt Storno-E-Mail
- Was passiert wenn mehrere Handwerker für einen Fall zugewiesen werden? → MVP: nur 1 Handwerker pro Fall

## Technical Requirements
- Webhook-Event: `handwerker_zugewiesen` mit Handwerker-Daten im Payload
- Signed URLs für Fotos: 48 Stunden Laufzeit (extra generiert für diesen Zweck)
- E-Mail-Template: HTML-Format, professionelles Design, Logo der Plattform
- Reply-To: E-Mail-Adresse des zuständigen HV-Mitarbeiters
- Versandlog: In Webhook-Log-Tabelle (PROJ-8)

## DSGVO-Relevanz
- Mieter-Kontaktdaten werden an Handwerker weitergegeben → Rechtsgrundlage: Art. 6 Abs. 1 lit. b
- Handwerker sind ggf. eigene Auftragsverarbeiter → Im AVV der HV mit Handwerker zu regeln (Hinweis an HV)
- Fotos: nur via Signed URLs, nie permanente öffentliche Links

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
