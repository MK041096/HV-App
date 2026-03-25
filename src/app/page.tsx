import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import HeroSection from "@/components/landing-page/HeroSection"
import ProblemSection from "@/components/landing-page/ProblemSection"
import SolutionSection from "@/components/landing-page/SolutionSection"
import FeaturesSection from "@/components/landing-page/FeaturesSection"
import ProcessSection from "@/components/landing-page/ProcessSection"
import BenefitsSection from "@/components/landing-page/BenefitsSection"
import TrustSection from "@/components/landing-page/TrustSection"
import PricingSection from "@/components/landing-page/PricingSection"
import FinalCTASection from "@/components/landing-page/FinalCTASection"
import Footer from "@/components/landing-page/Footer"

export default async function RootPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .eq("is_deleted", false)
      .single()

    if (profile && profile.role) {
      if (["hv_admin", "hv_mitarbeiter", "platform_admin"].includes(profile.role)) {
        redirect("/dashboard")
      } else {
        redirect("/mein-bereich")
      }
    }
  }

  return (
    <>
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <ProcessSection />
        <BenefitsSection />
        <TrustSection />
        <PricingSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  )
}
