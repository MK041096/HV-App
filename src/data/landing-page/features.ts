export interface Feature {
  id: string
  icon: string
  title: string
  description: string
}

export const features: Feature[] = [
  {
    id: "fast",
    icon: "Zap",
    title: "Schnell & effizient",
    description: "Schadensmeldungen sind in wenigen Klicks erfasst und dokumentiert."
  },
  {
    id: "transparent",
    icon: "Eye",
    title: "Volle Transparenz",
    description: "Mieter und HV verfolgen den Status in Echtzeit."
  },
  {
    id: "automated",
    icon: "Clock",
    title: "Automatisierte Workflows",
    description: "E‑Mails, Handwerkerbenachrichtigungen und Versicherungsdaten laufen automatisch."
  }
]
