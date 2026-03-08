"use client"

import { useState } from "react"
import { Building2, AlertTriangle, LogOut, Loader2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NoOrganizationPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch {
      window.location.href = "/login"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SchadensMelder</h1>
        </div>

        <Card>
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-7 w-7" />
              </div>
            </div>
            <CardTitle className="text-xl">
              Keine Organisation zugeordnet
            </CardTitle>
            <CardDescription className="text-base">
              Ihr Konto ist derzeit keiner Hausverwaltung zugeordnet. Bitte
              kontaktieren Sie Ihre Hausverwaltung, um Zugang zu erhalten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">
                Mögliche Gründe:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ihre Hausverwaltung hat die Zuordnung noch nicht abgeschlossen</li>
                <li>Ihr Mietverhältnis wurde beendet</li>
                <li>Es liegt ein technisches Problem vor</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird abgemeldet...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Bei Fragen wenden Sie sich bitte an Ihre Hausverwaltung.
        </p>
      </div>
    </div>
  )
}
