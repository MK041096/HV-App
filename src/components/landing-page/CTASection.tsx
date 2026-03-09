import { ctaSection } from "@/data/landing-page/content"
import { Button } from "@/components/ui/button"

export default function CTASection() {
  return (
    <section className="bg-primary text-white py-20">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h2 className="text-3xl font-bold">{ctaSection.headline}</h2>
        <p className="mt-4">{ctaSection.description}</p>
        <div className="mt-8">
          <Button asChild>
            <a href="/hv-registrierung">{ctaSection.button}</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
