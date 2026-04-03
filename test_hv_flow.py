"""
SMARTCARL Browser-Test: HV-Admin Flow
Testet: Login → Dashboard → Schadensmeldungen ansehen → Case bearbeiten
"""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

from browser_use import Agent
from browser_use.llm import ChatAnthropic

BASE_URL = "https://zerodamage.de"
HV_EMAIL = "admin@test-hv.at"
HV_PASSWORD = "Test1234!"

TASK = f"""
Du bist ein Tester für die SMARTCARL Hausverwaltungs-App.
Führe folgende Schritte durch und berichte bei jedem was du siehst:

1. Öffne {BASE_URL}
2. Gehe zu {BASE_URL}/login
3. Gib die E-Mail "{HV_EMAIL}" und das Passwort "{HV_PASSWORD}" ein und melde dich an
4. Überprüfe ob du ins Dashboard weitergeleitet wirst
5. Schau dir die Navigation links an — welche Menüpunkte gibt es?
6. Klicke auf "Schadensmeldungen" oder "Cases"
7. Wie viele Schadensmeldungen siehst du? Beschreibe was du siehst
8. Klicke auf eine Schadensmeldung und beschreibe den Detailbereich
9. Gehe zur Seite "Mieter"
10. Gehe zur Seite "Abonnement" (Billing) — beschreibe was du dort siehst
11. Melde dich ab (Logout)

Berichte nach jedem Schritt kurz was du gesehen hast.
Wenn etwas nicht funktioniert, beschreibe genau den Fehler.
"""

async def main():
    llm = ChatAnthropic(
        model="claude-sonnet-4-6",
        api_key=os.getenv("ANTHROPIC_API_KEY"),
    )

    agent = Agent(
        task=TASK,
        llm=llm,
    )

    print("=== SMARTCARL Browser-Test startet ===")
    print(f"Teste: {BASE_URL}")
    print(f"Login: {HV_EMAIL}")
    print("=" * 40)

    result = await agent.run()

    print("\n=== TEST ERGEBNIS ===")
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
