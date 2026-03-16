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
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 px-8">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              Fast geschafft!
            </h1>
            <p className="text-muted-foreground mb-6">
              Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. Bitte klicken
              Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm text-left space-y-2">
              <p className="font-medium">Nach der Bestätigung können Sie:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  Wohneinheiten anlegen
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  Mieter per Aktivierungscode einladen
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  Schadensmeldungen verwalten
                </li>
              </ul>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">
                Zum Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
