"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
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

// ── Schema ──

const schema = z
  .object({
    org_name: z
      .string()
      .min(2, "Firmenname muss mindestens 2 Zeichen lang sein")
      .max(200, "Firmenname darf maximal 200 Zeichen lang sein"),
    country: z.enum(["AT", "DE", "CH"]),
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
    privacy_accepted: z.literal(true, {
      error: "Bitte akzeptieren Sie die Datenschutzerklärung",
    }),
    avv_accepted: z.literal(true, {
      error: "Bitte akzeptieren Sie den Auftragsverarbeitungsvertrag (AVV)",
    }),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["password_confirm"],
  })

type FormValues = z.infer<typeof schema>

// ── Page ──

export default function HvRegistrierungPage() {
  const [step, setStep] = useState<"form" | "success">("form")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      org_name: "",
      country: "AT",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      password_confirm: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const res = await fetch("/api/auth/register-hv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: values.org_name,
          country: values.country,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          password: values.password,
          privacy_accepted: true,
          avv_accepted: true,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setServerError(json.error || "Ein Fehler ist aufgetreten.")
        return
      }

      setStep("success")
    } catch {
      setServerError("Verbindungsfehler. Bitte versuchen Sie es erneut.")
    }
  }

  // ── Success Screen ──
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-10 pb-8 px-8">
            <div className="flex items-center justify-center mb-5">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-1">
              Konto erfolgreich erstellt!
            </h1>
            <p className="text-center text-muted-foreground mb-6">
              Bitte bestaetigen Sie Ihre E-Mail-Adresse, um loszulegen.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">E-Mail pruefen &amp; bestaetigen</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Wir haben Ihnen soeben eine E-Mail geschickt. Klicken Sie dort auf <strong>E-Mail bestaetigen</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                <div className="h-7 w-7 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-sm font-semibold">Einloggen</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nach der Bestaetigung kommen Sie automatisch zum Login. Melden Sie sich mit Ihren Zugangsdaten an.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                <div className="h-7 w-7 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
                <div>
                  <p className="text-sm font-semibold">Schritt-fuer-Schritt einrichten</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Im Dashboard finden Sie eine Einrichtungsanleitung mit 6 Schritten — von den ersten Einheiten bis zur ersten Schadensmeldung.
                  </p>
                </div>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link href="/login">
                Zum Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Keine E-Mail erhalten? Pruefen Sie Ihren Spam-Ordner oder{" "}
              <button
                onClick={() => setStep("form")}
                className="text-primary underline underline-offset-2"
              >
                registrieren Sie sich erneut
              </button>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Registration Form ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SchadensMelder</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Jetzt kostenlos testen — kein Risiko, kein Vertrag
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Hausverwaltung registrieren</CardTitle>
            <CardDescription>
              Erstellen Sie Ihr kostenloses Konto und starten Sie in wenigen Minuten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                {serverError && (
                  <Alert variant="destructive">
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}

                {/* Company Name */}
                <FormField
                  control={form.control}
                  name="org_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firmenname</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Mustermann Hausverwaltung GmbH"
                          autoComplete="organization"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country */}
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Land wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AT">🇦🇹 Österreich (MRG/ABGB)</SelectItem>
                          <SelectItem value="DE">🇩🇪 Deutschland (BGB)</SelectItem>
                          <SelectItem value="CH">🇨🇭 Schweiz (OR)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vorname</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Max"
                            autoComplete="given-name"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nachname</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mustermann"
                            autoComplete="family-name"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail-Adresse</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="max@mustermann.at"
                          autoComplete="email"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
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
                            placeholder="Mindestens 8 Zeichen"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
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

                {/* Password Confirm */}
                <FormField
                  control={form.control}
                  name="password_confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passwort bestätigen</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Passwort wiederholen"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showConfirm ? "Passwort verbergen" : "Passwort anzeigen"}
                          >
                            {showConfirm ? (
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

                {/* Privacy */}
                <FormField
                  control={form.control}
                  name="privacy_accepted"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                            Ich akzeptiere die{" "}
                            <Link
                              href="/datenschutz"
                              className="text-primary underline underline-offset-2 hover:no-underline"
                              target="_blank"
                            >
                              Datenschutzerklärung
                            </Link>{" "}
                            und stimme der Verarbeitung meiner Daten zu.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                {/* AVV */}
                <FormField
                  control={form.control}
                  name="avv_accepted"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                            Ich akzeptiere den{" "}
                            <Link
                              href="/avv"
                              className="text-primary underline underline-offset-2 hover:no-underline"
                              target="_blank"
                            >
                              Auftragsverarbeitungsvertrag (AVV)
                            </Link>{" "}
                            gemäß Art. 28 DSGVO.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird registriert...
                    </>
                  ) : (
                    <>
                      Kostenlos registrieren
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            DSGVO-konform
          </span>
          <span>·</span>
          <span>Server in der EU</span>
          <span>·</span>
          <span>30-Tage Geld-zurück</span>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Bereits registriert?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Zum Login
          </Link>
        </p>
      </div>
    </div>
  )
}
