# PROJ-14: Subscription & Billing (Stripe, pro Einheit)

## Status: Planned
**Created:** 2026-03-07
**Last Updated:** 2026-03-07

## Dependencies
- Requires: PROJ-13 (HV-Onboarding) — Organisationen müssen existieren

## Beschreibung
Automatisierte Abrechnung über Stripe. Jede Hausverwaltung zahlt monatlich oder jährlich pro verwalteter Einheit. Das System erkennt automatisch die Einheitenanzahl, stellt Rechnungen aus und verwaltet Kündigungen und Plan-Änderungen.

## User Stories
- Als Plattformbetreiber möchte ich, dass Hausverwaltungen automatisch abgerechnet werden (pro Einheit/Monat), damit ich keine manuellen Rechnungen schreiben muss.
- Als HV-Admin möchte ich meine aktuellen Abrechnungsdaten und Rechnungen im Portal einsehen.
- Als HV-Admin möchte ich meinen Plan upgraden/downgraden können (z.B. Einheitenanzahl erhöhen).
- Als HV-Admin möchte ich kündigen können und dabei die 30-Tage-Geld-zurück-Garantie in Anspruch nehmen.
- Als Plattformbetreiber möchte ich Gründungskundenpreise automatisch auf reguläre Preise umstellen nach Ablauf des ersten Jahres.

## Acceptance Criteria
- [ ] Stripe-Integration: Subscriptions, Invoices, Payment Methods
- [ ] Pricing: 1,00 €/Einheit/Monat (regulär), 0,50 €/Einheit/Monat (Gründungspreis Jahr 1)
- [ ] Jahresabo: 0,85 €/Einheit/Monat (regulär), 0,43 €/Einheit/Monat (Gründungspreis)
- [ ] Einrichtungsgebühr: 699 € einmalig (One-Time Payment via Stripe)
- [ ] 30-Tage-Geld-zurück: verzögerte Abbuchung (Karte hinterlegen, Abbuchung nach 30 Tagen)
- [ ] Automatische Preisumstellung nach Jahr 1 für Gründungskunden
- [ ] Rechnungsübersicht im HV-Portal: alle Rechnungen downloadbar
- [ ] Webhook von Stripe: payment_succeeded, payment_failed, subscription_cancelled
- [ ] Bei Zahlungsausfall: E-Mail-Benachrichtigung + 14-Tage-Karenz vor Sperrung
- [ ] Kündigung im Portal: sofortige Bestätigung, Zugang bis Ende Abrechnungsperiode

## Edge Cases
- Was passiert wenn eine HV ihre Einheitenanzahl erhöht (mehr Mieter)? → Automatisches Proration in Stripe
- Was passiert bei dauerhaftem Zahlungsausfall? → Konto nach 14 Tagen eingeschränkt (nur Lesen), nach 30 Tagen gesperrt (DSGVO: Daten bleiben gespeichert)
- Was passiert wenn die Gründungskundenperiode endet? → 30 Tage vorher E-Mail-Warnung, dann automatische Preisanpassung via Stripe

## Technical Requirements
- Stripe Customer Portal für Self-Service (Plan, Zahlungsmethode, Kündigung)
- Stripe Webhooks: `/api/stripe/webhook` (signiert)
- Metered Billing oder Flat-Rate-per-Unit (je nach Stripe-Konfiguration)
- Rechnungen: Stripe generiert PDFs automatisch

## DSGVO-Relevanz
- Stripe als Sub-Auftragsverarbeiter im AVV aufführen
- Zahlungsdaten: nur bei Stripe, nie in eigenem System gespeichert
- Rechnungen enthalten personenbezogene Daten (Name, Adresse) → 7 Jahre Aufbewahrung (§ 132 BAO)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
