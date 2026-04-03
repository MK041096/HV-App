"""
SMARTCARL Volltest - zerodamage.de
Alle Rollen: HV-Admin, Mieter, Werkstatt, Platform-Admin
Fokus: Excel-Upload, Schadensmeldungen, CARL-Analyse

Verwendung: py -3.12 test_smartcarl_volltest.py
"""

import asyncio, os, sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
load_dotenv(dotenv_path=".env.local")

from browser_use import Agent
from browser_use.llm import ChatAnthropic

BASE_URL = "https://zerodamage.de"
HV_EMAIL    = "hv-admin@test-smartcarl.at"
HV_PASS     = "HvAdmin@2026"
EXCEL_PATH  = r"C:\Users\tradi\Hausverwaltungs App\HV-App\docs\testdaten-mieter.xlsx"

MIETER = [
    {"email": "mieter1@test-smartcarl.at", "pass": "Mieter@2026", "name": "Mathias Kracher",  "einheit": "Schönbrunner Straße 42/Top 1"},
    {"email": "mieter2@test-smartcarl.at", "pass": "Mieter@2026", "name": "Thomas Hofmann",   "einheit": "Schönbrunner Straße 42/Top 2"},
    {"email": "mieter3@test-smartcarl.at", "pass": "Mieter@2026", "name": "Maria Schneider",  "einheit": "Mariahilfer Straße 88/Top 3"},
    {"email": "mieter4@test-smartcarl.at", "pass": "Mieter@2026", "name": "Anna Schneider",   "einheit": "Mariahilfer Straße 88/Top 5"},
]

SCHAEDEN = [
    {"titel": "Wasserrohrbruch Badezimmer",      "kat": "Wasserschaden",   "dring": "hoch",   "text": "Rohr unter der Badewanne geplatzt, Wasser tritt aus, feuchte Stellen an der Wand. Bereits seit heute Morgen.", "t1": "Montag 08-12 Uhr",    "t2": "Dienstag 13-17 Uhr"},
    {"titel": "Heizung funktioniert nicht",      "kat": "Heizung",         "dring": "hoch",   "text": "Zentralheizung heizt gar nicht mehr. Temperatur in Wohnung 14 Grad, draußen 2 Grad. Kleinkind im Haushalt.", "t1": "Heute noch",          "t2": "Morgen früh 07-09"},
    {"titel": "Schimmel im Schlafzimmer",        "kat": "Schimmel",        "dring": "mittel", "text": "Schwarzer Schimmel an der Außenwand, ca. 40x40cm, seit 3 Wochen. Hustenreiz beim Schlafen.",               "t1": "Mittwoch 09-13 Uhr",  "t2": "Donnerstag 14-18"},
    {"titel": "Defekte Steckdose Küche",         "kat": "Elektrik",        "dring": "hoch",   "text": "Steckdose gibt Funken beim Einstecken, riecht verbrannt. Abgeklebt. Keine Küchengeräte nutzbar.",            "t1": "Freitag 08-12 Uhr",   "t2": "Samstag 09-11 Uhr"},
    {"titel": "Balkongeländer wackelt stark",    "kat": "Sicherheitsrisiko","dring": "hoch",  "text": "Balkongeländer ist stark locker, wackelt bei Belastung gefährlich. Balkon wird nicht mehr benutzt.",         "t1": "Sofort wenn möglich", "t2": "Morgen früh"},
]

def llm():
    # Haiku für Browser-Use (20x günstiger als Sonnet, ausreichend für Navigation)
    return ChatAnthropic(model="claude-haiku-4-5-20251001", api_key=os.getenv("ANTHROPIC_API_KEY"))

def log(title):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")

async def agent_run(task, label):
    print(f"\n>>> {label}")
    result = await Agent(task=task, llm=llm()).run()
    print(f"<<< {label} DONE")
    return str(result)

# ── PHASE 1: HV-Admin Excel-Upload ─────────────────────────────
async def phase_hv_setup():
    log("PHASE 1: HV-Admin Login + Excel-Upload Einheiten")
    return await agent_run(f"""
Gehe auf {BASE_URL}/login und melde dich an:
  E-Mail: {HV_EMAIL}
  Passwort: {HV_PASS}

Nach dem Login:
1. Beschreibe kurz das Dashboard (Menüpunkte, Übersicht)
2. Gehe zu "Einheiten" (Wohnungen/Units)
3. Suche nach einem Button "Excel importieren", "Hochladen", "Import" oder ähnlich
4. Lade diese Excel-Datei hoch: {EXCEL_PATH}
5. Beschreibe was nach dem Upload passiert - werden Einheiten angezeigt?
6. Falls der Upload funktioniert: Wie viele Einheiten wurden importiert?
7. Falls es einen Fehler gibt oder kein Import-Button: Beschreibe genau was du siehst
8. Gehe danach zu "Werkstätten" - welche sind eingetragen?
9. Gehe zu "Versicherungen" - was ist dort?
10. Gehe zu "Abonnement/Billing" - beschreibe den Status

Berichte detailliert bei jedem Schritt.
""", "HV-Admin Setup + Excel-Upload")

# ── PHASE 2: Schadensmeldungen als Mieter ──────────────────────
async def phase_schadensmeldungen():
    log("PHASE 2: Schadensmeldungen (5 verschiedene Szenarien)")
    results = []
    for i, s in enumerate(SCHAEDEN):
        m = MIETER[i % len(MIETER)]
        result = await agent_run(f"""
Gehe auf {BASE_URL}/login und melde dich als Mieter an:
  E-Mail: {m['email']}
  Passwort: {m['pass']}

1. Was siehst du nach dem Login? (Mieter-Dashboard)
2. Navigiere zu "Schaden melden" oder "Neue Meldung"
3. Fülle das Formular aus:
   - Titel: "{s['titel']}"
   - Kategorie: "{s['kat']}" (wähle die passende aus der Liste)
   - Dringlichkeit: "{s['dring']}"
   - Beschreibung: "{s['text']}"
   - Wunschtermin 1: "{s['t1']}"
   - Wunschtermin 2: "{s['t2']}"
   - Foto: überspringe den Foto-Upload
4. Reiche die Meldung ein
5. Wurde die Meldung erfolgreich eingereicht? Welcher Status wird angezeigt?
6. Kannst du deine Meldungen in einer Übersicht sehen?
7. Melde dich ab

Szenario {i+1}/5: {s['titel']}
""", f"Schadensmeldung {i+1}: {s['titel']}")
        results.append({"szenario": s['titel'], "result": result})
    return results

# ── PHASE 3: HV Case-Management + CARL ─────────────────────────
async def phase_hv_cases():
    log("PHASE 3: HV Case-Management & CARL-Analyse")
    return await agent_run(f"""
Gehe auf {BASE_URL}/login als HV-Admin:
  E-Mail: {HV_EMAIL}
  Passwort: {HV_PASS}

1. Gehe zum Case-Management / Schadensmeldungen Dashboard
2. Wie viele Fälle siehst du? Beschreibe die Übersicht (Filter, Sortierung, Status-Badges)
3. Öffne den Fall "Wasserrohrbruch Badezimmer"
4. Beschreibe die CARL-Analyse ausführlich:
   - Was empfiehlt CARL genau?
   - Welches Gewerk/Werkstatt wird vorgeschlagen?
   - Ist die Dringlichkeitseinstufung nachvollziehbar?
   - Versteht ein HV-Mitarbeiter ohne technisches Wissen die Analyse?
   - Wie viele Sekunden brauchst du um die Analyse zu verstehen? (schätz es)
5. Leite den Fall an die empfohlene Werkstatt weiter (Button "Weiterleiten")
6. Beschreibe den Weiterleiten-Dialog: Wunschtermine sichtbar? E-Mail-Vorschau?
7. Führe die Weiterleitung durch — war es wirklich nur 1 Klick?
8. Welcher Status hat der Fall jetzt?
9. Öffne den Fall "Heizung funktioniert nicht" und wiederhole Schritte 4-8
10. Öffne den Fall "Defekte Steckdose Küche" — wie bewertet CARL diesen Notfall?
11. Gesamtfeedback: War CARL korrekt? War es wirklich maximal 3 Klicks pro Fall?
""", "HV Case-Management + CARL")

# ── PHASE 4: Werkstatt Termin-Flow ─────────────────────────────
async def phase_werkstatt():
    log("PHASE 4: Werkstatt Termin-Flow")
    return await agent_run(f"""
Teste den Werkstatt-Flow auf {BASE_URL}:

1. Melde dich als HV-Admin an: {HV_EMAIL} / {HV_PASS}
2. Gehe zu den Cases - finde Fälle mit Status "Weitergeleitet" oder "In Bearbeitung"
3. Öffne einen weitergeleiteten Fall und suche nach einem Termin-Link oder Token-URL
   (Format: {BASE_URL}/termin/... oder ähnlich)
4. Falls du eine Termin-URL findest: Öffne sie in einem neuen Tab
5. Was sieht die Werkstatt auf dieser Seite?
   - Werden beide Wunschtermine des Mieters angezeigt?
   - Gibt es 3 Buttons (Termin 1 bestätigen / Termin 2 bestätigen / Mieter direkt kontaktieren)?
   - Sind Adresse, Schadensbeschreibung und Mieter-Kontaktdaten sichtbar?
6. Bestätige Wunschtermin 1
7. Was passiert nach der Bestätigung? Kommt eine Erfolgsmeldung?
8. Wechsle zu Mieter-Account (mieter1@test-smartcarl.at / Mieter@2026)
   Hat sich der Status der Schadensmeldung geändert?
9. Feedback: Hatte die Werkstatt alle Infos? War die Terminbestätigung einfach?
""", "Werkstatt Termin-Flow")

# ── PHASE 5: Mieter Status-Check ───────────────────────────────
async def phase_mieter_check():
    log("PHASE 5: Mieter Status-Tracking & Feedback")
    return await agent_run(f"""
Melde dich als Mieter an: mieter1@test-smartcarl.at / Mieter@2026

1. Gehe zum Mieter-Dashboard
2. Zeige alle deine Schadensmeldungen und deren Status
3. Klicke auf die Meldung "Wasserrohrbruch Badezimmer"
   - Welche Details siehst du?
   - Ist der vereinbarte Termin sichtbar?
   - Gibt es Kommentare oder Updates von der HV?
4. Gehe zu einer anderen Meldung - ist der Status aktuell?
5. Bewerte als Mieter (1-5 Sterne):
   - Einfachheit der Schadensmeldung: ?/5
   - Statusübersichtlichkeit: ?/5
   - Würde ein älterer Mieter ohne Smartphone-Kenntnisse damit zurechtkommen? Ja/Nein
   - Was fehlt oder ist verwirrend?
6. Melde dich ab

Dann melde dich als HV-Admin an: {HV_EMAIL} / {HV_PASS}
7. Gehe zu "Dokumente" oder "Mietverträge"
8. Versuche ein Dokument hochzuladen (eine beliebige PDF oder Datei)
9. Funktioniert der Upload? Was passiert?
10. Gehe zur Abonnement-Seite - ist die Preisberechnung korrekt und verständlich?
""", "Mieter Status + Dokumente")

# ── PHASE 6: Platform-Admin ────────────────────────────────────
async def phase_admin():
    log("PHASE 6: Platform-Admin Überblick")
    return await agent_run(f"""
Melde dich als HV-Admin an: {HV_EMAIL} / {HV_PASS}

Suche nach einem Admin-Bereich:
1. Probiere {BASE_URL}/admin
2. Schau ob es in der Navigation einen "Admin" Link gibt
3. Falls kein Admin-Zugang: Beschreibe was du beim Versuch siehst

Falls Admin-Zugang vorhanden:
4. Wie viele Organisationen sind registriert?
5. Welche Statistiken siehst du (Schadensmeldungen gesamt, aktive Mieter, etc.)?
6. Gibt es eine Möglichkeit neue HV-Organisationen zu bestätigen/anlegen?
7. Sind alle Daten die ein Betreiber braucht vorhanden?

Dann: Gesamtfeedback zu allen getesteten Bereichen:
- Was hat gut funktioniert?
- Was hat nicht funktioniert oder gefehlt?
- Welche Bugs wurden gefunden?
- Gesamtnote für die App: ?/10
- Die wichtigsten 3 Dinge die noch verbessert werden sollten
""", "Platform-Admin + Gesamtfeedback")

# ── HAUPTPROGRAMM ───────────────────────────────────────────────
async def main():
    print("="*60)
    print("  SMARTCARL VOLLTEST - zerodamage.de")
    print("  HV-Admin | Mieter | Werkstatt | Admin")
    print("="*60)

    ergebnisse = {}
    try:
        ergebnisse["hv_setup"]      = await phase_hv_setup()
        ergebnisse["schaeden"]      = await phase_schadensmeldungen()
        ergebnisse["hv_cases"]      = await phase_hv_cases()
        ergebnisse["werkstatt"]     = await phase_werkstatt()
        ergebnisse["mieter_check"]  = await phase_mieter_check()
        ergebnisse["admin"]         = await phase_admin()
    except Exception as e:
        print(f"\nFEHLER: {e}")

    # Ergebnis speichern
    with open("test_ergebnis.txt", "w", encoding="utf-8") as f:
        f.write("SMARTCARL VOLLTEST ERGEBNISSE\n" + "="*60 + "\n\n")
        for phase, result in ergebnisse.items():
            f.write(f"\n{'='*40}\n{phase.upper()}\n{'='*40}\n")
            if isinstance(result, list):
                for r in result:
                    f.write(f"\n--- {r.get('szenario','')} ---\n{r.get('result','')}\n")
            else:
                f.write(str(result) + "\n")

    print("\n" + "="*60)
    print("  TEST ABGESCHLOSSEN")
    print("  Ergebnisse: test_ergebnis.txt")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
