import { features } from "@/data/landing-page/features"
import FeatureCard from "./FeatureCard"

export default function FeaturesSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center">Vorteile auf einen Blick</h2>
        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.id} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
      </div>
    </section>
  )
}
