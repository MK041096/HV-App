import Link from 'next/link'
import { CheckCircle2, Mail, ArrowRight, Building2 } from 'lucide-react'

export default function BestaetigunsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SMARTCARL</span>
          </Link>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm p-8 text-center">
          <div className="flex items-center justify-center mb-5">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Zahlung erfolgreich!</h1>
          <p className="text-muted-foreground mb-8">
            Ihr SMARTCARL-Konto wird gerade eingerichtet. Das dauert nur wenige Sekunden.
          </p>

          {/* Steps */}
          <div className="space-y-3 text-left mb-8">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
              <div>
                <p className="text-sm font-semibold text-blue-900">E-Mail prüfen</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Sie erhalten in wenigen Minuten eine E-Mail mit einem Link, um Ihr Passwort festzulegen.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="h-7 w-7 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
              <div>
                <p className="text-sm font-semibold">Passwort festlegen</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Klicken Sie auf den Link in der E-Mail und wählen Sie ein Passwort.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="h-7 w-7 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
              <div>
                <p className="text-sm font-semibold">Loslegen</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sie landen direkt im Dashboard — Einheiten importieren, Mieter einladen, fertig.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-6">
            <Mail className="h-4 w-4 text-blue-500" />
            <span>Keine E-Mail? Prüfen Sie Ihren Spam-Ordner.</span>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Bereits ein Passwort gesetzt? Zum Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Bei Fragen:{' '}
          <a href="mailto:Kracherdigital@gmail.com" className="text-primary hover:underline">
            Kracherdigital@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}
