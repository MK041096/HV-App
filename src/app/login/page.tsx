"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Building2, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react"

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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail-Adresse ist erforderlich")
    .email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  password: z
    .string()
    .min(1, "Passwort ist erforderlich")
    .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  // 2FA state
  const [step, setStep] = useState<'password' | 'totp'>('password')
  const [totpCode, setTotpCode] = useState('')
  const [redirectTo, setRedirectTo] = useState('/dashboard')
  const totpRef = useRef<HTMLInputElement>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    const confirmedParam = params.get('confirmed')
    if (emailParam) form.setValue('email', emailParam)
    if (confirmedParam === 'true') setConfirmed(true)
  }, [form])

  // Focus TOTP input when step switches
  useEffect(() => {
    if (step === 'totp') {
      setTimeout(() => totpRef.current?.focus(), 100)
    }
  }, [step])

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail-Adresse und Ihr Passwort.")
        return
      }

      // 2FA required — show TOTP input
      if (json.mfa_required) {
        setRedirectTo(json.data?.redirectTo || '/dashboard')
        setStep('totp')
        return
      }

      // Normal login — redirect
      const role = json.data?.user?.role
      const isHV = role && ['hv_admin', 'hv_mitarbeiter', 'platform_admin'].includes(role)
      const isMieter = role === 'mieter'

      const params = new URLSearchParams(window.location.search)
      const rawRedirect = params.get("redirectTo") || ""
      const isSafeRedirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")

      let dest = json.data?.redirectTo || "/dashboard"
      if (isSafeRedirect) {
        const isHVDestination = rawRedirect.startsWith("/dashboard") || rawRedirect.startsWith("/admin")
        const isMieterDestination = rawRedirect.startsWith("/mein-bereich")
        if (isHV && !isMieterDestination) dest = rawRedirect
        else if (isMieter && !isHVDestination) dest = rawRedirect
      }

      window.location.href = dest
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  async function onTotpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (totpCode.length !== 6) { setError('Bitte geben Sie den 6-stelligen Code ein.'); return }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Falscher Code.')
        setTotpCode('')
        totpRef.current?.focus()
        return
      }

      window.location.href = redirectTo
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── 2FA Code Input ──
  if (step === 'totp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">2-Faktor-Authentifizierung</h1>
            <p className="text-sm text-muted-foreground">
              Öffnen Sie Ihre Authenticator-App und geben Sie den 6-stelligen Code ein.
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Code eingeben</CardTitle>
              <CardDescription>
                Der Code ist 30 Sekunden gültig — bei Ablauf erscheint automatisch ein neuer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={onTotpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Authenticator-Code</label>
                  <Input
                    ref={totpRef}
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest font-mono"
                    disabled={isLoading}
                    autoComplete="one-time-code"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || totpCode.length !== 6}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird geprüft...</>
                  ) : (
                    'Bestätigen & einloggen'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <button
                type="button"
                onClick={() => { setStep('password'); setError(null); setTotpCode('') }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Zurück zur Anmeldung
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // ── Password Login ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SMARTCARL</h1>
          <p className="text-sm text-muted-foreground">Hausverwaltungs-Portal</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Anmelden</CardTitle>
            <CardDescription>Melden Sie sich mit Ihren Zugangsdaten an</CardDescription>
          </CardHeader>
          <CardContent>
            {confirmed && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 font-medium ml-2">
                  E-Mail-Adresse erfolgreich bestätigt! Bitte melden Sie sich jetzt an.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passwort</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Passwort eingeben"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="pr-10"
                            autoFocus={confirmed}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Anmeldung...</>
                  ) : (
                    "Anmelden"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <a
              href="/auth/reset-password"
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Passwort vergessen?
            </a>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Nur für autorisierte Hausverwaltungs-Mitarbeiter.
          <br />
          Bei Problemen kontaktieren Sie Ihren Administrator.
        </p>
      </div>
    </div>
  )
}
