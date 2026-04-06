'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import TwoFactorSection from '@/components/settings/TwoFactorSection'
import EmailChangeSection from '@/components/settings/EmailChangeSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2, Save, CheckCircle2, KeyRound, User, Shield, Building2,
} from 'lucide-react'

interface Profile {
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: string
}

interface OrgData {
  id: string
  name: string
  phone: string | null
}

export default function HVEinstellungenPage() {
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Profile save
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPw, setIsChangingPw] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  // Organisation
  const [org, setOrg] = useState<OrgData | null>(null)
  const [orgName, setOrgName] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [isSavingOrg, setIsSavingOrg] = useState(false)
  const [orgSuccess, setOrgSuccess] = useState(false)
  const [orgError, setOrgError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')

      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, role')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFirstName(profileData.first_name || '')
        setLastName(profileData.last_name || '')
        setProfilePhone(profileData.phone || '')
        setIsAdmin(profileData.role === 'hv_admin')
      }

      // Load org
      const orgRes = await fetch('/api/hv/organization')
      if (orgRes.ok) {
        const { data } = await orgRes.json()
        if (data) {
          setOrg(data)
          setOrgName(data.name || '')
          setOrgPhone(data.phone || '')
        }
      }

      setIsLoading(false)
    }
    load()
  }, [])

  async function handleSaveProfile() {
    setIsSavingProfile(true)
    setProfileSuccess(false)
    setProfileError('')
    try {
      const res = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, phone: profilePhone || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        setProfileError(err.error || 'Fehler beim Speichern')
      } else {
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 3000)
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

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

  async function handleSaveOrg() {
    setIsSavingOrg(true)
    setOrgSuccess(false)
    setOrgError('')
    try {
      const res = await fetch('/api/hv/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName, phone: orgPhone || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        setOrgError(err.error || 'Fehler beim Speichern')
      } else {
        setOrgSuccess(true)
        setTimeout(() => setOrgSuccess(false), 3000)
      }
    } finally {
      setIsSavingOrg(false)
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
        <p className="text-muted-foreground text-sm mt-1">Profil, Sicherheit und Organisation verwalten</p>
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
          {isAdmin && (
            <TabsTrigger value="organisation" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organisation
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── PROFIL ── */}
        <TabsContent value="profil" className="space-y-4">
          <h2 className="text-base font-semibold">Meine Daten</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Vorname</Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Vorname"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Nachname</Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Nachname"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile_phone">Telefon (optional)</Label>
            <Input
              id="profile_phone"
              value={profilePhone}
              onChange={e => setProfilePhone(e.target.value)}
              placeholder="+43 664 123 456"
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-Mail-Adresse</Label>
            <Input value={email} disabled className="text-muted-foreground" />
          </div>
          {profileError && <p className="text-sm text-destructive">{profileError}</p>}
          {profileSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Profil gespeichert.
            </div>
          )}
          <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
            {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Speichern
          </Button>

          <Separator className="mt-6" />

          <EmailChangeSection currentEmail={email} />

          <Separator />

          <div className="pt-2">
            <h2 className="text-base font-semibold">Rolle</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {profile?.role === 'hv_admin' ? 'Administrator — Sie können alle Einstellungen bearbeiten.' : 'Sachbearbeiter — Organisation kann nur vom Administrator geändert werden.'}
            </p>
          </div>
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

          <div className="border-t pt-6">
            <TwoFactorSection />
          </div>
        </TabsContent>

        {/* ── ORGANISATION ── (hv_admin only) */}
        {isAdmin && (
          <TabsContent value="organisation" className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Organisation</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Allgemeine Informationen Ihrer Hausverwaltung.
              </p>
            </div>
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="org_name">Name der Hausverwaltung</Label>
              <Input
                id="org_name"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="Muster Hausverwaltung GmbH"
              />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="org_phone">Telefon (optional)</Label>
              <Input
                id="org_phone"
                value={orgPhone}
                onChange={e => setOrgPhone(e.target.value)}
                placeholder="+43 1 234 5678"
              />
            </div>
            {orgError && <p className="text-sm text-destructive">{orgError}</p>}
            {orgSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Organisation gespeichert.
              </div>
            )}
            <Button onClick={handleSaveOrg} disabled={isSavingOrg || !orgName.trim()}>
              {isSavingOrg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Speichern
            </Button>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
