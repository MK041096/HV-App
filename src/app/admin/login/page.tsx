"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Shield, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  email: z.string().min(1, "E-Mail ist erforderlich").email("Ungültige E-Mail"),
  password: z.string().min(1, "Passwort ist erforderlich"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (authError || !data.session) {
        setError("E-Mail oder Passwort ist falsch.")
        return
      }

      // Verify platform_admin role before granting access
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .eq("is_deleted", false)
        .single()

      if (profile?.role !== "platform_admin") {
        await supabase.auth.signOut()
        setError("Kein Zugang. Dieser Bereich ist nur für Platform-Administratoren.")
        return
      }

      window.location.href = "/admin"
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700">
            <Shield className="h-6 w-6 text-zinc-300" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">SMARTCARL</h1>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Admin Portal</p>
        </div>

        {/* Login Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base text-white">Zugang für Administratoren</CardTitle>
            <CardDescription className="text-zinc-500 text-xs">
              Nur für autorisierte Betreiber-Accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-950 border-red-800">
                <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 text-xs">E-Mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@smartcarl.com"
                          autoComplete="email"
                          disabled={isLoading}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 text-xs">Passwort</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-600 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-zinc-100 text-zinc-900 hover:bg-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Anmeldung...
                    </>
                  ) : (
                    "Anmelden"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-700">
          smartcarl.com · Betreiberportal
        </p>
      </div>
    </div>
  )
}
