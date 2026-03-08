"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function RootPage() {
  useEffect(() => {
    async function redirect() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = "/login"
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .eq("is_deleted", false)
        .single()

      if (!profile) {
        window.location.href = "/login"
        return
      }

      if (["hv_admin", "hv_mitarbeiter", "platform_admin"].includes(profile.role)) {
        window.location.href = "/dashboard"
      } else {
        window.location.href = "/mein-bereich"
      }
    }

    redirect()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
