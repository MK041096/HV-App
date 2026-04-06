'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'

type Step = 'idle' | 'enrolling' | 'verifying' | 'active' | 'disabling'

export default function TwoFactorSection() {
  const [step, setStep] = useState<Step>('idle')
  const [isLoading, setIsLoading] = useState(true)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isWorking, setIsWorking] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    setIsLoading(true)
    try {
      const { data } = await supabase.auth.mfa.listFactors()
      const totp = data?.totp?.find(f => f.status === 'verified')
      if (totp) {
        setFactorId(totp.id)
        setStep('active')
      } else {
        setStep('idle')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStartEnroll() {
    setIsWorking(true)
    setError('')
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'SMARTCARL Authenticator',
      })
      if (enrollError || !data) {
        setError('2FA konnte nicht gestartet werden. Bitte versuchen Sie es erneut.')
        return
      }
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)

      // Create challenge immediately so we're ready to verify
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: data.id })
      if (challengeError || !challengeData) {
        setError('Fehler beim Starten der Verifizierung.')
        return
      }
      setChallengeId(challengeData.id)
      setStep('enrolling')
    } finally {
      setIsWorking(false)
    }
  }

  async function handleVerify() {
    if (!factorId || !challengeId) return
    setIsWorking(true)
    setError('')
    try {
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: code.replace(/\s/g, ''),
      })
      if (verifyError) {
        setError('Code ungültig. Bitte überprüfen Sie die Zeit und versuchen Sie es erneut.')
        return
      }
      setStep('active')
      setSuccess('Zwei-Faktor-Authentifizierung erfolgreich aktiviert.')
      setQrCode(null)
      setSecret(null)
      setCode('')
      setTimeout(() => setSuccess(''), 4000)
    } finally {
      setIsWorking(false)
    }
  }

  async function handleDisable() {
    if (!factorId) return
    setIsWorking(true)
    setError('')
    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId })
      if (unenrollError) {
        setError('2FA konnte nicht deaktiviert werden.')
        return
      }
      setFactorId(null)
      setStep('idle')
      setSuccess('Zwei-Faktor-Authentifizierung deaktiviert.')
      setTimeout(() => setSuccess(''), 4000)
    } finally {
      setIsWorking(false)
    }
  }

  function handleCancel() {
    // If we started enrollment but didn't finish, unenroll the pending factor
    if (factorId && step === 'enrolling') {
      supabase.auth.mfa.unenroll({ factorId }).catch(() => {})
    }
    setFactorId(null)
    setQrCode(null)
    setSecret(null)
    setChallengeId(null)
    setCode('')
    setError('')
    setStep('idle')
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Lade 2FA-Status...
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Zwei-Faktor-Authentifizierung (2FA)</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Schützen Sie Ihren Account zusätzlich mit einer Authenticator-App.
          Empfohlen, aber nicht verpflichtend.
        </p>
      </div>

      {/* Already active */}
      {step === 'active' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <ShieldCheck className="h-4 w-4" />
            2FA ist aktiv — Ihr Account ist zusätzlich geschützt.
          </div>
          {step === 'disabling' as Step ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-medium">2FA wirklich deaktivieren?</p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDisable} disabled={isWorking}>
                  {isWorking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ja, deaktivieren
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStep('active')}>
                  Abbrechen
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => setStep('disabling' as Step)}
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              2FA deaktivieren
            </Button>
          )}
        </div>
      )}

      {/* Idle — offer to enable */}
      {step === 'idle' && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              Authenticator-App verwenden
            </div>
            <p className="text-xs text-muted-foreground">
              Laden Sie Google Authenticator, Authy oder eine andere TOTP-App herunter
              und scannen Sie den QR-Code zum Einrichten.
            </p>
          </div>
          <Button onClick={handleStartEnroll} disabled={isWorking} size="sm">
            {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            2FA einrichten
          </Button>
        </div>
      )}

      {/* Enrolling — show QR */}
      {step === 'enrolling' && (
        <div className="space-y-4 max-w-sm">
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Schritt 1 — QR-Code scannen</p>
            <p className="text-xs text-muted-foreground">
              Öffnen Sie Ihre Authenticator-App und scannen Sie diesen QR-Code:
            </p>
            {qrCode && (
              <div className="flex justify-center">
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  width={180}
                  height={180}
                  className="rounded border p-1 bg-white"
                />
              </div>
            )}
            {secret && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Oder manuell eingeben (Secret):
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded block break-all select-all">
                  {secret}
                </code>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Schritt 2 — Code bestätigen</p>
            <p className="text-xs text-muted-foreground">
              Geben Sie den 6-stelligen Code aus Ihrer App ein:
            </p>
            <Input
              value={code}
              onChange={e => setCode(e.target.value.replace(/[^0-9 ]/g, ''))}
              placeholder="123 456"
              maxLength={7}
              className="text-center text-lg tracking-widest font-mono max-w-[160px]"
              onKeyDown={e => e.key === 'Enter' && code.replace(/\s/g, '').length === 6 && handleVerify()}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleVerify} disabled={isWorking || code.replace(/\s/g, '').length !== 6} size="sm">
              {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Bestätigen & aktivieren
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {error && step !== 'enrolling' && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      )}
    </section>
  )
}
