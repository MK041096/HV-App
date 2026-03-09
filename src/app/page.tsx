import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import Header from "@/components/landing-page/Header"
import HeroSection from "@/components/landing-page/HeroSection"
import FeaturesSection from "@/components/landing-page/FeaturesSection"
import PricingSection from "@/components/landing-page/PricingSection"
import AboutSection from "@/components/landing-page/AboutSection"
import CTASection from "@/components/landing-page/CTASection"
import Footer from "@/components/landing-page/Footer"

export default async function RootPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  // Only redirect users who are actually authenticated and have a profile.
  // Anonymous visitors should see the landing page.
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
    // if we have a session but no valid profile, fall through and show landing page
    // (user will need to log in again via header link)
  }

  return (
    <>
      <Header />
      <main className="flex flex-col">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <AboutSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
