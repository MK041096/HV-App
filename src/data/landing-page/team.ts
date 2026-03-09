export interface Founder {
  id: string
  name: string
  title: string
  bio: string
  imageUrl?: string
}

export const team: Founder[] = [
  {
    id: "mathias",
    name: "Mathias Kracher",
    title: "Gründer & Entwickler",
    bio: "Ich habe langjährige Erfahrung in der Hausverwaltungsbranche und entwickle praxisnahe Softwarelösungen.",
    // imageUrl intentionally left out until a photo is available
  }
]
