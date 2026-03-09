export interface PricingTier {
  id: string
  name: string
  price: string
  features: string[]
  highlighted?: boolean
}

export const pricing: PricingTier[] = [
  {
    id: "basic",
    name: "Startpaket",
    price: "1,00 € / Einheit / Monat",
    features: [
      "Mieterportal & HV-Dashboard",
      "Registrierung per Aktivierungscode",
      "Schadensmeldung & Status-Tracking"
    ],
    highlighted: true
  },
  {
    id: "pro",
    name: "Pro (1 Jahr gebucht)",
    price: "0,85 € / Einheit / Monat",
    features: [
      "Alle Basisfunktionen",
      "Rabattierter Jahrespreis"
    ]
  }
]
