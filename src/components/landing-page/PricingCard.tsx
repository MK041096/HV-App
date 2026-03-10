import { Button } from "@/components/ui/button"

interface PricingCardProps {
  name: string
  price: string
  features: string[]
  highlighted?: boolean
}

export default function PricingCard({ name, price, features, highlighted }: PricingCardProps) {
  return (
    <div className={`border rounded-lg p-6 flex flex-col ${highlighted ? "border-primary" : "border-gray-200"}`}>
      <h3 className="text-2xl font-semibold">{name}</h3>
      <p className="mt-2 text-xl text-primary font-bold">{price}</p>
      <ul className="mt-4 space-y-2 flex-1">
        {features.map((feat, idx) => (
          <li key={idx} className="text-gray-600">• {feat}</li>
        ))}
      </ul>
      <div className="mt-6">
        <Button asChild className="w-full">
          <a href="/registrieren">Jetzt starten</a>
        </Button>
      </div>
    </div>
  )
}
