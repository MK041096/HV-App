export interface PricingTier {
  id: string
  name: string
  price: string
  features: string[]
  highlighted?: boolean
}

export const pricing: PricingTier[] = [
  {
    id: "monthly",
    name: "Monatlich",
    price: "1,00 € / Einheit / Monat",
    features: [
      "Mieterportal & HV-Dashboard",
      "Registrierung per Aktivierungscode",
      "Schadensmeldung & Status-Tracking",
      "E-Mail-Benachrichtigungen",
      "30 Tage Geld-zurück-Garantie",
      "Onboarding & Einrichtung: 699 € einmalig"
    ],
    highlighted: false
  },
  {
    id: "yearly",
    name: "Jährlich",
    price: "0,85 € / Einheit / Monat",
    features: [
      "Alle Funktionen des Monatspakets",
      "15% Rabatt gegenüber monatlicher Zahlung",
      "30 Tage Geld-zurück-Garantie",
      "Onboarding & Einrichtung: 699 € einmalig"
    ],
    highlighted: true
  }
]
