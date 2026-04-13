"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Building2, Eye, EyeOff, CheckCircle2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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

const updateSchema = z
  .object({
    password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
    confirmPassword: z.string().min(1, "Bitte Passwort bestätigen"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  })

type UpdateFormValues = z.infer<typeof updateSchema>

export default function UpdatePasswordPage() {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  useEffect(() => {
    // Zuerst prüfen ob Supabase den Code bereits automatisch verarbeitet hat
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true)
        return
      }

      // Noch keine Session — Code manuell austauschen
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")

      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) {
            setError("Link ungültig oder abgelaufen. Bitte fordere einen neuen an.")
          } else {
            setIsReady(true)
            window.history.replaceState({}, "", "/auth/update-password")
          }
        })
        return
      }

      // Implicit flow: auf PASSWORD_RECOVERY Event warten
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setIsReady(true)
        }
      })

      return () => subscription.unsubscribe()
    })
  }, [])

  async function onSubmit(values: UpdateFormValues) {
    setIsLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      })
      if (updateError) {
        setError("Passwort konnte nicht gesetzt werden. Bitte fordere einen neuen Link an.")
        return
      }
      setIsSuccess(true)
      setTimeout(() => { window.location.href = "/login" }, 2000)
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SMARTCARL</h1>
          <p className="text-sm text-muted-foreground">Ihr persönlicher Zugang</p>
        </div>

        <Card>
          {isSuccess ? (
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-2">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-xl text-center">Passwort gesetzt!</CardTitle>
              <CardDescription className="text-center">
                Ihr Passwort wurde erfolgreich geändert. Sie werden gleich zum Login weitergeleitet.
              </CardDescription>
            </CardHeader>
          ) : !isReady ? (
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Neues Passwort setzen</CardTitle>
              <CardDescription>
                {error ?? "Link wird überprüft…"}
              </CardDescription>
              {!error && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-2" />}
              {error && (
                <a href="/auth/reset-password" className="text-sm text-primary underline mt-2 block text-center">
                  Neuen Link anfordern
                </a>
              )}
            </CardHeader>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Neues Passwort setzen</CardTitle>
                <CardDescription>Geben Sie Ihr neues Passwort ein.</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neues Passwort</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPw ? "text" : "password"}
                                placeholder="Mindestens 8 Zeichen"
                                autoComplete="new-password"
                                disabled={isLoading}
                                {...field}
                              />
                              <button type="button" onClick={() => setShowPw(!showPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passwort bestätigen</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Passwort wiederholen"
                                autoComplete="new-password"
                                disabled={isLoading}
                                {...field}
                              />
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird gespeichert...</>
                      ) : "Passwort speichern"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          )}
          <CardFooter className="flex justify-center">
            <a href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
              Zurück zur Anmeldung
            </a>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
