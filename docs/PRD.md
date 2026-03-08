# Product Requirements Document

## Vision

SchadensMelder ist eine mandantenfähige SaaS-Plattform, die Hausverwaltungen in Österreich den gesamten Prozess der Schadensmeldungsabwicklung digitalisiert und automatisiert. Mieter melden Schäden über ein Self-Service-Portal, die Hausverwaltung bearbeitet sie in einem strukturierten Case-Management — von der Ersatzmeldung bis zur automatisch befüllten Versicherungsdokumentation. Ziel ist: ein HV-Mitarbeiter benötigt für eine Schadensmeldung maximal 3 manuelle Klicks.

## Target Users

### Primär: Hausverwaltungs-Mitarbeiter (Sachbearbeiter/Objektbetreuer)
- Verwalten 200–1.500 Einheiten täglich
- Werden aktuell mit E-Mails, WhatsApp-Nachrichten und Telefonanrufen von Mietern überschwemmt
- Nutzen Excel, Outlook und oft teure, unübersichtliche ERP-Systeme (Immoware, Domus)
- Pain Points: Informationen verteilt auf viele Kanäle, keine Statusverfolgung, manuelle Dokumentation für Versicherungen, kein strukturiertes Handwerker-Management

### Sekundär: Mieter
- Wollen einfach und schnell einen Schaden melden, ohne Telefon oder E-Mail
- Wollen jederzeit den Status ihrer Meldung sehen
- Technisch unterschiedlich versiert (App muss sehr einfach bedienbar sein)

### Tertiär: Handwerker / Dienstleister
- Werden per automatischer E-Mail/Nachricht (n8n) über neue Aufträge informiert
- Kein eigener Login im MVP

## Core Features (Roadmap)

| Priority | ID | Feature | Status |
|----------|----|---------|--------|
| P0 (MVP) | PROJ-1 | Organisation & Multi-Tenancy Grundstruktur | Planned |
| P0 (MVP) | PROJ-2 | HV-Authentifizierung (Login/Logout) | Planned |
| P0 (MVP) | PROJ-3 | Mieter-Registrierung per Aktivierungscode | Planned |
| P0 (MVP) | PROJ-4 | Schadensmeldung erstellen (Mieter-Portal) | Planned |
| P0 (MVP) | PROJ-5 | Schadensmeldungs-Dashboard Mieter (Status-Tracking) | Planned |
| P0 (MVP) | PROJ-6 | Case-Management Dashboard HV (Übersicht & Bearbeitung) | Planned |
| P0 (MVP) | PROJ-7 | Mieterübersicht & -verwaltung (HV-Portal) | Planned |
| P1 | PROJ-8 | n8n Webhook-Integration & E-Mail-Benachrichtigungen | Planned |
| P1 | PROJ-9 | Automatische Werkstattkommunikation via n8n | Planned |
| P1 | PROJ-10 | Automatische Versicherungsdatenblatt-Befüllung | Planned |
| P1 | PROJ-11 | Dokumentenablage (Mietverträge, Rechnungen, Versicherungsblätter) | Planned |
| P1 | PROJ-12 | KI-Mietvertragsanalyse (Claude API) | Planned |
| P2 | PROJ-13 | HV-Onboarding & Aktivierungscode-Generator | Planned |
| P2 | PROJ-14 | Subscription & Billing (Stripe, pro Einheit) | Planned |
| P2 | PROJ-15 | DSGVO-Betroffenenrechte (Datenexport & Löschung) | Planned |

## Pricing Model

- **Einrichtungsgebühr:** 699 € einmalig (349 € für erste 3 Gründungskunden)
- **Laufend:** 1,00 € / Einheit / Monat (0,50 € Gründungspreis Jahr 1)
- **Jahresabo:** 0,85 € / Einheit / Monat (0,43 € Gründungspreis)
- **30-Tage Geld-zurück-Garantie** (verzögerte Abbuchung, 0 € Rückbuchungsrisiko)

## Success Metrics

- **3 zahlende Gründungskunden** innerhalb von 8 Wochen nach Launch
- **Zeit pro Schadensmeldung (HV-Seite):** < 3 Minuten (vs. ~20 Minuten heute)
- **Mieter-Adoption:** > 70% der Mieter nutzen Portal nach 3 Monaten
- **Churn-Rate:** < 5% monatlich nach 6 Monaten
- **NPS (Net Promoter Score):** > 40 nach ersten 3 Monaten

## Tech Stack

| Komponente | Technologie | Begründung |
|------------|-------------|------------|
| Frontend | Next.js 16 + TypeScript | App Router, SSR, TypeScript-Sicherheit |
| UI | Tailwind CSS + shadcn/ui | Professionelles Design, schnelle Entwicklung |
| Datenbank & Auth | Supabase (EU-Region Frankfurt) | PostgreSQL, RLS, Auth, Storage — DSGVO-konform |
| Automatisierung | n8n (selbst gehostet) | Workflows: Benachrichtigungen, Handwerker, Versicherung |
| KI-Analyse | Claude API (Anthropic) | Mietvertragsanalyse, Schadensklassifizierung |
| Deployment | Vercel (EU) | Einfaches Deployment, Auto-Scaling |
| Payments | Stripe (P2) | Pro-Einheit Abrechnung |

## Constraints

- **Team:** Solo-Entwickler mit KI-Unterstützung (Claude Code)
- **Timeline:** MVP (PROJ-1 bis PROJ-7) in 4–6 Wochen angestrebt
- **Budget:** Minimale laufende Kosten (Supabase Free/Pro, Vercel Hobby/Pro, n8n Self-Hosted)
- **Markt:** Österreich primär, DACH-Raum sekundär
- **Rechtlich:** DSGVO + österreichisches DSG vollständig einhalten (siehe `.claude/rules/dsgvo-austria.md`)
- **Technisch:** n8n selbst gehostet (eigener Server erforderlich für P1-Features)

## Non-Goals (explizit NICHT in dieser Version)

- Kein eigenes Handwerker-Portal (Handwerker bekommen nur E-Mails via n8n)
- Keine Mietzahlungs- oder Buchhaltungsfunktionen
- Keine mobile App (Native iOS/Android) — responsive Web reicht
- Kein eigenes Videochat oder Live-Support-System
- Keine Integration mit bestehenden ERP-Systemen (Immoware, Domus) im MVP
- Kein Multi-Language-Support (nur Deutsch)
- Keine KI-Bildanalyse von Schadensfotos im MVP

---

*Erstellt: 2026-03-07 | Status: In Entwicklung | Nächstes Review: nach PROJ-7 (MVP)*
