import { hero } from "@/data/landing-page/content"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h1 className="text-4xl font-extrabold leading-tight">
          {hero.headline}
        </h1>
        <p className="mt-4 text-lg text-gray-600">{hero.subheading}</p>
        <div className="mt-8">
          <Button asChild>
            <a href="/hv-registrierung">{hero.cta}</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
