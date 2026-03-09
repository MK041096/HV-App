import { pricing } from "@/data/landing-page/pricing"
import PricingCard from "./PricingCard"

export default function PricingSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center">Preise</h2>
        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2">
          {pricing.map((tier) => (
            <PricingCard
              key={tier.id}
              name={tier.name}
              price={tier.price}
              features={tier.features}
              highlighted={tier.highlighted}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
