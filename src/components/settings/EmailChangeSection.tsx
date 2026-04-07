'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, Mail } from 'lucide-react'

export default function EmailChangeSection({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleChange() {
    if (!newEmail || newEmail === currentEmail) return
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/mieter/email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler beim Ändern der E-Mail-Adresse')
      setSuccess(true)
      setNewEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Ändern der E-Mail-Adresse')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">E-Mail-Adresse ändern</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Nach der Änderung erhalten Sie eine Bestätigungsmail an die neue Adresse.
          Die Änderung wird erst aktiv wenn Sie den Link bestätigen.
        </p>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <Label>Aktuelle E-Mail</Label>
        <Input value={currentEmail} disabled className="text-muted-foreground" />
      </div>

      {success ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Bestätigungsmail wurde gesendet — bitte prüfen Sie Ihr Postfach und bestätigen Sie die neue Adresse.
        </div>
      ) : (
        <>
          <div className="space-y-1.5 max-w-sm">
            <Label htmlFor="new_email">Neue E-Mail-Adresse</Label>
            <Input
              id="new_email"
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="neue@email.at"
              autoComplete="email"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            size="sm"
            onClick={handleChange}
            disabled={isLoading || !newEmail || newEmail === currentEmail}
          >
            {isLoading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Mail className="mr-2 h-4 w-4" />
            }
            Bestätigungsmail senden
          </Button>
        </>
      )}
    </section>
  )
}
