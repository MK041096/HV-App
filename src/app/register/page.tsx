"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import {
  Loader2,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Home,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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

// ─── Step 1: Activation Code ───────────────────────────────────────────────────

const codeSchema = z.object({
  code: z
    .string()
    .min(1, "Bitte geben Sie Ihren Aktivierungscode ein")
    .transform((val) => val.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .pipe(
      z
        .string()
        .min(8, "Der Code muss mindestens 8 Zeichen lang sein")
        .max(16, "Der Code darf maximal 16 Zeichen lang sein")
    ),
})

type CodeFormValues = z.infer<typeof codeSchema>

// ─── Step 2: Registration ──────────────────────────────────────────────────────

const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(1, "Vorname ist erforderlich")
      .max(100, "Vorname darf maximal 100 Zeichen lang sein"),
    last_name: z
      .string()
      .min(1, "Nachname ist erforderlich")
      .max(100, "Nachname darf maximal 100 Zeichen lang sein"),
    email: z
      .string()
      .min(1, "E-Mail-Adresse ist erforderlich")
      .email("Bitte geben Sie eine gültige E-Mail-Adresse ein")
      .max(255, "E-Mail darf maximal 255 Zeichen lang sein"),
    password: z
      .string()
      .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
      .max(128, "Passwort darf maximal 128 Zeichen lang sein"),
    password_confirm: z.string().min(1, "Bitte bestätigen Sie Ihr Passwort"),
    privacy_accepted: z.boolean(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["password_confirm"],
  })
  .refine((data) => data.privacy_accepted === true, {
    message: "Bitte akzeptieren Sie die Datenschutzerklärung",
    path: ["privacy_accepted"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

// ─── Component ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1=code, 2=form, 3=success
  const [validatedCode, setValidatedCode] = useState("")
  const [codeInfo, setCodeInfo] = useState<{
    organization_name: string | null
    unit_name: string | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  // Step 1 form
  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  })

  // Step 2 form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      password_confirm: "",
      privacy_accepted: false,
    },
  })

  // ─── Step 1: Validate Code ────────────────────────────────────────────────────

  async function onValidateCode(values: CodeFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/activation-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: values.code }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || "Code konnte nicht überprüft werden.")
        return
      }

      setValidatedCode(values.code)
      setCodeInfo(json.data)
      setStep(2)
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 2: Register ─────────────────────────────────────────────────────────

  async function onRegister(values: RegisterFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/register-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: validatedCode,
          email: values.email,
          password: values.password,
          first_name: values.first_name,
          last_name: values.last_name,
          privacy_accepted: true,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || "Registrierung fehlgeschlagen.")
        return
      }

      // Auto-login after successful registration
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })

      if (loginError || !data.session) {
        // Registration succeeded but auto-login failed -- show success and let user login manually
        setStep(3)
        return
      }

      // Redirect to tenant portal
      window.location.href = "/mein-bereich"
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 3: Success (fallback if auto-login fails) ───────────────────────────

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <BrandingHeader />

          <Card>
            <CardHeader className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              </div>
              <CardTitle className="text-xl">
                Registrierung erfolgreich!
              </CardTitle>
              <CardDescription>
                Ihr Konto wurde erstellt. Sie können sich jetzt anmelden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">Zur Anmeldung</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Step 1: Code Input ───────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <BrandingHeader />

          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">
                  Aktivierungscode eingeben
                </CardTitle>
              </div>
              <CardDescription>
                Geben Sie den Aktivierungscode ein, den Sie von Ihrer
                Hausverwaltung erhalten haben.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...codeForm}>
                <form
                  onSubmit={codeForm.handleSubmit(onValidateCode)}
                  className="space-y-4"
                >
                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aktivierungscode</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="z.B. ABCD1234"
                            autoComplete="off"
                            disabled={isLoading}
                            className="text-center text-lg tracking-widest font-mono uppercase"
                            maxLength={16}
                            {...field}
                            onChange={(e) => {
                              // Auto-uppercase and filter invalid chars
                              const val = e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, "")
                              field.onChange(val)
                            }}
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
                        Wird überprüft...
                      </>
                    ) : (
                      "Code überprüfen"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground text-center">
                Sie haben keinen Code?{" "}
                <br className="sm:hidden" />
                Kontaktieren Sie Ihre Hausverwaltung.
              </p>
            </CardFooter>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Bereits registriert?{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary transition-colors"
            >
              Zur Anmeldung
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ─── Step 2: Registration Form ────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <BrandingHeader />

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  setStep(1)
                  setError(null)
                }}
                aria-label="Zurück zum Aktivierungscode"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">Konto erstellen</CardTitle>
            </div>

            {/* Code info banner */}
            {codeInfo && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                {codeInfo.organization_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">
                      {codeInfo.organization_name}
                    </span>
                  </div>
                )}
                {codeInfo.unit_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {codeInfo.unit_name}
                    </span>
                  </div>
                )}
              </div>
            )}

            <CardDescription>
              Geben Sie Ihre Daten ein, um Ihr Mieter-Konto zu erstellen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegister)}
                className="space-y-4"
              >
                {/* Name fields side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={registerForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vorname</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Max"
                            autoComplete="given-name"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nachname</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mustermann"
                            autoComplete="family-name"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail-Adresse</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="max.mustermann@example.at"
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
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passwort</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mindestens 8 Zeichen"
                            autoComplete="new-password"
                            disabled={isLoading}
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            aria-label={
                              showPassword
                                ? "Passwort verbergen"
                                : "Passwort anzeigen"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password_confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passwort bestätigen</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPasswordConfirm ? "text" : "password"}
                            placeholder="Passwort wiederholen"
                            autoComplete="new-password"
                            disabled={isLoading}
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() =>
                              setShowPasswordConfirm(!showPasswordConfirm)
                            }
                            tabIndex={-1}
                            aria-label={
                              showPasswordConfirm
                                ? "Passwort verbergen"
                                : "Passwort anzeigen"
                            }
                          >
                            {showPasswordConfirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Privacy checkbox */}
                <FormField
                  control={registerForm.control}
                  name="privacy_accepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Ich akzeptiere die{" "}
                          <Link
                            href="/datenschutz"
                            target="_blank"
                            className="underline underline-offset-4 hover:text-primary transition-colors"
                          >
                            Datenschutzerklärung
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
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
                      Registrierung...
                    </>
                  ) : (
                    "Konto erstellen"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Bereits registriert?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-primary transition-colors"
              >
                Zur Anmeldung
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

// ─── Shared Branding Header ─────────────────────────────────────────────────────

function BrandingHeader() {
  return (
    <div className="flex flex-col items-center space-y-2 text-center">
      <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary text-primary-foreground">
        <Building2 className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">SchadensMelder</h1>
      <p className="text-sm text-muted-foreground">Mieter-Registrierung</p>
    </div>
  )
}
