"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Building2, ArrowLeft, CheckCircle2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"

const resetSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail-Adresse ist erforderlich")
    .email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
})

type ResetFormValues = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  })

  function startCooldown() {
    setCooldown(true)
    setCooldownSeconds(60)
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCooldown(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function onSubmit(values: ResetFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(values.email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
        })

      if (resetError) {
        setError(
          "Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut."
        )
        return
      }

      // Always show success (don't reveal whether email exists)
      setIsSuccess(true)
      startCooldown()
    } catch {
      setError(
        "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown) return
    const email = form.getValues("email")
    if (!email) return

    setIsLoading(true)
    setError(null)

    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })
      startCooldown()
    } catch {
      setError("Fehler beim erneuten Senden. Bitte versuchen Sie es später.")
    } finally {
      setIsLoading(false)
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
          <p className="text-sm text-muted-foreground">
            Hausverwaltungs-Portal
          </p>
        </div>

        <Card>
          {!isSuccess ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">
                  Passwort zurücksetzen
                </CardTitle>
                <CardDescription>
                  Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link
                  zum Zurücksetzen Ihres Passworts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail-Adresse</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="name@hausverwaltung.at"
                              autoComplete="email"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wird gesendet...
                        </>
                      ) : (
                        "Link senden"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-xl text-center">
                  E-Mail gesendet
                </CardTitle>
                <CardDescription className="text-center">
                  Falls ein Konto mit dieser E-Mail-Adresse existiert, erhalten
                  Sie in Kürze eine E-Mail mit einem Link zum Zurücksetzen
                  Ihres Passworts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={isLoading || cooldown}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : cooldown ? (
                    `E-Mail erneut senden (${cooldownSeconds}s)`
                  ) : (
                    "E-Mail erneut senden"
                  )}
                </Button>
              </CardContent>
            </>
          )}
          <CardFooter className="flex justify-center">
            <a
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Zurück zur Anmeldung
            </a>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
