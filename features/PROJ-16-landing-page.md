# PROJ-16: Öffentliche Landing-Page für Kundengewinnung

## Overview
Erstelle eine professionelle, responsive Landing-Page für die Marke **Zerodamage.de** als Einstiegspunkt für Hausverwaltungen. Die Seite dient ausschließlich der Kundengewinnung, präsentiert das Angebot, stellt das Gründerteam vor und ermöglicht das Buchen bzw. Starten eines kostenlosen Tests. Potenzielle Kunden können auf der Domain zerodamage.de alles "buchen", was sie benötigen. Bereits eingeloggte Nutzer werden automatisch zum Dashboard weitergeleitet.

## User Stories

### Als potenzieller HV-Kunde
- möchte ich auf der Startseite sofort verstehen, was SchadensMelder ist und welchen Nutzen es bringt
- möchte ich die Preise sehen und einen kostenlosen Test starten können
- möchte ich mehr über das Unternehmen und die Gründer erfahren
- möchte ich mich einfach einloggen können, wenn ich bereits Kunde bin

### Als Mieter
- möchte ich einen einfachen Zugang zum Mieter-Portal haben, um mich zu registrieren oder einzuloggen

## Acceptance Criteria

### Funktionalität
- [ ] Seite ist unter `/` erreichbar (root route)
- [ ] Responsive Design: funktioniert perfekt auf Desktop, Tablet und Mobile
- [ ] SEO-optimiert: Meta-Tags, strukturierte Daten für Google
- [ ] Schnell ladend: < 2 Sekunden Ladezeit
- [ ] Eingeloggte Nutzer werden automatisch zum entsprechenden Dashboard weitergeleitet (HV → `/dashboard`, Mieter → `/mein-bereich`)

### Inhalt & Layout
- [ ] Hero-Section: Klare Value Proposition, CTA "Kostenlos testen"
- [ ] Features-Section: 3-4 Hauptvorteile mit Icons/Bildern
- [ ] Pricing-Section: Aktuelle Preise (aus PRD), CTA "Jetzt starten"
- [ ] Über uns-Section: Kurze Firmenbeschreibung, Gründer-Info
- [ ] Footer: Links zu Impressum, Datenschutz, Kontakt

### Navigation & CTAs
- [ ] Header: Logo, "Login für HV", "Mieter-Portal", "Kostenlos testen"
- [ ] Separate Login-Links: "Login für Hausverwalter" → `/login`, "Mieter-Portal" → `/mein-bereich` (mit Registrierungsoption)
- [ ] Alle CTAs führen zu Supabase Auth oder Registrierungsflow

### Design
- [ ] Modernes, professionelles Design passend zu shadcn/ui
- [ ] Brand Colors: Blau/Weiß, clean und vertrauensvoll
- [ ] Bilder/Icons: Stock-Photos oder einfache Icons für Features

## Edge Cases & Error Handling

### Authentifizierte Nutzer
- Wenn User bereits eingeloggt ist (Supabase Session vorhanden), redirect zu `/dashboard` (HV) oder `/mein-bereich` (Mieter)

### Mobile Experience
- Alle Texte und CTAs sind touch-friendly
- Bilder skalieren korrekt

### Browser Support
- Funktioniert in Chrome, Firefox, Safari, Edge (letzte 2 Versionen)

### Performance
- Lazy Loading für Bilder
- Minimierte CSS/JS Bundles

## Dependencies
- Requires: PROJ-1 (Multi-Tenancy) - für korrekte Redirects
- Requires: PROJ-2 (HV Auth) - Login-Flow muss funktionieren

## Out of Scope
- Kein eigenes CMS für Content-Management (statisch in Code)
- Keine Blog-Funktion oder News-Section
- Keine Integration mit externen Tools (z.B. Calendly für Demos)

## Testing Notes
- Teste auf verschiedenen Geräten/Browsern
- Teste Auth-Redirects mit verschiedenen User-Typen
- Performance-Test mit Lighthouse

## QA Report (09.03.2026)
- **Pass:** Seite unter `/` erreichbar, responsive Layout, Auth-Redirects korrekt.
- **Blocker:** Header benötigt `"use client"`; Footer-Links führten zu 404s (nun vorhanden); canonical URL korrigiert.
- **SEO:** JSON-LD eingefügt; OG Meta erweitert; canonical auf `zerodamage.de` eingestellt.
- **Bugs behoben:** Team-Bild entfernt, Generator-Fallback für Gründerkarte.

> Nach Bereinigung der kritischen Fehler ist das Feature bereit für die nächste QA/Runde und kann anschließend deployt werden.


## Tech Design (Solution Architect)

### Architekturübersicht
Die Landing‑Page wird unter der Root‑Route `/` bereitgestellt. Unauthentifizierte Besucher sehen die Marketing-Inhalte, angemeldete Nutzer werden serverseitig zum passenden Dashboard weitergeleitet (HV → `/dashboard`, Mieter → `/mein-bereich`). Die Seite nutzt Static‑Rendering (ISR) für Performance und eine Supabase‑Auth‑Prüfung in einem Server Component.

### Komponentenstruktur
```
src/app/page.tsx (Landing Page)
├── Header
│   ├── Logo
│   ├── Navigation (Login HV, Mieter-Portal, Kostenlos testen)
│   └── Mobile Menu
├── HeroSection
├── FeaturesSection
│   └── FeatureCard (Icon, Titel, Beschreibung)
├── PricingSection
│   └── PricingCard (Tier, Preis, Features, CTA)
├── AboutSection
│   └── FounderCard (Foto, Name, Bio)
└── Footer
    ├── Impressum/Datenschutz/Kontakt
    └── ggf. Social Links
```
Komponenten werden unter `src/components/landing-page/` abgelegt.

### Datenmodell
Keine dynamischen Daten; Inhalte stammen aus statischen Dateien in `src/data/landing-page/` (features.ts, pricing.ts, team.ts, content.ts). Sollte Preis- oder Inhaltsdaten später dynamisch werden, kann ISR mit Revalidation (z. B. 1 h) genutzt werden.

### Technische Entscheidungen
- **Serverseitiger Auth‑Check:** Supabase `createServerClient()` in `page.tsx`. Vor dem Rendern Redirects auslösen, Fallback clientseitig.
- **Performance:** Next.js ISR, optimierte `next/image`, Lazy‑Loading, CSS/JS‑Minimierung.
- **SEO & Meta:** `layout.tsx` mit Titel, Beschreibung, OpenGraph, JSON‑LD Organisation/Product.
- **Responsive Mobile‑First:** Tailwind‑Klassen mit Breakpoints `md`, `lg`.
- **Styling:** shadcn/ui + Tailwind; Icons via `lucide-react`.

### Abhängigkeiten
Keine neuen Pakete. Bestehende Stack: Next 16, React 19, Supabase, Tailwind, shadcn/ui, lucide-react.

### Dateistruktur
```
src/app/layout.tsx
src/app/page.tsx
src/components/landing-page/{Header.tsx,Footer.tsx,HeroSection.tsx,...}
src/data/landing-page/{features.ts,pricing.ts,team.ts,content.ts}
``` 

### Redirect-Logik & Edge Cases
Server-Komponente prüft Supabase-Session. Fehlschlag → Seite normal rendern. Authentifizierte User leiten um. Fallback-Clientredirect bei Ausfall.

### Erfolgskriterien
- Page lädt für Besucher, Redirects < 500 ms
- Responsive auf 320/768/1024px
- Lighthouse ≥ 90
- Keine Konsolenfehler

Design ist nun ausführlich dokumentiert. Nachdem du das Review gibst, können wir mit `/frontend` loslegen.
