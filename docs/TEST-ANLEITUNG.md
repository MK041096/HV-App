# Test-Anleitung: SchadensMelder
Umgebung: https://zerodamage.de | Aktualisiert: 2026-03-17

---

## Deine 4 Test-E-Mail-Adressen

| Rolle | E-Mail | Postfach | Passwort |
|-------|--------|----------|----------|
| Platform-Admin (Betreiber / Mathias) | kracherdigital@gmail.com | Gmail | AdminTest123! |
| HV-Admin (Kracher ImmoGmbH, Test-Kunde) | kracherdigital@gmx.at | GMX | selbst waehlen |
| Mieter (alle 20 Testmieter) | mathiaskracher@gmx.at | GMX | MieterTest123! |
| Werkstatt (alle 10 Testwerkstaetten) | tradingworld@gmx.at | GMX | kein Login noetig |

WICHTIG:
- Platform-Admin (kracherdigital@gmail.com) ist BEREITS fertig eingerichtet. Kein Registrieren noetig.
- HV-Admin (kracherdigital@gmx.at) muss einmalig ueber die HV-Registrierung registriert werden.
- Alle anderen Rollen werden manuell durchgespielt wie echte Nutzer es erleben wuerden.
- Du meldest im System NIEMANDEN automatisch an.

---

## Deine Test-Dateien (vor dem Start oeffnen!)

| Datei | Pfad | Wofuer |
|-------|------|--------|
| testdaten-mieter.csv | HV-App/docs/testdaten-mieter.csv | 20 Mieter mit Namen + Einheiten |
| testdaten-werkstaetten.csv | HV-App/docs/testdaten-werkstaetten.csv | 10 Werkstaetten mit Kontaktdaten + Gewerk |
| Versicherungspolice_KracherimmoGmbH_2025.pdf | HV-App/scripts/test-docs/ | Test-Versicherungspolice fuer KI-Analyse |
| Top 1.pdf bis Top 20.pdf | HV-App/scripts/test-docs/ | 20 Test-Mietvertraege (je eine pro Einheit) |

HINWEIS: Die PDFs in scripts/test-docs/ werden einmalig generiert mit:
   node scripts/generate-test-docs.mjs
(Nur noetig wenn der Ordner noch nicht existiert)

---

## Portale

    kracherdigital@gmail.com  ->  zerodamage.de/admin         (Platform-Admin: Betreiber-Ansicht)
    kracherdigital@gmx.at     ->  zerodamage.de/dashboard     (HV-Admin: Hausverwaltungs-Portal)
    mathiaskracher@gmx.at     ->  zerodamage.de/mein-bereich  (Mieter-Portal)
    tradingworld@gmx.at       ->  kein Login, nur E-Mails     (Werkstatt)

---

## Reihenfolge beim Testen

    BLOCK 0    ->  HV-Registrierung (einmalig)
    BLOCK 1.1  ->  Einheiten anlegen (aus testdaten-mieter.csv)
    BLOCK 1.2  ->  Werkstaetten anlegen (aus testdaten-werkstaetten.csv)
    BLOCK 1.3  ->  Aktivierungscode pruefen
    BLOCK 1.4  ->  Versicherungspolice hochladen (/dashboard/versicherungen)
    BLOCK 1.5  ->  Mietvertraege Bulk-Import (/dashboard/dokumente/bulk-import)
    BLOCK 2.1  ->  Mieter registrieren (Inkognito-Fenster!)
    BLOCK 2.2  ->  Schadensmeldung einreichen
    BLOCK 1.6  ->  Als HV den Fall mit KI bearbeiten (liest Mietvertrag + Police!)
    BLOCK 2.3  ->  Als Mieter Status pruefen
    BLOCK 3    ->  Werkstatt-E-Mail pruefen
    BLOCK 4    ->  Platform-Admin-Portal pruefen (/admin)
    BLOCK 5/6/7 -> Rechtliches + E-Mails + Mobile

---

## BLOCK 0: HV-Registrierung (einmalig, 1x)

Konto: kracherdigital@gmx.at

1. Seite oeffnen: https://zerodamage.de/hv-registrierung
2. Formular ausfullen:
   - Firmenname: Kracher ImmoGmbH
   - Vorname: Mathias | Nachname: Kracher
   - E-Mail: kracherdigital@gmx.at
   - Passwort: selbst waehlen und merken!
3. Beide Checkboxen ankreuzen (Datenschutz + AVV)
4. "Kostenlos registrieren" klicken
5. GMX oeffnen (kracherdigital@gmx.at) -> Bestaetigungslink klicken
6. Einloggen: https://zerodamage.de/login
7. Pruefe: HV-Dashboard mit Onboarding-Widget sichtbar?

---

## BLOCK 1: Als HV-Admin testen

Konto: kracherdigital@gmx.at | Portal: https://zerodamage.de/dashboard

### 1.1 Einheiten per Excel importieren

Wo: Dashboard -> Einheiten -> "Excel importieren" (rechts oben)

1. "Vorlage (CSV)" herunterladen -> anschauen wie das Format aussieht
2. Stattdessen: testdaten-mieter.csv nehmen (hat bereits das richtige Format!)
   Pfad: HV-App/docs/testdaten-mieter.csv
3. Datei in den Upload-Bereich ziehen oder per Klick auswaehlen
4. "Jetzt importieren" klicken
5. Ergebnis pruefen:
   - 20 Einheiten erstellt?
   - 20 Codes generiert?
   - 20 E-Mails gesendet? (alle an mathiaskracher@gmx.at)
6. GMX oeffnen (mathiaskracher@gmx.at) -> 20 Einladungsmails angekommen?
   Betreff: "Einladung zu SchadensMelder - Ihr Aktivierungscode"

### 1.2 Werkstaetten per Excel importieren

Wo: Dashboard -> Werkstaetten -> "Excel importieren" (rechts oben)

1. "Vorlage (CSV)" herunterladen -> Format anschauen
2. Stattdessen: testdaten-werkstaetten.csv verwenden (hat bereits das richtige Format!)
   Pfad: HV-App/docs/testdaten-werkstaetten.csv
3. Datei hochladen -> "Jetzt importieren"
4. Ergebnis pruefen:
   - 10 Werkstaetten erstellt?
   - 0 Fehler?
5. Zurueck zu Werkstaetten -> alle 10 in der Liste?

HINWEIS: Das Gewerk-Feld (z.B. wasserschaden, elektrik) wird automatisch verwendet
um bei einer Schadensmeldung die passende Werkstatt vorzuschlagen.

### 1.3 Aktivierungscode pruefen

Der Code wurde beim Excel-Import bereits automatisch erstellt und per E-Mail versendet.

Wo: Dashboard -> Aktivierungscodes

Pruefe:
- Wohnung Top 1 hat einen aktiven Code (Status: "Ausstehend")?
- Mieter-Name "Anna Berger" und E-Mail "mathiaskracher@gmx.at" stehen dabei?

HINWEIS: Einzelne Codes koennen hier auch manuell erstellt werden falls ein Mieter
die E-Mail nicht erhalten hat.

### 1.4 Versicherungspolice hochladen

Wo: Dashboard -> Versicherungen

Test-Datei: HV-App/scripts/test-docs/Versicherungspolice_KracherimmoGmbH_2025.pdf

1. "Police hochladen" klicken
2. Bezeichnung eingeben: Gebaeudeversicherung Wiener Staedtische 2025
3. Datei auswaehlen: Versicherungspolice_KracherimmoGmbH_2025.pdf
4. "Hochladen" klicken
5. Pruefe:
   - Police erscheint in der Liste mit gruener Badge?
   - Name, Groesse und Datum korrekt angezeigt?
   - "Download" Knopf oeffnet das PDF?
   - Blauer KI-Hinweis-Banner sichtbar?

WICHTIG: Diese Police wird spaeter in BLOCK 1.6 automatisch von der KI gelesen!

### 1.5 Mietvertraege Bulk-Import

Wo: Dashboard -> Dokumente -> "Bulk-Import" (oben rechts)

Test-Dateien: HV-App/scripts/test-docs/Top 1.pdf bis Top 20.pdf

1. "PDFs auswaehlen" klicken -> alle 20 "Top X.pdf" Dateien auf einmal auswaehlen
   (Windows: Strg+A um alle zu markieren)
2. Pruefe automatische Zuordnung:
   - "Top 1.pdf" -> Einheit "Top 1" erkannt?
   - "Top 10.pdf" -> Einheit "Top 10" erkannt?
   - Wie viele von 20 wurden automatisch zugeordnet? (Ziel: alle 20)
3. Falls eine Datei nicht erkannt wurde: manuell Einheit aus Dropdown auswaehlen
4. "20 Mietvertraege hochladen" klicken
5. Fortschrittsbalken beobachten...
6. Pruefe am Ende:
   - Gruene Bestaetigung: "20 Mietvertraege erfolgreich hochgeladen"?
   - 0 Fehler?
7. "Zu Dokumente" klicken
8. Pruefe in der Dokumentenliste:
   - 20 Mietvertraege sichtbar (Typ: Mietvertrag, blaue Badge)?
   - Filter nach Einheit "Top 1" zeigt genau 1 Mietvertrag?

WICHTIG: Diese Mietvertraege werden spaeter in BLOCK 1.6 automatisch von der KI gelesen!

### 1.6 Fall mit KI-Unterstuetzung bearbeiten (ERST NACH BLOCK 2.2!)

Wo: Dashboard -> Faelle -> Fall "Wasserschaden Kueche" oeffnen

--- KI-Analyse (startet automatisch) ---
Beim Oeffnen des Falls startet die KI-Analyse automatisch im Hintergrund.
Du siehst einen Ladebalken im "KI-Analyse"-Bereich auf der rechten Seite.
Nach wenigen Sekunden erscheint das Ergebnis.

Pruefe im KI-Ergebnis (4 Abschnitte werden angezeigt):
- 1. Zustaendigkeit: Vermieter oder Mieter klar benannt?
- 2. Rechtsgrundlage: Gesetz zitiert (z.B. MRG SS 3, ABGB SS 1096)?
- 3. Versicherungsrelevanz: Steht etwas von der Police drin?
     Pruefe: "Gemaess Ihrer hinterlegten Versicherungspolice..." oder aehnliches sichtbar?
- 4. Empfehlung: Konkreter naechster Schritt genannt?

Extra-Check - Dokument-Status rechts im KI-Bereich:
- "Mietvertrag gefunden" mit gruenem Haekchen sichtbar?
- "Versicherungspolice gefunden" mit gruenem Haekchen sichtbar?
- Beide sollten gruen sein wenn BLOCK 1.4 + 1.5 ausgefuehrt wurden!

--- Schnellaktionen (erscheinen direkt nach der KI-Analyse) ---

Fall A - Vermieter ist verantwortlich (gruen, wahrscheinlicher bei Wasserschaden):
   -> Vorgeschlagene Werkstatt bereits ausgewaehlt (Thomas Huber fuer Wasserschaden)
   -> Andere Werkstatt waehlen falls gewuenscht (Dropdown mit allen 10 Werkstaetten)
   -> "Weiterleiten & informieren" klicken
   -> Pruefe: Mieter (mathiaskracher@gmx.at) hat E-Mail "Schaden bestaetigt" erhalten?
   -> Pruefe: Werkstatt (tradingworld@gmx.at) hat Auftrags-E-Mail erhalten?
   -> Status springt auf "Warte auf Handwerker"

Fall B - Mieter ist verantwortlich (rot):
   -> Begruendungstext ist bereits aus der KI-Analyse vorbefuellt
   -> Text anpassen falls noetig
   -> "Absage senden" klicken
   -> Pruefe: Mieter (mathiaskracher@gmx.at) hat Absage-E-Mail erhalten?
   -> Status springt auf "Abgelehnt"

--- Manueller Status und Kommentar ---
Wo: Linke Spalte -> "Status & Kommentar"

1. Status -> "In Bearbeitung"
2. Kommentar: "Wir schauen uns das an, melden uns bald."
3. "Status aktualisieren" klicken
4. Pruefe: Hat mathiaskracher@gmx.at eine Status-E-Mail erhalten?

--- Rechnung hochladen ---
Tab "Dokumente" oeffnen
"Rechnung hochladen" -> beliebige PDF oder JPG auswaehlen
Dateiname + Datum sichtbar? | "Oeffnen" -> in neuem Tab? | Papierkorb -> geloescht?

--- Versicherungsschaden ---
Toggle "Als Versicherungsschaden markieren" aktivieren
Notiz: Polizze Nr. 12345-A | Speichern
"Versicherungsblatt oeffnen" -> alle Daten korrekt?
"Drucken / PDF" -> Druckdialog oeffnet sich?

--- Fall abschliessen ---
Status -> "Erledigt"
Kommentar: "Reparatur abgeschlossen. Rechnung liegt bei."
Pruefe: Hat mathiaskracher@gmx.at eine Abschluss-E-Mail erhalten?

### 1.7 Mieter-Uebersicht

Wo: Dashboard -> Mieter
Anna Berger in der Liste? | Einheit, Name, E-Mail korrekt?

---

## BLOCK 2: Als Mieter testen

Konto: mathiaskracher@gmx.at | Portal: https://zerodamage.de/mein-bereich

!! INKOGNITO-FENSTER OEFFNEN damit du gleichzeitig als HV eingeloggt bleibst !!

### 2.1 Mieter-Registrierung

1. GMX oeffnen (mathiaskracher@gmx.at) im Inkognito-Fenster
2. Einladungsmail suchen: Betreff "Einladung zu SchadensMelder - Ihr Aktivierungscode"
3. "Jetzt registrieren" Button in der Mail klicken
4. Aktivierungscode eingeben (steht gross in der E-Mail)
5. Formular ist vorausgefuellt (Anna Berger, mathiaskracher@gmx.at)
   -> Nur noch Passwort eingeben: MieterTest123!
   -> Passwort bestaetigen: MieterTest123!
   -> Datenschutz-Checkbox ankreuzen
6. "Konto erstellen" klicken
7. Pruefe: Weiterleitung zu zerodamage.de/mein-bereich?
8. Pruefe: Einheit "Wohnung Top 1" und Name "Anna Berger" sichtbar?

### 2.2 Schadensmeldung einreichen

Wo: Mieter-Dashboard -> "Neue Meldung"

Titel: Wasserschaden Kueche
Kategorie: Wasserschaden
Beschreibung: Wasserrohr leckt unter der Spuele. Wasser auf dem Boden.
Dringlichkeit: Dringend
Wunschtermin: beliebiges Datum in der Zukunft auswaehlen
Foto hochladen: beliebiges Bild von deinem Computer

Pruefe nach dem Einreichen:
- Meldung mit Status "Neu" sichtbar?
- Hat kracherdigital@gmx.at (HV) eine Benachrichtigung erhalten?

### 2.3 Status-Verfolgung (ERST NACH BLOCK 1.4!)

Im Mieter-Portal pruefen:
- Status stimmt mit dem ueberein was die HV gesetzt hat?
- Kommentar der HV sichtbar?
- GMX (mathiaskracher@gmx.at): E-Mail-Benachrichtigungen fuer jeden Statuswechsel erhalten?

---

## BLOCK 3: Als Werkstatt

Konto: tradingworld@gmx.at (kein Login noetig)

Nach dem HV-Klick auf "Weiterleiten & informieren" (Block 1.4 - Fall A):

1. GMX oeffnen (tradingworld@gmx.at)
2. E-Mail mit Betreff "Neuer Reparaturauftrag" suchen
3. Pruefe:
   - Fall-Nr. und Schadenstitel korrekt?
   - Adresse der Wohnung sichtbar?
   - Wunschtermin des Mieters angegeben?
   - Beschreibung des Schadens dabei?
   - Link "Termin bestaetigen" vorhanden?
4. "Termin bestaetigen" klicken -> Termin-Seite oeffnet sich?

---

## BLOCK 4: Als Platform-Admin

Konto: kracherdigital@gmail.com | Passwort: AdminTest123!
Portal: https://zerodamage.de/admin

HINWEIS: Dieser Account ist bereits fertig eingerichtet. Einfach einloggen!

1. https://zerodamage.de/login oeffnen
2. kracherdigital@gmail.com + AdminTest123! eingeben
3. -> Weiterleitung zu /admin?

4. Statistiken pruefen: Kunden, Nutzer, Faelle, Einheiten sichtbar?
5. "Kunden" in der Navigation klicken
6. "Kracher ImmoGmbH" in der Kundenliste?
7. AVV-Haekchen gruen?
8. "Details" klicken:
   - Einheiten: 20 sichtbar?
   - Mieter: 1 sichtbar?
   - Faelle: 1 sichtbar?
   - Benutzerliste mit Rollen?
   - Letzte Meldung in der Tabelle?

---

## BLOCK 5: Rechtliche Seiten

| Seite | URL |
|-------|-----|
| AVV | https://zerodamage.de/avv |
| Impressum | https://zerodamage.de/impressum |
| Datenschutz | https://zerodamage.de/datenschutz |
| Kontakt | https://zerodamage.de/kontakt |

AVV: Paragraphen 1-12, Name Mathias Kracher, Adresse Oberwart, UID ATU81585679
Impressum: Adresse Wildgansgasse 8/2, 7400 Oberwart, UID ATU81585679, GISA 37695736

---

## BLOCK 6: E-Mail-Checkliste

| Was ausgeloest hat | Postfach zum Pruefen |
|-------------------|---------------------|
| HV-Registrierung (Bestaetigung) | kracherdigital@gmx.at (GMX) |
| Mieter-Einladung (20x beim CSV-Import) | mathiaskracher@gmx.at (GMX) |
| Mieter-Registrierung (Bestaetigung) | mathiaskracher@gmx.at (GMX) |
| Neue Schadensmeldung (HV-Info) | kracherdigital@gmx.at (GMX) |
| Status -> In Bearbeitung | mathiaskracher@gmx.at (GMX) |
| Weiterleitung bestaetigt (Schaden anerkannt) | mathiaskracher@gmx.at (GMX) |
| Werkstatt-Auftrag | tradingworld@gmx.at (GMX) |
| Status -> Erledigt | mathiaskracher@gmx.at (GMX) |

---

## BLOCK 7: Mobile Ansicht

1. https://zerodamage.de am Smartphone oeffnen
2. Landing Page: Sieht gut aus?
3. Login-Formular: Benutzbar?
4. Als HV einloggen (kracherdigital@gmx.at): Hamburger-Menue sichtbar?
5. Menue antippen: Navigation als Schublade?
6. Als Admin einloggen (kracherdigital@gmail.com): /admin responsiv?

---

## Testergebnis-Tabelle

| Block | Rolle | Was | Ergebnis |
|-------|-------|-----|----------|
| 0 | HV-Admin | HV-Registrierung | [ ] OK / Fehler: |
| 1.1 | HV-Admin | Einheiten anlegen | [ ] OK / Fehler: |
| 1.2 | HV-Admin | Werkstaetten anlegen | [ ] OK / Fehler: |
| 1.3 | HV-Admin | Aktivierungscode pruefen | [ ] OK / Fehler: |
| 1.4 | HV-Admin | Versicherungspolice hochladen | [ ] OK / Fehler: |
| 1.5 | HV-Admin | Mietvertraege Bulk-Import (20x) | [ ] OK / Fehler: |
| 1.6 | HV-Admin | Fall mit KI bearbeiten + Weiterleiten | [ ] OK / Fehler: |
| 1.7 | HV-Admin | Mieter-Uebersicht | [ ] OK / Fehler: |
| 2.1 | Mieter | Registrierung per Aktivierungslink | [ ] OK / Fehler: |
| 2.2 | Mieter | Schadensmeldung einreichen | [ ] OK / Fehler: |
| 2.3 | Mieter | Status-Verfolgung + E-Mails | [ ] OK / Fehler: |
| 3 | Werkstatt | Auftrags-E-Mail + Termin bestaetigen | [ ] OK / Fehler: |
| 4 | Platform-Admin | Admin-Portal /admin | [ ] OK / Fehler: |
| 5 | -- | Rechtliche Seiten | [ ] OK / Fehler: |
| 6 | -- | E-Mail-Benachrichtigungen (alle 8) | [ ] OK / Fehler: |
| 7 | -- | Mobile Ansicht | [ ] OK / Fehler: |

---

## Nach dem Test: Naechste Schritte

1. PROJ-15: DSGVO-Datenexport fuer Mieter
2. PROJ-14: Stripe-Zahlungsabwicklung
3. Erster echter Kunde: 349 EUR Einrichtung + 0,50 EUR/Einheit/Monat (Gruenderpreis)

---

Aktualisiert: 2026-03-17 | SchadensMelder by Mathias Kracher
