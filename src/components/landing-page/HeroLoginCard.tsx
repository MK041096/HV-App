'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import OnboardingModal from './OnboardingModal'

export default function HeroLoginCard() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPw, setShowPw]             = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [showModal, setShowModal]       = useState(false)

  const isEmailValid    = /\S+@\S+\.\S+/.test(email)
  const isPasswordValid = password.length >= 6

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEmailValid || !isPasswordValid) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.')
        return
      }
      window.location.href = json.data?.redirectTo || '/dashboard'
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Glass-Input CSS ── */}
      <style>{`
        .hlc-wrap {
          background: rgba(10,10,10,0.65);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          box-shadow: 0 32px 72px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05);
          width: 100%;
          max-width: 420px;
          padding: 36px 32px 32px;
        }
        .hlc-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 999px;
          padding: 0 16px;
          height: 50px;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .hlc-input-wrap:focus-within {
          background: rgba(255,255,255,0.07);
          border-color: rgba(181,131,74,0.6);
          box-shadow: 0 0 0 3px rgba(154,107,60,0.18);
        }
        .hlc-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #F4F3EF;
          font-size: 15px;
          font-family: var(--font-dm-sans, sans-serif);
        }
        .hlc-input::placeholder { color: rgba(160,157,153,0.6); }
        .hlc-input:-webkit-autofill,
        .hlc-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 50px rgba(10,10,10,0) inset !important;
          -webkit-text-fill-color: #F4F3EF !important;
        }
        .hlc-icon { color: rgba(160,157,153,0.7); flex-shrink: 0; }
        .hlc-eye {
          background: none; border: none; cursor: pointer; padding: 0;
          color: rgba(160,157,153,0.7); display: flex; align-items: center;
          transition: color 0.2s;
        }
        .hlc-eye:hover { color: #F4F3EF; }
        .hlc-btn {
          width: 100%;
          height: 50px;
          background: #9A6B3C;
          border: none;
          border-radius: 999px;
          color: #F5F0E8;
          font-family: var(--font-dm-sans, sans-serif);
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(154,107,60,0.35);
        }
        .hlc-btn:hover:not(:disabled) {
          background: #B5834A;
          box-shadow: 0 6px 28px rgba(154,107,60,0.45);
        }
        .hlc-btn:active:not(:disabled) { transform: scale(0.98); }
        .hlc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .hlc-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 24px 0;
        }
        .hlc-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fca5a5;
          font-size: 13px;
          font-family: var(--font-dm-sans, sans-serif);
          line-height: 1.5;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
        style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
      >
        <div className="hlc-wrap">

          {/* Logo + Heading */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
              <div style={{ background: 'rgba(154,107,60,0.2)', border: '1px solid rgba(181,131,74,0.35)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1v-10.5z" stroke="#B5834A" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
                  <path d="M9 22v-7h6v7" stroke="#B5834A" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 15, color: 'rgba(244,243,239,0.7)', fontWeight: 400, letterSpacing: '0.01em' }}>[SOFTWARE]</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 28, fontWeight: 400, color: '#F4F3EF', margin: 0, lineHeight: 1.2 }}>
              Anmelden
            </h2>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: 'rgba(160,157,153,0.8)', margin: '6px 0 0' }}>
              Zugang zum Hausverwaltungs-Portal
            </p>
          </div>

          {/* Divider */}
          <div className="hlc-divider" />

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* E-Mail */}
            <div className="hlc-input-wrap">
              <Mail size={16} className="hlc-icon" />
              <input
                className="hlc-input"
                type="email"
                placeholder="E-Mail-Adresse"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Passwort */}
            <div className="hlc-input-wrap">
              <Lock size={16} className="hlc-icon" />
              <input
                className="hlc-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Passwort"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button type="button" className="hlc-eye" onClick={() => setShowPw(p => !p)} tabIndex={-1} aria-label="Passwort anzeigen">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="hlc-error"
                >
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              className="hlc-btn"
              disabled={loading || !isEmailValid || !isPasswordValid}
              style={{ marginTop: 4 }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Wird angemeldet…</>
                : <><span>Anmelden</span><ArrowRight size={16} /></>
              }
            </button>

          </form>

          {/* Footer */}
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: 'rgba(160,157,153,0.6)', margin: 0 }}>
              Noch kein Zugang?{' '}
              <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(181,131,74,0.9)', fontWeight: 500, fontSize: 13, fontFamily: 'var(--font-dm-sans, sans-serif)', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#B5834A')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(181,131,74,0.9)')}>
                Demo anfragen
              </button>
            </p>
          </div>

        </div>
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
    </>
  )
}
