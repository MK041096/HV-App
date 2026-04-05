'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CheckCircle2, KeyRound, User, Shield } from 'lucide-react'

export default function AdminEinstellungenPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPw, setIsChangingPw] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')
      setIsLoading(false)
    }
    load()
  }, [])

  async function handleChangePassword() {
    setPwError('')
    setPwSuccess(false)
    if (newPassword !== confirmPassword) {
      setPwError('Passwörter stimmen nicht überein.')
      return
    }
    setIsChangingPw(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPwError(json.error || 'Fehler beim Ändern des Passworts')
      } else {
        setPwSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPwSuccess(false), 3000)
      }
    } finally {
      setIsChangingPw(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground text-sm mt-1">Admin-Account verwalten</p>
      </div>

      <Tabs defaultValue="profil">
        <TabsList className="mb-6">
          <TabsTrigger value="profil" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="sicherheit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sicherheit
          </TabsTrigger>
        </TabsList>

        {/* ── PROFIL ── */}
        <TabsContent value="profil" className="space-y-4">
          <h2 className="text-base font-semibold">Account-Informationen</h2>
          <div className="space-y-1.5 max-w-sm">
            <Label>E-Mail-Adresse</Label>
            <Input value={email} disabled className="text-muted-foreground" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <Label>Rolle</Label>
            <Input value="Platform Administrator" disabled className="text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            E-Mail-Änderungen direkt über Supabase Dashboard vornehmen.
          </p>
        </TabsContent>

        {/* ── SICHERHEIT ── */}
        <TabsContent value="sicherheit" className="space-y-6">
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Passwort ändern</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Mindestens 8 Zeichen, ein Großbuchstabe und eine Zahl.
              </p>
            </div>
            <div className="space-y-3 max-w-sm">
              <div className="space-y-1.5">
                <Label htmlFor="new_password">Neues Passwort</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Neues Passwort"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">Passwort bestätigen</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                  autoComplete="new-password"
                />
              </div>
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            {pwSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Passwort erfolgreich geändert.
              </div>
            )}
            <Button onClick={handleChangePassword} disabled={isChangingPw || !newPassword}>
              {isChangingPw ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Passwort ändern
            </Button>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
